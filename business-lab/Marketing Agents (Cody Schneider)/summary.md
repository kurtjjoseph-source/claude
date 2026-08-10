# Marketing agents — playbook summary

**Source:** [These AI Marketing Agents Get You Customers](https://www.youtube.com/watch?v=mD7JpNHLT70) — Greg Isenberg with Cody Schneider (Graft), 43 min
**Working transcript:** [transcript.md](transcript.md)
**Implementation wizard:** [wizard.html](wizard.html) → live at https://vom-agent-factory.vercel.app

---

## The one-sentence version

Stop targeting who people *are* and start targeting what they just *did*: monitor the ten to twenty
accounts your buyers actually engage with, harvest the engagers, enrich them cheapest-tool-first,
and reach them through a small piece of custom software that only calls an LLM at the two moments
judgement is genuinely required.

## The problem it solves

Every outbound channel is down, because AI made it free to flood every inbox on earth. Reply rates
collapsed. The response most people have — better AI copy, more volume — makes the problem worse.

The move is upstream of the message. **A LinkedIn engagement is a hand raise.** Someone who liked a
post about AI marketing this morning has told you their propensity, which is a far stronger buying
signal than firmographics, demographics or psychographics ever were. That list is small, fresh, and
almost nobody is building on it.

## The two agents

| | agent | loop |
|---|---|---|
| **1** | Outbound SDR | signal → ICP filter → waterfall enrichment → validate → send → inbox agent → booked call |
| **2** | Content engine | real conversation → insights → posts → multi-account scheduling → analytics → remix |

They share one architecture, stated three ways in the episode:

> A marketing agent is **code, maybe a thinking loop, and a live data stream.**

## The doctrine underneath (this is the transferable part)

- **Don't put God in a box.** Nobody should hand an LLM the ads account. Ask what the human actually
  did — researched angles, made creative, tested, pruned losers, promoted winners — then build
  software that runs *that* process.
- **Don't pay tokens for what CPU can do.** Pay the model to *write the software*, not to run every
  call. Inference belongs at the judgement points only: does this person fit the ICP, what should
  this reply say, which winner do we remix. Everything else is a script on a cron.
- **No framework.** "A lot of the time you don't need it, it's just bloat." Finite problem, simple
  solution, one server that is always on.
- **Outliers give you 80% coverage.** Ten to twenty accounts cover a niche. Everything past that is
  marginal return.

## 1 · The outbound agent, step by step

**Signal sources.** Find 10–20 accounts your buyer engages with — creators *and* company pages
(Clay's account works as well as a person's). Use the For You feed, not just search: the algorithm
already knows what is relevant in your niche. A client always already knows this list.

**Harvest.** Apify, using the API Maestro actors — *profile post scraper* for new posts daily, then
*post reactions* and *post comments* for the engagers. Claude Code or Codex reads the endpoint docs
and writes the script; you deploy the script, not the chat.

**Qualify before you spend.** The thinking loop sits *before* enrichment: research the person and
their company, employee count, fit. Only fits get enriched. Enrichment costs money per lookup;
qualification costs one cheap call.

**Waterfall enrichment.** Cheapest and most accurate first, then down the ladder:
GetLeads.io → Apollo → Prospeo / Origami, with Lead Magic for mobile numbers. Worked example: 50
profiles → 32 → 10 → the last 8, landing around an **80% find rate**. Origami will run the whole
waterfall for you from a LinkedIn URL.

**Validate.** MillionVerifier on everything before it ever gets sent. Invalid sends destroy
deliverability, and deliverability is the whole asset.

**Infrastructure.** Buy inboxes on **burner domains** — Hypertide, Inboxkit, or Instantly's own.
Never send cold from the domain the company runs on. Keep four domain sets apart: cold · email
marketing · transactional · business.

**Cost:** ~$100/month of inbox infrastructure for ~10,000 sends, plus Instantly from ~$97/month.
**About $200/month all in.**

**Send and reply.** Instantly for email, HeyReach or BotDog for LinkedIn DMs (plain InMail is
reportedly working well too). Then the piece that makes it an agent: **Instantly's webhook fires on
a positive reply**, into a small server-side agent with a base prompt, a booking link, and calendar
access, which answers questions, pushes toward a demo, checks whether the call was actually booked —
and re-touches everyone who went cold six months later.

**Where it runs:** Railway (or anything that is a computer left on somewhere else), ClickHouse if
you want the open-source warehouse for the data stream.

## 2 · The content agent, step by step

**Source material is the entire trick.** "Write good LinkedIn content" produces the most mid thing
imaginable — and now gets flagged by LinkedIn's own AI-slop detection. So: a weekly recorded
interview with each person (*what jumped out at you this week?*), or sales calls, or Slack, Notion
and Gong transcripts queried by an agent. The best post they cite is a prospect explaining *why they
didn't buy*.

**Write and schedule.** One LLM call per insight — Sonnet is more than good enough — into Ordinal,
which holds multiple LinkedIn accounts, has an API and MCP, and lets the accounts interact.

**Close the loop.** Ordinal returns per-post impressions across every account. That stream goes back
into the next writing cycle: which topics won, snowball or remix them.

**Remix on a 90-day clock.** His own Twitter and LinkedIn are "the exact same thing remixed every 90
days." Once your corpus is big enough you know what will work before you post it. Prospect for
winners; don't invent.

**The math that justifies it:** LinkedIn earned media runs about **$22 per thousand impressions**. A
500-follower account doing 1,000 impressions a post is ~$20 of media per post, free, and it compounds
across every account on the team.

**If nobody wants a personal brand:** build a theme page. Julian Shapiro didn't build @demandcurve,
he built @GrowthTactics — the topic collects the audience, the audience discovers the company.

## The tool stack, in full

He promised the whole list with no gatekeeping, so here it is in the order the data moves. Partner
disclosures are his own, stated in the episode.

| stage | tools |
|---|---|
| **Platform** | **LinkedIn** — it is the signal source, the DM channel *and* the publishing surface. Three jobs on one login. |
| **Harvest** | **Apify** (one API key, also does X) with the **API Maestro** actors: profile post scraper · post reactions · post comments |
| **Build** | **Claude Code** or **Codex** — reads the endpoint docs, writes the scripts |
| **Run** | **Railway** for the always-on server · **ClickHouse** for the open-source pipeline and warehouse |
| **Enrich** | **GetLeads.io** → **Apollo** → **Prospeo** / **Origami** (Origami also runs the whole waterfall for you) · **Lead Magic** for mobile numbers |
| **Validate** | **MillionVerifier** — good / catch-all / risky / bad |
| **Inboxes** | **Hypertide** (partner, ~$100/mo for ~10k sends) · **Inboxkit** · **Instantly's** own |
| **Send** | **Instantly** (~$97/mo, API + positive-reply webhook) · **HeyReach** or **BotDog** for LinkedIn DMs · plain **LinkedIn InMail** |
| **Book** | **Cal.com** / **Calendly** — the link, and the calendar the agent reads to confirm the booking |
| **Publish** | **Ordinal** (partner — multi-account LinkedIn, API + MCP, returns impressions) · **Claude Sonnet** for the writing |
| **Source material** | **Gong** transcripts · **Notion** · **Slack** |
| **Done for you** | **Graft** (graft.com) — the guest's own company: the platform plus forward-deployed engineers |

**The dependency nobody names in the episode.** Signal, DMs and content all run through one LinkedIn
account. Automated outreach runs against LinkedIn's user agreement, the platform enforces silently,
and a restriction takes all three channels out on the same day. Nothing in the machine is worth the
account: conservative daily invite volume, a warmed account that is not the one running client work,
and a fallback channel. The wizard's step 07 makes this an explicit decision.

## What to ignore

- **The compliance answer.** It is US-shaped: CAN-SPAM, "buying from a data broker is legal", "do
  your own research". Under GDPR and the Dutch Telecommunicatiewet, unsolicited commercial email is
  restricted for business recipients too, and an enriched broker address is personal data with
  disclosure duties attached. Nothing in this episode should be treated as a green light for a
  Netherlands-based sender. Not legal advice — this is exactly the question to put to the same
  Dutch lawyer already queued for the Turnkey terms review.
- **The volume framing.** 10,000 sends a month is an American SMB-agency shape. VOM's buyer count in
  its niche is in the hundreds, not the tens of thousands, and the signal list will be small — which
  is a feature, not a shortfall.
- **"The social media manager is dead."** Rhetoric. The useful half is the job decomposition he
  gives immediately afterwards: prospect ideas → make → publish → read impressions → remix winners.
- **Partner disclosures.** Hypertide, Ordinal, Origami and Apify's API Maestro are named as partners
  or preferred vendors. The pattern is right; the specific vendor is a choice, not a conclusion.

## What this means for VOM

The two agents are already named workstreams in Turnkey — this episode is a build spec for them:

- **W9 (leads & distribution)** wants a ≥50-prospect list and sequences in the owner's voice. The
  signal harvest is a much better list than any static scrape: for a church-media buyer, the
  ten accounts are the visible church-tech creators and the platform pages their staff follow.
  **The EU compliance rework points the same list at LinkedIn DM and content-led inbound rather
  than at cold email** — which is the safer half of the playbook anyway.
- **W8 (social delivery swarm)** is the content agent with an approval gate bolted on. VOM already
  runs strategist → copywriter → designer → scheduler → analyst; what is missing is exactly what
  Cody says is non-negotiable — a weekly recorded conversation as the source material, and the
  impressions stream feeding the next cycle. Both are cheap to add.
- **Engage AI** already measures the channels this would move, which turns the earned-media number
  from a claim into a monthly reported figure per client.
- **The doctrine is the real import.** "Pay the model to write the software, not to run the loop" is
  the sane cost posture for every agent VOM ships to clients on a monthly fee — inference at the
  judgement points, cron everywhere else.
