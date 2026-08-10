#!/usr/bin/env python3
"""
build — the gallery: what Vision Outreach Media builds, one page per kind of business.

The showcase problem, stated honestly: a studio's capability page is usually one template
with the client's industry swapped into the headline. It is quick to make and it proves
nothing, because the thing a prospective client is trying to judge is precisely whether
you can make something that fits *them*.

So the ten pages here do not share a stylesheet. They share a shell — the studio's own
bar and footer, which is the constant — and then each one is built in the visual world of
the business it is about: its own ground, its own type, its own first screen, its own
motif. A church page opens under an arch on warm paper. A venue page is a gig poster on
black. A digital-products page is a file manifest in the dark. That difference *is* the
argument.

What none of them do is make anything up. Every module name, page name and live URL comes
from `data.py`, which reads the compiled spec and the receipt of a real Forge run. The
claim on the page and the thing that got built are the same object.

    python3 build.py            # -> public/
    python3 build.py --deploy   # -> public/, then vercel --prod

Stdlib only.
"""

from __future__ import annotations

import argparse
import base64
import html
import json
import os
import shutil
import subprocess
import sys

import data

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(HERE, "public")
LOGO = os.path.normpath(os.path.join(HERE, "..", "vom-logo.jpg"))

CONTACT = "hello@visionoutreachmedia.nl"


def e(s) -> str:
    return html.escape(str(s if s is not None else ""), quote=True)


def logo_uri() -> str:
    if not os.path.exists(LOGO):
        return ""
    with open(LOGO, "rb") as f:
        return "data:image/jpeg;base64," + base64.b64encode(f.read()).decode("ascii")


# ===========================================================================
# the shell — the only thing every page shares
# ===========================================================================

SHELL_CSS = """
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
img{max-width:100%}
a{color:inherit}
:focus-visible{outline:2px solid currentColor;outline-offset:3px;border-radius:5px}
.wrap{max-width:1120px;margin:0 auto;padding:0 26px}
.vombar{background:#1B2A4A;color:#fff;
  font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
.vombar .wrap{display:flex;align-items:center;gap:14px;min-height:56px;flex-wrap:wrap}
.vombar img{height:28px;width:auto;border-radius:5px;display:block}
.vombar .nm{font-weight:700;font-size:14.5px;letter-spacing:-.01em}
.vombar .sep{color:#8FA2C0;font-size:13px}
.vombar .role{color:#C9D3E6;font-size:12.5px;letter-spacing:.09em;text-transform:uppercase}
.vombar nav{margin-left:auto;display:flex;gap:18px;flex-wrap:wrap}
.vombar nav a{color:#C9D3E6;text-decoration:none;font-size:13.5px;font-weight:600}
.vombar nav a:hover{color:#fff}
.vomfoot{background:#1B2A4A;color:#C9D3E6;
  font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  padding:52px 0 46px;font-size:14px;line-height:1.6;margin-top:0}
.vomfoot h4{color:#fff;font-size:12px;letter-spacing:.13em;text-transform:uppercase;
  margin:0 0 12px;font-weight:700}
.vomfoot .cols{display:grid;gap:32px;grid-template-columns:minmax(0,1.5fr) repeat(2,minmax(0,1fr))}
.vomfoot a{color:#C9D3E6;text-decoration:none}
.vomfoot a:hover{color:#E8843C}
.vomfoot .ln{display:grid;gap:8px}
.vomfoot .fine{margin-top:34px;padding-top:20px;border-top:1px solid #2C3D60;font-size:12.5px;
  color:#8FA2C0;display:flex;gap:18px;flex-wrap:wrap;justify-content:space-between}
@media(max-width:760px){.vomfoot .cols{grid-template-columns:1fr}
  .vombar nav{width:100%;margin:0;padding-bottom:9px;gap:14px}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
"""


def vombar(current: str = "") -> str:
    def link(href, label, key):
        cur = ' style="color:#fff"' if key == current else ""
        return f'<a href="{href}"{cur}>{e(label)}</a>'
    mark = f'<img src="{logo_uri()}" alt="">' if logo_uri() else ""
    return f"""<header class="vombar"><div class="wrap">
  {mark}<span class="nm">Vision Outreach Media</span>
  <span class="sep">·</span><span class="role">What we build</span>
  <nav>{link("index.html", "The work", "home")}
       {link("index.html#capabilities", "Capabilities", "cap")}
       {link("index.html#start", "Start", "start")}</nav>
</div></header>"""


def vomfoot(types: list) -> str:
    ten = "".join(f'<a href="{t["slug"]}.html">{e(t["label"])}</a>' for t in types)
    caps = "".join(f'<a href="index.html#capabilities">{e(c["title"])}</a>'
                   for c in data.CAPABILITIES)
    return f"""<footer class="vomfoot"><div class="wrap">
  <div class="cols">
    <div>
      <h4>Vision Outreach Media</h4>
      <p style="margin:0;max-width:42ch">A studio in the Netherlands that builds the
      website and the back office behind it as one system — and then hands it over
      working.</p>
      <p style="margin:14px 0 0"><a href="mailto:{CONTACT}"><strong
        style="color:#fff">{CONTACT}</strong></a></p>
    </div>
    <div><h4>Ten kinds of business</h4><div class="ln">{ten}</div></div>
    <div><h4>Capabilities</h4><div class="ln">{caps}</div></div>
  </div>
  <div class="fine">
    <span>Every example on this site is a fictional business, built by our own tooling and
      published as it came out.</span>
    <span>© 2026 Vision Outreach Media</span>
  </div>
</div></footer>"""


PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>__TITLE__</title>
<meta name="description" content="__DESC__">
<meta name="theme-color" content="__THEME__">
<meta property="og:title" content="__TITLE__">
<meta property="og:description" content="__DESC__">
<meta property="og:type" content="website">
<style>__CSS__</style>
</head>
<body>
__BAR__
__BODY__
__FOOT__
</body>
</html>
"""


def page(title, desc, theme, css, body, types, current=""):
    return (PAGE.replace("__TITLE__", e(title)).replace("__DESC__", e(desc))
                .replace("__THEME__", e(theme))
                .replace("__CSS__", SHELL_CSS + css)
                .replace("__BAR__", vombar(current))
                .replace("__BODY__", body)
                .replace("__FOOT__", vomfoot(types)))


# ===========================================================================
# a type page: its own world, from the archetype's own facts
# ===========================================================================

def type_css(t: dict) -> str:
    """The page's whole visual world. Nothing here is shared with another type page.

    That is the point of the exercise and also its cost: ten grounds, ten type stacks and
    ten first screens is more CSS than one template would be. A template would also be a
    worse argument for hiring a studio."""
    a = t["art"]
    dark = a["scheme"] == "dark"
    card = ("rgba(255,255,255,.045)" if dark else "#FFFFFF")
    return f"""
:root{{
  --ground:{a['ground']}; --ink:{a['ink']}; --muted:{a['muted']}; --line:{a['line']};
  --accent:{a['accent']}; --accent2:{a['accent2']}; --card:{card};
  --display:{a['display']}; --body:{a['body']};
  --on-accent:{'#0B0A0C' if dark else '#FFFFFF'};
}}
body{{background:var(--ground);color:var(--ink);font-family:var(--body);
  font-size:17px;line-height:1.62}}
h1,h2,h3{{font-family:var(--display);margin:0;text-wrap:balance}}
p{{margin:0}}
.sec{{padding:clamp(52px,7vw,96px) 0}}
.eyebrow{{font-size:12px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;
  color:var(--accent);display:block;margin-bottom:18px}}
.h2{{font-size:clamp(1.6rem,3.2vw,2.4rem);line-height:1.14;letter-spacing:-.02em;
  margin-bottom:16px;font-weight:600}}
.sub{{color:var(--muted);max-width:60ch;font-size:1.03rem}}
.btn{{display:inline-flex;align-items:center;gap:9px;text-decoration:none;font-family:var(--body);
  font-weight:700;font-size:.95rem;padding:13px 24px;border-radius:999px;
  background:var(--accent);color:var(--on-accent);border:1px solid var(--accent);
  transition:transform .16s,box-shadow .2s}}
.btn:hover{{transform:translateY(-1px);
  box-shadow:0 12px 26px color-mix(in srgb,var(--accent) 30%,transparent)}}
.btn.ghost{{background:transparent;color:var(--ink);
  border-color:color-mix(in srgb,var(--ink) 22%,transparent)}}
.btn.ghost:hover{{border-color:var(--accent);color:var(--accent);box-shadow:none}}

/* what you get — four claims, each one a thing the client can check */
.gets{{display:grid;gap:2px;background:var(--line);border:1px solid var(--line);
  border-radius:16px;overflow:hidden}}
.get{{background:var(--ground);padding:28px 30px;display:grid;
  grid-template-columns:38px minmax(0,1fr);gap:20px;align-items:start}}
.get .n{{font-family:var(--display);font-size:1.05rem;font-weight:700;color:var(--accent);
  line-height:1.4;font-variant-numeric:tabular-nums}}
.get h3{{font-size:1.1rem;font-weight:600;letter-spacing:-.015em;margin-bottom:5px}}
.get p{{color:var(--muted);font-size:.97rem}}
@media(min-width:840px){{.gets{{grid-template-columns:1fr 1fr}}}}

/* the inventory — read out of the compiled spec, not written by hand */
.inv{{display:grid;gap:26px;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
.invbox{{border:1px solid var(--line);border-radius:16px;padding:26px 28px;
  background:var(--card)}}
.invbox h3{{font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;
  font-family:var(--body);font-weight:700;color:var(--muted);margin-bottom:16px}}
.chips{{display:flex;flex-wrap:wrap;gap:8px}}
.chip{{border:1px solid var(--line);border-radius:999px;padding:7px 15px;font-size:.88rem;
  font-weight:600;background:color-mix(in srgb,var(--accent) 7%,transparent)}}
@media(max-width:820px){{.inv{{grid-template-columns:1fr}}}}

/* the live example */
.live{{border:1px solid var(--accent);border-radius:20px;padding:clamp(28px,4vw,44px);
  background:color-mix(in srgb,var(--accent) 9%,transparent);display:grid;gap:20px;
  grid-template-columns:minmax(0,1fr) auto;align-items:center}}
.live .lt{{font-family:var(--display);font-size:clamp(1.3rem,2.4vw,1.8rem);font-weight:600;
  letter-spacing:-.02em;margin-bottom:8px}}
.live p{{color:var(--muted);font-size:.96rem;max-width:56ch}}
.live .go{{display:flex;gap:10px;flex-wrap:wrap}}
@media(max-width:760px){{.live{{grid-template-columns:1fr}}}}

.rail{{display:flex;gap:26px;flex-wrap:wrap;padding-top:26px;border-top:1px solid var(--line);
  color:var(--muted);font-size:.9rem}}
.rail b{{color:var(--ink);font-weight:700;font-variant-numeric:tabular-nums}}

/* next / previous kind of business */
.more{{display:flex;gap:12px;flex-wrap:wrap;align-items:center;
  padding:34px 0 0;border-top:1px solid var(--line)}}
.more a{{text-decoration:none;border:1px solid var(--line);border-radius:999px;
  padding:9px 17px;font-size:.9rem;font-weight:600;color:var(--muted)}}
.more a:hover{{border-color:var(--accent);color:var(--accent)}}
"""


# ---------------------------------------------------------------- the heroes
# One per kind of business. These are the pages' arguments, so they are written
# individually rather than parameterised — a first screen that can be generated from a
# config is a first screen that looks like it was.

def hero_arch(t, f):
    """Churches — warm paper, an arch, and nothing hurrying you."""
    return f"""
<style>
.hero{{position:relative;padding:clamp(60px,8vw,110px) 0 clamp(40px,5vw,70px);text-align:center;
  overflow:hidden}}
.hero::before{{content:"";position:absolute;left:50%;top:-70px;transform:translateX(-50%);
  width:min(560px,86vw);height:560px;border-radius:280px 280px 0 0;
  border:1px solid color-mix(in srgb,var(--accent) 34%,transparent);
  background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 9%,transparent),transparent 62%)}}
.hero .in{{position:relative}}
.hero h1{{font-size:clamp(2.5rem,6vw,4.3rem);font-weight:600;line-height:1.07;
  letter-spacing:-.018em;max-width:17ch;margin:0 auto 22px}}
.hero .lede{{color:var(--muted);font-size:clamp(1.06rem,2.1vw,1.28rem);max-width:58ch;
  margin:0 auto 30px}}
.arches{{display:flex;justify-content:center;gap:14px;margin:44px auto 0}}
.arches i{{display:block;width:64px;height:88px;border-radius:32px 32px 4px 4px;
  border:1px solid var(--line);background:var(--card)}}
.arches i:nth-child(2){{height:112px;border-color:color-mix(in srgb,var(--accent) 40%,transparent)}}
</style>
<section class="hero"><div class="wrap in">
  <span class="eyebrow">{e(t['label'])}</span>
  <h1>{e(t['headline'])}</h1>
  <p class="lede">{e(t['lede'])}</p>
  <a class="btn" href="{e(f['live'])}" target="_blank" rel="noopener">Walk through a real one &rarr;</a>
  <div class="arches"><i></i><i></i><i></i></div>
</div></section>"""


def hero_index(t, f):
    """One-person studios — a contact sheet: the work, indexed."""
    rows = "".join(
        f'<div class="r"><span class="i">{n:02d}</span><span class="w">{e(p)}</span></div>'
        for n, p in enumerate(f["pages"], 1))
    return f"""
<style>
.hero{{padding:clamp(52px,7vw,92px) 0}}
.hero .grid{{display:grid;gap:clamp(28px,5vw,64px);grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);
  align-items:center}}
.hero h1{{font-size:clamp(2.2rem,4.8vw,3.5rem);font-weight:800;letter-spacing:-.035em;
  line-height:1.04;margin-bottom:20px}}
.hero .lede{{color:var(--muted);font-size:1.1rem;max-width:48ch;margin-bottom:26px}}
.sheet{{border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--card)}}
.sheet .hd{{padding:13px 18px;border-bottom:1px solid var(--line);font-size:11.5px;
  letter-spacing:.15em;text-transform:uppercase;color:var(--muted);font-weight:700}}
.sheet .r{{display:flex;gap:16px;align-items:baseline;padding:13px 18px;
  border-bottom:1px solid var(--line)}}
.sheet .r:last-child{{border-bottom:0}}
.sheet .i{{font-variant-numeric:tabular-nums;font-size:.78rem;font-weight:700;color:var(--accent);
  min-width:22px}}
.sheet .w{{font-weight:600}}
@media(max-width:840px){{.hero .grid{{grid-template-columns:1fr}}}}
</style>
<section class="hero"><div class="wrap grid">
  <div>
    <span class="eyebrow">{e(t['label'])}</span>
    <h1>{e(t['headline'])}</h1>
    <p class="lede">{e(t['lede'])}</p>
    <a class="btn" href="{e(f['live'])}" target="_blank" rel="noopener">Open a real one &rarr;</a>
  </div>
  <div class="sheet">
    <div class="hd">The site, page by page</div>
    {rows}
  </div>
</div></section>"""


def hero_ledger(t, f):
    """Charities — the account, first. Figures where a photograph usually goes."""
    return f"""
<style>
.hero{{padding:clamp(52px,7vw,92px) 0}}
.hero .grid{{display:grid;gap:clamp(28px,5vw,58px);grid-template-columns:minmax(0,1fr) minmax(0,.85fr);
  align-items:center}}
.hero h1{{font-size:clamp(2.3rem,5vw,3.6rem);font-weight:600;letter-spacing:-.02em;
  line-height:1.08;margin-bottom:20px}}
.hero .lede{{color:var(--muted);font-size:1.1rem;max-width:50ch;margin-bottom:26px}}
.ledger{{border:1px solid var(--line);border-radius:4px;background:var(--card);
  box-shadow:0 18px 44px rgba(21,33,28,.08);overflow:hidden}}
.ledger .hd{{padding:15px 22px;border-bottom:2px solid var(--accent);
  font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;
  color:var(--muted)}}
.ledger .l{{display:flex;justify-content:space-between;gap:18px;padding:15px 22px;
  border-bottom:1px dashed var(--line);font-variant-numeric:tabular-nums}}
.ledger .l:last-child{{border-bottom:0}}
.ledger .l b{{font-weight:700}}
.ledger .tot{{background:color-mix(in srgb,var(--accent) 8%,transparent);font-weight:700}}
.ledger .note{{padding:15px 22px;color:var(--muted);font-size:.86rem;
  border-top:1px solid var(--line)}}
@media(max-width:840px){{.hero .grid{{grid-template-columns:1fr}}}}
</style>
<section class="hero"><div class="wrap grid">
  <div>
    <span class="eyebrow">{e(t['label'])}</span>
    <h1>{e(t['headline'])}</h1>
    <p class="lede">{e(t['lede'])}</p>
    <a class="btn" href="{e(f['live'])}" target="_blank" rel="noopener">See a real one &rarr;</a>
  </div>
  <div class="ledger">
    <div class="hd">The annual account · published</div>
    <div class="l"><span>Winter drive</span><b>reported</b></div>
    <div class="l"><span>Night rounds</span><b>reported</b></div>
    <div class="l"><span>Referral desk</span><b>reported</b></div>
    <div class="l"><span>Admin overhead</span><b>reported</b></div>
    <div class="l tot"><span>What did not go to plan</span><b>also reported</b></div>
    <div class="note">The platform keeps the figures as they accrue, so the account is a
      page that is already written when the year ends.</div>
  </div>
</div></section>"""


def hero_objects(t, f):
    """Shops — the objects, big, with the price on them."""
    shapes = [
        ("52% 52% 44% 44% / 62% 62% 38% 38%", "€28", "Everyday bowl"),
        ("46% 46% 40% 40% / 12% 12% 88% 88%", "€65", "Coffee set"),
        ("50%", "€120", "Serving dish"),
    ]
    cells = "".join(
        f'<figure><div class="o" style="border-radius:{r}"></div>'
        f'<figcaption><span>{e(n)}</span><b>{e(p)}</b></figcaption></figure>'
        for r, p, n in shapes)
    return f"""
<style>
.hero{{padding:clamp(48px,6vw,84px) 0 0}}
.hero h1{{font-size:clamp(2.4rem,5.6vw,4rem);font-weight:600;letter-spacing:-.012em;
  line-height:1.06;max-width:16ch;margin-bottom:20px}}
.hero .lede{{color:var(--muted);font-size:1.1rem;max-width:54ch;margin-bottom:28px}}
.shelf{{display:grid;gap:22px;grid-template-columns:repeat(3,1fr);margin-top:clamp(38px,5vw,62px);
  padding-bottom:clamp(38px,5vw,62px)}}
.shelf figure{{margin:0}}
.shelf .o{{aspect-ratio:1;background:
   radial-gradient(120% 100% at 30% 18%,color-mix(in srgb,var(--accent) 26%,var(--card)),
                   color-mix(in srgb,var(--accent) 62%,#2a1416));
   border:1px solid var(--line);box-shadow:0 22px 46px rgba(26,20,20,.14)}}
.shelf figcaption{{display:flex;justify-content:space-between;gap:12px;align-items:baseline;
  padding-top:14px;font-size:.92rem;border-top:1px solid var(--line);margin-top:16px}}
.shelf b{{font-family:var(--display);font-size:1.1rem}}
@media(max-width:760px){{.shelf{{grid-template-columns:1fr 1fr}}.shelf figure:last-child{{display:none}}}}
</style>
<section class="hero"><div class="wrap">
  <span class="eyebrow">{e(t['label'])}</span>
  <h1>{e(t['headline'])}</h1>
  <p class="lede">{e(t['lede'])}</p>
  <a class="btn" href="{e(f['live'])}" target="_blank" rel="noopener">Open a real shop &rarr;</a>
  <div class="shelf">{cells}</div>
</div></section>"""


def hero_manifest(t, f):
    """Digital products — a manifest. What is in the download, in monospace."""
    files = [("year-pack.xlsx", "1.2 MB"), ("vat-companion.xlsx", "480 KB"),
             ("read-me-first.pdf", "210 KB"), ("updates/", "free, forever")]
    rows = "".join(f'<div class="f"><span>{e(n)}</span><b>{e(s)}</b></div>' for n, s in files)
    return f"""
<style>
.hero{{padding:clamp(52px,7vw,96px) 0;position:relative;overflow:hidden}}
.hero::before{{content:"";position:absolute;inset:-30% -10% auto -10%;height:120%;
  background:radial-gradient(46% 40% at 76% 6%,color-mix(in srgb,var(--accent) 26%,transparent),
             transparent 70%);pointer-events:none}}
.hero .grid{{position:relative;display:grid;gap:clamp(28px,5vw,58px);
  grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr);align-items:center}}
.hero h1{{font-size:clamp(2.2rem,4.9vw,3.5rem);font-weight:800;letter-spacing:-.038em;
  line-height:1.03;margin-bottom:20px}}
.hero .lede{{color:var(--muted);font-size:1.08rem;max-width:50ch;margin-bottom:26px}}
.mf{{border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.035);
  font-family:ui-monospace,'SF Mono',Menlo,Consolas,monospace;overflow:hidden;
  box-shadow:0 30px 70px rgba(0,0,0,.5)}}
.mf .hd{{display:flex;gap:8px;align-items:center;padding:13px 18px;
  border-bottom:1px solid var(--line);font-size:11.5px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--muted)}}
.mf .dot{{width:9px;height:9px;border-radius:50%;background:var(--accent)}}
.mf .f{{display:flex;justify-content:space-between;gap:16px;padding:14px 18px;
  border-bottom:1px solid var(--line);font-size:13.5px}}
.mf .f:last-of-type{{border-bottom:0}}
.mf .f b{{color:var(--accent);font-weight:500}}
.mf .ft{{padding:14px 18px;border-top:1px solid var(--line);font-size:12.5px;color:var(--muted);
  background:rgba(255,255,255,.02)}}
@media(max-width:840px){{.hero .grid{{grid-template-columns:1fr}}}}
</style>
<section class="hero"><div class="wrap grid">
  <div>
    <span class="eyebrow">{e(t['label'])}</span>
    <h1>{e(t['headline'])}</h1>
    <p class="lede">{e(t['lede'])}</p>
    <a class="btn" href="{e(f['live'])}" target="_blank" rel="noopener">Open a real one &rarr;</a>
  </div>
  <div class="mf">
    <div class="hd"><span class="dot"></span> what is in the download</div>
    {rows}
    <div class="ft">Listed before payment, not after. Delivered in seconds by email.</div>
  </div>
</div></section>"""


def hero_card(t, f):
    """Clubs — the membership itself, as an object you could hold."""
    return f"""
<style>
.hero{{padding:clamp(52px,7vw,96px) 0;position:relative;overflow:hidden}}
.hero::before{{content:"";position:absolute;inset:auto -20% -60% -20%;height:120%;
  background:radial-gradient(40% 40% at 50% 100%,color-mix(in srgb,var(--accent) 20%,transparent),
             transparent 70%);pointer-events:none}}
.hero .grid{{position:relative;display:grid;gap:clamp(30px,5vw,60px);
  grid-template-columns:minmax(0,1fr) minmax(0,.86fr);align-items:center}}
.hero h1{{font-size:clamp(2.2rem,4.9vw,3.5rem);font-weight:740;letter-spacing:-.028em;
  line-height:1.07;margin-bottom:20px}}
.hero .lede{{color:var(--muted);font-size:1.08rem;max-width:50ch;margin-bottom:26px}}
.pass{{border-radius:20px;padding:30px 32px;transform:rotate(-2.2deg);
  background:linear-gradient(150deg,color-mix(in srgb,var(--accent) 88%,#2a1c05),var(--accent));
  color:#20180A;box-shadow:0 34px 70px rgba(0,0,0,.55);position:relative;overflow:hidden}}
.pass::after{{content:"";position:absolute;inset:0;
  background:radial-gradient(60% 80% at 84% 0,rgba(255,255,255,.35),transparent 60%)}}
.pass > *{{position:relative}}
.pass .k{{font-size:11px;letter-spacing:.2em;text-transform:uppercase;font-weight:800;
  opacity:.7}}
.pass .nm{{font-family:var(--display);font-size:1.7rem;font-weight:700;letter-spacing:-.02em;
  margin:8px 0 22px}}
.pass .row{{display:flex;justify-content:space-between;gap:14px;font-size:.85rem;
  font-weight:700;border-top:1px solid rgba(32,24,10,.25);padding-top:12px}}
.pass .leave{{margin-top:16px;font-size:.82rem;font-weight:700;opacity:.75}}
@media(max-width:840px){{.hero .grid{{grid-template-columns:1fr}}.pass{{transform:none}}}}
</style>
<section class="hero"><div class="wrap grid">
  <div>
    <span class="eyebrow">{e(t['label'])}</span>
    <h1>{e(t['headline'])}</h1>
    <p class="lede">{e(t['lede'])}</p>
    <a class="btn" href="{e(f['live'])}" target="_blank" rel="noopener">Open a real one &rarr;</a>
  </div>
  <div class="pass">
    <div class="k">Member since</div>
    <div class="nm">{e(f['business'])}</div>
    <div class="row"><span>Monthly</span><span>Cancel any time</span></div>
    <div class="leave">One click. No call, no retention offer, no dark pattern.</div>
  </div>
</div></section>"""


def hero_syllabus(t, f):
    """Schools — the curriculum, on the page, before anyone is asked to enrol."""
    lessons = ["What light actually does", "Exposure, without the triangle diagram",
               "Reading a scene in ten seconds", "The one setting that matters",
               "Editing towards a body of work"]
    rows = "".join(f'<li><span>{n:02d}</span>{e(l)}</li>' for n, l in enumerate(lessons, 1))
    return f"""
<style>
.hero{{padding:clamp(52px,7vw,92px) 0}}
.hero .grid{{display:grid;gap:clamp(28px,5vw,58px);grid-template-columns:minmax(0,1fr) minmax(0,.9fr);
  align-items:center}}
.hero h1{{font-size:clamp(2.3rem,5vw,3.6rem);font-weight:600;letter-spacing:-.018em;
  line-height:1.07;margin-bottom:20px}}
.hero .lede{{color:var(--muted);font-size:1.1rem;max-width:50ch;margin-bottom:26px}}
.syl{{background:
   repeating-linear-gradient(180deg,transparent,transparent 43px,var(--line) 43px,var(--line) 44px),
   var(--card);
  border:1px solid var(--line);border-radius:6px;padding:26px 30px 22px;position:relative;
  box-shadow:0 20px 46px rgba(19,30,28,.09)}}
.syl::before{{content:"";position:absolute;left:58px;top:0;bottom:0;width:1px;
  background:color-mix(in srgb,var(--accent) 40%,transparent)}}
.syl h3{{font-family:var(--body);font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;
  color:var(--muted);font-weight:700;margin-bottom:18px}}
.syl ol{{list-style:none;margin:0;padding:0}}
.syl li{{display:flex;gap:26px;align-items:baseline;height:44px;font-size:.98rem;font-weight:500}}
.syl li span{{font-variant-numeric:tabular-nums;color:var(--accent);font-weight:700;
  font-size:.82rem;min-width:24px}}
@media(max-width:840px){{.hero .grid{{grid-template-columns:1fr}}}}
</style>
<section class="hero"><div class="wrap grid">
  <div>
    <span class="eyebrow">{e(t['label'])}</span>
    <h1>{e(t['headline'])}</h1>
    <p class="lede">{e(t['lede'])}</p>
    <a class="btn" href="{e(f['live'])}" target="_blank" rel="noopener">Open a real one &rarr;</a>
  </div>
  <div class="syl"><h3>A course, on the page</h3><ol>{rows}</ol></div>
</div></section>"""


def hero_poster(t, f):
    """Venues — a gig poster. The date is the headline, because it is."""
    nights = [("THU", "Live · three acts"), ("FRI", "Live · doors 19:30"),
              ("SUN", "Acoustic · free entry")]
    rows = "".join(f'<div class="n"><b>{e(d)}</b><span>{e(w)}</span></div>' for d, w in nights)
    return f"""
<style>
.hero{{padding:clamp(44px,6vw,80px) 0 0;position:relative;overflow:hidden}}
.hero::before{{content:"";position:absolute;inset:-40% -20% auto -20%;height:140%;
  background:radial-gradient(44% 38% at 24% 4%,color-mix(in srgb,var(--accent) 24%,transparent),
             transparent 68%);pointer-events:none}}
.hero .in{{position:relative}}
.poster{{border:1px solid var(--line);border-radius:2px;padding:clamp(26px,4vw,44px);
  background:linear-gradient(180deg,rgba(255,255,255,.04),transparent)}}
.poster .kicker{{font-size:11.5px;letter-spacing:.34em;text-transform:uppercase;
  color:var(--accent);font-weight:700;margin-bottom:26px}}
.poster h1{{font-size:clamp(2.6rem,7.4vw,5.4rem);font-weight:600;line-height:.98;
  letter-spacing:-.014em;margin-bottom:26px;max-width:15ch}}
.poster .lede{{color:var(--muted);font-size:1.06rem;max-width:52ch;margin-bottom:32px}}
.nights{{display:grid;gap:0;border-top:1px solid var(--line);margin-bottom:30px}}
.nights .n{{display:flex;gap:22px;align-items:baseline;padding:15px 0;
  border-bottom:1px solid var(--line)}}
.nights b{{font-family:var(--display);font-size:1.5rem;font-weight:600;color:var(--accent);
  min-width:74px;letter-spacing:.02em}}
.nights span{{color:var(--muted);font-size:.95rem}}
</style>
<section class="hero"><div class="wrap in">
  <div class="poster">
    <div class="kicker">{e(t['label'])}</div>
    <h1>{e(t['headline'])}</h1>
    <p class="lede">{e(t['lede'])}</p>
    <div class="nights">{rows}</div>
    <a class="btn" href="{e(f['live'])}" target="_blank" rel="noopener">Open a real one &rarr;</a>
  </div>
</div></section>"""


def hero_window(t, f):
    """Software — the product, as a window. Chrome, rows, a price with no form."""
    rows = "".join(
        f'<div class="r"><span class="d" style="background:{c}"></span>'
        f'<span class="t">{e(n)}</span><span class="v">{e(v)}</span></div>'
        for n, v, c in [("Mon · early", "4 on", "var(--accent)"),
                        ("Mon · late", "3 on", "color-mix(in srgb,var(--accent) 55%,transparent)"),
                        ("Tue · early", "swap requested", "var(--accent2)"),
                        ("Wage cost, this week", "€2,480", "transparent")])
    return f"""
<style>
.hero{{padding:clamp(52px,7vw,92px) 0}}
.hero .grid{{display:grid;gap:clamp(28px,5vw,56px);grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);
  align-items:center}}
.hero h1{{font-size:clamp(2.2rem,4.8vw,3.4rem);font-weight:800;letter-spacing:-.038em;
  line-height:1.04;margin-bottom:20px}}
.hero .lede{{color:var(--muted);font-size:1.08rem;max-width:48ch;margin-bottom:26px}}
.win{{border:1px solid var(--line);border-radius:14px;overflow:hidden;background:#fff;
  box-shadow:0 30px 64px rgba(18,20,36,.16)}}
.win .chrome{{display:flex;align-items:center;gap:7px;padding:12px 16px;
  border-bottom:1px solid var(--line);background:#F1F2F8}}
.win .chrome i{{width:10px;height:10px;border-radius:50%;background:#D5D8E4;display:block}}
.win .chrome .u{{margin-left:12px;font-size:11.5px;color:#7A8098;
  font-family:ui-monospace,Menlo,monospace}}
.win .body{{padding:8px 20px 18px}}
.win .r{{display:flex;align-items:center;gap:14px;padding:14px 0;
  border-bottom:1px solid var(--line)}}
.win .r:last-child{{border-bottom:0;font-weight:700}}
.win .d{{width:9px;height:9px;border-radius:3px;flex:none}}
.win .t{{flex:1;font-size:.94rem}}
.win .v{{font-size:.88rem;color:#5B6076;font-variant-numeric:tabular-nums;font-weight:600}}
@media(max-width:840px){{.hero .grid{{grid-template-columns:1fr}}}}
</style>
<section class="hero"><div class="wrap grid">
  <div>
    <span class="eyebrow">{e(t['label'])}</span>
    <h1>{e(t['headline'])}</h1>
    <p class="lede">{e(t['lede'])}</p>
    <a class="btn" href="{e(f['live'])}" target="_blank" rel="noopener">Open a real one &rarr;</a>
  </div>
  <div class="win">
    <div class="chrome"><i></i><i></i><i></i><span class="u">the rota, this week</span></div>
    <div class="body">{rows}</div>
  </div>
</div></section>"""


def hero_counter(t, f):
    """Ideas — one promise and a count. The cheapest question you can ask."""
    return f"""
<style>
.hero{{padding:clamp(56px,7vw,100px) 0;text-align:center;position:relative;overflow:hidden}}
.hero::before{{content:"";position:absolute;inset:-40% -20% auto -20%;height:130%;
  background:radial-gradient(40% 36% at 50% 0,color-mix(in srgb,var(--accent) 16%,transparent),
             transparent 68%);pointer-events:none}}
.hero .in{{position:relative}}
.hero h1{{font-size:clamp(2.3rem,5.4vw,3.8rem);font-weight:800;letter-spacing:-.036em;
  line-height:1.05;max-width:18ch;margin:0 auto 20px}}
.hero .lede{{color:var(--muted);font-size:1.1rem;max-width:54ch;margin:0 auto 30px}}
.count{{display:inline-flex;align-items:stretch;border:1px solid var(--line);border-radius:14px;
  overflow:hidden;background:var(--card);margin-top:40px;
  box-shadow:0 20px 44px rgba(14,21,18,.08)}}
.count .n{{padding:22px 30px;font-size:2.6rem;font-weight:800;letter-spacing:-.04em;
  color:var(--accent);font-variant-numeric:tabular-nums;line-height:1;
  display:grid;place-items:center}}
.count .l{{padding:20px 28px;border-left:1px solid var(--line);text-align:left;
  display:grid;align-content:center;gap:3px}}
.count .l b{{font-size:.95rem}}
.count .l span{{color:var(--muted);font-size:.85rem}}
</style>
<section class="hero"><div class="wrap in">
  <span class="eyebrow">{e(t['label'])}</span>
  <h1>{e(t['headline'])}</h1>
  <p class="lede">{e(t['lede'])}</p>
  <a class="btn" href="{e(f['live'])}" target="_blank" rel="noopener">Open a real funnel &rarr;</a>
  <div class="count">
    <div class="n">100</div>
    <div class="l"><b>the number worth chasing</b>
      <span>and the point at which you stop guessing</span></div>
  </div>
</div></section>"""


HEROES = {
    "arch": hero_arch, "index": hero_index, "ledger": hero_ledger, "objects": hero_objects,
    "manifest": hero_manifest, "card": hero_card, "syllabus": hero_syllabus,
    "poster": hero_poster, "window": hero_window, "counter": hero_counter,
}


# ---------------------------------------------------------------- the shared spine

def type_body(t: dict, types: list) -> str:
    f = t["facts"]
    gets = "".join(
        f'<div class="get"><div class="n">{n:02d}</div>'
        f'<div><h3>{e(title)}</h3><p>{e(body)}</p></div></div>'
        for n, (title, body) in enumerate(t["gets"], 1))
    pages = "".join(f'<span class="chip">{e(p)}</span>' for p in f["pages"])
    mods = "".join(f'<span class="chip">{e(m)}</span>' for m in f["modules"])

    i = [x["slug"] for x in types].index(t["slug"])
    nxt = types[(i + 1) % len(types)]
    prv = types[(i - 1) % len(types)]

    return f"""
{HEROES[t['art']['hero']](t, f)}

<section class="sec"><div class="wrap">
  <span class="eyebrow">What worries you</span>
  <h2 class="h2">{e(t['worry'])}</h2>
  <p class="sub">So the platform is composed around it, rather than around a feature list.
    Here is what {t['one'].lower()} gets on the day it goes live.</p>
  <div class="gets" style="margin-top:34px">{gets}</div>
</div></section>

<section class="sec" style="padding-top:0"><div class="wrap">
  <div class="inv">
    <div class="invbox">
      <h3>The public site · {f['n_pages']} pages</h3>
      <div class="chips">{pages}</div>
    </div>
    <div class="invbox">
      <h3>The back office · {f['n_modules']} modules</h3>
      <div class="chips">{mods}</div>
    </div>
  </div>
  <div class="rail">
    <span>Named by our own tooling, not by this page — <b>read from the build</b></span>
    <span>Built in <b>under a second</b></span>
    <span>Payments, email and analytics <b>wired, waiting on your keys</b></span>
  </div>
</div></section>

<section class="sec" style="padding-top:0"><div class="wrap">
  <div class="live">
    <div>
      <div class="lt">{e(f['business'])}{(' · ' + e(f['city'])) if f['city'] else ''}</div>
      <p>A fictional business, built by our tooling and published exactly as it came out —
        site, back office and all. Open it, click everything, and judge the work rather
        than the description of it.</p>
    </div>
    <div class="go">
      <a class="btn" href="{e(f['live'])}" target="_blank" rel="noopener">Open it &rarr;</a>
      <a class="btn ghost" href="{e(f['live'])}/platform/" target="_blank" rel="noopener">The back office</a>
    </div>
  </div>
</div></section>

<section class="sec" style="padding-top:0"><div class="wrap">
  <span class="eyebrow">And then</span>
  <h2 class="h2">The site is the start of the job, not the end of it.</h2>
  <p class="sub">Once it is live we can measure how findable you are across eight public
    channels, run a validation funnel before you commit to the next thing, and build
    whatever the standard shape does not cover.</p>
  <p style="margin-top:26px"><a class="btn ghost" href="index.html#capabilities">See the
    rest of what we build &rarr;</a></p>
  <div class="more">
    <span style="color:var(--muted);font-size:.9rem">Other kinds of business:</span>
    <a href="{e(prv['slug'])}.html">{e(prv['label'])}</a>
    <a href="{e(nxt['slug'])}.html">{e(nxt['label'])}</a>
    <a href="index.html">All ten</a>
  </div>
</div></section>

<section class="sec" id="start" style="padding-top:0"><div class="wrap">
  <div class="live" style="border-style:solid">
    <div>
      <div class="lt">Yours would not be fictional.</div>
      <p>Tell us what the business is in a paragraph. You get back the same thing you have
        just been clicking through, with your name on it and your words in it.</p>
    </div>
    <div class="go"><a class="btn" href="mailto:{CONTACT}?subject={e(t['one'])}">Start a conversation</a></div>
  </div>
</div></section>
"""


def type_page(t: dict, types: list) -> str:
    f = t["facts"]
    return page(
        title=f"{t['label']} — Vision Outreach Media",
        desc=f"{t['headline']} A {t['one'].lower()} gets a {f['n_pages']}-page site and a "
             f"{f['n_modules']}-module back office, built together.",
        theme=t["art"]["accent"],
        css=type_css(t),
        body=type_body(t, types),
        types=types)


# ===========================================================================
# the home page — the studio, and the ten doors off it
# ===========================================================================

HOME_CSS = """
:root{
  --ground:#F7F6F2; --ink:#141A22; --muted:#5A6472; --line:#E2E2DC; --card:#fff;
  --navy:#1B2A4A; --orange:#E8843C; --teal:#2FA8A0;
  --display:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  --body:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
}
body{background:var(--ground);color:var(--ink);font-family:var(--body);font-size:17px;
  line-height:1.62}
h1,h2,h3{font-family:var(--display);margin:0;text-wrap:balance;letter-spacing:-.03em}
p{margin:0}
.sec{padding:clamp(54px,7vw,96px) 0}
.eyebrow{font-size:12px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;
  color:var(--orange);display:block;margin-bottom:18px}
.h2{font-size:clamp(1.7rem,3.4vw,2.5rem);line-height:1.12;font-weight:800;margin-bottom:16px}
.sub{color:var(--muted);max-width:62ch;font-size:1.04rem}
.btn{display:inline-flex;align-items:center;gap:9px;text-decoration:none;font-weight:700;
  font-size:.95rem;padding:13px 24px;border-radius:999px;background:var(--navy);color:#fff;
  border:1px solid var(--navy);transition:transform .16s,box-shadow .2s}
.btn:hover{transform:translateY(-1px);box-shadow:0 12px 26px rgba(27,42,74,.28)}
.btn.o{background:var(--orange);border-color:var(--orange)}
.btn.ghost{background:transparent;color:var(--ink);border-color:#D4D4CC}
.btn.ghost:hover{border-color:var(--navy);box-shadow:none}

.hero{padding:clamp(58px,8vw,110px) 0 clamp(34px,4vw,56px);position:relative;overflow:hidden}
.hero::before{content:"";position:absolute;inset:-40% -20% auto -20%;height:150%;
  background:radial-gradient(46% 44% at 16% 6%,rgba(232,132,60,.16),transparent 66%),
             radial-gradient(40% 38% at 88% 0,rgba(47,168,160,.16),transparent 68%);
  pointer-events:none}
.hero .in{position:relative}
.hero h1{font-size:clamp(2.5rem,6.2vw,4.5rem);line-height:1.02;font-weight:800;
  max-width:17ch;margin-bottom:24px}
.hero .lede{color:var(--muted);font-size:clamp(1.08rem,2.1vw,1.32rem);max-width:60ch;
  margin-bottom:30px}
.hero .acts{display:flex;gap:12px;flex-wrap:wrap}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;background:var(--line);
  border:1px solid var(--line);border-radius:16px;overflow:hidden;margin-top:clamp(38px,5vw,58px)}
.stat{background:var(--ground);padding:24px 26px}
.stat b{display:block;font-size:1.9rem;font-weight:800;letter-spacing:-.04em;line-height:1;
  font-variant-numeric:tabular-nums}
.stat span{display:block;color:var(--muted);font-size:.84rem;margin-top:8px}
@media(max-width:800px){.stats{grid-template-columns:1fr 1fr}}

/* the ten doors — each card previews its own page's world */
.doors{display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
.door{position:relative;border-radius:18px;overflow:hidden;text-decoration:none;
  border:1px solid var(--line);display:block;background:var(--card);
  transition:transform .2s,box-shadow .2s}
.door:hover{transform:translateY(-4px);box-shadow:0 22px 48px rgba(20,26,34,.14)}
.door .top{height:112px;position:relative;display:grid;place-items:center;overflow:hidden}
.door .top .mk{width:64px;height:64px;border:1.5px solid currentColor;opacity:.85}
.door .bd{padding:20px 22px 22px}
.door .lb{font-size:1.12rem;font-weight:750;letter-spacing:-.02em;margin-bottom:5px}
.door .ln{color:var(--muted);font-size:.92rem}
.door .go{margin-top:14px;font-size:.85rem;font-weight:700;display:flex;gap:8px;
  align-items:center}

.caps{display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(250px,1fr))}
.cap{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:26px 24px}
.cap h3{font-size:1.14rem;font-weight:750;margin-bottom:8px}
.cap .one{color:var(--ink);font-weight:600;font-size:.98rem;margin-bottom:10px}
.cap p{color:var(--muted);font-size:.95rem}
.cap .pf{margin-top:14px;padding-top:14px;border-top:1px solid var(--line);
  color:var(--muted);font-size:.87rem}

.steps{display:grid;gap:0;counter-reset:s;border-top:1px solid var(--line)}
.step{counter-increment:s;display:grid;grid-template-columns:64px minmax(0,1fr);gap:22px;
  padding:26px 0;border-bottom:1px solid var(--line);align-items:start}
.step::before{content:counter(s,decimal-leading-zero);font-weight:800;color:var(--orange);
  font-variant-numeric:tabular-nums;font-size:.95rem;padding-top:3px}
.step h3{font-size:1.16rem;font-weight:750;margin-bottom:6px}
.step p{color:var(--muted);font-size:.97rem;max-width:64ch}

.band{background:var(--navy);color:#fff;border-radius:22px;padding:clamp(34px,5vw,60px);
  position:relative;overflow:hidden}
.band::after{content:"";position:absolute;inset:0;
  background:radial-gradient(50% 90% at 88% 0,rgba(232,132,60,.34),transparent 62%);
  pointer-events:none}
.band > *{position:relative}
.band h2{font-size:clamp(1.6rem,3.2vw,2.4rem);font-weight:800;margin-bottom:14px}
.band p{color:#C9D3E6;max-width:56ch;margin-bottom:26px}
"""


def door_card(t: dict) -> str:
    a = t["art"]
    f = t["facts"]
    # Each door is a two-second preview of the page behind it: that page's ground, its
    # accent and a mark cut to its own shape.
    marks = {
        "arch": "border-radius:32px 32px 3px 3px",
        "index": "border-radius:3px;border-width:1.5px 1.5px 1.5px 6px",
        "ledger": "border-radius:2px;border-style:dashed",
        "objects": "border-radius:50%",
        "manifest": "border-radius:8px;transform:rotate(6deg)",
        "card": "border-radius:10px;height:42px;transform:rotate(-6deg)",
        "syllabus": "border-radius:2px;border-width:1.5px 1.5px 1.5px 1.5px;"
                    "background:repeating-linear-gradient(180deg,transparent,transparent 11px,"
                    "currentColor 11px,currentColor 12px);opacity:.6",
        "poster": "border-radius:0;height:78px;width:54px",
        "window": "border-radius:7px;height:46px;border-width:14px 1.5px 1.5px",
        "counter": "border-radius:999px;height:44px;width:78px",
    }
    return f"""
  <a class="door" href="{e(t['slug'])}.html">
    <div class="top" style="background:{a['ground']};color:{a['accent']}">
      <span class="mk" style="{marks.get(a['hero'],'')}"></span>
    </div>
    <div class="bd">
      <div class="lb" style="font-family:{a['display']}">{e(t['label'])}</div>
      <div class="ln">{e(f['n_pages'])} pages · {e(f['n_modules'])} modules · a live example</div>
      <div class="go" style="color:{a['accent']}">See the page &rarr;</div>
    </div>
  </a>"""


def home_page(types: list) -> str:
    doors = "".join(door_card(t) for t in types)
    caps = "".join(
        f'<div class="cap"><h3>{e(c["title"])}</h3><p class="one">{e(c["one"])}</p>'
        f'<p>{e(c["body"])}</p><div class="pf">{e(c["proof"])}</div></div>'
        for c in data.CAPABILITIES)
    steps = "".join(
        f'<div class="step"><div><h3>{e(h)}</h3><p>{e(b)}</p></div></div>'
        for h, b in [
            ("Tell us what the business is",
             "A paragraph is enough: what it does, who for, what it charges. If it does not "
             "exist yet, that is a different and cheaper conversation — see validation funnels."),
            ("We build it, and you look at it",
             "Not a wireframe and not a slide. The actual site and the actual back office, "
             "live on a real address, seeded so it opens with something in it."),
            ("You say what is wrong",
             "It gets rebuilt, not patched — which is why changing your mind is cheap here "
             "and expensive elsewhere."),
            ("You run it",
             "Payments, email and analytics wired to your own accounts. We never hold your "
             "keys, and nothing is published, sent or charged without you saying so."),
        ])
    live_n = sum(1 for t in types if t["facts"]["live"])
    return page(
        title="What we build — Vision Outreach Media",
        desc="A studio in the Netherlands that builds the website and the back office "
             "behind it as one system. Ten kinds of business, each with a live example you "
             "can open.",
        theme="#1B2A4A",
        css=HOME_CSS,
        current="home",
        types=types,
        body=f"""
<section class="hero"><div class="wrap in">
  <span class="eyebrow">Vision Outreach Media</span>
  <h1>Your website and the office behind it, built as one thing.</h1>
  <p class="lede">Most businesses end up with a site from one supplier and a pile of
    spreadsheets from another, and then spend years typing everything into both. We build
    the two together — so what you type into Events is what a visitor reads on the site,
    and the thing you are shown is already working.</p>
  <div class="acts">
    <a class="btn o" href="#doors">See it for your kind of business</a>
    <a class="btn ghost" href="#capabilities">What else we build</a>
  </div>
  <div class="stats">
    <div class="stat"><b>10</b><span>kinds of business, each fully worked out</span></div>
    <div class="stat"><b>{live_n}</b><span>live examples you can open right now</span></div>
    <div class="stat"><b>&lt;1s</b><span>to build a complete platform</span></div>
    <div class="stat"><b>0</b><span>of your keys ever held by us</span></div>
  </div>
</div></section>

<section class="sec" id="doors"><div class="wrap">
  <span class="eyebrow">Pick the one you recognise</span>
  <h2 class="h2">Ten kinds of business. Ten different answers.</h2>
  <p class="sub">A church and a venue do not need the same website with a different photo
    on it, so they do not get one. Each page below is built in its own world — and each
    ends at a working example you can click through.</p>
  <div class="doors" style="margin-top:36px">{doors}</div>
</div></section>

<section class="sec" id="capabilities" style="padding-top:0"><div class="wrap">
  <span class="eyebrow">Capabilities</span>
  <h2 class="h2">Everything we build.</h2>
  <p class="sub">Platforms are the biggest piece, and they are not the whole studio.</p>
  <div class="caps" style="margin-top:34px">{caps}</div>
</div></section>

<section class="sec" style="padding-top:0"><div class="wrap">
  <span class="eyebrow">How it goes</span>
  <h2 class="h2">Four steps, and you are running it.</h2>
  <div class="steps" style="margin-top:30px">{steps}</div>
</div></section>

<section class="sec" id="start" style="padding-top:0"><div class="wrap">
  <div class="band">
    <h2>Tell us what the business is.</h2>
    <p>A paragraph is enough. You will get back the same thing you have been clicking
      through on this site — with your name on it, your words in it, and nothing published
      until you say so.</p>
    <a class="btn o" href="mailto:{CONTACT}?subject=Building%20something">Start a conversation</a>
  </div>
</div></section>
""")


# ===========================================================================
# write + publish
# ===========================================================================

def main():
    ap = argparse.ArgumentParser(description="Build the client gallery.")
    ap.add_argument("--deploy", action="store_true", help="deploy to production after building")
    args = ap.parse_args()

    types = data.all_types()
    missing = [t["slug"] for t in types if not t["facts"]["live"]]
    if missing:
        print("  warning: no published address on file for " + ", ".join(missing)
              + " — their pages will link nowhere. Run turnkey/forge/build.py --deploy first.")

    os.makedirs(PUBLIC, exist_ok=True)
    for name in os.listdir(PUBLIC):
        if name == ".vercel":
            continue
        p = os.path.join(PUBLIC, name)
        shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)

    pages = {"index.html": home_page(types)}
    for t in types:
        pages[f"{t['slug']}.html"] = type_page(t, types)

    for name, body in pages.items():
        with open(os.path.join(PUBLIC, name), "w", encoding="utf-8") as f:
            f.write(body)
        print(f"  {name:<22} {len(body)//1024} KB")

    with open(os.path.join(PUBLIC, "vercel.json"), "w", encoding="utf-8") as f:
        json.dump({"cleanUrls": True, "trailingSlash": False}, f, indent=2)

    print(f"\npublic/ assembled — {len(pages)} pages")

    if args.deploy:
        cli = shutil.which("vercel")
        if not cli:
            raise SystemExit("vercel CLI not found")
        link = subprocess.run([cli, "link", "--yes", "--project", "vom-gallery"],
                              cwd=PUBLIC, capture_output=True, text=True, timeout=300)
        if link.returncode != 0:
            raise SystemExit("could not link the project:\n"
                             + ((link.stdout or "") + (link.stderr or ""))[-600:])
        for junk in (".env.local", ".env"):
            p = os.path.join(PUBLIC, junk)
            if os.path.exists(p):
                os.remove(p)
        print("deploying …")
        r = subprocess.run([cli, "deploy", "--prod", "--yes"], cwd=PUBLIC,
                           capture_output=True, text=True, timeout=900)
        out = (r.stdout or "") + "\n" + (r.stderr or "")
        print(out.strip()[-900:])
        if r.returncode != 0:
            raise SystemExit("deploy failed")
        subprocess.run([cli, "project", "protection", "disable", "--sso"],
                       cwd=PUBLIC, capture_output=True, text=True, timeout=180)

        def pick(text):
            return next((w for w in text.split()
                         if w.startswith("https://") and "vercel.com/" not in w), "")
        alias = ""
        for line in out.splitlines():
            if "Aliased" in line:
                alias = pick(line)
        print("\nLIVE:", alias or pick(r.stdout or "") or "(no public URL printed)")


if __name__ == "__main__":
    main()
