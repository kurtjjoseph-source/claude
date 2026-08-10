#!/usr/bin/env python3
"""
build — assemble the VOM Kit preview cards for Claude Design.

Each component is authored once as a fragment in `components/`. This inlines the
kit stylesheet into every fragment so each published card is self-contained (the
Design System pane renders them in isolation), and stamps the `@dsCard` marker on
the first line, which is what the pane reads to build its index.

Source stays DRY; what ships is standalone. Same principle as Forge.

    python3 build.py

Stdlib only.
"""

from __future__ import annotations

import os
import re
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.join(HERE, "vom-kit.css")
SRC = os.path.join(HERE, "components")
DIST = os.path.join(HERE, "dist")

LOGO = os.path.join(os.path.dirname(HERE), "..", "vom-logo.jpg")

PAGE = """<!-- @dsCard group="{group}" -->
<!doctype html>
<html lang="en"{rootattrs}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · VOM Kit</title>
<style>
{css}
/* preview frame — not part of the kit */
body{{ padding:26px; }}
.vk-demo-label{{ font-family:var(--mono); font-size:10.5px; letter-spacing:.14em;
  text-transform:uppercase; color:var(--ink-faint); margin:0 0 14px; }}
.vk-demo-row + .vk-demo-row{{ margin-top:26px; }}
</style>
</head>
<body class="vk-body">
{body}
</body>
</html>
"""


def parse(text: str):
    """Fragments carry their own metadata in an HTML comment header."""
    meta = {}
    m = re.match(r"\s*<!--\s*(.*?)-->\s*", text, re.S)
    if m:
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
        text = text[m.end():]
    return meta, text.strip()


def main():
    with open(KIT, encoding="utf-8") as f:
        css = f.read()

    logo_uri = ""
    logo_path = os.path.normpath(LOGO)
    if os.path.exists(logo_path):
        import base64
        with open(logo_path, "rb") as f:
            logo_uri = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode("ascii")

    shutil.rmtree(DIST, ignore_errors=True)
    os.makedirs(DIST, exist_ok=True)

    built = []
    for name in sorted(os.listdir(SRC)):
        if not name.endswith(".html"):
            continue
        with open(os.path.join(SRC, name), encoding="utf-8") as f:
            meta, body = parse(f.read())

        attrs = ""
        if meta.get("brand"):
            attrs += f' data-brand="{meta["brand"]}"'
        if meta.get("surface"):
            attrs += f' data-surface="{meta["surface"]}"'
        if meta.get("theme"):
            attrs += f' data-theme="{meta["theme"]}"'

        html = PAGE.format(
            group=meta.get("group", "Components"),
            title=meta.get("name", name[:-5]),
            css=css, body=body.replace("{{LOGO}}", logo_uri), rootattrs=attrs,
        )
        out = os.path.join(DIST, name)
        with open(out, "w", encoding="utf-8") as f:
            f.write(html)
        built.append((name, meta.get("group", "Components"), meta.get("name", name[:-5])))

    # the kit itself ships alongside the cards, as the thing to actually copy
    shutil.copy2(KIT, os.path.join(DIST, "vom-kit.css"))

    groups = {}
    for n, g, t in built:
        groups.setdefault(g, []).append(t)
    print(f"built {len(built)} cards into dist/")
    for g in sorted(groups):
        print(f"  {g:<14} {', '.join(sorted(groups[g]))}")

    # The other half of the system — the public sites Forge generates — is not authored
    # here. It is rendered by site_gen, so its cards are generated from site_gen rather
    # than drawn a second time by hand.
    import site_cards
    site_cards.main()


if __name__ == "__main__":
    main()
