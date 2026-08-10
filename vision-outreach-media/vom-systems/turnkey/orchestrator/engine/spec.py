#!/usr/bin/env python3
"""
spec — the automatable business platform blueprint (APB).

`blueprint.md` is written for a person: it argues, it explains, it says "revisit this if
the client hires staff". That is the right shape for a decision record and the wrong shape
for a machine. A build tool that has to interpret prose is a build tool that needs a human
standing next to it.

So this compiles the decisions into an **executable artifact**: `platform-spec.json`,
schema `apb/1`. Everything a builder could need to ask is answered in it — which modules,
which pages, what each page says, which records exist on day one, which integrations are
live and which are stubs, where it deploys, what must be true afterwards, and in what
order to do it. Forge reads this and nothing else.

The property that makes an unattended build honest is **completeness**, and it is
mechanical here, not aspirational:

  * `readiness.ready` is false while any structural decision is unresolved (no blueprint,
    a guessed org type, an unknown deploy target). Forge refuses to run an unready spec.
  * every text token must resolve. A page that would ship the literal string "{business}"
    fails compilation rather than going live.
  * values the profile did not supply are filled from the archetype and recorded in
    `assumptions` — visible, attributable, and never silently invented.
  * `fingerprint` is a hash of the whole spec. The same business compiles to the same
    fingerprint; a build records the fingerprint it built, so "what is deployed" is a
    question with an answer.

Authorization is part of the spec, not part of the run. Turnkey's rule is that nothing
publishes without a logged YES that existed first. An unattended builder cannot ask for
one mid-run, so the YES is granted **once, up front, over the whole run**, and the spec
carries the reference to that consent line. Without it the spec still compiles and Forge
still builds — locally, privately. It just will not deploy anywhere the public can reach.

Stdlib only.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
from datetime import datetime, timedelta, timezone

import archetypes
import brand_kits
import platform_gen

SCHEMA = "apb/1"
SPEC_VERSION = 1

DEPLOY_TARGETS = {
    "local":  "a folder on disk — opens in a browser, nothing published",
    "hub":    "the Client Business Hub — the owner signs in with a magic link",
    "vercel": "a Vercel deployment — a public URL",
}

# Deploy targets the public can reach. These require a prior unattended-run authorization.
PUBLIC_TARGETS = {"hub", "vercel"}


def _now():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _slug(s: str, n: int = 64) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-")[:n] or "business"


# ===========================================================================
# reading what the business already told us
# ===========================================================================

def _sections(text: str) -> dict:
    """Every '## Heading' block in a markdown profile, keyed by lowercased heading."""
    out = {}
    for m in re.finditer(r"^##+\s*(.+?)\s*$(.*?)(?=^##+\s|\Z)", text or "", re.S | re.M):
        out[m.group(1).strip().lower()] = m.group(2).strip()
    return out


def _first_sentences(text: str, n: int = 2, limit: int = 260) -> str:
    """A short, clean lede from a block of profile prose.

    A profile's Offer section is usually a line of positioning followed by a bulleted
    list. The bullets are already rendered as cards by `_bullets`, and stripping their
    markers here would glue four fragments into one run-on sentence — so the lede is
    taken from the prose *above* the list, and the list is left to the cards."""
    raw = (text or "").strip()
    lines = raw.splitlines()
    lead = []
    for line in lines:
        if re.match(r"^\s*[-*]\s+\S", line):
            break
        lead.append(line)
    body = "\n".join(lead).strip() or re.sub(r"^\s*[-*]\s*", "", raw, flags=re.M)
    body = re.sub(r"\*\*(.+?)\*\*", r"\1", body)
    body = re.sub(r"\s+", " ", body).strip()
    if not body:
        return ""
    parts = re.split(r"(?<=[.!?])\s+", body)
    out = " ".join(parts[:n]).strip()
    return (out[:limit].rsplit(" ", 1)[0] + "…") if len(out) > limit else out


def _bullets(text: str, limit: int = 12) -> list:
    """Bullet lines from a section, split into a title and the rest."""
    items = []
    for line in (text or "").splitlines():
        m = re.match(r"^\s*[-*]\s+(.*\S)\s*$", line)
        if not m:
            continue
        raw = re.sub(r"\*\*(.+?)\*\*", r"\1", m.group(1)).strip()
        if not raw:
            continue
        title, body = raw, ""
        for sep in (" — ", " – ", ": ", " - "):
            if sep in raw:
                title, body = raw.split(sep, 1)
                break
        items.append({"title": title.strip()[:90], "body": body.strip()[:240]})
        if len(items) >= limit:
            break
    return items


# A currency amount, never ending on the punctuation that follows it in a sentence.
MONEY_RE = re.compile(r"[€$£]\s?\d[\d.,]*\d|[€$£]\s?\d")
# What follows an amount and belongs to it: "/month", " per month", "k".
MONEY_TAIL_RE = re.compile(r"^\s*(k\b|/\s*\w+|per\s+\w+)", re.I)
# Connectives left at the front of a clause once the sentence is cut up.
LEAD_RE = re.compile(r"^(?:and|or|plus|with|including|incl\.?)\s+|^(?:a|an|the)\s+", re.I)


def _money_lines(text: str, limit: int = 6) -> list:
    """Priced offers as name + price.

    Prices are written two ways: one per line in a pricing table, or several in a single
    sentence ("a brand kit for €2.400, a website for €3.900, a retainer at €650/month").
    Splitting only on newlines turns the second case into one tier named after the whole
    sentence, so clauses are cut on sentence punctuation too."""
    body = re.sub(r"\*\*(.+?)\*\*", r"\1", text or "")

    # A line with one amount is one tier, and its name is the rest of the line — that is
    # how a pricing table is written. A line with several is a sentence, and only then is
    # it worth cutting into clauses.
    clauses = []
    for line in body.splitlines():
        line = line.strip(" -*\t")
        if not line or not MONEY_RE.search(line):
            continue
        if len(MONEY_RE.findall(line)) == 1:
            clauses.append(line)
        else:
            clauses.extend(c for c in re.split(r"[,;·|]|\s+[–—]\s+|\.\s+", line) if c.strip())

    out, seen = [], set()
    for clause in clauses:
        m = MONEY_RE.search(clause)
        if not m:
            continue
        price = re.sub(r"\s+", "", m.group(0))    # "€ 2.400" -> "€2.400"
        rest = clause[m.end():]
        tail = MONEY_TAIL_RE.match(rest)
        if tail:                                   # "/month", " per project", "k"
            suffix = re.sub(r"\s+", " ", tail.group(0).strip())
            price += suffix if suffix.startswith("/") else " " + suffix
            rest = rest[tail.end():]

        name = re.sub(r"\s+", " ", (clause[:m.start()] + " " + rest)).strip()
        name = name.rsplit(":", 1)[-1]            # drop "Fixed-price projects: …"
        name = name.strip(" -–—:·|.\t")
        # "Starter — one-off": the label is the part before the dash, the rest is detail.
        detail = ""
        if re.search(r"\s[–—-]\s", name):
            name, detail = re.split(r"\s[–—-]\s", name, 1)
            name, detail = name.strip(), detail.strip()
        prev = None
        while name != prev:                       # "and a monthly retainer" -> "monthly retainer"
            prev = name
            name = LEAD_RE.sub("", name).strip()
        # Drop the connective that introduced the amount: "… kit for", "… at".
        name = re.sub(r"\s+(?:for|at|from|costs?|is|priced at)$", "", name, flags=re.I).strip()
        if len(name) < 3 or name.lower() in seen:
            continue
        seen.add(name.lower())
        out.append({"name": name[:70], "price": price,
                    "includes": [detail[:90]] if detail else []})
        if len(out) >= limit:
            break
    return out


# ===========================================================================
# content resolution — every token gets a value, and every value gets a source
# ===========================================================================

def resolve_content(idea_folder: str, state: dict, arch: dict, biz: dict) -> tuple:
    """Fill every token an archetype page can reference.

    Returns (tokens, blocks, assumptions). A token whose value came from the profile is
    attributed to it; a token filled from the archetype's own defaults is listed as an
    assumption, so the operator can see exactly what the builder decided on their behalf
    rather than discovering it on a live page."""
    prof_path = os.path.join(idea_folder, "turnkey", "business-profile.md")
    idea_path = os.path.join(idea_folder, "business-idea.md")
    text = ""
    for p in (prof_path, idea_path):
        if os.path.exists(p):
            with open(p, encoding="utf-8") as f:
                text += "\n\n" + f.read()
    sec = _sections(text)
    op_profile = state.get("operating_profile") or {}
    assumptions = []

    def pick(keys, default, token, why):
        for k in keys:
            v = sec.get(k)
            if v:
                s = _first_sentences(v, 3, 420)
                if s:
                    return s
        assumptions.append({"token": token, "value": default, "reason": why})
        return default

    name = biz["name"]
    city = ""
    m = re.search(r"\b(?:in|based in|located in)\s+([A-Z][A-Za-zÀ-ÿ'’\-]+(?:\s[A-Z][A-Za-zÀ-ÿ'’\-]+)?)",
                  text)
    if m:
        city = m.group(1).strip()
    if not city:
        city = "your city"
        assumptions.append({"token": "city", "value": city,
                            "reason": "no location found in the profile — the page says "
                                      "'your city' until one is set"})

    email = ""
    m = re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", text)
    if m:
        email = m.group(0)
    if not email:
        dom = (op_profile.get("domain") or {}).get("value") or _slug(name)
        email = f"hello@{dom}.nl" if "." not in str(dom) else f"hello@{dom}"
        assumptions.append({"token": "email", "value": email,
                            "reason": "no contact address in the profile — a conventional "
                                      "hello@ address was composed from the domain"})

    tagline = op_profile.get("tagline") or ""
    if not tagline:
        tagline = arch["archetype"]["label"]
        assumptions.append({"token": "tagline", "value": tagline,
                            "reason": "no tagline in the operating profile — the archetype "
                                      "label stands in"})

    offer_line = pick(
        ["offer", "summary", "what it is", "positioning", "niche / positioning"],
        f"{name} — {arch['archetype']['summary']}",
        "offer_line",
        "no Offer section in the profile — the archetype's own summary stands in")

    about = pick(["about", "background", "brand voice", "niche / positioning"],
                 f"{name} is run by one team who answer their own messages.",
                 "about", "no About section in the profile")

    beliefs = pick(["beliefs", "what we believe", "organization", "offer"],
                   "We hold to the historic Christian faith as the churches have always "
                   "confessed it: the Scriptures, the creeds, and the ordinary practice "
                   "of gathering, teaching, prayer and the table.",
                   "beliefs", "no beliefs statement in the profile — a confessional "
                              "placeholder is used until the church supplies theirs")

    leadership = pick(["leadership", "team", "people"],
                      "The church is led by its elders, with a teaching team who share "
                      "the preaching through the year.",
                      "leadership", "no leadership section in the profile")

    # Prices are quoted wherever the profile happens to describe the offer, not only under
    # a heading called Pricing. Look there first, then anywhere — publishing "On request"
    # over a profile that plainly lists three prices is a worse failure than a loose match.
    pricing = _money_lines(sec.get("pricing") or "", 6) or _money_lines(text, 6)
    if not pricing:
        pricing = [{"name": "On request", "price": "—",
                    "includes": ["A written quote before anything starts"]}]
        assumptions.append({"token": "pricing", "value": "on request",
                            "reason": "no priced lines anywhere in the profile"})

    services = _bullets(sec.get("offer") or sec.get("services") or "", 12)
    if not services and pricing and pricing[0]["price"] != "—":
        # A priced offer is a service. Better a real list than one placeholder card.
        services = [{"title": p["name"], "body": p["price"]} for p in pricing]
    if not services:
        services = [{"title": "Our work",
                     "body": _first_sentences(sec.get("offer", ""), 2) or offer_line}]
        assumptions.append({"token": "services", "value": "one generic card",
                            "reason": "the profile's Offer section had no bullet list and no "
                                      "priced lines to turn into service cards"})

    now = datetime.now(timezone.utc)
    year = now.strftime("%Y")

    # Seed records need real dates or the platform opens with "0 upcoming" next to three
    # events. Dates are computed at compile time relative to the build, so a platform
    # forged today is current today rather than carrying whatever a template was written on.
    def day(offset: int) -> str:
        return (now + timedelta(days=offset)).strftime("%Y-%m-%d")

    def next_weekday(weekday: int) -> str:
        ahead = (weekday - now.weekday()) % 7 or 7
        return day(ahead)

    tokens = {
        "business": name, "operator": biz["operator"], "city": city, "email": email,
        "year": year, "tagline": tagline, "offer_line": offer_line, "about": about,
        "beliefs": beliefs, "leadership": leadership,
        "today": day(0),
        "next_sunday": next_weekday(6),
        "date_soon": day(4), "date_later": day(12), "date_further": day(26),
        "date_recent": day(-7), "date_earlier": day(-14),
    }
    blocks = {"services": services, "pricing": pricing}
    return tokens, blocks, assumptions


TOKEN_RE = re.compile(r"\{([a-z_]+)\}")


def fill(value, tokens: dict, unresolved: list, where: str):
    """Substitute every token, recursively, and record any that had no value.

    An unresolved token is a compile error, not a cosmetic one: it would otherwise ship
    as a literal '{business}' on a page nobody reviewed."""
    if isinstance(value, str):
        def sub(m):
            k = m.group(1)
            if k in tokens:
                return str(tokens[k])
            unresolved.append({"token": k, "where": where})
            return m.group(0)
        return TOKEN_RE.sub(sub, value)
    if isinstance(value, list):
        return [fill(v, tokens, unresolved, where) for v in value]
    if isinstance(value, dict):
        return {k: fill(v, tokens, unresolved, f"{where}.{k}") for k, v in value.items()}
    return value


# ===========================================================================
# compiling
# ===========================================================================

def compile_spec(idea_folder: str, state: dict, *, target: str = "local",
                 archetype_override: str = None, hub_url: str = None,
                 domain: str = None, authorization: dict = None,
                 hub_link: dict = None) -> dict:
    """Turn a saved blueprint into a spec a builder can execute unattended."""
    unready = []

    bp = state.get("blueprint")
    if not bp:
        unready.append({"what": "blueprint",
                        "fix": 'run `turnkey blueprint "<idea>" --save` first'})
    if target not in DEPLOY_TARGETS:
        unready.append({"what": f"deploy target '{target}'",
                        "fix": "choose one of: " + ", ".join(DEPLOY_TARGETS)})

    bp = bp or {}
    org_type = bp.get("org_type")
    conf = ((bp.get("classification") or {}).get("confidence")
            or bp.get("confidence") or "unknown")
    if conf == "low":
        unready.append({"what": "org type (classified with low confidence)",
                        "fix": 'run `turnkey blueprint "<idea>" --org-type <type> --save`'})

    arch = archetypes.resolve(org_type, archetype_override)
    A = arch["archetype"]

    biz = platform_gen.read_business(idea_folder, state)
    mod_plan = archetypes.apply_modules(A, platform_gen.modules_for(bp))
    keys = [k for k in mod_plan["modules"] if k in platform_gen.MODULES]
    if not keys:
        unready.append({"what": "platform modules (the blueprint selected none)",
                        "fix": 'add at least one with `turnkey functions "<idea>" --add crm`'})

    tokens, blocks, assumptions = resolve_content(idea_folder, state, arch, biz)
    unresolved = []

    # ---- modules, fully resolved (no lookups left for the builder) ---------
    modules = []
    for k in keys:
        m = dict(platform_gen.MODULES[k], key=k)
        if k in mod_plan["renamed"]:
            m["title"] = mod_plan["renamed"][k]
        seed = fill(A["seed"].get(k, []), tokens, unresolved, f"seed.{k}")
        modules.append({**m, "seed": seed})

    # ---- the public site ---------------------------------------------------
    site_src = A["site"]
    pages = []
    for p in site_src["pages"]:
        page = fill(json.loads(json.dumps(p)), tokens, unresolved, f"page.{p['slug']}")
        for s in page.get("sections", []):
            src = s.get("source")
            if src in blocks:
                s["items"] = blocks[src][: s.get("limit", 12)]
                s.pop("source", None)
        pages.append(page)

    nav = [{"slug": s, "title": next((p["title"] for p in pages if p["slug"] == s), s.title()),
            "href": next((p["path"] for p in pages if p["slug"] == s), s + ".html")}
           for s in site_src["nav"] if any(p["slug"] == s for p in pages)]

    op = state.get("operator") or {}
    brand = op.get("brand") or {}
    palette = brand.get("palette") or {"navy": "#1B2A4A", "orange": "#E8843C",
                                       "teal": "#2FA8A0", "ink": "#1B2233",
                                       "paper": "#FFFFFF"}

    # ---- the brand kit -----------------------------------------------------
    # The branding milestone writes `turnkey/brand-kit.json`; this reads it. A business
    # that never visited the step resolves to its archetype's default kit, which carries
    # that archetype's own accent, ground and type preset — so the step is a choice, never
    # a blocker, and an untouched pipeline compiles to what it always did.
    kit_choice = brand_kits.read_choice(idea_folder)
    kit, kit_source = brand_kits.resolve(kit_choice.get("kit", ""), A["id"])
    kit_block = brand_kits.to_brand(kit, kit_source)
    if kit_source == "fallback":
        assumptions.append({
            "token": "brand_kit", "value": kit["name"],
            "reason": f"brand-kit.json names '{kit_choice.get('kit')}', which is not a "
                      f"kit in the library — the archetype's default was used instead",
        })
    elif kit_source == "default":
        assumptions.append({
            "token": "brand_kit", "value": kit["name"],
            "reason": "the branding step was not run, so the archetype's default kit "
                      "applies",
        })

    # ---- integrations: every one declares whether it is real ---------------
    integrations = []
    for key, cfg in A["integrations"].items():
        have = [e for e in cfg["env"] if os.environ.get(e)]
        mode = "live" if len(have) == len(cfg["env"]) else ("partial" if have else "stub")
        integrations.append({
            "key": key, "provider": cfg["provider"], "purpose": cfg["purpose"],
            "mode": mode, "env_required": cfg["env"], "env_present": have,
            "note": ("wired and usable" if mode == "live" else
                     "the interface is built and labelled; it goes live when the operator "
                     "supplies the credentials — an agent never holds them"),
        })

    # ---- deploy ------------------------------------------------------------
    op_profile = state.get("operating_profile") or {}
    dom = domain or (op_profile.get("domain") or {}).get("value") or ""
    deploy = {
        "target": target,
        "description": DEPLOY_TARGETS.get(target, "unknown"),
        "public": target in PUBLIC_TARGETS,
        "hub_url": (hub_url or os.environ.get("TURNKEY_HUB_URL")
                    or "https://vom-client-hub.vercel.app") if target == "hub" else None,
        # The funnel and the platform are two different sites with two different jobs and
        # two different lifetimes — the funnel must keep serving the 100 no's long after
        # the platform exists. Same project name would mean the platform overwrites it.
        "project": (_slug(biz["name"]) + ("-prelaunch" if arch["id"] == "prelaunch" else "")
                    if target == "vercel" else None),
        "domain": {"mode": (op_profile.get("domain") or {}).get("mode") or "subdomain",
                   "value": dom},
        "requires": (["PROVISION_TOKEN"] if target == "hub" else
                     (["vercel CLI, authenticated"] if target == "vercel" else [])),
    }

    # ---- authorization -----------------------------------------------------
    auth = authorization or state.get("forge_authorization") or {
        "mode": "none",
        "scope": [],
        "note": "no unattended-run authorization on file — Forge will build, and will "
                "refuse any deploy target the public can reach",
    }
    if deploy["public"] and auth.get("mode") != "unattended":
        unready.append({
            "what": f"authorization for an unattended deploy to '{target}'",
            "fix": 'run `turnkey spec "<idea>" --authorize-unattended --actor VOM '
                   '--target ' + target + '` to log the YES that covers the whole run',
        })
    if deploy["public"] and auth.get("mode") == "unattended":
        allowed = auth.get("targets") or []
        if allowed and target not in allowed:
            unready.append({
                "what": f"the authorization on file does not cover target '{target}'",
                "fix": "re-authorize for this target, or build to one it covers: "
                       + ", ".join(allowed),
            })

    # ---- the stage plan: what Forge will actually do, in order -------------
    plan = build_plan(target, A, len(pages), len(modules), kit)

    # ---- checks ------------------------------------------------------------
    checks = ([{"id": "spec_fingerprint", "kind": "fingerprint",
                "assert": "the build matches the spec it claims to be built from"},
               {"id": "no_placeholders", "kind": "no_placeholders",
                "assert": "no unresolved {token} reached any page"},
               {"id": "pages_written", "kind": "files_exist", "target": "site",
                "assert": f"all {len(pages)} pages exist and are non-empty"},
               {"id": "platform_written", "kind": "files_exist", "target": "platform",
                "assert": "the operating platform opens and carries its modules"},
               {"id": "nav_resolves", "kind": "links_resolve",
                "assert": "every navigation link points at a page that was written"},
               # An archetype renames modules into the owner's own words, and two of those
               # words can collide — a venue whose enquiries module and whose lead capture
               # are both called "Enquiries" ships an owner two identical tabs. The
               # archetype is data, so this is an authoring mistake, and an authoring
               # mistake that only shows up in a screenshot is one that ships.
               {"id": "module_titles_unique", "kind": "unique_module_titles",
                "assert": "no two modules carry the same name in the owner's interface"},
               # A brand step that a renderer can quietly ignore is a brand step nobody
               # can trust. This reads the stylesheet that was actually written and looks
               # for the kit's own accent in it.
               {"id": "brand_kit_applied", "kind": "brand_kit_applied",
                "assert": f"the site is built in the '{kit['name']}' kit — its accent "
                          f"{kit['primary']} reached the stylesheet"}]
              + ([{"id": "product_app_built", "kind": "product_app_built",
                   "assert": "the product the site advertises was actually built"}]
                 if A.get("product_app") else [])
              + [dict(c) for c in A["checks"]])

    if unresolved:
        seen = {(u["token"], u["where"]) for u in unresolved}
        unready.append({
            "what": f"{len(seen)} unresolved text token(s): "
                    + ", ".join(sorted({u['token'] for u in unresolved})),
            "fix": "add the missing detail to business-profile.md, or the pages would "
                   "publish with the literal placeholder in them",
        })

    spec = {
        "schema": SCHEMA,
        "spec_version": SPEC_VERSION,
        "id": _slug(biz["name"]),
        "generated": _now(),
        "generator": "turnkey spec",

        "business": {
            "name": biz["name"],
            "slug": _slug(biz["name"]),
            "tagline": tokens["tagline"],
            "city": tokens["city"],
            "email": tokens["email"],
            "offer_line": tokens["offer_line"],
            "org_type": org_type,
            "org_label": bp.get("org_label"),
        },

        "operator": {
            "id": op.get("id"), "name": op.get("name") or "the operator",
            "author_as": op.get("author_as") or op.get("name") or "the operator",
        },

        "brand": {
            "palette": palette,
            "accent": A["accent"], "accent_soft": A["accent_soft"],
            "display": (brand.get("typography") or {}).get("display") or "Manrope",
            "body": (brand.get("typography") or {}).get("body") or "Manrope",
            # A real mark for THIS business, if the operator has one, as a data URI.
            # Empty means the site draws its own monogram — never the builder's logo.
            "logo": ("client logo supplied" if (brand.get("client_logo_data_uri") or "")
                     else "none supplied — the site draws its own monogram"),
            "logo_data_uri": brand.get("client_logo_data_uri") or "",
            # The chosen (or defaulted) brand kit, carried whole: the published palette a
            # printer reads, the type pairing, the voice and usage rules, and the two
            # complete token sets the renderers compile from. Everything downstream reads
            # this — there is no second place a colour is decided.
            "kit": kit_block,
        },

        "archetype": {
            "id": arch["id"], "label": A["label"], "curated": arch["curated"],
            "source": arch["source"], "voice": A["voice"], "summary": A["summary"],
            # The typographic stance and ground the built site takes. Data, not a code
            # path: site_gen holds a fixed table of presets and the archetype picks one,
            # exactly as it picks modules from the shared catalog.
            # The brand kit owns both of these now. An archetype still declares its own
            # values and every default kit carries them unchanged — but once a kit is
            # chosen, the type preset and the ground are the kit's, because a kit whose
            # serif and paper the archetype could overrule is not a brand.
            "type_preset": kit["type"]["preset"],
            "site_scheme": kit.get("scheme", "light"),
            "type_preset_archetype": A.get("type_preset", "humanist"),
            "site_scheme_archetype": A.get("site_scheme", "light"),
            # Which renderer builds the public site. "house" is the design system; an
            # archetype whose audience judges it on whether the product looks alive can
            # ask for a different one.
            "skin": A.get("skin", "house"),
            # The application this business sells, if it sells one. Nine archetypes leave
            # this empty and get a back office; a SaaS gets the product too.
            "product_app": A.get("product_app"),
            # The named forge that builds this archetype — its identity travels with the
            # spec so the console, the terminal rail and the build manifest all agree.
            "forge": dict(A["forge"]),
        },

        "blueprint_source": {
            "org_type": org_type,
            "confidence": conf,
            "platform": (bp.get("platform") or {}).get("label"),
            "wordpress": bool((bp.get("platform") or {}).get("wordpress_used")),
            "functions": sorted((bp.get("functions") or {}).keys()),
            "modules_from_blueprint": platform_gen.modules_for(bp),
            "added_by_archetype": mod_plan["added_by_archetype"],
            "dropped_by_archetype": mod_plan["dropped_by_archetype"],
        },

        "modules": modules,
        "site": {
            "platform": (bp.get("platform") or {}).get("label") or "static site",
            "nav": nav,
            "primary_cta": site_src["primary_cta"],
            "secondary_cta": site_src.get("secondary_cta"),
            "pages": pages,
            # Where this site sits in something larger. A funnel published as one of a
            # set is a dead end without it: the visitor who is curious but not sold has
            # nowhere to go except away. Set once per run; every page carries it the
            # same way, so a batch of sites shares one route home.
            "hub": hub_link or None,
        },
        "integrations": integrations,
        "deploy": deploy,
        "authorization": auth,
        "plan": plan,
        "checks": checks,
        "assumptions": assumptions,
        "readiness": {"ready": not unready, "blocking": unready},
    }

    spec["fingerprint"] = fingerprint(spec)
    return spec


def build_plan(target: str, A: dict, n_pages: int, n_modules: int,
               kit: dict = None) -> list:
    """The ordered stages Forge runs. Each carries its own visual cue.

    The plan lives in the spec rather than in the runner so that what a build *will* do is
    inspectable before it does it, and so an archetype could one day add a stage of its
    own without touching the runner."""
    stages = [
        {"id": "resolve", "title": "Read the spec", "cue": "◇",
         "detail": "load the blueprint, verify the fingerprint, refuse if anything is unresolved"},
        {"id": "scaffold", "title": "Lay out the build", "cue": "▢",
         "detail": "create the output tree this run writes into"},
        {"id": "brand",
         "title": "Apply the brand" + (f" · {kit['name']}" if kit else ""), "cue": "◐",
         "detail": (f"{kit['type']['preset']} type on a {kit.get('scheme', 'light')} "
                    f"ground, accent {kit['primary']}, logo embedded, and the manual "
                    f"written for the owner") if kit else
                   "operator palette and type, archetype accent, logo embedded"},
        {"id": "platform", "title": f"Build the platform · {n_modules} modules", "cue": "▣",
         "detail": "the operating app the owner works in, seeded so it opens with something in it"},
        {"id": "site", "title": f"Write the site · {n_pages} pages", "cue": "▤",
         "detail": "the public pages, in this archetype's voice"},
        {"id": "wire", "title": "Wire the rails", "cue": "◈",
         "detail": "payments, email and analytics — live where credentials exist, labelled where not"},
        {"id": "package", "title": "Package", "cue": "▥",
         "detail": "manifest, readme, deployment config"},
        {"id": "verify", "title": "Check the work", "cue": "◎",
         "detail": "run every check in the spec against what was actually written"},
        {"id": "deploy", "title": f"Deploy · {target}", "cue": "▲",
         "detail": DEPLOY_TARGETS.get(target, "")},
        {"id": "smoke", "title": "Prove it is up", "cue": "◉",
         "detail": "fetch what was deployed and confirm it answers"},
        {"id": "seal", "title": "Seal the run", "cue": "●",
         "detail": "record the fingerprint, artifacts and outcome"},
    ]
    if target == "local":
        for s in stages:
            if s["id"] == "smoke":
                s["optional"] = True
                s["detail"] = "nothing was published, so there is nothing to fetch"
    return stages


def fingerprint(spec: dict) -> str:
    """A stable hash of the spec, excluding the fingerprint field itself."""
    clone = {k: v for k, v in spec.items() if k != "fingerprint"}
    blob = json.dumps(clone, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return "sha256:" + hashlib.sha256(blob.encode("utf-8")).hexdigest()[:32]


def verify_fingerprint(spec: dict) -> bool:
    return spec.get("fingerprint") == fingerprint(spec)


# ===========================================================================
# rendering — the same spec, for a person
# ===========================================================================

def render_markdown(spec: dict) -> str:
    b, a, d = spec["business"], spec["archetype"], spec["deploy"]
    r = spec["readiness"]
    L = [f"# Platform spec — {b['name']}", "",
         f"*{spec['schema']} · compiled {spec['generated']} · `{spec['fingerprint']}`*", "",
         "This is the build order. It is compiled from the blueprint and executed by Forge "
         "with no human in the loop, so every decision it could need is already made here.", "",
         "## Readiness", ""]
    if r["ready"]:
        L += ["**Ready.** Forge can run this unattended.", ""]
    else:
        L += ["**Not ready.** Forge will refuse this spec until these are resolved:", ""]
        L += [f"- {x['what']} — {x['fix']}" for x in r["blocking"]] + [""]

    L += ["## What is being built", "",
          f"- **Archetype**: {a['label']} (`{a['id']}`)"
          + ("" if a["curated"] else " — *no archetype written for this org type yet*"),
          f"- **Why this archetype**: {a['source']}",
          f"- **Site**: {len(spec['site']['pages'])} pages — "
          + ", ".join(p["title"] for p in spec["site"]["pages"]),
          f"- **Platform**: {len(spec['modules'])} modules — "
          + ", ".join(m["title"] for m in spec["modules"]),
          f"- **Deploy**: {d['target']} — {d['description']}",
          f"- **Authorization**: {spec['authorization'].get('mode')}"
          + (f" (consent `{spec['authorization'].get('consent_ref')}`)"
             if spec["authorization"].get("consent_ref") else ""),
          ""]

    src = spec["blueprint_source"]
    if src["added_by_archetype"] or src["dropped_by_archetype"]:
        L += ["### Where the archetype overruled the blueprint", ""]
        for k in src["added_by_archetype"]:
            L.append(f"- **added** `{k}` — this archetype always builds it")
        for k in src["dropped_by_archetype"]:
            L.append(f"- **dropped** `{k}` — this archetype never builds it")
        L.append("")

    L += ["## Build stages", "",
          "| | Stage | What happens |", "|---|---|---|"]
    L += [f"| {s['cue']} | **{s['title']}** | {s['detail']} |" for s in spec["plan"]]
    L += ["", "## Rails", "", "| Rail | Provider | State | For |", "|---|---|---|---|"]
    L += [f"| {i['key']} | {i['provider']} | **{i['mode']}** | {i['purpose']} |"
          for i in spec["integrations"]]

    L += ["", "## Must be true when it finishes", ""]
    L += [f"- {c['assert']}" for c in spec["checks"]]

    if spec["assumptions"]:
        L += ["", "## What the builder decided for you", "",
              "The profile did not supply these, so the archetype's default was used. "
              "Each one is a real thing on a real page — change the profile and recompile "
              "to replace it.", ""]
        L += [f"- **{x['token']}** → {json.dumps(x['value'])[:120]} — {x['reason']}"
              for x in spec["assumptions"]]

    L += ["", "---", "", f"Prepared by {spec['operator']['author_as']}."]
    return "\n".join(L) + "\n"


def render_text(spec: dict) -> str:
    b, a, r = spec["business"], spec["archetype"], spec["readiness"]
    L = [f"PLATFORM SPEC — {b['name']}", "=" * 60,
         f"archetype   : {a['label']} ({a['id']}{'' if a['curated'] else ', generic fallback'})",
         f"              {a['source']}",
         f"modules     : {len(spec['modules'])} — " + ", ".join(m["title"] for m in spec["modules"]),
         f"site        : {len(spec['site']['pages'])} pages — "
         + ", ".join(p["title"] for p in spec["site"]["pages"]),
         f"rails       : " + ", ".join(f"{i['key']}={i['mode']}" for i in spec["integrations"]),
         f"deploy      : {spec['deploy']['target']} ({spec['deploy']['description']})",
         f"authorized  : {spec['authorization'].get('mode')}",
         f"fingerprint : {spec['fingerprint']}",
         ""]
    if r["ready"]:
        L.append("READY — forge can run this unattended.")
    else:
        L.append("NOT READY — forge will refuse it:")
        L += [f"   · {x['what']}\n     -> {x['fix']}" for x in r["blocking"]]
    if spec["assumptions"]:
        L += ["", f"{len(spec['assumptions'])} value(s) filled from the archetype "
                  "(see the markdown spec for the list)."]
    return "\n".join(L)
