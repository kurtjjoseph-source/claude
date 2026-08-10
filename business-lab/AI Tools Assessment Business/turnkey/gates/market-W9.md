# Gate market-W9 — Outreach send batch approval  (actor: CLIENT)

**Workstream:** `W9_leads`  ·  **Opened:** 2026-07-29  ·  **Status:** waiting on CLIENT

Prospect methodology in `turnkey/market/prospects.md`; sequences (owner voice) in
`turnkey/market/sequences.md`. Sending is a **standing scoped, revocable** growth mandate, logged
**per batch**. Never cold-send without the logged batch YES; respect NO + unsubscribe.

**Approve a batch:** on YES, the orchestrator logs it before any send:
```
$TK consent "$IDEA" --workstream W9_leads --action "send outreach batch <N> to <list>" \
    --actor CLIENT --channel magic-link --decision YES --evidence "batch token tapped YES" --scope "this batch only"
```
**Blocked until** (a) a real `prospects.csv` exists (needs the niche-axis decision, gate
`foundation-W1`) and (b) the owner confirms the voice once brand voice locks.
