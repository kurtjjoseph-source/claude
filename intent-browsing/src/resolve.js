/* ============================================================================
   resolve.js — intent-based browsing prototype (Vision Outreach Media)
   Piece 3 of 6. Loaded after fixtures.js.

   Exposes, per the module contract:
     IB.resolve(sentenceOrId)                  -> IntentObject | null
     IB.editField(intentId, fieldId, newValue) -> IntentObject | null
     IB.current()                              -> IntentObject | null
     IB.seeds                                  -> [{ id, sentence }]

   Resolution is deterministic lookup and arithmetic over IB.fixtures. There is
   no model, no network, no clock and no randomness anywhere in this file. The
   same constraints always produce the same surface.

   Primitive 2 lives here: an edited constraint is re-run through the filters
   below, the panes are recomputed in place, and the success condition is
   recalculated. If a constraint excludes everything, that is what the surface
   says — it never falls back to the previous rows.
   ========================================================================== */
(function (w) {
  'use strict';

  var IB = (w.IB = w.IB || {});
  var F = IB.fixtures;
  if (!F || !F.intents || !F.panes) { return; }

  var INTENTS = F.intents;
  var PANES = F.panes;

  /* ---------------------------------------------------------------- helpers */

  function group(n) {
    var s = String(Math.abs(Math.round(n))), out = '', i, c = 0;
    for (i = s.length - 1; i >= 0; i--) {
      out = s.charAt(i) + out;
      c++;
      if (c % 3 === 0 && i > 0) { out = ',' + out; }
    }
    return (n < 0 ? '-' : '') + out;
  }

  function euro(n) { return '€' + group(n); }

  function clampInt(value, min, max, fallback) {
    var raw = String(value === null || value === undefined ? '' : value).replace(/[^0-9.-]/g, '');
    var n = parseInt(raw, 10);
    if (!isFinite(n)) { return fallback; }
    if (n < min) { return min; }
    if (n > max) { return max; }
    return n;
  }

  function median(nums) {
    if (!nums.length) { return 0; }
    var s = nums.slice().sort(function (a, b) { return a - b; });
    var mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
  }

  function unique(list) {
    var seen = {}, out = [], i;
    for (i = 0; i < list.length; i++) {
      if (!seen[list[i]]) { seen[list[i]] = 1; out.push(list[i]); }
    }
    return out;
  }

  function joinNames(names, cap) {
    var shown = names.slice(0, cap), rest = names.length - shown.length, tail;
    if (!shown.length) { return 'nobody'; }
    if (rest > 0) {
      tail = rest + ' other' + (rest === 1 ? '' : 's');
      return shown.join(', ') + ' and ' + tail;
    }
    if (shown.length === 1) { return shown[0]; }
    return shown.slice(0, -1).join(', ') + ' and ' + shown[shown.length - 1];
  }

  var WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
  function words(n) { return n < WORDS.length ? WORDS[n] : String(n); }
  function cap1(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* "a 4-person team" but "an 8-person team" / "an 11-person team": the
     indefinite article follows how the digits are read aloud. */
  function article(n) {
    return (n === 8 || n === 11 || n === 18 || (n >= 80 && n <= 89)) ? 'an' : 'a';
  }

  function toMin(hhmm) {
    return parseInt(hhmm.slice(0, 2), 10) * 60 + parseInt(hhmm.slice(3, 5), 10);
  }
  function spanText(mins) {
    if (mins < 60) { return mins + '-minute'; }
    var h = Math.floor(mins / 60), m = mins % 60;
    return m ? h + 'h ' + m + 'm' : h + '-hour';
  }
  /* durations in the same shape the fare table uses: "1h 05m", "50m" */
  function fmtDur(mins) {
    if (mins < 60) { return mins + 'm'; }
    var h = Math.floor(mins / 60), m = mins % 60;
    return h + 'h ' + (m < 10 ? '0' + m : m) + 'm';
  }

  /* Write a recomputed pane back into the fixture registry. workspace.js reads
     panes from IB.fixtures.panes, so this is how a constraint edit reaches the
     surface. Titles are rewritten too, because the title states the filter. */
  function setPane(paneId, title, claims) {
    var pane = PANES[paneId];
    if (!pane) { return; }
    if (title) { pane.title = title; }
    pane.claims = claims;
  }

  function row(cells, sourceId) { return { cells: cells, sourceId: sourceId }; }
  function item(text, sourceId) { return { text: text, sourceId: sourceId }; }
  function stat(key, value, sourceId) { return { key: key, label: key, value: value, sourceId: sourceId }; }
  function passage(text, sourceId, attribution) {
    return { text: text, sourceId: sourceId, attribution: attribution };
  }

  var SCRIPTED_NOTE = 'The operator (VOM) — scripted demonstration';

  /* ------------------------------------------------------------------ state */

  var edits = {};          /* intentId -> { constraintId: value } */
  var currentIntent = null;

  function currentValues(id) {
    var intent = INTENTS[id], out = {}, i, c;
    if (!intent) { return out; }
    for (i = 0; i < intent.constraints.length; i++) {
      c = intent.constraints[i];
      out[c.id] = (edits[id] && edits[id][c.id] !== undefined) ? edits[id][c.id] : c.value;
    }
    return out;
  }

  /* =========================================================================
     INTENT 1 — flights-lisbon
     budget  filters the fare column · month swaps the sampled fare set
     stops   filters the stops column and swaps the fares pane for the
             connection-aware pane when connections are allowed at all
     ======================================================================= */

  var STOP_RANK = { 'Direct': 0, '≤1 stop': 1, 'Any': 2 };
  var MONTH_ORDER = ['February', 'March', 'April'];

  function stopsText(n) { return n === 0 ? 'Direct' : n === 1 ? '1 stop' : n + ' stops'; }

  function buildFlights(intent, v, out) {
    var d = intent.data;
    var budget = clampInt(v.budget, 0, 2000, 200);
    var month = d.fares[v.month] ? v.month : 'March';
    var stopsLabel = STOP_RANK[v.stops] !== undefined ? v.stops : 'Direct';
    var maxStops = STOP_RANK[stopsLabel];

    var pool = d.fares[month].slice().sort(function (a, b) {
      return a.price - b.price || (a.flight < b.flight ? -1 : 1);
    });
    var passBudget = pool.filter(function (r) { return r.price <= budget; });
    var passStops = pool.filter(function (r) { return r.stops <= maxStops; });
    var qual = pool.filter(function (r) { return r.price <= budget && r.stops <= maxStops; });

    var cheapest = qual.length ? qual[0] : null;
    var filterLine = month + ', ' + stopsLabel + ', at or under ' + euro(budget);

    /* ---- fares (table) */
    setPane('fares', 'Fares matching the constraints — ' + filterLine,
      qual.length
        ? qual.map(function (r) {
            return row([r.flight + ' · ' + r.carrier, r.dates, r.out, euro(r.price), stopsText(r.stops)], 'agg-fare');
          })
        : [row(['—', 'Nothing in the ' + month + ' sample clears ' + euro(budget) + ' at “' + stopsLabel + '”.', '—', '—', '—'], 'operator-record')]
    );

    /* ---- fares-alt (table): carrier terms for exactly the same shortlist */
    setPane('fares-alt', 'Carrier terms for the qualifying fares — ' + filterLine,
      qual.length
        ? qual.map(function (r) {
            var c = d.carriers[r.carrier];
            return row([r.flight + ' · ' + r.carrier, euro(r.price), c.change, c.seat, c.hold], 'carrier-page');
          })
        : [row(['—', 'No qualifying fare', '—', '—', '—'], 'operator-record')]
    );

    /* ---- fares-multi (table): budget applies, the stops constraint does not */
    setPane('fares-multi',
      maxStops >= 2
        ? 'Itineraries including connections — ' + month + ', at or under ' + euro(budget)
        : 'Itineraries including connections — ' + month + ', at or under ' + euro(budget) + ', stops constraint set aside',
      passBudget.length
        ? passBudget.map(function (r) {
            return row([r.flight + ' · ' + r.carrier, r.dates, r.dur, euro(r.price), r.stops === 0 ? 'Direct' : 'via ' + r.via], 'itin-builder');
          })
        : [row(['—', 'Nothing in the ' + month + ' sample clears ' + euro(budget) + ', with or without connections.', '—', '—', '—'], 'operator-record')]
    );

    /* ---- calendar (stat): every figure recomputed from the shortlist */
    var cheapMonth = null, cheapMonthName = '', mi, mrows;
    for (mi = 0; mi < MONTH_ORDER.length; mi++) {
      mrows = d.fares[MONTH_ORDER[mi]].filter(function (r) { return r.stops <= maxStops; });
      mrows.forEach(function (r) {
        if (!cheapMonth || r.price < cheapMonth.price) { cheapMonth = r; cheapMonthName = MONTH_ORDER[mi]; }
      });
    }
    setPane('calendar', 'What the qualifying fares add up to — ' + filterLine, [
      stat('Cheapest qualifying fare',
        cheapest ? euro(cheapest.price) + ' · ' + cheapest.carrier + ' ' + cheapest.flight + ', ' + cheapest.dates
                 : 'None — no itinerary qualifies', 'agg-fare'),
      stat('Qualifying itineraries', qual.length + ' of ' + pool.length + ' sampled for ' + month, 'agg-fare'),
      stat('Median qualifying fare', qual.length ? euro(median(qual.map(function (r) { return r.price; }))) : '—', 'operator-record'),
      stat('Fare spread on the shortlist',
        qual.length ? euro(qual[0].price) + ' – ' + euro(qual[qual.length - 1].price) : '—', 'operator-record'),
      stat('Cheapest month at “' + stopsLabel + '”',
        cheapMonth ? cheapMonthName + ' — ' + euro(cheapMonth.price) + ' on ' + cheapMonth.carrier + ' ' + cheapMonth.flight : '—', 'agg-fare'),
      stat('Sample', d.asOf, 'operator-record')
    ]);

    /* ---- baggage (list): one item per carrier still standing */
    var carriers = unique(qual.map(function (r) { return r.carrier; }));
    var bag = [];
    if (carriers.length) {
      carriers.forEach(function (name) {
        var c = d.carriers[name];
        bag.push(item(name + ' — cabin bag ' + c.cabin + '; hold bag ' + c.hold + '; seat choice ' + c.seat + '.', 'carrier-page'));
      });
      /* Name the rows this actually applies to. The corpus reports gate-side
         sizing on early departures; it says nothing about where the cheap
         fares sit, so neither does this. */
      var cutoff = d.earlyCutoff;
      var early = qual.filter(function (r) { return r.out.slice(0, 5) < cutoff; });
      if (early.length) {
        bag.push(item('Sampled travellers report cabin-bag sizing enforced at the gate rather than at the desk on the pre-' + cutoff + ' departures. ' +
          (early.length === 1 ? 'One itinerary in this shortlist leaves before ' + cutoff + ': ' : early.length + ' itineraries in this shortlist leave before ' + cutoff + ': ') +
          joinNames(early.map(function (r) { return r.carrier + ' ' + r.flight + ' at ' + r.out.slice(0, 5); }), 4) + '.', 'traveller-corpus'));
      }
      var cheapHold = d.carriers[cheapest.carrier];
      bag.push(item('None of the fares above includes a hold bag. Adding one both ways on the cheapest qualifying fare costs ' +
        euro(2 * cheapHold.holdFee) + ' with ' + cheapest.carrier + ', taking it from ' +
        euro(cheapest.price) + ' to ' + euro(cheapest.price + 2 * cheapHold.holdFee) + ' return.', 'operator-record'));
    } else {
      bag.push(item('No carrier qualifies under the constraints as they stand, so there is nothing to state about baggage. Relax the binding constraint and this fills in again.', 'operator-record'));
    }
    setPane('baggage', 'What the fare does and does not include — ' + carriers.length + ' carrier' + (carriers.length === 1 ? '' : 's') + ' in the shortlist', bag);

    /* ---- baggage-alt (table): the same rules as a fee grid */
    setPane('baggage-alt', 'Fee grid for the shortlisted carriers — ' + filterLine,
      carriers.length
        ? carriers.map(function (name) {
            var c = d.carriers[name];
            return row([name, c.cabin, c.hold, c.seat, c.change], 'carrier-page');
          })
        : [row(['No qualifying carrier', '—', '—', '—', '—'], 'operator-record')]
    );

    /* ---- risk (note): month passage plus a shortlist-specific exposure */
    var connecting = qual.filter(function (r) { return r.stops > 0; });
    /* Departure times of the shortlist as it actually stands, so the passage
       below describes this shortlist rather than a remembered one. */
    var depTimes = qual.map(function (r) { return r.out.slice(0, 5); }).sort();
    var depSpread = depTimes.length ? toMin(depTimes[depTimes.length - 1]) - toMin(depTimes[0]) : 0;
    var second;
    if (!qual.length) {
      second = 'There is no shortlist to carry risk at the moment: the constraints as they stand exclude every sampled itinerary, and this page will not show you the ones they exclude as though they still counted.';
    } else if (connecting.length) {
      /* Name the tightest connection actually on this shortlist, and measure it
         against the standard the bulletin claim states — both figures come from
         fixture fields, and the standard is rendered in this same pane. */
      var tightest = connecting.slice().sort(function (a, b) {
        return a.layover.min - b.layover.min || (a.flight < b.flight ? -1 : 1);
      })[0];
      var standard = d.connectionStandard.minMinutes;
      var lead = qual.length === 1
        ? 'The one qualifying itinerary connects.'
        : connecting.length === qual.length
          ? 'Every one of the ' + qual.length + ' qualifying itineraries connects.'
          : cap1(words(connecting.length)) + ' of the ' + qual.length + ' qualifying itineraries ' +
            (connecting.length === 1 ? 'connects' : 'connect') + '.';
      second = lead + ' The tightest connection on the shortlist is ' + fmtDur(tightest.layover.min) +
        ' at ' + tightest.layover.at + ', on ' + tightest.carrier + ' ' + tightest.flight + ' — ' +
        (tightest.layover.min < standard
          ? 'under the ' + fmtDur(standard) + ' the bulletin above asks for, so a delayed inbound leg costs the whole day rather than an hour of it.'
          : 'at or above the ' + fmtDur(standard) + ' the bulletin above asks for, so a delayed inbound leg should still make the onward flight.');
    } else if (qual.length === 1) {
      second = 'The one qualifying itinerary is direct, so connection risk does not apply. The exposure is that it is the only one: a single departure at ' +
        depTimes[0] + ', with no second qualifying rotation to fall back on, and the sampled fare at this level is non-refundable.';
    } else {
      /* Only claim concentration when the qualifying departures are actually
         concentrated — otherwise state the spread the shortlist really has. */
      second = 'Every qualifying itinerary is direct, so connection risk does not apply to this shortlist. ' +
        (depSpread <= 150
          ? 'What is left is concentration: all ' + qual.length + ' qualifying departures leave between ' +
            depTimes[0] + ' and ' + depTimes[depTimes.length - 1] + ', inside a ' + spanText(depSpread) +
            ' window, so a single disruption in that window takes the whole shortlist with it.'
          : 'The qualifying departures are spread across the day, from ' + depTimes[0] + ' to ' +
            depTimes[depTimes.length - 1] + ', so a missed outbound has a later option the same day — but at this fare level the sampled tickets are non-refundable, so that option is a new ticket rather than a rebooking.');
    }
    var riskClaims = [passage(d.monthRisk[month], 'airport-ops', 'Airport operations bulletin (scripted)')];
    /* The connection standard is only shown when the shortlist has a connection
       — and it is shown whenever the passage below cites it. */
    if (connecting.length) {
      riskClaims.push(passage(d.connectionStandard.text, 'airport-ops', 'Airport operations bulletin (scripted)'));
    }
    riskClaims.push(passage(second, 'operator-record', SCRIPTED_NOTE));
    setPane('risk', 'What could go wrong with this shortlist — ' + month, riskClaims);

    /* ---- pane order: connections allowed swaps the fares pane outright */
    out.panes = [maxStops >= 2 ? 'fares-multi' : 'fares', 'calendar', 'baggage', 'risk'];

    /* ---- success: honest about which constraint is binding */
    if (qual.length) {
      out.success = {
        met: true,
        label: qual.length + ' of ' + pool.length + ' sampled ' + month + ' itineraries ' +
          (qual.length === 1 ? 'qualifies' : 'qualify') + ' at ' + euro(budget) + ', ' + stopsLabel +
          ' — cheapest ' + euro(cheapest.price) + ' on ' + cheapest.carrier + ' ' + cheapest.flight + '.'
      };
    } else if (!passStops.length) {
      out.success = {
        met: false,
        label: 'No sampled ' + month + ' itinerary is “' + stopsLabel + '” — the stops constraint is binding.'
      };
    } else if (!passBudget.length) {
      out.success = {
        met: false,
        label: 'Nothing in the ' + month + ' sample is at or under ' + euro(budget) +
          ' — the budget is binding (cheapest sampled fare: ' + euro(pool[0].price) + ').'
      };
    } else {
      out.success = {
        met: false,
        label: 'Budget and stops bind together: ' + passBudget.length + ' itinerar' +
          (passBudget.length === 1 ? 'y clears ' : 'ies clear ') + euro(budget) +
          (passBudget.length === 1 ? ', but it is not “' : ', but none of them is “') + stopsLabel +
          '” (cheapest that is: ' + euro(passStops[0].price) + ').'
      };
    }

    /* ---- staged action (primitive 6) */
    out.staged = cheapest ? {
      label: 'Hold ' + euro(cheapest.price) + ' on ' + cheapest.carrier + ' ' + cheapest.flight + ' for ' + d.holdHours + ' hours',
      detail: 'Prepares a ' + d.holdHours + '-hour courtesy hold on ' + cheapest.carrier + ' ' + cheapest.flight + ', ' + cheapest.dates + ', ' +
        euro(cheapest.price) + ' return, ' + stopsText(cheapest.stops).toLowerCase() +
        '. The request is drafted here with the dates, the fare and the traveller count already filled in.',
      consequence: 'Nothing is sent, no card is charged and no seat is reserved. The hold exists only as a draft inside this scripted demonstration.'
    } : {
      /* none:true — the shortlist is empty, so there is no action to stage.
         The gate must not be openable on a non-action, and the trail must not
         record a decision about one. */
      none: true,
      label: 'No fare to hold',
      detail: 'Nothing in the ' + month + ' sample meets the constraints as they stand, so there is nothing to prepare. Raise the budget or relax the stops constraint and the action comes back.',
      consequence: 'Nothing is sent and no card is charged. This is a scripted demonstration.'
    };
  }

  /* =========================================================================
     INTENT 2 — crm-compare
     per-seat cap · team size (seat floors, and a price break from 10 seats)
     must-have capability · billing period (annual takes 15% off the seat price)
     Every total is recomputed for the chosen team size, so the arithmetic on
     screen is always right for the team on screen.
     ======================================================================= */

  function buildCRM(intent, v, out) {
    var d = intent.data;
    var cap = clampInt(v.seat, 0, 500, 50);
    var team = clampInt(v.team, 1, 250, 4);
    var mustLabel = d.mustHaveMap[v.must] !== undefined ? v.must : 'Shared inbox';
    var mustKey = d.mustHaveMap[mustLabel];
    var mustShort = d.mustShort[mustLabel];
    var mustPhrase = d.mustPhrase[mustLabel];
    var annual = v.billing === 'Annual (−15%)';
    var billingLabel = annual ? 'billed annually' : 'billed monthly';

    function seatPrice(vend) {
      var p = (vend.tier10 !== null && vend.tier10 !== undefined && team >= 10) ? vend.tier10 : vend.perSeat;
      return annual ? Math.round(p * d.annualDiscount) : p;
    }
    function okPrice(vend) { return seatPrice(vend) <= cap; }
    function okSeats(vend) { return team >= vend.minSeats; }
    function okCaps(vend) { return mustKey === null || vend.caps[mustKey] === true; }

    var priced = d.vendors.slice().sort(function (a, b) {
      return seatPrice(a) - seatPrice(b) || (a.name < b.name ? -1 : 1);
    });
    var qualifying = priced.filter(function (x) { return okPrice(x) && okSeats(x) && okCaps(x); });
    var shortlist = qualifying.slice(0, 3);

    function total(vend) { return seatPrice(vend) * team; }

    /* ---- which single constraint is doing the excluding? */
    function wouldAdd(test) {
      return priced.filter(function (x) {
        if (okPrice(x) && okSeats(x) && okCaps(x)) { return false; }
        if (test === 'price') { return okSeats(x) && okCaps(x) && !okPrice(x); }
        if (test === 'seats') { return okPrice(x) && okCaps(x) && !okSeats(x); }
        return okPrice(x) && okSeats(x) && !okCaps(x);
      });
    }
    var byPrice = wouldAdd('price'), bySeats = wouldAdd('seats'), byCaps = wouldAdd('caps');
    /* "every constraint is satisfiable" is only true when nothing was excluded.
       When vendors are excluded but none by a single constraint, say that. */
    var anyExcluded = priced.length - qualifying.length > 0;
    var bindingKey = 'none';
    var bindingShort = anyExcluded ? 'None on its own — the exclusions are combinations' : 'None — every sampled vendor qualifies';
    var bindingSentence =
      'no single constraint is binding on its own; the sampled vendors are excluded only by the constraints in combination.';
    var best = Math.max(byPrice.length, bySeats.length, byCaps.length);
    if (best > 0) {
      if (byPrice.length === best) {
        bindingKey = 'price';
        bindingShort = 'The ' + euro(cap) + ' per-seat cap';
        bindingSentence = 'the ' + euro(cap) + ' per-seat cap is binding: ' + words(byPrice.length) + ' further vendor' +
          (byPrice.length === 1 ? '' : 's') + ' would qualify without it, the nearest at ' + euro(seatPrice(byPrice[0])) + ' a seat.';
      } else if (bySeats.length === best) {
        /* Do not pair a count with a single floor: the excluded vendors have
           different floors, so "N would qualify at M seats" reads as a promise
           the data does not keep. Quote the floors themselves. */
        var floors = bySeats.map(function (x) { return x.minSeats; }).sort(function (a, b) { return a - b; });
        var sameFloor = floors[0] === floors[floors.length - 1];
        bindingKey = 'seats';
        bindingShort = 'The team size (' + team + ' seat' + (team === 1 ? '' : 's') + ')';
        bindingSentence = 'the team size is binding: ' + words(bySeats.length) + ' further vendor' +
          (bySeats.length === 1 ? ' would qualify at ' + floors[0] + ' seats or more.'
            : sameFloor
              ? 's would qualify at ' + floors[0] + ' seats or more.'
              : 's sit behind seat floors of ' + joinNames(unique(floors.map(String)), 4) + ' seats.');
      } else {
        bindingKey = 'caps';
        bindingShort = 'The ' + mustShort + ' requirement';
        bindingSentence = 'the ' + mustShort + ' requirement is binding: ' + words(byCaps.length) + ' further vendor' +
          (byCaps.length === 1 ? '' : 's') + ' would qualify without it.';
      }
    }

    var filterLine = euro(cap) + ' per seat, ' + team + ' seat' + (team === 1 ? '' : 's') + ', ' + mustShort + ', ' + billingLabel;

    /* ---- crm-matrix (table)
       When more qualify than are shown, the title has to say so — otherwise it
       is a definite description standing over a truncated list. */
    setPane('crm-matrix',
      (qualifying.length > shortlist.length
        ? 'The ' + words(shortlist.length) + ' cheapest of ' + qualifying.length + ' vendors that meet every constraint'
        : 'Vendors that meet every constraint') + ' — ' + filterLine,
      shortlist.length
        ? shortlist.map(function (x) {
            return row([
              x.name,
              euro(seatPrice(x)) + (annual ? ' (annual)' : ''),
              euro(total(x)),
              x.caps.inbox ? 'Yes' : 'No',
              x.caps.btw ? 'Yes' : 'No'
            ], 'vendor-pricing');
          })
        : [row(['No vendor meets every constraint', '—', '—', '—', '—'], 'operator-record')]
    );

    /* ---- crm-matrix-alt (table) */
    setPane('crm-matrix-alt', 'What it takes to run the shortlist — ' + filterLine,
      shortlist.length
        ? shortlist.map(function (x) {
            return row([x.name, x.setup, x.exportData, x.support, x.trial], 'vendor-docs');
          })
        : [row(['No vendor meets every constraint', '—', '—', '—', '—'], 'operator-record')]
    );

    /* ---- crm-cost (stat) — arithmetic recomputed for this team size */
    var cheapest = shortlist.length ? shortlist[0] : null;
    var dearest = shortlist.length ? shortlist[shortlist.length - 1] : null;
    setPane('crm-cost', 'What the shortlist costs at ' + team + ' seat' + (team === 1 ? '' : 's'), [
      stat('Vendors meeting every constraint', qualifying.length + ' of ' + d.vendors.length + ' sampled', 'operator-record'),
      stat('Cheapest qualifying stack',
        cheapest ? euro(total(cheapest)) + ' / month · ' + cheapest.name + ' × ' + team + ' seat' + (team === 1 ? '' : 's') : 'None', 'operator-record'),
      stat('Dearest on the shortlist',
        dearest ? euro(total(dearest)) + ' / month · ' + dearest.name : '—', 'operator-record'),
      stat('Twelve months, cheapest', cheapest ? euro(total(cheapest) * 12) : '—', 'operator-record'),
      stat('Billing', annual
        ? 'Annual — ' + Math.round((1 - d.annualDiscount) * 100) + '% off the per-seat price, rounded to whole euros, paid up front'
        : 'Monthly list price, no discount applied', 'vendor-pricing'),
      stat('Most exclusive constraint', bindingShort, 'operator-record'),
      stat('Sample', d.asOf, 'operator-record')
    ]);

    /* ---- crm-caps (list) — what the shortlist carries, and who was dropped */
    var caps = [];
    shortlist.forEach(function (x) {
      var has = [];
      if (x.caps.inbox) { has.push(d.capPhrase.inbox); }
      if (x.caps.quotes) { has.push(d.capPhrase.quotes); }
      if (x.caps.btw) { has.push(d.capPhrase.btw); }
      caps.push(item(x.name + ' — ' +
        (has.length ? has.join(', ') : 'none of the three sampled capabilities') + '; ' +
        (x.minSeats > 1 ? 'plan starts at ' + x.minSeats + ' seats' : 'no seat minimum') + '; ' +
        (x.migration ? x.migration + '; ' : '') + 'trial: ' + x.trial + '.', 'vendor-docs'));
    });
    var dropped = priced.filter(function (x) { return !(okPrice(x) && okSeats(x) && okCaps(x)); })
      .sort(function (a, b) {
        var fa = (okPrice(a) ? 0 : 1) + (okSeats(a) ? 0 : 1) + (okCaps(a) ? 0 : 1);
        var fb = (okPrice(b) ? 0 : 1) + (okSeats(b) ? 0 : 1) + (okCaps(b) ? 0 : 1);
        return fa - fb || seatPrice(a) - seatPrice(b) || (a.name < b.name ? -1 : 1);
      });
    dropped.slice(0, 3).forEach(function (x) {
      var why = [];
      if (!okPrice(x)) { why.push(euro(seatPrice(x)) + ' a seat is above the ' + euro(cap) + ' cap'); }
      if (!okSeats(x)) { why.push('its plan starts at ' + x.minSeats + ' seats and the team is ' + team); }
      if (!okCaps(x)) { why.push('it carries no ' + d.capPhrase[mustKey]); }
      caps.push(item(x.name + ' is excluded — ' + why.join(', and ') + '.', 'vendor-pricing'));
    });
    /* Mirror of the qualifying-side note below: the pane title states how many
       of the sample qualify, so the exclusions it does not list must still be
       accounted for. */
    var hiddenDropped = dropped.length - Math.min(dropped.length, 3);
    if (hiddenDropped > 0) {
      caps.push(item(cap1(words(hiddenDropped)) + ' further vendor' +
        (hiddenDropped === 1 ? ' was dropped and is' : 's were dropped and are') +
        ' not listed here; the whole sample is on the alternate pane.', 'operator-record'));
    }
    var hidden = qualifying.length - shortlist.length;
    if (hidden > 0) {
      caps.push(item(cap1(words(hidden)) + ' further vendor' + (hidden === 1 ? ' also qualifies and is' : 's also qualify and are') +
        ' not shown: the intent asks for three, and the three above are the cheapest at ' + team + ' seat' + (team === 1 ? '' : 's') + '.', 'operator-record'));
    }
    setPane('crm-caps', 'Capabilities, and who was dropped — ' + qualifying.length + ' of ' + d.vendors.length + ' qualify', caps);

    /* ---- crm-verdict (note) */
    var verdict;
    if (!shortlist.length) {
      verdict = 'There is nothing to compare at these constraints, and ' + bindingSentence +
        ' The honest answer is that the sample holds no vendor for this team as specified — not that a cheaper one is waiting somewhere off-screen.';
    } else {
      verdict = 'At ' + team + ' seat' + (team === 1 ? '' : 's') + ', ' + cheapest.name +
        ' is the cheapest option that clears every constraint: ' + euro(total(cheapest)) + ' a month, ' +
        euro(total(cheapest) * 12) + ' over twelve months.';
      if (shortlist.length > 1) {
        var next = shortlist[1];
        var adds = [];
        if (next.caps.inbox && !cheapest.caps.inbox) { adds.push('a shared inbox'); }
        if (next.caps.quotes && !cheapest.caps.quotes) { adds.push('a quote builder'); }
        if (next.caps.btw && !cheapest.caps.btw) { adds.push('Dutch BTW invoicing'); }
        verdict += ' ' + next.name + ' costs ' + euro(total(next) - total(cheapest)) + ' a month more and ' +
          (adds.length ? 'adds ' + joinNames(adds, 3) + '. That premium is worth paying only if the team will actually use it.'
                       : 'adds nothing the cheaper option lacks in this sample, which makes it hard to justify.');
      }
    }
    setPane('crm-verdict', 'The trade-off, stated plainly', [
      passage(verdict, 'operator-record', SCRIPTED_NOTE),
      passage('Every price above is a scripted sample assembled by Vision Outreach Media. It is not a quote, no vendor has been contacted, and no real product is being priced.', 'operator-record', SCRIPTED_NOTE)
    ]);

    /* ---- goal and entities move with the team size */
    out.goal = 'Shortlist three CRMs ' + article(team) + ' ' + team + '-person team can actually buy';
    out.entities = [
      { id: 'team-ent', label: team + '-person sales team', kind: 'buyer' },
      { id: 'market', label: 'Netherlands — BTW invoicing', kind: 'market' },
      { id: 'category', label: 'CRM and pipeline software', kind: 'category' }
    ];
    out.panes = ['crm-matrix', 'crm-cost', 'crm-caps', 'crm-verdict'];

    /* ---- success */
    if (qualifying.length >= 3) {
      out.success = {
        met: true,
        label: qualifying.length + ' of ' + d.vendors.length + ' sampled vendors clear ' + euro(cap) + ' a seat at ' +
          team + ' seat' + (team === 1 ? '' : 's') + ' with ' + mustPhrase +
          (qualifying.length > 3 ? '; the three cheapest are shown' : '') +
          ' — cheapest stack ' + euro(total(cheapest)) + ' a month.'
      };
    } else if (qualifying.length === 0) {
      out.success = { met: false, label: 'No sampled vendor clears every constraint — ' + bindingSentence };
    } else {
      out.success = {
        met: false,
        label: 'Only ' + qualifying.length + ' of ' + d.vendors.length + ' sampled vendors ' +
          (qualifying.length === 1 ? 'clears' : 'clear') + ' every constraint and the intent asks for three — ' + bindingSentence
      };
    }

    /* ---- staged action (primitive 6) */
    out.staged = shortlist.length ? {
      label: 'Prepare trial sign-ups for ' + shortlist.length + ' vendor' + (shortlist.length === 1 ? '' : 's'),
      detail: (shortlist.length === 1 ? 'Drafts a trial request to ' : 'Drafts one trial request each to ') +
        joinNames(shortlist.map(function (x) { return x.name; }), 3) +
        ', stating ' + team + ' seat' + (team === 1 ? '' : 's') +
        (mustKey ? ' and the ' + mustShort + ' requirement' : ' and no capability requirement') +
        ', so the trials are comparable.',
      consequence: 'No account is created, no email address is submitted and no card is entered. The requests exist only as drafts inside this scripted demonstration.'
    } : {
      /* none:true — nothing qualifies, so there is no action to stage */
      none: true,
      label: 'Nothing to sign up for',
      detail: 'No sampled vendor clears the constraints as they stand, so no trial request has been prepared. Change a constraint and the action comes back.',
      consequence: 'No account is created and no card is entered. This is a scripted demonstration.'
    };
  }

  /* =========================================================================
     INTENT 3 — roof-repair
     timeframe filters on the survey date · radius filters on distance
     roof type filters on what the firm works on
     This is the action-gate showcase: the request for quotation is written in
     full, addressed to the firms that actually qualify, and never sent.
     ======================================================================= */

  function buildRoof(intent, v, out) {
    var d = intent.data;
    var winLabel = d.windows[v.timeframe] ? v.timeframe : 'This month';
    var win = d.windows[winLabel];
    var radius = clampInt(v.radius, 1, 60, 15);
    var workLabel = d.workMap[v.work] !== undefined ? v.work : 'Flat roof (bitumen)';
    var workKey = d.workMap[workLabel];

    function okTime(r) { return r.day <= win.days; }
    function okDist(r) { return r.km <= radius; }
    function okWork(r) { return workKey === null || r.types.indexOf(workKey) > -1; }

    var all = d.roofers.slice().sort(function (a, b) { return a.day - b.day || a.km - b.km; });
    var qual = all.filter(function (r) { return okTime(r) && okDist(r) && okWork(r); });
    var names = qual.map(function (r) { return r.name; });
    var workPhrase = d.workPhrase[workLabel];
    var job = d.jobPhrase[workLabel];
    var filterLine = 'survey by ' + win.until + ', within ' + radius + ' km, ' + workLabel.toLowerCase();

    /* ---- which single constraint is doing the excluding? */
    function wouldAdd(test) {
      return all.filter(function (r) {
        if (okTime(r) && okDist(r) && okWork(r)) { return false; }
        if (test === 'time') { return okDist(r) && okWork(r) && !okTime(r); }
        if (test === 'dist') { return okTime(r) && okWork(r) && !okDist(r); }
        return okTime(r) && okDist(r) && !okWork(r);
      });
    }
    var byTime = wouldAdd('time'), byDist = wouldAdd('dist'), byWork = wouldAdd('work');
    var anyExcluded = all.length - qual.length > 0;
    var bindingShort = anyExcluded ? 'None on its own — the exclusions are combinations' : 'None — every sampled firm qualifies';
    var bindingSentence = 'no single constraint is binding on its own; the sampled firms are excluded only by the constraints in combination.';
    var best = Math.max(byTime.length, byDist.length, byWork.length);
    if (best > 0) {
      /* State what is true of all N — that their slot or their base is outside
         the constraint — rather than implying all N appear at the one value
         quoted next to the count. */
      if (byTime.length === best) {
        bindingShort = 'The “' + winLabel.toLowerCase() + '” window';
        bindingSentence = 'the survey window is binding: ' + words(byTime.length) + ' further firm' + (byTime.length === 1 ? ' has' : 's have') +
          ' a slot outside it, the earliest on ' + byTime[0].date + '.';
      } else if (byDist.length === best) {
        bindingShort = 'The ' + radius + ' km radius';
        bindingSentence = 'the ' + radius + ' km radius is binding: ' + words(byDist.length) + ' further firm' + (byDist.length === 1 ? ' sits' : 's sit') +
          ' outside it, the nearest at ' +
          byDist.map(function (r) { return r.km; }).sort(function (a, b) { return a - b; })[0] + ' km.';
      } else {
        bindingShort = 'The roof type (' + workPhrase + ')';
        bindingSentence = 'the roof type is binding: ' + words(byWork.length) + ' further firm' + (byWork.length === 1 ? ' clears' : 's clear') +
          ' the window and the radius but ' + (byWork.length === 1 ? 'does' : 'do') + ' not work on ' + workPhrase + '.';
      }
    }
    var noneLine = 'No sampled firm can survey ' + workPhrase + ' by ' + win.until + ' within ' + radius + ' km';

    /* ---- roofers (table) */
    setPane('roofers', 'Roofers who can survey inside the window — ' + filterLine,
      qual.length
        ? qual.map(function (r) {
            return row([r.name, r.base, r.km + ' km', r.date, r.typeLabel], 'trades-dir');
          })
        : [row(['No firm meets every constraint', '—', '—', '—', '—'], 'operator-record')]
    );

    /* ---- roof-window (stat) */
    var quoteDays = qual.map(function (r) { return r.quoteDays; }).sort(function (a, b) { return a - b; });
    var nearest = qual.slice().sort(function (a, b) { return a.km - b.km; })[0];
    setPane('roof-window', 'The window, and what fits inside it — ' + winLabel.toLowerCase(), [
      stat('Firms meeting every constraint', qual.length + ' of ' + d.roofers.length + ' sampled', 'operator-record'),
      stat('Window applied', 'Survey on or before ' + win.until, 'operator-record'),
      stat('Earliest survey offered', qual.length ? qual[0].date + ' · ' + qual[0].name : 'None inside the window', 'trades-dir'),
      stat('Nearest qualifying firm', nearest ? nearest.km + ' km · ' + nearest.name : '—', 'trades-dir'),
      stat('Quotation after survey', quoteDays.length
        ? (quoteDays[0] === quoteDays[quoteDays.length - 1]
            ? quoteDays[0] + ' working days'
            : quoteDays[0] + '–' + quoteDays[quoteDays.length - 1] + ' working days') + ' (sampled)'
        : '—', 'contractor-page'),
      stat('Most exclusive constraint', bindingShort, 'operator-record'),
      stat('As of', d.asOf, 'operator-record')
    ]);

    /* ---- roof-register (list) */
    var reg = [];
    if (qual.length) {
      qual.forEach(function (r) {
        reg.push(item(r.name + ' — ' + r.form.toLowerCase() + ', roofing and sheet-metal work, ' + r.base +
          ', trading since ' + r.since + '. ' + r.cover + ', ' + r.warranty + '.', 'trade-register'));
      });
    } else {
      reg.push(item('No firm qualifies under the constraints as they stand, so no register extract is shown. This page will not fill the gap with a firm that does not meet them.', 'operator-record'));
    }
    reg.push(item('These extracts are shaped like a public-register entry and are entirely scripted. No registration number is shown, and no real registered business is described.', 'operator-record'));
    setPane('roof-register', 'Register standing of the qualifying firms — ' + qual.length + ' extract' + (qual.length === 1 ? '' : 's'), reg);

    /* ---- roof-quote (note): the drafted request for quotation */
    var draft;
    if (qual.length) {
      draft = 'Good day — we act for the owner of a terraced house in Amersfoort with ' + job.draft + '. ' +
        'We are asking ' + words(qual.length) + ' firm' + (qual.length === 1 ? '' : 's') + ' within ' + radius + ' km for a survey and a written quotation, ' +
        'with the survey on or before ' + win.until + '. Please confirm whether you can attend inside that window, whether the survey is chargeable, ' +
        'and how long a written quotation takes afterwards. Kind regards — Vision Outreach Media, on behalf of the owner.';
    } else {
      draft = 'No message has been written. ' + noneLine + ', and this page will not invent a firm to address it to.';
    }
    setPane('roof-quote', 'The request for quotation — drafted, not sent', [
      passage(draft, 'operator-record', 'Drafted by the operator (VOM) — not sent'),
      passage(qual.length
        ? 'Status: drafted only, addressed to ' + joinNames(names, 3) +
          '. The message is complete and it stays on this page. Sending is a gate this surface does not pass on its own — it prepares the action and asks. Nothing has been sent, nothing is booked and no money moves.'
        : 'Status: nothing drafted. There is no message and no recipient, and none has been invented to fill the gap. Sending would be a gate this surface does not pass on its own in any case — it prepares the action and asks.',
        'operator-record', SCRIPTED_NOTE)
    ]);

    /* The warranty spread is a claim about THIS shortlist, so measure it on
       the qualifying firms rather than on the whole sample. */
    var warr = qual.map(function (r) { return r.warrantyYears; }).sort(function (a, b) { return a - b; });
    var warrantySpread = !warr.length ? 'the sampled firms differ on it'
      : warr[0] === warr[warr.length - 1]
        ? 'every firm in this shortlist offers ' + warr[0] + ' years and you should hold them to it'
        : 'the firms in this shortlist range from ' + warr[0] + ' to ' + warr[warr.length - 1] + ' years on the workmanship';

    /* ---- roof-quote-alt (note): the same request as a phone script */
    setPane('roof-quote-alt', 'The same request, as a phone script',
      qual.length ? [
        passage('If you would rather phone: ask for a survey before ' + win.until + '; say it is ' + job.script + ' on a terraced house in Amersfoort; ' +
          'ask whether the survey is chargeable and how many working days a written quotation takes; and ask what warranty is offered on the repair itself, because ' + warrantySpread + '.',
          'operator-record', SCRIPTED_NOTE),
        passage('Prepared for ' + joinNames(names, 3) + '. Dialling is yours to do — this page places no calls and sends no messages.', 'operator-record', SCRIPTED_NOTE)
      ] : [
        passage('There is nobody to call. ' + noneLine + '. Widen the radius or move the window and the script comes back.',
          'operator-record', SCRIPTED_NOTE)
      ]
    );

    /* the job named in the intent object follows the roof-type constraint too,
       so no pane describes work the shortlist was not filtered for */
    out.entities = [
      { id: 'amersfoort', label: 'Amersfoort', kind: 'location' },
      { id: 'property', label: 'Terraced house, flat rear extension', kind: 'property' },
      { id: 'job', label: job.entity, kind: 'job' }
    ];
    out.panes = ['roofers', 'roof-window', 'roof-register', 'roof-quote'];

    /* ---- success */
    if (qual.length) {
      out.success = {
        met: true,
        label: qual.length + ' of ' + d.roofers.length + ' sampled firms can survey ' + workPhrase +
          ' by ' + win.until + ' within ' + radius + ' km — earliest ' + qual[0].date + ', ' + qual[0].name + '.'
      };
    } else {
      out.success = { met: false, label: noneLine + ' — ' + bindingSentence };
    }

    /* ---- staged action (primitive 6) — the showcase */
    out.staged = qual.length ? {
      label: 'Request quotations from ' + qual.length + ' roofer' + (qual.length === 1 ? '' : 's'),
      detail: (qual.length === 1 ? 'A message to ' : 'One message each to ') + joinNames(names, 3) +
        ' — the firm' + (qual.length === 1 ? '' : 's') + ' within ' + radius + ' km that can survey ' +
        workPhrase + ' on or before ' + win.until +
        '. Recipient, subject line and body are filled in already, and ' +
        (qual.length === 1 ? 'it states' : 'each one states') + ' the survey window and the roof type.',
      consequence: 'Nothing is sent. No message leaves this page, no appointment is booked, no deposit is paid and no money moves. The surface prepares the action and stops here — whether it ever happens is yours to decide.',
      gate: true
    } : {
      /* none:true — no firm qualifies, so there is no message to stage */
      none: true,
      label: 'No roofer to write to',
      detail: noneLine + ', so no message has been prepared. Widen the radius or move the window and the draft comes back.',
      consequence: 'Nothing is sent, nothing is booked and no money moves. This is a scripted demonstration.',
      gate: true
    };
  }

  var BUILDERS = {
    'flights-lisbon': buildFlights,
    'crm-compare': buildCRM,
    'roof-repair': buildRoof
  };

  /* ------------------------------------------------------------------ build */

  function build(id) {
    var intent = INTENTS[id];
    if (!intent || !BUILDERS[id]) { return null; }
    var v = currentValues(id);

    var out = {
      id: intent.id,
      sentence: intent.sentence,
      goal: intent.goal,
      constraints: intent.constraints.map(function (c) {
        var copy = {
          id: c.id,
          label: c.label,
          value: v[c.id],
          unit: c.unit,
          type: c.type,
          options: c.options ? c.options.slice() : null
        };
        if (c.min !== undefined) { copy.min = c.min; }
        if (c.max !== undefined) { copy.max = c.max; }
        if (c.step !== undefined) { copy.step = c.step; }
        if (c.hint !== undefined) { copy.hint = c.hint; }
        return copy;
      }),
      entities: intent.entities.map(function (e) { return { id: e.id, label: e.label, kind: e.kind }; }),
      success: { label: intent.success.label, met: intent.success.met },
      panes: intent.panes.slice(),
      staged: {
        label: intent.staged.label,
        detail: intent.staged.detail,
        consequence: intent.staged.consequence
      }
    };

    BUILDERS[id](intent, v, out);
    return out;
  }

  /* ---------------------------------------------------- sentence -> intent */

  var KEYWORDS = {
    'flights-lisbon': {
      strong: ['lisbon', 'flight', 'flights', 'fly', 'flying', 'airfare'],
      weak: ['fare', 'fares', 'airline', 'airlines', 'march', 'february', 'april', 'portugal',
             'amsterdam', 'return', 'ticket', 'tickets', 'trip', 'direct', 'stop', 'stops', 'plane', 'schiphol']
    },
    'crm-compare': {
      strong: ['crm', 'crms'],
      weak: ['compare', 'comparison', 'seat', 'seats', 'vendor', 'vendors', 'software', 'pipeline',
             'team', 'saas', 'subscription', 'sales', 'tool', 'tools', 'contacts', 'shortlist', 'licence', 'license']
    },
    'roof-repair': {
      strong: ['roof', 'roofer', 'roofers', 'roofing', 'dakdekker', 'dakwerken', 'amersfoort'],
      weak: ['repair', 'repairs', 'quote', 'quotes', 'quotation', 'leak', 'leaking', 'tiles', 'gutter',
             'contractor', 'builder', 'survey', 'damage', 'bitumen', 'tradesman']
    }
  };

  var SEED_ORDER = ['flights-lisbon', 'crm-compare', 'roof-repair'];

  function tokenise(text) {
    var raw = String(text).toLowerCase().split(/[^a-z0-9]+/), seen = {}, out = [], i;
    for (i = 0; i < raw.length; i++) {
      if (raw[i] && !seen[raw[i]]) { seen[raw[i]] = 1; out.push(raw[i]); }
    }
    return out;
  }

  function scoreFor(id, tokens) {
    var k = KEYWORDS[id], s = 0, i;
    for (i = 0; i < tokens.length; i++) {
      if (k.strong.indexOf(tokens[i]) > -1) { s += 3; }
      else if (k.weak.indexOf(tokens[i]) > -1) { s += 1; }
    }
    return s;
  }

  /* Deterministic keyword match. Requires a real overlap AND a clear winner —
     an ambiguous or unrelated sentence resolves to nothing rather than to a
     guess. Refusing to resolve is a feature: this prototype does not invent. */
  function matchSeed(input) {
    if (typeof input !== 'string') { return null; }
    var text = input.trim();
    if (!text) { return null; }
    if (INTENTS[text]) { return text; }

    var tokens = tokenise(text);
    var scored = SEED_ORDER.map(function (id) { return { id: id, score: scoreFor(id, tokens) }; })
      .sort(function (a, b) { return b.score - a.score || (a.id < b.id ? -1 : 1); });

    if (scored[0].score < 3) { return null; }
    if (scored[0].score === scored[1].score) { return null; }
    return scored[0].id;
  }

  /* -------------------------------------------------------------- contract */

  IB.seeds = SEED_ORDER.map(function (id) {
    return { id: id, sentence: INTENTS[id].sentence };
  });

  /* Stating an intent again starts it again: a free sentence clears any edits
     on that intent and resolves from its base constraints, so the same
     sentence always produces the same surface. Re-resolving by bare id is the
     programmatic path (standing.js re-checking a watched intent) and keeps the
     constraints the user has edited — otherwise a background re-resolve would
     silently undo primitive 2. */
  IB.resolve = function (sentenceOrId) {
    var id = matchSeed(sentenceOrId);
    if (!id) { return null; }
    if (String(sentenceOrId).trim() !== id) { delete edits[id]; }
    var obj = build(id);
    if (!obj) { return null; }
    currentIntent = obj;
    IB.bus.emit('intent:resolved', obj);
    return obj;
  };

  /* Normalise BEFORE storing, so constraints[].value can never report a number
     the resolution did not actually use. Out-of-range and junk numbers are
     clamped to the value the filters will apply; an option that is not on the
     list is refused outright rather than silently falling back inside the
     builder. The object and the surface always state the same constraint. */
  function normalise(c, current, value) {
    var raw = String(value === null || value === undefined ? '' : value).trim();
    if (c.type === 'number') {
      return String(clampInt(raw,
        c.min !== undefined ? c.min : 0,
        c.max !== undefined ? c.max : 999999,
        clampInt(c.value, 0, 999999, 0)));
    }
    if (c.options && c.options.length && c.options.indexOf(raw) === -1) { return current; }
    return raw;
  }

  IB.editField = function (intentId, fieldId, newValue) {
    if (!INTENTS[intentId]) { return null; }
    var known = INTENTS[intentId].constraints.filter(function (c) { return c.id === fieldId; })[0];
    if (known) {
      if (!edits[intentId]) { edits[intentId] = {}; }
      edits[intentId][fieldId] = normalise(known, currentValues(intentId)[fieldId], newValue);
    }
    var obj = build(intentId);
    if (!obj) { return null; }
    currentIntent = obj;
    IB.bus.emit('intent:edited', obj);
    return obj;
  };

  IB.current = function () { return currentIntent; };

  /* Prime every pane with the state its intent's base constraints produce, so
     IB.fixtures.panes is coherent before anything has been resolved. Silent:
     no events, no current intent. */
  (function prime() {
    var i;
    for (i = 0; i < SEED_ORDER.length; i++) { build(SEED_ORDER[i]); }
  })();

})(typeof window !== 'undefined' ? window : this);
