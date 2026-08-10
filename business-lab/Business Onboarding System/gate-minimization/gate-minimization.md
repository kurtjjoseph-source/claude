# Gate Minimization — Serving Non-Technical Clients

Today: VOM manually gates every infrastructure step (DNS pastes, Stripe toggles, account creations). Clients wait for VOM's availability and execution. Tomorrow: The platform absorbs the gates via API automation (Cloudflare, Vercel, Stripe, Brevo). Clients only need a phone and WhatsApp for five brief approvals per onboarding. VOM shifts from "I do the work" to "I enable the client to decide in their own words, then I verify the org's legitimacy before any money changes hands."

---

## The three actors

| Actor | Definition | Examples |
|---|---|---|
| **PLATFORM-AUTO** | Agent executes via API under VOM's scoped credentials; no human approval needed (except gating noted in mechanism). Per-tenant provisioning, DNS, deployments, automation routines. | Vercel project create + deploy, Cloudflare DNS record, Stripe Product catalog, engaging Brevo or schedule skills. |
| **VOM-ONCE** | VOM performs once-ever for the whole platform (infrastructure bootstrap, account setup, API token creation). Not repeated per business; inherited by business #2+. | NS delegation paste in one.com, Stripe Connect enablement, Vercel account verify, bookkeeping tool account creation. |
| **VOM-RECURRING** | VOM performs per-business or per-occurrence (approval gates, identity verification, money movement, compliance filing, ongoing operations). Always human. | KYB org verification before client onboarding, approval of domain purchases, test purchase/refund, quarterly tax filing, daily reply approval. |
| **CLIENT-PHONE** | Client decides via WhatsApp or magic-link screen. One-tap YES/NO, phone-friendly, ≤5 min each. Designed per the 8 steps in client-ux.md (7 original + terms/privacy sign-off added since). No dashboards, no logins, no new passwords. | Profile sign-off, terms/privacy sign-off, content sign-off, GBP verification, batch publish approval, outreach sending. (Pricing/refund yes-no is ongoing-ops, outside the matrix — see "Step-count reconciliation" below.) |

---

## Re-engineered matrix

All 31 prerequisites from onboarding-plan.md §6, re-classified under the platform-tenancy architecture.

| W# | Prerequisite | Old class | New actor | Mechanism | Client touch? |
|---|---|---|---|---|---|
| W1 | Idea folder + `business-idea.md` | 🟢 | PLATFORM-AUTO | Existing capture workflow pattern | No |
| W1 | Profile sign-off | 🔴 | CLIENT-PHONE | WhatsApp magic-link screen (JA/NEE, text-to-speech, 14-day expiry, consent logged) | **Yes** |
| W2 | KVK entity | 🔴 | VOM-ONCE | Verify existing entity from business #1; document in business-profile.md | No |
| W2 | Trade name / SBI activity | 🟡 | VOM-RECURRING | Agent preps DigiD* form values; VOM files via DigiD per-business (~15 min) | No |
| W2 | BTW/OSS position | 🟢 | PLATFORM-AUTO | Agent determines from offer type + NL VAT rules | No |
| W2 | Business bank account | 🔴 | VOM-ONCE | Verify existing account from business #1 | No |
| W2 | Bookkeeping tool | 🟡 | VOM-ONCE | Agent recommends (Moneybird*/e-Boekhouden); VOM creates account once (~15 min); reused per-business #2+ | No |
| W2 | Terms/privacy sign-off | 🔴 | CLIENT-PHONE | WhatsApp magic-link (draft terms/privacy inline, read-aloud, JA/NEE, consent logged) | **Yes** |
| W3 | Registrar account (one.com) | 🔴 | VOM-ONCE | Verify existing registrar access (done for CMA, inherited business #2+) | No |
| W3 | Subdomain (default) | 🟡 | PLATFORM-AUTO | Cloudflare API (free subdomains `<slug>.clients.visionoutreachmedia.nl` on the delegated `clients.*` zone) | No |
| W3 | Custom domain purchase (optional) | 🟡 | VOM-RECURRING | Agent preps TransIP order for a custom `.nl` domain after client names it via WhatsApp; VOM reviews and approves the purchase per security.md's automation-boundary table (custom-domain purchase is draft-only, not agent-executable) | Partial |
| W3 | DNS records placed | 🟡 | PLATFORM-AUTO | Cloudflare API (creates per-tenant CNAME in delegated `clients.*` zone; NS delegation paste for zone bootstrap is VOM-ONCE, not per-tenant) | No |
| W3 | Mail (Brevo) + aliases | 🟡 | PLATFORM-AUTO | Brevo API (create sender identity) + Cloudflare API (DKIM/SPF/DMARC auth records); no manual DNS paste | No |
| W4 | Hosting account (Vercel) | 🔴 | VOM-ONCE | Verify existing Vercel team + CLI auth (done, inherited business #2+) | No |
| W4 | Channel choice (§3.2) | 🟢 | PLATFORM-AUTO | Agent classifies site archetype; records choice in `infra/production-checklist.md` | No |
| W4 | Domain connect + SSL | 🟡 | PLATFORM-AUTO | Vercel API `POST /v10/projects/{id}/domains`; SSL auto-provisions (Let's Encrypt); no dashboard confirm needed | No |
| W5 | Stripe account + KYC | 🔴 | VOM-ONCE | Verify existing platform account + Connect enablement (done, inherited business #2+) | No |
| W5 | iDEAL + SEPA enabled | 🟡 | VOM-ONCE | Platform account toggle (Stripe Dashboard); one-time-ever, inherited business #2+ | No |
| W5 | Product/price catalog | 🟡 | PLATFORM-AUTO | Stripe API `POST /v1/products`, `POST /v1/prices` on platform account; agent creates per business-profile.md pricing (upgradeable to 🟢 with a restricted API key) | No |
| W5 | Live test purchase + refund | 🔴 | VOM-RECURRING | Stripe Checkout Session (via Stripe-hosted payment link or Express Account Link, per client account live verification); VOM executes test purchase + refund per-business to verify client account ready (~10 min) | Partial |
| W6 | Content sign-off | 🔴 | CLIENT-PHONE | WhatsApp magic-link (website copy, manuals, product text rendered inline, read-aloud, JA/NEE, consent logged); security.md draft-only compliance | **Yes** |
| W7 | GBP verification | 🔴 | CLIENT-PHONE | Google postcard arrives (5–14 days outside our control); client enters 6-digit code via WhatsApp or magic-link numeric entry; console escalates to VOM call at 48h if no response | **Yes** |
| W7 | Baseline + monthly benchmark | 🟢 | PLATFORM-AUTO | `engage-ai-benchmark`* skill (deterministic 0–100 channel scores); agent schedules monthly re-runs via `schedule`* skill | No |
| W8 | Social accounts | 🔴 | VOM-RECURRING | Agent specifies channels + content pillars; VOM creates accounts per-business (account creation itself remains outside platform tenancy, ~15 min per platform) | No |
| W8 | Batch publish approval | 🔴 | CLIENT-PHONE | Weekly WhatsApp magic-link digest (posts shown as scrollable preview, like Instagram feed; approve all or per-post edit, JA/NEE per post, consent logged) | **Yes** |
| W9 | Prospect list + sequences | 🟢 | PLATFORM-AUTO | Agent builds ICP prospect list + outreach sequence templates (first-touch + 2 follow-ups, personalization agent variant drafting) | No |
| W9 | Outreach sending | 🔴 | CLIENT-PHONE | Weekly WhatsApp magic-link digest (outreach messages shown with recipient + reason; approve batch to send or hold, per client-ux.md step 5, consent logged) | **Yes** |
| W10 | CRM tool account | 🟡 | VOM-ONCE | Agent recommends tool (Notion*/Airtable); VOM creates account if new (~10 min); reused business #2+ | No |
| W11 | Inbox connector auth | 🟡 | VOM-ONCE | Agent configures connector (e.g. Gmail API*); VOM authorizes OAuth once; reused business #2+ | No |
| W11 | Reply approvals | 🔴 | VOM-RECURRING | Agent drafts replies (daily via `schedule`* skill); VOM approves before sending (ongoing, per client; daily ~5–15 min) | No |
| W13 | Bookkeeping feeds authorized | 🟡 | VOM-ONCE | Agent preps API key setup (bank/Stripe → bookkeeping tool); VOM authorizes once; reused business #2+ | No |
| W13 | BTW returns | 🔴 | VOM-RECURRING | Agent monitors quarterly calendar + logs transactions; VOM (or contracted bookkeeper) files OSS/VAT return quarterly (platform-managed service, not client-facing) | No |

**Row count:** the table above has **32 rows** — the 31 original prerequisites from onboarding-plan.md §6, with the W3 "Domain / subdomain" row split in two to separate the fully-automated subdomain path (PLATFORM-AUTO) from the VOM-approved custom-domain purchase (VOM-RECURRING, draft-only per security.md).

\* Mechanisms marked with an asterisk (`engage-ai-benchmark`, `schedule` skill, DigiD, Moneybird, Gmail API, Notion) are installed skills / existing tools defined in the parent onboarding-plan.md — not new automation introduced by this doc or the other gate-minimization docs (security.md, payments.md, client-ux.md).

**Not in the matrix:** client-ux.md step 7 (ad-hoc pricing/refund yes-no) is an ongoing-operations approval, not one of the 31 onboarding prerequisites — it is listed in the actor-definition examples above but intentionally excluded from this table.

---

## Before / after counts

**Old architecture (from the matrix's own Old-class column, 31 original rows):**
- 5 🟢 AUTO (fully automatic)
- 11 🟡 PREP+GATE (agent preps, VOM gates)
- 15 🔴 HUMAN (VOM only)
- **Total: 31 rows**

*Note: onboarding-plan.md §6 itself states 7🟢/12🟡/12🔴 for this same set — that summary is wrong; the counts above are the corrected recount from this matrix. The orchestrator will fix the source doc separately.*

**New architecture (by actor, 32 rows after the W3 split):**
- **PLATFORM-AUTO: 10 rows** (Vercel, Cloudflare, Stripe API, engage-ai, agent research)
- **VOM-ONCE: 10 rows** (verify/setup: KVK, bank, one.com, Vercel, Stripe, bookkeeping, CRM, connector, feeds, NS delegation as implicit)
- **VOM-RECURRING: 6 rows** (gates + operations: DigiD trade name, custom domain purchase, test purchase, social account creation, reply approval, tax filing; KYB per-client is a standing gate documented in "New gates introduced" below, not a separate matrix row)
- **CLIENT-PHONE: 6 rows** (approvals: profile, terms, content, social batch, outreach batch, GBP code)
- **Total: 32 rows**

**Headline:** Clients now make **6 phone-friendly approvals** (each ≤5 min, average ~3 min) to onboard a business — unchanged by the W3 split, which only touches PLATFORM-AUTO/VOM-RECURRING rows. No logins, no dashboards, no jargon. Target total client time ≤18 min across onboarding. VOM's gates shift from "execute 12 manual steps" to "verify org legitimacy once, approve domain purchases, oversee payments + compliance."

---

## New gates introduced

The platform-tenancy architecture adds or clarifies the following gates (marked as VOM-ONCE or VOM-RECURRING):

1. **Cloudflare zone bootstrap (VOM-ONCE):** Paste NS delegation records for `clients.visionoutreachmedia.nl` into one.com panel once; afterward, all per-tenant DNS via Cloudflare API. One-time cost, never repeated.

2. **Stripe Connect platform enablement (VOM-ONCE):** VOM accepts the Stripe Connect Platform Agreement + enables "listen to connected account events" webhook setting once. Prerequisite for all client accounts; done once.

3. **KYB (Know Your Business) verification per client (VOM-RECURRING):** Before any connected account is created, VOM personally verifies the client organization's legitimacy (real entity, real representative, plausible use case). This is a security gate per security.md §3 T4 — non-removable, independent of Stripe-hosted KYC. If a client fails Stripe KYC, VOM is cc'd on the escalation; if fraud indicators appear, VOM alone reviews.

4. **Domain-ownership policy decision (VOM-RECURRING, per custom domain):** For each client custom domain, VOM or the client decides: will the registrant/WHOIS contact be the client's legal entity (recommended, clear ownership) or VOM (legacy, requires explicit transfer-out contract)? Baked into the service agreement template, not decided per-domain.

5. **NS delegation paste (VOM-ONCE, implicit in #1):** Often cited separately — the single one-time click-op for the whole platform. Happens as part of Cloudflare zone bootstrap, but flagged because it's the only manual DNS paste that will ever be required.

---

## Reconciliation notes

### Step-count reconciliation (client-ux.md vs qa-report.md vs this matrix)

**Issue:** client-ux.md documents 8 designed steps (7 original + terms/privacy sign-off, added since), qa-report.md evaluated all 8, but this matrix cites "6 phone-friendly approvals" in the headline. These are different counts of different things, not a contradiction:
- The matrix's 6 CLIENT-PHONE rows are the onboarding-time approvals. Terms/privacy sign-off is being bundled into the same WhatsApp screen as profile approval (one combined JA/NEE moment), so the 6 matrix rows collapse to **5 distinct client moments** at onboarding: profile+terms, content, GBP code, social batch, outreach batch.
- Stripe-hosted KYC (photo ID + IBAN) is a client-facing step, but it is not a CLIENT-PHONE matrix row — it sits inside the W5 "Stripe account + KYC" flow (VOM-ONCE / VOM-RECURRING rows) as a Stripe-hosted Account Link, not a WhatsApp approval screen.
- Ad-hoc pricing/refund yes-no is ongoing-ops, outside onboarding (see "Not in the matrix" note above).

**Authoritative statement:** A new client experiences 5–6 approval moments during onboarding plus one Stripe-hosted identity flow; recurring approvals arrive as one weekly digest.

### Conflict: Stripe Express Dashboard accessibility

**Issue:** payments.md describes a Login Link to the Express Dashboard as an optional client-facing tool ("accessible via a `Login Link` … shows balance and payout history only"). client-ux.md explicitly forbids dashboards: *"No client-facing logins or dashboards, ever."*

**Resolution:** The Express Dashboard **is NOT offered to clients by default**. Per the "primary" layer in payments.md §5, the white-label monthly statement (agent-generated, plain-language, email-sent) is the client's primary tool. The Express Dashboard login link exists **only as a VOM-mediated fallback**: if a client explicitly requests to update their own bank details (after an IBAN change or account closure), VOM can generate a login link and walk the client through it on a call. Routine bank-detail updates go through a fresh Stripe-hosted Account Link (same magic-link onboarding pattern), never Dashboard access. This preserves no-dashboard rule while unblocking edge cases.

### IBAN/payout detail updates

When a client's IBAN or bank account details change, the flow is:
1. Client notifies VOM (WhatsApp, email, call).
2. Agent generates a fresh `POST /v1/account_links` with `type=account_onboarding` for the same `acct_xxx`.
3. Client receives a magic link (same pattern as KYC onboarding, step 2 in client-ux.md), completes the update on Stripe's hosted form.
4. Stripe-hosted flow handles re-verification if required by regulations.
5. Agent confirms `requirements.currently_due` is empty again.

This keeps the client in the Stripe-hosted world (same UX as step 2, no Dashboard exposure) and keeps sensitive IBAN data out of agent/VOM email.

### Dispute-resolution channel

Per payments.md §6, disputes are a human gate (VOM submits evidence to Stripe). Mechanism: agent drafts dispute package (transaction record + delivery proof) + plain-language client notice. VOM reviews and submits via Stripe Dashboard or `POST /v1/disputes` API (evidence submission must come from VOM, not agent, because it's a legal representation to the card network). This is a rare, high-stakes action, not a routine approval — handled per-incident as it arises.

---

## Rollout order

Migration path from today's "VOM executes all gates" to "platform executes, VOM verifies, clients approve":

1. **Phase 0 — Platform infrastructure (VOM-ONCE, foundation for all clients):**
   - VOM: Create Cloudflare account, generate scoped API token, authorize zone creation.
   - VOM: Paste NS delegation records for `clients.visionoutreachmedia.nl` in one.com panel (the one manual DNS step, ever).
   - VOM: Stripe Connect enablement — accept Platform Agreement, register webhook endpoint with "connected accounts" listen enabled, test with a webhook tool.
   - VOM: Authorize Vercel + Cloudflare + Brevo + TransIP API tokens; store in Vercel secret manager as platform-level env vars (not team-level to avoid tenant data leakage).
   - **Time estimate:** 30–60 min setup, validated with a smoke test.

2. **Phase 1 — Business #2 (first real customer using the new model, full test):**
   - Agent: Run W1–W3 (profile, legal/financial, domain/email) end-to-end; agent publishes `business-profile.md` + `infra/domain-email.md`.
   - **VOM gate (KYB):** Verify the organization. If pass, proceed. If questions, ask the client or escalate.
   - Agent: Trigger W4 (Vercel project create via API, Cloudflare DNS add, Brevo sender auth, deploy, smoke test).
   - Agent: Run W5 (Stripe Connect Express account creation, account link magic link to client, Stripe-hosted KYC).
   - **Client action:** Complete Stripe KYC (photo ID + IBAN) via magic link (step 2 in client-ux.md, ~10 min).
   - VOM: Execute live test purchase + refund to verify client account is live and connected.
   - Agent: Continue W6–W13 as normal (social, leads, CRM, etc.).
   - **Outcome:** Validate that Cloudflare API, Vercel project creation, Stripe Connect account creation, and client's Stripe-hosted KYC all work end-to-end. Tweak any error handling, retry loops, or messaging before scaling.
   - **Time estimate:** Full business onboarding now includes this new infrastructure flow; ~2–3x more automation points to validate.

3. **Phase 2 — Introduce CLIENT-PHONE approvals (if Phase 1 successful):**
   - Agent: Implement magic-link approval screens (profile, content, terms, social batch, outreach batch; per client-ux.md) — now specced as the **Client Contact Gateway** component ([../client-contact-gateway.md](../client-contact-gateway.md)): build phase B1 (Mode A, manual transport) covers this rollout phase; B2 adds the WhatsApp Cloud API transport.
   - Test with business #2 (retroactively ask client to approve profile, content, social batch via new flow).
   - Validate consent log (all YES/NO/timeout rows recorded).
   - VOM: Test reminder ladder (24h reminder, 48h call) with a timeout scenario.
   - **Outcome:** Client approvals are smooth, links don't expire unexpectedly, consent log is complete and auditable.
   - **Time estimate:** ~1–2 onboardings with tweaks to messaging and tech.

4. **Phase 3 — Gradual rollout to new clients (business #3+):**
   - Once Phase 1 + 2 are validated, all new businesses onboard using the full platform model.
   - Each new client triggers: Cloudflare per-tenant DNS, Vercel project creation, Stripe Connect account, Brevo sender auth (all PLATFORM-AUTO), with CLIENT-PHONE approvals for profile/content/social/outreach and KYB gate by VOM.
   - Operational rhythm: weekly/monthly tasks (social approval digest, reply approvals, benchmark re-runs) start immediately; no "catch-up" phase.

5. **Phase 4 — Backport to business #1 (Church Media Academy, optional):**
   - CMA is onboarded under the old model (VOM manually does DNS, Stripe direct account, etc.). Backporting is optional — CMA works fine as-is.
   - If VOM wants to migrate CMA to the new tenancy:
     - Agent: Create a new Vercel project `vom-tenant-cma`, migrate the existing site source.
     - Agent: Create Cloudflare DNS record for `cma.clients.visionoutreachmedia.nl` (or use CMA's existing custom domain, updated via TransIP API to point to Vercel).
     - Agent: Create Stripe Connect Express account for CMA, guide CMA through Stripe-hosted KYC (if CMA is not already KYC'd under the direct account, or if WHOIS needs updating).
     - VOM: Verify CMA's organization + domain ownership.
     - Agent: Cut over DNS/hosting to the new project.
   - **Decision:** deferred — not necessary for platform launch, CMA continues to work on the legacy model until VOM decides to migrate.

6. **Phase 5 — Domain transfer-out policy (rollout safety net):**
   - Once any client has a domain in VOM's registrar account, publish the written transfer-out policy (client can request EPP/auth-code at any time, defined disposition on relationship end).
   - VOM: Maintain a transfer-out runbook per domain (TransIP API call to release, or manual submission if API doesn't support it).
   - **Outcome:** Clients have confidence they are not locked in; platform is transparent about custody.

7. **Phase 6 — Monitor + iterate (ongoing):**
   - Monitor per-phase metrics: approval response time, Stripe-hosted KYC completion rate, client support inquiries (Inbox connector + reply approval SLA).
   - Adjust reminder ladder timing, magic-link copy, or approval steps if clients skip or struggle.
   - If a client consistently skips approvals or misses the 48h escalation call, document the edge case and decide whether to tighten SLA or add a pre-onboarding phone call.

**Success criteria (end of Phase 3):**
- All new clients onboard via the platform model.
- 0 manual DNS pastes per-client (all Cloudflare API).
- 0 manual Stripe dashboard clicks per-client (agent creates products, VOM creates client account via API, client does KYC via Stripe-hosted magic link).
- 100% client approval consent log coverage (no missing row for any approval).
- Client total onboarding approval time < 30 min (target 6 approvals × ~3–5 min each).
- VOM's per-client gate time stays < 1 hr (KYB verification ~10 min, test purchase ~10 min, domain review/approval ~5 min).
