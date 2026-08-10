# BRIEF — Intent-based browsing prototype (VOM)

This file is the specification. It is SETTLED. No builder or critic may propose a different
model of intent-based browsing. If something here is ambiguous, choose the reading that best
serves the six primitives below.

---

## THE SETTLED CONCEPT — intent-based browsing, in six primitives

1. **The intent bar replaces the address bar.** You state an outcome, not a destination.
2. **Intent is an object, not a string.** The bar resolves the sentence into a typed, visible,
   editable structure: goal · constraints · entities · success condition. The user can edit any
   field and the surface re-resolves. This is the load-bearing idea — show the object.
3. **The result is a workspace, not a tab.** One composed surface, panes drawn from several
   sources, instead of fourteen tabs. Each pane is swappable and attributed.
4. **Every claim carries provenance.** Nothing renders on the surface without a traceable source
   chip. No unattributed synthesis.
5. **Intents can stand.** An intent left running re-resolves and reports change. Browsing becomes
   stateful; history is a list of intents, not URLs.
6. **Acting is gated.** The surface can prepare the next action but never executes a purchase,
   send, or account change — it stages it and asks. Show the gate.

---

## HARD CONSTRAINTS

- The six primitives are the spec. Do not add a seventh or drop one.
- Output is ONE self-contained HTML file (`wizard.html`). No CDN, no external fonts, no network
  requests of any kind. Must run correctly opened from a `file://` path.
- Palette, type, spacing come from `src/vom-kit-v2.css` (VOM Kit v2) only. **No new colours, no
  new type sizes, no new spacing values.** Use the tokens: `--bg --surface --surface-2 --line
  --line-soft --ink --ink-soft --ink-faint --c --c-bright --c-ink --c-wash --c-line --good --warn
  --bad --info --brand-navy --radius --radius-sm --radius-pill --s1..--s8 --serif --sans --mono
  --display --wrap`. If you need a colour that is not a token, you are doing it wrong.
- The accent slot: this page runs `data-brand="vom"` (`--c:#e8843c`). Never hardcode that hex —
  read `var(--c)`.
- Light AND dark must both work. The kit handles it via `prefers-color-scheme` plus
  `[data-theme]`. Do not defeat it with hardcoded colours.
- The real VOM mark only — the data URI in `src/logo.datauri.txt`. Never generate, redraw or
  approximate a logo. Use the `.vom-bar` component from the kit.
- **No live model calls and no fake ones.** All resolution is deterministic lookup against
  `src/fixtures.js`. The surface must state on-screen that it is a scripted demonstration.
  Nothing may imply live retrieval, live pricing, or real-time reasoning.
- Attribution is to **Vision Outreach Media (VOM)** or "the operator". Never a personal name.
- Accessibility: primary control keyboard-reachable within 2 tabs; visible focus rings; every
  interactive element is a real `<button>`/`<input>` or has a role + key handler; no keyboard trap.
- Layout must hold at **360px** wide with no horizontal page scroll. Wide content scrolls in its
  own container.
- Console must be silent on load and during normal interaction.

---

## FILE OWNERSHIP — do not edit a file you do not own

| piece | owns |
|---|---|
| 1 · thesis | `analysis.md` |
| 2 · shell + bar | `src/shell.html`, `src/intent-bar.js` |
| 3 · intent object | `src/resolve.js`, `src/fixtures.js` |
| 4 · workspace | `src/workspace.js` |
| 5 · standing + gate | `src/standing.js` |
| 6 · brand + build | `src/app.css`, `build.py` |

Read-only for everyone: `BRIEF.md`, `src/vom-kit-v2.css`, `src/logo.datauri.txt`.

---

## MODULE CONTRACT — binding, so the pieces interoperate

Everything hangs off one global, `window.IB`. Each file attaches its own key and reads others
only through this contract. No file may assume load order beyond: fixtures → resolve → workspace →
standing → intent-bar. `build.py` concatenates in that order.

### Shared bus (defined in `src/fixtures.js`, first file loaded)

```js
IB.bus = { on(evt, fn), emit(evt, payload) }   // trivial pub/sub, synchronous
```

Events, and who emits them:
- `intent:resolved`  — emitted by `IB.resolve()`. payload: the IntentObject.
- `intent:edited`    — emitted by `IB.editField()`. payload: the re-resolved IntentObject.
- `intent:standing`  — emitted by standing.js when an intent is put on watch. payload: IntentObject.
- `intent:change`    — emitted by standing.js when a standing intent reports a change.
                        payload: `{ intentId, note, at, paneId }`
- `action:staged`    — emitted by workspace.js when a staged action is requested.
                        payload: `{ intentId, label, detail, consequence }`

### The IntentObject — the shape everything renders

```js
{
  id:        "flights-lisbon",         // fixture key
  sentence:  "find a flight to Lisbon in March under €200",
  goal:      "Book one return flight, Amsterdam → Lisbon",
  constraints: [                        // primitive 2 — every one editable
    { id:"budget",  label:"Budget",   value:"200",   unit:"EUR",  type:"number", options:null },
    { id:"month",   label:"When",     value:"March", unit:null,   type:"choice", options:["February","March","April"] },
    { id:"stops",   label:"Stops",    value:"Direct",unit:null,   type:"choice", options:["Direct","≤1 stop","Any"] }
  ],
  entities: [                           // the nouns the intent is about
    { id:"ams", label:"Amsterdam", kind:"origin" },
    { id:"lis", label:"Lisbon",    kind:"destination" }
  ],
  success:  { label:"A bookable fare under €200 exists on a chosen date", met:true },
  panes:    ["fares","calendar","baggage","risk"],   // pane ids, in render order
  staged:   { label:"Hold this fare for 24 hours", detail:"…", consequence:"No payment is taken." }
}
```

`resolve.js` must expose:

```js
IB.resolve(sentenceOrId)            -> IntentObject   (deterministic; emits intent:resolved)
IB.editField(intentId, fieldId, newValue) -> IntentObject  (emits intent:edited)
IB.current()                        -> IntentObject | null
IB.seeds                            -> [{id, sentence}]   // the 3 seeded intents, for the bar
```

Editing a constraint MUST visibly change the resolved output — different panes, different rows,
or a flipped `success.met`. An edit that changes nothing on screen fails primitive 2.

### Panes — what workspace.js renders

`IB.fixtures.panes` is keyed by pane id:

```js
{
  fares: {
    id:"fares", title:"Fares matching the constraints", kind:"table",
    source:{ name:"Skyscanner-style aggregator", detail:"Sampled fare table", when:"scripted" },
    alternates:["fares-alt"],           // pane ids this pane may be swapped for (primitive 3)
    claims:[                            // every row carries its own source id (primitive 4)
      { cells:["KL1693","07:05","€184","Direct"], sourceId:"agg" }
    ]
  }
}
```

`IB.fixtures.sources` is keyed by source id: `{ id, name, kind, note }`. Every claim's `sourceId`
must exist there. **A pane or row rendered without a resolvable source is a bug** (primitive 4).

`workspace.js` must expose:

```js
IB.workspace = {
  mount(el),                    // called once
  render(intentObject),         // full re-render; must be idempotent
  swap(paneId, altPaneId),      // primitive 3
  dismiss(paneId)               // primitive 3
}
```

`standing.js` must expose:

```js
IB.standing = {
  mount(el),
  watch(intentObject),          // put on watch; emits intent:standing
  unwatch(intentId),
  list(),                       // standing intents
  trail()                       // history: intents, NOT urls
}
```

`intent-bar.js` owns the bar, the seeds, and the boot sequence (`IB.boot()` on DOMContentLoaded).

### The three seeded intents — use exactly these ids

- `flights-lisbon` — "find a flight to Lisbon in March under €200"
- `crm-compare` — "compare three CRMs under €50 a seat for a 4-person team"
- `roof-repair` — "find a roofer in Amersfoort who can quote this month"

`roof-repair` is the one that must demonstrate the **action gate** (primitive 6) most clearly:
staging a request-for-quote message that is never sent.

---

## REFERENCE — execution quality

`../Gauntlet Loop (RoboNuggets)/wizard.html` is the bar for what a shipped VOM single-file page
looks like: density, restraint, how a control actually looks. Match its level of finish. Do not
copy its content or its layout.

## THE DEMO HONESTY RULE

This is a prototype of an interaction model, not a working browser. Somewhere persistently
visible the page must say so, in the operator's voice, without undercutting the demo. Do not
write copy that implies the page is searching the live web.
