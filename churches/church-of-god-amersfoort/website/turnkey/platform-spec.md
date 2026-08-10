# Platform spec — church f god amersfoort

*apb/1 · compiled 2026-08-04T23:20:11Z · `sha256:d4d648a57b5243926a1b8a79bb0a8d6b`*

This is the build order. It is compiled from the blueprint and executed by Forge with no human in the loop, so every decision it could need is already made here.

## Readiness

**Ready.** Forge can run this unattended.

## What is being built

- **Archetype**: Church / faith community (`church`)
- **Why this archetype**: org type 'church' builds as Church / faith community
- **Site**: 7 pages — Home, Plan your visit, About, Sermons, Events, Give, Contact
- **Platform**: 10 modules — Events, Giving, Sermons, Serving rota, People, Messages, Content, Mailing list, Finances, New here
- **Deploy**: vercel — a Vercel deployment — a public URL
- **Authorization**: unattended (consent `6b2030bb04c0ab8f`)

## Build stages

| | Stage | What happens |
|---|---|---|
| ◇ | **Read the spec** | load the blueprint, verify the fingerprint, refuse if anything is unresolved |
| ▢ | **Lay out the build** | create the output tree this run writes into |
| ◐ | **Apply the brand** | operator palette and type, archetype accent, logo embedded |
| ▣ | **Build the platform · 10 modules** | the operating app the owner works in, seeded so it opens with something in it |
| ▤ | **Write the site · 7 pages** | the public pages, in this archetype's voice |
| ◈ | **Wire the rails** | payments, email and analytics — live where credentials exist, labelled where not |
| ▥ | **Package** | manifest, readme, deployment config |
| ◎ | **Check the work** | run every check in the spec against what was actually written |
| ▲ | **Deploy · vercel** | a Vercel deployment — a public URL |
| ◉ | **Prove it is up** | fetch what was deployed and confirm it answers |
| ● | **Seal the run** | record the fingerprint, artifacts and outcome |

## Rails

| Rail | Provider | State | For |
|---|---|---|---|
| payments | stripe | **stub** | online giving, one-off and recurring |
| email | brevo | **stub** | newsletter and reply-from-inbox |
| analytics | engage_ai | **stub** | presence benchmark across 8 channels |

## Must be true when it finishes

- the build matches the spec it claims to be built from
- no unresolved {token} reached any page
- all 7 pages exist and are non-empty
- the operating platform opens and carries its modules
- every navigation link points at a page that was written
- no two modules carry the same name in the owner's interface
- A first-time visitor can reach 'Plan your visit' from the home page in one click.
- Giving exists in the platform — a church that cannot record a gift is not launched.
- The events view opens with something in it.
- The home page welcomes before it asks for money.

## What the builder decided for you

The profile did not supply these, so the archetype's default was used. Each one is a real thing on a real page — change the profile and recompile to replace it.

- **city** → "your city" — no location found in the profile — the page says 'your city' until one is set
- **tagline** → "Church / faith community" — no tagline in the operating profile — the archetype label stands in
- **offer_line** → "church f god amersfoort \u2014 A gathering-led community funded by giving. The platform runs Sunday and the week around — no Offer section in the profile — the archetype's own summary stands in
- **leadership** → "The church is led by its elders, with a teaching team who share the preaching through the year." — no leadership section in the profile
- **pricing** → "on request" — no priced lines anywhere in the profile
- **services** → "one generic card" — the profile's Offer section had no bullet list and no priced lines to turn into service cards

---

Prepared by Vision Outreach Media (VOM).
