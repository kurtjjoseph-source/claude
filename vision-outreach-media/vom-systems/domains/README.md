# VOM Domain Desk

VOM registers and manages client domains through **one wholesale registrar account**, at registry
cost, with the **client named as registrant**. Internal-only: no storefront, no markup, no resale.

| File | What it is |
|---|---|
| `registrar-decision.md` | Why Openprovider over SIDN-direct / Cloudflare / Realtime Register / one.com / TransIP, what internal-only wholesale means, and the **operator signup runbook** (§4 — Kurt's steps). |
| `cost-model.md` | Wholesale cost per TLD vs NL retail, **break-even ≈ 5 domains**, three ways to put the cost on a client invoice (A recommended), and a costed appendix on what resale *would* be worth. |
| `domains-page.html` | Client-facing page — "Your domain. Your name on it. Registered at cost." Corporate brand mode (navy/orange/teal, Manrope, real logo). Formsubmit → `hello@visionoutreachmedia.nl`. **Not deployed.** |

## Status

- ✅ Decision made, runbook written, W3 rewritten, page built.
- ⏳ **Blocked on the operator:** the Openprovider account does not exist yet. Nothing downstream
  (API automation, first client registration) can happen until `registrar-decision.md` §4 is done.
- ⏳ Page not deployed — publishing is a separate explicit decision.

## Where this plugs into Turnkey

- `Business Onboarding System/onboarding-plan.md` — W3 rewritten: domain registration + DNS moved
  from 🟡 human gate to 🟢 AUTO, behind a one-time account gate and a per-business first-spend YES.
- `.claude/agents/biz-foundation.md` (+ the mirror in `../turnkey/orchestrator/agents/`) — same.
- `../turnkey/orchestrator/operator.json` — `platform.registrar_wholesale`.
- `../turnkey/orchestrator/engine/turnkey.py` — gate-matrix key `registrar_nl` (decided, pending
  provisioning).

## Two rails that must not be broken

1. **Client is always the registrant.** VOM is admin/tech contact only. This is governance rail D4.
2. **Transfer-out is free, unconditional, within two working days.** Stated in the client terms and
   on the client-facing page. Never used as leverage.

## To deploy the page (when approved)

```bash
cd "/Users/kurtjoseph/Business Ideas/vom-systems/domains" && mkdir -p _deploy && cp domains-page.html _deploy/index.html && vercel deploy _deploy --prod --yes
```

Then pin a clean alias (`vom-domains.vercel.app`) to match the house URL convention, and link it
from the funnels page and/or the real site.
