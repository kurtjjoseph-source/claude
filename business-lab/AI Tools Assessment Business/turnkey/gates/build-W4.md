# Gate build-W4 — Go-live (promote to public URL)  (actor: VOM)

**Workstream:** `W4_website`  ·  **Status:** not yet opened — no preview deploy exists to promote

Build brief staged in `turnkey/build/website.md`. The devops-scrum-orchestrator dev swarm has not
been dispatched in this pass (blocked on `provisioned_accounts`: Vercel). This gate becomes
actionable only after: (a) `provisioned_accounts` clears, (b) the swarm is dispatched and produces
a preview deploy.

**Action requested (once preview exists):** promote the Vercel preview deployment to the live
production URL (`aitools.clients.visionoutreachmedia.nl` once `cloudflare_delegation` clears, or
the `*.vercel.app` URL otherwise). This makes the site publicly reachable/indexable — irreversible
in the sense that real visitors, crawlers, and search engines can hit it from that moment on.

**Why this is a gate:** publishing a public URL is an explicit publish action per governance rails
— preview builds are AUTO, going live is not.

**On YES:**
1. Promote preview → production in Vercel.
2. Confirm HTTP 200 on the production hostname.
3. Confirm valid SSL (no cert warning).
4. Confirm analytics + monitoring both report data from the live URL.
5. Log the YES + confirmation evidence to the consent log and update `launch-state.json` W4
   status (orchestrator, not this agent).

**On hold:** until swarm dispatch + preview deploy exist. Nothing to promote yet.
