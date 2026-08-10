# Payment activation runbook — Church Media Academy

## Status — ACTIVATED 2026-07-20
LIVE Stripe payment links are wired into PAYMENT_LINKS and deployed. Account:
Kurt's existing Stripe "Personal Account" (hotmail login, acct_1FjOjdKd...).
- founding: https://buy.stripe.com/5kQaEY0lI7fO1EjdS8fAc01 (€29/mo, capped at 10 payments)
- monthly:  https://buy.stripe.com/28E00k5G243C3Mr7tKfAc02 (€39/mo)
- annual:   https://buy.stripe.com/cNibJ270agQofv929qfAc03 (€390/yr)
All redirect to https://cma.visionoutreachmedia.nl/?paid=1. Payment methods currently
enabled: Card, Apple Pay, Google Pay, Link. iDEAL NOT yet enabled — turn it on in
Stripe → Settings → Payment methods for Dutch churches. These are REAL links: a
completed checkout charges a real card. Landing FAQ updated from demo copy to real
Stripe copy. Remaining recommendation: run one €29 test yourself and refund it.

## Original status (pre-activation)
- Site is FULLY WIRED for real Stripe payments (deployed 2026-07-20).
- Per-plan config: `PAYMENT_LINKS` object near the top of the `<script>` in `index.html`
  (keys: `founding`, `monthly`, `annual`). Empty string = that plan runs in demo mode.
- With a link set: step 3 hides the demo badge, button becomes "Continue to secure
  payment", the visitor's draft (name/church/email) is saved locally, they're redirected
  to Stripe (email prefilled). On return to `/?paid=1` the membership finalizes
  automatically with `paid: true` — verified working end-to-end on the live site.
- Blocked on: Stripe account sign-in (Kurt's financial account — Kurt only).

## Kurt's steps (one-time, ~15 min)
1. Sign in at https://dashboard.stripe.com (or create the account; NL business).
   Complete activation: business details, IBAN for payouts, ID verification.
2. Settings → Payment methods → enable **iDEAL** (and cards; SEPA Direct Debit is
   what makes iDEAL-initiated subscriptions renew).
3. Product catalogue → create 3 recurring products:
   - Founding membership — €29.00 / month
   - Monthly membership — €39.00 / month
   - Annual membership — €390.00 / year
4. For each: create a **Payment Link** →
   - After payment → "Don't show confirmation page" → redirect customers to:
     `https://cma.visionoutreachmedia.nl/?paid=1`
   - (Optional) limit the founding link to 10 total payments: Payment Link →
     Advanced → limit the number of payments.
5. Give Claude the 3 link URLs (or paste them into `PAYMENT_LINKS` in
   `church-media-academy/index.html` yourself), then redeploy:
   `cd church-media-academy && node -e "<rebuild>" # or ask Claude`
   `cd deploy && vercel deploy --prod --yes`

## Known limitation (fine for founding cohort, fix at scale)
Static site = no webhook verification: someone hitting `/?paid=1` manually with a
crafted localStorage draft could see the member area without paying. Money is never
at risk (Stripe holds the charge), only content access. The real fix is the full
platform build (Vercel functions + Stripe webhooks + Supabase) from the ops wizard's
build prompt — do it after the first 10 founding members prove the offer.

## Test before announcing
1. Set the founding Payment Link in test mode first; pay with Stripe's iDEAL test bank.
2. Confirm you land back in the member area as a paid founding member.
3. Swap to the live-mode link, redeploy, do one real €29 payment yourself, refund it
   in the dashboard.
