# VOM Kit v2

The Vision Outreach Media design system. One file — `vom-kit.css` — plus a set of
preview cards published to **Claude Design** so the system can be browsed rather than
read.

## Why v2 exists

v1 was written as theory and adopted by exactly one page: its own demo. In its absence
four palettes drifted apart in practice:

| Surface | Ground | Verdict |
|---|---|---|
| `brand/vom-kit.css` v1 | `#f6f3ea` cream, gold accent, serif | used by 1 file |
| The six product sites | `#f6f5f1` warm paper, per-product accent | **the real system** |
| Forge's generated client sites | `#FFFFFF` cold white, cool grey lines | off-system |
| The Forge build console | `#0A0A0B` pure black | off-system |

v2 is taken from the row that actually ships. The six product sites had already agreed
on a ground, an ink scale, a line colour and a per-product accent — so that is what got
written down, and everything else moved onto it.

## The whole idea

**One ground. One ink scale. One accent slot.**

```html
<html data-brand="turnkey">          <!-- swaps the accent, and only the accent -->
<html data-brand="churchforge" data-surface="client">
```

- `--c` is the accent. Everything brand-coloured reads from it.
- `[data-brand]` picks the product: `vom · hundred · turnkey · vital · launch-kits ·
  cma · operators · churchforge · bizforge · forge`.
- `[data-theme]` forces light/dark; otherwise the OS decides.
- `[data-surface="client"]` switches the display face to the sans — a church should
  sound like itself, not like its agency.

**Adoption rule:** a page may add layout, never a second palette. If you need a colour
that is not a token here, the token is missing — add it here first.

## Using it

Inline the file. Everything VOM ships is self-contained (no CDN, no build step), so the
kit is inlined at build time rather than linked:

- `turnkey/forge/build.py` replaces a `/*KIT*/` marker in the showcase template.
- `turnkey/orchestrator/engine/site_gen.py` emits the same tokens for every client site
  Forge builds.

## The preview cards

```bash
python3 build.py        # components/*.html -> dist/*.html, kit inlined, @dsCard stamped
```

Each fragment in `components/` declares its own group and brand in a comment header.
`build.py` inlines the kit so every published card renders standalone, and stamps the
`<!-- @dsCard group="…" -->` first line the Design System pane indexes on.

### The *Forge sites* group is generated, not authored

`components/` describes what a **VOM** surface is made of. It says nothing about the other
thing this system produces — the public sites Forge builds for clients — and that half was
invisible in the design system even though it is the half a client sees.

Hand-writing a second set of fragments for it would recreate exactly the drift v2 was
written to end: two descriptions of one component, diverging on the first edit. So
`site_cards.py` generates those cards **from `site_gen` itself**, using a real compiled
spec from a real build. Every rule and every element on those cards came out of the
renderer at the version in the tree.

```bash
python3 site_cards.py   # dist/10..13 — one card per type preset, plus the section vocabulary
```

It refuses to run when there is no compiled spec on disk rather than inventing one, since
a card built from an invented spec is a drawing of the system rather than the system.
`build.py` runs it automatically after the authored cards.

Published to Claude Design as **Vision Outreach Media — VOM Kit**.

## What runs on it

Forge's generated client sites · the business platform app · the Forge build console ·
the Forge showcase · `completion-report` · `product-report-cards` · `go-live-plan` ·
`content-review-console`.

**Not on it, deliberately:** `engage-scorecard.html` and `funnels-vom-site.html` use the
customer-facing corporate palette (navy/orange/teal, Manrope). That is a second mode with
a real audience, not drift — but it is not yet expressed as kit tokens, and it should be.
