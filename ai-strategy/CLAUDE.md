# AI Strategy — Internal Operating System

This directory is Kurt's personal "internal operating system," built following the 4-project framework from ["Stop Watching Tutorials — Build These 4 Claude Projects to 10x Output"](https://www.youtube.com/watch?v=IiZ5HRaeX4s). It's a bunch of files that help Claude go from a good output to a hyper-specific great output, across every session, without re-explaining context each time.

This is a project-local knowledge base, distinct from the global cross-project memory system documented in `~/.claude/projects/.../memory/MEMORY.md`. That system tracks who Kurt is across *all* work. This system tracks the specific outputs of the four projects below: an advisory board, a niche tool, a public profile, and the knowledge/skills that support them.

## Folder structure

- **`knowledge/`** — everything Claude should know before acting.
  - `me/` — Kurt's own goals, role, strengths, blockers (Project 1, step 1 output — the "interview me" career-coach file).
  - `frameworks/` — mental models, decision frameworks, or methodologies Kurt trusts and wants applied when reasoning through problems.
  - `audience/` — who Kurt serves (Vision Outreach Media clients, Church of God Amersfoort congregation, Engage AI users) and what they care about.
  - `raw/` — raw ingested source material per board member, one subfolder per person: `raw/[person-slug]/`. Never summarized, just the original transcripts/articles/posts.
  - `wiki/` — synthesized per-person profiles distilled from `raw/`: `wiki/[person-slug].md`, covering their core ideas, vocabulary, stances, and recurring stories. This is what `ask-the-board` actually reads.
- **`skills/`** — repeatable processes, implemented as real Claude Code skills under `.claude/skills/` (that's the required location for the harness to auto-discover them — no separate `skills/` folder needed to avoid duplicating the same thing in two places).
  - `ask-the-board` — loops through every person in `knowledge/wiki/` and answers a question as if each one weighed in, then synthesizes a combined recommendation.
  - `improve-system` — captures a correction/refinement from the current conversation and writes it back into the relevant `knowledge/` file, so the same mistake doesn't recur next time.
  - `ingest-resource` — takes a link, transcript, or pasted text, saves the raw material under `knowledge/raw/[slug]/`, and regenerates the synthesis wiki at `knowledge/wiki/[slug].md`.
- **`projects/`** — what's actively being built.
  - `niche-command-center/` — Project 2: a tool solving a real problem Kurt has today.
  - `public-site/` — Project 3: Kurt's AI-optimized personal website.

## How to use this when starting a session here

1. Read `knowledge/me/career-coach.md` first if it exists — it's the standing context on Kurt's goals, role, and priorities.
2. For any decision-support question, prefer running the `ask-the-board` skill over answering from scratch, if `knowledge/wiki/` has relevant people in it.
3. When Kurt corrects an approach or confirms one works well, use `improve-system` to persist that back into the right `knowledge/` file rather than letting it evaporate at the end of the session.
4. New source material (articles, transcripts, videos) goes through `ingest-resource`, not ad hoc reading — that's what keeps `knowledge/raw/` and `knowledge/wiki/` in sync.
