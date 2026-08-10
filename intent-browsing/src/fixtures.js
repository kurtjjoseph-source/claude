/* ============================================================================
   fixtures.js — intent-based browsing prototype (Vision Outreach Media)
   Piece 3 of 6. Loaded FIRST. Defines: window.IB, IB.bus, IB.fixtures.

   EVERYTHING IN THIS FILE IS SCRIPTED DEMONSTRATION DATA.
   No carrier, vendor, contractor, register entry, price, rating or review
   below refers to a real organisation. Company names are invented so that no
   real business has a price or a score asserted about it. Nothing here is
   retrieved; there is no network call anywhere in this prototype.
   ========================================================================== */
(function (w) {
  'use strict';

  var IB = (w.IB = w.IB || {});

  /* --------------------------------------------------------------------------
     THE SHARED BUS — trivial synchronous pub/sub (module contract)
     IB.bus.on(evt, fn) -> off()      IB.bus.emit(evt, payload) -> void
     ------------------------------------------------------------------------ */
  if (!IB.bus) {
    var channels = {};
    IB.bus = {
      on: function (evt, fn) {
        if (typeof evt !== 'string' || typeof fn !== 'function') { return function () {}; }
        var list = channels[evt] || (channels[evt] = []);
        list.push(fn);
        return function off() {
          var i = list.indexOf(fn);
          if (i > -1) { list.splice(i, 1); }
        };
      },
      emit: function (evt, payload) {
        var list = channels[evt];
        if (!list || !list.length) { return; }
        var snapshot = list.slice(), i;
        for (i = 0; i < snapshot.length; i++) { snapshot[i](payload); }
      }
    };
  }

  /* --------------------------------------------------------------------------
     SOURCES — the provenance registry (primitive 4).
     Every claim on the surface points at one of these by id. `kind` is the
     TYPE of source, which is what the chip should communicate: an aggregator
     is not a public register is not somebody's review.
     ------------------------------------------------------------------------ */
  var SCRIPTED = 'Scripted demonstration data assembled by Vision Outreach Media. Not a live feed, not retrieved, not a real quote.';

  var sources = {
    'agg-fare': {
      id: 'agg-fare',
      name: 'Fare aggregator (scripted)',
      kind: 'aggregator',
      note: SCRIPTED + ' Fares are invented and attached to invented carriers.'
    },
    'carrier-page': {
      id: 'carrier-page',
      name: 'Carrier fare page (scripted)',
      kind: 'vendor page',
      note: SCRIPTED + ' Baggage and change-fee rules belong to invented carriers.'
    },
    'itin-builder': {
      id: 'itin-builder',
      name: 'Multi-carrier itinerary builder (scripted)',
      kind: 'aggregator',
      note: SCRIPTED + ' Connections are constructed, not booked or priced live.'
    },
    'airport-ops': {
      id: 'airport-ops',
      name: 'Airport operations bulletin (scripted)',
      kind: 'operations bulletin',
      note: SCRIPTED + ' No real airport has published any of this.'
    },
    'traveller-corpus': {
      id: 'traveller-corpus',
      name: 'Traveller review corpus (scripted)',
      kind: 'review corpus',
      note: SCRIPTED + ' The reviews are written for the demonstration; nobody wrote them about anything real.'
    },
    'vendor-pricing': {
      id: 'vendor-pricing',
      name: 'Vendor pricing page (scripted)',
      kind: 'vendor page',
      note: SCRIPTED + ' Seat prices belong to invented software vendors.'
    },
    'vendor-docs': {
      id: 'vendor-docs',
      name: 'Vendor documentation (scripted)',
      kind: 'vendor documentation',
      note: SCRIPTED + ' Capability and contract statements describe invented products.'
    },
    'sw-directory': {
      id: 'sw-directory',
      name: 'Software directory listing (scripted)',
      kind: 'aggregator',
      note: SCRIPTED + ' A stand-in for the category directories a buyer would otherwise open in ten tabs.'
    },
    'buyer-corpus': {
      id: 'buyer-corpus',
      name: 'Buyer review corpus (scripted)',
      kind: 'review corpus',
      note: SCRIPTED + ' Counts and complaints are invented and attach to invented vendors.'
    },
    'trade-register': {
      id: 'trade-register',
      name: 'Trade register extract (scripted)',
      kind: 'public register',
      note: SCRIPTED + ' Shaped like a chamber-of-commerce extract, but no registration number is asserted and no real entry is reproduced.'
    },
    'trades-dir': {
      id: 'trades-dir',
      name: 'Local trades directory (scripted)',
      kind: 'aggregator',
      note: SCRIPTED + ' Firms, distances and survey slots are invented.'
    },
    'homeowner-corpus': {
      id: 'homeowner-corpus',
      name: 'Homeowner review corpus (scripted)',
      kind: 'review corpus',
      note: SCRIPTED + ' Ratings are invented and attach to invented firms; no real contractor is scored here.'
    },
    'contractor-page': {
      id: 'contractor-page',
      name: "Contractor's own page (scripted)",
      kind: 'vendor page',
      note: SCRIPTED + ' Warranty and cover statements belong to invented firms.'
    },
    'trade-bulletin': {
      id: 'trade-bulletin',
      name: 'Roofing trade bulletin (scripted)',
      kind: 'trade bulletin',
      note: SCRIPTED + ' Seasonal workload notes are written for the demonstration.'
    },
    'operator-record': {
      id: 'operator-record',
      name: "The operator's own record (VOM)",
      kind: "operator's record",
      note: 'Written by Vision Outreach Media for this demonstration: arithmetic, drafts and caveats produced on this page from the scripted data above.'
    }
  };

  /* --------------------------------------------------------------------------
     INTENT 1 — flights-lisbon
     Sampled itineraries. Times are local; Lisbon runs one hour behind
     Amsterdam year-round, so a 3h05 block leaves at 06:20 and lands at 08:25.
     ------------------------------------------------------------------------ */
  var flightData = {
    asOf: 'Scripted fare snapshot — no live pricing is retrieved',
    fares: {
      February: [
        { flight: 'BW77',  carrier: 'Bluewing',       dates: '18–25 Feb',    out: '06:25 → 08:30', price: 96,  stops: 0, via: '—',                  dur: '3h 05m', layover: null },
        { flight: 'TG421', carrier: 'Tagus Air',      dates: '11–18 Feb',    out: '07:10 → 09:15', price: 118, stops: 0, via: '—',                  dur: '3h 05m', layover: null },
        { flight: 'MD208', carrier: 'Meridian Air',   dates: '4–11 Feb',     out: '12:40 → 14:45', price: 134, stops: 0, via: '—',                  dur: '3h 05m', layover: null },
        { flight: 'NB330', carrier: 'Northbound',     dates: '21–28 Feb',    out: '15:20 → 17:25', price: 152, stops: 0, via: '—',                  dur: '3h 05m', layover: null },
        { flight: 'MD214', carrier: 'Meridian Air',   dates: '25 Feb–4 Mar', out: '19:15 → 21:20', price: 169, stops: 0, via: '—',                  dur: '3h 05m', layover: null },
        { flight: 'VA613', carrier: 'Vega Atlantic',  dates: '7–14 Feb',     out: '09:05 → 14:05', price: 89,  stops: 1, via: 'Porto',              dur: '6h 00m', layover: { min: 95, at: 'Porto' } },
        { flight: 'VA648', carrier: 'Vega Atlantic',  dates: '14–21 Feb',    out: '06:00 → 13:20', price: 78,  stops: 2, via: 'Brussels, Porto',    dur: '8h 20m', layover: { min: 55, at: 'Brussels' } }
      ],
      March: [
        { flight: 'BW81',  carrier: 'Bluewing',       dates: '3–10 Mar',     out: '06:20 → 08:25', price: 149, stops: 0, via: '—',                  dur: '3h 05m', layover: null },
        { flight: 'BW95',  carrier: 'Bluewing',       dates: '28 Mar–4 Apr', out: '11:15 → 13:20', price: 176, stops: 0, via: '—',                  dur: '3h 05m', layover: null },
        { flight: 'TG415', carrier: 'Tagus Air',      dates: '7–14 Mar',     out: '07:05 → 09:10', price: 184, stops: 0, via: '—',                  dur: '3h 05m', layover: null },
        { flight: 'MD210', carrier: 'Meridian Air',   dates: '14–21 Mar',    out: '13:00 → 15:05', price: 197, stops: 0, via: '—',                  dur: '3h 05m', layover: null },
        { flight: 'NB334', carrier: 'Northbound',     dates: '21–28 Mar',    out: '16:35 → 18:40', price: 212, stops: 0, via: '—',                  dur: '3h 05m', layover: null },
        { flight: 'TG437', carrier: 'Tagus Air',      dates: '24–31 Mar',    out: '20:10 → 22:15', price: 229, stops: 0, via: '—',                  dur: '3h 05m', layover: null },
        { flight: 'VA617', carrier: 'Vega Atlantic',  dates: '10–17 Mar',    out: '08:40 → 13:10', price: 138, stops: 1, via: 'Porto',              dur: '5h 30m', layover: { min: 65, at: 'Porto' } },
        { flight: 'VA652', carrier: 'Vega Atlantic',  dates: '17–24 Mar',    out: '05:55 → 13:35', price: 121, stops: 2, via: 'Brussels, Porto',    dur: '8h 40m', layover: { min: 50, at: 'Brussels' } }
      ],
      April: [
        { flight: 'BW99',  carrier: 'Bluewing',       dates: '21–28 Apr',    out: '14:10 → 16:15', price: 199, stops: 0, via: '—',                  dur: '3h 05m', layover: null },
        { flight: 'MD216', carrier: 'Meridian Air',   dates: '18–25 Apr',    out: '12:55 → 15:00', price: 205, stops: 0, via: '—',                  dur: '3h 05m', layover: null },
        { flight: 'NB338', carrier: 'Northbound',     dates: '25 Apr–2 May', out: '16:40 → 18:45', price: 233, stops: 0, via: '—',                  dur: '3h 05m', layover: null },
        { flight: 'TG419', carrier: 'Tagus Air',      dates: '4–11 Apr',     out: '07:05 → 09:10', price: 241, stops: 0, via: '—',                  dur: '3h 05m', layover: null },
        { flight: 'BW83',  carrier: 'Bluewing',       dates: '11–18 Apr',    out: '06:15 → 08:20', price: 268, stops: 0, via: '—',                  dur: '3h 05m', layover: null },
        { flight: 'VA621', carrier: 'Vega Atlantic',  dates: '8–15 Apr',     out: '08:35 → 13:35', price: 187, stops: 1, via: 'Porto',              dur: '6h 00m', layover: { min: 80, at: 'Porto' } },
        { flight: 'VA657', carrier: 'Vega Atlantic',  dates: '14–21 Apr',    out: '05:50 → 13:10', price: 166, stops: 2, via: 'Brussels, Porto',    dur: '8h 20m', layover: { min: 70, at: 'Porto' } }
      ]
    },
    carriers: {
      'Bluewing':      { cabin: '40 × 30 × 20 cm, included', hold: '20 kg — €32 each way', holdFee: 32, seat: '€6–€18',  change: '€45 + fare difference' },
      'Tagus Air':     { cabin: '1 × 8 kg, included',        hold: '23 kg — €38 each way', holdFee: 38, seat: '€9–€22',  change: '€55 + fare difference' },
      'Meridian Air':  { cabin: '1 × 10 kg, included',       hold: '23 kg — €30 each way', holdFee: 30, seat: '€8–€20',  change: '€40 + fare difference' },
      'Northbound':    { cabin: '1 × 7 kg, included',        hold: '20 kg — €35 each way', holdFee: 35, seat: '€10–€24', change: '€60 + fare difference' },
      'Vega Atlantic': { cabin: '1 × 8 kg, included',        hold: '23 kg — €28 each way', holdFee: 28, seat: '€5–€16',  change: '€50 + fare difference' }
    },
    /* The departure-time bucket the baggage note describes. Named here so the
       threshold in the sentence is a fixture value, not a number invented in
       the prose. */
    earlyCutoff: '07:00',

    /* Length of the courtesy hold the staged action would request. A parameter
       of the proposed action, so it lives in the fixture rather than being a
       number the prose invents. */
    holdHours: 24,

    /* The connection standard the operations bulletin actually publishes. It
       is rendered as its own attributed claim in the risk pane whenever the
       shortlist contains a connection, so anything citing it is citing text
       the reader can see. `minMinutes` is the figure that text states. */
    connectionStandard: {
      minMinutes: 90,
      text: 'Standing advice in this bulletin for Amsterdam–Lisbon connections is to allow at least 90 minutes between flights. Below that the sampled handlers treat a delayed inbound leg as a missed connection rather than a late one, which moves the passenger to the next day rather than the next flight.'
    },

    /* Each passage states something the sampled table above actually supports —
       counts, times and date ranges are checkable against `fares`. */
    monthRisk: {
      February: 'The February sample is the cheapest of the three months — five direct rotations from €96 — and the most spread out, running from 06:25 to 19:15. The trade-off is that no two sampled rotations share a date range, so a missed outbound means rebooking onto a different week rather than onto a different flight.',
      March: 'Two of the six sampled direct March rotations leave before 07:30, at 06:20 and 07:05, and the cheapest direct fare in the sample is one of them. The next direct departure is more than four hours later, so a delay in that early pair has no same-day alternative at a comparable fare — and every sampled fare at this level is non-refundable.',
      April: 'The April sample straddles the Easter week and is the dearest of the three months: only one sampled direct rotation is under €200, against four in March and five in February. The two cheapest direct rotations are both dated in the second half of the month, after the holiday rather than during it.'
    }
  };

  /* --------------------------------------------------------------------------
     INTENT 2 — crm-compare
     Seven invented vendors. `tier10` is the per-seat price from 10 seats up;
     null means the list price does not break. Annual billing is applied as a
     15 per cent reduction on the per-seat price, rounded to whole euros.
     ------------------------------------------------------------------------ */
  var crmData = {
    asOf: 'Scripted vendor sample — list prices are invented, not quoted',
    annualDiscount: 0.85,
    vendors: [
      {
        id: 'alder', name: 'Alder CRM', perSeat: 22, tier10: null, minSeats: 1,
        caps: { inbox: true, quotes: false, btw: false },
        setup: 'Half a day, self-serve', exportData: 'CSV, self-serve', support: 'Email, 1 working day', trial: '14 days',
        migration: null, note: 'Cheapest sampled vendor that still carries a shared inbox.'
      },
      {
        id: 'kadans', name: 'Kadans Werkbank', perSeat: 34, tier10: null, minSeats: 3,
        caps: { inbox: true, quotes: true, btw: true },
        setup: 'Two days with a guided import', exportData: 'CSV and JSON, self-serve', support: 'Email and phone, same working day', trial: '30 days',
        migration: '€250 one-off import fee', note: 'Only sampled vendor under €40 with Dutch BTW invoicing built in.'
      },
      {
        id: 'veerhuis', name: 'Veerhuis Relatiebeheer', perSeat: 41, tier10: null, minSeats: 4,
        caps: { inbox: true, quotes: true, btw: true },
        setup: 'Two days, import done by the vendor', exportData: 'CSV, on request', support: 'Phone, same working day', trial: '21 days',
        migration: null, note: 'Priced per seat with a four-seat floor; smaller teams cannot buy it.'
      },
      {
        id: 'halyard', name: 'Halyard Sales Cloud', perSeat: 45, tier10: 39, minSeats: 5,
        caps: { inbox: true, quotes: true, btw: false },
        setup: 'A week with a partner', exportData: 'API only', support: 'Ticketing, 2 working days', trial: 'Demo call, no free trial',
        migration: '€400 one-off onboarding fee', note: 'Plan floor is five seats; the price breaks again from ten.'
      },
      {
        id: 'pergola', name: 'Pergola CRM', perSeat: 49, tier10: null, minSeats: 2,
        caps: { inbox: false, quotes: true, btw: true },
        setup: 'One day, self-serve', exportData: 'CSV, self-serve', support: 'Email, 2 working days', trial: '14 days',
        migration: null, note: 'Strong on quoting, no shared inbox at any tier in this sample.'
      },
      {
        id: 'marktkraam', name: 'Marktkraam CRM', perSeat: 58, tier10: 52, minSeats: 1,
        caps: { inbox: true, quotes: true, btw: true },
        setup: 'Three days, guided', exportData: 'CSV and JSON, self-serve', support: 'Phone, same working day', trial: '7 days',
        migration: null, note: 'Carries every sampled capability and prices above the cap to do it.'
      },
      {
        id: 'steenbok', name: 'Steenbok Lite', perSeat: 14, tier10: null, minSeats: 1,
        caps: { inbox: false, quotes: false, btw: false },
        setup: 'An hour, self-serve', exportData: 'CSV, self-serve', support: 'Community forum only', trial: 'Free tier, no card',
        migration: null, note: 'A contact list with reminders rather than a CRM; sampled for the floor price.'
      }
    ],
    capLabels: { inbox: 'Shared inbox', quotes: 'Quote builder', btw: 'Dutch BTW invoicing' },
    /* prose forms, so sentences read like sentences and BTW keeps its capitals */
    capPhrase: { inbox: 'shared inbox', quotes: 'quote builder', btw: 'Dutch BTW invoicing' },
    mustShort: {
      'Shared inbox': 'shared inbox',
      'Quote builder': 'quote builder',
      'Dutch BTW invoicing': 'Dutch BTW invoicing',
      'No requirement': 'no capability requirement'
    },
    mustPhrase: {
      'Shared inbox': 'a shared inbox',
      'Quote builder': 'a quote builder',
      'Dutch BTW invoicing': 'Dutch BTW invoicing',
      'No requirement': 'no required capability'
    },
    mustHaveMap: {
      'Shared inbox': 'inbox',
      'Quote builder': 'quotes',
      'Dutch BTW invoicing': 'btw',
      'No requirement': null
    }
  };

  /* --------------------------------------------------------------------------
     INTENT 3 — roof-repair
     Eight invented firms around Amersfoort. `day` is working days-and-all
     offset from the scripted "as of" date, Saturday 8 August 2026.
     ------------------------------------------------------------------------ */
  var roofData = {
    asOf: 'Scripted snapshot, 8 August 2026 — availability is invented',
    asOfShort: '8 Aug 2026',
    windows: {
      'This week':      { days: 6,  until: '14 August 2026' },
      'This month':     { days: 23, until: '31 August 2026' },
      'Next 3 months':  { days: 84, until: '31 October 2026' }
    },
    workMap: {
      'Flat roof (bitumen)': 'flat',
      'Pitched roof (tiles)': 'pitched',
      'Any': null
    },
    /* prose form of the roof-type constraint, for sentences rather than headings */
    workPhrase: {
      'Flat roof (bitumen)': 'a flat bitumen roof',
      'Pitched roof (tiles)': 'a pitched tiled roof',
      'Any': 'any roof type'
    },
    /* The job itself has to follow the roof-type constraint, or the drafted
       request describes work the shortlist was not filtered for. `entity` is
       the noun in the intent object, `draft` the clause in the written
       request, `script` the clause in the spoken version. */
    jobPhrase: {
      'Flat roof (bitumen)': {
        entity: 'Leak at the flat rear-extension seam',
        draft: 'a leak at the seam of the flat bitumen roof over the rear extension',
        script: 'a seam leak on the flat bitumen roof over the rear extension'
      },
      'Pitched roof (tiles)': {
        entity: 'Slipped tiles on the pitched main roof',
        draft: 'water coming in through the pitched tiled main roof, where tiles have slipped near the ridge',
        script: 'slipped tiles near the ridge of the pitched main roof'
      },
      'Any': {
        entity: 'Roof leak, source not yet placed',
        draft: 'a roof leak we have not yet been able to place — it may be the flat bitumen roof over the rear extension or the pitched tiled main roof',
        script: 'a roof leak we have not yet placed, either the flat extension roof or the pitched main roof'
      }
    },
    roofers: [
      {
        id: 'van-rhenen', name: 'Dakwerken Van Rhenen', base: 'Amersfoort (Soesterkwartier)', km: 3,
        day: 4, date: 'Wed 12 Aug', types: ['flat', 'pitched'], typeLabel: 'Flat + pitched',
        form: 'Sole trader', since: '2014', cover: '€2.5m liability', warranty: '10-year workmanship', warrantyYears: 10,
        quoteDays: 3, jobs: 14, replies: '1 working day', rating: '4.6 / 5'
      },
      {
        id: 'zonneveld', name: 'Zonneveld Dakdekkers', base: 'Soest', km: 9,
        day: 5, date: 'Thu 13 Aug', types: ['flat', 'pitched'], typeLabel: 'Flat + pitched',
        form: 'Private company', since: '2009', cover: '€5m liability', warranty: '5-year workmanship', warrantyYears: 5,
        quoteDays: 5, jobs: 22, replies: '2 working days', rating: '4.2 / 5'
      },
      {
        id: 'eemdak', name: 'Eemdak Onderhoud', base: 'Hoevelaken', km: 7,
        day: 11, date: 'Wed 19 Aug', types: ['flat'], typeLabel: 'Flat only',
        form: 'Partnership', since: '2017', cover: '€2.5m liability', warranty: '8-year workmanship', warrantyYears: 8,
        quoteDays: 2, jobs: 9, replies: '1 working day', rating: '4.7 / 5'
      },
      {
        id: 'veluwe', name: 'Veluwe Dak & Zink', base: 'Barneveld', km: 21,
        day: 6, date: 'Fri 14 Aug', types: ['flat', 'pitched'], typeLabel: 'Flat + pitched',
        form: 'Private company', since: '2001', cover: '€5m liability', warranty: '10-year workmanship', warrantyYears: 10,
        quoteDays: 4, jobs: 31, replies: '3 working days', rating: '4.4 / 5'
      },
      {
        id: 'stadsdak', name: 'Stadsdak Utrecht', base: 'Utrecht', km: 23,
        day: 3, date: 'Tue 11 Aug', types: ['flat'], typeLabel: 'Flat only',
        form: 'Private company', since: '2019', cover: '€2.5m liability', warranty: '5-year workmanship', warrantyYears: 5,
        quoteDays: 2, jobs: 18, replies: 'Same working day', rating: '3.9 / 5'
      },
      {
        id: 'bouwmeester', name: 'Bouwmeester Dakservice', base: 'Leusden', km: 6,
        day: 19, date: 'Thu 27 Aug', types: ['pitched'], typeLabel: 'Pitched only',
        form: 'Sole trader', since: '2011', cover: '€1m liability', warranty: '12-year workmanship', warrantyYears: 12,
        quoteDays: 3, jobs: 12, replies: '2 working days', rating: '4.5 / 5'
      },
      {
        id: 'rietveld', name: 'Rietveld Daken', base: 'Woudenberg', km: 12,
        day: 26, date: 'Thu 3 Sep', types: ['pitched'], typeLabel: 'Pitched only',
        form: 'Partnership', since: '1998', cover: '€5m liability', warranty: '15-year workmanship', warrantyYears: 15,
        quoteDays: 5, jobs: 27, replies: '4 working days', rating: '4.8 / 5'
      },
      {
        id: 'spakenburg', name: 'Spakenburg Dakwerk', base: 'Bunschoten', km: 13,
        day: 32, date: 'Wed 9 Sep', types: ['flat'], typeLabel: 'Flat only',
        form: 'Sole trader', since: '2021', cover: '€1m liability', warranty: '6-year workmanship', warrantyYears: 6,
        quoteDays: 4, jobs: 6, replies: '2 working days', rating: '4.1 / 5'
      }
    ]
  };

  /* --------------------------------------------------------------------------
     THE THREE SEEDED INTENTS.
     Each carries its base IntentObject (the shape in the brief) plus `data`,
     the pool resolve.js filters against when a constraint is edited.
     ------------------------------------------------------------------------ */
  var intents = {
    'flights-lisbon': {
      id: 'flights-lisbon',
      sentence: 'find a flight to Lisbon in March under €200',
      goal: 'Book one return flight, Amsterdam → Lisbon',
      constraints: [
        { id: 'budget', label: 'Budget', value: '200', unit: 'EUR', type: 'number', options: null, min: 0, max: 2000, step: 10, hint: 'Return fare per traveller, all-in' },
        { id: 'month',  label: 'When',   value: 'March', unit: null, type: 'choice', options: ['February', 'March', 'April'], hint: 'Which sampled month to fly in' },
        { id: 'stops',  label: 'Stops',  value: 'Direct', unit: null, type: 'choice', options: ['Direct', '≤1 stop', 'Any'], hint: 'How much connecting you will accept' }
      ],
      entities: [
        { id: 'ams',   label: 'Amsterdam', kind: 'origin' },
        { id: 'lis',   label: 'Lisbon',    kind: 'destination' },
        { id: 'party', label: 'Return, 1 traveller', kind: 'party' }
      ],
      success: { label: 'A bookable fare under €200 exists on a chosen date', met: true },
      panes: ['fares', 'calendar', 'baggage', 'risk'],
      staged: {
        label: 'Hold the cheapest qualifying fare for 24 hours',
        detail: 'Drafts a 24-hour courtesy hold on the cheapest itinerary that meets every constraint.',
        consequence: 'Nothing is sent, no card is charged, no seat is reserved. This is a scripted demonstration.'
      },
      data: flightData
    },

    'crm-compare': {
      id: 'crm-compare',
      sentence: 'compare three CRMs under €50 a seat for a 4-person team',
      goal: 'Shortlist three CRMs a 4-person team can actually buy',
      constraints: [
        { id: 'seat',    label: 'Per seat',  value: '50', unit: 'EUR / month', type: 'number', options: null, min: 0, max: 500, step: 5, hint: 'Cap on the price actually paid per seat' },
        { id: 'team',    label: 'Team size', value: '4',  unit: 'seats', type: 'number', options: null, min: 1, max: 250, step: 1, hint: 'Seats to be licensed' },
        { id: 'must',    label: 'Must have', value: 'Shared inbox', unit: null, type: 'choice', options: ['Shared inbox', 'Quote builder', 'Dutch BTW invoicing', 'No requirement'], hint: 'A capability the vendor has to carry' },
        { id: 'billing', label: 'Billing',   value: 'Monthly', unit: null, type: 'choice', options: ['Monthly', 'Annual (−15%)'], hint: 'Annual billing takes 15% off the per-seat price' }
      ],
      entities: [
        { id: 'team-ent', label: '4-person sales team', kind: 'buyer' },
        { id: 'market',   label: 'Netherlands — BTW invoicing', kind: 'market' },
        { id: 'category', label: 'CRM and pipeline software', kind: 'category' }
      ],
      success: { label: 'Three vendors meet every constraint at the chosen team size', met: true },
      panes: ['crm-matrix', 'crm-cost', 'crm-caps', 'crm-verdict'],
      staged: {
        label: 'Prepare trial sign-ups for the shortlist',
        detail: 'Drafts one trial request per shortlisted vendor.',
        consequence: 'No account is created, no email address is submitted and no card is entered. This is a scripted demonstration.'
      },
      data: crmData
    },

    'roof-repair': {
      id: 'roof-repair',
      sentence: 'find a roofer in Amersfoort who can quote this month',
      goal: 'Get a roofer to the property and a written quotation in hand',
      constraints: [
        { id: 'timeframe', label: 'Survey by', value: 'This month', unit: null, type: 'choice', options: ['This week', 'This month', 'Next 3 months'], hint: 'How soon somebody has to stand on the roof' },
        { id: 'radius',    label: 'Travel radius', value: '15', unit: 'km', type: 'number', options: null, min: 1, max: 60, step: 1, hint: 'Distance from Amersfoort centre' },
        { id: 'work',      label: 'Roof type', value: 'Flat roof (bitumen)', unit: null, type: 'choice', options: ['Flat roof (bitumen)', 'Pitched roof (tiles)', 'Any'], hint: 'What the firm has to be able to work on' }
      ],
      entities: [
        { id: 'amersfoort', label: 'Amersfoort', kind: 'location' },
        { id: 'property',   label: 'Terraced house, flat rear extension', kind: 'property' },
        { id: 'job',        label: 'Leak at the rear-extension seam', kind: 'job' }
      ],
      success: { label: 'At least one roofer can survey the property inside the window', met: true },
      panes: ['roofers', 'roof-window', 'roof-register', 'roof-quote'],
      staged: {
        label: 'Request quotations from the qualifying roofers',
        detail: 'Prepares one request for quotation per qualifying firm, addressed and filled in.',
        consequence: 'Nothing is sent. No message leaves this page, no appointment is booked, no deposit or payment of any kind is made.',
        gate: true
      },
      data: roofData
    }
  };

  /* --------------------------------------------------------------------------
     PANES — keyed by pane id, in the shape workspace.js renders.
     kind: "table" (claims are rows of cells) | "list" (claims are text items)
           "stat" (claims are key/value facts) | "note" (attributed passage)

     Claims below are the state produced by each intent's BASE constraints.
     resolve.js recomputes them in place on every resolve and every edit — the
     row you see is always the row the current constraints actually allow.
     ------------------------------------------------------------------------ */
  var panes = {

    /* ---- flights-lisbon --------------------------------------------------- */
    'fares': {
      id: 'fares',
      title: 'Fares matching the constraints',
      kind: 'table',
      source: { id: 'agg-fare', name: 'Fare aggregator (scripted)', detail: 'Sampled fare table, one row per itinerary', when: 'scripted' },
      alternates: ['fares-alt', 'fares-multi'],
      columns: ['Flight', 'Dates', 'Outbound', 'Fare', 'Stops'],
      claims: [
        { cells: ['BW81 · Bluewing', '3–10 Mar', '06:20 → 08:25', '€149', 'Direct'], sourceId: 'agg-fare' },
        { cells: ['BW95 · Bluewing', '28 Mar–4 Apr', '11:15 → 13:20', '€176', 'Direct'], sourceId: 'agg-fare' },
        { cells: ['TG415 · Tagus Air', '7–14 Mar', '07:05 → 09:10', '€184', 'Direct'], sourceId: 'agg-fare' },
        { cells: ['MD210 · Meridian Air', '14–21 Mar', '13:00 → 15:05', '€197', 'Direct'], sourceId: 'agg-fare' }
      ]
    },
    'fares-alt': {
      id: 'fares-alt',
      title: 'The same fares, read off the carriers’ own pages',
      kind: 'table',
      source: { id: 'carrier-page', name: 'Carrier fare page (scripted)', detail: 'What each carrier states about its own fare', when: 'scripted' },
      alternates: ['fares'],
      columns: ['Flight', 'Fare', 'Change fee', 'Seat choice', 'Hold bag'],
      claims: [
        { cells: ['BW81 · Bluewing', '€149', '€45 + fare difference', '€6–€18', '20 kg — €32 each way'], sourceId: 'carrier-page' },
        { cells: ['BW95 · Bluewing', '€176', '€45 + fare difference', '€6–€18', '20 kg — €32 each way'], sourceId: 'carrier-page' },
        { cells: ['TG415 · Tagus Air', '€184', '€55 + fare difference', '€9–€22', '23 kg — €38 each way'], sourceId: 'carrier-page' },
        { cells: ['MD210 · Meridian Air', '€197', '€40 + fare difference', '€8–€20', '23 kg — €30 each way'], sourceId: 'carrier-page' }
      ]
    },
    'fares-multi': {
      id: 'fares-multi',
      title: 'Itineraries including connections',
      kind: 'table',
      source: { id: 'itin-builder', name: 'Multi-carrier itinerary builder (scripted)', detail: 'Constructed itineraries, connections included', when: 'scripted' },
      alternates: ['fares'],
      columns: ['Flight', 'Dates', 'Total time', 'Fare', 'Connection'],
      claims: [
        { cells: ['VA652 · Vega Atlantic', '17–24 Mar', '8h 40m', '€121', 'via Brussels, Porto'], sourceId: 'itin-builder' },
        { cells: ['VA617 · Vega Atlantic', '10–17 Mar', '5h 30m', '€138', 'via Porto'], sourceId: 'itin-builder' },
        { cells: ['BW81 · Bluewing', '3–10 Mar', '3h 05m', '€149', 'Direct'], sourceId: 'itin-builder' },
        { cells: ['BW95 · Bluewing', '28 Mar–4 Apr', '3h 05m', '€176', 'Direct'], sourceId: 'itin-builder' },
        { cells: ['TG415 · Tagus Air', '7–14 Mar', '3h 05m', '€184', 'Direct'], sourceId: 'itin-builder' },
        { cells: ['MD210 · Meridian Air', '14–21 Mar', '3h 05m', '€197', 'Direct'], sourceId: 'itin-builder' }
      ]
    },
    'calendar': {
      id: 'calendar',
      title: 'What the qualifying fares add up to',
      kind: 'stat',
      source: { id: 'agg-fare', name: 'Fare aggregator (scripted)', detail: 'Figures computed on this page from the sampled table', when: 'scripted' },
      alternates: ['calendar-alt'],
      claims: [
        { key: 'Cheapest qualifying fare', label: 'Cheapest qualifying fare', value: '€149 · Bluewing BW81, 3–10 Mar', sourceId: 'agg-fare' },
        { key: 'Qualifying itineraries', label: 'Qualifying itineraries', value: '4 of 8 sampled for March', sourceId: 'agg-fare' },
        { key: 'Median qualifying fare', label: 'Median qualifying fare', value: '€180', sourceId: 'operator-record' },
        { key: 'Fare spread on the shortlist', label: 'Fare spread on the shortlist', value: '€149 – €197', sourceId: 'operator-record' },
        { key: 'Cheapest month at “Direct”', label: 'Cheapest month at “Direct”', value: 'February — €96 on Bluewing BW77', sourceId: 'agg-fare' },
        { key: 'Sample', label: 'Sample', value: 'Scripted fare snapshot — no live pricing is retrieved', sourceId: 'operator-record' }
      ]
    },
    'calendar-alt': {
      id: 'calendar-alt',
      title: 'Fare spread across the three sampled months',
      kind: 'list',
      source: { id: 'agg-fare', name: 'Fare aggregator (scripted)', detail: 'The whole sample, before constraints are applied', when: 'scripted' },
      alternates: ['calendar'],
      claims: [
        { text: 'February is the cheapest sampled month: seven itineraries from €78, of which five are direct.', sourceId: 'agg-fare' },
        { text: 'March sits in the middle: eight itineraries from €121, and the three cheapest direct rotations all leave before 11:30.', sourceId: 'agg-fare' },
        { text: 'April is the dearest sampled month: seven itineraries from €166, with only one direct fare below €200.', sourceId: 'agg-fare' },
        { text: 'The sample holds 22 itineraries across three months. It is a fixed scripted table, not a live search, and it does not move while you read it.', sourceId: 'operator-record' }
      ]
    },
    'baggage': {
      id: 'baggage',
      title: 'What the fare does and does not include',
      kind: 'list',
      source: { id: 'carrier-page', name: 'Carrier fare page (scripted)', detail: 'One item per carrier still in the shortlist', when: 'scripted' },
      alternates: ['baggage-alt'],
      claims: [
        { text: 'Bluewing — cabin bag 40 × 30 × 20 cm, included; hold bag 20 kg — €32 each way; seat choice €6–€18.', sourceId: 'carrier-page' },
        { text: 'Tagus Air — cabin bag 1 × 8 kg, included; hold bag 23 kg — €38 each way; seat choice €9–€22.', sourceId: 'carrier-page' },
        { text: 'Meridian Air — cabin bag 1 × 10 kg, included; hold bag 23 kg — €30 each way; seat choice €8–€20.', sourceId: 'carrier-page' },
        { text: 'Sampled travellers report cabin-bag sizing enforced at the gate rather than at the desk on the pre-07:00 departures. One itinerary in this shortlist leaves before 07:00: Bluewing BW81 at 06:20.', sourceId: 'traveller-corpus' },
        { text: 'None of the fares above includes a hold bag. Adding one both ways on the cheapest qualifying fare costs €64 with Bluewing, taking it from €149 to €213 return.', sourceId: 'operator-record' }
      ]
    },
    'baggage-alt': {
      id: 'baggage-alt',
      title: 'Fee grid for the shortlisted carriers',
      kind: 'table',
      source: { id: 'carrier-page', name: 'Carrier fare page (scripted)', detail: 'Ancillary fees as each carrier states them', when: 'scripted' },
      alternates: ['baggage'],
      columns: ['Carrier', 'Cabin bag', 'Hold bag', 'Seat choice', 'Change fee'],
      claims: [
        { cells: ['Bluewing', '40 × 30 × 20 cm, included', '20 kg — €32 each way', '€6–€18', '€45 + fare difference'], sourceId: 'carrier-page' },
        { cells: ['Tagus Air', '1 × 8 kg, included', '23 kg — €38 each way', '€9–€22', '€55 + fare difference'], sourceId: 'carrier-page' },
        { cells: ['Meridian Air', '1 × 10 kg, included', '23 kg — €30 each way', '€8–€20', '€40 + fare difference'], sourceId: 'carrier-page' }
      ]
    },
    'risk': {
      id: 'risk',
      title: 'What could go wrong with this shortlist',
      kind: 'note',
      source: { id: 'airport-ops', name: 'Airport operations bulletin (scripted)', detail: 'Schedule risk for the month being flown', when: 'scripted' },
      alternates: ['risk-alt'],
      claims: [
        { text: 'Two of the six sampled direct March rotations leave before 07:30, at 06:20 and 07:05, and the cheapest direct fare in the sample is one of them. The next direct departure is more than four hours later, so a delay in that early pair has no same-day alternative at a comparable fare — and every sampled fare at this level is non-refundable.', sourceId: 'airport-ops', attribution: 'Airport operations bulletin (scripted)' },
        { text: 'Every qualifying itinerary is direct, so connection risk does not apply to this shortlist. The qualifying departures are spread across the day, from 06:20 to 13:00, so a missed outbound has a later option the same day — but at this fare level the sampled tickets are non-refundable, so that option is a new ticket rather than a rebooking.', sourceId: 'operator-record', attribution: 'The operator (VOM) — scripted demonstration' }
      ]
    },
    'risk-alt': {
      id: 'risk-alt',
      title: 'What the sampled travellers complained about',
      kind: 'note',
      source: { id: 'traveller-corpus', name: 'Traveller review corpus (scripted)', detail: '340 scripted reviews across the five invented carriers', when: 'scripted' },
      alternates: ['risk'],
      claims: [
        { text: 'Across the 340 scripted reviews in this corpus, two complaints dominate and neither is about the aircraft: cabin-bag sizing enforced at the gate rather than at the desk, and rebooking that is offered by email a day after the disruption. The cheapest sampled carriers attract both complaints roughly twice as often as the dearest.', sourceId: 'traveller-corpus', attribution: 'Traveller review corpus (scripted)' },
        { text: 'Every review in this corpus was written for the demonstration. No real airline is being described, scored or accused of anything.', sourceId: 'operator-record', attribution: 'The operator (VOM)' }
      ]
    },

    /* ---- crm-compare ------------------------------------------------------ */
    'crm-matrix': {
      id: 'crm-matrix',
      title: 'Vendors that meet every constraint',
      kind: 'table',
      source: { id: 'vendor-pricing', name: 'Vendor pricing page (scripted)', detail: 'List prices, with totals computed on this page', when: 'scripted' },
      alternates: ['crm-matrix-alt', 'crm-caps-alt'],
      columns: ['Vendor', 'Per seat', 'Team total / mo', 'Shared inbox', 'BTW invoicing'],
      claims: [
        { cells: ['Alder CRM', '€22', '€88', 'Yes', 'No'], sourceId: 'vendor-pricing' },
        { cells: ['Kadans Werkbank', '€34', '€136', 'Yes', 'Yes'], sourceId: 'vendor-pricing' },
        { cells: ['Veerhuis Relatiebeheer', '€41', '€164', 'Yes', 'Yes'], sourceId: 'vendor-pricing' }
      ]
    },
    'crm-matrix-alt': {
      id: 'crm-matrix-alt',
      title: 'What it takes to actually run the shortlist',
      kind: 'table',
      source: { id: 'vendor-docs', name: 'Vendor documentation (scripted)', detail: 'Setup, export and support terms for the shortlist', when: 'scripted' },
      alternates: ['crm-matrix'],
      columns: ['Vendor', 'Setup effort', 'Data export', 'Support', 'Trial'],
      claims: [
        { cells: ['Alder CRM', 'Half a day, self-serve', 'CSV, self-serve', 'Email, 1 working day', '14 days'], sourceId: 'vendor-docs' },
        { cells: ['Kadans Werkbank', 'Two days with a guided import', 'CSV and JSON, self-serve', 'Email and phone, same working day', '30 days'], sourceId: 'vendor-docs' },
        { cells: ['Veerhuis Relatiebeheer', 'Two days, import done by the vendor', 'CSV, on request', 'Phone, same working day', '21 days'], sourceId: 'vendor-docs' }
      ]
    },
    'crm-cost': {
      id: 'crm-cost',
      title: 'What the shortlist costs at this team size',
      kind: 'stat',
      source: { id: 'operator-record', name: "The operator's own record (VOM)", detail: 'Arithmetic performed on this page from the sampled prices', when: 'scripted' },
      alternates: ['crm-cost-alt'],
      claims: [
        { key: 'Vendors meeting every constraint', label: 'Vendors meeting every constraint', value: '3 of 7 sampled', sourceId: 'operator-record' },
        { key: 'Cheapest qualifying stack', label: 'Cheapest qualifying stack', value: '€88 / month · Alder CRM × 4 seats', sourceId: 'operator-record' },
        { key: 'Dearest on the shortlist', label: 'Dearest on the shortlist', value: '€164 / month · Veerhuis Relatiebeheer', sourceId: 'operator-record' },
        { key: 'Twelve months, cheapest', label: 'Twelve months, cheapest', value: '€1,056', sourceId: 'operator-record' },
        { key: 'Billing', label: 'Billing', value: 'Monthly list price, no discount applied', sourceId: 'vendor-pricing' },
        { key: 'Most exclusive constraint', label: 'Most exclusive constraint', value: 'The shared inbox requirement', sourceId: 'operator-record' },
        { key: 'Sample', label: 'Sample', value: 'Scripted vendor sample — list prices are invented, not quoted', sourceId: 'operator-record' }
      ]
    },
    'crm-cost-alt': {
      id: 'crm-cost-alt',
      title: 'Contract terms across the whole sample',
      kind: 'list',
      source: { id: 'vendor-docs', name: 'Vendor documentation (scripted)', detail: 'Terms that sit outside the per-seat price', when: 'scripted' },
      alternates: ['crm-cost'],
      claims: [
        { text: 'All seven sampled vendors price per seat per month. None of the sampled plans bills by contact record, which is the pricing model that usually breaks a small team’s budget in year two.', sourceId: 'vendor-docs' },
        { text: 'Annual billing in this sample is paid up front, and the 15 per cent reduction is forfeited if seats are given back mid-term.', sourceId: 'vendor-docs' },
        { text: 'Two sampled vendors charge a one-off fee that is not in the per-seat price: €250 to import an existing contact list, €400 for partner-led onboarding.', sourceId: 'vendor-pricing' },
        { text: 'Sampled trial lengths run from 7 to 30 days. One vendor offers a demo call instead of a trial, which means it cannot be evaluated without talking to a salesperson.', sourceId: 'sw-directory' }
      ]
    },
    'crm-caps': {
      id: 'crm-caps',
      title: 'Capabilities, and who was dropped',
      kind: 'list',
      source: { id: 'vendor-docs', name: 'Vendor documentation (scripted)', detail: 'One item per shortlisted vendor, then the exclusions', when: 'scripted' },
      alternates: ['crm-caps-alt'],
      claims: [
        { text: 'Alder CRM — shared inbox; no seat minimum; trial: 14 days.', sourceId: 'vendor-docs' },
        { text: 'Kadans Werkbank — shared inbox, quote builder, Dutch BTW invoicing; plan starts at 3 seats; €250 one-off import fee; trial: 30 days.', sourceId: 'vendor-docs' },
        { text: 'Veerhuis Relatiebeheer — shared inbox, quote builder, Dutch BTW invoicing; plan starts at 4 seats; trial: 21 days.', sourceId: 'vendor-docs' },
        { text: 'Steenbok Lite is excluded — it carries no shared inbox.', sourceId: 'vendor-pricing' },
        { text: 'Halyard Sales Cloud is excluded — its plan starts at 5 seats and the team is 4.', sourceId: 'vendor-pricing' },
        { text: 'Pergola CRM is excluded — it carries no shared inbox.', sourceId: 'vendor-pricing' },
        { text: 'One further vendor was dropped and is not listed here; the whole sample is on the alternate pane.', sourceId: 'operator-record' }
      ]
    },
    'crm-caps-alt': {
      id: 'crm-caps-alt',
      title: 'The whole sample, before constraints',
      kind: 'table',
      source: { id: 'sw-directory', name: 'Software directory listing (scripted)', detail: 'All seven sampled vendors at list price', when: 'scripted' },
      alternates: ['crm-caps'],
      columns: ['Vendor', 'Per seat', 'Inbox', 'Quotes', 'BTW'],
      claims: [
        { cells: ['Steenbok Lite', '€14', 'No', 'No', 'No'], sourceId: 'sw-directory' },
        { cells: ['Alder CRM', '€22', 'Yes', 'No', 'No'], sourceId: 'sw-directory' },
        { cells: ['Kadans Werkbank', '€34', 'Yes', 'Yes', 'Yes'], sourceId: 'sw-directory' },
        { cells: ['Veerhuis Relatiebeheer', '€41', 'Yes', 'Yes', 'Yes'], sourceId: 'sw-directory' },
        { cells: ['Halyard Sales Cloud', '€45', 'Yes', 'Yes', 'No'], sourceId: 'sw-directory' },
        { cells: ['Pergola CRM', '€49', 'No', 'Yes', 'Yes'], sourceId: 'sw-directory' },
        { cells: ['Marktkraam CRM', '€58', 'Yes', 'Yes', 'Yes'], sourceId: 'sw-directory' }
      ]
    },
    'crm-verdict': {
      id: 'crm-verdict',
      title: 'The trade-off, stated plainly',
      kind: 'note',
      source: { id: 'operator-record', name: "The operator's own record (VOM)", detail: 'Written on this page from the figures above', when: 'scripted' },
      alternates: ['crm-verdict-alt'],
      claims: [
        { text: 'At 4 seats, Alder CRM is the cheapest option that clears every constraint: €88 a month, €1,056 over twelve months. Kadans Werkbank costs €48 a month more and adds a quote builder and Dutch BTW invoicing. That premium is worth paying only if the team will actually use it.', sourceId: 'operator-record', attribution: 'The operator (VOM) — scripted demonstration' },
        { text: 'Every price above is a scripted sample assembled by Vision Outreach Media. It is not a quote, no vendor has been contacted, and no real product is being priced.', sourceId: 'operator-record', attribution: 'The operator (VOM) — scripted demonstration' }
      ]
    },
    'crm-verdict-alt': {
      id: 'crm-verdict-alt',
      title: 'What the sampled buyers regret',
      kind: 'note',
      source: { id: 'buyer-corpus', name: 'Buyer review corpus (scripted)', detail: '61 scripted reviews across the seven invented vendors', when: 'scripted' },
      alternates: ['crm-verdict'],
      claims: [
        { text: 'The 61 scripted reviews in this corpus cluster on two regrets, and neither is about features. The first is the import: teams underestimate how long it takes to get an existing contact list in cleanly, and the vendor with the cheapest seat has the thinnest import tooling. The second is renewal: per-seat pricing that was signed at four seats is renegotiated at ten, and the discount does not survive the conversation.', sourceId: 'buyer-corpus', attribution: 'Buyer review corpus (scripted)' },
        { text: 'These reviews were written for the demonstration. No real software product is being reviewed or scored.', sourceId: 'operator-record', attribution: 'The operator (VOM)' }
      ]
    },

    /* ---- roof-repair ------------------------------------------------------ */
    'roofers': {
      id: 'roofers',
      title: 'Roofers who can survey inside the window',
      kind: 'table',
      source: { id: 'trades-dir', name: 'Local trades directory (scripted)', detail: 'Firms with a survey slot inside the window', when: 'scripted' },
      alternates: ['roofers-reviews'],
      columns: ['Company', 'Base', 'Distance', 'Earliest survey', 'Roof type'],
      claims: [
        { cells: ['Dakwerken Van Rhenen', 'Amersfoort (Soesterkwartier)', '3 km', 'Wed 12 Aug', 'Flat + pitched'], sourceId: 'trades-dir' },
        { cells: ['Zonneveld Dakdekkers', 'Soest', '9 km', 'Thu 13 Aug', 'Flat + pitched'], sourceId: 'trades-dir' },
        { cells: ['Eemdak Onderhoud', 'Hoevelaken', '7 km', 'Wed 19 Aug', 'Flat only'], sourceId: 'trades-dir' }
      ]
    },
    'roofers-reviews': {
      id: 'roofers-reviews',
      title: 'How the sampled firms are rated',
      kind: 'table',
      source: { id: 'homeowner-corpus', name: 'Homeowner review corpus (scripted)', detail: 'All eight sampled firms, ratings invented', when: 'scripted' },
      alternates: ['roofers'],
      columns: ['Company', 'Jobs sampled', 'Replies within', 'Rating', 'Warranty'],
      claims: [
        { cells: ['Rietveld Daken', '27', '4 working days', '4.8 / 5', '15-year workmanship'], sourceId: 'homeowner-corpus' },
        { cells: ['Eemdak Onderhoud', '9', '1 working day', '4.7 / 5', '8-year workmanship'], sourceId: 'homeowner-corpus' },
        { cells: ['Dakwerken Van Rhenen', '14', '1 working day', '4.6 / 5', '10-year workmanship'], sourceId: 'homeowner-corpus' },
        { cells: ['Bouwmeester Dakservice', '12', '2 working days', '4.5 / 5', '12-year workmanship'], sourceId: 'homeowner-corpus' },
        { cells: ['Veluwe Dak & Zink', '31', '3 working days', '4.4 / 5', '10-year workmanship'], sourceId: 'homeowner-corpus' },
        { cells: ['Zonneveld Dakdekkers', '22', '2 working days', '4.2 / 5', '5-year workmanship'], sourceId: 'homeowner-corpus' },
        { cells: ['Spakenburg Dakwerk', '6', '2 working days', '4.1 / 5', '6-year workmanship'], sourceId: 'homeowner-corpus' },
        { cells: ['Stadsdak Utrecht', '18', 'Same working day', '3.9 / 5', '5-year workmanship'], sourceId: 'homeowner-corpus' }
      ]
    },
    'roof-window': {
      id: 'roof-window',
      title: 'The window, and what fits inside it',
      kind: 'stat',
      source: { id: 'operator-record', name: "The operator's own record (VOM)", detail: 'Computed on this page from the sampled availability', when: 'scripted' },
      alternates: ['roof-window-alt'],
      claims: [
        { key: 'Firms meeting every constraint', label: 'Firms meeting every constraint', value: '3 of 8 sampled', sourceId: 'operator-record' },
        { key: 'Window applied', label: 'Window applied', value: 'Survey on or before 31 August 2026', sourceId: 'operator-record' },
        { key: 'Earliest survey offered', label: 'Earliest survey offered', value: 'Wed 12 Aug · Dakwerken Van Rhenen', sourceId: 'trades-dir' },
        { key: 'Nearest qualifying firm', label: 'Nearest qualifying firm', value: '3 km · Dakwerken Van Rhenen', sourceId: 'trades-dir' },
        { key: 'Quotation after survey', label: 'Quotation after survey', value: '2–5 working days (sampled)', sourceId: 'contractor-page' },
        { key: 'Most exclusive constraint', label: 'Most exclusive constraint', value: 'The 15 km radius', sourceId: 'operator-record' },
        { key: 'As of', label: 'As of', value: 'Scripted snapshot, 8 August 2026 — availability is invented', sourceId: 'operator-record' }
      ]
    },
    'roof-window-alt': {
      id: 'roof-window-alt',
      title: 'Why August is a bad month to ask',
      kind: 'list',
      source: { id: 'trade-bulletin', name: 'Roofing trade bulletin (scripted)', detail: 'Seasonal workload notes for the trade', when: 'scripted' },
      alternates: ['roof-window'],
      claims: [
        { text: 'August is the sampled peak: storm-damage callouts and holiday cover both land in the same three weeks, and survey slots in this sample are the scarcest of the year.', sourceId: 'trade-bulletin' },
        { text: 'Firms in this sample quote 2 to 5 working days between survey and written quotation. A survey booked on the last day of the window does not produce a quotation inside the window.', sourceId: 'trade-bulletin' },
        { text: 'Flat-roof seam leaks are a same-visit diagnosis in this sample and need no scaffolding; work near the ridge of a pitched roof usually does, which is the difference between a short survey slot and a scheduled one.', sourceId: 'contractor-page' },
        { text: 'This bulletin is written for the demonstration. No real trade body published it.', sourceId: 'operator-record' }
      ]
    },
    'roof-register': {
      id: 'roof-register',
      title: 'Register standing of the qualifying firms',
      kind: 'list',
      source: { id: 'trade-register', name: 'Trade register extract (scripted)', detail: 'One extract-shaped record per qualifying firm', when: 'scripted' },
      alternates: ['roof-register-alt'],
      claims: [
        { text: 'Dakwerken Van Rhenen — sole trader, roofing and sheet-metal work, Amersfoort (Soesterkwartier), trading since 2014. €2.5m liability, 10-year workmanship.', sourceId: 'trade-register' },
        { text: 'Zonneveld Dakdekkers — private company, roofing and sheet-metal work, Soest, trading since 2009. €5m liability, 5-year workmanship.', sourceId: 'trade-register' },
        { text: 'Eemdak Onderhoud — partnership, roofing and sheet-metal work, Hoevelaken, trading since 2017. €2.5m liability, 8-year workmanship.', sourceId: 'trade-register' },
        { text: 'These extracts are shaped like a public-register entry and are entirely scripted. No registration number is shown, and no real registered business is described.', sourceId: 'operator-record' }
      ]
    },
    'roof-register-alt': {
      id: 'roof-register-alt',
      title: 'Register standing across the whole sample',
      kind: 'table',
      source: { id: 'trade-register', name: 'Trade register extract (scripted)', detail: 'All eight sampled firms', when: 'scripted' },
      alternates: ['roof-register'],
      columns: ['Company', 'Form', 'Trading since', 'Liability cover', 'Warranty'],
      claims: [
        { cells: ['Rietveld Daken', 'Partnership', '1998', '€5m liability', '15-year workmanship'], sourceId: 'trade-register' },
        { cells: ['Veluwe Dak & Zink', 'Private company', '2001', '€5m liability', '10-year workmanship'], sourceId: 'trade-register' },
        { cells: ['Zonneveld Dakdekkers', 'Private company', '2009', '€5m liability', '5-year workmanship'], sourceId: 'trade-register' },
        { cells: ['Bouwmeester Dakservice', 'Sole trader', '2011', '€1m liability', '12-year workmanship'], sourceId: 'trade-register' },
        { cells: ['Dakwerken Van Rhenen', 'Sole trader', '2014', '€2.5m liability', '10-year workmanship'], sourceId: 'trade-register' },
        { cells: ['Eemdak Onderhoud', 'Partnership', '2017', '€2.5m liability', '8-year workmanship'], sourceId: 'trade-register' },
        { cells: ['Stadsdak Utrecht', 'Private company', '2019', '€2.5m liability', '5-year workmanship'], sourceId: 'trade-register' },
        { cells: ['Spakenburg Dakwerk', 'Sole trader', '2021', '€1m liability', '6-year workmanship'], sourceId: 'trade-register' }
      ]
    },
    'roof-quote': {
      id: 'roof-quote',
      title: 'The request for quotation — drafted, not sent',
      kind: 'note',
      source: { id: 'operator-record', name: "The operator's own record (VOM)", detail: 'Drafted on this page; delivery is gated', when: 'scripted' },
      alternates: ['roof-quote-alt'],
      claims: [
        { text: 'Good day — we act for the owner of a terraced house in Amersfoort with a leak at the seam of the flat bitumen roof over the rear extension. We are asking three firms within 15 km for a survey and a written quotation, with the survey on or before 31 August 2026. Please confirm whether you can attend inside that window, whether the survey is chargeable, and how long a written quotation takes afterwards. Kind regards — Vision Outreach Media, on behalf of the owner.', sourceId: 'operator-record', attribution: 'Drafted by the operator (VOM) — not sent' },
        { text: 'Status: drafted only, addressed to Dakwerken Van Rhenen, Zonneveld Dakdekkers and Eemdak Onderhoud. The message is complete and it stays on this page. Sending is a gate this surface does not pass on its own — it prepares the action and asks. Nothing has been sent, nothing is booked and no money moves.', sourceId: 'operator-record', attribution: 'The operator (VOM) — scripted demonstration' }
      ]
    },
    'roof-quote-alt': {
      id: 'roof-quote-alt',
      title: 'The same request, as a phone script',
      kind: 'note',
      source: { id: 'operator-record', name: "The operator's own record (VOM)", detail: 'Drafted on this page for the operator to read aloud', when: 'scripted' },
      alternates: ['roof-quote'],
      claims: [
        { text: 'If you would rather phone: ask for a survey before 31 August 2026; say it is a seam leak on the flat bitumen roof over the rear extension on a terraced house in Amersfoort; ask whether the survey is chargeable and how many working days a written quotation takes; and ask what warranty is offered on the repair itself, because the firms in this shortlist range from 5 to 10 years on the workmanship.', sourceId: 'operator-record', attribution: 'The operator (VOM) — scripted demonstration' },
        { text: 'Prepared for Dakwerken Van Rhenen, Zonneveld Dakdekkers and Eemdak Onderhoud. Dialling is yours to do — this page places no calls and sends no messages.', sourceId: 'operator-record', attribution: 'The operator (VOM) — scripted demonstration' }
      ]
    }
  };

  IB.fixtures = {
    intents: intents,
    panes: panes,
    sources: sources
  };

})(typeof window !== 'undefined' ? window : this);
