#!/usr/bin/env python3
"""
photos/fetch.py — build the photo pack the generated sites ship with.

This is a **tool**, not part of a build. It runs on somebody's laptop, with a network,
once in a while; Forge itself stays stdlib-only, offline and unattended, and reads the
files this leaves behind. Keeping the two apart is the point: a build that fetched images
would fail differently every time and would put a third party in the path of every launch.

## Licensing is the whole design constraint

These photographs are redistributed inside client websites, so "free to look at" is not
good enough — it has to be free to *ship*. So the pack is **CC0 and Public Domain Mark
only**, sourced through the Openverse API, which is the one index that lets you filter on
exactly that. CC0 is a dedication to the public domain: commercial use, modification and
redistribution are all permitted and no attribution is required.

Attribution is recorded anyway, in `manifest.json` and `CREDITS.md`, because a business
that cannot say where an image on its own front page came from has a problem the licence
does not solve.

## What it produces

    photos/<archetype>/<n>.jpg        1600px wide, quality 78, stripped of metadata
    photos/<archetype>/<n>.thumb.jpg  32px wide — the blurred placeholder that shows
                                      while the real one loads
    photos/manifest.json              per file: source page, licence, title, creator,
                                      dominant colour, and the archetype it serves
    photos/CREDITS.md                 the same, for a person

Usage:
    python3 fetch.py              # fill any archetype that is short of photos
    python3 fetch.py --only church --force
    python3 fetch.py --report     # what is in the pack now, no network
"""

from __future__ import annotations

import argparse
import io
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
MANIFEST = os.path.join(HERE, "manifest.json")
CREDITS = os.path.join(HERE, "CREDITS.md")

API = "https://api.openverse.org/v1/images/"
TOKEN_URL = "https://api.openverse.org/v1/auth_tokens/token/"
UA = "vom-turnkey-photo-pack/1 (+https://visionoutreachmedia.nl)"

# Anonymous callers get a handful of requests an hour and then a 429 behind a Cloudflare
# challenge — not enough to fill a pack, and not something to work around. A registered
# key raises the limit by orders of magnitude.
#
# The key is REGISTERED BY A PERSON, not by this script: the register endpoint takes an
# email address and mails a verification link to it, which makes it credential creation
# in somebody's name. This reads what they registered; it never registers.
#
#   curl -X POST https://api.openverse.org/v1/auth_tokens/register/ \
#     -H "Content-Type: application/json" \
#     -d '{"name":"...","description":"...","email":"..."}'
#
# Then either export OPENVERSE_CLIENT_ID / OPENVERSE_CLIENT_SECRET, or drop them in
# photos/openverse-auth.json as {"client_id": "...", "client_secret": "..."}.
AUTH_FILE = os.path.join(HERE, "openverse-auth.json")
_TOKEN = {"value": "", "until": 0.0}

# Licences whose terms permit shipping the file inside a client's website with no
# attribution obligation. Nothing else is downloaded, ever.
OK_LICENCES = {"cc0", "pdm"}

# The public-domain pool is dominated by museum and archive collections, and the first
# pack proved it: "volunteers helping" returned a Soviet-Afghan War collage, "long dinner
# table" a 1920s railway luncheon, "pottery ceramics" six museum catalogue objects on
# white. The queries were fine. The *sources* were not.
#
# These three hold modern, in-use photography under CC0. Wikimedia and the museum feeds
# are excluded outright — they are magnificent and completely wrong for a shop's home page.
SOURCES = "flickr,rawpixel,wordpress"

# Titles that give an archive away before the file is even fetched.
REJECT_TITLE = re.compile(
    # `File:` was here and had to come out: it is Wikimedia's naming convention, not a
    # signal about the picture. It threw away good modern colour photographs — the colour
    # gate is what actually separates a photograph from a scan.
    r"""<div\s|RP-[PF]-|Image\ from\ page|\b1[0-9]{3}\b|\b20[01][0-9]\b
        |engraving|lithograph|etching|woodcut|daguerreo|\bplate\b|\bprint\b
        |collage|manuscript|\bmap\b|coat\ of\ arms|portrait\ of|\bfl\.|circa|\bca\.
        |museum|collection\ of|archive|herbarium|specimen

        # Subject drift, not format. The rules above catch scans and engravings; these
        # catch pictures that are modern, colour, correctly licensed and still completely
        # wrong. Public-domain feeds are full of government, military and museum imagery
        # because that is what ends up in the public domain — "team meeting" returned a
        # sergeant major addressing marines, "designer working" returned museum textiles.
        |marine|sergeant|\bcorps\b|\barmy\b|\bnavy\b|soldier|regiment|majesty
        |admiral|veteran|\btroops?\b|militar
        |secretary\ |president|minister|ambassador|senator|governor|capitol
        |delivers\ remarks|first\ lady|white\ house|\bmayor\b|official\ visit
        |rugby|\bplayers\b|coin\ toss|athlet|tournament|championship
        |depicting|\bveil\b|\bweft\b|metal\ work|textile|ornament|\bvessel\b
        |watercolor|watercolour|illustration|painting|\bsketch\b

        # A third round of drift, all of it visible only by reading the titles: US
        # government agency photography (CBP, OCS, "field operations", "public works"),
        # more museum furniture, and paintings whose titles name the painter rather than
        # saying "painting". Each of these is a real thing that reached the pack.
        |\bCBP\b|\bOCS\b|officer\ candidate|field\ operations|public\ works
        |development\ center|hua-li|Carisbrooke|Pullman|Majern
        |\bboard\ the\b|\bone\ of\ the\ \d""",
    re.I | re.X)


def _usable_title(t: str) -> bool:
    """A photograph with no title cannot be judged, and three untitled ones reached the
    last pack. If nobody can say what it is a picture of, it does not ship."""
    return bool((t or "").strip()) and not REJECT_TITLE.search(t)

WANT_PER_ARCHETYPE = 6
# CC0 stock photography is mostly 1024–1300px wide. A 1400px floor rejected almost the
# entire pool — 23 photos out of 66 survived, and every single loss was this number, not
# the colour or archive gates. The hero is the only place width really matters and 1200px
# covers it at 1x; nothing here is ever enlarged, only reduced.
MIN_WIDTH = 1000
OUT_WIDTH = 1400

# What each kind of business should look like. Several queries per archetype so the set
# has some variety and one bad query cannot empty a category.
QUERIES = {
    "church": ["church interior", "church congregation", "chapel interior",
               "church pews", "cathedral nave", "church service people"],
    "solo_business": ["graphic designer desk", "person working laptop home",
                      "freelancer working", "creative workspace person",
                      "woman working laptop", "man working desk"],
    "nonprofit": ["volunteers food bank", "community volunteers working",
                  "charity volunteers", "sorting donations", "volunteer group people",
                  "community kitchen"],
    "ecommerce": ["pottery making hands", "ceramic studio", "craft workshop hands",
                  "handmade products", "potter wheel", "artisan working clay"],
    "digital_products": ["laptop desk", "workspace computer", "office desk",
                         "notebook laptop", "woman laptop working", "desk setup"],
    "membership": ["friends dinner table", "people dining restaurant",
                   "shared meal table", "restaurant interior diners",
                   "group eating together", "dinner table food"],
    "education": ["classroom students", "students learning", "teacher classroom",
                  "lecture hall", "workshop class", "studying together"],
    "local_venue": ["concert audience", "live band stage", "music venue crowd",
                    "concert hall interior", "band performing", "stage lights concert"],
    "saas": ["office team working", "colleagues computer", "coworking office",
             "people laptop meeting", "restaurant staff", "cafe staff"],
    "prelaunch": ["coffee shop interior", "barista making coffee", "cafe counter",
                  "coffee cup table", "espresso machine cafe", "coffee shop people"],
    "generic": ["office workspace", "small shop interior", "team working office",
                "storefront shop", "business meeting people", "workshop hands"],
}



def _credentials() -> tuple:
    cid = os.environ.get("OPENVERSE_CLIENT_ID", "").strip()
    sec = os.environ.get("OPENVERSE_CLIENT_SECRET", "").strip()
    if cid and sec:
        return cid, sec
    try:
        with open(AUTH_FILE, encoding="utf-8") as f:
            d = json.load(f)
        return (d.get("client_id") or "").strip(), (d.get("client_secret") or "").strip()
    except Exception:
        return "", ""


def _token() -> str:
    """A bearer token, cached until shortly before it expires. Empty string means run
    anonymously — which works, slowly, until the rate limiter says otherwise."""
    if _TOKEN["value"] and time.time() < _TOKEN["until"]:
        return _TOKEN["value"]
    cid, sec = _credentials()
    if not (cid and sec):
        return ""
    body = urllib.parse.urlencode({
        "grant_type": "client_credentials", "client_id": cid, "client_secret": sec,
    }).encode()
    req = urllib.request.Request(TOKEN_URL, data=body, headers={
        "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            d = json.loads(r.read())
    except Exception as e:
        print(f"  ! could not exchange credentials for a token ({type(e).__name__}: {e})")
        return ""
    _TOKEN["value"] = d.get("access_token", "")
    _TOKEN["until"] = time.time() + max(60, int(d.get("expires_in", 3600)) - 120)
    return _TOKEN["value"]


def _get(url: str, timeout: int = 40) -> bytes:
    h = {"User-Agent": UA, "Accept": "*/*"}
    # Only the API is authenticated. The image files themselves live on other hosts and
    # must not be sent somebody's bearer token.
    if url.startswith("https://api.openverse.org/"):
        t = _token()
        if t:
            h["Authorization"] = "Bearer " + t
    req = urllib.request.Request(url, headers=h)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def search(query: str, page_size: int = 40, tries: int = 4) -> list:
    """CC0/PDM images only, wide enough to be a hero, newest index first.

    Openverse rate-limits anonymous callers hard, and a 429 used to return an empty list
    that looked exactly like "no results" — a whole refetch reported zero photos and no
    error. Backoff, and say so."""
    qs = urllib.parse.urlencode({
        "q": query, "license": "cc0,pdm", "page_size": page_size,
        "mature": "false", "aspect_ratio": "wide", "size": "large",
        "source": SOURCES,
    })
    for attempt in range(tries):
        try:
            raw = _get(API + "?" + qs)
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < tries - 1:
                wait = int(e.headers.get("Retry-After") or 0) or (20 * (2 ** attempt))
                print(f"    · rate limited, waiting {wait}s")
                time.sleep(wait)
                continue
            print(f"    ! search failed (HTTP {e.code})")
            return []
        except Exception as e:
            print(f"    ! search failed ({type(e).__name__}: {e})")
            return []
        try:
            return json.loads(raw).get("results", [])
        except ValueError:
            return []
    return []


def _process(data: bytes, out: str, thumb: str) -> dict:
    """Resize, strip metadata, and derive the blur placeholder and dominant colour.

    Metadata is stripped rather than kept: camera serial numbers and GPS coordinates
    have no business on a client's home page, and a photo pack is exactly the kind of
    thing nobody thinks to check."""
    from PIL import Image
    im = Image.open(io.BytesIO(data))
    im = im.convert("RGB")
    w, h = im.size
    if w < MIN_WIDTH:
        raise ValueError(f"too small: {w}x{h}")

    # A hero wants a landscape crop; anything much taller than 4:3 is centre-cropped
    # rather than letterboxed, because a letterboxed hero is a broken-looking hero.
    target = 3 / 2
    if w / h < target:
        nh = int(w / target)
        top = max(0, (h - nh) // 2)
        im = im.crop((0, top, w, top + nh))
    if im.width > OUT_WIDTH:
        scale = OUT_WIDTH / im.width
        im = im.resize((OUT_WIDTH, int(im.height * scale)), Image.LANCZOS)

    # THE COLOUR GATE. The brief is full-colour photography, and "is it actually in
    # colour?" turns out to be the single most effective archive filter there is: a
    # greyscale scan and a sepia print both fail it, and almost everything that fails it
    # is the wrong kind of picture anyway.
    sat, spread = _colourfulness(im)
    if sat < 0.16:
        raise ValueError(f"greyscale or near-greyscale (saturation {sat:.2f})")
    if spread < 0.10:
        raise ValueError(f"single-hue (sepia/duotone, hue spread {spread:.2f})")

    clean = Image.new("RGB", im.size)
    clean.putdata(list(im.getdata()))
    clean.save(out, "JPEG", quality=78, optimize=True, progressive=True)

    t = clean.resize((32, int(32 * clean.height / clean.width)), Image.LANCZOS)
    t.save(thumb, "JPEG", quality=42)

    small = clean.resize((1, 1), Image.LANCZOS)
    r, g, b = small.getpixel((0, 0))
    return {"w": clean.width, "h": clean.height,
            "dominant": "#%02x%02x%02x" % (r, g, b),
            "bytes": os.path.getsize(out)}


def _colourfulness(im) -> tuple:
    """(mean saturation, hue spread) on a thumbnail.

    Sepia has plenty of saturation, so saturation alone lets every brown archival print
    through — the second number is what catches those: the fraction of the hue wheel the
    saturated pixels actually occupy."""
    small = im.convert("RGB").resize((64, 64))
    hsv = small.convert("HSV")
    px = list(hsv.getdata())
    sats = [p[1] / 255 for p in px]
    sat = sum(sats) / len(sats)
    hues = [p[0] for p in px if p[1] > 40 and 20 < p[2] < 245]
    if len(hues) < 64:
        return sat, 0.0
    buckets = set(h // 16 for h in hues)      # 16 buckets around the wheel
    return sat, len(buckets) / 16.0


def load_manifest() -> dict:
    try:
        with open(MANIFEST, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"schema": 1, "photos": {}}


def save_manifest(m: dict):
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(m, f, indent=2, ensure_ascii=False)
    lines = ["# Photo pack — credits and licences", "",
             "Every image here is **CC0** or **Public Domain Mark**: free to use, modify",
             "and redistribute commercially, with no attribution required. Attribution is",
             "recorded anyway — a business should be able to say where the picture on its",
             "own front page came from.", "",
             "| File | Licence | Title | Creator | Source |", "|---|---|---|---|---|"]
    for aid in sorted(m["photos"]):
        for p in m["photos"][aid]:
            lines.append("| `%s` | %s | %s | %s | [source](%s) |" % (
                p["file"], p["license"].upper(), (p.get("title") or "—")[:52],
                (p.get("creator") or "—")[:28], p.get("source_page", "")))
    with open(CREDITS, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def fetch_archetype(aid: str, man: dict, want: int, force: bool) -> int:
    have = [] if force else man["photos"].get(aid, [])
    out_dir = os.path.join(HERE, aid)
    os.makedirs(out_dir, exist_ok=True)
    seen = {p.get("source_page") for p in have}
    n = len(have)
    if n >= want and not force:
        print(f"  {aid:18} ok ({n})")
        return 0

    added = 0
    for q in QUERIES.get(aid, []):
        if n >= want:
            break
        print(f"  {aid:18} searching {q!r}")
        for r in search(q):
            if n >= want:
                break
            if r.get("license") not in OK_LICENCES:
                continue
            title = r.get("title") or ""
            if not _usable_title(title):
                print(f"      skip (title): {title[:52] or '(untitled)'}")
                continue
            page = r.get("foreign_landing_url") or r.get("url")
            if page in seen:
                continue
            url = r.get("url")
            if not url:
                continue
            base = os.path.join(out_dir, f"{n + 1}")
            try:
                data = _get(url)
                meta = _process(data, base + ".jpg", base + ".thumb.jpg")
            except Exception as e:
                print(f"      skip ({type(e).__name__}: {e})")
                continue
            seen.add(page)
            have.append({
                "file": f"{aid}/{n + 1}.jpg", "thumb": f"{aid}/{n + 1}.thumb.jpg",
                "license": r.get("license"), "title": r.get("title"),
                "creator": r.get("creator"), "source_page": page,
                "query": q, **meta,
            })
            n += 1
            added += 1
            print(f"      + {n}.jpg  {meta['w']}x{meta['h']}  "
                  f"{meta['bytes'] // 1024}KB  {meta['dominant']}")
            time.sleep(1.2)
        time.sleep(3.0)

    # A run that retrieved nothing must never replace what was already there. Openverse
    # rate-limited a refetch to zero results and this line wrote an empty list over a
    # populated pack — the JPEGs survived on disk, but the manifest that points at them
    # did not, which is the same thing as losing them.
    if have or not man["photos"].get(aid):
        man["photos"][aid] = have
    else:
        print(f"  {aid:18} kept {len(man['photos'][aid])} existing "
              f"(this run retrieved nothing)")
    return added


def report(man: dict):
    total = 0
    for aid in sorted(QUERIES):
        ps = man["photos"].get(aid, [])
        kb = sum(p.get("bytes", 0) for p in ps) // 1024
        total += kb
        flag = "" if len(ps) >= WANT_PER_ARCHETYPE else "   <-- short"
        print(f"  {aid:18} {len(ps):2} photos  {kb:5} KB{flag}")
    print(f"  {'TOTAL':18}            {total:5} KB")


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--only", help="comma-separated archetype ids")
    ap.add_argument("--want", type=int, default=WANT_PER_ARCHETYPE)
    ap.add_argument("--force", action="store_true", help="refetch even if full")
    ap.add_argument("--report", action="store_true", help="no network; just say what is here")
    a = ap.parse_args()

    cid, _sec = _credentials()
    print("  auth: " + ("registered key " + cid[:8] + "…" if cid else
                        "anonymous (rate-limited; see AUTH_FILE in this script)"))
    man = load_manifest()
    if a.report:
        report(man)
        return

    ids = [x.strip() for x in a.only.split(",")] if a.only else list(QUERIES)
    added = 0
    for aid in ids:
        if aid not in QUERIES:
            print(f"  unknown archetype: {aid}")
            continue
        added += fetch_archetype(aid, man, a.want, a.force)
        save_manifest(man)
    print()
    report(man)
    print(f"\n  {added} new photo(s). Manifest: {os.path.relpath(MANIFEST, HERE)}")


if __name__ == "__main__":
    sys.exit(main())
