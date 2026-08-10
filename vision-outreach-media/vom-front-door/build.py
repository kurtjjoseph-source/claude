#!/usr/bin/env python3
"""Assemble the VOM front door into one self-contained page.
   wizard.html       artifact fragment (starts at <title>) -> deploy-wizard.sh
   wizard.local.html the same content wrapped, for file:// testing"""
import re
src = open("page.src.html", encoding="utf-8").read()
css = open("kit.css", encoding="utf-8").read()
logo = "".join(open("logo.txt", encoding="utf-8").read().split())

out = src.replace("<!--INLINE_CSS-->", "<style>\n/* ==== VOM Kit v2 ==== */\n" + css.rstrip() + "\n</style>")
out = out.replace("__LOGO_DATA_URI__", logo)

def die(m): raise SystemExit("  !! BUILD FAILED: " + m)
if "__LOGO_DATA_URI__" in out: die("logo placeholder survived")
if "<!--INLINE_CSS-->" in out: die("css placeholder survived")
if not out.startswith("<title>"): die("fragment must start at <title> for deploy-wizard.sh")
if re.search(r'<script\b[^>]*\bsrc\s*=', out, re.I): die("external <script src>")
if re.search(r'<link\b[^>]*rel\s*=\s*["\']?stylesheet', out, re.I): die("external stylesheet")
if re.search(r'url\(\s*["\']?\s*(?:https?:)?//', out, re.I): die("external url() in css")
if not logo.startswith("data:"): die("logo is not a data URI")
if 'setAttribute("data-brand","vom")' not in out: die("accent slot not set to vom")

# palette guard: no colour literals outside the kit block
kit_end = out.index("/* ==== VOM Kit v2 ==== */")
kit_stop = out.index("</style>", kit_end)
mine = out[:kit_end] + out[kit_stop:]
mine = re.sub(r"/\*.*?\*/", " ", mine, flags=re.S)
for pat, what in ((r"(?<![&\w])#[0-9a-fA-F]{3,8}\b", "hex"), (r"\b(?:rgba?|hsla?)\s*\(", "rgb/hsl")):
    hit = re.search(pat, mine)
    if hit: die("%s colour literal outside the kit: %s" % (what, hit.group(0)))

open("wizard.html", "w", encoding="utf-8").write(out)
open("wizard.local.html", "w", encoding="utf-8").write(
    '<!doctype html><html lang="en"><head><meta charset="utf-8">'
    '<meta name="viewport" content="width=device-width,initial-scale=1">'
    '<meta name="color-scheme" content="light dark"></head><body>' + out + '</body></html>')
print("  wizard.html  %d bytes" % len(out))
for c in ("fragment shape", "no placeholders", "no external css/js/url",
          "VOM mark inlined as data URI", "accent slot = vom",
          "palette: no colour literals outside the kit"):
    print("  ok   " + c)
