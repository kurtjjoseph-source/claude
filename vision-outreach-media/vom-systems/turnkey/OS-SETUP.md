# Turnkey Launch OS — operator setup

Two surfaces, deliberately separate:

| Surface | URL | Who sees it |
|---|---|---|
| **The explainer** — what Turnkey is, how it works, what it costs | `https://vom-turnkey.vercel.app/` | anyone |
| **The Launch OS** — the cockpit you actually work in | `https://vom-turnkey.vercel.app/os` | licence-key holders only |

The OS is **not** an unlisted page. `/os` is a serverless function that resolves your session
*before* it renders anything: with no valid session the OS markup is never sent, and the source it
is built from (`api/_lib/os-app.js`) is not reachable as a static file. The rest of the repo
— the engine, the orchestrator skill, the subagents, the client-hub — is excluded from the deploy
by `.vercelignore` and has no public URL at all.

---

## 1. Set the two environment variables

**The gate fails closed.** Until these are set, `/os` answers *"the gate is not configured"* and
nothing unlocks — including for you. Set them on the `turnkey` Vercel project (dashboard →
Settings → Environment Variables, or the CLI below).

### `TURNKEY_LICENCE_KEYS` — who gets in

Comma-separated, each entry `key` or `key:Label`. The label is what the OS shows in its top bar.

```
vom-<paste-a-long-random-string>:Vision Outreach Media,acme-<another>:Acme Media (franchisee)
```

Generate a key worth using:

```bash
echo "vom-$(openssl rand -hex 24)"
```

Add it with the CLI (it will prompt you to paste the value — the key never needs to leave your
machine in a file):

```bash
cd "vom-systems/turnkey" && vercel env add TURNKEY_LICENCE_KEYS production
```

### A store — so launches survive

Without one the registry runs in serverless memory: it works, but the server forgets every launch
on its next cold start, and the OS says so in an orange banner rather than pretending. **Pausing a
launch and coming back to it next month only works with a store configured.**

Either shape works, checked in this order:

| Variable(s) | Source |
|---|---|
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | Vercel KV / Upstash REST |
| `REDIS_URL` (or `KV_URL`) | any Redis — Vercel's Redis integrations, Upstash TCP, self-hosted. **This project uses this one.** |

Both are spoken with zero dependencies (the Redis path is RESP over TCP/TLS, written by hand so the
function needs no npm client). Confirm which one is live, and that it actually round-trips:

```bash
curl -s https://vom-turnkey.vercel.app/api/health
```

```json
{"ok":true,"storage":"redis","persists_across_cold_starts":true,"roundtrip":true,"gate_configured":true}
```

`/api/health` is public but tells you nothing useful as an attacker: adapter name, a boolean
round-trip, and whether keys are configured — no data, no key material, no env values.

> The **Client Business Hub** (`client-hub/`) still speaks REST only. On a `REDIS_URL`-only project
> its magic-link round-trip cannot complete, so it needs the same adapter ported across before it
> is switched on.

### Optional — `STRIPE_SECRET_KEY`

Set it and the gate will also accept a real Stripe `cs_…` checkout session, `sub_…` subscription,
or `cus_…` customer id, verified live against Stripe (paid / active only). That is how a buyer
unlocks the OS with their receipt instead of a key you issued by hand.

---

## 2. Redeploy

```bash
cd "vom-systems/turnkey" && vercel deploy --prod --yes
```

Environment variables are read at request time, but a redeploy is the clean way to be sure.

---

## 3. Use it

Open `/os`, paste your key once (30-day session, `HttpOnly` cookie, revocable by removing the key
from the env var), and you land in the console.

**Console** — every launch you have imported: stage rail, gates waiting on you or the client, the
blueprint (org type, function set, WordPress-or-app), the workstream table, the consent log with
its hash chain **re-verified in the browser**, and your own notes. Mark a launch
`in progress · paused · live · archived`; it is still there when you come back, on any machine.

**Import** — drag the business folder's `turnkey/launch-state.json` (and optionally
`consent-log.jsonl`) onto the import panel. Re-import any time to bring a launch up to date; its
history and your notes are kept.

> The business folder stays the source of truth for **state** — the engine writes it, and the
> engine's guards are what make the pipeline safe. The OS is the source of truth for **what you
> are running and where you left it**. Import after a work session; export when you need the state
> back on a different machine.

**Operate** — install the engine, the full command reference, the org-type and function catalog,
and a builder that writes the exact `turnkey gate` / `turnkey consent` commands for a chosen
launch and workstream, so a gate is never approved by memory.

---

---

## Running a launch without scripting — `turnkey wizard`

The hosted OS is the **registry**: what you are running, and where you left it. It runs in a
browser on Vercel, so it cannot read your idea folders or run the engine — which is why it asks
you to import `launch-state.json`.

The **wizard** is the other half, and it runs on your machine:

```bash
python3 "vom-systems/turnkey/orchestrator/engine/turnkey.py" wizard
```

One command, then everything is buttons: pick or create an idea folder, write the business
profile, record the terms, let it read the profile and propose the org type + the
WordPress-or-app decision, confirm or override, hand a step to a person, record a YES or NO,
mark things done, advance stage by stage. It binds to 127.0.0.1 only, mints a one-time token
that every call must carry, refuses anything outside your ideas folder, and stops with Ctrl-C.

It never reimplements a rule — every change shells out to the same engine, so a gate that
would refuse on the command line refuses here too. The difference is that the wizard then
*explains* the refusal and offers the step that clears it, instead of leaving you to compose
`turnkey consent …` by hand.

**Sync** — with `TURNKEY_OS_KEY` set to your licence key, the wizard's "Sync to hosted OS"
button pushes the launch straight into the registry at `/os`. No file dragging:

```bash
export TURNKEY_OS_KEY="<your licence key>"
```

---

## Where the source lives

| Piece | Path |
|---|---|
| OS app (source of truth) | `_build/turnkey-os.html` |
| Unlock screen | `_build/turnkey-gate.html` |
| Blueprint catalog shown in Operate | `_build/turnkey-catalog.json` — regenerate with `turnkey.py orgtypes --json` |
| Compiled bundle (generated, git-ignored from the public path) | `turnkey/api/_lib/os-app.js` |
| Gate, session, licence check | `turnkey/api/_lib/gate.js` |
| Launch registry API | `turnkey/api/launches.js` |
| Storage adapter (KV / Redis / memory) | `turnkey/api/_lib/store.js` |
| The guided wizard (local) | `turnkey/orchestrator/engine/wizard.py` + `wizard.html` |

Edit the source in `_build/`, run `node _build/build.js`, redeploy. Never edit the compiled
bundle — it is overwritten on every build.
