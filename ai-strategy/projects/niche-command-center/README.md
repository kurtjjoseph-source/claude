# VOM Ops Tracker

Project 2's niche command center — a local-only Node.js MVP that solves one real problem: knowing what's overdue across VOM clients at a glance, plus a dated notes/history log per client so context isn't lost between sessions.

No database — just a local JSON file (`data/clients.json`), per the original planning spec.

## Run it

```bash
npm install
npm start
```

Then open http://localhost:4100. (Or use the `vom-ops-tracker` launch config via the `run` skill / Claude Preview.)

## What it does

- **Dashboard** — overdue next-actions first (sorted most-overdue first), then what's due in the next 7 days.
- **Clients** — add a client, log dated notes, add next-actions with a due date, mark actions done.

## Adding features

Per the video's iteration philosophy: this is a working V1, not a finished product. Add fields (hosting/domain renewal dates, deliverable status, contact info) as you actually hit the need for them — just ask Claude to extend `server.js` and `public/index.html` rather than rebuilding from scratch.
