/* ===========================================================================
   intent-bar.js — the intent bar, the intent object, and the boot sequence.
   Vision Outreach Media · Intent Browsing prototype.

   Owns:
     · the seed chips, rendered from IB.seeds (never hardcoded here)
     · the bar form: sentence -> IB.resolve()
     · PRIMITIVE 2 — rendering the IntentObject into #ib-object with every
       constraint as a live control, wired to IB.editField()
     · the light/dark toggle
     · IB.boot(), which mounts workspace.js and standing.js

   Reads other modules only through the module contract in BRIEF.md. No
   imports, no modules, no dependencies — the files are concatenated.
   =========================================================================== */

window.IB = window.IB || {};

(function () {
  'use strict';

  var IB = window.IB;

  /* ------------------------------------------------------------- tiny helpers */

  function byId(id) { return document.getElementById(id); }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== null && text !== undefined) n.textContent = text;
    return n;
  }

  function clear(n) { while (n && n.firstChild) { n.removeChild(n.firstChild); } }

  function isArr(v) { return Object.prototype.toString.call(v) === '[object Array]'; }

  function trim(s) { return String(s === null || s === undefined ? '' : s).replace(/^\s+|\s+$/g, ''); }

  /* Loose comparison of two sentences, so "Find a Flight to Lisbon…" and the
     fixture's own wording are not reported as a mismatch. */
  function norm(s) { return trim(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/^ | $/g, ''); }

  function quote(s) { return '“' + s + '”'; }

  /* A one-line status the screen reader also announces (#ib-status is a live
     region). tone: null | "note" | "warn". */
  function status(msg, tone) {
    var n = byId('ib-status');
    if (!n) { return; }
    n.textContent = msg || '';
    n.className = 'ib-status' + (tone ? ' is-' + tone : '');
  }

  /* ------------------------------------------------------------------- theme */

  var THEME_KEY = 'ib.theme';

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(theme, remember) {
    var root = document.documentElement;
    root.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    if (remember) {
      root.removeAttribute('data-theme-auto');       /* the operator has chosen; stop following the OS */
      try { window.localStorage.setItem(THEME_KEY, theme); } catch (e) { /* file:// may refuse storage */ }
    }
    syncThemeButton();
  }

  function syncThemeButton() {
    var btn = byId('ib-theme');
    var label = byId('ib-theme-t');
    if (!btn) { return; }
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    if (label) { label.textContent = next === 'dark' ? 'Dark' : 'Light'; }
    btn.setAttribute('aria-label', 'Switch to ' + next + ' theme');
  }

  function wireTheme() {
    var btn = byId('ib-theme');
    if (btn) {
      btn.addEventListener('click', function () {
        applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
      });
    }
    /* Keep following the OS until the operator overrides it. */
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () {
        if (document.documentElement.getAttribute('data-theme-auto') === '1') {
          applyTheme(mq.matches ? 'dark' : 'light', false);
        }
      };
      if (mq.addEventListener) { mq.addEventListener('change', onChange); }
      else if (mq.addListener) { mq.addListener(onChange); }
    }
    syncThemeButton();
  }

  /* --------------------------------------------------------------- seed chips */

  /* The example sentences the bar shows are never written down twice: the
     placeholder and the empty-submit prompt are both read out of IB.seeds, so
     they cannot drift if the fixtures change. i may be negative, counting back
     from the end. */
  function seedSentence(i) {
    var seeds = isArr(IB.seeds) ? IB.seeds : [];
    if (!seeds.length) { return ''; }
    var n = i < 0 ? seeds.length + i : i;
    if (n < 0 || n >= seeds.length) { return ''; }
    return seeds[n] && seeds[n].sentence ? String(seeds[n].sentence) : '';
  }

  function renderSeeds() {
    var host = byId('ib-seeds');
    if (!host) { return; }
    clear(host);

    var seeds = isArr(IB.seeds) ? IB.seeds : [];
    if (!seeds.length) {
      host.appendChild(el('p', 'vk-empty', 'No scripted intents are loaded in this copy of the page.'));
      return;
    }

    for (var i = 0; i < seeds.length; i++) {
      host.appendChild(seedChip(seeds[i]));
    }

    /* the placeholder is one of the real seeded sentences, taken from the contract */
    var input = byId('ib-input');
    var example = seedSentence(0);
    if (input && example) { input.setAttribute('placeholder', example); }
  }

  function seedChip(seed) {
    var b = el('button', 'vk-chip', seed.sentence || seed.id);
    b.type = 'button';
    b.setAttribute('data-seed', seed.id);
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () {
      var input = byId('ib-input');
      if (input) { input.value = seed.sentence || ''; }   /* show the sentence the id stands for */
      run(seed.id, seed.sentence);
    });
    return b;
  }

  function markSeed(id) {
    var host = byId('ib-seeds');
    if (!host) { return; }
    var bs = host.getElementsByTagName('button');
    for (var i = 0; i < bs.length; i++) {
      bs[i].setAttribute('aria-pressed', bs[i].getAttribute('data-seed') === id ? 'true' : 'false');
    }
  }

  /* ------------------------------------------------------------- resolving */

  /* query — a seed id or a free sentence. echo — what the operator actually
     said, used only to report honestly when the match is not exact. */
  function run(query, echo) {
    if (typeof IB.resolve !== 'function') {
      status('The resolver did not load, so nothing can be resolved in this copy of the page.', 'warn');
      return;
    }

    var out = null;
    try { out = IB.resolve(query); } catch (e) { out = null; }

    if (!out) {
      markSeed(null);
      var n = isArr(IB.seeds) ? IB.seeds.length : 0;   /* counted, not asserted */
      var word = ['no', 'one', 'two', 'three', 'four', 'five'][n] || String(n);
      status('This prototype carries ' + word + ' scripted intent' + (n === 1 ? '' : 's')
        + ' and nothing else. Rather than invent a result for '
        + quote(trim(echo === undefined ? query : echo))
        + ', it stops here — pick one of the ' + word + ' above and edit its constraints.', 'warn');
      return;
    }

    markSeed(out.id);

    var said = echo === undefined || echo === null ? query : echo;
    if (typeof said === 'string' && out.sentence && norm(said) !== norm(out.sentence) && norm(said) !== norm(out.id)) {
      status('Matched to the nearest scripted intent: ' + quote(out.sentence)
        + '. Nothing was searched — this is a lookup against a fixture written in advance.', 'note');
    } else {
      status('Resolved from a fixture. Change any constraint below and the surface re-resolves against it.', 'note');
    }

    revealObject();
  }

  function wireForm() {
    var form = byId('ib-form');
    var input = byId('ib-input');
    if (!form) { return; }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = input ? trim(input.value) : '';
      if (!v) {
        var example = seedSentence(-1);               /* read from IB.seeds, never a literal */
        status('State an outcome' + (example ? ' — for example ' + quote(example) + ' — ' : ' — ')
          + 'or choose one of the scripted intents above.', 'warn');
        if (input) { input.focus(); }
        return;
      }
      run(v, v);
    });
  }

  /* --------------------------------------------------- the sticky chrome */
  /* The mark and the honesty notice sit in .ib-top at z-index 40, and that
     stack is 95px at 1280 and 183px at 360. Anything scrolled to the top of
     the document therefore ends up UNDERNEATH it — including whatever the
     browser scrolls to when sequential keyboard focus moves, which parks a
     control at top 0 and leaves its focus ring invisible behind an opaque
     overlay (WCAG 2.2 SC 2.4.11, Focus Not Obscured).

     So the height is measured once here and published as --ib-sticky. The
     stylesheet turns it into scroll-margin-top on every focusable, and the
     reveal below reads the same variable. Measured, never assumed: the height
     changes with the viewport because the notice rewraps. */
  function measureSticky() {
    var sticky = document.querySelector('.ib-top');
    var h = 0;
    if (sticky && sticky.getBoundingClientRect) {
      var cs = window.getComputedStyle ? window.getComputedStyle(sticky) : null;
      if (!cs || cs.position === 'sticky' || cs.position === 'fixed') {
        h = Math.round(sticky.getBoundingClientRect().height);
      }
    }
    if (document.documentElement.style.setProperty) {
      try { document.documentElement.style.setProperty('--ib-sticky', h + 'px'); }
      catch (e) { /* an engine without custom properties falls back to the 0px default */ }
    }
    return h;
  }

  /* Re-measure at most once a frame, so a drag-resize cannot thrash layout. */
  var stickyQueued = false;
  function scheduleSticky() {
    if (stickyQueued) { return; }
    stickyQueued = true;
    var run = function () { stickyQueued = false; measureSticky(); };
    if (window.requestAnimationFrame) { window.requestAnimationFrame(run); }
    else { setTimeout(run, 16); }
  }

  function watchSticky() {
    measureSticky();
    window.addEventListener('resize', scheduleSticky);
    window.addEventListener('orientationchange', scheduleSticky);
    /* the notice can rewrap once the mark has decoded, so take one more reading */
    window.addEventListener('load', scheduleSticky);
  }

  /* Bring the object into view after a deliberate resolve, so a small screen
     does not leave the result below the fold. Never on an edit. The offset
     lives in the stylesheet (#ib-object's scroll-margin-top, one rhythm step
     clear of --ib-sticky); all this has to do is make sure the measurement is
     current for the viewport we are in. */
  function revealObject() {
    var host = byId('ib-object');
    if (!host || !host.scrollIntoView) { return; }

    measureSticky();

    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
      host.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' });
    } catch (e) {
      try { host.scrollIntoView(); } catch (e2) { /* nothing to do */ }
    }
  }

  /* =========================================================================
     PRIMITIVE 2 — THE INTENT OBJECT
     The sentence is not kept as a string. It is rendered as a structure whose
     every constraint is a real control, and changing a control re-resolves.
     ========================================================================= */

  /* What is currently on screen, so an edit can be patched in place rather than
     re-rendered underneath the operator's fingers. */
  var view = null;

  /* Identity of the constraint set. If this changes, the shape changed and a
     patch is not enough. */
  function shapeKey(intent) {
    var cs = isArr(intent.constraints) ? intent.constraints : [];
    var parts = [];
    for (var i = 0; i < cs.length; i++) { parts.push(String(cs[i].id) + ':' + String(cs[i].type)); }
    return parts.join('|');
  }

  function optionsKey(c) {
    return isArr(c.options) ? c.options.join('') : '';
  }

  /* True while THIS file is writing to its own controls. A programmatic value
     write does not fire `change`, but tearing a focused, dirty input out of the
     DOM does — so anything the browser fires while we are painting is ours, not
     the operator's, and must not be committed. */
  var applying = false;

  /* One commit path for every control.
     A commit is only genuine when all four hold:
       · we are not mid-paint (applying)
       · the control is still in the document (not a teardown blur)
       · it belongs to the intent that is CURRENTLY resolved
       · its value actually differs from the last value we committed or wrote
     Without the third check, pressing Enter in Budget and then clicking a
     different seed chip fires a stale `change` for the OLD intent after the new
     one has resolved, and IB.current() falls back to the intent that is no
     longer on screen. Without the fourth, Enter (which does not blur) commits
     once, then the later blur commits the same value again. */
  function commit(intentId, fieldId, value, rec, ctl) {
    if (applying) { return; }
    if (ctl && ctl.isConnected === false) { return; }

    if (typeof IB.current === 'function') {
      var cur = null;
      try { cur = IB.current(); } catch (e) { cur = null; }
      if (cur && cur.id !== intentId) { return; }   /* stale control from a previous intent */
    }

    var next = String(value === null || value === undefined ? '' : value);
    if (rec && rec.lastCommitted === next) { return; }
    if (rec) { rec.lastCommitted = next; }

    if (typeof IB.editField !== 'function') {
      status('Editing is unavailable in this copy of the page.', 'warn');
      return;
    }
    try {
      IB.editField(intentId, fieldId, value);       /* emits intent:edited; the bus handler repaints */
    } catch (e2) {
      status('That edit could not be applied to this fixture.', 'warn');
    }
  }

  /* Write a resolved value back into a control the operator may still be
     standing in. The resolver clamps out-of-range numbers BEFORE storing them,
     so the field must show what was actually resolved at — a field reading 5000
     beside a surface filtered at €2,000 is primitive 2 failing out loud. */
  function writeValue(input, next) {
    if (!input || input.value === next) { return; }
    var focused = (document.activeElement === input);
    var sel = null;
    if (focused) {
      try { sel = input.selectionStart; } catch (e) { sel = null; }   /* number inputs throw */
    }
    var prev = applying;
    applying = true;
    input.value = next;
    applying = prev;
    if (focused && sel !== null && sel !== undefined && input.setSelectionRange) {
      var at = Math.min(sel, next.length);
      try { input.setSelectionRange(at, at); } catch (e2) { /* unsupported on number inputs */ }
    }
  }

  /* ---- focus bookkeeping -------------------------------------------------- */
  /* Every control carries data-ib-focus, so a full re-render can put focus and
     caret back exactly where they were. */

  function captureFocus() {
    var a = document.activeElement;
    if (!a || !a.getAttribute) { return null; }
    var key = a.getAttribute('data-ib-focus');
    if (!key) { return null; }
    var sel = null;
    try { if (a.selectionStart !== null && a.selectionStart !== undefined) { sel = a.selectionStart; } }
    catch (e) { sel = null; }                        /* number inputs throw on selectionStart */
    return { key: key, sel: sel };
  }

  function restoreFocus(f) {
    if (!f) { return; }
    var n;
    try { n = document.querySelector('[data-ib-focus="' + f.key.replace(/"/g, '\\"') + '"]'); }
    catch (e) { n = null; }
    if (!n) { return; }
    try { n.focus(); } catch (e) { return; }
    if (f.sel !== null && f.sel !== undefined && n.setSelectionRange) {
      try { n.setSelectionRange(f.sel, f.sel); } catch (e) { /* unsupported on number inputs */ }
    }
  }

  /* ---- full render -------------------------------------------------------- */

  function renderObject(intent) {
    var host = byId('ib-object');
    if (!host || !intent) { return; }

    /* Tearing a focused, dirty input out of the DOM makes the browser fire
       `change` on it. That is our own paint, not the operator, so nothing
       fired between here and the end of this function may commit. */
    var wasApplying = applying;
    applying = true;
    try { paintObject(host, intent); }
    finally { applying = wasApplying; }
  }

  function paintObject(host, intent) {
    clear(host);
    view = { id: intent.id, key: shapeKey(intent), fields: {} };

    var panel = el('div', 'vk-panel ib-obj');

    /* head — the fixture it came from, stated plainly */
    var head = el('div', 'ib-obj-head');
    head.appendChild(el('p', 'vk-shead', 'Resolved intent'));
    head.appendChild(el('span', 'vk-pill vk-pill--spec', 'fixture · ' + (intent.id || 'unknown')));
    panel.appendChild(head);

    view.sentence = el('p', 'ib-obj-sentence', quote(intent.sentence || ''));
    panel.appendChild(view.sentence);

    /* goal */
    var goalBox = el('div', 'ib-f');
    goalBox.appendChild(el('span', 'k', 'Goal'));
    view.goal = el('p', 'ib-goal', intent.goal || '');
    goalBox.appendChild(view.goal);
    panel.appendChild(goalBox);

    /* constraints — the editable part */
    var cBlock = el('section', 'ib-block');
    cBlock.appendChild(el('h3', 'vk-shead', 'Constraints — change one and the surface re-resolves'));
    var grid = el('div', 'vk-grid');
    var cs = isArr(intent.constraints) ? intent.constraints : [];
    if (!cs.length) {
      grid.appendChild(el('p', 'vk-empty', 'This intent carries no constraints.'));
    } else {
      for (var i = 0; i < cs.length; i++) { grid.appendChild(constraintNode(intent, cs[i])); }
    }
    cBlock.appendChild(grid);
    panel.appendChild(cBlock);

    /* entities */
    var eBlock = el('section', 'ib-block');
    eBlock.appendChild(el('h3', 'vk-shead', 'Entities — the nouns this intent is about'));
    view.entities = el('div', 'ib-ents');
    fillEntities(intent);
    eBlock.appendChild(view.entities);
    panel.appendChild(eBlock);

    /* success condition */
    view.success = el('div', 'ib-succ');
    view.successDot = el('span', 'dot');
    var sBody = el('div', 'body');
    sBody.appendChild(el('p', 'vk-shead', 'Success condition'));
    view.successText = el('p', null, '');
    sBody.appendChild(view.successText);
    view.successPill = el('span', 'vk-pill', '');
    view.success.appendChild(view.successDot);
    view.success.appendChild(sBody);
    view.success.appendChild(view.successPill);
    fillSuccess(intent);
    panel.appendChild(view.success);

    host.appendChild(panel);
  }

  function constraintNode(intent, c) {
    var box = el('div', 'ib-f');
    var id = String(c.id);
    var rec = { id: id, type: c.type, lastCommitted: c.value === null || c.value === undefined ? '' : String(c.value) };
    var labelText = c.label || id;

    if (c.type === 'choice' && isArr(c.options) && c.options.length) {
      /* a chip-set: real buttons, one pressed */
      var lab = el('span', 'k', labelText);
      lab.id = 'ib-k-' + id;
      box.appendChild(lab);

      var group = el('div', 'vk-chips ib-opts');
      group.setAttribute('role', 'group');
      group.setAttribute('aria-labelledby', lab.id);
      rec.buttons = {};
      rec.optionsKey = optionsKey(c);
      rec.group = group;

      for (var i = 0; i < c.options.length; i++) {
        (function (opt) {
          var b = el('button', 'vk-chip', String(opt));
          b.type = 'button';
          b.setAttribute('aria-pressed', String(opt) === String(c.value) ? 'true' : 'false');
          b.setAttribute('data-ib-focus', id + '::' + String(opt));
          b.addEventListener('click', function () { commit(intent.id, id, opt, rec, b); });
          group.appendChild(b);
          rec.buttons[String(opt)] = b;
        })(c.options[i]);
      }
      box.appendChild(group);

    } else if (c.type === 'number') {
      var nlab = el('label', 'k', labelText);
      nlab.setAttribute('for', 'ib-c-' + id);
      box.appendChild(nlab);

      var wrap = el('div', 'ib-num' + (c.unit ? '' : ' is-bare'));
      var inp = document.createElement('input');
      inp.type = 'number';
      inp.id = 'ib-c-' + id;
      inp.value = c.value === null || c.value === undefined ? '' : String(c.value);
      inp.setAttribute('inputmode', 'decimal');
      inp.setAttribute('data-ib-focus', id);
      inp.addEventListener('change', function () { commit(intent.id, id, inp.value, rec, inp); });
      inp.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.keyCode === 13) { ev.preventDefault(); commit(intent.id, id, inp.value, rec, inp); }
      });
      wrap.appendChild(inp);
      if (c.unit) { wrap.appendChild(el('span', 'u', String(c.unit))); }
      box.appendChild(wrap);
      rec.input = inp;

    } else {
      /* anything else the fixtures introduce: a plain text control, still live */
      var tlab = el('label', 'k', labelText);
      tlab.setAttribute('for', 'ib-c-' + id);
      box.appendChild(tlab);

      var twrap = el('div', 'ib-num is-bare');
      var tin = document.createElement('input');
      tin.type = 'text';
      tin.id = 'ib-c-' + id;
      tin.value = c.value === null || c.value === undefined ? '' : String(c.value);
      tin.setAttribute('autocomplete', 'off');
      tin.setAttribute('data-ib-focus', id);
      tin.addEventListener('change', function () { commit(intent.id, id, tin.value, rec, tin); });
      tin.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.keyCode === 13) { ev.preventDefault(); commit(intent.id, id, tin.value, rec, tin); }
      });
      twrap.appendChild(tin);
      if (c.unit) { twrap.className = 'ib-num'; twrap.appendChild(el('span', 'u', String(c.unit))); }
      box.appendChild(twrap);
      rec.input = tin;
    }

    view.fields[id] = rec;
    return box;
  }

  function fillEntities(intent) {
    if (!view || !view.entities) { return; }
    clear(view.entities);
    var es = isArr(intent.entities) ? intent.entities : [];
    if (!es.length) {
      view.entities.appendChild(el('p', 'vk-empty', 'No entities are attached to this intent.'));
      return;
    }
    for (var i = 0; i < es.length; i++) {
      var chip = el('span', 'ib-ent');
      chip.appendChild(document.createTextNode(String(es[i].label || es[i].id || '')));
      if (es[i].kind) { chip.appendChild(el('i', null, String(es[i].kind))); }
      view.entities.appendChild(chip);
    }
  }

  function fillSuccess(intent) {
    if (!view || !view.success) { return; }
    var s = intent.success || {};
    var met = !!s.met;
    view.success.className = 'ib-succ ' + (met ? 'is-met' : 'is-unmet');
    view.successText.textContent = s.label || 'No success condition is defined for this intent.';
    view.successPill.className = 'vk-pill ib-pill';
    view.successPill.textContent = met ? 'Met' : 'Not met';
  }

  /* ---- patch after an edit ------------------------------------------------- */
  /* Never rebuild the container out from under the control being used: values
     and pressed-states are written in place, and the focused control is left
     strictly alone. */

  function patchObject(intent) {
    if (!intent) { return; }
    if (!view || view.id !== intent.id || view.key !== shapeKey(intent)) {
      var f = captureFocus();
      renderObject(intent);
      restoreFocus(f);
      return;
    }

    if (view.sentence) { view.sentence.textContent = quote(intent.sentence || ''); }
    if (view.goal) { view.goal.textContent = intent.goal || ''; }
    fillEntities(intent);
    fillSuccess(intent);

    var cs = isArr(intent.constraints) ? intent.constraints : [];
    for (var i = 0; i < cs.length; i++) {
      var c = cs[i];
      var rec = view.fields[String(c.id)];
      if (!rec) { continue; }

      var resolved = c.value === null || c.value === undefined ? '' : String(c.value);

      if (rec.buttons) {
        if (optionsKey(c) !== rec.optionsKey) {
          rebuildChoice(intent, c, rec);
        } else {
          for (var v in rec.buttons) {
            if (Object.prototype.hasOwnProperty.call(rec.buttons, v)) {
              rec.buttons[v].setAttribute('aria-pressed', v === resolved ? 'true' : 'false');
            }
          }
        }
      } else if (rec.input) {
        /* Always write back, focused or not. The resolver clamps before it
           stores, so suppressing this while the operator is still in the field
           would leave the surface disagreeing with the object it resolved. */
        writeValue(rec.input, resolved);
      }

      rec.lastCommitted = resolved;   /* the value now on screen; a repeat of it is a no-op */
    }
  }

  /* The option list itself changed — rebuild just that chip-set and put focus
     back inside it. */
  function rebuildChoice(intent, c, rec) {
    var f = captureFocus();
    var group = rec.group;
    if (!group) { return; }
    clear(group);
    rec.buttons = {};
    rec.optionsKey = optionsKey(c);
    var opts = isArr(c.options) ? c.options : [];
    var id = String(c.id);
    for (var i = 0; i < opts.length; i++) {
      (function (opt) {
        var b = el('button', 'vk-chip', String(opt));
        b.type = 'button';
        b.setAttribute('aria-pressed', String(opt) === String(c.value) ? 'true' : 'false');
        b.setAttribute('data-ib-focus', id + '::' + String(opt));
        b.addEventListener('click', function () { commit(intent.id, id, opt, rec, b); });
        group.appendChild(b);
        rec.buttons[String(opt)] = b;
      })(opts[i]);
    }
    if (f && f.key.indexOf(id + '::') === 0) {
      restoreFocus(f);
      if (document.activeElement === document.body && group.firstChild) {
        try { group.firstChild.focus(); } catch (e) { /* nothing to do */ }
      }
    }
  }

  /* ============================================================== boot */

  var booted = false;

  function mountModule(hostId, mod) {
    var host = byId(hostId);
    if (!host) { return; }
    if (!mod || typeof mod.mount !== 'function') {
      if (!host.firstChild) {
        host.appendChild(el('p', 'vk-empty', 'This surface did not load in this copy of the page.'));
      }
      return;
    }
    /* A module fault must not take the page down or fill the console. */
    try { mod.mount(host); } catch (e) { /* the panel simply stays as it is */ }
  }

  IB.boot = function () {
    if (booted) { return; }
    booted = true;

    watchSticky();      /* publish --ib-sticky before anything can be focused or revealed */
    wireTheme();

    /* the bar's own furniture */
    renderSeeds();

    /* repaint the object whenever the resolver says so */
    if (IB.bus && typeof IB.bus.on === 'function') {
      IB.bus.on('intent:resolved', function (intent) { renderObject(intent); });
      IB.bus.on('intent:edited', function (intent) { patchObject(intent); });
    }

    /* the other two surfaces */
    mountModule('ib-workspace', IB.workspace);
    mountModule('ib-standing', IB.standing);

    wireForm();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', IB.boot);
  } else {
    IB.boot();
  }

})();
