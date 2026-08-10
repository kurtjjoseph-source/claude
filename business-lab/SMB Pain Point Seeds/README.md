# SMB Pain Point Seeds — twelve factory-ready businesses

Twelve business ideas built from *Business Ideation Seeds: SMB Pain Points* (August 2026),
turned into what the Platform Factory actually consumes: each one is a real business folder
with `business-idea.md` and `turnkey/factory-answers.json`, created through the factory's own
milestone-1 intake and initialised in the engine. All twelve appear in the factory's
**Launched sites** directory and can be opened at step 2 without retyping anything.

They were **not** hand-written into the file format — they were run through
`factory.act_start()`, the same call the browser form makes, so an idea from this batch and
an idea typed into the console are the same artifact downstream.

## Open them

```bash
python3 "/Users/kurtjoseph/Business Ideas/vom-systems/turnkey/orchestrator/engine/turnkey.py" factory
```

That serves the console on `http://127.0.0.1:<port>/?t=<token>` (printed in the terminal, a
free port is chosen automatically). **Launched sites** lists all twelve; *continue in the
factory* on any card picks up at milestone 2.

## The twelve — all twelve funnels are LIVE

Deployed 2026-08-06, each to its own Vercel project `<slug>-prelaunch`, verified serving
(36/36 addresses: funnel, `/platform/` back office, and the stable alias).

| # | Business | Live waitlist | Idea | Price | Score |
|---|---|---|---|---|---|
| 1 | AI Installed | **[ai-installed-prelaunch.vercel.app](https://ai-installed-prelaunch.vercel.app)** | [idea](AI%20Installed/business-idea.md) | €1,950 | **19**/20 |
| 5 | Trades Online | **[trades-online-prelaunch.vercel.app](https://trades-online-prelaunch.vercel.app)** | [idea](Trades%20Online/business-idea.md) | €1,500 | **19**/20 |
| 2 | Always Answered | **[always-answered-prelaunch.vercel.app](https://always-answered-prelaunch.vercel.app)** | [idea](Always%20Answered/business-idea.md) | €250/mo | **18**/20 |
| 6 | Review Engine | **[review-engine-prelaunch.vercel.app](https://review-engine-prelaunch.vercel.app)** | [idea](Review%20Engine/business-idea.md) | €95/mo | **18**/20 |
| 3 | Paid on Time | [paid-on-time-prelaunch.vercel.app](https://paid-on-time-prelaunch.vercel.app) | [idea](Paid%20on%20Time/business-idea.md) | €125/mo | 16/20 |
| 4 | Applicant Flow | [applicant-flow-prelaunch.vercel.app](https://applicant-flow-prelaunch.vercel.app) | [idea](Applicant%20Flow/business-idea.md) | €1,200 | 16/20 |
| 9 | Second Visit | [second-visit-prelaunch.vercel.app](https://second-visit-prelaunch.vercel.app) | [idea](Second%20Visit/business-idea.md) | €225/mo | 16/20 |
| 10 | Website Rescue | [website-rescue-prelaunch.vercel.app](https://website-rescue-prelaunch.vercel.app) | [idea](Website%20Rescue/business-idea.md) | €375 | 16/20 |
| 7 | AI Workday | [ai-workday-prelaunch.vercel.app](https://ai-workday-prelaunch.vercel.app) | [idea](AI%20Workday/business-idea.md) | €1,750 | 15/20 |
| 8 | Back Office Desk | [back-office-desk-prelaunch.vercel.app](https://back-office-desk-prelaunch.vercel.app) | [idea](Back%20Office%20Desk/business-idea.md) | €450/mo | 15/20 |
| 11 | The Freelance Desk | [the-freelance-desk-prelaunch.vercel.app](https://the-freelance-desk-prelaunch.vercel.app) | [idea](The%20Freelance%20Desk/business-idea.md) | €350/mo | 13/20 |
| 12 | The Pricing Playbook | [the-pricing-playbook-prelaunch.vercel.app](https://the-pricing-playbook-prelaunch.vercel.app) | [idea](The%20Pricing%20Playbook/business-idea.md) | €750 | 12/20 |

Org types: ten `service_business`, `education` (AI Workday), `digital_products` (The Pricing
Playbook). Suggested brand kits are in each `seed-evidence.md`; **milestone 4 has not been
taken** — every funnel currently wears the PRELAUNCHforge green.

## Two things the first funnel build exposed, fixed before publishing

1. **The hero eyebrow read "Prelaunch validation funnel".** `{tagline}` resolves from the
   operating profile, and at prelaunch there is never one stamped yet — so it fell back to
   the archetype's own label and internal vocabulary became the first line a stranger read.
   The PRELAUNCH archetype's hero now carries a line that is true of every funnel it will
   ever build: *"Not built yet — this list decides."* One line in
   `engine/archetypes.py`; `turnkey selftest` passes. **This affects every future funnel**,
   not just these twelve.
2. **The footer published `hello@ai-installed.nl`** — an invented address on a domain
   nobody owns, composed because no contact address existed in the idea file. All twelve
   now carry `info@visionoutreachmedia.nl`.

## The hub — https://vom-prospects.vercel.app

One public page for the whole set: **[vom-prospects.vercel.app](https://vom-prospects.vercel.app)**.
VOM-branded (real logo, navy/orange/teal, Manrope), twelve cards ordered by score, filterable
by the pain each one answers (AI · Staffing · Cash flow · Customers · Admin · Costs), with an
honest three-step explanation of what joining a list means.

It is **generated**, not hand-written —
[`vom-systems/prospects/build_hub.py`](../vom-systems/prospects/build_hub.py) reads the same
answers the factory compiled the funnels from plus the live addresses, so a card and the page
it links to cannot drift apart. Re-run it and redeploy with:

```bash
cd "/Users/kurtjoseph/Business Ideas/vom-systems/prospects" && python3 build_hub.py && cd .. && ./deploy-wizard.sh "prospects/prospect-hub.html" prospect-hub vom-prospects.vercel.app "#FFFFFF" "#0F131A" "Twelve businesses Vision Outreach Media is testing in public."
```

**The way back is unified and lives in the engine, not in twelve copies of a page.** Forge
gained `--hub-link` / `--hub-label` / `--hub-note`; the spec carries `site.hub`; `site_gen`
renders one strip above the header on *every* page of the site and a matching link in the
footer. Verified on all twelve: 12/12 carry it in both places. Any future forge run can join
a hub the same way — nothing here is specific to this batch.

The strip sits above the header rather than inside it, on the band colour: the header belongs
to the business, and this line is about where the business sits. It is also the only door on
a waitlist page that is not the form — a visitor who is interested but not ready to leave an
email otherwise has nowhere to go.

## Every funnel now shows its own kind of work

The prelaunch photo pool is six coffee shops. All twelve funnels — an AI installer, an
invoice-chasing service, a workshop programme — opened with the same café, so they read as one
company. `photos.pool_archetype()` now deals a prelaunch funnel from the **business's own org
type**: AI Installed gets desks and laptops, AI Workday gets lecture halls, the coffee shops
survive only where an org type has no photographs.

That rule lives in `photos.py` because there are two callers — `forge.st_site` copies the
files, `site_gen` writes the tags that reference them — and the files are named by role
(`img/hero.jpg`). Fixing only one shipped one archetype's pictures under another's filenames
with no build error. They had agreed until now only by both being wrong.

## The readability pass (2026-08-06, after the first publish)

Reported: *"some pages are not readable."* Confirmed by rendering every page of every
business in headless Chrome and measuring the computed contrast of every text element,
in **both** colour schemes — 96 page renders. It was real, it was on all twelve, and it
came from shared engine code:

| Where | What | Was | Now |
|---|---|---|---|
| `site_gen` + kit tokens | `--faint` — fact labels, footer headings, the form note | 2.97–3.24:1 | ≥4.5:1 |
| `site_gen` | the hero eyebrow, drawn in the raw accent | 4.27:1 | 4.72:1 |
| `platform_app` | `--ink-faint` — stat-tile labels, table headings, field labels | 2.90–3.33:1 | ≥4.6:1 |
| `platform_app` | dark mode ran the **light** accent on every link button | 3.78:1 | ≥4.5:1 |
| `platform_app` | status pills (`warn`, `good`, `stop`) unfitted to their ground | 2.63:1 | ≥4.5:1 |

Three of those had a common cause: a derived value mixed at a *fixed strength* — `--faint`
is ink at 47% — is an aesthetic decision standing in for a legibility one. Derived colours
are now **fitted**: hue and saturation held, lightness walked away from the ground until
every pair clears 4.5:1 (`brand_kits.fit_text`). The dark-accent bug was different: the
platform set `--c` inline from the brand kit at boot, and an inline custom property on
`:root` beats a media query — so the dark-mode rule that was written to swap the accent
never applied. It now sets `--c-lt` and lets CSS choose.

**Sites built before the fix were rebuilt too (2026-08-07).** All ten Forge demos
(`forge/build.py --deploy`) plus the showcase at
[vom-forge.vercel.app](https://vom-forge.vercel.app) — 10/10 serving, each now carrying its own
kit's fitted scale. That rebuild surfaced one more: `skin_hitech`'s own `--faint` was 4.0–4.3:1
on its own grounds (hero notes, metric labels, step numbers, table headings), which the kit
audit cannot reach because the SaaS skin does not use kit tokens. Fixed and verified live on
[rosterly-two.vercel.app](https://rosterly-two.vercel.app).

**Still on the old scale:** [church-f-god-amersfoort.vercel.app](https://church-f-god-amersfoort.vercel.app)
(built 2026-08-04, `--faint:#868F89`). The rebuild was blocked by the permission classifier —
it is a real organisation's page, so it needs an explicit go-ahead rather than a standing grant.
Two other live funnels, `paid-in-full-prelaunch` and `invoice-accepted-prelaunch`, belong to a
different project (Single-Action AI Businesses) and were built after the fix — they already
carry the corrected scale and are deliberately untouched.

**The gap that let it ship:** `brand_kits.audit()` checked the five published colours and
never the values renderers mix from them, so all 18 kits passed while every site they
built carried 3:1 text. The audit now covers the derived scale — muted, faint, and the
accent used as small text — in both schemes. All 18 kits pass; `turnkey selftest` passes.
**Every future build gets this**, not just these twelve.

The promises were also rewritten to open by naming the reader's situation before stating
the outcome — `offer_line` on the funnel is the first sentences of the idea's Offer section,
so a promise that only stated the outcome made a stranger work out whether it was aimed at
them.

## Reading the signal

Each funnel's form posts into the `lead_capture` module of its own `/platform/` back office
(e.g. [ai-installed-prelaunch.vercel.app/platform/](https://ai-installed-prelaunch.vercel.app/platform/)).
Names recorded through the factory land in `prelaunch/signal.json` and become the *Prelaunch
evidence* section of `business-profile.md` at milestone 3 — the profile carries the proof,
not a claim about it.

Default threshold is 25. Nothing here sends email or charges anyone: publishing was covered
by the standing service authorization, sending is not.

Every folder also holds `seed-evidence.md` — the pain point, the survey data behind it, the
score, the cheapest test, and how that seed connects to the others. The factory never reads
it; it is there so the person deciding has the evidence next to the idea.

## What the seeds became

The source document names pains and rough concepts. The factory needs a business: a named
audience, the problem in that audience's own words, three deliverables, one price, one
monthly number. So each seed was narrowed rather than transcribed —

- **Ranges became one price.** "€1,500–2,500" is not a pricing page. Where the seed is
  recurring (2, 3, 6, 8, 9, 11) the price field is the **monthly fee**, so the factory's
  own math reads as "how many clients to reach the target". Where it is project work
  (1, 4, 5, 7, 10, 12) it is the **project fee**. Both are stated in each `seed-evidence.md`.
- **"Small businesses" became a describable group.** Every `who` names a trade, a size and
  a situation, because the whole compiler produces better copy from a narrow one — and a
  narrow audience is easier to correct than a vague one.
- **Names are plain and sayable.** No puns, no portmanteaus, per house rule.

## Assumptions worth correcting before building

These were decided here, not given in the source document. Change them in the factory at
step 1 and `business-idea.md` rewrites itself.

1. **City is Amersfoort on all twelve.** Right for the local ones (1, 2, 5, 6, 7, 10);
   arbitrary for the ones sold remotely (3, 8, 11, 12).
2. **Copy is in English.** Seed 5 in particular is blocked on the pending Dutch-language
   market decision — the same NL keyword work serves seeds 5, 6 and 2.
3. **Contact email is blank everywhere**, so the idea file leaves it out rather than
   inventing one.
4. **Seed 12 is `digital_products`**, not a service — it is a calculator and a playbook with
   a session attached, so the archetype gives it a catalogue and a checkout. Everything else
   sold as done-for-you work is `service_business`; seed 7 is `education` because it enrols
   people into dated sessions.
5. **Brand kits are suggestions, not choices.** Milestone 4 has not been taken on any of the
   twelve — no `brand-kit.json` exists yet. Picking one is a click in the factory.

## The sequence the source document recommends

**Validate seed 1** with five founding-customer conversations. **Run one seed-10 audit a
week** as the outreach mechanic. **Decide seed 5** only after the Dutch-language decision.
The three compose into one funnel: seed 7 fills the room, seed 10 diagnoses, seed 1 delivers.

Kill any seed that cannot get three paying commitments within thirty days of first pitch.
The research says the pain is real; only a paying customer says the solution is.

---
Source: *Business Ideation Seeds — Built on verified pain points of small business owners*,
August 2026 · Federal Reserve 2026 Report on Employer Firms · Guidant Financial 2026 Small
Business Trends · Bank of America / NFIB · The Kaplan Group · Epiphany Dynamics (Census BTOS,
NFIB, U.S. Chamber, Thryv) · Upwork Research Institute · PwC.
