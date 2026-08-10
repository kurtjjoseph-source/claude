# Payments Architecture — Stripe Connect (removes client-side Stripe gates)

**Author:** Backend Dev · **Scope:** multi-tenant payments for client businesses onboarded by VOM's agent system. VOM's own Stripe account (live, KYC'd, NL) becomes the **Connect platform account**. Client orgs (church, small biz) become **connected accounts**. Money from a client's customers must land in the client's IBAN, not VOM's.

**Hard invariant (unchanged):** identity verification, bank-detail entry, and approving money movement stay human — but move to Stripe-*hosted* flows the client completes themselves. No agent ever sees or enters a client's ID, IBAN, or API keys.

---

## 1. Connect account type: **Express**

| | Standard | **Express (chosen)** | Custom |
|---|---|---|---|
| Onboarding UX | Client gets a full Stripe account + login — has to understand Stripe as a product | Stripe-hosted onboarding flow (`Account Link`), mobile-first, ~10 min, no separate "learn Stripe" step | No Stripe UI at all — platform must build its own KYC forms |
| Liability / Stripe ToS | Client is a direct Stripe party, own ToS acceptance | Stripe owns identity verification + compliance; platform carries lighter operational liability | Platform effectively becomes the compliance/support surface — heavy liability for a solo operator |
| Dashboard exposure | Full Stripe Dashboard (overkill, confusing for a non-technical church admin) | Express Dashboard — balance, payouts, a handful of settings only; simple enough for phone use | None by default — platform must build one |
| NL / iDEAL / SEPA | Supported | Supported | Supported, but platform must wire every payment method itself |
| Cost per account | Standard Connect fees | Standard Connect fees + small per-active-account fee (no extra KYC cost to VOM) | Same fee tier as Express, plus VOM's engineering cost of owning KYC UI/support |
| Build effort for a 1-person platform | Low-medium | **Low** — Stripe's hosted flow does 100% of the non-technical-user-facing work | High — must replicate Stripe's own onboarding/compliance UX |

**Decision: Express.** It is the only option where the client never sees a Stripe Dashboard concept beyond a simplified balance view, KYC is 100% Stripe-hosted (photo ID, IBAN), and VOM's platform carries no custom compliance UI. Standard fails the "never touches a dashboard" goal; Custom fails the "agent/platform never handles identity docs" goal by pushing that burden onto VOM.

---

## 2. Client onboarding flow (agent-executed, one human step for the client)

1. **Agent creates the connected account** — `POST /v1/accounts` with `type=express`, `country=NL`, `email=<client email>`, `business_type` set from the org profile (`company` for a church/foundation, `individual` for a sole trader), `capabilities: [card_payments, transfers]`. Account ID (`acct_xxx`) is stored against the client's `business-profile.md`.
2. **Agent generates the hosted onboarding link** — `POST /v1/account_links` with `account=acct_xxx`, `type=account_onboarding`, `refresh_url`, `return_url`. Account Links expire a few minutes after creation, so the agent does **not** send this URL directly for later clicking.
3. **Delivery via WhatsApp/email magic link** — the agent sends the client a stable platform-owned short link (e.g. `pay.visionoutreachmedia.nl/onboard/<client-id>`). That link, when clicked, calls the Stripe API **at click-time** to mint a fresh `Account Link` and 302-redirects — sidesteps expiry entirely regardless of how long the WhatsApp message sits unread.
4. **Client completes KYC on their phone, in one sitting** — Stripe's hosted flow collects: business/org details, representative identity (photo ID capture), and **bank IBAN** for payout. All of this happens on `stripe.com`-hosted pages; the agent and VOM never see the document or the IBAN.
5. **Refresh / expired-link handling** — if the client clicks an expired Account Link, Stripe redirects to `refresh_url`. That endpoint (serverless function) immediately calls `POST /v1/account_links` again for the same `acct_xxx` and redirects — invisible to the client, no "expired link" dead end.
6. **Partial completion / resume** — Stripe's flow is stateful per account: if the client closes the tab midway, revisiting the same (freshly generated) Account Link resumes exactly where they left off, prefilled. The agent doesn't need to track partial state itself.
7. **Requirements polling** — two mechanisms, one primary one backup:
   - Primary: `account.updated` webhook (see §4) fires whenever `requirements` changes.
   - Backup: a daily scheduled check (`schedule` skill) runs `GET /v1/accounts/acct_xxx` for any account whose `requirements.currently_due` is non-empty after 24h, and has the agent draft a plain-language WhatsApp reminder ("one more step — takes 2 minutes") with a fresh onboarding link.
8. **Completion signal** — the agent treats the account as "live" only when `requirements.currently_due` is empty **and** `requirements.disabled_reason` is null, confirmed via `account.updated`, never by trusting the `return_url` redirect alone (the client may land there without finishing).

---

## 3. Products, prices, checkout — **destination charges**

**Direct charges vs destination charges:**

| | Direct charge | **Destination charge (chosen)** |
|---|---|---|
| Where Product/Price live | Must be created on each connected account (`Stripe-Account: acct_xxx` header per call) | Live once on the **platform account** — one catalog, managed centrally by the agent |
| Where Checkout Session is created | On the connected account | On the **platform account**, with `transfer_data[destination]=acct_xxx` |
| Fee mechanics | `application_fee_amount` still supported but bookkeeping split across many accounts | Clean: platform account holds the master ledger, `application_fee_amount` (flat) or `application_fee_percent` (on a `Subscription`/invoice) skims the platform cut, remainder auto-transfers to `acct_xxx` |
| Fit for "many small clients, one operator" | Poor — N catalogs to maintain | **Good** — matches how the onboarding system already treats products/prices as agent-managed specs (W5/W6 in the main onboarding plan) |

**Decision: destination charges.** The platform's catalog (Products/Prices) is created once via API and referenced in every client's Checkout Session; no per-connected-account catalog duplication.

- **Catalog:** agent creates `Product` (`POST /v1/products`) and `Price` (`POST /v1/prices`) objects on the platform account per the client's `business-profile.md` pricing (mirrors the existing W5 catalog design — one-off, subscription, founding tiers).
- **Checkout:** `POST /v1/checkout/sessions` — `line_items` reference the platform `Price`; `payment_method_types: [card, ideal, sepa_debit]` (iDEAL for the first payment, SEPA Direct Debit mandate created alongside for subscription renewals — same NL pattern already used for Church Media Academy); `payment_intent_data: { application_fee_amount, transfer_data: { destination: acct_xxx } }` for one-off; for recurring, a `Subscription` with `transfer_data[destination]` and `application_fee_percent`.
- **Platform fee:** `application_fee_amount` (flat, e.g. per transaction) or `application_fee_percent` (proportional, better for variable-price donations) — Stripe auto-splits at settlement: platform's cut stays in the platform balance, remainder transfers to the connected account's balance automatically. No manual transfer step, ever.

---

## 4. Webhooks — one endpoint, multiplexed by account

- **One platform endpoint** (e.g. a Vercel serverless function at `pay.visionoutreachmedia.nl/api/webhooks/stripe`), registered once in the platform account's Dashboard webhook settings with **"Listen to events on Connected accounts"** enabled — this is the mechanism that lets a single endpoint receive events for every client without per-client webhook config.
- **Routing:** every `Event` object carries an `account` field — present (`acct_xxx`) for connected-account events, absent for platform-owned events. The handler looks up `acct_xxx` against the client mapping (stored alongside each client's `business-profile.md`) to know which business the event belongs to.
- **Events subscribed:** `account.updated` (KYC/requirements changes), `checkout.session.completed` / `payment_intent.succeeded` (purchase complete), `charge.refunded`, `charge.dispute.created`, `payout.paid` / `payout.failed`, `capability.updated`, `account.application.deauthorized` (client disconnects the platform).
- **Fulfillment contract:** on `checkout.session.completed` (or `payment_intent.succeeded`), the handler reads `Product`/`Price` metadata (agent-set field `product_type`: membership / course / download / donation) to decide the action:
  - `membership` → grant member/portal access (W6 delivery automation)
  - `course`/`download` → send file link or Discord/community invite
  - `donation` → log only, no delivery
  - all types → trigger a receipt: Stripe's automatic email receipt (default) or a branded receipt via Brevo if white-labeling is wanted
  - all types → append a row to the client's `ops/transactions.md` (feeds W13 finance ops)

---

## 5. Payouts & visibility

- **Automatic payouts:** each connected account's `settings.payouts.schedule` is left at Stripe's default (`interval: daily`, automatic) — funds land in the client's IBAN with zero platform action per payout, ever.
- **What the client sees — two layers, not one:**
  1. **Express Dashboard (Stripe-hosted, optional):** accessed via a `Login Link` (`POST /v1/accounts/acct_xxx/login_links`) — shows balance and payout history only. Useful as a fallback if the client wants to update their own bank details later (still Stripe-hosted, still never touched by an agent).
  2. **White-label monthly statement (primary, platform-generated):** the agent pulls `GET /v1/balance_transactions` and `GET /v1/payouts` (with `Stripe-Account: acct_xxx`) once a month, renders a plain-language one-pager (gross revenue, platform fee, net paid out, transaction count) and emails it — this is the surface a non-technical client actually reads; the Express Dashboard is not expected to be their daily tool.

---

## 6. Failure paths

| Scenario | Trigger | Who acts |
|---|---|---|
| **KYC rejected / `requirements.past_due`** | `account.updated` webhook, `requirements.disabled_reason` populated or `currently_due` non-empty past deadline | Agent drafts a plain-language WhatsApp explaining the *specific* missing item (e.g. "the ID photo needs to show all four corners") with a fresh onboarding link; VOM is cc'd for visibility only. If `disabled_reason` indicates fraud/listed/rejection-for-cause → escalate to **VOM only**, no client contact, human review required. |
| **Refunds** | Client or VOM requests one | Agent drafts the refund (amount, reason) as a proposal; **VOM approves** and only then is `POST /v1/refunds` executed (money movement stays human per the hard invariant). On a destination charge this auto-reverses the transfer; `refund_application_fee=true` also returns the platform's cut if appropriate. |
| **Disputes** | `charge.dispute.created` webhook | Agent drafts an evidence packet (order record, delivery proof) and a plain-language client notice ("a customer disputed a charge — here's what it means, no action needed from you unless X"). **VOM reviews and submits** evidence (`POST /v1/disputes/{dispute}` or Dashboard) — never agent-submitted, since it's a legal representation to the card network. |

---

## 7. Residual human steps

| Who | Step | Frequency | Time |
|---|---|---|---|
| **CLIENT** | Complete the Stripe-hosted onboarding link (photo ID, IBAN) on their phone | **once**, target = 1 step | ~10 min |
| **KURT** | Enable Connect on the platform account + accept Connect Platform Agreement | one-time-ever | ~10 min |
| **KURT** | Enable iDEAL + SEPA Direct Debit on the platform account (already a named pending item in `onboarding-plan.md` §3.1) | one-time-ever | ~5 min |
| **KURT** | Register the single webhook endpoint with "connected accounts" events enabled | one-time-ever | ~5 min |
| **KURT** | Approve each refund / submit each dispute evidence | per-occurrence, ongoing | minutes |
| **KURT** | Review agent's escalation on a KYC rejected-for-cause account | rare, per-occurrence | minutes |
| **KURT** | First live test purchase + refund per new client (existing W5 invariant) | per-client, once | ~10 min |

---

## Assumptions / open items

- Assumes VOM's platform account is approved by Stripe to operate as a Connect **platform** (this is a distinct enablement from having a live standard account — flagged as a one-time-ever human gate above, status not yet verified).
- Assumes `business_type: company` is the right classification for church/non-profit connected accounts in NL; may need `non_profit`-specific fields depending on Stripe's current NL requirements schema — worth a one-time confirmation against live Stripe docs before the first real client onboards.
- White-label statement generation (§5) is new build, not yet implemented — scoped here as design only, per task instructions (no code).
