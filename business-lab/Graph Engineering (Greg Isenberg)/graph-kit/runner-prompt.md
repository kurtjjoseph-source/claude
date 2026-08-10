# The Level 2 runner prompt

One message that hands a whole graph to Claude Code or Codex. Fill the brackets, paste, walk away until the gate.

```
Run this graph. It's a workflow, not a single task — follow the tiers.

GOAL: [the outcome, one sentence]
DECISION IT FEEDS: [the decision]
WORKING DIRECTORY: ./[slug]/[YYYY-MM-DD]/

THE GRAPH

  Tier 0
    - Planner [plan]
        job:    Break the question into the angles that would change the answer
        reads:  the question
        writes: plan.md

  Tier 1  (these run AT THE SAME TIME — use parallel subagents)
    - [Lane A] [work]
        job:    [one line]
        reads:  plan.md
        writes: [a].md
    - [Lane B] [work]
        job:    [one line]
        reads:  plan.md
        writes: [b].md
    - [Lane C] [work]
        job:    [one line]
        reads:  plan.md
        writes: [c].md

  Tier 2
    - Skeptic [check]
        job:    Kill the weak findings
        reads:  [a].md, [b].md, [c].md
        writes: review.md

  Tier 3
    - Merge [merge]
        job:    Turn the surviving evidence into the recommendation
        reads:  review.md and the lane files
        writes: recommendation.md

  Tier 4
    - Human gate [gate]
        job:    I decide
        reads:  recommendation.md
        writes: decision.md   ← I write this one, not you

RULES
  1. Each job writes its own file. Never merge two jobs into one pass.
  2. Jobs in the same tier have no dependency on each other — run them concurrently.
  3. The checker must not be the same pass that produced the work it checks.
     Spawn it fresh, with only the lane files as context.
  4. STOP at "Human gate". Do not [act on it / send anything / publish /
     deploy / move money]. Present recommendation.md and wait for an explicit yes.
  5. Leave the state behind: the evidence and its sources, the checker's
     objections including the ones I overrule, and the decision.
  6. If a lane can't do its job, write what's missing into its file and stop
     that lane. Do not have another lane cover for it.
```

## Notes for real runs

**Parallelism is the point.** If the tool runs Tier 1 sequentially you've paid for a graph and got a chat. Say *use parallel subagents* explicitly.

**Freshness of the checker matters more than its prompt.** A skeptic that has the writing lane's reasoning in its context will agree with it. Spawn it with only the output files.

**The gate has to bite.** "Present and wait" only works if you actually read it. If you find yourself approving without reading, the gate is in the wrong place — move it to where the expensive commitment is.

**Level 3 comes after three clean Level 2 runs.** See [`three-run-log.md`](three-run-log.md). At that point the graph shape is stable and LangGraph or n8n is just encoding a thing you already know works.
