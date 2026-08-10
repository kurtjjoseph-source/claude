# Gate build-W5-client — Owner ID + IBAN (Stripe-hosted)  (actor: CLIENT)

**Workstream:** `W5_payments`  ·  **Status:** not yet opened — blocked on `stripe_connect` prereq

Scaffolding plan staged in `turnkey/build/payments.md`. This gate becomes actionable only after
the Connect Express account scaffolding (§1 of that file) has actually been created against the
operator's platform Stripe account — which itself needs `stripe_connect: pending` to clear first.

**Action requested (once scaffolding exists):** the owner opens a Stripe **Account Link** (a
one-time hosted onboarding URL the agent generates using only the connected account ID — no
personal data passes through agent context) on their own device and completes Stripe's own ID
verification + IBAN entry there. Funds flow to the owner's own IBAN via the destination-charge
routing configured in `payments.md`.

**Why this is a gate:** entering identity documents and bank details is exactly the kind of
credential/financial data this agent must never touch — Stripe's hosted UI is the only place this
happens.

**What VOM/the agent supplies:** the Account Link URL only.
**What VOM/the agent never sees:** ID documents, IBAN, date of birth, or any other KYC field.

**On completion:** Stripe reports `charges_enabled: true` and `payouts_enabled: true` on the
connected account — this unblocks `build-W5-vom` (live test purchase + refund).

**On hold:** until Connect Express scaffolding exists (blocked on `stripe_connect`).
