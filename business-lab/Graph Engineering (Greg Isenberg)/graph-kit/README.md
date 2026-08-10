# Graph Kit — reusable pieces

Everything in this folder is meant to be copied into a real project, not read once.

| File | What it's for |
|---|---|
| [`graphs.json`](graphs.json) | Six ready-made graphs. Paste the whole file into the wizard's **Graphs → Import** box. |
| [`GRAPH-TEMPLATE.md`](GRAPH-TEMPLATE.md) | A blank graph brief. Copy it into a project folder and fill it in by hand. |
| [`lane-prompts.md`](lane-prompts.md) | The five reusable role prompts — planner, worker, skeptic, merge, gate. Swap the bracketed parts. |
| [`runner-prompt.md`](runner-prompt.md) | The Level 2 kickoff prompt: hand a whole graph to Claude Code or Codex in one message. |
| [`three-run-log.md`](three-run-log.md) | The gate between Level 1 and Level 2. Don't automate until it's full. |

## How to reuse this

**Once per workflow** — run the wizard, export the graph file, drop it next to the work it describes.

**Once per run** — copy `GRAPH-TEMPLATE.md` into a dated folder, paste in the run order, and let each lane write its own file beside it. The folder *is* the state.

```
research/shopify-bookkeeping/2026-08-03/
  graph.md            ← the filled-in template
  plan.md             ← planner lane
  customer.md         ← ┐
  competitors.md      ← ├ these three run at the same time
  distribution.md     ← ┘
  review.md           ← skeptic
  recommendation.md   ← merge
  decision.md         ← what you actually decided, and why
```

Next month's run starts by reading last month's folder. That's the compounding part — the graph produces the work *and* the memory that makes the next graph smarter.

## The rules that don't change

1. **Every job writes its own file.** If two jobs share a file, they're one job — or you've hidden a handoff.
2. **The checker never wrote the thing it checks.** Different pass, different context, ideally a different session.
3. **Jobs with no arrow between them run at the same time.** Anything else is fake waiting.
4. **The gate is a person.** The graph prepares the send, the deploy, the refund. It never commits it.
5. **Start at Level 1.** Automating a workflow you don't understand produces mediocre work faster.

---
Method from Greg Isenberg, *Why Graph Engineering will 10x your Claude/Codex* — https://www.youtube.com/watch?v=JWhICz1QR8M
