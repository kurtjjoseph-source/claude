# Graph Engineering — one page

**Source:** Greg Isenberg, *Why Graph Engineering will 10x your Claude/Codex* — https://www.youtube.com/watch?v=JWhICz1QR8M (2026-08-03, 26 min)

---

## The idea in one line

> Prompt engineering = how you ask. Context engineering = what you give it. **Graph engineering = how you design the work around the AI**, so it stops living inside one giant chat.

## The vocabulary

| Term | Plain English |
|---|---|
| **Graph** | Jobs connected by arrows |
| **Job** | One step in the workflow, with one responsibility |
| **Arrow** | A real dependency — "this can't start until that finishes" |
| **State** | The shared notes moving through the workflow: *what does the system know so far?* |

## Two kinds of graph

- **Knowledge graph** — helps AI understand **how information connects** (customer → company → product → team). This is what GraphRAG solves: plain RAG retrieves the *nearest paragraph*, not the *connected answer*.
- **Agent graph** — helps AI understand **how work should move** (planner → parallel researchers → skeptic → merge → human). This is the one you can use today.

Best systems eventually run both.

## When to build a graph

Build one when the work has **multiple steps, some of which can run at the same time, and an output that needs checking before it matters.**

| Don't graph it | Do graph it |
|---|---|
| Brainstorm 10 names | Deep research |
| Summarize a short email | Go-to-market plan |
| One-off rewrite | Support triage · code review · sales call prep · customer feedback synthesis · recurring content |

## The diamond (the default shape)

```
                    QUESTION
                       │
                    PLANNER
          ┌────────────┼────────────┐
      RESEARCH A   RESEARCH B   RESEARCH C     ← run at the same time
          └────────────┼────────────┘
                    SKEPTIC                    ← checking is its own job
                       │
                     MERGE                     ← surviving evidence → recommendation
                       │
                  HUMAN GATE                   ← you decide, not the model
```

**Why the skeptic is non-negotiable:** most AI research fails because the model that writes the answer also grades it. That's a self-written performance review. Separate the writer from the checker.

**What the human gate is for:** the graph does not make the decision. It produces better evidence for *your* decision.

## Three levels of implementation

| Level | What it is | Use when |
|---|---|---|
| **1 — Manual lanes** | Run each job in its own chat/tab by hand. Draw it on Excalidraw or tldraw first. | Always start here. Draw the graph before you automate the graph. |
| **2 — Files in a repo** | Claude Code / Codex, each step writes a file: `plan.md` → `customer.md` · `competitors.md` · `distribution.md` → `review.md` → `recommendation.md` | After the manual version has beaten your old workflow **three times**. Leaves a paper trail you can diff and reuse. |
| **3 — Orchestrated** | LangGraph (state, checkpoints, persistence, human-in-the-loop) · AutoGen GraphFlow (sequential + parallel + branches + loops) · n8n / Make (when it touches Slack, email, Airtable, CRM) | Once the shape is proven and stable. |

> Automate a workflow you don't understand and you get a mess. Understand it first and the automation becomes obvious.

## Three graphs you can steal today

- **Support** — classify issue → check account context → search docs/policy → draft reply → checker reviews accuracy/tone/risk → **human approves** anything touching refunds, account changes, angry customers, legal risk, or promises you'll regret.
- **Content** — research → thesis → examples → hook → script → checker (are the examples specific? does the pacing work? does the hook earn attention? does it sound like a person?) → branch into titles, thumbnails, captions, B-roll.
- **Code** — plan → edit → review the diff ‖ run tests ‖ check the UI in a browser ‖ hunt edge cases → **human approves the PR**.

## The trap

More agents ≠ better output. More agents often means more noise, five workers confidently repeating the same wrong idea, and more time coordinating than thinking. **Aim for the smallest graph that improves the quality of the work.**

## The five tests of a good graph

1. It removes **fake waiting** — anything that can run in parallel, does.
2. It **separates workers from checkers**.
3. It puts **human approval where mistakes are expensive**.
4. It **stops when the answer is good enough**.
5. It **leaves useful state behind** — notes, evidence, drafts, sources, the decision.

## The compounding part

The real payoff isn't that one task gets better. It's that **your work starts producing memory.** Every research graph leaves better customer notes; every content graph leaves better examples and audience insight; every support graph leaves better product feedback. The graph produces the work *and* the memory that makes the next graph smarter. That's the moat.

## Your first rep

1. Pick one workflow you already run weekly with AI.
2. Write the final output in **one sentence**.
3. List the jobs a great human would do.
4. Draw arrows **only where the work genuinely depends** on another step.
5. Add **one human gate** before the expensive decision.
6. Run it manually **once**.

Then you're not prompting AI anymore — you're managing AI work.
