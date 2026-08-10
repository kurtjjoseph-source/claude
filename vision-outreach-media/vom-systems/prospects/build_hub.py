#!/usr/bin/env python3
"""Generate the VOM prospect hub — the public page the twelve funnels point back to.

Generated, not hand-written: the cards are the same answers the factory compiled the
funnels from, so a hub card and the page it links to cannot drift apart. Re-run after
any change to the seeds or after a redeploy that moves an address.

Output is an artifact-style fragment (starts at <title>), which is what
`vom-systems/deploy-wizard.sh` wraps and publishes.
"""
import base64, html, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SEEDS_DIR = "/private/tmp/claude-501/-Users-kurtjoseph-Business-Ideas/4a23722c-be72-44c6-b32e-99c38d08412c/scratchpad"
LOGO = os.path.normpath(os.path.join(HERE, "..", "vom-logo.jpg"))
OUT = os.path.join(HERE, "prospect-hub.html")

sys.path.insert(0, SEEDS_DIR)
from seeds_data import SEEDS  # noqa: E402

URLS = {r["name"]: r["url"] for r in json.load(open(os.path.join(SEEDS_DIR, "deploys.json")))}

# The six pains the research names, as something a visitor can filter by.
THEMES = {
    "2.6": ("AI", "Making AI actually do something"),
    "2.2": ("Staffing", "Cannot hire, cannot keep up"),
    "2.3": ("Cash flow", "The money is earned but not in"),
    "2.1": ("Customers", "Being found and being chosen"),
    "2.7": ("Customers", "Being found and being chosen"),
    "2.5": ("Admin", "The day disappears into paperwork"),
    "2.4": ("Costs", "Everything costs more than it did"),
}


def e(s):
    return html.escape(str(s or ""), quote=True)


def theme_of(seed):
    ref = seed["pain_ref"]
    for k, v in THEMES.items():
        if k in ref:
            return v
    return ("Other", "")


def first_sentence(text, limit=170):
    t = text.strip().strip('"')
    for stop in (". ", "? ", "! "):
        i = t.find(stop)
        if 0 < i < limit:
            return t[:i + 1].strip()
    return (t[:limit].rsplit(" ", 1)[0] + "…") if len(t) > limit else t


def price_line(s):
    recurring = s["seed"] in (2, 3, 6, 8, 9, 11)
    return f"€{s['price']:,}".replace(",", ".") + (" / month" if recurring else "")


logo_uri = "data:image/jpeg;base64," + base64.b64encode(open(LOGO, "rb").read()).decode()

cards = []
for s in sorted(SEEDS, key=lambda x: -x["score"]["total"]):
    tag, _ = theme_of(s)
    url = URLS.get(s["name"], "")
    cards.append(f"""
    <article class="card" data-theme="{e(tag)}">
      <div class="ctop">
        <span class="tag">{e(tag)}</span>
        <span class="price">{e(price_line(s))}</span>
      </div>
      <h3>{e(s['name'])}</h3>
      <p class="quote">“{e(first_sentence(s['problem']))}”</p>
      <p class="what">{e(first_sentence(s['promise'], 200))}</p>
      <p class="who"><span>Who it is for</span>{e(first_sentence(s['who'], 130))}</p>
      <a class="go" href="{e(url)}">Open the waitlist<span aria-hidden="true">→</span></a>
    </article>""")

tags = []
seen = []
for s in SEEDS:
    t = theme_of(s)[0]
    if t not in seen:
        seen.append(t)
for t in seen:
    tags.append(f'<button class="chip" data-filter="{e(t)}">{e(t)}</button>')

page = f"""<title>Ideas in validation · Vision Outreach Media</title>
<style>
  :root{{
    --navy:#1B2A4A; --navy-2:#14203a; --orange:#BA5C1D; --teal:#0F7A73;
    --paper:#FFFFFF; --paper-2:#F4F7FB; --card:#FFFFFF;
    --ink:#16233F; --ink-soft:#48566E; --line:#E1E7F0;
    --wrap:1140px;
    --sans:"Manrope","Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  }}
  *,*::before,*::after{{box-sizing:border-box}}
  body{{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);
    line-height:1.6;-webkit-font-smoothing:antialiased}}
  a{{color:inherit}}
  .wrap{{max-width:var(--wrap);margin:0 auto;padding:0 22px}}

  header.site{{background:var(--navy);color:#fff}}
  header.site .bar{{display:flex;align-items:center;gap:14px;padding:14px 0}}
  header.site img{{height:34px;width:auto;border-radius:6px;display:block}}
  header.site .nm{{font-weight:800;letter-spacing:-.01em}}
  header.site .sp{{flex:1}}
  header.site a.home{{color:#fff;text-decoration:none;font-size:.9rem;
    border:1px solid rgba(255,255,255,.35);padding:7px 14px;border-radius:999px}}
  header.site a.home:hover{{background:rgba(255,255,255,.12)}}

  .hero{{background:linear-gradient(180deg,var(--navy) 0%,var(--navy-2) 100%);color:#fff;
    padding:54px 0 60px}}
  .hero .eyebrow{{font-size:.74rem;letter-spacing:.16em;text-transform:uppercase;
    font-weight:800;color:#F3B27A;margin:0 0 14px}}
  .hero h1{{margin:0 0 16px;font-size:clamp(1.9rem,4.4vw,3rem);line-height:1.1;
    letter-spacing:-.03em;max-width:19ch}}
  .hero p{{margin:0;max-width:62ch;font-size:1.06rem;color:#DCE4F1}}

  .how{{background:var(--paper-2);border-bottom:1px solid var(--line);padding:26px 0}}
  .how ol{{display:grid;gap:18px;grid-template-columns:repeat(3,minmax(0,1fr));
    margin:0;padding:0;list-style:none;counter-reset:s}}
  .how li{{counter-increment:s;display:flex;gap:12px;align-items:flex-start;
    font-size:.94rem;color:var(--ink-soft)}}
  .how li::before{{content:counter(s);flex:none;width:26px;height:26px;border-radius:50%;
    background:var(--teal);color:#fff;font-weight:800;font-size:.8rem;
    display:grid;place-items:center;margin-top:1px}}
  .how b{{color:var(--ink)}}
  @media(max-width:760px){{.how ol{{grid-template-columns:1fr}}}}

  .filters{{display:flex;gap:9px;flex-wrap:wrap;padding:30px 0 6px;align-items:center}}
  .filters .lbl{{font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;
    font-weight:800;color:var(--ink-soft);margin-right:4px}}
  .chip{{font:inherit;font-size:.87rem;font-weight:650;padding:7px 15px;border-radius:999px;
    border:1px solid var(--line);background:#fff;color:var(--ink);cursor:pointer}}
  .chip:hover{{border-color:var(--teal)}}
  .chip[aria-pressed="true"]{{background:var(--navy);border-color:var(--navy);color:#fff}}

  .grid{{display:grid;gap:18px;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));
    padding:18px 0 56px}}
  .card{{background:var(--card);border:1px solid var(--line);border-radius:14px;
    padding:22px;display:flex;flex-direction:column;gap:11px}}
  .card:hover{{border-color:#C6D2E4;box-shadow:0 2px 6px rgba(22,35,63,.06),0 16px 34px rgba(22,35,63,.08)}}
  .card[hidden]{{display:none}}
  .ctop{{display:flex;align-items:center;justify-content:space-between;gap:10px}}
  .tag{{font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;font-weight:800;
    color:var(--teal)}}
  .price{{font-size:.82rem;font-weight:700;color:var(--ink-soft);white-space:nowrap}}
  .card h3{{margin:0;font-size:1.3rem;letter-spacing:-.02em}}
  .quote{{margin:0;font-size:.95rem;color:var(--ink-soft);border-left:3px solid var(--line);
    padding-left:12px}}
  .what{{margin:0;font-size:.97rem}}
  .who{{margin:0;font-size:.86rem;color:var(--ink-soft)}}
  .who span{{display:block;font-size:.66rem;letter-spacing:.13em;text-transform:uppercase;
    font-weight:800;color:var(--ink-soft);margin-bottom:2px}}
  .go{{margin-top:auto;align-self:flex-start;display:inline-flex;align-items:center;gap:8px;
    background:var(--orange);color:#fff;text-decoration:none;font-weight:750;font-size:.94rem;
    padding:10px 18px;border-radius:999px}}
  .go:hover{{background:#A9521A}}

  .note{{border-top:1px solid var(--line);padding:26px 0;color:var(--ink-soft);
    font-size:.92rem;max-width:70ch}}

  footer.site{{background:var(--navy);color:#DCE4F1;padding:34px 0;font-size:.92rem}}
  footer.site .cols{{display:flex;gap:22px;flex-wrap:wrap;align-items:center}}
  footer.site a{{color:#fff}}
  footer.site .sp{{flex:1}}

  @media (prefers-color-scheme:dark){{
    :root{{--paper:#0F131A;--paper-2:#141A23;--card:#161D27;--ink:#EDF1F7;
      --line:#26303D;--orange:#E8843C;--teal:#3FB3AA;--ink-soft:#A7B4C6;}}
    .chip{{background:var(--card)}}
    .card:hover{{border-color:#33404F;box-shadow:none}}
    .go{{color:#10141A}}
  }}
</style>

<header class="site"><div class="wrap bar">
  <img src="{logo_uri}" alt="Vision Outreach Media">
  <span class="nm">Vision Outreach Media</span>
  <span class="sp"></span>
  <a class="home" href="https://visionoutreachmedia.nl">visionoutreachmedia.nl</a>
</div></header>

<section class="hero"><div class="wrap">
  <p class="eyebrow">Ideas in validation</p>
  <h1>Twelve businesses we are testing in public.</h1>
  <p>None of these exist yet. Each one answers a problem small business owners
     themselves report in recent national surveys, and each has a page where you can say
     you would want it. The ones people ask for get built; the rest do not. Browsing
     costs nothing and joining a list costs nothing.</p>
</div></section>

<section class="how"><div class="wrap"><ol>
  <li><span><b>Read the twelve.</b> Every card is a real proposal with a real price,
      not a survey.</span></li>
  <li><span><b>Join the ones you would use.</b> A name and an email. No sequence, no
      charge, nothing to cancel.</span></li>
  <li><span><b>It gets built, or it does not.</b> The list decides. Everyone on it sees
      the first version first and pays less, permanently.</span></li>
</ol></div></section>

<div class="wrap">
  <div class="filters">
    <span class="lbl">Filter</span>
    <button class="chip" data-filter="all" aria-pressed="true">All twelve</button>
    {"".join(tags)}
  </div>
  <div class="grid" id="grid">{"".join(cards)}
  </div>

  <p class="note"><strong>Where these came from.</strong> Seven pain points reported by
  small business owners in 2025–2026 research — the Federal Reserve's Small Business
  Credit Survey, Guidant Financial, the U.S. Chamber of Commerce, NFIB, Intuit QuickBooks
  and others — turned into twelve concrete offers. Vision Outreach Media builds the ones
  that earn a list. Questions:
  <a href="mailto:info@visionoutreachmedia.nl">info@visionoutreachmedia.nl</a>.</p>
</div>

<footer class="site"><div class="wrap cols">
  <span>© <span id="yr">2026</span> Vision Outreach Media · Amersfoort</span>
  <span class="sp"></span>
  <a href="https://visionoutreachmedia.nl">Main site</a>
  <a href="mailto:info@visionoutreachmedia.nl">info@visionoutreachmedia.nl</a>
</div></footer>

<script>
(function(){{
  document.getElementById("yr").textContent = new Date().getFullYear();
  var chips = [].slice.call(document.querySelectorAll(".chip"));
  var cards = [].slice.call(document.querySelectorAll(".card"));
  chips.forEach(function(c){{
    c.addEventListener("click", function(){{
      var f = c.dataset.filter;
      chips.forEach(function(x){{ x.setAttribute("aria-pressed", String(x === c)); }});
      cards.forEach(function(card){{
        card.hidden = !(f === "all" || card.dataset.theme === f);
      }});
    }});
  }});
}})();
</script>
"""

with open(OUT, "w", encoding="utf-8") as f:
    f.write(page)
print(f"wrote {OUT}  ({len(page):,} bytes, {len(cards)} cards)")
missing = [s["name"] for s in SEEDS if not URLS.get(s["name"])]
if missing:
    print("!! no live address for:", ", ".join(missing))
