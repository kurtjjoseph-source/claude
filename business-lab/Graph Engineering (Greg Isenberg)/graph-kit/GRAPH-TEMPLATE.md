# Graph — [name it something you'll recognise]

**Outcome (one sentence)** — [I want a one-page recommendation on whether … is worth testing.]
**Decision it feeds** — [Whether I spend the next month on this.]
**Run date** — [YYYY-MM-DD]
**Level** — [1 manual lanes · 2 files in a repo · 3 orchestrated]

## Does it qualify?

- [ ] **Multiple steps** — more than one real job stands between the question and the answer
- [ ] **Parallel paths** — some of those jobs don't depend on each other at all
- [ ] **It has to be right** — the output needs checking before it matters

*Fewer than three ticks? Write a sharper prompt instead and get on with your day.*

## The jobs

| # | Job | Role | Its one job | Writes | Waits on |
|---|---|---|---|---|---|
| 1 | Planner | plan | Break the question into the angles that would change the answer | `plan.md` | — |
| 2 |  | work |  | `.md` | 1 |
| 3 |  | work |  | `.md` | 1 |
| 4 |  | work |  | `.md` | 1 |
| 5 | Skeptic | check | Kill the weak findings | `review.md` | 2, 3, 4 |
| 6 | Merge | merge | Turn the survivors into the answer | `recommendation.md` | 5 |
| 7 | Human gate | gate | Decide | `decision.md` | 6 |

Roles: **plan** breaks it up · **work** produces evidence or a draft · **check** attacks work it didn't write · **merge** turns survivors into the answer · **gate** is a person.

## Run order

```
Tier 0   1 Planner
Tier 1   2 · 3 · 4          ← at the same time
Tier 2   5 Skeptic
Tier 3   6 Merge
Tier 4   7 Human gate
```

## What the skeptic attacks

- [ ] Claims stated without evidence
- [ ] Evidence that's simply out of date
- [ ] The competitor / option / risk nobody mentioned
- [ ] Pain confused with willingness to pay
- [ ] Places the model sounded confident without proving anything
- [ ] Two lanes that contradict each other
- [ ] [something specific to this work]

## The gate

**Risk level** — [private memo · team acts on it · customer message · public post · code/deploy/production · money]
**What I'm approving** — [the recommendation and the one test we run this week]

Before I act on this:

- [ ] I read the checker's objections, including the ones I'm overruling
- [ ] Every number I'm relying on has a source and a date
- [ ] I can say what evidence would change my mind

## What survives this run

- [ ] The evidence and its sources
- [ ] The checker's objections
- [ ] The decision and the reasoning behind it
- [ ] What evidence would change my mind
- [ ] The drafts that didn't ship
- [ ] Verbatim customer language

**Lives at** — [./folder/ — one dated folder per run]

## The five tests

- [ ] **No fake waiting** — everything that can run in parallel does
- [ ] **Worker ≠ checker** — nobody grades their own homework
- [ ] **Human approval where mistakes are expensive**
- [ ] **It terminates** — one clean end, no loops
- [ ] **It leaves state behind**

Plus the one that isn't a test but matters most: is this the **smallest** graph that improves the work? More agents often means five workers confidently repeating the same wrong idea.
