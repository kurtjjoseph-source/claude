# Artifact Hub — Daily Auto-Update Runbook

This runbook is executed by a scheduled task each day. Goal: find any newly
published artifacts, add them to the hub, and redeploy to Vercel. The public
site is https://artifact-hub-nu.vercel.app (Vercel project `artifact-hub`).

Project folder: `/Users/kurtjoseph/Business Ideas/artifact-hub`
Data file: `artifacts.json` (array of `{t, cat, date, d, u}`)

## Steps

1. **List current published artifacts.** Use the Artifact tool:
   `action: "list"`, `scope: "mine"`, `limit: 50`. Each row gives title, URL, and
   last-updated date.

2. **Read** `/Users/kurtjoseph/Business Ideas/artifact-hub/artifacts.json`.

3. **Diff by URL.** For every listed artifact whose `https://claude.ai/code/artifact/<id>`
   URL is **not already present** in `artifacts.json`, prepare a new entry.
   **EXCLUDE gated/paid artifacts:** first read `exclude.json`; skip any artifact whose
   URL appears in its `exclude` array — these are sold, not free, and must never be
   re-added to the public menu.
   (Match on the URL / artifact id, not the title — titles can change.)

4. **For each new artifact, build an entry:**
   - `t`  — a clean display title (trim any trailing " — Visual Overview" style
     suffixes only if redundant; otherwise keep the real title).
   - `u`  — the full `https://claude.ai/code/artifact/<id>` URL.
   - `date` — the listed last-updated date, as `YYYY-MM-DD`.
   - `cat` — choose ONE category id from the fixed set below by matching the
     title/subject. If nothing fits, use `"tools"`.
   - `d`  — one plain-English sentence (max ~22 words) describing what it is,
     inferred from the title. No hype, no first person.

   **Category ids (do not invent new ones — the site only styles these):**
   - `money`  — Money & Sales (revenue, offers, sales, $100K, pricing)
   - `vom`    — VOM & Onboarding (Vision Outreach Media, launches, onboarding, compliance, presence, channels)
   - `church` — Church Media (church, ministry, media academy, congregation)
   - `guides` — Guides & Learning (study guides, courses, how-to, explainers)
   - `tools`  — Tools & Wizards (wizards, calculators, dashboards, generators, previews) — the default
   - `health` — Health (wellness, recovery, body, medical)

5. **Update the file.** Append the new entries to the JSON array. Keep it valid
   JSON (2-space indent, no trailing commas). Do not remove or reorder existing
   entries. If there are NO new artifacts, stop here — do not redeploy.

6. **Redeploy** (only if the file changed):
   ```
   cd "/Users/kurtjoseph/Business Ideas/artifact-hub" && vercel deploy --prod --yes
   ```

7. **Verify:** `curl -s -o /dev/null -w "%{http_code}" https://artifact-hub-nu.vercel.app/artifacts.json`
   should return `200`, and the item count should equal the number of entries in
   the file. Report which artifacts were added (or "none — hub already current").

## Guardrails
- Never delete existing entries or the data file.
- Never change category ids outside the fixed set above.
- Only deploy when `artifacts.json` actually gained entries.
- If the Artifact list returns fewer items than the file already has, do NOT
  prune — just report the discrepancy and skip the deploy.
