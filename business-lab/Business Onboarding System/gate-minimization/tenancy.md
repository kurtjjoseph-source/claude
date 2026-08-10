# Platform Tenancy Architecture — Zero Client-Side Hosting/DNS/Email

Role: Cloud/Infrastructure Engineer. Goal: client businesses run as tenants on
Vision Outreach Media's own infrastructure. Client never creates a hosting
account, never touches DNS, never configures email.

Principle: **no click-ops** for any *per-tenant* action. Every recurring step
is an API call from an automation script/agent. Only *platform bootstrap*
steps (done once, ever, by VOM) are manual.

---

## 1. Umbrella Tenancy Model (Vercel)

| Aspect | Design |
|---|---|
| Account model | Single Vercel account/team (VOM's, already authed via CLI). **One Vercel Project per tenant**, not one account per tenant. |
| Naming convention | Project: `vom-tenant-<slug>` (e.g. `vom-tenant-stjohnschurch`). Subdomain: `<slug>.clients.visionoutreachmedia.nl`. Slug = lowercase, hyphenated, derived from org name, uniqueness-checked at intake. |
| Source of truth | Single template repo (VOM-owned, private) parameterized by tenant config. Tenants do **not** get repo access — the agent deploys on their behalf. Avoids needing per-client GitHub accounts. |
| Env/secrets isolation | Vercel **project-scoped** Environment Variables (`POST /v10/projects/{id}/env`), never team-level/shared vars for tenant-specific values. Each project gets its own `TENANT_ID`, `TENANT_CONTACT_EMAIL`, `BREVO_SENDER`, etc. Shared platform secrets (e.g. a scoped Brevo API key) injected identically but each tenant's *data* (sender identity, reply-to) stays project-scoped so one tenant's env can never leak into another's build. |
| Deploy automation | Vercel REST API (`/v9/projects`, `/v13/deployments`) or Vercel CLI (`vercel deploy --prod --yes --token=$VERCEL_TOKEN`) driven by the onboarding agent — no dashboard clicks. |
| SSL | Automatic. Vercel auto-issues/renews TLS (Let's Encrypt-backed) the moment a domain is added to a project and DNS resolves to Vercel — zero manual cert work, ever, for any tenant. |
| Plan note (assumption) | Assigning many custom domains across many projects at scale may require Vercel **Pro/Team** plan rather than Hobby. Flagged as an assumption to confirm against current plan/billing before scaling past a handful of tenants. |

---

## 2. DNS Strategy — Removing the Manual one.com Paste

Two options evaluated:

| Option | Description | Verdict |
|---|---|---|
| A. Delegated subdomain zone | Carve off `clients.visionoutreachmedia.nl` as an NS delegation from the existing one.com zone to an API-capable DNS provider (Cloudflare recommended: free, mature API + Terraform provider). One-time NS paste in one.com; every tenant record thereafter is a Cloudflare API call. | **Recommended.** Preserves brand equity of the existing domain, keeps the delegation blast-radius to one subdomain only — apex records (A, MX, TXT/DKIM for Brevo transactional mail) are untouched because they live outside the delegated label. |
| B. New parent domain at API registrar | Buy a fresh domain (e.g. via Cloudflare Registrar, TransIP, or Porkbun) purely for client sites, fully independent of one.com. | Rejected as primary: costs money/year, starts with zero domain trust/SEO, and is *less* branded. Kept as fallback if VOM ever wants full independence from the legacy zone. |

**Mechanism for Option A:**
1. Create a zone `clients.visionoutreachmedia.nl` in Cloudflare.
2. Cloudflare gives 2 NS hostnames (e.g. `xxx.ns.cloudflare.com`).
3. **One manual paste** in the one.com panel: add NS delegation records for the `clients` label pointing to those two Cloudflare nameservers. (This is the *only* DNS click-op in the entire system, done once for the whole platform, not per tenant.)
4. From then on, every tenant's `<slug>.clients.visionoutreachmedia.nl` CNAME/A record is created via the Cloudflare API — no further one.com interaction, ever.
5. Brevo's existing SPF/DKIM/DMARC records on the apex zone (`visionoutreachmedia.nl`) are on a different label than `clients.*` — NS delegation of a subdomain does not touch or re-resolve apex records. Zero mail risk. Verified independently of the deferred full-zone Cloudflare migration (which stays deferred).

---

## 3. Custom Client Domains (their-church.nl)

Goal: when a client wants their own domain, the client does essentially nothing beyond naming it and confirming legal identity in a WhatsApp chat.

**Flow:**
1. Agent asks (via WhatsApp) for: desired domain name, legal org name + address (required as WHOIS/registrant contact).
2. Agent purchases the domain via an **API-capable registrar**:
   - **TransIP** (Dutch registrar, native `.nl` support, REST API) — recommended default for `.nl` ccTLDs.
   - **Porkbun** or **Cloudflare Registrar** as alternates for gTLDs — *assumption to verify*: Cloudflare Registrar's `.nl` support is limited/at-cost-only in some regions; confirm before relying on it for `.nl`.
3. Registrar API sets DNS: either (a) point apex/`www` A/CNAME directly at Vercel (`76.76.21.21` / `cname.vercel-dns.com`), or (b) delegate the new domain's NS to the same Cloudflare account, unifying management. Option (b) preferred for consistency with §2.
4. Vercel API: `POST /v10/projects/{id}/domains` adds `their-church.nl` to the tenant's existing project. SSL auto-provisions.
5. Brevo: authenticate the new domain for mail (see §4).

**Ownership/ethics note (important, non-technical):**
- The domain is registered through **VOM's registrar account**, but the **registrant/WHOIS contact should be the client's legal entity**, not VOM personally — this is both a legal-clarity and trust matter (avoids VOM being the de facto unaccountable owner of a church's identity).
- The service contract must explicitly state: (a) who technically holds the registrar-account-level API access during the engagement, (b) that the client can request the EPP/auth-code transfer-out at any time, and (c) what happens to the domain if the client relationship ends. This should be a written clause in the onboarding agreement, not an implicit assumption — flagging this to VOM as a policy decision, not something this design can resolve unilaterally.

---

## 4. Email — Per-Tenant Sending, No Client Mailbox Ever

| Aspect | Design |
|---|---|
| Sending account | Single Brevo account (VOM's), used for all tenants. No client ever logs into Brevo. |
| Per-tenant sender identity | `noreply@<slug>.clients.visionoutreachmedia.nl` (or `noreply@their-church.nl` for custom domains), authenticated via Brevo's domain-authentication DKIM/SPF CNAME records — pushed **programmatically** to the Cloudflare-managed zone (§2) via the Brevo API + Cloudflare API in the same automation run. No manual DNS pasting for mail either, because it rides the same API-managed zone. |
| Reply-To | Set to the client's **existing personal email/phone contact** (e.g. `pastor.name@gmail.com`) collected once at intake. Replies land in the client's normal inbox they already use — no new mailbox, no forwarding rule, no IMAP setup. |
| Isolation | Brevo API key scoped at platform level (Brevo doesn't require per-tenant sub-accounts for this volume); tenant isolation is enforced at the application layer by always setting `sender` + `replyTo` from the tenant's project env vars, never hardcoded. |
| Legacy zone | Existing Brevo transactional records on the apex `visionoutreachmedia.nl` zone (in one.com) are untouched — new tenant sender domains live only under the delegated `clients` subdomain or under the client's own new domain, never the legacy apex. |

---

## 5. Zero-Touch Provisioning — Script Outline

Not full code — sequence of API calls an orchestration script/agent executes per new tenant:

1. **Intake** — capture `slug`, `org_name`, `contact_email`/`contact_phone` from the WhatsApp/agent conversation.
2. **Vercel: create project** — `POST /v10/projects` from the template repo, name `vom-tenant-<slug>`.
3. **Vercel: set env vars** — `POST /v10/projects/{id}/env` with `TENANT_ID`, `CONTACT_EMAIL`, `BREVO_SENDER`.
4. **Vercel: deploy** — trigger via CLI (`vercel deploy --prod`) or deploy hook / `POST /v13/deployments`.
5. **Cloudflare: create DNS record** — `<slug>.clients.visionoutreachmedia.nl` CNAME → `cname.vercel-dns.com` (API call, delegated zone from §2).
6. **Vercel: add domain to project** — `POST /v10/projects/{id}/domains`; Vercel auto-verifies DNS and issues SSL.
7. **Poll** — check domain `verified: true` + cert status until ready (bounded retry loop).
8. **Brevo: configure sender** — create/verify sender identity for the tenant subdomain (reusing pre-authenticated wildcard DKIM if already set up once for `*.clients.visionoutreachmedia.nl`), set default reply-to = client's contact email.
9. **Smoke test** — automated `GET https://<slug>.clients.visionoutreachmedia.nl` expect `200`; send one test transactional email via Brevo API to VOM's own inbox to confirm deliverability.
10. **Notify client** — agent sends the client a WhatsApp message with the live URL. No credentials, no dashboard, no login ever required from the client.

Custom-domain flow (§3) inserts registrar-purchase + domain-auth steps between step 6 and 8, otherwise identical.

---

## 6. Residual One-Time-Ever Human Steps (VOM only, never clients)

| # | Step | Why it can't be automated | Frequency |
|---|---|---|---|
| 1 | Paste NS delegation records for `clients.visionoutreachmedia.nl` into the one.com panel, pointing to Cloudflare's assigned nameservers. | one.com has no API; this is the single unavoidable click-op for the whole platform. | Once, ever — not per tenant. |
| 2 | Create/authorize the platform's API credentials (Cloudflare account + scoped API token, registrar account(s) + API key, Brevo API key) and store them as Vercel/secret-manager env vars. | Standard infra bootstrap requiring a human to create accounts and accept a registrar's terms/payment method. | Once, ever, per provider — not per tenant. |

Everything else — project creation, DNS records, SSL, sender auth, custom domain purchase, smoke testing — is an API call the automation/agent performs, for every tenant, forever.

---

## Assumptions / Risks to Verify

- **Vercel plan limits**: confirm current Vercel plan supports the target number of concurrent projects + custom domains at the expected tenant volume (Hobby plan has restrictions on commercial use and custom domains per project).
- **Cloudflare Registrar `.nl` support**: not confirmed as of this design; TransIP recommended as the primary path for `.nl` purchases, Cloudflare/Porkbun as gTLD alternates — verify before building the purchase flow.
- **Brevo sending limits/reputation**: sending from many distinct tenant subdomains off one Brevo account should be fine reputation-wise (each subdomain gets its own DKIM), but deliverability should be spot-checked per new tenant via the smoke test in step 9, not assumed.
- **Domain ownership clause**: the registrant-vs-technical-manager split in §3 is a legal/policy decision for VOM's contract template, not something resolved by this architecture — flagged, not decided, here.
