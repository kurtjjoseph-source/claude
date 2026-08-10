# Gate intake-1 — KYB review + disclosure & terms  (actor: VOM)

**Workstream:** `intake`  ·  **Opened:** 2026-07-29  ·  **Status:** waiting on VOM

Intake produced `business-profile.md` and a **`flagged`** KYB result. Two human decisions are
required before the pipeline may proceed past intake. Nothing downstream runs until both clear.

---

## Part A — Clear the flagged KYB  (VOM decision)

The KYB verdict is `flagged` for the expected reason: this is a **pre-entity idea** — no KVK
registration, no legal name, no live site yet. No adverse findings (offer is a standard,
non-regulated professional service). Full detail: `turnkey/intake/kyb-result.md`.

**Do this:**
1. Read `turnkey/intake/kyb-result.md`.
2. Confirm this is a knowing new-entity launch (not a misrepresentation of an existing business).
3. If satisfied, clear it. The orchestrator will then log your decision:
   ```
   $TK consent "$IDEA" --workstream intake --action "clear flagged KYB (pre-entity idea, no adverse findings)" \
       --actor VOM --channel in-session --decision YES --evidence "operator reviewed kyb-result.md" --scope "intake KYB"
   ```

## Part B — Disclosure & terms acceptance  (CLIENT decision — BLOCKED)

The client must accept this disclosure before Foundation begins:

> Vision Outreach Media (VOM) will operate this business's digital assessment/consulting pipeline
> on the client's behalf — building and managing its website, domain, payment processing, and
> client-facing systems. The client owns all assets produced (domain, code, content, accounts)
> with no platform lock-in; VOM never holds client funds, credentials, or IDs directly.
> Proceeding past this point authorizes VOM to begin Foundation-stage setup on the client's behalf.
>
> **Do you accept these terms? (YES / NO)**

**⛔ This part cannot be resolved yet.** Platform-bootstrap prerequisite **#4
(`dutch_lawyer_terms`)** — the Dutch-lawyer review of the disclosure + terms and the fee values —
is still `pending`. Customer-facing terms must not go live before that review (biz-foundation W2
prerequisite). Hold this part open until:
1. `$TK matrix "$IDEA" --key dutch_lawyer_terms --value done` (after the review is complete), then
2. send the terms as a single-use magic link to the client and, on their tap,
   `$TK consent ... --workstream intake --action "accept terms" --actor CLIENT --channel magic-link --decision YES ...`

---

## Blocking TODO(operator) in the profile (resolve alongside)
1. Niche axis + specific geography/vertical (blocks domain, brand, targeted channels).
2. Legal/brand operating name (blocks entity formation + domain choice).
3. Final launch pricing confirmation (lock before W5/W6 payments/products).

**Intake reaches `done` only when:** Part A = YES **and** Part B = YES are both in the consent
log, and the blocking TODOs above are resolved. Until then intake stays `gate_pending`.
