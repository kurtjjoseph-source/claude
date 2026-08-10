# Security Threat Model — Delegated Access & Platform Tenancy

**Author:** Security Engineer (DevSecOps) · **Scope:** Vision Outreach Media (NL) as a
multi-tenant platform where VOM hosts client orgs (churches, small businesses) as
tenants and AI agents automate provisioning across Vercel, Cloudflare, Brevo, Stripe
Connect. Threat-models `tenancy.md`, `payments.md`, `client-ux.md`.

**Team policy:** this document is analysis only. No security control, secret, or config
is changed by this task. Decisions requiring VOM's ratification are listed at the end.

---

## 1. Asset Inventory

| # | Asset | Where it lives | Blast radius if lost | Sensitivity |
|---|---|---|---|---|
| A1 | **Platform API tokens** (Vercel, Cloudflare, Brevo, Stripe platform key, registrar) | Vercel env / secret store | **ALL tenants at once** | Critical |
| A2 | Stripe platform account + Connect Platform Agreement | Stripe | All client funds flows, platform liability | Critical |
| A3 | Cloudflare-delegated `clients.visionoutreachmedia.nl` zone | Cloudflare | All tenant DNS + mail auth records | High |
| A4 | Domain ownership (client `.nl` domains in VOM's registrar account) | TransIP/registrar | Individual client identity/SEO | High |
| A5 | Per-tenant secrets (project env vars, sender identity, `acct_xxx` map) | Vercel project scope | One tenant each | High |
| A6 | Consent log (YES/NO/timeout, per tenant) | Append-only store | Legal repudiation defense | High |
| A7 | Client PII (contact email/phone, org legal name/address) | Intake records | Privacy / GDPR | High |
| A8 | Client funds in transit (destination charges → client IBAN) | Stripe balance | Direct financial loss | High |
| A9 | Brevo shared sender reputation | Brevo account | Deliverability for all tenants | Medium |
| A10 | Magic-link tokens (approval + Stripe onboard) | Ephemeral URLs | One approval / one KYC each | Medium |
| A11 | Agent automation credentials / orchestration runtime | Compute env | Mass-action capability | Critical |

---

## 2. Entry Points & Abuse Cases (severity-ranked)

| ID | Severity | Abuse case | Entry point | Impact |
|---|---|---|---|---|
| T1 | **High** | **Platform-account compromise = all tenants compromised.** Theft of A1/A11 (leaked token, phished VOM login, compromised laptop) gives one actor control of every tenant's hosting, DNS, mail, and payment routing. | Vercel/CF/Stripe/Brevo tokens; VOM's identity | Full multi-tenant takeover |
| T2 | **High** | **Agent prompt-injection via client-supplied content** (org name, "profile" text, voice-note transcript, WhatsApp message) coerces the agent into unintended provisioning/publishing/sending or into calling a privileged API. | Intake text, content approval, voice notes | Unauthorized provisioning/publishing; pivot to T7 |
| T3 | **High** | **Insider/agent-error mass-action.** One buggy or malicious automation run iterates over all tenants — deletes projects, rewrites DNS, blasts email, issues refunds. | Bulk automation loops | Platform-wide outage/loss |
| T4 | **High** | **Stripe Connect platform liability.** A fraudulent "client" onboarded through VOM's platform launders money or takes card payments for fraud; Stripe holds the **platform** account responsible. | Onboarding intake → `POST /v1/accounts` | Account freeze, chargebacks, legal exposure |
| T5 | **High** | **Magic-link interception / forwarding.** A WhatsApp approval link is forwarded (or the phone is shared) and approved by the **wrong person**; high-stakes actions (publish, price, refund) execute on a non-authorized YES. | WhatsApp/email magic links | Wrong-party authorization; repudiation |
| T6 | **Medium** | **Domain-ownership hostage risk.** Platform holds registrar-account access to client domains; a lost/soured relationship, or platform compromise, leaves clients unable to reclaim their identity — or VOM accused of holding it hostage. | Registrar account | Trust/legal dispute; client lock-in |
| T7 | **Medium** | **Consent-log integrity / repudiation.** If the log is mutable, a client (or an attacker) can dispute "I never approved that," or a tampered row fabricates consent. | Log store write path | Legal indefensibility |
| T8 | **Medium** | **Brevo shared sender-reputation poisoning.** One tenant's spammy/compromised sending (or an injection-driven blast) degrades deliverability for **all** tenants on the shared Brevo account. | Brevo API send path | Platform-wide email failure |
| T9 | **Medium** | **Cross-tenant data leak.** Misconfigured env scoping or a routing bug in the multiplexed Stripe webhook maps an event/secret to the wrong tenant. | Env vars, webhook `account` routing | PII / funds misattribution |
| T10 | **Low** | **Stale/expired-link abuse & replay.** Reuse of a consumed magic link or Account Link. | Link endpoints | Limited (already single-use/short-lived) |

---

## 3. Mitigations (proportional to a solo-operator platform — no SOC theater)

| ID | Mitigations |
|---|---|
| T1 | **Least-privilege, scoped tokens per provider** (Cloudflare token scoped to the `clients` zone only; **Stripe restricted key**, not the secret key, for agent calls; Vercel token scoped to the team, rotated). Store in a secret manager, never in repo. **MFA on every provider console + VOM's email.** Hardware-key or app-based 2FA. Documented rotation on suspected compromise. Separate token for read-only vs write agent paths where the provider allows. |
| T2 | **Treat all client-supplied content as untrusted data, never instructions.** Agent tool-calls that provision/publish/send go through a fixed allow-list of actions with typed parameters — free-text from a client can populate a *field*, never *select an action*. Sanitize/escape content before it reaches any prompt boundary. High-stakes actions always require the human gate in §4, so an injection cannot self-authorize. |
| T3 | **Blast-radius cap: max N tenants per automated run** (e.g. N=5) before the run pauses for human continuation. Bulk destructive actions (delete, DNS rewrite, mass send) are **human-only** regardless of N. Dry-run/diff preview logged before apply. Idempotency keys to prevent runaway retries. |
| T4 | **KYB is a REQUIRED, non-removable human gate:** VOM personally verifies each client org's legitimacy (real org, real representative, plausible use) **before** any connected account is created. Rely on Stripe-hosted KYC for identity but do not treat it as a substitute for VOM's own "do I know this is a real church/business" check. Escalate any `disabled_reason` = fraud/rejected-for-cause to VOM only. |
| T5 | **Magic-link hardening:** single-use, short expiry (already 14d for approvals — tighten high-stakes to ≤24h), **bind token to the intake phone number**; the approving reply must come from the on-file number (`responder` already logged — enforce it, don't just record it). **High-stakes steps (publish, pricing, refund, domain, payout changes) require a second factor: OTP to the bound phone or a verbal confirmation call.** Silence never defaults to yes (already designed). |
| T6 | **Registrant = client's legal entity in WHOIS** (already specified). Written contract clause: client may request EPP/auth-code transfer-out at any time; defined disposition on relationship end. Provide clients a self-serve/on-request transfer path so ownership is demonstrably not hostage. This is a **policy/legal decision for VOM**, flagged not resolved. |
| T7 | **Append-only consent log**: write-once rows, no update/delete path in the app; per-row content hash (`content_ref` already a hash/version id) + monotonic timestamps; periodic export to immutable/off-site backup. Optional lightweight hash-chain (each row references prior row hash) for tamper-evidence without enterprise cost. |
| T8 | **Per-tenant DKIM already isolates authentication**, but reputation is shared — add **per-tenant send-rate limits**, bounce/complaint monitoring, and an **automatic send-pause** on a tenant whose complaint rate spikes. Injection-driven sends are blocked by T2/T3 caps. Consider Brevo sub-accounts if volume/reputation risk grows. |
| T9 | **Project-scoped env vars only** for tenant data (already designed — enforce, never team-level for tenant values). Webhook handler validates the `account` field maps to a known `acct_xxx` and rejects/quarantines unmapped events. Verify Stripe webhook signatures. Test isolation with a two-tenant fixture. |
| T10 | Already single-use + click-time minting (Account Links). Ensure approval tokens are invalidated on decision and on expiry; reject replays server-side. |

---

## 4. Automation Boundary Table

Levels: **full-auto** (agent acts, no human) · **auto-with-cap** (agent acts, blast-radius
capped, logged) · **draft-only** (agent prepares, human approves before execute) ·
**human-only** (agent never executes).

| Action class | Level | Why |
|---|---|---|
| Provisioning (Vercel project create, deploy, smoke test) | **auto-with-cap** | Reversible, low-harm; cap tenants/run (T3), stop on error. |
| DNS record create (per-tenant `clients.*` CNAME) | **auto-with-cap** | Scoped to delegated zone only; apex untouched. Cap + diff log. |
| DNS bulk rewrite / apex / NS changes | **human-only** | Platform-wide blast radius; outside delegated scope. |
| Publishing (website copy, social posts, manuals) | **draft-only** | Carries client's name/voice; requires explicit client YES (T2/T5). |
| Sending (outreach in client's name, transactional mail) | **draft-only + cap** | Reputation + trust (T8); client YES per batch; rate-limited. |
| Refunds | **draft-only (VOM approves)** | Money movement — hard invariant; agent drafts, VOM executes. |
| Payouts / payout-schedule changes | **human-only** | Direct funds; Stripe default auto-payout, no agent write. |
| Connected-account creation (onboarding a client) | **human-only (KYB gate)** | Platform liability T4; VOM verifies org legitimacy first. |
| Domain purchase (on client's behalf) | **draft-only (VOM approves)** | Spends money + legal registrant identity (T6). |
| Domain transfer-out / EPP release | **human-only** | Irreversible ownership change; client + VOM only. |
| Tenant deletion (project/data/domain teardown) | **human-only** | Irreversible, destructive; no automated path. |
| Dispute evidence submission | **human-only** | Legal representation to card network (per `payments.md`). |
| Secret/token rotation & provider account settings | **human-only** | Root-of-trust; agent must never hold write to its own keys. |

---

## 5. Residual-Risk Statement

By operating this model VOM knowingly accepts:

1. **Concentration risk.** A single compromise of VOM's identity or the platform tokens
   (A1/A2/A11) can affect **all** tenants simultaneously. MFA, scoped tokens, and blast-radius
   caps reduce likelihood and reach but do not eliminate the single-operator single-point-of-failure.
2. **Custodial responsibility for client domains and funds routing.** VOM is the technical
   custodian of client domains and the Stripe platform-of-record; he accepts the trust, legal,
   and reputational duty this creates, mitigated by WHOIS-registrant = client and transfer-out rights.
3. **Platform liability for onboarded clients.** Under Stripe Connect, a fraudulent client's
   activity reflects on VOM's platform account. The KYB human gate is the primary defense; residual
   fraud risk remains and is accepted as the cost of being the platform.
4. **Shared-reputation coupling.** All tenants share one Brevo sending reputation; one bad actor
   or bug can degrade delivery platform-wide until paused. Accepted at current volume; revisit with scale.
5. **Solo-operator continuity.** No second human reviewer; the human gates depend on VOM's
   availability. Sustained absence stalls approvals (fail-safe, not fail-open) — an availability
   cost accepted in exchange for no unauthorized action ever shipping.

---

## RATIFICATION RECORD — 2026-07-21 (decision 5 completed 2026-07-22)

Decisions taken by the operator (VOM). All five ratified.

1. **KYB gate — MODIFIED, ratified as automated.** Rejected as a mandatory personal gate. KYB
   runs as automated agent checks (KVK register lookup, website existence, contact plausibility);
   only flagged/anomalous cases escalate to VOM before account creation. Stripe's own hosted KYC
   (identity + IBAN) remains the identity backstop on every connected account. **Accepted residual
   risk:** platform liability if a fraudulent org passes the automated checks (T4).
2. **High-stakes second factor — RATIFIED.** OTP-to-bound-phone or a verbal confirmation call
   for publish / pricing / refund / domain / payout-change actions, on top of the magic-link YES (T5).
3. **Blast-radius cap — RATIFIED, operator-configurable.** The cap is not a fixed constant: VOM
   sets it per deployment (dashboard control), combined with run **throttling** (rate-limiting
   automated runs over time), and runs pause at the cap for human continuation. Human-only list in §4 confirmed (T3).
4. **Domain ownership — RATIFIED, strengthened.** The client purchases and owns their domain
   directly: registrant, billing, and ownership are the client's from day one; VOM acts only as
   technical manager (DNS/renewal assistance). No VOM-held client domains; the hostage risk (T6)
   is eliminated rather than contracted around. Agent preps the order; the client (or VOM assisting
   the client live by phone) completes the purchase.
5. **Token scoping & MFA baseline — RATIFIED as a simple, low-maintenance setup (2026-07-22).**
   Two tools, not many: a **password manager** (unique generated password per account, API keys as
   secure notes) plus a **separate authenticator app with encrypted cloud backup** for TOTP. Scoped
   agent keys (restricted Stripe key, `clients`-zone Cloudflare token, team-scoped Vercel token, Brevo
   key), stored in the manager + Vercel encrypted env, never in a repo. **Maintenance is trigger-based,
   not calendar-based** — rotate only on suspected leak / lost device / breach-alert (periodic forced
   rotation is deprecated toil, per NIST SP 800-63B). Full runbook below. **Accepted residual risk:**
   password-vault concentration (mitigated by the vault's own strong master + Apple ID 2FA) and
   phone-loss (mitigated by the authenticator's encrypted backup); the solo-operator concentration
   risk in §5 is unchanged (T1).

*Implementation of ratified items is separate, human-authorized work tracked on the compliance dashboard.*

---

## SIMPLE SECURITY BASELINE (ratified 2026-07-22) — operator runbook

The goal is a setup a solo operator can **stand up once and rarely touch**. The platform holds only
~6 shared secrets and they do **not** grow with client count, so a small fixed toolkit covers everything.

### Toolkit — two tools
| Tool | Choice | Holds | Protected by |
|---|---|---|---|
| **Password manager** | Apple Passwords (built-in, iCloud-synced) — or Bitwarden if cross-platform | All 6 logins (unique generated passwords) + the 4 API keys as secure notes + all recovery codes | Strong Apple ID password + Apple ID 2FA |
| **Authenticator app** *(separate from the manager)* | 2FAS or Ente Auth (encrypted cloud backup) — Google Authenticator is the fallback | TOTP 6-digit codes for all 6 accounts | The app's own backup passphrase |

### The 6 accounts to protect
Gmail (`kurtjjoseph@gmail.com` — the recovery root; harden **first and hardest**), Stripe, Vercel,
Cloudflare, Brevo, registrar (one.com / TransIP).

### One-time setup checklist (VOM-executed; ~1 hour)
1. **[VOM]** Set up the password manager; confirm the Apple ID has a strong password + 2FA turned on.
2. **[VOM]** Install the authenticator app and **enable its encrypted cloud backup** (so a lost phone is not a lockout).
3. **[VOM]** Harden **Gmail first**: unique generated password + TOTP in the authenticator + save its backup codes into the manager.
4. **[VOM]** Repeat step 3 for Stripe, Vercel, Cloudflare, Brevo, registrar — one at a time.
5. **[VOM]** Create the scoped agent keys and store each in the manager + Vercel encrypted env (never a file):
   restricted Stripe key (no money movement/payout change) · Cloudflare token scoped to the `clients` zone ·
   team-scoped Vercel token · Brevo API key.
6. **[VOM] ⚑ Rotate & remove the exposed token.** `Digital Membership Club Business/church-media-academy/deploy/.env.local`
   holds a live `VERCEL_OIDC_TOKEN` in plaintext — treat it as already leaked: rotate it in Vercel, delete the file,
   and keep secrets out of the repo tree. (An agent may delete the file; only VOM can rotate the token.)
7. **[VOM]** Write a one-page **recovery kit** — which authenticator app, where the backup passphrase lives,
   and the "lost phone / lost laptop" steps — and store it offline (printed, or the manager's emergency access).

### Ongoing maintenance — near-zero, trigger-based
- **No calendar rotation.** Rotate a password or key **only** on a trigger: suspected leak, lost/replaced device, or a breach alert from the manager.
- The manager's breach monitor flags exposed passwords automatically — act only when it does.
- **~Quarterly, 10 minutes:** glance at breach alerts, confirm the authenticator backup is current, confirm no secret has leaked into a file.
- **New provider added later** → the same three steps: unique generated password + TOTP + save recovery codes.
