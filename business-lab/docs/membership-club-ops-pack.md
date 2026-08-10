# Membership Club — Business Ops Pack

_Generated 2026-07-19 by the Membership Club Ops Wizard_

## Foundation
- **Audience:** —
- **Promise:** —
- **Founder credibility:** —
- **Existing assets:** —

## Offer & pricing
- **Flagship perk:** —
- **Pricing:** €?/mo · €?/yr · founding €? (cap 10)

## Build
- **Stack:** Stripe · Discord · Vercel

## Seed manuals
_none yet_

## Launch
- **Date:** — · **Invites:** —
- **Warm list:** —

## Current numbers
- Members: 0 · joined 0 · cancelled 0

## AI prompts

### Build prompt
```
You are building v1 of a paid membership platform. Work in this empty folder.

CLUB: (unnamed membership club)
AUDIENCE: (audience not defined yet)
PROMISE: (promise not defined yet)
FOUNDER CREDIBILITY: (not provided)
EXISTING ASSETS: (not provided)
PERKS: (none selected yet)
FLAGSHIP PERK: (not defined)
PRICING: €?/month, €?/year, founding price €? (cap 10 members)

STACK:
- Payments: Stripe (subscriptions: monthly + yearly + a founding-member price)
- Community: Discord (auto-invite on successful payment)
- Deploy target: Vercel
- Keep the stack boring and maintainable: Next.js (or plain Node + templates if simpler), a hosted Postgres (e.g. Supabase) for members/subscriptions, transactional email for welcome + invite mails.

BUILD EXACTLY THIS SCOPE, NOTHING MORE:
1. Landing page: headline from the PROMISE above, perks list, one testimonial slot, pricing section with the founding-member offer, join button into checkout.
2. Checkout wired to Stripe test mode.
3. Member auth (magic-link email login) + account page: subscription status, manage billing, cancel flow that actually works.
4. Members-only content area listing manuals (markdown files in /content rendered server-side).
5. On successful payment: create member record, send welcome email, send Discord invite link.

WORKING RULES:
- Ask me clarifying questions before scaffolding if anything above is ambiguous.
- After scaffolding, show me a preview and iterate in small steps; do not one-shot the whole build.
- Explain anything I need to configure manually (API keys, webhook URLs, DNS) as a checklist at the end.
- Write a README with how to run locally and how to deploy to Vercel.
```

### Content prompt
```
You are the content editor for my paid membership club.

CLUB: (unnamed membership club)
AUDIENCE: (audience not defined yet)
PROMISE: (promise not defined yet)
FOUNDER CREDIBILITY: (not provided)
EXISTING ASSETS: (not provided)
PERKS: (none selected yet)
FLAGSHIP PERK: (not defined)
PRICING: €?/month, €?/year, founding price €? (cap 10 members)

SEED MANUALS TO PRODUCE:
(I'll give you titles — propose 5 based on the assets above)

TASK:
For each manual, interview me first: ask me the 5–8 questions you need to extract what I already know and do (my SOPs, examples, numbers, mistakes). Then write the manual in this fixed format:
- Who this is for and the outcome (2 sentences)
- The system, as numbered steps with my real examples
- Templates/checklists the member can copy
- Common mistakes and fixes
- A 15-minute quick start

VOICE: practical, first person, no filler. A member should be able to act on each manual the same day. One manual at a time; wait for my answers before writing.
```

### Launch-kit prompt
```
You are helping me launch my membership club to founding members.

CLUB: (unnamed membership club)
AUDIENCE: (audience not defined yet)
PROMISE: (promise not defined yet)
FOUNDER CREDIBILITY: (not provided)
EXISTING ASSETS: (not provided)
PERKS: (none selected yet)
FLAGSHIP PERK: (not defined)
PRICING: €?/month, €?/year, founding price €? (cap 10 members)

LAUNCH PLAN:
- Target launch date: (not set)
- Personal invitations to send: 30
- Warm list sources: (not provided)

PRODUCE, in my voice (drafts, then refine with me):
1. A PERSONAL INVITE message (email + WhatsApp variant, under 120 words each). It must read as one-to-one, name the founding price locked for life and the cap of 10 founding members, and end with a yes/no question — not a link dump.
2. A LAUNCH POST for my main channels announcing the club (one long-form, one short variant).
3. A WELCOME EMAIL for new founding members: what to do first inside, where the community lives, and a personal note asking their #1 goal.
4. A simple OUTREACH TRACKER table (name, source, invited on, replied, joined) I can keep in the project folder.

Ask me for a sample of my writing first so you can match my voice. Personal outreach beats broadcast — optimise every word for one reader.
```

### Monthly report prompt
```
You are my membership club operations analyst. Produce this month's review.

CLUB: (unnamed membership club)
AUDIENCE: (audience not defined yet)
PROMISE: (promise not defined yet)
FOUNDER CREDIBILITY: (not provided)
EXISTING ASSETS: (not provided)
PERKS: (none selected yet)
FLAGSHIP PERK: (not defined)
PRICING: €?/month, €?/year, founding price €? (cap 10 members)

THIS MONTH'S NUMBERS:
- Active members: 0
- Joined: 0
- Cancelled: 0
- Effective monthly price: €?

PRODUCE TWO DOCUMENTS:
1. MEMBER-FACING monthly update (under 250 words): what shipped this month (ask me), what's coming, a member win to celebrate (ask me), and one question to spark community discussion.
2. INTERNAL review: MRR, annual run-rate, churn % with a verdict (healthy under 4%, watch 4–8%, act above 8%), the single biggest retention risk, and the top 3 actions for next month ranked by effort vs impact. If churn is above 4%, include a win-back message draft for recently cancelled members.

Ask me your questions first, then write both documents.
```
