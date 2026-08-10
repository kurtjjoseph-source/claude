# Paid in Full — evidence

Source: [Single-Action AI Businesses research](../Single-Action%20AI%20Businesses/research.md) (2026-08-06),
action #1 *"Write the claim, appeal or demand"* — **21/25**, the highest-value-per-artifact action found
anywhere in the research.

Live waitlist: **https://paid-in-full-prelaunch.vercel.app** · back office `/platform/`

## The single action

A loss adjuster's estimate lands short → one priced, evidenced, sendable counter-claim comes back within
two working days.

The buyer is not buying time saved. They are buying **money they otherwise would not have received** —
which is why this scores PAY 5 and can be priced per document instead of per month.

## The receipts behind it

- Roofing insurance supplements recover an average **$7,000–$8,000 per claim** that carriers would
  otherwise underpay; one supplementing service reports averaging a **34.4% revenue increase** on
  residential roofing claims
  ([IA Solutions](https://www.iasolutions.claims/blog/roofing-insurance-supplements-2026-guide-independent-adjusters) ·
  [Supplement Experts](https://supplementexperts.net/)).
- **EvenUp** proves the pricing model in an adjacent domain: personal-injury demand letters at
  **~$300 per document, reaching $500–$800+** by complexity — per artifact, not per seat
  ([AI Vortex](https://www.aivortex.io/legal/ai-tools/evenup/)).
- The general pattern: in US healthcare, ~20% of claims are denied, **up to 60% of those are never
  appealed**, and **80.7% of appealed Medicare Advantage denials are overturned**. The business lives
  entirely in the gap between "denied" and "appealed"
  ([Prosper](https://www.getprosper.ai/blog/denial-management-in-healthcare-strategies)).

## Why this shape, and not the others

The research's #1 action has several possible NL expressions. This one was chosen because:

- **Commercial data, not health data.** Rejected `zorgverzekeraar` claims for physio and dental practices
  are higher volume, but they are special-category personal data under GDPR from day one. Storm and water
  damage on a building is not.
- **It fires on a clock.** Every insurance job produces an adjuster's report. WOZ objections — the other
  obvious NL candidate — fire once a year in February, which fails gate 4.
- **The money is visible on one job.** The contractor can check the value of the first document against
  a single invoice, which is gate 3.

## Pricing

**€295 per counter-claim, first one free if it recovers nothing.** Per-document, never a retainer, so
the contractor risks nothing on the first one. A percentage-of-recovery model was rejected deliberately —
see the risk below.

## Cheapest test

Ask ten schadeherstel contractors one question: *"When was the last time an adjuster's number came in
under your cost, and what did you do about it?"* If the answer is "ate it" more than half the time, the
leak is real and unattended. Twenty-five waitlist signups is the threshold in `prelaunch/signal.json`.

## Known risk — read before the first paying customer

**VOM must never become a party to the claim.** The model is: we produce the document, the contractor
signs and sends it under their own name. Acting *as* a representative in an insurance matter in the
Netherlands touches financial-services regulation (Wft / `gevolmachtigd agent`), and taking a percentage
of the recovery is what would most likely tip it over. That is why pricing is per document.

This is exactly the case the existing **Dutch-lawyer terms review** operator prerequisite exists for.
Clear it before the first invoice, not before the first waitlist signup.

Second risk: quality is entirely dependent on the contractor forwarding usable photos and measurements.
The two-working-day promise has to start on receipt of a complete file, and the intake has to say so.
