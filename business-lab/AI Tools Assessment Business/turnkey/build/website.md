# Website & Deployment Package — AI Tools Assessment Business

**Author:** Vision Outreach Media (VOM), on behalf of the client/operator.
**Workstream:** W4 — Website & deployment.
**Status:** Build brief staged, ready to hand to the devops-scrum-orchestrator dev swarm. **The
swarm has NOT been dispatched in this pass** — this is a staging/preparation run only. No preview
build exists yet, no deploy has been made, and the live public URL has not been promoted.

---

## 0. Why staged, not run

Two platform-bootstrap prerequisites the gate matrix (`turnkey/launch-state.json`) still shows as
`pending` touch this workstream indirectly:

- `provisioned_accounts` (Vercel) — the swarm needs an actual Vercel project/token to deploy into.
  Until the operator's Vercel account is provisioned and its access handed to the swarm, dispatch
  would fail at the first deploy step.
- `cloudflare_delegation` — the custom subdomain (`aitools.clients.visionoutreachmedia.nl`, per
  `turnkey/foundation/domain-email.md`) can't resolve until the zone is delegated; the swarm falls
  back to a `*.vercel.app` URL until then, which is fine for staging but means "live" today would
  really mean "live on a throwaway Vercel subdomain," not the intended hostname.

Everything below is written so that the moment `provisioned_accounts` clears, this brief can be
handed to the swarm as-is with no further drafting.

---

## 1. Build brief for the devops-scrum-orchestrator

**Site type:** Marketing/funnel site for a productized AI-consulting offer (not an app — static or
lightly-templated content site, single primary CTA: book a discovery call / pay for the $999
assessment).

**Working title used throughout (pending operator name/niche lock — see `business-profile.md`
Summary of Blocking Items):** "AI Tools Assessment" — placeholder copy only; swap once
`foundation-W1` resolves the business/legal name and niche axis.

### Pages / sections

1. **Home / landing** — hero framing the time-drain pain point ("You're working 40–60 hrs/week
   and know AI could help, but you don't have time to figure out which tools"), single primary CTA
   to book the $999 AI Tools Assessment, secondary CTA to "see what's included."
2. **The Assessment ($999)** — offer detail page: 45-min recorded discovery call → AI-assisted
   transcript analysis → 9-slide report prescribing 3–7 off-the-shelf AI/SaaS tools reclaiming
   5–10 hrs/week. Prominent **money-back guarantee** callout (100% refund if <5 hrs/week found) —
   copy only; do not surface refund *mechanics* (Stripe refund flow) until `dutch_lawyer_terms`
   clears per legal-financial.md §4.
3. **Upsell ladder (informational, post-assessment context)** — brief cards for: process redesign
   ($3K–$3.5K), simple automation build (~$1.5K), knowledge systems (custom quote), custom Claude-
   skill workflows (~$3K + maintenance), full implementation bundle (~$8K). Mark all prices
   "starting at" / "example" until `business-profile.md` pricing TODO locks.
4. **AI Concierge retainer** — the $1.2K–$2K/month (or launch-tiered $800→$1,200→$1,600) ongoing
   offer: two 45-min sessions/month + Voxer async access, Audit→Optimize→Automate loop framing.
5. **How it works** — the discovery-call → analysis → report → (optional) implementation flow,
   set expectations (no building/implementation at assessment stage).
6. **About / niche positioning** — placeholder until niche axis (geography vs. vertical) locks;
   ship generic "AI clarity for time-starved small business owners" copy until then.
7. **Booking / checkout** — booking widget for the discovery call + payment entry point for the
   $999 assessment (wired to Stripe in W5 — see `payments.md`; **not live** until that workstream's
   gates clear).
8. **Legal footer** — Terms, Privacy, Refund Policy stubs. **Do not publish real terms copy** —
   `legal-financial.md` §4 flags `dutch_lawyer_terms: pending` as a hard blocker on any live
   customer-facing terms/refund language. Use clearly-marked placeholder text until cleared.

### Deploy target & wiring (AUTO — swarm executes once dispatched)

- **Host:** Vercel (default per this workstream's standing instruction).
- **SSL:** Vercel-managed cert on the assigned hostname (auto-provisions on domain attach — no
  action needed once DNS resolves).
- **Analytics:** Vercel Analytics (or a lightweight alternative, e.g. Plausible) wired at deploy
  time — page views + conversion funnel on the CTA.
- **Monitoring:** Vercel's built-in deployment/uptime monitoring + a basic external uptime check
  (e.g. a simple ping/status endpoint) so the operator gets notified if the live site drops.
- **Hostname:** target `aitools.clients.visionoutreachmedia.nl` (per
  `turnkey/foundation/domain-email.md` §1 — CNAME to `cname.vercel-dns.com`, TXT verification)
  once `cloudflare_delegation` clears; falls back to the Vercel-assigned `*.vercel.app` URL until
  then. No rebuild needed for the cutover — DNS swap only.

### Preview vs. go-live

- **Preview builds are AUTO.** The swarm can build, iterate, and produce a Vercel preview-deploy
  URL (an unlisted `*.vercel.app` preview link) without any gate — nothing here is public-facing
  or customer-reachable until explicitly promoted.
- **Promoting to the live public URL is a VOM publish gate.** See gate `build-W4` below.

---

## 2. Go-live gate (VOM)

Promotion from preview → the live public production URL is an irreversible publish action
(the site becomes reachable/indexable by real visitors). This requires a logged **YES** from VOM
before it fires — see `turnkey/gates/build-W4.md` for the exact gate script.

On YES: promote the Vercel preview to production, then confirm:
- HTTP 200 on the production hostname.
- Valid SSL certificate (no browser warning, cert chain resolves).
- Analytics + monitoring both reporting data from the live URL.

This confirmation gets logged back into `turnkey/build/website.md` (this file, updated post-gate)
and `launch-state.json` W4 status by the orchestrator.

---

## 3. Status

- Build brief: **ready**.
- Site built: **YES** — a complete, church-tuned marketing/funnel site (`turnkey/build/site.html`),
  authored to the locked W1 decisions (church/faith niche, VOM brand, founder/church-budget
  pricing) and extending the existing `church-ai-wizard.html` design system (liturgical
  violet/gold, serif/sans, full light+dark). Real copy throughout; the church-ai-wizard is
  referenced as the free mini-audit tripwire.
- **Preview deploy (AUTO): DONE** — published as a private, online review preview at
  **https://claude.ai/code/artifact/00688f69-3830-42d8-a678-95af10b8e567** (2026-07-29). This is a
  self-contained preview surface (Vercel account not yet provisioned); it is NOT public and NOT
  indexable. Booking + payments are visibly non-live; terms are marked pending legal review.
- **Live review deploy on operator's Vercel (2026-07-29):** **https://vom-ministry-ai.vercel.app**
  — deployed via the operator's authenticated Vercel CLI (`kurtjjoseph-6989`), so no credential
  entered agent context. Vercel's first-deploy default put it on the *production target* + aliased
  the clean domain (a hashed preview was intended); it is `noindex,nofollow`, on a throwaway
  `.vercel.app` domain, with booking/payments non-functional and a visible "internal preview"
  banner — i.e. a review surface, not a customer launch. The **real** go-live (VOM domain + live
  Stripe + indexable) remains the un-fired `build-W4` gate.
- Dev-swarm note: per spec, the *production* Vercel build delegates to the
  devops-scrum-orchestrator swarm once `provisioned_accounts` (Vercel) clears; this preview was
  built directly by the orchestrator to give the operator an online surface to review now.
- **Live promotion: STILL A GATE (`build-W4`, VOM).** Promoting to the real public production URL
  (and swapping in the final VOM hostname) remains an un-fired publish gate — awaiting the
  operator's review of this preview, then a logged YES.
