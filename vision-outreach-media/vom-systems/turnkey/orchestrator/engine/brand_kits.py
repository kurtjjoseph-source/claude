#!/usr/bin/env python3
"""
brand_kits — the predesigned brand kits every forge builds under.

Until now a business inherited its colours from its *archetype*: every church Forge
built was the same orange, every shop the same rose. That is a sensible default and a
terrible identity — two churches in the same town shipped the same site in the same
colour, and the owner had nothing to hand a printer, a sign maker or a designer.

A BRAND KIT is the missing artifact. It is not a theme file and not a colour picker:
it is the thing a studio delivers at the start of a job — a named palette with roles
and print values, a typographic pairing, a voice, and the usage rules that keep the
two honest. The same document a Dutch studio would call a *huisstijlhandboek*.

Three properties make it work inside an unattended pipeline:

  * **Predesigned, not generated.** Every kit below was authored and contrast-checked.
    Nobody picks a colour mid-build, and no build waits on a designer.
  * **Every archetype has a default that changes nothing.** `default_for("church")`
    resolves to a kit carrying that archetype's exact accent, type preset and ground —
    so a business that never visits the branding step builds exactly as it did before.
    The step adds a choice; it never adds a blocker.
  * **The kit is a file, like every other milestone.** `turnkey/brand-kit.json` is what
    the spec compiler reads, `turnkey/brand-kit.md` is what a person reads, and
    `turnkey/brand-manual.html` is what gets printed. Progress is measured by asking
    the filesystem, exactly as the factory measures everything else.

The published palette follows the five roles a brand manual actually uses — primary,
secondary, background, text, neutral — with HEX, RGB and CMYK for each, because the
person who needs CMYK is the printer and they will not accept a CSS variable. The
working tokens the renderer needs (muted ink, sunk surfaces, washes) are *derived* from
those five with `color-mix`, so there is exactly one place a colour is decided.

Stdlib only, no network, no randomness — the same kit always compiles to the same CSS.
"""

from __future__ import annotations

import json
import os
import re

SCHEMA = 1

CHOICE_REL = "turnkey/brand-kit.json"
MANUAL_REL = "turnkey/brand-kit.md"
MANUAL_HTML_REL = "turnkey/brand-manual.html"


# ===========================================================================
# the house grounds
# ===========================================================================
#
# Every kit is the VOM Kit's structure — one ground, one ink scale, one accent slot —
# with its own values dropped in. A kit authors the ground for the scheme it is designed
# in; the opposite scheme is generated from the house ground so that a light kit still
# has an honest dark mode nobody had to draw.

HOUSE_LIGHT = {"paper": "#F6F5F1", "paper_2": "#FFFFFF", "card": "#FFFFFF",
               "ink": "#1A1D1B", "line": "#E1DFD4"}
HOUSE_DARK = {"paper": "#0E100F", "paper_2": "#121513", "card": "#171B19",
              "ink": "#F0F2EE", "line": "#2A322D"}


# ===========================================================================
# the kits
# ===========================================================================
#
# Each kit declares:
#   primary        the accent, authored to be legible on ITS OWN ground (not on black)
#   primary_bright the same hue lifted for the opposite scheme and for glows
#   on_primary     what sits on top of a primary fill
#   secondary      the supporting hue — bands, second-tier marks
#   ground         paper / card / ink / line for the scheme this kit is drawn in
#   type           the display + body families and which of site_gen's presets carries it
#   voice, usage   the two paragraphs a manual is actually read for
#   suits          archetypes this was drawn for; `default_for` names one per archetype
#
# `house: True` marks the eleven kits that reproduce an archetype's existing look exactly.
# They are real kits, not stubs — they are simply the ones that were already shipping.

def _kit(**kw):
    kw.setdefault("house", False)
    kw.setdefault("scheme", "light")
    kw.setdefault("suits", [])
    return kw


KITS = [
    # ---- the house defaults, one per archetype ---------------------------
    _kit(
        id="sanctuary-ember", name="Sanctuary Ember", family="Warm",
        best_for="Churches, chapels and faith communities",
        primary="#c05708", primary_bright="#F97316", on_primary="#FFFFFF",
        secondary="#7A5C3E", band="#1B2A4A", on_band="#FFFFFF",
        ground=dict(HOUSE_LIGHT),
        type={"preset": "editorial", "heading": "Iowan Old Style", "body": "Manrope"},
        voice="Warm, plain and unhurried. It welcomes before it informs and informs "
              "before it asks. No hype, no jargon, no pressure.",
        usage="Ember is for one thing per screen — the invitation, the giving button, "
              "the date of the next gathering. Set it against the warm paper, never "
              "against the navy band, and never as body text.",
        colors={"primary": "Ember Orange", "secondary": "Chapel Clay",
                "background": "Warm Paper", "text": "Deep Bark", "neutral": "Sand Line"},
        house=True, suits=["church"]),

    _kit(
        id="sky-practice", name="Sky Practice", family="Cool",
        best_for="Consultants, freelancers and one-person service companies",
        primary="#0c7bb3", primary_bright="#38BDF8", on_primary="#FFFFFF",
        secondary="#4C6B7A", band="#1B2A4A", on_band="#FFFFFF",
        ground=dict(HOUSE_LIGHT),
        type={"preset": "humanist", "heading": "Avenir Next", "body": "Manrope"},
        voice="Direct and specific. It names the problem in the client's words, states "
              "the price, and says what happens next. Confidence without volume.",
        usage="Sky carries the single action on every page — book, quote, reply. Two "
              "blue buttons on one screen means neither is the next step.",
        colors={"primary": "Practice Blue", "secondary": "Harbour Slate",
                "background": "Warm Paper", "text": "Deep Bark", "neutral": "Sand Line"},
        house=True, suits=["solo_business"]),

    _kit(
        id="harvest-field", name="Harvest Field", family="Natural",
        best_for="Charities, foundations and volunteer-run causes",
        primary="#047857", primary_bright="#10B981", on_primary="#FFFFFF",
        secondary="#7A6A3E", band="#14342A", on_band="#FFFFFF",
        ground=dict(HOUSE_LIGHT),
        type={"preset": "editorial", "heading": "Iowan Old Style", "body": "Manrope"},
        voice="Sober and accountable. It reports what was done and what it cost before "
              "it asks for the next gift. Gratitude, never guilt.",
        usage="Green is the colour of the ask and of published figures — nothing else. "
              "Any page carrying a donation button publishes a number beside it.",
        colors={"primary": "Field Green", "secondary": "Dry Straw",
                "background": "Warm Paper", "text": "Deep Bark", "neutral": "Sand Line"},
        house=True, suits=["nonprofit"]),

    _kit(
        id="rose-counter", name="Rose Counter", family="Retail",
        best_for="Online shops, makers and small-batch product businesses",
        primary="#be123c", primary_bright="#F43F5E", on_primary="#FFFFFF",
        secondary="#6D5560", band="#241017", on_band="#FFFFFF",
        ground=dict(HOUSE_LIGHT),
        type={"preset": "gallery", "heading": "Didot", "body": "Manrope"},
        voice="Plain about the object. What it is, what it is made of, how long it "
              "takes to arrive. The photograph sells it; the words remove doubt.",
        usage="Rose is a price, a sold-out badge, an add-to-basket. It never tints a "
              "product photograph and never fills a full-width band.",
        colors={"primary": "Counter Rose", "secondary": "Muted Plum",
                "background": "Warm Paper", "text": "Deep Bark", "neutral": "Sand Line"},
        house=True, suits=["ecommerce"]),

    _kit(
        id="signal-violet", name="Signal Violet", family="Digital",
        best_for="Templates, downloads and other digital products",
        primary="#6d28d9", primary_bright="#8B5CF6", on_primary="#FFFFFF",
        secondary="#4C566A", band="#17142A", on_band="#FFFFFF",
        ground=dict(HOUSE_LIGHT),
        type={"preset": "grotesk", "heading": "Inter / system grotesk", "body": "Manrope"},
        voice="Concrete. It says what is inside the file, what it opens in, and who "
              "already uses it. No promises the download cannot keep.",
        usage="Violet marks the buy and the file itself. Screenshots keep their own "
              "colours — tinting them to match the brand hides the product.",
        colors={"primary": "Signal Violet", "secondary": "Cold Slate",
                "background": "Warm Paper", "text": "Deep Bark", "neutral": "Sand Line"},
        house=True, suits=["digital_products"]),

    _kit(
        id="long-table-amber", name="Long Table Amber", family="Warm",
        best_for="Membership clubs, supporter circles and subscription communities",
        primary="#b45309", primary_bright="#F59E0B", on_primary="#FFFFFF",
        secondary="#5F5B4E", band="#2A1F10", on_band="#FFFFFF",
        ground=dict(HOUSE_LIGHT),
        type={"preset": "humanist", "heading": "Avenir Next", "body": "Manrope"},
        voice="Belonging before benefit. It describes the people first and the perks "
              "second, and it is honest that membership is a commitment.",
        usage="Amber is the join and the renew. Members-only areas use the neutral "
              "line, not amber — the colour is for the door, not the room.",
        colors={"primary": "Table Amber", "secondary": "Olive Stone",
                "background": "Warm Paper", "text": "Deep Bark", "neutral": "Sand Line"},
        house=True, suits=["membership"]),

    _kit(
        id="teal-seminar", name="Teal Seminar", family="Academic",
        best_for="Schools, courses and training organisations",
        primary="#0f766e", primary_bright="#14B8A6", on_primary="#FFFFFF",
        secondary="#5A6B63", band="#0E2A28", on_band="#FFFFFF",
        ground=dict(HOUSE_LIGHT),
        type={"preset": "editorial", "heading": "Iowan Old Style", "body": "Manrope"},
        voice="Teacherly without being patronising. It says who the course is for, "
              "who it is not for, and what a person can do at the end of it.",
        usage="Teal marks enrolment and progress. Course levels are distinguished by "
              "typography and layout, never by inventing extra brand colours.",
        colors={"primary": "Seminar Teal", "secondary": "Slate Sage",
                "background": "Warm Paper", "text": "Deep Bark", "neutral": "Sand Line"},
        house=True, suits=["education"]),

    _kit(
        id="house-fuchsia", name="House Fuchsia", family="Retail",
        best_for="Venues, halls and rooms that are hired out",
        primary="#a21caf", primary_bright="#D946EF", on_primary="#FFFFFF",
        secondary="#5E5560", band="#2A0F2C", on_band="#FFFFFF",
        ground=dict(HOUSE_LIGHT),
        type={"preset": "gallery", "heading": "Didot", "body": "Manrope"},
        voice="The room speaks first. Capacity, hours, what is included, what it costs "
              "— answered before anyone has to ask.",
        usage="Fuchsia is the enquiry and the availability marker. Photographs of the "
              "space run untinted and full bleed; the colour lives in the furniture "
              "around them.",
        colors={"primary": "House Fuchsia", "secondary": "Stage Mauve",
                "background": "Warm Paper", "text": "Deep Bark", "neutral": "Sand Line"},
        house=True, suits=["local_venue"]),

    _kit(
        id="terminal-indigo", name="Terminal Indigo", family="Digital", scheme="dark",
        best_for="Software products with a live application behind the site",
        primary="#818CF8", primary_bright="#6366F1", on_primary="#0B0B14",
        secondary="#7C8B99", band="#1B1B2E", on_band="#EEF0FF",
        ground={"paper": "#0B0B14", "paper_2": "#11121D", "card": "#161827",
                "ink": "#EEF0F8", "line": "#262A3D"},
        type={"preset": "grotesk", "heading": "Inter / system grotesk", "body": "Manrope"},
        voice="Shows the product working before it explains it. Numbers, states and "
              "screens; claims only where a screenshot backs them.",
        usage="Indigo is interactive state — the live figure, the primary action, the "
              "focus ring. Static text stays on the ink scale so the moving parts read "
              "as the moving parts.",
        colors={"primary": "Terminal Indigo", "secondary": "Console Slate",
                "background": "Deep Space", "text": "Signal White", "neutral": "Grid Line"},
        house=True, suits=["saas"]),

    _kit(
        id="waitlist-green", name="Waitlist Green", family="Natural",
        best_for="Prelaunch funnels — one page, one question",
        primary="#278453", primary_bright="#38D07F", on_primary="#FFFFFF",
        secondary="#4E6357", band="#12281D", on_band="#FFFFFF",
        ground=dict(HOUSE_LIGHT),
        type={"preset": "grotesk", "heading": "Inter / system grotesk", "body": "Manrope"},
        voice="One promise, one ask, no filler. It is honest that the thing does not "
              "exist yet and specific about what joining gets you.",
        usage="Green appears exactly once per page: the join button. A second green "
              "element on a waitlist page costs signups.",
        colors={"primary": "Waitlist Green", "secondary": "Moss Slate",
                "background": "Warm Paper", "text": "Deep Bark", "neutral": "Sand Line"},
        house=True, suits=["prelaunch"]),

    _kit(
        id="plain-paper", name="Plain Paper", family="Neutral",
        best_for="Any business that wants the work to do the talking",
        primary="#0e837b", primary_bright="#2FA8A0", on_primary="#FFFFFF",
        secondary="#6B6F6C", band="#1B2A4A", on_band="#FFFFFF",
        ground=dict(HOUSE_LIGHT),
        type={"preset": "humanist", "heading": "Avenir Next", "body": "Manrope"},
        voice="Unadorned. Short sentences, real figures, no adjectives that could be "
              "deleted without losing meaning.",
        usage="The neutral kit relies on space and hierarchy rather than colour. If a "
              "page needs a second accent to be readable, the layout is wrong.",
        colors={"primary": "Working Teal", "secondary": "Stone Grey",
                "background": "Warm Paper", "text": "Deep Bark", "neutral": "Sand Line"},
        house=True, suits=["generic"]),

    # ---- the alternatives, open to any business --------------------------
    _kit(
        id="cathedral-ink", name="Cathedral Ink", family="Classic",
        best_for="Institutions with history — churches, schools, foundations, law",
        primary="#1E3A5F", primary_bright="#3B6EA5", on_primary="#FFFFFF",
        secondary="#A17C36", band="#132436", on_band="#F3EFE6",
        ground={"paper": "#F5F4F0", "paper_2": "#FFFFFF", "card": "#FFFFFF",
                "ink": "#14181F", "line": "#DEDCD4"},
        type={"preset": "editorial", "heading": "Iowan Old Style", "body": "Manrope"},
        voice="Measured and unhurried. It assumes the reader has time and rewards them "
              "with substance rather than urgency.",
        usage="Navy is structure — bands, rules, headings. The gold secondary is a "
              "seal: a crest, a date, a single underline. Never a button.",
        colors={"primary": "Cathedral Navy", "secondary": "Reliquary Gold",
                "background": "Stone Paper", "text": "Midnight Ink", "neutral": "Chalk Line"},
        suits=["church", "nonprofit", "education", "solo_business"]),

    _kit(
        id="quiet-authority", name="Quiet Authority", family="Professional",
        best_for="Advisory, legal, financial and other trust-first services",
        primary="#2F4858", primary_bright="#4E7186", on_primary="#FFFFFF",
        secondary="#8A6552", band="#1B2932", on_band="#FFFFFF",
        ground={"paper": "#F7F6F3", "paper_2": "#FFFFFF", "card": "#FFFFFF",
                "ink": "#191C1E", "line": "#E2E0DA"},
        type={"preset": "humanist", "heading": "Avenir Next", "body": "Manrope"},
        voice="Calm and exact. It does not sell; it explains, prices, and lets the "
              "reader decide. Every claim carries a number or a name.",
        usage="Slate does the work of black without its coldness. The terracotta "
              "secondary appears once per page at most, usually on the figure that "
              "matters.",
        colors={"primary": "Authority Slate", "secondary": "Warm Terracotta",
                "background": "Document Paper", "text": "Near Black", "neutral": "Rule Line"},
        suits=["solo_business", "saas", "education", "generic"]),

    _kit(
        id="atelier-noir", name="Atelier Noir", family="Luxury", scheme="dark",
        best_for="Studios, galleries, premium goods and rooms that sell on atmosphere",
        primary="#C8AF86", primary_bright="#E0CCA6", on_primary="#12100C",
        secondary="#8A8578", band="#1A1712", on_band="#EFE9DC",
        ground={"paper": "#100F0D", "paper_2": "#161511", "card": "#1B1915",
                "ink": "#F2EFE7", "line": "#2C2924"},
        type={"preset": "gallery", "heading": "Didot", "body": "Manrope"},
        voice="Restrained to the point of austerity. Nouns, materials, dimensions. "
              "The absence of persuasion is the persuasion.",
        usage="Brass is a rule, a caption, a single link — never a filled button larger "
              "than its own words. Images sit on the black ground with generous margins "
              "and no border.",
        colors={"primary": "Atelier Brass", "secondary": "Ash Taupe",
                "background": "Studio Black", "text": "Gallery White", "neutral": "Frame Line"},
        suits=["ecommerce", "local_venue", "solo_business", "membership"]),

    _kit(
        id="bone-brass", name="Bone & Brass", family="Retail",
        best_for="Makers, ceramics, food and anything sold by the hand that made it",
        primary="#8A6A21", primary_bright="#B98F32", on_primary="#FFFFFF",
        secondary="#6E6357", band="#241E10", on_band="#F7F2E4",
        ground={"paper": "#F8F5EC", "paper_2": "#FFFFFF", "card": "#FFFFFF",
                "ink": "#1C1A15", "line": "#E7E0CE"},
        type={"preset": "gallery", "heading": "Didot", "body": "Manrope"},
        voice="Material-first. It names the clay, the kiln, the batch size and the "
              "week it ships. Craft is described, never claimed.",
        usage="Brass marks price and provenance. Cream is the ground for everything — "
              "white cards are for photography only.",
        colors={"primary": "Kiln Brass", "secondary": "Workbench Grey",
                "background": "Bone Paper", "text": "Char Ink", "neutral": "Sand Line"},
        suits=["ecommerce", "local_venue", "membership", "generic"]),

    _kit(
        id="studio-terracotta", name="Studio Terracotta", family="Warm",
        best_for="Creators, photographers, writers and personal-brand businesses",
        primary="#A93F26", primary_bright="#D4623F", on_primary="#FFFFFF",
        secondary="#6B5B4A", band="#2A1710", on_band="#FBF6F1",
        ground={"paper": "#FAF6F1", "paper_2": "#FFFFFF", "card": "#FFFFFF",
                "ink": "#1F1712", "line": "#ECE0D4"},
        type={"preset": "humanist", "heading": "Avenir Next", "body": "Manrope"},
        voice="First person, unforced. The work is shown before it is explained, and "
              "the person behind it is named on the first screen.",
        usage="Terracotta is a signature — one heading rule, one button, one mark. The "
              "portfolio itself brings the colour.",
        colors={"primary": "Studio Terracotta", "secondary": "Driftwood",
                "background": "Canvas Paper", "text": "Umber Ink", "neutral": "Clay Line"},
        suits=["solo_business", "membership", "local_venue", "generic"]),

    _kit(
        id="terminal-slate", name="Terminal Slate", family="Digital", scheme="dark",
        best_for="Technical products, APIs, tools and anything sold to builders",
        primary="#38BDF8", primary_bright="#7DD3FC", on_primary="#08111A",
        secondary="#7C8B99", band="#111A22", on_band="#E6F1F8",
        ground={"paper": "#0A1119", "paper_2": "#0F1821", "card": "#131E28",
                "ink": "#E8EEF3", "line": "#22303C"},
        type={"preset": "grotesk", "heading": "Inter / system grotesk", "body": "Manrope"},
        voice="Documentation register. Code before prose, defaults stated, limits "
              "published. It respects the reader's time by being scannable.",
        usage="Cyan is a link, a live value, a focus ring. Code blocks keep syntax "
              "colours; the brand does not overrule a language's own highlighting.",
        colors={"primary": "Terminal Cyan", "secondary": "Console Slate",
                "background": "Deep Slate", "text": "Signal White", "neutral": "Grid Line"},
        suits=["saas", "digital_products"]),

    _kit(
        id="nordic-fog", name="Nordic Fog", family="Cool",
        best_for="Modern services that want to look current without shouting",
        primary="#245C8C", primary_bright="#4A8FC4", on_primary="#FFFFFF",
        secondary="#5A6672", band="#16222C", on_band="#FFFFFF",
        ground={"paper": "#F4F6F8", "paper_2": "#FFFFFF", "card": "#FFFFFF",
                "ink": "#151A1F", "line": "#DFE4E9"},
        type={"preset": "grotesk", "heading": "Inter / system grotesk", "body": "Manrope"},
        voice="Spare and functional. Short headings, generous space, no decorative "
              "adjectives. Everything on the page is there to be used.",
        usage="One blue action per view. The cool grey ground carries the hierarchy; "
              "if a section needs emphasis it gets space, not colour.",
        colors={"primary": "Fjord Blue", "secondary": "Fog Slate",
                "background": "Fog Paper", "text": "Basalt Ink", "neutral": "Mist Line"},
        suits=["saas", "digital_products", "solo_business", "education", "generic"]),
]

BY_ID = {k["id"]: k for k in KITS}

# The kit each archetype builds under when nobody chooses. Authored to reproduce that
# archetype's existing accent, type preset and ground exactly — so adding the branding
# step changed nothing about what an untouched pipeline ships.
DEFAULTS = {
    "church": "sanctuary-ember",
    "solo_business": "sky-practice",
    "nonprofit": "harvest-field",
    "ecommerce": "rose-counter",
    "digital_products": "signal-violet",
    "membership": "long-table-amber",
    "education": "teal-seminar",
    "local_venue": "house-fuchsia",
    "saas": "terminal-indigo",
    "prelaunch": "waitlist-green",
    "generic": "plain-paper",
}


# ===========================================================================
# colour maths — hex in, what a printer and a checker need out
# ===========================================================================

_HEX = re.compile(r"^#?([0-9a-fA-F]{6})$")


def rgb(hex_value: str) -> tuple:
    m = _HEX.match((hex_value or "").strip())
    if not m:
        raise ValueError(f"not a 6-digit hex colour: {hex_value!r}")
    h = m.group(1)
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def cmyk(hex_value: str) -> tuple:
    """Naive RGB->CMYK, the same conversion a design tool shows before a colour profile
    is applied. Published as guidance for a printer, not as a colour-managed value —
    which is what the manual says beside it."""
    r, g, b = (v / 255 for v in rgb(hex_value))
    k = 1 - max(r, g, b)
    if k >= 1:
        return 0, 0, 0, 100
    c = (1 - r - k) / (1 - k)
    m = (1 - g - k) / (1 - k)
    y = (1 - b - k) / (1 - k)
    return tuple(round(v * 100) for v in (c, m, y, k))


def _lin(c: float) -> float:
    c = c / 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(hex_value: str) -> float:
    r, g, b = rgb(hex_value)
    return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)


def contrast(a: str, b: str) -> float:
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return round((hi + 0.05) / (lo + 0.05), 2)


# The pairs every kit must survive. A brand kit that ships an unreadable page is not a
# brand kit, and the archetype accents proved once already that a colour picked on black
# fails on paper — so this runs in the self-test, not in somebody's eye.
def audit(kit: dict) -> list:
    """Every contrast pair in the kit that falls short, as plain sentences."""
    g = kit["ground"]
    bad = []

    def need(a, b, minimum, what):
        r = contrast(a, b)
        if r < minimum:
            bad.append(f"{kit['id']}: {what} is {r}:1, needs {minimum}:1 ({a} on {b})")

    need(g["ink"], g["paper"], 7.0, "body text on the ground")
    need(g["ink"], g["card"], 7.0, "body text on a card")
    need(kit["on_primary"], kit["primary"], 4.5, "label on a primary fill")
    need(kit["primary"], g["paper"], 3.0, "primary as a mark on the ground")
    need(kit["primary"], g["card"], 3.0, "primary as a mark on a card")
    need(kit["on_band"], kit["band"], 4.5, "text on the band")
    need(kit["secondary"], g["paper"], 3.0, "secondary as a mark on the ground")

    # The DERIVED scale, not just the published five. This is the gap that let a real
    # defect ship: every pair above passed while `--faint` — the colour of the footer
    # headings, the fact labels, the form note and every field label — sat at 3.0:1 on a
    # white card. A kit is only as readable as the values a renderer mixes from it, so
    # the mixed values are audited exactly like the authored ones.
    faint = fit_text(_mix(g["ink"], g["paper"], 0.47), [g["paper"], g["card"]])
    muted = _mix(g["ink"], g["paper"], 0.68)
    need(muted, g["paper"], 4.5, "muted ink on the ground")
    need(muted, g["card"], 4.5, "muted ink on a card")
    need(faint, g["paper"], 4.5, "faint ink on the ground")
    need(faint, g["card"], 4.5, "faint ink on a card")
    need(fit_text(kit["primary"], [g["paper"], g["card"]]), g["paper"], 4.5,
         "the accent as small text on the ground")

    # The scheme the kit was NOT drawn in is real: every page ships both, and the visitor's
    # own preference decides which they see. Checking only the authored one is checking
    # half the sites this kit will ever build.
    a, _, on_a = alt_accent(kit)
    alt_g = HOUSE_LIGHT if kit.get("scheme") == "dark" else HOUSE_DARK
    need(alt_g["ink"], alt_g["paper"], 7.0, "body text on the generated ground")
    need(on_a, a, 4.5, "label on a primary fill, generated scheme")
    need(a, alt_g["paper"], 3.0, "primary as a mark, generated scheme")
    return bad


def audit_all() -> list:
    out = []
    for k in KITS:
        out += audit(k)
    return out


# ===========================================================================
# the published palette — the five roles a brand manual is read for
# ===========================================================================

ROLE_ORDER = ["primary", "secondary", "background", "text", "neutral"]


def swatches(kit: dict) -> list:
    """The kit's palette in the vocabulary a designer and a printer share.

    Five roles, each with the name the kit gave it and the three value systems anybody
    downstream asks for. Derived from the kit rather than typed twice, so a colour can
    never disagree with itself between the CSS and the manual."""
    g = kit["ground"]
    values = {"primary": kit["primary"], "secondary": kit["secondary"],
              "background": g["paper"], "text": g["ink"], "neutral": g["line"]}
    out = []
    for role in ROLE_ORDER:
        hexv = values[role].upper()
        r, gg, b = rgb(hexv)
        c, m, y, k = cmyk(hexv)
        out.append({
            "role": role,
            "name": kit["colors"][role],
            "hex": hexv,
            "rgb": f"{r}, {gg}, {b}",
            "cmyk": f"{c} / {m} / {y} / {k}",
            "on": "#FFFFFF" if luminance(hexv) < 0.35 else "#111111",
        })
    return out


# ===========================================================================
# the tokens the renderer consumes
# ===========================================================================

def _decls(g: dict, accent: str, accent_2: str, on_accent: str,
           band: str, on_band: str, dark: bool) -> str:
    """One scheme's worth of VOM Kit tokens.

    The five published colours decide everything; the in-between values a renderer needs
    — muted ink, faint ink, soft lines, sunk surfaces, washes — are mixed from them in
    CSS rather than authored, so there is exactly one place each colour is decided."""
    shadow = ("--shadow-1:0 1px 2px rgba(0,0,0,.35);"
              "--shadow-2:0 18px 44px rgba(0,0,0,.5);" if dark else
              "--shadow-1:0 1px 2px rgba(26,29,27,.05),0 2px 10px rgba(26,29,27,.045);"
              "--shadow-2:0 2px 6px rgba(26,29,27,.06),0 18px 40px rgba(26,29,27,.10);")
    # `--faint` and `--accent` both end up carrying real words — fact labels, footer
    # headings, the hero eyebrow — so both are fitted to the ground rather than mixed at
    # a strength that only had to look right. `--accent-text` exists because the fill
    # colour and the text colour of an accent are two different requirements: white on
    # the fill needs 4.5, and the accent as small text on paper needs 4.5 too, and one
    # value rarely satisfies both.
    faint = fit_text(_mix(g["ink"], g["paper"], 0.47), [g["paper"], g["card"]])
    accent_text = fit_text(accent, [g["paper"], g["card"]])
    return f"""
    --paper:{g['paper']}; --paper-2:{g['paper_2']}; --card:{g['card']}; --ink:{g['ink']};
    --muted:color-mix(in srgb,{g['ink']} 68%,{g['paper']});
    --faint:{faint};
    --line:{g['line']}; --line-soft:color-mix(in srgb,{g['line']} 55%,{g['paper']});
    --raised:{g['card']}; --sunk:color-mix(in srgb,{g['line']} 42%,{g['paper']});
    --accent:{accent}; --accent-2:{accent_2}; --on-accent:{on_accent};
    --accent-text:{accent_text};
    --band:{band}; --on-band:{on_band};
    {shadow}
    --wash-1:color-mix(in srgb,{accent} 13%,transparent);
    --wash-2:color-mix(in srgb,{band} 8%,transparent);"""


def _mix(a: str, b: str, weight: float) -> str:
    """`weight` of a, the rest of b — the Python twin of CSS color-mix, so a derived
    colour can be measured here before it is written into a stylesheet."""
    ra, ga, ba = rgb(a)
    rb, gb, bb = rgb(b)
    return "#%02x%02x%02x" % tuple(round(x * weight + y * (1 - weight))
                                   for x, y in ((ra, rb), (ga, gb), (ba, bb)))


def fit_text(hex_value: str, grounds: list, minimum: float = 4.5) -> str:
    """The same hue, walked along lightness until it is READABLE on every ground given.

    The kit's five published colours are chosen to look right; the in-between values a
    renderer needs are then mixed from them at a fixed strength — and a fixed strength is
    an aesthetic decision pretending to be a legibility one. `--faint` at 47% ink lands
    at 3.0:1 on a white card: it shipped as the colour of the footer headings, the fact
    labels and the form note on every site this engine has ever built.

    So the mix is the starting point and this is the floor. Hue and saturation are held,
    lightness moves away from the ground, and it stops the moment every pair clears."""
    if not grounds:
        return hex_value
    dark_ground = sum(luminance(g) for g in grounds) / len(grounds) < 0.25
    step = 0.01 if dark_ground else -0.01
    cur = hex_value
    for _ in range(120):
        if all(contrast(cur, g) >= minimum for g in grounds):
            return cur.upper()
        cur = lift(cur, step)
    return cur.upper()   # walked to the end of the axis; the audit will say so


def lift(hex_value: str, amount: float) -> str:
    """The same hue, moved along the lightness axis. Positive lifts, negative darkens.

    Used only to derive the neon variants the hi-tech skin needs from a kit's own two
    authored colours — a kit never has to hand-write a set of colours for a renderer it
    may never be used with."""
    import colorsys
    r, g, b = (v / 255 for v in rgb(hex_value))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    l = min(1.0, max(0.0, l + amount))
    rr, gg, bb = colorsys.hls_to_rgb(h, l, s)
    return "#%02x%02x%02x" % tuple(round(v * 255) for v in (rr, gg, bb))


def hitech_scheme(kit: dict) -> dict:
    """The kit expressed as one of the hi-tech skin's colour schemes.

    The second skin is a neon dark page with a live switcher, not a paper site — it has
    no ground and no ink scale to swap. So the kit arrives there as *the default scheme*,
    derived from its own primary and secondary, and the five house schemes stay as the
    switcher's alternatives. Without this, choosing a kit for a SaaS would change the
    manual and nothing on the screen."""
    a = kit["primary_bright"]
    return {
        "id": "kit-" + kit["id"], "name": kit["name"],
        "a": a,
        "b": lift(kit["secondary"], 0.26),
        "c": lift(a, 0.12),
        "glow": kit["primary"],
        "bg": kit["ground"]["paper"] if kit.get("scheme") == "dark"
              else lift(kit["primary"], -0.42),
    }


def alt_accent(kit: dict) -> tuple:
    """(accent, accent_2, on_accent) for the scheme the kit was NOT drawn in.

    Not a swap — a fit. An accent drawn for a black ground is chosen to *glow*, and
    Atelier Noir's pale brass is a legible mark on black and an illegible button on
    paper: white-on-brass is 1.7:1. So the hue is held and the lightness is walked until
    both pairs that matter actually pass, which is the same lesson the archetype accents
    taught when a colour picked on the build console failed on a client's page."""
    dark_kit = kit.get("scheme") == "dark"
    ground = (HOUSE_LIGHT if dark_kit else HOUSE_DARK)
    paper = ground["paper"]
    on = "#FFFFFF" if dark_kit else paper
    # Walk away from the ground: darker for paper, lighter for a dark ground.
    step = -0.01 if dark_kit else 0.01
    base = kit["primary"] if dark_kit else kit["primary_bright"]
    c = base
    for i in range(0, 90):
        c = lift(base, step * i)
        if contrast(on, c) >= 4.55 and contrast(c, paper) >= 3.0:
            break
    return c, lift(c, 0.10 if dark_kit else -0.06), on


def css_tokens(kit: dict) -> dict:
    """The kit as two complete schemes.

    A kit authors the ground for the scheme it was drawn in. The opposite scheme is
    generated from the house ground with a fitted sibling of the kit's accent in the slot
    — which is how a light kit gets an honest dark mode that nobody had to draw, and why
    turning on dark mode never lands a client on a page in somebody else's colours."""
    dark_kit = kit.get("scheme") == "dark"
    own, other = kit["ground"], (HOUSE_LIGHT if dark_kit else HOUSE_DARK)
    own_d = _decls(own, kit["primary"], kit["primary_bright"], kit["on_primary"],
                   kit["band"], kit["on_band"], dark_kit)
    a, a2, on_a = alt_accent(kit)
    if dark_kit:
        other_d = _decls(other, a, a2, on_a, kit["band"], kit["on_band"], False)
    else:
        # The band on a dark ground is the ground itself raised a step — a navy panel on
        # near-black reads as a rectangle of mud.
        other_d = _decls(other, a, a2, on_a, other["card"], other["ink"], True)
    return {"light": other_d if dark_kit else own_d,
            "dark": own_d if dark_kit else other_d}


# ===========================================================================
# resolution — what the pipeline actually calls
# ===========================================================================

def by_id(kit_id: str) -> dict:
    return BY_ID.get((kit_id or "").strip())


def default_id_for(archetype_id: str) -> str:
    return DEFAULTS.get(archetype_id or "", DEFAULTS["generic"])


def default_for(archetype_id: str) -> dict:
    return BY_ID[default_id_for(archetype_id)]


def resolve(kit_id: str, archetype_id: str) -> tuple:
    """(kit, source). An unknown id falls back to the archetype default rather than
    failing the build — a typo in a kit name must not take a business offline — but the
    source says `fallback` so the spec records that the choice was not honoured."""
    if kit_id:
        k = by_id(kit_id)
        if k:
            return k, "chosen"
        return default_for(archetype_id), "fallback"
    return default_for(archetype_id), "default"


def to_brand(kit: dict, source: str = "default") -> dict:
    """The block the spec carries and the renderers read."""
    g = kit["ground"]
    return {
        "id": kit["id"], "name": kit["name"], "family": kit["family"],
        "source": source,
        "scheme": kit.get("scheme", "light"),
        "best_for": kit["best_for"],
        "accent": kit["primary"], "accent_bright": kit["primary_bright"],
        "on_accent": kit["on_primary"], "secondary": kit["secondary"],
        "band": kit["band"], "on_band": kit["on_band"],
        "paper": g["paper"], "card": g["card"], "ink": g["ink"], "line": g["line"],
        "type": dict(kit["type"]),
        "voice": kit["voice"], "usage": kit["usage"],
        "swatches": swatches(kit),
        "tokens": css_tokens(kit),
        "hitech": hitech_scheme(kit),
    }


def catalog(archetype_id: str = "") -> list:
    """What the picker draws. Kits this archetype was drawn for come first, the default
    first of all — the same rule the archetype directory follows."""
    dflt = default_id_for(archetype_id) if archetype_id else ""
    out = []
    for k in KITS:
        suits = archetype_id and (archetype_id in k["suits"])
        out.append({
            "id": k["id"], "name": k["name"], "family": k["family"],
            "best_for": k["best_for"], "scheme": k.get("scheme", "light"),
            "voice": k["voice"], "usage": k["usage"],
            "type": dict(k["type"]),
            "accent": k["primary"], "accent_bright": k["primary_bright"],
            "on_accent": k["on_primary"], "secondary": k["secondary"],
            "paper": k["ground"]["paper"], "card": k["ground"]["card"],
            "ink": k["ground"]["ink"], "line": k["ground"]["line"],
            "band": k["band"], "on_band": k["on_band"],
            "swatches": swatches(k),
            "recommended": bool(suits),
            "is_default": k["id"] == dflt,
        })
    out.sort(key=lambda x: (not x["is_default"], not x["recommended"], x["name"]))
    return out


# ===========================================================================
# the choice on disk
# ===========================================================================

def choice_path(idea_folder: str) -> str:
    return os.path.join(idea_folder, *CHOICE_REL.split("/"))


def read_choice(idea_folder: str) -> dict:
    try:
        with open(choice_path(idea_folder), encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def write_choice(idea_folder: str, kit: dict, archetype_id: str, *,
                 chosen_by: str = "operator", at: str = "") -> str:
    """`turnkey/brand-kit.json` — the machine half of the milestone.

    Deliberately *not* a copy of the whole kit: it records which kit was chosen and the
    values as they stood, so a kit edited later is visible as a difference rather than
    silently rewriting a live business's colours."""
    p = choice_path(idea_folder)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    doc = {"schema": SCHEMA, "kit": kit["id"], "name": kit["name"],
           "archetype": archetype_id, "chosen_by": chosen_by, "chosen_at": at,
           "brand": to_brand(kit, "chosen")}
    tmp = p + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=2, ensure_ascii=False)
    os.replace(tmp, p)
    return p


# ===========================================================================
# the manual — what a person, a printer and a designer are handed
# ===========================================================================

def manual_md(kit: dict, business: str, archetype_label: str = "") -> str:
    s = swatches(kit)
    L = [f"# {business} — brand kit", "",
         f"**{kit['name']}** · {kit['family']} · "
         f"{'dark' if kit.get('scheme') == 'dark' else 'light'} ground",
         "", kit["best_for"] + ("." if not kit["best_for"].endswith(".") else ""), ""]
    if archetype_label:
        L += [f"Built for a {archetype_label.lower()}.", ""]
    L += ["## Palette", "",
          "| Role | Name | HEX | RGB | CMYK |", "|---|---|---|---|---|"]
    for c in s:
        L.append(f"| {c['role'].capitalize()} | {c['name']} | `{c['hex']}` | "
                 f"{c['rgb']} | {c['cmyk']} |")
    L += ["",
          "CMYK values are an unmanaged conversion for guidance. Ask the printer to "
          "match the HEX under their own profile before a run.", ""]
    L += ["## Typography", "",
          f"- **Headings** — {kit['type']['heading']} "
          f"({kit['type']['preset']} setting: weight, tracking and scale are part of "
          f"the pairing, not a free choice)",
          f"- **Body** — {kit['type']['body']}", "",
          "## Voice", "", kit["voice"], "",
          "## Usage", "", kit["usage"], "",
          "## Contrast", ""]
    g = kit["ground"]
    for label, a, b, minimum in (
            ("Body text on the ground", g["ink"], g["paper"], 7.0),
            ("Body text on a card", g["ink"], g["card"], 7.0),
            ("Label on a primary fill", kit["on_primary"], kit["primary"], 4.5),
            ("Primary as a mark on the ground", kit["primary"], g["paper"], 3.0),
            ("Text on the band", kit["on_band"], kit["band"], 4.5)):
        r = contrast(a, b)
        L.append(f"- {label} — **{r}:1** (needs {minimum}:1) "
                 f"{'✓' if r >= minimum else '✗'}")
    L += ["", "---", "",
          "Generated by Turnkey · Vision Outreach Media. The values above are the same "
          "ones the built site compiles from — this document cannot drift from what "
          "shipped.", ""]
    return "\n".join(L)


def _e(x: str) -> str:
    return (str(x or "").replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def manual_html(kit: dict, business: str, archetype_label: str = "") -> str:
    """The printable manual — a huisstijlhandboek in one self-contained file.

    No PDF library, and none needed: this prints to PDF from any browser at A4 with the
    page furniture already set. One less dependency in an engine that has none."""
    g = kit["ground"]
    s = swatches(kit)
    dark = kit.get("scheme") == "dark"
    rows = "".join(
        f'<tr><td><i class="sw" style="background:{c["hex"]}"></i></td>'
        f'<td class="nm">{_e(c["name"])}<em>{c["role"]}</em></td>'
        f'<td class="mono">{c["hex"]}</td><td class="mono">{c["rgb"]}</td>'
        f'<td class="mono">{c["cmyk"]}</td></tr>' for c in s)
    checks = "".join(
        f'<li><span>{_e(label)}</span><b class="{"ok" if contrast(a, b) >= m else "no"}">'
        f'{contrast(a, b)}:1</b><em>needs {m}:1</em></li>'
        for label, a, b, m in (
            ("Body text on the ground", g["ink"], g["paper"], 7.0),
            ("Body text on a card", g["ink"], g["card"], 7.0),
            ("Label on a primary fill", kit["on_primary"], kit["primary"], 4.5),
            ("Primary as a mark on the ground", kit["primary"], g["paper"], 3.0),
            ("Text on the band", kit["on_band"], kit["band"], 4.5)))
    strip = "".join(f'<i style="background:{c["hex"]}"></i>' for c in s)
    disp = {"editorial": "'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif",
            "gallery": "'Didot','Bodoni 72','Playfair Display',Georgia,serif",
            "grotesk": "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
            "humanist": "'Avenir Next','Segoe UI',ui-sans-serif,system-ui,sans-serif",
            }.get(kit["type"]["preset"], "ui-sans-serif,system-ui,sans-serif")

    return f"""<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{_e(business)} — brand manual · {_e(kit['name'])}</title>
<style>
  :root{{--paper:{g['paper']};--card:{g['card']};--ink:{g['ink']};--line:{g['line']};
    --accent:{kit['primary']};--on-accent:{kit['on_primary']};
    --second:{kit['secondary']};--band:{kit['band']};--on-band:{kit['on_band']};
    --muted:color-mix(in srgb,{g['ink']} 68%,{g['paper']});
    --faint:{fit_text(_mix(g['ink'], g['paper'], 0.47), [g['paper'], g['card']])};
    --accent-text:{fit_text(kit['primary'], [g['paper'], g['card']])};
    --display:{disp};
    --font:'Manrope',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
    --mono:ui-monospace,'SF Mono',Menlo,Consolas,monospace}}
  *,*::before,*::after{{box-sizing:border-box}}
  body{{margin:0;background:var(--paper);color:var(--ink);font-family:var(--font);
    line-height:1.62;-webkit-font-smoothing:antialiased}}
  .wrap{{max-width:940px;margin:0 auto;padding:56px 28px 90px}}
  h1,h2{{font-family:var(--display);margin:0 0 .4em;text-wrap:balance}}
  h1{{font-size:clamp(2.2rem,5vw,3.4rem);letter-spacing:-.02em;line-height:1.06}}
  h2{{font-size:1.5rem;letter-spacing:-.012em;margin-top:0}}
  .eyebrow{{font-size:11.5px;letter-spacing:.18em;text-transform:uppercase;
    font-weight:700;color:var(--accent-text);margin:0 0 14px}}
  .lede{{font-size:1.18rem;color:var(--muted);max-width:60ch;margin:0 0 30px}}
  .strip{{display:flex;height:64px;border-radius:12px;overflow:hidden;
    border:1px solid var(--line);margin:0 0 46px}}
  .strip i{{flex:1}}
  section{{border-top:1px solid var(--line);padding:34px 0 6px;
    display:grid;grid-template-columns:200px 1fr;gap:30px;align-items:start}}
  @media(max-width:720px){{section{{grid-template-columns:1fr;gap:12px}}}}
  table{{width:100%;border-collapse:collapse;font-size:14px}}
  td{{padding:10px 12px 10px 0;border-bottom:1px solid var(--line);vertical-align:middle}}
  tr:last-child td{{border-bottom:0}}
  .sw{{display:block;width:34px;height:34px;border-radius:8px;
    box-shadow:inset 0 0 0 1px rgba(128,128,128,.28)}}
  .nm{{font-weight:650}} .nm em{{display:block;font-style:normal;font-size:11px;
    letter-spacing:.14em;text-transform:uppercase;color:var(--faint);font-weight:600}}
  .mono{{font-family:var(--mono);font-size:12.5px;color:var(--muted);white-space:nowrap}}
  .spec{{background:var(--card);border:1px solid var(--line);border-radius:14px;
    padding:22px 24px;margin-bottom:14px}}
  .spec .big{{font-family:var(--display);font-size:2.6rem;line-height:1.1;margin:0 0 6px}}
  .spec .abc{{font-family:var(--display);font-size:1.02rem;letter-spacing:.02em;
    color:var(--muted);word-spacing:.1em}}
  .spec .cap{{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;
    color:var(--faint);font-weight:700;margin:12px 0 0}}
  p.body{{margin:0;max-width:62ch}}
  ul.checks{{list-style:none;margin:0;padding:0}}
  ul.checks li{{display:flex;align-items:baseline;gap:10px;padding:8px 0;
    border-bottom:1px solid var(--line);font-size:14px}}
  ul.checks li:last-child{{border-bottom:0}}
  ul.checks span{{flex:1}} ul.checks b{{font-family:var(--mono);font-size:13px}}
  ul.checks em{{font-style:normal;font-size:11.5px;color:var(--faint);min-width:80px;
    text-align:right}}
  .ok{{color:var(--accent-text)}} .no{{color:#C2410C}}
  .app{{background:var(--card);border:1px solid var(--line);border-radius:16px;
    overflow:hidden}}
  .app .bar{{display:flex;align-items:center;gap:12px;padding:14px 18px;
    border-bottom:1px solid var(--line)}}
  .app .dot{{width:10px;height:10px;border-radius:50%;background:var(--accent)}}
  .app .nm2{{font-family:var(--display);font-weight:650;margin-right:auto}}
  .app .lnk{{font-size:12.5px;color:var(--muted)}}
  .app .body{{padding:26px 18px 28px}}
  .app h3{{font-family:var(--display);font-size:1.7rem;margin:0 0 10px;line-height:1.1}}
  .app p{{margin:0 0 16px;color:var(--muted);font-size:14.5px;max-width:44ch}}
  .btn{{display:inline-block;background:var(--accent);color:var(--on-accent);
    text-decoration:none;font-weight:650;font-size:14px;padding:11px 20px;
    border-radius:10px}}
  .band{{background:var(--band);color:var(--on-band);border-radius:14px;
    padding:20px 24px;margin-top:14px;font-size:14.5px}}
  footer{{border-top:1px solid var(--line);margin-top:40px;padding-top:20px;
    font-size:12.5px;color:var(--faint)}}
  @media print{{
    body{{background:#fff}} .wrap{{max-width:none;padding:0}}
    section{{break-inside:avoid;page-break-inside:avoid}}
    @page{{size:A4;margin:16mm}}
  }}
</style>
<div class="wrap">
  <p class="eyebrow">Brand manual · huisstijlhandboek</p>
  <h1>{_e(business)}</h1>
  <p class="lede"><strong>{_e(kit['name'])}</strong> — {_e(kit['best_for'])}.
     {'Drawn on a dark ground.' if dark else 'Drawn on a light ground.'}</p>
  <div class="strip">{strip}</div>

  <section><h2>Palette</h2><div>
    <table>{rows}</table>
    <p class="mono" style="margin-top:14px;white-space:normal">CMYK is an unmanaged
      conversion, printed here for guidance. Give the printer the HEX and let them match
      it under their own profile.</p>
  </div></section>

  <section><h2>Typography</h2><div>
    <div class="spec">
      <p class="big">{_e(business)}</p>
      <p class="abc">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789</p>
      <p class="cap">Headings — {_e(kit['type']['heading'])} · {_e(kit['type']['preset'])} setting</p>
    </div>
    <div class="spec" style="font-family:var(--font)">
      <p style="margin:0 0 6px;font-size:1.02rem">The quick brown fox jumps over the lazy
        dog, and the invoice is paid within fourteen days.</p>
      <p class="abc" style="font-family:var(--font)">ABCDEFGHIJKLMNOPQRSTUVWXYZ
        abcdefghijklmnopqrstuvwxyz 0123456789</p>
      <p class="cap">Body — {_e(kit['type']['body'])}</p>
    </div>
  </div></section>

  <section><h2>Voice</h2><p class="body">{_e(kit['voice'])}</p></section>
  <section><h2>Usage</h2><p class="body">{_e(kit['usage'])}</p></section>

  <section><h2>Contrast</h2><div>
    <ul class="checks">{checks}</ul>
    <p class="mono" style="margin-top:12px;white-space:normal">Measured, not asserted.
      Every kit is checked before it can be chosen.</p>
  </div></section>

  <section><h2>Applied</h2><div class="app">
    <div class="bar"><i class="dot"></i><span class="nm2">{_e(business)}</span>
      <span class="lnk">Home &nbsp; About &nbsp; Contact</span></div>
    <div class="body">
      <h3>This is the kit on a page.</h3>
      <p>The ground, the ink scale and one accent — the same three decisions every
         surface makes, so the site, the manual and the back office agree.</p>
      <a class="btn" href="#">Primary action</a>
      <div class="band">The band is the kit's darkest structural colour: footers,
        pull-quotes, anything that has to separate one half of a page from the other.</div>
    </div>
  </div></section>

  <footer>{_e(archetype_label or 'Turnkey')} · generated by Turnkey, Vision Outreach
    Media. These values are the ones the built site compiles from — the manual cannot
    drift from what shipped. Print to PDF at A4.</footer>
</div>
</html>"""


# ===========================================================================
# cli — so a kit can be inspected and audited without a browser
# ===========================================================================

if __name__ == "__main__":
    import sys
    args = sys.argv[1:]
    if args and args[0] == "audit":
        bad = audit_all()
        for line in bad:
            print("FAIL " + line)
        print(f"{len(KITS)} kits · {len(bad)} contrast failure(s)")
        sys.exit(1 if bad else 0)
    if args and args[0] == "show":
        k = by_id(args[1])
        if not k:
            print("no such kit: " + args[1])
            sys.exit(1)
        print(manual_md(k, args[2] if len(args) > 2 else "Example Business"))
        sys.exit(0)
    for k in KITS:
        mark = "*" if k["house"] else " "
        print(f"{mark} {k['id']:20} {k['name']:22} {k['family']:12} "
              f"{k.get('scheme', 'light'):5} {k['type']['preset']:9} "
              f"{k['primary']}  {k['best_for']}")
