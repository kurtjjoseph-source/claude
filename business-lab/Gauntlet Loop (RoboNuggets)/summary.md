# The gauntlet loop — playbook summary

**Source:** [This NEW Claude Prompting Technique is blowing people's minds (gauntlet-loop)](https://www.youtube.com/watch?v=BNjzXcEXmg4) — Jay E | RoboNuggets, ~13 min
**Working transcript:** [transcript.md](transcript.md)
**Implementation wizard:** [The Gauntlet Rig →](https://vom-gauntlet-rig.vercel.app) · [wizard.html](wizard.html)

---

## The one-sentence version

**Write a three-part prompt — task, build method, bar — that tells the main agent to split the goal
into independently buildable pieces, give every builder a blind critic, and refuse to stop until
every critic passes against a *named* reference; then never fire it as your first prompt, because it
will optimise beautifully towards whatever direction the agent picked for you.**

## The problem it solves

Level-1 prompting makes you the bottleneck: you prompt, you judge, you re-prompt. Level 2 hands the
judging to a critic agent — Anthropic documented that gain back in *Building effective agents*
(2024), because models reliably talk themselves into believing their own output is good enough. The
gauntlet loop is level 3: **a fleet of builder sub-agents, each paired with its own critic, all
converging on one stated bar before anything reaches you.**

Nothing in it is new tooling. It is a prompt shape.

## The map — three levels

| level | who verifies | when it is the right call |
|---|---|---|
| 1 · you loop | you | Fast, cheap, ambiguous work. Most tasks. |
| 2 · one critic | a critic agent | One artefact, one quality axis, you know what good looks like. |
| 3 · the gauntlet | a fleet of builder + critic pairs | The goal genuinely splits into **independent, separately checkable** pieces, and the polish is worth hours and real token spend. |

Most work is level 2 wearing a level-3 costume. The gauntlet's overhead only pays when the pieces
are actually independent.

## 1 · The three lines

Matt Shumer's published prompt is three lines. The wording is not the asset — **the structure is.**

1. **Task** — what you want to exist. ("Build a first-person shooter.")
2. **Build method** — *fan out sub-agents, one per piece, and give each a separate sub-agent that
   checks its work.* In Jay's run Claude spawned room-builder agents each paired with a **blind
   critic** — a critic that sees the output and the reference, not the builder's reasoning.
3. **Bar to hit** — the stopping condition, pointed at a **named artefact**: *"do not stop until each
   sub-agent is utterly wowed with the quality when compared with the actual Call of Duty game."*

**A bar without a named reference is a vibe.** Shumer's bar was Call of Duty. Jay's was a real
Darling Point listing's floor plan and photos. That artefact is what the critic diffs against — and
the reason the run can decide, without you, that a round failed.

## 2 · What it actually costs

These are one person's runs, on Opus 5, in early August 2026 — not a spec sheet:

| run | shape | observed |
|---|---|---|
| Darling Point 3D apartment walkthrough | floor plan + reference photos, room-builder agents + blind critics | **2 hours and still failing its own critics** when he cut the recording |
| Ketone IQ landing page | fan-out builders + a judging phase, plus research agents to fact-check the copy | **1 h 19 min**, finished |

The pattern to plan for: **looping prompts take a lot of time and a lot of tokens.** A run that
outlives your attention span is the normal case, which is exactly why the hard round cap belongs in
the prompt rather than in your good intentions.

## 3 · The catch, which is the whole lesson

The Ketone IQ page came out looking genuinely good — dark mode, light mode, scroll animations,
fact-checked numbers, nothing like the usual vibe-coded output. **It was also off-brand.** The real
Ketone IQ site runs a materially different design system. The loop had converged, hard and
expensively, on a direction no one had chosen.

> **If you do not start from a good minimum viable design or product, the gauntlet loop just
> optimises towards the wrong thing — and it does so for hours, at cost.**

So: **do not use it as your opening prompt.** Build the MVP or pin the design system first, then run
the gauntlet as a **warp drive** over that foundation. Version two then both looks good *and* sits on
brief.

## 4 · The prescribed move

1. Get an MVP, a brief, or a design system in the repo. Not a paragraph — an artefact.
2. Collect the **pegs**: the reference images, floor plans, brand tokens, spec pages the critic will
   diff against.
3. Write the three lines. Name the pieces, demand blind critics, point the bar at the pegs.
4. Set a hard stop — round cap and spend cap — inside the prompt, not in your head.
5. Run it. Expect one to three hours.
6. **Do the acceptance test yourself.** Critics grade fidelity; only you can say whether it is on
   brief, on brand, and legally sayable. That is the exact failure the Ketone IQ run demonstrates.

Jay ships a `/gauntlet-loop` skill that writes the prompt from a task description — the same job the
wizard's prompt composer does, keyed to answers you have already made explicit.

## What to ignore

- **The demo porn.** Pokémon in 3D and the kart racer are capability markers, not use cases. Their
  presence in the video is evidence that the models have stamina, not that this is how you should
  spend an afternoon.
- **"One-shotted."** True in the sense that one prompt started it. It is not one inference — it is a
  supervised fleet running for hours. Anyone quoting "one prompt" as a cost figure is quoting the
  wrong number.
- **The 4.8M / 87M view counts.** Provenance, not evidence.
- **The two run times as budgets.** One person, one model, two tasks. Treat them as the shape of the
  curve, not as a quote.

## What this means for VOM

This is a **build-quality multiplier for Forge and Turnkey**, not a new product.

- **Forge (`vom-forge.vercel.app`).** Forge already produces an MVP platform per archetype from
  `apb/1` — which is precisely the "strong minimum viable product" the video says you must have
  *before* the gauntlet is safe to fire. The natural insertion point is a **polish pass over a built
  archetype demo**: pegs = the archetype's accent, type preset and the VOM Kit v2 tokens; critics
  grade fidelity to those tokens, not taste. That inverts the Ketone IQ failure, because the brand
  system is the peg rather than the thing the agents invent.
- **Turnkey W4 (website & deployment).** The dev swarm already fans out; what it lacks is a *named
  bar with a hard cap*. Adding the third line — blind critic, named peg, round and spend ceiling —
  is a prompt change, not an architecture change.
- **The house rule it confirms.** VOM's standing rule is to always apply the real logo and palette on
  any VOM build rather than a generic mark. The Ketone IQ run is the empirical case for why: an
  unconstrained quality loop will produce something handsome and wrong. **The brand kit is the peg.**
- **Cost discipline.** Every gauntlet run on client work needs a euro ceiling stated up front and
  compared against the deliverable's fee. A two-hour Opus fleet polishing a €900 site is a decision,
  and it should be made on purpose.

The wizard turns those into decisions: is this job even gauntlet-shaped, is the foundation real, what
are the pegs, what does the bill come to, and who signs the acceptance test that no critic can run.
