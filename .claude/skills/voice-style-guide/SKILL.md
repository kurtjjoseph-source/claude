---
name: voice-style-guide
description: Create a reusable markdown style guide of the user's authentic writing voice from their real writing samples, so AI-drafted content sounds like them and never like AI slop. Use whenever the user wants writing "in my voice", complains that drafts sound like AI, asks for a writing persona or style guide, or uploads emails/posts/newsletters as voice examples. Also trigger when drafting client-facing content for a user whose voice guide already exists in the conversation or project.
---

# Voice Style Guide Creator

Turn 20–50 real writing samples into a portable markdown voice profile the user can paste into any AI project, custom instructions, or agent.

## Step 1 — Collect samples
Ask for **20–50 samples** of the user's real writing: emails, posts, newsletters, sermons, proposals. Fewer than 10? Proceed, but flag that the guide will be less reliable and can be refined later. Note the languages present — if the user writes in both Dutch and English, build the guide bilingually with per-language notes.

## Step 2 — Interview
Role: *an expert prompt engineer and communications expert whose superpower is creating writing personas.*
Ask **one question at a time, up to 5 questions**, e.g.: who they usually write to and the relationship they want with readers; how formal they are and when that shifts; phrases or habits they consider "very them"; what they never want to sound like; pet peeves in AI writing.

## Step 3 — Produce the voice file (markdown)
Analyze the samples and the interview. Output a single markdown file named `voice-<username>.md` with:
1. **Voice summary** — 3 sentences capturing the essence
2. **Tone & register** — formality range, warmth, humor, directness
3. **Rhythm & structure** — sentence length patterns, paragraphing, openings and sign-offs actually used
4. **Vocabulary** — signature words/phrases to use; words they'd never use
5. **Per-audience shifts** — e.g. clients vs. church community vs. peers
6. **Never-do list** — AI tells to ban. Always include at minimum: no em-dashes; no "it's not X, it's Y" constructions; no "in the era of…" openers; no fluff or filler words that carry no message. Add the user's own pet peeves.
7. **Calibration examples** — 2 short before/after pairs: a generic AI sentence rewritten in the user's voice

## Step 4 — Test and iterate
Immediately draft one short sample (an email or post on a topic the user names) *using the guide*. Ask: what do you like, what don't you like, top changes? Fold the feedback back into the voice file. Deliver the final file for download and suggest pasting it into their AI project instructions or custom instructions.
