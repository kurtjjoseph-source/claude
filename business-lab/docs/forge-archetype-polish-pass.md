# Forge archetype polish pass

_Built with The Gauntlet Rig implementation wizard, from “This NEW Claude Prompting Technique is blowing people’s minds (gauntlet-loop)” — https://www.youtube.com/watch?v=BNjzXcEXmg4_

**Completeness:** 33/33 fields (100%)

---

## 1 · Is this job gauntlet-shaped?

- **The task, in one line:** Polish the Forge church-media archetype demo to shippable quality
- **What you are pointing it at:** A visual surface
- **How a critic tells good from bad:** Pixel against a reference
- **The level this job actually needs:** Level 3 — the gauntlet

## 2 · What the loop is standing on

- **What exists before you fire this:** A working MVP

**What is pinned in files, not in your head**

- Brand tokens — palette, type, spacing
- Reference images or a design file

**Your pegs — what the critics diff against**

| Peg | What it settles | Where it lives |
|---|---|---|
| VOM Kit v2 tokens | Palette, type scale, spacing | vom-systems/brand/tokens.css |
| Church-media archetype spec |  |  |


## 3 · The build method

- **Independently buildable pieces:** 6
- **Critics per piece:** 1
- **Agents your tool actually runs at once:** 10
- **Minutes for one agent to do one pass:** 6 min
- **What the critic is allowed to see:** Blind critic

**The split, written down**

| Piece | What done looks like | Checked against |
|---|---|---|
| Hero + nav | Matches archetype spec at 3 breakpoints | tokens.css + spec p.2 |
| Service times block |  |  |


- **Fleet shape:** 6 pieces × (1 builder + 1 critic) = **12 agents per round**, 2 waves at a cap of 10 concurrent, ~12 min per round

## 4 · The bar to hit

- **The named artefact the bar points at:** the VOM Kit v2 tokens and the church-media archetype spec

**What every critic grades on — and only this**

- Fidelity to the peg
- Brand system compliance
- Accessibility

- **How a critic passes a round:** Two of three independent critics pass
- **Consecutive clean rounds before a piece is done:** 2
- **Hard round cap:** 8 rounds

## 5 · The three lines, assembled

- **Where the run starts:** From the MVP plus a locked design system

**Hard constraints — what must not change**

> Use the VOM Kit v2 tokens exactly as defined in tokens.css — do not add colours.
> The real VOM logo only; never generate a mark.


### The prompt

```
## 1 · TASK

Polish the Forge church-media archetype demo to shippable quality
Start from the existing MVP and the locked design system already in this repository. Both the direction and the visual system are settled; you are improving execution only.

Hard constraints — these do not change, whatever a sub-agent concludes:
- Use the VOM Kit v2 tokens exactly as defined in tokens.css — do not add colours.
- The real VOM logo only; never generate a mark.

Reference material the result is measured against:
- VOM Kit v2 tokens — settles Palette, type scale, spacing (vom-systems/brand/tokens.css)
- Church-media archetype spec

## 2 · BUILD METHOD

Break this into the smallest independently buildable pieces — I count 6 — and fan out one builder sub-agent per piece. Pieces must not edit each other's files.

The split, and what done means for each piece:
- **Hero + nav** — done when Matches archetype spec at 3 breakpoints; checked against tokens.css + spec p.2
- **Service times block** — done when [define done]

Pair every builder with a BLIND critic sub-agent. A critic sees only the produced output and the reference material above — never the builder's plan, reasoning or self-assessment.

Critics grade on these dimensions and nothing else:
- Fidelity to the peg
- Brand system compliance
- Accessibility

A critic that cannot point at a specific, located gap must pass the piece. A critic that can must fail the round and state exactly what to change. Do not let a builder grade its own work.

## 3 · BAR

Do not stop until each piece is passed by at least two of three independent critics, each grading through a different lens, all of them comparing against the VOM Kit v2 tokens and the church-media archetype spec.
A piece is finished when it passes 2 consecutive rounds with no critic findings.
Hard stop: 8 rounds or roughly €900 of spend, whichever comes first. If you hit the stop, report exactly which pieces are still failing and why. Do not lower the bar in order to finish.
Report progress as you go: each round, which pieces passed, which failed, and the critic's stated reason.
```

## 6 · What the run costs

- **Rounds you actually expect:** 4
- **Output tokens per agent pass:** 25 k
- **Price per million output tokens:** €70
- **Your ceiling for this run:** €900
- **Your hours setting up and reviewing:** 2 h
- **Hours to reach the same quality by hand:** 12 h
- **Your hourly rate:** €95 /h
- **What the finished thing is worth:** €2500
- **What actually stops a runaway:** Round cap plus a spend ceiling

- **Forecast burn:** 48 agent passes · 1.2M output tokens · **€84** (€168 at the 8-round cap) · ~48 min wall clock
- _Output tokens only. Input and cached tokens ride on top._
- **Rig vs hand:** €274 (run + 2h of your time) against €1 140 by hand — difference **€866**, 11% of the deliverable's €2 500 value

## 7 · The test no critic can run

**What you check yourself, after the run**

- It is on brief
- It is on the client's real brand system
- You would ship it under the VOM name

- **Who signs the acceptance test:** the operator, before it leaves the staging alias
- **The call:** Run the gauntlet
- **What happens to this rig afterwards:** Save it as a skill

---

## Where to start

**Run it.** In order: copy the prompt from step 5, confirm the repo already holds what your entry point claims it holds, check the round cap and the euro ceiling are both in line three, then start it and leave it alone. When it stops, run the acceptance test yourself before anyone else sees the output — that is the one check the fleet is structurally incapable of making.

_Run times and costs in this plan are a forecast built from one operator's two runs on one model (a 3D walkthrough past two hours and unfinished; a landing page in 1 h 19 min). They are not a quote._