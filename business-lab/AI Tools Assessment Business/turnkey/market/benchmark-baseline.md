# Presence Benchmark — Baseline (Engage AI 8-Channel Rubric)

**Author:** Vision Outreach Media (VOM), operating on behalf of the client/operator.
**Workstream:** W7 — Presence & the Engage AI loop.
**Status:** **STAGED.** No live site exists yet (`W4_website` gate-pending, blocked on
`provisioned_accounts`) and Google Business is not registered/verified. This document is the
benchmark *framework* plus an *expected white-space reading* for a not-yet-launched business —
not a live scan. Re-run for real the moment the site is promoted and channels are registered.

---

## 1. Why staged, not run

The Engage AI benchmark scores real, reachable public assets. Today, for this business:

- Website: staged build brief only (`turnkey/build/website.md`), no deployed URL.
- Google Business: not created (verification is a VOM gate — see §4).
- YouTube / Facebook / Instagram / LinkedIn / X: no handles registered yet; the business/legal
  name and niche axis are still open operator decisions (`business-profile.md` §Summary of
  Blocking Items), and handles should ideally reflect the final name/niche rather than being
  claimed twice.
- News mentions: none possible pre-launch.

Running the deterministic rubric against nothing would just produce eight zero scores — not a
useful baseline. Instead, this file locks the **rubric and scoring method** now so the real
baseline run is a single mechanical execution once Build clears, and documents the **expected
pre-launch white-space reading** so the operator can see the shape of the gap before it's real.

---

## 2. The 8 channels

1. Website
2. Google Business
3. YouTube
4. Facebook
5. Instagram
6. LinkedIn
7. X (Twitter)
8. News mentions

---

## 3. Deterministic rubric

Each channel is scored 0–100 on the same four weighted dimensions, so scores are comparable
month over month and across channels:

| Dimension | Weight | What it measures |
|---|---|---|
| **Presence** | 25% | Does the asset exist, is it claimed/verified, is it discoverable via search/platform search? |
| **Completeness** | 25% | Profile fields filled, bio/about copy present, links correct, category/tags set, media (logo, cover, photos) uploaded |
| **Activity** | 25% | Posting/update cadence over the trailing 90 days; recency of last post |
| **Engagement signal** | 25% | Followers/reviews/likes/comments relative to a small-business baseline; response rate to reviews/comments/DMs where applicable |

Per-channel score = weighted sum. **Trend classification** applied per channel:
- `white_space` — 0–20 (doesn't exist or is dormant/unclaimed)
- `new` — 21–40 (exists, minimal completeness/activity)
- `growing` — 41–65 (active, building signal)
- `saturated` — 66–85 (mature, may need diminishing-returns judgment)
- `healthy` — 86–100 (comprehensive presence, strong engagement)

**Overall org score** = unweighted mean of the 8 channel scores (no channel is skipped or
excluded from the denominator, even if not yet applicable — a channel that doesn't exist yet
scores 0, which is the honest baseline).

This matches the same rubric used by the `engage-ai-benchmark` / `engage-ai-scan` skills, so
scores are directly comparable to any other org VOM has benchmarked.

---

## 4. Google Business — setup + verification (VOM gate)

- **[AUTO]** Draft the Google Business profile: business name (placeholder until niche/name
  locks), category (AI/business consulting), service area (pending geography decision), hours,
  description drawn from `business-profile.md` §Offer, and the assessment offer as a featured
  service.
- **[VOM gate]** Verification (postcard / phone / video, per Google's current method for the
  category) requires the operator's registered business identity and a real, reachable address
  or service-area configuration. This cannot be automated — flagging as a **GATE REQUEST**
  below.

## 5. Expected pre-launch white-space reading

If scored today, the honest baseline would read:

| Channel | Expected score | Trend | Why |
|---|---|---|---|
| Website | 0 | white_space | No live URL; build brief staged only |
| Google Business | 0 | white_space | Not created; verification not started |
| YouTube | 0 | white_space | No handle registered |
| Facebook | 0 | white_space | No handle registered |
| Instagram | 0 | white_space | No handle registered |
| LinkedIn | 0 | white_space | No handle registered (operator personal profile may exist but is out of scope until designated as the business channel) |
| X | 0 | white_space | No handle registered |
| News mentions | 0 | white_space | Pre-launch; no press activity possible |
| **Overall** | **0** | — | Full white-space across all 8 channels — expected and unremarkable for a pre-launch business |

This all-white-space reading is the **entire point of running the real baseline immediately at
launch**: it is the honest zero from which every future month's re-benchmark measures real
progress, and it is the first proof-of-value artifact the operator sees.

---

## 6. Monthly re-benchmark → fix backlog loop (AUTO, standing)

Once the real baseline is captured (post-launch):

1. **Monthly cadence.** On the same day-of-month as the baseline run, re-score all 8 channels
   with the identical rubric.
2. **Diff against baseline** (and against the prior month once ≥2 data points exist): per-channel
   delta, trend-classification changes, overall org score delta.
3. **Generate a prioritized fix backlog** — each item: channel, gap description, expected score
   lift, effort tier (low/med/high). Prioritize by lift-per-effort, not raw gap size.
4. **Output file:** `turnkey/market/benchmark-<YYYY-MM>.md`, same structure as this file plus a
   "Changes since last month" section and the backlog table.
5. **Feed-forward:** the fix backlog's content items (e.g., "post more on Instagram," "get 3 more
   Google reviews") become inputs to the W8 social strategist brief (see `social/week-1.md` §6)
   so presence gaps and content strategy stay linked.

This loop is retention infrastructure — it is the recurring, dated proof-of-value artifact that
justifies the ongoing relationship, independent of any single social post or outreach batch.

---

## 7. Status

- Rubric: **locked**, matches the standard Engage AI deterministic scoring used elsewhere in VOM's
  work.
- Baseline run: **not executed** — pending live site (`W4_website`) and channel handle
  registration.
- Google Business: profile draft **AUTO-ready**; verification is a **GATE REQUEST** (see final
  report).
- Monthly loop: **designed**, not yet scheduled (first run = the real baseline, once triggerable).
