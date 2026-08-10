# Business blueprint — AI Tools Assessment Business

> Which business functions this organization needs, and what its site runs on. Produced deterministically by the Turnkey engine from the business profile; every line is overridable by the operator and every override is logged.

**Prepared by Vision Outreach Media (VOM)** · 2026-07-30T22:35:16Z

## 1. Organization type

**Service business / consultancy / agency** — Sells time and expertise to a small number of higher-value clients.

- Classification: `classifier`, confidence **high**
- Evidence in the profile: assessment, implementation, retainer, deliverable, maintenance, audit
- Also considered: church (14.0), digital_products (5.25), membership (4.0)
- Revenue shape: Projects and retainers, invoiced; deposits via checkout

## 2. Site platform decision

### Custom app (Vercel) — confidence low

Tie on the evidence; defaulting to the custom app (cheaper to run, no plugin maintenance) — operator can override.

- **WordPress used:** NO
- **Hosting:** Vercel (scope kurtjjoseph-6989)
- **Score:** WordPress 3.0 · custom app 3.0 (margin 0.0)

**Why:**

- *(Custom app (Vercel), +1)* Service business / consultancy / agency: A service business sells through a small set of high-conversion pages that rarely change — a fast custom site beats a CMS unless the owner publishes regularly.
- *(WordPress, +1.5)* Functions with mature WordPress coverage: Appointment booking / scheduling, Content publishing (blog / news / articles)
- *(Custom app (Vercel), +2)* The site is a funnel, not a library — a fast custom page beats a CMS.
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
| **Quotes, proposals & contracts** | ● core | Back office | `W10_crm` | Template pack + e-sign SaaS, tracked on the CRM record |
| **Appointment booking / scheduling** | ● core | Front of house | `W4_website` | Embedded scheduling SaaS (Cal.com/Calendly) + webhook to CRM |
| **Lead capture (forms, lead magnet, CTA)** | ● core | Front of house | `W9_leads` | Form route → CRM + Brevo list |
| **Public web presence** 🔒 | ● core | Front of house | `W4_website` | Next.js site on Vercel — home, offer, about, contact |
| **Analytics & presence reporting** | ● core | Growth | `W7_presence` | Analytics + the Engage AI server-side website probe |
| **Checkout & payments** 🔒 | ● core | Revenue | `W5_payments` | Stripe Checkout / Payment Links; iDEAL enabled for NL |
| **Support inbox & FAQ** 🔒 | ◐ recommended | Back office | `W11_followups` | Shared mailbox + FAQ routes; replies drafted, human-approved |
| **Content publishing (blog / news / articles)** | ◐ recommended | Front of house | `W4_website` | MDX content collection — every edit is a code deploy |
| **Email list & broadcasts** 🔒 | ◐ recommended | Growth | `W9_leads` | Brevo list + form route; broadcasts sent from Brevo |
| **Social content production & scheduling** 🔒 | ◐ recommended | Growth | `W8_social` | Content produced operator-side; owner approves the weekly digest |
| **Course delivery (LMS)** | ○ optional | Delivery | `W6_products` | Course routes + progress store, or an external LMS embed |
| **Member area & access control** | ○ optional | Delivery | `W6_products` | Auth + entitlement check per route |
| **Product catalog (what is for sale, at what price)** | ○ optional | Revenue | `W6_products` | Catalog defined in Stripe products/prices, rendered from the API |
| **Subscriptions / recurring billing** 🔒 | ○ optional | Revenue | `W5_payments` | Stripe Billing + customer portal |

🔒 = switching this function on for real is a publish/send/money gate — it needs a logged YES before it can go live.

## 4. What each workstream must now deliver

- **`W10_crm`** — CRM — contacts, pipeline, running inventory; Quotes, proposals & contracts
- **`W11_followups`** — Support inbox & FAQ
- **`W2_legal`** — Finance & admin (invoicing, VAT, bookkeeping)
- **`W4_website`** — Appointment booking / scheduling; Content publishing (blog / news / articles); Public web presence
- **`W5_payments`** — Checkout & payments
- **`W7_presence`** — Analytics & presence reporting
- **`W8_social`** — Social content production & scheduling
- **`W9_leads`** — Email list & broadcasts; Lead capture (forms, lead magnet, CTA)

