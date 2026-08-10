# Verified Findings — Logged-In Research, 2026-07-14

Ground-truth verification of every open question in the sprint docs, performed in Kurt's own browser (logged into all platforms). **This document supersedes the statuses in 02-social-profile-audit.md** and clears several gates in 00/03. Where this doc and an earlier doc disagree, this doc wins.

## Summary table

| Channel | Verified status | Canonical public URL | What's actually wrong |
|---|---|---|---|
| Website | **INDEXED** (audit was stale/wrong) | https://www.visionoutreachmedia.nl | Nothing blocking — `site:` query returns 3+ pages of results, privacy page indexed 3 days ago. Search Console likely not set up (Google showed the "Do you own this site?" promo) |
| Google Business | **VERIFIED, live public listing** | https://maps.google.com/maps?cid=8518067082791267693 | Engage AI still stores the private admin URL; category is "Software company" (recommend "Website designer" or "Marketing agency"); profile strength incomplete |
| Instagram | **EXISTS, public, owned** | https://www.instagram.com/visionoutreachmedia | Completely empty: 0 posts, 0 followers, no bio/website link |
| Facebook | **EXISTS, public, owned (admin)** | https://www.facebook.com/visionoutreachmedia | 0 followers, wrong category ("E-commercewebsite"), no website link visible, last post Oct 2023 |
| X/Twitter | **EXISTS, owned — handle IS @visionomedia** | https://x.com/visionomedia | Brand new (joined July 2026), 0 posts. The audit's "wrong handle" suspicion was incorrect; renaming to @visionoutreachmedia is now an *optional* branding step, not a blocker |
| YouTube | **EXISTS, public** | https://www.youtube.com/@visionoutreachmedia9417 | 37 videos but 2 subscribers; Dutch-only description; handle rename to @visionoutreachmedia is *optional* |
| LinkedIn | **EXISTS, owned — ID 136115225 was CORRECT** | https://www.linkedin.com/company/vision-outreach-media | The audit's NOT-FOUND was wrong (anonymous block + empty page). Page has NO description, NO location, 0 followers, 0 posts — that's why it's invisible. **The "create a page" blocking gate is CLEARED**; the gate is now "add description + location + first post" |

## Key corrections to earlier docs

1. **02-social-profile-audit.md**: all five channels exist and are owned. LinkedIn NOT-FOUND → false negative. X handle ambiguity → resolved: @visionomedia is the real, owned account; the website's claimed @visionoutreachmedia link should be corrected to point at @visionomedia (or the account renamed — owner's choice).
2. **00-master-runbook.md Step 1**: no account creation needed anywhere. The work is *content*, not existence: fill the empty profiles (bio + website link + first posts).
3. **00-master-runbook.md Step 2 / 04-google-business-runbook.md**: verification already done (skip 04's Step 1 verification flow). Remaining: category fix, profile completion (use the drafted NL description), and swapping the Engage AI settings URL to the public Maps URL above.
4. **00-master-runbook.md Step 3 / 01-website-indexing-runbook.md**: the site is already being indexed organically — the urgent part of 01 drops to: set up Search Console (for visibility/monitoring + faster future crawls) and Bing/IndexNow. The "zero index" premise is no longer true.
5. **03-organization-schema.md**: verification checklist satisfied for existence; `sameAs` must use the URLs in the table above (current, real URLs — not the aspirational renamed handles). If handles are renamed later, update `sameAs` then.

## Action status (updated 2026-07-14 after assisted execution)

Done (executed via Kurt's browser/API with his approval):
- [x] Engage AI org settings: all 7 channel URLs replaced with verified public URLs via `PATCH /organizations/1` (google_business now the public Maps CID URL)
- [x] Google Business: category changed to **Web Designer (primary) + Marketing agency**, description replaced with the drafted NL text — both pending Google's ~10-minute review
- [x] LinkedIn: EN description added (683 chars), location added (Amersfoort, NL — Headquarters/Primary); website URL was already set
- [x] Facebook: category changed from "E-commercewebsite" to **Webdesigner · Marketingbureau**, website link added under Links

Still Kurt's (content creation / remaining setup):
- [ ] LinkedIn: publish first post
- [ ] Instagram: add bio + link to visionoutreachmedia.nl, publish 3+ posts
- [ ] Facebook: publish a fresh post (last one is Oct 2023)
- [ ] X (@visionomedia): add bio link, publish first posts; optionally rename to @visionoutreachmedia
- [ ] YouTube (@visionoutreachmedia9417): add EN description + website link; optionally rename handle
- [ ] Search Console: add property (Rank Math integration per 01), submit sitemap_index.xml
- [ ] Website: fix footer/social links so the X link points at the real handle (@visionomedia); add schema per 03 (verified URLs)
- [ ] After 1–2 weeks: re-run Engage AI scan
