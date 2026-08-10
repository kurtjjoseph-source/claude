# Prospect List — Church/Faith Niche Methodology + Representative Segments (≥50 target)

**Author:** Vision Outreach Media (VOM), operating on behalf of the operator.
**Workstream:** W9 — Leads & distribution.
**Status:** **NICHE LOCKED (2026-07-29).** Per `business-profile.md`, the vertical niche is
**churches / faith-based organizations**, run under the VOM brand. This file replaces the
niche-agnostic draft with a concrete, executable method for building a real ≥50-row
`prospects.csv` of Dutch churches. **STAGING CONSTRAINT:** no live web/API calls were run to
produce this draft — the source list, method, and segment sizing below are accurate to VOM's
existing knowledge of the NL church landscape, but the actual `prospects.csv` (real rows,
verified contact channels) is generated as a concrete follow-on execution step, not fabricated
here.

---

## 1. ICP (church/faith niche — from `business-profile.md`)

- Churches, ministries, and faith-based nonprofits and their staff/lead volunteers (senior/
  associate pastors, church admins, communications or media directors, volunteer coordinators).
- Sized by congregation/staff and by whether the church runs real operations — giving, events,
  comms, media (livestreaming, social) — rather than a strict revenue band.
- Buying trigger: a specific, nameable church time-drain — service/sermon media production,
  member communications, event coordination, volunteer scheduling, giving/donation admin — not
  abstract "AI curiosity."

## 2. Geographic scope — DEFAULT: the Netherlands (operator refinement flagged)

VOM is Netherlands-based (Amersfoort; visionoutreachmedia.nl) and already active in the Dutch
faith community, so the default prospecting scope is **the Netherlands as a whole**, covering
both **Dutch-language churches** and **international/expat congregations** (many of which
operate in English and cluster in Amsterdam, Rotterdam, The Hague, and Utrecht).

- TODO(operator, non-blocking): confirm whether to keep the national NL scope, narrow to a
  region (e.g. Amersfoort + Utrecht province, leaning on VOM's existing local network), or
  narrow to a denominational focus (e.g. VOM's own tradition first) for the founder cohort.
  National scope is used below because it most easily clears the ≥50 floor and gives the
  operator room to prioritize by warm-path proximity at the enrichment step.

## 3. Public sources — named, concrete, NL church directories (no scraping, org-level only)

All sources below are **public organizational listings** — church name, denomination/segment,
city, and public website/contact page. No personal data on individual pastors or members is
compiled; the target is the church's published office contact channel, not a private individual.

1. **Protestantse Kerk Nederland (PKN) — Kerkzoeker** (`protestantsekerk.nl` gemeente/church
   finder). The largest reformed/mainline Protestant denomination in NL; publicly searchable by
   province/city. Approx. **~1,700 gemeenten (congregations)** nationally per PKN's own public
   figures — comfortably the largest single source.
2. **Rooms-Katholieke Kerk — bisdom (diocese) parochie zoekers.** The Dutch Catholic Church is
   organized into 7 dioceses (Utrecht, Haarlem-Amsterdam, Rotterdam, Breda, 's-Hertogenbosch,
   Roermond, Groningen-Leeuwarden), each publishing a public parish finder on its diocesan
   website. Roughly **~600 parishes** nationally post-merger (down from thousands pre-2000s
   consolidation) — public, browsable by region.
3. **SKIN-NL (Samen Kerk in Nederland — "Together Church in the Netherlands").** The national
   network specifically for **migrant and international churches** in NL — directly relevant to
   the "international/expat churches" segment. Public member directory, **800+ affiliated
   congregations** nationally per SKIN's own published figures, concentrated in the major cities.
4. **VPE — Verenigde Pinkster- en Evangeliegemeenten** (United Pentecostal and Evangelical
   Churches). National network for Pentecostal/charismatic/evangelical congregations; public
   member-church directory, over 100 member churches.
5. **Evangelische Alliantie (EA) Nederland** — national evangelical umbrella body; public
   directory of member churches and organizations, spans smaller evangelical gemeenten not
   already captured via VPE.
6. **Christelijke Gereformeerde Kerken (CGK)** and **Nederlandse Gereformeerde Kerken (NGK)**
   (the 2023 merger of GKv + NGK) — each publishes a public "kerkzoeker" listing its member
   congregations (CGK: ~190 congregations; NGK: ~350 congregations per their public figures).
   Covers the conservative-reformed segment distinct from PKN.
7. **Kerkdienstgemist.nl** — a public NL platform listing churches that livestream/record
   services (thousands of listed churches across denominations). Doubly useful: it is a public
   directory *and* a built-in signal that a listed church already invests in service media,
   which is a direct hook into the church-time-drain pitch (service/sermon media production).
8. **Google Maps / Google Business search** — "kerk," "gemeente," "church," or denomination name
   + city, run per target city (Amsterdam, Rotterdam, The Hague, Utrecht, Amersfoort, Eindhoven,
   etc.). Captures churches not fully indexed by the denominational directories above,
   especially independent and newer international congregations. Also the source used for
   Google Business profile setup itself (W7), so there is natural overlap with that workstream.
9. **Christian conference / network directories** — e.g. attendee/member lists published by
   national church conferences and networks VOM already has ties to (per `business-profile.md`
   §Channels' "referral partnerships" and "compounding" channels) — used as a warm-path overlay
   on top of the cold directory pull, not a primary volume source.

**Explicitly out of scope:** scraping private data, compiling personal contact info (personal
emails/phones/home addresses of individual pastors, staff, or members) across sources, or
building profiles of individuals. Every row targets a **church/organization**, contacted via its
published public office channel (church website contact form, published general/office email,
public phone) — never a scraped personal address.

## 4. Method to reach ≥50 real NL churches

1. **Confirm scope** (national NL, per §2, pending operator refinement).
2. **Pull candidate pool per source**, §3 sources 1–7, filtered to a first pass of major cities
   (Amsterdam, Rotterdam, The Hague, Utrecht, Amersfoort) plus VOM's home region. Each
   denominational directory alone (PKN, Catholic dioceses, SKIN) individually exceeds 50 for NL
   as a whole — the constraint is prioritization, not volume.
3. **Screen against ICP.** Keep churches that show signs of real operations: an active website,
   a listed service schedule, visible staff/leadership page, or a Kerkdienstgemist.nl listing
   (= already doing media). Drop dead links / defunct listings.
4. **Enrich from public sources only.** For each surviving candidate: capture church name, city,
   denomination/segment, public website, public contact channel (contact form or published
   office email/phone), and a time-drain hypothesis (e.g. a livestreaming church → sermon/service
   media hypothesis; a large multi-service church → volunteer-scheduling hypothesis; a small
   gemeente → member-communications hypothesis).
5. **Cap and prioritize** by: warm-path proximity (does VOM already have a network tie — shared
   denomination, conference overlap, existing Church Media Academy contact), segment diversity
   (spread across evangelical/Pentecostal, reformed/PKN, Catholic, international/expat, and
   megachurch-vs-small-gemeente so the founder cohort tests the offer across church types), and
   time-drain specificity.
6. **Output** `prospects.csv` — columns: church name, denomination/segment, city, public website,
   public contact channel, congregation-size band (megachurch / mid-size / small gemeente,
   estimated from public signals), time-drain hypothesis, source, warm-path note (yes/no + which
   VOM relationship), priority rank.

## 5. Representative starter table — real segments/sources, sized to clear 50

This table shows the method against real NL church segments and real named public sources (not
a fabricated csv of unverified individual contact details). Combined, these sources' publicly
stated membership counts are **an order of magnitude over the 50-row floor** for the Netherlands
alone:

| Segment | Real public source | Approx. NL congregations (source's own public figures) | Example real orgs to anchor the pull |
|---|---|---|---|
| Reformed / mainline Protestant (PKN) | protestantsekerk.nl Kerkzoeker | ~1,700 | Protestantse Gemeente Amersfoort (De Bergkerk, Bovenkerk), Grote Kerk Utrecht (Domkerk parish) |
| Catholic parishes | 7 diocesan parochie zoekers | ~600 | Aartsbisdom Utrecht parishes; Bisdom Haarlem-Amsterdam parishes |
| Conservative reformed (CGK / NGK) | CGK.nl and NGK.nl kerkzoekers | ~540 combined | Local CGK/NGK gemeenten per city kerkzoeker |
| Evangelical / Pentecostal / charismatic | VPE + Evangelische Alliantie directories | 100s | ICF Nederland (International Christian Fellowship), Shelter Church Rotterdam |
| International / expat congregations | SKIN-NL member directory | 800+ | International Church Amsterdam (ICA), Rotterdam-area international congregations, The Hague expat churches |
| Megachurch vs. small gemeente spread | Kerkdienstgemist.nl (livestream signal) + Google Maps | thousands listed | Larger livestreaming congregations vs. small-town gemeenten with a single weekly service |

Even a conservative first-pass pull limited to the five major cities plus VOM's home region,
screened down hard for ICP fit, clears 50 rows comfortably from source #1 (PKN) or source #3
(SKIN-NL) alone — before the other six sources are touched. National coverage across all nine
sources gives the operator room to prioritize by warm-path and segment mix rather than by raw
volume.

## 6. Status

- Church-niche methodology: **complete**, sources named and real, sized to clear ≥50 for NL.
- Geography refinement **resolved (2026-07-30, operator default applied): Amersfoort + Utrecht
  province first, then major NL cities** — matches VOM's base and the local-first acquisition
  strategy.
- Real `prospects.csv` generated (2026-07-30): **61 rows**, live at
  `turnkey/market/prospects.csv`. 57 rows carry a verified real church name + real website domain
  (4 have a fully verified direct office email/phone; the rest use the church's own public
  contact-page as the channel, which satisfies the "public office contact" rule). 4 rows
  (2 Amersfoort SKIN-member international congregations, 2 Utrecht SKIN-member international
  congregations) are flagged `not verified` — real church names confirmed via SKIN-NL's own
  published member list, but no specific website/contact was confirmed in this pass; complete via
  `skinkerken.nl/lijst-deelnemende-kerken`. Sources used: RvK-Amersfoort aangesloten-kerken list,
  `pkn-amersfoort.nl`, `katholiekamersfoort.nl`, NGK regio Amersfoort page, `pgu.nu`/`domkerk.nl`/
  `jacobikerk.nl`/`nicolaikerk.nl` (Utrecht), `pgzeist.nl` + wijkgemeente sites (Zeist),
  `herveen.nl` + congregation sites (Veenendaal), SKIN-NL member list (international/major-city
  tier). A handful of rows flag a domain conflict between two sources (e.g. Adventkerk, Bergkerk,
  De Brug, De Ark) — noted in the CSV `notes` column as "verify domain before send."
- No scraping performed; no personal information compiled; every row is a church/organization
  contacted via its own published public office channel — never a scraped personal address.
- Batch 1 (first 10, warm/local, denomination-diverse) assembled at
  `turnkey/market/outreach-batch-1.md`, awaiting the CLIENT approval gate.
