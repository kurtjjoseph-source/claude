/* ============================================================================
   standing.js — primitive 5 (intents can stand · history is intents, not URLs)
                 primitive 6 (acting is gated)
   Vision Outreach Media · intent-based browsing prototype

   Exposes exactly:
     IB.standing = { mount(el), watch(intentObject), unwatch(intentId), list(), trail() }

   Listens : intent:resolved, intent:edited, action:staged
   Emits   : intent:standing  (IntentObject)
             intent:change    ({ intentId, note, at, paneId })
             action:confirmed ({ intentId, label })  - gate confirmed
             action:cancelled ({ intentId, label })  - gate closed without one
                              (exactly once per closure, never after confirmed)

   State is in memory only. No storage, no network, no timers, no auto-advance:
   every scripted change is advanced by the operator pressing a labelled button,
   so the demonstration is deterministic and honest.

   ---------------------------------------------------------------------------
   CLASS NAMES THIS FILE RELIES ON — for src/app.css (builder 6)
   Kit classes used as-is: vk-card, vk-panel, vk-btn(+--accent,--ghost,--quiet,--sm),
   vk-btns, vk-pill(+--spec), vk-shead, vk-h3, vk-note, vk-notice, vk-feed,
   vk-item (+ its .when/.what/.sub), vk-empty, vk-chips-free.

   Layout wrapper
     .ib-standing                 section root written into #ib-standing
     .ib-standing-head            heading block
     .ib-standing-note            persistent honesty line (scripted, not live)
     .ib-watchbar                 the "put current intent on watch" control row
     .ib-watch-toggle             that button
     .ib-watch-hint               one-line explanation next to it
     .ib-block                    a titled block (standing list / trail)
     .ib-block-head               its small heading row

   Standing intents
     .ib-standing-list            container of standing cards
     .ib-standing-card            one standing intent  (also .vk-card)
     .ib-standing-card-head       pill + sentence
     .ib-standing-sentence        the intent sentence
     .ib-standing-goal           the goal line
     .ib-standing-condition       forward-looking watch condition (also .vk-notice)
     .ib-standing-status          present-tense "it holds / does not hold right now"
     .ib-standing-actions         advance / stop-watching buttons (also .vk-btns)
     .ib-advance-note             the scripted-not-live label beside advance
     .ib-changes                  the change log inside a standing card
     .ib-change                   one reported change (also .vk-notice)
     .ib-change--restated         marker: the intent was edited while standing
     .ib-change--prior            a change reported before that restatement
     .ib-change-prior             its "reported under <old constraints>" line
     .ib-change-diff              restatement's what-changed list
     .ib-change-diff-item         one line of it
     .ib-change-head              pill + scripted timestamp
     .ib-change-when              the scripted timestamp
     .ib-change-what              headline of what moved
     .ib-change-meaning           what it means for the success condition
     .ib-change-meta              pane + success-condition status

   Trail (history as intents)
     .ib-trail-list               container (also .vk-feed, role=list)
     .ib-trail-item               one entry (also .vk-item, role=listitem)
     .ib-trail-item--intent | --decision              entry kinds
     .ib-trail-empty              empty state (role=listitem, also .vk-empty)
     .ib-trail-when               left column label (also .when)
     .ib-trail-body               right column   <-- NEEDS `min-width:0`
     .ib-trail-sentence           the sentence (also .what)
     .ib-trail-goal               the goal (also .sub)
     .ib-trail-values             constraint values as they stood
     .ib-trail-value              one "Label value" chip
     .ib-trail-diff               what changed vs the previous entry
     .ib-trail-diff-item          one change line
     .ib-trail-actions            reopen row
     .ib-trail-reopen             the reopen button

   The action gate (a <dialog> appended to <body>)
     .ib-gate                     the dialog element
     .ib-gate-panel               inner panel (also .vk-panel), tabindex=-1
     .ib-gate-head                pill + title
     .ib-gate-title               labelled title (id="ib-gate-title")
     .ib-gate-body                the three fields
     .ib-gate-field               one field
     .ib-gate-label               action label
     .ib-gate-detail              action detail
     .ib-gate-consequence         stated consequence (also .vk-notice)
     .ib-gate-note                honesty note
     .ib-gate-actions             Confirm / Cancel (also .vk-btns)
     .ib-gate-confirm .ib-gate-cancel .ib-gate-close
     .ib-gate-result              post-confirm result state

   Rules app.css should carry:
     .ib-trail-body{ min-width:0 }                 - so the trail holds at 360px
     @media (max-width:520px){ .ib-trail-item{ flex-wrap:wrap } }
     .ib-gate{ width:100%; max-width:520px; }      - the dialog's size
     .ib-gate-body[hidden]{ display:none }         - REQUIRED if you give
     .ib-gate-result[hidden]{ display:none }         either face a display value:
       a bare `.ib-gate-body{display:grid}` out-specifies the UA [hidden] rule and
       leaves a live Confirm button on screen under the result. This file does not
       depend on you carrying it — it sets inline display on both faces itself —
       but the attribute and the CSS should agree.
   The <dialog> carries four inline declarations (background/border/padding/color)
   purely to neutralise the UA's opaque-white box, which is unreadable in dark.
   It sets no size — .ib-gate and .ib-gate-panel are yours to style entirely.
   ========================================================================== */

;(function () {
  'use strict';

  window.IB = window.IB || {};
  var IB = window.IB;   // local binding — never rely on the implicit global

  /* ------------------------------------------------------------ state */
  var root = null;            // the mounted element
  var current = null;         // last intent seen on the bus
  var standing = [];          // [{ intent, script, cursor, changes:[] }]
  var trail = [];             // [{ key, kind, ... }]
  var seq = 1;
  var restoring = false;      // true while replaying a trail entry
  var wired = false;

  /* --------------------------------------------------------- utilities */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;'
           : ch === '"' ? '&quot;' : '&#39;';
    });
  }

  function byId(arr, id) {
    if (!arr) return null;
    for (var i = 0; i < arr.length; i++) if (arr[i] && arr[i].id === id) return arr[i];
    return null;
  }

  function stripDot(s) { return String(s || '').replace(/\s*\.\s*$/, ''); }

  /* "200" + EUR -> "€200" ; "March" -> "March" ; "3" + "seats" -> "3 seats" */
  function money(value, unit) {
    var v = String(value == null ? '' : value);
    if (!unit) return v;
    var u = String(unit).toUpperCase();
    if (u === 'EUR') return '€' + v;
    if (u === 'USD') return '$' + v;
    if (u === 'GBP') return '£' + v;
    return v + ' ' + unit;
  }
  function fmt(c) { return c ? money(c.value, c.unit) : ''; }

  function isNumeric(c) {
    if (!c) return false;
    if (c.type === 'number') return true;
    return /^\s*\d+([.,]\d+)?\s*$/.test(String(c.value == null ? '' : c.value));
  }

  function numberOf(c) {
    var n = parseFloat(String(c.value).replace(',', '.'));
    return isFinite(n) ? n : null;
  }

  function paneTitle(paneId) {
    if (!paneId) return '';
    var p = IB.fixtures && IB.fixtures.panes && IB.fixtures.panes[paneId];
    return (p && p.title) ? p.title : String(paneId);
  }

  /* a frozen copy, so later edits never rewrite history */
  function snap(intent) {
    var cs = [], i;
    if (intent && intent.constraints) {
      for (i = 0; i < intent.constraints.length; i++) {
        var c = intent.constraints[i] || {};
        cs.push({ id: c.id, label: c.label, value: c.value, unit: c.unit, type: c.type });
      }
    }
    var es = [];
    if (intent && intent.entities) {
      for (i = 0; i < intent.entities.length; i++) {
        var e = intent.entities[i] || {};
        es.push({ id: e.id, label: e.label, kind: e.kind });
      }
    }
    return {
      id: intent ? intent.id : '',
      sentence: intent ? intent.sentence : '',
      goal: intent ? intent.goal : '',
      constraints: cs,
      entities: es,
      success: {
        label: (intent && intent.success && intent.success.label) || '',
        met: !!(intent && intent.success && intent.success.met)
      },
      panes: (intent && intent.panes) ? intent.panes.slice(0) : []
    };
  }

  function sameSnapshot(a, b) {
    if (!a || !b) return false;
    if (a.id !== b.id || a.sentence !== b.sentence || a.goal !== b.goal) return false;
    if (a.success.met !== b.success.met || a.success.label !== b.success.label) return false;
    if (a.panes.join('|') !== b.panes.join('|')) return false;
    if (a.constraints.length !== b.constraints.length) return false;
    for (var i = 0; i < a.constraints.length; i++) {
      if (a.constraints[i].id !== b.constraints[i].id) return false;
      if (String(a.constraints[i].value) !== String(b.constraints[i].value)) return false;
    }
    return true;
  }

  /* ------------------------------------------------- the trail (history) */
  function lastIntentEntry() {
    for (var i = trail.length - 1; i >= 0; i--) if (trail[i].kind === 'intent') return trail[i];
    return null;
  }

  function entryByKey(key) {
    for (var i = 0; i < trail.length; i++) if (trail[i].key === key) return trail[i];
    return null;
  }

  /* what changed, relative to the previous entry — the point of the trail */
  function diffOf(prev, now) {
    var out = [], i;
    if (!prev) return ['Opening statement of this intent.'];

    if (prev.id !== now.id) {
      out.push('New intent — was “' + prev.sentence + '”');
    } else {
      if (prev.sentence !== now.sentence) out.push('Sentence “' + prev.sentence + '” → “' + now.sentence + '”');
      if (prev.goal !== now.goal) out.push('Goal “' + prev.goal + '” → “' + now.goal + '”');
      for (i = 0; i < now.constraints.length; i++) {
        var c = now.constraints[i];
        var was = byId(prev.constraints, c.id);
        if (was && String(was.value) !== String(c.value)) {
          out.push(c.label + ' ' + money(was.value, was.unit) + ' → ' + fmt(c));
        } else if (!was) {
          out.push(c.label + ' added at ' + fmt(c));
        }
      }
      for (i = 0; i < prev.constraints.length; i++) {
        if (!byId(now.constraints, prev.constraints[i].id)) out.push(prev.constraints[i].label + ' dropped');
      }
    }

    if (prev.success.met !== now.success.met) {
      out.push('Success condition ' + (prev.success.met ? 'met → not met' : 'not met → met'));
    }

    var added = [], gone = [];
    for (i = 0; i < now.panes.length; i++) if (prev.panes.indexOf(now.panes[i]) < 0) added.push(paneTitle(now.panes[i]));
    for (i = 0; i < prev.panes.length; i++) if (now.panes.indexOf(prev.panes[i]) < 0) gone.push(paneTitle(prev.panes[i]));
    if (added.length) out.push('Pane added: ' + added.join(', '));
    if (gone.length) out.push('Pane dropped: ' + gone.join(', '));

    if (!out.length) out.push('Restated with no change to the object.');
    return out;
  }

  function pushIntentEntry(intent, note, force) {
    if (!intent) return null;
    var s = snap(intent);
    var prev = lastIntentEntry();
    if (!force && prev && sameSnapshot(prev.snapshot, s)) return null;
    var entry = {
      key: 'e' + (seq++),
      kind: 'intent',
      snapshot: s,
      diff: diffOf(prev ? prev.snapshot : null, s),
      note: note || ''
    };
    trail.push(entry);
    return entry;
  }

  function pushEntry(entry) { entry.key = 'e' + (seq++); trail.push(entry); return entry; }

  /* --------------------------------------- scripted watch (deterministic) */
  /* Derived from the intent's own constraints and success condition, so the
     script is honest about this intent and never invents an outside source.  */
  var CLOCK = ['Day 2 · 09:10', 'Day 5 · 16:40', 'Day 9 · 08:25'];

  /* ---- reading REAL rows out of the resolved panes -----------------------

     Events used to be arithmetic on the constraint (0.88 / 1.06 / 0.945 of the
     limit). That invented data the rest of the page denies: at a €120 budget it
     announced a €106 fare and pointed at the very pane whose only row reads
     "Nothing in the March sample clears €120". It also carried its own hardcoded
     `met`, so an event could claim the success condition had flipped while the
     status line directly above said otherwise.

     Now every quoted figure is a cell from a claim in one of this intent's own
     panes, and `met` is the intent's real success state — so the condition line,
     the status line, the event and the pane it names cannot disagree. When the
     resolved set holds no row in the constraint's unit (the usual case when the
     intent is not met) no figure is quoted at all, rather than one invented. */

  function unitKindOf(c) {
    if (!c || !c.unit) return null;
    var u = String(c.unit).toUpperCase();
    if (u.indexOf('EUR') === 0) return 'eur';
    if (u.indexOf('USD') === 0) return 'usd';
    if (u.indexOf('GBP') === 0) return 'gbp';
    var m = String(c.unit).match(/[a-z]+/i);
    return m ? m[0].toLowerCase() : null;
  }

  /* "€149" -> {kind:'eur', v:149} ; "3 km" -> {kind:'km', v:3} */
  function cellFigure(cell) {
    var s = String(cell == null ? '' : cell).trim();
    var m = s.match(/^([€$£])\s*([\d]+(?:[.,]\d+)?)/);
    if (m) {
      return { kind: m[1] === '€' ? 'eur' : m[1] === '$' ? 'usd' : 'gbp', v: parseFloat(m[2].replace(',', '.')), text: s };
    }
    m = s.match(/^([\d]+(?:[.,]\d+)?)\s*([a-z]+)/i);
    if (m) return { kind: m[2].toLowerCase(), v: parseFloat(m[1].replace(',', '.')), text: s };
    return null;
  }

  /* every row of this intent's panes that carries a figure in the constraint's
     unit, tagged with the pane it actually came from */
  function realRows(intent, num) {
    var kind = unitKindOf(num), out = [], i, j, k;
    if (!kind || !IB.fixtures || !IB.fixtures.panes) return out;
    var ids = intent.panes || [];
    for (i = 0; i < ids.length; i++) {
      var pane = IB.fixtures.panes[ids[i]];
      if (!pane || !pane.claims) continue;
      for (j = 0; j < pane.claims.length; j++) {
        var cells = pane.claims[j] && pane.claims[j].cells;
        if (!cells || !cells.length) continue;
        for (k = 1; k < cells.length; k++) {
          var f = cellFigure(cells[k]);
          if (f && f.kind === kind) {
            out.push({ label: String(cells[0]), figure: f.text, v: f.v, paneId: ids[i] });
            break;
          }
        }
      }
    }
    return out;
  }

  function scriptFor(intent) {
    var steps = [];
    var panes = (intent.panes && intent.panes.length) ? intent.panes : [null];
    var met = !!(intent.success && intent.success.met);
    var num = null, i;

    for (i = 0; i < (intent.constraints || []).length; i++) {
      var c = intent.constraints[i];
      if (!num && isNumeric(c) && numberOf(c) !== null) { num = c; break; }
    }

    var rows = num ? realRows(intent, num) : [];
    var lim = num ? fmt(num) : '', L = num ? num.label : '', cap = num ? numberOf(num) : null;
    var inside = [], outside = [];
    for (i = 0; i < rows.length; i++) (rows[i].v <= cap ? inside : outside).push(rows[i]);

    /* the side of the limit that matches the intent's real state */
    var pick = met ? inside : outside;

    if (num && pick.length) {
      for (i = 0; i < Math.min(2, pick.length); i++) {
        var r = pick[i];
        steps.push({
          /* label last, so an awkward unit string ("50 EUR / month") still reads:
             "… at €34 — inside your stated Per seat, 50 EUR / month." */
          what: 'Re-checked the resolved set — ' + r.label + ' at ' + r.figure +
                (met ? ' — inside your stated ' : ' — still outside your stated ') + L + ', ' + lim + '.',
          meaning: 'That figure is a row in this intent’s own resolved set on this page, not a projection.',
          met: met,
          paneId: r.paneId
        });
      }
      steps.push({
        what: 'Re-checked — the resolved set has not moved since the last check.',
        meaning: 'No row entered or left it. The script has no further steps.',
        met: met,
        paneId: pick[0].paneId
      });
    } else if (num) {
      /* no row in the constraint's unit to quote — say so, invent nothing */
      steps.push({
        what: 'Re-checked the resolved set against your stated ' + L + ', ' + lim + '.',
        meaning: met
          ? 'It still meets the constraint. No single row is quoted here because the set carries no figure in that unit.'
          : 'Nothing in it meets that constraint, so no figure is quoted — this page has no option to name.',
        met: met
      });
      steps.push({
        what: 'Re-checked again — the resolved set is unchanged.',
        meaning: 'No row entered or left it. The script has no further steps.',
        met: met
      });
    } else {
      steps.push({
        what: 'Re-checked the resolved set against the constraints you stated.',
        meaning: 'It is unchanged.',
        met: met
      });
      steps.push({
        what: 'Re-checked again — still unchanged.',
        meaning: 'No row entered or left it. The script has no further steps.',
        met: met
      });
    }

    for (i = 0; i < steps.length; i++) {
      steps[i].at = CLOCK[i] || ('Day ' + (2 + i * 3) + ' · 09:00');
      /* a step that quoted a real row names the pane that row came from; a step
         with no row names no pane at all, rather than pointing at one it cannot
         evidence */
      if (!steps[i].paneId) steps[i].paneId = null;
      steps[i].n = i + 1;
      steps[i].of = steps.length;
    }
    return steps;
  }

  function standingFor(intentId) {
    for (var i = 0; i < standing.length; i++) if (standing[i].intent.id === intentId) return standing[i];
    return null;
  }

  /* The watch condition must be FORWARD-LOOKING: a thing that is not the case
     yet and could become so (or, when the intent already holds, the thing that
     would end it). It is therefore built from the intent's own goal and
     constraints — never from success.label, which resolve.js writes as a report
     on the CURRENT state ("Nothing in the March sample is at or under €50 …").
     Splicing that after "Watch until" promised the watch would end when the
     failure happened, which is backwards. The label still earns its place, but
     as a separate present-tense clause: see watchStatus(). */
  function constraintPhrase(intent) {
    var cs = (intent && intent.constraints) || [], parts = [];
    for (var i = 0; i < cs.length; i++) parts.push(cs[i].label + ' ' + fmt(cs[i]));
    return parts.join(', ');
  }

  function watchCondition(s) {
    var i = s.intent;
    var goal = stripDot(i.goal || i.sentence || '');
    var cons = constraintPhrase(i);
    var within = cons ? ' within ' + cons : '';
    var subject = goal ? 'the goal “' + goal + '”' : 'this intent';
    return i.success && i.success.met
      ? 'Standing watch — reports if this stops holding: if ' + subject + ' is no longer met' + within + '.'
      : 'Standing watch — reports when this starts to hold: when ' + subject + ' is met' + within + '.';
  }

  /* the present-tense clause, kept clearly apart from the watch condition */
  function watchStatus(s) {
    var sc = s.intent.success || {};
    var head = sc.met ? 'It holds right now' : 'It does not hold right now';
    return sc.label ? head + ': ' + sc.label : head + '.';
  }

  /* --------------------------------------------------------- rendering */
  function shell() {
    return '' +
      '<section class="ib-standing">' +
        '<div class="ib-standing-head">' +
          '<h2 class="vk-shead">Standing intents &amp; trail</h2>' +
          '<p class="ib-standing-note vk-note">An intent left standing re-states itself and reports what moved. ' +
          'In this prototype every change is a written script that the operator steps through — ' +
          'nothing here watches the live web.</p>' +
        '</div>' +
        '<div class="ib-watchbar"></div>' +
        '<div class="ib-block ib-block--standing">' +
          '<div class="ib-block-head"><h3 class="vk-shead">On watch</h3></div>' +
          '<div class="ib-standing-list"></div>' +
        '</div>' +
        '<div class="ib-block ib-block--trail">' +
          '<div class="ib-block-head"><h3 class="vk-shead">Trail — history as intents, not addresses</h3></div>' +
          '<div class="ib-trail-list vk-feed" role="list"></div>' +
        '</div>' +
      '</section>';
  }

  function renderWatchbar() {
    var el = root.querySelector('.ib-watchbar');
    if (!el) return;
    if (!current) {
      el.innerHTML = '<p class="ib-watch-hint vk-note">State an intent first — then it can be left standing.</p>';
      return;
    }
    var on = !!standingFor(current.id);
    el.innerHTML =
      '<div class="vk-btns">' +
        '<button type="button" class="vk-btn vk-btn--sm ' + (on ? 'vk-btn--quiet' : 'vk-btn--accent') + ' ib-watch-toggle" ' +
          'data-act="' + (on ? 'unwatch' : 'watch') + '" data-id="' + esc(current.id) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
          (on ? 'Take off watch' : 'Put this intent on watch') +
        '</button>' +
      '</div>' +
      '<p class="ib-watch-hint vk-note">' +
        (on ? 'This intent is standing. Step its script below to see it report a change.'
            : 'Leave “' + esc(current.sentence) + '” standing and it keeps its own watch condition.') +
      '</p>';
  }

  function renderStandingList() {
    var el = root.querySelector('.ib-standing-list');
    if (!el) return;
    if (!standing.length) {
      el.innerHTML = '<p class="vk-empty">Nothing is standing yet. An intent on watch keeps its condition and reports what moves.</p>';
      return;
    }
    var html = '', i;
    for (i = 0; i < standing.length; i++) {
      var s = standing[i];
      var done = s.cursor >= s.script.length;
      html += '<article class="ib-standing-card vk-card">' +
        '<div class="ib-standing-card-head">' +
          '<span class="vk-pill vk-pill--spec">Standing</span>' +
          '<h4 class="vk-h3 ib-standing-sentence">' + esc(s.intent.sentence) + '</h4>' +
        '</div>' +
        (s.intent.goal ? '<p class="ib-standing-goal vk-note">' + esc(s.intent.goal) + '</p>' : '') +
        '<p class="ib-standing-condition vk-notice">' + esc(watchCondition(s)) + '</p>' +
        '<p class="ib-standing-status vk-note">' + esc(watchStatus(s)) + '</p>' +
        '<div class="ib-standing-actions vk-btns">' +
          '<button type="button" class="vk-btn vk-btn--sm ' + (done ? 'vk-btn--off' : 'vk-btn--ghost') + ' ib-advance" ' +
            'data-act="advance" data-id="' + esc(s.intent.id) + '"' + (done ? ' disabled' : '') + '>' +
            (done ? 'Script finished' : 'Advance the scripted watch') +
          '</button>' +
          '<button type="button" class="vk-btn vk-btn--sm vk-btn--quiet ib-unwatch" data-act="unwatch" data-id="' + esc(s.intent.id) + '">Stop watching</button>' +
        '</div>' +
        '<p class="ib-advance-note vk-note">' +
          (done ? 'All ' + s.script.length + ' scripted events have played.'
                : 'Next: scripted event ' + (s.cursor + 1) + ' of ' + s.script.length + '.') +
          ' These were written in advance and are stepped by you — this is not a live feed.</p>' +
        renderChanges(s) +
      '</article>';
    }
    el.innerHTML = html;
  }

  function renderChanges(s) {
    if (!s.changes.length) {
      return '<div class="ib-changes"><p class="vk-empty">No change reported yet on this standing intent.</p></div>';
    }
    var html = '<div class="ib-changes">', i, j;
    for (i = s.changes.length - 1; i >= 0; i--) {
      var ch = s.changes[i];

      if (ch.restated) {
        var diff = '';
        for (j = 0; j < ch.diff.length; j++) diff += '<li class="ib-change-diff-item">' + esc(ch.diff[j]) + '</li>';
        html += '<div class="ib-change ib-change--restated vk-notice">' +
          '<div class="ib-change-head">' +
            '<span class="vk-pill vk-pill--spec">Restated</span>' +
            '<span class="ib-change-when">' + esc(ch.at) + '</span>' +
          '</div>' +
          '<p class="ib-change-what">' + esc(ch.what) + '</p>' +
          (diff ? '<ul class="ib-change-diff">' + diff + '</ul>' : '') +
          '<p class="ib-change-meaning">' + esc(ch.meaning) + '</p>' +
        '</div>';
        continue;
      }

      html += '<div class="ib-change' + (ch.prior ? ' ib-change--prior' : '') + ' vk-notice">' +
        '<div class="ib-change-head">' +
          '<span class="vk-pill vk-pill--spec">Scripted change ' + ch.n + ' of ' + ch.of + '</span>' +
          '<span class="ib-change-when">' + esc(ch.at) + '</span>' +
        '</div>' +
        '<p class="ib-change-what">' + esc(ch.what) + '</p>' +
        '<p class="ib-change-meaning">' + esc(ch.meaning) + '</p>' +
        '<p class="ib-change-meta">' +
          (ch.paneId ? 'Shows in “' + esc(ch.paneName || paneTitle(ch.paneId)) + '” · ' : '') +
          'Success condition: ' + (ch.met ? 'holds' : 'does not hold') +
        '</p>' +
        (ch.prior ? '<p class="ib-change-prior">Reported before you restated this intent, under ' +
          esc(ch.prior) + '.</p>' : '') +
      '</div>';
    }
    return html + '</div>';
  }

  function renderTrail() {
    var el = root.querySelector('.ib-trail-list');
    if (!el) return;
    if (!trail.length) {
      /* role="list" may only contain listitems, so the empty state is one too */
      el.innerHTML = '<div class="ib-trail-empty vk-empty" role="listitem">' +
        'The trail is empty. It will fill with intents you stated — never with addresses you visited.</div>';
      return;
    }
    var html = '', n = 0, i, j;
    /* number intents in the order they happened, render newest first */
    var nums = [];
    for (i = 0; i < trail.length; i++) { if (trail[i].kind === 'intent') n++; nums[i] = n; }

    for (i = trail.length - 1; i >= 0; i--) {
      var e = trail[i];
      if (e.kind === 'intent') {
        var s = e.snapshot;
        var vals = '';
        for (j = 0; j < s.constraints.length; j++) {
          vals += '<li class="ib-trail-value"><b>' + esc(s.constraints[j].label) + '</b> ' + esc(fmt(s.constraints[j])) + '</li>';
        }
        var diff = '';
        for (j = 0; j < e.diff.length; j++) diff += '<li class="ib-trail-diff-item">' + esc(e.diff[j]) + '</li>';

        html += '<div class="ib-trail-item ib-trail-item--intent vk-item" role="listitem">' +
          '<span class="when ib-trail-when">intent ' + (nums[i] < 10 ? '0' : '') + nums[i] + '</span>' +
          '<div class="ib-trail-body">' +
            '<p class="what ib-trail-sentence">' + esc(s.sentence) + '</p>' +
            (s.goal ? '<p class="sub ib-trail-goal">' + esc(s.goal) + '</p>' : '') +
            (vals ? '<ul class="ib-trail-values">' + vals + '</ul>' : '') +
            '<p class="sub ib-trail-success">Success condition: ' + esc(stripDot(s.success.label)) +
              ' — ' + (s.success.met ? 'met' : 'not met') + '</p>' +
            (e.note ? '<p class="sub ib-trail-note">' + esc(e.note) + '</p>' : '') +
            '<ul class="ib-trail-diff">' + diff + '</ul>' +
            '<div class="ib-trail-actions">' +
              '<button type="button" class="vk-btn vk-btn--sm vk-btn--ghost ib-trail-reopen" data-act="reopen" data-key="' + esc(e.key) + '" ' +
                'aria-label="Reopen this intent: ' + esc(s.sentence) + '">Reopen</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      } else {
        html += '<div class="ib-trail-item ib-trail-item--decision vk-item" role="listitem">' +
          '<span class="when ib-trail-when">decision</span>' +
          '<div class="ib-trail-body">' +
            '<p class="what ib-trail-sentence">' + esc(e.label) + '</p>' +
            (e.sentence ? '<p class="sub ib-trail-goal">On the intent “' + esc(e.sentence) + '”</p>' : '') +
            '<p class="sub ib-trail-note">' + esc(e.note) + '</p>' +
          '</div>' +
        '</div>';
      }
    }
    el.innerHTML = html;
  }

  /* keep the keyboard where it was across a full re-render */
  function render() {
    if (!root) return;
    var a = document.activeElement;
    var want = null;
    if (a && root.contains(a) && a.getAttribute && a.getAttribute('data-act')) {
      want = { act: a.getAttribute('data-act'), id: a.getAttribute('data-id'), key: a.getAttribute('data-key') };
    }
    renderWatchbar();
    renderStandingList();
    renderTrail();
    if (want) {
      var sel = '[data-act="' + want.act + '"]' +
        (want.id ? '[data-id="' + want.id + '"]' : '') +
        (want.key ? '[data-key="' + want.key + '"]' : '');
      var el = root.querySelector(sel);
      /* if the control retired itself (script finished, intent unwatched),
         land the keyboard on the nearest still-live control instead of <body> */
      if ((!el || el.disabled) && want.id) el = root.querySelector('[data-id="' + want.id + '"]:not([disabled])');
      if (!el || el.disabled) el = root.querySelector('.ib-watch-toggle');
      if (el && !el.disabled && typeof el.focus === 'function') el.focus();
    }
  }

  /* ------------------------------------------------------------ actions */
  /* A standing intent STAYS LIVE. If the operator edits an intent that is on
     watch, the card must describe the edited object — otherwise it asserts a
     present-tense fact that the trail entry directly beneath it contradicts,
     and points its watch the wrong way in time.

     Re-deriving the script is not enough on its own: values scripted against a
     €200 budget are nonsense against €40, and simply wiping events the operator
     has already stepped through would erase what they watched happen. So the
     restatement is made explicit — prior events are kept and labelled with the
     statement they were reported under, a marker records the edit, and a fresh
     script is derived from the new constraints. Nothing silently changes
     meaning underneath the reader. */
  function refreshStanding(intent) {
    var s = standingFor(intent.id);
    if (!s) return false;
    var next = snap(intent);
    if (sameSnapshot(s.intent, next)) return false;

    var priorPhrase = constraintPhrase(s.intent);
    for (var i = 0; i < s.changes.length; i++) {
      if (!s.changes[i].restated && !s.changes[i].prior) s.changes[i].prior = priorPhrase;
    }
    s.changes.push({
      restated: true,
      at: 'on your edit',
      what: 'You restated this intent while it stood.',
      meaning: 'The watch follows the restated intent from here' +
        (constraintPhrase(next) ? ': ' + constraintPhrase(next) : '') +
        '. Its scripted events start again from the first, because events scripted ' +
        'against the previous constraints would not mean anything against these.',
      diff: diffOf(s.intent, next)
    });
    s.intent = next;
    s.script = scriptFor(intent);
    s.cursor = 0;
    return true;
  }

  function watch(intentObject) {
    var intent = intentObject || current;
    if (!intent || !intent.id) return null;
    var found = standingFor(intent.id);
    if (found) {
      refreshStanding(intent);                       /* never leave a stale card */
    } else {
      found = { intent: snap(intent), script: scriptFor(intent), cursor: 0, changes: [] };
      standing.push(found);
      if (IB.bus && IB.bus.emit) IB.bus.emit('intent:standing', intent);
    }
    render();
    return standingFor(intent.id).intent;
  }

  function unwatch(intentId) {
    for (var i = 0; i < standing.length; i++) {
      if (standing[i].intent.id === intentId) { standing.splice(i, 1); break; }
    }
    render();
  }

  function advance(intentId) {
    var s = standingFor(intentId);
    if (!s || s.cursor >= s.script.length) return;
    var step = s.script[s.cursor++];
    var ch = {
      n: step.n, of: step.of, at: step.at, paneId: step.paneId,
      /* the pane's title as it read WHEN this was reported — resolving it lazily
         at render time made an event reported under a €200 budget claim a pane
         titled "…at or under €40" once the intent was restated */
      paneName: paneTitle(step.paneId),
      what: step.what, meaning: step.meaning, met: step.met
    };
    s.changes.push(ch);
    if (IB.bus && IB.bus.emit) {
      IB.bus.emit('intent:change', {
        intentId: intentId,
        note: step.what + ' ' + step.meaning,
        at: step.at,
        paneId: step.paneId
      });
    }
    render();
  }

  function reopen(key) {
    var e = entryByKey(key);
    if (!e || e.kind !== 'intent' || typeof IB.resolve !== 'function') return;
    var s = e.snapshot;
    restoring = true;
    var back = null;
    try {
      back = IB.resolve(s.id) || null;
      if (back && typeof IB.editField === 'function') {
        for (var i = 0; i < s.constraints.length; i++) {
          var want = s.constraints[i];
          var got = byId(back.constraints, want.id);
          if (got && String(got.value) !== String(want.value)) {
            back = IB.editField(back.id, want.id, want.value) || back;
          }
        }
      }
    } finally {
      restoring = false;
    }
    if (back) current = back;
    pushIntentEntry(current, 'Reopened from the trail — the intent came back, not a page.', true);
    render();
  }

  /* ================================================ primitive 6 — the gate */
  var gate = null, gatePanel = null, gateTrigger = null, gateStaged = null, gateOpen = false, gateConfirmed = false;

  function buildGate() {
    if (gate) return gate;
    gate = document.createElement('dialog');
    gate.className = 'ib-gate';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.setAttribute('aria-labelledby', 'ib-gate-title');
    /* The <dialog> element's UA styling is opaque white with CanvasText, which is
       unreadable over a dark theme. These four declarations neutralise the UA box
       so the themed .ib-gate-panel inside is what shows. Kit tokens only, no
       sizing — app.css owns width, placement and the panel's whole appearance. */
    gate.setAttribute('style', 'background:transparent;border:0;padding:0;color:var(--ink);');
    gate.innerHTML = '' +
      '<div class="ib-gate-panel vk-panel" tabindex="-1">' +
        '<div class="ib-gate-head">' +
          '<span class="vk-pill vk-pill--spec">Action gate</span>' +
          '<h2 class="vk-h3 ib-gate-title" id="ib-gate-title">This action is staged, not taken</h2>' +
        '</div>' +
        '<div class="ib-gate-body">' +
          '<div class="ib-gate-field"><div class="vk-shead">Action</div><p class="ib-gate-label"></p></div>' +
          '<div class="ib-gate-field"><div class="vk-shead">What it would do</div><p class="ib-gate-detail vk-note"></p></div>' +
          '<div class="ib-gate-field"><div class="vk-shead">Stated consequence</div><p class="ib-gate-consequence vk-notice"></p></div>' +
          '<p class="ib-gate-note vk-note">This prototype never performs the action. Confirming records your decision in the trail and nothing else.</p>' +
          /* Cancel first in the DOM because app.css renders it first (it sets
             order:1/order:2). Tab order therefore matches reading order, and
             the keyboard reaches the reversible control before the consequential
             one — WCAG 2.4.3, on the one screen whose point is deliberateness.
             The order:* rules are now redundant and can be dropped in app.css. */
          '<div class="ib-gate-actions vk-btns">' +
            '<button type="button" class="vk-btn ib-gate-cancel">Cancel</button>' +
            '<button type="button" class="vk-btn vk-btn--accent ib-gate-confirm">Confirm</button>' +
          '</div>' +
        '</div>' +
        '<div class="ib-gate-result" hidden>' +
          '<span class="vk-pill vk-pill--spec">Logged, not performed</span>' +
          '<p class="ib-gate-result-what">Your confirmation is now in the trail as a logged decision.</p>' +
          '<p class="vk-notice">Nothing was sent. Nothing was purchased. No money moved. This page has no connection to any service and never had one.</p>' +
          '<div class="vk-btns"><button type="button" class="vk-btn ib-gate-close">Close</button></div>' +
        '</div>' +
      '</div>';
    gatePanel = gate.querySelector('.ib-gate-panel');

    gate.querySelector('.ib-gate-confirm').addEventListener('click', confirmGate);
    gate.querySelector('.ib-gate-cancel').addEventListener('click', function () { closeGate(); });
    gate.querySelector('.ib-gate-close').addEventListener('click', function () { closeGate(); });
    gate.addEventListener('cancel', function (ev) { ev.preventDefault(); closeGate(); });
    gate.addEventListener('click', function (ev) { if (ev.target === gate) closeGate(); });
    gate.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' || ev.key === 'Esc') { ev.preventDefault(); closeGate(); return; }
      if (ev.key !== 'Tab') return;
      var items = focusables();
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (ev.shiftKey && (document.activeElement === first || document.activeElement === gatePanel)) {
        ev.preventDefault(); last.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault(); first.focus();
      }
    });

    document.body.appendChild(gate);
    return gate;
  }

  function focusables() {
    var all = gate.querySelectorAll('button'), out = [];
    for (var i = 0; i < all.length; i++) {
      var b = all[i];
      if (b.disabled) continue;
      if (b.offsetParent === null && b.getClientRects().length === 0) continue;
      out.push(b);
    }
    return out;
  }

  /* The gate has exactly two faces and only one may ever be on screen.
     `hidden` alone is not enough: any author rule carrying a display value
     (e.g. `.ib-gate-body{display:grid}` in app.css) out-specifies the UA's
     `[hidden]{display:none}` and leaves a live Confirm button on screen under
     the result. So the attribute is set for assistive tech AND the inline
     display is set for the layout, and neither face depends on app.css. */
  function swapFace(staged) {
    var body = gate.querySelector('.ib-gate-body');
    var result = gate.querySelector('.ib-gate-result');
    body.hidden = !staged;
    body.style.display = staged ? '' : 'none';
    result.hidden = !!staged;
    result.style.display = staged ? 'none' : '';
  }

  function openGate(payload) {
    buildGate();
    /* Re-staging over an open gate retires the previous staging without a
       closure, so announce that cancellation too — otherwise workspace.js is
       left showing a status line for an action nobody can act on any more. */
    if (gateOpen && !gateConfirmed && gateStaged && IB.bus && IB.bus.emit) {
      IB.bus.emit('action:cancelled', { intentId: gateStaged.intentId || '', label: gateStaged.label || '' });
    }
    gateStaged = payload || {};
    /* keep the ORIGINAL opener: while the dialog is modal everything outside it
       is inert, so activeElement here would just be one of our own buttons */
    if (!gateOpen) {
      gateTrigger = (document.activeElement && document.activeElement !== document.body) ? document.activeElement : null;
    }

    gateConfirmed = false;
    gate.querySelector('.ib-gate-label').textContent = gateStaged.label || 'Unnamed action';
    gate.querySelector('.ib-gate-detail').textContent = gateStaged.detail || 'No detail was supplied with this staged action.';
    gate.querySelector('.ib-gate-consequence').textContent = gateStaged.consequence || 'No consequence was stated.';
    swapFace(true);

    if (typeof gate.showModal === 'function') {
      if (!gate.open) gate.showModal();
    } else {
      gate.setAttribute('open', '');
    }
    gateOpen = true;
    if (gatePanel) gatePanel.focus();
  }

  function closeGate() {
    if (!gate || !gateOpen) return;
    gateOpen = false;
    /* A closure that carries no confirmation IS a cancellation, however it was
       reached — Cancel, Escape, or the backdrop. workspace.js needs to hear it
       so its staged status line stops claiming something is still waiting.
       Exactly once per closure (gateOpen guards re-entry) and never after an
       action:confirmed for the same staging (gateConfirmed guards that). */
    if (!gateConfirmed) {
      var p = gateStaged || {};
      if (IB.bus && IB.bus.emit) {
        IB.bus.emit('action:cancelled', { intentId: p.intentId || '', label: p.label || '' });
      }
    }
    if (typeof gate.close === 'function' && gate.open) gate.close();
    else gate.removeAttribute('open');
    var back = gateTrigger;
    gateTrigger = null;
    if (back && document.contains(back) && typeof back.focus === 'function') back.focus();
  }

  function confirmGate() {
    /* one staged action, one decision — a second confirm can never be logged,
       whatever CSS does to the button */
    if (!gateOpen || gateConfirmed) return;
    gateConfirmed = true;
    var p = gateStaged || {};
    var sentence = '';
    if (current && current.id === p.intentId) sentence = current.sentence;
    if (!sentence) {
      for (var i = trail.length - 1; i >= 0; i--) {
        if (trail[i].kind === 'intent' && trail[i].snapshot.id === p.intentId) { sentence = trail[i].snapshot.sentence; break; }
      }
    }
    pushEntry({
      kind: 'decision',
      intentId: p.intentId || '',
      label: 'Confirmed at the gate — “' + (p.label || 'Unnamed action') + '”',
      sentence: sentence,
      note: 'Recorded as a decision by the operator. ' +
            (p.consequence ? 'Stated consequence: ' + stripDot(p.consequence) + '. ' : '') +
            'Nothing was sent, nothing was purchased, no money moved.'
    });
    swapFace(false);
    /* tell the surface how the gate resolved, so no pane is left saying this
       action "is waiting at the confirmation gate" after it was decided */
    if (IB.bus && IB.bus.emit) {
      IB.bus.emit('action:confirmed', { intentId: p.intentId || '', label: p.label || '' });
    }
    var close = gate.querySelector('.ib-gate-close');
    if (close) close.focus();
    render();
  }

  /* --------------------------------------------------------------- wiring */
  function onIntent(intent) {
    if (restoring || !intent) return;
    current = intent;
    refreshStanding(intent);        /* a card on watch tracks its intent, live */
    pushIntentEntry(intent, '', false);
    render();
  }

  function wire() {
    if (wired || !IB.bus || typeof IB.bus.on !== 'function') return;
    wired = true;
    IB.bus.on('intent:resolved', onIntent);
    IB.bus.on('intent:edited', onIntent);
    IB.bus.on('action:staged', function (payload) { openGate(payload); });
  }

  function onClick(ev) {
    var t = ev.target;
    while (t && t !== root && !(t.getAttribute && t.getAttribute('data-act'))) t = t.parentNode;
    if (!t || t === root || !t.getAttribute) return;
    var act = t.getAttribute('data-act');
    if (act === 'watch') { ev.preventDefault(); watch(current); }
    else if (act === 'unwatch') { ev.preventDefault(); unwatch(t.getAttribute('data-id')); }
    else if (act === 'advance') { ev.preventDefault(); advance(t.getAttribute('data-id')); }
    else if (act === 'reopen') { ev.preventDefault(); reopen(t.getAttribute('data-key')); }
  }

  function mount(el) {
    if (!el) return;
    if (root && root !== el) root.removeEventListener('click', onClick);
    var again = (root === el);
    root = el;
    root.innerHTML = shell();
    if (!again) root.addEventListener('click', onClick);   /* mount is once, but stay idempotent */
    wire();
    if (!current && typeof IB.current === 'function') {
      var c = IB.current();
      if (c) { current = c; pushIntentEntry(c, '', false); }
    }
    render();
  }

  wire();

  IB.standing = {
    mount: mount,
    watch: watch,
    unwatch: unwatch,
    list: function () {
      var out = [];
      for (var i = 0; i < standing.length; i++) out.push(standing[i].intent);
      return out;
    },
    trail: function () { return trail.slice(0); }
  };
})();
