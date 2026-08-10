# Business blueprint — AI Workday

> Which business functions this organization needs, and what its site runs on. Produced deterministically by the Turnkey engine from the business profile; every line is overridable by the operator and every override is logged.

**Prepared by Vision Outreach Media (VOM)** · 2026-08-06T01:49:16Z

## 1. Organization type

**Education / training provider** — Teaches a curriculum to enrolled learners, online or in person.

- Classification: `operator`, confidence **explicit**
- Revenue shape: Course/cohort fees, sometimes subsidised or invoiced to employers

## 2. Site platform decision

### WordPress — confidence high

WordPress — the owner keeps control of content without a developer.

- **WordPress used:** YES
- **Hosting:** one.com managed WordPress (VOM's own apex); client WordPress sites are hosted per-client and DNS-pointed from the delegated clients zone
- **Score:** WordPress 7.5 · custom app 0.0 (margin 7.5)

**Why:**

- *(WordPress, +2)* Education / training provider: Curriculum pages and lesson content change constantly and are written by teaching staff, not developers; the LMS plugins are mature.
- *(WordPress, +6.0)* Functions with mature WordPress coverage: Course delivery (LMS), Content publishing (blog / news / articles), Member area & access control, Events calendar & RSVP, Appointment booking / scheduling
- *(WordPress, +1.5)* Operator rail: VOM ships the Engage AI WordPress plugin — on a WordPress site the owner gets the Content Studio, publishing and ground-truth analytics inside their own wp-admin. This is a tie-breaker advantage, not a reason to force WordPress on a business that structurally needs an application.

**Revisit this decision if:**

- The owner will never edit the site themselves (then the CMS is pure maintenance).
- A core function turns out to need custom logic → move to hybrid.
- Plugin licence cost exceeds the build saving.

## 3. Business functions to build

| Function | Tier | Area | Workstream | How it gets built |
|---|---|---|---|---|
| **CRM — contacts, pipeline, running inventory** | ● core | Back office | `W10_crm` | Operator-side CRM (not in WordPress); site forms feed it |
| **Finance & admin (invoicing, VAT, bookkeeping)** | ● core | Back office | `W2_legal` | NL bookkeeping tool + Stripe payouts reconciled monthly |
| **Course delivery (LMS)** | ● core | Delivery | `W6_products` | LMS plugin (LearnDash/TutorLMS) — lessons, progress, certificates |
| **Member area & access control** | ● core | Delivery | `W6_products` | Membership plugin gating pages by plan; login lives on the client's site |
| **Content publishing (blog / news / articles)** | ● core | Front of house | `W4_website` | WordPress posts + categories; owner edits without a developer |
| **Public web presence** 🔒 | ● core | Front of house | `W4_website` | WordPress site (block theme) — home, offer, about, contact |
| **Analytics & presence reporting** | ● core | Growth | `W7_presence` | Engage AI plugin reports real page/post counts as ground truth |
| **Checkout & payments** 🔒 | ● core | Revenue | `W5_payments` | Stripe checkout (hosted) linked from Woo/pages; iDEAL enabled for NL |
| **Support inbox & FAQ** 🔒 | ◐ recommended | Back office | `W11_followups` | Shared mailbox + FAQ pages; replies drafted, human-approved |
| **Appointment booking / scheduling** | ◐ recommended | Front of house | `W4_website` | Booking plugin, or embed the operator's scheduling SaaS |
| **Events calendar & RSVP** | ◐ recommended | Front of house | `W4_website` | Events plugin (The Events Calendar) + RSVP form |
| **Lead capture (forms, lead magnet, CTA)** | ◐ recommended | Front of house | `W9_leads` | Form plugin → CRM + Brevo list |
| **Email list & broadcasts** 🔒 | ◐ recommended | Growth | `W9_leads` | Brevo list + form plugin; broadcasts sent from Brevo |
| **Social content production & scheduling** 🔒 | ◐ recommended | Growth | `W8_social` | Engage AI Content Studio inside wp-admin (owner-operable) |
| **People, volunteers & rosters** | ○ optional | Back office | `W10_crm` | Roster in the CRM; a public sign-up form on the site |
| **Product catalog (what is for sale, at what price)** | ○ optional | Revenue | `W6_products` | WooCommerce products/variations; Stripe as the gateway |
| **Subscriptions / recurring billing** 🔒 | ○ optional | Revenue | `W5_payments` | Stripe Billing (portal hosted by Stripe), membership plugin for access |

🔒 = switching this function on for real is a publish/send/money gate — it needs a logged YES before it can go live.

## 4. What each workstream must now deliver

- **`W10_crm`** — CRM — contacts, pipeline, running inventory
- **`W11_followups`** — Support inbox & FAQ
- **`W2_legal`** — Finance & admin (invoicing, VAT, bookkeeping)
- **`W4_website`** — Appointment booking / scheduling; Content publishing (blog / news / articles); Events calendar & RSVP; Public web presence
- **`W5_payments`** — Checkout & payments
- **`W6_products`** — Course delivery (LMS); Member area & access control
- **`W7_presence`** — Analytics & presence reporting
- **`W8_social`** — Social content production & scheduling
- **`W9_leads`** — Email list & broadcasts; Lead capture (forms, lead magnet, CTA)

