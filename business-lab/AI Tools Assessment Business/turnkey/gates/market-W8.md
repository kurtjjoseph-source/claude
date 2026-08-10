# Gate market-W8 — Weekly social digest approval  (actor: CLIENT)

**Workstream:** `W8_social`  ·  **Opened:** 2026-07-29  ·  **Status:** waiting on CLIENT

The full week-1 content batch is drafted in `turnkey/market/social/week-1.md` (3 LinkedIn,
3 Instagram + 2 stories, 2 Facebook). **Nothing posts before an explicit YES.**

**Approve (one tap, magic link / WhatsApp):** approving schedules the whole batch; no item posts
individually or before the YES. On approval, the orchestrator logs it:
```
$TK consent "$IDEA" --workstream W8_social --action "publish week-1 social batch (3 LI, 3 IG+2 stories, 2 FB)" \
    --actor CLIENT --channel magic-link --decision YES --evidence "digest token tapped YES" --scope "week-1 batch only"
```
**Blocked until** channel handles exist (needs live site + registered accounts) and the owner-voice
is confirmed. A NO drops the batch; the pipeline continues.
