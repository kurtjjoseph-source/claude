/* ===========================================================================
   workspace.js — piece 4 · the composed surface
   Vision Outreach Media · intent-based browsing prototype

   Owns primitives 3 (workspace, not tabs) and 4 (every claim carries
   provenance), plus the primitive-6 staging hook (stage + emit only; the
   confirm gate belongs to standing.js).

   Exposes exactly:
     IB.workspace.mount(el)
     IB.workspace.render(intentObject)
     IB.workspace.swap(paneId, altPaneId)
     IB.workspace.dismiss(paneId)

   ---------------------------------------------------------------------------
   CLASS NAMES THIS FILE RELIES ON — for builder 6 (src/app.css)
   Every one is prefixed ib-. A minimal fallback stylesheet is injected as the
   FIRST child of <head> (id="ib-workspace-fallback") so app.css, loaded after,
   always wins on equal specificity. Restyle freely.

   Six rules use a doubled selector (.vk-card.ib-pane, .ib-pane-foot.vk-note,
   .ib-ws-note.vk-note, .ib-warn.vk-note, .ib-note-claim.vk-p,
   .ib-list-item.vk-item, .ib-swap-menu .ib-swap-opt) only because they must
   out-rank the kit component sitting on the same element. To override those,
   match the same doubled form. Everything else is a plain single class.

     ib-ws                 root section rendered inside #ib-workspace
     ib-ws-head            workspace header strip
     ib-ws-headings        left side of the header (kicker + sub + note)
     ib-ws-kicker          "Composed workspace · N panes" (uses .vk-shead)
     ib-ws-sub             one-line goal summary
     ib-ws-note            persistent honesty + restorability line
     ib-ws-tools           right side of the header — dismissed-pane tray
     ib-dismissed          the tray wrapper
     ib-dismissed-label    "Dismissed" label
     ib-restore            a restore button
     ib-panes              the grid
     ib-pane               one pane (also carries .vk-card)
     ib-pane--wide         span-3 weight   (kind: table)
     ib-pane--mid          span-2 weight   (kind: list)
     ib-pane--narrow       span-1 weight   (kind: stat / note / unknown)
     ib-pane.is-unsourced  pane whose own source, or any claim's source, does
                           not resolve in IB.fixtures.sources
     ib-pane-head          pane header row
     ib-pane-heading       title + meta column
     ib-pane-title         pane title (also .vk-h3)
     ib-pane-meta          pill row: kind · scripted · source chip
     ib-pane-acts          swap + dismiss controls
     ib-swap               <details> wrapper for a multi-alternate swap menu
     ib-swap-sum           its <summary> (styled as .vk-btn)
     ib-swap-menu          the menu body
     ib-swap-opt           one alternate button
     ib-pane-flag          "changed" flag written by intent:change
     ib-pane-change        the watch's own note, rendered under the pane head
                           whenever that flag is showing
     ib-warn               loud unsourced warning banner inside a pane
     ib-pane-body          pane content
     ib-pane-foot          per-pane provenance summary
     ib-cell-src           table cell holding a row's source chip
     ib-srcdock            holds a table's reveals BELOW the scrolling table
     ib-srcdetail          the revealed source block (name · kind · note)
     ib-srcdetail-host     the <li> that carries a reveal inside a list pane
     ib-srcdetail-for      which claim the reveal belongs to
     ib-srcdetail-name     the source name line
     ib-srcdetail-kind     the source kind line
     ib-srcdetail-note     the source note paragraph
     ib-row                a table row carrying one claim
     ib-srcdetail-foot     "scripted fixture" footnote
     ib-chip               a source chip button
     ib-chip-label         the <span> inside it that carries the ellipsis
     ib-chip--bad          unsourced variant of the chip
     ib-list               list-kind body
     ib-list-item          one list claim (also .vk-item)
     ib-list-main          text column of a list claim
     ib-note-body          note-kind body
     ib-note-claim         one note paragraph
     ib-stat-chipwrap      chip row inside a .vk-fact
     ib-staged             the staged-action card (primitive 6)
     ib-staged-head        its heading block
     ib-staged-line        detail / consequence lines
     ib-staged-status      role="status" line after staging
     ib-empty              all-panes-dismissed empty state
     ib-live               visually hidden aria-live announcer

   INTERPRETATIONS (documented for the integrator)
   - render(o) resets pane state only when the signature (intent id + pane list)
     changes; an identical re-render preserves swaps, dismissals and open
     source details, which keeps render() idempotent either way.
   - Pane weight is derived from `kind`, so the grid is genuinely composed
     rather than four equal cards.
   - swap() records the reverse mapping, so a swapped-in pane can always be
     swapped back even if its own `alternates` array does not point home.
   - The staged-action card is single-state. Its heading, its button and its
     status line all derive from `intent.staged` plus st.stagedLabel/State, so
     the three can never disagree. A status survives only while it still
     describes the action this intent offers; the gate's own outcome arrives on
     `action:confirmed` / `action:cancelled` ({intentId, label}) and rewrites it
     in the past tense. Neither event arriving is safe: render() still drops a
     status whose action is no longer on offer.
   - `staged.none` marks a placeholder ("No fare to hold") rather than an action.
     It cannot be staged and its button renders disabled. An absent flag means
     the offer stands, so an older resolve.js keeps working.
   - A pane's own `source` is resolved through IB.fixtures.sources by its `id`,
     exactly like a claim's `sourceId`. The name it carries is presentation, not
     provenance, so a pane whose id is absent or unresolvable is unsourced and
     is flagged as loudly as an unresolved row: bad chip, banner, red border.
   =========================================================================== */

window.IB = window.IB || {};

(function () {
  'use strict';

  /* ------------------------------------------------------------ fallback css */
  var FALLBACK = [
    '.ib-ws{display:block}',
    '.ib-ws [hidden]{display:none !important}',
    '.ib-ws :focus-visible{outline:2px solid var(--c);outline-offset:2px;border-radius:var(--radius-sm)}',
    '.ib-live{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}',
    '.ib-ws-head{display:flex;flex-wrap:wrap;gap:var(--s3);align-items:flex-end;justify-content:space-between;margin:0 0 var(--s3)}',
    '.ib-ws-headings{min-width:0;flex:1 1 260px}',
    '.ib-ws-kicker{margin:0 0 var(--s1)}',
    '.ib-ws-sub{margin:0}',
    '.ib-ws-note{margin:var(--s1) 0 0}',
    '.ib-ws-note.vk-note{color:var(--ink-faint)}',
    '.ib-ws-tools{display:flex;flex-wrap:wrap;gap:var(--s1);align-items:center;min-width:0}',
    '.ib-dismissed{display:flex;flex-wrap:wrap;gap:var(--s1);align-items:center;min-width:0;max-width:100%}',
    '.ib-dismissed-label{margin:0}',
    /* the restore label is a fixture title, so it must be allowed to wrap —
       out-ranks both .vk-btn and app.css .ib-restore{white-space:nowrap} */
    '.ib-dismissed .ib-restore{white-space:normal;text-align:left;justify-content:flex-start;max-width:100%;overflow-wrap:anywhere}',
    '.ib-panes{display:grid;gap:var(--s3);grid-template-columns:repeat(3,minmax(0,1fr));align-items:start}',
    '.ib-pane{min-width:0;grid-column:span 1}',
    /* these few carry a doubled selector purely to out-rank the kit component
       they sit on — the kit stylesheet loads after this fallback */
    '.vk-card.ib-pane{padding:0;overflow:visible}',
    '.ib-pane--wide{grid-column:span 3}',
    '.ib-pane--mid{grid-column:span 2}',
    '.ib-pane.is-unsourced{border-color:var(--bad)}',
    '.ib-pane-head{display:flex;flex-wrap:wrap;gap:var(--s2);align-items:flex-start;justify-content:space-between;padding:var(--s3) var(--s4);border-bottom:1px solid var(--line)}',
    '.ib-pane-heading{min-width:0;flex:1 1 180px}',
    '.ib-pane-title{margin:0 0 var(--s1);overflow-wrap:anywhere}',
    '.ib-pane-meta{display:flex;flex-wrap:wrap;gap:var(--s1);align-items:center;min-width:0}',
    '.ib-pane-acts{display:flex;gap:var(--s1);align-items:center;flex:none}',
    '.ib-pane-body{padding:var(--s3) var(--s4)}',
    '.ib-pane-body>.vk-tablewrap{margin:0 calc(-1 * var(--s4));padding:0 var(--s4)}',
    '.ib-pane-foot{padding:var(--s2) var(--s4) var(--s3);border-top:1px solid var(--line-soft);margin:0;overflow-wrap:anywhere}',
    '.ib-pane-foot.vk-note{color:var(--ink-faint)}',
    '.ib-swap{position:relative}',
    '.ib-swap>summary{list-style:none;cursor:pointer}',
    '.ib-swap>summary::-webkit-details-marker{display:none}',
    '.ib-swap-menu{position:absolute;top:calc(100% + var(--s1));right:0;z-index:6;display:grid;gap:var(--s1);padding:var(--s2);background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow)}',
    /* An EXPLICIT width, not min-width: app.css zeroes min-width on every
       .ib-ws descendant, which collapsed this popover to the min-content of its
       heading. The doubled selector out-ranks that single-class rule. */
    '.ib-pane-acts .ib-swap-menu{width:min(240px, calc(100vw - var(--s6)))}',
    /* three classes deep so the label wraps in spite of .ib-pane-acts .vk-btn */
    '.ib-pane-acts .ib-swap-menu .ib-swap-opt{display:flex;justify-content:flex-start;width:100%;text-align:left;white-space:normal;overflow-wrap:anywhere}',
    '.ib-warn{display:flex;flex-wrap:wrap;gap:var(--s1);align-items:baseline;margin:0;padding:var(--s2) var(--s4);background:color-mix(in srgb,var(--bad) 10%,var(--surface));border-bottom:1px solid var(--line)}',
    '.ib-warn.vk-note{color:var(--ink)}',
    /* the standing watch's own words, so the "changed" pill is never an
       unexplained accusation against a pane that reads as identical */
    '.ib-pane-change{margin:0;padding:var(--s2) var(--s4);background:var(--surface-2);border-bottom:1px solid var(--line-soft);overflow-wrap:anywhere}',
    '.ib-pane-change.vk-note{color:var(--ink-soft)}',
    '.ib-pane-change .vk-shead{margin:0;display:inline}',
    '.ib-chip{cursor:pointer;border:1px solid var(--line);max-width:100%;vertical-align:middle}',
    '.ib-chip .ib-chip-label{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    /* The pane-header chip is NOT clamped: the pane's own source is primitive
       4's most prominent claim, and app.css clamps every .ib-chip to 20ch —
       right for an inline claim chip, wrong here. 0,3,0 out-ranks it, and the
       meta row wraps, so a long source name takes a new line rather than
       widening the pane. Inline claim chips stay clamped below. */
    '.ib-pane-head .ib-pane-meta .ib-chip{max-width:none}',
    /* Same reasoning for the in-body claim chips. app.css clamps every .ib-chip
       to 20ch, which truncates two different sources in one pane to the same
       ten characters — the exact failure primitive 4 exists to prevent. The
       chips wrap instead; the space is already there. */
    '.ib-pane-body .ib-chip{max-width:none}',
    '.ib-pane-body .ib-chip .ib-chip-label{white-space:normal;overflow-wrap:anywhere}',
    '.ib-chip--bad{border-color:var(--bad)}',
    '.ib-srcdetail{margin:var(--s1) 0 0;padding:var(--s2) var(--s3);background:var(--surface-2);border-left:3px solid var(--c);border-radius:var(--radius-sm)}',
    '.ib-srcdetail .vk-shead{margin:0}',
    '.ib-srcdetail-note{margin:var(--s1) 0 0}',
    '.ib-srcdetail-foot{margin:var(--s1) 0 0;color:var(--ink-faint)}',
    '.ib-srcdock{display:grid;gap:var(--s1)}',
    '.ib-srcdock:empty{display:none}',
    /* Table cells are the one place the chip must NOT wrap: the Source column
       is narrow, so a wrapped chip inflates every row and leaves the visible
       columns full of empty space. Unclamped + nowrap keeps the full name on
       one line and the table already scrolls inside its own .vk-tablewrap. */
    '.ib-cell-src{text-align:right;white-space:nowrap}',
    '.ib-pane-body .ib-cell-src .ib-chip .ib-chip-label{white-space:nowrap}',
    '.ib-list{display:grid;gap:var(--s2);margin:0;padding:0;list-style:none}',
    '.ib-list-item.vk-item{gap:var(--s2);flex-wrap:wrap}',
    '.ib-list-main{flex:1 1 14ch;min-width:0;overflow-wrap:anywhere}',
    '.ib-list-item .sub{display:block}',
    '.ib-note-body{display:grid;gap:var(--s2)}',
    '.ib-note-claim.vk-p{margin:0}',
    '.ib-note-claim{overflow-wrap:anywhere}',
    '.ib-stat-chipwrap{margin-top:var(--s1)}',
    '.ib-staged{margin:var(--s3) 0 0}',
    '.ib-staged-head{margin:0 0 var(--s2)}',
    '.ib-staged-line{margin:0 0 var(--s2)}',
    '.ib-staged-status{margin:var(--s2) 0 0;color:var(--ink-soft)}',
    '.ib-empty{margin:0}',
    '@media (max-width:900px){.ib-panes{grid-template-columns:repeat(2,minmax(0,1fr))}.ib-pane--wide{grid-column:span 2}.ib-pane--mid{grid-column:span 2}}',
    /* Single column: the pane is only ~250px wide inside, so the longest source
       name cannot fit on one line. Wrap the header label rather than truncate
       it — the pane's own source stays fully readable at every width. */
    '@media (max-width:620px){.ib-panes{grid-template-columns:minmax(0,1fr)}.ib-pane--wide,.ib-pane--mid{grid-column:span 1}.ib-pane-acts{flex:1 1 100%;justify-content:flex-start}.ib-swap-menu{left:0;right:auto}'
      + '.ib-pane-head .ib-pane-meta .ib-chip .ib-chip-label{white-space:normal;overflow-wrap:anywhere}}'
  ].join('\n');

  function injectFallback() {
    try {
      if (document.getElementById('ib-workspace-fallback')) return;
      var head = document.head || document.getElementsByTagName('head')[0];
      if (!head) return;
      var s = document.createElement('style');
      s.id = 'ib-workspace-fallback';
      s.textContent = FALLBACK;
      if (head.firstChild) head.insertBefore(s, head.firstChild);
      else head.appendChild(s);
    } catch (e) { /* styling is a nicety, never a failure */ }
  }

  /* ------------------------------------------------------------------- state */
  var st = {
    root: null,
    body: null,
    live: null,
    mounted: false,
    intent: null,
    sig: '',
    slots: [],          // [{ id, off }] — position is intrinsic, so a restored
                        //   pane always lands back where it was
    open: {},           // key -> true, expanded source reveals
    back: {},           // swapped-in pane id -> the pane it replaced
    changes: {},        // paneId -> note, from intent:change
    staged: '',         // status line under the staged-action card
    stagedLabel: '',    // the label that status line is ABOUT — the card is only
                        //   allowed to keep a status while this still matches the
                        //   action the current intent actually offers
    stagedState: '',    // '' | 'pending' | 'confirmed' | 'cancelled'
    focus: null         // { type, id } — where to put focus after a repaint
  };

  /* The staged-action card must never show three states at once: heading,
     button and status all read from these two fields, and any resolution that
     changes the offered action drops the old status rather than outliving it. */
  function clearStaged() {
    st.staged = '';
    st.stagedLabel = '';
    st.stagedState = '';
  }

  /* ------------------------------------------------------------- tiny helpers */
  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== null && text !== undefined && text !== '') n.textContent = String(text);
    return n;
  }
  function attr(node, map) {
    for (var k in map) { if (Object.prototype.hasOwnProperty.call(map, k)) node.setAttribute(k, String(map[k])); }
    return node;
  }
  function btn(cls, text) {
    var b = h('button', cls, text);
    b.type = 'button';
    return b;
  }
  function slug(s) { return String(s).replace(/[^a-zA-Z0-9_-]+/g, '-'); }
  function txt(v) { return (v === null || v === undefined) ? '' : String(v); }
  /* Fixture titles are long. Visible control labels get bounded; the full
     string always stays in title + aria-label, so nothing is lost. */
  function clip(s, max) {
    s = txt(s);
    return s.length > max ? s.slice(0, max - 1).replace(/[\s,.;:·-]+$/, '') + '…' : s;
  }

  function fixtures() {
    return (window.IB && window.IB.fixtures) ? window.IB.fixtures : {};
  }
  function lookup(collection, id) {
    if (!collection || id === null || id === undefined || id === '') return null;
    if (Object.prototype.toString.call(collection) === '[object Array]') {
      for (var i = 0; i < collection.length; i++) {
        if (collection[i] && collection[i].id === id) return collection[i];
      }
      return null;
    }
    return Object.prototype.hasOwnProperty.call(collection, id) ? collection[id] : null;
  }
  function paneDef(id) { return lookup(fixtures().panes, id); }
  function sourceDef(id) { return lookup(fixtures().sources, id); }
  function claimsOf(pane) {
    var c = pane && (pane.claims || pane.rows);
    return (Object.prototype.toString.call(c) === '[object Array]') ? c : [];
  }
  function columnsOf(pane) {
    var c = pane && (pane.columns || pane.cols || pane.headers);
    return (Object.prototype.toString.call(c) === '[object Array]') ? c : null;
  }
  /* The composed surface is a list of positional slots. Dismissing turns a slot
     off rather than removing it, so restoring is always exact and nobody is
     stranded. Swapping rewrites the id in the slot, leaving position alone. */
  function visible() {
    var out = [];
    for (var i = 0; i < st.slots.length; i++) { if (!st.slots[i].off) out.push(st.slots[i].id); }
    return out;
  }
  function dismissedSlots() {
    var out = [];
    for (var i = 0; i < st.slots.length; i++) { if (st.slots[i].off) out.push(st.slots[i]); }
    return out;
  }
  function slotOf(id, wantOff) {
    for (var i = 0; i < st.slots.length; i++) {
      if (st.slots[i].id === id && (wantOff === undefined || !!st.slots[i].off === wantOff)) return st.slots[i];
    }
    return null;
  }
  function forgetReveals(paneId) {
    for (var k in st.open) {
      if (Object.prototype.hasOwnProperty.call(st.open, k) && k.indexOf(paneId + ':') === 0) delete st.open[k];
    }
  }

  function paneTitle(id) {
    var p = paneDef(id);
    return (p && (p.title || p.name)) ? String(p.title || p.name) : String(id);
  }
  /* Pane weight comes from kind, so the grid is composed rather than four equal
     cards. The tail pane is then widened to close the last row, which is what
     stops the surface looking like a dropped card. Base grid is 3 columns; the
     stylesheet collapses those spans at 900px and again at 620px. */
  var GRID_COLS = 3;
  function baseSpan(kind) {
    if (kind === 'table') return 3;
    if (kind === 'list') return 2;
    return 1;
  }
  function spanClass(span) {
    if (span >= 3) return 'ib-pane--wide';
    if (span === 2) return 'ib-pane--mid';
    return 'ib-pane--narrow';
  }
  function layoutSpans(ids) {
    var spans = [], i, p;
    for (i = 0; i < ids.length; i++) {
      p = paneDef(ids[i]);
      spans.push(baseSpan(p ? txt(p.kind || 'note') : 'note'));
    }
    var pos = 0;
    for (i = 0; i < spans.length; i++) {
      if (spans[i] > GRID_COLS - pos) pos = 0;               // this pane starts a new row
      if (i === spans.length - 1 && pos + spans[i] < GRID_COLS) {
        spans[i] = GRID_COLS - pos;                          // close the last row
      }
      pos = (pos + spans[i]) % GRID_COLS;
    }
    return spans;
  }
  function announce(msg) {
    if (st.live) st.live.textContent = msg;
  }
  function emit(evt, payload) {
    try {
      if (window.IB && window.IB.bus && typeof window.IB.bus.emit === 'function') {
        window.IB.bus.emit(evt, payload);
      }
    } catch (e) { /* a listener throwing must not break the surface */ }
  }

  /* -------------------------------------------------------- provenance reveal */
  /* Every claim chip is a real <button> with aria-expanded/aria-controls that
     toggles an inline detail block. Keyboard-operable by construction; Escape
     also collapses the focused reveal. Nothing is a hover-only tooltip. */

  function sourceDetailNode(domId, src, sourceId, forLabel) {
    var box = h('div', 'ib-srcdetail vk-note');
    box.id = domId;
    box.hidden = true;

    if (forLabel) {
      box.appendChild(h('p', 'vk-shead', 'Claim'));
      var fl = h('p', 'ib-srcdetail-for', forLabel);
      fl.style.margin = '0 0 var(--s2)';
      box.appendChild(fl);
    }

    if (src) {
      var kName = h('p', 'vk-shead', 'Source');
      var vName = h('p', 'ib-srcdetail-name', txt(src.name || sourceId));
      vName.style.margin = '0';
      vName.style.fontWeight = '700';
      box.appendChild(kName);
      box.appendChild(vName);

      var kKind = h('p', 'vk-shead', 'Kind');
      kKind.style.marginTop = 'var(--s2)';
      var vKind = h('p', 'ib-srcdetail-kind', txt(src.kind || 'unstated'));
      vKind.style.margin = '0';
      box.appendChild(kKind);
      box.appendChild(vKind);

      if (src.note) box.appendChild(h('p', 'ib-srcdetail-note', txt(src.note)));
      box.appendChild(h('p', 'ib-srcdetail-foot',
        'Scripted fixture held by Vision Outreach Media. Not retrieved live.'));
    } else {
      box.style.borderLeftColor = 'var(--bad)';
      box.appendChild(h('p', 'vk-shead', 'Unsourced claim'));
      box.appendChild(h('p', 'ib-srcdetail-note',
        sourceId
          ? 'The source id "' + txt(sourceId) + '" does not resolve to any entry in the source register. This claim must not be trusted or acted on.'
          : 'This claim carries no source id at all. Nothing may render on this surface without a traceable source, so this is a defect, not a style.'));
      box.appendChild(h('p', 'ib-srcdetail-foot',
        'Reported by the workspace. The operator must fix the fixture before this line is believed.'));
    }
    return box;
  }

  function chipNode(key, sourceId, label) {
    var src = sourceDef(sourceId);
    var domId = 'ib-src-' + slug(key);
    /* The label lives in its own <span>: app.css makes .ib-chip an inline-flex
       box, where text-overflow has nothing to ellipsize, so the name was being
       hard-cut mid-word. A block-level inner span restores the ellipsis. */
    var b = btn('ib-chip vk-pill ' + (src ? 'vk-pill--spec' : 'vk-pill--bad ib-chip--bad'));
    b.appendChild(h('span', 'ib-chip-label', src ? txt(src.name || sourceId) : 'Unsourced'));
    attr(b, {
      'data-act': 'src',
      'data-key': key,
      'aria-expanded': st.open[key] ? 'true' : 'false',
      'aria-controls': domId,
      'title': src ? ('Source: ' + txt(src.name || sourceId) + ' — activate for detail')
                   : 'This claim has no resolvable source — activate for detail'
    });
    if (label) b.setAttribute('aria-label', (src ? 'Source for ' : 'Unsourced: ') + label);
    return {
      chip: b,
      detail: sourceDetailNode(domId, src, sourceId, label || ''),
      resolved: !!src,
      src: src
    };
  }

  /* -------------------------------------------------------------- pane bodies */

  function tableBody(pane, paneId, tally) {
    var claims = claimsOf(pane);
    var cols = columnsOf(pane);
    var width = 1;
    var i, j;
    for (i = 0; i < claims.length; i++) {
      var cs = claims[i] && claims[i].cells;
      if (cs && cs.length > width - 1) width = cs.length + 1;
    }
    if (cols && cols.length + 1 > width) width = cols.length + 1;

    var frag = document.createDocumentFragment();
    var wrap = h('div', 'vk-tablewrap');
    /* Reveals live BELOW the scroll container, never inside it — a source note
       trapped in a horizontally scrolling table is unreadable at 360px. */
    var dock = h('div', 'ib-srcdock');
    var table = h('table', 'vk-table');

    if (cols) {
      var thead = h('thead');
      var hr = h('tr');
      for (j = 0; j < cols.length; j++) hr.appendChild(h('th', null, txt(cols[j])));
      while (hr.children.length < width - 1) hr.appendChild(h('th'));
      var sh = h('th', null, 'Source');
      sh.className = 'ib-cell-src';
      hr.appendChild(sh);
      thead.appendChild(hr);
      table.appendChild(thead);
    }

    var tbody = h('tbody');
    for (i = 0; i < claims.length; i++) {
      var claim = claims[i] || {};
      var cells = (Object.prototype.toString.call(claim.cells) === '[object Array]')
        ? claim.cells
        : [txt(claim.text || claim.label || '')];
      var tr = h('tr', 'ib-row');
      for (j = 0; j < width - 1; j++) tr.appendChild(h('td', null, txt(cells[j] !== undefined ? cells[j] : '')));

      var rowLabel = [];
      for (j = 0; j < cells.length && j < 3; j++) { if (cells[j] !== undefined && cells[j] !== '') rowLabel.push(txt(cells[j])); }
      var made = chipNode(paneId + ':' + i, claim.sourceId, rowLabel.join(' · ') || ('row ' + (i + 1)));
      tally(made);
      var td = h('td', 'ib-cell-src');
      td.appendChild(made.chip);
      tr.appendChild(td);
      tbody.appendChild(tr);

      made.detail.hidden = !st.open[paneId + ':' + i];
      dock.appendChild(made.detail);
    }
    table.appendChild(tbody);
    wrap.appendChild(table);
    frag.appendChild(wrap);
    frag.appendChild(dock);
    return frag;
  }

  function listBody(pane, paneId, tally) {
    var claims = claimsOf(pane);
    var ul = h('ul', 'ib-list vk-feed');
    for (var i = 0; i < claims.length; i++) {
      var claim = claims[i] || {};
      var main = txt(claim.text || claim.label || claim.title ||
        (Object.prototype.toString.call(claim.cells) === '[object Array]' ? claim.cells[0] : ''));
      var sub = txt(claim.detail || claim.sub || claim.note ||
        (Object.prototype.toString.call(claim.cells) === '[object Array]' ? claim.cells.slice(1).join(' · ') : ''));

      var li = h('li', 'ib-list-item vk-item');
      var col = h('div', 'ib-list-main');
      col.appendChild(h('span', 'what', main || '—'));
      if (sub) col.appendChild(h('span', 'sub', sub));
      li.appendChild(col);

      var made = chipNode(paneId + ':' + i, claim.sourceId, main || ('item ' + (i + 1)));
      tally(made);
      li.appendChild(made.chip);
      ul.appendChild(li);

      var dli = h('li', 'ib-srcdetail-host');
      made.detail.hidden = !st.open[paneId + ':' + i];
      dli.appendChild(made.detail);
      ul.appendChild(dli);
    }
    return ul;
  }

  function statBody(pane, paneId, tally) {
    var claims = claimsOf(pane);
    var grid = h('div', 'vk-facts');
    for (var i = 0; i < claims.length; i++) {
      var claim = claims[i] || {};
      var cells = (Object.prototype.toString.call(claim.cells) === '[object Array]') ? claim.cells : [];
      var k = txt(claim.k || claim.key || claim.label || cells[0] || '—');
      var v = txt(claim.v || claim.value || claim.text || cells[1] || '');

      var cell = h('div', 'vk-fact');
      cell.appendChild(h('div', 'k', k));
      cell.appendChild(h('div', 'v', v || '—'));

      var made = chipNode(paneId + ':' + i, claim.sourceId, k);
      tally(made);
      var wrap = h('div', 'ib-stat-chipwrap');
      wrap.appendChild(made.chip);
      cell.appendChild(wrap);
      made.detail.hidden = !st.open[paneId + ':' + i];
      cell.appendChild(made.detail);
      grid.appendChild(cell);
    }
    return grid;
  }

  function noteBody(pane, paneId, tally) {
    var claims = claimsOf(pane);
    var box = h('div', 'ib-note-body');
    for (var i = 0; i < claims.length; i++) {
      var claim = claims[i] || {};
      var body = txt(claim.text || claim.body || claim.label ||
        (Object.prototype.toString.call(claim.cells) === '[object Array]' ? claim.cells.join(' · ') : ''));
      var p = h('p', 'ib-note-claim vk-p', body || '—');
      var made = chipNode(paneId + ':' + i, claim.sourceId, body.slice(0, 48) || ('note ' + (i + 1)));
      tally(made);
      p.appendChild(document.createTextNode(' '));
      p.appendChild(made.chip);
      box.appendChild(p);
      made.detail.hidden = !st.open[paneId + ':' + i];
      box.appendChild(made.detail);
    }
    return box;
  }

  /* --------------------------------------------------------------- pane shell */

  function alternatesFor(paneId, pane) {
    var out = [];
    var seen = {};
    var list = (pane && Object.prototype.toString.call(pane.alternates) === '[object Array]')
      ? pane.alternates : [];
    /* A pane already held by a slot — shown OR dismissed — is not an alternate;
       swapping to it would put the same id on the surface twice. */
    function taken(id) {
      for (var s = 0; s < st.slots.length; s++) { if (st.slots[s].id === id) return true; }
      return false;
    }
    var i, id;
    for (i = 0; i < list.length; i++) {
      id = list[i];
      if (!id || id === paneId || seen[id]) continue;
      if (taken(id)) continue;
      if (!paneDef(id)) continue;                  // must be a real pane
      seen[id] = 1; out.push(id);
    }
    var home = st.back[paneId];
    if (home && home !== paneId && !seen[home] && paneDef(home) && !taken(home)) {
      out.push(home);
    }
    return out;
  }

  function paneNode(paneId, weight) {
    var pane = paneDef(paneId);
    var art = h('article', 'ib-pane vk-card');
    art.setAttribute('data-pane-root', paneId);

    if (!pane) {
      art.className = 'ib-pane ' + weight + ' vk-card is-unsourced';
      var w = h('p', 'ib-warn vk-note');
      w.appendChild(h('strong', 'vk-pill vk-pill--bad', 'Missing pane'));
      w.appendChild(document.createTextNode(' No pane definition named "' + paneId + '" exists in the fixture register, so nothing can be attributed. Not rendered.'));
      art.appendChild(w);
      return art;
    }

    var kind = txt(pane.kind || 'note');
    art.className = 'ib-pane ' + weight + ' vk-card';

    /* --- header: which source, what kind of pane, and that it is scripted --- */
    var head = h('div', 'ib-pane-head');
    var heading = h('div', 'ib-pane-heading');
    var title = h('h3', 'ib-pane-title vk-h3', txt(pane.title || pane.name || paneId));
    title.id = 'ib-pane-t-' + slug(paneId);
    heading.appendChild(title);

    var meta = h('div', 'ib-pane-meta');
    meta.appendChild(h('span', 'vk-pill vk-pill--spec', kind));
    meta.appendChild(h('span', 'vk-pill vk-pill--planned', 'scripted'));

    /* Primitive 4: the pane's own source is a claim like any other, so it is
       RESOLVED through the register rather than believed because it carries a
       name. A name is presentation; the id is the provenance. An id that is
       absent or does not resolve makes the pane unsourced, and the surface has
       to say so exactly as loudly as it does for an unresolved row. */
    var ps = pane.source;
    var psRef = ps ? (typeof ps === 'string' ? txt(ps) : txt(ps.id)) : '';
    var pSrc = sourceDef(psRef);
    var psName = pSrc
      ? txt(pSrc.name || pSrc.id)
      : (ps ? (typeof ps === 'string' ? txt(ps) : txt(ps.name)) : '');
    var psKey = paneId + ':pane';
    var psId = 'ib-src-' + slug(psKey);
    if (psName) {
      var pb = btn('ib-chip vk-pill ' + (pSrc ? 'vk-pill--spec' : 'vk-pill--bad ib-chip--bad'));
      pb.appendChild(h('span', 'ib-chip-label', pSrc ? psName : 'Unsourced'));
      attr(pb, {
        'data-act': 'src',
        'data-key': psKey,
        'aria-expanded': st.open[psKey] ? 'true' : 'false',
        'aria-controls': psId,
        'aria-label': pSrc
          ? ('Pane source: ' + psName + ' — activate for detail')
          : ('Unsourced pane: "' + psName + '" does not resolve to a registered source — activate for detail'),
        'title': pSrc
          ? ('Pane source: ' + psName)
          : 'This pane declares a source that does not resolve — activate for detail'
      });
      meta.appendChild(pb);
    } else {
      meta.appendChild(h('span', 'vk-pill vk-pill--bad', 'Pane source missing'));
    }
    /* The flag never stands alone: a pane can look byte-identical to the reader,
       so the pill without the watch's own note is an unexplained accusation.
       The note text belongs to standing.js — it is rendered, never invented. */
    var changeNote = txt(st.changes[paneId]);
    var changeId = 'ib-chg-' + slug(paneId);
    if (st.changes[paneId]) {
      var flag = h('span', 'ib-pane-flag vk-pill vk-pill--partial', 'changed');
      attr(flag, {
        'title': changeNote
          ? ('Reported by the standing watch: ' + changeNote)
          : 'The standing watch reported a change on this pane.'
      });
      if (changeNote) flag.setAttribute('aria-describedby', changeId);
      meta.appendChild(flag);
    }
    heading.appendChild(meta);
    head.appendChild(heading);

    /* --------------------------------------------- swap + dismiss (primitive 3) */
    var acts = h('div', 'ib-pane-acts');
    var alts = alternatesFor(paneId, pane);
    if (alts.length === 1) {
      var sb = btn('vk-btn vk-btn--ghost vk-btn--sm', 'Swap');
      attr(sb, {
        'data-act': 'swap', 'data-pane': paneId, 'data-alt': alts[0],
        'aria-label': 'Swap "' + paneTitle(paneId) + '" for "' + paneTitle(alts[0]) + '"',
        'title': 'Swap for: ' + paneTitle(alts[0])
      });
      acts.appendChild(sb);
    } else if (alts.length > 1) {
      var det = h('details', 'ib-swap');
      det.setAttribute('data-swap-for', paneId);
      var sum = h('summary', 'ib-swap-sum vk-btn vk-btn--ghost vk-btn--sm', 'Swap');
      sum.setAttribute('aria-label', 'Choose a replacement for "' + paneTitle(paneId) + '"');
      det.appendChild(sum);
      var menu = h('div', 'ib-swap-menu');
      menu.appendChild(h('p', 'vk-shead', 'Replace with'));
      menu.querySelector('.vk-shead').style.margin = '0';
      for (var a = 0; a < alts.length; a++) {
        var ob = btn('ib-swap-opt vk-btn vk-btn--sm', paneTitle(alts[a]));
        attr(ob, { 'data-act': 'swap', 'data-pane': paneId, 'data-alt': alts[a] });
        menu.appendChild(ob);
      }
      det.appendChild(menu);
      acts.appendChild(det);
    } else {
      var nb = btn('vk-btn vk-btn--sm vk-btn--off', 'Swap');
      nb.disabled = true;
      nb.title = 'No alternate view is registered for this pane';
      acts.appendChild(nb);
    }

    var db = btn('vk-btn vk-btn--quiet vk-btn--sm', 'Dismiss');
    attr(db, {
      'data-act': 'dismiss', 'data-pane': paneId,
      'aria-label': 'Dismiss "' + paneTitle(paneId) + '" — it can be restored',
      'title': 'Dismiss this pane (restorable)'
    });
    acts.appendChild(db);
    head.appendChild(acts);
    art.appendChild(head);

    /* ------------------------------------------------- pane-level source reveal */
    if (psName) {
      var pDetail = h('div', 'ib-srcdetail vk-note');
      pDetail.id = psId;
      pDetail.hidden = !st.open[psKey];
      pDetail.style.margin = '0';
      pDetail.style.borderRadius = '0';
      if (pSrc) {
        /* Same shape as a claim reveal — Source, Kind, the register's own note
           — plus the pane's own detail and the composed-when line. */
        pDetail.appendChild(h('p', 'vk-shead', 'Pane source'));
        var pn = h('p', 'ib-srcdetail-name', psName);
        pn.style.margin = '0'; pn.style.fontWeight = '700';
        pDetail.appendChild(pn);

        var pKind = h('p', 'vk-shead', 'Kind');
        pKind.style.marginTop = 'var(--s2)';
        var pKindV = h('p', 'ib-srcdetail-kind', txt(pSrc.kind || 'unstated'));
        pKindV.style.margin = '0';
        pDetail.appendChild(pKind);
        pDetail.appendChild(pKindV);

        if (ps && ps.detail) pDetail.appendChild(h('p', 'ib-srcdetail-note', txt(ps.detail)));
        if (pSrc.note) pDetail.appendChild(h('p', 'ib-srcdetail-note', txt(pSrc.note)));
        pDetail.appendChild(h('p', 'ib-srcdetail-foot',
          'Composed ' + txt((ps && ps.when) || 'scripted') +
          ' from a fixture held by Vision Outreach Media. Nothing on this pane was retrieved live.'));
      } else {
        pDetail.style.borderLeftColor = 'var(--bad)';
        pDetail.appendChild(h('p', 'vk-shead', 'Unsourced pane'));
        var pnb = h('p', 'ib-srcdetail-name', psName);
        pnb.style.margin = '0'; pnb.style.fontWeight = '700';
        pDetail.appendChild(pnb);
        pDetail.appendChild(h('p', 'ib-srcdetail-note',
          psRef
            ? 'This pane declares the source id "' + psRef + '", which does not resolve to any entry in the source register. Nothing on the pane can be traced back, so none of it may be trusted or acted on.'
            : 'This pane names a source but carries no source id at all. Nothing may render on this surface without a traceable source, so this is a defect, not a style.'));
        pDetail.appendChild(h('p', 'ib-srcdetail-foot',
          'Reported by the workspace. The operator must fix the fixture before this pane is believed.'));
      }
      art.appendChild(pDetail);
    }

    /* ------------------------------------- what the standing watch actually said */
    if (changeNote) {
      var chg = h('p', 'ib-pane-change vk-note');
      chg.id = changeId;
      chg.appendChild(h('strong', 'vk-shead', 'Reported by the standing watch'));
      chg.appendChild(document.createTextNode(' ' + changeNote));
      art.appendChild(chg);
    }

    /* --------------------------------------------------- body + claim tallying */
    var counts = { total: 0, bad: 0, names: [], seen: {} };
    function tally(made) {
      counts.total++;
      if (!made.resolved) { counts.bad++; return; }
      var nm = txt(made.src && (made.src.name || made.src.id));
      if (nm && !counts.seen[nm]) { counts.seen[nm] = 1; counts.names.push(nm); }
    }

    var body = h('div', 'ib-pane-body');
    var inner;
    if (kind === 'table') inner = tableBody(pane, paneId, tally);
    else if (kind === 'list') inner = listBody(pane, paneId, tally);
    else if (kind === 'stat') inner = statBody(pane, paneId, tally);
    else inner = noteBody(pane, paneId, tally);

    if (!claimsOf(pane).length) {
      body.appendChild(h('p', 'vk-empty', 'This pane holds no claims in the fixture register.'));
    } else {
      body.appendChild(inner);
    }
    art.appendChild(body);

    /* -------------------------------------- loud warning if anything is unsourced */
    if (counts.bad > 0 || !psName || !pSrc) {
      art.className += ' is-unsourced';
      var warn = h('p', 'ib-warn vk-note');
      warn.appendChild(h('strong', 'vk-pill vk-pill--bad', 'Unsourced'));
      warn.appendChild(document.createTextNode(' ' +
        (counts.bad > 0
          ? counts.bad + ' of ' + counts.total + ' claims on this pane do not resolve to a registered source. '
          : '') +
        (!psName ? 'This pane declares no source of its own. ' : '') +
        (psName && !pSrc
          ? "The pane's own source " + (psRef ? '"' + psRef + '" ' : '') +
            'does not resolve to any entry in the source register, so the whole pane is unattributed. '
          : '') +
        'Nothing may render here without traceable provenance — treat the flagged lines as unusable.'));
      art.insertBefore(warn, body);
    }

    /* ------------------------------------------------ per-pane provenance summary */
    var foot = h('p', 'ib-pane-foot vk-note');
    var summary = counts.total + (counts.total === 1 ? ' claim' : ' claims');
    if (counts.names.length) summary += ' · sourced from ' + counts.names.join(', ');
    if (counts.bad) summary += ' · ' + counts.bad + ' unsourced';
    if (!pSrc) summary += psName ? ' · pane source unresolved' : ' · no pane source';
    summary += ' · scripted, not retrieved';
    foot.textContent = summary;
    art.appendChild(foot);

    return art;
  }

  /* ------------------------------------------------------------------- staged */

  /* An intent that resolved to nothing to do still carries a staged object, but
     it is a placeholder, not an action. Staging it would put "No fare to hold"
     through the gate and log a decision about nothing. resolve.js marks those
     with staged.none; the flag being absent simply means the offer stands. */
  function stagedIsNone(s) {
    return !!(s && s.none);
  }

  function stagedNode(intent) {
    var s = intent && intent.staged;
    if (!s) return null;
    var none = stagedIsNone(s);
    var label = txt(s.label || 'Prepare the next step');
    /* the status belongs to THIS action or to no action at all */
    var pending = (st.stagedState === 'pending' && st.stagedLabel === label);

    var card = h('section', 'ib-staged vk-card vk-card--rail');
    card.setAttribute('aria-label', 'Prepared action');

    /* The eyebrow moves with the state too, so the card never reads as one
       thing at the top and another at the bottom. "Not performed" is the half
       that never changes — the gate records a decision and nothing else. */
    var settled = (st.stagedLabel === label) ? st.stagedState : '';
    var eyebrow = none ? 'Nothing to prepare'
      : settled === 'confirmed' ? 'Confirmed · not performed'
      : settled === 'cancelled' ? 'Cancelled · not performed'
      : 'Prepared · not performed';

    var head = h('div', 'ib-staged-head');
    head.appendChild(h('p', 'vk-eyebrow', eyebrow));
    head.appendChild(h('h3', 'vk-h3', label));
    card.appendChild(head);

    var detail = null;
    if (s.detail) {
      detail = h('p', 'ib-staged-line vk-p', txt(s.detail));
      detail.id = 'ib-staged-detail';
      card.appendChild(detail);
    }
    if (s.consequence) card.appendChild(h('p', 'ib-staged-line vk-notice', txt(s.consequence)));

    var b = btn(none ? 'vk-btn vk-btn--off' : 'vk-btn vk-btn--accent',
      (pending && !none) ? 'Re-stage this action' : 'Stage this action for confirmation');
    if (none) {
      b.disabled = true;
      attr(b, {
        'data-act': 'stage',
        'aria-disabled': 'true',
        'aria-describedby': detail ? 'ib-staged-detail ib-staged-help' : 'ib-staged-help',
        'title': detail ? txt(s.detail) : 'There is nothing to prepare while the constraints stand as they are.'
      });
    } else {
      attr(b, {
        'data-act': 'stage',
        'aria-describedby': 'ib-staged-help',
        'title': 'Prepares the action and hands it to the confirmation gate. The prototype never performs it.'
      });
    }
    card.appendChild(b);

    var help = h('p', 'ib-staged-line vk-note',
      'This button only prepares. It writes the action into the confirmation gate and stops there. The prototype never performs the action — confirming at the gate records your decision in the trail and nothing else. No message is ever sent, nothing is purchased, no money moves.');
    help.id = 'ib-staged-help';
    help.style.marginTop = 'var(--s2)';
    card.appendChild(help);

    var status = h('p', 'ib-staged-status vk-note', (st.stagedLabel === label) ? txt(st.staged) : '');
    attr(status, { 'role': 'status', 'aria-live': 'polite' });
    card.appendChild(status);

    return card;
  }

  /* -------------------------------------------------------------------- paint */

  function paint() {
    if (!st.root) return;
    var intent = st.intent;
    var shown = visible();
    var gone = dismissedSlots();
    while (st.root.firstChild) st.root.removeChild(st.root.firstChild);

    var section = h('section', 'ib-ws');
    section.setAttribute('aria-label', 'Composed workspace');

    /* ------------------------------------------------------------------ header */
    var head = h('div', 'ib-ws-head');
    var headings = h('div', 'ib-ws-headings');
    headings.appendChild(h('p', 'ib-ws-kicker vk-shead',
      'Composed workspace · ' + shown.length + (shown.length === 1 ? ' pane' : ' panes') +
      (gone.length ? ' · ' + gone.length + ' dismissed' : '')));
    if (intent && intent.goal) {
      headings.appendChild(h('p', 'ib-ws-sub vk-note', 'Panes composed for: ' + txt(intent.goal)));
    }
    headings.appendChild(h('p', 'ib-ws-note vk-note',
      'Dismissed panes can be restored, and every source chip opens. Scripted fixtures composed by Vision Outreach Media — nothing here is retrieved live.'));
    head.appendChild(headings);

    var tools = h('div', 'ib-ws-tools');
    if (gone.length) {
      var tray = h('div', 'ib-dismissed');
      tray.appendChild(h('span', 'ib-dismissed-label vk-shead', 'Dismissed'));
      for (var d = 0; d < gone.length; d++) {
        var rid = gone[d].id;
        var rb = btn('ib-restore vk-btn vk-btn--ghost vk-btn--sm', 'Restore ' + clip(paneTitle(rid), 30));
        attr(rb, {
          'data-act': 'restore', 'data-pane': rid,
          'aria-label': 'Restore "' + paneTitle(rid) + '" to its original position',
          'title': 'Restore "' + paneTitle(rid) + '" to its original position'
        });
        tray.appendChild(rb);
      }
      if (gone.length > 1) {
        var ab = btn('ib-restore vk-btn vk-btn--sm', 'Restore all');
        attr(ab, { 'data-act': 'restore-all' });
        tray.appendChild(ab);
      }
      tools.appendChild(tray);
    }
    head.appendChild(tools);
    section.appendChild(head);

    /* ------------------------------------------------------------------- panes */
    if (!intent) {
      section.appendChild(h('p', 'ib-empty vk-empty',
        'No intent resolved yet. State an outcome in the intent bar and the workspace composes itself.'));
    } else if (!shown.length) {
      section.appendChild(h('p', 'ib-empty vk-empty',
        gone.length
          ? 'Every pane is dismissed. Restore one above to rebuild the workspace — nothing was lost.'
          : 'This intent resolved with no panes.'));
    } else {
      var grid = h('div', 'ib-panes');
      var spans = layoutSpans(shown);
      for (var i = 0; i < shown.length; i++) grid.appendChild(paneNode(shown[i], spanClass(spans[i])));
      section.appendChild(grid);
    }

    /* ---------------------------------------------------- staged (primitive 6) */
    var staged = stagedNode(intent);
    if (staged) section.appendChild(staged);

    st.live = h('div', 'ib-live');
    attr(st.live, { 'role': 'status', 'aria-live': 'polite' });
    section.appendChild(st.live);

    st.root.appendChild(section);
    applyFocus();
  }

  function findByData(name, value, act) {
    if (!st.root) return null;
    var nodes = st.root.querySelectorAll('[' + name + ']');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].getAttribute(name) !== value) continue;
      if (act && nodes[i].getAttribute('data-act') !== act) continue;
      return nodes[i];
    }
    return null;
  }

  function applyFocus() {
    var f = st.focus;
    st.focus = null;
    if (!f) return;
    var target = null;
    if (f.type === 'pane') {
      var host = findByData('data-pane-root', f.id);
      if (host) target = host.querySelector('.ib-pane-acts button, .ib-pane-acts summary');
    } else if (f.type === 'restore') {
      target = findByData('data-pane', f.id, 'restore');
      if (!target) target = st.root.querySelector('.ib-panes button, .ib-ws-tools button');
    }
    if (target && typeof target.focus === 'function') {
      try { target.focus(); } catch (e) { /* focus is best effort */ }
    }
  }

  /* ------------------------------------------------------------------- events */

  function toggleReveal(chip) {
    var key = chip.getAttribute('data-key');
    var id = chip.getAttribute('aria-controls');
    var target = id ? document.getElementById(id) : null;
    if (!target) return;
    var openNow = !st.open[key];
    if (openNow) st.open[key] = true; else delete st.open[key];
    target.hidden = !openNow;
    chip.setAttribute('aria-expanded', openNow ? 'true' : 'false');
  }

  function closeSwapMenus(except) {
    if (!st.root) return;
    var ds = st.root.querySelectorAll('details.ib-swap[open]');
    for (var i = 0; i < ds.length; i++) { if (ds[i] !== except) ds[i].open = false; }
  }

  function onClick(ev) {
    var t = ev.target;
    if (!t || typeof t.closest !== 'function') return;
    var node = t.closest('[data-act]');
    if (!node || !st.root.contains(node)) return;
    var act = node.getAttribute('data-act');

    if (act === 'src') { ev.preventDefault(); toggleReveal(node); return; }
    if (act === 'swap') {
      ev.preventDefault();
      closeSwapMenus();
      api.swap(node.getAttribute('data-pane'), node.getAttribute('data-alt'));
      return;
    }
    if (act === 'dismiss') { ev.preventDefault(); api.dismiss(node.getAttribute('data-pane')); return; }
    if (act === 'restore') { ev.preventDefault(); restore(node.getAttribute('data-pane')); return; }
    if (act === 'restore-all') {
      ev.preventDefault();
      var first = null;
      for (var i = 0; i < st.slots.length; i++) {
        if (!st.slots[i].off) continue;
        if (!first) first = st.slots[i].id;
        st.slots[i].off = false;
      }
      st.focus = first ? { type: 'pane', id: first } : null;
      paint();
      announce('All dismissed panes restored to their original positions.');
      return;
    }
    if (act === 'stage') { ev.preventDefault(); stage(node); return; }
  }

  function onKeydown(ev) {
    if (ev.key !== 'Escape' && ev.key !== 'Esc') return;
    var active = document.activeElement;
    var closedSomething = false;
    if (st.root && st.root.querySelector('details.ib-swap[open]')) {
      closeSwapMenus();
      closedSomething = true;
    }
    if (!closedSomething && active && active.getAttribute &&
        active.getAttribute('data-act') === 'src' &&
        active.getAttribute('aria-expanded') === 'true') {
      toggleReveal(active);
      closedSomething = true;
    }
    if (closedSomething) ev.stopPropagation();
  }

  function stage(node) {
    var intent = st.intent;
    var s = intent && intent.staged;
    if (!s) return;
    if (stagedIsNone(s)) return;          // a placeholder is not an action
    emit('action:staged', {
      intentId: intent.id,
      label: txt(s.label),
      detail: txt(s.detail),
      consequence: txt(s.consequence)
    });
    st.stagedLabel = txt(s.label);
    st.stagedState = 'pending';
    st.staged = 'Staged: "' + st.stagedLabel + '". It is waiting at the confirmation gate. Nothing has been sent, bought or changed, and confirming there would only record the decision.';
    var status = st.root ? st.root.querySelector('.ib-staged-status') : null;
    if (status) status.textContent = st.staged;
    announce('Action staged. Awaiting your confirmation.');
    if (node) node.textContent = 'Re-stage this action';
  }

  /* The gate owns the decision; this surface only reports it. standing.js emits
     action:confirmed / action:cancelled with { intentId, label }, and the status
     line is rewritten to a SETTLED sentence rather than being left in the future
     tense after the fact. If those events never arrive — an older standing.js —
     nothing here breaks: render() still drops a status the moment the offered
     action changes, so a stale pending line cannot outlive its intent. */
  function settleStaged(payload, outcome) {
    if (!st.stagedLabel) return;                       // nothing pending here
    if (payload && payload.intentId && st.intent && payload.intentId !== st.intent.id) return;
    st.stagedState = outcome;
    st.staged = (outcome === 'confirmed')
      ? 'Confirmed at the gate — the decision is recorded in the trail. Nothing was sent, nothing was bought and no money moved.'
      : 'Cancelled at the gate. The prepared action was dropped, and nothing was sent, bought or changed.';
    /* updated in place rather than repainted: the gate may hand focus back to
       this very button, and rebuilding the card underneath it would drop it */
    var status = st.root ? st.root.querySelector('.ib-staged-status') : null;
    if (status) status.textContent = st.staged;
    var b = st.root ? st.root.querySelector('.ib-staged [data-act="stage"]') : null;
    if (b && !b.disabled) b.textContent = 'Stage this action for confirmation';
    var eb = st.root ? st.root.querySelector('.ib-staged .vk-eyebrow') : null;
    if (eb) eb.textContent = (outcome === 'confirmed') ? 'Confirmed · not performed' : 'Cancelled · not performed';
    announce(outcome === 'confirmed'
      ? 'Action confirmed at the gate. The decision is recorded in the trail. Nothing was sent.'
      : 'Action cancelled at the gate. Nothing was sent and nothing was recorded as done.');
  }

  function restore(paneId) {
    var slot = slotOf(paneId, true);
    if (!slot) return;
    slot.off = false;
    st.focus = { type: 'pane', id: paneId };
    paint();
    announce('Restored pane: ' + paneTitle(paneId) + ', back in its original position.');
  }

  /* --------------------------------------------------------------- public api */

  var api = {
    mount: function (el) {
      var node = (typeof el === 'string') ? document.querySelector(el) : el;
      if (!node) return;
      if (st.mounted && st.root === node) return;

      injectFallback();
      st.root = node;

      if (!st.mounted) {
        st.root.addEventListener('click', onClick);
        st.root.addEventListener('keydown', onKeydown);

        if (window.IB && window.IB.bus && typeof window.IB.bus.on === 'function') {
          window.IB.bus.on('intent:resolved', function (o) { api.render(o); });
          window.IB.bus.on('intent:edited', function (o) { api.render(o); });
          window.IB.bus.on('intent:change', function (p) {
            if (!p || !st.intent || (p.intentId && p.intentId !== st.intent.id)) return;
            if (!p.paneId || visible().indexOf(p.paneId) === -1) return;
            st.changes[p.paneId] = txt(p.note);
            paint();
          });
          window.IB.bus.on('action:confirmed', function (p) { settleStaged(p, 'confirmed'); });
          window.IB.bus.on('action:cancelled', function (p) { settleStaged(p, 'cancelled'); });
        }
        st.mounted = true;
      }

      /* An intent may already have resolved before the workspace was mounted —
         either through IB.current() or through a render() that arrived early. */
      var cur = null;
      try { if (window.IB && typeof window.IB.current === 'function') cur = window.IB.current(); } catch (e) { cur = null; }
      api.render(cur || st.intent || null);
    },

    /* Full re-render. Idempotent: an identical intent + pane list reuses the
       existing pane state, so calling it twice yields identical DOM. */
    render: function (intentObject) {
      if (!st.root) { st.intent = intentObject || null; return; }

      var o = intentObject || null;
      var panes = (o && Object.prototype.toString.call(o.panes) === '[object Array]') ? o.panes : [];
      var sig = o ? (txt(o.id) + '|' + panes.join(',')) : '';

      if (sig !== st.sig) {
        st.sig = sig;
        st.slots = [];
        for (var i = 0; i < panes.length; i++) st.slots.push({ id: panes[i], off: false });
        st.open = {};
        st.back = {};
        st.changes = {};
        clearStaged();
      }
      /* A re-resolution can keep the same panes and still offer a DIFFERENT
         action — edit the budget and "Hold €149 …" becomes "No fare to hold".
         The old status line describes an action this intent no longer offers,
         so it goes, signature change or not. */
      var offered = (o && o.staged) ? txt(o.staged.label || 'Prepare the next step') : '';
      if (st.stagedLabel && st.stagedLabel !== offered) clearStaged();

      st.intent = o;
      st.focus = null;
      paint();
    },

    /* primitive 3 — replace a pane in place, no reload, no re-resolution. */
    swap: function (paneId, altPaneId) {
      var slot = slotOf(paneId, false);
      if (!slot) return;
      if (!altPaneId || altPaneId === paneId) return;
      if (!paneDef(altPaneId)) return;
      if (visible().indexOf(altPaneId) !== -1) return;

      slot.id = altPaneId;
      st.back[altPaneId] = st.back[paneId] || paneId;
      delete st.back[paneId];
      forgetReveals(paneId);
      if (st.changes[paneId]) delete st.changes[paneId];

      st.focus = { type: 'pane', id: altPaneId };
      paint();
      announce('Swapped "' + paneTitle(paneId) + '" for "' + paneTitle(altPaneId) + '". The intent was not re-resolved.');
    },

    /* primitive 3 — dismiss, always restorable to the same position. */
    dismiss: function (paneId) {
      var slot = slotOf(paneId, false);
      if (!slot) return;
      slot.off = true;
      forgetReveals(paneId);
      st.focus = { type: 'restore', id: paneId };
      paint();
      announce('Dismissed "' + paneTitle(paneId) + '". Restore it from the dismissed tray.');
    }
  };

  window.IB.workspace = api;
})();
