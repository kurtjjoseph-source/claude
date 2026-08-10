#!/usr/bin/env python3
"""
lifecycle — renaming a business, and taking one down.

The factory is very good at bringing a business into existence and had no answer at all
for the two things that happen next: it turns out to be called something else, or it
should never have existed. Both were manual, and both are the kind of manual that leaves
a trail of half-updated files and a live site nobody remembers deploying.

Two operations, and the seam between them is the point:

  RENAME (deep)   the folder, the answers, the generated documents, the launch state, the
                  paths recorded inside past Forge runs, and — by recompiling rather than
                  editing — the spec, whose slug, project name and fingerprint all derive
                  from the name. What it CANNOT rename is a site already deployed under
                  the old slug, so it records those as **orphans** on the launch state.

  CLEANUP         reads those orphans, plus whatever the current spec points at, and takes
                  sites down; prunes old Forge runs; archives a business to a recoverable
                  trash folder; and — only when asked twice — purges the trash.

Three things are deliberately NOT renamed:

  * `consent-log.jsonl` — hash-chained and append-only. Rewriting a past line to say a new
    name is exactly the tampering the chain exists to detect. Instead the chain's genesis
    anchor (which was derived from the folder name) is pinned into launch-state.json before
    the folder moves, and the verifier reads it from there.
  * the business name inside past Forge `run.json` records — a run happened, under that
    name, at that time. Only the *paths* are repointed, because the folder genuinely moved.
  * a deployed URL already recorded in `prelaunch/signal.json` — that address is still live
    and still collecting; it is a fact, not a label. It is reported as stale, not edited.

Every destructive call takes `confirm` and refuses unless it exactly matches the business
name. Nothing here hard-deletes a business folder: it moves to `.factory-trash/`, which the
factory does not list and `purge_trash` is the only thing that empties.

Stdlib only.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import artifacts  # noqa: E402
import turnkey as tk  # noqa: E402

ENGINE = os.path.join(HERE, "turnkey.py")
TRASH_DIR = ".factory-trash"

# The generated prose documents. `business-idea.md` is not here because it is regenerated
# from the answers outright; these may carry operator edits, so the name is replaced in
# place rather than the file being rewritten from scratch.
PROSE = ["turnkey/business-profile.md", "turnkey/provisioning.md",
         "turnkey/blueprint.md", "turnkey/platform-spec.md"]


class LifecycleError(ValueError):
    """Something was refused, with the reason a person needs to fix it.

    A ValueError on purpose: the factory's request handler already answers one with a 400
    and the message alone, which is what a refusal is. Anything else would reach the
    person as `LifecycleError: to rename a business…` — the class name of an exception in
    front of a sentence written for them to read."""


# ===========================================================================
# small shared helpers
# ===========================================================================

def slugify(s: str) -> str:
    """The same slug `spec.py` computes — a business's project name is derived from it."""
    return re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-")[:64] or "business"


def _load(p, default=None):
    if not os.path.exists(p):
        return {} if default is None else default
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except ValueError:
        return {} if default is None else default


def _write(p, data):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    tmp = p + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmp, p)


def _run_engine(args, timeout=900) -> dict:
    p = subprocess.run([sys.executable, ENGINE] + args, capture_output=True,
                       text=True, timeout=timeout)
    return {"ok": p.returncode == 0, "stdout": (p.stdout or "").strip(),
            "stderr": (p.stderr or "").strip()}


def _dir_bytes(d: str) -> int:
    total = 0
    for root, _, files in os.walk(d):
        for fn in files:
            try:
                total += os.path.getsize(os.path.join(root, fn))
            except OSError:
                pass
    return total


def _human(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024 or unit == "GB":
            return f"{n:.0f} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024.0
    return f"{n:.1f} GB"


def _folder_for(root: str, name: str) -> str:
    """Resolve a business the way the server does — its rules, not a second copy of them.

    Reached through `sys.modules` first because `factory.py` is often the program being
    run, and importing it by name in that case would build a *second* copy of the module
    with its own state rather than reusing the one already running."""
    mod = sys.modules.get("factory") or sys.modules.get("__main__")
    fn = getattr(mod, "folder_for", None)
    if fn is None:
        import factory
        fn = factory.folder_for
    return fn(root, name)


def _require(confirm: str, expected: str, what: str):
    """Destructive things are typed out in full, or they do not happen."""
    if (confirm or "").strip() != expected:
        raise LifecycleError(
            f"to {what} you have to type the name exactly: '{expected}'. "
            f"Got {'nothing' if not confirm else repr(confirm.strip())}.")


def _log(folder: str, kind: str, data: dict):
    """Record it on the business's own decision log, where the rest of its history is."""
    try:
        tk._log_decision(folder, kind, data)
    except Exception:  # a folder in the trash has no state to log against — never fatal
        pass


# ===========================================================================
# what is out there, under this business's name
# ===========================================================================

def _serves(url: str, timeout: int = 8) -> bool:
    if not url or not url.startswith("http"):
        return False
    try:
        req = urllib.request.Request(url, method="GET",
                                     headers={"User-Agent": "turnkey-lifecycle/1"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return 200 <= r.status < 400
    except urllib.error.HTTPError as e:
        return 200 <= e.code < 400
    except Exception:
        return False


def site_inventory(folder: str, probe: bool = False) -> list:
    """Every hosting project this business is believed to own.

    Three sources, because no single one is complete: the current spec (what the next
    deploy would use), the convention (`<slug>` and `<slug>-prelaunch`, which is what
    earlier deploys used), and the orphan list a rename left behind."""
    state = _load(tk.state_path(folder))
    spec = _load(tk.spec_path(folder))
    sig = _load(os.path.join(folder, "prelaunch", "signal.json"))
    latest = _load(os.path.join(folder, "forge", "latest.json"))
    run = _load(latest.get("state", "")) if latest.get("state") else {}
    art = run.get("artifacts") or {}

    name = state.get("business") or (spec.get("business") or {}).get("name") \
        or os.path.basename(folder.rstrip("/"))
    slug = (spec.get("business") or {}).get("slug") or slugify(name)

    found = {}

    def belongs(project: str, url: str) -> bool:
        """Whether that address is plausibly THIS project's.

        The check matters most right after a rename, when the recorded address still
        reads `ferry-coffee-…` and the project is now `harbour-roasters`. Hanging the old
        URL on the new project would show a site as deployed that has never been built,
        and — worse — would offer to take down an address that belongs to the orphan."""
        if not url.startswith("http"):
            return False
        host = url.split("//", 1)[-1].split("/", 1)[0].split(":")[0]
        first = host.split(".", 1)[0]
        return first == project or first.startswith(project + "-")

    def add(project, url, role, why):
        if not project:
            return
        e = found.setdefault(project, {"project": project, "url": "", "role": role,
                                       "why": why, "current": True})
        if url and not e["url"] and belongs(project, url):
            e["url"] = url

    add(((spec.get("deploy") or {}).get("project")) or slug,
        art.get("alias") or art.get("url", ""), "platform",
        "the project the next deploy writes to")
    add(slug, art.get("alias") or art.get("url", ""), "platform",
        "the project the slug resolves to")
    add(slug + "-prelaunch", sig.get("url", ""), "funnel",
        "the waitlist funnel — this is the address the outreach points at")

    # An orphan carries its own URL, recorded at the moment the rename made it one. That
    # is the last address it is known to have answered on, and no later run can restate it.
    for o in state.get("orphans") or []:
        e = found.setdefault(o["project"], {"project": o["project"], "url": "",
                                            "role": o.get("role", ""), "why": "",
                                            "current": False})
        e["current"] = False
        e["why"] = o.get("why") or "left behind by a rename"
        if o.get("url"):
            e["url"] = o["url"]

    out = sorted(found.values(), key=lambda x: (x["current"] is False, x["project"]))
    for e in out:
        e["deployed"] = e["url"].startswith("http")
    if probe:
        for e in out:
            e["serving"] = _serves(e["url"]) if e["deployed"] else None
    return out


def run_inventory(folder: str) -> dict:
    """The Forge runs on disk. This is where a business's disk footprint actually goes:
    every run keeps its whole build, so ten builds is ten copies of the site."""
    d = os.path.join(folder, "forge")
    latest = _load(os.path.join(d, "latest.json"))
    keep_id = latest.get("run") or ""
    runs = []
    if os.path.isdir(d):
        for entry in sorted(os.listdir(d), reverse=True):
            p = os.path.join(d, entry)
            if not os.path.isdir(p):
                continue
            r = _load(os.path.join(p, "run.json"))
            runs.append({"id": entry, "bytes": _dir_bytes(p),
                         "outcome": r.get("outcome"), "elapsed": r.get("elapsed"),
                         "latest": entry == keep_id})
    return {"runs": runs, "bytes": sum(r["bytes"] for r in runs),
            "human": _human(sum(r["bytes"] for r in runs)), "latest": keep_id}


def inventory(folder: str, probe: bool = False) -> dict:
    """Everything a person needs before deciding to rename or take something down."""
    state = _load(tk.state_path(folder))
    ri = run_inventory(folder)
    return {
        "business": state.get("business") or os.path.basename(folder.rstrip("/")),
        "folder": folder,
        "bytes": _dir_bytes(folder),
        "human": _human(_dir_bytes(folder)),
        "sites": site_inventory(folder, probe=probe),
        "runs": ri,
        "orphans": state.get("orphans") or [],
        "renames": state.get("renames") or [],
        "consent_lines": len(tk.read_consent_lines(folder)) if os.path.isdir(folder) else 0,
    }


# ===========================================================================
# deep rename
# ===========================================================================

def _replace_in_file(path: str, old: str, new: str) -> int:
    if not os.path.exists(path) or old == new:
        return 0
    with open(path, encoding="utf-8") as f:
        text = f.read()
    n = text.count(old)
    if not n:
        return 0
    with open(path, "w", encoding="utf-8") as f:
        f.write(text.replace(old, new))
    return n


def _repoint_one(s: str, old_prefix: str, new_prefix: str) -> str:
    """One recorded path, after the folder it names has moved.

    Two rules, because one is not enough. The prefix rule handles the ordinary case: the
    path starts where the folder used to be. The segment rule handles the case that
    actually bites — a folder that had *already* been moved once by hand, so its records
    point somewhere that is neither the old location nor the new one. There the only
    reliable landmark is the business's own directory name, so the path is rebuilt from
    the last time that segment appears. Everything before it is wherever the folder used
    to live and is exactly what is being replaced."""
    # A local build's artifacts are recorded as file:// URLs. They are paths wearing a
    # scheme, they go stale the same way, so they are repointed the same way.
    if s.startswith("file://"):
        return "file://" + _repoint_one(s[7:], old_prefix, new_prefix)
    if s.startswith(old_prefix):
        return new_prefix + s[len(old_prefix):]
    seg = os.sep + os.path.basename(old_prefix.rstrip(os.sep)) + os.sep
    i = s.rfind(seg)
    if i != -1 and os.path.isabs(s):
        return new_prefix + s[i + len(seg) - 1:]
    return s


def _repoint_paths(obj, old_prefix: str, new_prefix: str):
    """Rewrite recorded absolute paths after a folder moves. Paths only — never a name.

    A run record says a build happened in a directory. The directory moved, so the path
    is now wrong and repointing it makes the record true again. Rewriting the *business
    name* in the same record would make it say something that never happened."""
    if isinstance(obj, dict):
        return {k: _repoint_paths(v, old_prefix, new_prefix) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_repoint_paths(v, old_prefix, new_prefix) for v in obj]
    if isinstance(obj, str) and (os.sep in obj) and not obj.startswith("http"):
        return _repoint_one(obj, old_prefix, new_prefix)
    return obj


def rename(root: str, old_name: str, new_name: str, confirm: str = None,
           recompile: bool = True, move_sites: bool = False, actor: str = "VOM") -> dict:
    """Rename a business everywhere it is written down.

    `confirm` is only required when the business has already deployed something public,
    because that is the case where the rename cannot finish the job on its own: the old
    site keeps serving under the old slug until cleanup takes it down.

    `move_sites` renames the hosting projects too, so a deployment follows the business
    rather than being orphaned by it. It is off by default and asked for separately,
    because it changes a **published address**: the old one stops answering for everybody
    who has it. Left off, the old projects are recorded as orphans and keep serving until
    somebody decides what to do with them — which is the safe default, not the tidy one."""
    new_name = (new_name or "").strip()
    if not new_name:
        raise LifecycleError("the new name cannot be empty")

    src = _folder_for(root, old_name)
    if not os.path.isdir(src):
        raise LifecycleError(f"there is no business at '{old_name}'")

    # Rename inside its own parent — a business several levels down (a Forge demo) is
    # renamed where it lives, not hoisted to the ideas root.
    parent = os.path.dirname(src)
    dst = os.path.join(parent, new_name)
    if os.path.sep in new_name or new_name in (".", "..") or new_name.startswith("."):
        raise LifecycleError("the new name has to be a plain folder name")
    if os.path.realpath(dst) == os.path.realpath(src):
        return {"ok": True, "unchanged": True, "folder": src,
                "note": "that is already its name"}
    if os.path.exists(dst):
        raise LifecycleError(f"'{new_name}' already exists next to it — pick another name "
                             "or archive that one first")

    state = _load(tk.state_path(src))
    was = state.get("business") or os.path.basename(src.rstrip("/"))
    old_slug = slugify(was)
    new_slug = slugify(new_name)

    sites = site_inventory(src)
    public = [s for s in sites if s.get("url", "").startswith("http")]
    if public:
        _require(confirm, was, "rename a business that has already published something")

    changed, notes = [], []

    # ---- 1. pin the consent chain's genesis BEFORE the folder moves -------------
    # The anchor was derived from the folder name. Once the folder is called something
    # else, a verifier recomputing it from the basename reports a broken chain on a log
    # that was never touched. Writing it down is the difference between a chain that
    # survives a rename and one that only looked tamper-evident.
    if os.path.exists(tk.state_path(src)):
        if not state.get("consent_genesis"):
            state["consent_genesis"] = "GENESIS:" + os.path.basename(src.rstrip("/"))
            notes.append("pinned the consent chain's genesis anchor before moving")
        _write(tk.state_path(src), state)

    # ---- 2. move it -------------------------------------------------------------
    os.rename(src, dst)
    changed.append(f"folder  {os.path.basename(src)} -> {new_name}")

    # ---- 3. the answers, and the idea file regenerated from them ----------------
    ans_path = os.path.join(dst, "turnkey", "factory-answers.json")
    ans = _load(ans_path)
    if ans:
        ans["name"] = new_name
        _write(ans_path, ans)
        changed.append("turnkey/factory-answers.json")
    idea_p = os.path.join(dst, "business-idea.md")
    if ans and os.path.exists(idea_p):
        with open(idea_p, "w", encoding="utf-8") as f:
            f.write(artifacts.idea_md(ans))
        changed.append("business-idea.md (regenerated)")
    elif _replace_in_file(idea_p, was, new_name):
        changed.append("business-idea.md")

    # ---- 4. the hosting projects, if the rename was asked to carry them ----------
    # Done before the launch state is written, so what lands in `orphans` is what is
    # actually still deployed under the old slug rather than what was a moment ago.
    moved, moved_from = [], set()
    if move_sites:
        for s in sites:
            if not s.get("deployed"):
                continue
            # The new name is derived from the project's ROLE, not from stripping the
            # current slug off it. An orphan left by an earlier rename carries a slug that
            # is neither the old one nor the new one, and a prefix rule would silently skip
            # exactly the projects somebody opened this panel to deal with.
            target = new_slug + ("-prelaunch" if s["project"].endswith("-prelaunch") else "")
            if target == s["project"]:
                continue
            r = rename_project(s["project"], target)
            moved.append(r)
            if r["ok"]:
                moved_from.add(s["project"])
                changed.append(f"hosting project  {s['project']} -> {target}"
                               + (f"  ({r['url']})" if r.get("url") else ""))
            else:
                notes.append(f"could not rename the hosting project '{s['project']}': "
                             + r.get("error", "unknown"))
        if moved_from:
            try:
                tk.append_consent(
                    dst, "W4_website",
                    "RENAME the published hosting project(s): " + ", ".join(sorted(moved_from)),
                    actor, "operator console (factory · rename)", "YES",
                    evidence=f"operator renamed '{was}' to '{new_name}' and asked for the "
                             "deployed sites to move with it",
                    scope="changing the public address of these sites. The old addresses "
                          "stop answering for everyone holding them; the content and the "
                          "build history move to the new address.")
            except Exception as e:
                notes.append(f"the sites moved, but the consent line failed to write: {e}")

    # ---- 5. launch state --------------------------------------------------------
    st = _load(tk.state_path(dst))
    if st:
        st = _repoint_paths(st, src, dst)
        st["business"] = new_name
        st["idea_folder"] = dst
        st["updated"] = tk.now_iso()
        st.setdefault("renames", []).append(
            {"from": was, "to": new_name, "at": tk.now_iso(),
             "old_slug": old_slug, "new_slug": new_slug,
             "sites_moved": sorted(moved_from)})
        # ---- 6. anything STILL deployed under the old slug is now an orphan -----
        # A project that just moved is no longer orphaned by anything — including by an
        # earlier rename, which is the case that made moving it worth offering.
        orphans = [o for o in (st.get("orphans") or []) if o["project"] not in moved_from]
        for s in sites:
            # Only something that is actually serving can be orphaned. The projects a slug
            # *would* have used if it had ever deployed are not left behind by anything —
            # recording those turns the orphan list, which exists to name the addresses
            # still answering under an old name, into a list of names that were considered.
            if not s.get("deployed") or s["project"] in moved_from:
                continue
            if not s["project"].startswith(old_slug):
                continue
            if any(o["project"] == s["project"] for o in orphans):
                continue
            orphans.append({"project": s["project"], "url": s.get("url", ""),
                            "role": s.get("role", ""), "at": tk.now_iso(),
                            "why": f"deployed as '{was}'; the business is now '{new_name}'"})
        st["orphans"] = orphans
        if not orphans:
            st.pop("orphans")
        _write(tk.state_path(dst), st)
        changed.append("turnkey/launch-state.json")

    # ---- 6. the prose documents -------------------------------------------------
    for rel in PROSE:
        n = _replace_in_file(os.path.join(dst, rel), was, new_name)
        if n:
            changed.append(f"{rel} ({n}×)")

    # ---- 7. past Forge runs: paths repointed, names left exactly as they were ----
    forge_dir = os.path.join(dst, "forge")
    touched = 0
    if os.path.isdir(forge_dir):
        for fn in ["latest.json"] + [os.path.join(d, "run.json")
                                     for d in os.listdir(forge_dir)
                                     if os.path.isdir(os.path.join(forge_dir, d))]:
            p = os.path.join(forge_dir, fn)
            data = _load(p, None)
            if not data:
                continue
            fixed = _repoint_paths(data, src, dst)
            if fixed != data:
                _write(p, fixed)
                touched += 1
    if touched:
        changed.append(f"forge run records repointed ({touched} file{'s' if touched != 1 else ''})")

    # ---- 8. recompile, so the slug/project/fingerprint are actually the new ones -
    recompiled = None
    if recompile and os.path.exists(tk.spec_path(dst)):
        spec = _load(tk.spec_path(dst))
        org = ((_load(tk.state_path(dst)).get("blueprint") or {}).get("org_type")
               or spec.get("business", {}).get("org_type") or "service_business")
        target = (spec.get("deploy") or {}).get("target") or "local"
        dom = ((spec.get("deploy") or {}).get("domain") or {}).get("value") or ""
        r = _run_engine(["blueprint", dst, "--org-type", org, "--save"])
        if r["ok"]:
            args = ["spec", dst, "--target", target, "--save"]
            if dom and not dom.startswith(old_slug):
                args += ["--domain", dom]
            r = _run_engine(args)
        recompiled = {"ok": r["ok"], "error": (r["stderr"] or r["stdout"])[-500:] if not r["ok"] else ""}
        if r["ok"]:
            spec = _load(tk.spec_path(dst))
            with open(os.path.join(dst, "turnkey", "provisioning.md"), "w", encoding="utf-8") as f:
                f.write(artifacts.provisioning_md(dst, _load(tk.state_path(dst)), spec,
                                                  tk.load_operator(None)))
            changed.append("turnkey/platform-spec.json + .md, blueprint.md, provisioning.md "
                           "(recompiled — new slug, new project, new fingerprint)")
        else:
            notes.append("the spec did not recompile; the documents carry the new name but "
                         "platform-spec.json still holds the old slug — fix the error, then "
                         "run provisioning again")

    stale = [s for s in sites
             if s.get("url", "").startswith("http") and s["project"] not in moved_from]
    if stale:
        notes.append(f"{len(stale)} deployed site(s) still serve under '{old_slug}'. "
                     "Either take them down in Published sites, or rename again with "
                     "'move the live addresses too' ticked.")
    if moved_from:
        notes.append("The old addresses stopped answering the moment the projects moved. "
                     "Anything printed, linked or indexed pointing at "
                     f"{old_slug}.vercel.app now leads nowhere.")

    # The last build is a generated copy of the site with the old name written through
    # every page. Editing those pages would be renaming a photograph — the build is
    # regenerated from the spec, which is now correct, so the answer is to rebuild.
    if os.path.isdir(os.path.join(dst, "forge")):
        notes.append(f"The last build still reads '{was}' on every page — builds are "
                     "generated, not edited. Run step 5 again and the new name is in it.")

    _log(dst, "rename", {"from": was, "to": new_name, "old_slug": old_slug,
                         "new_slug": new_slug, "moved": sorted(moved_from),
                         "orphans": [s["project"] for s in stale]})

    return {"ok": True, "from": was, "to": new_name, "folder": dst,
            "old_slug": old_slug, "new_slug": new_slug,
            "changed": changed, "notes": notes, "recompiled": recompiled,
            "moved_sites": moved, "stale_sites": stale}


# ===========================================================================
# taking sites down
# ===========================================================================

def _remove_project(project: str) -> dict:
    """Delete one hosting project. API when a token is set, CLI otherwise — the same
    either-rail rule Forge deploys under, so this works on the laptop and in a container."""
    import vercel_api
    if vercel_api.available():
        token, team = vercel_api.token_from_env()
        try:
            vercel_api._req("DELETE", f"/v9/projects/{project}", token, team=team)
            return {"ok": True, "project": project, "via": "api"}
        except vercel_api.VercelError as e:
            msg = str(e)
            if "404" in msg or "not_found" in msg:
                return {"ok": True, "project": project, "via": "api", "already_gone": True}
            return {"ok": False, "project": project, "via": "api", "error": msg}

    cli = shutil.which("vercel")
    if not cli:
        return {"ok": False, "project": project, "via": "none",
                "error": "no VERCEL_TOKEN in the environment and no vercel CLI on PATH, so "
                         "there is nothing to delete the project with. Set VERCEL_TOKEN or "
                         "install the CLI."}

    if not _project_exists(cli, project):
        return {"ok": True, "project": project, "via": "cli", "already_gone": True}

    # `vercel project remove` asks "Are you sure?" and there is no flag that skips it —
    # `--yes` does not exist on this command and `--non-interactive` does not suppress
    # it. With no answer on stdin the CLI reads EOF, takes it as **no**, and exits 0.
    # A delete that silently did nothing and reported success is the worst outcome
    # available here: it says an address is down while it is still serving. So the
    # answer is supplied, and the result is then read from the host rather than from
    # the exit code — the exit code has already been caught lying about this once.
    p = subprocess.run([cli, "project", "remove", project], input="y\n",
                       capture_output=True, text=True, timeout=180)
    out = ((p.stdout or "") + (p.stderr or "")).strip()
    if _project_exists(cli, project):
        return {"ok": False, "project": project, "via": "cli",
                "error": "the host still has this project after the delete — it was not "
                         "removed. " + out[-300:]}
    return {"ok": True, "project": project, "via": "cli"}


def _project_exists(cli: str, project: str) -> bool:
    """Whether the host still has this project. The one question worth asking directly."""
    p = subprocess.run([cli, "project", "inspect", project],
                       capture_output=True, text=True, timeout=120)
    return p.returncode == 0


def rename_project(old: str, new: str) -> dict:
    """Rename a hosting project, so a deployment follows the business instead of being
    orphaned by it.

    This is the difference between a rename that is deep and one that only reaches disk.
    It is also a change to a **published address**: `old.vercel.app` stops answering and
    `new.vercel.app` starts, for everyone who has the old one — anybody holding a link, a
    QR code on a printed card, a search result. So it is never implied by a rename; it is
    asked for separately, and refused rather than guessed at when the new name is taken."""
    import vercel_api
    if vercel_api.available():
        token, team = vercel_api.token_from_env()
        try:
            vercel_api._req("PATCH", f"/v9/projects/{old}", token, {"name": new}, team)
            return {"ok": True, "from": old, "to": new, "via": "api"}
        except vercel_api.VercelError as e:
            return {"ok": False, "from": old, "to": new, "via": "api", "error": str(e)}

    cli = shutil.which("vercel")
    if not cli:
        return {"ok": False, "from": old, "to": new, "via": "none",
                "error": "no VERCEL_TOKEN and no vercel CLI on PATH — nothing to rename the "
                         "project with."}
    if not _project_exists(cli, old):
        return {"ok": False, "from": old, "to": new, "via": "cli",
                "error": f"the host has no project called '{old}'"}
    if _project_exists(cli, new):
        return {"ok": False, "from": old, "to": new, "via": "cli",
                "error": f"'{new}' already exists at the host — renaming onto it would "
                         "take an address that belongs to something else"}
    # Same prompt, same reason for answering it, same refusal to trust the exit code.
    p = subprocess.run([cli, "project", "rename", old, new], input="y\n",
                       capture_output=True, text=True, timeout=180)
    out = ((p.stdout or "") + (p.stderr or "")).strip()
    if not _project_exists(cli, new):
        return {"ok": False, "from": old, "to": new, "via": "cli",
                "error": "the host has no project under the new name afterwards — it was "
                         "not renamed. " + out[-300:]}
    return {"ok": True, "from": old, "to": new, "via": "cli",
            "url": f"https://{new}.vercel.app"}


def delete_sites(folder: str, projects: list, confirm: str = None,
                 actor: str = "VOM") -> dict:
    """Take deployed sites down.

    Unpublishing is as outward-facing as publishing was — an address someone was given
    stops answering — so it is confirmed by name, logged on the consent chain with the
    same weight the deploy had, and reports each project separately rather than as one
    'done'."""
    state = _load(tk.state_path(folder))
    name = state.get("business") or os.path.basename(folder.rstrip("/"))
    _require(confirm, name, "take a published site down")
    if not projects:
        raise LifecycleError("name at least one project to take down")

    known = {s["project"] for s in site_inventory(folder)}
    unknown = [p for p in projects if p not in known]
    if unknown:
        raise LifecycleError("these are not projects this business owns: " + ", ".join(unknown))

    results = [_remove_project(p) for p in projects]
    gone = [r["project"] for r in results if r["ok"]]

    if gone and os.path.exists(tk.state_path(folder)):
        st = _load(tk.state_path(folder))
        st["orphans"] = [o for o in (st.get("orphans") or []) if o["project"] not in gone]
        st.setdefault("taken_down", []).extend(
            {"project": p, "at": tk.now_iso(), "by": actor} for p in gone)
        st["updated"] = tk.now_iso()
        _write(tk.state_path(folder), st)

    if gone:
        try:
            tk.append_consent(
                folder, "W4_website",
                "TAKE DOWN the deployed site(s): " + ", ".join(gone),
                actor, "operator console (factory · cleanup)", "YES",
                evidence=f"operator typed the business name to confirm removal of "
                         f"{len(gone)} hosting project(s)",
                scope="deleting these hosting projects and every deployment under them. "
                      "Irreversible: the addresses stop answering and the build history "
                      "at the host is gone. The local artifacts are untouched.")
        except Exception as e:
            results.append({"ok": True, "project": "(consent log)",
                            "error": f"removed, but the consent line failed to write: {e}"})

    _log(folder, "sites_deleted", {"projects": gone,
                                   "failed": [r["project"] for r in results if not r["ok"]]})
    return {"ok": all(r["ok"] for r in results), "results": results, "removed": gone}


# ===========================================================================
# local cleanup
# ===========================================================================

def prune_runs(folder: str, keep: int = 2) -> dict:
    """Delete old Forge run directories, newest `keep` retained.

    The newest run and whatever `latest.json` points at are never candidates — that is
    the run the factory reads the live URL out of."""
    keep = max(1, int(keep))
    ri = run_inventory(folder)
    runs = ri["runs"]
    keepers = {r["id"] for r in runs[:keep]} | {ri["latest"]}
    doomed = [r for r in runs if r["id"] not in keepers]
    freed = 0
    removed = []
    for r in doomed:
        p = os.path.join(folder, "forge", r["id"])
        try:
            shutil.rmtree(p)
            freed += r["bytes"]
            removed.append(r["id"])
        except OSError as e:
            return {"ok": False, "error": f"could not remove {r['id']}: {e}",
                    "removed": removed, "freed": freed}
    if removed:
        _log(folder, "runs_pruned", {"removed": removed, "kept": sorted(keepers), "freed": freed})
    return {"ok": True, "removed": removed, "kept": sorted(k for k in keepers if k),
            "freed": freed, "human": _human(freed)}


def trash_dir(root: str) -> str:
    return os.path.join(root, TRASH_DIR)


def archive(root: str, name: str, confirm: str = None, reason: str = "") -> dict:
    """Move a business out of the factory without destroying it.

    Deliberately not a delete. The folder goes to `.factory-trash/`, which the factory
    does not list because it skips dotted names, so the business disappears from every
    picker while still being one `restore` away. What this does NOT do is take its sites
    down — an archived business with a live URL is still published, so that is reported
    back rather than assumed."""
    src = _folder_for(root, name)
    if not os.path.isdir(src):
        raise LifecycleError(f"there is no business at '{name}'")
    state = _load(tk.state_path(src))
    biz = state.get("business") or os.path.basename(src.rstrip("/"))
    _require(confirm, biz, "archive a business")

    live = [s for s in site_inventory(src) if s.get("url", "").startswith("http")]

    stamp = time.strftime("%Y%m%d-%H%M%S")
    dest_root = trash_dir(root)
    os.makedirs(dest_root, exist_ok=True)
    dst = os.path.join(dest_root, f"{os.path.basename(src.rstrip('/'))}__{stamp}")
    _log(src, "archived", {"to": dst, "reason": reason, "live_sites": [s["project"] for s in live]})
    shutil.move(src, dst)
    _write(os.path.join(dst, ".archived.json"), {
        "business": biz, "from": src, "at": tk.now_iso(), "reason": reason,
        "live_sites": live})

    return {"ok": True, "business": biz, "archived_to": dst,
            "live_sites": live,
            "note": ("This is out of the factory but NOT off the internet — "
                     f"{len(live)} site(s) still answer. Take them down first if that "
                     "was the intent.") if live else
                    "Nothing of this business was published, so nothing is still serving."}


def list_trash(root: str) -> list:
    d = trash_dir(root)
    if not os.path.isdir(d):
        return []
    out = []
    for entry in sorted(os.listdir(d), reverse=True):
        p = os.path.join(d, entry)
        if not os.path.isdir(p):
            continue
        meta = _load(os.path.join(p, ".archived.json"))
        out.append({"entry": entry, "business": meta.get("business", entry),
                    "at": meta.get("at", ""), "reason": meta.get("reason", ""),
                    "live_sites": meta.get("live_sites") or [],
                    "bytes": _dir_bytes(p), "human": _human(_dir_bytes(p))})
    return out


def restore(root: str, entry: str) -> dict:
    """Bring an archived business back. The whole reason archive is not a delete."""
    d = trash_dir(root)
    src = os.path.join(d, entry)
    if os.path.sep in entry or entry.startswith(".") or not os.path.isdir(src):
        raise LifecycleError(f"no archived business called '{entry}'")
    meta = _load(os.path.join(src, ".archived.json"))
    original = meta.get("from") or os.path.join(root, entry.split("__")[0])
    if os.path.exists(original):
        raise LifecycleError(f"'{os.path.basename(original)}' exists again — rename that one "
                             "first, or this restore would overwrite it")
    os.makedirs(os.path.dirname(original), exist_ok=True)
    shutil.move(src, original)
    junk = os.path.join(original, ".archived.json")
    if os.path.exists(junk):
        os.remove(junk)
    _log(original, "restored", {"from": src})
    return {"ok": True, "business": meta.get("business", entry), "folder": original}


def purge_trash(root: str, entry: str, confirm: str = None) -> dict:
    """The one hard delete in the whole factory, and it only ever reaches the trash.

    A business is never destroyed by any other call: `archive` moves it here first, so
    purging is always a second, separate decision made after seeing what it holds."""
    d = trash_dir(root)
    src = os.path.join(d, entry)
    if os.path.sep in entry or entry.startswith(".") or not os.path.isdir(src):
        raise LifecycleError(f"no archived business called '{entry}'")
    meta = _load(os.path.join(src, ".archived.json"))
    biz = meta.get("business", entry)
    _require(confirm, biz, "permanently destroy an archived business")

    live = meta.get("live_sites") or []
    if live:
        raise LifecycleError(
            f"'{biz}' was archived with {len(live)} site(s) still serving "
            f"({', '.join(s['project'] for s in live)}). Purging the folder deletes the only "
            "local record of what is deployed and leaves the sites up with nothing pointing "
            "at them. Restore it, take the sites down, then archive and purge.")

    size = _dir_bytes(src)
    shutil.rmtree(src)
    return {"ok": True, "business": biz, "freed": size, "human": _human(size)}


# ===========================================================================
# CLI — so none of this needs a browser
# ===========================================================================

def _print(obj):
    print(json.dumps(obj, indent=2, ensure_ascii=False))


def main(argv=None):
    import argparse
    ap = argparse.ArgumentParser(prog="lifecycle",
                                 description="rename a business, or take one down")
    ap.add_argument("--root", default=os.path.expanduser("~/Business Ideas"),
                    help="the ideas root")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("inventory", help="what exists locally and what is deployed")
    p.add_argument("business")
    p.add_argument("--probe", action="store_true", help="also check which URLs still answer")

    p = sub.add_parser("rename", help="deep rename — everywhere it is written down")
    p.add_argument("business")
    p.add_argument("new_name")
    p.add_argument("--confirm", default="", help="the CURRENT name, required once published")
    p.add_argument("--no-recompile", action="store_true")
    p.add_argument("--move-sites", action="store_true",
                   help="rename the hosting projects too — the LIVE address changes and "
                        "the old one stops answering")

    p = sub.add_parser("delete-sites", help="take deployed hosting projects down")
    p.add_argument("business")
    p.add_argument("projects", nargs="+")
    p.add_argument("--confirm", default="")
    p.add_argument("--actor", default="VOM")

    p = sub.add_parser("prune", help="delete old Forge run directories")
    p.add_argument("business")
    p.add_argument("--keep", type=int, default=2)

    p = sub.add_parser("archive", help="move a business to the trash (recoverable)")
    p.add_argument("business")
    p.add_argument("--confirm", default="")
    p.add_argument("--reason", default="")

    p = sub.add_parser("trash", help="list what is in the trash")
    p = sub.add_parser("restore", help="bring an archived business back")
    p.add_argument("entry")
    p = sub.add_parser("purge", help="permanently destroy one archived business")
    p.add_argument("entry")
    p.add_argument("--confirm", default="")

    a = ap.parse_args(argv)
    root = os.path.abspath(os.path.expanduser(a.root))

    try:
        if a.cmd == "inventory":
            _print(inventory(_folder_for(root, a.business), probe=a.probe))
        elif a.cmd == "rename":
            _print(rename(root, a.business, a.new_name, a.confirm,
                          recompile=not a.no_recompile, move_sites=a.move_sites))
        elif a.cmd == "delete-sites":
            _print(delete_sites(_folder_for(root, a.business), a.projects, a.confirm, a.actor))
        elif a.cmd == "prune":
            _print(prune_runs(_folder_for(root, a.business), a.keep))
        elif a.cmd == "archive":
            _print(archive(root, a.business, a.confirm, a.reason))
        elif a.cmd == "trash":
            _print(list_trash(root))
        elif a.cmd == "restore":
            _print(restore(root, a.entry))
        elif a.cmd == "purge":
            _print(purge_trash(root, a.entry, a.confirm))
    except (LifecycleError, ValueError) as e:
        print(f"refused: {e}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
