# Client Business Hub

The backend the launched business's **owner** logs into to run their business — the
`operations_model: "hub" | "hybrid"` deliverable from the Business Operating Profile. The hub *is*
the login (passwordless magic-link), which is how it coexists with "no shared passwords, no
dashboards handed out": the owner authenticates a single-use link, they never hold a credential.

**Live (production):** https://vom-client-hub.vercel.app  · Vercel project `client-hub` (protection off).
**Source:** `index.html` — one self-contained file (inline CSS + JS, real VOM logo as a data URI,
no external requests, no deps). Corporate brand (navy/orange/teal, Manrope), light + dark.

## How it's driven
Modules render conditionally from the operating profile's `client_hub: [...]` array (keys match the
wizard's output exactly: `crm · content · bookings · inbox · payments · reports`). Paste a real
exported `business-operating-profile.json` in **Settings** and the hub reconfigures live. Default
seed = a church with `["crm","bookings","inbox","reports"]`.

## What's real (client-side, persisted to `localStorage: vom_client_hub_v1`)
- Sign-in flow (magic-link screen → session) + "continue as demo owner"
- Conditional dashboard shell (only the profile's modules show)
- **CRM** kanban (add / move / remove), **Content & calendar**, **Bookings & events**,
  **Inbox & follow-ups** (draft + mark-sent), **Payments & invoices** (add + status),
  **Reports** (the running-inventory stat tiles, computed live from local data)
- **Settings** — module toggles + paste-profile reconfiguration
- Light/dark, keyboard-accessible

## What's a stub — needs a real backend (each labelled in-app)
- **Magic-link delivery + token verification + real sessions** — no email is sent; there's no auth server.
- **Inbox "send"** — drafts don't actually send.
- **Payments/invoices** — no real Stripe processing; status is local only.
- **Persistence** — everything is this-browser `localStorage`; a real hub needs a per-owner datastore.
- **Reports data** — in local mode the tiles compute from this-browser seed (honestly badged "local prototype").
  Connected, they come from the server-side read-adapter below — real, not seed.

## The backend is deployed — flip it real with two env vars
The serverless backend (`api/`) is **live** alongside the hub (magic-link auth, sessions, per-tenant
`state`, tenant profile — see the shared contract in each handler). It runs behind a storage adapter:

- **No env set (today):** `MemoryStore` — per-serverless-instance and ephemeral, so it *cannot* complete
  the magic-link round-trip across requests. The hub detects this (`/api/session` returns
  `persistent:false`) and **stays in local-only mode** (localStorage) — usable now, never broken.
- **Add a store → it becomes real.** Either shape works, checked in this order:
  **`KV_REST_API_URL` + `KV_REST_API_TOKEN`** (Vercel KV / Upstash REST) or **`REDIS_URL`** / `KV_URL`
  (any Redis — spoken as RESP over TCP/TLS, no npm client). `/api/session` then reports
  `persistent:true`, the hub switches to **connected mode**, and passwordless sign-in + cross-device
  persistence work end-to-end.
  > ⚠️ **Use the READ-WRITE KV token, not `KV_REST_API_READ_ONLY_TOKEN`.** This bit us in production:
  > the read-only token satisfies every env check, so the hub reported `persistent:true`, entered
  > connected mode, and then every sign-in died with `NOPERM … 'set'` on the first write. Persistence
  > is now decided by an actual write probe, not by env presence, and the failure is reported plainly.
- **Add `BREVO_API_KEY`** (+ optional `BREVO_SENDER_EMAIL`/`BREVO_SENDER_NAME`) → magic links are emailed.
  **In production the link is never returned in the API response.** Handing a working sign-in link back
  to whoever asked for it turns "I know an owner's address" into "I am that owner", so `devLink` requires
  `HUB_DEV_LINKS=1` **and** a non-production environment; otherwise a missing provider fails closed (503).
  `/api/auth/request` is also rate-limited (5/hour per address, 20/hour per IP) — it spends the operator's
  Brevo reputation on whatever address it is handed.
- **Add `PROVISION_TOKEN`** (a secret you choose) → the guarded `POST /api/provision` endpoint accepts
  tenant registrations. Until it's set, `/api/provision` is **fail-closed** (503 "provisioning not configured").

These env steps are the operator's (they involve provisioning a KV store + secrets — credentials the agents
never touch). **Setup wizard:** https://vom-client-hub.vercel.app/setup.html (`setup.html`) generates the
`PROVISION_TOKEN`, gathers the KV + Brevo values, and hands back a ready-to-paste env block, a downloadable
`.env` file, and the `vercel env add` CLI commands. Self-contained, no network — the secrets stay in the
operator's browser.

## Is it actually working? — `GET /api/health`
Unauthenticated and deliberately dull: adapter name, a real write→read→delete round-trip, and whether
email + provisioning are configured. No tenant data, no addresses, no key material, no env values.

```json
{"ok":true,"storage":"kv","store_writable":true,"email_configured":true,
 "provisioning_configured":true,"sign_in_ready":true}
```

**`sign_in_ready` is the one to look at** — a magic link can only complete when the store is writable,
Brevo is configured, and a tenant can be provisioned. Anything else and the hub tells you which leg is
missing instead of failing at the click.

## Multi-tenant model (one deployment, many businesses)
This is **one hub deployment serving many launched businesses**. A tenant is registered via
**`POST /api/provision`** (guarded by `x-provision-token: $PROVISION_TOKEN`) with
`{tenant_id, owner_email, operating_profile}`. Storage is namespaced per tenant (`tenant:<id>:profile`,
`tenant:<id>:state`); an owner's magic-link sign-in resolves to their tenant, and `/api/tenant` + `/api/state`
are scoped to it — no cross-tenant leakage. Sign-in is **fail-closed**: an owner with no registered tenant
gets a 403 and no session, so **the pipeline must provision a tenant before handing out the hub link.**

## The pipeline provisions it — `turnkey provision-hub`
The Turnkey engine wires this in: `turnkey provision-hub "<idea-folder>"` — when the operating profile's
`operations_model` is `hub`/`hybrid`, it writes a **provisioning gate** (`turnkey/gates/W6-provision-hub.md`
+ `-payload.json`) containing the exact `POST /api/provision` curl and payload, and opens the W6 gate for VOM.
The **operator** runs that curl (they hold `PROVISION_TOKEN`) — credentials never touch the agents. The engine
emits the gate; the human executes it.

`provision.sh <idea-folder> <out-dir>` still exists as the *static-bundle* variant (bakes `window.__TENANT__`
for a standalone per-tenant deploy), but the multi-tenant `/api/provision` path above is the primary model.

## Reports read-adapters — `GET /api/reports`
Session-gated, tenant-scoped. Computes the monthly "running inventory" **server-side** from real data
instead of this-browser seed:
- **revenue · content · follow-ups · CRM** — aggregated from the tenant's own hub state
  (`tenant:<id>:state`), month-to-date, server-authoritative and cross-device.
- **site liveness** — a real HTTP GET against the tenant's configured domain (`up/down` + `checkedAt`);
  credential-free (it's the tenant's own public URL).
- **presence (Engage AI)** — env-gated: set **`ENGAGE_AI_BASE_URL`** (+ optional **`ENGAGE_AI_TOKEN`**) and
  the adapter queries Engage AI for this business's benchmark. Not configured → honestly reported as such;
  **no numbers are ever fabricated.**

Every tile carries a `source` (`tenant-state` / `http-check` / `profile` / `none`) so the hub badges
**live vs local vs not-connected** rather than pretending seed is real. The hub's Reports view fetches this
in connected mode (with a Refresh button) and falls back to local computation otherwise. 401 without a
session — no tenant-less or cross-tenant read.

## Still to do
Optional: an Engage AI benchmark endpoint matching the adapter's `GET {base}/api/benchmark?business=` shape
so presence tiles light up; optional automation of the provision curl once a credential-holding runtime
(not the agents) exists.
