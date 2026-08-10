#!/usr/bin/env node
// Generates LIVE-DATA landing pages + READMEs for each system-product repo,
// plus the house hub, from products.json.
//
// Live-data model:
//   - The canonical data file is served from the hub at HUB/products.json (CORS: *).
//   - Every product page fetches it at runtime and renders itself client-side.
//   - Each page also bakes in its own product object as an offline FALLBACK, so it
//     always renders even if the hub is unreachable.
//   - To change copy/pricing/parts: edit _build/products.json, `node build.js`,
//     then push the hub repo (all pages pick it up live) — pushing the product
//     repos only refreshes their baked fallback.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const products = JSON.parse(fs.readFileSync(path.join(__dirname, "products.json"), "utf8"));

const HUB = "https://vom-systems.vercel.app"; // canonical data host
const esc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

// VOM brand logo — embedded as a data URI so every generated page is self-contained.
// Standing rule: always apply the real VOM logo when building for VOM (never a placeholder).
const LOGO = "data:image/jpeg;base64," + fs.readFileSync(path.join(ROOT, "vom-logo.jpg")).toString("base64");

const LIVE = {
  "hundred": "https://vom-hundred.vercel.app",
  "turnkey": "https://vom-turnkey.vercel.app",
  "church-media-academy": "https://vom-church-media-academy.vercel.app",
  "ministry-ai": "https://vom-ministry-ai.vercel.app",
  "operators-academy": "https://vom-operators-academy.vercel.app",
  "launch-kits": "https://vom-launch-kits.vercel.app",
  "vital": "https://vom-vital.vercel.app",
};
const COLOR = { "hundred": "money", "turnkey": "vom", "church-media-academy": "church", "ministry-ai": "church", "operators-academy": "guides", "launch-kits": "tools", "vital": "health" };
const OPERATORS = ["operators-academy", "hundred", "launch-kits", "church-media-academy", "ministry-ai", "turnkey"];
const CONSUMER = ["vital"];

// ---------------- shared client render logic (runs in the browser) ----------------
// A single function body reused by every product page. It reads a product object
// and paints #hero + #content. Kept as a string so it can be inlined.
const CLIENT_RENDER = `
function esc(s){return String(s==null?"":s).replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c];});}
function firstUrl(p){var f=(p.parts||[]).filter(function(x){return x.url;}); return f.length?f[0].url:"#";}
function renderProduct(p){
  document.title = p.name + " \\u2014 " + p.type;
  document.getElementById("hero").innerHTML =
    '<p class="eyebrow">'+esc(p.type)+'</p>'+
    (p.flagship?'<span class="flag">\\u25c6 Flagship of the VOM house</span><br>':'')+
    '<h1>'+esc(p.name)+'</h1>'+
    '<p class="tagline">\\u201c'+esc(p.tagline)+'\\u201d</p>'+
    '<p class="position">'+esc(p.positioning)+'</p>';
  var parts = (p.parts||[]).map(function(pt){
    var nm = pt.gated ? '<span class="src-lock">\\u25cf unlocked on purchase</span>'
                    : pt.url ? '<a href="'+esc(pt.url)+'" target="_blank" rel="noopener">'+esc(pt.name)+'</a>'
                    : (pt.name ? '<span class="src-name">'+esc(pt.name)+'</span>' : '');
    return '<div class="part'+(pt.future?' future':'')+(pt.gated?' gated':'')+'">'+
      '<div class="role">'+(pt.future?'\\u25c7 ':(pt.gated?'\\u25cf ':''))+esc(pt.role)+(pt.future?' <em>\\u00b7 to build</em>':'')+'</div>'+
      '<div class="src">'+esc(pt.desc)+(pt.name?' \\u2014 '+nm:'')+'</div></div>';
  }).join('');
  var prices = (p.prices||[]).map(function(pr){
    var buy = pr.checkout ? '<a class="prc-buy" href="'+esc(pr.checkout)+'" target="_blank" rel="noopener">Buy \\u2197</a>' : '';
    return '<div class="prc'+(pr.core?' core':'')+(pr.checkout?' buyable':'')+'"><div class="pl">'+esc(pr.label)+'</div><div class="pv">'+esc(pr.value)+'</div>'+buy+'</div>';
  }).join('');
  var buyTier=(p.prices||[]).filter(function(x){return x.checkout;})[0];
  var buyCta = buyTier ? '<a class="btn buy" href="'+esc(buyTier.checkout)+'" target="_blank" rel="noopener">Buy \\u2014 '+esc(buyTier.value)+' \\u2197</a>' : '';
  var altTxt = (p.alt && p.alt!=="keep as-is") ? ' (alt: '+esc(p.alt)+')' : '';
  var os = p.os ? (
    '<section class="osband"><div class="wrap">'+
      '<p class="sec-eye">The operating system</p>'+
      '<h2>'+esc(p.os.name||(p.name+' OS'))+'</h2>'+
      '<p class="os-desc">'+esc(p.os.desc||'')+'</p>'+
      '<div class="os-cta"><a class="btn os" href="'+esc(p.os.path||'/os')+'">Open the OS \u2192</a>'+
        '<span class="os-lock">\u25cf licensed \u00b7 opens with a key</span></div>'+
      (p.os.note?'<p class="os-note">'+esc(p.os.note)+'</p>':'')+
    '</div></section>') : '';
  document.getElementById("content").innerHTML =
    '<section><div class="wrap"><p class="sec-eye">How it works</p><h2>One system, built from these parts</h2>'+parts+'</div></section>'+
    os+
    '<section><div class="wrap"><div class="grid2">'+
      '<div><div class="lbl">Who it\\u2019s for</div><div class="val">'+esc(p.who)+'</div></div>'+
      '<div><div class="lbl">The promise</div><div class="val">'+esc(p.promise)+'</div></div>'+
    '</div><div style="margin-top:26px"><div class="lbl">Price posture</div><div class="prices">'+prices+'</div></div></div></section>'+
    '<section style="border-bottom:none"><div class="wrap"><p class="sec-eye">Naming rationale</p>'+
      '<div class="why"><b>Why \\u201c'+esc(p.name)+'\\u201d'+altTxt+':</b> '+esc(p.whyName)+'</div>'+
      '<div class="cta">'+buyCta+'<a class="btn'+(buyCta?' ghost':'')+'" href="'+firstUrl(p)+'" target="_blank" rel="noopener">'+(buyCta?'See the free preview':'See it in action')+' \\u2197</a>'+
      '<span class="status" id="live">\\u25cf loading\\u2026</span></div></div></section>';
}
function markLive(ok){var el=document.getElementById("live"); if(!el) return;
  el.textContent = ok ? "\\u25cf live \\u00b7 synced from products.json" : "\\u25cf showing saved copy";
  el.style.color = ok ? "var(--c)" : "var(--ink-faint)";
}
`;

function productPage(p) {
  const scFirstOpen = (p.parts||[]).find(pt => pt.url && !pt.gated);
  const scBuyTier = (p.prices||[]).find(x => x.checkout);
  let scUrl = HUB, scLabel = "Explore the house →";
  if (scFirstOpen) { scUrl = scFirstOpen.url; scLabel = "Get started — it's free →"; }
  else if (scBuyTier) { scUrl = scBuyTier.checkout; scLabel = "Get started — " + scBuyTier.value + " →"; }
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.name)} — ${esc(p.type)}</title>
<meta name="description" content="${esc(p.positioning)}">
<link rel="icon" type="image/jpeg" href="${LOGO}">
<style>
  :root{
    --c:${p.accent};
    --bg:#f6f5f1; --surface:#ffffff; --surface-2:#efeee7; --line:#e1dfd4; --line-soft:#ece9df;
    --ink:#1a1d1b; --ink-dim:#535b56; --ink-faint:#868f89;
    --mono:ui-monospace,"SF Mono","Cascadia Code",Menlo,monospace;
    --sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    --serif:ui-serif,Georgia,"Times New Roman",serif;
  }
  @media (prefers-color-scheme: dark){
    :root{ --c:${p.accentDark}; --bg:#0e100f; --surface:#161a18; --surface-2:#1c211e; --line:#2a322d; --line-soft:#212824;
      --ink:#eef2ef; --ink-dim:#a6b1aa; --ink-faint:#6c7772; }
  }
  :root[data-theme="light"]{ --c:${p.accent}; --bg:#f6f5f1;--surface:#ffffff;--surface-2:#efeee7;--line:#e1dfd4;--line-soft:#ece9df;--ink:#1a1d1b;--ink-dim:#535b56;--ink-faint:#868f89; }
  :root[data-theme="dark"]{ --c:${p.accentDark}; --bg:#0e100f;--surface:#161a18;--surface-2:#1c211e;--line:#2a322d;--line-soft:#212824;--ink:#eef2ef;--ink-dim:#a6b1aa;--ink-faint:#6c7772; }
  *{ box-sizing:border-box; }
  body{ margin:0; background:var(--bg); color:var(--ink); font-family:var(--sans); line-height:1.6; -webkit-font-smoothing:antialiased; }
  .wrap{ max-width:860px; margin:0 auto; padding:0 24px; }
  a{ color:var(--c); }
  header{ position:relative; overflow:hidden; border-bottom:1px solid var(--line);
    background:radial-gradient(130% 90% at 82% -25%, color-mix(in srgb,var(--c) 16%,transparent), transparent 58%); }
  .hero{ padding:70px 0 54px; min-height:120px; }
  .eyebrow{ font-family:var(--mono); font-size:12px; letter-spacing:.22em; text-transform:uppercase; color:var(--c); margin:0 0 18px; display:flex; align-items:center; gap:12px; }
  .eyebrow::after{ content:""; flex:1; height:1px; background:linear-gradient(90deg,var(--line),transparent); max-width:240px; }
  .flag{ display:inline-block; font-family:var(--mono); font-size:10.5px; letter-spacing:.12em; text-transform:uppercase; color:var(--c); border:1px solid var(--c); border-radius:20px; padding:4px 11px; margin-bottom:16px; }
  h1{ font-family:var(--serif); font-weight:600; font-size:clamp(44px,9vw,88px); line-height:.98; margin:0 0 16px; letter-spacing:-.03em; color:var(--c); }
  .tagline{ font-family:var(--serif); font-style:italic; font-size:clamp(18px,3vw,24px); color:var(--ink); margin:0 0 20px; }
  .position{ font-size:clamp(16px,2.2vw,19px); color:var(--ink-dim); max-width:60ch; margin:0; }
  section{ padding:46px 0; border-bottom:1px solid var(--line); }
  .sec-eye{ font-family:var(--mono); font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--ink-faint); margin:0 0 18px; }
  h2{ font-family:var(--serif); font-weight:600; font-size:26px; margin:0 0 18px; letter-spacing:-.01em; }
  .part{ display:grid; grid-template-columns:190px 1fr; gap:16px; padding:13px 0; border-top:1px solid var(--line-soft); }
  .part:last-child{ border-bottom:1px solid var(--line-soft); }
  .part .role{ font-weight:700; font-size:14px; color:var(--c); }
  .part.future .role{ color:var(--ink-faint); } .part.future .role em{ font-style:normal; font-size:11px; }
  .part .src{ font-size:14px; color:var(--ink-dim); }
  .part .src a{ font-weight:600; }
  .grid2{ display:grid; grid-template-columns:1fr 1fr; gap:28px; }
  .lbl{ font-family:var(--mono); font-size:10.5px; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-faint); margin-bottom:6px; }
  .val{ font-size:15px; color:var(--ink-dim); } .val b{ color:var(--ink); }
  .prices{ display:flex; gap:8px; margin-top:6px; }
  .prc{ flex:1; text-align:center; background:var(--surface); border:1px solid var(--line); border-radius:11px; padding:14px 8px; }
  .prc.core{ border-color:var(--c); background:color-mix(in srgb,var(--c) 10%,var(--surface)); }
  .prc .pl{ font-family:var(--mono); font-size:9.5px; letter-spacing:.06em; text-transform:uppercase; color:var(--ink-faint); }
  .prc .pv{ font-size:19px; font-weight:800; margin-top:3px; font-variant-numeric:tabular-nums; }
  .why{ background:var(--surface-2); border:1px solid var(--line-soft); border-radius:12px; padding:16px 20px; font-size:14px; color:var(--ink-dim); }
  .why b{ color:var(--ink); }
  .cta{ display:flex; flex-wrap:wrap; gap:12px; align-items:center; padding:40px 0 66px; }
  .btn{ font:inherit; font-weight:700; font-size:14px; text-decoration:none; border-radius:10px; padding:12px 20px; background:var(--c); color:var(--bg); }
  .btn.ghost{ background:transparent; color:var(--c); border:1px solid var(--c); }
  .btn.buy{ box-shadow:0 8px 24px -12px color-mix(in srgb,var(--c) 70%,transparent); }
  .prc-buy{ display:inline-block; margin-top:9px; font-family:var(--mono); font-size:11px; font-weight:700; letter-spacing:.04em; text-decoration:none; color:var(--c); border:1px solid var(--c); border-radius:7px; padding:4px 12px; }
  .prc-buy:hover{ background:var(--c); color:var(--bg); }
  .part.gated .role{ color:var(--ink); }
  .osband{ background:var(--surface-2); }
  .osband h2{ margin-top:2px; }
  .os-desc{ color:var(--ink-dim); max-width:62ch; margin:0 0 18px; }
  .os-cta{ display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
  .btn.os{ background:var(--c); border-color:var(--c); color:#12100c; font-weight:750; }
  .os-lock{ font-family:var(--mono); font-size:12px; letter-spacing:.05em; text-transform:uppercase;
            color:var(--ink-faint); }
  .os-note{ margin:16px 0 0; font-size:13.5px; color:var(--ink-faint); max-width:62ch; }
  .src-lock{ font-weight:600; color:var(--ink-faint); }
  .status{ font-size:13px; color:var(--ink-faint); }
  footer{ padding:24px 0 60px; }
  .foot{ font-size:12.5px; color:var(--ink-faint); border-top:1px solid var(--line); padding-top:18px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px; }
  .foot a{ color:var(--c); }
  .toggle{ position:fixed; top:14px; right:16px; font:inherit; font-size:12.5px; font-weight:650; cursor:pointer; border:1px solid var(--line); background:color-mix(in srgb,var(--bg) 80%,transparent); backdrop-filter:blur(8px); color:var(--ink); border-radius:9px; padding:7px 11px; z-index:9; }
  .brandmark{ position:fixed; top:12px; left:16px; z-index:9; display:flex; align-items:center; gap:8px; text-decoration:none; }
  .brandmark img{ width:32px; height:32px; border-radius:8px; background:#fff; border:1px solid var(--line); object-fit:cover; box-shadow:0 1px 5px rgba(0,0,0,.2); }
  .brandmark span{ font-size:12.5px; font-weight:700; color:var(--ink-dim); }
  @media (max-width:620px){ .grid2{ grid-template-columns:1fr; } .part{ grid-template-columns:1fr; gap:4px; } .brandmark span{ display:none; } }
  @media (prefers-reduced-motion:reduce){ *{ transition:none!important; } }
  .startcta{ padding:48px 0 52px; text-align:center; border-bottom:1px solid var(--line); background:radial-gradient(120% 130% at 50% 120%, color-mix(in srgb,var(--c) 9%,transparent), transparent 62%); }
  .startcta .sc-eye{ font-family:var(--mono); font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--c); margin-bottom:12px; }
  .startcta .sc-h{ font-family:var(--serif); font-weight:600; font-size:clamp(24px,3.6vw,34px); margin:0 0 22px; letter-spacing:-.01em; }
  .startcta .btn{ font-size:15px; padding:14px 26px; }
</style>
</head>
<body>
<a class="brandmark" href="${esc(HUB)}" aria-label="Vision Outreach Media — the house"><img src="${LOGO}" alt="VOM" width="128" height="128"><span>VOM</span></a>
<button class="toggle" id="t">◐ Theme</button>
<header><div class="wrap hero" id="hero"></div></header>
<main id="content"></main>
<section class="startcta"><div class="wrap">
  <div class="sc-eye">◆ Get started</div>
  <h2 class="sc-h">${esc(p.tagline || p.name)}</h2>
  <a class="btn buy" href="${esc(scUrl)}" target="_blank" rel="noopener">${esc(scLabel)}</a>
</div></section>
<style>
  .join{ max-width:860px; margin:0 auto; padding:8px 24px 44px; }
  .join-in{ border:1px solid color-mix(in srgb,var(--c) 30%,var(--line)); border-radius:16px; padding:24px 26px;
    background:radial-gradient(120% 130% at 0% 0%, color-mix(in srgb,var(--c) 10%,transparent), transparent 60%), var(--surface); }
  .join-eyebrow{ font-family:var(--mono); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--c); margin-bottom:9px; }
  .join h3{ font-family:var(--serif); font-size:23px; font-weight:600; margin:0 0 6px; }
  .join .join-in > p{ margin:0 0 16px; color:var(--ink-dim); font-size:14.5px; max-width:56ch; }
  .jform{ display:flex; gap:10px; flex-wrap:wrap; }
  .jform input[type=email]{ flex:1; min-width:210px; font:inherit; font-size:15px; padding:11px 14px; border:1px solid var(--line); border-radius:10px; background:var(--bg); color:var(--ink); }
  .jform input[type=email]:focus{ outline:2px solid var(--c); outline-offset:1px; border-color:var(--c); }
  .jform button{ font:inherit; font-size:15px; font-weight:700; padding:11px 20px; border-radius:10px; border:1px solid var(--c); background:var(--c); color:var(--bg); cursor:pointer; }
  .jform button:hover{ filter:brightness(1.05); } .jform button:disabled{ opacity:.6; cursor:default; }
  .jnote{ margin:11px 0 0; font-size:13.5px; color:var(--c); min-height:1em; }
  .jnote.err{ color:#c0453b; }
  .join.done .jform{ display:none; }
</style>
<section class="join">
  <div class="join-in" id="joinCard">
    <div class="join-eyebrow">◆ Vision Outreach Media</div>
    <h3>Not ready yet? Join the list.</h3>
    <p>New tools, playbooks, and launches from the VOM house — sent as they ship. No spam; leave anytime.</p>
    <form id="jform" class="jform" action="https://formsubmit.co/ajax/hello@visionoutreachmedia.nl" method="POST">
      <input type="email" name="email" required placeholder="you@work.com" aria-label="Your email" autocomplete="email">
      <input type="hidden" name="_subject" value="New VOM house signup">
      <input type="hidden" name="source" value="${esc(p.name)} page">
      <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
      <button type="submit">Join →</button>
    </form>
    <p class="jnote" id="jnote" role="status"></p>
  </div>
</section>
<script>
(function(){
  var f=document.getElementById("jform"); if(!f) return;
  var note=document.getElementById("jnote"), card=document.getElementById("joinCard");
  f.addEventListener("submit", function(e){
    e.preventDefault();
    var b=f.querySelector("button"), old=b.textContent; b.disabled=true; b.textContent="Joining\\u2026";
    note.className="jnote"; note.textContent="";
    fetch(f.action,{method:"POST",headers:{"Accept":"application/json"},body:new FormData(f)})
      .then(function(r){ return r.json(); })
      .then(function(d){ if(d&&(d.success===true||String(d.success)==="true")){ card.classList.add("done"); note.textContent="You're on the list. Talk soon."; } else { throw 0; } })
      .catch(function(){ b.disabled=false; b.textContent=old; note.className="jnote err"; note.textContent="Couldn't sign you up just now \\u2014 please try again."; });
  });
})();
</script>
<footer><div class="wrap foot">
  <span>${esc(p.name)} — part of the Vision Outreach Media house of operating systems.</span>
  <span><a href="${esc(HUB)}" target="_blank" rel="noopener">The house →</a></span>
</div></footer>
<script>
${CLIENT_RENDER}
var SLUG=${JSON.stringify(p.slug)};
var CENTRAL=${JSON.stringify(HUB + "/products.json")};
var FALLBACK=${JSON.stringify(p)};
renderProduct(FALLBACK); // instant paint from baked copy
fetch(CENTRAL,{cache:"no-store"})
  .then(function(r){ if(!r.ok) throw 0; return r.json(); })
  .then(function(list){ var live=list.filter(function(x){return x.slug===SLUG;})[0]; if(live){ renderProduct(live); } markLive(true); })
  .catch(function(){ markLive(false); });
var t=document.getElementById("t");
t.onclick=function(){var c=document.documentElement.getAttribute("data-theme");var n=c==="dark"?"light":(c==="light"?"dark":(matchMedia("(prefers-color-scheme: dark)").matches?"light":"dark"));document.documentElement.setAttribute("data-theme",n);try{localStorage.setItem("th",n)}catch(e){}};
try{var s=localStorage.getItem("th");if(s)document.documentElement.setAttribute("data-theme",s)}catch(e){}
</script>
</body>
</html>
`;
}

function readme(p) {
  const parts = p.parts.map((pt) => {
    const src = pt.url ? `[${pt.name}](${pt.url})` : (pt.name || "—");
    return `| ${pt.future ? "◇ " : ""}**${pt.role}** — ${pt.desc} | ${src} |`;
  }).join("\n");
  const prices = p.prices.map((pr) => `- **${pr.label}** — ${pr.value}${pr.core ? " ← the one we sell" : ""}`).join("\n");
  return `# ${p.name}${p.flagship ? "  ◆ Flagship" : ""}

> **${p.type}**${p.alt && p.alt !== "keep as-is" ? ` — *alt name: ${p.alt}*` : ""}
> ${p.positioning}

**Tagline:** *"${p.tagline}"*

> ⚡ This landing page is **live-data driven** — it fetches its copy/pricing from the shared
> \`products.json\` served by the hub at ${HUB}/products.json, and falls back to a baked copy
> if the hub is unreachable. Edit copy in \`_build/products.json\`, not in \`index.html\`.

---

## Assembled from
| Part | Artifact |
|------|----------|
${parts}

## Who it's for
${p.who}

## The promise
${p.promise}

## Price posture
${prices}

## Why "${p.name}"
${p.whyName}

---
*Part of the Vision Outreach Media house of operating systems.*
`;
}

// ---------------- the house hub (also live-data driven, same-origin) ----------------
function hubPage() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>VOM Systems — A House of Operating Systems</title>
<meta name="description" content="Vision Outreach Media's operating systems: six branded products that turn ideas into launched, self-running outcomes.">
<link rel="icon" type="image/jpeg" href="${LOGO}">
<style>
  :root{
    --bg:#0e100f; --surface:#161a18; --surface-2:#1c211e; --line:#2a322d; --line-soft:#212824;
    --ink:#eef2ef; --ink-dim:#a6b1aa; --ink-faint:#6c7772; --accent:#e8c37a;
    --money:#38d07f; --vom:#f0a24b; --church:#a48cf5; --guides:#5fb9e8; --tools:#f2765c; --health:#3fd0c0;
    --mono:ui-monospace,"SF Mono",Menlo,monospace; --sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; --serif:ui-serif,Georgia,"Times New Roman",serif;
  }
  @media (prefers-color-scheme: light){ :root{ --bg:#f5f4ef;--surface:#ffffff;--surface-2:#efeee7;--line:#e1dfd4;--line-soft:#ece9df;--ink:#1a1d1b;--ink-dim:#535b56;--ink-faint:#868f89;--accent:#a9812c;--money:#12a35a;--vom:#c47716;--church:#6b56d6;--guides:#2b86bd;--tools:#d1522f;--health:#0f9f8f; } }
  :root[data-theme="dark"]{ --bg:#0e100f;--surface:#161a18;--surface-2:#1c211e;--line:#2a322d;--line-soft:#212824;--ink:#eef2ef;--ink-dim:#a6b1aa;--ink-faint:#6c7772;--accent:#e8c37a;--money:#38d07f;--vom:#f0a24b;--church:#a48cf5;--guides:#5fb9e8;--tools:#f2765c;--health:#3fd0c0; }
  :root[data-theme="light"]{ --bg:#f5f4ef;--surface:#ffffff;--surface-2:#efeee7;--line:#e1dfd4;--line-soft:#ece9df;--ink:#1a1d1b;--ink-dim:#535b56;--ink-faint:#868f89;--accent:#a9812c;--money:#12a35a;--vom:#c47716;--church:#6b56d6;--guides:#2b86bd;--tools:#d1522f;--health:#0f9f8f; }
  *{ box-sizing:border-box; } body{ margin:0; background:var(--bg); color:var(--ink); font-family:var(--sans); line-height:1.6; -webkit-font-smoothing:antialiased; }
  .wrap{ max-width:1080px; margin:0 auto; padding:0 24px; } a{ color:inherit; text-decoration:none; }
  [data-c=money]{ --c:var(--money); } [data-c=vom]{ --c:var(--vom); } [data-c=church]{ --c:var(--church); } [data-c=guides]{ --c:var(--guides); } [data-c=tools]{ --c:var(--tools); } [data-c=health]{ --c:var(--health); }
  header{ position:relative; overflow:hidden; border-bottom:1px solid var(--line); background:radial-gradient(130% 90% at 85% -20%, color-mix(in srgb,var(--accent) 15%,transparent), transparent 58%); }
  .hero{ padding:66px 0 50px; }
  .eyebrow{ font-family:var(--mono); font-size:12px; letter-spacing:.24em; text-transform:uppercase; color:var(--accent); margin:0 0 20px; display:flex; align-items:center; gap:12px; }
  .eyebrow::after{ content:""; flex:1; height:1px; background:linear-gradient(90deg,var(--line),transparent); max-width:260px; }
  .brandlock{ display:flex; align-items:center; gap:13px; margin:0 0 22px; }
  .brandlock .blogo{ width:46px; height:46px; border-radius:11px; background:#fff; border:1px solid var(--line); object-fit:cover; box-shadow:0 2px 8px rgba(0,0,0,.18); flex-shrink:0; }
  .brandlock .eyebrow{ margin:0; }
  h1{ font-family:var(--serif); font-weight:600; font-size:clamp(38px,6.6vw,66px); line-height:1.02; margin:0 0 16px; letter-spacing:-.02em; text-wrap:balance; }
  h1 em{ font-style:italic; color:var(--accent); }
  .lead{ font-size:clamp(16px,2.2vw,20px); color:var(--ink-dim); max-width:62ch; margin:0; } .lead b{ color:var(--ink); }
  section{ padding:44px 0; border-bottom:1px solid var(--line); }
  .aud-head{ display:flex; align-items:baseline; gap:14px; margin:0 0 22px; }
  .aud-head h2{ font-family:var(--serif); font-weight:600; font-size:24px; margin:0; }
  .aud-head .tag{ font-family:var(--mono); font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-faint); }
  .grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:16px; }
  .pcard{ display:flex; flex-direction:column; background:var(--surface); border:1px solid var(--line); border-radius:15px; padding:22px; position:relative; overflow:hidden; transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease; }
  .pcard::before{ content:""; position:absolute; inset:0 auto 0 0; width:4px; background:var(--c); }
  .pcard:hover{ transform:translateY(-3px); border-color:color-mix(in srgb,var(--c) 55%,var(--line)); box-shadow:0 18px 40px -22px color-mix(in srgb,var(--c) 60%,transparent); }
  .pc-top{ display:flex; align-items:center; gap:10px; margin-bottom:14px; }
  .pc-type{ font-family:var(--mono); font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--c); }
  .pc-flag{ margin-left:auto; font-family:var(--mono); font-size:9.5px; letter-spacing:.1em; text-transform:uppercase; color:var(--c); border:1px solid var(--c); border-radius:20px; padding:3px 9px; }
  .pc-name{ font-family:var(--serif); font-size:30px; font-weight:600; line-height:1; color:var(--c); letter-spacing:-.01em; }
  .pc-tag{ font-family:var(--serif); font-style:italic; font-size:15px; color:var(--ink); margin:8px 0 10px; }
  .pc-pos{ font-size:13.5px; color:var(--ink-dim); margin:0 0 18px; flex:1; }
  .pc-foot{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding-top:13px; border-top:1px solid var(--line-soft); }
  .pc-price{ font-family:var(--mono); font-size:12px; color:var(--ink-faint); }
  .pc-go{ font-size:12.5px; font-weight:700; color:var(--c); }
  footer{ padding:30px 0 60px; } .foot{ font-size:12.5px; color:var(--ink-faint); border-top:1px solid var(--line); padding-top:20px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px; }
  .foot a{ color:var(--accent); } .foot .live{ color:var(--accent); }
  .toggle{ position:fixed; top:14px; right:16px; font:inherit; font-size:12.5px; font-weight:650; cursor:pointer; border:1px solid var(--line); background:color-mix(in srgb,var(--bg) 80%,transparent); backdrop-filter:blur(8px); color:var(--ink); border-radius:9px; padding:7px 11px; z-index:9; }
  @media (max-width:560px){ .grid{ grid-template-columns:1fr; } }
  @media (prefers-reduced-motion:reduce){ *{ transition:none!important; } }
</style>
</head>
<body>
<button class="toggle" id="t">◐ Theme</button>
<header><div class="wrap hero">
  <div class="brandlock"><img class="blogo" src="${LOGO}" alt="Vision Outreach Media logo" width="128" height="128"><p class="eyebrow">Vision Outreach Media</p></div>
  <h1>A house of <em>operating systems.</em></h1>
  <p class="lead">Six branded products, one idea: every system is a repeatable machine that turns intent into a launched, self-running outcome. Built for <b>operators</b> who grow businesses — and one <b>consumer</b> arm for personal outcomes.</p>
  <p style="margin-top:24px;font-family:var(--mono);font-size:12.5px;letter-spacing:.03em"><a href="/funnels.html" style="color:var(--accent);text-decoration:none">&#9670; See the two funnels &mdash; how each line climbs to its core product &rarr;</a></p>
</div></header>

<section><div class="wrap">
  <div class="aud-head"><h2>For operators</h2><span class="tag">B2B · build, launch &amp; grow businesses</span></div>
  <div class="grid" id="ops"></div>
</div></section>

<section style="border-bottom:none"><div class="wrap">
  <div class="aud-head"><h2>For consumers</h2><span class="tag">B2C · personal outcomes</span></div>
  <div class="grid" id="con"></div>
</div></section>

<footer><div class="wrap foot">
  <span>VOM Systems — the house. <span class="live" id="live"></span></span>
  <span>The <a href="/funnels.html">two funnels</a> &middot; the <a href="https://artifact-hub-nu.vercel.app" target="_blank" rel="noopener">Studio Index</a></span>
</div></footer>
<script>
var LIVE=${JSON.stringify(LIVE)};
var COLOR=${JSON.stringify(COLOR)};
var OPERATORS=${JSON.stringify(OPERATORS)};
var CONSUMER=${JSON.stringify(CONSUMER)};
var FALLBACK=${JSON.stringify(products)};
function esc(s){return String(s==null?"":s).replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c];});}
function card(p){
  var core=(p.prices||[]).filter(function(x){return x.core;})[0]||(p.prices||[])[0]||{label:"",value:""};
  var buyTier=(p.prices||[]).filter(function(x){return x.checkout;})[0];
  return '<a class="pcard" data-c="'+COLOR[p.slug]+'" href="'+esc(LIVE[p.slug])+'" target="_blank" rel="noopener">'+
    '<div class="pc-top"><span class="pc-type">'+esc(p.type)+'</span>'+
      (buyTier?'<span class="pc-flag" style="margin-left:auto;color:var(--bg);background:var(--c);border-color:var(--c)">\\u25cf Now selling</span>':(p.flagship?'<span class="pc-flag">\\u25c6 Flagship</span>':''))+'</div>'+
    '<div class="pc-name">'+esc(p.name)+'</div>'+
    '<div class="pc-tag">\\u201c'+esc(p.tagline)+'\\u201d</div>'+
    '<p class="pc-pos">'+esc(p.positioning)+'</p>'+
    '<div class="pc-foot"><span class="pc-price">'+(buyTier?'From '+esc(buyTier.value):esc(core.label)+' \\u00b7 '+esc(core.value))+'</span><span class="pc-go">'+(buyTier?'Buy '+esc(buyTier.value)+' \\u2197':'Visit site \\u2197')+'</span></div></a>';
}
function paint(list){
  var by={}; list.forEach(function(p){ by[p.slug]=p; });
  document.getElementById("ops").innerHTML = OPERATORS.filter(function(s){return by[s];}).map(function(s){return card(by[s]);}).join('');
  document.getElementById("con").innerHTML = CONSUMER.filter(function(s){return by[s];}).map(function(s){return card(by[s]);}).join('');
}
paint(FALLBACK);
fetch("./products.json",{cache:"no-store"})
  .then(function(r){ if(!r.ok) throw 0; return r.json(); })
  .then(function(list){ paint(list); document.getElementById("live").textContent="\\u25cf live \\u00b7 synced from products.json"; })
  .catch(function(){ document.getElementById("live").textContent=""; });
var t=document.getElementById("t");
t.onclick=function(){var c=document.documentElement.getAttribute("data-theme");var n=c==="dark"?"light":(c==="light"?"dark":(matchMedia("(prefers-color-scheme: dark)").matches?"light":"dark"));document.documentElement.setAttribute("data-theme",n);try{localStorage.setItem("th",n)}catch(e){}};
try{var s=localStorage.getItem("th");if(s)document.documentElement.setAttribute("data-theme",s)}catch(e){}
</script>
</body>
</html>
`;
}

// ---------------- gated OS bundle ----------------
// A product's OS is NOT a file in its public folder — that would make an unlisted URL the
// only protection. The source lives here in _build/, and is compiled into a module that only
// the serverless gate (api/os.js) can serve, to a request that already holds a session.
function emitOsBundle(p) {
  if (!p.os) return false;
  const appSrc  = path.join(__dirname, p.os.source || (p.slug + "-os.html"));
  const gateSrc = path.join(__dirname, p.os.gate   || (p.slug + "-gate.html"));
  if (!fs.existsSync(appSrc) || !fs.existsSync(gateSrc)) {
    console.log("  !! " + p.slug + ": os source missing, skipped");
    return false;
  }
  let catalog = "null";
  if (p.os.catalog) {
    const cp = path.join(__dirname, p.os.catalog);
    if (fs.existsSync(cp)) catalog = fs.readFileSync(cp, "utf8").trim();
  }
  const fill = (file) => fs.readFileSync(file, "utf8")
    .split("{{LOGO}}").join(LOGO)
    .split("{{CATALOG}}").join(catalog);

  const libDir = path.join(ROOT, p.slug, "api", "_lib");
  fs.mkdirSync(libDir, { recursive: true });
  fs.writeFileSync(path.join(libDir, "os-app.js"),
    "// GENERATED by _build/build.js from _build/" + path.basename(appSrc) + " — do not edit.\n" +
    "// Served only by api/os.js, and only to a request holding a valid OS session.\n" +
    "'use strict';\n" +
    "module.exports = {\n  app: " + JSON.stringify(fill(appSrc)) + ",\n" +
    "  gate: " + JSON.stringify(fill(gateSrc)) + ",\n};\n");
  return true;
}

// ---------------- emit ----------------
for (const p of products) {
  const dir = path.join(ROOT, p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), productPage(p));
  fs.writeFileSync(path.join(dir, "README.md"), readme(p));
  fs.writeFileSync(path.join(dir, ".gitignore"), ".vercel\n.env.local\nnode_modules\n.DS_Store\n");
  const os = emitOsBundle(p);
  console.log("built », " + p.slug + (os ? "  (+ gated OS bundle)" : ""));
}

// hub: page + CANONICAL data file + CORS headers
const hubDir = path.join(ROOT, "hub");
fs.mkdirSync(hubDir, { recursive: true });
fs.writeFileSync(path.join(hubDir, "index.html"), hubPage());
fs.writeFileSync(path.join(hubDir, "products.json"), JSON.stringify(products, null, 2) + "\n");
fs.writeFileSync(path.join(hubDir, "vercel.json"), JSON.stringify({
  headers: [
    { source: "/products.json", headers: [
      { key: "Access-Control-Allow-Origin", value: "*" },
      { key: "Cache-Control", value: "public, max-age=60" },
    ]},
  ],
}, null, 2) + "\n");
fs.writeFileSync(path.join(hubDir, ".gitignore"), ".vercel\n.env.local\nnode_modules\n.DS_Store\n");
fs.writeFileSync(path.join(hubDir, "README.md"),
  "# VOM Systems — the house hub\n\n" +
  "Landing page for every system product, **plus the canonical `products.json`** that every\n" +
  "product landing page fetches live (served here with `Access-Control-Allow-Origin: *`).\n\n" +
  "**To change any product's copy, pricing, or parts:** edit `_build/products.json`, run\n" +
  "`node _build/build.js`, then commit & push this hub repo — all product pages pick it up live.\n");
console.log("built », hub (+ canonical products.json, CORS)");
console.log("done: " + products.length + " products + hub");
