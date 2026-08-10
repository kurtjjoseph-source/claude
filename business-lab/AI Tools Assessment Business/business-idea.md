# AI Tools Assessment Business ("The $1,000/hour Solo AI Business")

**Source:** [The $1,000/hour Solo AI business (Full Course)](https://www.youtube.com/watch?v=dhbcVxYhWaQ) — Greg Isenberg podcast, guest Corey Gannon
**Captured:** 2026-07-18 · Full transcript in [transcript.md](transcript.md)

## The Idea in One Paragraph

A productized consulting service for small business owners: a **$999 "AI Tools Assessment."** You interview the owner for 45 minutes, find their biggest time drains, and prescribe 3–7 off-the-shelf AI/SaaS tools that reclaim 5–10 hours per week — like a doctor writing a prescription. You build nothing and implement nothing at this stage. The assessment is a foot-in-the-door offer: ~50% of clients ask for implementation help, which upsells into $1.5K–$8K projects and a $1,200–$2,000/month "AI Concierge" retainer that works out to ~$1,000/hour. No audience, no capital, and no coding required.

## Why It Works

- Millions of small businesses; maybe ~5% use any AI beyond prompting ChatGPT. Owners are stressed about falling behind but too busy (40–60 hr weeks) to learn.
- **Risk-reversed offer:** "If we can't find at least 5 hours/week of AI opportunity, 100% money back. Worst case you lose 45 minutes." Average client reclaims ~7 hours/week for ~$60/month in tool costs — four-figure monthly net ROI, minimum.
- An audit is the perfect tripwire: **the client pays you to uncover reasons to pay you more.**
- Corey's 2026 numbers: ~15 assessments sold; concierge retainer hit $8K MRR in 10 days (closed 5 of the first 6 people pitched). Client LTV: $3K–$10K+.

## Target Client

- Small business owners, **2–20 employees, $500K–$5M revenue**.
- Niche down to win: be the AI person for a **geography** (e.g. "the AI guy in Charlotte") or a **vertical** you know (e.g. "AI assessments for financial services"). Niching supports higher prices and resists pricing pressure.

## Fulfillment: The 4 Phases

**Phase 1 — Discovery call (45 min, recorded).** AI note-taker on the call (Fathom/Otter/Fireflies). Only probe, never pitch or prescribe. Questions: "Walk me through yesterday." "What tasks do you dread?" "Where does work pile up?" "What have you tried to automate that failed?" "If you could wave a magic wand and delete any process, which one?" (Most common answer: email.)

**Phase 2 — AI analysis of the transcript.** Feed the transcript to Claude: *"Attached is a transcript of my call with a business owner. Research off-the-shelf SaaS or AI tools that fix the pain points mentioned."* Build this into a Claude skill; feed finished past reports back in so it learns what good looks like (first 2–3 assessments the output is ~60–70% there; by #5–6 it's often copy-paste). **QA step:** sanity-check tool fit — swap Salesforce for a small-biz CRM for a 4-person landscaping company. Research directories: **futurepedia.io** and **theresanaiforthat.com** (tagged by industry).

**Phase 3 — The report (client-facing deliverable).** Built in Claude Designer (previously Gamma), templatized. Corey open-sourced his exact template at **audittemplate.ai**. Slides:
1. Title (client, date, business type, primary focus)
2. Executive summary — top 1–2 pain points, main outcome, hours reclaimed/week (guarantee ≥5, avg 7), primary focus = which ROI lever: **effectiveness (make money), efficiency (save time), or quality**
3. Effort vs. Impact matrix — report focuses on the "quick wins" quadrant (high impact / low effort)
4. Quick-wins summary — one-liner pain point → tool (e.g. "5 hrs/week in email → SaneBox"; "manual meeting notes → Fathom")
5. Recommended solutions (deep dive; ~50% of the review call) — per tool: pain point solved, cost, setup time, hours saved
6. Four-day quick-start plan — one 5–10 minute action per day so clients don't freeze ("a confused mind doesn't implement, doesn't get ROI, doesn't upsell")
7. "What comes after quick wins" — the high-impact/high-effort **major projects** quadrant; this tees up the upsell ("can you help us do that?")
8. Financial impact — monthly net ROI = weekly hours returned × their hourly rate − monthly tool cost (~$60 avg)
9. Next steps — do the 4-day plan, book the review call

Keep it stupid simple; Corey iterated on the report 12 times, mostly deleting.

**Phase 4 — Review call (30 min).** Email report beforehand, screen-share and walk through each recommendation. Three closing questions: *Which recommendation is most urgent? Do you want to do this yourself, or would you like my help implementing? What's your timeline?* → 50–60% ask for implementation.

## Upsell Menu (after the $999 door-opener)

| Upsell | What it is | Price point |
|---|---|---|
| Process redesign | Fix a broken process before automating (16 steps → 7); deliverable is the future-state process map | $3K–$3.5K |
| Simple automation build | Zapier / Make / n8n flows for cut-and-dry 1–3 step processes | ~$1.5K |
| Knowledge system | e.g. custom GPT trained on a business broker's listing package — killed 400–500 repetitive buyer emails per listing | project or retainer |
| Custom workflows | Claude skills + reference files for their proprietary processes; train the team ("90% of the time the answer is a Claude skill") | ~$3K + maintenance retainer |
| Full implementation | Any combination of the above | ~$8K packages |
| **AI Concierge** (favorite) | See below | $1.2K–$2K/month |

**Closing trick:** credit the $999 assessment toward the implementation ("instead of $5K it's $4K") — and mark the upsell up $1K beforehand so you net the same. Retainer variants: "$3K/month for up to 2 knowledge systems" or "$2K/month for up to 3 automated workflows."

## The AI Concierge (the $1,000/hour part)

Done-with-you retainer: **two 45-minute Zoom working sessions per month** where the client screen-shares and you help them use Claude Cowork and build Claude skills, plus unlimited Voxer access with a 12-business-hour response time (huge perceived value, near-zero actual workload). Corey's roster: 5 clients at $1,200 / $1,500 / $1,500 / $1,800 / $2,000 per month — raise the price on each new client; cap seats for legitimate scarcity ($1,500/mo ÷ 1.5 hrs = $1,000/hr effective).

- **Call 1:** foundation only — a guided-onboarding Claude plugin connects their tools, context files, global instructions, scheduled tasks, first skill.
- **Every call after:** run **AOA** on one workflow — **Audit** (show me how you do it), **Optimize** (13 steps → 7), **Automate** (turn it into a Claude skill). Rinse and repeat.
- **Premium feel:** pre-engagement Google Form ("What would make this a win in 90 days?" — then hit it and remind them), and a Notion one-pager per client with a running inventory of everything accomplished, emailed after every call. That inventory is what makes them keep paying.
- Greg's tip: tiered scarcity pricing on the landing page (4 spots at $800/mo → then $1,200 → then $1,600).

## 7 Ways to Get Clients (no capital, no audience)

1. **Host a local "AI for Business" meetup** — barter a free conference room from a coworking space by bringing them 30 local owners; give a 20-min "how to use Claude" talk; collect contacts at the door; follow up within 24 hours offering the assessment. Compounds like SEO (clients come from events 3–6). Monthly event brand.
2. **Door knocking** — immediate results; one listener knocked 30 local service businesses → 5 meetings → 2 clients. Nobody does it, which is why it works.
3. **LinkedIn DMs** — target local owners; probe about pain and how they use AI; never pitch in message one; voice notes/Looms; "I probably live down the street from you" hook.
4. **Free mini-audits for your network** — gym, church, other parents: "15 free minutes, I'll show you one AI tool for your business." Worst case they learn a tool; full assessment is the upsell.
5. **Agency/professional partners** — accountants, insurance agents, marketing agencies whose clients ask them about AI; offer referral fees; follow up every 2–3 weeks; co-branded workshops. Combine with #1 (Corey's first meetup, partnered with a plugged-in realtor, produced a client).
6. **AI office hours at a coworking space** — sit there one hour a week as the free AI resource; win-win-win. (Dennis: 10 spaces pitched → 2 yes; door-knocked $175 in gift-card giveaways; 11 attendees; 2 follow-up calls.)
7. **Post your wins / build in public** — small wins count ("answered someone's ChatGPT question well" is content); or a 90-day daily-prompt content commitment until real results arrive.

Persistence edge: most people quit these after 3 days — hang in for 7 and you're in the top 0.001%.

## Key Principles

- **Prescribe, don't build** (at the assessment stage). Many prescriptions are plain SaaS the owner didn't know existed.
- **A confused mind doesn't buy, implement, or upsell** — ruthlessly simplify every deliverable.
- Every recommendation must pull one of three levers: **make money, save time, or raise quality.**
- Focus: master the assessment plus **one** upsell specialty first.
- Scaled version: once the system is solid, put ~$200 of each $999 into Meta ads → a self-liquidating funnel that pays you to acquire upsell customers.

## Getting Started Checklist

- [ ] Pick a niche: geography (local) or a vertical you have credibility in
- [ ] Download the report template from audittemplate.ai (or rebuild the 9-slide structure above)
- [ ] Write the discovery-call question script (Phase 1 list)
- [ ] Build the Phase-2 Claude skill: transcript in → researched tool prescriptions out; bookmark futurepedia.io + theresanaiforthat.com
- [ ] Set up an AI note-taker (Fathom is what Corey uses)
- [ ] Do 2–3 free/discounted assessments for people in your network to tune the skill and collect testimonials
- [ ] Choose one client-acquisition method as the mainstay (meetup or office hours have the best compounding) + one immediate method (network mini-audits or door knocking)
- [ ] Define your upsell specialty (AI Concierge recommended) and its pricing ladder
- [ ] Set up the concierge machinery when needed: onboarding form, per-client Notion hub, Voxer
