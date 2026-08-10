# Phase 1 & 2 — transcript.md and summary.md

## Getting the raw text

`assets/fetch-transcript.py` pulls YouTube's caption track and writes `raw.txt` as `[MM:SS]`
paragraphs (~45s each) plus `raw.txt.json` with the raw segments. Run it in the scratchpad.

```bash
pip3 install --quiet youtube-transcript-api
python3 .../assets/fetch-transcript.py "https://www.youtube.com/watch?v=XXXX" raw.txt
```

**Fallbacks, in order, when that fails:**

1. `WebFetch` the watch URL for title, channel, publish date, duration and description — always do
   this anyway, the metadata belongs in the transcript header and the wizard footer.
2. `yt-dlp --write-auto-sub --skip-download --sub-format vtt` if it is installed.
3. Captions genuinely disabled → say so and ask before proceeding. A wizard built from a
   description and a guess is worse than no wizard.

Then **read every paragraph of `raw.txt`.** A 70-minute video is ~130 paragraphs — three or four
Read calls. Do not skim and do not summarise from the description; the numbers, the tool names and
the throwaway operational details are the entire value, and they are never in the description.

## transcript.md

Not a verbatim dump — a cleaned working record. Filler removed, argument preserved in the speaker's
first person, organised by section.

```markdown
# <Video title> — working transcript

**Channel:** <name> — <channel URL>
**Video:** <watch URL>
**Length:** 72:45 · solo episode, screen-share demos throughout

> **Note on this file.** This is a cleaned, condensed working record built from the auto-generated
> captions — filler removed, argument preserved in the speaker's first person, organised by
> section. It keeps every substantive claim, number, tool name and prescribed move, which is what
> the wizard is built from. It is not a word-for-word reproduction; watch the video at the link
> above for that.

**Sections**

| | |
|---|---|
| 00:00 | Why the standard playbook stopped working |
| 01:31 | The commodity trap and the trust gap |
| …

## [07:41] The map: traffic, system, skill

<the speaker's argument, first person, tightened>
```

Rules:

- **Keep every number, price, benchmark, tool name and named step.** Those become wizard fields.
- Keep the timestamps on section headings — they make the file navigable and let the summary cite.
- Never reproduce long verbatim stretches. Condense in the speaker's voice; that is what makes this
  a working record rather than a copy of someone's video.
- One or two direct quotes are fine where the exact wording is the point (a script line, a phrase
  to say on a call). Put them in blockquotes.

## summary.md

The operator reads this instead of re-watching. It reconstructs the argument, it does not recap the
video's running order.

```markdown
# <Topic> — playbook summary

**Source:** [<title>](<url>) — <author>, <duration>
**Working transcript:** [transcript.md](transcript.md)
**Implementation wizard:** [wizard.html](wizard.html)

---

## The one-sentence version
## The problem it solves
## The map                       ← the mental model, usually a small table
## 1 · <first pillar>            ← one section per pillar of the argument
## 2 · <second pillar>
## What to ignore                ← the parts that do not survive contact with VOM's situation
## What this means for VOM       ← the operator's angle: which existing product, which niche
```

Rules:

- **Lead with the mechanism, not the topic.** "Sell a paid AI process audit to one named niche and
  deliver it with plugins that hold your process in files instead of employees" — that sentence is
  the whole job of the summary.
- **Numbers stay attached to their conditions.** "~$85 per qualified booked call" is one agency's
  number in one market behind a two-year content library. Say that. The summary and the wizard both
  carry that caveat; it is the difference between a playbook and a promise.
- Bold the moves that are actually prescriptive. The operator scans.
- Link the wizard at the top. Every deliverable carries a live link.
- End with the VOM angle — which existing product this feeds, which niche it applies to. That is
  what turns a summary into a decision.
