#!/usr/bin/env python3
"""
visuals — the artwork every built site is drawn with.

The sites were type and boxes. That was a decision, and half of it was right: a stock
photograph on a business that does not exist yet is a lie, and Forge must never ship one.
But "no photographs" was allowed to become "no images", and the result reads as a
document rather than a place — sterile, and indistinguishable from every other page the
same renderer produced.

So this draws. Everything here is **generated SVG**, and it is generated from three things
the build already knows:

  * the **brand kit** — every stroke and fill is a CSS custom property (`var(--accent)`,
    `var(--ink)`, `var(--line)`), so the art is repainted by the branding step and follows
    light/dark without a second asset. Choosing a different kit redraws the pictures.
  * the **archetype** — a church gets arches and a rose window, a venue gets a stage and
    seat rows, a shop gets vessels on a shelf. Ten emblems, one per kind of business.
  * the **business name**, as a seed — counts, offsets and rotations vary deterministically,
    so two churches do not ship the same picture, and the same church always ships its own.

Nothing here claims anything. An arch is not a photograph of a building that does not
exist; it is ornament in the business's own colours. That keeps the original rule — no
stock photography, ever — while giving the page something to look at.

Three more things this fixes on the way:

  * **the mark.** Every client site was carrying Vision Outreach Media's megaphone in its
    header. A client's site wears the client's mark, so one is drawn: a monogram in a
    shaped badge, in the kit's own colours.
  * **the favicon**, which did not exist. Same monogram, as an inline SVG data URI.
  * **section grounds**, which were flat. Textures are CSS gradients rather than images —
    they cost nothing, and they take `var()` so they follow the kit too.

Stdlib only. No network, no binary assets, no randomness that is not seeded.
"""

from __future__ import annotations

import hashlib
import re

SCHEMA = 1


# ===========================================================================
# the seed
# ===========================================================================

def seed_for(name: str) -> int:
    """A stable number for a business.

    The same name always draws the same picture — a build is reproducible, and a rebuild
    must not silently redecorate a site somebody has already seen."""
    return int(hashlib.sha256((name or "business").encode("utf-8")).hexdigest()[:12], 16)


class _Rng:
    """A tiny deterministic sequence. `random` seeded globally would leak between builds
    and is one import away from being reseeded by something else in the process."""

    def __init__(self, seed: int):
        self.s = seed & 0xFFFFFFFF or 0x2545F491

    def next(self) -> int:
        self.s ^= (self.s << 13) & 0xFFFFFFFF
        self.s ^= self.s >> 17
        self.s ^= (self.s << 5) & 0xFFFFFFFF
        return self.s

    def pick(self, seq):
        return seq[self.next() % len(seq)]

    def between(self, lo: int, hi: int) -> int:
        return lo + self.next() % max(1, (hi - lo + 1))

    def f(self, lo: float, hi: float) -> float:
        return lo + (self.next() % 1000) / 1000.0 * (hi - lo)


def _n(v) -> str:
    """Numbers in path data, short and without a trailing '.0'."""
    return f"{v:.1f}".rstrip("0").rstrip(".")


# ===========================================================================
# the mark — a business's own monogram, not the builder's logo
# ===========================================================================

def initials(name: str) -> str:
    words = [w for w in re.split(r"[^A-Za-z0-9]+", name or "") if w]
    if not words:
        return "—"
    if len(words) == 1:
        return words[0][:2].upper()
    return (words[0][0] + words[-1][0]).upper()


# The badge the monogram sits in. Which one a business gets is decided by its archetype,
# because the shape is doing the same job as the emblem: saying what kind of place this is
# before a word is read.
# Every badge is centred on (20,20) and fills the 40x40 field. The arch and the tag
# originally spanned only two-thirds of it, so their monograms hung off the side — a badge
# is a container before it is a shape.
BADGE = {
    "arch":    "M6 36V20A14 14 0 0 1 34 20V33A3 3 0 0 1 31 36Z",
    "round":   "M20 3A17 17 0 1 1 20 37A17 17 0 0 1 20 3Z",
    "square":  "M7 4H33A3 3 0 0 1 36 7V33A3 3 0 0 1 33 36H7A3 3 0 0 1 4 33V7A3 3 0 0 1 7 4Z",
    "shield":  "M20 3 36 9V21C36 30 29 35 20 37 11 35 4 30 4 21V9Z",
    "tag":     "M7 4H25L36 20 25 36H7A3 3 0 0 1 4 33V7A3 3 0 0 1 7 4Z",
    "leaf":    "M4 36C4 17 15 4 36 4 36 25 23 36 4 36Z",
    "chip":    "M12 4H28L36 12V28L28 36H12L4 28V12Z",
    "book":    "M6 4H30A6 6 0 0 1 36 10V36H12A6 6 0 0 1 6 30Z",
}

ARCHETYPE_BADGE = {
    "church": "arch", "nonprofit": "leaf", "solo_business": "square",
    "ecommerce": "tag", "digital_products": "chip", "membership": "round",
    "education": "book", "local_venue": "arch", "saas": "chip",
    "prelaunch": "round", "generic": "square",
}


def mark(name: str, archetype_id: str = "generic", size: int = 30) -> str:
    """The header mark: a monogram in the badge its archetype earns.

    Two letters is not a logo, and it is not pretending to be one — it is a placeholder
    with the business's own name and colours in it, which is strictly more honest than
    another company's logo and strictly better than a grey dot."""
    letters = initials(name)
    shape = BADGE[ARCHETYPE_BADGE.get(archetype_id, "square")]
    fs = 15 if len(letters) > 1 else 18
    return (
        f'<svg class="mark" viewBox="0 0 40 40" width="{size}" height="{size}" '
        f'role="img" aria-label="{_e(name)}">'
        f'<path d="{shape}" fill="var(--accent)"/>'
        f'<text x="20" y="20" text-anchor="middle" dominant-baseline="central" '
        f'style="font-family:var(--display);font-size:{fs}px;font-weight:700;'
        f'letter-spacing:-.02em" fill="var(--on-accent)">{_e(letters)}</text>'
        f"</svg>")


def favicon(name: str, accent: str, on_accent: str, archetype_id: str = "generic") -> str:
    """The same mark as a data URI. Concrete colours, not `var()` — a favicon is rendered
    outside the page and has no custom properties to read."""
    letters = initials(name)
    shape = BADGE[ARCHETYPE_BADGE.get(archetype_id, "square")]
    fs = 15 if len(letters) > 1 else 18
    svg = (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'>"
           f"<path d='{shape}' fill='{accent}'/>"
           f"<text x='20' y='21' text-anchor='middle' dominant-baseline='central' "
           f"font-family='Georgia,serif' font-size='{fs}' font-weight='700' "
           f"fill='{on_accent}'>{_e(letters)}</text></svg>")
    return "data:image/svg+xml," + _uri(svg)


def _uri(s: str) -> str:
    for a, b in (("%", "%25"), ("#", "%23"), ("<", "%3C"), (">", "%3E"),
                 ('"', "'"), ("\n", ""), ("&", "%26")):
        s = s.replace(a, b)
    return s.replace(" ", "%20")


def _e(s) -> str:
    return (str(s if s is not None else "").replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


# ===========================================================================
# icons — the small vocabulary a card, a step or a price can carry
# ===========================================================================
#
# One stroke weight, one 24-grid, one visual language. Drawn rather than fetched, so a
# built site has no icon dependency and no request to anybody else's CDN.

ICONS = {
    "calendar": "M4 8h16v12H4zM4 8V6h16v2M9 3v4M15 3v4M4 12h16",
    "clock":    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2",
    "pin":      "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11M12 8a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5",
    "heart":    "M12 20S3.5 14.7 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6C20.5 14.7 12 20 12 20",
    "gift":     "M3 11h18v9H3zM3 8h18v3H3zM12 8v12M12 8S9.5 3 7.5 4.5 9 8 12 8m0 0s2.5-5 4.5-3.5S15 8 12 8",
    "users":    "M8 11a3.4 3.4 0 1 0 0-6.8A3.4 3.4 0 0 0 8 11M2.5 20c0-3.3 2.5-5.6 5.5-5.6s5.5 2.3 5.5 5.6M16 5.2a3.4 3.4 0 0 1 0 6.6M17 14.6c2.6.4 4.5 2.5 4.5 5.4",
    "mail":     "M3 6h18v12H3zM3 7l9 6 9-6",
    "phone":    "M6 3h3l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3",
    "book":     "M4 4h7a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2H4zM20 4h-3a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2H20z",
    "play":     "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M10 8.5l6 3.5-6 3.5z",
    "tag":      "M3 3h8l10 10-8 8L3 11zM7.5 7.5h.01",
    "box":      "M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5 12 12m0 0 9-4.5M12 12v9",
    "truck":    "M2 6h11v10H2zM13 9h4l4 4v3h-8zM6.5 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4M17.5 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4",
    "card":     "M3 6h18v12H3zM3 10h18M6.5 14.5h3",
    "check":    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M8 12.2l2.8 2.8L16.5 9.3",
    "star":     "m12 3.5 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
    "key":      "M15 3a6 6 0 1 1-4.2 10.3L4 20v-3h3v-3h3l.8-.7A6 6 0 0 1 15 3M16.5 7.5h.01",
    "door":     "M6 3h12v18H6zM14.5 12h.01M6 21h12",
    "chart":    "M4 20V10M10 20V4M16 20v-7M22 20H2",
    "spark":    "M12 3v5M12 16v5M3 12h5M16 12h5M6.2 6.2l3.5 3.5M14.3 14.3l3.5 3.5M17.8 6.2l-3.5 3.5M9.7 14.3l-3.5 3.5",
    "coffee":   "M3 8h14v6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM17 9h2.5a2.5 2.5 0 0 1 0 5H17M6 3v2M10 3v2M14 3v2",
    "note":     "M5 3h9l5 5v13H5zM14 3v5h5M8.5 13h7M8.5 17h5",
    "shield":   "M12 3 20 6v6c0 4.5-3.4 7.6-8 9-4.6-1.4-8-4.5-8-9V6zM9 12l2 2 4-4",
    "ticket":   "M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4zM9.5 7v10",
    "seat":     "M6 11V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5M4 11h16v6H4zM6 17v3M18 17v3",
    "leaf":     "M4 20C4 10 10 4 20 4c0 10-6 16-16 16M4 20c3-6 7-9 11-10.5",
    "sun":      "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19",
    "chat":     "M4 5h16v11H9l-5 4zM8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01",
    "compass":  "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18m3.5 5.5-2 5.5-5.5 2 2-5.5z",
    "layers":   "M12 3 3 8l9 5 9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5",
    "rocket":   "M12 3c4 2.5 6 6.5 6 11l-3 3H9l-3-3c0-4.5 2-8.5 6-11M12 10.5h.01M9 17l-2.5 4M15 17l2.5 4",
}

# What a section of each kind gets when nothing more specific is known.
KIND_ICON = {
    "cards": "check", "steps": "compass", "faq": "chat", "feed": "calendar",
    "pricing": "tag", "pay": "card", "form": "mail", "facts": "spark", "cta": "spark",
}

# The icons an archetype draws its cards from, in order. Cycled, so a section with four
# cards gets four different marks rather than the same one four times.
ARCHETYPE_ICONS = {
    "church":           ["users", "calendar", "play", "heart", "coffee", "book", "pin", "chat"],
    "solo_business":    ["compass", "note", "chart", "check", "phone", "star", "clock", "mail"],
    "nonprofit":        ["leaf", "heart", "users", "chart", "gift", "shield", "pin", "sun"],
    "ecommerce":        ["box", "truck", "tag", "card", "star", "gift", "check", "leaf"],
    "digital_products": ["layers", "note", "spark", "check", "chart", "key", "star", "rocket"],
    "membership":       ["users", "ticket", "coffee", "calendar", "key", "heart", "chat", "star"],
    "education":        ["book", "users", "note", "check", "chart", "calendar", "star", "key"],
    "local_venue":      ["ticket", "seat", "calendar", "play", "pin", "coffee", "clock", "star"],
    "saas":             ["layers", "chart", "clock", "users", "check", "spark", "shield", "rocket"],
    "prelaunch":        ["rocket", "spark", "mail", "star", "clock", "check", "users", "chart"],
    "generic":          ["check", "spark", "chart", "users", "note", "star", "pin", "mail"],
}


def icon(key: str, cls: str = "ic") -> str:
    d = ICONS.get(key) or ICONS["check"]
    return (f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" '
            f'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" '
            f'stroke-linejoin="round"><path d="{d}"/></svg>')


def icons_for(archetype_id: str, kind: str, n: int, seed: int) -> list:
    """`n` distinct icons for a section, offset by the seed so two businesses of the same
    kind do not open with an identical row of marks."""
    pool = ARCHETYPE_ICONS.get(archetype_id) or ARCHETYPE_ICONS["generic"]
    start = seed % len(pool)
    if n <= 0:
        return []
    return [pool[(start + i) % len(pool)] for i in range(n)]


# ===========================================================================
# the emblem — the large drawing on the first screen
# ===========================================================================
#
# Each archetype composes from the same primitives on the same 600x520 field: an arc, a
# rule, a disc, a column. The result is architectural rather than illustrative, which is
# the honest register — it is ornament in the business's colours, not a picture of premises
# nobody has rented yet.

def _grid(r: _Rng) -> str:
    """The faint measured field everything else sits on."""
    lines = []
    for i in range(1, 8):
        x = 75 * i
        lines.append(f'<line x1="{x}" y1="20" x2="{x}" y2="500" stroke="var(--line)" '
                     f'stroke-width="1.5" opacity=".55"/>')
    for i in range(1, 6):
        y = 86 * i
        lines.append(f'<line x1="20" y1="{y}" x2="580" y2="{y}" stroke="var(--line)" '
                     f'stroke-width="1" opacity=".38"/>')
    return "".join(lines)


def _em_church(r: _Rng) -> str:
    """Three arches, a rose window and light falling through them."""
    out = []
    xs, w = [110, 300, 490], 68
    for i, x in enumerate(xs):
        h = 292 if i == 1 else 224
        top = 392 - h
        out.append(
            f'<path d="M{x - w} 392V{top + w}A{w} {w} 0 0 1 {x + w} {top + w}V392" '
            f'fill="none" stroke="var(--accent)" stroke-width="{4.5 if i == 1 else 3}" '
            f'opacity="{1 if i == 1 else .55}"/>')
        out.append(f'<line x1="{x - w}" y1="392" x2="{x + w}" y2="392" '
                   f'stroke="var(--ink)" stroke-width="1.5" opacity=".35"/>')
    # the rose window in the centre arch
    cx, cy, rad = 300, 168, 44
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{rad}" fill="none" '
               f'stroke="var(--accent)" stroke-width="3"/>')
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{rad * .45:.0f}" fill="var(--accent)" '
               f'opacity=".16"/>')
    spokes = r.between(8, 12)
    for i in range(spokes):
        import math
        a = 2 * 3.14159 * i / spokes
        out.append(f'<line x1="{cx + rad * .45 * math.cos(a):.1f}" '
                   f'y1="{cy + rad * .45 * math.sin(a):.1f}" '
                   f'x2="{cx + rad * math.cos(a):.1f}" y2="{cy + rad * math.sin(a):.1f}" '
                   f'stroke="var(--accent)" stroke-width="2" opacity=".7"/>')
    # light on the floor
    out.append('<path d="M232 392 264 432H336L368 392Z" fill="var(--accent)" opacity=".12"/>')
    return "".join(out)


def _em_nonprofit(r: _Rng) -> str:
    """Scattered points gathering into concentric rings — a lot of small gifts, one effect."""
    import math
    out = []
    for i, rad in enumerate((160, 118, 76)):
        out.append(f'<circle cx="300" cy="255" r="{rad}" fill="none" stroke="var(--accent)" '
                   f'stroke-width="{3 if i == 2 else 2}" opacity="{.35 + i * .22:.2f}"/>')
    out.append('<circle cx="300" cy="255" r="34" fill="var(--accent)" opacity=".18"/>')
    out.append('<circle cx="300" cy="255" r="12" fill="var(--accent)"/>')
    n = r.between(16, 22)
    for i in range(n):
        a = 2 * 3.14159 * i / n + r.f(-.06, .06)
        rad = r.f(178, 250)
        x, y = 300 + rad * math.cos(a), 255 + rad * math.sin(a) * .72
        out.append(f'<circle cx="{_n(x)}" cy="{_n(y)}" r="{_n(r.f(2.2, 5))}" '
                   f'fill="var(--ink)" opacity="{r.f(.16, .4):.2f}"/>')
    return "".join(out)


def _em_solo(r: _Rng) -> str:
    """One continuous stroke over a measured field, and a seal — a person's own hand."""
    out = [f'<rect x="120" y="96" width="360" height="320" rx="10" fill="none" '
           f'stroke="var(--line)" stroke-width="1.5"/>']
    pts = []
    for i in range(6):
        pts.append((150 + i * 60, 380 - i * 44 + r.f(-26, 26)))
    d = f"M{_n(pts[0][0])} {_n(pts[0][1])}"
    for i in range(1, len(pts)):
        px, py = pts[i - 1]
        x, y = pts[i]
        d += f" C{_n(px + 30)} {_n(py)} {_n(x - 30)} {_n(y)} {_n(x)} {_n(y)}"
    out.append(f'<path d="{d}" fill="none" stroke="var(--accent)" stroke-width="4.5" '
               f'stroke-linecap="round"/>')
    for x, y in pts:
        out.append(f'<circle cx="{_n(x)}" cy="{_n(y)}" r="4.5" fill="var(--paper)" '
                   f'stroke="var(--accent)" stroke-width="2"/>')
    out.append('<rect x="392" y="330" width="76" height="76" rx="38" fill="var(--accent)" '
               'opacity=".12"/>')
    out.append('<path d="M414 368l10 10 22-24" fill="none" stroke="var(--accent)" '
               'stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>')
    return "".join(out)


def _em_shop(r: _Rng) -> str:
    """Vessels on a shelf. Objects, made by hand, standing in a row."""
    out = []
    shelf = 344
    xs = [140, 250, 360, 470]
    for i, x in enumerate(xs):
        h = r.between(104, 182)
        w = r.between(38, 58)
        neck = r.between(10, 20)
        top = shelf - h
        out.append(
            f'<path d="M{x - neck} {top} '
            f'C{x - w} {top + h * .32:.0f} {x - w} {shelf - h * .18:.0f} {x - w * .72:.0f} {shelf} '
            f'H{x + w * .72:.0f} '
            f'C{x + w} {shelf - h * .18:.0f} {x + w} {top + h * .32:.0f} {x + neck} {top} Z" '
            f'fill="var(--accent)" opacity="{.10 + (i % 3) * .07:.2f}" '
            f'stroke="var(--accent)" stroke-width="2.6"/>')
        out.append(f'<line x1="{x - neck}" y1="{top}" x2="{x + neck}" y2="{top}" '
                   f'stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round"/>')
    out.append(f'<line x1="90" y1="{shelf}" x2="530" y2="{shelf}" stroke="var(--ink)" '
               f'stroke-width="2.5" stroke-linecap="round" opacity=".55"/>')
    out.append(f'<line x1="118" y1="{shelf + 30}" x2="502" y2="{shelf + 30}" '
               f'stroke="var(--line)" stroke-width="8" stroke-linecap="round"/>')
    return "".join(out)


def _em_digital(r: _Rng) -> str:
    """Sheets, offset — a file that exists the moment it is bought."""
    out = []
    for i in range(4):
        x, y = 150 + i * 26, 340 - i * 52
        op = .07 + i * .06
        out.append(f'<rect x="{x}" y="{y}" width="230" height="150" rx="10" '
                   f'fill="var(--accent)" opacity="{op:.2f}"/>')
        out.append(f'<rect x="{x}" y="{y}" width="230" height="150" rx="10" fill="none" '
                   f'stroke="var(--accent)" stroke-width="2.4" opacity="{.35 + i * .18:.2f}"/>')
    for i, w in enumerate((150, 190, 118)):
        out.append(f'<line x1="252" y1="{212 + i * 26}" x2="{252 + w}" y2="{212 + i * 26}" '
                   f'stroke="var(--ink)" stroke-width="3" stroke-linecap="round" '
                   f'opacity="{.5 - i * .12:.2f}"/>')
    out.append('<path d="M436 336v56m0 0-20-20m20 20 20-20" fill="none" stroke="var(--accent)" '
               'stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>')
    out.append('<line x1="404" y1="410" x2="468" y2="410" stroke="var(--accent)" '
               'stroke-width="3.4" stroke-linecap="round"/>')
    return "".join(out)


def _em_membership(r: _Rng) -> str:
    """A long table, and the people around it."""
    import math
    out = ['<rect x="150" y="215" width="300" height="76" rx="16" fill="var(--accent)" '
           'opacity=".14"/>',
           '<rect x="150" y="215" width="300" height="76" rx="16" fill="none" '
           'stroke="var(--accent)" stroke-width="2"/>']
    for i in range(5):
        x = 178 + i * 62
        out.append(f'<circle cx="{x}" cy="168" r="19" fill="none" stroke="var(--ink)" '
                   f'stroke-width="2.8" opacity=".55"/>')
        out.append(f'<circle cx="{x}" cy="338" r="19" fill="none" stroke="var(--ink)" '
                   f'stroke-width="2.8" opacity=".55"/>')
    for i in range(3):
        a = r.f(0, 3.14)
        out.append(f'<circle cx="{_n(300 + 210 * math.cos(a))}" '
                   f'cy="{_n(253 + 150 * math.sin(a))}" r="9" fill="var(--accent)" '
                   f'opacity=".5"/>')
    out.append('<line x1="120" y1="253" x2="150" y2="253" stroke="var(--line)" stroke-width="3"/>')
    out.append('<line x1="450" y1="253" x2="480" y2="253" stroke="var(--line)" stroke-width="3"/>')
    return "".join(out)


def _em_education(r: _Rng) -> str:
    """An open book, and the ladder of things learned from it."""
    out = ['<path d="M300 160C266 138 214 132 168 138V366c46-6 98 0 132 22 34-22 86-28 132-22V138'
           'c-46-6-98 0-132 22Z" fill="var(--accent)" opacity=".10"/>',
           '<path d="M300 160C266 138 214 132 168 138V366c46-6 98 0 132 22 34-22 86-28 132-22V138'
           'c-46-6-98 0-132 22Z" fill="none" stroke="var(--accent)" stroke-width="3.4"/>',
           '<line x1="300" y1="160" x2="300" y2="388" stroke="var(--accent)" stroke-width="3.4"/>']
    for i in range(4):
        y = 202 + i * 38
        w = r.between(52, 92)
        out.append(f'<line x1="200" y1="{y}" x2="{200 + w}" y2="{y}" stroke="var(--ink)" '
                   f'stroke-width="2.6" stroke-linecap="round" opacity=".35"/>')
        w2 = r.between(52, 92)
        out.append(f'<line x1="330" y1="{y}" x2="{330 + w2}" y2="{y}" stroke="var(--ink)" '
                   f'stroke-width="2.6" stroke-linecap="round" opacity=".35"/>')
    for i in range(3):
        out.append(f'<circle cx="{470 + i * 0}" cy="{140 - 0}" r="0" fill="none"/>')
    out.append('<path d="M300 120l58-24 58 24-58 24z" fill="var(--accent)" opacity=".55"/>')
    out.append('<path d="M416 120v34" stroke="var(--accent)" stroke-width="2.4" '
               'stroke-linecap="round"/>')
    return "".join(out)


def _em_venue(r: _Rng) -> str:
    """A stage, its lights, and the rows in front of it."""
    out = ['<path d="M120 250A180 120 0 0 1 480 250Z" fill="var(--accent)" opacity=".12"/>',
           '<path d="M120 250A180 120 0 0 1 480 250" fill="none" stroke="var(--accent)" '
           'stroke-width="2.4"/>',
           '<line x1="96" y1="250" x2="504" y2="250" stroke="var(--ink)" stroke-width="2.6" '
           'opacity=".55" stroke-linecap="round"/>']
    for i, x in enumerate((205, 300, 395)):
        out.append(f'<path d="M{x} 96 L{x - 42} 250 H{x + 42} Z" fill="var(--accent)" '
                   f'opacity="{.07 + (i % 2) * .05:.2f}"/>')
        out.append(f'<circle cx="{x}" cy="92" r="9" fill="var(--accent)"/>')
    for row in range(3):
        y = 300 + row * 44
        n = 7 + row
        for i in range(n):
            x = 300 + (i - (n - 1) / 2) * (48 + row * 4)
            out.append(f'<rect x="{_n(x - 15)}" y="{y}" width="30" height="22" rx="7" '
                       f'fill="none" stroke="var(--ink)" stroke-width="2.6" '
                       f'opacity="{.42 - row * .08:.2f}"/>')
    return "".join(out)


def _em_saas(r: _Rng) -> str:
    """A graph of connected work, and the figures it produces."""
    import math
    nodes = []
    for i in range(7):
        a = 2 * 3.14159 * i / 7 - 1.2
        nodes.append((300 + 150 * math.cos(a), 250 + 118 * math.sin(a)))
    out = []
    for i, (x, y) in enumerate(nodes):
        for j in (1, 2):
            x2, y2 = nodes[(i + j) % len(nodes)]
            out.append(f'<line x1="{_n(x)}" y1="{_n(y)}" x2="{_n(x2)}" y2="{_n(y2)}" '
                       f'stroke="var(--accent)" stroke-width="1.3" opacity=".3"/>')
    out.append('<circle cx="300" cy="250" r="44" fill="var(--accent)" opacity=".14"/>')
    for i, (x, y) in enumerate(nodes):
        out.append(f'<line x1="300" y1="250" x2="{_n(x)}" y2="{_n(y)}" stroke="var(--accent)" '
                   f'stroke-width="2.6" opacity=".5"/>')
        rad = 9 if i % 2 else 13
        out.append(f'<circle cx="{_n(x)}" cy="{_n(y)}" r="{rad}" fill="var(--paper)" '
                   f'stroke="var(--accent)" stroke-width="3.4"/>')
    out.append('<circle cx="300" cy="250" r="17" fill="var(--accent)"/>')
    for i in range(5):
        h = r.between(24, 76)
        out.append(f'<rect x="{124 + i * 24}" y="{404 - h}" width="13" height="{h}" rx="4" '
                   f'fill="var(--accent)" opacity="{.28 + i * .13:.2f}"/>')
    out.append('<line x1="112" y1="408" x2="488" y2="408" stroke="var(--line)" stroke-width="2"/>')
    return "".join(out)


def _em_prelaunch(r: _Rng) -> str:
    """A line that has not arrived yet, and the horizon it is heading for."""
    out = ['<line x1="90" y1="372" x2="510" y2="372" stroke="var(--ink)" stroke-width="2" '
           'opacity=".4" stroke-linecap="round"/>']
    pts = [(120, 380)]
    for i in range(1, 7):
        pts.append((120 + i * 62, 380 - i * 44 + r.f(-18, 18)))
    d = f"M{_n(pts[0][0])} {_n(pts[0][1])}"
    for i in range(1, len(pts)):
        px, py = pts[i - 1]
        x, y = pts[i]
        d += f" C{_n(px + 30)} {_n(py)} {_n(x - 30)} {_n(y)} {_n(x)} {_n(y)}"
    out.append(f'<path d="{d}" fill="none" stroke="var(--accent)" stroke-width="3.4" '
               f'stroke-linecap="round" stroke-dasharray="1 0"/>')
    out.append(f'<path d="{d} L{_n(pts[-1][0])} 400 L120 400 Z" fill="var(--accent)" '
               f'opacity=".10"/>')
    for i, (x, y) in enumerate(pts):
        if i % 2:
            continue
        out.append(f'<circle cx="{_n(x)}" cy="{_n(y)}" r="5.5" fill="var(--paper)" '
                   f'stroke="var(--accent)" stroke-width="3.4"/>')
    x, y = pts[-1]
    out.append(f'<circle cx="{_n(x)}" cy="{_n(y)}" r="26" fill="var(--accent)" opacity=".16"/>')
    out.append(f'<circle cx="{_n(x)}" cy="{_n(y)}" r="11" fill="var(--accent)"/>')
    return "".join(out)


def _em_generic(r: _Rng) -> str:
    out = ['<circle cx="300" cy="250" r="150" fill="none" stroke="var(--accent)" '
           'stroke-width="2" opacity=".5"/>',
           '<circle cx="300" cy="250" r="96" fill="var(--accent)" opacity=".12"/>']
    for i in range(6):
        import math
        a = 2 * 3.14159 * i / 6 + r.f(0, .5)
        out.append(f'<line x1="300" y1="250" x2="{_n(300 + 150 * math.cos(a))}" '
                   f'y2="{_n(250 + 150 * math.sin(a))}" stroke="var(--accent)" '
                   f'stroke-width="2" opacity=".45"/>')
    out.append('<circle cx="300" cy="250" r="16" fill="var(--accent)"/>')
    return "".join(out)


EMBLEMS = {
    "church": _em_church, "nonprofit": _em_nonprofit, "solo_business": _em_solo,
    "ecommerce": _em_shop, "digital_products": _em_digital, "membership": _em_membership,
    "education": _em_education, "local_venue": _em_venue, "saas": _em_saas,
    "prelaunch": _em_prelaunch, "generic": _em_generic,
}


def emblem(archetype_id: str, seed: int, cls: str = "emblem") -> str:
    """The hero drawing. Decorative, so it is hidden from assistive technology — there is
    nothing in it a screen reader could usefully say, and everything it suggests is said
    in words elsewhere on the page."""
    r = _Rng(seed)
    draw = EMBLEMS.get(archetype_id) or EMBLEMS["generic"]
    return (f'<svg class="{cls}" viewBox="0 0 600 520" aria-hidden="true" '
            f'preserveAspectRatio="xMidYMid meet">'
            f'<g class="em-grid">{_grid(r)}</g>{draw(r)}</svg>')


# ===========================================================================
# ornaments — the small drawn things between the big ones
# ===========================================================================

def sec_ornament(seed: int) -> str:
    """The mark beside a section heading: three ticks of decreasing weight. Replaces a
    plain 1px rule, which is what every section on every page used to open with."""
    return ('<svg class="orn" viewBox="0 0 34 10" aria-hidden="true">'
            '<rect x="0" y="3.5" width="16" height="3" rx="1.5" fill="var(--accent)"/>'
            '<rect x="20" y="3.5" width="7" height="3" rx="1.5" fill="var(--accent)" opacity=".55"/>'
            '<rect x="30" y="3.5" width="4" height="3" rx="1.5" fill="var(--accent)" opacity=".3"/>'
            "</svg>")


def quote_ornament() -> str:
    return ('<svg class="qorn" viewBox="0 0 44 34" aria-hidden="true" fill="var(--accent)" '
            'opacity=".18"><path d="M0 34V18C0 8 6 1 17 0v7c-6 1-9 4-9 9h9v18zm25 0V18C25 8 '
            '31 1 42 0v7c-6 1-9 4-9 9h9v18z"/></svg>')


def wave(flip: bool = False, cls: str = "wave") -> str:
    """The shaped edge between two section grounds, instead of a hard line."""
    d = ("M0 40 C180 0 420 80 600 34 C780 0 1020 60 1200 26V80H0Z" if not flip else
         "M0 26 C180 70 420 0 600 46 C780 80 1020 12 1200 54V0H0Z")
    return (f'<svg class="{cls}" viewBox="0 0 1200 80" preserveAspectRatio="none" '
            f'aria-hidden="true"><path d="{d}" fill="currentColor"/></svg>')


def meter(pct: int) -> str:
    """A published figure, drawn. Used by the facts strip when a value is a percentage —
    a number nobody can picture is a number nobody remembers."""
    pct = max(0, min(100, int(pct)))
    import math
    c = 2 * math.pi * 15
    return (f'<svg class="meter" viewBox="0 0 36 36" aria-hidden="true">'
            f'<circle cx="18" cy="18" r="15" fill="none" stroke="var(--line)" stroke-width="4"/>'
            f'<circle cx="18" cy="18" r="15" fill="none" stroke="var(--accent)" stroke-width="4" '
            f'stroke-linecap="round" stroke-dasharray="{c * pct / 100:.1f} {c:.1f}" '
            f'transform="rotate(-90 18 18)"/></svg>')


PCT_RE = re.compile(r"^\s*(\d{1,3})\s*%\s*$")


# ===========================================================================
# grounds — texture without an image
# ===========================================================================
#
# CSS gradients rather than SVG data URIs, for one reason that matters: a data URI cannot
# read a custom property, so a textured ground baked as an image would keep the light
# theme's line colour in dark mode. These follow the kit.

TEXTURES = {
    "dots": """background-image:radial-gradient(var(--line) 1.1px,transparent 1.1px);
    background-size:22px 22px;background-position:-11px -11px""",
    "grid": """background-image:linear-gradient(var(--line) 1px,transparent 1px),
    linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:44px 44px""",
    "rib": """background-image:repeating-linear-gradient(90deg,var(--line) 0 1px,
    transparent 1px 14px)""",
    "hatch": """background-image:repeating-linear-gradient(135deg,var(--line) 0 1px,
    transparent 1px 11px)""",
    "arc": """background-image:radial-gradient(circle at 50% 120%,
    color-mix(in srgb,var(--accent) 12%,transparent) 0 40%,transparent 62%)""",
}

# The texture each archetype's alternate sections take. Data, like everything else here.
ARCHETYPE_TEXTURE = {
    "church": "arc", "nonprofit": "dots", "solo_business": "grid",
    "ecommerce": "rib", "digital_products": "grid", "membership": "dots",
    "education": "grid", "local_venue": "arc", "saas": "grid",
    "prelaunch": "dots", "generic": "dots",
}


def texture_css(archetype_id: str) -> str:
    return TEXTURES.get(ARCHETYPE_TEXTURE.get(archetype_id, "dots"), TEXTURES["dots"])


# ===========================================================================
# the stylesheet the artwork needs
# ===========================================================================

def css(archetype_id: str) -> str:
    """Appended to the site's stylesheet. Every colour is a token, so this inherits the
    brand kit rather than introducing a second palette — the same adoption rule the kit
    itself is held to."""
    return """
  /* ---------------------------------------------------------- artwork */
  .mark{display:block;flex:none;border-radius:7px}
  .ic{width:1.15em;height:1.15em;flex:none}
  .orn{width:34px;height:10px;flex:none;display:block}

  /* The emblem is ALWAYS out of flow. Only two layouts used to render it, and each had
     its own positioned rule; a third layout that emitted one without a matching rule put
     a 600px drawing into the document flow and shoved the entire hero sideways. A base
     rule means a new layout can never reintroduce that. */
  .hero .emblem{position:absolute;z-index:0;pointer-events:none;
    right:-2%;top:50%;transform:translateY(-50%);width:min(560px,46vw);height:auto;
    opacity:.5;color:var(--accent)}
  .hero .wrap{position:relative;z-index:1}

  /* ---- the first screen -------------------------------------------------
     The home page gets a PLATE: a framed drawing with the facts panel overlapping its
     lower corner. A watermark behind the type was the first attempt and it read as a
     printing fault — a picture has to be a thing on the page, with an edge, or it is
     not a picture. */
  .hero{position:relative;overflow:hidden;isolation:isolate;
    min-height:clamp(430px,52vh,600px);display:flex;align-items:center}
  .hero > .wrap{width:100%}

  .hero-side{position:relative;padding-bottom:clamp(38px,5vw,64px)}
  .plate{position:relative;border-radius:var(--radius-lg);overflow:hidden;
    border:1px solid var(--line);aspect-ratio:6/5;display:grid;place-items:center;
    background:
      radial-gradient(120% 90% at 22% 6%,var(--wash-1),transparent 62%),
      linear-gradient(155deg,var(--paper-2),var(--sunk));
    box-shadow:var(--shadow-2)}
  .plate .plate-art{width:110%;height:110%;display:block;color:var(--accent);
    transform:translateY(-4%)}
  .plate .em-grid{opacity:.5}
  .plate-tag{position:absolute;left:16px;top:14px;font-family:var(--mono);font-size:10.5px;
    letter-spacing:.16em;text-transform:uppercase;color:var(--faint);font-weight:700}
  /* the panel overlaps the plate's lower edge — the layering IS the composition */
  .hero-side .panel{position:relative;z-index:2;margin:-16% 0 0 clamp(14px,4%,34px);
    width:calc(100% - clamp(14px,4%,34px))}
  @media(prefers-reduced-motion:no-preference){
    .plate{animation:emrise 1s cubic-bezier(.2,.7,.3,1) both}
    .hero-side .panel{animation:emrise 1s cubic-bezier(.2,.7,.3,1) .12s both}
  }
  @keyframes emrise{from{opacity:0;transform:translateY(16px) scale(.985)}}
  @media(max-width:900px){
    .plate{aspect-ratio:16/9}
    .hero-side .panel{margin-top:-10%}
  }

  /* An interior page is one column of type, so there the drawing runs behind it. */
  .hero.solo .emblem{position:absolute;right:-6%;top:50%;transform:translateY(-50%);
    width:min(560px,46vw);height:auto;z-index:0;pointer-events:none;
    opacity:.85;color:var(--accent)}
  .hero.solo .em-grid{opacity:.35}
  .hero.solo .wrap{position:relative;z-index:1}
  .hero.solo::after{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;
    background:linear-gradient(100deg,var(--paper) 26%,
      color-mix(in srgb,var(--paper) 76%,transparent) 46%,
      color-mix(in srgb,var(--paper) 24%,transparent) 66%,transparent 84%)}
  @media(max-width:900px){
    .hero.solo .emblem{width:120%;right:-26%;opacity:.3}
    .hero.solo::after{background:linear-gradient(180deg,
      color-mix(in srgb,var(--paper) 55%,transparent),var(--paper) 74%)}
  }

  /* section headings: a drawn ornament rather than a hairline */
  .sec-h{display:flex;align-items:center;gap:14px}
  .sec-h .rule{display:none}

  /* cards, steps, prices and feed rows all carry a mark */
  .card{position:relative}
  .card .ic{width:22px;height:22px;color:var(--accent);margin-bottom:10px;display:block}
  .card::after{content:"";position:absolute;left:0;right:0;top:0;height:2px;
    border-radius:2px 2px 0 0;background:linear-gradient(90deg,var(--accent),
      color-mix(in srgb,var(--accent) 12%,transparent));opacity:0;transition:opacity .25s}
  .card:hover::after{opacity:1}
  .steps li .ic{width:20px;height:20px;color:var(--accent);margin-bottom:6px;display:block}
  .faq summary .ic{width:17px;height:17px;color:var(--accent);margin-right:9px}
  .tier .ic,.price .ic{width:20px;height:20px;color:var(--accent);display:block;
    margin-bottom:8px}

  /* facts: a drawn dial when the value is a percentage, a hairline mark otherwise */
  .fact{position:relative}
  .fact .meter{width:34px;height:34px;display:block;margin-bottom:7px}

  /* The shaped edge between grounds. It is drawn in the colour of the ground it is
     hiding — the section ABOVE and BELOW, which is always the plain one. Left on
     `currentColor` it inherited the ink and shipped two black bands across the page. */
  .block{position:relative}
  .wave{position:absolute;left:0;right:0;width:100%;height:38px;display:block;z-index:1;
    pointer-events:none;color:var(--paper)}
  .wave.top{top:-1px}
  .wave.bot{bottom:-1px;transform:scaleY(-1)}

  /* the alternate ground is textured, not merely a different grey */
  .block.tone-b{__TEXTURE__}
  .block.tone-b > .wrap{position:relative;z-index:2}

  /* The closing band is the one place the ground is the band colour, so the drawing has
     to be redrawn in it. Custom properties inherit into an inline SVG, so re-declaring
     them ON the emblem repaints every stroke without touching anything else in the band
     — the button inside it still wants the real accent. */
  .cta-band{position:relative;overflow:hidden}
  .cta-band .emblem{position:absolute;right:-3%;bottom:-30%;width:min(460px,48%);
    opacity:.3;pointer-events:none;
    --accent:var(--on-band);
    --ink:var(--on-band);
    --paper:var(--band);
    --line:color-mix(in srgb,var(--on-band) 26%,transparent)}
  .cta-band .em-grid{opacity:.5}

  /* a pull-quote mark for prose blocks that open with one */
  .qorn{width:44px;height:34px;display:block;margin-bottom:8px}

  @media print{ .emblem,.wave{display:none} }
"""


def full_css(archetype_id: str) -> str:
    return css(archetype_id).replace("__TEXTURE__", texture_css(archetype_id))


if __name__ == "__main__":
    import sys
    who = sys.argv[1] if len(sys.argv) > 1 else "church"
    name = sys.argv[2] if len(sys.argv) > 2 else "Bethel Chapel"
    print(f"""<!doctype html><meta charset=utf-8><title>{who}</title>
<style>:root{{--accent:#1E3A5F;--on-accent:#fff;--ink:#14181F;--line:#DEDCD4;
--paper:#F5F4F0;--display:Georgia,serif}}
body{{background:var(--paper);margin:0;padding:40px;font-family:system-ui}}
svg.emblem{{width:600px;height:520px;display:block}}
.ic{{width:26px;height:26px;color:var(--accent)}}</style>
{mark(name, who, 44)}{emblem(who, seed_for(name))}
<div>{''.join(icon(k) for k in ARCHETYPE_ICONS.get(who, ARCHETYPE_ICONS['generic']))}</div>
{sec_ornament(1)}{meter(72)}""")
