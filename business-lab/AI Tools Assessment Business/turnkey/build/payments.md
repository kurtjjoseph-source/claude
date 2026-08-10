# Payments Package (Stripe Connect Express) — AI Tools Assessment Business

**Author:** Vision Outreach Media (VOM), on behalf of the client/operator.
**Workstream:** W5 — Payments.
**Status:** Scaffolding PLAN staged only. **No real Stripe objects have been created.** This
workstream is blocked on the platform-bootstrap prerequisite `stripe_connect: pending`
(`turnkey/launch-state.json`) — the operator's Stripe **platform** account with Connect enabled
must exist before even the AUTO scaffolding step can execute against a real API.

Nothing in this document, or in the actions it describes, ever puts a card number, IBAN, Stripe
secret key, or MFA code into agent context.

---

## 0. Why staged, not run

- `stripe_connect: pending` — the operator's platform Stripe account (with Connect capability
  turned on) is the account this scaffolding step calls into. Until that account exists and its
  API key is available to the automation in a proper secret store (never pasted into agent chat),
  step 1 below cannot fire for real.
- Pricing is also not final: `business-profile.md` "Summary of Blocking Items" #3 flags final
  launch pricing as unresolved. Price IDs below are drafted against the pricing ladder in that
  file but marked **pending the pricing lock** — do not create live Stripe Price objects off
  placeholder numbers.

---

## 1. Connect Express scaffolding (AUTO, once `stripe_connect` clears)

**Connected account:**
- Type: **Express** (Stripe-hosted onboarding UI — lightest lift for a solo operator, matches the
  "owner completes one hosted step" design in this workstream's gate model).
- Created via the **platform account's** API (`POST /v1/accounts` with `type: express`,
  `country: NL`, `capabilities: { card_payments, transfers }`).
- Business type: individual/sole-proprietor (matches the eenmanszaak path in
  `turnkey/foundation/legal-financial.md`), to be confirmed once the entity-path gate there
  resolves.

**Charge model — destination charges:**
- Platform account creates the charge; funds route to the **connected account** (the operator) as
  the destination, minus an `application_fee_amount` retained by the platform.
- **Rationale:** destination charges keep VOM/platform as the merchant of record for
  dispute/compliance purposes while still routing the net proceeds directly to the operator's own
  Stripe balance → their own IBAN. This matches governance rail D-style requirement: money flows
  to the owner, not held by the agent or an intermediary.
- **Application fee:** placeholder **0%** platform fee for this build (VOM/platform is not taking
  a cut of this specific operator's revenue in the current arrangement) — **TODO(operator):
  confirm the actual `application_fee_amount`/percentage** if a platform fee is intended; currently
  drafted as pass-through only.

**Products & Prices (Stripe Catalog objects) — mapped from `business-profile.md` §Pricing:**

| Product | Price | Stripe object (draft, not created) | Status |
|---|---|---|---|
| AI Tools Assessment | $999 flat | `prod_assessment` / `price_assessment_999` (one-time) | Pending pricing lock (profile marks this as the anchor price, most likely to ship as-is) |
| Process redesign | $3,000–$3,500 | `prod_process_redesign` / one-time price, exact amount TBD | Pending pricing lock |
| Simple automation build | ~$1,500 | `prod_automation_build` / one-time price ~$1,500 | Pending pricing lock |
| Knowledge system | Project/retainer, amount unspecified | `prod_knowledge_system` — price object deferred until amount set | Blocked — no price in source material |
| Custom workflows | ~$3,000 + maintenance | `prod_custom_workflows` (one-time) + `price_custom_workflows_maintenance` (recurring, amount TBD) | Pending pricing lock |
| Full implementation | ~$8,000 | `prod_full_implementation` / one-time ~$8,000 | Pending pricing lock |
| AI Concierge retainer | $1,200–$2,000/mo (launch-tiered option: $800→$1,200→$1,600) | `prod_concierge` / recurring monthly price, tiered — likely **multiple Price objects** (one per launch tier) attached to one Product, retired as tiers fill | Pending pricing lock + operator decision on flat vs. tiered-scarcity launch pricing |

**Do this once `stripe_connect` clears and pricing locks:** create the Product + Price objects via
the platform API (test mode first), attach destination-charge params at checkout/PaymentIntent
creation time referencing the connected account ID.

---

## 2. Owner ID + IBAN (CLIENT gate — Stripe-hosted)

**This step never touches agent context.** Stripe's own hosted onboarding (an **Account Link**,
generated via `POST /v1/account_links` with `type: account_onboarding`) collects the owner's
identity documents and bank/IBAN details directly on Stripe's servers.

- **Agent's role:** generate the Account Link URL (a `POST` call using only the connected account
  ID — no personal data passes through the agent) and hand the link to the owner.
- **Owner's role:** open the link on their own phone/device, complete Stripe's hosted ID
  verification + IBAN entry themselves.
- **VOM/agent never sees:** ID document images, IBAN, date of birth, or any other KYC field.

See `turnkey/gates/build-W5-client.md` for the exact handoff script.

---

## 3. Live test purchase + refund (VOM gate)

Once Stripe reports the connected account `charges_enabled: true` and `payouts_enabled: true`
(i.e., the owner has completed §2), the rail must be **certified with a real transaction** before
it is announced to any customer:

1. VOM runs one real, small live-mode purchase against the $999 Assessment price (or a $1 test
   price object created for this purpose, then immediately deprecated) using VOM's own card.
2. Confirm: charge succeeds, destination-charge routing lands the net amount in the connected
   account's Stripe balance, application fee (if any) lands on the platform account.
3. VOM immediately refunds the test charge in full.
4. Confirm the refund posts and reverses the transfer correctly.
5. Log the test-purchase + refund evidence (charge ID, refund ID, amounts, timestamps) into this
   file and into the consent log (by the orchestrator, not this agent).

**This gate exists because money actually moves** — see `turnkey/gates/build-W5-vom.md` for the
exact gate script. Only after this passes is the payment rail considered launch-ready and safe to
put in front of real customers.

---

## 4. Status

- Connect Express scaffolding: **planned, not created** — blocked on `stripe_connect` prerequisite.
- Products/Prices: **mapped, not created** — blocked on the same prerequisite + the pricing-lock
  TODO in `business-profile.md`.
- Owner ID+IBAN: **not started** — depends on scaffolding existing first.
- Live test purchase + refund: **not started** — depends on §2 completing (`charges_enabled` +
  `payouts_enabled`).
- No card, IBAN, or Stripe credential has been entered anywhere in this workstream.
