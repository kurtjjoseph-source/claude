# Graph Engineering (Greg Isenberg)

Source: **[Why Graph Engineering will 10x your Claude/Codex](https://www.youtube.com/watch?v=JWhICz1QR8M)** — The Startup Ideas Podcast, 2026-08-03, 26 min.

> Prompt engineering is how you ask. Context engineering is what you give it. **Graph engineering is how you design the work around the AI** — so it stops living inside one giant chat.

## Live

| | |
|---|---|
| 🕸️ **[The Graph Bench](https://claude.ai/code/artifact/59c80aac-e5be-4617-a074-62efabd16289)** | The implementation wizard. 10 steps from "one workflow you already run" to a real graph — live diagram, dependency checks, generated lane prompts, a Claude Code kickoff prompt, and a downloadable brief. Saves multiple graphs; import/export as files. |
| 📐 **[Graph Engineering — Field Sheet](https://claude.ai/code/artifact/c47bb5b6-107d-48f0-a777-69d7efde32db)** | The visual one-pager. Ten diagrams: the diamond, chat vs. graph, knowledge vs. agent graphs, the three levels, three graphs you can steal, the memory flywheel. Printable. |

## Files

| File | What it is |
|---|---|
| [summary.md](summary.md) | The whole method on one page — vocabulary, when to use it, the diamond, three levels, the five tests, your first rep. |
| [transcript.md](transcript.md) | Full cleaned transcript with chapters. |
| [field-sheet.html](field-sheet.html) | Source for the field sheet artifact. |
| [wizard.html](wizard.html) | Source for the wizard artifact. Self-contained — open the file directly and it works offline. |
| [graph-kit/](graph-kit/README.md) | The reusable pieces ↓ |

## The reusable kit

| File | Reuse it by |
|---|---|
| [graph-kit/graphs.json](graph-kit/graphs.json) | Pasting into the wizard's **Graphs → Import** box. Six ready-made graphs: idea validation, support triage, content, shipping code, feedback synthesis, sales call prep. |
| [graph-kit/GRAPH-TEMPLATE.md](graph-kit/GRAPH-TEMPLATE.md) | Copying into a project folder, one per run. The folder becomes the state. |
| [graph-kit/lane-prompts.md](graph-kit/lane-prompts.md) | Pasting one role per chat (Level 1) or per subagent (Level 2). Planner · worker · skeptic · merge · gate. |
| [graph-kit/runner-prompt.md](graph-kit/runner-prompt.md) | Handing a whole graph to Claude Code or Codex in one message. |
| [graph-kit/three-run-log.md](graph-kit/three-run-log.md) | Proving the manual version wins before you automate anything. |

## The short version

**A graph is jobs connected by arrows, with shared state moving through.** Build one when the work has multiple steps, some of which can run at the same time, and an output that needs checking before it matters. Otherwise write a better prompt.

The default shape is a **diamond**: planner → parallel researchers → skeptic → merge → human gate.

Two rules carry most of the value:

- **Checking is its own job.** Most AI research fails because the model that writes the answer also grades it.
- **Smallest graph that improves the work.** More agents often means five workers confidently repeating the same wrong idea.

And the part that compounds: the graph produces the work *and* the memory that makes the next graph smarter.

## Where to start

1. Open **[the wizard](https://claude.ai/code/artifact/59c80aac-e5be-4617-a074-62efabd16289)**, pick the template closest to something you already do weekly.
2. Edit the jobs until they're yours. Watch the five tests on the right go green.
3. Copy the run sheet. Run it **manually, once**.
4. Fill in [three-run-log.md](graph-kit/three-run-log.md). Automate only if the graph won all three.
