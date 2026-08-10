---
name: ask-the-board
description: Answer a question by consulting Kurt's personal board of advisors — a set of cloned expert perspectives built from real public content and stored as synthesis profiles in knowledge/wiki/. Use whenever Kurt asks "/ask-the-board", "ask the board", "what would my advisors say", "what would [board member name] say", or wants a decision run past multiple expert viewpoints instead of a single generic answer. Only applies within the ai-strategy internal-os project (where knowledge/wiki/ exists).
---

# Ask the Board

Give Kurt a decision-quality answer by reasoning through his actual question from the perspective of each person on his board, then synthesizing a single recommendation — not four separate essays.

## Steps

1. **Load context.** Read `knowledge/me/career-coach.md` if it exists, so the board's advice is grounded in Kurt's actual goals, constraints, and current priorities rather than generic advice.
2. **Load the board.** List every file in `knowledge/wiki/*.md`. Each one is a synthesized profile of a board member: their core ideas, vocabulary, stances, and recurring stories. If `knowledge/wiki/` is empty, tell Kurt no board members are set up yet and point him at the `ingest-resource` skill to add one.
3. **Consult each member.** For Kurt's question, work through what each board member would actually say — reasoning in their specific vocabulary and stance as captured in their wiki file, not a watered-down generic take. Keep this internal working step short; it's input to step 4, not the final output.
4. **Synthesize.** Produce ONE combined answer:
   - Where the board agrees, lead with that — it's the strongest signal.
   - Where they disagree, name the disagreement explicitly and explain the tradeoff, rather than picking a winner silently.
   - End with a concrete recommendation for what Kurt should actually do, not just a summary of opinions.
5. **Cite who said what.** Attribute specific points to specific board members by name so Kurt can tell which advice came from where.

## Notes

- This is a synthesis exercise grounded in real ingested material, not a role-play. Don't invent positions a board member never expressed in their wiki file — if their `raw/` and `wiki/` content doesn't cover the question, say so rather than guessing what they'd think.
- Keep the final answer decision-focused. Kurt's own framing for this project was "based on everything you know about me, what should I do to capitalize on AI" — optimize for that kind of concrete, actionable output.
