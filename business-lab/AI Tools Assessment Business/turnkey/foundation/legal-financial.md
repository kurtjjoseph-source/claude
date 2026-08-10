# Legal & Financial Package (NL) — AI Tools Assessment Business

**Author:** Vision Outreach Media (VOM), on behalf of the client/operator.
**Workstream:** W2 — Legal & financial (NL).
**Status:** Package prepared to one-click-execution. Filing itself is a VOM/CLIENT gate — VOM/the
operator submits and signs; this document supplies the exact values and steps.

Per KYB (`turnkey/intake/kyb-result.md`): no KVK entity currently exists for this specific
business. Two entity paths are prepared below because the gate matrix does not yet show an
existing KVK registration cleared for reuse — the operator should confirm which path applies.

---

## 0. Entity-path decision (VOM gate — resolve first)

- **Path A — add as a trade name/activity under an existing VOM KVK registration.** If Vision
  Outreach Media (or the operator) already holds a KVK number, this business can usually be added
  as an additional **handelsnaam** (trade name) and/or **nevenactiviteit** (secondary SBI
  activity) on that existing inschrijving — no new BTW number, cheapest and fastest path (KVK
  "wijziging doorgeven" — free for a handelsnaam addition to an existing eenmanszaak; ~€75 mutation
  fee otherwise).
- **Path B — new registration.** If no existing entity applies, register a fresh **eenmanszaak**
  (sole proprietorship) — the standard default for a solo-operator service business — via a KVK
  inschrijving appointment (~€82.25 one-time fee, in person or via digital ID at a KVK office).
  A BV (limited company) is the alternative if liability separation is wanted, but adds notary
  costs (~€500–€1,000) and is not indicated by anything in the profile.
- **Do this:** confirm which path applies before submitting. Everything below is written to work
  under either path (only the "new registration" fields are skipped under Path A).

---

## 1. Trade name (handelsnaam) filing

**Blocked on:** `business-profile.md` TODO — legal/brand operating name. Do not invent this value.

- **Field to file:** `Handelsnaam` = **[operator's chosen business/legal name — TODO(operator)]**.
  Until decided, the working label used across this pipeline is "AI Tools Assessment Business";
  this is a placeholder only and must not be filed as the legal handelsnaam.
- Multiple trade names are allowed under one KVK number (e.g., a VOM umbrella name plus a
  client-facing brand name) — if the operator wants the AI-assessment offer to trade under a name
  distinct from "Vision Outreach Media," that is supported without a new registration.
- **SBI (activity) code recommendation:** `62.02` — *Consultancy op het gebied van
  informatietechnologie* (IT/technology consultancy) as primary; add `70.22` — *Overig advies op
  het gebied van bedrijfsvoering en overig zakelijk advies* (general business-management advice)
  as a secondary code to cover the process-redesign/concierge upsell tiers. Both are standard,
  non-regulated codes — no permit or diploma requirement attaches to either.
- **Address:** business/correspondence address (operator to supply — home address is standard for
  a solo eenmanszaak and does not need to be public if a postal/visiting-address alternative is
  registered separately).
- **Vestigingsplaats (municipality):** ties to whichever geography TODO(operator) resolves to, if
  the niche axis chosen is geography-based (see `business-profile.md` §Niche). If the vertical
  axis is chosen instead, this is simply the operator's actual base of operations.

---

## 2. VAT (BTW) registration

- For an eenmanszaak (Path A or B), **BTW registration is automatic**: the Belastingdienst issues
  the **omzetbelastingnummer (BTW-nummer)** directly off the KVK inschrijving — no separate filing
  action needed at this step. It typically arrives by post within ~2 weeks of KVK registration.
- **VAT treatment for this offer:** standard **21% Dutch BTW** applies — this is professional
  consulting/advisory services sold primarily to NL-based small-business clients (per ICP:
  "small business owners... $500K–$5M annual revenue," read as domestically-facing given the
  geography/local-channel emphasis in the profile). No reduced-rate, exempt, or margin-scheme
  category applies to AI-tools consulting.
- **If any clients end up outside NL (EU B2B):** reverse-charge (BTW verlegd) applies automatically
  for EU-B2B with a valid VAT number on file — flag for the bookkeeper once/if that occurs; no
  action needed now.
- **KOR (small-business VAT exemption) — flag, not a recommendation:** the Dutch *Kleineondernemersregeling*
  lets sole proprietors under €20,000/year revenue opt out of charging BTW entirely. Given the
  pricing in the profile ($999 assessment alone would exceed this within ~20 clients/year), KOR is
  almost certainly the wrong fit here and is not prepared as a default — noting only so the
  operator can explicitly decline it if asked during registration.

---

## 3. Bookkeeping setup

### 3a. Chart of accounts (sketch — NL small-service-business standard)

| Code | Account | Type |
|---|---|---|
| 8000 | Omzet — AI Tools Assessment ($999 tier) | Revenue |
| 8010 | Omzet — Implementation upsells | Revenue |
| 8020 | Omzet — AI Concierge retainer | Revenue |
| 4000 | Software & SaaS subscriptions (Fathom, Claude, Gamma, Zapier/Make/n8n, Voxer) | Expense |
| 4010 | Contractor/subcontractor fees | Expense |
| 4020 | Marketing & advertising (incl. Meta ads self-liquidating funnel) | Expense |
| 4030 | Coworking / meetup venue costs | Expense |
| 4040 | Bank & payment-processing fees (Stripe) | Expense |
| 4900 | Accountancy / bookkeeping fees | Expense |
| 1300 | Debiteuren (accounts receivable) | Asset |
| 1600 | Te betalen BTW (VAT payable) | Liability |
| 1650 | Vooruitbetaalde BTW (VAT receivable) | Asset |

This is a starting sketch for the bookkeeper/accounting software (e.g., Moneybird, e-Boekhouden,
or an accountant of the operator's choosing) — not a filed document.

### 3b. Invoice template outline (NL-compliant factuur)

Required fields for a legally valid Dutch invoice:
1. Invoice number (sequential, no gaps — e.g. `2026-001`, `2026-002`…)
2. Invoice date + delivery/service date
3. Full legal name + address of the business (handelsnaam once filed)
4. **KVK number** (once issued)
5. **BTW-nummer** (once issued)
6. Client's name + address
7. Description of service (e.g. "AI Tools Assessment — discovery call + report")
8. Amount excl. BTW, BTW rate (21%), BTW amount, total incl. BTW
9. Payment terms (suggest 14 days) + IBAN (once business bank account is opened — separate CLIENT
   step, not covered here)
10. Reference to the money-back guarantee condition for the Assessment tier, where applicable

This outline is ready to hand to whatever invoicing tool W6/Build wires up (or an accountant's
template) once the BTW/KVK numbers exist.

---

## 4. Dutch-lawyer terms review (prerequisite — DEFERRED, not a blocker here)

The gate matrix already tracks this platform-level prerequisite as `dutch_lawyer_terms: pending`
(see `turnkey/launch-state.json`). Per intake's own gate script (`turnkey/gates/intake-1.md`),
customer-facing terms are **not permitted to go live** until this review clears — but that review
is scoped to the live-terms gate later in the pipeline (pre-launch), not to preparing this Legal &
Financial package now. Nothing in this document is customer-facing; filing VAT/trade
name/bookkeeping does not require the lawyer review to proceed. Flagging here so it is not lost:
**do not auto-publish any terms, refund policy, or contract language until `dutch_lawyer_terms`
reads `done`.**

---

## Gate requests (VOM/CLIENT — submitted by orchestrator, not this agent)

1. **VOM/CLIENT — entity-path confirmation + KVK filing.** Confirm Path A (add trade name to
   existing VOM KVK number) vs Path B (new eenmanszaak registration); then file at KVK with the
   handelsnaam, SBI codes (62.02 + 70.22), and address above. VOM supplies the values; operator
   submits and signs (KVK requires in-person or DigiD/eHerkenning identity verification — VOM
   cannot do this).
2. **VOM/CLIENT — confirm BTW treatment.** Confirm standard 21% BTW applies (no KOR opt-in) once
   the BTW-nummer arrives by post.
3. **VOM — business-name + niche decision.** Still open in `business-profile.md` (niche axis,
   legal/brand operating name) — blocks the handelsnaam value above. Nothing here can be filed
   with a real name until this is resolved.
4. **VOM — Dutch-lawyer terms review.** Confirm scheduled/underway; must clear before any
   customer-facing terms or refund-guarantee language goes live (separate, later gate).
