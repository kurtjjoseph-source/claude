# Agent Cloud API — Architecture & Product Decisions

**⚠️ SUPERSEDED as of 2026-07-08.** This standalone service (and its `agent-hub` WordPress plugin) assumed the side-hustle agent customer was different from Engage AI's church customers. That assumption turned out to be wrong — the YouTube-channel agent (and the other 7 hustles) are meant to serve the *same* organizations already using Engage AI. The ticket/cycle/scheduler code here was ported into `engage-ai-cloud-api` as a modular capability (`Organization.enabled_modules`, `agent:<niche>`) instead — see that repo's `ARCHITECTURE.md` §3.4 for the current, active design. This repo is left as-is for reference/history, not deleted, and is not being deployed.

**Status as of this doc (historical):** FastAPI backend running locally and verified end-to-end against a live Anthropic key (register → create client → run cycle → real tickets → approve/reject/redirect → next cycle uses the updated context). Git initialized, not yet deployed. A WordPress dashboard (`agent-hub`, see §3.4) now exists as the intended delivery surface, also not yet deployed. Kurt is Phase 2: using the agent on his own YouTube channel idea before selling to anyone.

## 1. What this is

The hosted, customer-independent runtime for the "customized agents per business idea" product line explored alongside the `8-claude-ai-side-hustles` deck. Not a chatbot — a **supervised autonomous agent**: on a schedule, it reviews a client's state, proposes concrete work, executes anything reversible immediately, and holds anything with real-world consequence (money, public posting, contacting a real person) for explicit human approval. Kurt only checks in to approve, reject, or redirect.

This is a sibling to `engage-ai-cloud-api`, not an extension of it — different customers (business-idea pilots vs. churches), same reusable skeleton (JWT auth, Postgres via docker-compose, VPS + Caddy hosting recipe). See that repo's `ARCHITECTURE.md` for the hosting playbook this one follows.

## 2. What's already built (`app/`)

- **Auth** — JWT register/login, copied verbatim from Engage AI's pattern (`routers/auth.py`, `services/security.py`)
- **Clients** — one row per business the agent runs; `niche` selects which prompt the cycle engine uses, `profile` is free-form JSON memory (`routers/clients.py`, `models/entities.py`)
- **Tickets** — the state/queue every check-in cycle reads and writes: `backlog -> proposed -> approved | rejected` (redirect sends a ticket back to `backlog` with a `decision_note` the next cycle must address) (`routers/tickets.py`)
- **Agent runs** — a log row per cycle, feeding the next cycle's context so the agent doesn't repeat itself (`models/entities.py`)
- **Cycle engine** — `services/cycle_engine.py`: loads a client's profile + recent run history + open tickets, calls Claude, persists whatever tickets/summary come back. Called identically by the manual `/cycles/run` endpoint and by the scheduler — there is only one code path for "run a cycle."
- **Agent brain** — `services/agent_ai.py`: `BASE_PROTOCOL` (niche-agnostic rules, translated from `agent-lab/PROTOCOL.md`) + `NICHE_PROMPTS["youtube_channel"]` (the only niche wired up so far). Adding hustle #2 later means adding one more dict entry here — the engine itself doesn't change.
- **Scheduler** — `services/scheduler.py`: APScheduler running in-process, not Celery/Redis. One fewer moving part to operate, chosen for the same low-maintenance reason as Engage AI's VPS-over-managed-platform call.
- **Deployment scaffolding** — `Dockerfile`, `docker-compose.yml` (API + its own Postgres, ports 8001/5433 so it can run alongside `engage-ai-cloud-api` on the same host without colliding)

## 3. Product decisions (locked in 2026-07)

### 3.1 Risk gate is the safety mechanism, not a limitation
Every ticket the agent proposes carries `risk: "low"` or `"high"`. Low risk (drafting content, research, organizing) the agent just does and hands back the finished output. High risk (spending money, posting publicly, contacting a real person) it can only surface — there is deliberately no tool wired up yet that lets the agent execute a high-risk action on its own. This is the actual product differentiator: autonomy on the boring parts, a hard stop on anything irreversible.

### 3.2 Pilot niche: YouTube channel growth (side hustle #3)
Chosen because it overlaps Kurt's existing skills (teaching, music, life coaching) and because content ideation/scripting is inherently low-risk — there's no "auto-publish" tool yet, so every ticket in this niche is a draft awaiting Kurt's creative decision, not a safety decision. That makes it a clean first niche to validate the whole loop before anything touches real money or a real public post.

### 3.3 One client row for personal validation before any customer exists
Per the pathway agreed with Kurt: Phase 1-2 means Kurt is the first (and, for now, only) row in `clients`, running real check-in cycles on his own channel until the agent produces a real result. Only after that does packaging/selling (Phase 4) start, backed by that real outcome instead of a hypothetical.

### 3.4 Delivery: WordPress plugin ("Agent Hub"), not email digest
Reversed the earlier "email digest first" plan. Since Engage AI already committed to WordPress plugin distribution (see its `ARCHITECTURE.md` §3.1) and Kurt operates in WordPress himself, the ticket dashboard belongs there rather than in a separate email flow or standalone app. Built as a new sibling plugin, `agent-hub` (in `~/Downloads/agent-hub-wordpress`), mirroring `engage-ai`'s exact plugin architecture (JWT stored in `wp_options`, `wp_remote_request`-based API client, nonce-protected `admin_post` handlers): a Settings page (connect/register, pick or create a client) and a Tickets page (run a cycle on demand, review proposed tickets with their full drafted payload, approve/reject/redirect, answer clarifying questions by updating the client's profile, see recent cycle history). This is now the primary way to interact with the agent — curl is only needed for local API testing.

No Stripe wiring yet (keys scaffolded in config, unused) — not needed until this moves past Kurt's own use.

### 3.5 Hosting: Render.com, not the VPS
Reversed from the original "same VPS as Engage AI" plan. Engage AI's own VPS deploy was never actually completed (still has open unknowns — unconfirmed Docker support on the One.com/Bluehost plan, no Caddyfile written yet), and Engage AI's repo already scaffolds a Render `render.yaml` explicitly as "a cheap fallback option if the VPS plan turns out not to support Docker." Rather than resolve the VPS unknowns first, `agent-cloud-api` deploys straight to Render using that same fallback pattern: `render.yaml` at the repo root (`runtime: docker`, using the existing `Dockerfile` unmodified), a managed Postgres instance (`agent-cloud-db`), and `ANTHROPIC_API_KEY` set as a Render secret (`sync: false`) rather than committed anywhere.

**Deploy steps:** push this repo to GitHub, connect it in the Render dashboard as a Blueprint (reads `render.yaml` directly), set `ANTHROPIC_API_KEY` in the Render dashboard once the service exists (it's the only `sync: false` var), deploy. Render assigns a public URL (`https://agent-cloud-api.onrender.com` or similar) — that's what `agent-hub`'s Settings page points at instead of `localhost:8001`.

**Not yet decided:** whether Engage AI itself should also move to Render given this precedent, or stay on the VPS plan — out of scope here, flagged for a future decision in that repo, not this one.

## 4. Outstanding implementation gaps (not decisions — just not built yet)

- **Git repo initialized, not yet deployed.**
- **Verified against a real `ANTHROPIC_API_KEY`** — two live cycles run for Kurt's own `youtube_channel` client (see git log / AgentRun history), producing real, usable video/script/thumbnail drafts. Not yet tested at any real scale or with a second client.
- **No email digest / notify service** — superseded by the `agent-hub` WordPress plugin (§3.4). May still be worth adding later as a "new tickets waiting" nudge, since the WP dashboard requires actively checking rather than being pushed to.
- **No Alembic migrations** — relies on `Base.metadata.create_all`, same known gap and same reasoning as Engage AI (fine until there's real production data to migrate around).
- **No Caddyfile/VPS deploy yet** — follows the exact recipe in `engage-ai-cloud-api/ARCHITECTURE.md` §3.3 when this is ready to go live. `agent-hub`'s Settings page just needs the resulting API URL pointed at it.
- **Only one niche wired up** — `youtube_channel` only. Adding hustle #2 is a `NICHE_PROMPTS` entry plus (later) any niche-specific tool integration, not a new engine. `agent-hub`'s ticket rendering already falls back to a generic JSON view for unrecognized payload shapes, so it doesn't need changes per niche either.

## 5. Deferred for later (explicitly not now)

- Real "hands" for the agent (marketplace APIs, YouTube upload API, email sending) — everything today is drafting/research only, which is why every ticket is `risk: "low"`. High-risk tool execution is a deliberately separate, later decision.
- White-labeling `agent-hub` for resale to a customer who isn't Kurt — not needed while Kurt is the only client.
- Self-serve Stripe billing — deferred until this moves beyond personal use, same call as Engage AI.
