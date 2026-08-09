# Headgate

An AI-assisted diligence wizard for buying land with water rights, built around a
single premise: **most land deals go wrong in the water, not the dirt.**

You answer seven short steps about a parcel. A deterministic rules engine applies
the governing state's water law to those facts and produces a scored assessment,
ranked red flags, and a risk-adjusted estimate of how much water you can actually
count on. A language model then writes the acquisition plan on top of that
output — sequencing, negotiation strategy, walk-away triggers, budget order.

A private portfolio dashboard tracks every parcel from prospect to closing
against an acreage target (1,000 acres by default), separating deeded acres from
*water-secured* acres.

---

## The central design decision

**The model never originates a legal conclusion.**

Everything a buyer could act on — the composite score, the red flags, the
forfeiture exposure, the reliable-yield estimate, the checklist, the seller
questions — is computed in `src/lib/water/engine.ts` from a structured 50-state
registry. The model receives that output and is explicitly barred from inventing
a statutory period, a priority-date consequence, an agency requirement or a
dollar figure.

This matters because the claims a buyer would act on are exactly the claims a
language model is least reliable about. It also means the app degrades cleanly:
with no API key configured, the full analysis still runs and the narrative
sections fall back to templated prose. Nothing analytical is lost.

```
ParcelInput ──▶ assessParcel()  ──▶ Assessment ──▶ generatePlan() ──▶ AcquisitionPlan
                (deterministic)      score           (model, or        thesis
                                     findings         template)        sequencing
                                     checklist                         negotiation
                                     questions                         walk-aways
                                     water balance                     portfolio fit
```

## What the engine actually models

Surface doctrine and groundwater regime are treated as **separate axes**, because
they frequently disagree inside the same state — Texas allocates surface water by
prior appropriation while groundwater belongs absolutely to the landowner and can
be severed like minerals; Nebraska splits administration between two different
agencies entirely.

| Regime | States | What drives buyer risk |
| --- | --- | --- |
| Prior appropriation | AK AZ CO ID MT NM NV UT WY | Priority date, forfeiture for non-use, adjudication status, basin closure |
| Hybrid | CA KS ND NE OK OR SD TX WA | All of the above, plus surviving pre-code claims and district allocations |
| Regulated riparian | Most of the East | Withdrawal permit capacity, caution areas, wetlands |
| Riparian | HI and common-law holdovers | Frontage in the chain of title; public trust in Hawaii |

Depth is uneven on purpose. In appropriation states the water right is a
distinct, severable, datable, forfeitable property interest that carries most of
a deal's risk, so those entries are modeled in detail — augmentation plans in
Colorado, Assured Water Supply in Arizona AMAs, ESPA mitigation in Idaho, SGMA
allocations in California, LEMAs in Kansas, certified irrigated acres in
Nebraska, GCDs and the severable groundwater estate in Texas. In riparian states
the right largely runs with the land and the analysis genuinely is simpler.

### Scoring

Five weighted categories: water security (38%), title and transferability (24%),
physical supply (16%), land and access (12%), acquisition economics (10%).

Deal-quality credits and deductions net against a 100 baseline and clamp there.
**Structural penalties — basin-closure risk — are applied after that clamp**, so
an otherwise flawless parcel in a severely over-appropriated basin cannot score
the same as one in an open basin. Letting credits absorb the basin penalty was a
real calibration bug during development; `tests/engine.test.ts` now pins the
ordering across all four risk tiers.

Verdict is composite plus critical-finding count: three criticals is a walk
regardless of score.

### Water balance

The claimed volume is multiplied by a reliability factor built from compounding
discounts — seniority, adjudication status, severance history, non-use against
the state's own forfeiture period, aquifer trend, basin closure, and the
historical-consumptive-use haircut that a change of use triggers. The result is
compared against the demand implied by the intended use.

Seniority and adjudication discounts apply only when there is an appropriative
*surface* right. A Texas or Nebraska parcel supplied by groundwater has no
priority date, and penalizing it for the absence of one would be a category
error.

## Running it

```bash
npm install
cp .env.example .env.local     # optional
npm run dev                    # http://localhost:3000
```

| Variable | Effect |
| --- | --- |
| `ANTHROPIC_API_KEY` | Enables model-authored plans. Without it, templated prose; the analysis is identical. |
| `ANTHROPIC_MODEL` | Defaults to `claude-opus-5`. |
| `PORTFOLIO_PASSPHRASE` | Gates `/portfolio`. Unset leaves the dashboard open. |
| `DATA_DIR` | JSON store location. Defaults to `.data`. |

```bash
npm test        # 30 engine + registry tests
npm run build
npm run typecheck
```

## Routes

| Route | |
| --- | --- |
| `/` | Public front door |
| `/wizard` | Seven-step screening → acquisition plan |
| `/doctrine` | Searchable 50-state law reference |
| `/portfolio` | Private dashboard (passphrase-gated) |
| `POST /api/plan` | `{ input }` → `{ assessment, plan }` |
| `GET/POST/PUT /api/portfolio` | List + roll-up, add holding, set target |
| `PATCH/DELETE /api/portfolio/:id` | Update stage, remove |

## Layout

```
src/lib/water/states.ts      50-state registry — doctrine, agency, forfeiture, regimes, traps
src/lib/water/engine.ts      Deterministic scoring, findings, water balance
src/lib/plan/checklist.ts    Phased diligence checklist, blocking items flagged
src/lib/plan/seller-questions.ts  Questions + how to read the answers
src/lib/ai/prompts.ts        System prompt, grounding context, tool schema
src/lib/ai/plan.ts           Model call and the deterministic fallback
src/lib/portfolio/           JSON store and goal/runway math
```

## Known limits

- **The passphrase gate is a door, not an identity system.** One shared secret,
  hashed into a cookie. Fine for a single operator; replace it before this holds
  anything of value to anyone else.
- **The JSON store assumes one server process.** Writes are serialized in-process
  and use write-then-rename, which is safe for a single node and wrong for a
  horizontally scaled deployment. Swapping in Postgres touches only
  `src/lib/portfolio/store.ts`.
- **The registry is a routing aid, not a legal database.** Statutory periods
  change and basin-level facts vary within a state. Every checklist routes the
  buyer back to the agency of record for confirmation.
- **Nothing is verified against live agency data.** The wizard records what the
  seller has asserted and produced. That is the input, and it is the buyer's job
  — with the generated checklist — to go confirm it.

## Not legal advice

This is a diligence-routing tool. Water law is state-specific and the facts that
decide a deal live in agency records and the chain of title, not in a
questionnaire. Every output is a starting point for work done by water counsel
and a licensed engineer in the state where the land sits.
