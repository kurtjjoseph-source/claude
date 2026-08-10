# Business blueprint — Gods Generation Church

> Which business functions this organization needs, and what its site runs on. Produced deterministically by the Turnkey engine from the business profile; every line is overridable by the operator and every override is logged.

**Prepared by Vision Outreach Media (VOM)** · 2026-08-01T09:32:23Z

## 1. Organization type

**Church / faith community** — Gathering-led, content-heavy, funded by giving rather than sales.

- Classification: `classifier`, confidence **high**
- Evidence in the profile: church, worship, ministry, congregation, bible, faith
- Also considered: nonprofit (9.0), service_business (7.0), membership (4.0)
- Revenue shape: Recurring giving + occasional event/ticket income

## 2. Site platform decision

### WordPress — confidence high

WordPress — the owner keeps control of content without a developer.

- **WordPress used:** YES
- **Hosting:** one.com managed WordPress (VOM's own apex); client WordPress sites are hosted per-client and DNS-pointed from the delegated clients zone
- **Score:** WordPress 12.5 · custom app 0.0 (margin 12.5)

**Why:**

- *(WordPress, +3)* Church / faith community: Weekly self-edited content (sermons, events, announcements) by non-technical staff is exactly WordPress's job; the plugin ecosystem covers giving, events and media out of the box.
- *(WordPress, +7.0)* Functions with mature WordPress coverage: Content publishing (blog / news / articles), Media library (sermons / video / podcast archive), Events calendar & RSVP, Donations & recurring giving
- *(WordPress, +4)* The business already runs on WordPress — rebuilding elsewhere means a migration nobody asked for.
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
| **People, volunteers & rosters** | ● core | Back office | `W10_crm` | Roster in the CRM; a public sign-up form on the site |
| **Content publishing (blog / news / articles)** | ● core | Front of house | `W4_website` | WordPress posts + categories; owner edits without a developer |
| **Events calendar & RSVP** | ● core | Front of house | `W4_website` | Events plugin (The Events Calendar) + RSVP form |
| **Media library (sermons / video / podcast archive)** | ● core | Front of house | `W4_website` | Custom post type + embeds (YouTube/Spotify), series taxonomy |
| **Public web presence** 🔒 | ● core | Front of house | `W4_website` | WordPress site (block theme) — home, offer, about, contact |
| **Analytics & presence reporting** | ● core | Growth | `W7_presence` | Engage AI plugin reports real page/post counts as ground truth |
| **Donations & recurring giving** 🔒 | ● core | Revenue | `W5_payments` | Giving plugin (GiveWP) or Stripe donation links + campaign pages |
| **Support inbox & FAQ** 🔒 | ◐ recommended | Back office | `W11_followups` | Shared mailbox + FAQ pages; replies drafted, human-approved |
| **Lead capture (forms, lead magnet, CTA)** | ◐ recommended | Front of house | `W9_leads` | Form plugin → CRM + Brevo list |
| **Email list & broadcasts** 🔒 | ◐ recommended | Growth | `W9_leads` | Brevo list + form plugin; broadcasts sent from Brevo |
| **Social content production & scheduling** 🔒 | ◐ recommended | Growth | `W8_social` | Engage AI Content Studio inside wp-admin (owner-operable) |
| **Member area & access control** | ○ optional | Delivery | `W6_products` | Membership plugin gating pages by plan; login lives on the client's site |
| **Appointment booking / scheduling** | ○ optional | Front of house | `W4_website` | Booking plugin, or embed the operator's scheduling SaaS |
| **Checkout & payments** 🔒 | ○ optional | Revenue | `W5_payments` | Stripe checkout (hosted) linked from Woo/pages; iDEAL enabled for NL |
| **Product catalog (what is for sale, at what price)** | ○ optional | Revenue | `W6_products` | WooCommerce products/variations; Stripe as the gateway |

🔒 = switching this function on for real is a publish/send/money gate — it needs a logged YES before it can go live.

## 4. What each workstream must now deliver

- **`W10_crm`** — CRM — contacts, pipeline, running inventory; People, volunteers & rosters
- **`W11_followups`** — Support inbox & FAQ
- **`W2_legal`** — Finance & admin (invoicing, VAT, bookkeeping)
- **`W4_website`** — Content publishing (blog / news / articles); Events calendar & RSVP; Media library (sermons / video / podcast archive); Public web presence
- **`W5_payments`** — Donations & recurring giving
- **`W7_presence`** — Analytics & presence reporting
- **`W8_social`** — Social content production & scheduling
- **`W9_leads`** — Email list & broadcasts; Lead capture (forms, lead magnet, CTA)

