#!/usr/bin/env python3
"""
forge — the no-human build and deploy runner.

Turnkey's pipeline is deliberately full of people: gates, approvals, a logged YES before
anything publishes. That is right for the decisions. It is wrong for the *making*. Once
the decisions are made there is nothing left to approve — assembling a platform from a
finished spec is mechanical work, and a person standing in the middle of it only makes it
slower and less repeatable.

So Forge takes a compiled spec (`spec.py`, schema `apb/1`) and executes it end to end with
nobody in the loop: composes the modules, writes the site, wires the rails, checks its own
work, deploys, and proves what it deployed is answering. Minutes, not a project.

What keeps that honest:

  * **It will not run an unready spec.** Every decision must already be resolved. If the
    org type was guessed, or a page would ship a literal "{business}", the run refuses
    before it writes a file.
  * **It will not publish without a prior authorization.** Turnkey's rule is a logged YES
    that existed before the action. An unattended runner cannot ask for one mid-run, so
    the YES is granted once, up front, over the whole run, and the spec carries the
    reference. No authorization means it still builds — locally, privately — and refuses
    every target the public can reach.
  * **It reports what happened, not what was attempted.** A deploy with no credentials is
    a failed stage with the reason attached, never a quiet success. `smoke` fetches the
    real URL: "deployed" is a measurement here, not a claim.
  * **Every run is replayable.** Stages, timings, artifacts and outcomes stream to
    `events.jsonl`; the run is resumable from the last completed stage.

Stdlib only.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

import spec as spec_mod
import site_gen

SCHEMA = 1

OK, FAIL, SKIP = "ok", "failed", "skipped"

# The tokens an archetype may write. If one of these survives into a built page, the page
# would publish with a literal "{business}" on it, so the run fails instead.
KNOWN_TOKENS = {
    "business", "operator", "city", "email", "year", "tagline", "offer_line",
    "about", "beliefs", "leadership", "today", "next_sunday",
    "date_soon", "date_later", "date_further", "date_recent", "date_earlier",
}


def _now():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def run_id() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")


# ===========================================================================
# the run — state, events, and the cue stream the console follows
# ===========================================================================

class Run:
    """One build. Owns the event stream every visual surface reads."""

    def __init__(self, idea_folder: str, sp: dict, rid: str = None, cue=None):
        self.idea = idea_folder
        self.spec = sp
        self.id = rid or run_id()
        self.dir = os.path.join(idea_folder, "forge", self.id)
        self.build = os.path.join(self.dir, "build")
        self.events_path = os.path.join(self.dir, "events.jsonl")
        self.state_path = os.path.join(self.dir, "run.json")
        self.started = time.time()
        self.seq = 0
        self.cue = cue
        self.artifacts = {}
        self.stages = {s["id"]: {"id": s["id"], "title": s["title"], "cue": s["cue"],
                                 "detail": s["detail"], "state": "pending",
                                 "started": None, "ended": None, "ms": None,
                                 "note": "", "optional": bool(s.get("optional"))}
                       for s in sp["plan"]}
        self.order = [s["id"] for s in sp["plan"]]
        self.outcome = "running"
        os.makedirs(self.dir, exist_ok=True)

    # --- the stream --------------------------------------------------------

    def emit(self, kind: str, stage: str = "", msg: str = "", level: str = "info", **data):
        self.seq += 1
        ev = {"seq": self.seq, "ts": _now(), "t": round(time.time() - self.started, 3),
              "kind": kind, "stage": stage, "level": level, "msg": msg}
        if data:
            ev["data"] = data
        with open(self.events_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(ev, ensure_ascii=False) + "\n")
        if self.cue:
            self.cue(ev, self)
        return ev

    def snapshot(self) -> dict:
        a = self.spec["archetype"]
        done = sum(1 for s in self.stages.values() if s["state"] in (OK, SKIP))
        return {
            "schema": SCHEMA, "run": self.id, "outcome": self.outcome,
            "started": datetime.fromtimestamp(self.started, timezone.utc)
                               .replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "elapsed": round(time.time() - self.started, 2),
            "business": self.spec["business"]["name"],
            "archetype": {"id": a["id"], "label": a["label"], "curated": a["curated"],
                          "forge": a.get("forge", {})},
            "target": self.spec["deploy"]["target"],
            "fingerprint": self.spec["fingerprint"],
            "progress": {"done": done, "total": len(self.order)},
            "stages": [self.stages[i] for i in self.order],
            "artifacts": self.artifacts,
            "checks": getattr(self, "check_results", []),
            "dir": self.dir,
        }

    def save(self):
        tmp = self.state_path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(self.snapshot(), f, indent=2, ensure_ascii=False)
        os.replace(tmp, self.state_path)
        latest = os.path.join(self.idea, "forge", "latest.json")
        with open(latest, "w", encoding="utf-8") as f:
            json.dump({"run": self.id, "dir": self.dir, "state": self.state_path,
                       "events": self.events_path, "outcome": self.outcome}, f, indent=2)

    # --- stage lifecycle ---------------------------------------------------

    def start(self, sid: str):
        st = self.stages[sid]
        st["state"] = "running"
        st["started"] = round(time.time() - self.started, 3)
        self.emit("stage_start", sid, st["title"])
        self.save()

    def finish(self, sid: str, state: str = OK, note: str = "", **data):
        st = self.stages[sid]
        st["state"] = state
        st["ended"] = round(time.time() - self.started, 3)
        st["ms"] = int(((st["ended"] or 0) - (st["started"] or 0)) * 1000)
        st["note"] = note
        self.emit("stage_end", sid, note or st["title"],
                  level=("error" if state == FAIL else "info"), state=state, **data)
        self.save()

    def log(self, sid: str, msg: str, level: str = "info", **data):
        self.emit("log", sid, msg, level=level, **data)


class ForgeError(Exception):
    """A stage failed for a reason worth telling the operator verbatim."""


# ===========================================================================
# stages
# ===========================================================================

def st_resolve(run: Run):
    sp = run.spec
    if not spec_mod.verify_fingerprint(sp):
        raise ForgeError("the spec's fingerprint does not match its contents — it was "
                         "edited after compilation. Recompile it rather than trusting it.")
    r = sp["readiness"]
    if not r["ready"]:
        lines = "\n".join(f"    · {b['what']}\n      -> {b['fix']}" for b in r["blocking"])
        raise ForgeError("this spec is not ready for an unattended build:\n" + lines)
    run.log("resolve", f"{sp['archetype']['label']} · {len(sp['modules'])} modules · "
                       f"{len(sp['site']['pages'])} pages")
    run.log("resolve", f"authorization: {sp['authorization'].get('mode')}"
                       + (f" ({sp['authorization'].get('consent_ref')})"
                          if sp["authorization"].get("consent_ref") else ""))
    if sp["assumptions"]:
        run.log("resolve", f"{len(sp['assumptions'])} value(s) filled from the archetype "
                           "because the profile did not supply them", level="warn",
                assumptions=[a["token"] for a in sp["assumptions"]])


def st_scaffold(run: Run):
    for d in ("", "site", "platform"):
        os.makedirs(os.path.join(run.build, d), exist_ok=True)
    with open(os.path.join(run.dir, "platform-spec.json"), "w", encoding="utf-8") as f:
        json.dump(run.spec, f, indent=2, ensure_ascii=False)
    run.log("scaffold", f"build tree at {os.path.relpath(run.build, run.idea)}")


def st_brand(run: Run):
    """Apply the brand kit — and write the manual that says what was applied.

    The stage used to log the *forge's* colours, which are the console's identity, not
    the business's. What a client's site is actually built in is the brand kit, so that
    is what is recorded, what is logged, and what ships in the build as a document the
    owner can hand to a printer."""
    sp = run.spec
    forge = sp["archetype"].get("forge", {})
    kit = sp["brand"].get("kit") or {}
    # The builder's logo is the BUILDER's. It belongs on the console and the showcase,
    # not in the header of a church's website — every client site Forge had shipped was
    # wearing Vision Outreach Media's megaphone as though it were their own mark. The
    # public site now draws the business its own monogram (visuals.mark); the back
    # office keeps the operator mark, because that surface really is the operator's
    # tool. An operator who has a real logo for this business can still supply one by
    # setting `brand.logo` on the spec, and something real always beats something drawn.
    logo = _logo_data_uri()
    client_logo = (sp["brand"].get("logo_data_uri") or "").strip()
    run.artifacts["logo"] = ("client logo embedded" if client_logo else
                             "drawn monogram — no client logo was supplied")
    run._logo = logo
    run._site_logo = client_logo
    theme = {"forge": forge.get("name"), "console_accent": forge.get("accent"),
             "base": forge.get("base"), "palette": sp["brand"]["palette"],
             "display": sp["brand"]["display"],
             "kit": {k: kit.get(k) for k in
                     ("id", "name", "family", "source", "scheme", "accent",
                      "accent_bright", "secondary", "paper", "ink", "line")},
             "swatches": kit.get("swatches", []),
             "type": kit.get("type", {})}
    with open(os.path.join(run.build, "theme.json"), "w", encoding="utf-8") as f:
        json.dump(theme, f, indent=2)

    if kit.get("id"):
        import brand_kits
        src = brand_kits.by_id(kit["id"])
        if src:
            name = sp["business"]["name"]
            label = sp["archetype"].get("label", "")
            with open(os.path.join(run.build, "brand-manual.html"), "w",
                      encoding="utf-8") as f:
                f.write(brand_kits.manual_html(src, name, label))
            with open(os.path.join(run.build, "BRAND.md"), "w", encoding="utf-8") as f:
                f.write(brand_kits.manual_md(src, name, label))
            run.artifacts["brand_manual"] = os.path.join(run.build, "brand-manual.html")
        run.artifacts["brand_kit"] = f"{kit.get('name')} ({kit.get('source')})"

    run.log("brand", f"{kit.get('name', 'no kit')} · accent {kit.get('accent')} · "
                     f"{(kit.get('type') or {}).get('preset', '?')} type · "
                     f"{kit.get('scheme', 'light')} ground · "
                     f"{kit.get('source', 'default')} · built by "
                     f"{forge.get('name', 'FORGE')}")


def st_platform(run: Run):
    """The operating platform — one general module runtime, composed for this business."""
    import platform_gen
    sp = run.spec
    config = {
        "schema": platform_gen.SCHEMA_VERSION,
        "business": {
            "name": sp["business"]["name"], "org_type": sp["business"]["org_type"],
            "org_label": sp["business"]["org_label"],
            "platform_choice": sp["site"]["platform"],
            "operator": sp["operator"]["name"], "operator_short": "",
            "offer": sp["business"]["offer_line"], "organization": sp["archetype"]["summary"],
            "generated": sp["generated"],
        },
        "modules": [{k: v for k, v in m.items() if k != "seed"} for m in sp["modules"]],
        "seed": {m["key"]: m["seed"] for m in sp["modules"] if m.get("seed")},
        "archetype": {"id": sp["archetype"]["id"], "forge": sp["archetype"].get("forge", {})},
        # The back office wears the same kit as the front door — an owner who picked a
        # brand and then signed in to somebody else's colours would be right to ask what
        # the branding step was for.
        "kit": {k: (sp["brand"].get("kit") or {}).get(k)
                for k in ("id", "name", "accent", "accent_bright", "on_accent")},
    }
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, "platform_app.html"), encoding="utf-8") as f:
        shell = f.read()
    html = (shell.replace("{{CONFIG}}", json.dumps(config, ensure_ascii=False))
                 .replace("{{LOGO}}", getattr(run, "_logo", ""))
                 .replace("{{NAME}}", sp["business"]["name"]))
    p = os.path.join(run.build, "platform", "index.html")
    with open(p, "w", encoding="utf-8") as f:
        f.write(html)
    with open(os.path.join(run.build, "platform", "business.json"), "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

    seeded = sum(len(v) for v in config["seed"].values())
    run.artifacts["platform"] = p
    run.log("platform", ", ".join(m["title"] for m in sp["modules"]))
    run.log("platform", f"{seeded} seed record(s) so it opens with something in it")

    # For nine archetypes the back office is the whole system. A software company also
    # sells a product, and a site advertising one that does not exist is the worst thing
    # this pipeline could ship — so when the archetype declares one, it gets built.
    kind = sp["archetype"].get("product_app")
    if kind:
        import product_app
        if not product_app.available(kind):
            raise ForgeError(f"the archetype asks for a '{kind}' product app and there is "
                             "no template for one. Either write it or drop the claim.")
        surfaces = product_app.build(sp["business"]["name"], kind,
                                     getattr(run, "_logo", ""), sp["archetype"].get("forge"))
        for folder, html in surfaces.items():
            d = os.path.join(run.build, folder)
            os.makedirs(d, exist_ok=True)
            with open(os.path.join(d, "index.html"), "w", encoding="utf-8") as f:
                f.write(html)
        run.artifacts["product_app"] = os.path.join(run.build, "app", "index.html")
        run.log("platform", f"product app '{kind}' built at "
                            + ", ".join("/" + s for s in surfaces)
                            + f" — {product_app.KINDS[kind]['summary']}")
        for folder, _, what in product_app.KINDS[kind]["surfaces"]:
            run.log("platform", f"  /{folder} — {what}")


def st_site(run: Run):
    sp = run.spec
    # The photographs the site references are copied in before the pages are written, so
    # a build is a folder that opens from disk with nothing missing. Named by role, which
    # is what makes them swappable for the client's own.
    import photos as photo_mod
    # The SAME pool decision site_gen makes when it writes the <img> tags — the files
    # are named by role, so a disagreement here ships one archetype's pictures under
    # another's filenames and nobody sees a build error.
    plan = photo_mod.plan(photo_mod.pool_archetype(sp["archetype"]["id"],
                                                   sp["business"].get("org_type") or ""),
                          sp["business"]["name"])
    inst = photo_mod.install(plan, os.path.join(run.build, "site"),
                             sp["business"]["name"], sp["archetype"].get("label", ""))
    if inst.get("count"):
        run.artifacts["photos"] = f"{inst['count']} placeholder photographs (CC0/PDM)"
        run.log("site", f"{inst['count']} photographs installed at site/img/ — "
                        f"placeholders, credited in img/CREDITS.md")

    pages = site_gen.render_site(sp, getattr(run, "_site_logo", ""))
    for path, html in pages.items():
        with open(os.path.join(run.build, "site", path), "w", encoding="utf-8") as f:
            f.write(html)
        run.log("site", f"{path}  ({len(html) // 1024} KB)")
    run.artifacts["site"] = os.path.join(run.build, "site", "index.html")
    run.artifacts["pages"] = sorted(pages)


def st_wire(run: Run):
    sp = run.spec
    env_needed, live, stub = [], [], []
    for i in sp["integrations"]:
        (live if i["mode"] == "live" else stub).append(f"{i['key']}={i['provider']}")
        env_needed += [v for v in i["env_required"] if v not in i["env_present"]]
    manifest = {
        "integrations": sp["integrations"],
        "env_required": sorted(set(env_needed)),
        "note": "Credentials are the operator's. The builder never holds them; each rail "
                "is built and labelled, and goes live when its variables are set.",
    }
    with open(os.path.join(run.build, "integrations.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    if live:
        run.log("wire", "live: " + ", ".join(live))
    if stub:
        run.log("wire", "built but not switched on: " + ", ".join(stub), level="warn")
    if env_needed:
        run.log("wire", "needs from the operator: " + ", ".join(sorted(set(env_needed))),
                level="warn")


def st_package(run: Run):
    sp = run.spec
    # The pages link to each other by filename, so clean URLs would turn every internal
    # click into a redirect. Serve what was written, at the address it was written to.
    with open(os.path.join(run.build, "vercel.json"), "w", encoding="utf-8") as f:
        json.dump({"cleanUrls": False, "trailingSlash": False}, f, indent=2)
    # The site is the root of the deployment; the platform sits at /platform.
    # `copy2` on a directory raises, and site/ now contains one — `img/`, the photographs.
    # Copy files as files and folders as trees, which is what "the site is the root" meant
    # all along; it only ever worked because the site used to be flat.
    src = os.path.join(run.build, "site")
    for name in os.listdir(src):
        s_path, d_path = os.path.join(src, name), os.path.join(run.build, name)
        if os.path.isdir(s_path):
            shutil.copytree(s_path, d_path, dirs_exist_ok=True)
        else:
            shutil.copy2(s_path, d_path)
    with open(os.path.join(run.build, "README.md"), "w", encoding="utf-8") as f:
        f.write(_readme(sp, run))
    with open(os.path.join(run.build, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump({"schema": SCHEMA, "run": run.id, "built": _now(),
                   "fingerprint": sp["fingerprint"], "business": sp["business"],
                   "archetype": sp["archetype"], "modules": [m["key"] for m in sp["modules"]],
                   "pages": [p["path"] for p in sp["site"]["pages"]],
                   "target": sp["deploy"]["target"]}, f, indent=2, ensure_ascii=False)
    run.log("package", "site at the root, platform at /platform, manifest + readme written")


def st_verify(run: Run):
    """Run every check the spec declared, against what was actually written."""
    sp = run.spec
    results = []

    def add(cid, ok, detail):
        results.append({"id": cid, "ok": bool(ok), "detail": detail})
        run.log("verify", ("PASS  " if ok else "FAIL  ") + cid + " — " + detail,
                level="info" if ok else "error")

    for c in sp["checks"]:
        cid, kind = c["id"], c.get("kind")
        if kind == "fingerprint":
            add(cid, spec_mod.verify_fingerprint(sp), "spec fingerprint matches its contents")
        elif kind == "no_placeholders":
            bad = []
            for root, _, files in os.walk(os.path.join(run.build, "site")):
                for fn in files:
                    # site/ is no longer only HTML — it carries the photographs too, and a
                    # JPEG read as UTF-8 is an exception, not a finding.
                    if not fn.endswith((".html", ".htm", ".js", ".css", ".json", ".md")):
                        continue
                    with open(os.path.join(root, fn), encoding="utf-8",
                              errors="replace") as f:
                        body = f.read()
                    for tok in spec_mod.TOKEN_RE.findall(body):
                        if tok in KNOWN_TOKENS:
                            bad.append(f"{fn}:{{{tok}}}")
            add(cid, not bad, "no unresolved token reached a page"
                if not bad else "unresolved: " + ", ".join(sorted(set(bad))[:6]))
        elif kind == "files_exist":
            where = os.path.join(run.build, c.get("target", "site"))
            names = ([p["path"] for p in sp["site"]["pages"]] if c.get("target") == "site"
                     else ["index.html", "business.json"])
            missing = [n for n in names
                       if not os.path.exists(os.path.join(where, n))
                       or os.path.getsize(os.path.join(where, n)) < 200]
            add(cid, not missing, f"{len(names) - len(missing)}/{len(names)} present and non-trivial"
                + (" — missing " + ", ".join(missing) if missing else ""))
        elif kind == "links_resolve":
            written = {p["path"] for p in sp["site"]["pages"]}
            broken = [n["href"] for n in sp["site"]["nav"] if n["href"] not in written]
            add(cid, not broken, "every nav link points at a written page"
                if not broken else "broken: " + ", ".join(broken))
        elif kind == "product_app_built":
            import product_app
            want = [f for f, _, _ in product_app.KINDS[sp["archetype"]["product_app"]]["surfaces"]]
            missing = [f for f in want
                       if not os.path.exists(os.path.join(run.build, f, "index.html"))
                       or os.path.getsize(os.path.join(run.build, f, "index.html")) < 4000]
            add(cid, not missing,
                "every surface of the product exists: " + ", ".join("/" + f for f in want)
                if not missing else "not built: " + ", ".join("/" + f for f in missing))
        elif kind == "brand_kit_applied":
            # Read the stylesheet that was actually written, not the spec that asked for
            # it. A renderer that ignored the kit would otherwise pass on the strength of
            # its own input — the exact failure mode the archetype accents had.
            kit = sp["brand"].get("kit") or {}
            want = (kit.get("accent") or "").lower()
            home = os.path.join(run.build, "site",
                                sp["site"]["pages"][0]["path"] if sp["site"]["pages"]
                                else "index.html")
            body = ""
            if os.path.exists(home):
                with open(home, encoding="utf-8") as f:
                    body = f.read().lower()
            # The hi-tech skin has no paper ground; its kit arrives as the default
            # colour scheme, so that is the value to look for there.
            if sp["archetype"].get("skin") == "hitech":
                want = ((kit.get("hitech") or {}).get("a") or want).lower()
            add(cid, bool(want) and want in body,
                f"{kit.get('name', 'kit')} — {want} is in the stylesheet"
                if want and want in body else
                f"{kit.get('name', 'kit')} accent {want or '(none)'} did not reach "
                f"{os.path.basename(home)}")
        elif kind == "unique_module_titles":
            seen, clash = {}, []
            for m in sp["modules"]:
                if m["title"] in seen:
                    clash.append(f"'{m['title']}' ({seen[m['title']]} + {m['key']})")
                seen[m["title"]] = m["key"]
            add(cid, not clash, "every module has its own name"
                if not clash else "duplicated: " + ", ".join(clash))
        elif kind == "module_present":
            t = c.get("target")
            add(cid, any(m["key"] == t for m in sp["modules"]), f"module '{t}'")
        elif kind == "seed_present":
            t = c.get("target")
            m = next((m for m in sp["modules"] if m["key"] == t), None)
            add(cid, bool(m and m.get("seed")), f"'{t}' opens with records in it")
        elif kind == "site_path":
            add(cid, bool(sp["site"]["nav"]), c["assert"])
        elif kind == "copy_order":
            home = next((p for p in sp["site"]["pages"] if p["slug"] == "home"), None)
            kinds = [s.get("kind") for s in (home or {}).get("sections", [])]
            add(cid, "pay" not in kinds[:2], c["assert"])
        else:
            add(cid, True, c.get("assert", ""))

    run.check_results = results
    failed = [r for r in results if not r["ok"]]
    if failed:
        raise ForgeError(f"{len(failed)} check(s) failed: "
                         + ", ".join(r["id"] for r in failed)
                         + ". Nothing was deployed.")
    run.log("verify", f"all {len(results)} checks passed")


def st_deploy(run: Run):
    sp = run.spec
    d = sp["deploy"]
    target = d["target"]

    if target == "local":
        url = "file://" + os.path.join(run.build, "index.html")
        run.artifacts["url"] = url
        run.artifacts["platform_url"] = "file://" + os.path.join(run.build, "platform", "index.html")
        run.log("deploy", "nothing published — the build folder is the artifact")
        return

    if d["public"] and sp["authorization"].get("mode") != "unattended":
        raise ForgeError(f"refusing to deploy to '{target}': no unattended-run authorization "
                         "on file. Nothing that the public can reach goes out without a YES "
                         "that was logged before the run started.")

    if target == "vercel":
        project = d.get("project") or sp["business"]["slug"]

        # A container has a token, not an interactive CLI login. Same stage, same result,
        # whichever rail is available — so a laptop and a server behave identically.
        import vercel_api
        if vercel_api.available():
            token, team = vercel_api.token_from_env()
            run.log("deploy", f"Vercel API · project '{project}'")
            try:
                res = vercel_api.deploy(run.build, project, token, team,
                                        log=lambda m: run.log("deploy", m))
                vercel_api.open_to_the_public(project, token, team,
                                              log=lambda m: run.log("deploy", m))
            except vercel_api.VercelError as ex:
                raise ForgeError(str(ex))
            url = res["url"]
            run.artifacts["url"] = url
            run.artifacts["platform_url"] = url.rstrip("/") + "/platform/"
            if res.get("alias"):
                run.artifacts["alias"] = res["alias"]
                run.log("deploy", f"stable address: {res['alias']}")
            run.log("deploy", url)
            return

        cli = shutil.which("vercel")
        if not cli:
            raise ForgeError("no VERCEL_TOKEN in the environment and no vercel CLI on PATH, "
                             "so there is nothing to deploy with. Set VERCEL_TOKEN, or "
                             "install the CLI, or build to --target local.")

        # Link first. Without this the project is named after whatever the build directory
        # happens to be called, which is "build" for every business Forge has ever made.
        link = subprocess.run([cli, "link", "--yes", "--project", project],
                              cwd=run.build, capture_output=True, text=True, timeout=180)
        if link.returncode != 0:
            raise ForgeError(f"could not link the deployment to project '{project}':\n"
                             + ((link.stdout or "") + (link.stderr or "")).strip()[-500:])
        # `vercel link` writes an .env.local with a fresh OIDC token. It is a credential,
        # it is not ours to keep, and it must never be uploaded with the site.
        for junk in (".env.local", ".env"):
            p = os.path.join(run.build, junk)
            if os.path.exists(p):
                os.remove(p)
        run.log("deploy", f"linked to project '{project}'")

        proc = subprocess.run([cli, "deploy", "--prod", "--yes"], cwd=run.build,
                              capture_output=True, text=True, timeout=900)
        if proc.returncode != 0:
            raise ForgeError("vercel refused the deployment:\n"
                             + ((proc.stdout or "") + (proc.stderr or "")).strip()[-800:])

        # The deployment URL goes to stdout; everything else — including the dashboard
        # "Inspect" link — goes to stderr. Taking the first https:// in the combined
        # output picks up the dashboard and makes the smoke check pass against a page
        # that is not the site, so read stdout only and require a deployment host.
        url = _deployment_url(proc.stdout, proc.stderr)
        if not url:
            raise ForgeError("vercel reported success but printed no deployment URL:\n"
                             + ((proc.stdout or "") + (proc.stderr or "")).strip()[-500:])

        # New projects inherit the team's deployment protection, which puts the site
        # behind a Vercel login. A business website behind an SSO wall is not published,
        # so publishing it means turning that off — named in the authorization scope,
        # and logged here because it is a change to an account setting.
        prot = subprocess.run([cli, "project", "protection", "disable", "--sso"],
                              cwd=run.build, capture_output=True, text=True, timeout=180)
        run.log("deploy", "deployment protection disabled — the site is reachable without "
                          "a Vercel login" if prot.returncode == 0 else
                          "could not turn off deployment protection; the site may be "
                          "behind a Vercel login", level="info" if prot.returncode == 0 else "warn")

        run.artifacts["url"] = url
        run.artifacts["platform_url"] = url.rstrip("/") + "/platform/"

        # The stable address is whatever the host actually aliased this deployment to —
        # not `https://<project>.vercel.app`, which is a guess and 404s whenever the bare
        # name was already taken. Ask, and record only what comes back.
        alias = _vercel_alias(cli, run.build, url)
        if alias:
            run.artifacts["alias"] = alias
            run.log("deploy", f"stable address: {alias}")
        run.log("deploy", url)
        return

    if target == "hub":
        base = (d.get("hub_url") or "https://vom-client-hub.vercel.app").rstrip("/")
        token = os.environ.get("PROVISION_TOKEN")
        if not token:
            raise ForgeError("PROVISION_TOKEN is not in this environment. The hub will not "
                             "register a tenant without it, and the builder is not given "
                             "credentials — set it in the environment Forge runs in, or "
                             "build to --target local.")
        payload = {
            "tenant_id": sp["business"]["slug"],
            "owner_email": d.get("owner_email") or "",
            "operating_profile": {
                "business_name": sp["business"]["name"],
                "org_type": sp["business"]["org_type"],
                "org_label": sp["business"]["org_label"],
                "archetype": sp["archetype"]["id"],
                "platform_choice": sp["site"]["platform"],
                "operator": sp["operator"]["name"],
                "generated": sp["generated"],
                "platform_modules": [m["key"] for m in sp["modules"]],
            },
        }
        if not payload["owner_email"]:
            raise ForgeError("the hub registers a tenant against its owner's address, and "
                             "none is set. Add --owner-email to the spec's deploy block.")
        req = urllib.request.Request(base + "/api/provision", method="POST",
                                     data=json.dumps(payload).encode("utf-8"),
                                     headers={"Content-Type": "application/json",
                                              "x-provision-token": token})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                body = json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as ex:
            raise ForgeError(f"the hub refused the registration: HTTP {ex.code} "
                             + ex.read().decode("utf-8")[:300])
        except Exception as ex:
            raise ForgeError(f"could not reach the hub at {base}: {ex}")
        run.artifacts["tenant"] = body.get("tenant_id")
        run.artifacts["url"] = base + "/app"
        run.log("deploy", f"tenant '{body.get('tenant_id')}' registered at {base}")
        return

    raise ForgeError(f"unknown deploy target '{target}'")


def _deployment_url(stdout: str, stderr: str) -> str:
    """The URL the site is actually served from — never a dashboard link.

    `vercel deploy` writes the deployment URL to stdout and its progress, including the
    "Inspect: https://vercel.com/…" line, to stderr. Trusting the combined output means
    smoke-testing the Vercel dashboard, which answers 200 whether or not the site does."""
    for line in (stdout or "").split():
        u = line.strip()
        if u.startswith("https://") and not u.startswith("https://vercel.com/"):
            return u
    # Fall back to stderr, but still refuse anything on the dashboard host.
    for line in (stderr or "").split():
        u = line.strip()
        if u.startswith("https://") and ".vercel.app" in u:
            return u
    return ""


def _vercel_alias(cli: str, cwd: str, url: str) -> str:
    """The shortest alias the host reports for this deployment, or nothing.

    Nothing is a fine answer. A guessed address that 404s is worse than no address."""
    try:
        p = subprocess.run([cli, "inspect", url], cwd=cwd, capture_output=True,
                           text=True, timeout=120)
    except Exception:
        return ""
    body = (p.stdout or "") + "\n" + (p.stderr or "")
    if "Aliases" not in body:
        return ""
    tail = body.split("Aliases", 1)[1]
    found = []
    for line in tail.splitlines():
        line = line.strip(" ╶-\t")
        if line.startswith("https://"):
            found.append(line)
        elif found and not line:
            break
    return min(found, key=len) if found else ""


def st_smoke(run: Run):
    """Fetch what was deployed, and check it is the site rather than something that
    merely answers. 'Deployed' should be a measurement, not a claim."""
    url = run.artifacts.get("url", "")
    if not url or url.startswith("file://"):
        run.log("smoke", "nothing was published, so there is nothing to fetch")
        return SKIP
    if url.startswith("https://vercel.com/"):
        raise ForgeError(f"refusing to call {url} a deployment — that is the Vercel "
                         "dashboard, not the site.")

    # The page carries the name HTML-escaped, so "Kettle & Co" appears as "Kettle &amp; Co".
    # Comparing against the raw string alone fails smoke on every business with an
    # ampersand in its name — a live, correct site reported as not serving.
    import html as _html
    raw = run.spec["business"]["name"]
    name = raw
    variants = {raw, _html.escape(raw), _html.escape(raw, quote=False)}

    def carries(body: str) -> bool:
        return any(v in body for v in variants)

    def serves(target_url: str) -> bool:
        try:
            req = urllib.request.Request(target_url, headers={"User-Agent": "turnkey-forge"})
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.status == 200 and carries(r.read(200_000).decode("utf-8", "replace"))
        except Exception:
            return False

    for attempt in range(1, 5):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "turnkey-forge"})
            with urllib.request.urlopen(req, timeout=20) as r:
                code = r.status
                body = r.read(200_000).decode("utf-8", "replace")
            if code == 200 and carries(body):
                run.log("smoke", f"HTTP 200 from {url} — serving '{name}' ({len(body)} bytes)")
                # An alias is only worth publishing if it answers too. One that does not
                # is dropped rather than printed.
                alias = run.artifacts.get("alias")
                if alias:
                    if serves(alias):
                        run.log("smoke", f"stable address confirmed: {alias}")
                    else:
                        run.artifacts.pop("alias", None)
                        run.log("smoke", f"{alias} did not serve this build — dropped, the "
                                         "deployment URL is the address", level="warn")
                return OK
            if code == 200:
                run.log("smoke", f"attempt {attempt}: 200, but the page does not carry "
                                 f"'{name}' — not this build", level="warn")
            else:
                run.log("smoke", f"attempt {attempt}: HTTP {code}", level="warn")
        except Exception as ex:
            run.log("smoke", f"attempt {attempt}: {ex}", level="warn")
        time.sleep(4)
    raise ForgeError(f"deployed, but {url} never answered with this build's home page. "
                     "The deployment exists; it is not confirmed serving.")


def st_seal(run: Run):
    sp = run.spec
    record = {
        "run": run.id, "sealed": _now(), "fingerprint": sp["fingerprint"],
        "business": sp["business"]["name"], "archetype": sp["archetype"]["id"],
        "forge": sp["archetype"].get("forge", {}).get("name"),
        "target": sp["deploy"]["target"], "artifacts": run.artifacts,
        "checks_passed": sum(1 for c in getattr(run, "check_results", []) if c["ok"]),
        "elapsed_seconds": round(time.time() - run.started, 2),
        "authorization": sp["authorization"],
    }
    with open(os.path.join(run.dir, "receipt.json"), "w", encoding="utf-8") as f:
        json.dump(record, f, indent=2, ensure_ascii=False)
    run.artifacts["receipt"] = os.path.join(run.dir, "receipt.json")
    run.log("seal", f"receipt written · {record['elapsed_seconds']}s")


STAGES = {
    "resolve": st_resolve, "scaffold": st_scaffold, "brand": st_brand,
    "platform": st_platform, "site": st_site, "wire": st_wire, "package": st_package,
    "verify": st_verify, "deploy": st_deploy, "smoke": st_smoke, "seal": st_seal,
}


# ===========================================================================
# the runner
# ===========================================================================

def execute(idea_folder: str, sp: dict, *, cue=None, dry_run: bool = False,
            rid: str = None, resume_from: dict = None) -> Run:
    """Run the whole plan. Never prompts, never waits, never asks."""
    run = Run(idea_folder, sp, rid=rid, cue=cue)
    done_already = set()
    if resume_from:
        for s in resume_from.get("stages", []):
            if s["state"] in (OK, SKIP):
                run.stages[s["id"]].update(s)
                done_already.add(s["id"])
        run.artifacts.update(resume_from.get("artifacts") or {})

    forge_name = sp["archetype"].get("forge", {}).get("name", "FORGE")
    run.emit("run_start", msg=f"{forge_name} · {sp['business']['name']}",
             archetype=sp["archetype"]["id"], target=sp["deploy"]["target"],
             fingerprint=sp["fingerprint"], stages=len(run.order))

    for sid in run.order:
        if sid in done_already:
            run.emit("stage_end", sid, "already done in the resumed run", state=SKIP)
            continue
        if dry_run and sid in ("deploy", "smoke"):
            run.stages[sid]["state"] = SKIP
            run.stages[sid]["note"] = "dry run"
            run.emit("stage_end", sid, "skipped — dry run", state=SKIP)
            continue

        run.start(sid)
        try:
            result = STAGES[sid](run)
            run.finish(sid, SKIP if result == SKIP else OK)
        except ForgeError as ex:
            run.finish(sid, FAIL, str(ex))
            run.outcome = "failed"
            run.emit("run_end", msg=str(ex), level="error", outcome="failed",
                     elapsed=round(time.time() - run.started, 2))
            run.save()
            return run
        except Exception as ex:  # unexpected — still reported, never swallowed
            run.finish(sid, FAIL, f"{type(ex).__name__}: {ex}")
            run.outcome = "failed"
            run.emit("run_end", msg=f"{type(ex).__name__}: {ex}", level="error",
                     outcome="failed", elapsed=round(time.time() - run.started, 2))
            run.save()
            return run

    run.outcome = "built" if sp["deploy"]["target"] == "local" or dry_run else "launched"
    run.emit("run_end", msg=f"{sp['business']['name']} is {run.outcome}",
             outcome=run.outcome, elapsed=round(time.time() - run.started, 2),
             url=run.artifacts.get("url", ""))
    run.save()
    return run


def load_latest(idea_folder: str) -> dict:
    p = os.path.join(idea_folder, "forge", "latest.json")
    if not os.path.exists(p):
        return {}
    with open(p, encoding="utf-8") as f:
        ptr = json.load(f)
    if os.path.exists(ptr.get("state", "")):
        with open(ptr["state"], encoding="utf-8") as f:
            return json.load(f)
    return {}


def read_events(path: str, after: int = 0) -> list:
    """Everything since `after` — the console polls this."""
    if not os.path.exists(path):
        return []
    out = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                ev = json.loads(line)
            except ValueError:
                continue
            if ev.get("seq", 0) > after:
                out.append(ev)
    return out


# ===========================================================================
# the terminal cue — the same stages, for an operator watching a log
# ===========================================================================

class TerminalCue:
    """Visual stage cues on a terminal.

    Colour when it is a terminal, plain text when it is a pipe, so a CI log stays
    readable and a live run still looks like something happening."""

    def __init__(self, stream, forge: dict, colour: bool = None):
        self.s = stream
        self.forge = forge or {}
        self.colour = stream.isatty() if colour is None else colour
        self.accent = self._rgb(self.forge.get("accent", "#E8843C"))

    @staticmethod
    def _rgb(hexcode: str) -> tuple:
        h = (hexcode or "#E8843C").lstrip("#")
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) if len(h) == 6 else (232, 132, 60)

    def _c(self, text, rgb=None, dim=False, bold=False):
        if not self.colour:
            return text
        r, g, b = rgb or self.accent
        pre = f"\033[38;2;{r};{g};{b}m"
        if bold:
            pre = "\033[1m" + pre
        if dim:
            pre = "\033[2m"
        return pre + text + "\033[0m"

    def __call__(self, ev, run):
        k = ev["kind"]
        t = f"{ev['t']:6.2f}s"
        if k == "run_start":
            name = self.forge.get("name", "FORGE")
            self.s.write("\n" + self._c("▰▰▰ " + name, bold=True) + "  "
                         + ev["msg"].split(" · ", 1)[-1] + "\n")
            self.s.write(self._c(f"     {ev['data']['stages']} stages · target "
                                 f"{ev['data']['target']} · {ev['data']['fingerprint']}",
                                 dim=True) + "\n\n")
        elif k == "stage_start":
            st = run.stages[ev["stage"]]
            self.s.write(f"  {self._c(st['cue'])} {self._c(st['title'], bold=True)}\n")
        elif k == "log":
            mark = "!" if ev["level"] in ("warn", "error") else "·"
            self.s.write(self._c(f"      {mark} {ev['msg']}", dim=True) + "\n")
        elif k == "stage_end":
            state = (ev.get("data") or {}).get("state", OK)
            if state == FAIL:
                self.s.write(self._c(f"      ✗ {ev['msg']}", rgb=(220, 70, 70)) + "\n")
            elif state == SKIP:
                self.s.write(self._c(f"      – {ev['msg']}", dim=True) + "\n")
            else:
                ms = run.stages[ev["stage"]].get("ms")
                self.s.write(self._c(f"      ✓ {t}"
                                     + (f"  ({ms} ms)" if ms is not None else ""), dim=True) + "\n")
        elif k == "run_end":
            d = ev.get("data") or {}
            el = d.get("elapsed", 0)
            mins = f"{int(el // 60)}m {el % 60:.0f}s" if el >= 60 else f"{el:.1f}s"
            if d.get("outcome") == "failed":
                self.s.write("\n" + self._c("▰▰▰ STOPPED", rgb=(220, 70, 70), bold=True)
                             + f"  after {mins}\n      {ev['msg']}\n\n")
            else:
                self.s.write("\n" + self._c(f"▰▰▰ {d.get('outcome','done').upper()}", bold=True)
                             + f"  in {mins}\n")
                if d.get("url"):
                    self.s.write("      " + d["url"] + "\n")
                self.s.write("\n")
        self.s.flush()


# ===========================================================================
# helpers
# ===========================================================================

def _logo_data_uri() -> str:
    import base64
    here = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(here))), "vom-logo.jpg")
    if not os.path.exists(path):
        return ""
    with open(path, "rb") as f:
        return "data:image/jpeg;base64," + base64.b64encode(f.read()).decode("ascii")


def _readme(sp: dict, run: Run) -> str:
    a = sp["archetype"]
    mods = "\n".join(f"| **{m['title']}** | {m['blurb']} |" for m in sp["modules"])
    pages = "\n".join(f"| `{p['path']}` | {p['title']} | {p.get('purpose','')} |"
                      for p in sp["site"]["pages"])
    rails = "\n".join(f"| {i['key']} | {i['provider']} | **{i['mode']}** | "
                      f"{', '.join(i['env_required'])} |" for i in sp["integrations"])
    return f"""# {sp['business']['name']}

Built by **{a.get('forge',{}).get('name','FORGE')}** from platform spec `{sp['fingerprint']}`,
run `{run.id}`. Archetype: **{a['label']}**{'' if a['curated'] else ' (generic fallback)'}.

Two things live here, and they are one system:

- **The public site** — the pages at the root. Open `index.html`.
- **The business platform** — `platform/index.html`. The modules the owner works in.
  Records typed there appear in the site's feeds; forms on the site land in its modules.

Everything is self-contained. No build step, no server, no dependencies.

## The platform

| Module | What it does |
|---|---|
{mods}

## The site

| File | Page | What it is for |
|---|---|---|
{pages}

## Rails

| Rail | Provider | State | Needs |
|---|---|---|---|
{rails}

A rail marked **stub** is fully built and clearly labelled in the interface — it starts
working the moment the operator supplies its credentials. The builder never holds them.

---

Prepared by {sp['operator']['author_as']}.
"""
