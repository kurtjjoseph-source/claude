#!/usr/bin/env python3
"""
factory — the platform factory: minimal forms in a set order, each producing a real asset.

The difference between this and a wizard with a progress bar is that a milestone here is
not "the operator clicked next". A milestone is **a file on disk** (or a URL that answers),
and the next stage reads it. Progress is measured by asking the filesystem what exists,
not by remembering what was ticked:

    1  Idea          -> business-idea.md
    2  Prelaunch     -> a DEPLOYED funnel + prelaunch/signal.json     (a real URL, live)
                        — OPTIONAL: skipping writes turnkey/prelaunch-waived.md instead
    3  Profile       -> turnkey/business-profile.md  (carrying the prelaunch evidence)
    4  Brand         -> turnkey/brand-kit.json + brand-kit.md + brand-manual.html
                        — a predesigned kit, and the manual everything is built in
    5  Provisioning  -> turnkey/blueprint.md + platform-spec.json + provisioning.md
    6  Build         -> the platform, built and optionally deployed
    -  Bundle        -> bundle.zip of everything above

Nothing here prints a command for a person to run. Every button either writes an artifact
or shells out to the engine that does. Where a step genuinely cannot proceed without a
human — an account, a credential, a signature — it says so and stops, because those are
categorically not things an agent should hold.

Local only: binds 127.0.0.1, mints a one-time token, and shells out to `turnkey.py` for
every state change so the gates, refusals and consent chain apply exactly as on the CLI.

Stdlib only.
"""

from __future__ import annotations

import base64
import html as _html
import http.server
import json
import mimetypes
import os
import secrets
import socketserver
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from urllib.parse import urlparse, parse_qs, unquote

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.join(HERE, "turnkey.py")
PAGE = os.path.join(HERE, "factory.html")

sys.path.insert(0, HERE)
import artifacts  # noqa: E402
import brand_kits  # noqa: E402
import turnkey as tk  # noqa: E402

MAX_BODY = 4 * 1024 * 1024


def run_engine(args: list, timeout: int = 900) -> dict:
    """The ONLY way this server changes launch state."""
    p = subprocess.run([sys.executable, ENGINE] + args, capture_output=True,
                       text=True, timeout=timeout)
    return {"ok": p.returncode == 0, "code": p.returncode,
            "stdout": (p.stdout or "").strip(), "stderr": (p.stderr or "").strip()}


# ===========================================================================
# where things live
# ===========================================================================

def folder_for(root: str, name: str) -> str:
    """Resolve a business to its folder.

    A plain name is a folder directly under the ideas root — that is what a new business
    is. The directory, though, lists businesses that already exist wherever they were
    built (the Forge demos live several levels down), so a relative path is accepted too
    and every segment is checked: no `..`, no absolute path, no dotfile, and the resolved
    path must still be inside the root."""
    name = (name or "").strip().strip("/")
    if not name or "\\" in name:
        raise ValueError("give the business a plain name")
    parts = [p for p in name.split("/") if p]
    if not parts or any(p in (".", "..") or p.startswith(".") for p in parts):
        raise ValueError("give the business a plain name")
    folder = os.path.join(root, *parts)
    if os.path.realpath(folder) != os.path.realpath(root) and \
       not os.path.realpath(folder).startswith(os.path.realpath(root) + os.sep):
        raise ValueError("that is not inside the ideas folder")
    return folder


def answers_path(folder): return os.path.join(folder, "turnkey", "factory-answers.json")
def signal_path(folder):  return os.path.join(folder, "prelaunch", "signal.json")


# Where a local build is browsed from. Everything under it is a file Forge wrote.
BUILD_PREFIX = "/b/"


def encode_business(rel: str) -> str:
    """A business as one path segment — names have spaces, and the nested ones have
    slashes, neither of which survives being a path segment untouched."""
    return base64.urlsafe_b64encode(rel.encode("utf-8")).decode("ascii").rstrip("=")


def decode_business(token: str) -> str:
    pad = "=" * (-len(token) % 4)
    try:
        return base64.urlsafe_b64decode(token + pad).decode("utf-8")
    except Exception:
        raise ValueError("that is not a business")


def latest_run_dir(folder: str) -> str:
    """The directory of the most recent Forge run, or "" if it never ran."""
    latest = load_json(os.path.join(folder, "forge", "latest.json"), {})
    run = load_json(latest.get("state", ""), {}) if latest.get("state") else {}
    rd = run.get("dir") or ""
    return rd if rd and os.path.isdir(rd) else ""


def load_json(p, default=None):
    if not os.path.exists(p):
        return default if default is not None else {}
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except ValueError:
        return default if default is not None else {}


def write_json(p, data):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    tmp = p + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmp, p)


# ===========================================================================
# the milestones — defined by the artifact each one must leave behind
# ===========================================================================

MILESTONES = [
    {"id": "idea", "title": "The idea", "produces": "business-idea.md",
     "path": "business-idea.md",
     "detail": "The file the whole pipeline reads from."},
    {"id": "prelaunch", "title": "Prelaunch", "produces": "a deployed funnel",
     "path": "prelaunch/signal.json",
     "optional": True, "waiver": artifacts.WAIVER_REL,
     "detail": "A live waitlist page, and the names it collects. Not every business needs "
               "one — skipping writes the waiver instead."},
    {"id": "profile", "title": "The profile", "produces": "business-profile.md",
     "path": "turnkey/business-profile.md",
     "detail": "Positioning, offer and pricing — with the prelaunch evidence in it."},
    {"id": "brand", "title": "The brand", "produces": "brand-kit.md",
     "path": "turnkey/brand-kit.md",
     "detail": "The palette, typography and voice everything is built in — chosen from "
               "the predesigned kits, and written out as a manual the owner can hand to "
               "a printer or a sign maker."},
    {"id": "provisioning", "title": "Provisioning", "produces": "provisioning.md",
     "path": "turnkey/provisioning.md",
     "detail": "What must exist before the platform can serve traffic."},
    {"id": "build", "title": "The platform", "produces": "a built platform",
     "path": "forge/latest.json",
     "detail": "Site plus operating platform, built by Forge."},
]


# --- the optional milestone ------------------------------------------------
# A funnel earns the right to build something nobody has asked for yet. A church has a
# congregation, a service business has a phone that rings, a venue has a street — for
# those the waitlist is a detour, and a pipeline that insists on it teaches operators to
# fake the one artifact that is supposed to be evidence.
#
# So prelaunch is optional, and skipping it is a decision with a file: `prelaunch-waived.md`.
# The milestone is then satisfied the same way every other milestone is — by something on
# disk — and the tree never has to trust a flag it cannot see.

def waiver_path(folder: str) -> str:
    return os.path.join(folder, *artifacts.WAIVER_REL.split("/"))


def prelaunch_state(folder: str, org_type: str = "") -> dict:
    """Whether this business runs a funnel, and what the archetype would advise."""
    p = waiver_path(folder)
    waived = os.path.exists(p)
    try:
        import archetypes
        advice = archetypes.prelaunch_advice(org_type)
    except Exception:
        advice = ""
    out = {"waived": waived, "advice": advice, "reason": "", "at": "",
           "ran": os.path.exists(signal_path(folder))}
    if waived:
        out.update(artifacts.read_waiver(p))
    return out


def artifact_state(folder: str) -> dict:
    """Progress, measured by asking the filesystem — never by trusting a flag."""
    answers = load_json(answers_path(folder), {})
    pre = prelaunch_state(folder, answers.get("org_type", ""))

    out = []
    for m in MILESTONES:
        p = os.path.join(folder, m["path"])
        exists = os.path.exists(p)
        item = {**m, "done": exists}
        # An optional milestone that was waived is *settled*, not outstanding — but it is
        # never shown as done, because nothing was built. The tree draws a third state.
        if m.get("optional") and not exists and pre["waived"]:
            item["skipped"] = True
            item["settled_by"] = m.get("waiver")
            item["reason"] = pre["reason"]
        if exists:
            item["bytes"] = os.path.getsize(p)
            item["at"] = time.strftime("%Y-%m-%d %H:%M",
                                       time.localtime(os.path.getmtime(p)))
        out.append(item)

    files = []
    for rel, arc in artifacts.BUNDLE_ORDER:
        p = os.path.join(folder, rel)
        if os.path.exists(p):
            files.append({"name": arc, "rel": rel, "bytes": os.path.getsize(p)})

    sig = load_json(signal_path(folder), {})
    latest = load_json(os.path.join(folder, "forge", "latest.json"), {})
    run = load_json(latest.get("state", ""), {}) if latest.get("state") else {}

    return {
        "milestones": out,
        "files": files,
        "signal": sig,
        "prelaunch": pre,
        "funnel_url": sig.get("url", ""),
        "platform_url": (run.get("artifacts") or {}).get("alias")
                        or (run.get("artifacts") or {}).get("url", ""),
        "run": {"id": run.get("run"), "outcome": run.get("outcome"),
                "elapsed": run.get("elapsed")} if run else None,
        "answers": answers,
    }


# ===========================================================================
# the directory — every site this factory has launched, and its live addresses
# ===========================================================================
#
# The factory builds one business at a time and then forgets it: the console only ever
# showed the business currently being worked on, so the address of a site launched last
# week lived in a run.json nobody opens. The directory is the other half — it asks the
# filesystem which businesses exist, reads each one's last Forge run for the addresses it
# actually published, and offers the handful of things an operator does to a launched
# site afterwards. Same rule as the milestones: nothing here is remembered state, it is
# all measured at the moment it is asked for.

# A folder is a business when it carries one of the files only a business carries.
MARKERS = ("business-idea.md", "forge/latest.json", "turnkey/launch-state.json")

# Directories that can never contain a business and are expensive to walk.
SKIP_DIRS = {"node_modules", "build", "dist", ".git", "__pycache__", "venv", ".venv",
             "engine", "orchestrator"}


def scan_businesses(root: str, max_depth: int = 6) -> list:
    """Every business folder under the root, found rather than listed.

    Descent stops at a business — a business's own `forge/` and `turnkey/` folders are
    not more businesses — which is what keeps this cheap on a tree with hundreds of runs
    in it."""
    found = []

    def walk(d: str, depth: int):
        if depth > max_depth:
            return
        try:
            entries = sorted(os.scandir(d), key=lambda e: e.name)
        except (PermissionError, FileNotFoundError):
            return
        for e in entries:
            if not e.is_dir(follow_symlinks=False) or e.name.startswith(".") \
               or e.name in SKIP_DIRS:
                continue
            if any(os.path.exists(os.path.join(e.path, m)) for m in MARKERS):
                found.append(e.path)
                continue          # a business is a leaf
            walk(e.path, depth + 1)

    if os.path.isdir(root):
        walk(root, 1)
    return found


def _archetype_meta(org_type: str, run: dict) -> dict:
    """What kind of business this is, preferring what was actually built over what was
    typed — the run carries the archetype Forge resolved, accent included."""
    a = run.get("archetype") or {}
    if a.get("id"):
        f = a.get("forge") or {}
        return {"archetype": a.get("id"), "kind": a.get("label") or a.get("id"),
                "forge": f.get("name", "FORGE"),
                "accent": f.get("accent_site") or f.get("accent") or "#c47716"}
    if org_type:
        try:
            import archetypes
            aid = archetypes.ORG_TYPE_MAP.get(org_type)
            if aid:
                spec = archetypes.ARCHETYPES[aid]
                f = spec.get("forge") or {}
                return {"archetype": aid,
                        "kind": ORG_LABEL.get(org_type, spec["label"]),
                        "forge": f.get("name", "FORGE"),
                        "accent": f.get("accent_site") or f.get("accent") or "#c47716"}
        except Exception:
            pass
    return {"archetype": "", "kind": "", "forge": "", "accent": "#868f89"}


def _preview_rel(build_dir: str, path: str) -> str:
    """A path inside a local build, as something the browser can ask this server for.

    A local build's artifacts are `file://` paths, and a page served over http cannot
    open one — the link is there but clicking it does nothing. Serving the build through
    the console instead makes a local platform as openable as a deployed one."""
    if not build_dir or not path:
        return ""
    p = path[7:] if path.startswith("file://") else path
    try:
        rel = os.path.relpath(p, build_dir)
    except ValueError:
        return ""
    return "" if rel.startswith("..") else rel.replace(os.sep, "/")


def published_run(folder: str, limit: int = 40) -> dict:
    """The most recent run that put this business on a public address.

    `latest.json` is the last run, which is not the same thing: rebuilding a deployed
    site locally makes the latest run a local one, and a directory reading only that
    would report a site that is serving right now as never launched. So the runs are
    walked newest-first until one is found that published."""
    d = os.path.join(folder, "forge")
    if not os.path.isdir(d):
        return {}
    for name in sorted((e.name for e in os.scandir(d) if e.is_dir()), reverse=True)[:limit]:
        r = load_json(os.path.join(d, name, "run.json"), {})
        art = r.get("artifacts") or {}
        if (art.get("alias") or "").startswith("http") or \
           (art.get("url") or "").startswith("http"):
            return r
    return {}


def directory_entry(root: str, folder: str) -> dict:
    """One row of the directory: what it is, where it is, and how far it got."""
    rel = os.path.relpath(folder, root).replace(os.sep, "/")
    answers = load_json(answers_path(folder), {})
    state = load_json(os.path.join(folder, "turnkey", "launch-state.json"), {})
    latest = load_json(os.path.join(folder, "forge", "latest.json"), {})
    run = load_json(latest.get("state", ""), {}) if latest.get("state") else {}
    art = run.get("artifacts") or {}
    sig = load_json(signal_path(folder), {})

    org_type = (answers.get("org_type")
                or (state.get("blueprint") or {}).get("org_type") or "")
    meta = _archetype_meta(org_type, run)

    done = [m["id"] for m in MILESTONES
            if os.path.exists(os.path.join(folder, m["path"]))]
    # A waived funnel is settled, not missing — a row reading "3 of 5" for a business that
    # deliberately never ran one is a row that looks unfinished forever.
    pre = prelaunch_state(folder, org_type)
    skipped = [m["id"] for m in MILESTONES
               if m.get("optional") and m["id"] not in done and pre["waived"]]

    # The addresses. An alias is the stable one, so it is the address of the site; the
    # deployment URL is kept as the exact build's address for when the two disagree.
    pub = run if (art.get("alias") or art.get("url", "")).startswith("http") \
        else published_run(folder)
    part = pub.get("artifacts") or {}
    alias = part.get("alias") or ""
    deployed = part.get("url") if (part.get("url") or "").startswith("http") else ""
    live = alias or deployed
    admin = ""
    if live:
        admin = (alias.rstrip("/") + "/platform/") if alias else (part.get("platform_url") or "")
    # A local rebuild after a deploy is the ordinary way a live site goes out of date, so
    # say it rather than showing an address that no longer matches the build on disk.
    stale = bool(live and run.get("run") and pub.get("run") and run["run"] > pub["run"])

    build_dir = os.path.join(run.get("dir", ""), "build") if run.get("dir") else ""
    local = {}
    if build_dir and os.path.isdir(build_dir):
        local = {k: v for k, v in (
            ("site", _preview_rel(build_dir, art.get("site", ""))),
            ("platform", _preview_rel(build_dir, art.get("platform", ""))),
        ) if v}

    checks = run.get("checks") or []
    failed = [c for c in checks if not c.get("ok")]

    # 'launched' is a fact about a URL, not about how many steps were clicked.
    if live:
        status = "live"
    elif run.get("outcome") in ("built", "launched"):
        status = "built"
    elif done:
        status = "building"
    else:
        status = "started"

    when = ""
    for p in (latest.get("state"), os.path.join(folder, "business-idea.md")):
        if p and os.path.exists(p):
            when = time.strftime("%Y-%m-%d %H:%M", time.localtime(os.path.getmtime(p)))
            break

    return {
        "business": rel, "token": encode_business(rel),
        "name": os.path.basename(folder), "path": folder,
        "demo": "/forge/demos/" in ("/" + rel + "/"),
        "org_type": org_type, **meta,
        "status": status, "target": run.get("target", ""),
        "outcome": run.get("outcome", ""), "elapsed": run.get("elapsed"),
        "run": run.get("run", ""), "at": when,
        "pages": len(art.get("pages") or []),
        "checks_ok": len(checks) - len(failed), "checks_total": len(checks),
        "failed": [c.get("id") for c in failed],
        "live": live, "alias": alias, "deployed": deployed, "admin": admin,
        "stale": stale, "published_run": pub.get("run", ""),
        "funnel": sig.get("url", ""), "signups": len(sig.get("signups") or []),
        "waived": pre["waived"], "waived_why": pre["reason"],
        "local": local, "console": bool(run.get("dir")) and
                 os.path.exists(os.path.join(run.get("dir", ""), "console.html")),
        "milestones": len(done) + len(skipped), "of": len(MILESTONES),
        "done": done, "skipped": skipped,
        "promise": answers.get("promise", "") or answers.get("who", ""),
        "domain": answers.get("domain", ""),
    }


def directory(root: str) -> dict:
    # The trash rides along with the directory because it is the same question asked
    # twice: what businesses are there. One archived by mistake is otherwise invisible,
    # which would make archiving feel like deleting — the one thing it is not.
    try:
        import lifecycle
        trash = lifecycle.list_trash(root)
    except Exception:
        trash = []
    entries = [directory_entry(root, f) for f in scan_businesses(root)]
    # Most recently touched first — a directory ordered by the alphabet buries the thing
    # you were just working on.
    entries.sort(key=lambda e: (e["at"] or "", e["name"]), reverse=True)
    counts = {"all": len(entries)}
    for k in ("live", "built", "building", "started"):
        counts[k] = sum(1 for e in entries if e["status"] == k)
    counts["demo"] = sum(1 for e in entries if e["demo"])
    return {"root": root, "entries": entries, "counts": counts, "trash": trash}


class _Redirects(urllib.request.HTTPRedirectHandler):
    """Follow 308 as well as the rest.

    Python 3.9's opener does not know 308, and `/platform/` on Vercel is a 308 to
    `/platform` — so the admin address of every deployed platform would be reported
    broken by a checker that is merely out of date."""
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if code == 308 and req.get_method() in ("GET", "HEAD"):
            code = 301
        return super().redirect_request(req, fp, code, msg, headers, newurl)

    http_error_308 = urllib.request.HTTPRedirectHandler.http_error_301


_OPENER = urllib.request.build_opener(_Redirects)


def act_check(p, root):
    """Ask each published address whether it is still serving this business.

    A directory of links that were true once is a directory of broken promises. This
    fetches them, the same way Forge's smoke stage does, and reports what came back —
    including the case that answers 200 with somebody else's page."""
    folder = folder_for(root, p.get("business") or "")
    e = directory_entry(root, folder)
    name = e["name"]
    variants = {name, _html.escape(name), _html.escape(name, quote=False)}

    def fetch(label, url):
        if not url:
            return None
        t0 = time.time()
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "turnkey-factory"})
            with _OPENER.open(req, timeout=15) as r:
                body = r.read(200_000).decode("utf-8", "replace")
                code = r.status
        except urllib.error.HTTPError as ex:
            return {"label": label, "url": url, "status": ex.code, "ok": False,
                    "ms": int((time.time() - t0) * 1000), "error": f"HTTP {ex.code}"}
        except Exception as ex:
            return {"label": label, "url": url, "ok": False,
                    "ms": int((time.time() - t0) * 1000),
                    "error": f"{type(ex).__name__}: {ex}"}
        carries = any(v in body for v in variants)
        return {"label": label, "url": url, "status": code,
                "ok": code == 200 and carries, "carries": carries,
                "bytes": len(body), "ms": int((time.time() - t0) * 1000),
                **({} if carries else
                   {"error": "answered, but the page does not carry the business name"})}

    results = [r for r in (fetch("site", e["live"]),
                           fetch("admin", e["admin"]),
                           fetch("funnel", e["funnel"])) if r]
    if not results:
        return {"ok": False, "error": "nothing has been published for this business yet",
                "results": []}
    return {"ok": all(r["ok"] for r in results), "results": results,
            "checked": time.strftime("%H:%M:%S")}


# Every archetype's live example, so a person choosing a kind of business can go and look
# at one instead of reading a label. Kept here rather than in archetypes.py because a
# deployed URL is a fact about the operator's account, not about the archetype.
DEMOS = {
    "church": "https://bethel-chapel-mu.vercel.app",
    "solo_business": "https://vale-studio-lilac.vercel.app",
    "nonprofit": "https://warm-coats-foundation.vercel.app",
    "ecommerce": "https://kade-ceramics.vercel.app",
    "digital_products": "https://plainsheet-kappa.vercel.app",
    "membership": "https://the-long-table-nine.vercel.app",
    "education": "https://northlight-school.vercel.app",
    "local_venue": "https://de-zaal.vercel.app",
    "saas": "https://rosterly-two.vercel.app",
    "prelaunch": "https://ferry-coffee-prelaunch.vercel.app",
}


# What the person is actually choosing is what their business *is*. Two org types can
# resolve to the same archetype — a consultancy and a creator both build as BIZforge — and
# titling the cards by archetype shows the same card twice with no way to tell them apart.
ORG_LABEL = {
    "church": "Church or faith community",
    "service_business": "Service business",
    "creator_media": "Creator or media",
    "nonprofit": "Charity or nonprofit",
    "ecommerce": "Online shop",
    "digital_products": "Digital products",
    "membership": "Membership or club",
    "education": "Courses or school",
    "local_venue": "Venue",
    "saas": "Software product",
}


def archetype_catalog() -> list:
    """What the picker draws, derived from the engine rather than described to it.

    A chooser with a hand-written list of business types is a list that silently stops
    matching the builder the first time somebody adds an archetype — and the person it
    misleads is the one starting a build."""
    import archetypes

    out = []
    for org_type, aid in archetypes.ORG_TYPE_MAP.items():
        a = archetypes.ARCHETYPES[aid]
        forge = a.get("forge", {})
        out.append({
            "org_type": org_type,
            "archetype": aid,
            "label": ORG_LABEL.get(org_type, org_type.replace("_", " ").capitalize()),
            "archetype_label": a["label"],
            "forge": forge.get("name", "FORGE"),
            "accent": forge.get("accent_site") or forge.get("accent") or "#c47716",
            "glow": forge.get("accent") or "#c47716",
            "summary": a["summary"],
            "curated": bool(a.get("curated")),
            "pages": len(a["site"]["pages"]),
            "modules": len(a["modules"].get("order") or a["modules"].get("require") or []),
            "builds": [m.replace("_", " ") for m in (a["modules"].get("require") or [])[:5]],
            "type_preset": a.get("type_preset", "humanist"),
            "skin": a.get("skin", "house"),
            "product_app": a.get("product_app"),
            # Advice, not a rule: both paths are offered for every kind of business.
            "prelaunch": archetypes.prelaunch_advice(org_type),
            "demo": DEMOS.get(aid, ""),
        })
    # Curated first, then alphabetically — an uncurated fallback should never be the first
    # thing somebody's eye lands on.
    out.sort(key=lambda x: (not x["curated"], x["label"]))
    return out


def _authorization_args(what: str) -> list:
    """The flags that let a public deploy proceed.

    With a standing service authorization on file, the per-business consent line cites
    that grant as its evidence — which is what makes an unattended service honest rather
    than merely quiet. Without one, the evidence is the operator's own click."""
    grant = tk.load_service_auth()
    if grant:
        return ["--authorize-unattended", "--actor", grant.get("granted_by", "VOM"),
                "--channel", "standing service authorization",
                "--evidence", "standing grant " + grant.get("hash", "")[:16] +
                              " granted " + grant.get("granted_at", "")]
    return ["--authorize-unattended", "--actor", "VOM",
            "--channel", "operator console (factory)",
            "--evidence", "operator pressed " + what]


# ===========================================================================
# actions — each one leaves an artifact behind
# ===========================================================================

def act_ideate(p, root):
    """AI ideation — a sentence in, a complete business brief out.

    Nothing is written to disk here. The draft is returned to the browser and the
    operator reviews it in the same form they would have typed, so an AI-drafted
    business and a hand-typed one are the same artifact downstream."""
    import ideation
    if not ideation.available():
        return {"ok": False, "error": ideation.why_unavailable(), "unavailable": True}
    try:
        a = ideation.draft(p.get("description") or "", p.get("name") or "",
                           p.get("city") or "", p.get("org_type") or "")
    except ValueError as e:
        return {"ok": False, "error": str(e)}
    except Exception as e:
        return {"ok": False, "error": f"{type(e).__name__}: {e}"}
    return {"ok": True, "answers": a, "assumptions": a.get("_assumptions") or [],
            "model": a.get("_drafted_by")}


def act_start(p, root):
    """Create the business folder and write the idea. Milestone 1."""
    a = p.get("answers") or {}
    folder = folder_for(root, a.get("name") or "")
    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, "business-idea.md"), "w", encoding="utf-8") as f:
        f.write(artifacts.idea_md(a))
    write_json(answers_path(folder), a)
    r = run_engine(["init", folder, "--name", a["name"]])
    return {"ok": True, "folder": folder, "engine": r,
            "wrote": ["business-idea.md"]}


def act_save(p, root):
    """Update the answers and rewrite the idea — the artifact stays current."""
    folder = folder_for(root, p.get("business") or "")
    a = {**load_json(answers_path(folder), {}), **(p.get("answers") or {})}
    write_json(answers_path(folder), a)
    with open(os.path.join(folder, "business-idea.md"), "w", encoding="utf-8") as f:
        f.write(artifacts.idea_md(a))
    return {"ok": True, "wrote": ["business-idea.md"]}


def act_prelaunch(p, root):
    """Choose whether this business runs a funnel at all — and leave a file either way.

    `skip` writes `prelaunch-waived.md`; `run` removes it. Nothing else is stored, because
    a decision kept in a session is a decision the next person cannot see: the tree, the
    directory row, the profile and the bundle all read this one file."""
    folder = folder_for(root, p.get("business") or "")
    if not os.path.isdir(folder):
        return {"ok": False, "error": "that business does not exist yet"}
    mode = (p.get("mode") or "").strip()
    a = load_json(answers_path(folder), {})
    path = waiver_path(folder)

    if mode == "skip":
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(artifacts.prelaunch_waiver_md(a, p.get("reason") or "",
                                                  p.get("actor") or "VOM"))
        return {"ok": True, "waived": True, "wrote": [artifacts.WAIVER_REL],
                "prelaunch": prelaunch_state(folder, a.get("org_type", ""))}

    if mode == "run":
        # Changing your mind is normal, and the waiver is the only thing that recorded the
        # old answer — so removing it IS the change. Only ever this one generated file.
        removed = []
        if os.path.exists(path):
            os.remove(path)
            removed.append(artifacts.WAIVER_REL)
        return {"ok": True, "waived": False, "removed": removed,
                "prelaunch": prelaunch_state(folder, a.get("org_type", ""))}

    return {"ok": False, "error": "mode must be 'run' or 'skip'"}


def act_deploy_funnel(p, root):
    """Milestone 2 — BUILD AND DEPLOY the prelaunch funnel. A real URL, or an error.

    This is the step that used to print a command. It runs Forge against the
    `prelaunch` archetype and returns whatever actually happened."""
    folder = folder_for(root, p.get("business") or "")
    a = load_json(answers_path(folder), {})
    target = p.get("target") or "local"

    # Building the funnel contradicts a waiver that says there will not be one. The build
    # is the newer decision, so the waiver goes rather than sitting there being false.
    unwaived = os.path.exists(waiver_path(folder))
    if unwaived:
        os.remove(waiver_path(folder))

    args = ["forge", folder, "--archetype", "prelaunch", "--target", target,
            "--no-open", "--quiet", "--console"]
    # A funnel published as one of a set gets a route back to that set — the same line on
    # every page of every business, so the batch reads as one programme.
    if p.get("hub_link"):
        args += ["--hub-link", p["hub_link"]]
        if p.get("hub_label"):
            args += ["--hub-label", p["hub_label"]]
        if p.get("hub_note"):
            args += ["--hub-note", p["hub_note"]]
    if not load_json(os.path.join(folder, "turnkey", "launch-state.json"), {}).get("blueprint"):
        args += ["--org-type", p.get("org_type") or "service_business"]
    if target != "local":
        # Deploying a funnel is a publish. The operator pressing this button in their own
        # console IS the prior YES; it is logged before the run, on the same chain.
        args += _authorization_args("Deploy the funnel")
    r = run_engine(args)
    if not r["ok"]:
        return {"ok": False, "error": (r["stderr"] or r["stdout"])[-1200:]}

    latest = load_json(os.path.join(folder, "forge", "latest.json"), {})
    run = load_json(latest.get("state", ""), {})
    art = run.get("artifacts") or {}
    url = art.get("alias") or art.get("url") or ""

    sig = load_json(signal_path(folder), {})
    sig.update({"url": url, "target": target, "deployed": time.strftime("%Y-%m-%d %H:%M"),
                "run": run.get("run"), "threshold": sig.get("threshold", 25),
                "signups": sig.get("signups", [])})
    write_json(signal_path(folder), sig)
    return {"ok": True, "url": url, "outcome": run.get("outcome"),
            "elapsed": run.get("elapsed"), "unwaived": unwaived,
            "console": os.path.join(run.get("dir",""), "console.html")}


def act_signal(p, root):
    """Record who said yes. This is the evidence the profile will carry."""
    folder = folder_for(root, p.get("business") or "")
    sig = load_json(signal_path(folder), {"signups": [], "threshold": 25})
    if p.get("threshold") is not None:
        sig["threshold"] = max(1, int(p["threshold"]))
    if p.get("add"):
        s = p["add"]
        name = (s.get("name") or "").strip()
        if name and not any(x.get("name", "").lower() == name.lower()
                            for x in sig.get("signups", [])):
            sig.setdefault("signups", []).insert(0, {
                "name": name, "email": (s.get("email") or "").strip(),
                "note": (s.get("note") or "").strip(),
                "date": time.strftime("%Y-%m-%d")})
    if p.get("remove") is not None:
        i = int(p["remove"])
        if 0 <= i < len(sig.get("signups", [])):
            sig["signups"].pop(i)
    write_json(signal_path(folder), sig)
    return {"ok": True, "signal": sig}


def act_profile(p, root):
    """Milestone 3 — write business-profile.md, with the prelaunch evidence folded in."""
    folder = folder_for(root, p.get("business") or "")
    a = {**load_json(answers_path(folder), {}), **(p.get("answers") or {})}
    write_json(answers_path(folder), a)

    sig = load_json(signal_path(folder), {})
    ups = sig.get("signups") or []
    evidence = None
    if ups or sig.get("url"):
        dates = sorted(x.get("date", "") for x in ups if x.get("date"))
        evidence = {"count": len(ups), "threshold": sig.get("threshold", 25),
                    "validated": len(ups) >= sig.get("threshold", 25),
                    "url": sig.get("url", ""),
                    "first": dates[0] if dates else "", "last": dates[-1] if dates else "",
                    "names": [x["name"] + (f" <{x['email']}>" if x.get("email") else "")
                              for x in ups]}
    else:
        # No funnel ran. If that was a decision, the profile says so — "no evidence" and
        # "we decided we did not need any" are different claims about the same blank space.
        pre = prelaunch_state(folder, a.get("org_type", ""))
        if pre["waived"]:
            evidence = {"waived": True, "reason": pre["reason"], "at": pre["at"]}

    os.makedirs(os.path.join(folder, "turnkey"), exist_ok=True)
    with open(tk.profile_path(folder), "w", encoding="utf-8") as f:
        f.write(artifacts.profile_md(a, evidence))
    return {"ok": True, "wrote": ["turnkey/business-profile.md"],
            "evidence": bool(evidence and evidence.get("count")),
            "waived": bool(evidence and evidence.get("waived"))}


def act_brand(p, root):
    """Milestone 4 — choose the brand kit and write the manual.

    Three files, because three different readers need it: `brand-kit.json` is what the
    spec compiler reads, `brand-kit.md` is the milestone's artifact and what a person
    reads, and `brand-manual.html` is what gets printed to PDF and handed on. All three
    are generated from one kit, so they cannot disagree."""
    folder = folder_for(root, p.get("business") or "")
    if not os.path.isdir(folder):
        return {"ok": False, "error": "that business does not exist yet"}

    a = load_json(answers_path(folder), {})
    org_type = p.get("org_type") or a.get("org_type") or ""
    import archetypes
    aid = archetypes.ORG_TYPE_MAP.get(org_type, "generic")

    kit, source = brand_kits.resolve(p.get("kit") or "", aid)
    if p.get("kit") and source == "fallback":
        return {"ok": False, "error": f"no such brand kit: {p.get('kit')}"}

    at = time.strftime("%Y-%m-%dT%H:%M:%S")
    brand_kits.write_choice(folder, kit, aid, at=at)

    label = archetypes.ARCHETYPES[aid]["label"]
    name = a.get("name") or os.path.basename(folder.rstrip("/"))
    os.makedirs(os.path.join(folder, "turnkey"), exist_ok=True)
    with open(os.path.join(folder, *brand_kits.MANUAL_REL.split("/")),
              "w", encoding="utf-8") as f:
        f.write(brand_kits.manual_md(kit, name, label))
    with open(os.path.join(folder, *brand_kits.MANUAL_HTML_REL.split("/")),
              "w", encoding="utf-8") as f:
        f.write(brand_kits.manual_html(kit, name, label))

    a["brand_kit"] = kit["id"]
    write_json(answers_path(folder), a)
    return {"ok": True, "kit": kit["id"], "name": kit["name"],
            "contrast": brand_kits.audit(kit),
            "wrote": [brand_kits.CHOICE_REL, brand_kits.MANUAL_REL,
                      brand_kits.MANUAL_HTML_REL]}


def act_provision(p, root):
    """Milestone 5 — blueprint, spec, then provisioning.md. Each reads the last."""
    folder = folder_for(root, p.get("business") or "")
    steps = []

    r = run_engine(["blueprint", folder, "--org-type", p.get("org_type") or "service_business",
                    "--save"])
    steps.append({"step": "blueprint", **r})
    if not r["ok"]:
        return {"ok": False, "steps": steps, "error": (r["stderr"] or r["stdout"])[-800:]}

    args = ["spec", folder, "--target", p.get("target") or "local", "--save"]
    if p.get("domain"):
        args += ["--domain", p["domain"]]
    r = run_engine(args)
    steps.append({"step": "spec", **r})
    if not r["ok"]:
        return {"ok": False, "steps": steps, "error": (r["stderr"] or r["stdout"])[-800:]}

    spec = load_json(tk.spec_path(folder), {})
    state = load_json(tk.state_path(folder), {})
    operator = tk.load_operator(None)
    with open(os.path.join(folder, "turnkey", "provisioning.md"), "w", encoding="utf-8") as f:
        f.write(artifacts.provisioning_md(folder, state, spec, operator))
    steps.append({"step": "provisioning", "ok": True})

    return {"ok": True, "steps": steps,
            "wrote": ["turnkey/blueprint.md", "turnkey/platform-spec.json",
                      "turnkey/platform-spec.md", "turnkey/provisioning.md"],
            "ready": (spec.get("readiness") or {}).get("ready"),
            "blocking": (spec.get("readiness") or {}).get("blocking") or []}


def act_build(p, root):
    """Milestone 5 — Forge builds the platform."""
    folder = folder_for(root, p.get("business") or "")
    target = p.get("target") or "local"
    args = ["forge", folder, "--target", target, "--no-open", "--quiet", "--console"]
    if target != "local":
        args += _authorization_args("Build the platform")
    r = run_engine(args)
    latest = load_json(os.path.join(folder, "forge", "latest.json"), {})
    run = load_json(latest.get("state", ""), {})
    art = run.get("artifacts") or {}
    if not r["ok"]:
        return {"ok": False, "error": (r["stderr"] or r["stdout"])[-1200:],
                "run": run.get("run")}
    return {"ok": True, "outcome": run.get("outcome"), "elapsed": run.get("elapsed"),
            "url": art.get("alias") or art.get("url", ""),
            "platform": art.get("platform_url", ""),
            "console": os.path.join(run.get("dir", ""), "console.html")}


def act_autorun(p, root):
    """Ideation in, live platform out — every milestone, no stops.

    This is the shape the service takes: a person writes the idea and reads the result,
    and nothing in between waits for them. Each step still leaves its artifact, so a run
    that fails halfway leaves everything it produced and says exactly where it stopped."""
    a = p.get("answers") or {}
    name = a.get("name") or p.get("business") or ""
    target = p.get("target") or "local"
    org = p.get("org_type") or "service_business"
    steps, t0 = [], time.time()

    def step(label, fn):
        s0 = time.time()
        try:
            r = fn()
        except Exception as ex:
            steps.append({"step": label, "ok": False,
                          "error": f"{type(ex).__name__}: {ex}"})
            return None
        ok = r.get("ok", True)
        steps.append({"step": label, "ok": ok, "seconds": round(time.time() - s0, 1),
                      **({"error": r.get("error")} if not ok else {}),
                      **({"url": r["url"]} if r.get("url") else {})})
        return r if ok else None

    # Whether this run builds a funnel. An unattended run has nobody to ask, so the caller
    # says, and if it doesn't, the archetype's own advice decides — a church, a service
    # business and a venue go straight to the platform; a course, a membership or a SaaS
    # earns its build with a waitlist first. Either way it is written down.
    mode = (p.get("prelaunch") or "").strip()
    if mode not in ("run", "skip"):
        try:
            import archetypes
            mode = "skip" if archetypes.prelaunch_advice(org) == "optional" else "run"
        except Exception:
            mode = "run"

    if not step("idea", lambda: act_start({"answers": a}, root)):
        return {"ok": False, "steps": steps, "stopped_at": "idea"}
    body = {"business": name, "target": target, "org_type": org}

    if mode == "skip":
        if not step("funnel waived", lambda: act_prelaunch(
                {**body, "mode": "skip",
                 "reason": p.get("prelaunch_reason") or
                 "This kind of business already has its audience — the platform is the "
                 "first deliverable, not the waitlist.",
                 "actor": p.get("actor") or "VOM"}, root)):
            return {"ok": False, "steps": steps, "stopped_at": "funnel waived"}
    elif not step("funnel", lambda: act_deploy_funnel(body, root)):
        return {"ok": False, "steps": steps, "stopped_at": "funnel"}

    if not step("profile", lambda: act_profile({**body, "answers": a}, root)):
        return {"ok": False, "steps": steps, "stopped_at": "profile"}
    # An unattended run has nobody to choose a kit, so the caller may name one and the
    # archetype's default applies when it doesn't. The step still runs either way — the
    # owner gets a manual whether or not a person picked the colours.
    if not step("brand", lambda: act_brand({**body, "kit": p.get("kit") or ""}, root)):
        return {"ok": False, "steps": steps, "stopped_at": "brand"}
    if not step("provisioning", lambda: act_provision({**body, "domain": a.get("domain")}, root)):
        return {"ok": False, "steps": steps, "stopped_at": "provisioning"}
    if not step("platform", lambda: act_build(body, root)):
        return {"ok": False, "steps": steps, "stopped_at": "platform"}

    folder = folder_for(root, name)
    st = artifact_state(folder)
    return {"ok": True, "steps": steps, "seconds": round(time.time() - t0, 1),
            "prelaunch": mode,
            "funnel": st.get("funnel_url"), "platform": st.get("platform_url"),
            "artifacts": [f["name"] for f in st.get("files", [])]}


# ===========================================================================
# lifecycle — renaming a business, and taking one down
# ===========================================================================
#
# The factory was very good at bringing a business into existence and had no answer at all
# for the two things that happen next: it turns out to be called something else, or it
# should never have existed. Both were manual, and both left a trail of half-updated files
# and a live site nobody remembered deploying. Everything here delegates to `lifecycle.py`
# so the console and the CLI cannot drift apart, and so the rules that make a rename safe
# (the consent chain's genesis anchor, the orphan list) live in one place.

def act_inventory(p, root):
    """Everything under this business's name — on disk and at the host.

    Nothing is destroyed from a list a person has not seen, so this is the screen the
    other three read from. `probe` additionally asks each address whether it still
    answers, which is slow enough to be a choice rather than a default."""
    import lifecycle
    folder = folder_for(root, p.get("business") or "")
    if not os.path.isdir(folder):
        return {"ok": False, "error": "there is no business by that name"}
    return {"ok": True, **lifecycle.inventory(folder, probe=bool(p.get("probe"))),
            "trash": lifecycle.list_trash(root)}


def act_rename(p, root):
    """Deep rename — the folder, the answers, the generated documents, the launch state,
    the paths inside past Forge runs, and a recompile so the slug, the hosting project and
    the spec fingerprint are genuinely the new ones rather than the old ones relabelled."""
    import lifecycle
    r = lifecycle.rename(root, p.get("business") or "", p.get("new_name") or "",
                         confirm=p.get("confirm") or "",
                         recompile=p.get("recompile", True),
                         move_sites=bool(p.get("move_sites")),
                         actor=p.get("actor") or "VOM")
    if r.get("folder"):
        # The console addresses a business by its path relative to the root, and that path
        # is exactly what just changed — so hand back the new one instead of leaving the
        # page holding a name that no longer resolves.
        r["business"] = os.path.relpath(r["folder"], root).replace(os.sep, "/")
    return r


def act_delete_sites(p, root):
    """Take deployed sites down. Confirmed by name and logged on the consent chain,
    because unpublishing reaches as far outward as publishing did."""
    import lifecycle
    folder = folder_for(root, p.get("business") or "")
    return lifecycle.delete_sites(folder, p.get("projects") or [],
                                  confirm=p.get("confirm") or "",
                                  actor=p.get("actor") or "VOM")


def act_cleanup(p, root):
    """The local half: prune old Forge runs, archive a business, restore or purge.

    `archive` moves the folder into `.factory-trash/` rather than deleting it — the
    factory stops listing it and it stays one restore away. `purge` is the only hard
    delete in the whole system, it can only ever reach the trash, and it refuses while the
    archived business still has a site serving."""
    import lifecycle
    what = p.get("what") or ""
    if what == "prune":
        return lifecycle.prune_runs(folder_for(root, p.get("business") or ""),
                                    int(p.get("keep") or 2))
    if what == "archive":
        return lifecycle.archive(root, p.get("business") or "",
                                 confirm=p.get("confirm") or "",
                                 reason=p.get("reason") or "")
    if what == "restore":
        return lifecycle.restore(root, p.get("entry") or "")
    if what == "purge":
        return lifecycle.purge_trash(root, p.get("entry") or "",
                                     confirm=p.get("confirm") or "")
    return {"ok": False, "error": "unknown cleanup — prune, archive, restore or purge"}


ACTIONS = {"ideate": act_ideate, "autorun": act_autorun, "start": act_start, "save": act_save,
           "prelaunch": act_prelaunch, "deploy_funnel": act_deploy_funnel,
           "signal": act_signal, "profile": act_profile, "brand": act_brand,
           "provision": act_provision,
           "build": act_build, "check": act_check,
           "inventory": act_inventory, "rename": act_rename,
           "delete_sites": act_delete_sites, "cleanup": act_cleanup}


# ===========================================================================
# server
# ===========================================================================

def make_handler(root: str, token: str = ""):
    """The request handler, as a class.

    Defined here rather than inside serve() so the hosted entrypoint (serve.py) can
    subclass it and swap the auth model without duplicating a single action."""

    class H(http.server.BaseHTTPRequestHandler):
        def log_message(self, *a): pass

        def _send(self, code, body, ctype="application/json", raw=False):
            data = body if raw else json.dumps(body, ensure_ascii=False).encode("utf-8")
            if isinstance(data, str):
                data = data.encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            try: self.wfile.write(data)
            except (BrokenPipeError, ConnectionResetError): pass

        def _auth(self, q):
            return (q.get("t") or [""])[0] == token

        def _serve_under(self, path, base):
            """Serve one file, but only if it really is inside `base`."""
            if os.path.isdir(path):
                path = os.path.join(path, "index.html")
            if not os.path.realpath(path).startswith(os.path.realpath(base) + os.sep):
                return self._send(400, {"error": "not part of this build"})
            if not os.path.exists(path):
                return self._send(404, {"error": "not written by this build"})
            ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
            if ctype.startswith("text/") or ctype == "application/javascript":
                ctype += "; charset=utf-8"
            with open(path, "rb") as f:
                return self._send(200, f.read(), ctype, raw=True)

        def do_GET(self):
            u = urlparse(self.path); q = parse_qs(u.query)
            if u.path in ("/", "/index.html"):
                with open(PAGE, encoding="utf-8") as f:
                    return self._send(200, f.read(), "text/html; charset=utf-8", raw=True)

            # A local build, served under a path prefix rather than a query parameter,
            # because a page whose nav is relative links is only a site if those links
            # resolve — `/api/build?rel=site/index.html` would send every one of them to
            # the root. Both the auth token and the business ride in the prefix, so every
            # relative hop inside the build stays authenticated and stays in the build.
            if u.path.startswith(BUILD_PREFIX):
                tok, _, rest = u.path[len(BUILD_PREFIX):].partition("/")
                who, _, rel = rest.partition("/")
                if not self._auth({"t": [unquote(tok)]}):
                    return self._send(403, {"error": "bad token"})
                try:
                    folder = folder_for(root, decode_business(who))
                except ValueError as e:
                    return self._send(400, {"error": str(e)})
                rd = latest_run_dir(folder)
                if not rd:
                    return self._send(404, {"error": "this business has no build yet"})
                build = os.path.join(rd, "build")
                return self._serve_under(os.path.join(build, unquote(rel or "index.html")),
                                         build)

            if not self._auth(q):
                return self._send(403, {"error": "bad token"})

            if u.path == "/api/kits":
                # The kit gallery, generated from the library the compiler reads. Same
                # rule as the archetype picker: a hand-written list of kits is a list
                # that stops matching the builder the first time somebody draws one.
                at = (q.get("archetype") or [""])[0]
                if not at:
                    biz = (q.get("business") or [""])[0]
                    if biz:
                        import archetypes as _a
                        ans = load_json(answers_path(folder_for(root, biz)), {})
                        at = _a.ORG_TYPE_MAP.get(ans.get("org_type", ""), "")
                return self._send(200, {"kits": brand_kits.catalog(at),
                                        "default": brand_kits.default_id_for(at) if at else ""})

            if u.path == "/api/archetypes":
                # Generated, never typed. A picker with a hand-written list is a list that
                # stops matching the engine the first time somebody writes an archetype.
                return self._send(200, {"archetypes": archetype_catalog()})

            if u.path == "/api/directory":
                return self._send(200, directory(root))

            if u.path == "/api/console":
                name = (q.get("business") or [""])[0]
                rd = latest_run_dir(folder_for(root, name))
                if not rd:
                    return self._send(404, {"error": "this business has no build yet"})
                return self._serve_under(os.path.join(rd, "console.html"), rd)

            if u.path == "/api/state":
                name = (q.get("business") or [""])[0]
                try:
                    import ideation
                    ai = {"available": ideation.available(), "why": ideation.why_unavailable(),
                          "model": ideation.MODEL}
                except Exception as e:
                    ai = {"available": False, "why": f"ideation unavailable: {e}"}
                if not name:
                    names = sorted(d for d in os.listdir(root)
                                   if os.path.isdir(os.path.join(root, d))
                                   and not d.startswith(".")) if os.path.isdir(root) else []
                    # The tree has to draw before a business exists — step 0 is where one
                    # comes from. Send the shape of the milestones with nothing done, so the
                    # page never has to keep its own copy of the pipeline.
                    return self._send(200, {
                        "root": root, "businesses": names, "ai": ai,
                        "milestones": [{**m, "done": False} for m in MILESTONES],
                        "files": [], "answers": {},
                    })
                try:
                    folder = folder_for(root, name)
                except ValueError as e:
                    return self._send(400, {"error": str(e)})
                if not os.path.isdir(folder):
                    return self._send(200, {"root": root, "exists": False})
                return self._send(200, {"root": root, "exists": True, "business": name,
                                        "ai": ai, **artifact_state(folder)})

            if u.path == "/api/file":
                name = (q.get("business") or [""])[0]
                rel = (q.get("rel") or [""])[0]
                folder = folder_for(root, name)
                allowed = {r for r, _ in artifacts.BUNDLE_ORDER}
                if rel not in allowed:
                    return self._send(400, {"error": "not a bundle artifact"})
                p = os.path.join(folder, rel)
                if not os.path.exists(p):
                    return self._send(404, {"error": "not written yet"})
                # The brand manual is a page, not a listing — served as text/plain it
                # would open as its own source, which is exactly the artifact a person
                # is least able to use.
                ctype = ("text/html; charset=utf-8" if rel.endswith(".html")
                         else "application/json; charset=utf-8" if rel.endswith(".json")
                         else "text/plain; charset=utf-8")
                with open(p, "rb") as f:
                    return self._send(200, f.read(), ctype, raw=True)

            if u.path == "/api/bundle":
                name = (q.get("business") or [""])[0]
                folder = folder_for(root, name)
                data = artifacts.bundle_zip(folder)
                self.send_response(200)
                self.send_header("Content-Type", "application/zip")
                self.send_header("Content-Disposition",
                                 'attachment; filename="%s-bundle.zip"' %
                                 name.lower().replace(" ", "-"))
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                try: self.wfile.write(data)
                except (BrokenPipeError, ConnectionResetError): pass
                return

            return self._send(404, {"error": "not found"})

        def do_POST(self):
            u = urlparse(self.path); q = parse_qs(u.query)
            if not self._auth(q):
                return self._send(403, {"error": "bad token"})
            n = int(self.headers.get("Content-Length") or 0)
            if n > MAX_BODY:
                return self._send(413, {"error": "too large"})
            try:
                payload = json.loads(self.rfile.read(n).decode("utf-8") or "{}")
            except ValueError:
                return self._send(400, {"error": "bad json"})

            fn = ACTIONS.get((q.get("action") or [""])[0])
            if not fn:
                return self._send(400, {"error": "unknown action"})
            try:
                return self._send(200, fn(payload, root))
            except ValueError as e:
                return self._send(400, {"error": str(e)})
            except subprocess.TimeoutExpired:
                return self._send(504, {"error": "the engine took too long"})
            except Exception as e:
                return self._send(500, {"error": f"{type(e).__name__}: {e}"})

    return H


def serve(root: str, port: int = 0, open_browser: bool = True):
    """Local mode: loopback only, one-time token printed to the terminal."""
    token = secrets.token_urlsafe(16)

    # Threaded, because a build takes seconds and the page polls for progress the whole
    # time — a single-threaded server would block its own status endpoint behind the build.
    # allow_reuse_address must be a CLASS attribute; setting it on the instance is too late.
    class _Server(socketserver.ThreadingTCPServer):
        allow_reuse_address = True
        daemon_threads = True

    httpd = _Server(("127.0.0.1", port), make_handler(root, token))
    url = f"http://127.0.0.1:{httpd.server_address[1]}/?t={token}"
    print(f"\n  PLATFORM FACTORY  {url}")
    print(f"  ideas root        {root}")
    print("  Ctrl-C to stop\n")
    if open_browser:
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  stopped.\n")
    finally:
        httpd.server_close()
