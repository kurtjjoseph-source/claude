# claude-workspace — session instructions

This repo is the single source of truth for Kurt's consolidated Claude workspace.
Full workflow: see `CLOUD-WORKFLOW.md`.

Standard procedure for every session working in this repo:

1. **Start:** verify the checkout is current with the remote (`git fetch` +
   compare, or `git pull`) before making changes.
2. **End:** commit all meaningful changes with a clear message and **push to
   `main`**. Cloud containers are ephemeral — unpushed work is lost.
3. **Never commit secrets** (API keys, tokens, `*-auth.json`). Respect existing
   `.gitignore` rules; don't weaken them. Generated output (`forge/public/`,
   `gallery/public/`, `__pycache__/`) stays untracked.
4. If a push fails because the repo isn't in the session's authorized sources,
   don't try token workarounds — tell Kurt to start the task with the
   `claude-workspace` GitHub source attached, and hand him a git bundle as
   fallback.
