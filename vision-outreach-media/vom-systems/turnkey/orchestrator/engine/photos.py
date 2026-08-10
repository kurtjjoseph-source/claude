#!/usr/bin/env python3
"""
photos — the photographic layer of a generated site.

`visuals.py` draws; this one *places*. The drawings were the right call for a business
that does not exist yet, and they are still what carries the brand — but a page made only
of type, boxes and line art reads as a specification, not as a place somebody goes. People
recognise rooms, hands and objects before they read a word.

So a build now ships real photographs, and the two layers do different jobs:

    photography   the substrate — the first screen, the wide bands between sections,
                  the top of every card. What a visitor recognises.
    drawn art     the accent — the monogram, the section chips, the card icons, the
                  emblem in the closing band. What makes it *this* business.

## Where the pictures come from

`forge/photos/` — a pack built once by `forge/photos/fetch.py`, committed as files, and
read here with no network at all. Forge stays offline and unattended; a build that fetched
images would fail differently every time and would put somebody else's CDN in the path of
every launch.

Every image is **CC0 or Public Domain Mark** — free to modify, redistribute and use
commercially, with no attribution obligation. Provenance is copied into the build anyway
as `img/CREDITS.md`, because a business should be able to say where the picture on its own
front page came from.

## What a photo is, and is not

For the demo platforms this is simply what they should have looked like all along. For a
real client, a photograph of *a* church is not a photograph of *their* church, and the
build says so: `img/CREDITS.md` names every file as a placeholder and how to replace it,
and `provisioning.md` carries the swap as an owner task. An operator with the client's own
photographs drops them in the same folder under the same names and nothing else changes.

Stdlib only.
"""

from __future__ import annotations

import hashlib
import json
import os
import shutil

SCHEMA = 1

HERE = os.path.dirname(os.path.abspath(__file__))
# engine/ -> orchestrator/ -> turnkey/ -> turnkey/forge/photos
PACK = os.path.normpath(os.path.join(HERE, "..", "..", "forge", "photos"))
MANIFEST = os.path.join(PACK, "manifest.json")

# The roles a page fills, in the order the pack is dealt into them. `hero` is the first
# screen, `band` is the full-width picture between two sections, the rest are cards.
ROLES = ["hero", "band", "card1", "card2", "card3", "card4"]


def _seed(name: str) -> int:
    return int(hashlib.sha256((name or "b").encode("utf-8")).hexdigest()[:12], 16)


def load_pack() -> dict:
    try:
        with open(MANIFEST, encoding="utf-8") as f:
            return json.load(f).get("photos", {})
    except Exception:
        return {}


def available(archetype_id: str) -> bool:
    return len(pool_for(archetype_id)[0]) >= 2


# Where an archetype with no photographs of its own may borrow from — and only where the
# borrowing is honest. A desk and a laptop serve a consultant, a software team and a
# generic business equally well, so those three share one set.
#
# The archetypes NOT listed here (nonprofit, ecommerce, membership, prelaunch) borrow from
# nobody. Church interiors, classrooms and concert stages are not a charity, a pottery
# shop, a supper club or a coffee cart, and a page with no photograph is better than a
# page with the wrong one — which is the whole lesson of the first pack.
BORROWS = {
    "solo_business": "digital_products",
    "saas": "digital_products",
    "generic": "digital_products",
}


def pool_for(archetype_id: str, pack: dict = None) -> tuple:
    """(photographs, whose they are). Empty is a valid answer."""
    pack = pack if pack is not None else load_pack()
    own = pack.get(archetype_id) or []
    if own:
        return own, archetype_id
    lend = BORROWS.get(archetype_id)
    if lend and pack.get(lend):
        return pack[lend], lend
    return [], ""


def pool_archetype(archetype_id: str, org_type: str = "") -> str:
    """Whose photographs a build should deal from.

    Normally the archetype's own. The exception is `prelaunch`: its pool is six coffee
    shops — a mood for a generic waitlist, and wrong as the illustration of an
    invoice-chasing service. Worse, a batch of funnels built from one six-photo set reads
    as one company. A funnel is a page about a *business*, so it borrows the pictures that
    business's own site will use, and keeps the coffee shops only when its org type has
    no photographs at all.

    This lives here, not in a caller, because there are two callers — `forge.st_site`
    copies the files and `site_gen` writes the tags that reference them. They must agree,
    and before this they agreed only by both being wrong."""
    if archetype_id == "prelaunch" and org_type:
        try:
            import archetypes
            own = archetypes.ORG_TYPE_MAP.get(org_type, "")
        except Exception:
            own = ""
        if own and available(own):
            return own
    return archetype_id


def plan(archetype_id: str, business: str) -> dict:
    """Which photograph plays which role on this business's site.

    Dealt from the archetype's set at an offset taken from the business name, so two
    churches built from the same six photographs do not open with the same one, and a
    rebuild of the same church never reshuffles."""
    pool, owner = pool_for(archetype_id)
    if not pool:
        return {}
    off = _seed(business) % len(pool)
    out = {}
    for i, role in enumerate(ROLES):
        p = pool[(off + i) % len(pool)]
        out[role] = {
            "src": p["file"], "thumb": p.get("thumb", ""),
            "w": p.get("w"), "h": p.get("h"),
            "dominant": p.get("dominant", "#888888"),
            "license": p.get("license", ""), "title": p.get("title", ""),
            "creator": p.get("creator", ""), "source_page": p.get("source_page", ""),
        }
    return out


def install(pl: dict, site_dir: str, business: str = "", archetype_label: str = "") -> dict:
    """Copy the chosen photographs into the built site as `img/<role>.jpg`.

    Named by ROLE, not by source, which is what makes them swappable: an operator with the
    client's own photographs overwrites `img/hero.jpg` and the site is theirs, with no
    rebuild and nothing else to change."""
    if not pl:
        return {"count": 0}
    img = os.path.join(site_dir, "img")
    os.makedirs(img, exist_ok=True)
    n = 0
    for role, p in pl.items():
        src = os.path.join(PACK, p["src"])
        if not os.path.exists(src):
            continue
        shutil.copy2(src, os.path.join(img, role + ".jpg"))
        n += 1
    with open(os.path.join(img, "CREDITS.md"), "w", encoding="utf-8") as f:
        f.write(credits_md(pl, business, archetype_label))
    return {"count": n, "dir": img}


def credits_md(pl: dict, business: str = "", archetype_label: str = "") -> str:
    L = [f"# Photography — {business or 'this site'}", ""]
    if archetype_label:
        L.append(f"Placeholder photography for a {archetype_label.lower()}.")
        L.append("")
    L += [
        "**These are placeholders.** They are real photographs, licensed for commercial",
        "use, but they are not photographs of this business. Replace them with your own",
        "and the site is yours — overwrite the file, keep the name, change nothing else.",
        "",
        "| File | Where it appears | Licence | Title | Source |",
        "|---|---|---|---|---|",
    ]
    where = {"hero": "the first screen", "band": "the full-width band",
             "card1": "first card", "card2": "second card",
             "card3": "third card", "card4": "fourth card"}
    for role in ROLES:
        p = pl.get(role)
        if not p:
            continue
        L.append("| `img/%s.jpg` | %s | %s | %s | [source](%s) |" % (
            role, where.get(role, role), (p.get("license") or "—").upper(),
            (p.get("title") or "—")[:44], p.get("source_page", "")))
    L += ["", "CC0 and Public Domain Mark impose no attribution requirement. The sources",
          "are recorded so the origin of every image on this site is answerable.", ""]
    return "\n".join(L)


# ===========================================================================
# markup
# ===========================================================================

def _e(s) -> str:
    return (str(s if s is not None else "").replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def img_tag(role: str, alt: str = "", cls: str = "", *, eager: bool = False,
            w: int = 1600, h: int = 1066) -> str:
    """One `<img>`, with the things that stop a photograph from wrecking a page:
    explicit `width`/`height` so nothing reflows when it lands, `loading`/`decoding` so
    the ones below the fold do not block the first screen, and an empty `alt` when the
    image is decoration — a screen reader announcing "hero.jpg" helps nobody.

    Deliberately NO `sizes`. It is meaningless without a `srcset`, and carrying one was
    the difference between the band photograph (which painted) and the card photographs
    (which measured correctly and painted nothing)."""
    lazy = "" if eager else 'loading="lazy" '
    return (f'<img class="{cls}" src="img/{role}.jpg" alt="{_e(alt)}" '
            f'width="{int(w)}" height="{int(h)}" {lazy}decoding="async">')


def css() -> str:
    """The photographic rules. Colours are tokens, so the scrims follow the brand kit."""
    return """
  /* ------------------------------------------------------------ photography
     Photographs are the substrate; the drawn art is the accent on top of them. Every
     scrim below is mixed from the kit's own ground, so a photo never introduces a colour
     the brand does not have. */
  .ph{display:block;width:100%;height:100%;object-fit:cover}

  /* the first screen — full bleed, with the type on the picture */
  .hero.photo{min-height:clamp(520px,68vh,720px);color:var(--on-shot);
    background:var(--shot-bg)}
  .hero.photo .shot{position:absolute;inset:0;z-index:0;overflow:hidden}
  .hero.photo .shot img{width:100%;height:100%;object-fit:cover}
  /* Two scrims, not one: a horizontal wash so the reading column has a ground, and a
     vertical one so the header and the bottom edge never sit on a bright patch. */
  .hero.photo .shot::after{content:"";position:absolute;inset:0;
    background:
      linear-gradient(90deg,var(--shot-bg) 0%,
        color-mix(in srgb,var(--shot-bg) 82%,transparent) 38%,
        color-mix(in srgb,var(--shot-bg) 30%,transparent) 66%,
        color-mix(in srgb,var(--shot-bg) 12%,transparent) 100%),
      linear-gradient(180deg,color-mix(in srgb,var(--shot-bg) 55%,transparent) 0%,
        transparent 26%,transparent 68%,
        color-mix(in srgb,var(--shot-bg) 45%,transparent) 100%)}
  @media(max-width:900px){
    .hero.photo .shot::after{background:
      linear-gradient(180deg,color-mix(in srgb,var(--shot-bg) 62%,transparent) 0%,
        color-mix(in srgb,var(--shot-bg) 78%,transparent) 48%,var(--shot-bg) 92%)}
  }
  .hero.photo .wrap{position:relative;z-index:2}
  .hero.photo h1{color:var(--on-shot)}
  .hero.photo .lede{color:color-mix(in srgb,var(--on-shot) 82%,transparent)}
  .hero.photo .eyebrow{color:var(--on-shot)}
  .hero.photo .eyebrow::before{background:var(--on-shot)}
  /* the drawn emblem stays, small, as the signature in the corner of the photograph */
  .hero.photo .emblem{position:absolute;right:-2%;bottom:-14%;width:min(360px,34vw);
    z-index:1;opacity:.22;pointer-events:none;
    --accent:var(--on-shot);--ink:var(--on-shot);--paper:transparent;
    --line:color-mix(in srgb,var(--on-shot) 22%,transparent)}
  @media(max-width:900px){.hero.photo .emblem{display:none}}

  /* The facts panel keeps its own paper — and its own INK. The hero sets a white text
     colour for the type on the photograph, and the panel is a sheet of paper lying on
     top of it: inheriting that white made every value invisible. */
  .hero.photo .panel{color:var(--ink);
    box-shadow:0 24px 60px rgba(0,0,0,.28),var(--shadow-2)}
  .hero.photo .hero-side{padding-bottom:0}

  /* the full-width band between two sections */
  .photoband{position:relative;margin:0;overflow:hidden;
    height:clamp(240px,32vw,420px);background:var(--sunk)}
  .photoband img{width:100%;height:100%;object-fit:cover}
  .photoband .cap{position:absolute;left:0;right:0;bottom:0;
    padding:clamp(20px,4vw,44px) 24px;color:#fff;
    background:linear-gradient(0deg,rgba(0,0,0,.62),transparent)}
  .photoband .cap .wrap{padding:0}
  .photoband .cap p{margin:0;max-width:54ch;font-size:clamp(1rem,2vw,1.3rem);
    font-family:var(--display);line-height:1.25;text-wrap:balance}

  /* cards lead with a picture, in the reference's proportion */
  .card.haspic{padding:0;overflow:hidden;display:flex;flex-direction:column}
  /* The ratio is held by padding, not `aspect-ratio`, and the image fills the box
     absolutely. `aspect-ratio` + `height:100%` on a replaced child inside a flex column
     resolved to a box the image never painted into — the element measured correctly and
     showed nothing, which is the worst kind of wrong. */
  .card .pic{position:relative;height:0;padding-top:37.7%;background:var(--sunk);
    flex:none;overflow:hidden}
  .card .pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
    transition:transform .5s cubic-bezier(.2,.7,.3,1)}
  .card.haspic:hover .pic img{transform:scale(1.04)}
  .card .pic::after{content:"";position:absolute;inset:auto 0 0 0;height:3px;
    background:var(--accent);opacity:.9}
  .card.haspic .body{padding:var(--s4, 20px) 20px 22px}
  .card.haspic .ic{margin-bottom:8px}

  /* the brand's five published colours, full width, under the header — the reference
     portfolio's one device that tells you whose page this is before anything renders */
  .pstrip{display:flex;height:6px;width:100%}
  .pstrip i{flex:1}

  @media print{ .hero.photo .shot,.photoband{display:none} }
"""
