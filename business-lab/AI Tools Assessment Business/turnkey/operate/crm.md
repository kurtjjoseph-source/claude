# CRM Pipeline — AI Tools Assessment Business

**Author:** Vision Outreach Media (VOM), operating on behalf of the client/operator.
**Workstream:** W10 — CRM & client hub.
**Status:** **STRUCTURE STOOD UP, SEEDED WITH ZERO REAL ROWS.** No real inbound exists yet (site
staged not live, no prospect sends authorized, niche/name still open per
`business-profile.md` §Summary of Blocking Items). This file locks the pipeline schema and stage
definitions now so the moment real leads or inbound arrive, they drop straight into a working
system with no re-design needed.

**Surface:** Operator-only. This is a flat-file CRM (this document) until/unless the operator asks
for a connected tool (Airtable, HubSpot, Pipedrive, etc.) — either way, **no client login exists
or is ever created**. The client's only touchpoints are magic-link approvals and the weekly
WhatsApp digest (see `running-inventory.md` §6).

---

## 1. Pipeline stages

| Stage | Definition | Entry trigger | Exit trigger |
|---|---|---|---|
| **Prospect** | A business surfaced via `market/prospects.md` methodology, ICP-fit screened, not yet contacted. | Row enriched into `prospects.csv` (blocked on niche-axis decision — see below). | First outreach send (any channel) OR discarded as non-fit. |
| **Lead** | Contacted at least once via an approved sequence (`market/sequences.md`) or inbound (meetup, office hours, referral, door-knock, network ask) — has not yet booked/paid. | First send fires (post-YES) or inbound contact received. | Books + pays for the $999 AI Tools Assessment, OR goes cold (no response after full sequence + one follow-up) → archived, not deleted. |
| **Customer** | Has paid for the $999 Assessment (door-opener tier). May also be mid-upsell (process redesign, automation build, knowledge system, custom workflows, full implementation — see `business-profile.md` §Pricing). | Stripe payment confirmed (via `build/` W5/W6 webhook, once live). | Converts to a Concierge retainer (→ Retained), or completes upsell work with no retainer (stays Customer, dormant), or churns. |
| **Retained** | Active AI Concierge retainer client ($1.2K–$2K/mo): two 45-min sessions/month + Voxer async, running the Audit→Optimize→Automate (AOA) loop. | Retainer agreement signed + first payment. | Cancellation (→ archived Customer) or renewal (stays Retained, logged each cycle). |

**Archived** (cross-cutting, not a pipeline stage): any Lead/Customer/Retained that goes cold,
cancels, or opts out. Kept for record and re-engagement eligibility, never deleted, never
re-contacted without a fresh approved sequence.

## 2. Per-record fields (schema)

Each CRM row (client hub "card"), once real rows exist, carries:

| Field | Source |
|---|---|
| Business name | `prospects.csv` or inbound intake |
| Contact (public business channel only) | `prospects.csv` enrichment or inbound |
| Category / vertical | `prospects.csv` |
| Time-drain hypothesis | `prospects.csv` (seeds W11 draft personalization) |
| Stage | This file's pipeline |
| Channel of first contact | One of the 7 in `business-profile.md` §Channels |
| Warm-path note | Chamber/referral/network overlap, yes/no + which |
| Assessment status | Not booked / booked / delivered / upsell offered |
| Upsell(s) active | Process redesign / automation / knowledge system / custom workflow / full implementation |
| Retainer status | None / active (tier $) / cancelled |
| Last follow-up sent | Date + which W11 draft + approval actor |
| Next follow-up due | Derived from stage + last-touch date (see W11 cadence rules) |
| Consent-log refs | Links to each approved send for this record |

## 3. Seeding status (today, 2026-07-29)

- **Real prospect rows: 0.** Blocked on the niche-axis decision (`business-profile.md` §Niche/
  Positioning TODO) — `market/prospects.md` is methodology-complete but has not generated
  `prospects.csv` yet.
- **Real inbound: 0.** Site is staged, not live (`W4_website` gate-pending); no channel handles
  registered yet (`market/benchmark-baseline.md` §5).
- **Pipeline schema: live** — the moment `prospects.csv` exists or any inbound arrives (a meetup
  sign-up, a door-knock mini-audit, a referral-partner intro), it is entered at **Prospect** or
  **Lead** stage using the schema above, no rework needed.

## 4. Stage-transition rules (governance)

- Stage transitions driven by **facts** (a send fired, a payment cleared, a retainer signed), not
  by aspiration — a record does not move to Customer until Stripe confirms payment.
- No stage transition triggers an automatic send — moving a record to a new stage only makes it
  eligible for a W11 follow-up draft; the draft still requires the same human-approval gate as
  everything else in this pipeline.
- The CRM is read by W11 (this agent) and by the running inventory (`running-inventory.md`) as the
  single source of stage truth — no duplicate/divergent stage tracking elsewhere.

## 5. Status

- Pipeline stages + schema: **locked**, ready to receive real rows.
- Real rows seeded: **0** — pending niche decision + live site/channels.
- Operator-only surface: **confirmed** — no client login exists or is planned.
