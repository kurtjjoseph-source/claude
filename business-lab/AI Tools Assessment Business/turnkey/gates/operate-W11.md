# Gate operate-W11 — Daily follow-up send approval  (actors: VOM / CLIENT)

**Workstream:** `W11_followups`  ·  **Opened:** 2026-07-29  ·  **Status:** waiting on CLIENT

Daily drafts in `turnkey/operate/followups/2026-07-29.md` (new leads, stalled deals,
post-purchase, renewal nudges). **Nothing sends automatically** — per-draft approval, this cycle only.

Routing: new leads / stalled deals / post-purchase → **CLIENT** (magic-link, owner-voice);
renewal nudges → **VOM** (in-session, operational). On each YES, before the send:
```
$TK consent "$IDEA" --workstream W11_followups --action "send followup <category>/<draft-id>" \
    --actor VOM|CLIENT --channel in-session|magic-link --decision YES --evidence "..." --scope "this draft only"
```
**Blocked until** real CRM records exist and each draft's underlying fact is true (e.g. a confirmed
Stripe payment before a post-purchase follow-up). A NO drops that draft. The **first approved
send** is W11's definition-of-done milestone.
