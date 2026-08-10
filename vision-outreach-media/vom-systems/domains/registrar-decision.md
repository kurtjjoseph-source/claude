# VOM Domain Desk — Registrar Decision & Setup Runbook

**Owner:** Vision Outreach Media (VOM)
**Model chosen:** **Internal-only wholesale.** VOM holds one wholesale registrar account and
registers/manages client domains through it **at cost, with no markup**. There is no public
storefront and no resale margin. The win is operational: one panel, one API, one renewal calendar,
lower cost, and W3 of Turnkey stops being a human gate.
**Date:** 2026-07-30
**Status:** Decision made. Account signup is an operator action (see §4) — VOM has no wholesale
account yet.

---

## 1. Decision

> **Open an Openprovider Membership (Basic S) as VOM's wholesale registrar account.**
> Register every client domain through it, with the **client named as registrant** and VOM as
> technical/administrative manager. Charge the client the exact registry cost, itemised.

Openprovider is a Rotterdam-based reseller platform: NL company, NL invoicing, SIDN-accredited for
`.nl`, ~1,900 TLDs, full REST API, free WHOIS privacy, and its own DNS. Its business model is a flat
membership fee instead of per-domain markup — which is precisely the shape of the internal-only
model: pay a small fixed subscription, get registry cost price on every domain.

---

## 2. Why not the alternatives

| Option | Verdict | Reason |
|---|---|---|
| **SIDN direct registrar** | ❌ Out | SIDN charges a **€87.50/month ex VAT** registrar fee (€1,050/yr) plus a Trade Register extract and technical onboarding. That is ~19× the Openprovider membership, and only covers `.nl` — every other TLD would still need a second provider. Correct choice at hundreds of domains; absurd at ten. |
| **Cloudflare Registrar** | ❌ Out for `.nl` | Genuinely at-cost with no markup, and the current Turnkey docs recommend it — **but Cloudflare Registrar does not support `.nl`**. Feature requests for it are still open as of Feb 2026. Since `.nl` is the default TLD for NL-facing church/local clients, this cannot be the primary. Also: no API-driven *registration* (you can only transfer domains you already own in), so it can't automate W3 either. **This is a correction to the existing `biz-foundation` guidance.** |
| **Realtime Register** (Enschede, NL) | 🥈 Viable runner-up | Solid NL platform, good API, and its **GO!ORANGE** plan gives the first ~100 domains at registry cost for a small monthly fee — structurally the same deal as Openprovider. Slightly more enterprise-shaped onboarding, and its standard pricing uses a deposit/volume "slab" system that only drops to cost with commitment. Take it if Openprovider's onboarding stalls. |
| **one.com** (VOM's current registrar) | ❌ Not for new client domains | Fine as the incumbent for `visionoutreachmedia.nl` and the other five owned domains — **do not touch it.** But it's a retail consumer registrar: no wholesale pricing, and **no API access configured**, which is exactly why W3 is a manual copy-paste gate today. |
| **TransIP / Hostnet / Antagonist** | ❌ Out | Retail. TransIP's published regular rate is **€16.50/yr** for `.nl` and **€27.99/yr** for `.com` — roughly 3× registry cost. Good UX, wrong side of the counter. |
| **Namecheap / GoDaddy reseller** | ❌ Out | US-based, USD invoicing, weaker `.nl` handling, and reseller programmes built around markup rather than at-cost. Adds FX and VAT friction for a Dutch entity. |

---

## 3. What "internal-only, no markup" means in practice

Three commitments, and they matter because they are what keep governance rail **D4 (no hostage
lever)** intact while VOM moves the domain in-house:

1. **The client is the registrant.** VOM is listed as admin/tech contact, never as owner. The
   client's name, address and email go in the registrant record. If the relationship ends, the
   domain is theirs and leaves with them.
2. **Cost is passed through at cost, itemised.** The client sees the same number VOM paid. VOM's
   compensation for doing the work sits in the launch fee or retainer — not hidden in a domain
   renewal. (The alternative — recovering it as an admin line — is modelled in `cost-model.md`.)
3. **Transfer-out is unconditional and free.** VOM releases the auth/EPP code on request, within
   two business days, with no exit fee and no "we'll unlock it once you've paid" clause. Write this
   into the client terms; it is the single sentence that turns "VOM holds our domain" from a risk
   into a service.

Under this model the reseller account is a **procurement and operations tool**, not a revenue line.
It pays for itself through cost savings and removed manual work, not margin — see `cost-model.md`.

---

## 4. Setup runbook — the operator's steps

I cannot create accounts, enter payment details, or sign agreements. Every step below is Kurt's to
click. Budget ~45 minutes, plus up to 1–2 business days for KYB verification.

**Have ready before starting:** KVK number and a Trade Register extract (uittreksel) less than 6
months old, the VOM BTW/VAT number, a business bank card or SEPA mandate, and
`hello@visionoutreachmedia.nl` for the account email (not a personal Gmail — matches the house
standard).

1. **Create the account.** Go to `openprovider.com` → *Sign up*. Register as **Vision Outreach
   Media** (business account), with the KVK number and the VAT number. A free account is created
   first; it works at retail pricing until the membership is added.
2. **Complete business verification.** Upload the KVK extract. Openprovider verifies before
   enabling `.nl` registration, because SIDN requires the chain of accreditation to be documented.
   This is the step that can take a day or two.
3. **Add the VAT number to billing** so invoices are issued with the reverse-charge / correct NL
   VAT treatment. Getting this right at signup avoids reclaiming VAT later.
4. **Buy the membership: Basic S.** Pricing page → *Memberships* → **Basic S**, currently listed at
   **$4.16/month billed annually (~$49.99/yr)**, covering **up to 100 domain operations** per year.
   That is far more headroom than VOM needs for years. Do **not** start higher — Basic M (~$16.66/mo,
   500 ops) is only worth it past ~100 domains/yr.
5. **Fund the account balance.** Openprovider works from a prepaid balance. Deposit €50–100 to
   start; that covers roughly 10–20 `.nl` years. Set a low-balance email alert.
6. **Turn on auto-renew, globally.** Settings → renewal defaults → **auto-renew ON**. A lapsed
   client domain is the single worst failure mode of this whole system; the €4-something is never
   worth the risk of losing it.
7. **Enable free WHOIS privacy by default** where the TLD allows it. (`.nl` already hides private
   registrants' details by default via SIDN; gTLDs like `.com` need the privacy toggle.)
8. **Create an API key.** Account → API / Access. Restrict it by IP if VOM's automation runs from a
   fixed host; otherwise leave open but store the key in the password manager, **not** in any repo.
   Give me the key's *existence* — not the value — and I can write the W3 automation against it.
9. **Set the DNS strategy.** Two supported patterns, pick per client:
   - **VOM-managed (default):** point the domain's nameservers at Openprovider DNS (or at the
     Cloudflare `clients.` zone, if that delegation is live) and VOM manages all records.
   - **Client-managed:** the client keeps DNS wherever they like; VOM supplies exact records.
10. **Register one test domain end-to-end** before any client touches it — something cheap and
    disposable — then transfer it out to a different registrar to prove the exit path actually
    works. A transfer-out promise you have never tested is not a promise.

**Do not** migrate `visionoutreachmedia.nl` or any of the five existing one.com domains as part of
this. That zone carries live Brevo mail records and the `cma.` production site; moving it is a
separate, deliberately deferred decision (a 🔴 gate in the onboarding plan). The new account is for
**new client domains only**.

---

## 5. What VOM gets that it doesn't have today

- **W3 stops being a human gate.** Domain availability check, registration, DNS record creation and
  verification all become API calls. Foundation can take a business from "name decided" to "live
  hostname with correct DNS" without Kurt opening a browser panel.
- **One renewal calendar** across every client, with auto-renew and expiry alerts, instead of N
  client accounts at N registrars with N credit cards and N expiry dates nobody is watching.
- **No credential sprawl.** VOM never asks a church for their registrar login — the recurring
  awkward moment in the current model, and a small security disaster every time it happens.
- **Cost transparency as a selling point.** "We register it at the registry's own price, €4.38 a
  year, and it's in your name" is a strong trust line for exactly the non-technical, budget-careful
  clients Turnkey targets.

---

## 6. Risks and how they're handled

| Risk | Handling |
|---|---|
| **VOM becomes a single point of failure** for client domains | Auto-renew on; funded balance with a low-balance alert; the registrant is the client, so worst case they can always recover the domain from the registrar directly. |
| **Perceived lock-in** ("VOM controls our domain") | Rail D4 + the unconditional free transfer-out clause in §3, stated in the client terms *and* on the client-facing page. |
| **Registry price rises** (SIDN adjusts `.nl` annually; Verisign may raise `.com` up to 7%/yr) | At-cost pass-through means increases flow to the client automatically with no renegotiation. Note it once in the terms so nobody is surprised. |
| **Membership fee wasted at low volume** | Break-even is ~4 domains (see `cost-model.md`). Below that, keep registering at retail on the free Openprovider account — the account still gives one panel and the API; only the cost price needs the membership. |
| **Reselling regulated?** | Acting as a reseller under an accredited registrar carries no separate NL licence requirement. But VOM is contractually bound to pass SIDN's registrant terms through to clients — Openprovider handles that in its own terms; make sure the VOM client terms reference it. **Flag for the Dutch-lawyer terms review that is already an open prerequisite.** |
| **API key leakage** | Password manager only, never in a repo. (There is already an exposed-token incident in this house — `VERCEL_OIDC_TOKEN` — that is still open. Don't repeat it.) |

---

## 7. Open items

- [ ] **Operator:** run §4 steps 1–10. Nothing downstream can be automated until the account exists.
- [ ] **Operator:** confirm the current-month Openprovider membership price and the exact `.nl` cost
      price once logged in — wholesale figures sit behind the reseller login, so the numbers in
      `cost-model.md` are sourced from public registry/retail data and should be replaced with the
      real invoice figures after signup.
- [ ] **Lawyer:** domain clause in the client terms — registrant = client, transfer-out free and
      unconditional, at-cost pass-through, registry price changes flow through.
- [ ] **Agent (me), once the API key exists:** wire W3 to the Openprovider API (see the rewritten
      W3 in `Business Onboarding System/onboarding-plan.md`).

---

## Sources

- SIDN, [Our prices](https://www.sidn.nl/en/our-prices) — `.nl` registry price €4.38/yr ex VAT (2026)
- SIDN, [Becoming a registrar](https://www.sidn.nl/en/nl-domain-name/becoming-a-registrar) — €87.50/month ex VAT registrar fee
- Openprovider, [Membership plans](https://www.openprovider.com/membership-plans) — Basic S $4.16/mo billed annually, 100 domain operations
- Openprovider, [Are domain prices going up](https://www.openprovider.com/blog/are-domain-prices-going-up) — `.com` up to 7%/yr, `.net` up to 10%/yr
- Realtime Register, [Wholesale domains](https://realtimeregister.com/solutions/domains/domain-management-platform/wholesale-domains) — GO!ORANGE, first 100 domains at registry cost
- TransIP, [regular domain prices](https://www.transip.nl/knowledgebase/63-reguliere-prijzen-domeinnamen-buiten-actie) — `.nl` €16.50/yr, `.com` €27.99/yr
- Cloudflare, [Registrar TLD support](https://developers.cloudflare.com/registrar/top-level-domains/) + [community `.nl` request (Feb 2026)](https://community.cloudflare.com/t/support-for-nl-domain-tlds/895826)
