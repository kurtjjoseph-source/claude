# Gate foundation-W3 — Domain, DNS delegation & Brevo sender  (actors: VOM + CLIENT)

**Workstream:** `W3_domain`  ·  **Opened:** 2026-07-29  ·  **Status:** waiting on VOM

Records + steps prepared in `turnkey/foundation/domain-email.md`.

**W1 decision changes this materially:** operator-run under VOM ⇒ **no client-owned custom domain
purchase** (D4 applies to client tenants, not VOM's own offer). The offer lives on **VOM's own
`visionoutreachmedia.nl`** (a subdomain or path) — which VOM already controls — so the
`clients.visionoutreachmedia.nl` delegation is **no longer on the critical path** for this launch.
Provisional build hostname `aitools.clients.visionoutreachmedia.nl` was a placeholder only.

**Steps (VOM):**
1. Choose the final home on VOM's domain — e.g. `ai.visionoutreachmedia.nl` (subdomain) or
   `visionoutreachmedia.nl/ai-assessment` (path). Create the DNS/routing record in VOM's own zone
   (already controlled — no delegation needed). Point it at the Build deploy target.
2. **Brevo sender:** reuse VOM's **existing verified sender** (VOM already sends via Brevo for
   Engage AI password reset) — likely no new domain-auth needed; just confirm the sending address
   for this offer. No email is sent by this step.
3. (Optional) A dedicated church-AI-assessment domain instead of a VOM subdomain — only if the
   operator wants distinct branding; not required.
