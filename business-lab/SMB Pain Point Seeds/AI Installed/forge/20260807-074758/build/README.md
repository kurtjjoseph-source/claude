# AI Installed

Built by **PRELAUNCHforge** from platform spec `sha256:f5e294dae47d251681d9a66fcab17dc2`,
run `20260807-074758`. Archetype: **Prelaunch validation funnel**.

Two things live here, and they are one system:

- **The public site** — the pages at the root. Open `index.html`.
- **The business platform** — `platform/index.html`. The modules the owner works in.
  Records typed there appear in the site's feeds; forms on the site land in its modules.

Everything is self-contained. No build step, no server, no dependencies.

## The platform

| Module | What it does |
|---|---|
| **Waitlist** | People who put their hand up, before they become contacts. |
| **People** | Everyone this business deals with, and where each one stands. |
| **Announcements** | The list, and what has been sent to it. |
| **Content** | Posts and announcements, drafted here before they go out. |
| **Inbox** | Questions coming in, and what was sent back. |

## The site

| File | Page | What it is for |
|---|---|---|
| `index.html` | Home | Say what it is, who it is for, and ask for an email. One screen, one decision. |
| `faq.html` | What happens next | Answer the suspicion that a waitlist is a trick. |

## Rails

| Rail | Provider | State | Needs |
|---|---|---|---|
| email | brevo | **stub** | BREVO_API_KEY, BREVO_SENDER_EMAIL |
| analytics | engage_ai | **stub** | ENGAGE_AI_BASE_URL |

A rail marked **stub** is fully built and clearly labelled in the interface — it starts
working the moment the operator supplies its credentials. The builder never holds them.

---

Prepared by Vision Outreach Media (VOM).
