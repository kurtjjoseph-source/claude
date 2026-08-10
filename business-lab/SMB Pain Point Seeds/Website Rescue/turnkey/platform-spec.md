# Platform spec — Website Rescue

*apb/1 · compiled 2026-08-07T07:50:34Z · `sha256:dd9ca0d7d65851861ba4383d04861637`*

This is the build order. It is compiled from the blueprint and executed by Forge with no human in the loop, so every decision it could need is already made here.

## Readiness

**Ready.** Forge can run this unattended.

## What is being built

- **Archetype**: Prelaunch validation funnel (`prelaunch`)
- **Why this archetype**: operator override
- **Site**: 2 pages — Home, What happens next
- **Platform**: 5 modules — Waitlist, People, Announcements, Content, Inbox
- **Deploy**: vercel — a Vercel deployment — a public URL
- **Authorization**: unattended (consent `9b9ee11d89f410b2`)

### Where the archetype overruled the blueprint

- **dropped** `checkout_payments` — this archetype never builds it
- **dropped** `finance_admin` — this archetype never builds it
- **dropped** `booking` — this archetype never builds it
- **dropped** `documents_contracts` — this archetype never builds it

## Build stages

| | Stage | What happens |
|---|---|---|
| ◇ | **Read the spec** | load the blueprint, verify the fingerprint, refuse if anything is unresolved |
| ▢ | **Lay out the build** | create the output tree this run writes into |
| ◐ | **Apply the brand · Waitlist Green** | grotesk type on a light ground, accent #278453, logo embedded, and the manual written for the owner |
| ▣ | **Build the platform · 5 modules** | the operating app the owner works in, seeded so it opens with something in it |
| ▤ | **Write the site · 2 pages** | the public pages, in this archetype's voice |
| ◈ | **Wire the rails** | payments, email and analytics — live where credentials exist, labelled where not |
| ▥ | **Package** | manifest, readme, deployment config |
| ◎ | **Check the work** | run every check in the spec against what was actually written |
| ▲ | **Deploy · vercel** | a Vercel deployment — a public URL |
| ◉ | **Prove it is up** | fetch what was deployed and confirm it answers |
| ● | **Seal the run** | record the fingerprint, artifacts and outcome |

## Rails

| Rail | Provider | State | For |
|---|---|---|---|
| email | brevo | **stub** | the one announcement the list is waiting for |
| analytics | engage_ai | **stub** | where the signups came from |

## Must be true when it finishes

- the build matches the spec it claims to be built from
- no unresolved {token} reached any page
- all 2 pages exist and are non-empty
- the operating platform opens and carries its modules
- every navigation link points at a page that was written
- no two modules carry the same name in the owner's interface
- the site is built in the 'Waitlist Green' kit — its accent #278453 reached the stylesheet
- The waitlist exists — a validation funnel that cannot capture a name is not a funnel.
- The ask is reachable without leaving the first page.
- People are captured; nothing is charged at this stage.

## What the builder decided for you

The profile did not supply these, so the archetype's default was used. Each one is a real thing on a real page — change the profile and recompile to replace it.

- **tagline** → "Prelaunch validation funnel" — no tagline in the operating profile — the archetype label stands in
- **about** → "Website Rescue is run by one team who answer their own messages." — no About section in the profile
- **leadership** → "The church is led by its elders, with a teaching team who share the preaching through the year." — no leadership section in the profile
- **brand_kit** → "Waitlist Green" — the branding step was not run, so the archetype's default kit applies

---

Prepared by Vision Outreach Media (VOM).
