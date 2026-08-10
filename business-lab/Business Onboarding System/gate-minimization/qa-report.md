# QA Report: Gate-Minimization Non-Technical Client Criterion

**Criterion:** "Can a person who only uses WhatsApp and email, on a phone, complete this step in under 5 minutes, without encountering jargon, a password, an account signup, or a dashboard?"

## Validation Matrix

| Step | Matrix Row | Verdict | Time | Jargon | Failure Mode |
|---|---|---|---|---|---|
| Profile approval | W1 | PASS | 2–3 min | None; plain Dutch ("who you are, what we build") | ✓ Voice-note fallback, 48h escalation ladder functional. |
| Terms/Privacy approval | W2 | CONDITIONAL | ~5 min | Undetermined | ⚠️ **No UX designed in client-ux.md.** Matrix specifies "magic-link, inline, read-aloud" but no copy, tap flow, or escalation provided. Design gap: gap unclear if bundled with step 1 (profile) or step 3 (content). Recommend clarify scope before rollout. |
| Stripe-hosted KYC (ID+IBAN) | W5 implicit | CONDITIONAL | 5–10 min | "Payment partner Stripe" well-framed; "ID photo" & "IBAN" plain. | ⚠️ **Stripe's UX outside our control.** Photo rejection (lighting, angle, ID type) forces retries; cumulative time: 10–15 min for difficult cases. Mitigation: 24h reminder, 48h VOM offers phone support ("do it together"). Adequate but dependent on photo quality and Stripe's ML acceptance. |
| Content sign-off | W6 | CONDITIONAL | 3–8 min | None; "text for website/manual" plain. | ⚠️ **Volume unbounded.** 5-page website copy = 3 min; 20-page manual = 12 min. Design assumes "short content" but no max specified. Risk: long approval stalls onboarding. Mitigation: implement content-chunk rule (max 2,000 words per approval; split manuals into 2–3 approvals by chapter). |
| Social-media batch (weekly) | W8 | PASS | 2–4 min | None; "messages for social media" plain. | ⚠️ Rubber-stamping risk: "JA voor alles" button allows careless approval. Mitigation: consent log records exact content + timestamp. Risk level: medium (most clients read; some skip). Operational note: monitor approval time/pattern for anomalies. |
| Outreach messages (weekly) | W9 | PASS | 2–4 min | None; "messages we send on your behalf" plain. | ⚠️ **Rubber-stamping risk higher than W8.** Outreach sent to real people in client's name; careless approval (via "JA voor alles") could harm client's reputation if message is misspelled or tone-deaf. Mitigation: same consent log + recommend forcing individual message approval in first 2–3 weeks (after 3 successful digests, switch to batch mode). |
| GBP verification code | W7 | PASS | <1 min | None; "postcard code" and "6 digits" plain. No Google login exposed. | ✓ Cleanest step. Numeric-only entry, two input methods (WhatsApp text or magic-link), handles 14-day postcard delay correctly, phone escalation if lost. **No edge-case risk.** |
| Pricing/refund decision | Ongoing (step 7) | PASS | <1 min | None; "price adjustment" and "refund" plain. | ✓ Direct WhatsApp reply, no UI. Copy includes "no rush" (encourages thought). Standard ladder applies. Low friction, but relies on client reading. **Safe for rare, high-stakes decisions.** |

## Summary

**Counts:** 5 PASS, 3 CONDITIONAL, 0 FAIL

**Overall verdict:** 62.5% ready; 37.5% need design/specification before client rollout.

## Weakest Step

**Stripe-hosted KYC (5–10 min, CONDITIONAL).** Stripe's hosted form is outside platform control; photo rejection can cascade to 10–15 min total. Phone escalation at 48h mitigates but depends on VOM's availability and client's patience. Recommend: add pre-onboarding phone call to set expectations ("ID photos must be brightly lit, passport-style") and offer sync-session option for high-friction clients.

## Recommendations (3)

1. **[HIGH] Bound content approval length.** Add to W6 design: "≤2,000 words per approval; chunk manuals into separate sections." Prevents exceeding 5-min criterion.

2. **[HIGH] Complete W2 (Terms/Privacy) UX design.** Specify: sample terms copy, magic-link screen mockup, read-aloud implementation, reminder ladder. Clarify whether bundled with W1 (profile) or standalone step.

3. **[MEDIUM] Anti-rubber-stamp nudge for W9 (outreach).** Week 1–3: require individual message approval. After 3 compliant digests, enable "approve all" for convenience. Prevents reputational harm from careless batch approval.

---

**Confidence:** MEDIUM-HIGH. Analysis grounded in matrix + client-ux.md designs. Gaps: W2 (undocumented) and Stripe timing assumptions (outside control but mitigated). Jargon check: **PASS** — no platform jargon or technical terms found in any designed copy. **No dashboard, login, or password exposure across all 8 steps.**
