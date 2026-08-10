---
name: wizard
description: Turn a video, podcast or long talk into a VOM playbook folder — transcript.md, summary.md and a single-file interactive implementation wizard deployed live to a vom-*.vercel.app address. Use whenever the operator says "transcribe and make an online implementation wizard", "transcribe, summarize and create an implementation wizard", "turn this video into a wizard", "make a wizard from this talk/podcast/playbook", or pastes a YouTube URL with any of those words — even if only some of the three verbs are named.
---

# Video → summary → live implementation wizard

The standing VOM pipeline: a source video becomes a folder in `/Users/kurtjoseph/Business Ideas/`
holding `transcript.md`, `summary.md` and `wizard.html`, with the wizard published to
`https://vom-<slug>.vercel.app`. Nothing is reported done until that URL returns HTTP 200.

Run all five phases unless the operator explicitly scopes it down. Work solo — no subagents.

## The five phases

| | phase | leaves behind |
|---|---|---|
| 1 | Transcribe | `transcript.md` — cleaned, sectioned, timestamped |
| 2 | Summarize | `summary.md` — the argument, not a recap |
| 3 | Build | `wizard.html` — decisions + live calculators + markdown export |
| 4 | Verify | a wizard driven end to end in a real browser |
| 5 | Deploy | a live `vom-<slug>.vercel.app` link, verified 200 |

## 0 · Set up

Derive from the source: a **folder name** `Topic (Author)` (e.g. `One-Person AI Business (Bo Sar)`,
`Six Skills (Greg Isenberg)`), a **product name** for the wizard (`The Audit Machine`, not
"Video Wizard"), and a **slug** (`audit-machine`) used for the deploy directory and the alias.

```bash
mkdir -p "/Users/kurtjoseph/Business Ideas/<Folder Name>"
```

Check for an existing folder first — a re-run updates in place, it does not fork.

## 1 · Transcribe

```bash
python3 "/Users/kurtjoseph/Business Ideas/.claude/skills/wizard/assets/fetch-transcript.py" "<url>" raw.txt
```

Run it in the scratchpad (`pip3 install --quiet youtube-transcript-api` first if the import fails).
Then **read `raw.txt` in full** — every paragraph, not a sample. The wizard's quality is entirely
a function of having actually read the source. Write `transcript.md` per
[references/transcript-and-summary.md](references/transcript-and-summary.md), which also covers the
fallbacks when captions are unavailable.

## 2 · Summarize

`summary.md` reconstructs the argument in the operator's own reading order — the one-sentence
version, the mechanism, the numbers, what to ignore. Format and the honesty rules (benchmarks are
one person's numbers; say so) are in
[references/transcript-and-summary.md](references/transcript-and-summary.md).

## 3 · Build the wizard

Copy the skeleton and fill the four ▼ AUTHOR blocks — the engine underneath needs no edits:

```bash
cp "/Users/kurtjoseph/Business Ideas/.claude/skills/wizard/assets/wizard-skeleton.html" "/Users/kurtjoseph/Business Ideas/<Folder Name>/wizard.html"
```

Replace the `{{…}}` tokens, then author `STEPS`, `CALCS`, `CALC_MD` and `renderSide()`.
The build contract — what makes a step earn its place, how many steps, the calculator rule, the
accent palette, and what disqualifies a wizard — is in
[references/wizard-build.md](references/wizard-build.md). Read it before writing the first step.

The file is an **artifact fragment**: it starts at `<title>`, with no `<!doctype>`, `<head>` or
`<body>` — the deploy script supplies the shell. Keep it that way.

## 4 · Verify in a real browser

Never ship an unopened wizard. Load `file:///…/wizard.html` in the Browser pane and drive it:
every step, one field of each type, every calculator with real numbers, the export, the theme
toggle. `read_console_messages {onlyErrors:true}` must come back empty.

If the Browser pane is unavailable, fall back to the jsdom harness described in
[references/wizard-build.md](references/wizard-build.md#verification) — but say in the report which
one you used.

## 5 · Deploy and report

```bash
cd "/Users/kurtjoseph/Business Ideas/vom-systems" && ./deploy-wizard.sh "../<Folder Name>/wizard.html" <slug> vom-<slug>.vercel.app "<light-hex>" "<dark-hex>" "<one-line description>"
```

The script wraps the fragment, deploys, disables SSO protection and aliases. It prints
`✓ <slug> -> https://vom-<slug>.vercel.app (HTTP 200)`. Anything other than 200 is a failed run —
see [references/deploy.md](references/deploy.md) for the recovery steps and the memory update that
closes out the pipeline.

Report with **live links**: the wizard URL first, then the three files as clickable relative paths.
Deliverables say Vision Outreach Media (VOM) or "the operator", never a personal name.
