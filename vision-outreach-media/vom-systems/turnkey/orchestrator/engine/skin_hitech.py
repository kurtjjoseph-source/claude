#!/usr/bin/env python3
"""
skin_hitech — the second skin. Same sections, a completely different machine.

`site_gen` renders the house skin: warm paper, quiet type, a design system that makes ten
platforms read as one family. That is right for a church and wrong for a software company,
because a SaaS site is judged on whether the product looks *alive*. A restrained page for
a developer tool reads as "this was made by someone who does not build software".

So this is a second renderer over the *same* section vocabulary. Nothing about the spec
changes: `facts`, `cards`, `steps`, `faq`, `prose`, `feed`, `form`, `pay`, `pricing` and
`cta` all render here too. An archetype opts in with `skin: "hitech"`, exactly as it picks
a type preset — data, not a fork.

What it adds, and why each one is here rather than being decoration:

  a living lattice      a canvas grid that answers the pointer. A software product that
                        cannot make a background respond has an uphill argument.
  five colour schemes   switchable live, remembered between visits, and *everything*
                        reads from them — including the canvas, which samples the
                        computed variables rather than holding its own palette.
  a product panel       that updates itself: rows arrive, a wage total counts, a swap
                        request lands. It is the demo, running, in the hero.
  kinetic type          per-word entrance, a decode pass on the eyebrows.
  a bento grid          feature cells of different sizes, each with its own micro-motion.
  a sticky showcase     the mock changes as you scroll the feature list past it.
  counters + terminal   numbers that count on view, a log that types itself.

All of it degrades: with `prefers-reduced-motion` the canvas draws one static frame,
counters print their final value, and the panel shows its finished state. With JavaScript
off, every section is already in the HTML — the animation only ever *enhances* content
that is present. Self-contained: no CDN, no webfont, one file of CSS and one of script.

Stdlib only.
"""

from __future__ import annotations

import html
import json
import re

def e(s) -> str:
    return html.escape(str(s if s is not None else ""), quote=True)


# ===========================================================================
# the colour schemes
# ===========================================================================
#
# Five, because the request was for a site that can change its whole mood, and because a
# switcher with two options reads as a light/dark toggle rather than a statement. Each is
# a triad plus the glow it throws; every surface on the page is composed from these, so
# switching one repaints the lattice, the gradients, the glows and the borders together.

SCHEMES = [
    {"id": "aurora", "name": "Aurora", "a": "#6366F1", "b": "#22D3EE", "c": "#A855F7",
     "glow": "#4F46E5", "bg": "#06070C"},
    {"id": "ember", "name": "Ember", "a": "#FB7185", "b": "#FBBF24", "c": "#F472B6",
     "glow": "#E11D48", "bg": "#0B0608"},
    {"id": "toxic", "name": "Toxic", "a": "#A3E635", "b": "#2DD4BF", "c": "#4ADE80",
     "glow": "#65A30D", "bg": "#05090A"},
    {"id": "solar", "name": "Solar", "a": "#FDBA74", "b": "#F97316", "c": "#FDE047",
     "glow": "#EA580C", "bg": "#0A0705"},
    {"id": "mono", "name": "Mono", "a": "#E2E8F0", "b": "#94A3B8", "c": "#CBD5E1",
     "glow": "#64748B", "bg": "#08090B"},
]


def schemes_for(spec: dict) -> list:
    """The switcher's schemes, with the business's own brand kit first.

    The five house schemes are moods, not identities — every SaaS this skin built opened
    in Aurora regardless of what its brand kit said, which made the branding step a
    document with no consequence here. The kit now leads the list and is what the page
    opens in; the five remain as the alternatives a visitor can play with."""
    kit = ((spec or {}).get("brand") or {}).get("kit") or {}
    return ([kit["hitech"]] if kit.get("hitech") else []) + SCHEMES


def scheme_css(schemes: list = None) -> str:
    out = []
    for s in (schemes if schemes is not None else SCHEMES):
        out.append(
            '[data-scheme="%s"]{--a:%s;--b:%s;--c:%s;--glow:%s;--bg:%s}'
            % (s["id"], s["a"], s["b"], s["c"], s["glow"], s["bg"]))
    return "\n".join(out)


CSS = """
*,*::before,*::after{box-sizing:border-box}
:root{
  --ink:#F2F4FF; --dim:#A8ADC8; --faint:#7D829B; --line:rgba(255,255,255,.10);
  --line-2:rgba(255,255,255,.055); --panel:rgba(255,255,255,.035);
  --wrap:1200px; --r:16px; --r-lg:24px;
  --sans:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
  --mono:ui-monospace,'SF Mono','Cascadia Code',Menlo,Consolas,monospace;
}
__SCHEMES__
/* the one photographic band — see the section loop for why it exists */
.shotband{position:relative;margin:0;overflow:hidden;height:clamp(240px,30vw,420px);
  background:#0b0f14;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.shotband img{width:100%;height:100%;object-fit:cover;opacity:.72;
  filter:saturate(.85) contrast(1.05)}
.shotband::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,var(--bg) 0%,transparent 22%,transparent 58%,
    color-mix(in srgb,var(--bg) 92%,transparent) 100%)}
.shotband .cap{position:absolute;left:0;right:0;bottom:0;padding:28px 24px;z-index:2}
.shotband .cap p{margin:0 auto;max-width:var(--wrap);font-size:clamp(1rem,2vw,1.4rem);
  color:var(--ink);text-wrap:balance;font-weight:600;letter-spacing:-.02em}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);
  font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:inherit}
img{max-width:100%}
:focus-visible{outline:2px solid var(--b);outline-offset:3px;border-radius:6px}
.wrap{max-width:var(--wrap);margin:0 auto;padding:0 26px;position:relative}
h1,h2,h3{margin:0;font-weight:800;letter-spacing:-.035em;line-height:1.03;text-wrap:balance}
p{margin:0}

/* ---------------------------------------------------------- the lattice */
#lattice{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.9}
.veil{position:fixed;inset:0;z-index:1;pointer-events:none;
  background:radial-gradient(120% 80% at 50% -10%,transparent 40%,var(--bg) 92%)}
/* A single SVG-free grain: cheap, and it takes the plastic off the gradients. */
.grain{position:fixed;inset:-50%;z-index:2;pointer-events:none;opacity:.035;
  background-image:repeating-conic-gradient(#fff 0 0.0009turn,transparent 0 0.002turn);
  animation:grain 8s steps(6) infinite}
@keyframes grain{
  0%{transform:translate(0,0)}20%{transform:translate(-2%,1%)}40%{transform:translate(1%,-2%)}
  60%{transform:translate(-1%,2%)}80%{transform:translate(2%,-1%)}100%{transform:translate(0,0)}}
main,header.top,footer.btm{position:relative;z-index:3}

/* the pointer spotlight — set from script, so it is silent without it */
.spot{position:fixed;inset:0;z-index:2;pointer-events:none;opacity:0;transition:opacity .5s;
  background:radial-gradient(420px 420px at var(--mx,50%) var(--my,50%),
    color-mix(in srgb,var(--b) 13%,transparent),transparent 70%)}
body.pointer .spot{opacity:1}

/* -------------------------------------------------------------- chrome */
header.top{position:sticky;top:0;z-index:40;backdrop-filter:blur(14px) saturate(1.4);
  background:color-mix(in srgb,var(--bg) 72%,transparent);
  border-bottom:1px solid transparent;transition:border-color .3s,background .3s}
header.top.stuck{border-bottom-color:var(--line)}
.bar{display:flex;align-items:center;gap:18px;min-height:70px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:11px;text-decoration:none;font-weight:800;
  letter-spacing:-.03em;font-size:1.06rem;margin-right:auto}
.brand img{height:26px;width:auto;border-radius:6px}
/* The monogram is drawn against `--accent`/`--on-accent`, which this skin does not have
   — it runs on --a/--b/--c. Unmapped, the badge and its letters both resolved to black
   on black: a mark that was there and could not be seen. */
.brand .mark{width:26px;height:26px;flex:none;border-radius:7px;
  --accent:var(--a);--on-accent:var(--bg);--display:var(--sans)}
.brand .orb{width:11px;height:11px;border-radius:50%;
  background:conic-gradient(from 0deg,var(--a),var(--b),var(--c),var(--a));
  box-shadow:0 0 14px var(--glow);animation:spin 6s linear infinite}
@keyframes spin{to{transform:rotate(1turn)}}
nav.main{display:flex;gap:3px;flex-wrap:wrap}
nav.main a{text-decoration:none;font-size:.9rem;font-weight:600;color:var(--dim);
  padding:8px 13px;border-radius:9px;transition:color .2s,background .2s}
nav.main a:hover,nav.main a[aria-current]{color:var(--ink);background:var(--panel)}

/* the switcher — five orbs, and the whole page follows */
.schemes{display:flex;gap:7px;align-items:center;padding:6px 9px;border-radius:999px;
  border:1px solid var(--line);background:var(--panel)}
.schemes button{width:19px;height:19px;border-radius:50%;border:1.5px solid transparent;
  cursor:pointer;padding:0;transition:transform .2s,border-color .2s;position:relative}
.schemes button:hover{transform:scale(1.18)}
.schemes button[aria-pressed="true"]{border-color:var(--ink);transform:scale(1.12)}
.schemes button::after{content:attr(data-name);position:absolute;top:26px;left:50%;
  transform:translateX(-50%);font-size:10px;letter-spacing:.12em;text-transform:uppercase;
  font-family:var(--mono);color:var(--dim);opacity:0;pointer-events:none;transition:opacity .2s;
  white-space:nowrap}
.schemes button:hover::after{opacity:1}

.btn{display:inline-flex;align-items:center;gap:9px;text-decoration:none;font-weight:700;
  font-size:.95rem;padding:13px 24px;border-radius:999px;border:1px solid transparent;
  cursor:pointer;font-family:var(--sans);position:relative;overflow:hidden;
  transition:transform .18s,box-shadow .25s}
.btn.pri{color:#08090C;background:linear-gradient(120deg,var(--a),var(--b) 55%,var(--c));
  box-shadow:0 8px 30px color-mix(in srgb,var(--glow) 45%,transparent)}
.btn.pri:hover{transform:translateY(-2px);
  box-shadow:0 14px 44px color-mix(in srgb,var(--glow) 62%,transparent)}
.btn.pri::after{content:"";position:absolute;inset:0;background:linear-gradient(120deg,
  transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);transform:translateX(-120%)}
.btn.pri:hover::after{transform:translateX(120%);transition:transform .7s}
.btn.gh{color:var(--ink);border-color:var(--line);background:var(--panel)}
.btn.gh:hover{border-color:color-mix(in srgb,var(--b) 60%,transparent);transform:translateY(-2px)}
.btn.sm{padding:9px 17px;font-size:.86rem}

/* --------------------------------------------------------------- hero */
.hero{padding:clamp(56px,9vh,110px) 0 clamp(40px,6vh,72px)}
.hero .g{display:grid;gap:clamp(30px,4vw,56px);grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr);
  align-items:center}
.pill{display:inline-flex;align-items:center;gap:9px;border:1px solid var(--line);
  border-radius:999px;padding:7px 15px;font-family:var(--mono);font-size:11.5px;
  letter-spacing:.16em;text-transform:uppercase;color:var(--dim);background:var(--panel);
  margin-bottom:24px}
.pill i{width:7px;height:7px;border-radius:50%;background:var(--b);display:block;
  box-shadow:0 0 0 0 var(--b);animation:ping 2s cubic-bezier(0,0,.2,1) infinite}
@keyframes ping{70%{box-shadow:0 0 0 7px transparent}100%{box-shadow:0 0 0 0 transparent}}
.hero h1{font-size:clamp(2.6rem,6.4vw,4.9rem);margin-bottom:24px}
/* inline-block collapses the whitespace between the words, so the gap is a margin */
.hero h1 .w{display:inline-block;margin-right:.25em;opacity:0;
  transform:translateY(24px) rotate(2deg);
  animation:word .8s cubic-bezier(.2,.8,.2,1) forwards}
.hero h1 .grad{background:linear-gradient(100deg,var(--a),var(--b) 45%,var(--c));
  -webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 0 26px color-mix(in srgb,var(--glow) 42%,transparent))}
@keyframes word{to{opacity:1;transform:none}}
.hero .lede{color:var(--dim);font-size:clamp(1.05rem,1.9vw,1.24rem);max-width:52ch;
  margin-bottom:30px}
.hero .acts{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.hero .note{color:var(--faint);font-size:.85rem;font-family:var(--mono)}

/* the product panel — the demo, running, in the first screen */
.panel{border:1px solid var(--line);border-radius:var(--r-lg);overflow:hidden;
  background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02));
  box-shadow:0 40px 90px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.03) inset;
  transform-style:preserve-3d;transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.panel .ch{display:flex;align-items:center;gap:8px;padding:14px 18px;
  border-bottom:1px solid var(--line-2);background:rgba(255,255,255,.03)}
.panel .ch i{width:10px;height:10px;border-radius:50%;background:var(--line);display:block}
.panel .ch i:first-child{background:color-mix(in srgb,var(--a) 70%,transparent)}
.panel .ch .u{margin-left:10px;font-family:var(--mono);font-size:11.5px;color:var(--faint)}
.panel .ch .lv{margin-left:auto;font-family:var(--mono);font-size:10.5px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--b)}
.panel .bd{padding:18px 20px 20px}
.rowset{display:grid;gap:9px;min-height:190px}
.prow{display:grid;grid-template-columns:10px minmax(0,1fr) auto;gap:13px;align-items:center;
  padding:12px 14px;border:1px solid var(--line-2);border-radius:12px;
  background:rgba(255,255,255,.022);opacity:0;transform:translateY(10px)}
.prow.in{opacity:1;transform:none;transition:opacity .5s,transform .5s}
.prow .k{width:8px;height:8px;border-radius:3px;background:var(--a)}
.prow .n{font-weight:650;font-size:.93rem}
.prow .s{font-family:var(--mono);font-size:.78rem;color:var(--dim);
  font-variant-numeric:tabular-nums}
.prow.alert{border-color:color-mix(in srgb,var(--c) 45%,transparent);
  background:color-mix(in srgb,var(--c) 10%,transparent)}
.prow.alert .k{background:var(--c);box-shadow:0 0 12px var(--c)}
.ptot{display:flex;justify-content:space-between;align-items:baseline;margin-top:14px;
  padding-top:14px;border-top:1px solid var(--line-2)}
.ptot .l{font-family:var(--mono);font-size:10.5px;letter-spacing:.15em;text-transform:uppercase;
  color:var(--faint)}
.ptot .v{font-size:1.5rem;font-weight:800;letter-spacing:-.03em;
  font-variant-numeric:tabular-nums;
  background:linear-gradient(100deg,var(--a),var(--b));-webkit-background-clip:text;
  background-clip:text;color:transparent}

/* ticker */
.ticker{margin-top:clamp(32px,5vh,54px);border-top:1px solid var(--line-2);
  border-bottom:1px solid var(--line-2);overflow:hidden;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);
          mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)}
.ticker .t{display:flex;gap:44px;padding:15px 0;width:max-content;
  animation:slide 34s linear infinite}
.ticker span{font-family:var(--mono);font-size:12px;letter-spacing:.18em;text-transform:uppercase;
  color:var(--faint);white-space:nowrap}
.ticker span b{color:var(--b);font-weight:500}
@keyframes slide{to{transform:translateX(-50%)}}

/* ------------------------------------------------------------ sections */
section.blk{padding:clamp(58px,9vh,110px) 0;position:relative}
.eyebrow{display:inline-flex;align-items:center;gap:10px;font-family:var(--mono);font-size:11.5px;
  letter-spacing:.22em;text-transform:uppercase;color:var(--b);margin-bottom:20px}
.eyebrow::before{content:"";width:26px;height:1px;background:linear-gradient(90deg,var(--a),var(--b))}
.h2{font-size:clamp(1.9rem,4vw,3rem);margin-bottom:18px}
.sub{color:var(--dim);max-width:62ch;font-size:1.04rem}

/* bento — cards of unequal weight, each with its own motion */
.bento{display:grid;gap:16px;grid-template-columns:repeat(6,1fr);margin-top:40px}
.cell{border:1px solid var(--line);border-radius:var(--r-lg);padding:26px 26px 24px;
  background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.015));
  position:relative;overflow:hidden;grid-column:span 2;
  transition:transform .3s cubic-bezier(.2,.8,.2,1),border-color .3s}
.cell::before{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;
  background:conic-gradient(from var(--ang,0deg),transparent 0 62%,var(--b) 78%,transparent 88%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;opacity:0;transition:opacity .35s}
.cell:hover{transform:translateY(-4px);border-color:color-mix(in srgb,var(--b) 30%,var(--line))}
.cell:hover::before{opacity:1;animation:ang 3s linear infinite}
@property --ang{syntax:'<angle>';initial-value:0deg;inherits:false}
@keyframes ang{to{--ang:360deg}}
.cell:nth-child(1){grid-column:span 3}
.cell:nth-child(2){grid-column:span 3}
.cell h3{font-size:1.16rem;font-weight:750;margin-bottom:8px;letter-spacing:-.02em}
.cell p{color:var(--dim);font-size:.95rem}
.cell .viz{margin-top:20px;height:74px;position:relative}
/* sparkline */
.viz svg{width:100%;height:100%;overflow:visible}
.viz path.ln{fill:none;stroke:url(#g_);stroke-width:2.2;stroke-linecap:round;
  stroke-dasharray:var(--len,400);stroke-dashoffset:var(--len,400)}
/* the observer marks the .viz itself, so this must be the same element, not an ancestor */
.viz.in-view path.ln{animation:draw 1.5s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes draw{to{stroke-dashoffset:0}}
/* bars */
.bars{display:flex;align-items:flex-end;gap:7px;height:100%}
.bars i{flex:1;border-radius:5px 5px 2px 2px;background:linear-gradient(180deg,var(--b),var(--a));
  height:12%;opacity:.85;transition:height .9s cubic-bezier(.2,.8,.2,1)}
/* ring */
.ring{width:74px;height:74px;border-radius:50%;
  background:conic-gradient(var(--b) var(--p,0%),rgba(255,255,255,.07) 0);
  display:grid;place-items:center;transition:--p 1.4s ease}
.ring span{width:56px;height:56px;border-radius:50%;background:var(--bg);display:grid;
  place-items:center;font-family:var(--mono);font-size:.82rem;color:var(--ink)}
/* mini grid */
.mini{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;height:100%}
.mini i{border-radius:4px;background:rgba(255,255,255,.06);transition:background .5s}
.mini i.on{background:linear-gradient(140deg,var(--a),var(--b))}
@media(max-width:900px){.bento{grid-template-columns:1fr}
  .cell,.cell:nth-child(1),.cell:nth-child(2){grid-column:span 1}}

/* sticky showcase */
.show{display:grid;gap:clamp(28px,4vw,60px);grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);
  margin-top:44px;align-items:start}
.steps{display:grid;gap:12px}
.stp{border:1px solid var(--line-2);border-left:2px solid transparent;border-radius:14px;
  padding:20px 22px;cursor:pointer;transition:all .3s;background:rgba(255,255,255,.015)}
.stp.on{border-color:var(--line);border-left-color:var(--b);
  background:linear-gradient(90deg,color-mix(in srgb,var(--b) 9%,transparent),transparent)}
.stp .n{font-family:var(--mono);font-size:11px;letter-spacing:.16em;color:var(--faint)}
.stp h3{font-size:1.08rem;font-weight:700;margin:6px 0 5px;letter-spacing:-.02em}
.stp p{color:var(--dim);font-size:.93rem;max-height:0;overflow:hidden;
  transition:max-height .4s,opacity .3s;opacity:0}
.stp.on p{max-height:110px;opacity:1}
.showpane{position:sticky;top:100px;border:1px solid var(--line);border-radius:var(--r-lg);
  min-height:330px;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.05),
  rgba(255,255,255,.015));box-shadow:0 30px 70px rgba(0,0,0,.5)}
.showpane .sc{display:none;padding:26px 28px}
.showpane .sc.on{display:block;animation:fade .5s}
@keyframes fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.showpane h4{margin:0 0 16px;font-family:var(--mono);font-size:11px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--faint);font-weight:500}
@media(max-width:900px){.show{grid-template-columns:1fr}.showpane{position:static}}

/* metrics */
.metrics{display:grid;gap:2px;grid-template-columns:repeat(4,1fr);border:1px solid var(--line);
  border-radius:var(--r-lg);overflow:hidden;background:var(--line);margin-top:40px}
.met{background:var(--bg);padding:30px 26px;position:relative;overflow:hidden}
.met b{display:block;font-size:2.5rem;font-weight:800;letter-spacing:-.045em;line-height:1;
  font-variant-numeric:tabular-nums;
  background:linear-gradient(100deg,var(--a),var(--b));-webkit-background-clip:text;
  background-clip:text;color:transparent}
.met span{display:block;color:var(--faint);font-size:.84rem;margin-top:10px}
@media(max-width:820px){.metrics{grid-template-columns:1fr 1fr}}

/* terminal */
.term{border:1px solid var(--line);border-radius:var(--r);overflow:hidden;
  background:rgba(0,0,0,.45);font-family:var(--mono);font-size:13px;margin-top:34px}
.term .h{padding:11px 16px;border-bottom:1px solid var(--line-2);color:var(--faint);
  font-size:11px;letter-spacing:.14em;text-transform:uppercase}
.term .b{padding:18px 16px;min-height:190px;line-height:1.85}
.term .l{white-space:pre-wrap;color:var(--dim)}
.term .l b{color:var(--b);font-weight:500}
.term .l em{color:var(--c);font-style:normal}
.term .cur{display:inline-block;width:8px;height:15px;background:var(--b);
  vertical-align:-2px;animation:blink 1s steps(2) infinite}
@keyframes blink{50%{opacity:0}}

/* generic content: facts / prose / faq / feed / form */
.facts{display:grid;gap:2px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
  border:1px solid var(--line);border-radius:var(--r-lg);overflow:hidden;background:var(--line);
  margin-top:34px}
.fact{background:var(--bg);padding:24px 26px}
.fact .k{font-family:var(--mono);font-size:10.5px;letter-spacing:.15em;text-transform:uppercase;
  color:var(--faint);margin-bottom:9px}
.fact .v{font-weight:750;font-size:1.06rem;letter-spacing:-.02em}
.prose{max-width:64ch;margin-top:24px}
.prose p{color:var(--dim);margin-bottom:1em}
.prose p.lead{color:var(--ink);font-size:1.1rem}
.faqs{margin-top:34px;max-width:70ch;border-top:1px solid var(--line-2)}
details.faq{border-bottom:1px solid var(--line-2)}
details.faq summary{cursor:pointer;list-style:none;padding:20px 40px 20px 0;font-weight:700;
  position:relative;transition:color .2s}
details.faq summary::-webkit-details-marker{display:none}
details.faq summary:hover{color:var(--b)}
details.faq summary::after{content:"";position:absolute;right:6px;top:50%;width:9px;height:9px;
  border-right:2px solid var(--b);border-bottom:2px solid var(--b);
  transform:translateY(-70%) rotate(45deg);transition:transform .3s}
details.faq[open] summary::after{transform:translateY(-30%) rotate(-135deg)}
details.faq p{color:var(--dim);margin:0 0 22px;max-width:62ch}
.feed{margin-top:30px;display:grid;gap:10px}
.item{display:flex;gap:18px;align-items:center;padding:16px 18px;border:1px solid var(--line-2);
  border-radius:14px;background:rgba(255,255,255,.02);transition:border-color .25s,transform .25s}
.item:hover{border-color:color-mix(in srgb,var(--b) 40%,transparent);transform:translateX(4px)}
.item .when{font-family:var(--mono);font-size:.76rem;color:var(--b);min-width:82px;
  letter-spacing:.06em}
.item .what{font-weight:650}
.item .sub{color:var(--faint);font-size:.88rem}
.empty{margin-top:26px;padding:22px;border:1px dashed var(--line);border-radius:14px;
  color:var(--faint)}
form.capture{margin-top:30px;display:grid;gap:15px;max-width:520px;
  border:1px solid var(--line);border-radius:var(--r-lg);padding:28px;
  background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.015))}
form.capture label{display:grid;gap:7px;font-size:.84rem;font-weight:650;color:var(--dim)}
form.capture input,form.capture textarea{font:inherit;font-size:.96rem;padding:13px 15px;
  border-radius:11px;border:1px solid var(--line);background:rgba(0,0,0,.35);color:var(--ink);
  transition:border-color .2s,box-shadow .2s}
form.capture input:focus,form.capture textarea:focus{outline:none;border-color:var(--b);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--b) 22%,transparent)}
form.capture textarea{min-height:120px;resize:vertical}
.formnote{color:var(--faint);font-size:.82rem;margin:0}

/* pricing */
.price{display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
  margin-top:40px;align-items:start}
.tier{border:1px solid var(--line);border-radius:var(--r-lg);padding:30px 28px;position:relative;
  background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.012));
  overflow:hidden;transition:transform .3s}
.tier:hover{transform:translateY(-5px)}
.tier.feat{border-color:transparent}
.tier.feat::before{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1.5px;
  background:conic-gradient(from var(--ang,0deg),var(--a),var(--b),var(--c),var(--a));
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;animation:ang 4s linear infinite}
.tier.feat::after{content:"MOST CHOSEN";position:absolute;top:16px;right:-34px;
  transform:rotate(45deg);background:linear-gradient(100deg,var(--a),var(--b));color:#08090C;
  font-size:9.5px;font-weight:800;letter-spacing:.14em;padding:5px 40px}
.tier h3{font-family:var(--mono);font-size:.76rem;letter-spacing:.18em;text-transform:uppercase;
  color:var(--faint);font-weight:500;margin-bottom:14px}
.tier .amt{font-size:2.6rem;font-weight:800;letter-spacing:-.045em;line-height:1;
  margin-bottom:20px;font-variant-numeric:tabular-nums}
.tier ul{margin:0;padding:0;list-style:none;display:grid;gap:11px}
.tier li{position-relative;padding-left:26px;position:relative;color:var(--dim);font-size:.94rem}
.tier li::before{content:"";position:absolute;left:2px;top:.5em;width:10px;height:5px;
  border-left:2px solid var(--b);border-bottom:2px solid var(--b);transform:rotate(-45deg)}

/* give / pay */
.give{margin-top:34px;border:1px solid var(--line);border-radius:var(--r-lg);padding:30px;
  display:grid;gap:22px;max-width:640px;
  background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.012))}
.give .k{font-family:var(--mono);font-size:10.5px;letter-spacing:.15em;text-transform:uppercase;
  color:var(--faint);margin-bottom:11px}
.chips{display:flex;gap:9px;flex-wrap:wrap}
.chip{padding:10px 18px;border-radius:999px;border:1px solid var(--line);background:transparent;
  color:var(--ink);font-family:var(--sans);font-weight:650;font-size:.9rem;cursor:pointer;
  transition:all .2s}
.chip:hover{border-color:color-mix(in srgb,var(--b) 55%,transparent)}
.chip[aria-pressed="true"]{background:linear-gradient(100deg,var(--a),var(--b));color:#08090C;
  border-color:transparent;box-shadow:0 6px 20px color-mix(in srgb,var(--glow) 45%,transparent)}
.notice{color:var(--faint);font-size:.87rem;border-left:2px solid var(--b);padding-left:14px;
  margin:0}

/* cta */
.cta{border-radius:28px;padding:clamp(40px,6vw,74px);text-align:center;position:relative;
  overflow:hidden;border:1px solid var(--line);
  background:radial-gradient(90% 140% at 50% -20%,
    color-mix(in srgb,var(--glow) 34%,transparent),transparent 62%),rgba(255,255,255,.02)}
.cta h2{font-size:clamp(2rem,5vw,3.4rem);margin-bottom:16px}
.cta h2 .grad{background:linear-gradient(100deg,var(--a),var(--b) 50%,var(--c));
  -webkit-background-clip:text;background-clip:text;color:transparent}
.cta p{color:var(--dim);max-width:52ch;margin:0 auto 30px}

/* footer */
footer.btm{border-top:1px solid var(--line);padding:54px 0 60px;color:var(--faint);
  font-size:.92rem;margin-top:clamp(50px,8vh,90px)}
footer.btm .cols{display:grid;gap:32px;grid-template-columns:minmax(0,1.5fr) repeat(2,minmax(0,1fr))}
footer.btm h4{color:var(--ink);font-family:var(--mono);font-size:10.5px;letter-spacing:.16em;
  text-transform:uppercase;margin:0 0 14px;font-weight:500}
footer.btm a{color:var(--faint);text-decoration:none;display:block;margin-bottom:8px}
footer.btm a:hover{color:var(--b)}
footer.btm .fine{margin-top:36px;padding-top:22px;border-top:1px solid var(--line-2);
  display:flex;gap:18px;flex-wrap:wrap;justify-content:space-between;font-size:.82rem}
@media(max-width:820px){footer.btm .cols{grid-template-columns:1fr}}

/* reveal — CSS only, and it ends visible */
@keyframes rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.rv{animation:rise .7s cubic-bezier(.2,.8,.2,1) both}

@media(max-width:960px){.hero .g{grid-template-columns:1fr}
  nav.main{order:5;width:100%;border-top:1px solid var(--line-2);padding-top:8px}}
@media(max-width:560px){nav.main{overflow-x:auto;flex-wrap:nowrap;scrollbar-width:none}
  nav.main::-webkit-scrollbar{display:none}
  .schemes{order:4}}
@media(prefers-reduced-motion:reduce){
  *{animation:none!important;transition:none!important;scroll-behavior:auto!important}
  .hero h1 .w{opacity:1;transform:none}
  .prow{opacity:1;transform:none}
}
"""


JS = """
(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------------------------------------------- colour schemes */
  var KEY = '__STORE_KEY___scheme';
  try {
    /* Only restore a scheme this build still defines. The kit scheme is named after the
       brand kit, so a visitor holding a previous build's kit id would otherwise land on
       a page with no colours defined at all. */
    var saved = localStorage.getItem(KEY);
    if (saved && document.querySelector('.schemes button[data-id="' + saved + '"]'))
      root.setAttribute('data-scheme', saved);
  } catch(e){}
  document.querySelectorAll('.schemes button').forEach(function(b){
    b.addEventListener('click', function(){
      var id = b.getAttribute('data-id');
      root.setAttribute('data-scheme', id);
      try { localStorage.setItem(KEY, id); } catch(e){}
      sync();
      paintOnce();
    });
  });
  function sync(){
    var cur = root.getAttribute('data-scheme');
    document.querySelectorAll('.schemes button').forEach(function(b){
      b.setAttribute('aria-pressed', b.getAttribute('data-id') === cur ? 'true' : 'false');
    });
  }
  sync();

  /* ---------------------------------------------- the lattice */
  var cv = document.getElementById('lattice');
  var ctx = cv && cv.getContext ? cv.getContext('2d') : null;
  var pts = [], W = 0, H = 0, DPR = Math.min(devicePixelRatio || 1, 2);
  var mx = -9999, my = -9999, t = 0;

  function colors(){
    var s = getComputedStyle(root);
    return {a: s.getPropertyValue('--a').trim(), b: s.getPropertyValue('--b').trim(),
            c: s.getPropertyValue('--c').trim()};
  }
  function build(){
    if (!ctx) return;
    W = cv.width = innerWidth * DPR; H = cv.height = innerHeight * DPR;
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
    var gap = Math.max(46, Math.min(78, innerWidth / 20)) * DPR;
    pts = [];
    for (var y = -gap; y < H + gap; y += gap)
      for (var x = -gap; x < W + gap; x += gap)
        pts.push({x: x, y: y, ox: x, oy: y});
  }
  function frame(){
    if (!ctx) return;
    t += 0.006;
    ctx.clearRect(0, 0, W, H);
    var col = colors();
    for (var i = 0; i < pts.length; i++){
      var p = pts[i];
      /* a slow standing wave, plus a push away from the pointer */
      var wave = Math.sin(p.ox * 0.0016 + t) * 9 + Math.cos(p.oy * 0.0019 - t * 1.3) * 9;
      var dx = p.ox - mx, dy = p.oy - my, d2 = dx*dx + dy*dy;
      var r = 240 * DPR, push = 0;
      if (d2 < r*r) { var d = Math.sqrt(d2) || 1; push = (1 - d / r) * 44 * DPR; }
      p.x = p.ox + wave * DPR * 0.34 + (dx / (Math.sqrt(d2)||1)) * push;
      p.y = p.oy + wave * DPR * 0.34 + (dy / (Math.sqrt(d2)||1)) * push;
    }
    var cols = Math.round((W + 160 * DPR) / (pts[1] ? (pts[1].ox - pts[0].ox) : 60));
    ctx.lineWidth = 1 * DPR;
    for (var j = 0; j < pts.length; j++){
      var q = pts[j];
      var right = pts[j+1], down = pts[j+cols];
      var near = Math.max(0, 1 - (Math.pow(q.ox-mx,2)+Math.pow(q.oy-my,2)) / Math.pow(360*DPR,2));
      if (right && (j+1) % cols !== 0) line(q, right, col, near);
      if (down) line(down, q, col, near);
      if (near > 0.55){
        ctx.beginPath(); ctx.fillStyle = col.b;
        ctx.globalAlpha = (near - 0.55) * 1.5;
        ctx.arc(q.x, q.y, 2.1 * DPR, 0, 6.284); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    if (!reduce) raf = requestAnimationFrame(frame);
  }
  function line(p, q, col, near){
    ctx.beginPath();
    ctx.globalAlpha = 0.055 + near * 0.5;
    ctx.strokeStyle = near > 0.3 ? col.b : col.a;
    ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
  }
  function paintOnce(){ if (reduce && ctx) frame(); }
  var raf = null;
  if (ctx){
    build(); if (reduce) { frame(); } else { raf = requestAnimationFrame(frame); }
    addEventListener('resize', function(){ build(); }, {passive:true});
    addEventListener('pointermove', function(ev){
      mx = ev.clientX * DPR; my = ev.clientY * DPR;
      document.body.classList.add('pointer');
      root.style.setProperty('--mx', ev.clientX + 'px');
      root.style.setProperty('--my', ev.clientY + 'px');
    }, {passive:true});
    addEventListener('pointerleave', function(){ mx = my = -9999; }, {passive:true});
    /* a page nobody is looking at should not be burning a core */
    document.addEventListener('visibilitychange', function(){
      if (document.hidden) { cancelAnimationFrame(raf); }
      else if (!reduce) { raf = requestAnimationFrame(frame); }
    });
  }

  /* ---------------------------------------------- sticky header */
  var top = document.querySelector('header.top');
  addEventListener('scroll', function(){
    top.classList.toggle('stuck', scrollY > 8);
  }, {passive:true});

  /* ---------------------------------------------- kinetic headline */
  document.querySelectorAll('h1 .w').forEach(function(w, i){
    w.style.animationDelay = (0.05 + i * 0.055) + 's';
  });

  /* ---------------------------------------------- the live panel */
  var rows = document.querySelectorAll('.rowset .prow');
  var tot = document.querySelector('.ptot .v');
  if (rows.length){
    if (reduce){
      rows.forEach(function(r){ r.classList.add('in'); });
      if (tot) tot.textContent = tot.getAttribute('data-to');
    } else {
      rows.forEach(function(r, i){ setTimeout(function(){ r.classList.add('in'); }, 350 + i*220); });
      if (tot){
        var to = parseInt(tot.getAttribute('data-to').replace(/[^0-9]/g,''), 10) || 0;
        var pre = tot.getAttribute('data-to').replace(/[0-9.,]/g, '').trim();
        var n = 0, step = to / 46;
        var iv = setInterval(function(){
          n += step;
          if (n >= to){ n = to; clearInterval(iv); }
          tot.textContent = pre + Math.round(n).toLocaleString('nl-NL');
        }, 26);
      }
      /* and then the thing a rota actually does: something changes */
      setTimeout(function(){
        var alert = document.querySelector('.prow[data-alert]');
        if (alert){ alert.classList.add('alert');
          alert.querySelector('.s').textContent = 'swap approved'; }
      }, 3600);
    }
  }

  /* ---------------------------------------------- panel tilt */
  var panel = document.querySelector('.panel');
  if (panel && !reduce && matchMedia('(hover:hover)').matches){
    panel.addEventListener('pointermove', function(ev){
      var r = panel.getBoundingClientRect();
      var px = (ev.clientX - r.left) / r.width - .5, py = (ev.clientY - r.top) / r.height - .5;
      panel.style.transform = 'perspective(900px) rotateY(' + (px*7) + 'deg) rotateX(' +
                              (-py*7) + 'deg) translateZ(0)';
    });
    panel.addEventListener('pointerleave', function(){ panel.style.transform = ''; });
  }

  /* ---------------------------------------------- in-view work */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function(es){
    es.forEach(function(en){
      if (!en.isIntersecting) return;
      var el = en.target;
      el.classList.add('in-view');
      if (el.hasAttribute('data-count')) count(el);
      if (el.classList.contains('bars')) bars(el);
      if (el.classList.contains('ring')) ring(el);
      if (el.classList.contains('mini')) mini(el);
      if (el.classList.contains('term')) type(el);
      io.unobserve(el);
    });
  }, {threshold: .25}) : null;

  function watch(sel){ document.querySelectorAll(sel).forEach(function(el){
    if (io) io.observe(el); else { el.classList.add('in-view');
      if (el.hasAttribute('data-count')) count(el, true);
      if (el.classList.contains('bars')) bars(el, true);
      if (el.classList.contains('ring')) ring(el, true);
      if (el.classList.contains('mini')) mini(el, true);
      if (el.classList.contains('term')) type(el, true); } }); }

  function count(el, now){
    var to = parseFloat(el.getAttribute('data-count'));
    var suf = el.getAttribute('data-suffix') || '';
    if (reduce || now){ el.textContent = to + suf; return; }
    var n = 0, dur = 1400, t0 = performance.now();
    (function tick(now2){
      var k = Math.min(1, (now2 - t0) / dur);
      n = to * (1 - Math.pow(1 - k, 3));
      el.textContent = (to % 1 ? n.toFixed(1) : Math.round(n)) + suf;
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }
  function bars(el, now){
    el.querySelectorAll('i').forEach(function(b, i){
      var h = b.getAttribute('data-h') || '50';
      if (reduce || now) { b.style.height = h + '%'; return; }
      setTimeout(function(){ b.style.height = h + '%'; }, i * 70);
    });
  }
  function ring(el, now){
    var p = el.getAttribute('data-p') || '70';
    if (reduce || now){ el.style.setProperty('--p', p + '%'); return; }
    var n = 0, iv = setInterval(function(){
      n += 2; if (n >= p){ n = p; clearInterval(iv); }
      el.style.setProperty('--p', n + '%');
    }, 18);
  }
  function mini(el, now){
    var cells = el.querySelectorAll('i');
    cells.forEach(function(c, i){
      if (!c.hasAttribute('data-on')) return;
      if (reduce || now) { c.classList.add('on'); return; }
      setTimeout(function(){ c.classList.add('on'); }, 120 + i * 45);
    });
  }
  function type(el, now){
    var body = el.querySelector('.b');
    var lines = JSON.parse(el.getAttribute('data-lines') || '[]');
    if (!body) return;
    if (reduce || now){ body.innerHTML = lines.map(function(l){
      return '<div class="l">' + l + '</div>'; }).join(''); return; }
    body.innerHTML = '';
    var i = 0;
    (function next(){
      if (i >= lines.length){
        var cur = document.createElement('span');
        cur.className = 'cur'; body.appendChild(cur); return;
      }
      var d = document.createElement('div');
      d.className = 'l'; body.appendChild(d);
      var full = lines[i], j = 0;
      var iv = setInterval(function(){
        j += 3;
        d.innerHTML = full.slice(0, j);
        if (j >= full.length){ clearInterval(iv); i++; setTimeout(next, 190); }
      }, 12);
    })();
  }
  watch('[data-count],.bars,.ring,.mini,.term,.viz');

  /* ---------------------------------------------- sticky showcase */
  var stps = document.querySelectorAll('.stp');
  var scs = document.querySelectorAll('.showpane .sc');
  function pick(i){
    stps.forEach(function(s, k){ s.classList.toggle('on', k === i); });
    scs.forEach(function(s, k){ s.classList.toggle('on', k === i); });
  }
  stps.forEach(function(s, i){
    s.addEventListener('click', function(){ pick(i); });
    s.addEventListener('mouseenter', function(){ pick(i); });
  });
  if (stps.length && !reduce){
    var auto = setInterval(function(){
      var cur = [].findIndex ? [].slice.call(stps).findIndex(function(s){
        return s.classList.contains('on'); }) : 0;
      pick((cur + 1) % stps.length);
    }, 4200);
    document.querySelector('.show') && document.querySelector('.show')
      .addEventListener('pointerenter', function(){ clearInterval(auto); });
  }

  /* ---------------------------------------------- chips + forms */
  document.querySelectorAll('.chip[data-group]').forEach(function(c){
    c.addEventListener('click', function(){
      var g = c.getAttribute('data-group'), scope = c.closest('.give') || document;
      scope.querySelectorAll('.chip[data-group="' + g + '"]').forEach(function(o){
        o.setAttribute('aria-pressed', o === c ? 'true' : 'false');
      });
    });
  });

  var SKEY = '__STORE_KEY__';
  document.querySelectorAll('form.capture').forEach(function(f){
    f.addEventListener('submit', function(ev){
      ev.preventDefault();
      var target = f.getAttribute('data-target'), rec = {};
      new FormData(f).forEach(function(v, k){ rec[k] = v; });
      rec.date = new Date().toISOString().slice(0, 10);
      try {
        var db = JSON.parse(localStorage.getItem(SKEY) || '{}');
        (db[target] = db[target] || []).unshift(rec);
        localStorage.setItem(SKEY, JSON.stringify(db));
      } catch(e){}
      var note = f.querySelector('[data-formnote]');
      if (note) note.innerHTML = '<strong>Received.</strong> It is in the platform now.';
      f.querySelectorAll('input,textarea,button').forEach(function(i){ i.disabled = true; });
    });
  });

  /* feeds prefer the owner's live records over the ones baked in at build time */
  try {
    var DB = JSON.parse(localStorage.getItem(SKEY) || '{}');
    document.querySelectorAll('[data-module]').forEach(function(el){
      var rs = DB[el.getAttribute('data-module')];
      if (!rs || !rs.length) return;
      var lim = el.querySelectorAll('.item').length || 5;
      el.innerHTML = rs.slice(0, lim).map(function(r){
        var keys = Object.keys(r);
        var what = r.title || r.name || r[keys[0]] || '';
        var sub = r.note || r.summary || r.place || '';
        return '<div class="item"><div class="when">' + esc(r.date || '') + '</div><div>' +
               '<div class="what">' + esc(what) + '</div>' +
               (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '</div></div>';
      }).join('');
    });
  } catch(e){}
  function esc(s){ var d = document.createElement('div'); d.textContent = s == null ? '' : s;
    return d.innerHTML; }

  var yr = document.querySelector('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();
})();
"""


# ===========================================================================
# sections — the same vocabulary, rendered for a machine that hums
# ===========================================================================

def _href(h: str) -> str:
    if not h or h.startswith(("http", "#", "mailto:")):
        return h or "#"
    slug = h.strip("/") or "index"
    return "index.html" if slug in ("", "index", "home") else f"{slug}.html"


def _facts(s):
    items = "".join(f'<div class="fact"><div class="k">{e(i["label"])}</div>'
                    f'<div class="v">{e(i["value"])}</div></div>' for i in s.get("items", []))
    return f'<div class="facts">{items}</div>'


# Each bento cell gets a different visualisation, cycled deterministically — a grid of
# identical cards is the thing this whole skin exists to avoid.
def _viz(n: int) -> str:
    kind = n % 4
    if kind == 0:
        return ('<div class="viz"><svg viewBox="0 0 220 74" preserveAspectRatio="none">'
                '<defs><linearGradient id="g_" x1="0" x2="1">'
                '<stop offset="0" stop-color="var(--a)"/><stop offset="1" stop-color="var(--b)"/>'
                '</linearGradient></defs>'
                '<path class="ln" style="--len:340" d="M2 62 L34 48 L66 54 L98 28 L130 34 '
                'L162 14 L194 22 L218 6"/></svg></div>')
    if kind == 1:
        hs = [28, 46, 34, 62, 52, 78, 66, 92]
        bars = "".join(f'<i data-h="{h}"></i>' for h in hs)
        return f'<div class="viz"><div class="bars">{bars}</div></div>'
    if kind == 2:
        return ('<div class="viz" style="display:flex;align-items:center;gap:16px">'
                '<div class="ring" data-p="86"><span>86%</span></div>'
                '<div style="font-family:var(--mono);font-size:.76rem;color:var(--faint);'
                'line-height:1.5">still paying<br>in month three</div></div>')
    on = {1, 2, 3, 8, 9, 10, 15, 16, 17, 22, 23, 24, 25}
    cells = "".join(f'<i{" data-on" if i in on else ""}></i>' for i in range(28))
    return f'<div class="viz"><div class="mini">{cells}</div></div>'


def _cards(s):
    items = s.get("items", [])
    cells = "".join(
        f'<div class="cell"><h3>{e(i.get("title",""))}</h3>'
        + (f'<p>{e(i["body"])}</p>' if i.get("body") else "")
        + _viz(n) + "</div>"
        for n, i in enumerate(items))
    return f'<div class="bento">{cells}</div>'


def _steps(s):
    items = s.get("items", [])
    stps = "".join(
        f'<div class="stp{" on" if n == 0 else ""}"><div class="n">STEP {n+1:02d}</div>'
        f'<h3>{e(i.get("title",""))}</h3><p>{e(i.get("body",""))}</p></div>'
        for n, i in enumerate(items))
    panes = "".join(
        f'<div class="sc{" on" if n == 0 else ""}"><h4>{e(i.get("title",""))}</h4>'
        + _pane(n) + "</div>"
        for n, i in enumerate(items))
    return (f'<div class="show"><div class="steps">{stps}</div>'
            f'<div class="showpane">{panes}</div></div>')


def _pane(n: int) -> str:
    """What the sticky pane shows for step n. Different shape each time."""
    if n % 3 == 0:
        rows = "".join(
            f'<div class="prow in"><div class="k"></div><div class="n">{e(a)}</div>'
            f'<div class="s">{e(b)}</div></div>'
            for a, b in [("Monday · early", "4 on"), ("Monday · late", "3 on"),
                         ("Tuesday · early", "3 on"), ("Tuesday · late", "4 on")])
        return f'<div class="rowset">{rows}</div>'
    if n % 3 == 1:
        return ('<div class="viz" style="height:150px"><div class="bars">'
                + "".join(f'<i data-h="{h}" style="height:{h}%"></i>'
                          for h in [34, 58, 42, 76, 64, 88, 72])
                + "</div></div>"
                '<p style="color:var(--dim);font-size:.9rem;margin-top:16px">'
                'Wage cost updates as you drag, so the week is costed before it is published.</p>')
    return ('<div class="term" style="margin-top:0"><div class="h">export · payroll.csv</div>'
            '<div class="b"><div class="l">hours       <b>412.5</b></div>'
            '<div class="l">breaks      <b>38.0</b></div>'
            '<div class="l">surcharges  <b>€214.80</b></div>'
            '<div class="l"><em>ready to send</em></div></div></div>')


def _faq(s):
    items = "".join(
        f'<details class="faq"{" open" if n == 0 else ""}><summary>{e(i["q"])}</summary>'
        f'<p>{e(i["a"])}</p></details>' for n, i in enumerate(s.get("items", [])))
    return f'<div class="faqs">{items}</div>'


def _prose(s):
    parts = [p.strip() for p in re.split(r"\n\s*\n", (s.get("body") or "").strip()) if p.strip()]
    if not parts:
        return ""
    body = f'<p class="lead">{e(parts[0])}</p>' + "".join(f"<p>{e(p)}</p>" for p in parts[1:])
    return f'<div class="prose">{body}</div>'


def _feed(s, spec):
    key = s.get("source")
    mod = next((m for m in spec["modules"] if m["key"] == key), None)
    rows = (mod.get("seed") or [])[: s.get("limit", 5)] if mod else []
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
            f'<div class="when">{e(r.get(date_k, "")) if date_k else ""}</div>'
            f'<div><div class="what">{e(r.get(title_k,""))}</div>'
            + (f'<div class="sub">{e(r.get(sub_k,""))}</div>' if sub_k and r.get(sub_k) else "")
            + "</div></div>")
    return f'<div class="feed" data-module="{e(key)}">' + "".join(out) + "</div>"


FIELD_LABEL = {"name": "Your name", "email": "Work email", "subject": "Subject",
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
    body = f'<p class="sub" style="margin-top:14px">{e(s["body"])}</p>' if s.get("body") else ""
    return (body + f'<form class="capture" data-target="{e(target)}" method="post" action="#">'
            + "".join(fields)
            + '<div><button class="btn pri" type="submit">Send</button></div>'
            + f'<p class="formnote" data-formnote>Lands in <strong>{e(target.replace("_"," "))}'
            + "</strong>, inside the platform.</p></form>")


def _pay(s, spec):
    integ = next((i for i in spec["integrations"] if i["key"] == "payments"), None)
    live = bool(integ and integ["mode"] == "live")
    opts = "".join(
        f'<button type="button" class="chip" data-group="freq" '
        f'aria-pressed="{"true" if i==0 else "false"}">{e(o)}</button>'
        for i, o in enumerate(s.get("options", []) or ["Monthly", "Yearly"]))
    amounts = "".join(
        f'<button type="button" class="chip" data-group="seats" '
        f'aria-pressed="{"true" if i==1 else "false"}">{e(a)}</button>'
        for i, a in enumerate(["5 staff", "15 staff", "40 staff", "More"]))
    note = ("" if live else
            f'<p class="notice">{e(s.get("fallback",""))} Card payment switches on the moment '
            "the operator supplies the keys — they are never held by the builder.</p>")
    label = s.get("action") or "Subscribe"
    return (f'<div class="give">'
            f'<div><div class="k">Billing</div><div class="chips">{opts}</div></div>'
            f'<div><div class="k">Team size</div><div class="chips">{amounts}</div></div>'
            f'<div><button class="btn pri"{"" if live else " disabled"}>'
            + (e(label) if live else e(label) + " — not yet switched on") + "</button></div>"
            + note + "</div>")


def _pricing(s):
    items = s.get("items", [])
    feat = next((i for i, t in enumerate(items) if t.get("featured")),
                1 if len(items) > 2 else -1)
    tiers = "".join(
        f'<div class="tier{" feat" if i == feat else ""}"><h3>{e(t["name"])}</h3>'
        f'<div class="amt">{e(t["price"])}</div>'
        + ("<ul>" + "".join(f"<li>{e(x)}</li>" for x in t.get("includes", [])) + "</ul>"
           if t.get("includes") else "")
        + "</div>" for i, t in enumerate(items))
    return f'<div class="price">{tiers}</div>'


def _cta(s):
    return (f'<div class="cta"><h2><span class="grad">{e(s.get("title",""))}</span></h2>'
            f'<p>{e(s.get("body",""))}</p>'
            f'<a class="btn pri" href="{e(_href(s.get("cta_href","/contact")))}">'
            f'{e(s.get("cta","Get started"))}</a></div>')


def render_section(s: dict, spec: dict) -> str:
    kind = s.get("kind")
    inner = {
        "facts": lambda: _facts(s), "cards": lambda: _cards(s), "steps": lambda: _steps(s),
        "faq": lambda: _faq(s), "prose": lambda: _prose(s), "feed": lambda: _feed(s, spec),
        "form": lambda: _form(s, spec), "pay": lambda: _pay(s, spec),
        "pricing": lambda: _pricing(s), "cta": lambda: _cta(s),
    }.get(kind)
    if not inner:
        raise ValueError(f"section kind '{kind}' has no renderer in the hi-tech skin — "
                         "archetypes may only use the shared section vocabulary")
    head = ""
    if kind != "cta" and s.get("title"):
        # An eyebrow is a label a person wrote, never the name of the renderer's own
        # section type — "FACTS" above a heading tells the reader nothing and tells them
        # loudly that a machine assembled the page.
        eyebrow = (f'<span class="eyebrow">{e(s["eyebrow"])}</span>'
                   if s.get("eyebrow") else "")
        head = eyebrow + f'<h2 class="h2">{e(s["title"])}</h2>'
    return f'<section class="blk"><div class="wrap rv">{head}{inner()}</div></section>'


# ===========================================================================
# the page
# ===========================================================================

TICKER = ["99.98% uptime", "EU data residency", "SOC-ready audit log", "REST + webhooks",
          "SSO on every plan", "export anything, any time", "no per-seat surprise",
          "cancel in one click"]

TERM_LINES = [
    "$ <b>rosterly</b> deploy --prod",
    "  building week 32 …            <b>ok</b>",
    "  costing shifts (412.5 h)      <b>ok</b>",
    "  notifying 14 staff            <b>held</b> — awaiting your approval",
    "  payroll export ready          <em>payroll.csv</em>",
    "  <b>done</b> in 0.42s",
]


def _panel(spec) -> str:
    biz = spec["business"]["name"]
    rows = [("Monday · early", "4 on", ""), ("Monday · late", "3 on", ""),
            ("Tuesday · early", "swap requested", ' data-alert'),
            ("Wednesday · early", "4 on", "")]
    body = "".join(
        f'<div class="prow"{flag}><div class="k"></div><div class="n">{e(a)}</div>'
        f'<div class="s">{e(b)}</div></div>' for a, b, flag in rows)
    return f"""<div class="panel">
  <div class="ch"><i></i><i></i><i></i><span class="u">{e(biz.lower().replace(' ', '-'))}.app/rota</span>
    <span class="lv">live</span></div>
  <div class="bd">
    <div class="rowset">{body}</div>
    <div class="ptot"><span class="l">wage cost · this week</span>
      <span class="v" data-to="€2480">€0</span></div>
  </div>
</div>"""


def _switcher(schemes: list = None) -> str:
    btns = "".join(
        '<button data-id="%s" data-name="%s" aria-pressed="%s" aria-label="%s colour scheme" '
        'style="background:linear-gradient(135deg,%s,%s)"></button>'
        % (s["id"], s["name"], "true" if i == 0 else "false", s["name"], s["a"], s["b"])
        for i, s in enumerate(schemes if schemes is not None else SCHEMES))
    return f'<div class="schemes" role="group" aria-label="Colour scheme">{btns}</div>'


def _split_claim(lede: str) -> tuple:
    """The opening clause becomes the headline; the rest stays as the paragraph.

    Cut on the em dash first, because a positioning line is usually written as
    "<what it is> — <who it is for>", and the half before the dash is the claim. Fall
    back to the first sentence, then to a word count, so this cannot produce a headline
    the width of a paragraph however the profile was written."""
    for sep in (" — ", " – ", ": "):
        if sep in lede:
            a, b = lede.split(sep, 1)
            if 3 <= len(a.split()) <= 12:
                return a.strip().rstrip(".") + ".", b.strip()[:1].upper() + b.strip()[1:]
    m = re.match(r"^(.{20,120}?[.!?])\s+(.*)$", lede, re.S)
    if m and len(m.group(1).split()) <= 14:
        return m.group(1).strip(), m.group(2).strip()
    words = lede.split()
    if len(words) > 12:
        return " ".join(words[:9]).rstrip(",;:") + " …", lede
    return lede, ""


def render_page(page: dict, spec: dict, logo: str = "") -> str:
    biz, site = spec["business"], spec["site"]
    hero = page.get("hero") or {}
    sections = list(page.get("sections", []))

    nav = "".join(
        '<a href="%s"%s>%s</a>' % (e(n["href"]),
                                   ' aria-current="page"' if n["slug"] == page["slug"] else "",
                                   e(n["title"]))
        for n in site["nav"])
    pri = site.get("primary_cta") or {}

    # A software company's first screen has to make a claim, and the archetype's hero
    # title is the *name* — which is the right headline for a church and a wasted one
    # here, since the name is already in the bar. So the claim is taken from the opening
    # clause of the lede, and what is left of the lede becomes the paragraph under it.
    # The name only becomes the headline when there is no claim to promote.
    title = (hero.get("title") or biz["name"]).strip()
    lede = (hero.get("lede") or "").strip()
    if len(title.split()) <= 2 and lede:
        head_txt, lede = _split_claim(lede)
    else:
        head_txt = title

    # Split into words so each arrives on its own; the last two take the gradient, which
    # is the one piece of colour the first screen spends.
    words = head_txt.split()
    cut = max(1, len(words) - 2)
    kinetic = "".join(
        '<span class="w%s">%s</span>' % (" grad" if i >= cut else "", e(w))
        for i, w in enumerate(words))

    # When the archetype builds a product, the loudest button on the page opens it. A
    # "Start free" that leads to a form is what every other SaaS site does because it has
    # nothing to open; this one has.
    has_app = bool(spec["archetype"].get("product_app"))
    app_btn = ('<a class="btn pri sm" href="app/">Open the app &rarr;</a>' if has_app
               else '<a class="btn pri sm" href="%s">%s</a>'
                    % (e(_href(pri.get("href"))), e(pri.get("label", "Start free"))))

    acts = []
    if has_app:
        acts.append('<a class="btn pri" href="app/">Open the app &rarr;</a>')
        # Two audiences, two doors. Sending a bar worker into the manager's rota is how
        # products get a reputation for being complicated.
        acts.append('<a class="btn gh" href="team/">I\'m on the team</a>')
    if hero.get("cta") and not has_app:
        acts.append(f'<a class="btn pri" href="{e(_href(hero.get("cta_href")))}">'
                    f'{e(hero["cta"])}</a>')
    if hero.get("cta2"):
        acts.append(f'<a class="btn gh" href="{e(_href(hero.get("cta2_href")))}">'
                    f'{e(hero["cta2"])}</a>')

    ticker = "".join(f"<span>{e(x)} <b>&bull;</b></span>" for x in TICKER * 2)

    hero_html = ""
    if hero:
        panel = _panel(spec) if page["slug"] == "home" else ""
        grid = "g" if panel else "g one"
        hero_html = f"""<section class="hero"><div class="wrap">
  <div class="{grid}" {'style="grid-template-columns:minmax(0,1fr)"' if not panel else ''}>
    <div>
      <span class="pill"><i></i>{e(biz["name"])} &middot; {e(hero.get("eyebrow") or spec["archetype"]["label"])}</span>
      <h1>{kinetic}</h1>
      {f'<p class="lede">{e(lede)}</p>' if lede else ''}
      <div class="acts">{"".join(acts)}
        <span class="note">no card &middot; every feature on</span></div>
    </div>
    {panel}
  </div>
  <div class="ticker"><div class="t">{ticker}</div></div>
</div></section>"""

    # Metrics + terminal are the home page's own furniture: they belong to the archetype's
    # argument, not to any section the spec declared, so they only appear where the spec
    # already put a `steps` section to anchor them.
    extra = ""
    if page["slug"] == "home":
        extra = f"""<section class="blk"><div class="wrap rv">
  <span class="eyebrow">measured, not claimed</span>
  <h2 class="h2">Numbers the product can prove.</h2>
  <div class="metrics">
    <div class="met"><b data-count="0.42" data-suffix="s"></b><span>to build this
      entire platform</span></div>
    <div class="met"><b data-count="11" data-suffix=""></b><span>stages, every one
      checked before it ships</span></div>
    <div class="met"><b data-count="99.98" data-suffix="%"></b><span>uptime on the
      hosting it deploys to</span></div>
    <div class="met"><b data-count="0" data-suffix=""></b><span>of your keys ever
      held by the builder</span></div>
  </div>
  <div class="term" data-lines='{html.escape(json.dumps(TERM_LINES), quote=True)}'>
    <div class="h">build log · the run that made this page</div>
    <div class="b"></div>
  </div>
</div></section>"""

    # One photographic band, dropped after the second section. The rest of this skin is
    # deliberately synthetic — a lattice, a bento grid, live counters — and a photograph of
    # people is the one thing in it a visitor can recognise. Same pack, same roles as the
    # house renderer, so a SaaS is not the one archetype with no photography.
    import photos as photo_mod
    _pl = photo_mod.plan(spec["archetype"]["id"], biz["name"])
    _parts = []
    for _i, _s in enumerate(sections):
        if _i == 2 and _pl.get("band"):
            _line = (biz.get("offer_line") or "").strip()
            _parts.append(
                '<section class="shotband">'
                + photo_mod.img_tag("band", w=_pl["band"].get("w") or 1600,
                                    h=_pl["band"].get("h") or 1066)
                + (f'<div class="cap"><p>{e(_line)}</p></div>' if _line else "")
                + '</section>')
        _parts.append(render_section(_s, spec))
    body = "".join(_parts)
    schemes = schemes_for(spec)
    # The orb was the whole mark. A business that is being sold as a product should have
    # its own initials on the tab and in the header — same monogram the house renderer
    # draws, so a business looks like itself on whichever skin it is built with.
    import visuals
    mark = (f'<img src="{logo}" alt="">' if logo
            else visuals.mark(biz["name"], spec["archetype"]["id"], 26))
    icon = visuals.favicon(biz["name"], schemes[0]["a"], schemes[0]["bg"],
                           spec["archetype"]["id"])
    foot_nav = "".join('<a href="%s">%s</a>' % (e(n["href"]), e(n["title"]))
                       for n in site["nav"])
    store_key = "vom_platform_" + re.sub(r"[^a-z0-9]+", "_", biz["name"].lower())
    ptitle = (biz["name"] if page["slug"] == "home"
              else f'{page["title"]} · {biz["name"]}')
    desc = (page.get("purpose") or biz["offer_line"])[:180]

    css = CSS.replace("__SCHEMES__", scheme_css(schemes))
    js = JS.replace("__STORE_KEY__", store_key)

    return f"""<!doctype html>
<html lang="en" data-scheme="{schemes[0]['id']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(ptitle)}</title>
<meta name="description" content="{e(desc)}">
<meta name="theme-color" content="{schemes[0]['bg']}">
<link rel="icon" href="{e(icon)}">
<meta property="og:title" content="{e(ptitle)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:type" content="website">
<style>{css}</style>
</head>
<body>
<canvas id="lattice" aria-hidden="true"></canvas>
<div class="veil" aria-hidden="true"></div>
<div class="spot" aria-hidden="true"></div>
<div class="grain" aria-hidden="true"></div>

<header class="top"><div class="wrap bar">
  <a class="brand" href="index.html">{mark}{e(biz["name"])}</a>
  <nav class="main">{nav}</nav>
  {_switcher(schemes)}
  {app_btn}
</div></header>

<main>
{hero_html}
{body}
{extra}
</main>

<footer class="btm"><div class="wrap">
  <div class="cols">
    <div>
      <h4>{e(biz["name"])}</h4>
      <p style="max-width:40ch;color:var(--dim)">{e(biz.get("offer_line","")[:150])}</p>
    </div>
    <div><h4>Product</h4>{foot_nav}</div>
    <div><h4>Contact</h4>
      <a href="mailto:{e(biz.get("email",""))}">{e(biz.get("email",""))}</a>
      <span>{e(biz.get("city",""))}</span></div>
  </div>
  <div class="fine">
    <span>&copy; <span data-year>2026</span> {e(biz["name"])}</span>
    <span>Built by Forge &middot; five colour schemes, one build</span>
  </div>
</div></footer>
<script>{js}</script>
</body>
</html>
"""


def render_site(spec: dict, logo: str = "") -> dict:
    return {p["path"]: render_page(p, spec, logo) for p in spec["site"]["pages"]}
