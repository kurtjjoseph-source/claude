# Mending Net — a church accountability network

**Built from:** `Exhorter-Study-1.pdf` and `ordained_minister_study_guide_2025 kopie.pdf`
(Church of God *Ordained Minister — Ministerial Licensure Study Guide*, 2025, which carries the
*Book of Church Order, Governance, and Discipline*, the *Declaration of Faith* and the
*Practical Commitments*).

**Live — three surfaces, one record:**
- Console (administrative bishop) — https://vom-mending-net.vercel.app
- Minister intranet — https://vom-mending-net.vercel.app/minister.html
- Church intranet — https://vom-mending-net.vercel.app/church.html

**Source:** [mending-net/](mending-net/) — `core.js` (data model + rules engine, shared),
`console.js`, `minister.js`, `church.js`, `kit.css`. No build step, no backend; the three pages
sit on one origin and therefore share one `localStorage` record, which is what makes a report filed
on the church intranet show up on the bishop's console.

---

## The idea in one paragraph

A denomination like the Church of God has already written down, in detail, exactly what
ministerial accountability consists of: a monthly report to state and international offices, a
biennial reaffirmation of doctrine, a criminal background check, seven practical commitments, an
ordered Matthew 18 pathway for concerns, a trial procedure with named rights on both sides, a
ten-day appeal window, and a supervised restoration programme with a five-person team. None of it
is missing. What is missing is a **single current view of it**. Today that record lives in filing
cabinets, an overseer's inbox, and the overseer's memory — which means the first time anyone finds
out a minister has not reported in five months is usually the month it costs them their credential,
and the first time anyone notices a pattern is after the trial. Mending Net is that view.

The name is the source's own metaphor: restoration is defined there as *the mending of the net*
(Galatians 6:1) — that which is torn being put back into service.

## Who it is for

| | |
|---|---|
| **Primary buyer** | A state / regional administrative bishop, or a denominational Center for Ministerial Care |
| **Daily user** | Three surfaces: the state office that chases reports, every credentialed minister in the region, and **every local congregation** — which files its own report, holds its own record and watches its own progress |
| **Unit of sale** | Per region (roughly 20–250 ministers), annual |
| **Wedge** | Reporting compliance. It is the obligation that quietly ends the most credentials, it is trivially measurable, and it is embarrassing to be bad at. |

## What it does

**1. Standing.** One row per credentialed minister: rank (Exhorter / Ordained Minister /
Ordained Bishop), charge, last report filed, months behind, doctrinal reaffirmation, background
check, triad. Every column is an obligation that already exists in the Minutes.

**2. The reporting ladder.** Reports go to state and international headquarters on the first of
each month (S28 I). At **three months** delinquent the state overseer *must* urgently admonish
(S28 III.1). At **four months** the licence becomes subject to revocation after due disciplinary
process (S28 III.2). Mending Net counts unfiled periods and surfaces the two-month gap *before*
polity requires anything — the only place it moves earlier than the book, and it says so.

**3. Covenant review.** The seven Practical Commitments — Spiritual Example, Moral Purity,
Personal Integrity, Family Responsibility, Behavioural Temperance, Modest Appearance, Social
Obligation — reviewed quarterly in the minister's own words and confirmed by a triad partner. The
biennial reaffirmation filed with the September report is one signature; this is the same seven
areas, four times a year, with a name against them.

**4. Triads.** Three ministers, five questions, weekly. This is the network's own addition, resting
on the church's stated commitment to interdependence — involving clergy in mentoring, coaching and
consulting "to increase the level of trust and support among ministers". A triad is explicitly *not*
a disciplinary body and cannot receive a charge.

**5. Concern pathway.** Nine ordered steps: private approach → with one or two others → written and
signed charge → moderated face-to-face meeting → trial board convened → hearing → decision filed →
ten-day appeal → closed. A charge cannot be raised in the system until the private approach is on
the record. At the board and hearing steps the system shows the guardrails to confirm — board
composition, conflict declarations, seven days notice, secretary of record, witness lists, the
support-minister rule, no legal counsel — and both parties' full lists of rights.

**6. Restoration.** A suspension opens a track, not a closed file: offence class and its minimum
period (24 or 12 months), the five-person team (ministerial advocate, administrative bishop, Center
for Ministerial Care, mentoring pastor, Christian counsellor), the three-month window to enter the
programme, and the three evidences of healing and renewal that must actually be demonstrated. The
tool records progress; the International Executive Council reinstates.

**7. Safeguarding.** Background-check register; the permanent-revocation classes; the no-contact
rule protecting victims' congregations; resignation-does-not-evade; the cumulative record. And the
hard boundary: confidentiality does not preempt mandatory reporting and may not be used to conceal a
felonious act — suspected crime leaves the pathway and goes to civil authorities the same day.

**8. Action queue.** The product's spine. Every flag in the system, ranked, each one carrying the
section that creates it, so an administrative bishop can defend any prompt the software makes.

## Three surfaces, one record

The first build put everything in one console with a "viewing as" switch. That was wrong: an
administrative bishop, a credentialed minister and a local church are not three views of the same
job, they are three jobs. So there are now three pages, and each one is built for the person who
opens it.

### The minister intranet — `/minister.html`

Eight tabs, and the organising idea is that **the thing that discharges an obligation sits next to
the thing that says you owe it**.

| Tab | What it does |
|---|---|
| **My standing** | Reporting, reaffirmation, background check and tithing as four live chips, then a ranked *outstanding* list with a **Do it** button per item |
| **Monthly report** | File one, or **file all outstanding at once** as nil-activity catch-up returns. Full filed history. The ladder — 3 months admonition, 4 months revocation exposure, 6 months inactive *(S28 III, S30 V.10)* |
| **Reaffirmation** | The actual biennial affirmation: three items ticked, name typed, period chosen. The button stays disabled until all four are done *(S29 I.9)* |
| **Covenant review** | The seven Practical Commitments, quarterly, in your own words, sent to a named triad partner |
| **My triad** | The five questions, a weekly check-in log, **and an inbox of covenant reviews other ministers have asked you to confirm** |
| **Advancement** | Rights at your rank; the six general requirements that never lapse *(S21 IV)*; the **eleven-step** path to the next rank with who owns each step; MIP status and the four equivalency routes *(S21 II.4)*; exam thresholds — 60% floor per section, 70% average to reach an oral board of ≥3 ordained bishops; a study tracker over the guide's three parts; and the bishop age/service thresholds |
| **Standing instructions** | The eight S29 obligations, each acknowledged and dated on the record |
| **My file** | What the office holds, plus a **who-sees-what table** — your triad partner sees one review, your congregation sees nothing |

### The church intranet — `/church.html`

| Tab | What it does |
|---|---|
| **Our standing** | Ladder position, money owed, open required items, months since the last conference — then *what this church owes next* |
| **Monthly report** | Due **by the fifth**, one copy to the secretary general and one to the state overseer. Tithe-of-tithes split computes live as you type. **File all outstanding at once.** Plus what the treasurer owes weekly, monthly, quarterly and always *(S53 III)* |
| **Officers & council** | Named rosters for the Church and Pastor's Council (sized by membership band), Finance Committee, Local Board of Trustees and assistant pastors — add and remove people, and the required count updates. Treasurer, bookkeeping, insurance, tax exemption, and the congregation's own major-disbursement threshold |
| **Conference** | Record a conference with its ten-day notice and financial report; the Robert's Rules order of business; and **what only a conference can do** — approve major disbursements, approve property transactions by two-thirds, select trustees, endorse a minister for advancement |
| **Membership** | How a member is received *(S48 I)*, what an applicant affirms, adjusting the roll, MAP returns for members who move, and the transfer rule — a name stays on the roll until an official request arrives, because the roll is what sizes your council |
| **Safeguarding** | A **per-person background-check register** for everyone in a ministry position, plus the no-contact rule, the mandatory-reporting line, and the duty to carry out a trial board's decision |
| **Progress** | Twelve months of the church's own filed reports, charted; the four mission commitments it declares for itself |
| **Raising a concern** | The two routes, kept apart |

### What this structure buys

**Privacy is architectural, not advisory.** The church page never loads a discipline record, so
there is nothing to leak. A minister sees only concerns naming them. The bishop sees both and
hands off with *Open their intranet* / *Open the church intranet*.

**Two ledgers stay separate.** A pastor can be personally current while the church they pastor is
four months behind — and the minister intranet says so on the pastor's own home screen, citing the
eligibility rule that ties the two together *(S29 I.9)*.

**The rules engine is written once.** `core.js` holds the data model, the seed, the migration and
every flag; the three pages are views over it. Adding a denomination means editing one file, not
three.

## Why this is a business and not a spreadsheet

- **The obligation is real and dated.** Nobody has to be persuaded that a four-month reporting gap
  matters; the book already says what happens.
- **The buyer is institutional, not individual.** One sale covers a whole region.
- **It is defensive spend.** The cost of *not* having a current safeguarding register is not
  administrative.
- **It generalises.** The polity differs by denomination, but the shape — credential ranks, periodic
  reporting, a covenant, an ordered grievance path, a restoration process — does not. The seed data
  and the rule table are the only denominationally specific parts of the build.
- **It sells downward as well as upward.** The congregation surface is the thing a pastor will
  actually open, and a region whose churches file on time is a region whose bishop keeps the
  subscription.

## What is deliberately *not* here

- No login, no server, no real records. This is a working demonstration on `localStorage` with
  twelve fictional ministers. Real deployment needs authentication, per-role access, an audit
  trail, and a data-protection assessment before a single real name enters it.
- No automated escalation. Nothing in the system sends, files, notifies or advances by itself.
  Every step forward is a deliberate act by a named person — which is how the governing text
  works, and how the software should work.
- No reproduction of the source. The *Book of Church Order*, the *Declaration of Faith* and the
  *Practical Commitments* are copyright Church of God Ministerial Development, Cleveland,
  Tennessee. The app cites them by section and paraphrases only enough to explain what it is doing.

## Next moves

1. Show the live demo to one administrative bishop and watch which tab they open second.
2. Replace the seed with a real (anonymised) regional roster and see whether the reporting number is
   as bad as the demo assumes. It usually is.
3. Only then build auth + storage. The rules engine, which is the hard part, is already written and
   already sourced.
