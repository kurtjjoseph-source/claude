# turnkey engine

The deterministic core the `/onboard-business` orchestrator drives. Prose can describe the
governance rails; this engine **enforces** them. Python 3 stdlib only — no pip, no network.

```
python3 turnkey.py wizard          # the guided way — clicks, no flags
python3 turnkey.py <command> "<idea-folder>" [flags]
```

## Start here: the wizard

Every command below is a place to mistype a path or forget a flag, and one wrong
`--decision` mis-records a gate. So the normal way to run a launch is **not** to type
these at all:

```bash
python3 turnkey.py wizard
```

That starts a local server (127.0.0.1 only, one-time token, `Ctrl-C` to stop) and opens a
guided UI: pick or create an idea folder, write the profile, record the terms, confirm the
org type and the WordPress-or-app decision, work each gate, advance stage by stage. It
**shells out to this same engine for every state change**, so the gate enforcement, the
consent chain and the blueprint refusals apply exactly as they do here — when the engine
refuses, the wizard shows you the refusal and offers the step that fixes it.

The commands below remain the substrate: scriptable, auditable, and what the orchestrator
skill drives when an agent is running the pipeline.

## Why it exists

`SKILL.md` is instructions the model follows. Three things must not depend on the model
remembering to be careful:

1. **Persistent state** — `<idea-folder>/turnkey/launch-state.json`, updated atomically
   (temp-file + `os.replace`), so a launch survives a crash and resumes from the frontier.
2. **Append-only consent log** — `<idea-folder>/turnkey/consent-log.jsonl`, one hash-chained
   line per side-effecting decision. Each line carries `prev_hash` + `hash`; `verify` recomputes
   the chain, so any edit to a past line is detectable.
3. **Gate enforcement** — `set --status done` on a workstream that publishes, sends, or moves
   money (`intake`, `W4_website`, `W5_payments`, `W6_products`, `W8_social`, `W9_leads`,
   `W11_followups`) is **refused (exit 3)** unless a matching `YES` already exists in the consent
   log. No injected "already approved" text can move the pipeline past a gate — only a real,
   logged, pre-action YES can.
4. **Blueprint enforcement** — a launch must know *what it is building* before it builds. The
   business functions and the site-platform decision come from `blueprints.py` (below); without a
   saved blueprint, `advance foundation → build` and `set --status done` on `W4_website`,
   `W5_payments`, `W6_products` or `W10_crm` are **refused (exit 3)**.

Subagents never call the engine. Only the orchestrator touches state and consent.

## Commands

| Command | Purpose |
|---|---|
| `init` | Scaffold `turnkey/`, seed `launch-state.json` + the gate matrix. Auto-stamps the operating profile if `business-operating-profile.json` exists + is valid. Idempotent (resumes). |
| `status [--json]` | Print the frontier — stage, per-workstream status, next actions. Shows operating profile (stack, org_type, ops_model, payments.stripe, any platform divergence). |
| `profile "<idea-folder>"` | Load + validate `business-operating-profile.json`; stamp it into `launch-state.json`. Configures the run (payments → W5 status, ops_model → W6 note). Exit 3 on invalid file. Idempotent. |
| `set --workstream W --status S [...]` | Update a workstream. Enforces the gate guard. Accepts status `not_applicable` (non-blocking, profile-configured out). |
| `gate --workstream W --actor VOM\|CLIENT --action "..." [--script-file ...]` | Open a human gate. |
| `consent --workstream W --action "..." --actor ... --channel ... --decision YES\|NO [...]` | Append a hash-chained consent line (before the action). |
| `verify` | Recompute the consent hash-chain (tamper check). |
| `log` | Print the consent log. |
| `dispatch --workstream W --tier haiku\|sonnet\|opus [--escalated]` | Record a subagent dispatch (§5 audit). |
| `blueprint [--org-type T] [--add k,k] [--remove k,k] [--save] [--json]` | Decide **what to build**: org type → business functions + WordPress-or-app. The operating profile's `stack` overrides the blueprint's recommendation (logged as divergence). Preview without `--save`; refuses to save a low-confidence guess. |
| `orgtypes [--json]` | The catalog — what each org type gets built (no idea folder needed). |
| `functions [--add k] [--remove k]` | List or override this launch's function set (cumulative, logged). |
| `platform [--value wordpress\|vercel_app\|hybrid --reason "..."]` | Read or override the site-platform decision. |
| `matrix [--key K [--value V]]` | Read/set the platform-bootstrap gate matrix. |
| `operator [--json] [--refresh]` | Show the operator identity this run is branded under (white-label); `--json` emits identity + brand + platform for agent briefs. |
| `rebrand <path> [--from-profile P]` | White-label: scaffold a fresh operator profile for a new franchisee. |
| `advance [--force]` | Move to the next stage if criteria hold (`--force` logs an override). Treats `not_applicable` workstreams as done for advance criteria. |
| `check` | Definition-of-done audit (§8). Accepts `not_applicable` as complete. |
| `archetypes [--json]` | The platform archetypes — what CHURCHforge and BIZforge each build (no idea folder needed). |
| `brand ["<idea>"] [--kit ID] [--list]` | The **brand kit** this business is built in. `--list` prints the predesigned library; `--kit` writes `brand-kit.json` (what the compiler reads), `brand-kit.md` and `brand-manual.html` (the printable huisstijlhandboek). Omit it and the archetype's default kit applies — the step is a choice, never a blocker. |
| `spec "<idea>" [--target local\|hub\|vercel] [--archetype A] [--save] [--json] [--strict]` | Compile the blueprint into the **automatable platform blueprint** (`platform-spec.json`, schema `apb/1`) that Forge executes. `--authorize-unattended --actor VOM` logs the single prior YES that lets a run publish. |
| `forge ["<idea>"] [--new NAME --org-type T] [--target ...] [--watch] [--dry-run] [--resume]` | **BUILD AND DEPLOY**, unattended, with visual stage cues. `--new` creates the folder, blueprint, spec and build in one command. |
| `forge-console "<idea>" [--run-dir D]` | Open the visual console for a finished run — the same cues, after the fact. |
| `factory [ideas-folder]` | **THE PLATFORM FACTORY** — six milestones, each leaving a real artifact: `business-idea.md` → a deployed funnel → `business-profile.md` → `brand-kit.md` → `provisioning.md` → the built platform. `--port`, `--no-open`. |
| `wizard [ideas-folder]` | **The guided front end** — local server + clickable launch flow. `--port`, `--no-open`. |
| `selftest` | Run a full cycle in a temp dir; assert every invariant. Run this after any edit. |

Exit codes: `0` ok · `2` usage · `3` guard/enforcement refusal · `4` integrity failure.

## Workstream registry

The stages, dependencies, and which workstreams are consent-gated live in `REGISTRY` at the top
of `turnkey.py` — the single place to change the pipeline shape. `requires_consent: True` is the
flag that arms the gate guard for that workstream.

## Workstream status vocabulary

Standard statuses: `not_started` · `in_progress` · `gate_pending` · `blocked` · `done` ·
**`not_applicable`**. The profile-driven status: a workstream is `not_applicable` (non-blocking,
dropped from advance criteria) when the operating profile has configured it out of the run — e.g.,
`payments.stripe: false` → `W5_payments: not_applicable`. Set during `init` (auto-stamped) or
`profile` (explicit). Moving a `not_applicable` workstream back to `not_started` undoes the
configuration (if the profile changes).

## The operating profile (`business-operating-profile.json`)

The Business Operating Profile is the wizard-authored JSON that **drives** a launch run. It lives
in `<idea-folder>/business-operating-profile.json` (not in `turnkey/`, since it's emitted before
`init` runs). Shape (all required):

- **business**, **tagline**: display strings for the operator's records.
- **org_type**: from the ten org types (church, nonprofit, service_business, …); must match the later blueprint decision.
- **stack**: code-first choice {`wordpress` | `app` | `ecom` | `static`}. Mapped onto blueprints.py's vocabulary (`wordpress`, `vercel_app`, `hybrid`) and *overrides* the blueprint's own org-type recommendation if they diverge (logged as `profile_platform_override`).
- **domain**: {`mode`, `value`} for the DNS (e.g., `mode: "subdomain"`, `value: "acme"`).
- **pages**, **payments**, **features**, **publications**, **operations_model**, **client_hub**: payload for later stages. `payments.stripe: false` → `W5_payments` auto-configured to `not_applicable`. `operations_model: "hub"|"hybrid"` → W6 receives a client-hub deliverable flag + `client_hub` items listed.

Use `turnkey profile "<idea>"` to explicitly load and stamp it (idempotent); `init` auto-stamps if present and valid. An invalid profile halts `profile` (exit 3) but does not halt `init` (prints a warning).

## The blueprint model (`blueprints.py`)

A second stdlib-only module, imported by `turnkey.py`, that answers two questions before Build
runs — deterministically, so the same profile always yields the same build order:

- **Which business functions does this org type need?** ~23 functions (CRM, finance & admin,
  product catalog, checkout, donations, subscriptions, membership access, courses/LMS, digital
  fulfilment, stock & shipping, booking, events, media library, content publishing, lead capture,
  email, social, analytics, support inbox, quotes & contracts, people/rosters, donor reporting,
  the product application itself), tiered `core` / `recommended` / `optional` per org type and
  **mapped to the workstream that must deliver each one**. Ten org types: `church · nonprofit ·
  service_business · ecommerce · digital_products · membership · education · local_venue · saas ·
  creator_media`.
- **WordPress, a custom app, or hybrid?** Scored from the org type's lean, the selected functions
  (`wp_fit` strong/neutral/weak — only platform-differentiating functions vote), signals in the
  profile text, and the operator's own rails (`platform.cms_default`,
  `platform.wordpress_capability` in `operator.json`). Every point of the score carries a written
  reason, plus the conditions that should make you revisit the decision.

Classification discounts keywords found where the profile describes **who it sells to** — a
consultancy that serves churches is a consultancy, not a church. Low confidence is a refusal to
save, not a silent guess: the operator passes `--org-type`.

Browse the whole model with `python3 turnkey.py orgtypes` (or `python3 blueprints.py --catalog`).

## Forge — the automatable blueprint, and the runner that executes it

`blueprint.md` is written for a person: it argues, it explains, it says *revisit this if they
hire staff*. That is the right shape for a decision record and the wrong shape for a machine.
A builder that has to interpret prose is a builder that needs someone standing next to it.

So there are two artifacts, and only one of them is consulted during a build:

| File | For | Contains |
|---|---|---|
| `turnkey/blueprint.md` | a person | the reasoning: org type, functions, WordPress-or-app, and why |
| `turnkey/platform-spec.json` | the builder | schema `apb/1` — modules, pages, copy, seed records, rails, deploy target, stage plan, checks, authorization, fingerprint |
| `turnkey/brand-kit.json` | the builder | the chosen kit: the five published colours, the type pairing, and both complete token sets the renderers compile from |
| *(in the build)* `brand-manual.html` | the owner | the printable manual, written into every build alongside the site |
| `turnkey/brand-kit.md` + `brand-manual.html` | a person, and a printer | the same kit as a manual — palette with HEX/RGB/CMYK, type specimens, voice, usage rules, measured contrast |

`turnkey spec` compiles the machine artifact from the first, folding in the brand kit. `turnkey forge` executes it end to end —
composing the modules, writing the site, wiring the rails, checking its own work, deploying,
and fetching the result to prove it is serving — with nobody in the loop.

```bash
python3 turnkey.py forge --new "Bethel Chapel" --org-type church \
    --city Amersfoort --about "A church that gathers every Sunday." \
    --target local --watch
```

### Archetypes

An archetype is **not** a bespoke platform. There is one general, module-based platform
engine (`platform_gen.MODULES` + `site_gen`'s section vocabulary), and an archetype is a
*composition* over it: a module set, a set of pages, a content pack, a type preset and a
forge identity. Every forge runs the same builder and the same renderer — so an archetype
is a data change in `archetypes.py`, never a code change, and a platform can be named,
composed and launched in minutes.

All ten org types are written. `prelaunch` is an eleventh archetype but a *phase*, not a
kind of business: pass `--archetype prelaunch` in front of any org type to test the idea
before building the thing.

| Forge | Org type | Always builds | Never builds |
|---|---|---|---|
| **CHURCHforge** (orange) | `church` | giving, events, sermons, serving rota, messages, content | product catalog, stock, courses |
| **BIZforge** (sky blue) | `service_business`, `creator_media` | pipeline, bookings, quotes, invoices, enquiries, inbox | giving, donor reporting, rosters, stock |
| **NONPROFITforge** (emerald) | `nonprofit` | giving, the annual account, volunteers, events, list, inbox | catalog, stock, courses, booking |
| **SHOPforge** (rose) | `ecommerce` | catalog, orders, stock, customers, list, inbox, content | giving, donor reporting, rosters, courses |
| **DIGITALforge** (violet) | `digital_products` | products, sales, list, content, inbox | stock, rosters, giving, booking |
| **MEMBERforge** (amber) | `membership` | members, subscriptions, member posts, events, inbox | stock, giving, donor reporting, rosters |
| **LEARNforge** (teal) | `education` | courses, students, enrolments, content, inbox | stock, giving, donor reporting, catalog |
| **VENUEforge** (fuchsia) | `local_venue` | diary, what's on, gallery, regulars, enquiries, invoices | giving, donor reporting, courses, stock |
| **SAASforge** (indigo) | `saas` | accounts, subscriptions, pipeline, trials, support, invoices | giving, stock, rosters, booking, catalog |
| **PRELAUNCHforge** (green) | *a phase* | waitlist, people, announcements | everything else |
| **FORGE** (fallback) | an org type nobody has written yet | whatever the blueprint selected | — |

The fallback is honest, not a stub: it produces a working platform and a plain site, and
reports `curated: false` so nobody mistakes it for a tailored one.

### One system, ten voices

Ten platforms built by one renderer will look like ten copies of one platform unless
something differentiates them, and a church rendered in a startup's typography is a church
that looks borrowed. So an archetype also picks a **type preset** — `editorial` (serif),
`grotesk` (tight sans), `humanist` (warm sans) or `gallery` (spaced capitals over a
high-contrast serif) — from a fixed table in `site_gen`. It changes the display face, its
weight, tracking, scale and the case of the eyebrows.

That is still data, not a code path, and no webfont is fetched or embedded: a face that
arrives over the wire can fail to arrive, and a 200 KB data URI on every page of every
site is a large cost for a small difference.

### The second skin

A type preset changes the voice. It does not change the *machine*, and one archetype is
judged on exactly that: a software company's buyers decide whether the product is alive by
whether the site is. A restrained page for a developer tool reads as "made by someone who
does not build software".

So `saas` sets `skin: "hitech"` and renders through `skin_hitech.py` instead — a second
renderer over the **same** section vocabulary. Same spec in, same filenames out; every
`facts`, `cards`, `steps`, `faq`, `prose`, `feed`, `form`, `pay`, `pricing` and `cta`
still renders. What it adds: a canvas lattice that answers the pointer, **five colour
schemes** switchable live and remembered between visits, a product panel that updates
itself in the hero, kinetic type, a bento grid where each cell has its own micro-motion,
a sticky scroll showcase, counters that count on view, and a build log that types itself.

Nothing in it is load-bearing. `prefers-reduced-motion` draws one static frame and prints
final values; with JavaScript off every section is already in the HTML, because the
animation only ever enhances content that is present. Still self-contained — no CDN, no
webfont, one file.

Adding a third skin is a renderer plus one line of dispatch; asking for a skin that has no
renderer is a refusal, not a silent fallback.

The ground, the ink scale and the accent slot all come from **VOM Kit v2**
(`brand/kit/vom-kit.css`, published to Claude Design), which is why every generated site
reads as a member of one family without looking like Vision Outreach Media's own pages.
The kit carries both values for each forge — the bright one its console runs on black, and
the darkened sibling a client's site uses on warm paper, where the bright value fails
contrast. The kit's *Forge sites* cards are generated from `site_gen` itself
(`brand/kit/site_cards.py`), so the design system cannot drift from what actually ships.

### What keeps an unattended build honest

1. **It will not run an unready spec.** `readiness.ready` is false while any structural
   decision is unresolved — a guessed org type, an unknown target, a page that would ship a
   literal `{business}`. Forge refuses before writing a file.
2. **It will not publish without a prior YES.** Turnkey's rule does not bend for automation;
   only its granularity changes. One scoped authorization, logged on the same hash-chained
   consent log *before* the run, covers the whole run — `spec --authorize-unattended --actor
   VOM`. Without it, every target the public can reach is refused and the build stays local.
3. **It reports what happened.** A deploy with no credentials is a failed stage with the
   reason attached. The `smoke` stage fetches the real URL and requires the business's own
   home page back — "deployed" is a measurement, not a claim. A stable address is only
   published if it answers; a guessed one is dropped.
4. **It never holds a credential.** Rails without keys are built and labelled in the
   interface, and start working when the operator supplies the keys.
5. **It is reproducible.** The spec carries a fingerprint of its own contents; the build
   records the fingerprint it built. An edited spec fails before it runs.

### The visual stage cues

Every run streams eleven stages to `forge/<run>/events.jsonl`, and two surfaces render them:
a terminal rail (colour on a TTY, plain when piped) and a browser console — `--watch` serves
it live on localhost for the length of the run, `forge-console` replays a finished run as a
standalone file with the run baked in. The console takes its colours from the archetype's
forge, so an operator always knows which kind of platform is being made.

Artifacts of a run live in `<idea>/forge/<run-id>/`: `run.json`, `events.jsonl`,
`receipt.json`, `console.html`, and `build/` (the site at the root, the platform at
`/platform`).

### The whole showcase, in one command

```bash
python3 ../../forge/build.py --deploy      # every archetype, built and published
```

`forge/build.py` holds one demo business per archetype and runs each through Forge for
real — the pages on [vom-forge.vercel.app](https://vom-forge.vercel.app) are that output,
published verbatim, next to the console that recorded the build. `--deploy` sends each
demo to its own production project and then the surface; without it everything builds
locally. `--only church,saas` rebuilds a subset and reassembles the index from the copies
already published, and `--surface-only --deploy` republishes just the showcase. A demo
that fails does not take the others down: it is reported and the command exits non-zero at
the end with the list.

Deploying a demo is a publish, so it carries the same authorization every public run
carries — one scoped YES on the hash-chained consent log, before the run. The runner
passes it explicitly rather than inheriting a standing exemption.

## The factory — artifacts, not checkboxes

```bash
python3 turnkey.py factory
```

A milestone here is **a file on disk or a URL that answers**, never a ticked box. Progress is
computed by asking the filesystem what exists, so it survives a restart, a crash, or someone
doing a step on the command line instead.

| # | Milestone | Leaves behind | Read by |
|---|---|---|---|
| 1 | The idea | `business-idea.md` | the profile, the blueprint, the spec |
| 2 | Prelaunch *(optional)* | a **deployed** funnel (its own Vercel project) + `prelaunch/signal.json` — or `turnkey/prelaunch-waived.md` | the profile's evidence section |
| 3 | The profile | `turnkey/business-profile.md` | the spec compiler, for every page of copy |
| 4 | Provisioning | `blueprint.md` · `platform-spec.json` · `provisioning.md` | Forge |
| 5 | The platform | the built site + operating platform | the owner |
| — | Bundle | `bundle.zip` of all of it | whoever receives the business |

Two things this fixes that a wizard does not:

- **The funnel is deployed, not downloaded.** Step 2 runs Forge against the `prelaunch`
  archetype and returns a live URL — the page the 100 no's are pointed at. It deploys to
  `<slug>-prelaunch`, a *separate* project from the platform, so building the platform later
  never overwrites the funnel that is still collecting names.
- **The funnel is optional, and skipping it is also a file.** A waitlist earns the right to
  build something nobody has asked for yet — but a church has a congregation and a service
  business has a phone that rings, and forcing those through a funnel teaches operators to
  fake the one artifact that is supposed to be evidence. So step 2 offers both paths.
  Skipping writes `turnkey/prelaunch-waived.md` (dated, with the reason), which settles the
  milestone the same way every other milestone is settled — by something on disk. The
  profile then says *no waitlist was run, and why*, the waiver travels in `bundle.zip`, and
  running the funnel later removes it. Each archetype advises (`prelaunch: recommended` for
  a course, a membership, a shop or a SaaS; `optional` for a church, a service business, a
  nonprofit or a venue) and `autorun` follows that advice unless the caller passes
  `prelaunch: "run" | "skip"`. Advice, never a gate.
- **`provisioning.md` is generated, not written.** Hostname, DNS, hosting project, TLS and
  every rail with its exact environment variables — each marked `AUTO` / `VOM` / `CLIENT`, and
  a closing section naming precisely what still blocks an unattended build.

### The directory of launched sites

The factory builds one business at a time and then forgets it: every address it published
lived in a `run.json` nobody opens. The **Launched sites** tab in the same console is the
other half — every business under the ideas root, found by walking the tree for the files
only a business has, with the addresses read out of the run that actually published.

- **Live links.** The site (its stable alias, not the one-off deployment URL), the platform
  at `/platform/`, the prelaunch funnel, that build's own console log, and `bundle.zip`.
- **The last *published* run, not the last run.** Rebuilding a deployed site locally makes
  the newest run a local one; reading only `latest.json` would report a site that is serving
  right now as never launched. The runs are walked newest-first until one is found that
  published, and when the build on disk is newer than that, the card says so.
- **Local builds are browsable.** A page served over http cannot follow a `file://` link, so
  a local build is served under `/b/<token>/<business>/…` — a path prefix rather than a query
  parameter, because the build's nav is relative links and they have to resolve.
- **Admin options.** Continue in the factory (it loads that business into the pipeline, even
  one nested several folders down), check it is live, rebuild, publish to Vercel. *Check it
  is live* fetches each address the way Forge's smoke stage does and reports what came back —
  including the case that answers 200 with somebody else's page. *Check every live address*
  does all of them at once.

Verified against the real tree: 14 businesses found, 11 live addresses, all 11 confirmed
serving from the console; local site and platform previews serve with their navigation
intact; a rebuild from a card wrote a new run and the card updated to it.

### Renaming a business, and taking one down (`lifecycle.py`)

The factory was very good at bringing a business into existence and had nothing to say
about the two things that happen next: it turns out to be called something else, or it
should never have existed. Both were done by hand, and both left half-updated files and
live sites nobody remembered deploying.

Every card in **Launched sites** now carries *Rename or clean up…*, which opens a panel on
that card. Same operations on the command line, so none of it needs a browser:

```bash
python3 lifecycle.py --root ~/"Business Ideas" inventory "Ferry Coffee" --probe
python3 lifecycle.py --root ~/"Business Ideas" rename "Ferry Coffee" "Harbour Roasters" --confirm "Ferry Coffee"
python3 lifecycle.py --root ~/"Business Ideas" delete-sites "Harbour Roasters" ferry-coffee --confirm "Harbour Roasters"
python3 lifecycle.py --root ~/"Business Ideas" prune "Harbour Roasters" --keep 2
python3 lifecycle.py --root ~/"Business Ideas" archive "Harbour Roasters" --confirm "Harbour Roasters"
python3 lifecycle.py --root ~/"Business Ideas" trash
```

**Deep rename** moves the folder, the answers, `business-idea.md`, the launch state, every
generated document, and the absolute paths recorded inside past Forge runs — then
*recompiles* the blueprint, spec and `provisioning.md` rather than editing them, because
the slug, the hosting project name and the spec fingerprint are all derived from the name
and a search-and-replace would leave a spec that no longer hashes to itself. If the
recompile fails, it says so and shows the error: renamed everywhere a person reads and
nowhere the builder reads is the one outcome worth being loud about.

Three things it deliberately does **not** rewrite:

- **`consent-log.jsonl`.** It is hash-chained and append-only; editing a past line to say a
  new name is exactly the tampering the chain exists to detect. The chain's genesis anchor
  *was* derived from the folder name, which made a rename look identical to tampering — so
  the anchor is now pinned into `launch-state.json` as `consent_genesis` before the folder
  moves, and `turnkey.py`'s verifier reads it from there. Chains written before this
  existed still verify unchanged.
- **The business name inside past `run.json` records.** A run happened, under that name, at
  that time. Only the paths are repointed, because the folder genuinely moved.
- **A deployed URL in `prelaunch/signal.json`.** That address is still live and still
  collecting; it is a fact, not a label.

**The live address is a separate decision.** A rename cannot move a deployment by itself,
so by default the old projects are recorded as `orphans` on the launch state and keep
serving — the safe answer, not the tidy one. Ticking *move the live addresses too* renames
the hosting projects as well, which changes a **published address**: `old.vercel.app` stops
answering for everybody holding it, so it is confirmed separately and logged to the consent
chain with the same weight the deploy had.

**Cleanup** reads those orphans and takes sites down (confirmed by typing the name, logged
to the consent chain), prunes old Forge run directories (every run keeps a whole copy of
the site — this is where a business's disk actually goes), and archives a business into
`.factory-trash/`, which the console does not list and which is one *Restore* away.
`purge` is the only hard delete in the whole system, it can only ever reach the trash, and
it refuses while the archived business still has a site serving.

> The `vercel` CLI's `project remove` prompts, has no `--yes`, ignores `--non-interactive`
> — and on EOF answers **no** and exits **0**. Trusting that exit code meant reporting an
> address as taken down while it was still serving. So the confirmation is supplied on
> stdin and the outcome is read back from the host with `project inspect`, never from the
> exit code.

Verified: the disk-side rename end to end (chain intact, `turnkey check` clean, spec
recompiled to the new slug, run paths repointed, orphans recorded); every refusal path;
prune, archive, restore and the purge-blocked-while-published guard; and — against a
throwaway project created and destroyed in the real Vercel account — the host-side project
rename and the verified delete.

### Hosting the factory

`factory.py serve()` is the local mode — loopback only, a one-time token printed to a
terminal, one operator at the machine. `serve.py` is the same app with the parts that do
not survive the internet replaced: a password instead of a printed token, a mounted disk
instead of a container's own filesystem, and Vercel's REST API instead of a CLI that
expects an interactive login.

`render.yaml` at the repository root deploys it: **Render → New → Blueprint → this repo**.
Everything that is not secret is already in that file; Render asks only for
`FACTORY_PASSWORD`, `VERCEL_TOKEN` and (optionally) `ANTHROPIC_API_KEY`. The password is
the only thing between the internet and a token that can deploy, so it is the one setting
worth being careful about. `autoDeploy` is off deliberately: a service that can publish
should not redeploy itself because someone pushed a README.

Verified locally before it was written: the service boots, an unauthenticated page request
gets the login screen, an unauthenticated `/api/*` request gets a 401 as JSON rather than a
login page a stale tab would try to parse, a wrong password is rejected with a one-second
floor, and a correct one issues a signed, expiring cookie that unlocks the API.

## Verifying the engine

```bash
python3 turnkey.py selftest
```

Proves: init/resume idempotency, gate enforcement (can't mark a publish/send/money step done
without a YES), the intake terms guard, append-only tamper detection, and blueprint enforcement
(can't finish a build workstream without a blueprint; a church resolves to WordPress, a SaaS does
not; operator overrides of platform and functions persist).
