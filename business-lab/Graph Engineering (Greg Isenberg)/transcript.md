# Why Graph Engineering will 10x your Claude/Codex — Transcript

**Channel:** Greg Isenberg (The Startup Ideas Podcast)
**Video:** https://www.youtube.com/watch?v=JWhICz1QR8M
**Posted:** 2026-08-03 · 26:28 · solo episode

**Description (author's own):** Prompt engineering is how you ask AI a better question, context engineering is how you give AI better information, and graph engineering is how you design the work *around* the AI so it lives as a managed workflow instead of one giant chat. Covers the vocabulary (jobs, arrows, state), knowledge graphs vs. agent graphs, a full worked example on an AI bookkeeping product for Shopify merchants, three levels of implementation from whiteboard to LangGraph/n8n, and ready-made graphs for support, content, and code.

**Chapters**

| | |
|---|---|
| 00:00 | Intro |
| 01:24 | Prompt / context / graph engineering |
| 02:50 | Chat vs. graph |
| 03:35 | Defining terms and workflows |
| 06:44 | Knowledge graphs vs. agent graphs |
| 08:47 | When to use graph engineering |
| 10:01 | Example: AI bookkeeping for Shopify merchants |
| 13:22 | The diamond pattern visualized |
| 15:10 | Three levels of implementation |
| 17:14 | Customer support graph |
| 18:45 | Content creation graph |
| 19:30 | Coding graph |
| 20:42 | The trap of oversized graphs |
| 22:22 | Building your first graph |
| 24:53 | Closing thoughts |

---

## Full transcript (auto-generated captions, cleaned)

I came on here to talk about a term I keep seeing go viral on Twitter: graph engineering. You've seen it, I've seen it too, and honestly the first time I saw it my reaction was — okay, is this a real thing, or did we just invent another phrase to make everyone feel behind? Because AI has this funny habit where every few weeks a new term goes viral. Prompt engineering, context engineering, agent engineering, vibe coding, loop engineering, and now graph engineering. Some of these phrases are hype. Some are actually useful. Graph engineering is one of the useful ones, because it gives you a much better way to think about how AI work actually gets done.

By the end of this episode I want you to be able to take one AI workflow you already run — customer research, support triage, content production, startup idea validation — and turn it into a simple map of steps, checks, handoffs, loops, and human approvals.

### The one-line definition

Prompt engineering is how you ask the AI a better question. Context engineering is how you give the AI better information. Graph engineering is how you design the work *around* the AI, so the whole thing stops living inside one giant chat.

### Chat vs. graph

Think about what actually happens when you ask a chat model a big question — say, whether an idea is worth pursuing. You get back something long and confident and well-formatted, and you feel like you did the research. But if you slow down, something uncomfortable happened: one model, in one pass, decided what mattered, researched the market, interpreted the evidence, wrote the recommendation, and graded its own confidence. That's a lot of trust to put into one blob of text. In some cases you might spend years of your life on the answer to that one question — and be working on the wrong thing.

The graph version looks different. A planner breaks the question into angles. One researcher looks at the customer, another at competitors, another at distribution, another at pricing, another at risks. Then a skeptic tries to kill the weak findings. Then a merger turns the surviving evidence into a one-page recommendation. Then you approve the decision before you act on it. The output might still be a written report — but the work behind it is designed so much better. That, at its core, is graph engineering: taking a messy AI task and turning it into a workflow you can actually manage.

### The vocabulary

One of my first university classes was graph theory, so this is a throwback for me — but I'll keep it out of computer-science-lecture territory.

When people say **graph**, they basically mean **jobs connected by arrows**. Each job is a step in the workflow. The arrows show what happens next. The shared notes moving through the workflow are the **state** — a fancy way of saying *what does the system know so far?*

That sounds technical for about five seconds, and then you realize it's just how work gets done in the real world.

Think about customer support. When a customer writes in, the work is rarely just "answer the ticket." First you understand what kind of issue it is. Then you check the customer's account history. Then you search the docs for the right policy. Then you draft a response. Then you decide whether it's risky enough that a human should review it before it goes out. Draw those steps and connect them in the order they actually depend on each other — that's a graph.

Or take content. If I'm making a YouTube episode, the work isn't just "write a script." A good episode starts with research, a thesis, examples, a hook, a script, then title ideas, then thumbnail directions, then an Excalidraw, then a final pass where I ask: does this sound like a human being, or does it sound like someone trapped inside a SaaS onboarding flow?

Some of those steps have to happen in order — you want the thesis before the script, and the script before the Excalidraw. But other pieces can happen at the same time. One researcher can look for examples while another looks for counterarguments; one studies the audience angle while another looks for practical workflows. Then those outputs merge back into the script.

That's where the graph starts paying, because most people use AI in a straight line — chat makes everything feel sequential. You ask for research, then a summary, then a draft, then edits, then titles. That works for simple things. But when the work has multiple pieces, straight-line chat gets slow and fuzzy and hard to trust. A graph lets you design the work more like a small team: one part plans, a few work in parallel, another checks the work, another merges it, and then the human approves the final step.

### Two things people mean by "graph"

This is where a lot of the confusion comes from.

**Knowledge graphs** help AI reason over relationships between things. This customer works at this company; this company uses this product; this product connects to this tool; this support issue relates to this feature; this feature is owned by this team. Knowledge graphs help because AI can then reason across relationships in messy data. This matters because normal RAG often retrieves chunks of text that *look* similar to the question, but struggles when the answer actually requires connecting different people across companies and topics and claims and events. Tools like Microsoft GraphRAG exist because sometimes you need AI to understand relationships inside a body of knowledge, not just retrieve the nearest paragraph.

**Agent graphs** are about how work moves. A planner hands work to researchers; the researchers work in parallel; a skeptic checks the findings; a synthesizer merges the parts; a human approves the final answer.

This episode is mostly about agent graphs, because that's the version you can start using today as a founder, creator, operator, or small team.

The easiest way to remember the difference: knowledge graphs help AI understand **how information connects**; agent graphs help AI understand **how work should move**. Eventually the best systems use both — the AI understands the relationships inside your business, *and* it knows how to move through the right steps.

### When to use it

Use a graph when the work has multiple steps, multiple sources, multiple paths, checks, risk, or approvals.

If you're asking AI to brainstorm ten names for a project, you don't need a graph. If you're asking it to summarize a short email, you don't need a graph. But if you're doing deep research, creating a go-to-market plan, triaging support tickets, reviewing code, preparing for sales calls, synthesizing customer feedback, or producing a recurring content workflow — that's when graph thinking starts to matter a lot.

The rule is simple. Use a graph when the work has multiple steps, some steps can happen at the same time, and the final output needs checking before it matters.

### The diamond

A diamond starts with one question, splits into multiple parallel paths, checks the work, and merges everything back into one answer.

Here's the startup-idea version. The question: *should I launch an AI bookkeeping product for Shopify merchants?* The messy chat version is one big question and one big answer.

The graph version starts with a **planner**: to answer this well, we need to understand the customer pain, the competitive landscape, the go-to-market wedge, the pricing pressure, and the risks.

Then the work splits:

- **Customer researcher** — studies Shopify merchants and the bookkeeping pain. Are they using QuickBooks? Spreadsheets? Hiring bookkeepers? Are they annoyed at tax time? Are they looking for automation, or do they just want someone to clean up the mess once a month?
- **Competitor researcher** — are there already Shopify bookkeeping tools? Are accounting firms building this manually? Are App Store products solving it at all? Are freelancers on Upwork or Fiverr doing the work in a way software could partially replace?
- **Distribution researcher** — where do Shopify merchants actually hang out? What newsletters do they read? What agencies already have trust with them? What Shopify app categories do they search? What search terms reveal buying intent?

Those three jobs happen at the same time, because they don't depend on each other.

Then comes the **skeptic**. What claims are actually supported? Which evidence is stale, because you're going to have data that is just old? Which competitor is being ignored? Where are we confusing pain with willingness to pay? Where did the AI sound confident without proving anything?

This step matters more than people think. A lot of AI research fails because the same model that writes the answer also grades the answer. That's like asking someone to write their own performance review and then being shocked when they describe themselves as a visionary. In a good graph, **checking is its own job**.

Then the **merge**. The merge step takes the surviving evidence and turns it into a recommendation. Pursue, pause, or kill? What's the wedge? Who's the first customer? What should we test this week? And what evidence would actually change our mind?

Finally, the **human gate**. That's where you decide what to do next. Record a landing page teardown for Shopify merchants. Interview ten Shopify agency owners. Build a tiny calculator that estimates bookkeeping cleanup costs. Or decide the space is way too crowded and move on. That's the point: graph engineering does not make the decision for you. It gives you a better way to produce the evidence you use to make the decision.

### Three levels of implementation

This is where people get too fancy too quickly. You see people on Twitter reaching for LangGraph or AutoGen or a custom agent framework on day one.

**Level 1 — run it manually.** For your first graph, run it by hand behind the scenes. I don't know why more people don't do this. The important thing is the structure: give each job its own lane. One lane does customer research, another does competitor research, another does distribution research. Then the checker lane attacks the evidence. Then the merge lane turns the surviving evidence into a recommendation. That is already graph engineering. Yes, it's slower than a fully automated system, but it's way easier to understand — and if the manual version doesn't produce way better work, automating it will just produce mediocre work way faster.

The first rep is to **draw the graph before you automate the graph**. I'd do this on a blank Excalidraw or tldraw board. Write the final outcome at the top. Draw the jobs: planner, customer researcher, competitor researcher, distribution researcher, skeptic, merge, human approval. Then draw the arrows: the planner feeds the three researchers, the researchers feed the skeptic, the skeptic feeds the merge, the merge feeds the human decision. That's enough.

**Level 2 — files in a repo.** Once that works three times manually, move to Claude Code, Codex, or a repo where each step writes files. The planner writes `plan.md`. The researchers write `customer.md`, `competitors.md`, `distribution.md`. The skeptic writes `review.md`. The merge step writes `recommendation.md`. What's cool is that it leaves a paper trail — you can see what happened, compare versions, and reuse the structure next week.

**Level 3 — orchestrate it.** LangGraph, AutoGen GraphFlow, n8n, Make.com, or your own small scripts. LangGraph is useful when you want state checkpoints, persistence, human-in-the-loop approvals, and more reliable control over how an agent workflow runs. AutoGen GraphFlow is useful when you want a directed workflow with sequential steps, parallel steps, conditional branches, and loops. n8n and Make are useful when the graph touches everyday business systems — Slack, email, Airtable, your CRM.

But the tool is not the point. The tool should come *after* the workflow. If you automate a workflow you do not understand, you get a mess. If you understand the workflow first, the automation becomes obvious.

### Three ready-made graphs

**Customer support.** Classify the issue — billing, product confusion, a bug, cancellation risk, something else. Check account context — new customer? high value? written in before? frustrated? Search the docs or internal policies (a wiki, a Notion board). Draft a reply. A checker reviews the reply for accuracy, tone, and risk. A human approves anything involving refunds, account changes, angry customers, legal risk, or promises the company might regret later. That's better than saying "AI answered the support ticket," because the ticket is not the real workflow — understanding, researching, drafting, checking, and approving is.

**Content creation.** Research, then a thesis, then examples, then a hook, then a script draft. Then a checker asks whether the examples are specific, whether the pacing works, whether the hook earns attention based on formats that are actually working, and whether the writing sounds like a person. Then the graph branches into title ideas, thumbnail concepts, captions, B-roll. That's closer to how a real content lead you'd hire would actually work.

**Coding.** Start with a plan. One agent edits the code, another reviews the diff, another runs tests, another checks the UI in a browser, another looks for edge cases — and then a human approves the pull request. That's basically where all the AI coding tools are going. The model writing the code is only one part of the workflow; the leverage is in the planning, testing, reviewing, inspecting, and deciding what's actually safe to ship.

And that's the important point. Graph engineering makes quality less dependent on someone remembering a perfect prompt. It makes reviews more consistent, delegation cleaner, approval more explicit. It gives you a place to add tools and memory and checks and permissions over time. It turns AI work from chat into an operating system — and that really does feel like living in the future once you get there.

### The trap: bigger is not better

More agents don't automatically mean better output. Sometimes more agents mean more noise. Sometimes it means five AI workers confidently repeating the same wrong idea. Sometimes the system spends more time coordinating than thinking. I've seen people go viral on X with these big, big graphs — that's not the goal.

The goal is the **smallest graph that improves the quality of the work.** A good graph should:

- remove fake waiting,
- separate workers from checkers,
- put human approval where mistakes are expensive,
- stop when the answer is good enough,
- and leave behind useful state — the notes, the evidence, the drafts, the sources, and the decision — so you can use it later.

That last point is underrated, because the real compounding value of graph engineering isn't that one task gets better. It's that **your work starts producing memory.** Every customer research graph creates better customer notes. Every content graph creates better examples and audience insights. Every support graph creates better product feedback. That's where context becomes the moat: the graph produces the work, but it also produces the memory that makes the next graph smarter. It becomes an asset.

### Building your first graph

1. Pick one workflow you already run with AI every week — researching ideas, preparing podcast episodes, reviewing landing pages, analyzing customer feedback.
2. Write the final output in one sentence. For example: *I want a one-page recommendation on whether this startup idea is worth testing.*
3. List the jobs a great human would do. They'd clarify the question, research the customers, research competitors, look for distribution, look for risks, check the evidence, make the recommendation.
4. Draw arrows only where the work actually depends on another step. Customer research and competitor research can happen at the same time. The skeptic needs the research before it can check it. The recommendation needs the skeptic's pass before it can merge the evidence.
5. Add one human gate before the expensive decision. If the output is a private memo, the gate can be light. If the output is a customer email, a public post, a code deploy, a refund, or anything touching production data, the gate has to be stricter.
6. Run it manually once. That's the whole first rep. You don't have to create a giant automation project — just create the jobs and the arrows.

After you do this once, you start seeing AI work differently. You stop thinking "what's the perfect prompt for this task?" and start thinking "what's the perfect workflow for this?" — and then you design a path that produces the answer.

That's why graph engineering is worth paying attention to. It's the next logical step after prompting. The people who get the most out of AI will be the ones who know how to break work into the right pieces, give each piece the right context, check the output, and keep the human in the right place.

So: pick one workflow you already run, draw the jobs and arrows, delete the fake waiting, run the independent jobs in parallel, add a skeptic, merge the survivors, and approve the final step yourself. There's your first graph. And once you have one graph that works, you're not just prompting AI anymore — you're managing AI work.
