---
name: improve-system
description: Capture a correction, refinement, or confirmed-good approach from the current conversation and write it back into the right knowledge/ file in the ai-strategy internal-os project, so the same mistake doesn't recur or the same good pattern repeats automatically. Use when Kurt says "/improve-system", "remember that for next time", "update the system with this", or after he's corrected an output (e.g. "rewrite shorter" leading to a final draft he likes) and wants that lesson to stick project-wide, not just in this session.
---

# Improve System

This is the feedback loop for the ai-strategy internal-os project specifically — it makes `knowledge/` files better over time instead of relearning the same lesson every session. It is scoped to this project's own knowledge base (board profiles, niche-command-center specs, public-site copy/goals), not Claude Code's global cross-project memory — don't write global user/feedback memories from here.

## Steps

1. **Find the lesson.** Look back over the current conversation for the concrete before/after: what was produced first, what Kurt corrected or confirmed, and what the final accepted version looked like. The lesson is the *generalizable rule*, not the specific fix (e.g. "keep emails under 100 words and lead with the ask" — not "shortened the Tuesday email").
2. **Find the right file.** Decide which `knowledge/` file this belongs in:
   - Something about Kurt himself (goals, priorities, working style) → `knowledge/me/career-coach.md`.
   - A decision-making pattern or mental model → `knowledge/frameworks/`.
   - Something about who Kurt serves (VOM clients, church congregation, Engage AI users) → `knowledge/audience/`.
   - A correction to a specific board member's stance → the relevant `knowledge/wiki/[person-slug].md` (rare — only if Kurt is correcting a misread of that person's actual view).
   - A correction to the niche command center or public site → `projects/niche-command-center/` or `projects/public-site/` directly, not `knowledge/`.
   - If none of these fit cleanly, ask Kurt rather than guessing at a new file location.
3. **Write it, don't just append.** Edit the target file so the rule is stated once, clearly, near related content — don't bolt a running log of every correction onto the bottom of the file. If a new rule contradicts an old one, replace the old one rather than leaving both.
4. **Confirm briefly.** Tell Kurt in one sentence what changed and where, so he can correct you if you filed it wrong.

## Notes

- Small, frequent updates beat big rewrites. This skill should run in seconds, not turn into a document review.
- If Kurt runs this and nothing in the recent conversation actually generalizes (it was a one-off, not a pattern), say so instead of inventing a rule to file away.
