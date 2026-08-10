# Provisioning — church f god amersfoort

*Generated 2026-08-04T23:19:32Z · spec `sha256:df68299f63814325028b38194fa94a85`*

What must exist before this platform can serve traffic, in the order it must exist. Every item names its actor: **AUTO** the machine may do alone, **VOM** the operator must do (an account or a credential), **CLIENT** the owner must do (a signature or an identity check).

| # | Rail | Actor | Value | State |
|---|---|---|---|---|
| 1 | **Hostname** | `AUTO` | `coga.nl.clients.visionoutreachmedia.nl` | a subdomain in the operator's delegated zone — no registration needed |
| 2 | **DNS** | `AUTO` | `coga.nl.clients.visionoutreachmedia.nl` → vercel | managed in Cloudflare (delegated clients zone) |
| 3 | **Hosting project** | `AUTO` | `church-f-god-amersfoort` | Vercel (scope kurtjjoseph-6989) — created by Forge's deploy stage |
| 4 | **TLS** | `AUTO` | `https://coga.nl.clients.visionoutreachmedia.nl` | issued automatically once DNS resolves |
| 5 | **Payments** | `VOM` | stripe | built and labelled in the interface; goes live when the operator supplies: `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY` |
| 6 | **Email** | `VOM` | brevo | built and labelled in the interface; goes live when the operator supplies: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` |
| 7 | **Analytics** | `VOM` | engage_ai | built and labelled in the interface; goes live when the operator supplies: `ENGAGE_AI_BASE_URL` |
| 8 | **Unattended authorization** | `VOM` | 6b1b2513ace373ee | one logged YES covering the whole run; without it Forge refuses every public target |

## Environment

These are not held by the builder and never appear in this repository. Set them where Forge runs:

```bash
export BREVO_API_KEY="…"
export BREVO_SENDER_EMAIL="…"
export ENGAGE_AI_BASE_URL="…"
export STRIPE_PUBLISHABLE_KEY="…"
export STRIPE_SECRET_KEY="…"
```

## What blocks an unattended build

- **Payments** — built and labelled in the interface; goes live when the operator supplies: `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`
- **Email** — built and labelled in the interface; goes live when the operator supplies: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`
- **Analytics** — built and labelled in the interface; goes live when the operator supplies: `ENGAGE_AI_BASE_URL`
- **Unattended authorization** — one logged YES covering the whole run; without it Forge refuses every public target

Everything else Forge does alone. The items above are the only reason a human is still in this pipeline, and each one is an account, a signature or a credential — categorically not something an agent should hold.

## Order

```
1. Hostname
2. DNS
3. Hosting project
4. TLS
5. Payments
6. Email
7. Analytics
8. Unattended authorization
```

---

Prepared by Vision Outreach Media (VOM).
