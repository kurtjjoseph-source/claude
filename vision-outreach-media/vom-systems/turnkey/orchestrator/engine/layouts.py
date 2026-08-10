#!/usr/bin/env python3
"""
layouts — the page designs an archetype can be built in.

Ten archetypes were shipping one page. They differed in accent, in typeface and in what
the words said, and that is real differentiation — but the *shape* was identical: the same
split hero, the same three-up card grid, the same alternating grounds. Put two of them side
by side and they are the same website twice.

A LAYOUT is the missing axis. Like the type preset and the brand kit, it is **data an
archetype selects**, not a code path it owns:

    layout   the shape of the page      — hero form, card form, rhythm, measure
    kit      the colour and the type    — brand_kits.py
    preset   the typographic stance     — site_gen.TYPE_PRESETS
    content  what it says               — archetypes.py

Five house layouts, each a real design decision rather than a spacing tweak:

    classic     type beside a facts panel over a photograph; three-up cards; grounds
                that alternate with a drawn edge. The original, and still right for an
                institution that wants to look settled.
    editorial   centred masthead, full-bleed photograph, the facts as a strip beneath it;
                cards become alternating picture/text rows. Reads like a long article.
    poster      no photograph behind the type at all — an oversized name on paper with a
                tall picture column running off the right edge; two big feature cards.
                For places where the name on the door does the selling.
    gallery     a mosaic of pictures first, words second; four-up masonry with captions.
                For work that is looked at before it is read.
    compact     a short picture strip, the facts as a table beside it, and cards as a list
                with thumbnails. Dense and utilitarian — for a page that is used, not
                browsed.

`hitech` remains a separate renderer (`skin_hitech.py`) rather than a layout, because it
replaces the section vocabulary as well as the shape.

Everything here is tokens and layout. No layout may introduce a colour — the brand kit is
still the only place a colour is decided, which is what keeps five shapes from becoming
five design systems.

Stdlib only.
"""

from __future__ import annotations

SCHEMA = 1

# ---------------------------------------------------------------------------
# the layouts
# ---------------------------------------------------------------------------
#
#   hero     which first screen is rendered  (site_gen._hero_<shape>)
#   cards    how a `cards` section is drawn  (site_gen._cards_<style>)
#   wrap     the measure — a gallery wants air, a directory wants density
#   header   split | centred
#   bands    whether full-width photo bands are dropped between sections
#   edges    whether alternating grounds get the drawn wave edge
#   tone     whether grounds alternate at all

LAYOUTS = {
    "classic": {
        "id": "classic", "label": "Classic",
        "note": "Type beside a facts panel, over a photograph. Three-up cards, "
                "alternating grounds with a drawn edge.",
        "hero": "split", "cards": "grid", "wrap": "1140px",
        "header": "split", "bands": True, "edges": True, "tone": True,
    },
    "editorial": {
        "id": "editorial", "label": "Editorial",
        "note": "Centred masthead over a full-bleed photograph, facts as a strip "
                "beneath. Cards become alternating picture/text rows.",
        "hero": "full", "cards": "rows", "wrap": "1080px",
        "header": "centred", "bands": True, "edges": False, "tone": False,
    },
    "poster": {
        "id": "poster", "label": "Poster",
        "note": "An oversized name on paper with a tall picture column off the right "
                "edge. Two large feature cards.",
        "hero": "poster", "cards": "feature", "wrap": "1240px",
        "header": "split", "bands": True, "edges": False, "tone": True,
    },
    "gallery": {
        "id": "gallery", "label": "Gallery",
        "note": "A mosaic of pictures first and words second. Four-up masonry with "
                "captions, and a lot of air.",
        "hero": "mosaic", "cards": "mosaic", "wrap": "1320px",
        "header": "centred", "bands": False, "edges": False, "tone": False,
    },
    "compact": {
        "id": "compact", "label": "Compact",
        "note": "A short picture strip with the facts as a table beside it, and cards "
                "as a list with thumbnails. Dense, for a page that is used.",
        "hero": "strip", "cards": "list", "wrap": "1040px",
        "header": "split", "bands": False, "edges": False, "tone": True,
    },
}

DEFAULT = "classic"

# Which layout each archetype is built in. Chosen so that no two archetypes a person is
# likely to see side by side share a shape — the showcase is the test.
ARCHETYPE_LAYOUT = {
    "church": "classic",
    "nonprofit": "editorial",
    "solo_business": "gallery",
    "ecommerce": "poster",
    "digital_products": "compact",
    "membership": "editorial",
    "education": "classic",
    "local_venue": "poster",
    "saas": "classic",          # unused — saas renders through skin_hitech
    "prelaunch": "compact",
    "generic": "classic",
}


def for_archetype(archetype_id: str) -> dict:
    return LAYOUTS.get(ARCHETYPE_LAYOUT.get(archetype_id, DEFAULT), LAYOUTS[DEFAULT])


def get(layout_id: str) -> dict:
    return LAYOUTS.get(layout_id or "", LAYOUTS[DEFAULT])


# ---------------------------------------------------------------------------
# the stylesheet each layout adds
# ---------------------------------------------------------------------------

_COMMON = """
  /* ------------------------------------------------------------- layouts */
  /* A layout may change measure, rhythm and the shape of a block. It may not
     introduce a colour — every value below is a kit token. */
"""

_HEADER_CENTRED = """
  header.site .bar{flex-direction:column;gap:10px;min-height:0;padding:16px 0 12px}
  header.site .brand{margin-right:0}
  header.site nav.main{justify-content:center}
  header.site .btn.sm{display:none}
  header.site.is-scrolled .bar{min-height:0;padding:9px 0 7px}
  @media(max-width:720px){header.site nav.main{gap:0;font-size:.86rem}}
"""

CSS = {

    # ---------------------------------------------------------------- classic
    "classic": "",

    # -------------------------------------------------------------- editorial
    "editorial": _HEADER_CENTRED + """
  /* The first screen is the photograph, full bleed, with the type centred on it and
     the facts pushed out underneath as a horizontal strip rather than a floating card. */
  .hero.ly-editorial{min-height:clamp(460px,60vh,660px);text-align:center;
    display:flex;align-items:center}
  .hero.ly-editorial > .wrap{width:100%}
  .hero.ly-editorial .emblem{display:none}
  .hero.ly-editorial .hero-grid{grid-template-columns:minmax(0,1fr);justify-items:center}
  .hero.ly-editorial .lede{margin-left:auto;margin-right:auto;max-width:52ch}
  .hero.ly-editorial .actions{justify-content:center}
  .hero.ly-editorial .eyebrow::before{display:none}
  .hero.ly-editorial .shot::after{background:
    linear-gradient(180deg,color-mix(in srgb,var(--shot-bg) 72%,transparent) 0%,
      color-mix(in srgb,var(--shot-bg) 46%,transparent) 42%,
      color-mix(in srgb,var(--shot-bg) 78%,transparent) 100%)}
  .factstrip{background:var(--card);border-bottom:1px solid var(--line)}
  .factstrip .wrap{display:grid;gap:0;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}
  .factstrip .f{padding:20px 22px;border-right:1px solid var(--line-soft)}
  .factstrip .f:last-child{border-right:0}
  .factstrip .k{font-family:var(--mono);font-size:10.5px;letter-spacing:.14em;
    text-transform:uppercase;color:var(--faint);font-weight:700;margin-bottom:5px}
  .factstrip .v{font-weight:650;font-size:1rem;line-height:1.3}
  @media(max-width:720px){.factstrip .f{border-right:0;border-bottom:1px solid var(--line-soft)}}

  /* Cards stop being a grid and become article rows: picture one side, words the
     other, flipping each time. */
  .rows{display:grid;gap:clamp(30px,5vw,64px)}
  .rows .row{display:grid;gap:clamp(20px,4vw,48px);align-items:center;
    grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
  .rows .row:nth-child(even) .rpic{order:2}
  .rows .rpic{position:relative;height:0;padding-top:66%;overflow:hidden;
    border-radius:var(--radius);background:var(--sunk);box-shadow:var(--shadow-1)}
  .rows .rpic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .rows .rtext h3{font-size:clamp(1.3rem,2.4vw,1.75rem);margin-bottom:.4em}
  .rows .rtext p{color:var(--muted);max-width:46ch;margin:0}
  .rows .rtext .ic{width:24px;height:24px;color:var(--accent);margin-bottom:12px;display:block}
  .rows .row.nopic{grid-template-columns:minmax(0,1fr);max-width:64ch}
  @media(max-width:800px){
    .rows .row{grid-template-columns:minmax(0,1fr)}
    .rows .row:nth-child(even) .rpic{order:0}
  }
  /* no alternating grounds — a hairline is the only separator */
  .block.tone-b{background:none}
  .block + .block{border-top:1px solid var(--line-soft)}
""",

    # ----------------------------------------------------------------- poster
    "poster": """
  /* No photograph behind the type. The name is the poster; the picture is a tall
     column that runs off the right edge of the viewport. */
  .hero.ly-poster{min-height:clamp(520px,72vh,760px);overflow:hidden;
    display:flex;align-items:center}
  .hero.ly-poster > .wrap{width:100%}
  .hero.ly-poster .emblem{right:auto;left:-8%;top:auto;bottom:-22%;transform:none;
    width:min(520px,40vw);opacity:.28}
  .hero.ly-poster .hero-grid{grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);
    align-items:stretch}
  .hero.ly-poster h1{font-size:clamp(3rem,8.5vw,6.5rem);line-height:.94;
    letter-spacing:-.035em;margin-bottom:.28em}
  .hero.ly-poster .lede{max-width:40ch}
  .hero.ly-poster .postercol{position:relative;min-height:clamp(360px,52vh,600px);
    margin-right:calc(50% - 50vw);border-radius:var(--radius-lg) 0 0 var(--radius-lg);
    overflow:hidden;background:var(--sunk);box-shadow:var(--shadow-2)}
  .hero.ly-poster .postercol img{position:absolute;inset:0;width:100%;height:100%;
    object-fit:cover}
  .hero.ly-poster .postercol .rail{position:absolute;left:0;right:0;bottom:0;
    background:linear-gradient(0deg,rgba(0,0,0,.68),transparent);color:#fff;
    padding:22px 24px;display:grid;gap:9px}
  .hero.ly-poster .postercol .rr{display:flex;gap:12px;align-items:baseline;
    font-size:13.5px;border-bottom:1px solid rgba(255,255,255,.18);padding-bottom:7px}
  .hero.ly-poster .postercol .rr:last-child{border-bottom:0;padding-bottom:0}
  .hero.ly-poster .postercol .rr b{margin-left:auto;font-weight:650;text-align:right}
  @media(max-width:860px){
    .hero.ly-poster .hero-grid{grid-template-columns:minmax(0,1fr)}
    .hero.ly-poster .postercol{margin-right:0;border-radius:var(--radius-lg);
      height:clamp(240px,40vh,340px)}
  }

  /* Two large cards, the picture filling the top half of each. */
  .feature{display:grid;gap:clamp(18px,3vw,30px);
    grid-template-columns:repeat(auto-fit,minmax(320px,1fr))}
  .feature .fcard{position:relative;border-radius:var(--radius-lg);overflow:hidden;
    background:var(--card);border:1px solid var(--line);box-shadow:var(--shadow-1);
    display:flex;flex-direction:column;transition:transform .2s,box-shadow .25s}
  .feature .fcard:hover{transform:translateY(-3px);box-shadow:var(--shadow-2)}
  .feature .fpic{position:relative;height:0;padding-top:58%;background:var(--sunk);
    overflow:hidden;flex:none}
  .feature .fpic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .feature .fbody{padding:clamp(20px,3vw,30px)}
  .feature .fbody .ic{width:24px;height:24px;color:var(--accent);margin-bottom:12px;
    display:block}
  .feature .fbody h3{font-size:clamp(1.15rem,2vw,1.5rem);margin-bottom:.4em}
  .feature .fbody p{color:var(--muted);margin:0}
  .photoband{height:clamp(300px,40vw,520px)}
""",

    # ---------------------------------------------------------------- gallery
    "gallery": _HEADER_CENTRED + """
  /* Pictures first, words second: a mosaic across the top, the type underneath it. */
  .hero.ly-gallery{padding-top:0;min-height:0;display:block}
  .hero.ly-gallery .emblem{display:none}
  .mosaic{display:grid;gap:6px;grid-template-columns:2fr 1fr;
    height:clamp(300px,46vh,520px);margin-bottom:clamp(30px,5vw,58px)}
  .mosaic .m{position:relative;overflow:hidden;background:var(--sunk)}
  .mosaic .m img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
    transition:transform .7s cubic-bezier(.2,.7,.3,1)}
  .mosaic:hover .m img{transform:scale(1.03)}
  .mosaic .side{display:grid;grid-template-rows:1fr 1fr;gap:6px}
  @media(max-width:760px){.mosaic{grid-template-columns:1fr;height:auto}
    .mosaic .m{height:210px}.mosaic .side{grid-template-rows:none;grid-auto-flow:column}}
  .hero.ly-gallery .hero-grid{grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);
    align-items:end;padding-bottom:clamp(30px,5vw,58px);text-align:left}
  .hero.ly-gallery h1{font-size:clamp(2.6rem,6vw,4.6rem)}
  .hero.ly-gallery .panel{background:none;border:0;box-shadow:none}
  .hero.ly-gallery .panel .panel-h{display:none}
  .hero.ly-gallery .panel .panel-b{padding:0}
  .hero.ly-gallery .prow{border-bottom:1px solid var(--line);padding:11px 0}
  @media(max-width:860px){.hero.ly-gallery .hero-grid{grid-template-columns:minmax(0,1fr)}}

  /* masonry-ish: four columns of pictures with the words under each */
  .mgrid{columns:4 240px;column-gap:18px}
  .mgrid .mcard{break-inside:avoid;margin:0 0 18px;background:var(--card);
    border:1px solid var(--line);border-radius:var(--radius);overflow:hidden}
  .mgrid .mpic{position:relative;height:0;background:var(--sunk);overflow:hidden}
  .mgrid .mcard:nth-child(3n+1) .mpic{padding-top:118%}
  .mgrid .mcard:nth-child(3n+2) .mpic{padding-top:74%}
  .mgrid .mcard:nth-child(3n)   .mpic{padding-top:96%}
  .mgrid .mpic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .mgrid .mbody{padding:16px 18px 20px}
  .mgrid .mbody .ic{width:20px;height:20px;color:var(--accent);margin-bottom:8px;display:block}
  .mgrid h3{font-size:1.02rem;margin-bottom:.35em}
  .mgrid p{color:var(--muted);font-size:.9rem;margin:0}
  .block.tone-b{background:none}
  section.block{padding-top:clamp(44px,7vw,96px);padding-bottom:clamp(44px,7vw,96px)}
""",

    # ---------------------------------------------------------------- compact
    "compact": """
  /* A short strip of picture, the facts as a table beside it. Nothing floats. */
  .hero.ly-compact{min-height:0;padding:0;display:block}
  .hero.ly-compact .emblem{display:none}
  .hero.ly-compact .hero-grid{grid-template-columns:minmax(0,1fr) minmax(0,.86fr);
    gap:0;align-items:stretch}
  .hero.ly-compact .htext{padding:clamp(34px,5vw,64px) 0 clamp(30px,4vw,52px);
    padding-right:clamp(20px,3vw,44px);display:flex;flex-direction:column;
    justify-content:center}
  .hero.ly-compact h1{font-size:clamp(2rem,4.2vw,3rem)}
  .hero.ly-compact .lede{max-width:44ch;margin-bottom:20px}
  .hero.ly-compact .strip{position:relative;overflow:hidden;background:var(--sunk);
    min-height:clamp(240px,32vw,380px);margin-right:calc(50% - 50vw)}
  .hero.ly-compact .strip img{position:absolute;inset:0;width:100%;height:100%;
    object-fit:cover}
  .hero.ly-compact .facttable{border-top:1px solid var(--line);margin-top:auto}
  .hero.ly-compact .facttable .fr{display:flex;gap:14px;align-items:baseline;
    padding:9px 0;border-bottom:1px solid var(--line-soft);font-size:14px}
  .hero.ly-compact .facttable .fr:last-child{border-bottom:0}
  .hero.ly-compact .facttable .fr span{color:var(--muted)}
  .hero.ly-compact .facttable .fr b{margin-left:auto;font-weight:650;text-align:right}
  @media(max-width:820px){
    .hero.ly-compact .hero-grid{grid-template-columns:minmax(0,1fr)}
    .hero.ly-compact .strip{margin-right:0;min-height:200px;order:-1}
    .hero.ly-compact .htext{padding-right:0}
  }

  /* cards as rows in a list, with a thumbnail */
  .clist{display:grid;gap:2px;border:1px solid var(--line);border-radius:var(--radius);
    overflow:hidden;background:var(--line-soft)}
  .clist .li{display:grid;grid-template-columns:112px minmax(0,1fr);gap:18px;
    background:var(--card);padding:16px 18px;align-items:center;
    transition:background .18s}
  .clist .li:hover{background:var(--sunk)}
  .clist .lpic{position:relative;height:0;padding-top:70%;border-radius:var(--radius-sm);
    overflow:hidden;background:var(--sunk)}
  .clist .lpic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .clist .lbody h3{margin-bottom:.24em;font-size:1.02rem;display:flex;gap:9px;
    align-items:center}
  .clist .lbody h3 .ic{width:17px;height:17px;color:var(--accent);flex:none}
  .clist .lbody p{margin:0;color:var(--muted);font-size:.9rem}
  .clist .li.nopic{grid-template-columns:minmax(0,1fr)}
  @media(max-width:620px){.clist .li{grid-template-columns:74px minmax(0,1fr);gap:13px}}
  section.block{padding-top:clamp(34px,5vw,68px);padding-bottom:clamp(34px,5vw,68px)}
""",
}


def css(layout_id: str) -> str:
    L = get(layout_id)
    out = _COMMON + f"  :root{{--wrap:{L['wrap']}}}\n" + CSS.get(L["id"], "")
    if not L["tone"]:
        # A layout that does not alternate grounds must also drop the drawn edge, or the
        # page grows two waves across a ground that never changes.
        out += "\n  .wave{display:none}\n"
    elif not L["edges"]:
        out += "\n  .wave{display:none}\n"
    return out


if __name__ == "__main__":
    for lid, L in LAYOUTS.items():
        users = [a for a, x in ARCHETYPE_LAYOUT.items() if x == lid]
        print(f"{lid:11} hero={L['hero']:8} cards={L['cards']:8} wrap={L['wrap']:7} "
              f"header={L['header']:8} -> {', '.join(users)}")
        print(f"            {L['note']}")
