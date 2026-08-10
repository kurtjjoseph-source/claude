# VOM Domain Desk — Cost & Break-Even Model

**Model:** internal-only wholesale. **No markup on domains.** This document therefore is not a
margin model — it is a **cost, break-even and recovery** model: what a domain actually costs VOM,
how many client domains make the membership fee worth paying, and how that cost reaches the client's
invoice without VOM quietly profiting on it.

All figures **excl. VAT** unless stated. USD converted at **$1.00 ≈ €0.92** (July 2026); FX moves,
so treat USD-denominated lines as ±5%.

> ⚠️ **Precision note.** Wholesale cost prices sit behind the Openprovider reseller login. The
> "VOM cost" column below is built from **published registry prices** (which is what a cost-price
> membership is defined to charge) plus a small handling allowance. Replace with real invoice
> figures after signup — see the open item in `registrar-decision.md` §7.

---

## 1. Fixed cost

| Line | Amount | Notes |
|---|---|---|
| Openprovider **Basic S** membership | **$49.99/yr ≈ €46/yr** | billed annually at $4.16/mo. Covers up to **100 domain operations**/yr |
| Prepaid balance float | €50–100 | working capital, not a cost — it converts into domains |
| **Total fixed annual cost** | **≈ €46/yr** | ~€3.83/month |

That is the entire cost of VOM having a wholesale registrar. For scale: it is **13% of one month**
of a single €350/mo AI Concierge retainer.

---

## 2. Per-domain cost vs. what a client pays retail today

| TLD | Registry price | VOM cost (est.) | Typical NL retail | TransIP published | **Saving/yr** |
|---|---|---|---|---|---|
| **`.nl`** | €4.38 (SIDN, 2026) | **≈ €4.50** | €12–16 | €16.50 | **€8–12** |
| **`.com`** | ≈ $10.26 + $0.18 ICANN | **≈ €9.80** | €12–28 | €27.99 | **€3–18** |
| **`.eu`** | ≈ €3–4 | **≈ €4.00** | €10–15 | — | **€6–11** |
| **`.org`** | ≈ $10–12 | **≈ €10.50** | €14–20 | — | **€4–10** |
| **`.church` / `.online`** etc. | varies widely | at cost | heavily promo-priced yr 1, steep at renewal | — | **large at renewal** |

`.nl` is the line that matters — it's the default for NL-facing church and local-service clients,
and it's where at-cost is a **~3× reduction** off TransIP's regular rate.

**A note on renewal traps:** the biggest real saving isn't year one, it's year two. Retail
registrars sell `.nl` at €0.49–2.00 for the first year and then renew at €12–16.50. At cost, year
one and year ten are both ≈ €4.50. Over a five-year client relationship a single `.nl` costs VOM
**≈ €22** instead of **≈ €60** at retail renewal rates.

---

## 3. Break-even

Break-even on the €46 membership, using the conservative `.nl` saving of **€9.50/domain/yr**
(mid-market retail, not the TransIP high anchor):

| Client domains | Domain cost at wholesale | Same domains at retail (€14) | Membership | **Net vs retail** |
|---|---|---|---|---|
| 1 | €4.50 | €14 | €46 | **−€36.50** |
| 3 | €13.50 | €42 | €46 | **−€17.50** |
| **5** | €22.50 | €70 | €46 | **+€1.50** ← break-even |
| 10 | €45 | €140 | €46 | **+€49** |
| 25 | €112.50 | €350 | €46 | **+€191.50** |
| 50 | €225 | €700 | €46 | **+€429** |

> **Break-even ≈ 5 client domains.** Against TransIP's published €16.50 it's **4 domains**.

Two consequences worth acting on:

- **Below ~4 domains, don't buy the membership yet.** Create the free Openprovider account anyway —
  it still gives one panel, one API and one renewal calendar at retail pricing — and add the
  membership the moment the 4th client domain is in sight. The operational win arrives before the
  cost win does.
- **Above ~10 domains the fixed fee is noise.** At that point the real value is no longer the €50 a
  year saved; it's that W3 is automated and nobody is chasing a church treasurer for a registrar
  password.

**The honest headline: the money saved here is small.** At a realistic near-term scale of 5–15
client domains, the wholesale account saves VOM **€50–150 a year**. It is worth doing for the
operational reasons — automation, ownership hygiene, one renewal calendar, no credential
sprawl — and the cost saving is a rounding-error bonus. Don't build a business case on it.

---

## 4. How the cost reaches the client

Three defensible ways to handle it. **Recommended: option A.**

### A. Pass through at cost, itemised *(recommended)*
The client's invoice shows `Domain registration — example.nl — €4.38 (registry cost, no markup)`.
VOM absorbs the €46 membership as overhead inside the launch fee / retainer it already charges.

- **Why:** it's the truest expression of the internal-only decision, it's a *trust asset* with
  exactly the budget-careful, non-technical clients Turnkey targets, and €46/yr is not worth the
  complexity of recovering separately.
- **Client sees:** €4.38 + 21% VAT = **€5.30/yr**. (Assume most church clients cannot reclaim VAT,
  so €5.30 is their true out-of-pocket.)

### B. At cost + a flat management line
Domain at €4.38, plus a separate `Domain & DNS management — €10/yr` line. Still zero markup *on the
domain*; the labour is priced openly as labour.

- Recovers the membership at **5 clients**, and makes the DNS/renewal work visible instead of free.
- Use this if domains ever get sold outside a retainer relationship, where there's no other fee to
  absorb the overhead.

### C. Fold it in entirely
No domain line at all. "Domain included" inside the Turnkey launch fee or the monthly retainer, with
the cost silently carried by VOM.

- Simplest possible client experience — one number, no line items. Costs ≈ €5–10/client/yr, which is
  immaterial against a €295 assessment or a €350/mo retainer.
- Downside: the client never sees how cheap it is, so VOM loses the transparency benefit — and if
  the relationship ends, "wait, whose domain is it?" is a harder conversation when they never saw an
  invoice line with their name as registrant on it.

**Recommendation: A by default, C as a marketing option** for bundled launch packages, B only if
domains are ever sold standalone.

---

## 5. Cash flow and admin

- **Prepaid, not invoiced.** Openprovider draws from a balance. €100 float ≈ 20 `.nl` years. Set the
  low-balance alert; a failed renewal because the balance hit zero is the one unacceptable outcome.
- **VAT is net-zero for VOM.** Pay 21% on the domain, reclaim as input VAT, charge 21% onward. The
  client, if not BTW-liable (most churches), bears it.
- **Registry price changes flow through automatically.** SIDN adjusts `.nl` annually; Verisign may
  raise `.com` by up to 7%/yr and `.net` up to 10%/yr through mid-2029. At-cost pass-through means
  no renegotiation — but state it once in the client terms so a €4.38 → €4.60 renewal isn't a
  surprise.
- **The 100-operation ceiling.** Basic S covers 100 domain operations per year. Confirm at signup
  exactly what counts as an "operation" (registration and transfer certainly; renewal probably) —
  if renewals count, the practical ceiling at steady state is well under 100 domains and the upgrade
  trigger to Basic M (~$16.66/mo, 500 ops) arrives sooner. **Open item.**

---

## 6. Appendix — what resale *would* be worth, if the decision is ever revisited

Not the chosen model. Recorded so the door is costed rather than guessed at.

At a modest retail price of **€15/yr** for `.nl` (still undercutting TransIP by €1.50):

| Client domains | Revenue @ €15 | Cost @ €4.50 | Membership | **Annual gross profit** |
|---|---|---|---|---|
| 10 | €150 | €45 | €46 | **€59** |
| 25 | €375 | €112 | €46 | **€217** |
| 50 | €750 | €225 | €46 | **€479** |
| 100 | €1,500 | €450 | €166 (Basic M) | **€884** |

The shape of it: **domain resale is not a business, it's a rounding line.** Even at 100 domains it's
under €900/yr gross — less than three months of one AI Concierge retainer, for materially more
support surface (renewal disputes, transfer requests, WHOIS complaints, failed-payment chases). It
only becomes interesting bundled *into* a recurring service (e.g. "€39/mo care plan: domain,
hosting, DNS, backups, monitoring"), where the domain is a retention hook rather than a product.
That's the version worth revisiting — not domains sold on their own.

---

## Sources

Registry and retail figures as cited in `registrar-decision.md` §Sources — SIDN 2026 `.nl` price
(€4.38), SIDN registrar fee (€87.50/mo), Openprovider membership tiers, Openprovider registry
price-increase notes, TransIP published regular prices.
