# Sprint Brief — Church Media Academy launch site

## Sprint goal
Ship a single-file web experience (landing page → join flow → member area) convincing enough
that the owner, Kurt, signs up online and engages as a member. This is the sales + product demo
for the Digital Membership Club business idea.

## The business (source of truth)
- **Club:** Church Media Academy
- **Audience:** church media volunteers and communications staff
- **Promise:** in 90 days your livestream, socials and online reach run on a repeatable weekly
  system — with a community of church media people who answer questions the same day.
- **Founder:** Kurt Joseph — runs Vision Outreach Media, benchmarks churches' digital presence
  with Engage AI, runs Church of God Amersfoort's livestream every Sunday.
- **Perks:** content manuals, private community, monthly Engage AI engagement report per church
  (flagship retention perk), monthly live office hours.
- **Pricing:** €39/mo, €390/yr; founding members €29/mo locked for life, capped at 10.
- **Seed manuals:** The Sunday Livestream Playbook · YouTube Growth for Churches · Reading Your
  Engagement Benchmark · The Volunteer Media Team Handbook · Social Posts from One Sunday Sermon.

## Hard constraints
- ONE self-contained file: `index.html` in this folder. No external requests (strict CSP at
  deploy): no CDNs, no webfonts, no remote images. Inline everything; system font stacks.
- SPA with three states: landing → join flow → member area. State in localStorage
  (key `cma-member-v1`), sign-out supported, member state survives reload.
- Join flow is a DEMO: 2 steps max (name/church/email → plan choice → confirm). It must NOT
  collect card numbers or any payment credentials — the confirm button is explicitly labeled
  "Simulate payment — demo mode". Show the founding price and "X of 10 founding spots taken".
- Member area must feel alive on first entry: personal welcome using the member's name and
  church, founder number (e.g. "Founding member #4"), the 5 manuals (each with a real ~150-word
  opening section, not lorem), a community feed with 6–8 believable posts from named church
  media people (marked as sample data), a sample monthly Engage AI report card with numbers,
  an office-hours RSVP toggle, and at least two more interactive touches (e.g. mark-manual-read
  progress, posting to the feed locally).
- Design: both light and dark themes via CSS custom properties + `prefers-color-scheme` +
  `:root[data-theme]` overrides; responsive at 375px and 1280px; keyboard focus visible;
  no console errors. Do NOT use the generic cream+terracotta or dark+acid-green AI look; the
  club's identity is deep church-slate + warm gold "stage light" accent (designer refines).
- Copy voice: direct, warm, specific to church media life (Sunday pressure, volunteers,
  livestream fails). No hype adjectives without a concrete detail behind them.

## Definition of done (sprint)
A first-time visitor on the landing page understands the offer in 10 seconds, can join in under
a minute, lands in a member area that proves the value, and can sign out / return as a member.
