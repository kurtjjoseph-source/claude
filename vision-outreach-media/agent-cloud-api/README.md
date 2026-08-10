# Agent Cloud API

**⚠️ Superseded 2026-07-08** — this service's ticket/cycle/scheduler code was ported into `engage-ai-cloud-api` as a modular capability instead of running standalone. See `ARCHITECTURE.md` for why. Kept here for reference, not deployed.

A deployment-ready FastAPI backend for **autonomous, supervised business agents** — one scheduled check-in cycle per client, proposing work, holding anything risky for human approval, and learning from decisions over time.

First niche wired up: **YouTube channel growth** (side hustle #3 from `8-claude-ai-side-hustles.pptx`). The engine itself is niche-agnostic — see `ARCHITECTURE.md`.

## Core features

- Client profile memory (one row per business the agent runs)
- Scheduled check-in cycles (APScheduler, in-process)
- Ticket queue: backlog -> proposed -> approved / rejected (redirect sends it back with feedback)
- Claude-powered cycle engine with a hard low/high risk gate
- JWT authentication
- Docker-ready deployment

## Local setup

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# then set ANTHROPIC_API_KEY in .env
uvicorn app.main:app --reload --port 8001
```

Open:

```text
http://localhost:8001/docs
```

## Docker setup

```bash
docker compose up --build
```

## Trying it yourself (Phase 2 of the pathway - validate before selling)

```bash
# 1. register + log in, grab the access_token
curl -X POST localhost:8001/auth/register -H "Content-Type: application/json" \
  -d '{"email":"kurt@example.com","password":"changeme123"}'

# 2. create yourself as the first client, niche = youtube_channel
curl -X POST localhost:8001/clients -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Kurt - main channel","niche":"youtube_channel","profile":{"topic":"music theory + life coaching","posting_cadence":"1 video per week","audience":"self-taught musicians and church media teams"}}'

# 3. run one cycle manually (this is also what the scheduler calls automatically)
curl -X POST localhost:8001/clients/1/cycles/run -H "Authorization: Bearer <token>"

# 4. see what it proposed
curl localhost:8001/clients/1/tickets -H "Authorization: Bearer <token>"

# 5. approve, reject, or redirect a ticket
curl -X POST localhost:8001/clients/1/tickets/1/decision -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" -d '{"decision":"approve"}'
```

## Main endpoints

- `POST /auth/register`, `POST /auth/login`
- `POST /clients`, `GET /clients`, `GET /clients/{id}`, `PATCH /clients/{id}/profile`
- `POST /clients/{id}/cycles/run`, `GET /clients/{id}/cycles`
- `GET /clients/{id}/tickets`, `POST /clients/{id}/tickets/{id}/decision`

## Production deployment

Set these environment variables on your host:

- `DATABASE_URL` (use PostgreSQL in production)
- `JWT_SECRET`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`
- `ENABLE_SCHEDULER`, `CYCLE_INTERVAL_HOURS`

Deployed via Render.com using `render.yaml` at the repo root (Blueprint deploy: push to GitHub, connect the repo in the Render dashboard, set `ANTHROPIC_API_KEY` once the service exists — everything else in `render.yaml` is either a default value or auto-generated). Render provisions its own managed Postgres (`agent-cloud-db`) and assigns a public HTTPS URL — point `agent-hub`'s Settings page at that instead of `localhost:8001`. See `ARCHITECTURE.md` §3.5 for why this uses Render instead of the VPS.
