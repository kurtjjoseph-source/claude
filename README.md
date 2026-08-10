# Claude Workspace — Kurt John Joseph

Consolidated workspace for all Claude / Cowork projects, migrated from the local Mac
(`kurts-mbp-home`) on 10 August 2026. Clone this repo in any Claude cloud session to
pick up where you left off:

```
git clone https://github.com/kurtjjoseph/claude-workspace.git
```

## Layout

| Folder | What it is | Origin on Mac |
|---|---|---|
| `.claude/` | Custom skills (`onboard-business`, `wizard`) and biz agents — active when a session runs from this repo root | `~/Business Ideas/.claude` |
| `vision-outreach-media/` | All VOM client-business systems: vom-systems (turnkey, hub, gallery, academies…), front-door, house-tour, event-registration, picnic-signup, engage-ai (WP plugins + cloud API), agent-cloud-api, agent-hub-wordpress, plus VOM docs | `~/Business Ideas` + `~/Downloads` |
| `churches/church-of-god-amersfoort/` | Church website + bundle, sermon slide decks, housing seed script | `~/Business Ideas` + `~/Downloads` |
| `churches/gods-generation-church/` | Gods Generation Church materials | `~/Business Ideas` |
| `business-lab/` | Business ideation & playbook projects (SMB Pain Point Seeds, Invoice Accepted, Paid in Full, Digital Membership Club, playbooks by Isenberg/RoboNuggets/Schneider/Bo Sar, …) + loose plans in `docs/` | `~/Business Ideas` + `~/Downloads` |
| `business-profiles/` | Client/business profile folders (Vision Outreach Media, barber amore, gentle) — *josephs store media stayed on the Mac* | `~/Downloads/business profiles` |
| `ai-strategy/` | AI strategy project | `~/Downloads/claude/ai strategy` |
| `artwork-orchestrator/` | Artwork orchestrator scripts (*434 MB `tooling/` dir stayed on the Mac*) | `~/Downloads/claude/artwork-orchestrator` |
| `intent-browsing/` | Intent-browsing project | `~/Business Ideas` |
| `artifact-hub/` | Artifact hub deploy project | `~/Business Ideas` |
| `vital/` | vital. Google Play package (companion repo: [kurtjjoseph/vital](https://github.com/kurtjjoseph/vital)) | `~/Downloads/vital-play-package` |
| `docs/` | Cross-project notes | — |

## Related repos (already on GitHub, not duplicated here)

- [kurtjjoseph/church-housing-amersfoort](https://github.com/kurtjjoseph/church-housing-amersfoort) — housing wizard app (had 4 uncommitted local changes at migration time)
- [kurtjjoseph/vital](https://github.com/kurtjjoseph/vital) — total health app (clean at migration time)

## Deliberately left on the Mac (not in this repo)

- **Secrets** — removed before the first commit and gitignored: `engage-ai-cloud-api/.env`
  (contains an Anthropic API key), `agent-cloud-api/.env`, `turnkey/client-hub/.env.local`
  (Brevo key, provision token, Redis URL), two Vercel `.env.local` OIDC tokens, plus
  `~/Downloads/keys.rtf`, `client-hub*.env`, and a Google `client_secret*.json`.
  `.env.example` files are kept — recreate real `.env` files from a secret manager.
- **Local SQLite databases** — `engage_ai.db`, `agent.db`.
- **Heavy media** — `~/Downloads/canva` (~875 MB), `business profiles/josephs store`
  (~208 MB product photos/video), church media folders (`aankondigingen`,
  `kinderevangelisatie`, `cog ordained`), `vom-systems/turnkey/forge/demos`
  (~508 MB generated demo sites — rebuild with `turnkey/forge/build.py`),
  `artwork-orchestrator/tooling` (~434 MB).
- **Installers, zips, voice memos, personal documents.**

## Migration notes

- Embedded `.git` folders (13 local-only checkpoint histories, no remotes) were stripped
  from this copy; the originals on the Mac keep their history.
- `.vercel/` project-link folders were stripped; `vercel.json` configs are kept.
- Original folders on the Mac were left untouched.
