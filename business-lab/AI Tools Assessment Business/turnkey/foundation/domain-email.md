# Domain & Email Package — AI Tools Assessment Business

**Author:** Vision Outreach Media (VOM), on behalf of the client/operator.
**Workstream:** W3 — Domain & email.
**Status:** Subdomain records staged (AUTO, buildable now). Custom-domain purchase and Brevo
sender verification are prepared but held at CLIENT/VOM gates. No email is sent from any of this.

---

## 1. Buildable subdomain (AUTO — staged now inside the delegated zone)

Because the operator delegated the `clients.visionoutreachmedia.nl` Cloudflare zone once, records
created *inside* that zone are AUTO — no registrar login, no new credential. This lets **Build
(W4)** deploy to a live hostname today, independent of the still-open business-name/niche
decision.

**Placeholder subdomain chosen:** `aitools.clients.visionoutreachmedia.nl`

This is a provisional, internal-facing label reflecting the working project name only — it is
**not** meant to be the permanent public brand URL. Once the niche/name TODO resolves, either (a)
relabel this subdomain to match (e.g. `<city>.clients.visionoutreachmedia.nl` or
`<vertical>ai.clients.visionoutreachmedia.nl`), or (b) leave it as an internal/staging alias and
point the resolved **custom domain** (§2) at production once purchased. Either way, Build is
unblocked now.

**DNS records to create in the delegated zone** (values are the standard Vercel pattern; Build
confirms the exact target when it provisions the project — record shape is fixed, target value is
Build's to finalize):

| Type | Name | Value | Purpose |
|---|---|---|---|
| CNAME | `aitools.clients` | `cname.vercel-dns.com` | Points subdomain at the Vercel deployment (default Build target per biz-build) |
| TXT | `_vercel.aitools.clients` | *(domain-verification string — issued by Vercel at project creation)* | Vercel domain-ownership verification |

If Build's deploy target ends up being something other than Vercel, swap the CNAME value
accordingly — the record *shape* (one CNAME + one verification TXT at the subdomain) is standard
regardless of host.

**Note on the platform-level Cloudflare-delegation prerequisite:** `turnkey/launch-state.json`
still shows `cloudflare_delegation: pending` in the gate matrix. This package assumes — per the
explicit context provided for this run — that the `clients.visionoutreachmedia.nl` zone is already
operator-delegated and usable. If that platform-level gate has not actually been marked `done` yet,
treat that as an orchestrator bookkeeping item to reconcile, not a reason to hold these AUTO
records — the zone access itself is the input given to Foundation for this run.

---

## 2. Custom domain — client-owned (CLIENT gate, pending name decision)

Per governance rail D4 (VOM never holds a domain hostage): the **client is registrant and
billing owner** of any custom domain; VOM is technical manager only (DNS delegation, not
ownership).

**Blocked on:** `business-profile.md` TODO — legal/brand name and niche axis. A domain choice
before that is locked would likely need to be re-bought. Steps below are ready to hand to the
client the moment a name is picked.

**Do this (client, on their own account/payment method):**
1. Pick a registrar — recommend **Cloudflare Registrar** (at-cost pricing, no markup, easiest to
   delegate DNS management back to VOM's Cloudflare account afterward) or a standard NL-friendly
   alternative (e.g., **one.com**, already in use for the main VOM site, or **Namecheap**).
2. Search for the domain matching the resolved brand/niche name (e.g., if geography-niched:
   `theaiguy<city>.nl` / `.com`; if vertical-niched: `<vertical>ai<name>.nl` style). `.nl` is the
   natural default for an NL-facing local-service brand; `.com` as a fallback if `.nl` is taken.
2. Register with the client's own name, email, and payment method as registrant + billing contact.
   Enable WHOIS/registrant privacy if the registrar offers it at no extra cost.
3. Once purchased, the client either (a) delegates nameservers to VOM's Cloudflare account (fastest
   — VOM manages all DNS from then on, ownership stays with client), or (b) keeps DNS at the
   registrar and VOM provides the exact records to add manually. Recommend (a).
4. VOM then creates the production DNS records (same CNAME-to-Vercel pattern as §1) inside the
   client's own zone once delegated.

This purchase does **not** block Build — Build can ship on the subdomain in §1 today, and the
custom domain swaps in later as a DNS cutover with no rebuild required.

---

## 3. Brevo sender setup (email-sending domain auth)

No emails are sent as part of this package — this only prepares the domain-authentication records
and flags the one human click needed before Brevo will allow sending.

### 3a. SPF / DKIM records (AUTO — staged inside the delegated zone now)

Using the placeholder subdomain from §1 as the sending domain until the custom domain (§2)
exists (records are portable — re-create the same shape in the custom domain's zone once it's
delegated):

| Type | Name | Value | Purpose |
|---|---|---|---|
| TXT | `aitools.clients` | `v=spf1 include:spf.brevo.com mx ~all` | SPF — authorizes Brevo to send as this domain |
| TXT | `mail._domainkey.aitools.clients` | *(DKIM public key — issued by Brevo when the sender domain is added in the Brevo dashboard)* | DKIM signing |
| TXT | `aitools.clients` (or Brevo-specified host) | *(Brevo domain-verification code)* | Domain-ownership check |

Exact DKIM/verification values are generated by Brevo only after the sending domain is added in
the Brevo dashboard — that add-domain action itself requires the operator's Brevo login (VOM
gate, below), so the record *values* are filled in at that time; the record *shape* is staged now.

### 3b. Sender verification (VOM gate)

**Do this:**
1. Log into the operator-provisioned Brevo account.
2. Add `aitools.clients.visionoutreachmedia.nl` (or the final custom domain, once purchased) as a
   sending domain under Senders & IP → Domains.
3. Copy the SPF/DKIM/verification values Brevo generates back into the delegated Cloudflare zone
   (AUTO once the values are known — VOM or this agent can add them, no new credential needed).
4. Click "Verify" in Brevo once DNS propagates (usually minutes to a few hours).
5. Add and verify the actual sender email address/mailbox (e.g. `hello@aitools.clients...`) — this
   is the click that unlocks sending; no campaign or transactional email is sent by this step.

No emails are sent as part of Foundation. Brevo remains configured-but-silent until Market (W7/W8)
or Operate explicitly sends something, each under its own approval gate.

---

## Gate requests (VOM/CLIENT — submitted by orchestrator, not this agent)

1. **VOM — business-name + niche decision.** Same open item as legal-financial.md; determines the
   final subdomain label and the custom-domain search term.
2. **CLIENT — custom-domain purchase.** Client buys + owns the domain directly (registrant +
   billing = client) once the name is chosen; VOM supplies the exact search term and registrar
   steps above.
3. **VOM — Brevo sender verification.** Add the sending domain in Brevo, click verify, verify the
   sender mailbox. No email is sent by this step alone.

---

## Status for Build

**The subdomain in §1 is staged and sufficient for Build (W4) to deploy on a live hostname now.**
Custom-domain purchase (§2) and Brevo verification (§3) are independent, non-blocking CLIENT/VOM
gates that can complete in parallel with or after Build.
