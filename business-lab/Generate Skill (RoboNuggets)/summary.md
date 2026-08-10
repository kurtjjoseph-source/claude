# Owning the generation layer — playbook summary

**Source:** [This 1 Claude Skill fully replaces your Higgsfield Subscription](https://www.youtube.com/watch?v=9C4TRbucmhQ) — Jay E | RoboNuggets, ~15:35
**Working transcript:** [transcript.md](transcript.md)
**Implementation wizard:** [The Render Desk](https://vom-render-desk.vercel.app) · [wizard.html](wizard.html)

---

## The one-sentence version

A creative-AI subscription is a thin wrapper over model APIs you can call yourself — so replace it
with **a written Claude skill that routes each generation to the cheapest working aggregator, refuses
to spend past a cap you set, and writes every prompt, cost and output file to your own disk**. You
stop paying for the month you didn't use, and you stop renting the rights to your own output.

## The problem it solves

A subscription like Higgsfield charges $49–79 a month whether you generate 400 images or four. That
alone is survivable. Three other things are not:

- **The terms.** The withdrawn draft said they could own what you generate. The published version
  still requires you to agree that your generations are used to run the service and to improve some
  of their models.
- **The deletion window.** Cancel and you have a limited window to download your own images before
  they are gone.
- **The menu.** Which models you can reach, at what resolution, under which "unlimited" caveat, is
  their decision — and it changes when their margins change.

None of those are price problems. They are **custody** problems, and no discount fixes them.

## The map

| | subscription (Higgsfield) | owned skill (`/generate`) |
|---|---|---|
| what you pay | fixed monthly, peak-priced | per generation, at cost |
| what you buy | credits inside their menu | a routed API call to any model |
| where output lives | their servers, with a deletion clock | your disk, with the prompt beside it |
| rights posture | they may use it to improve models | yours, untouched |
| model added | when they add it | when you paste a docs page |
| failure mode | their outage, their repricing | your fallback chain |
| what it costs to build | $0 | an afternoon and two API keys |

## 1 · The wrapper is not magic — it's documentation plus a bill

Strip the product down and it aggregates public model APIs: Nano Banana, Veo, GPT Image 2, Kling.
The speaker's own point is that the way you'd build it today is to **point an agent at the provider's
documentation page and let it wire the connection**. That's the whole moat. Aggregation has real
value — one key, one bill, one menu — but it is value you can now buy per-call instead of per-month.

## 2 · Three aggregators, and a routing order rather than a favourite

| | pick it for | the catch |
|---|---|---|
| **Kie.ai** | cost — the outlier, by a lot | reliability wobbles under demand |
| **fal.ai** | reliability + breadth (~500 models) | a few cents more per call |
| **WaveSpeed** | niche models fal doesn't carry | you're there for coverage, not price |

His stated default: **fal.ai for most projects**, Kie when cost is the deciding factor, WaveSpeed
for the niche. The skill doesn't choose once — it **tries cheapest first and falls through**:
Kie → fal → WaveSpeed. That fallback chain is the part worth copying; the ranking will be stale
within a quarter.

## 3 · The cost math, with its conditions attached

One model, one setting — **GPT Image 2, 2K, 1:1**:

| | per image |
|---|---|
| Higgsfield | ~$0.31–0.34 (plan-dependent) |
| fal.ai / WaveSpeed | slightly above Higgsfield |
| **Kie.ai** | **$0.05** — Kie's page: $0.03 / 1K, $0.05 / 2K, $0.08 / 4K |

**These are one person's screens on one day, quoted from Australia, for one model.** Read them as a
method, not a price list. Two honest qualifications the video makes itself:

- On **video** (Seedance 2 fast, 720p, 8s) the spread is small — Higgsfield and Kie are both cheap.
  If video is most of your volume, **price is not the reason to leave; custody is.**
- fal and WaveSpeed are *more* expensive per call than the subscription on this model. Pay-as-you-go
  wins on the months you barely generate, not on every call.

The real arithmetic is your own: monthly subscription ÷ your true per-generation cost = the volume
that justifies the plan. Below it you are buying optionality you don't use.

## 4 · The skill is a document, and the hard rules are the product

A skill is a written instruction file. What makes this one worth having is not the routing — it's
the constraints, because **an agent asked for 100 images will make 100 images and drain the credit**.

The rules that earn their place:

- **Quote the cost before submitting.** Non-negotiable; this is the one that prevents the drain.
- **A total budget per run**, set in the prompt (his demo: **$3** across three models).
- **Cheapest-provider-first routing**, with the fallback chain written down.
- **Load the reference images first** — the brand's past design systems go in before any prompt is
  crafted, so output lands inside the house style instead of near it.
- **Log everything**: prompt, model, provider, cost, output path. This is what makes yesterday's
  good result repeatable.

Four steps, in order: **route → load references and craft prompts → generate → log**. Prompts are
inspectable before anything is spent.

## 5 · The gallery is not a nice-to-have

You cannot judge images from a terminal. The generations folder auto-loads into a **masonry grid on
one canvas** — plus a **styles palette** where clicking a look copies its prompt *and its reference
file paths* to the clipboard, ready to send back to Claude.

That palette is the sleeper feature: it turns a style you liked once into a reusable asset. It's the
difference between a tool and a studio.

## 6 · Extending it costs one paste

Want a model the skill doesn't know? Open the provider's page, hit **copy the content for LLMs**,
tell Claude to add it to `/generate`, paste. That's the whole upgrade path — and it's why the
routing table above going stale doesn't matter much.

## What to ignore

- **The Kie-is-reselling-subsidised-subscriptions theory.** The speaker flags it as an unconfirmed
  guess and he's right to. Don't repeat it as fact — and note the implication he leaves unsaid: if
  that were true, that supply is exactly the kind that disappears without notice. Another argument
  for the fallback chain, not for the theory.
- **The dollar figures as a price list.** Australian pricing, one day, one model. Re-check before
  you quote them to anyone.
- **"Cheapest always wins."** His own default is the *more expensive* provider, because reliability
  beats five cents on client work. Cheapest-first is a routing rule, not a business strategy.
- **The website-in-one-prompt demo.** Real, and genuinely 70–80% of the way there — but that's a
  Claude Code capability, not something the `/generate` skill provides.

## What this means for VOM

This is the missing cost-and-custody layer under work VOM already does.

- **Forge / Turnkey.** Every archetype build wants hero imagery, brand-kit visuals and ad creative.
  A `/generate` skill with a **per-run budget cap** and a **per-client generations folder** turns
  that from an unmeasured overhead into a line item with a number next to it — which is the thing
  that makes it billable.
- **The artwork orchestrator.** The existing prompt-first local pipeline is the *craft* layer; this
  is the *routing and accounting* layer beneath it. Same output, now with a cost quoted before
  spend and a logged prompt beside every file.
- **Client custody as a selling point.** "Every image we make for you, and the prompt that made it,
  lives in your folder — not on a vendor's server with a deletion clock" is a clean differentiator
  against any agency running on a Higgsfield seat.
- **The first move is not building the skill.** It is the arithmetic: what VOM actually generates
  per month, against what a plan costs. The wizard does that first, on purpose.
