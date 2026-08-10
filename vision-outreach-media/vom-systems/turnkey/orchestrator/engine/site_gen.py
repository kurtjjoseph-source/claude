#!/usr/bin/env python3
"""
site_gen — the general site renderer.

One renderer, every archetype. It implements exactly the section vocabulary declared in
`archetypes.SECTION_KINDS` and nothing else, which is the whole point: a new archetype is
a data change, not a renderer change, so a platform can be composed and launched without
anyone writing code for it.

Everything it emits is self-contained — no CDN, no build step, no fonts fetched over the
wire. A generated site is a folder of HTML you can open from disk, drop on any host, or
serve from the hub, and it looks the same in all three.

## One system, ten voices

The house design system (VOM Kit v2, kept in Claude Design and mirrored at
`vom-systems/brand/kit/vom-kit.css`) gives every site the same ground, the same ink scale
and one accent slot. That is what makes ten platforms read as one family. It is *not*
enough to make ten platforms look like ten different businesses — a church rendered in a
startup's typography is a church that looks borrowed.

So an archetype also chooses a **type preset** and a **hero shape**. The preset changes
the display face, its weight, its tracking and how large it is allowed to get; the shape
changes what the first screen actually is. Both are data, both are declared in
`archetypes.py`, and neither adds a code path here: the presets are a fixed table and
every archetype picks one, exactly as it picks modules from the shared catalog.

No webfont is fetched or embedded. A face that arrives over the wire is a face that can
fail to arrive, and a 200 KB data URI on every page of every site is a real cost paid for
a small difference. The presets are built from families that are already on the machine,
and differentiated by the things that actually carry personality — weight, tracking,
scale, case and rhythm.

The black-backed treatment is the *forge's* own identity — the thing the operator watches
build — rather than the default a church or a consultant gets handed as their public face.
An archetype can ask for it with `site_scheme: "dark"`.

Stdlib only.
"""

from __future__ import annotations

import html
import re

import brand_kits
import layouts
import photos
import visuals

MODULE_FEED_LABEL = {
    "events": ("Upcoming", "date"),
    "media_library": ("Latest", "date"),
    "content_publishing": ("Recent", "date"),
    "booking": ("Booked", "date"),
}

MONTHS = {"01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun",
          "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"}


def e(s) -> str:
    return html.escape(str(s if s is not None else ""), quote=True)


def _para(text: str) -> str:
    """Prose blocks: blank-line separated paragraphs, nothing cleverer."""
    parts = [p.strip() for p in re.split(r"\n\s*\n", (text or "").strip()) if p.strip()]
    if not parts:
        return ""
    out = [f'<p class="lead">{e(parts[0])}</p>']
    out += [f"<p>{e(p)}</p>" for p in parts[1:]]
    return "".join(out)


# ===========================================================================
# type presets — the personality layer, chosen by the archetype
# ===========================================================================
#
# Each preset is a complete typographic stance, not a font swap: the display family,
# how heavy and how tight it is set, how large it may grow, whether the eyebrow is
# spaced capitals or plain, and how the section headings behave. Picked by name in
# `archetypes.py`; unknown names fall back to `humanist`, which is nobody's wrong answer.

TYPE_PRESETS = {
    # Serif, generously set. For institutions that predate the internet and should
    # sound like it: churches, charities, schools.
    "editorial": {
        "display": "'Iowan Old Style','Palatino Linotype',Palatino,'Book Antiqua',"
                   "Georgia,ui-serif,serif",
        "h1": "clamp(2.5rem,5.6vw,4.15rem)", "h1_weight": "600", "h1_track": "-.018em",
        "h1_leading": "1.06",
        "h2": "clamp(1.55rem,3vw,2.3rem)", "h2_weight": "600", "h2_track": "-.012em",
        "eyebrow_case": "uppercase", "eyebrow_track": ".16em", "eyebrow_weight": "700",
        "lede_style": "font-size:clamp(1.1rem,2.2vw,1.36rem);line-height:1.55",
        "card_title_weight": "650",
    },
    # Tight modern sans, set hard. Software and anything that wants to read as current.
    "grotesk": {
        "display": "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,"
                   "'Helvetica Neue',Arial,sans-serif",
        "h1": "clamp(2.4rem,5.4vw,3.9rem)", "h1_weight": "800", "h1_track": "-.038em",
        "h1_leading": "1.02",
        "h2": "clamp(1.5rem,2.9vw,2.15rem)", "h2_weight": "780", "h2_track": "-.03em",
        "eyebrow_case": "none", "eyebrow_track": ".01em", "eyebrow_weight": "700",
        "lede_style": "font-size:clamp(1.05rem,2vw,1.24rem);line-height:1.6",
        "card_title_weight": "700",
    },
    # Warm sans, medium contrast. One person's business, where the voice is the product.
    "humanist": {
        "display": "'Avenir Next','Segoe UI',ui-sans-serif,system-ui,-apple-system,"
                   "Roboto,sans-serif",
        "h1": "clamp(2.35rem,5.1vw,3.7rem)", "h1_weight": "740", "h1_track": "-.028em",
        "h1_leading": "1.07",
        "h2": "clamp(1.45rem,2.8vw,2.05rem)", "h2_weight": "720", "h2_track": "-.022em",
        "eyebrow_case": "uppercase", "eyebrow_track": ".13em", "eyebrow_weight": "750",
        "lede_style": "font-size:clamp(1.05rem,2vw,1.26rem);line-height:1.6",
        "card_title_weight": "700",
    },
    # Spaced capitals over a high-contrast serif. Retail and rooms — places where the
    # name on the door is doing the selling.
    "gallery": {
        "display": "'Didot','Bodoni 72','Playfair Display',Georgia,ui-serif,serif",
        "h1": "clamp(2.4rem,5.4vw,4rem)", "h1_weight": "600", "h1_track": "-.01em",
        "h1_leading": "1.05",
        "h2": "clamp(1.5rem,2.9vw,2.2rem)", "h2_weight": "600", "h2_track": "-.005em",
        "eyebrow_case": "uppercase", "eyebrow_track": ".26em", "eyebrow_weight": "600",
        "lede_style": "font-size:clamp(1.06rem,2.1vw,1.3rem);line-height:1.6",
        "card_title_weight": "620",
    },
}


def preset_for(spec: dict) -> dict:
    """The typographic stance this site is set in.

    The brand kit names it; the archetype's own preset is the fallback for a spec
    compiled before kits existed. Either way an unknown name lands on `humanist`, which
    is nobody's wrong answer."""
    kit = (spec.get("brand") or {}).get("kit") or {}
    name = (kit.get("type") or {}).get("preset") or spec["archetype"].get("type_preset")
    return TYPE_PRESETS.get(name or "", TYPE_PRESETS["humanist"])


# ===========================================================================
# theme
# ===========================================================================

def css(spec: dict) -> str:
    """The built site's stylesheet, generated from the VOM Kit tokens plus the
    archetype's type preset.

    The kit is the house's single source of truth: one warm ground, one ink scale, one
    accent slot. A client's site is that system with the archetype's accent dropped into
    the slot and its own typographic stance on top — which is why every platform Forge
    builds reads as a member of the same family without any of them looking like Vision
    Outreach Media's own pages, or like each other."""
    br = spec["brand"]
    forge = spec["archetype"].get("forge") or {}
    kit = br.get("kit") or {}
    T = preset_for(spec)
    # Light ground needs the darkened sibling; the console's bright value is for black.
    accent = (kit.get("accent") or forge.get("accent_site") or forge.get("accent")
              or br.get("accent") or "#c47716")
    accent2 = kit.get("accent_bright") or forge.get("accent") or accent
    dark_site = (kit.get("scheme") or spec["archetype"].get("site_scheme")) == "dark"
    navy = kit.get("band") or br["palette"].get("navy", "#1B2A4A")

    light = f"""
    --paper:#F6F5F1; --paper-2:#FFFFFF; --card:#FFFFFF; --ink:#1A1D1B; --muted:#535B56;
    --faint:#6B726C; --line:#E1DFD4; --line-soft:#ECE9DF; --raised:#FFFFFF;
    --sunk:#F1EFE8;
    --accent:{accent}; --accent-2:{accent2}; --on-accent:#FFFFFF;
    --accent-text:{brand_kits.fit_text(accent, ['#F6F5F1', '#FFFFFF'])};
    --band:{navy}; --on-band:#FFFFFF;
    --shadow-1:0 1px 2px rgba(26,29,27,.05),0 2px 10px rgba(26,29,27,.045);
    --shadow-2:0 2px 6px rgba(26,29,27,.06),0 18px 40px rgba(26,29,27,.10);
    --wash-1:color-mix(in srgb,{accent} 13%,transparent);
    --wash-2:color-mix(in srgb,{navy} 8%,transparent);"""
    dark = f"""
    --paper:#0E100F; --paper-2:#121513; --card:#171B19; --ink:#F0F2EE; --muted:#A8B1AA;
    --faint:#7C867F; --line:#2A322D; --line-soft:#232A26; --raised:#171B19;
    --sunk:#121614;
    --accent:{accent2}; --accent-2:{accent2}; --on-accent:#0E100F;
    --accent-text:{brand_kits.fit_text(accent2, ['#0E100F', '#171B19'])};
    --band:#171B19; --on-band:#F0F2EE;
    --shadow-1:0 1px 2px rgba(0,0,0,.35);
    --shadow-2:0 18px 44px rgba(0,0,0,.5);
    --wash-1:color-mix(in srgb,{accent2} 16%,transparent);
    --wash-2:color-mix(in srgb,{accent2} 5%,transparent);"""

    # A kit carries both schemes already, mixed from its own five published colours. When
    # one is present it replaces the blocks above wholesale rather than tinting them —
    # a kit that only supplied the accent would leave a client's ground, ink and rules in
    # the house's values, which is the drift the kit exists to end.
    tokens = kit.get("tokens") or {}
    if tokens.get("light") and tokens.get("dark"):
        light, dark = tokens["light"], tokens["dark"]

    root = dark if dark_site else light
    alt = light if dark_site else dark
    # The artwork's own rules are appended at the end of this stylesheet (see the
    # return below) rather than merged here, so everything visuals.py owns stays in one
    # readable block instead of being threaded through the layout.

    return f""":root {{{root}
    --wrap:1140px; --measure:66ch; --radius:16px; --radius-sm:10px; --radius-lg:22px;
    --s1:6px; --s2:10px; --s3:14px; --s4:20px; --s5:28px; --s6:40px; --s7:60px; --s8:88px;
    --font:'{br['body']}', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    --display:{T['display']};
    --mono:ui-monospace,'SF Mono','Cascadia Code',Menlo,Consolas,monospace;
  }}
  @media (prefers-color-scheme: {'light' if dark_site else 'dark'}) {{
    :root {{{alt}}}
  }}
  :root[data-theme="{'dark' if dark_site else 'light'}"] {{{root}}}
  :root[data-theme="{'light' if dark_site else 'dark'}"] {{{alt}}}

  *,*::before,*::after{{box-sizing:border-box}}
  html{{scroll-behavior:smooth}}
  body{{margin:0;font-family:var(--font);color:var(--ink);background:var(--paper);
       line-height:1.62;-webkit-font-smoothing:antialiased;
       text-rendering:optimizeLegibility}}
  .wrap{{max-width:var(--wrap);margin:0 auto;padding:0 24px}}
  a{{color:inherit}}
  img{{max-width:100%}}
  ::selection{{background:color-mix(in srgb,var(--accent) 26%,transparent)}}
  :focus-visible{{outline:2px solid var(--accent);outline-offset:3px;border-radius:6px}}

  h1,h2,h3{{font-family:var(--display);margin:0 0 .5em;text-wrap:balance}}
  h1{{font-size:{T['h1']};font-weight:{T['h1_weight']};letter-spacing:{T['h1_track']};
      line-height:{T['h1_leading']}}}
  h2{{font-size:{T['h2']};font-weight:{T['h2_weight']};letter-spacing:{T['h2_track']};
      line-height:1.14}}
  h3{{font-size:1.06rem;font-weight:{T['card_title_weight']};letter-spacing:-.012em;
      line-height:1.32;margin-bottom:.34em}}
  p{{margin:0 0 1em}}
  .muted{{color:var(--muted)}}

  /* ---------------------------------------------------------------- header */
  header.site{{position:sticky;top:0;z-index:30;
    background:color-mix(in srgb,var(--paper) 86%,transparent);
    backdrop-filter:saturate(1.5) blur(12px);-webkit-backdrop-filter:saturate(1.5) blur(12px);
    border-bottom:1px solid transparent;transition:border-color .25s,box-shadow .25s}}
  header.site.is-scrolled{{border-bottom-color:var(--line);box-shadow:var(--shadow-1)}}
  .bar{{display:flex;align-items:center;gap:16px;min-height:70px;flex-wrap:wrap;
    transition:min-height .25s}}
  header.site.is-scrolled .bar{{min-height:60px}}
  .brand{{display:flex;align-items:center;gap:11px;font-family:var(--display);
    font-weight:{T['card_title_weight']};font-size:1.06rem;text-decoration:none;
    letter-spacing:-.02em;margin-right:auto;white-space:nowrap}}
  .brand img{{height:28px;width:auto;border-radius:6px}}
  .brand .dot{{width:10px;height:10px;border-radius:50%;background:var(--accent);
    box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 18%,transparent)}}
  nav.main{{display:flex;gap:2px;flex-wrap:wrap}}
  nav.main a{{position:relative;text-decoration:none;font-size:.92rem;font-weight:600;
    color:var(--muted);padding:8px 12px;border-radius:9px;transition:color .18s}}
  nav.main a::after{{content:"";position:absolute;left:12px;right:12px;bottom:3px;height:1.5px;
    background:var(--accent);transform:scaleX(0);transform-origin:left;transition:transform .22s}}
  nav.main a:hover{{color:var(--ink)}}
  nav.main a:hover::after{{transform:scaleX(1)}}
  nav.main a[aria-current]{{color:var(--ink)}}
  nav.main a[aria-current]::after{{transform:scaleX(1)}}

  .btn{{display:inline-flex;align-items:center;gap:8px;text-decoration:none;font-weight:700;
    font-size:.95rem;padding:12px 22px;border-radius:999px;border:1px solid transparent;
    cursor:pointer;white-space:nowrap;font-family:var(--font);
    transition:transform .16s,box-shadow .2s,background .2s,border-color .2s}}
  .btn.pri{{background:var(--accent);color:var(--on-accent);
    box-shadow:0 1px 2px color-mix(in srgb,var(--accent) 40%,transparent),
               0 10px 24px color-mix(in srgb,var(--accent) 22%,transparent)}}
  .btn.pri:hover{{transform:translateY(-1px);
    box-shadow:0 2px 4px color-mix(in srgb,var(--accent) 42%,transparent),
               0 16px 32px color-mix(in srgb,var(--accent) 26%,transparent)}}
  .btn.pri[disabled]{{opacity:.55;box-shadow:none;cursor:not-allowed;transform:none}}
  .btn.sec{{border-color:var(--line);color:var(--ink);background:var(--card)}}
  .btn.sec:hover{{border-color:color-mix(in srgb,var(--accent) 45%,var(--line));
    transform:translateY(-1px)}}
  .btn.sm{{padding:9px 16px;font-size:.88rem}}

  /* ------------------------------------------------------------------ hero */
  .hero{{position:relative;padding:clamp(56px,8vw,104px) 0 clamp(40px,6vw,76px);
    overflow:hidden}}
  .hero::before{{content:"";position:absolute;inset:-40% -20% auto -20%;height:150%;
    background:
      radial-gradient(58% 52% at 18% 8%, var(--wash-1), transparent 68%),
      radial-gradient(46% 42% at 88% 4%, var(--wash-2), transparent 70%);
    pointer-events:none}}
  .hero .wrap{{position:relative}}
  .hero-grid{{display:grid;gap:clamp(28px,4vw,56px);align-items:center;
    grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr)}}
  .hero.solo .hero-grid{{grid-template-columns:minmax(0,1fr);max-width:min(100%,860px)}}
  .eyebrow{{display:inline-flex;align-items:center;gap:9px;font-size:.75rem;
    font-weight:{T['eyebrow_weight']};letter-spacing:{T['eyebrow_track']};
    text-transform:{T['eyebrow_case']};color:var(--accent-text);margin-bottom:18px}}
  .eyebrow::before{{content:"";width:22px;height:1.5px;background:var(--accent);
    display:inline-block}}
  .lede{{{T['lede_style']};color:var(--muted);max-width:56ch;margin-bottom:28px}}
  .actions{{display:flex;gap:12px;flex-wrap:wrap;align-items:center}}

  .panel{{background:var(--card);border:1px solid var(--line);border-radius:var(--radius-lg);
    box-shadow:var(--shadow-2);overflow:hidden}}
  .panel .panel-h{{display:flex;align-items:baseline;gap:10px;padding:16px 22px;
    border-bottom:1px solid var(--line-soft);background:var(--sunk)}}
  .panel .panel-h .t{{font-family:var(--mono);font-size:.7rem;letter-spacing:.14em;
    text-transform:uppercase;color:var(--faint);font-weight:700}}
  .panel .panel-b{{padding:8px 22px 18px}}
  .panel .prow{{display:flex;gap:16px;justify-content:space-between;align-items:baseline;
    padding:13px 0;border-bottom:1px solid var(--line-soft)}}
  .panel .prow:last-child{{border-bottom:0}}
  .panel .prow .k{{color:var(--muted);font-size:.92rem}}
  .panel .prow .v{{font-weight:700;text-align:right;font-variant-numeric:tabular-nums}}
  .sig{{display:grid;place-items:center;min-height:270px;position:relative;
    background:
      linear-gradient(150deg,color-mix(in srgb,var(--accent) 92%,#000) 0%,var(--accent) 58%,
                      color-mix(in srgb,var(--accent) 72%,#fff) 100%);
    color:var(--on-accent);text-align:center;padding:34px}}
  .sig .mono{{font-family:var(--display);font-size:clamp(3.4rem,7vw,5.2rem);font-weight:700;
    letter-spacing:-.04em;line-height:1;opacity:.96}}
  .sig .sub{{font-family:var(--mono);font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;
    margin-top:14px;opacity:.86}}

  /* --------------------------------------------------------------- sections */
  section.block{{padding:clamp(44px,6vw,82px) 0;position:relative}}
  section.block.tone-b{{background:var(--paper-2);
    border-top:1px solid var(--line);border-bottom:1px solid var(--line)}}
  section.block.tone-b + section.block.tone-b{{border-top:0}}
  .sec-h{{margin-bottom:clamp(22px,3vw,34px);max-width:var(--measure)}}
  .sec-h h2{{margin:0}}
  .sec-h .rule{{width:34px;height:2px;background:var(--accent);margin-bottom:18px;
    border-radius:2px}}

  /* ------------------------------------------------------------------ cards */
  .grid{{display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(250px,1fr))}}
  .card{{position:relative;background:var(--card);border:1px solid var(--line);
    border-radius:var(--radius);padding:24px 22px 22px;
    transition:transform .2s,box-shadow .2s,border-color .2s}}
  .card::before{{content:"";position:absolute;left:22px;right:22px;top:0;height:2px;
    background:var(--accent);border-radius:0 0 2px 2px;transform:scaleX(0);
    transform-origin:left;transition:transform .28s}}
  .card:hover{{transform:translateY(-3px);box-shadow:var(--shadow-2);
    border-color:color-mix(in srgb,var(--accent) 30%,var(--line))}}
  .card:hover::before{{transform:scaleX(1)}}
  .card h3{{margin-top:0}}
  .card p{{margin:0;color:var(--muted);font-size:.96rem}}

  /* ------------------------------------------------------------------ facts */
  .facts{{display:grid;gap:1px;border:1px solid var(--line);border-radius:var(--radius);
    overflow:hidden;background:var(--line);
    grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}}
  .fact{{background:var(--card);padding:22px 24px}}
  .fact .k{{font-family:var(--mono);font-size:.66rem;letter-spacing:.13em;text-transform:uppercase;
    color:var(--faint);font-weight:700;margin-bottom:7px}}
  .fact .v{{font-family:var(--display);font-weight:{T['card_title_weight']};font-size:1.16rem;
    letter-spacing:-.015em;font-variant-numeric:tabular-nums}}

  /* ------------------------------------------------------------------ steps */
  ol.steps{{counter-reset:s;list-style:none;padding:0;margin:0;display:grid;gap:0;
    position:relative}}
  ol.steps li{{counter-increment:s;position:relative;padding:0 0 30px 62px}}
  ol.steps li::before{{content:counter(s);position:absolute;left:0;top:-2px;width:36px;height:36px;
    border-radius:50%;background:var(--card);color:var(--accent);display:grid;place-items:center;
    font-family:var(--mono);font-weight:700;font-size:.88rem;z-index:1;
    border:1.5px solid color-mix(in srgb,var(--accent) 45%,var(--line))}}
  ol.steps li::after{{content:"";position:absolute;left:17.5px;top:36px;bottom:0;width:1.5px;
    background:linear-gradient(var(--line),var(--line-soft))}}
  ol.steps li:last-child{{padding-bottom:0}}
  ol.steps li:last-child::after{{display:none}}
  ol.steps h3{{margin:6px 0 4px}}
  ol.steps p{{margin:0;color:var(--muted);font-size:.97rem;max-width:60ch}}

  /* -------------------------------------------------------------------- faq */
  .faqs{{border-top:1px solid var(--line);max-width:var(--measure)}}
  details.faq{{border-bottom:1px solid var(--line);padding:0}}
  details.faq summary{{cursor:pointer;font-weight:700;list-style:none;padding:20px 44px 20px 0;
    position:relative;font-size:1.02rem;transition:color .18s}}
  details.faq summary:hover{{color:var(--accent)}}
  details.faq summary::-webkit-details-marker{{display:none}}
  details.faq summary::after{{content:"";position:absolute;right:8px;top:50%;width:9px;height:9px;
    border-right:2px solid var(--accent);border-bottom:2px solid var(--accent);
    transform:translateY(-70%) rotate(45deg);transition:transform .25s}}
  details.faq[open] summary::after{{transform:translateY(-30%) rotate(-135deg)}}
  details.faq p{{margin:0 0 22px;color:var(--muted);max-width:62ch}}

  /* ------------------------------------------------------------------ prose */
  .prose{{max-width:var(--measure)}}
  .prose .lead{{font-size:1.12rem;color:var(--ink)}}
  .prose p{{color:var(--muted)}}

  /* ------------------------------------------------------------------- feed */
  .feed{{display:grid;gap:0;border-top:1px solid var(--line)}}
  .item{{display:flex;gap:22px;align-items:center;padding:18px 6px;
    border-bottom:1px solid var(--line);transition:padding-left .2s,background .2s}}
  .item:hover{{background:var(--card);padding-left:14px}}
  .when{{flex:none;width:66px;text-align:center;border-radius:var(--radius-sm);
    border:1px solid var(--line);background:var(--card);padding:8px 4px;
    font-family:var(--mono);line-height:1.15}}
  .when .d{{display:block;font-size:1.16rem;font-weight:700;letter-spacing:-.02em;
    font-variant-numeric:tabular-nums}}
  .when .m{{display:block;font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;
    color:var(--accent);font-weight:700;margin-top:2px}}
  .when.plain{{font-size:.78rem;font-weight:700;color:var(--accent);padding:12px 4px}}
  .item .what{{font-family:var(--display);font-weight:{T['card_title_weight']};font-size:1.04rem;
    letter-spacing:-.012em}}
  .item .sub{{color:var(--muted);font-size:.92rem;margin-top:2px}}
  .empty{{color:var(--muted);font-style:italic;padding:20px 22px;border:1px dashed var(--line);
    border-radius:var(--radius);background:var(--sunk)}}

  /* ------------------------------------------------------------------- form */
  .formwrap{{display:grid;gap:26px;grid-template-columns:minmax(0,1fr);
    max-width:var(--measure)}}
  form.capture{{display:grid;gap:16px;background:var(--card);border:1px solid var(--line);
    border-radius:var(--radius-lg);padding:26px}}
  form.capture label{{display:grid;gap:7px;font-weight:650;font-size:.88rem;
    letter-spacing:.005em}}
  form.capture input,form.capture textarea{{font:inherit;font-size:.98rem;padding:13px 15px;
    border-radius:var(--radius-sm);border:1px solid var(--line);background:var(--paper);
    color:var(--ink);width:100%;transition:border-color .18s,box-shadow .18s}}
  form.capture input:focus,form.capture textarea:focus{{outline:none;
    border-color:var(--accent);
    box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}}
  form.capture textarea{{min-height:130px;resize:vertical}}
  .formnote{{font-size:.85rem;color:var(--faint);margin:0}}

  /* ---------------------------------------------------------------- pricing */
  .price{{display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(255px,1fr));
    align-items:start}}
  .price .tier{{position:relative;border:1px solid var(--line);border-radius:var(--radius-lg);
    padding:28px 26px;background:var(--card);transition:transform .2s,box-shadow .2s}}
  .price .tier:hover{{transform:translateY(-3px);box-shadow:var(--shadow-2)}}
  .price .tier.feat{{border-color:var(--accent);box-shadow:var(--shadow-2)}}
  .price .tier.feat::after{{content:attr(data-flag);position:absolute;top:-11px;left:26px;
    background:var(--accent);color:var(--on-accent);font-size:.66rem;font-weight:800;
    letter-spacing:.12em;text-transform:uppercase;padding:5px 12px;border-radius:999px}}
  .price h3{{margin:0;font-size:.95rem;letter-spacing:.02em;color:var(--muted);
    font-family:var(--font);font-weight:700;text-transform:uppercase}}
  .price .amt{{font-family:var(--display);font-size:2.3rem;font-weight:{T['h1_weight']};
    letter-spacing:-.035em;margin:.24em 0 .5em;line-height:1}}
  .price ul{{margin:0;padding:0;list-style:none;display:grid;gap:9px;color:var(--muted);
    font-size:.95rem}}
  .price li{{position:relative;padding-left:24px}}
  .price li::before{{content:"";position:absolute;left:2px;top:.52em;width:9px;height:5px;
    border-left:2px solid var(--accent);border-bottom:2px solid var(--accent);
    transform:rotate(-45deg)}}

  /* -------------------------------------------------------------------- pay */
  .give{{display:grid;gap:22px;border:1px solid var(--line);border-radius:var(--radius-lg);
    padding:28px;background:var(--card);max-width:640px;box-shadow:var(--shadow-1)}}
  .give .k{{font-family:var(--mono);font-size:.66rem;letter-spacing:.13em;text-transform:uppercase;
    color:var(--faint);font-weight:700;margin-bottom:10px}}
  .chips{{display:flex;gap:9px;flex-wrap:wrap}}
  .chip{{padding:10px 18px;border-radius:999px;border:1px solid var(--line);font-weight:650;
    font-size:.93rem;background:var(--paper);cursor:pointer;font-family:var(--font);
    color:var(--ink);transition:all .18s}}
  .chip:hover{{border-color:color-mix(in srgb,var(--accent) 45%,var(--line))}}
  .chip[aria-pressed="true"]{{background:var(--accent);color:var(--on-accent);
    border-color:var(--accent);
    box-shadow:0 6px 16px color-mix(in srgb,var(--accent) 25%,transparent)}}
  .notice{{font-size:.88rem;color:var(--muted);border-left:3px solid var(--accent);
    padding-left:14px;margin:0}}

  /* --------------------------------------------------------------- cta band */
  .band{{position:relative;border-radius:var(--radius-lg);overflow:hidden;
    padding:clamp(38px,5vw,64px) clamp(26px,4vw,54px);text-align:center;
    background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 90%,#000),var(--accent));
    color:var(--on-accent);box-shadow:var(--shadow-2)}}
  .band::after{{content:"";position:absolute;inset:0;
    background:radial-gradient(60% 80% at 82% 0%,rgba(255,255,255,.22),transparent 60%);
    pointer-events:none}}
  .band > *{{position:relative}}
  .band h2{{margin-bottom:.4em}}
  .band p{{opacity:.9;max-width:52ch;margin:0 auto 26px;font-size:1.04rem}}
  .band .btn.pri{{background:var(--on-accent);color:var(--accent);box-shadow:none}}
  .band .btn.pri:hover{{box-shadow:0 14px 30px rgba(0,0,0,.18)}}

  /* ----------------------------------------------------------------- footer */
  .hubbar{{display:flex;align-items:center;justify-content:center;gap:10px;
    flex-wrap:wrap;text-align:center;background:var(--band);color:var(--on-band);
    text-decoration:none;font-size:.84rem;padding:9px 18px;
    border-bottom:1px solid color-mix(in srgb,var(--on-band) 14%,transparent)}}
  .hubbar .hb-back{{opacity:.75}}
  .hubbar .hb-note{{opacity:.82}}
  .hubbar .hb-label{{font-weight:700;text-decoration:underline;text-underline-offset:3px}}
  .hubbar:hover .hb-label{{text-decoration-thickness:2px}}
  @media(max-width:520px){{.hubbar{{font-size:.79rem;padding:8px 14px}}}}

  footer.site{{border-top:1px solid var(--line);padding:52px 0 60px;color:var(--muted);
    font-size:.92rem;margin-top:clamp(40px,6vw,80px);background:var(--paper-2)}}
  footer.site .cols{{display:grid;gap:30px;
    grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr)}}
  footer.site .fname{{font-family:var(--display);font-size:1.12rem;font-weight:700;
    color:var(--ink);letter-spacing:-.02em;margin-bottom:6px}}
  footer.site .fh{{font-family:var(--mono);font-size:.66rem;letter-spacing:.13em;
    text-transform:uppercase;color:var(--faint);font-weight:700;margin-bottom:12px}}
  footer.site .flinks{{display:grid;gap:8px}}
  footer.site a{{color:var(--muted);text-decoration:none}}
  footer.site a:hover{{color:var(--accent)}}
  footer.site .fine{{margin-top:34px;padding-top:20px;border-top:1px solid var(--line);
    font-size:.83rem;color:var(--faint);display:flex;gap:16px;flex-wrap:wrap;
    justify-content:space-between}}

  /* ----------------------------------------------------------------- motion */
  /* CSS-only, and it ends visible. A scroll-triggered reveal needs JavaScript and an
     observer to *undo* a hidden state — one failure and a client's page is blank. This
     plays once, forwards, and the final frame is the page. */
  @keyframes rise{{from{{opacity:0;transform:translateY(13px)}}to{{opacity:1;transform:none}}}}
  [data-reveal]{{animation:rise .55s cubic-bezier(.2,.7,.3,1) both}}
  .hero [data-reveal]{{animation-delay:.04s}}

  /* An archetype can carry seven nav items plus two buttons, which is more than fits on a
     tablet. Rather than let it wrap into an accident, the nav takes a row of its own. */
  @media (max-width:1060px){{
    .hero-grid{{grid-template-columns:minmax(0,1fr)}}
    .hero .panel,.hero .sig{{max-width:560px}}
    nav.main{{order:3;width:100%;margin:0;padding-top:8px;border-top:1px solid var(--line)}}
    nav.main a{{padding-left:0;padding-right:18px}}
    nav.main a::after{{left:0;right:18px}}
    /* padding-block only — the shorthand would wipe the wrapper's side gutters. */
    .bar{{padding-top:10px;padding-bottom:10px;min-height:0}}
    header.site.is-scrolled .bar{{min-height:0}}
    footer.site .cols{{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
  }}
  @media (max-width:640px){{
    nav.main{{border-top:0;padding-top:0;overflow-x:auto;flex-wrap:nowrap;
      scrollbar-width:none;-webkit-overflow-scrolling:touch}}
    nav.main::-webkit-scrollbar{{display:none}}
    .bar .btn.sec{{display:none}}
    footer.site .cols{{grid-template-columns:minmax(0,1fr)}}
    .actions .btn{{flex:1 1 auto;justify-content:center}}
  }}
  @media (prefers-reduced-motion:reduce){{
    *{{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
    [data-reveal]{{opacity:1;transform:none}}
  }}
"""


# ===========================================================================
# sections — one function per declared kind, and no other code path
# ===========================================================================

def _layout(spec) -> dict:
    """The page design this site is built in. The spec may name one; otherwise the
    archetype's own choice applies, exactly like the type preset."""
    named = (spec.get("site") or {}).get("layout")
    return (layouts.get(named) if named
            else layouts.for_archetype(spec["archetype"]["id"]))


def _art(spec) -> tuple:
    """(archetype id, seed) — what every drawing on this page is derived from."""
    return spec["archetype"]["id"], visuals.seed_for(spec["business"]["name"])


# The photo plan is memoised HERE, not on the spec. Caching it on the spec dict mutated
# the object the fingerprint is computed over, so every build failed its own
# `spec_fingerprint` check — the spec is a signed artifact and the renderer is a reader.
_PHOTO_MEMO = {}


def _hub_bar(spec) -> str:
    """The route home, identical on every page of every site in a batch.

    Above the header rather than inside it: the header belongs to the business, and this
    line is about where the business sits. A visitor who is interested but not ready to
    leave an email is otherwise finished — this is the only door that is not the form."""
    h = (spec.get("site") or {}).get("hub") or {}
    url = h.get("url")
    if not url:
        return ""
    note = h.get("note") or ""
    return (f'<a class="hubbar" href="{e(url)}">'
            f'<span class="hb-back" aria-hidden="true">&larr;</span>'
            + (f'<span class="hb-note">{e(note)}</span>' if note else "")
            + f'<span class="hb-label">{e(h.get("label") or "All the ideas")}</span></a>')


def _hub_foot(spec) -> str:
    h = (spec.get("site") or {}).get("hub") or {}
    if not h.get("url"):
        return ""
    return (f'<a href="{e(h["url"])}">&larr; {e(h.get("label") or "All the ideas")}</a>')


def _photos(spec) -> dict:
    """Which photograph plays which role on this site.

    A prelaunch funnel deals from the BUSINESS's own kind of pictures, not from the
    prelaunch set. The prelaunch pool is six coffee shops — fine as the mood of a
    generic waitlist, wrong as the illustration of an invoice-chasing service, and
    identical across every funnel built in one batch: twelve different businesses read
    as one café. The funnel is a page about that business, so it borrows the imagery the
    business's own site will use, and keeps the coffee shops only when its org type has
    no photographs at all."""
    aid = photos.pool_archetype(spec["archetype"]["id"],
                                spec["business"].get("org_type") or "")
    key = (aid, spec["business"]["name"])
    if key not in _PHOTO_MEMO:
        _PHOTO_MEMO[key] = photos.plan(*key)
    return _PHOTO_MEMO[key]


def _facts(s, spec):
    """A percentage is drawn as a dial as well as printed.

    A published figure is the most persuasive thing on a charity's or a school's page,
    and it was rendered as eleven characters of type. The number still reads; it now
    also has a shape."""
    out = []
    for i in s.get("items", []):
        m = visuals.PCT_RE.match(str(i.get("value", "")))
        dial = visuals.meter(int(m.group(1))) if m else ""
        out.append(f'<div class="fact">{dial}<div class="k">{e(i["label"])}</div>'
                   f'<div class="v">{e(i["value"])}</div></div>')
    return f'<div class="facts">{"".join(out)}</div>'


# ===========================================================================
# card styles — one per layout
# ===========================================================================
#
# Every one of these renders the same data (a title, a body, an icon, maybe a photograph).
# What changes is the shape, which is the whole point of a layout: an archetype should be
# able to look like a different kind of website without a different renderer.

def _card_bits(s, spec, want_pics: bool):
    """(items, icon keys, photo plan) — the parts every card style needs."""
    aid, seed = _art(spec)
    items = s.get("items", [])
    keys = visuals.icons_for(aid, "cards", len(items), seed)
    pl = _photos(spec) if want_pics else {}
    return items, keys, pl


def _cards_grid(s, spec):
    """Three-up cards with a picture on top. The house default."""
    items, keys, pl = _card_bits(s, spec, s.get("pictures"))
    out = []
    for i, item in enumerate(items):
        role = f"card{i + 1}"
        pic = pl.get(role) if i < 4 else None
        if pic:
            out.append(
                '<div class="card haspic"><div class="pic">'
                + photos.img_tag(role, w=pic.get("w") or 1600, h=pic.get("h") or 1066)
                + f'</div><div class="body">{visuals.icon(keys[i])}'
                  f'<h3>{e(item.get("title",""))}</h3>'
                + (f'<p>{e(item["body"])}</p>' if item.get("body") else "")
                + "</div></div>")
        else:
            out.append(f'<div class="card">{visuals.icon(keys[i])}'
                       f'<h3>{e(item.get("title",""))}</h3>'
                       + (f'<p>{e(item["body"])}</p>' if item.get("body") else "")
                       + "</div>")
    return f'<div class="grid">{"".join(out)}</div>'


def _cards_rows(s, spec):
    """Alternating picture/text rows — the shape a long article uses."""
    items, keys, pl = _card_bits(s, spec, s.get("pictures"))
    out = []
    for i, item in enumerate(items):
        role = f"card{i + 1}"
        pic = pl.get(role) if i < 4 else None
        text = (f'<div class="rtext">{visuals.icon(keys[i])}'
                f'<h3>{e(item.get("title",""))}</h3>'
                + (f'<p>{e(item["body"])}</p>' if item.get("body") else "") + "</div>")
        if pic:
            out.append('<div class="row"><div class="rpic">'
                       + photos.img_tag(role, w=pic.get("w") or 1600,
                                        h=pic.get("h") or 1066)
                       + "</div>" + text + "</div>")
        else:
            out.append(f'<div class="row nopic">{text}</div>')
    return f'<div class="rows">{"".join(out)}</div>'


def _cards_feature(s, spec):
    """Two large cards, the picture filling the top of each."""
    items, keys, pl = _card_bits(s, spec, s.get("pictures"))
    out = []
    for i, item in enumerate(items):
        role = f"card{i + 1}"
        pic = pl.get(role) if i < 4 else None
        shot = ('<div class="fpic">'
                + photos.img_tag(role, w=pic.get("w") or 1600, h=pic.get("h") or 1066)
                + "</div>") if pic else ""
        out.append(f'<div class="fcard">{shot}<div class="fbody">'
                   f'{visuals.icon(keys[i])}<h3>{e(item.get("title",""))}</h3>'
                   + (f'<p>{e(item["body"])}</p>' if item.get("body") else "")
                   + "</div></div>")
    return f'<div class="feature">{"".join(out)}</div>'


def _cards_mosaic(s, spec):
    """Masonry columns of pictures with the words underneath."""
    items, keys, pl = _card_bits(s, spec, s.get("pictures"))
    out = []
    for i, item in enumerate(items):
        role = f"card{i + 1}"
        pic = pl.get(role) if i < 4 else None
        shot = ('<div class="mpic">'
                + photos.img_tag(role, w=pic.get("w") or 1600, h=pic.get("h") or 1066)
                + "</div>") if pic else ""
        out.append(f'<div class="mcard">{shot}<div class="mbody">'
                   f'{visuals.icon(keys[i])}<h3>{e(item.get("title",""))}</h3>'
                   + (f'<p>{e(item["body"])}</p>' if item.get("body") else "")
                   + "</div></div>")
    return f'<div class="mgrid">{"".join(out)}</div>'


def _cards_list(s, spec):
    """A list with thumbnails. Dense, scannable, no decoration."""
    items, keys, pl = _card_bits(s, spec, s.get("pictures"))
    out = []
    for i, item in enumerate(items):
        role = f"card{i + 1}"
        pic = pl.get(role) if i < 4 else None
        shot = ('<div class="lpic">'
                + photos.img_tag(role, w=pic.get("w") or 1600, h=pic.get("h") or 1066)
                + "</div>") if pic else ""
        out.append(f'<div class="li{"" if pic else " nopic"}">{shot}'
                   f'<div class="lbody"><h3>{visuals.icon(keys[i])}'
                   f'{e(item.get("title",""))}</h3>'
                   + (f'<p>{e(item["body"])}</p>' if item.get("body") else "")
                   + "</div></div>")
    return f'<div class="clist">{"".join(out)}</div>'


CARD_STYLES = {"grid": _cards_grid, "rows": _cards_rows, "feature": _cards_feature,
               "mosaic": _cards_mosaic, "list": _cards_list}


def _cards(s, spec):
    """Dispatch on the layout. Unknown styles fall back to the grid rather than failing —
    a layout typo should not take a site down."""
    style = _layout(spec)["cards"]
    return CARD_STYLES.get(style, _cards_grid)(s, spec)


def _steps(s, spec):
    aid, seed = _art(spec)
    items = s.get("items", [])
    keys = visuals.icons_for(aid, "steps", len(items), seed + 3)
    out = "".join(f'<li>{visuals.icon(keys[i])}<h3>{e(x.get("title",""))}</h3>'
                  f'<p>{e(x.get("body",""))}</p></li>' for i, x in enumerate(items))
    return f'<ol class="steps">{out}</ol>'


def _faq(s, spec):
    items = "".join(
        f'<details class="faq"{" open" if n == 0 else ""}>'
        f'<summary>{visuals.icon("chat")}{e(i["q"])}</summary>'
        f'<p>{e(i["a"])}</p></details>'
        for n, i in enumerate(s.get("items", [])))
    return f'<div class="faqs">{items}</div>'


def _prose(s):
    return f'<div class="prose">{visuals.quote_ornament()}{_para(s.get("body",""))}</div>'


def _datechip(when: str, time: str) -> str:
    """A date reads faster as a shape than as a string. ISO dates become a stacked
    day/month chip; anything else keeps its own words rather than being mangled."""
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", (when or "").strip())
    if m:
        return (f'<div class="when"><span class="d">{m.group(3)}</span>'
                f'<span class="m">{MONTHS.get(m.group(2), m.group(2))}</span></div>')
    label = (when or time or "—").strip()
    return f'<div class="when plain">{e(label)}</div>'


def _feed(s, spec):
    """Records from a platform module, rendered as they stand today.

    The site and the platform are the same system: what the owner types into Events is
    what a visitor reads here. The generated page carries the seed at build time and
    re-reads the live records in the browser when the platform is on the same origin."""
    key = s.get("source")
    mod = next((m for m in spec["modules"] if m["key"] == key), None)
    if not mod:
        return f'<div class="empty">{e(s.get("empty","Nothing here yet."))}</div>'
    rows = (mod.get("seed") or [])[: s.get("limit", 5)]
    if not rows:
        return f'<div class="empty">{e(s.get("empty","Nothing here yet."))}</div>'
    title_k = mod["fields"][0]["k"]
    date_k = next((f["k"] for f in mod["fields"] if f["type"] == "date"), None)
    sub_k = next((f["k"] for f in mod["fields"]
                  if f["type"] == "textarea" or f["k"] in ("place", "speaker", "series")), None)
    out = []
    for r in rows:
        out.append(
            '<div class="item">'
            + _datechip(str(r.get(date_k, "")) if date_k else "", str(r.get("time", "")))
            + f'<div><div class="what">{e(r.get(title_k,""))}</div>'
            + (f'<div class="sub">{e(r.get(sub_k,""))}</div>' if sub_k and r.get(sub_k) else "")
            + "</div></div>")
    return (f'<div class="feed" data-module="{e(key)}">' + "".join(out) + "</div>")


FIELD_LABEL = {"name": "Your name", "email": "Email", "subject": "Subject",
               "message": "Message", "when": "When suits you"}


def _form(s, spec):
    fields = []
    for f in s.get("fields", []):
        label = FIELD_LABEL.get(f, f.replace("_", " ").title())
        ctl = (f'<textarea name="{e(f)}" rows="5"></textarea>' if f == "message"
               else f'<input name="{e(f)}" type="{"email" if f=="email" else "text"}"'
                    f'{" required" if f in ("name","email") else ""}>')
        fields.append(f"<label>{e(label)}{ctl}</label>")
    target = s.get("target", "support_inbox")
    body = f'<p class="muted" style="max-width:56ch">{e(s["body"])}</p>' if s.get("body") else ""
    return ('<div class="formwrap">' + body
            + f'<form class="capture" data-target="{e(target)}" method="post" action="#">'
            + "".join(fields)
            + '<div><button class="btn pri" type="submit">Send</button></div>'
            + '<p class="formnote" data-formnote>Submissions land in the '
            + f'<strong>{e(target.replace("_"," "))}</strong> module of the business platform.</p>'
            + "</form></div>")


def _pay(s, spec):
    integ = next((i for i in spec["integrations"] if i["key"] == "payments"), None)
    live = bool(integ and integ["mode"] == "live")
    amounts = "".join(
        f'<button type="button" class="chip" data-group="amount" '
        f'aria-pressed="{"true" if i==1 else "false"}">{e(a)}</button>'
        for i, a in enumerate(["€10", "€25", "€50", "€100", "Other"]))
    opts = "".join(
        f'<button type="button" class="chip" data-group="freq" '
        f'aria-pressed="{"true" if i==0 else "false"}">{e(o)}</button>'
        for i, o in enumerate(s.get("options", [])))
    funds = "".join(
        f'<button type="button" class="chip" data-group="fund" '
        f'aria-pressed="{"true" if i==0 else "false"}">{e(f)}</button>'
        for i, f in enumerate(s.get("funds", [])))
    note = ("" if live else
            f'<p class="notice">{e(s.get("fallback",""))} Online payment goes live the moment '
            f'the operator supplies the {e((integ or {}).get("provider","payment"))} credentials — '
            'they are never held by the builder.</p>')
    label = s.get("action") or "Give now"
    return (f'<div class="give">'
            + (f'<div><div class="k">How often</div><div class="chips">{opts}</div></div>' if opts else "")
            + f'<div><div class="k">Amount</div><div class="chips">{amounts}</div></div>'
            + (f'<div><div class="k">Fund</div><div class="chips">{funds}</div></div>' if funds else "")
            + f'<div><button class="btn pri"{"" if live else " disabled"}>'
            + (e(label) if live else e(label) + " — not yet switched on") + "</button></div>"
            + note + "</div>")


def _pricing(s):
    items = s.get("items", [])
    feat = next((i for i, t in enumerate(items) if t.get("featured")), 1 if len(items) > 2 else -1)
    tiers = "".join(
        f'<div class="tier{" feat" if i == feat else ""}" data-flag="{e(t.get("flag","Most chosen"))}">'
        + visuals.icon("star" if i == feat else "tag")
        + f'<h3>{e(t["name"])}</h3><div class="amt">{e(t["price"])}</div>'
        + ("<ul>" + "".join(f"<li>{e(x)}</li>" for x in t.get("includes", [])) + "</ul>"
           if t.get("includes") else "")
        + "</div>" for i, t in enumerate(items))
    return f'<div class="price">{tiers}</div>'


def _cta(s, spec):
    aid, seed = _art(spec)
    return (f'<div class="band cta-band">{visuals.emblem(aid, seed)}'
            f'<h2>{e(s.get("title",""))}</h2>'
            f'<p>{e(s.get("body",""))}</p>'
            f'<a class="btn pri" href="{e(_href(s.get("cta_href","/contact")))}">'
            f'{e(s.get("cta","Get in touch"))}</a></div>')


def _href(h: str) -> str:
    """Archetype hrefs are written as clean paths; a static folder needs filenames."""
    if not h or h.startswith(("http", "#", "mailto:")):
        return h or "#"
    slug = h.strip("/") or "index"
    return "index.html" if slug in ("", "index", "home") else f"{slug}.html"


def render_section(s: dict, spec: dict, tone: str = "a") -> str:
    kind = s.get("kind")
    inner = {
        "facts": lambda: _facts(s, spec),
        "cards": lambda: _cards(s, spec),
        "steps": lambda: _steps(s, spec),
        "faq": lambda: _faq(s, spec),
        "prose": lambda: _prose(s),
        "feed": lambda: _feed(s, spec),
        "form": lambda: _form(s, spec),
        "pay": lambda: _pay(s, spec),
        "pricing": lambda: _pricing(s),
        "cta": lambda: _cta(s, spec),
    }.get(kind)
    if not inner:
        raise ValueError(f"section kind '{kind}' has no renderer — archetypes may only use "
                         "the shared section vocabulary")
    head = ""
    if kind != "cta" and s.get("title"):
        head = (f'<div class="sec-h">{visuals.sec_ornament(_art(spec)[1])}'
                f'<h2>{e(s["title"])}</h2></div>')
    cls = "block" + (" tone-b" if tone == "b" else "")
    # A textured ground meeting a plain one on a straight line reads as a rendering
    # accident. The alternate grounds get a drawn edge instead.
    edges = (visuals.wave(False, "wave top") + visuals.wave(True, "wave bot")
             if tone == "b" else "")
    return (f'<section class="{cls}">{edges}<div class="wrap" data-reveal>'
            f'{head}{inner()}</div></section>')


# ===========================================================================
# page
# ===========================================================================

def _initials(name: str) -> str:
    words = [w for w in re.split(r"[^A-Za-z0-9]+", name or "") if w]
    if not words:
        return "—"
    if len(words) == 1:
        return words[0][:2].upper()
    return (words[0][0] + words[-1][0]).upper()


# ===========================================================================
# hero shapes — one per layout
# ===========================================================================
#
# Each takes the same three things (the type block, the promoted facts, the photo plan)
# and produces a genuinely different first screen. They return (html, promoted_consumed)
# so the caller knows whether to put an unused facts strip back into the page.

def _facts_rows(promoted, cls_row="prow", cls_k="k", cls_v="v"):
    return "".join(f'<div class="{cls_row}"><div class="{cls_k}">{e(i["label"])}</div>'
                   f'<div class="{cls_v}">{e(i["value"])}</div></div>'
                   for i in (promoted or {}).get("items", []))


def _hero_split(left, promoted, pl, spec, page, art):
    """Type beside a facts panel, over a photograph. The house default."""
    shot = ('<div class="shot">'
            + photos.img_tag("hero", eager=True, w=pl["hero"].get("w") or 1600,
                             h=pl["hero"].get("h") or 1066) + "</div>") if pl.get("hero") else ""
    side = (_hero_panel(page, spec, promoted, photo=bool(shot))
            if page["slug"] == "home" else "")
    cls = ("hero photo" if shot else "hero") + ("" if page["slug"] == "home" else " solo")
    style = f' style="--shot-bg:{e(_shot_bg(spec))};--on-shot:#ffffff"' if shot else ""
    return (f'<div class="{cls} ly-classic"{style}>{shot}{art}'
            f'<div class="wrap"><div class="hero-grid">{left}{side}</div></div></div>',
            bool(side))


def _hero_full(left, promoted, pl, spec, page, art):
    """Full-bleed photograph, type centred on it, facts pushed out as a strip beneath.

    The facts leave the hero entirely here — a floating card would fight a centred
    composition, and a strip under the fold is where a magazine puts its standfirst."""
    shot = ('<div class="shot">'
            + photos.img_tag("hero", eager=True, w=pl["hero"].get("w") or 1600,
                             h=pl["hero"].get("h") or 1066) + "</div>") if pl.get("hero") else ""
    cls = ("hero photo" if shot else "hero") + " ly-editorial"
    style = f' style="--shot-bg:{e(_shot_bg(spec))};--on-shot:#ffffff"' if shot else ""
    strip = ""
    if promoted and page["slug"] == "home":
        cells = "".join(f'<div class="f"><div class="k">{e(i["label"])}</div>'
                        f'<div class="v">{e(i["value"])}</div></div>'
                        for i in promoted.get("items", []))
        strip = f'<div class="factstrip"><div class="wrap">{cells}</div></div>'
    return (f'<div class="{cls}"{style}>{shot}'
            f'<div class="wrap"><div class="hero-grid">{left}</div></div></div>{strip}',
            bool(strip))


def _hero_poster(left, promoted, pl, spec, page, art):
    """An oversized name on paper, with a tall picture column off the right edge.

    Deliberately NO photograph behind the type: this layout is for businesses whose name
    is the thing being sold, and type on paper is louder than type on a picture."""
    col = ""
    if pl.get("hero") and page["slug"] == "home":
        rail = "".join(f'<div class="rr"><span>{e(i["label"])}</span>'
                       f'<b>{e(i["value"])}</b></div>'
                       for i in (promoted or {}).get("items", [])[:4])
        col = ('<div class="postercol">'
               + photos.img_tag("hero", eager=True, w=pl["hero"].get("w") or 1600,
                                h=pl["hero"].get("h") or 1066)
               + (f'<div class="rail">{rail}</div>' if rail else "") + "</div>")
    return (f'<div class="hero ly-poster">{art}'
            f'<div class="wrap"><div class="hero-grid">{left}{col}</div></div></div>',
            bool(col and promoted))


def _hero_mosaic(left, promoted, pl, spec, page, art):
    """Pictures first, words second: a three-picture mosaic, then the type under it."""
    mos = ""
    if page["slug"] == "home" and pl.get("hero"):
        def cell(role):
            p = pl.get(role) or {}
            return ('<div class="m">'
                    + photos.img_tag(role, eager=(role == "hero"),
                                     w=p.get("w") or 1600, h=p.get("h") or 1066)
                    + "</div>")
        mos = ('<div class="mosaic">' + cell("hero")
               + '<div class="side">' + cell("band") + cell("card1") + "</div></div>")
    side = _hero_panel(page, spec, promoted) if (mos and promoted) else ""
    return (f'<div class="hero ly-gallery">{mos}'
            f'<div class="wrap"><div class="hero-grid">{left}{side}</div></div></div>',
            bool(side))


def _hero_strip(left, promoted, pl, spec, page, art):
    """A short picture strip with the facts as a table beside it. Nothing floats."""
    strip = ""
    if pl.get("hero") and page["slug"] == "home":
        strip = ('<div class="strip">'
                 + photos.img_tag("hero", eager=True, w=pl["hero"].get("w") or 1600,
                                  h=pl["hero"].get("h") or 1066) + "</div>")
    table = ""
    if promoted and page["slug"] == "home":
        rows = "".join(f'<div class="fr"><span>{e(i["label"])}</span>'
                       f'<b>{e(i["value"])}</b></div>'
                       for i in promoted.get("items", []))
        table = f'<div class="facttable">{rows}</div>'
    return (f'<div class="hero ly-compact">'
            f'<div class="wrap"><div class="hero-grid">'
            f'<div class="htext">{left}{table}</div>{strip}</div></div></div>',
            bool(table))


HERO_SHAPES = {"split": _hero_split, "full": _hero_full, "poster": _hero_poster,
               "mosaic": _hero_mosaic, "strip": _hero_strip}


def _shot_bg(spec: dict) -> str:
    """The colour the hero photograph is scrimmed with.

    The kit's band — its darkest structural colour — rather than black, so the veil
    over the picture is the brand's own shade and a church's first screen does not go
    the same grey as a shop's."""
    kit = (spec.get("brand") or {}).get("kit") or {}
    return kit.get("band") or spec["brand"]["palette"].get("navy", "#1B2A4A")


def _photoband(spec: dict) -> str:
    """One full-width photograph across the page, carrying a line of the business's
    own words. The reference portfolio's single strongest device: a wide picture that
    breaks a column of cards and gives the eye somewhere to land."""
    biz = spec["business"]
    pl = _photos(spec)
    # `tagline` is filled from the archetype label when the profile did not supply one,
    # so preferring it captions a photograph "Church / faith community". The offer line is
    # the business's own sentence.
    line = (biz.get("offer_line") or biz.get("tagline") or "").strip()
    cap = (f'<div class="cap"><div class="wrap"><p>{e(line)}</p></div></div>'
           if line else "")
    return ('<section class="photoband">'
            + photos.img_tag("band", w=(pl.get("band") or {}).get("w") or 1600,
                              h=(pl.get("band") or {}).get("h") or 1066) + cap + '</section>')


def _palette_strip(spec: dict) -> str:
    """The brand's five published colours, full width, six pixels tall, directly under
    the header. Lifted from the reference portfolio, where it is the one element that
    tells you whose page you are on before anything else has rendered."""
    sw = ((spec.get("brand") or {}).get("kit") or {}).get("swatches") or []
    if not sw:
        return ""
    return ('<div class="pstrip" aria-hidden="true">'
            + "".join(f'<i style="background:{e(c["hex"])}"></i>' for c in sw)
            + '</div>')


def _hero_panel(page: dict, spec: dict, promoted: dict, photo: bool = False) -> str:
    """The right-hand side of the first screen: a picture, with the facts on top of it.

    A stock photograph would be a lie — the business does not exist yet. But the first
    version of this rule produced a page with no image at all, and a business whose
    front door is a text box reads as a document rather than a place.

    So the side is now a **plate**: a framed drawing built from the archetype and the
    brand kit (see visuals.py), with the page's own facts panel overlapping its lower
    corner. The drawing claims nothing and the facts are the page's own — both are true
    on the day it ships, and together they are something to look at."""
    biz = spec["business"]
    # With a photograph behind the hero the drawn plate is redundant — two pictures, one
    # on top of the other. The plate remains for a build with no photo pack.
    plate = ""
    if not photo:
        art = visuals.emblem(spec["archetype"]["id"],
                             visuals.seed_for(biz["name"]), "plate-art")
        plate = (f'<div class="plate">{art}<span class="plate-tag">'
                 f'{e(biz.get("city") or spec["archetype"].get("label", ""))}</span></div>')

    if promoted:
        rows = "".join(f'<div class="prow"><div class="k">{e(i["label"])}</div>'
                       f'<div class="v">{e(i["value"])}</div></div>'
                       for i in promoted.get("items", []))
        title = promoted.get("title") or "At a glance"
        panel = (f'<div class="panel"><div class="panel-h"><span class="t">{e(title)}</span></div>'
                 f'<div class="panel-b">{rows}</div></div>')
    else:
        sub = biz.get("city") or spec["archetype"].get("label", "")
        panel = (f'<div class="panel"><div class="sig"><div>'
                 f'<div class="mono">{e(_initials(biz["name"]))}</div>'
                 f'<div class="sub">{e(sub)}</div></div></div></div>')
    return f'<div class="hero-side">{plate}{panel}</div>'


def render_page(page: dict, spec: dict, logo: str = "") -> str:
    biz = spec["business"]
    site = spec["site"]
    nav = "".join(
        '<a href="%s"%s>%s</a>' % (e(n["href"]),
                                   ' aria-current="page"' if n["slug"] == page["slug"] else "",
                                   e(n["title"]))
        for n in site["nav"])
    pri = site.get("primary_cta") or {}
    sec = site.get("secondary_cta") or {}
    hero = page.get("hero") or {}
    sections = list(page.get("sections", []))

    # A facts strip is the best thing that can happen to a first screen: it is short,
    # scannable and answers the question the visitor actually arrived with. When a page
    # opens with one, it is promoted into the hero rather than rendered twice.
    promoted = {}
    if hero and sections and sections[0].get("kind") == "facts":
        promoted = sections.pop(0)

    hero_html = ""
    if hero:
        acts = []
        if hero.get("cta"):
            acts.append(f'<a class="btn pri" href="{e(_href(hero.get("cta_href")))}">{e(hero["cta"])}</a>')
        if hero.get("cta2"):
            acts.append(f'<a class="btn sec" href="{e(_href(hero.get("cta2_href")))}">{e(hero["cta2"])}</a>')
        left = (
            '<div>'
            + (f'<span class="eyebrow">{e(hero["eyebrow"])}</span>' if hero.get("eyebrow") else "")
            + f'<h1>{e(hero.get("title", biz["name"]))}</h1>'
            + (f'<p class="lede">{e(hero["lede"])}</p>' if hero.get("lede") else "")
            + (f'<div class="actions">{"".join(acts)}</div>' if acts else "")
            + "</div>")
        pl = _photos(spec)
        art = visuals.emblem(spec["archetype"]["id"], visuals.seed_for(biz["name"]))
        # Which first screen this business gets is the layout's decision, not the
        # renderer's. Five shapes, chosen by the archetype the same way it chooses a
        # type preset — see layouts.py for what each one is for.
        shape = HERO_SHAPES.get(_layout(spec)["hero"], _hero_split)
        hero_html, used_facts = shape(left, promoted, pl, spec, page, art)
        if promoted and not used_facts:
            sections.insert(0, promoted)

    # Alternating grounds give a long page a rhythm; a cta band sits on paper so its own
    # colour is the loud thing on the screen.
    #
    # Two photographic decisions are made here rather than in the archetypes, because
    # they are about the shape of THIS page and an archetype cannot know it:
    #   * the FIRST card section on the home page leads with pictures. Every card
    #     section doing so would be a stock-photo catalogue.
    #   * one full-width band is dropped in after the second section, which is where a
    #     long page starts to feel like a list.
    pl = _photos(spec)
    first_cards = next((s for s in sections if s.get("kind") == "cards"), None)
    pic_cards = first_cards if (first_cards is not None
                                and page["slug"] == "home" and pl) else None

    L = _layout(spec)
    band_at = 2 if (L["bands"] and pl.get("band") and page["slug"] == "home"
                    and len(sections) >= 3) else -1

    body, tone_i = [], 0
    for i, s in enumerate(sections):
        if i == band_at:
            body.append(_photoband(spec))
        if s.get("kind") == "cta":
            body.append(render_section(s, spec, "a"))
            continue
        # A copy, never the section itself — `sections` are the spec's own objects and
        # the spec is fingerprinted. Named `sect`, because `sec` is the header's
        # secondary CTA and reusing it here silently emptied the Give button.
        sect = dict(s, pictures=True) if s is pic_cards else s
        tone = ("b" if tone_i % 2 else "a") if L["tone"] else "a"
        body.append(render_section(sect, spec, tone))
        tone_i += 1
    body = "".join(body)

    # A client's site wears the client's mark. It used to carry Vision Outreach Media's
    # logo — the builder's, on somebody else's front door — with a grey dot as the only
    # alternative. `logo` is still honoured so an operator who has a real mark for this
    # business can pass one; nothing generated overrides something real.
    mark = (f'<img class="logo" src="{logo}" alt="">' if logo
            else visuals.mark(biz["name"], spec["archetype"]["id"]))
    title = (biz["name"] if page["slug"] == "home"
             else f'{page["title"]} · {biz["name"]}')
    desc = (page.get("purpose") or biz["offer_line"])[:180]

    sec_btn = ('<a class="btn sec sm" href="%s">%s</a>'
               % (e(_href(sec.get("href"))), e(sec.get("label"))) if sec else "")
    pri_btn = ('<a class="btn pri sm" href="%s">%s</a>'
               % (e(_href(pri.get("href"))), e(pri.get("label", "Contact"))))
    foot_nav = "".join('<a href="%s">%s</a>' % (e(n["href"]), e(n["title"]))
                       for n in site["nav"])
    store_key = "vom_platform_" + re.sub(r"[^a-z0-9]+", "_", biz["name"].lower())

    return (PAGE_TEMPLATE
            .replace("__TITLE__", e(title))
            .replace("__DESC__", e(desc))
            .replace("__ACCENT__", e((spec["brand"].get("kit") or {}).get("accent")
                                     or (spec["archetype"].get("forge") or {}).get("accent_site")
                                     or spec["brand"]["accent"]))
            .replace("__CSS__", css(spec) + visuals.full_css(spec["archetype"]["id"])
                     + photos.css() + layouts.css(_layout(spec)["id"]))
            .replace("__MARK__", mark)
            .replace("__PSTRIP__", _palette_strip(spec))
            .replace("__HUBBAR__", _hub_bar(spec))
            .replace("__HUBFOOT__", _hub_foot(spec))
            .replace("__ICON__", e(visuals.favicon(
                biz["name"],
                (spec["brand"].get("kit") or {}).get("accent") or spec["brand"]["accent"],
                (spec["brand"].get("kit") or {}).get("on_accent") or "#FFFFFF",
                spec["archetype"]["id"])))
            .replace("__NAME__", e(biz["name"]))
            .replace("__NAV__", nav)
            .replace("__SEC_BTN__", sec_btn)
            .replace("__PRI_BTN__", pri_btn)
            .replace("__HERO__", hero_html)
            .replace("__BODY__", body)
            .replace("__CITY__", e(biz.get("city", "")))
            .replace("__FOOTNAV__", foot_nav)
            .replace("__TAGLINE__", e(biz.get("offer_line", "")[:120]))
            .replace("__EMAIL__", e(biz.get("email", "")))
            .replace("__STORE_KEY__", store_key))


# The page shell. Kept as a plain template rather than an f-string so the embedded CSS and
# JavaScript read as themselves — braces in a stylesheet should not have to be escaped.
PAGE_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>__TITLE__</title>
<meta name="description" content="__DESC__">
<meta name="theme-color" content="__ACCENT__">
<link rel="icon" href="__ICON__">
<meta property="og:title" content="__TITLE__">
<meta property="og:description" content="__DESC__">
<meta property="og:type" content="website">
<style>__CSS__</style>
</head>
<body>
__HUBBAR__
<header class="site"><div class="wrap bar">
  <a class="brand" href="index.html">__MARK____NAME__</a>
  <nav class="main">__NAV__</nav>
  __SEC_BTN__
  __PRI_BTN__
</div></header>

<main>
__PSTRIP__
__HERO__
__BODY__
</main>

<footer class="site"><div class="wrap">
  <div class="cols">
    <div>
      <div class="fname">__NAME__</div>
      <div>__TAGLINE__</div>
    </div>
    <div>
      <div class="fh">Pages</div>
      <div class="flinks">__FOOTNAV____HUBFOOT__</div>
    </div>
    <div>
      <div class="fh">Get in touch</div>
      <div class="flinks"><a href="mailto:__EMAIL__">__EMAIL__</a><span>__CITY__</span></div>
    </div>
  </div>
  <div class="fine"><span>© <span data-year>2026</span> __NAME__</span><span>__CITY__</span></div>
</div></footer>

<script>
/* The site and the platform are one system. Feeds prefer the owner's live records over
   the ones baked in at build time, and a form posts straight into its module. Opened on
   its own, the page still works exactly as it was built. */
(function(){
  var KEY = "__STORE_KEY__";
  var DB = {};
  try { DB = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch(e) {}

  var yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();

  var MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  function chip(when, time){
    var m = /^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(String(when || "").trim());
    if (m) return '<div class="when"><span class="d">' + m[3] + '</span><span class="m">' +
                  MON[parseInt(m[2],10)-1] + '</span></div>';
    return '<div class="when plain">' + esc(when || time || "\\u2014") + '</div>';
  }

  document.querySelectorAll("[data-module]").forEach(function(el){
    var rows = DB[el.getAttribute("data-module")];
    if (!rows || !rows.length) return;
    var limit = el.querySelectorAll(".item").length || 5;
    el.innerHTML = rows.slice(0, limit).map(function(r){
      var keys = Object.keys(r);
      var what = r.title || r.name || r[keys[0]] || "";
      var sub  = r.note || r.summary || r.place || r.speaker || "";
      return '<div class="item">' + chip(r.date, r.time) + '<div>' +
             '<div class="what">' + esc(what) + '</div>' +
             (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '</div></div>';
    }).join("");
    el.setAttribute("data-live", "1");
  });

  document.querySelectorAll("form.capture").forEach(function(f){
    f.addEventListener("submit", function(ev){
      ev.preventDefault();
      var target = f.getAttribute("data-target"), rec = {};
      new FormData(f).forEach(function(v,k){ rec[k] = v; });
      rec.date = new Date().toISOString().slice(0,10);
      try {
        var db = JSON.parse(localStorage.getItem(KEY) || "{}");
        (db[target] = db[target] || []).unshift(rec);
        localStorage.setItem(KEY, JSON.stringify(db));
      } catch(e) {}
      var note = f.querySelector("[data-formnote]");
      if (note) note.innerHTML = "<strong>Thank you \\u2014 that has been received.</strong>";
      f.querySelectorAll("input,textarea,button").forEach(function(i){ i.disabled = true; });
    });
  });

  /* One choice per group, the way a person expects a set of chips to behave. */
  document.querySelectorAll(".chip[data-group]").forEach(function(c){
    c.addEventListener("click", function(){
      var g = c.getAttribute("data-group"), scope = c.closest(".give") || document;
      scope.querySelectorAll('.chip[data-group="' + g + '"]').forEach(function(o){
        o.setAttribute("aria-pressed", o === c ? "true" : "false");
      });
    });
  });

  var head = document.querySelector("header.site");
  function onScroll(){ head.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, {passive:true}); onScroll();

  function esc(s){ var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
})();
</script>
</body>
</html>
"""


def render_site(spec: dict, logo: str = "") -> dict:
    """Every page of the site, keyed by filename.

    An archetype may ask for a different *skin* — a second renderer over this same
    section vocabulary. The house skin above is right for a church and wrong for a
    software company, which is judged on whether the product looks alive. The dispatch
    is one line and the contract is unchanged: same spec in, same filenames out."""
    skin = spec["archetype"].get("skin")
    if skin == "hitech":
        import skin_hitech
        return skin_hitech.render_site(spec, logo)
    if skin and skin != "house":
        raise ValueError(f"unknown skin '{skin}' — an archetype may only ask for a skin "
                         "that has a renderer")
    return {p["path"]: render_page(p, spec, logo) for p in spec["site"]["pages"]}
