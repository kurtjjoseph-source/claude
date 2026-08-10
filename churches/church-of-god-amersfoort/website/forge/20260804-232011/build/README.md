# church f god amersfoort

Built by **CHURCHforge** from platform spec `sha256:d4d648a57b5243926a1b8a79bb0a8d6b`,
run `20260804-232011`. Archetype: **Church / faith community**.

Two things live here, and they are one system:

- **The public site** — the pages at the root. Open `index.html`.
- **The business platform** — `platform/index.html`. The modules the owner works in.
  Records typed there appear in the site's feeds; forms on the site land in its modules.

Everything is self-contained. No build step, no server, no dependencies.

## The platform

| Module | What it does |
|---|---|
| **Events** | What is happening, and who is coming. |
| **Giving** | Gifts and pledges, one-off and recurring. |
| **Sermons** | Talks, sermons and recordings, with where they live. |
| **Serving rota** | Who is serving, when, and in what role. |
| **People** | Everyone this business deals with, and where each one stands. |
| **Messages** | Questions coming in, and what was sent back. |
| **Content** | Posts and announcements, drafted here before they go out. |
| **Mailing list** | The list, and what has been sent to it. |
| **Finances** | What has been billed, what has been paid, and the VAT on it. |
| **New here** | People who put their hand up, before they become contacts. |

## The site

| File | Page | What it is for |
|---|---|---|
| `index.html` | Home | Answer 'can I come on Sunday, and what happens if I do?' in the first screen. |
| `visit.html` | Plan your visit | Remove every unknown that keeps a first-time visitor at home. |
| `about.html` | About | Say what this church believes and who leads it, without jargon. |
| `sermons.html` | Sermons | The teaching archive — the main reason people return to a church site. |
| `events.html` | Events | Everything on the calendar, with enough detail to turn up. |
| `give.html` | Give | Make giving simple and unembarrassing, and say where it goes. |
| `contact.html` | Contact | One place to reach a human, plus prayer requests. |

## Rails

| Rail | Provider | State | Needs |
|---|---|---|---|
| payments | stripe | **stub** | STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY |
| email | brevo | **stub** | BREVO_API_KEY, BREVO_SENDER_EMAIL |
| analytics | engage_ai | **stub** | ENGAGE_AI_BASE_URL |

A rail marked **stub** is fully built and clearly labelled in the interface — it starts
working the moment the operator supplies its credentials. The builder never holds them.

---

Prepared by Vision Outreach Media (VOM).
