#!/usr/bin/env python3
"""
artifacts — the things the factory actually produces.

A stage that ends in a tick is a checklist. A stage that ends in a *file the next stage
reads* is a factory. Everything here writes a real artifact to disk, and every artifact
is the input to something downstream:

    idea.md            <- the operator's answers          -> read by blueprint, spec
    business-profile.md<- idea + positioning answers      -> read by spec's extractors
    provisioning.md    <- profile + blueprint + spec      -> the order of operations that
                                                             puts the rails in place
    bundle.zip         <- everything produced so far      -> hand-off, backup, transfer

The profile generator is deliberately written to emit the exact section headings
`spec.resolve_content()` looks for (Offer, Pricing, Target Customer / ICP, Organization,
…). That is the contract between the two halves of the system: if this file changes a
heading, the extractor stops finding it, so they are written next to each other on purpose.

Stdlib only.
"""

from __future__ import annotations

import io
import os
import zipfile
from datetime import datetime, timezone


def _now():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _today():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


# ===========================================================================
# 1 — the idea
# ===========================================================================

def idea_md(a: dict) -> str:
    """`business-idea.md` — the file Turnkey's whole pipeline starts from.

    `a` is the wizard's answers. Nothing is invented here; a field the operator left
    blank is left out rather than filled with a plausible sentence."""
    name = a.get("name") or "Untitled"
    L = [f"# {name}", ""]

    if a.get("promise"):
        L += ["## Offer", a["promise"], ""]
        gets = [g.strip() for g in (a.get("gets") or "").splitlines() if g.strip()]
        if gets:
            L += [f"- {g}" for g in gets] + [""]

    if a.get("price"):
        L += ["## Pricing",
              f"{a.get('offer_name') or name} — €{a['price']}"
              + (f" per {a['price_unit']}" if a.get("price_unit") else ""), ""]

    if a.get("who"):
        L += ["## Target Customer / ICP", a["who"], ""]
    if a.get("problem"):
        L += ["## The problem", a["problem"], ""]
    if a.get("solution"):
        L += ["## What we would do about it", a["solution"], ""]

    org = name
    if a.get("city"):
        org += f" is based in {a['city']}"
    org += "."
    L += ["## Organization", org]
    if a.get("email"):
        L.append(f"Contact: {a['email']}")
    L.append("")

    if a.get("target") and a.get("price"):
        m = math(a)
        L += ["## The number",
              f"- Target: €{a['target']}/month at €{a['price']} per sale",
              f"- {m['sales']} sales · {m['props']} proposals · {m['convos']} conversations",
              f"- {m['perday']} conversations per working day", ""]

    L += ["---", f"Written by the Turnkey factory · {_today()}", ""]
    return "\n".join(L)


def math(a: dict) -> dict:
    """The Hundred math, in the engine as well as in the browser, so both agree."""
    t = float(a.get("target") or 0); p = float(a.get("price") or 0)
    c = float(a.get("close") or 25); pr = float(a.get("prop") or 40)
    import math as _m
    sales = _m.ceil(t / p) if p > 0 else 0
    props = _m.ceil(sales / (c / 100)) if sales > 0 and c > 0 else 0
    convos = _m.ceil(props / (pr / 100)) if props > 0 and pr > 0 else 0
    return {"sales": sales, "props": props, "convos": convos,
            "nos": max(0, convos - sales), "perday": _m.ceil(convos / 22) if convos else 0}


# ===========================================================================
# 1b — the funnel that was not built
# ===========================================================================
# Not every business needs a waitlist. A church has a congregation, a service business
# has a phone that rings, a venue has a street — for those the funnel is a detour and the
# platform is the first deliverable.
#
# But "we skipped it" cannot be a checkbox in a session, because every other milestone
# here is a file and progress is read off the filesystem. So skipping writes an artifact
# too: a short, dated waiver that says the decision was made, by whom, and why. It travels
# in the bundle, so whoever receives the business can see the funnel was *considered* and
# declined rather than forgotten.

WAIVER_REL = "turnkey/prelaunch-waived.md"


def prelaunch_waiver_md(a: dict, reason: str = "", actor: str = "VOM") -> str:
    """`prelaunch-waived.md` — the record that this business skipped the funnel."""
    name = a.get("name") or "Untitled"
    reason = (reason or "").strip()
    L = [f"# Prelaunch waived — {name}", "",
         f"*Recorded {_now()} by {actor}*", "",
         "This business does **not** run a prelaunch funnel. The waitlist milestone is "
         "satisfied by this decision rather than by a deployed page, and the pipeline "
         "continues straight to the profile.", "",
         "## Why", "",
         reason or "No reason given — the operator judged the demand already proven.", "",
         "## What this costs", "",
         "- `business-profile.md` carries no waitlist evidence; positioning rests on what "
         "the operator already knows about the market.",
         "- There is no funnel URL to point early conversations at. If one is wanted later, "
         "running the prelaunch step removes this waiver and builds it.", "",
         "---", "", "Prepared by Vision Outreach Media (VOM).", ""]
    return "\n".join(L)


def read_waiver(path: str) -> dict:
    """Read a waiver back. Written next to the generator so the two never drift.

    Only two things are parsed — when it was written and why — because only those two
    are shown anywhere. Everything else in the file is for a human."""
    out = {"at": "", "reason": ""}
    try:
        with open(path, encoding="utf-8") as f:
            lines = [ln.rstrip("\n") for ln in f]
    except OSError:
        return out
    for i, ln in enumerate(lines):
        if ln.startswith("*Recorded ") and out["at"] == "":
            out["at"] = ln[len("*Recorded "):].split(" by ")[0].strip("* ")
        if ln.strip() == "## Why":
            body = [x.strip() for x in lines[i + 1:i + 4] if x.strip()]
            if body:
                out["reason"] = body[0]
            break
    return out


# ===========================================================================
# 2 — the business profile
# ===========================================================================
# HEADINGS ARE A CONTRACT. spec.resolve_content() greps for these exact titles.

def profile_md(a: dict, signal: dict = None) -> str:
    """`business-profile.md` — the document Intake would otherwise write by hand.

    This is the artifact the spec compiler reads to fill a site's copy, so every
    heading here is one the extractor knows. Prelaunch evidence is folded in: a
    profile written after a funnel ran carries the proof it ran."""
    name = a.get("name") or "Untitled"
    gets = [g.strip() for g in (a.get("gets") or "").splitlines() if g.strip()]
    L = [f"# Business Profile — {name}", "",
         f"*Generated by the Turnkey factory · {_now()}*", ""]

    L += ["## Offer", a.get("promise") or "", ""]
    if gets:
        L += [f"- {g}" for g in gets] + [""]

    L += ["## Niche / Positioning",
          (a.get("positioning") or a.get("who") or ""), ""]

    L += ["## Target Customer / ICP", a.get("who") or "", ""]
    if a.get("problem"):
        L += ["The problem they have, in their words:", "", f"> {a['problem']}", ""]

    L += ["## Pricing"]
    if a.get("price"):
        L.append(f"- {a.get('offer_name') or name} — €{a['price']}"
                 + (f" per {a['price_unit']}" if a.get("price_unit") else ""))
        if a.get("target"):
            m = math(a)
            L.append(f"- To reach €{a['target']}/month: {m['sales']} sales, "
                     f"{m['props']} proposals, {m['convos']} conversations "
                     f"({m['perday']} a working day)")
    else:
        L.append("On request.")
    L.append("")

    L += ["## Brand Voice", a.get("voice") or
          "Plain, direct and unhurried. Says what the thing is, what it costs, and what "
          "happens next. No hype.", ""]

    dom = a.get("domain") or ""
    L += ["## Domain Intent",
          (f"- Preferred: `{dom}`" if dom else "- Not yet decided"),
          f"- Contact address: {a['email']}" if a.get("email") else "", ""]

    L += ["## Organization",
          f"{name}" + (f" is based in {a['city']}." if a.get("city") else "."), ""]
    if a.get("solution"):
        L += [a["solution"], ""]

    L += ["## Channels", a.get("channels") or "Not yet decided.", ""]

    # --- the part a hand-written profile never has ---------------------------
    if signal and signal.get("waived"):
        # A skipped funnel is still an answer to "what evidence is there?", and the honest
        # answer is "none, deliberately". A profile that simply omits the section reads as
        # if nobody ever considered it.
        L += ["## Prelaunch evidence", "",
              "No waitlist was run — the prelaunch funnel was deliberately skipped"
              + (f": {signal['reason']}" if signal.get("reason") else "."), "",
              f"Recorded {signal.get('at')} in `prelaunch-waived.md`."
              if signal.get("at") else "Recorded in `prelaunch-waived.md`.", ""]
    elif signal and signal.get("count"):
        L += ["## Prelaunch evidence", "",
              f"- Waitlist: **{signal['count']}** of {signal.get('threshold', '—')} needed"
              + (" — **validated**" if signal.get("validated") else " — not yet validated"),
              f"- Funnel: {signal['url']}" if signal.get("url") else "",
              f"- Collected: {signal.get('first','')} → {signal.get('last','')}"
              if signal.get("first") else "", ""]
        names = signal.get("names") or []
        if names:
            L += ["Who said yes:", ""]
            L += [f"- {n}" for n in names[:40]] + [""]

    L += ["---", "", "Prepared by Vision Outreach Media (VOM).", ""]
    return "\n".join([x for x in L if x is not None])


# ===========================================================================
# 3 — provisioning
# ===========================================================================

def provisioning_md(idea_folder: str, state: dict, spec: dict, operator: dict) -> str:
    """`provisioning.md` — the order of operations that puts the rails in place.

    This is the artifact that stands between "we know what to build" and "Forge can
    build it". Every line is a real thing with a real value: the hostname, the DNS
    record, the environment variable, the account. Each carries who may do it —
    AUTO (the machine), VOM (the operator), CLIENT (the owner) — because that is
    what decides whether the build can proceed unattended."""
    biz = spec["business"]
    plat = operator.get("platform") or {}
    dep = spec["deploy"]
    dom = (dep.get("domain") or {})
    mode, value = dom.get("mode") or "subdomain", dom.get("value") or biz["slug"]

    zone = plat.get("dns_zone") or "clients.example.com"
    host = f"{value}.{zone}" if mode == "subdomain" else value
    project = dep.get("project") or biz["slug"]

    L = [f"# Provisioning — {biz['name']}", "",
         f"*Generated {_now()} · spec `{spec['fingerprint']}`*", "",
         "What must exist before this platform can serve traffic, in the order it must "
         "exist. Every item names its actor: **AUTO** the machine may do alone, **VOM** "
         "the operator must do (an account or a credential), **CLIENT** the owner must do "
         "(a signature or an identity check).", "",
         "| # | Rail | Actor | Value | State |",
         "|---|---|---|---|---|"]

    rows = []
    n = 1

    # --- 1. hostname ------------------------------------------------------
    if mode == "subdomain":
        rows.append((n, "Hostname", "AUTO", f"`{host}`",
                     "a subdomain in the operator's delegated zone — no registration needed"))
    else:
        rows.append((n, "Domain registration", "VOM", f"`{host}`",
                     f"register at cost through {plat.get('registrar_wholesale','the wholesale registrar')}, "
                     "**with the client as registrant**"))
    n += 1

    # --- 2. DNS -----------------------------------------------------------
    rows.append((n, "DNS", "AUTO" if mode == "subdomain" else "VOM",
                 f"`{host}` → {dep.get('target')}",
                 f"managed in {plat.get('dns_provider','the DNS provider')}")); n += 1

    # --- 3. hosting -------------------------------------------------------
    rows.append((n, "Hosting project", "AUTO", f"`{project}`",
                 f"{plat.get('hosting','Vercel')} — created by Forge's deploy stage")); n += 1

    # --- 4. TLS -----------------------------------------------------------
    rows.append((n, "TLS", "AUTO", f"`https://{host}`",
                 "issued automatically once DNS resolves")); n += 1

    # --- 5+. the rails the spec declared ----------------------------------
    for i in spec.get("integrations", []):
        missing = [e for e in i["env_required"] if e not in i["env_present"]]
        actor = "AUTO" if i["mode"] == "live" else "VOM"
        state_txt = ("wired and usable" if i["mode"] == "live"
                     else "built and labelled in the interface; goes live when the "
                          "operator supplies: " + ", ".join(f"`{e}`" for e in missing))
        rows.append((n, i["key"].replace("_", " ").title(), actor,
                     i["provider"], state_txt)); n += 1

    if spec["deploy"]["public"]:
        rows.append((n, "Unattended authorization", "VOM",
                     spec["authorization"].get("consent_ref") or "—",
                     "one logged YES covering the whole run; without it Forge refuses "
                     "every public target")); n += 1

    L += [f"| {r[0]} | **{r[1]}** | `{r[2]}` | {r[3]} | {r[4]} |" for r in rows]

    # --- the environment --------------------------------------------------
    env = sorted({e for i in spec.get("integrations", [])
                  for e in i["env_required"] if e not in i["env_present"]})
    L += ["", "## Environment", ""]
    if env:
        L += ["These are not held by the builder and never appear in this repository. "
              "Set them where Forge runs:", "", "```bash"]
        L += [f'export {e}="…"' for e in env]
        L += ["```", ""]
    else:
        L += ["Every declared rail already has its credentials in this environment.", ""]

    # --- what blocks an unattended build ----------------------------------
    blocking = [r for r in rows if r[2] != "AUTO"]
    L += ["## What blocks an unattended build", ""]
    if blocking:
        L += [f"- **{r[1]}** — {r[4]}" for r in blocking]
        L += ["", "Everything else Forge does alone. The items above are the only reason a "
                  "human is still in this pipeline, and each one is an account, a signature "
                  "or a credential — categorically not something an agent should hold.", ""]
    else:
        L += ["Nothing. This platform can be built and deployed unattended.", ""]

    # --- order of operations ----------------------------------------------
    L += ["## Order", "",
          "```", "\n".join(f"{r[0]}. {r[1]}" for r in rows), "```", "",
          "---", "", f"Prepared by {spec['operator']['author_as']}.", ""]
    return "\n".join(L)


# ===========================================================================
# 4 — the bundle
# ===========================================================================

BUNDLE_ORDER = [
    ("business-idea.md", "business-idea.md"),
    (WAIVER_REL, "prelaunch-waived.md"),
    ("turnkey/business-profile.md", "business-profile.md"),
    ("turnkey/brand-kit.md", "brand-kit.md"),
    ("turnkey/brand-manual.html", "brand-manual.html"),
    ("turnkey/brand-kit.json", "brand-kit.json"),
    ("turnkey/provisioning.md", "provisioning.md"),
    ("turnkey/blueprint.md", "blueprint.md"),
    ("turnkey/platform-spec.md", "platform-spec.md"),
    ("turnkey/platform-spec.json", "platform-spec.json"),
    ("turnkey/launch-state.json", "launch-state.json"),
    ("turnkey/consent-log.jsonl", "consent-log.jsonl"),
]


def bundle_zip(idea_folder: str) -> bytes:
    """Every artifact produced so far, as one file.

    Not a backup — a hand-off. Someone who receives this has the idea, the profile,
    the provisioning order, the build order and the consent trail, which is everything
    needed to rebuild the platform from scratch."""
    buf = io.BytesIO()
    manifest = ["# Bundle — " + os.path.basename(idea_folder.rstrip("/")), "",
                f"*{_now()}*", "", "| File | What it is | Bytes |", "|---|---|---|"]
    what = {
        "business-idea.md": "the idea, as first written down",
        "prelaunch-waived.md": "the record that this business skipped the validation funnel, and why",
        "business-profile.md": "the positioning, offer and pricing the site is generated from",
        "brand-kit.md": "the brand kit: palette with print values, typography, voice and usage",
        "brand-manual.html": "the same kit as a printable manual — open it and print to PDF",
        "brand-kit.json": "the kit the builder compiles the colours and type from",
        "provisioning.md": "what must exist before the platform can serve traffic",
        "blueprint.md": "which business functions this org type needs, and why",
        "platform-spec.md": "the build order, for a person",
        "platform-spec.json": "the build order, for the builder (apb/1)",
        "launch-state.json": "where the launch stands",
        "consent-log.jsonl": "the hash-chained record of every logged decision",
    }
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for rel, arc in BUNDLE_ORDER:
            p = os.path.join(idea_folder, rel)
            if not os.path.exists(p):
                continue
            z.write(p, arc)
            manifest.append(f"| `{arc}` | {what.get(arc,'')} | {os.path.getsize(p)} |")

        # the funnel and the built platform, if they exist
        for sub, label in (("prelaunch", "the deployed validation funnel"),
                           ("platform", "the built platform")):
            d = os.path.join(idea_folder, sub)
            if not os.path.isdir(d):
                continue
            count = 0
            for root, _, files in os.walk(d):
                for fn in files:
                    full = os.path.join(root, fn)
                    z.write(full, os.path.join(sub, os.path.relpath(full, d)))
                    count += 1
            if count:
                manifest.append(f"| `{sub}/` | {label} | {count} files |")

        z.writestr("README.md", "\n".join(manifest) + "\n")
    return buf.getvalue()
