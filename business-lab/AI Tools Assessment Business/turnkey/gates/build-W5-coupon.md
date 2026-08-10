# Gate build-W5-coupon — Stripe products, prices & the free-forever coupon  (actor: VOM)

**Workstream:** `W5_payments`  ·  **Opened:** 2026-07-29  ·  **Status:** waiting on VOM

The live site captures reservations; **online card payment is not wired yet**. When you want real
checkout, these are the exact steps — done in **your own Stripe dashboard** (agents never touch
Stripe keys). This is an **operator-run** instance, so it uses **VOM's own Stripe account directly**
(no Connect Express — that's only for client tenants).

## 1. Products & prices (Stripe → Product catalog)
1. **Product:** "Ministry AI Assessment" → one-time price **€295.00 EUR**.
2. **Product:** "AI Concierge — Ministry" → recurring price **€350.00 EUR / month** (founding rate).

## 2. The free-forever coupon (Stripe → Product catalog → Coupons)
1. **Create coupon:**
   - Name: **Founding Church — Free Forever**
   - Type: **Percentage**, **100% off**
   - Duration: **Forever** (so it also zeroes the recurring retainer, not just the first month)
   - (Optional) Limit: **redeem 1** / restrict to specific customers so it can't leak.
2. **Create a promotion code** on that coupon: code **`FOUNDINGCHURCH`** (matches the code already
   live on the site's reservation form). This is what your church enters at checkout for €0 forever.

## 3. Wire checkout — ALREADY BUILT ✅ (you just add the key)
The Stripe Checkout endpoint is **built and live**: `api/checkout.js` on the `vom-ministry-ai`
Vercel project creates a Checkout Session for the €295 assessment (inline `price_data`, EUR) with
`allow_promotion_codes: true`. The site's **"Book & pay — €295"** button already calls it; today it
returns a graceful "not switched on yet" message.

**To switch it on — ONE step (you do it; the agent never sees the key):**
1. Vercel → project **vom-ministry-ai** → Settings → Environment Variables → add
   **`STRIPE_SECRET_KEY`** = your live secret key (`sk_live_…`) for **Production**. Redeploy (or it
   applies on next deploy). That's it — the button now opens real Stripe Checkout.
2. For the free-forever path, create the **coupon + promotion code `FOUNDINGCHURCH`** (§2 above) so
   your church enters it on Stripe's checkout page for €0.
   *(Alternative, zero-env: a Stripe **Payment Link** with "Allow promotion codes" on — paste its
   URL and skip the key entirely; but the built endpoint is cleaner and already wired.)*

## 4. Certify the rail (VOM gate — money movement)
Before announcing paid checkout: run **one live test purchase + refund** (or a €0 run through the
`FOUNDINGCHURCH` code) to confirm the flow works. Money moving = a logged consent line.

## Note on the site's current code
The `FOUNDINGCHURCH` code on the live site today is a **front-end reservation confirmation** (it
marks the lead as a founding church) — real €0 enforcement happens once the Stripe promotion code
above exists and checkout is wired. Keep the two codes identical so the experience is seamless.

**Prerequisite still open:** the **Dutch-lawyer terms/refund review** (`dutch_lawyer_terms`) before
publishing live refund/terms mechanics on the paid checkout — deferred per operator direction, but
required before charging arm's-length customers (your own church as a free founding case is fine).
