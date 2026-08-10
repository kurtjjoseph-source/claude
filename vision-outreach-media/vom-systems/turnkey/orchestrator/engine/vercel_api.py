#!/usr/bin/env python3
"""
vercel_api — deploy without the CLI.

Forge's deploy stage shells out to `vercel`. That is fine on the operator's Mac and
impossible in a container: the CLI carries its own interactive login, and a hosted
service has a token instead. So this speaks Vercel's REST API directly with urllib —
no CLI, no npm, no node in the image.

It is used automatically whenever `VERCEL_TOKEN` is set; otherwise Forge keeps using the
CLI. That way the same code path serves a laptop and a server without a flag.

The API is asynchronous: creating a deployment returns immediately with a state of
QUEUED or BUILDING. `deploy()` therefore polls until READY, because "deployed" must mean
the thing is serving, not that the request was accepted.

Stdlib only.
"""

from __future__ import annotations

import base64
import json
import os
import time
import urllib.error
import urllib.request

API = "https://api.vercel.com"

# A static site has no build step; sending files inline avoids the separate upload API
# entirely. Vercel accepts this comfortably for the size a generated platform is, and a
# ceiling here is better than a mysterious 413 later.
MAX_INLINE_BYTES = 9 * 1024 * 1024
SKIP_DIRS = {".vercel", ".git", "node_modules", "__pycache__"}
SKIP_FILES = {".DS_Store", ".env", ".env.local"}


class VercelError(Exception):
    """The API refused something, with whatever it actually said."""


def _req(method: str, path: str, token: str, body=None, team: str = None, timeout=90):
    url = API + path
    if team:
        url += ("&" if "?" in path else "?") + "teamId=" + team
    data = json.dumps(body).encode("utf-8") if body is not None else None
    r = urllib.request.Request(url, method=method, data=data, headers={
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:600]
        try:
            detail = json.loads(detail).get("error", {}).get("message", detail)
        except ValueError:
            pass
        raise VercelError(f"HTTP {e.code} on {method} {path}: {detail}")
    except Exception as e:
        raise VercelError(f"could not reach the Vercel API: {e}")


def collect(directory: str) -> list:
    """Every file in the build, as the API's inline file format."""
    files, total = [], 0
    for root, dirs, names in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in names:
            if name in SKIP_FILES:
                continue
            full = os.path.join(root, name)
            rel = os.path.relpath(full, directory).replace(os.sep, "/")
            with open(full, "rb") as f:
                blob = f.read()
            total += len(blob)
            if total > MAX_INLINE_BYTES:
                raise VercelError(
                    f"this build is larger than {MAX_INLINE_BYTES // (1024*1024)} MB, which is "
                    "more than the inline deploy path carries. Trim the build or deploy it "
                    "with the CLI.")
            files.append({"file": rel,
                          "data": base64.b64encode(blob).decode("ascii"),
                          "encoding": "base64"})
    if not files:
        raise VercelError(f"nothing to deploy — {directory} is empty")
    return files


def deploy(directory: str, project: str, token: str, team: str = None,
           wait: int = 300, log=lambda m: None) -> dict:
    """Create a production deployment and wait until it is actually serving.

    Returns {url, alias, id}. The project is created on first use, so there is no
    separate 'link' step the way the CLI needs one."""
    files = collect(directory)
    log(f"uploading {len(files)} file(s) to project '{project}'")

    body = {
        "name": project,
        "files": files,
        "target": "production",
        # A generated platform is already built — no framework detection, no build command.
        "projectSettings": {"framework": None, "buildCommand": None,
                            "outputDirectory": None, "installCommand": None},
    }
    dep = _req("POST", "/v13/deployments?skipAutoDetectionConfirmation=1", token, body, team)
    dep_id = dep.get("id") or dep.get("uid")
    url = dep.get("url") or ""
    if url and not url.startswith("http"):
        url = "https://" + url

    # --- wait for READY ---------------------------------------------------
    deadline = time.time() + wait
    state = dep.get("readyState") or dep.get("status") or "QUEUED"
    while state not in ("READY", "ERROR", "CANCELED") and time.time() < deadline:
        time.sleep(3)
        got = _req("GET", f"/v13/deployments/{dep_id}", token, team=team)
        state = got.get("readyState") or got.get("status") or state
        if not url and got.get("url"):
            url = "https://" + got["url"]
    if state == "ERROR":
        raise VercelError("Vercel finished the deployment in state ERROR — the build failed")
    if state != "READY":
        raise VercelError(f"the deployment was still {state} after {wait}s; "
                          "it was not confirmed serving")

    alias = _stable_alias(dep_id, token, team) or ""
    log(f"deployment ready: {url}")
    return {"id": dep_id, "url": url, "alias": alias, "state": state}


def _stable_alias(dep_id: str, token: str, team: str = None) -> str:
    """The shortest alias the host reports — never one composed from the project name.

    Nothing is a fine answer; a guessed address that 404s is worse than no address."""
    try:
        got = _req("GET", f"/v13/deployments/{dep_id}", token, team=team, timeout=45)
    except VercelError:
        return ""
    found = []
    for a in (got.get("alias") or []):
        a = a if isinstance(a, str) else a.get("domain", "")
        if a:
            found.append(a if a.startswith("http") else "https://" + a)
    return min(found, key=len) if found else ""


def open_to_the_public(project: str, token: str, team: str = None, log=lambda m: None):
    """Turn off deployment protection for this project.

    A new project inherits the team's protection, which puts the site behind a Vercel
    login. A business website behind an SSO wall is not published, so publishing one
    means turning that off — for this project only, and said out loud because it is a
    change to an account setting."""
    try:
        _req("PATCH", f"/v9/projects/{project}", token,
             {"ssoProtection": None, "passwordProtection": None}, team)
        log("deployment protection disabled — reachable without a Vercel login")
        return True
    except VercelError as e:
        log(f"could not turn off deployment protection: {e}")
        return False


def remove_project(project: str, token: str, team: str = None) -> bool:
    """Delete a project and everything deployed under it. Used to clean up test runs."""
    try:
        _req("DELETE", f"/v9/projects/{project}", token, team=team)
        return True
    except VercelError:
        return False


def token_from_env() -> tuple:
    """(token, team) if this environment is set up to deploy over the API."""
    return os.environ.get("VERCEL_TOKEN"), os.environ.get("VERCEL_TEAM_ID")


def available() -> bool:
    return bool(os.environ.get("VERCEL_TOKEN"))
