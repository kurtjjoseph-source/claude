# These AI Marketing Agents Get You Customers — working transcript

**Channel:** Greg Isenberg — https://www.youtube.com/@GregIsenberg
**Video:** https://www.youtube.com/watch?v=mD7JpNHLT70
**Guest:** Cody Schneider (Graft — graft.com)
**Length:** 43:42 · interview + screen-share walkthrough, two agent builds

> **Note on this file.** This is a cleaned, condensed working record of the episode built from the
> auto-generated captions — filler removed, the argument preserved in the speakers' first person,
> organised by section. Tool names mangled by the captions have been normalised to their real
> spellings (Apify, GetLeads, Prospeo, Calendly, graft.com). It keeps every substantive claim,
> number, tool name and prescribed move, which is what the wizard is built from. It is not a
> word-for-word reproduction; watch the video at the link above for that.

**Sections**

| | |
|---|---|
| 00:00 | Marketing agents are the new coding agents |
| 02:18 | What we are building: signal → enrichment → outbound → inbox agent |
| 03:03 | Why signal beats firmographics |
| 04:37 | Finding the signal sources |
| 07:42 | The outlier doctrine — 10 to 20 accounts is 80% of a niche |
| 08:28 | Apify: post scraper, reactions, comments |
| 10:47 | Building it in Claude Code, running it on a cron |
| 13:03 | What makes it an agent and not an automation |
| 13:49 | The ICP thinking loop, before you spend enrichment credits |
| 14:36 | Don't put God in a box — copy what the human actually did |
| 15:21 | Don't pay tokens for what code can do |
| 15:50 | Waterfall enrichment |
| 18:27 | Validate before you send |
| 21:30 | Inbox infrastructure and burner domains |
| 22:51 | Domain separation: cold · marketing · transactional · business |
| 23:01 | What it costs |
| 24:35 | LinkedIn DMs |
| 25:21 | The inbox agent |
| 27:39 | Simple beats frameworks |
| 28:26 | Where this runs |
| 31:31 | Agent two: the organic content engine |
| 33:02 | Source material is the whole trick |
| 35:19 | Writing and scheduling across accounts |
| 36:05 | The analytics stream feeds the next cycle |
| 36:51 | What a great social media manager actually did |
| 38:22 | Prospect for winners, remix every 90 days |
| 39:54 | The earned media math |
| 40:39 | If you don't want a personal brand: theme pages |

---

## [00:00] Marketing agents are the new coding agents

**Greg:** Marketing agents are the new coding agents. Coding agents were a big deal because people
could create software on demand; marketing agents matter because you get customers on autopilot.
This is my most requested episode in a long time. Cody is back to share how to use Codex or Claude
Code to build these, and the other twenty tools you need for the marketing infrastructure around
them. Last episode we shared one agent and people weren't satisfied with one — today you get two,
end to end, no gatekeeping.

**Cody:** I'm going to teach you to build an AI agent that does cold outbound on both email and
LinkedIn, and then a second one that runs organic content. Don't buy a course. DM me and I'll teach
you anything.

## [02:18] What we are building

The system monitors the LinkedIn posts of influencers in your niche, extracts the people who
engaged with those posts, runs a **waterfall enrichment** to find their emails and phone numbers,
and then runs an outbound motion — cold email plus LinkedIn DMs. Then an agent is wired to both
inboxes: it answers questions and pushes people toward booking a demo.

## [03:03] Why signal beats firmographics

Cold email is getting decimated right now. Reply rates are down. Honestly every marketing channel
is down — AI slop is flooding the zone and it's red ocean everywhere.

The way we've found you can still stand out is to look for **signals or triggers that show people
are hand-raising**. A LinkedIn engagement is exactly that: when someone likes or comments on
content about a topic, that is a hand raise saying *I have an interest in this thing*.

> Traditional outbound targets firmographics, demographics, psychographics. This targets
> **propensity** — they have a demonstrated interest in this topic, and we go get in front of them.

## [04:37] Finding the signal sources

Go to LinkedIn and find the influencers in your category. Last episode's example was AI for
WordPress — that's actually a bad category here, the signal is thin. AI marketing is better.

**Greg:** What makes a good search?

**Cody:** It's really just: is the content being served what your target customer would be
interacting with? I use the For You feed of these algorithms — they're so good now that the feed
shows you what's relevant to your niche. You can use search too; we used to search and find the
trending posts from a period.

Then I build a spreadsheet of all of those creators. **It can be business accounts too** — people
don't realise that. If your target customer interacts with a company account like Clay's, that
account works as a source just as well.

**Greg:** And you're doing this manually — why not use agents for it?

**Cody:** When we work with a business, they already know who their target customer interacts with.
You need about **10 to 20 of these accounts** and you have more than enough to source the lead
volume that makes this a viable channel.

## [07:42] The outlier doctrine

In reality there are a handful of outliers in any niche and everybody is engaging with those
outliers. **If you just monitor those, you get roughly 80% surface-area coverage of the entire
industry.** The marginal return on going after all of it isn't there.

Same idea solves the entropy problem in paid ads: if you put an agent in a loop it makes the same
ideas over and over. So you find ten human creators on Instagram, track what they publish, look for
the outliers, and pull the new hook format or new topic from there and remix it.

## [08:28] Apify: post scraper, reactions, comments

Apify is a scraping API — one API key that lets me scrape LinkedIn, X, all these channels. It's how
I get data into the context of my agent so it can make decisions.

The actors we use are from **API Maestro**, which has a lot of LinkedIn ones and — the hard part —
actually maintains them. The two you need: **post reactions** and **post comments**. Plus the
**profile post scraper** to find each account's new posts. Your coding agent (Claude Code, Codex)
calls those endpoints through the Apify API key.

## [10:47] Building it in Claude Code, running it on a cron

I keep the Apify API key saved locally in the directory I do all my growth work out of. I had the
agent read the endpoint docs and write the script. Then I hand it a post URL and say *extract the
engagers using the Apify API key*, and it runs.

To make it an agent, take that code and deploy it to the cloud: **on a daily cadence, check for net
new posts** from each profile, extract the post URLs, then extract the engagers from each new post.
In the demo run: 63 raw engagers, deduped by public profile.

> Once you have those LinkedIn profiles, it's game over. You can find their email addresses, their
> phone numbers, everything you need for cold outbound.

## [13:03] What makes it an agent and not an automation

**Greg:** What makes this an agent versus a marketing automation?

**Cody:** The agent component is that it runs on a cron daily, and later it's responding in the
inbox. People ask me this on every sales call. The way I think about it: **it's something doing a
job to be done.** The job here is finding leads, outbounding to them, and responding as they ask
questions.

> What is a marketing agent, really? It's code, maybe a thinking loop, and a live data stream.

## [13:49] The ICP thinking loop

Extend it by having it qualify before it enriches: *agent, research this person and the company
they're at — how many employees, all of these things.* If they fit the customer profile, they go
into the enrichment and then the cold email. That's where the thinking loop lives.

## [14:36] Don't put God in a box

Everybody tried to put God in a box and give it access to a Facebook ads account, and we learned
that is not the way to do this at all.

The right way: **ask what the human was doing.** A top media buyer researched creative angles, made
new creative, tested it, pruned the losers, promoted the winners. So go build a piece of software
that does that exact process. When you hear "agent", think software with maybe a thinking loop.

## [15:21] Don't pay tokens for what code can do

> You should not be paying Anthropic or ChatGPT to make an API call. You should be paying them to
> **make the software** that uses CPU to do the call. Why are you paying a tax on tokens every time
> you run a marketing activity?

My co-founder Max's firm belief: **the only agent is a coding agent** — everything else is software
that the coding agent made. Only use inference when you actually need it. If you have an LLM run
your Facebook ads there's a high likelihood it nukes the account; custom software built to run the
process a real human ran gives you totally different, higher-quality outcomes.

## [15:50] Waterfall enrichment

Take the LinkedIn profiles and find emails, then phone numbers, cheapest and most accurate first,
then down the ladder:

1. **GetLeads.io** — aggregated B2B contact database with an API.
2. **Apollo** — for whatever GetLeads didn't find.
3. **Prospeo / Origami** — the more expensive tail. Origami aggregates the whole waterfall for you:
   send a LinkedIn profile, it walks the options itself.
4. **Lead Magic** — what we use specifically for mobile phone numbers.

The mechanic: 50 LinkedIn URLs → GetLeads finds 32 → the remaining 18 go to Apollo → that finds 10
→ the last 8 go to Prospeo or Origami. **You get to roughly an 80% find rate**, and you can chain as
many of these as your budget allows.

**Greg:** Dumb question — is getting these emails legit?

**Cody:** Getting them is legit; what you do with them is where compliance changes. In the United
States you can cold email, and you can add people to a newsletter and be CAN-SPAM compliant — there
is a checklist of things you have to do. Finding the contact is buying data from a data broker,
which is legal. On the black-hat/white-hat spectrum this is pretty far toward white hat.

**Greg:** Nobody would mistake you for a lawyer.

**Cody:** Totally — take it with a grain of salt. Compliance differs by state, and **the EU is
totally different**. Do your own research.

## [18:27] Validate before you send

Send the found emails to **MillionVerifier** to check whether each is good, catch-all, risky or bad.
The emails coming out of GetLeads and Apollo need that second verification. **Only send cold email
to valid addresses** — sending to invalid ones wrecks your deliverability.

## [21:30] Inbox infrastructure and burner domains

You have to buy inboxes. Options: **Inboxkit**, **Instantly's** pre-built inboxes, or **Hypertide**,
who we partner with and who I think are some of the best.

What you're really buying is **inboxes on burner domains** so you never send cold email from your
core domain. Send 10,000 cold emails from your real domain and you nuke the deliverability of the
domain your company runs on.

## [22:51] Domain separation

Keep four sets of domains apart:

| | |
|---|---|
| **cold** | burner domains, cold outbound only |
| **email marketing** | newsletters, broadcasts |
| **transactional** | product email — password resets and so on |
| **business** | what your team actually uses to run the company |

## [23:01] What it costs

With Hypertide we can send about **10,000 cold emails a month for ~$100/month** in inbox
infrastructure. Inboxkit is priced about the same and runs sales often. Instantly starts around
**$97/month**. All in, **about $200/month** to get going: sending software plus inboxes.

## [24:35] LinkedIn DMs

For the DM side, use **HeyReach** or **BotDog** — both have APIs and run LinkedIn DM campaigns from
your accounts. I also know people getting incredible results right now with plain LinkedIn InMail
on this same strategy.

## [25:21] The inbox agent

Instantly's API lets you monitor and manage the whole account — an agent can write copy for each
individual person and push it in as variables.

The bigger thing is **webhooks**: when a positive reply comes in, the webhook fires to your agent on
a cloud server. You give that agent a base prompt — here's your context, your goal is to get people
to schedule a demo on this link — and it manages the inbox, answers questions, pushes people deeper.

What gets powerful: it can do **follow-ups months later**. Program it to re-reach out to people who
went cold every six months. Plug it into **Calendly or Cal.com** so it can see whether the person
actually booked the discovery call — the action you're optimising for.

> That's an SDR in a box: it finds people from their social engagement, finds the emails, writes the
> emails, decides ICP fit, sends through the sending platforms, and manages the inboxes.

## [27:39] Simple beats frameworks

When I say the agent manages the inbox, it's literally just code under the hood with an LLM
attached. That is an agent. You don't need God in a box managing an email inbox.

People ask if you need an agent framework underneath. A lot of the time you don't — it's bloat. Have
a very simple solution for a finite problem. It does not have to be overengineered.

## [28:26] Where this runs

Set up a server — something like **Railway**. At Graft we have the data pipeline and warehouse
(**ClickHouse** is the open-source route) and then the server the agents deploy to, running off the
live data streams.

**Greg:** You're using a harness like Claude Code or Codex to build it. The hard part is the
strategy: who you're going after, why, and the tool stack. We're all in the software factory
business now.

**Cody:** If you can build it in Claude Code and run it locally, you can probably deploy it to a
server and run it hourly or daily. The challenge is the infrastructure the agent needs. And a
server, for the uninitiated, is just a computer that's on all the time somewhere else that you put
code onto.

## [31:31] Agent two: the organic content engine

The question we got asked: how do we make social content on LinkedIn at scale for an entire team —
seven-person sales teams that want everyone posting daily, with unique ideas.

The loop: interview them → take the transcripts → pull out the insights → the insights get written
into posts → the posts get scheduled automatically to their LinkedIn accounts through **Ordinal**.

## [33:02] Source material is the whole trick

Record a conversation. I have a weekly one-on-one where I just interview them: *tell me everything
you learned this week, what jumped out at you in sales calls.* It needs no focus. Works for
technical people too.

It doesn't even have to be an interview. It can be sales calls or internal comms. Alex Lieberman
talks about this — enormous context is already sitting in Notion, the codebase, Slack. Point an
agent at those sources: query the sales channel, query the Gong transcripts. A lot of the time
there's genuinely good content trapped in there — a prospect explaining *why they didn't buy* turns
into an unbelievable post.

**Why source material is non-negotiable:** if you just tell the agent "write good LinkedIn content"
it's the most mid thing imaginable. You waste the reader's time, or you get flagged by LinkedIn's
new AI-slop detection that shipped this morning. Original ideas come from real human conversation.
The source can be someone else's too — a podcast with Naval, this podcast, anything.

## [35:19] Writing and scheduling across accounts

Take the source material, make an API call to an LLM — Claude Sonnet is more than good enough on
the writing side. Then schedule the written posts with **Ordinal**, which holds multiple LinkedIn
accounts, lets them interact with each other, and exposes an API and MCP.

## [36:05] The analytics stream feeds the next cycle

Ordinal also pulls the LinkedIn analytics back in — impressions per post, across every account. That
data stream goes back to the agent: *this is what's getting impressions, go make more like it.*
Topics like this perform better based on the source material we pulled — how can we **snowball or
remix** them? That's where the LLM thinks on top of the data stream.

## [36:51] What a great social media manager actually did

The social media manager job, full stop, I think is already dead — or it evolves into the social
media *agent* manager. If you're listening: learn to make and manage content at scale across many
accounts. The meta is one person running 10, 20, 100 accounts across channels.

An excellent one used to: prospect for ideas → make content about them → publish → look at which
got the most impressions → turn the winners into a recurring calendar and remix them.

## [38:22] Prospect for winners, remix every 90 days

My Twitter and LinkedIn are the exact same thing remixed **every 90 days**, full stop. Once you have
a big enough corpus you know what's going to go viral. I have posts I've used for two years — I know
it works every time I post it. You can't post it every day; you post it every 90 days.

Same mentality as product. First-time founders think *how do I get the market to buy this*. The pros
ask **what does the market already want to buy — can I build it and sell it to them?** I don't want
to invent a new idea. Content works the same way: mine what already had a viral moment, then put
your own angle on it.

## [39:54] The earned media math

**Greg:** You get millions of free impressions a month — the platforms literally pay you.

**Cody:** I get paid to build lead pipeline. Founders ask why I'd invest in social. Look at the
earned media: on LinkedIn the average is about **$22 per thousand impressions**. Even an account
with 500 followers can get a thousand impressions on a post — that's ~$20 you put in your pocket for
free, per post.

## [40:39] If you don't want a personal brand: theme pages

**Greg:** If you don't want a personal brand, have people on your team have one. Or build
**theme-based pages**. Julian Shapiro ran a growth agency called Demand Curve — he didn't build an
account called @demandcurve, he built **@GrowthTactics**. People interested in growth tactics follow
it and then learn about his agency and products. Others do it as meme pages, like Chase Passive
Income. You can garner attention for free and use it to drive inbound for whatever you're building.
It doesn't have to be you — it can be an anonymous page that still provides value by aggregating and
organising something for the internet.

## [43:42] Close

**Cody:** Find me on Twitter and LinkedIn. If you want these exact agents deployed, go to
**graft.com** — we have the platform and we forward-deploy software engineers to do the
implementation. Fast-growing companies are where we see the most success.
