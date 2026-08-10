#!/usr/bin/env python3
"""
build — assembles the public Forge surface.

Everything under `public/` except the index page is produced by Forge itself: this script
runs two real unattended builds and publishes their output verbatim. That is deliberate.
A page claiming "a platform in under a second" is marketing; a page that *is* the output
of that build, next to the console that recorded it, is evidence.

    python3 build.py            # rebuild public/
    python3 build.py --deploy   # rebuild, then vercel deploy --prod

Stdlib only.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.join(os.path.dirname(HERE), "orchestrator", "engine", "turnkey.py")
PUBLIC = os.path.join(HERE, "public")
DEMOS = os.path.join(HERE, "demos")

# One demo per archetype. Fictional businesses — the index says so, and every demo page
# carries a strip saying so, because a convincing demo that does not announce itself as
# one is just a fake business on the internet.
#
# Each `about` is written the way a real profile is: a line of positioning, a bulleted
# offer, and prices where the business has them. That is not decoration — the spec
# compiler reads exactly those shapes to fill the pages, so a thin `about` produces a thin
# site, and a demo built from one would misrepresent what Forge does with a real profile.
BUILDS = [
    {
        "slug": "church", "kit": "cathedral-ink", "name": "Bethel Chapel", "org_type": "church",
        "city": "Amersfoort", "email": "hello@bethelchapel.example",
        "about": "A church in Amersfoort that gathers every Sunday, with giving, "
                 "small groups, midweek prayer and community events.\n"
                 "- Sunday gathering — 10:00, about ninety minutes, children welcome\n"
                 "- Small groups — a dozen of them, meeting midweek across the city\n"
                 "- Prayer evening — the second Tuesday of the month\n"
                 "- Community meals — open table, first Saturday, nobody pays",
    },
    {
        "slug": "biz", "kit": "quiet-authority", "name": "Vale Studio", "org_type": "service_business",
        "city": "Utrecht", "email": "hi@valestudio.example",
        "about": "Brand and web design for small companies, run by one person. "
                 "Fixed-price projects: a brand kit for €2.400, a five-page website "
                 "for €3.900, and a monthly retainer at €650/month.",
    },
    {
        "slug": "nonprofit", "kit": "harvest-field", "name": "Warm Coats Foundation", "org_type": "nonprofit",
        "city": "Rotterdam", "email": "hello@warmcoats.example",
        "about": "A small charity in Rotterdam that gets winter clothing to people "
                 "sleeping rough, and publishes what every euro bought.\n"
                 "- Winter drive — coats, boots and sleeping bags collected, cleaned and "
                 "handed out between October and March\n"
                 "- Night rounds — two volunteer teams, three evenings a week, with hot "
                 "drinks and a list of where beds are free\n"
                 "- Referral desk — walking people to the services that can actually house "
                 "them, and staying until someone answers\n"
                 "- Published accounts — every year, in full, including what went wrong",
    },
    {
        "slug": "shop", "kit": "bone-brass", "name": "Kade Ceramics", "org_type": "ecommerce",
        "city": "Delft", "email": "orders@kadeceramics.example",
        "about": "Hand-thrown stoneware made in Delft and shipped across Europe, in "
                 "runs of forty at a time.\n"
                 "- Everyday bowls — stackable, dishwasher-safe stoneware, €28 each\n"
                 "- Coffee set — two cups and a pouring jug, €65\n"
                 "- Large serving dish — thrown to order, €120\n"
                 "- Seconds shelf — pieces with a mark that does not affect use, €15",
    },
    {
        "slug": "digital", "kit": "signal-violet", "name": "Plainsheet", "org_type": "digital_products",
        "city": "Haarlem", "email": "hello@plainsheet.example",
        "about": "Bookkeeping spreadsheets for Dutch freelancers who do not want "
                 "accounting software. Made once, sold as a download, updated free.\n"
                 "- The year pack — income, expenses, VAT quarters and a year-end sheet, €39\n"
                 "- The VAT companion — the quarterly return worked out line by line, €19\n"
                 "- Both together — €49\n"
                 "- Every update free, forever, on the original download link",
    },
    {
        "slug": "membership", "kit": "studio-terracotta", "name": "The Long Table", "org_type": "membership",
        "city": "Amsterdam", "email": "hello@thelongtable.example",
        "about": "A supper club in Amsterdam that runs on membership rather than ticket "
                 "sales, so the cooking can be planned a season ahead.\n"
                 "- Monthly supper — one long table, one menu, no choice and no phones\n"
                 "- The recipe letter — what was cooked and how, sent the week after\n"
                 "- Members' rate on the workshops — bread, stock, preserving\n"
                 "- Membership is €19/month, or €190/year, and you can leave in one click",
    },
    {
        "slug": "education", "kit": "teal-seminar", "name": "Northlight School", "org_type": "education",
        "city": "Groningen", "email": "hello@northlight.example",
        "about": "Photography taught properly, online, by working photographers in "
                 "Groningen — short courses that end in work you can show.\n"
                 "- Light and exposure — eight lessons, €149\n"
                 "- Portraits without a studio — six lessons, €129\n"
                 "- The edit — selecting and sequencing a body of work, €179\n"
                 "- All three together — €399, and access does not expire",
    },
    {
        "slug": "venue", "kit": "atelier-noir", "name": "De Zaal", "org_type": "local_venue",
        "city": "Nijmegen", "email": "hallo@dezaal.example",
        "about": "A hundred-capacity room in Nijmegen for live music, film nights and "
                 "private hire, open Wednesday to Sunday.\n"
                 "- Live nights — two or three acts, Thursday to Saturday, doors 19:30\n"
                 "- Sunday sessions — acoustic, free entry, from 16:00\n"
                 "- Film club — every other Wednesday, €7 on the door\n"
                 "- Private hire — the whole room from €450 an evening",
    },
    {
        "slug": "saas", "kit": "terminal-slate", "name": "Rosterly", "org_type": "saas",
        "city": "Eindhoven", "email": "hello@rosterly.example",
        "about": "Shift scheduling for small hospitality teams — built for the manager "
                 "who currently does the rota in a group chat.\n"
                 "- Build a week in ten minutes — drag shifts, watch the wage cost update\n"
                 "- Staff swap shifts themselves — with your approval, not your admin\n"
                 "- Export to payroll — hours, breaks and surcharges, in one file\n"
                 "- €29/month for up to 15 staff, €59/month up to 40, cancel any time",
    },
    {
        "slug": "prelaunch", "kit": "waitlist-green", "name": "Ferry Coffee", "org_type": "service_business",
        "archetype": "prelaunch",
        "city": "Zaandam", "email": "hello@ferrycoffee.example",
        "about": "A coffee cart on the Zaandam ferry crossing, testing whether commuters "
                 "will pre-order a flat white for the other side.\n"
                 "- Order from the queue, collect as you step off\n"
                 "- One price, €3,50, no size decisions at 07:40\n"
                 "- Weekday mornings first, weekends if it works",
    },
]

BANNER = """<div style="position:sticky;top:0;z-index:9999;background:#0A0A0B;color:#F4F5F7;
  font:600 12.5px/1.5 ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  padding:8px 16px;display:flex;gap:10px;align-items:center;justify-content:center;
  border-bottom:1px solid #26272B;text-align:center;flex-wrap:wrap">
  <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:__ACCENT__"></span>
  <span>Demo platform — a fictional business, built by <strong>__FORGE__</strong> in __MS__.</span>
  <a href="/" style="color:__ACCENT__;text-decoration:none">Back to Forge &rarr;</a>
</div>"""


def sh(args, **kw):
    r = subprocess.run(args, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        sys.stderr.write(r.stdout + "\n" + r.stderr + "\n")
        raise SystemExit(f"failed: {' '.join(args[:3])}… (exit {r.returncode})")
    return r


def live_address(folder: str) -> str:
    """The address a previous run of this demo actually deployed to, if any.

    Read from the run receipts rather than composed from the project name — the same rule
    the runner follows. No receipt, no live link on the page."""
    best = ("", "")
    runs = os.path.join(folder, "forge")
    if not os.path.isdir(runs):
        return ""
    for rid in sorted(os.listdir(runs)):
        p = os.path.join(runs, rid, "receipt.json")
        if not os.path.exists(p):
            continue
        try:
            rec = json.load(open(p))
        except ValueError:
            continue
        alias = (rec.get("artifacts") or {}).get("alias")
        if alias and rec.get("target") == "vercel":
            best = (rid, alias)
    return best[1]


def forge_build(b: dict, target: str = "local") -> dict:
    """Run one real unattended build and return its run record.

    `target=vercel` publishes, so it carries the same authorization every other public
    Forge run carries: one scoped YES, logged on the hash-chained consent log before the
    run starts. Without it the engine refuses the target outright rather than quietly
    falling back to a local build — behaviour a demo runner should inherit, not bypass."""
    folder = os.path.join(DEMOS, b["name"])
    print(f"  forging {b['name']} → {target} …", flush=True)
    cmd = [sys.executable, ENGINE, "forge", "--new", b["name"], "--into", DEMOS, "--reuse",
           "--org-type", b["org_type"], "--city", b["city"], "--email", b["email"],
           "--about", b["about"], "--target", target, "--no-open", "--quiet", "--console"]
    if b.get("archetype"):
        cmd += ["--archetype", b["archetype"]]
    # Every demo is branded, and half of them deliberately on something other than their
    # archetype's default — a showcase where each card is its forge's own colour would
    # show ten archetypes and no brand kits.
    if b.get("kit"):
        cmd += ["--kit", b["kit"]]
    if target != "local":
        cmd += ["--authorize-unattended", "--actor", "VOM",
                "--channel", "operator console (forge/build.py)",
                "--evidence", "operator ran build.py --deploy for the archetype showcase"]
    sh(cmd, timeout=2400)
    latest = json.load(open(os.path.join(folder, "forge", "latest.json")))
    run = json.load(open(latest["state"]))
    run["_folder"] = folder
    run["_spec"] = json.load(open(os.path.join(folder, "turnkey", "platform-spec.json")))
    run["_live"] = live_address(folder)
    return run


def publish(b: dict, run: dict):
    """Copy a build into public/, with the demo strip injected into every page."""
    src = os.path.join(run["dir"], "build")
    dst = os.path.join(PUBLIC, b["slug"])
    shutil.rmtree(dst, ignore_errors=True)
    shutil.copytree(src, dst)
    shutil.copy2(os.path.join(run["dir"], "console.html"), os.path.join(dst, "console.html"))
    shutil.copy2(os.path.join(run["_folder"], "turnkey", "platform-spec.json"),
                 os.path.join(dst, "platform-spec.json"))
    shutil.copy2(os.path.join(run["_folder"], "turnkey", "platform-spec.md"),
                 os.path.join(dst, "platform-spec.md"))

    forge = run["archetype"]["forge"]
    ms = human(build_seconds(run))
    strip = (BANNER.replace("__ACCENT__", forge["accent"])
                   .replace("__FORGE__", forge["name"]).replace("__MS__", ms))
    for name in os.listdir(dst):
        if not name.endswith(".html") or name == "console.html":
            continue
        p = os.path.join(dst, name)
        with open(p, encoding="utf-8") as f:
            html = f.read()
        with open(p, "w", encoding="utf-8") as f:
            f.write(html.replace("<body>", "<body>\n" + strip, 1))
    # the platform app too
    plat = os.path.join(dst, "platform", "index.html")
    if os.path.exists(plat):
        with open(plat, encoding="utf-8") as f:
            html = f.read()
        with open(plat, "w", encoding="utf-8") as f:
            f.write(html.replace("<body>", "<body>\n" + strip, 1))


def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def build_seconds(run: dict) -> float:
    """How long the platform took to *build*, which is not how long the run took.

    A run that publishes spends most of its wall-clock inside a host's build queue.
    Counting that as "time to build a platform" would be a marketing number rather than
    a measurement, so the deploy and smoke stages are left out of every figure this page
    prints — and the page says which figure it is showing."""
    stages = [s for s in run.get("stages", []) if s["id"] not in ("deploy", "smoke")]
    if not stages:
        return float(run.get("elapsed", 0))
    return sum(s.get("ms", 0) for s in stages) / 1000.0


def human(seconds: float) -> str:
    return f"{seconds:.2f}s" if seconds >= 1 else f"{int(seconds * 1000)} ms"


KIT = os.path.join(os.path.dirname(HERE), "..", "brand", "kit", "vom-kit.css")


def index_html(runs: list) -> str:
    """The showcase is composed from the VOM Kit, not styled independently.

    Inlining the kit here rather than linking it is the same rule Forge follows for a
    client's site: what ships is self-contained, but there is exactly one source."""
    with open(os.path.join(HERE, "index.template.html"), encoding="utf-8") as f:
        tpl = f.read()
    with open(os.path.normpath(KIT), encoding="utf-8") as f:
        tpl = tpl.replace("/*KIT*/", f.read())

    import base64
    logo = os.path.normpath(os.path.join(os.path.dirname(HERE), "..", "vom-logo.jpg"))
    if os.path.exists(logo):
        with open(logo, "rb") as f:
            tpl = tpl.replace("{{LOGO}}",
                              "data:image/jpeg;base64," + base64.b64encode(f.read()).decode("ascii"))

    cards = []
    for b, run in runs:
        sp, forge = run["_spec"], run["archetype"]["forge"]
        mods = "".join(f'<li>{esc(m["title"])}</li>' for m in sp["modules"])
        pages = "".join(f'<li>{esc(p["title"])}</li>' for p in sp["site"]["pages"])
        ms = human(build_seconds(run))
        live = run.get("_live") or ""
        live_btn = (f'<a class="vk-btn vk-btn--accent vk-btn--sm live" href="{live}" '
                    f'target="_blank" rel="noopener">Live deployment &rarr;</a>' if live else "")
        live_note = " · deployed to production by Forge itself" if live else ""
        kind = esc(sp["archetype"]["label"].split(" /")[0].lower())
        # The brand kit this demo was built in, shown as the palette rather than named —
        # a card that says "Cathedral Ink" and shows nothing has not shown a brand kit.
        kit = (sp.get("brand") or {}).get("kit") or {}
        kit_row = ""
        if kit.get("swatches"):
            sw = "".join(f'<i title="{esc(c["name"])} {esc(c["hex"])}" '
                         f'style="background:{esc(c["hex"])}"></i>'
                         for c in kit["swatches"])
            kit_row = (f'<div class="kit"><span class="kn">{esc(kit["name"])}</span>'
                       f'<span class="kt">{esc(kit["type"]["preset"])} type · '
                       f'{esc(kit.get("scheme", "light"))} ground</span>'
                       f'<span class="ks">{sw}</span>'
                       f'<a class="km" href="/{b["slug"]}/brand-manual.html">Brand manual &rarr;</a>'
                       f'</div>')
        cards.append(f"""
      <article class="forge vk-card" data-brand="{forge['name'].lower()}">
        <header>
          <span class="glyph">{esc(forge['name'][0])}</span>
          <div>
            <h3>{esc(forge['name'])}</h3>
            <p class="one">{esc(sp['archetype']['label'])}</p>
          </div>
          <span class="ms">{esc(ms)}</span>
        </header>
        <p class="sum">{esc(sp['archetype']['summary'])}</p>
        {kit_row}
        <div class="two">
          <div><h4>Platform · {len(sp['modules'])} modules</h4><ul>{mods}</ul></div>
          <div><h4>Site · {len(sp['site']['pages'])} pages</h4><ul>{pages}</ul></div>
        </div>
        <div class="demo">
          <p class="dl">Demo build — {esc(sp['business']['name'])}, a fictional
            {kind}{live_note}</p>
          <div class="go">
            {live_btn}
            <a class="vk-btn vk-btn--sm" href="/{b['slug']}/">Frozen copy of the site</a>
            <a class="vk-btn vk-btn--sm" href="/{b['slug']}/platform/">The platform</a>
            <a class="vk-btn vk-btn--sm" href="/{b['slug']}/console.html">Build console</a>
            <a class="vk-btn vk-btn--sm" href="/{b['slug']}/platform-spec.json">The spec</a>
          </div>
        </div>
      </article>""")

    stages = "".join(
        f'<li><span class="cue">{esc(s["cue"])}</span>'
        f'<span class="st">{esc(s["title"].split(" · ")[0])}</span>'
        f'<span class="sd">{esc(s["detail"])}</span></li>'
        for s in runs[0][1]["stages"])

    spec = runs[0][1]["_spec"]
    excerpt = json.dumps({
        "schema": spec["schema"],
        "archetype": {"id": spec["archetype"]["id"], "forge": spec["archetype"]["forge"]["name"]},
        "modules": [{"key": m["key"], "title": m["title"], "seed": len(m.get("seed") or [])}
                    for m in spec["modules"][:4]] + ["…"],
        "site": {"pages": [p["slug"] for p in spec["site"]["pages"]]},
        "integrations": [{"key": i["key"], "mode": i["mode"]} for i in spec["integrations"]],
        "deploy": {"target": spec["deploy"]["target"], "public": spec["deploy"]["public"]},
        "authorization": {"mode": spec["authorization"]["mode"]},
        "readiness": {"ready": spec["readiness"]["ready"]},
        "fingerprint": spec["fingerprint"],
    }, indent=2)[:1400]

    total = sum(build_seconds(r) for _, r in runs)
    return (tpl.replace("<!--CARDS-->", "".join(cards))
               .replace("<!--STAGES-->", stages)
               .replace("<!--SPEC-->", esc(excerpt))
               .replace("<!--TOTAL-->", f"{total:.2f}")
               .replace("<!--NBUILDS-->", str(len(runs))))


def main():
    ap = argparse.ArgumentParser(
        description="Build (and optionally publish) one demo per archetype, then assemble "
                    "and deploy the Forge surface. Re-runnable: every stage is derived "
                    "from a real run, so running it twice replaces the output rather than "
                    "accumulating it.")
    ap.add_argument("--deploy", action="store_true",
                    help="publish: each demo to its own production project, then the surface")
    ap.add_argument("--surface-only", action="store_true",
                    help="skip the demo deployments; deploy only the Forge surface")
    ap.add_argument("--only", default="",
                    help="comma-separated slugs to build (default: all)")
    args = ap.parse_args()

    builds = BUILDS
    if args.only:
        want = {s.strip() for s in args.only.split(",") if s.strip()}
        unknown = want - {b["slug"] for b in BUILDS}
        if unknown:
            raise SystemExit("unknown slug(s): " + ", ".join(sorted(unknown)))
        builds = [b for b in BUILDS if b["slug"] in want]

    # A demo deployment is a publish. Say so before doing it, and name the target, so the
    # line in the terminal matches the line that will appear on the consent log.
    demo_target = "vercel" if (args.deploy and not args.surface_only) else "local"

    # Clear the output but keep `.vercel/` — it is what binds this folder to the project.
    # Wiping it makes the next deploy silently create a brand new project named after the
    # directory, which is how "public" and "build" got onto the account the first time.
    os.makedirs(PUBLIC, exist_ok=True)
    keep = {".vercel"} | ({b["slug"] for b in BUILDS} - {b["slug"] for b in builds})
    for name in os.listdir(PUBLIC):
        if name in keep:
            continue
        p = os.path.join(PUBLIC, name)
        shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
    os.makedirs(DEMOS, exist_ok=True)

    print(f"running {len(builds)} demo build(s) through Forge, target {demo_target}:")
    runs, failed = [], []
    for b in builds:
        try:
            run = forge_build(b, demo_target)
        except SystemExit as ex:
            # One archetype failing must not cost the other nine their run. Record it,
            # keep going, and fail the command at the end with the list.
            failed.append((b["slug"], str(ex)))
            print(f"    {b['slug']:<11} FAILED — {str(ex)[:160]}")
            continue
        publish(b, run)
        runs.append((b, run))
        live = run.get("_live") or run.get("artifacts", {}).get("alias") or ""
        print(f"    {run['archetype']['forge']['name']:<15} {run['outcome']:<8} "
              f"{run['elapsed']:.2f}s  ->  public/{b['slug']}/"
              + (f"  {live}" if live else ""))

    if not runs:
        raise SystemExit("every demo build failed — nothing to assemble")

    # A partial re-run still needs the whole index, so the cards for the demos that were
    # not rebuilt are read back from the copies already sitting in public/.
    if args.only:
        runs = _with_existing(runs)

    with open(os.path.join(PUBLIC, "index.html"), "w", encoding="utf-8") as f:
        f.write(index_html(runs))
    with open(os.path.join(PUBLIC, "vercel.json"), "w", encoding="utf-8") as f:
        json.dump({"cleanUrls": False, "trailingSlash": True}, f, indent=2)
    print(f"\npublic/ assembled ({sum(len(files) for _, _, files in os.walk(PUBLIC))} files)")

    if args.deploy:
        cli = shutil.which("vercel")
        if not cli:
            raise SystemExit("vercel CLI not found")
        print("deploying the surface …")
        r = subprocess.run([cli, "deploy", "--prod", "--yes"], cwd=PUBLIC,
                           capture_output=True, text=True)
        out = (r.stdout or "") + "\n" + (r.stderr or "")
        print(out.strip()[-1200:])
        if r.returncode != 0:
            raise SystemExit("deploy failed")
        # The dashboard "Inspect" link is also an https:// URL and it is printed first,
        # so taking the first one reports a page behind a login as the live site. Prefer
        # the alias the CLI says it aliased to, then stdout, and never vercel.com.
        def _pick(text):
            return next((w for w in text.split()
                         if w.startswith("https://") and "vercel.com/" not in w), "")
        alias = ""
        for line in out.splitlines():
            if "Aliased" in line:
                alias = _pick(line)
        url = alias or _pick(r.stdout or "")
        print("\nSURFACE:", url or "(deployed, but no public URL was printed)")
        for b, run in runs:
            live = run.get("_live") or (run.get("artifacts") or {}).get("alias") or ""
            if live:
                print(f"  {b['slug']:<11} {live}")

    if failed:
        raise SystemExit("failed: " + ", ".join(s for s, _ in failed))


def _with_existing(runs: list) -> list:
    """Fill the index from what is already published for demos this run did not rebuild.

    The run record is the source for a card, and a partial run only has some of them —
    so the rest are read back from the run state each published copy was made from."""
    have = {b["slug"] for b, _ in runs}
    out = list(runs)
    for b in BUILDS:
        if b["slug"] in have:
            continue
        folder = os.path.join(DEMOS, b["name"])
        latest = os.path.join(folder, "forge", "latest.json")
        spec = os.path.join(folder, "turnkey", "platform-spec.json")
        if not (os.path.exists(latest) and os.path.exists(spec)):
            continue
        try:
            run = json.load(open(json.load(open(latest))["state"]))
        except (ValueError, KeyError, OSError):
            continue
        run["_folder"], run["_live"] = folder, live_address(folder)
        run["_spec"] = json.load(open(spec))
        out.append((b, run))
    return sorted(out, key=lambda pair: [x["slug"] for x in BUILDS].index(pair[0]["slug"]))


if __name__ == "__main__":
    main()
