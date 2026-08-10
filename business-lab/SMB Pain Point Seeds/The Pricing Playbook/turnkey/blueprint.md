# Business blueprint — The Pricing Playbook

> Which business functions this organization needs, and what its site runs on. Produced deterministically by the Turnkey engine from the business profile; every line is overridable by the operator and every override is logged.

**Prepared by Vision Outreach Media (VOM)** · 2026-08-06T01:50:33Z

## 1. Organization type

**Digital products** — Sells files, templates or downloads — no stock, instant delivery.

- Classification: `operator`, confidence **explicit**
- Revenue shape: One-off digital sales; near-100% margin, fulfilment is a webhook

## 2. Site platform decision

### Custom app (Vercel) — confidence medium

A custom app — the offer needs logic and speed more than it needs a CMS.

- **WordPress used:** NO
- **Hosting:** Vercel (scope kurtjjoseph-6989)
- **Score:** WordPress 3.0 · custom app 5.0 (margin 2.0)

**Why:**

- *(Custom app (Vercel), +3)* Digital products: The whole business is a funnel plus a fulfilment webhook; a CMS adds surface area and maintenance without adding sales.
- *(WordPress, +1.5)* Functions with mature WordPress coverage: Product catalog (what is for sale, at what price), Content publishing (blog / news / articles)
- *(Custom app (Vercel), +2)* The offer contains custom application logic that a CMS would fight.
- *(WordPress, +1.5)* Operator rail: VOM ships the Engage AI WordPress plugin — on a WordPress site the owner gets the Content Studio, publishing and ground-truth analytics inside their own wp-admin. This is a tie-breaker advantage, not a reason to force WordPress on a business that structurally needs an application.

**Revisit this decision if:**

- The owner starts publishing weekly and every edit becomes a deploy.
- A catalog with stock/shipping appears → WooCommerce stops being reinvented.
- Staff turnover means nobody can touch the code.

## 3. Business functions to build

| Function | Tier | Area | Workstream | How it gets built |
|---|---|---|---|---|
| **CRM — contacts, pipeline, running inventory** | ● core | Back office | `W10_crm` | Operator-side CRM; app forms feed it |
| **Finance & admin (invoicing, VAT, bookkeeping)** | ● core | Back office | `W2_legal` | NL bookkeeping tool + Stripe payouts reconciled monthly |
| **Digital fulfilment (deliver the file / grant the access)** 🔒 | ● core | Delivery | `W6_products` | Stripe webhook → signed download link + buyer email (Brevo) |
| **Public web presence** 🔒 | ● core | Front of house | `W4_website` | Next.js site on Vercel — home, offer, about, contact |
| **Analytics & presence reporting** | ● core | Growth | `W7_presence` | Analytics + the Engage AI server-side website probe |
| **Checkout & payments** 🔒 | ● core | Revenue | `W5_payments` | Stripe Checkout / Payment Links; iDEAL enabled for NL |
| **Product catalog (what is for sale, at what price)** | ● core | Revenue | `W6_products` | Catalog defined in Stripe products/prices, rendered from the API |
| **Content publishing (blog / news / articles)** | ◐ recommended | Front of house | `W4_website` | MDX content collection — every edit is a code deploy |
| **Lead capture (forms, lead magnet, CTA)** | ◐ recommended | Front of house | `W9_leads` | Form route → CRM + Brevo list |
| **Email list & broadcasts** 🔒 | ◐ recommended | Growth | `W9_leads` | Brevo list + form route; broadcasts sent from Brevo |
| **Social content production & scheduling** 🔒 | ◐ recommended | Growth | `W8_social` | Content produced operator-side; owner approves the weekly digest |
| **Support inbox & FAQ** 🔒 | ○ optional | Back office | `W11_followups` | Shared mailbox + FAQ routes; replies drafted, human-approved |
| **Course delivery (LMS)** | ○ optional | Delivery | `W6_products` | Course routes + progress store, or an external LMS embed |
| **Member area & access control** | ○ optional | Delivery | `W6_products` | Auth + entitlement check per route |
| **Subscriptions / recurring billing** 🔒 | ○ optional | Revenue | `W5_payments` | Stripe Billing + customer portal |

🔒 = switching this function on for real is a publish/send/money gate — it needs a logged YES before it can go live.

## 4. What each workstream must now deliver

- **`W10_crm`** — CRM — contacts, pipeline, running inventory
- **`W2_legal`** — Finance & admin (invoicing, VAT, bookkeeping)
- **`W4_website`** — Content publishing (blog / news / articles); Public web presence
- **`W5_payments`** — Checkout & payments
- **`W6_products`** — Digital fulfilment (deliver the file / grant the access); Product catalog (what is for sale, at what price)
- **`W7_presence`** — Analytics & presence reporting
- **`W8_social`** — Social content production & scheduling
- **`W9_leads`** — Email list & broadcasts; Lead capture (forms, lead magnet, CTA)

