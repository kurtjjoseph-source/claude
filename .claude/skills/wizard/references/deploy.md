# Phase 5 — deploy, report, record

## The command

```bash
cd "/Users/kurtjoseph/Business Ideas/vom-systems" && ./deploy-wizard.sh "../<Folder Name>/wizard.html" <slug> vom-<slug>.vercel.app "<light-hex>" "<dark-hex>" "<one-line description>"
```

`deploy-wizard.sh` does four things in one pass:

1. wraps the artifact fragment into a real HTML document (`<!doctype>`, viewport, description,
   `color-scheme`, both `theme-color` metas, a generated favicon) into `<Folder>/<slug>/index.html`
2. `vercel deploy --prod --yes` from that directory
3. `vercel project protection disable --sso` — new Vercel projects default to SSO, which serves a
   302 login wall. Every VOM site is public.
4. `vercel alias set` then `curl` the alias and print the status code

Conventions: team scope `kurtjjoseph-6989s-projects`, alias always `vom-<slug>.vercel.app`, the two
hexes are the wizard's light and dark `--paper` values so the browser chrome matches the page.

## It is not done until HTTP 200

The script's last line is the verdict:

```
  ✓ audit-machine  ->  https://vom-audit-machine.vercel.app  (HTTP 200)
```

| code | cause | fix |
|---|---|---|
| 401 / 302 | SSO protection still on | `vercel project protection disable --sso` in `<Folder>/<slug>`, then re-alias |
| 404 | alias set before the deployment finished | re-run `vercel alias set <deployment-url> vom-<slug>.vercel.app` |
| no URL printed | `vercel` not authenticated or wrong scope | `vercel whoami`; deploy manually from `<Folder>/<slug>` and alias by hand |

Then open the live URL in the Browser pane and screenshot it. A 200 proves the file is served; the
screenshot proves it is the right file.

**Why never an artifact:** artifacts render in a sandboxed iframe, which silently blocks file
downloads — the "Download plan.md" button appears broken. The wizard's whole payoff is that
download. Vercel also gives a stable shareable link that matches how the rest of the house ships.

## Report

Live links, in this order:

1. **the wizard** — `https://vom-<slug>.vercel.app`
2. `[summary.md](<Folder Name>/summary.md)` · `[transcript.md](<Folder Name>/transcript.md)` ·
   `[wizard.html](<Folder Name>/wizard.html)`
3. two or three lines on what the wizard makes the reader decide, and what the calculators check

Vision Outreach Media (VOM) or "the operator" — never a personal name.

## Record it

Update the `business-ideas-folder` memory
(`/Users/kurtjoseph/.claude/projects/-Users-kurtjoseph-Business-Ideas/memory/business-ideas-folder.md`)
— the "Playbook entries" paragraph. One sentence: folder name, source URL and duration, the
mechanism in a clause, then the wizard's name, live URL, step count and what its calculators do.
Edit that paragraph; do not add a new memory file.
