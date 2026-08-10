# Engage AI — Functionality Overview

**What it is:** An AI Engagement Director for churches and mission-driven organizations.
Not just a content generator — it turns a message, sermon, or event into practical,
multi-channel engagement, using a stored "organization memory" so every output
matches that org's voice without re-explaining context each time.

**How it's delivered:** A WordPress plugin connected to a cloud API, bundled into
Vision Outreach Media's existing €69/month service. Each organization switches on
whichever modules it wants — nothing is all-or-nothing.

## The three modules

### 1. Engagement (content generation)
Give it an event, a weekly announcement, or a sermon. It generates, in one pass:
- A website post (title + body)
- A social media caption + hashtags
- An email (subject + body)
- A WhatsApp message
- Presentation slides
- Follow-up actions

All of it is written in the organization's stored voice (mission, tone, audience,
ministries, recurring schedule, speakers) — set once, reused every time. The
website post publishes straight to WordPress; the rest is shown for manual copy
into each channel.

### 2. Agent modules (autonomous side-hustle assistants)
Nine optional agents an org can turn on: Physical Product, Reselling, YouTube
Channel, Paid Q&A, Local Service, App Builder, UGC Creator, Coaching, and
Engagement Growth. Each runs its own check-in cycle and proposes concrete next
steps as "tickets." Anything reversible gets drafted automatically; anything that
spends money or acts publicly waits for the admin to approve, reject, or redirect
it.

### 3. Analytics (digital footprint scanning)
Scans the organization's public presence across 8 channels — website, Google
Business, Facebook, Instagram, YouTube, LinkedIn, X/Twitter, and news mentions —
and scores each one. The first scan sets the baseline; later scans show whether
each channel is white space (no presence), new, growing, saturated, or healthy
compared to it.

## Under the hood
- Cloud API: FastAPI backend, JWT auth, one organization can belong to one user
  account (multi-tenant), OpenAI (gpt-4.1-mini) powers the generation.
- Org profile ("organization memory") is optional/editable and grows as the org
  fills it in — only the name is required at creation.
- Live at `https://engage-ai-api.onrender.com` (Render); plugin self-updates via
  a custom update feed, no WordPress.org listing needed.
- Billing is manual today, bundled into the existing VOM plan — no self-serve
  checkout yet (Stripe is scaffolded but unused).
