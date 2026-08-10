# Digital Products & Fulfillment Package — AI Tools Assessment Business

**Author:** Vision Outreach Media (VOM), on behalf of the client/operator.
**Workstream:** W6 — Digital products + webhook fulfillment.
**Status:** Manifest assembled from the idea's assets; webhook fulfillment design staged.
**Nothing fires live** — no fulfillment email can reach a real buyer until the enable-fulfillment
VOM gate (§4) is granted, and that gate itself can't matter until W5 payments actually works
(blocked on `stripe_connect`, per `payments.md`).

---

## 1. Product manifest (assembled from `business-idea.md` + `business-profile.md`)

### Product A — AI Tools Assessment ($999, primary product)

**Deliverable, built per client engagement (not a static downloadable, but the process is fixed):**

1. **Discovery-call script** — the fixed question set from `business-idea.md` Phase 1: "Walk me
   through yesterday," "What tasks do you dread," "Where does work pile up," "What have you tried
   to automate that failed," "If you could delete any process, which one." Delivered as an
   internal fulfillment asset (operator/VOM-facing), not sent to the buyer.
2. **Phase-2 Claude skill** — "transcript in → tool prescriptions out" analysis skill, referencing
   **futurepedia.io** and **theresanaiforthat.com** as tool-research sources; QA step to sanity-
   check tool fit to business size (e.g., no Salesforce for a 4-person shop). Internal fulfillment
   tooling — packaged as a reusable Claude skill/prompt asset, versioned, fed prior good reports to
   improve output over time (per source material).
3. **9-slide report template** — the client-facing deliverable, structured per `business-idea.md`
   Phase 3 (title → exec summary → effort/impact matrix → quick wins → recommended solutions →
   4-day quick-start plan → major-projects teaser → financial impact → next steps). Referenced
   starting point: **audittemplate.ai**. Built per-engagement in Claude Designer/Gamma; the
   *template* itself is the reusable packaged asset.
4. **Review-call closing script** — three questions from Phase 4 ("which recommendation is most
   urgent," "self-serve or help implementing," "what's your timeline") — internal fulfillment
   asset.

**Money-back guarantee:** 100% refund if fewer than 5 hours/week of opportunity is identified.
Refund *mechanics* run through the Stripe rail in `payments.md`; refund *policy language* is
customer-facing terms and is held under the same `dutch_lawyer_terms: pending` block noted in
`legal-financial.md` §4 — do not publish live refund copy until that clears.

### Product B — Implementation upsells (à la carte, delivered as scoped project work)

Not a packaged digital product in the download sense — these are scoped services (process
redesign, automation builds, knowledge systems, custom Claude-skill workflows, full
implementation bundles). No fulfillment automation needed beyond an invoice/contract trigger;
noted here only for manifest completeness per `business-profile.md` §Pricing.

### Product C — AI Concierge retainer ($1.2K–$2K/month)

**Deliverable:** recurring access product, not a one-time file:
- Two 45-min monthly working sessions (calendar booking, not automated fulfillment).
- Voxer async access grant (12-business-hour SLA) — access provisioning, not a file send.
- Running per-client "inventory" one-pager (per source material: a Notion doc updated after every
  call, emailed to the client as ongoing proof of value) — this recurring email **is** a send
  action and falls under the same buyer-emailing gate as initial fulfillment (§4), each time it
  fires with real client content.

---

## 2. Packaging / delivery / access rules

| Product | Packaging | Delivery mechanism | Access rule |
|---|---|---|---|
| Assessment report (9-slide deck) | PDF/Gamma-hosted link, generated per client post-analysis | Emailed via the webhook-triggered fulfillment flow (§3) after successful Stripe payment | One-time delivery per purchase; report link accessible to the paying client only |
| Discovery-call recording | Fathom (or Otter/Fireflies) auto-generated link | Internal use only (feeds Phase-2 analysis) — not sent to buyer by default unless requested | Operator-only access; not part of customer-facing fulfillment |
| Phase-2 Claude skill / analysis tooling | Internal reusable asset (skill file/prompt template) | Not delivered to buyer — internal fulfillment infrastructure | Operator/VOM access only |
| Concierge Voxer access | Invite sent once retainer payment confirmed | Manual or semi-automated invite (Voxer has no native Stripe webhook integration — flagged below) | Active only while retainer payment is current; revoke on cancellation (manual process, not automated in this pass) |
| Concierge per-client inventory doc | Notion page, updated per session | Emailed after each working session | Client-only access link |

---

## 3. Webhook fulfillment design (AUTO to build; gated to enable)

**Trigger:** Stripe webhook event `checkout.session.completed` (or `payment_intent.succeeded`) on
the Assessment product's Price ID, scoped to the connected account from `payments.md`.

**Flow (as designed, not yet live):**

1. Stripe fires the webhook to a fulfillment endpoint (Vercel serverless function or equivalent,
   deployed alongside the site in `website.md`).
2. Endpoint verifies the Stripe webhook signature (standard `Stripe-Signature` header check using
   the webhook signing secret — a credential, stored in the hosting platform's secret manager,
   never in agent context or plain text in this repo).
3. On verified success event: grant access (mark the client record so a human/operator knows a
   report needs to be built and sent — this business's deliverable is bespoke per client, so
   "fulfillment" here means **kicking off the assessment workflow** — scheduling the discovery
   call, not auto-sending a canned file) and, for any product that *does* have a static deliverable
   (none currently identified beyond the ladder above, which are scoped services), attach/email it.
4. Send a confirmation email to the buyer (booking link for the discovery call + receipt) via
   Brevo (per `turnkey/foundation/domain-email.md` — sender domain staged, verification pending
   its own VOM gate in that workstream).

**Note on Concierge Voxer access:** no native Stripe→Voxer webhook exists; this step is flagged as
a manual follow-up action for the operator (or a simple Zapier/Make bridge, matching the tooling
stack already named in the source material) rather than a fully automated grant. Not blocking for
launch — the Assessment is the door-opener product this fulfillment flow needs to handle first.

**Building this flow (endpoint code, signature verification, Brevo template wiring) is AUTO** —
no customer is emailed by writing or testing the code in a sandboxed/test-mode webhook.

---

## 4. Enable-live-fulfillment gate (VOM)

**Flipping this flow from test-mode/sandboxed to live** — i.e., pointing it at the real Stripe
webhook signing secret for the live connected account, and letting it actually email real buyers —
is a **send action** and requires a logged VOM **YES** before it can fire for a real customer. See
`turnkey/gates/build-W6.md` for the exact gate script.

**Sequencing dependency:** this gate is only meaningful after `payments.md` §3 (live test purchase
+ refund) has passed — there is no live buyer to email until the payment rail itself is certified.

---

## 5. Status

- Product manifest: **assembled**.
- Packaging/delivery/access rules: **drafted**.
- Webhook fulfillment design: **drafted, not built/deployed** (depends on the site existing per
  `website.md` and the Stripe webhook secret existing per `payments.md`).
- Live buyer-emailing fulfillment: **not enabled** — awaiting the `build-W6` VOM gate, itself
  sequenced after the `build-W5-vom` test-purchase gate passes.
