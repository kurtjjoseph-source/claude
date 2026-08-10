#!/usr/bin/env python3
"""
site_cards — publish the *generated site* half of the system to Claude Design.

`components/` holds the kit's own hand-authored fragments: what a VOM surface is made
of. It does not describe the other thing this system produces — the public sites Forge
builds for clients — and that half was invisible in the design system even though it is
the half a client actually sees.

The obvious fix (hand-write another eight fragments) would create the exact drift v2 was
written to end: two descriptions of one component, diverging on the first edit. So these
cards are **generated from the renderer itself**. Every rule and every piece of markup
here came out of `site_gen`, at the version sitting in the tree, from a real compiled
spec. Change the renderer and the card changes with it; there is nothing to keep in sync.

    python3 site_cards.py          # writes dist/1x-forge-*.html
    python3 build.py               # runs the authored cards, then this

Falls back with a message when no demo spec is on disk (`forge/demos/` is regenerable
and gitignored), because a card built from an invented spec would be a drawing of the
system rather than the system.

Stdlib only.
"""

from __future__ import annotations

import copy
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
ENGINE = os.path.join(ROOT, "turnkey", "orchestrator", "engine")
DEMOS = os.path.join(ROOT, "turnkey", "forge", "demos")
DIST = os.path.join(HERE, "dist")

sys.path.insert(0, ENGINE)

PAGE = """<!-- @dsCard group="Forge sites" -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · VOM Kit</title>
<style>
{css}
/* preview frame — not part of the kit */
body{{ padding:0 }}
.f-note{{ font-family:var(--mono); font-size:10.5px; letter-spacing:.14em;
  text-transform:uppercase; color:var(--faint); padding:22px 24px 0; margin:0;
  max-width:var(--wrap); margin-inline:auto }}
</style>
</head>
<body>
{body}
</body>
</html>
"""


def spec_for(business: str):
    p = os.path.join(DEMOS, business, "turnkey", "platform-spec.json")
    if not os.path.exists(p):
        return None
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def note(text):
    return f'<p class="f-note">{text}</p>'


def card(name, title, spec, body):
    import site_gen
    with open(os.path.join(DIST, name), "w", encoding="utf-8") as f:
        f.write(PAGE.format(title=title, css=site_gen.css(spec), body=body))
    return name


def main():
    import site_gen

    # One card per typographic stance, so the difference between them is the thing on
    # screen rather than a claim in a docstring.
    picks = [
        ("Bethel Chapel", "10-forge-editorial", "Generated site · editorial (serif)"),
        # Plainsheet rather than Rosterly: Rosterly is the archetype that takes the
        # second skin, so rendering it through the house renderer would put a site on
        # this card that the product no longer builds.
        ("Plainsheet", "11-forge-grotesk", "Generated site · grotesk (tight sans)"),
        ("Kade Ceramics", "12-forge-gallery", "Generated site · gallery (spaced capitals)"),
    ]
    specs = [(n, f, t, spec_for(n)) for n, f, t in picks]
    missing = [n for n, _, _, s in specs if not s]
    if missing:
        print("no compiled spec for: " + ", ".join(missing))
        print("run  python3 ../../turnkey/forge/build.py  first — these cards are "
              "generated from real builds, never from an invented spec.")
        return 1

    os.makedirs(DIST, exist_ok=True)
    built = []

    for business, fname, title, spec in specs:
        home = next(p for p in spec["site"]["pages"] if p["slug"] == "home")
        page = copy.deepcopy(home)
        html = site_gen.render_page(page, spec, "")
        # The card shows the components, not the chrome: keep everything between the
        # header and the footer, which is exactly the hero plus the section stack.
        body = html.split("<main>", 1)[1].split("</main>", 1)[0]
        built.append(card(fname + ".html",
                          title,
                          spec,
                          note(f"{spec['archetype']['forge']['name']} · "
                               f"type preset “{spec['archetype']['type_preset']}” · "
                               f"accent {spec['archetype']['forge']['accent_site']}")
                          + body))

    # And one card that puts every section kind side by side under a single accent, so
    # the vocabulary can be read as a vocabulary.
    spec = specs[1][3]
    kinds = [
        {"kind": "facts", "title": "Facts", "items": [
            {"label": "Setup", "value": "Minutes, not a project"},
            {"label": "Contract", "value": "Monthly, cancel any time"},
            {"label": "Your data", "value": "Exportable, always"}]},
        {"kind": "cards", "title": "Cards", "items": [
            {"title": "A real welcome", "body": "Three to twelve short cards, from a "
                                                "content block or written inline."},
            {"title": "Teaching you can use", "body": "The hover state lifts the card and "
                                                     "draws the accent rule."},
            {"title": "People, not a programme", "body": "Equal columns, whatever the "
                                                        "content length."}]},
        {"kind": "steps", "title": "Steps", "items": [
            {"title": "Numbered", "body": "A sequence, with a rail connecting the nodes."},
            {"title": "In order", "body": "Used only where order carries information."},
            {"title": "And finished", "body": "The rail stops at the last step."}]},
        {"kind": "faq", "title": "FAQ", "items": [
            {"q": "How does the accordion behave?",
             "a": "The first is open, the rest are closed, and the chevron rotates."},
            {"q": "Is it keyboard reachable?",
             "a": "Yes — it is a details/summary element with a visible focus ring."}]},
        {"kind": "pricing", "title": "Pricing", "items": [
            {"name": "Small", "price": "€29", "includes": ["Up to 15 staff", "Everything included"]},
            {"name": "Standard", "price": "€59",
             "includes": ["Up to 40 staff", "Everything included", "Payroll export"]},
            {"name": "Large", "price": "€99", "includes": ["Unlimited staff", "Priority support"]}]},
        {"kind": "pay", "title": "Pay", "provider": "stripe", "action": "Subscribe",
         "options": ["Monthly", "Yearly"],
         "fallback": "Card payment is switched on when the operator supplies the keys."},
        {"kind": "form", "title": "Form", "form": "contact",
         "body": "Submissions land in a named module of the platform.",
         "fields": ["name", "email", "message"], "target": "support_inbox"},
        {"kind": "cta", "title": "One closing call to action",
         "body": "The band is the only place the accent is allowed to fill the screen.",
         "cta": "Start free", "cta_href": "/trial"},
    ]
    body = note("The shared section vocabulary — every archetype page is assembled from "
                "these and only these")
    for i, s in enumerate(kinds):
        body += site_gen.render_section(s, spec, "b" if i % 2 else "a")
    built.append(card("13-forge-sections.html", "Generated site · section vocabulary",
                      spec, body))

    # And the second skin. It is a whole other renderer over the same vocabulary, so it
    # cannot share the card builder above: it brings its own stylesheet, its own script
    # and its own five colour schemes, and the card is interactive so the switcher can
    # actually be used in the Design System pane.
    hi = spec_for("Rosterly")
    if hi and hi["archetype"].get("skin") == "hitech":
        import skin_hitech
        home = next(p for p in hi["site"]["pages"] if p["slug"] == "home")
        html = skin_hitech.render_page(copy.deepcopy(home), hi, "")
        with open(os.path.join(DIST, "14-forge-hitech.html"), "w", encoding="utf-8") as f:
            f.write(html.replace(
                "<body>",
                '<body>\n<!-- @dsCard group="Forge sites" -->', 1))
        built.append("14-forge-hitech.html")

    print(f"generated {len(built)} Forge-site cards into dist/")
    for b in built:
        print("  " + b)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
