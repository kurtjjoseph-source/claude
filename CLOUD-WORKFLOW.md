# Cloud Workflow — claude-workspace

This repo is the **single source of truth** for Kurt's Claude workspace. All work —
on a Mac, in a cloud Cowork/Claude Code session, anywhere — syncs through
`github.com/kurtjjoseph/claude-workspace`.

## Why

Cloud session containers are ephemeral: they are reclaimed when a session ends.
Anything not committed and pushed is lost. GitHub is the persistence layer.

## Starting a cloud task (every time)

1. Create a new Cowork / Claude Code task and **attach `claude-workspace` as the
   GitHub source** when creating it. The session clones the repo automatically
   with push credentials.
2. First thing in the session: make sure the checkout is current
   (`git pull` / confirm the latest commit matches GitHub).
3. Work normally.
4. Before ending: **commit and push**. Work is only saved once it's on GitHub.

## Working on the Mac

- One-time: `git clone https://github.com/kurtjjoseph/claude-workspace.git`
- Before working: `git pull`
- After working: `git add -A && git commit -m "..." && git push`

## Rules

- **Never let copies drift.** Pull before working, push when done — on every
  machine, in every session.
- **No secrets in the repo.** Credentials (API keys, tokens, auth JSON files like
  `openverse-auth.json`) live only on the Mac and are covered by `.gitignore`.
  Never commit them; never weaken the ignore rules that exclude them.
- **Generated output stays out.** Build artifacts (`forge/public/`,
  `gallery/public/`, `__pycache__/`, etc.) are regenerated, not versioned.
- **One commit per work session minimum**, with a message saying what changed.

## Account note

The Claude↔GitHub connection authenticates as the GitHub account
**`kurtjjoseph-source`**. That account must remain a collaborator on this repo
(repo → Settings → Collaborators) for cloud sessions to push.

## Repo map

| Folder | What it is |
|---|---|
| `vision-outreach-media/` | VOM client work: cloud APIs, vom-systems, turnkey/forge |
| `churches/` | Church of God Amersfoort projects (incl. housing, streaming) |
| `business-lab/`, `business-profiles/` | Business experiments and profiles |
| `ai-strategy/`, `intent-browsing/` | Research and strategy notes |
| `artifact-hub/`, `artwork-orchestrator/` | Tooling projects |
| `docs/` | General documents |
| `vital/` | Vital project |
| `.claude/` | Agents, skills, and settings shared across sessions |
