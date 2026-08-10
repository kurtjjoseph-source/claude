# Outreach Batch 1 — Candidate for CLIENT Approval

**Author:** Vision Outreach Media (VOM), operating on behalf of the operator.
**Workstream:** W9 — Leads & distribution.
**Status:** ASSEMBLED, NOT SENT — operator chose **HOLD (2026-07-29)**; no approval logged, batch parked.
Nothing goes out until the operator gives the explicit, logged YES described in §3 below.
**Sign-off confirmed by operator:** emails go out as **"Vision Outreach Media"** (no personal name).

---

## 1. Why these 10

Selected from `turnkey/market/prospects.csv` (61 rows total), prioritized per the geography
refinement (Amersfoort + Utrecht province first, local-first acquisition) and the segment-
diversity principle in `prospects.md` §4 (spread across denominations so the founder cohort tests
the offer across church types, not one tradition). All 10 are warm/local — Amersfoort (VOM's home
city), Utrecht, or Zeist — none are the tier-2 major-city rows.

| # | Church | City | Tradition | Contact channel | Message |
|---|---|---|---|---|---|
| 1 | RK Parochie Onze Lieve Vrouw van Amersfoort (central secretariaat) | Amersfoort | Roman Catholic | centraalsecretariaatolva@katholiekamersfoort.nl / 033-4893599 | Email 1 |
| 2 | Westerkerk (NGK Amersfoort-West) | Amersfoort | Ned. Gereformeerde Kerken | 033-4616833 (phone; use site contact form for written first touch) | Email 1 |
| 3 | Bergkerk | Amersfoort | PKN Protestant | site contact page (bergkerkamersfoort.nl) | Email 1 |
| 4 | Evangelische Gemeente De Ark | Amersfoort | Evangelical | site contact page (egdeark.nl) | Email 1 |
| 5 | International Christian Fellowship / Grace Church Amersfoort | Amersfoort | International / Evangelical (SKIN) | site contact page (gracechurch.nl) | Email 1 (English-speaking congregation — good pilot fit) |
| 6 | Baptistengemeente Amersfoort | Amersfoort | Baptist | site contact page (baptisten-amersfoort.nl) | Email 1 |
| 7 | Kruispunt Vathorst | Amersfoort (Vathorst) | Ecumenical (PKN/CGK/NGK) | site contact page (kruispuntvathorst.nl) | Email 1 |
| 8 | Christelijke Gereformeerde Kerk Amersfoort (Ichthuskerk) | Amersfoort | Christelijke Gereformeerde Kerken | site contact page (cgkamersfoort.nl) | Email 1 |
| 9 | Domkerk | Utrecht | PKN Protestant | secretariaat@domkerk.nl / 030-2310403 | Email 1 |
| 10 | Protestantse Gemeente Zeist (central) | Zeist | PKN Protestant | kb@pgzeist.nl / 030-6920300 | Email 1 |

**Message used:** Email 1 (First touch) from `turnkey/market/sequences.md` §2, verbatim, with
`[Church Name]` filled in per row and `[Operator name]` set to whatever sign-off the operator
confirms at approval (see §3). No row in this batch gets Email 2 or Email 3 yet — follow-ups are
each their own future batch, timed and approved separately per the sequence rules.

**Rows with only a "site contact page" channel** (4, 5, 6, 7, 3, 8) will be sent via the church's
own published contact form rather than a direct email address, since no public office email was
verifiable for those six in this pass — same message, different delivery mechanism. Rows 1, 2, 9,
10 have a verified direct office email or phone.

---

## 2. What this batch is NOT

- Not a send. Nothing above has gone out.
- Not an authorization for batch 2 or any later batch — this gate covers these 10 rows and this
  message only.
- Not a use of any personal contact (no individual pastor's personal email/phone is used — every
  channel above is the church's own public office contact).

---

## 3. CLIENT APPROVAL GATE — the exact YES required before anything sends

**Nothing sends until this YES is given and logged.** This is a standing but per-batch, scoped,
revocable growth mandate — approving this batch does not pre-approve any future batch.

**To approve, the operator confirms in chat (or via the magic-link/WhatsApp approval mechanism
once wired):**

> YES — send Outreach Batch 1 (the 10 churches listed in `outreach-batch-1.md` §1) using Email 1
> from `sequences.md`, sign-off as [operator's chosen name/handle]. This YES covers only these 10
> rows and this message; nothing else is authorized.

**On receipt of that YES, the orchestrator logs it before any send fires:**
```
$TK consent "AI Tools Assessment Business" --workstream W9_leads \
    --action "send outreach batch 1 (10 NL churches, Email 1) to prospects.csv rows 1-10 subset" \
    --actor CLIENT --channel <magic-link|whatsapp|chat> --decision YES \
    --evidence "<exact confirmation text/token>" --scope "this batch only"
```

**Before approving, the operator should confirm:**
1. The `[Operator name]` sign-off to use in the email (a real first name, or "the VOM team" —
   never send under a client's personal name per the org-voice rule).
2. That €295 / €350-per-month / **FOUNDINGCHURCH** are still the live, correct figures on
   `https://vom-ministry-ai.vercel.app` at send time (re-verify — pricing pages change).
3. That none of these 10 churches has separately asked not to be contacted.

**Standing rules that continue to apply after this YES:**
- Any reply of "no" / "not interested" / "remove me," or silence through Email 3, is a permanent
  decline for that church — no further contact of any kind.
- Follow-up emails (Email 2, Email 3) for these same 10 churches are **separate future batches**,
  each requiring its own logged YES, timed per the 5–7 day spacing in `sequences.md` §2.
- Any recipient list expansion beyond these 10 rows requires a new batch and a new YES.

**Until the YES above is given and logged in the consent log, this batch remains assembled and
unsent.**
