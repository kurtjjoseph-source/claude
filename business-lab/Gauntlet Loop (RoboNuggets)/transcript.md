# This NEW Claude Prompting Technique is blowing people's minds (gauntlet-loop) — working transcript

**Channel:** Jay E | RoboNuggets — https://www.youtube.com/@RoboNuggets
**Video:** https://www.youtube.com/watch?v=BNjzXcEXmg4
**Length:** ~13:20 · solo episode, screen-share demos throughout

> **Note on this file.** This is a cleaned, condensed working record built from the auto-generated
> captions — filler removed, argument preserved in the speaker's first person, organised by
> section. It keeps every substantive claim, number, tool name and prescribed move, which is what
> the wizard is built from. It is not a word-for-word reproduction; watch the video at the link
> above for that.
>
> Auto-caption spellings corrected throughout: *Matt Schumer* → **Matt Shumer**, *Karpati* →
> **Karpathy**, *Entropic* → **Anthropic**, *Robbernuggets* → **RoboNuggets**. "Peg" is the
> speaker's own word for a reference image the build is matched against.

**Sections**

| | |
|---|---|
| 00:00 | The claim: one prompt, a whole playable game |
| 00:45 | Where it came from — Matt Shumer |
| 01:31 | What other people rebuilt with it |
| 02:18 | Why these demos matter — Karpathy on leaving the pelican test behind |
| 03:04 | The three lines |
| 03:51 | Three levels of working with an agent |
| 04:36 | Why a critic raises quality — and why that part is not new |
| 05:23 | What the gauntlet actually adds: a fleet of builder + critic pairs |
| 06:09 | No new tooling required |
| 07:41 | Test one — the Darling Point apartment |
| 08:26 | Watching it run |
| 09:13 | What it produced |
| 10:44 | Test two — the Ketone IQ landing page |
| 11:30 | The catch: it optimises whatever you point it at |
| 12:15 | How to actually use it — MVP first, gauntlet as warp drive |
| 13:00 | The skill |

---

## [00:00] The claim: one prompt, a whole playable game

There is a new prompting technique for Claude that has been blowing people's minds over the past
week. In a single prompt it builds fully playable games and hyper-custom 3D worlds — the kind of
thing Andrej Karpathy says might be the future of prompting LLMs.

The technique is called **the gauntlet loop**. It is probably the quickest way to learn how to fan
out sub-agents to do work for you, so even if you are not into game development you can add it to
your arsenal and instantly get better at agentic AI.

## [00:45] Where it came from — Matt Shumer

I first saw this from **Matt Shumer**, who posted a demo on X that already has something like
**4.8 million views**. His claim: **Claude Opus 5 one-shotted the entire game**, with everything in
the demo being custom code and **no external assets at all** — including sound.

If the name is familiar, Shumer also wrote the essay *Something big is happening*, which is sitting
at around **87 million views**. He has been working with AI for a long time and is a credible source
for a technique like this. A claim that an AI model one-shotted a game that looks this good should
make you sceptical — the graphics alone are extraordinary — but he then published an article
walking through exactly how he did it, and called the method the gauntlet loop.

## [01:31] What other people rebuilt with it

Since then people have used the same prompting pattern and hit the same build quality:

- the starting area of Pokémon, rebuilt in 3D
- a car racing simulator
- a Mario Kart-style kart racer, with distinct textures for road and houses and a genuinely absurd
  amount of environmental detail

You might not care about game development, and I will show non-game uses later. I still pay
attention to demos like these because they point at how much raw capability these models now have.

## [02:18] Why these demos matter — Karpathy on leaving the pelican test behind

Karpathy articulated it better than I can. Last weekend he posted that we are starting to leave the
territory where you test an LLM by asking it for an SVG of a pelican on a bicycle. His point is that
these examples are good precisely because **no one in their right mind would spend the time writing
something this custom — but models have all the stamina and patience in the world.**

Those hyper-custom worlds are a good marker of a new capability you can now tap into and could not
before.

## [03:04] The three lines

Shumer published his exact prompt, and it is surprisingly simple: **three lines**. What matters is
not the wording — it is the structure. Break it down and you get a prompt shape you can copy for
anything:

1. **The task** — what you want to happen. In his case, build a first-person shooter.
2. **The build method** — how the agent is going to get there. He asks the main agent to **fan out
   sub-agents**, have each tackle one task individually, and have a **separate sub-agent check it
   visually** to make sure it looks really, really good.
3. **The bar to hit** — the standard that decides when the agent is allowed to stop.

> "Do not stop until each sub-agent is utterly wowed with the quality when compared with the actual
> Call of Duty game."

Parts two and three are what make it effective. If you have never used sub-agents to orchestrate
work before, this is the easiest and quickest way to try it.

## [03:51] Three levels of working with an agent

Stepping back — there are three levels to prompting an agent, at least in how I think about it.

| level | who verifies | shape |
|---|---|---|
| 1 | **you** | You prompt, it answers, you judge it, you prompt again until it matches your standard. Most common. |
| 2 | **a critic agent** | The agent does the work *and* another agent plays critic. They talk to each other until the bar you set is met, and only then does the output reach you. |
| 3 | **a fleet** | The main agent fans out many builder sub-agents, each with its own critic partner, all converging on the bar before anything comes back. |

Level 3 is the gauntlet loop.

## [04:36] Why a critic raises quality — and why that part is not new

The idea of a verifier agent raising output quality is not new at all. Anthropic's article
***Building effective agents*** — from **2024** — reports the same finding: you generally get better
outputs when a second model takes the evaluator role.

That is not surprising if you think about how these models behave. **They tend to convince
themselves that what they produced is already good enough.** Having a different model validate it is
just good practice.

## [05:23] What the gauntlet actually adds: a fleet of builder + critic pairs

So looping is old. What the gauntlet loop takes to an extreme is the **build method** line: it
instructs the main agent — the one you are talking to — to orchestrate and fan out to a *fleet* of
sub-agents, **each of them with a critic partner**, so every part is checked against the bar you set
before the final output ever comes back to you.

## [06:09] No new tooling required

The good news about tools like Claude Code is that you do not need to learn any extra technical
tooling to do this. All you need is a well-structured prompt: instruct the main agent to fan out
sub-agents, have each tackle one task, have a separate sub-agent check the work, and hold all of it
to the bar you set.

That pattern is the thing to learn here. **There is really no reason not to adopt the same pattern
across any of your builds.**

## [07:41] Test one — the Darling Point apartment

I wanted to try it beyond games. If the prompt is this good at virtual 3D environments, then a few
months down the road — as models get more capable — this has a big impact on sectors like
**architecture and real estate**.

So the test I gave Opus 5: the **floor layout of a real real-estate listing at Darling Point,
Sydney**, plus **reference photos to match against** — living room, bedroom, and so on. Same three-part
structure as Shumer's prompt:

- **Task:** build an explorable 3D walkthrough of this apartment.
- **Build method:** break the goal into the smallest pieces and fan out sub-agents.
- **Bar:** do not stop until each critic is utterly wowed — each sub-agent has to verify the bar has
  been met.

I did not write that prompt myself; there is a skill at the end that generates one for any task.

## [08:26] Watching it run

When I sent it, Claude produced a plan with **room-builder sub-agents and their corresponding
partners — "blind critics."** In the Claude desktop app you can view these dynamic workflows: the
phases it planned, lighting first, then the rooms, then a phase where the sub-agents evaluate those
rooms, looping until the original bar is satisfied.

It ran for **around two hours and was still working.** It had already built an HTML progress report
for itself: the original reference photo on the left, the screenshot it took of its own 3D world on
the right. Already close — the kitchen counter, for instance. And still **marking the round as
failed** and iterating.

That is where a really high bar earns its keep: if you want it perfect and you are willing to let it
run for a couple of hours to get a showcase build, that is something you can just hand to Claude.

## [09:13] What it produced

Rather than wait, I opened what it had. You are in the living area; it even captured the painting.
The couches are not perfect. The kitchen counter has the marble finish from the reference. The
bedrooms captured the look, size and layout of the photos, though the textures would clearly improve
with more passes. **All of it one-shotted from the gauntlet loop prompt.**

## [10:44] Test two — the Ketone IQ landing page

The second test: a **front-end website design for the Ketone IQ product**. That run took **1 hour 19
minutes**. Same shape — several sub-agents fanned out to build, plus a **judging phase** where the
evaluator agents check the worker agents' builds.

What came out: a product page headlined "brain fuel", **dark mode and light mode**, scroll animations
with product detail. Opus also appears to have fanned out **research agents** to verify the numbers on
the page were correct.

## [11:30] The catch: it optimises whatever you point it at

On visual flair it is good — far from the usual AI vibe-coded look. But **visual flair is not the
only thing brands and clients look for.** Ketone IQ's actual website uses a quite different brand
design system to the one the agents invented.

So the gauntlet loop helps a lot — but **if you do not start with a really good minimum viable design
or product, all it does is optimise towards the wrong thing.** That matters more, not less, with a
powerful prompt structure, because these looping prompts **take a lot of time and tokens to finish**.

## [12:15] How to actually use it — MVP first, gauntlet as warp drive

The way I would use it going forward: **not as your initial prompt.** What happens there is that even
though the final output looks good, it may not be on brief and may be far from what you wanted,
because you let the agent choose the direction for you.

Instead: **start from a strong MVP — or a design system — and then introduce the gauntlet loop as a
warp drive** to sharpen and polish that MVP's quality. Then version two of the build not only looks
good, it sits on a good foundation and is on brief.

## [13:00] The skill

I built a skill called **`/gauntlet-loop`**. Give it a task and it writes the gauntlet loop prompt for
you. Link in the video description.
