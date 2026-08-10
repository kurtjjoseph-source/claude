# Turnkey — Onboarding Orchestrator

The executable spine of **Turnkey**, Vision Outreach Media's flagship Launch OS. Turnkey's
promise is *"idea in, launched business out."* Until now the house had the **blueprint** and
the **cockpit** (the Launch Console) but not the **engine** that runs a launch. This folder is
that engine: a Claude Code skill plus the workstream subagents it dispatches.

> **Status:** this is the execution *specification and wiring* — runnable in spirit and ready to
> register in `.claude/`. It does **not** create cloud accounts, keys, or move money. Several
> one-time **platform-bootstrap** steps (below) must be done by the human operator before a real
> launch can complete; the orchestrator is built to *stop at a gate* for each, not to fake it.

---

## What's in here

```
turnkey/orchestrator/
  SKILL.md            # the /onboard-business orchestrator — actors, rails, state, pipeline, DoD
  agents/
    biz-intake.md     # Intake: capture & verify, automated KYB, disclosure + terms YES
    biz-foundation.md # Layer 0: business profile, NL legal/financial, domain & email
    biz-build.md      # Layer 1: website & deploy, Stripe Connect payments, digital products
    biz-market.md     # Layer 2: presence & Engage AI loop, social team, leads & distribution
    biz-operate.md    # Layer 3: CRM & client hub, follow-ups
  README.md           # this file
```

## How it fits together

1. **`/onboard-business <idea-folder>`** (SKILL.md) is the orchestrator. It never does workstream
   labor itself — it **decomposes the launch into five stages**, dispatches the matching `biz-*`
   subagent per stage, holds the governance gates, logs consent, and tracks state.
2. Each **`biz-*` subagent** owns one layer's workstreams, knows which steps are `AUTO` vs which
   must hand to a `VOM` (operator) or `CLIENT` (owner's phone) gate, and reports back a
   definition-of-done or a **gate request**.
3. The pipeline runs **Intake → Foundation → Build → Market → Operate**. Independent workstreams
   run in parallel; one that hits a gate goes `gate_pending` while the rest keep moving.

## State & consent (why a launch survives a crash)

All state lives **inside the business folder**, so any agent in any session resumes cleanly —
which is exactly why this half-finished run could be picked up and completed:

- **`<idea-folder>/turnkey/launch-state.json`** — the single source of truth for every
  workstream's status (`not_started → in_progress → gate_pending → done`, or `blocked`). On
  resume, read this first and continue from the frontier; never restart completed work.
- **`<idea-folder>/turnkey/consent-log.jsonl`** — append-only, one line per side-effecting
  action. Nothing publishes, sends, or moves money without a matching `YES` written *before* the
  action. This log is the audit trail and the product's trust guarantee.

## To register as a runnable skill

Copy `SKILL.md` to `.claude/skills/onboard-business/SKILL.md` and the `agents/*.md` files to your
agent-definitions directory (e.g. `.claude/agents/`), then invoke with `/onboard-business <idea-folder>`.
Tune model routing (SKILL.md §5) to your available tiers.

---

## Platform bootstrap — the human-only prerequisites

These are the gates **no agent may touch** (create accounts, hold credentials, move money, sign
legal). They are one-time-ever: business #2+ inherits the setup cleared for business #1. Until each
is done, the dependent workstream **stops at a gate** rather than failing — but a launch cannot
reach "done" without them. **These are your part of completing Turnkey.**

| # | Prerequisite | Blocks | Actor |
|---|---|---|---|
| 1 | **Enable Stripe Connect** (Express + destination charges) on the live platform account; verify the platform capability | W5 Payments | VOM |
| 2 | **Delegate the Cloudflare `clients` zone** — create the zone and paste the one-time **NS delegation** at the apex registrar (one.com); leave apex + Brevo mail records untouched | W3 Domain/email, all tenant sites | VOM |
| 3 | **Credential baseline** — password manager + separate authenticator (MFA), scoped/restricted agent API keys, and **rotate the exposed `VERCEL_OIDC_TOKEN`** flagged in the Launch Console | every AUTO workstream that calls an API | VOM |
| 4 | **Dutch-lawyer terms review** — the client disclosure + terms drafts reviewed and the fee values filled in before the first client signs | W2 Legal, Intake terms YES | VOM |
| 5 | **Registrar decision for client `.nl` domains** (TransIP vs Cloudflare Registrar — confirm `.nl` support) | W3 custom domains | VOM |
| 6 | **Provisioned accounts** — Vercel, Brevo sender, bookkeeping — connected once | W4 deploy, W3 email, W2 books | VOM |

When these are complete, run **one** business end-to-end at low throttle (SKILL.md §9) before
enabling parallel launches, then review the consent + decision logs to tune model routing.

---

*Part of the Vision Outreach Media house of operating systems. Authored in the org voice — VOM /
"the operator", never a personal name.*
