# Headgate

**Live: https://headgate-water-rights.netlify.app**

An AI-assisted diligence wizard for buying land with water rights, built around a
single premise: **most land deals go wrong in the water, not the dirt.**

You answer eight short steps about a parcel and about yourself as a buyer. A
deterministic rules engine applies the water law of the jurisdiction — any US
state or one of twenty-three countries — plus, for cross-border deals, that
country's foreign ownership rules, and produces a scored assessment, ranked red
flags, and a risk-adjusted estimate of how much water you can actually count
on. A language model then writes the acquisition plan on top of that
output — sequencing, negotiation strategy, walk-away triggers, budget order.

A private portfolio dashboard tracks every parcel from prospect to closing
against an acreage target (1,000 acres by default), separating deeded acres from
*water-secured* acres.

---

## The central design decision

**The model never originates a legal conclusion.**

Everything a buyer could act on — the composite score, the red flags, the
forfeiture exposure, the reliable-yield estimate, the checklist, the seller
questions — is computed in `src/lib/water/engine.ts` from a structured
jurisdiction registry. The model receives that output and is explicitly barred from inventing
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

## First purchase

`/start` is upstream of the parcel wizard. It answers the question a first-time
buyer actually has — what should my first purchase look like, can I afford it,
and what do I do this week — from a short profile of capital, goal, experience
and geography.

The governing idea is that **the first purchase is not the one to optimise**.
It is the one that has to teach you records searches, agency calls, escrow
structure and how sellers behave, with downside you can absorb. The engine is
biased toward simplicity and reversibility accordingly.

The budget envelope is the load-bearing output:

```
capital = land + closing costs + working reserve + diligence programme
```

Diligence is costed per deal and multiplied by the deals a first-time buyer
should expect to take into *paid* diligence before one closes — you pay for the
ones you walk away from. Passive holds drop the pump test and engineer;
cross-border adds local counsel, structuring and transfer taxes. Solving for
the land leaves the only number that should ever be quoted to a seller. Thin
capital fails a gate rather than producing a fantasy budget.

Acreage is shown as a sensitivity table across reference prices rather than a
single figure, because this tool carries no land price data and will not invent
any.

The jurisdiction shortlist blends two scores that pull in opposite directions:
**ease** of transacting as a first-timer, and whether **water is an asset worth
building a position around** there. Ranked on ease alone the engine recommends
Delaware — riparian states are simplest precisely because water is not a
separate asset in them. Both sub-scores are shown so the trade-off stays
visible, and the blend shifts with risk appetite.

## Listings map

`/listings` plots inventory on a real basemap — US states or world countries —
with pins coloured by how well each parcel matches *you*, and detail pages
behind each one.

**The inventory is synthetic and labelled as such on every surface.** There is
no public feed carrying structured water-right data, and inventing listings
that looked real would undermine the point of the tool. What the sample set
does is exercise scoring, matching and the map end to end, and define the shape
a live feed must produce: implement `ListingSource` in
`src/lib/listings/data.ts` and everything downstream already works.

Two numbers are kept deliberately separate, because they answer different
questions:

- **Parcel score** — the engine's view of the parcel itself. Is the water real,
  is the title clean. Independent of who is buying.
- **Match** — whether *this buyer* can and should transact on it: budget fit,
  jurisdiction shortlist, target size, eligibility. A superb parcel at three
  times your budget is a bad match, and the tool says so rather than ranking it
  first.

Blockers are separate from deductions. Something you cannot lawfully or
financially do is not a low score, it is a no — so blocked listings score zero,
sort last, and say why.

The basemap is projected server-side with d3-geo over bundled TopoJSON, so no
map library or geometry reaches the browser, and there is no tile server, API
key or external request. `geoAlbersUsa` returns null outside the United States,
which is exactly the behaviour needed to keep foreign pins off the US view — a
test pins that.

The buyer profile lives in a cookie rather than localStorage so matching runs
on the server at render time: no loading flash, no effect-driven fetch, and the
page works without JavaScript. There is no account system; the profile travels
only as far as the request that scores it.

## Cross-border acquisition

Going international inverts the risk order. Domestically the water right is the
hard part and ownership is assumed. Abroad the first question is whether a
foreign buyer may hold the interest at all, and in several countries the answer
is no — so the engine scores eligibility before hydrology and can return a
**deal breaker** that forces a walk verdict irrespective of the composite.

Twenty-three countries are modeled with a foreign-ownership profile (regime,
rural land rule, border and coastal exclusion zones, approval body and
timeline, caps, nominee warnings, post-closing reporting) and a country-risk
profile (expropriation, title system and reliability, customary claim risk,
exchange controls).

| Regime | Examples |
| --- | --- |
| Open to foreign buyers | Chile, Uruguay, Portugal, Spain, South Africa |
| Rural land restricted | Argentina, Brazil, Peru, Romania, France, Canada, Japan |
| Screening approval required | Australia, New Zealand |
| Structure required | Mexico (fideicomiso or Mexican company in the restricted zone) |
| Leasehold only | Zambia, Mozambique, Kenya |
| Closed | Georgia, Thailand, Morocco, Namibia |

Jurisdictions are keyed ISO 3166-2 style — `US-CO`, `CL`, `AU`. Bare postal
codes collide with ISO country codes on CA, MA and AR, and a test pins the
namespaces apart.

Two weighting tables apply. Domestic deals weight water security at 38% and
drop the eligibility category entirely; cross-border deals give eligibility and
country risk 20%, taken proportionally from the rest.

The model layer is explicitly barred from proposing a nominee arrangement,
because it is a criminal offence in several of these countries and
unenforceable in most of the rest.

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

Domestic: water security (38%), title and transferability (24%), physical supply
(16%), land and access (12%), acquisition economics (10%).

Cross-border: eligibility and country risk takes 20%, and the rest scale down —
water security (30%), title (19%), physical supply (13%), land and access (10%),
economics (8%).

Deal-quality credits and deductions net against a 100 baseline and clamp there.
**Structural penalties — basin-closure risk — are applied after that clamp**, so
an otherwise flawless parcel in a severely over-appropriated basin cannot score
the same as one in an open basin. Letting credits absorb the basin penalty was a
real calibration bug during development; `tests/engine.test.ts` now pins the
ordering across all four risk tiers.

Verdict is composite plus critical-finding count: three criticals is a walk
regardless of score. A **deal breaker** — currently an outright bar on foreign
ownership with no lawful structure — forces a walk on its own, because that is
not a bad deal, it is the absence of a transaction.

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
| `PORTFOLIO_PASSPHRASE` | Gates `/portfolio`. **Unset leaves the dashboard and its write API open to anyone.** Always set it on a public deployment. |
| `DATA_DIR` | JSON store location for the file backend. Defaults to `.data`. Ignored when Netlify Blobs is active. |

## Deployment

Deployed on Netlify. `netlify.toml` pins Node 22 and the Next.js runtime plugin;
no other configuration is required.

Persistence switches backend automatically. Locally the portfolio writes to a
JSON file; on Netlify it uses Blobs, which needs no provisioning. Production
uses the global blob store and every other deploy context gets a deploy-scoped
one, so a holding added from a preview URL cannot contaminate the live roll-up.

To redeploy from a working copy:

```bash
npx -y @netlify/mcp@latest --site-id <site-id>
```

Environment variables are set in the Netlify dashboard under Site
configuration → Environment variables, and take effect on the next deploy.

```bash
npm test        # 93 tests across the engine, registry, store, first purchase and listings
npm run build
npm run typecheck
```

## Routes

| Route | |
| --- | --- |
| `/` | Public front door |
| `/start` | First-purchase guide: readiness, budget envelope, shortlist, 10-step plan |
| `/listings` | Map of sample inventory, matched against your profile |
| `/listings/[id]` | Parcel detail: engine findings plus why it does or does not fit you |
| `/wizard` | Eight-step screening → acquisition plan |
| `/opportunities` | Curated cross-border theses: what the play is, what kills it, who it suits |
| `/doctrine` | Searchable reference across all jurisdictions |
| `/portfolio` | Private dashboard (passphrase-gated) |
| `POST /api/plan` | `{ input }` → `{ assessment, plan }` |
| `POST /api/first-purchase` | `{ profile }` → `{ guide, brief }` |
| `GET/POST/PUT /api/portfolio` | List + roll-up, add holding, set target |
| `PATCH/DELETE /api/portfolio/:id` | Update stage, remove |

## Layout

```
src/lib/water/states.ts      50-state registry — doctrine, agency, forfeiture, regimes, traps
src/lib/water/international.ts  23-country registry — water regime, foreign ownership, country risk
src/lib/water/registry.ts    Merged lookup, region grouping, cross-border detection
src/lib/opportunities.ts     Curated acquisition theses
src/lib/first-purchase/engine.ts  Readiness gates, budget envelope, shortlist, plan
src/lib/listings/data.ts     Sample inventory and the ListingSource seam
src/lib/listings/match.ts    Buyer-versus-parcel matching, blockers separate from deductions
src/lib/listings/basemap.ts  Server-side geo projection to SVG paths
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
- **The JSON file backend assumes one server process.** Writes are serialized
  in-process and use write-then-rename, which is safe for a single node and
  wrong for a horizontally scaled one. The Blobs backend has no such limit —
  it keys one record per holding precisely so concurrent instances cannot
  clobber each other — but Blobs offers no compare-and-swap, so two
  simultaneous edits to *the same* holding are still last-write-wins.
- **The registry is a routing aid, not a legal database.** Statutory periods
  change and basin-level facts vary within a state. Every checklist routes the
  buyer back to the agency of record for confirmation.
- **The listing inventory is synthetic.** No parcel on the map is for sale.
- **Nothing is verified against live agency data.** The wizard records what the
  seller has asserted and produced. That is the input, and it is the buyer's job
  — with the generated checklist — to go confirm it.

## Not legal advice

This is a diligence-routing tool. Water law is state-specific and the facts that
decide a deal live in agency records and the chain of title, not in a
questionnaire. Every output is a starting point for work done by water counsel
and a licensed engineer in the state where the land sits.
