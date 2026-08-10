# Phase 3 — building the wizard

The wizard is the deliverable. The transcript and summary are its raw material.

## What a VOM implementation wizard is

A single self-contained HTML file that walks the operator from "I watched a thing" to "here is my
filled-in plan, downloaded as markdown". It is **not** a summary with input boxes.

Three things make it earn its place:

1. **Every step is a decision, not a chapter.** If the reader can pass a step without choosing
   anything, cut the step. Ten to twelve steps for a 60–90 minute source; six to eight for a short
   one. One step per decision the source actually forces.
2. **At least two live calculators.** Arithmetic the reader would otherwise skip: unit economics,
   a price ladder keyed to an earlier answer, an hours × rate waste table. The calculator's *note*
   is the point — it must say something different when the number is bad ("under 2× on the front
   end — fix the funnel before you scale the spend") than when it is good.
3. **A markdown export that is a real plan.** Everything typed, in order, with the calculator
   results folded in and a "where to start" that branches on the reader's own answers.

Disqualifying: fields with no consequence, generic advice that could precede any video, a step that
just repeats the summary, benchmarks presented as promises, an export that is a bullet dump.

## Start from the skeleton

```bash
cp assets/wizard-skeleton.html "/Users/kurtjoseph/Business Ideas/<Folder>/wizard.html"
```

Replace the tokens, then author the four ▼ AUTHOR blocks. The engine below them (state, routing,
progress, rows, export, theme, download-in-iframe fallback) is already correct — do not rewrite it.

| token | example |
|---|---|
| `{{NAME}}` | `The Audit Machine` |
| `{{KEY}}` | `audit-machine.v1` — bump `.vN` on any breaking change to field keys |
| `{{SLUG}}` | `audit-machine` |
| `{{PLAN_PLACEHOLDER}}` | `Name this plan (e.g. Fencing contractors, NL)` |
| `{{SOURCE_URL}}` `{{SOURCE_TITLE}}` `{{SOURCE_AUTHOR}}` | from the transcript header |
| `{{FOOT_CAVEAT}}` / `{{FOOT_CAVEAT_PLAIN}}` | the benchmark caveat, HTML and plain-text versions |

### 1 · STEPS

Field types are documented in the skeleton's header comment. The shape of a good step:

```js
{k:"offer", nav:"Offer", title:"The offer", hint:"The one decision that prices everything",
 lede:"One or two sentences that <strong>commit</strong> — not a recap of the video.",
 fields:[
  {t:"note", title:"His rule", body:"…", tone:"quote"},
  {t:"choice", k:"stage", label:"Where your proof is today", help:"This sets the price ladder below.",
   opts:[{v:"cold", h:"No case studies", d:"You are buying proof, not making money."}, …]},
  {t:"num", k:"price", label:"Your price", pre:"€"},
  {t:"calc", id:"ladder"},
 ]}
```

- `k` on the step, `k` on each field — both are stable localStorage keys. Choose them once.
- `help` is where the source's reasoning goes, in one or two sentences, with `<b>` on the operative
  clause. This is the wizard's teaching surface.
- `note` tones: `""` neutral · `warn` the trap · `ok` the confirmation · `quote` the speaker's line.
- The **last step must be** `{k:"plan", …, fields:[{t:"export"}]}`. Progress counts every step but
  the last.

### 2 · CALCS and ROW_TOTALS

Keyed by the `id` in `{t:"calc", id:"…"}`. Helpers in scope: `val` `num` `money` `esc` `rowsOf`
`ci`. Structure: `.calc > .calc-h` (title + `<em>` aside) `> .calc-in?` (inputs via `ci()`)
`> .calc-out` (`.kpi` tiles) `> .calc-note`.

A calculator that only restates its inputs is decoration. Make it cross-reference: check the price
against the floor for the reader's proof stage, check the waste total against the guarantee they
set two steps earlier, check CAC against the price. Those cross-checks are what the reader cannot
do in their head while watching.

`ROW_TOTALS[rowKey](rows)` returns the footer total HTML for a `{t:"rows"}` table, or `null`.

### 3 · CALC_MD

Keyed by step key; returns extra markdown lines so calculator output survives into the export. If a
number was worth computing on screen, it is worth carrying into the plan.

### 4 · renderSide()

The sticky right column mirrors the decisions made so far — `card()`, `kv()`, `seqList()`,
`progressCard()`. It is a mirror, not a menu: only what changes as they type. A build-order
`seqList()` whose items tick themselves off is the highest-value card.

## Look

The skeleton carries the house design system: paper/ink tokens, mono labels, serif ledes, light and
dark via `prefers-color-scheme` plus a `data-theme` override that must win in both directions.

**Type is sized in `rem`, never px.** One knob — `html{font-size:17px}` — sets the whole page, and the
bar's A / A+ / A++ button raises it to 19 or 21 and remembers the choice per wizard. Never reintroduce
a px font-size: it breaks that control silently for the one reader who needs it. The operator asked for
this on 2026-08-06; the default is deliberately larger than a typical web page.

Per wizard, change **only the accent** — `--plate`/`--plate-w` point at one of the named colours
(`--ember` `--steel` `--moss` `--plum` `--slate` `--gold`). Pick one that fits the subject and keep
it for the whole file. If the subject wants a different paper, shift `--paper`/`--sheet*` together
in both the light and dark blocks — and pass the same two hexes to `deploy-wizard.sh` so the
browser chrome matches.

Voice: second person, present tense, specific. The wizard talks like the operator's sharpest
colleague — it tells them where the source is wrong, where the numbers are one person's numbers,
and what to do on Monday.

## Verification

Preferred — Browser pane, `file:///…/wizard.html`:

- walk every step via the rail; each renders, no layout overflow
- fill one field of each type used; progress % and the side column both move
- drive every calculator with real numbers; check the note changes when the number goes bad
- add and delete a row; the total updates without losing focus
- open the export step: the markdown contains the calculator output, the download button fires
- toggle the theme both ways; `read_console_messages {onlyErrors:true}` is empty
- reload: state comes back from localStorage

Fallback — jsdom, when the Browser pane is unresponsive (`npm install jsdom` in the scratchpad,
substitute the `{{…}}` tokens into a temp copy first, wrap it in `<!doctype html>` since jsdom
wants a document):

```js
import { JSDOM } from "./node_modules/jsdom/lib/api.js";
const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://x.test/" });
const d = dom.window.document;
const fire  = (el, t) => el.dispatchEvent(new dom.window.Event(t, {bubbles:true}));
const click = el => el.dispatchEvent(new dom.window.MouseEvent("click", {bubbles:true}));
// then: set values + fire "input", click [data-go]/[data-pick]/[data-toggle]/[data-rowadd],
// read d.getElementById("out").value, and assert no window "error" events fired.
```

jsdom proves the logic, not the layout. Say which one you used in the report.
