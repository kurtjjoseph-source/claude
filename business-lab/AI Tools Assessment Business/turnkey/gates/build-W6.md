# Gate build-W6 — Enable live buyer-emailing fulfillment  (actor: VOM)

**Workstream:** `W6_products`  ·  **Status:** not yet opened — depends on `build-W5-vom` passing

Product manifest + webhook fulfillment design staged in `turnkey/build/products.md`. Building the
webhook endpoint, signature verification, and Brevo template wiring is AUTO and can happen in
sandbox/test mode without this gate. This gate covers only the flip from test-mode to **live**:
pointing the webhook at the real Stripe signing secret for the live connected account and letting
the flow actually email real buyers.

**Action requested:** confirm the fulfillment flow (Stripe webhook → grant access / email the
report-booking confirmation) is enabled for live traffic, so that a real buyer's payment actually
triggers a real email to that buyer.

**Why this is a gate:** emailing a real customer is a send action under governance rails — the
same class of irreversible act as go-live and charging a card.

**Sequencing:** only requested after `build-W5-vom` (live test purchase + refund) has passed —
there is no live buyer to email on an uncertified payment rail.

**On YES:** flip the webhook endpoint's Stripe signing secret from test to live, run one further
end-to-end smoke check if desired, and log the enable event to the consent log + update
`launch-state.json` W6 status (orchestrator, not this agent).

**On hold:** until `build-W5-vom` passes.
