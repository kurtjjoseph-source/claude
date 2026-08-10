#!/usr/bin/env python3
"""
photos/recover.py — rebuild the pack from photographs already inside built demos.

I deleted the pack to refetch it, then Openverse rate-limited the refetch to nothing. The
files were not lost: every Forge build copies its six photographs into `site/img/` and
writes `site/img/CREDITS.md` beside them with the licence, title and source URL of each.
That is enough to reconstruct the manifest — provenance included, which is the part that
would actually have been unrecoverable.

Only the archetypes named on the command line are recovered. That is the point: half the
original pack was archival material that had no business on a client's page, and this is
the tool that keeps the good half rather than restoring all of it.

    python3 recover.py church education local_venue digital_products
"""

from __future__ import annotations

import json
import os
import re
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEMOS = os.path.normpath(os.path.join(HERE, "..", "demos"))
MANIFEST = os.path.join(HERE, "manifest.json")

# Which demo business was built as which archetype.
DEMO_FOR = {
    "church": "Bethel Chapel",
    "solo_business": "Vale Studio",
    "nonprofit": "Warm Coats Foundation",
    "ecommerce": "Kade Ceramics",
    "digital_products": "Plainsheet",
    "membership": "The Long Table",
    "education": "Northlight School",
    "local_venue": "De Zaal",
    "saas": "Rosterly",
    "prelaunch": "Ferry Coffee",
}

ROLES = ["hero", "band", "card1", "card2", "card3", "card4"]

# `| img/hero.jpg | the first screen | CC0 | Title… | [source](url) |`
ROW = re.compile(r"^\|\s*`img/(\w+)\.jpg`\s*\|[^|]*\|\s*(\w+)\s*\|([^|]*)\|\s*\[source\]\(([^)]*)\)")


def latest_build(business: str) -> str:
    root = os.path.join(DEMOS, business, "forge")
    if not os.path.isdir(root):
        return ""
    for rid in sorted(os.listdir(root), reverse=True):
        img = os.path.join(root, rid, "build", "site", "img")
        if os.path.isdir(img) and os.path.exists(os.path.join(img, "hero.jpg")):
            return img
    return ""


def credits(img_dir: str) -> dict:
    out = {}
    p = os.path.join(img_dir, "CREDITS.md")
    if not os.path.exists(p):
        return out
    with open(p, encoding="utf-8") as f:
        for line in f:
            m = ROW.match(line.strip())
            if m:
                out[m.group(1)] = {"license": m.group(2).lower(),
                                   "title": m.group(3).strip(),
                                   "source_page": m.group(4).strip()}
    return out


def recover(aid: str, man: dict) -> int:
    business = DEMO_FOR.get(aid)
    if not business:
        print(f"  {aid}: no demo was ever built as this archetype")
        return 0
    img = latest_build(business)
    if not img:
        print(f"  {aid}: no build with photographs found under {business}")
        return 0
    meta = credits(img)
    out_dir = os.path.join(HERE, aid)
    os.makedirs(out_dir, exist_ok=True)

    from PIL import Image
    entries, n = [], 0
    for role in ROLES:
        src = os.path.join(img, role + ".jpg")
        if not os.path.exists(src):
            continue
        n += 1
        dst = os.path.join(out_dir, f"{n}.jpg")
        shutil.copy2(src, dst)
        im = Image.open(dst)
        t = im.copy()
        t.thumbnail((32, 32))
        t.convert("RGB").save(os.path.join(out_dir, f"{n}.thumb.jpg"), "JPEG", quality=42)
        small = im.convert("RGB").resize((1, 1))
        r, g, b = small.getpixel((0, 0))
        c = meta.get(role, {})
        entries.append({
            "file": f"{aid}/{n}.jpg", "thumb": f"{aid}/{n}.thumb.jpg",
            "w": im.width, "h": im.height,
            "dominant": "#%02x%02x%02x" % (r, g, b),
            "bytes": os.path.getsize(dst),
            "license": c.get("license", "cc0"), "title": c.get("title", ""),
            "creator": "", "source_page": c.get("source_page", ""),
            "query": "recovered from " + business,
        })
    man["photos"][aid] = entries
    print(f"  {aid:18} {n} photographs recovered from {business}")
    return n


def main():
    ids = sys.argv[1:]
    if not ids:
        print(__doc__)
        return 1
    try:
        with open(MANIFEST, encoding="utf-8") as f:
            man = json.load(f)
    except Exception:
        man = {"schema": 1, "photos": {}}
    man.setdefault("photos", {})
    total = sum(recover(a, man) for a in ids)
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(man, f, indent=2, ensure_ascii=False)
    print(f"\n  {total} photographs. Run `python3 sheet.py` and LOOK at them.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
