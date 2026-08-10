#!/usr/bin/env python3
"""
photos/sheet.py — a contact sheet of the pack, so somebody actually looks at it.

The first pack passed every automated check and shipped a Soviet-Afghan War collage onto
a coat charity's home page. Every image was a valid JPEG, correctly licensed, the right
size, and served 200. None of that is the question. The question is what the picture is
*of*, and there is no way to answer it except by looking.

So this writes one page showing every photograph in the pack, grouped by archetype, with
its title and licence under it. Open it, and one screen tells you whether the pack is
usable.

    python3 sheet.py            # writes sheet.html next to the pack
    python3 sheet.py --open     # and opens it
"""

from __future__ import annotations

import argparse
import json
import os
import webbrowser

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "sheet.html")


def _e(s) -> str:
    return (str(s or "").replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def build() -> str:
    with open(os.path.join(HERE, "manifest.json"), encoding="utf-8") as f:
        photos = json.load(f).get("photos", {})

    blocks = []
    total = 0
    for aid in sorted(photos):
        ps = photos[aid]
        total += len(ps)
        cells = "".join(
            f'<figure><img src="{_e(p["file"])}" loading="lazy" alt="">'
            f'<figcaption><b>{_e(p["file"].split("/")[-1])}</b> '
            f'<span class="lic">{_e((p.get("license") or "").upper())}</span><br>'
            f'{_e((p.get("title") or "—")[:70])}<br>'
            f'<span class="q">{_e(p.get("query"))} · {p.get("w")}×{p.get("h")}</span>'
            f'</figcaption></figure>' for p in ps)
        flag = "" if len(ps) >= 6 else ' <span class="short">short</span>'
        blocks.append(f'<section><h2>{_e(aid)} <span class="n">{len(ps)}</span>{flag}</h2>'
                      f'<div class="row">{cells}</div></section>')

    html = f"""<!doctype html><meta charset="utf-8"><title>Photo pack — contact sheet</title>
<style>
 body{{margin:0;padding:26px;background:#14161a;color:#e8ecf0;
   font:14px/1.5 ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}}
 h1{{margin:0 0 4px;font-size:20px}}
 .sub{{color:#8b96a3;margin:0 0 26px;font-size:13px}}
 h2{{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#8b96a3;
   margin:30px 0 10px;font-weight:700}}
 h2 .n{{color:#5c6672;font-weight:500}}
 .short{{color:#e8a33d;font-size:11px;letter-spacing:0;text-transform:none}}
 .row{{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(230px,1fr))}}
 figure{{margin:0;background:#1c2026;border-radius:10px;overflow:hidden}}
 img{{display:block;width:100%;aspect-ratio:3/2;object-fit:cover;background:#252a31}}
 figcaption{{padding:9px 11px 11px;font-size:11.5px;color:#aab4c0;line-height:1.45}}
 figcaption b{{color:#e8ecf0}}
 .lic{{color:#6fbf8a;font-family:ui-monospace,Menlo,monospace;font-size:10px}}
 .q{{color:#6d7783;font-family:ui-monospace,Menlo,monospace;font-size:10px}}
</style>
<h1>Photo pack — contact sheet</h1>
<p class="sub">{total} images across {len(photos)} archetypes. Look at these before
shipping them: every automated check passes on a picture of the wrong thing.</p>
{"".join(blocks)}
"""
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)
    return OUT


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--open", action="store_true")
    a = ap.parse_args()
    p = build()
    print(p)
    if a.open:
        webbrowser.open("file://" + p)
