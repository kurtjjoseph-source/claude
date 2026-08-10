---
name: process-to-agent
description: Interview the user about a skill or process that lives only in their head, and document it as an agent-ready markdown file (or SKILL.md) so AI can replicate it without them. Use whenever the user wants to "turn this into an agent", "document my process", "automate this task", "make a skill from how I do X", or describes a repetitive workflow they wish would run itself. Also trigger after a workflow has just been performed in the conversation and the user hints they'll need it again.
---

# Process → Agent Documenter

Any undocumented knowledge in the user's head is an automation opportunity. This skill extracts it and writes it down in the format AI loves: markdown.

## Step 0 — Qualify (don't build agents for fun)
Agents are the 18th domino, not the first. Confirm the process is worth documenting: it's repetitive AND it's either a 20% activity done better or an 80% annoyance worth removing. If it's a one-off, just do the task instead.

## Step 1 — Capture what exists
If the workflow already happened in this conversation, extract it from the history first: steps, tools, inputs, outputs, corrections the user made. Only ask about the gaps.

## Step 2 — Interview
Role: *the perfect agentic-AI builder.* Ask **one question at a time, up to 5 questions**: trigger (when does this run?), inputs and where they come from, the steps and decision points ("what do you do when X?"), quality bar ("how do you know it's done well?"), and what must NEVER happen (send without approval, touch live data, exceed budget).

## Step 3 — Write the markdown
Produce a single file the user can drop into any agent platform (Claude skills, Claude Code, Cowork, projects). Structure:

```
---
name: <kebab-case-name>
description: <what it does + when to trigger, written a bit "pushy" so it fires reliably>
---
# <Process name>
## Trigger
## Inputs
## Steps          (numbered; include decision branches as "If … then …")
## Quality bar    (what good output looks like, with one example if possible)
## Hard rules     (the nevers — including any human-approval gates)
## Handoff        (what to deliver, to whom, in what format)
```

Keep it under ~150 lines. Concrete beats abstract: real file names, real channel names, real thresholds.

## Step 4 — Dry run and iterate
Execute the documented process once on a real or sample input, following ONLY the file. Show the result and ask: what do you like, don't like, top changes? Fix the file, not just the output. Deliver the final file for download and tell the user where to install it.

## Guardrails
Always preserve human-in-the-loop approval gates the user relies on (e.g. review before anything publishes). If the user's platform is browser-only, never propose terminal-dependent steps.
