# Business Idea: Paid Membership Club + Digital Products (Built with Claude Code)

**Source:** The Calum Johnson Show with Oliur (@ultralinx) — "I Made $20,000 in 7 Days: The Fastest Way To Use AI Agents To Make Money" — https://www.youtube.com/watch?v=XWWbIDQuHJc (July 2026)
**Captured:** 2026-07-19 · Full transcript in [transcript.md](transcript.md)

---

## The idea in one paragraph

Build a **paid, members-only community platform** (content library + Discord + billing) yourself with Claude Code instead of paying $50K–$100K in development costs, and launch it to an existing audience. Oliur built digitalcreatorclub.com in **one weekend** with no database/API experience — payments, member accounts, Discord invites on purchase, content manuals, billing management — and did **~$20K in sales the first week, ~$40K total with minimal advertising**. The platform is one leg of a broader model: scalable digital products (he previously made $30K/month on Tumblr templates and $30K on AI-generated wallpapers) sold to an audience, with AI agents removing the historical cost barrier to shipping software.

## Why it works

1. **Development cost collapsed.** What used to require a $200K/yr developer or a $50K–$100K agency build is now a weekend of natural-language prompting. The moat is no longer "can you build it" but "do you have an audience and an offer."
2. **Charging is the quality filter.** Oliur planned to make it free; a friend stopped him. A price tag raises member quality dramatically — and his conclusion was to raise the price *further* to raise the bar of entry. Premium pricing is a feature, not a barrier.
3. **Scalable, not time-tied.** Client work caps out (~£500/day for UI/UX). Products + community + AI agents work 24/7 and decouple income from hours. Oliur now works 4–6 hours/day, one meeting a week.
4. **Refinement over one-shotting.** The build method: scaffold with one broad prompt, then iterate with small natural-language edits ("change this, add that"). Screenshot errors and paste them back for debugging. Anyone can do this within a week of starting.

## Key mechanics from the episode

- **Stack Oliur used:** Claude Code (in the Claude desktop app, not the terminal), Supabase + Sanity behind Digital Creator Club, Stripe-style payments, Discord for community, connectors/MCP (ClickUp, GitHub, Google Calendar, PayPal, n8n, Railway, Gmail, Drive) for data-driven workflows.
- **Division of labor:** Claude (chat) for questions → Claude Cowork for file/task automation and scheduled cadence jobs → Claude Code for building products.
- **Side use case worth stealing:** automated **sponsor/client performance reports** — have Claude Code pull a video's views/engagement/comments and generate a branded PDF report for the client. Agencies hire people for this; it's a productizable service on its own.
- **Beginner on-ramp he recommends:** build a personal website first (5 minutes), then build the website/app for your dream business idea; momentum compounds.

## Kurt's angle (fits existing assets)

This slots directly on top of the [[business-ideas-folder]] church niche from the AI Tools Assessment idea:

- **"Church Media Academy" membership** — a paid members-only hub for church media/communications volunteers and staff: manuals (livestream setup, YouTube/Facebook growth, Engage AI benchmarking playbooks), a private community, and monthly office hours. Vision Outreach Media + the Engage AI scans are ready-made content and lead sources; the €999 AI Ministry Assessment becomes the top-of-funnel, the membership the recurring back-end.
- Priced membership doubles as the quality filter the episode stresses — churches that pay engage.
- The sponsor-report mechanic maps to Engage AI: auto-generated monthly PDF engagement reports per church as a retention feature of the membership.

## Getting-started checklist

- [ ] Pick the niche and promise (recommended: church media teams — audience already exists via Vision Outreach Media / Engage AI contacts)
- [ ] Write the offer one-pager: what's in the club (content manuals, community, monthly report, office hours), price (start €29–49/mo or €299/yr; don't launch free)
- [ ] Build v1 with Claude Code in a weekend: landing page + Stripe checkout + member login + content area + Discord auto-invite on purchase
- [ ] Seed 5–10 content "manuals" from existing material (livestream SOPs, church-stream-setup workflow, Engage AI benchmark guides)
- [ ] Set up the automated monthly engagement PDF report per member church (Engage AI scan → PDF) as the flagship retention perk
- [ ] Soft-launch to existing contacts (Church of God Amersfoort network, past assessment leads) before any paid ads
- [ ] Target: 10 founding members in 30 days; raise price after founding cohort
- [ ] Iterate weekly from member feedback — refine, don't one-shot

## Risks / open questions

- Audience size: Oliur launched to a large existing audience; Kurt's church network is smaller — founding-member outreach must be personal, not broadcast.
- Churn: membership needs a recurring reason to stay (the monthly report + community activity carry this).
- Don't over-build v1 — payments, login, content, Discord invite. Everything else after first 10 members.
