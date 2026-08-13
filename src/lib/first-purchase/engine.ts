import type {
  BudgetEnvelope,
  BuyerProfile,
  FirstPurchaseGuide,
  GuideStep,
  JurisdictionPick,
  JurisdictionProfile,
  LearningItem,
  PathToTarget,
  ReadinessBand,
  ReadinessGate,
  SearchBrief,
  TargetProfile,
} from "@/lib/types";
import { JURISDICTIONS, getJurisdiction } from "@/lib/water/registry";

/**
 * Deterministic first-purchase planner.
 *
 * The wizard screens a parcel you have already found. This sits upstream of it
 * and answers the question a first-time buyer actually has: what should my
 * first purchase look like, can I afford it, and what do I do this week.
 *
 * The governing idea is that the first purchase is not the one to optimise. It
 * is the one that has to teach you the process with survivable downside, so the
 * second and third can be bigger. Most of the logic here is therefore biased
 * toward simplicity and reversibility rather than toward the best deal.
 */

// ---------------------------------------------------------------------------
// Cost model
// ---------------------------------------------------------------------------

/**
 * Per-deal diligence, in USD. These are order-of-magnitude planning figures for
 * budgeting, not quotes — actual costs vary widely by market and by how much
 * the seller has already produced.
 */
const DILIGENCE_COSTS = {
  titleCommitment: 1_500,
  waterCounsel: 5_000,
  pumpTest: 3_000,
  engineerOpinion: 7_000,
  survey: 3_500,
  travelAndInspection: 1_500,
  /** Local counsel, tax structuring, translation, notarial and extra travel. */
  crossBorderUplift: 18_000,
};

/** Closing costs as a share of price. Transfer taxes abroad are much heavier. */
const CLOSING_RATE_DOMESTIC = 0.03;
const CLOSING_RATE_CROSS_BORDER = 0.08;

/** Twelve months of carry plus an infrastructure contingency. */
const RESERVE_RATE = 0.1;
const RESERVE_FLOOR = 15_000;

/** Reference points for the acreage sensitivity table. */
const REFERENCE_PRICES = [500, 1_500, 4_000, 10_000, 20_000];

function round(n: number, to = 100): number {
  return Math.round(n / to) * to;
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

function buildBudget(profile: BuyerProfile, crossBorder: boolean): BudgetEnvelope {
  const notes: string[] = [];

  // A parcel with no well needs no pump test and usually no engineer.
  const wantsWater = profile.operatingIntent !== "passive-hold";
  let perDeal =
    DILIGENCE_COSTS.titleCommitment +
    DILIGENCE_COSTS.waterCounsel +
    DILIGENCE_COSTS.travelAndInspection +
    DILIGENCE_COSTS.survey;

  if (wantsWater) {
    perDeal += DILIGENCE_COSTS.pumpTest + DILIGENCE_COSTS.engineerOpinion;
  } else {
    notes.push(
      "A passive hold does not need a pump test or an engineer's yield opinion, which takes roughly $10,000 out of each deal's diligence.",
    );
  }
  if (crossBorder) perDeal += DILIGENCE_COSTS.crossBorderUplift;

  /**
   * You pay for diligence on deals you walk away from. A first-time buyer
   * should expect to take two or three parcels into paid diligence before one
   * closes — the free checks kill the rest earlier and cost nothing.
   */
  const dealsScreenedAssumed = profile.landExperience === "none" || profile.landExperience === "residential-only" ? 2.5 : 1.8;
  const diligenceProgram = round(perDeal * dealsScreenedAssumed, 500);

  const closingCostsRate = crossBorder ? CLOSING_RATE_CROSS_BORDER : CLOSING_RATE_DOMESTIC;

  // capital = price + closing(price) + reserve(price) + diligence
  const available = profile.totalCapital - diligenceProgram;
  const raw = available / (1 + closingCostsRate + RESERVE_RATE);
  let maxPurchasePrice = Math.max(0, round(raw, 1_000));

  // The reserve has a floor, which bites hardest on small budgets.
  let workingReserve = Math.max(RESERVE_FLOOR, maxPurchasePrice * RESERVE_RATE);
  if (maxPurchasePrice > 0 && workingReserve > maxPurchasePrice * RESERVE_RATE) {
    const shortfall = workingReserve - maxPurchasePrice * RESERVE_RATE;
    maxPurchasePrice = Math.max(0, round(maxPurchasePrice - shortfall, 1_000));
    workingReserve = Math.max(RESERVE_FLOOR, maxPurchasePrice * RESERVE_RATE);
  }

  const estimatedClosingCosts = round(maxPurchasePrice * closingCostsRate, 100);

  if (profile.financing !== "cash-only" && profile.financing !== "undecided") {
    notes.push(
      "These figures assume you are paying cash. Financing raises the price you can reach but lenders on raw land typically want 35-50% down and will not lend against a water right whose status is unresolved — so the diligence still has to clear first.",
    );
  }
  if (diligenceProgram > maxPurchasePrice * 0.25 && maxPurchasePrice > 0) {
    notes.push(
      "Diligence is a large fraction of what you can spend on the land. That is the honest signal that the parcel is small relative to the fixed cost of checking it properly — either buy something simpler that needs less checking, or wait and buy something bigger.",
    );
  }
  notes.push(
    "The reserve is not optional. Property taxes, district assessments, insurance, fencing and a first-year infrastructure surprise all land after closing, and a buyer with no cash left is the one who has to sell in a bad year.",
  );

  const impliedAcres = REFERENCE_PRICES.map((pricePerAcre) => ({
    pricePerAcre,
    acres: Math.round(maxPurchasePrice / pricePerAcre),
  }));

  if (profile.expectedPricePerAcre && profile.expectedPricePerAcre > 0) {
    impliedAcres.push({
      pricePerAcre: profile.expectedPricePerAcre,
      acres: Math.round(maxPurchasePrice / profile.expectedPricePerAcre),
    });
  }
  // Ascending, so the table reads as a scale rather than an arbitrary order.
  impliedAcres.sort((a, b) => a.pricePerAcre - b.pricePerAcre);

  return {
    totalCapital: profile.totalCapital,
    diligenceProgram,
    perDealDiligence: round(perDeal, 500),
    dealsScreenedAssumed,
    closingCostsRate,
    reserveRate: RESERVE_RATE,
    maxPurchasePrice,
    estimatedClosingCosts,
    workingReserve: round(workingReserve, 500),
    impliedAcres,
    notes,
  };
}

// ---------------------------------------------------------------------------
// Readiness gates
// ---------------------------------------------------------------------------

function buildGates(profile: BuyerProfile, budget: BudgetEnvelope, crossBorder: boolean): ReadinessGate[] {
  const gates: ReadinessGate[] = [];
  const firstTimer = profile.landExperience === "none" || profile.landExperience === "residential-only";

  gates.push(
    budget.maxPurchasePrice <= 0
      ? {
          id: "capital-floor",
          status: "fail",
          title: "Capital does not yet cover a purchase plus proper diligence",
          detail: `Diligence on the deals you look at runs about $${budget.diligenceProgram.toLocaleString()}, and a working reserve is another $${budget.workingReserve.toLocaleString()}. Against $${profile.totalCapital.toLocaleString()} there is nothing left for the land itself.`,
          action:
            "Either raise the capital, or start with a parcel simple enough to diligence cheaply — no well, no ditch shares, clean title in a riparian state — where the full engineering package is not required.",
        }
      : {
          id: "capital-floor",
          status: "pass",
          title: "Capital supports a purchase with diligence and reserve intact",
          detail: `About $${budget.maxPurchasePrice.toLocaleString()} for the land, with diligence and reserve funded separately rather than out of the purchase budget.`,
        },
  );

  gates.push(
    profile.totalCapital > 0 && budget.workingReserve / profile.totalCapital > 0.35
      ? {
          id: "reserve-share",
          status: "warn",
          title: "The reserve is a large share of your capital",
          detail:
            "Fixed post-closing costs do not scale down with a small purchase, so on a modest budget they consume a disproportionate share.",
          action: "Consider fewer, larger purchases over time rather than several small ones.",
        }
      : {
          id: "reserve-share",
          status: "pass",
          title: "Reserve is proportionate",
          detail: `$${budget.workingReserve.toLocaleString()} held back for carry and first-year surprises.`,
        },
  );

  if (firstTimer && crossBorder) {
    gates.push({
      // Advisory rather than blocking: this is a strong recommendation, not a
      // legal impossibility, and an adult with the facts can weigh it.
      id: "first-deal-abroad",
      status: "warn",
      title: "Strongly consider making your first purchase at home",
      detail:
        "A first purchase is where you learn conveyancing, diligence sequencing and how sellers behave. Doing that in a second legal system, in another language, with a foreign-ownership regime layered on top, multiplies the number of things that can go wrong at exactly the moment you are least able to spot them. This is advice, not a rule — plenty of people have done it the other way round.",
      action:
        "If you proceed abroad anyway, compensate deliberately: engage local counsel before you make any offer rather than at contract stage, budget the higher diligence and transfer costs shown below, and do not skip the site visit. The alternative is to close one domestically first and take what you learned with you.",
    });
  } else if (crossBorder) {
    gates.push({
      id: "first-deal-abroad",
      status: "warn",
      title: "Cross-border adds a second legal system to learn",
      detail:
        "You have prior land experience, which helps, but eligibility rules, transfer taxes and repatriation mechanics are all new surface area.",
      action: "Budget for local counsel from day one rather than treating it as a late-stage cost.",
    });
  }

  if (profile.canVisitInPerson === "no") {
    gates.push({
      id: "site-visit",
      status: crossBorder ? "fail" : "warn",
      title: "You have said you cannot visit the property",
      detail:
        "Occupation, access, neighbouring use and the actual condition of a well never appear in any record. Walking the boundaries is the only diligence step that reliably surfaces them, and it cannot be delegated to a desk.",
      action: "Do not buy land you have not stood on. If travel is impossible, this is the constraint to solve first.",
    });
  } else {
    gates.push({
      id: "site-visit",
      status: "pass",
      title: "You can inspect in person",
      detail: "Budget two visits: one to decide whether to offer, one during diligence with a surveyor.",
    });
  }

  if (profile.monthsToFirstPurchase < 3) {
    gates.push({
      id: "timeline",
      status: "warn",
      title: "The timeline is tight for a first purchase",
      detail: `${profile.monthsToFirstPurchase} months leaves little room. Agency records requests, a pump test and a title commitment take 60 to 90 days on their own, and that is after you have found a parcel worth spending on.`,
      action: "Treat six months as the realistic floor from standing start to closing, and do not compress the water contingency to make a date.",
    });
  } else {
    gates.push({
      id: "timeline",
      status: "pass",
      title: "The timeline is realistic",
      detail: `${profile.monthsToFirstPurchase} months is enough to search properly, take two or three parcels into diligence, and still walk from the first two.`,
    });
  }

  if (profile.waterKnowledge === "none") {
    gates.push({
      id: "water-literacy",
      status: "warn",
      title: "Water rights are the part you have said you do not know yet",
      detail:
        "That is fine and it is fixable in a few weeks, but it is also where the money is lost. The difference between a decree, a permit, a ditch share and an unregistered well is the difference between owning water and owning a hole in the ground.",
      action: "Work through the learning list below before you make an offer, not after.",
    });
  }

  if (profile.operatingIntent === "operate-myself" && profile.landExperience === "none") {
    gates.push({
      id: "operating-experience",
      status: "warn",
      title: "You intend to operate but have not farmed before",
      detail:
        "Operating changes the water requirement, the infrastructure spend and the failure modes. It also removes the option of simply holding through a bad year.",
      action:
        "Consider leasing the ground to an established local operator for the first two seasons. You keep the asset, learn the district and the water, and someone else carries the agronomic risk.",
    });
  }

  if (profile.financing === "cash-only" && budget.maxPurchasePrice > 0) {
    gates.push({
      id: "cash-advantage",
      status: "pass",
      title: "Paying cash is real negotiating leverage",
      detail:
        "Rural sellers value certainty and speed. Cash lets you ask for a longer water contingency and an escrow holdback and still be the preferred buyer — trade the certainty for terms rather than for price alone.",
    });
  }

  return gates;
}

function bandFor(gates: ReadinessGate[]): { band: ReadinessBand; score: number; headline: string } {
  const fails = gates.filter((g) => g.status === "fail").length;
  const warns = gates.filter((g) => g.status === "warn").length;
  const score = Math.max(0, Math.min(100, 100 - fails * 30 - warns * 10));

  if (fails > 0) {
    return {
      band: fails > 1 ? "not-yet" : "prepare",
      score,
      headline:
        fails > 1
          ? "There are blocking issues to resolve before you start looking."
          : "One blocking issue stands between you and a first purchase.",
    };
  }
  if (warns >= 3) {
    return { band: "prepare", score, headline: "Workable, with several things to sort out first." };
  }
  if (warns > 0) {
    return { band: "nearly", score, headline: "Close to ready. Clear the flagged items while you search." };
  }
  return { band: "ready", score, headline: "You are ready to start looking seriously." };
}

// ---------------------------------------------------------------------------
// Jurisdiction shortlist
// ---------------------------------------------------------------------------

/**
 * Scores a jurisdiction for a *first* purchase, which is a different question
 * from scoring it for value. Simplicity, transfer certainty and reversibility
 * dominate; the places where water is most valuable are usually the places
 * where the rules are hardest, and that trade-off is stated in the output
 * rather than hidden inside the number.
 */
function easeScore(j: JurisdictionProfile, profile: BuyerProfile, homeCountry: string): number {
  let s = 100;
  const isDomestic = (j.subnational ? "US" : j.code) === homeCountry;

  if (!isDomestic) {
    s -= 20;
    const fo = j.foreignOwnership;
    const cr = j.countryRisk;
    if (!fo || !cr) return 0;
    if (fo.regime === "prohibited") return 0;
    if (fo.regime === "leasehold-only") s -= 25;
    if (fo.regime === "structure-required") s -= 15;
    if (fo.regime === "approval-required") s -= 15;
    if (fo.regime === "restricted-rural") s -= 18;
    if (cr.titleReliability === "high" || cr.titleReliability === "severe") s -= 25;
    if (cr.expropriationRisk === "high" || cr.expropriationRisk === "severe") s -= 18;
    if (cr.customaryTenureRisk === "severe") s -= 15;
    if (cr.currencyControls) s -= 10;
  }

  switch (j.transferability) {
    case "appurtenant-transfers-with-land":
      s += 12;
      break;
    case "severable-with-approval":
      s -= 4;
      break;
    case "limited":
      s -= 6;
      break;
    case "severable-freely":
      s -= 10;
      break;
  }

  const closure = { low: 6, moderate: -4, high: -14, severe: -22 }[j.closedBasinRisk];
  s += closure;

  if (j.forfeitureYears === null) s += 8;
  else if (j.forfeitureYears >= 7) s += 3;
  else if (j.forfeitureYears <= 4) s -= 8;

  switch (j.surfaceDoctrine) {
    case "regulated-riparian":
    case "riparian":
      s += 10;
      break;
    case "prior-appropriation":
      s -= 4;
      break;
    case "hybrid":
      s -= 8;
      break;
    case "tradable-entitlement":
      s -= 4;
      break;
    case "customary":
      s -= 25;
      break;
  }

  return Math.max(0, Math.min(100, Math.round(s)));
}

/**
 * Whether water here is an asset worth building a position around.
 *
 * Ease alone is the wrong objective and produces an actively misleading list:
 * the simplest places to buy are riparian states where water runs with the land
 * and is therefore not a differentiated asset at all. Ranked purely on
 * simplicity the engine recommends Delaware to someone assembling a thousand
 * water-secured acres, which is precise and useless. This is the counterweight.
 */
function waterValueScore(j: JurisdictionProfile): number {
  let s: number;
  switch (j.surfaceDoctrine) {
    case "tradable-entitlement":
      s = 100;
      break;
    case "hybrid":
      s = 90;
      break;
    case "prior-appropriation":
      s = 85;
      break;
    case "administrative-concession":
      s = 70;
      break;
    case "regulated-riparian":
      s = 40;
      break;
    case "riparian":
      s = 30;
      break;
    case "customary":
      s = 20;
      break;
  }

  // Scarcity is what gives a water right value. Total abundance means the right
  // is not the scarce input; total closure means you cannot get one at all.
  const scarcity = { low: -12, moderate: 6, high: 8, severe: -4 }[j.closedBasinRisk];
  s += scarcity;

  // A right you can move is worth more than one welded to a specific field.
  if (j.transferability === "severable-freely") s += 10;
  else if (j.transferability === "severable-with-approval") s += 5;
  else if (j.transferability === "limited") s -= 5;

  return Math.max(0, Math.min(100, Math.round(s)));
}

/**
 * Ease and water value pull in opposite directions almost everywhere, so the
 * blend is the whole point. An aggressive buyer weights value; a conservative
 * one weights ease. Both sub-scores are surfaced so the trade-off stays visible
 * instead of disappearing into a single number.
 */
function blendWeights(appetite: BuyerProfile["riskAppetite"]): { ease: number; value: number } {
  if (appetite === "conservative") return { ease: 0.7, value: 0.3 };
  if (appetite === "aggressive") return { ease: 0.4, value: 0.6 };
  return { ease: 0.55, value: 0.45 };
}

function buildShortlist(profile: BuyerProfile, homeCountry: string): JurisdictionPick[] {
  const pool = JURISDICTIONS.filter((j) => {
    const isDomestic = (j.subnational ? "US" : j.code) === homeCountry;
    if (profile.geographyPreference === "international") return !isDomestic;
    if (profile.geographyPreference === "near-home" || profile.geographyPreference === "best-value-domestic") {
      return isDomestic;
    }
    return true;
  });

  const w = blendWeights(profile.riskAppetite);

  return pool
    .map((j) => {
      const ease = easeScore(j, profile, homeCountry);
      const waterValue = waterValueScore(j);
      return { j, ease, waterValue, score: Math.round(ease * w.ease + waterValue * w.value) };
    })
    // Ease of zero means legally closed or unworkable, whatever the water is worth.
    .filter((x) => x.ease > 0)
    .sort((a, b) => b.score - a.score || b.waterValue - a.waterValue || a.j.name.localeCompare(b.j.name))
    .slice(0, 6)
    .map(({ j, score, ease, waterValue }) => ({
      code: j.code,
      name: j.subnational ? `${j.name}, USA` : j.name,
      score,
      ease,
      waterValue,
      why: whyPick(j),
      watchOut: j.cautions[0] ?? j.notes,
    }));
}

function whyPick(j: JurisdictionProfile): string {
  const bits: string[] = [];
  if (j.surfaceDoctrine === "tradable-entitlement") {
    bits.push("water trades as an asset in its own right, with a register and observable prices");
  }
  if (j.transferability === "appurtenant-transfers-with-land") {
    bits.push("water transfers with the land rather than by a separate instrument");
  }
  if (j.closedBasinRisk === "low") bits.push("basins are not closed to new appropriation");
  if (j.forfeitureYears === null) bits.push("no forfeiture clock to inherit");
  else if (j.forfeitureYears >= 7) bits.push(`a forgiving ${j.forfeitureYears}-year forfeiture period`);
  if (j.surfaceDoctrine === "regulated-riparian" || j.surfaceDoctrine === "riparian") {
    bits.push("a riparian regime with far fewer moving parts than a priority system");
  }
  if (j.foreignOwnership?.regime === "unrestricted") bits.push("no restrictions on foreign buyers");
  return bits.length > 0
    ? `${bits.slice(0, 3).join(", ")}.`
    : "A workable combination of transfer rules and basin conditions for a first purchase.";
}

// ---------------------------------------------------------------------------
// Target profile, plan, search brief, learning
// ---------------------------------------------------------------------------

function buildTargetProfile(profile: BuyerProfile, budget: BudgetEnvelope): TargetProfile {
  const reference = profile.expectedPricePerAcre && profile.expectedPricePerAcre > 0 ? profile.expectedPricePerAcre : 3_000;
  const mid = budget.maxPurchasePrice / reference;

  const conservative = profile.riskAppetite === "conservative";
  const prefer: string[] = [
    "A water right already adjudicated or certificated, with the state's own document in hand",
    "Water appurtenant to the land, conveying by deed rather than by a separate assignment",
    "Recorded, insurable legal access",
    "A seller who can produce the permit or decree number in the first conversation",
  ];
  const avoid: string[] = [
    "Ditch or mutual company shares on a first purchase — the certificate mechanics catch experienced buyers out",
    "Any parcel with a documented gap in beneficial use approaching the state's forfeiture period",
    "Unregistered wells",
    "Land where the water has ever been severed, leased away or reserved",
  ];

  if (conservative) {
    avoid.push("Basins carrying severe closure risk, however cheap the land looks");
    avoid.push("Change-of-use plays that depend on a historical consumptive use analysis going your way");
  }
  if (profile.riskAppetite === "aggressive") {
    prefer.push("A senior priority date, which is the attribute that holds value independent of the land");
  }

  return {
    acreBandLow: Math.max(5, Math.round(mid * 0.5)),
    acreBandHigh: Math.max(10, Math.round(mid * 1.2)),
    minComposite: conservative ? 75 : 65,
    prefer,
    avoid,
    rationale:
      "Your first purchase is not the one to optimise. It is the one that has to teach you records searches, agency phone calls, escrow structure and how sellers behave — with downside you can absorb. Buy something simple enough that you can check it properly and small enough that being wrong is survivable, then take the lesson into a larger second purchase.",
  };
}

function buildSteps(profile: BuyerProfile, budget: BudgetEnvelope, shortlist: JurisdictionPick[]): GuideStep[] {
  const first = shortlist[0]?.name ?? "your target jurisdiction";
  const second = shortlist[1]?.name;

  return [
    {
      order: 1,
      window: "Week 1",
      title: "Fix the budget and never move it",
      detail: `Set aside $${budget.diligenceProgram.toLocaleString()} for diligence and $${budget.workingReserve.toLocaleString()} as reserve, in separate accounts if that helps. What remains — about $${budget.maxPurchasePrice.toLocaleString()} — is the ceiling on the land. Writing this down now is what stops you spending the reserve on a parcel you have fallen for in month four.`,
      gate: true,
    },
    {
      order: 2,
      window: "Weeks 1-2",
      title: "Pick one jurisdiction and learn it properly",
      detail: `Choose one — ${first}${second ? `, with ${second} as the alternate` : ""} — and read its entry in the jurisdiction reference end to end. Learning one state's rules deeply beats knowing five states shallowly, because the traps are specific and the agency relationships compound.`,
      gate: true,
    },
    {
      order: 3,
      window: "Weeks 2-3",
      title: "Call the water agency before you call any agent",
      detail:
        "Ring the agency of record for that jurisdiction, say you are a prospective buyer, and ask how to search rights by legal description. They will tell you. This single call converts the whole registry from theory into something you can operate, and it costs nothing.",
      gate: true,
    },
    {
      order: 4,
      window: "Weeks 3-6",
      title: "Screen twenty listings without contacting anyone",
      detail:
        "Run each through the parcel wizard using only what the listing states. You are not trying to find the winner — you are calibrating. After twenty you will recognise the language sellers use when the water is real and the language they use when it is not.",
      gate: false,
    },
    {
      order: 5,
      window: "Weeks 5-8",
      title: "Send the seller questions on your best three",
      detail:
        "In writing, and ask for written replies. The questions a seller declines to answer tell you more than the ones they answer. Expect two of the three to fall away here, at zero cost.",
      gate: false,
    },
    {
      order: 6,
      window: "Weeks 6-10",
      title: "Walk the land and pull the records yourself",
      detail:
        "Visit in person, walk the boundaries, find the diversion point or wellhead, and separately search the agency record by legal description. Do not accept the seller's copy of anything you can pull yourself.",
      gate: true,
    },
    {
      order: 7,
      window: "Weeks 8-14",
      title: "Make a conditional offer, not a clean one",
      detail: `Offer with a water-specific contingency of 60 to 90 days, an escrow holdback on the water portion released only when the agency confirms the right is recorded in your name, and written representations on quantity, priority and absence of prior severance. ${profile.financing === "cash-only" ? "Cash is your leverage — spend it on terms rather than on price." : "If you are financing, get the lender comfortable with the water documentation early; it is the thing that delays closings."}`,
      gate: true,
    },
    {
      order: 8,
      window: "Weeks 10-20",
      title: "Run diligence in the order that kills the deal soonest",
      detail:
        "Free checks first — agency records, assessor, USGS water levels. Then the title commitment. Then the pump test. Counsel and engineering last, because they are the expensive items and by then you already believe the deal.",
      gate: true,
    },
    {
      order: 9,
      window: "Closing",
      title: "Confirm the water conveys by the correct instrument",
      detail:
        "The most common total loss in this asset class is a buyer who received the land and not the water because the wrong document was used. Have counsel confirm in writing which instrument moves the right, and see it executed.",
      gate: true,
    },
    {
      order: 10,
      window: "First 90 days after closing",
      title: "Record ownership, use the water, and write down what you learned",
      detail:
        "File the change of ownership with the agency so curtailment and forfeiture notices reach you. Put the water to beneficial use and document it. Then write down what surprised you — that document is what makes the second purchase faster and larger.",
      gate: false,
    },
  ];
}

function buildSearchBrief(profile: BuyerProfile, shortlist: JurisdictionPick[], crossBorder: boolean): SearchBrief {
  const channels = [
    "Land-specialist brokerages rather than residential portals — the inventory barely overlaps",
    "The county assessor's parcel viewer, to identify large holdings and their owners directly",
    "Farm Credit and agricultural lender REO listings, which are often quietly priced",
    "Auction houses that handle estate and retirement dispersals, where the seller is motivated and the water documentation is usually thin",
    "Direct letters to owners of adjoining parcels once you have bought — the cheapest acres you will ever assemble",
  ];
  if (crossBorder) {
    channels.push("A local land agent retained by you, not the seller, and paid by the hour rather than on commission");
  }

  const filters = [
    `Price at or below $${shortlist.length > 0 ? "your ceiling" : "your ceiling"} — set the portal filter and do not look above it`,
    "Listings that state a permit, certificate or decree number in the description",
    "Parcels with recorded road frontage or an explicit recorded easement",
    "Avoid anything described only as 'plenty of water' or 'water rights included' with no number",
  ];
  if (profile.operatingIntent !== "passive-hold") {
    filters.push("Existing irrigation infrastructure in working order, with a replacement history you can see");
  }

  return {
    channels,
    filters,
    firstContactQuestions: [
      "What is the permit, certificate or decree number for the water, and can you send me a copy?",
      "In which of the last five years was the water actually used, and what evidence exists?",
      "Has any water ever been sold, leased or reserved away from this land?",
      "Is legal access recorded, and does it also reach the wellhead or diversion point?",
      "Why is the seller selling, and how long has it been on the market?",
    ],
  };
}

function buildLearning(profile: BuyerProfile, shortlist: JurisdictionPick[]): LearningItem[] {
  const jurisdiction = shortlist[0]?.name ?? "your target jurisdiction";
  const items: LearningItem[] = [
    {
      topic: `How ${jurisdiction} allocates water`,
      why: "Every other question depends on whether the right is priority-dated, permit-based, riparian or a concession. Getting this wrong makes all your other reasoning wrong.",
      how: "Read the jurisdiction entry in this tool, then the agency's own 'how to' page for prospective buyers.",
    },
    {
      topic: "Reading a decree, certificate or permit",
      why: "Six attributes define the asset: priority date, flow rate, annual volume, point of diversion, place of use and type of use. If any one differs from what you assumed, the deal changes.",
      how: "Ask the agency for a sample document, or pull a public one for any parcel and read it line by line before you need to.",
    },
    {
      topic: "The difference between a right and its delivery",
      why: "Paper acre-feet and wet water diverge in a dry year. Historic curtailment frequency is the number that matters and it is rarely in the listing.",
      how: "Ask the local water commissioner or district how often that priority was in regulation over the last twenty years.",
    },
  ];

  if (profile.waterKnowledge === "none") {
    items.push({
      topic: "Why beneficial use and forfeiture exist",
      why: "In most western states a right that goes unused can be lost, and buying it does not revive it. This is the single most common way a first-time buyer pays for water that no longer exists.",
      how: "Read the forfeiture period for your chosen jurisdiction here, then find one published abandonment or cancellation case in that state and read what happened.",
    });
  }
  if (profile.operatingIntent === "operate-myself") {
    items.push({
      topic: "Irrigation duty for your intended crop",
      why: "The acre-feet per acre your crop actually needs determines whether the right is adequate. Assuming rather than calculating is how buyers end up with half the water they need.",
      how: "Get the local extension service's duty figures for the crop and the county, not a national average.",
    });
  }
  items.push({
    topic: "How escrow holdbacks and water contingencies are written",
    why: "These are the two mechanisms that protect you when the diligence is not finished by the closing date, and both have to be negotiated before you are emotionally committed.",
    how: "Ask a local real estate attorney to show you the water provisions from a past agricultural contract, redacted.",
  });

  return items;
}

function buildPath(profile: BuyerProfile, budget: BudgetEnvelope): PathToTarget {
  const reference = profile.expectedPricePerAcre && profile.expectedPricePerAcre > 0 ? profile.expectedPricePerAcre : null;
  const firstPurchaseAcres = reference ? Math.round(budget.maxPurchasePrice / reference) : null;
  const remainingAfterFirst = firstPurchaseAcres === null ? null : Math.max(0, profile.targetAcres - firstPurchaseAcres);
  const parcelsAtThisSize =
    firstPurchaseAcres && firstPurchaseAcres > 0 && remainingAfterFirst !== null
      ? Math.ceil(remainingAfterFirst / firstPurchaseAcres)
      : null;

  const annual = profile.annualAddition ?? 0;
  const costPerParcel = budget.maxPurchasePrice * (1 + budget.closingCostsRate + budget.reserveRate);
  const yearsAtCurrentCadence =
    annual > 0 && parcelsAtThisSize !== null && costPerParcel > 0
      ? Math.ceil((parcelsAtThisSize * costPerParcel) / annual)
      : null;

  return {
    firstPurchaseAcres,
    remainingAfterFirst,
    parcelsAtThisSize,
    yearsAtCurrentCadence,
    cadenceNote:
      yearsAtCurrentCadence !== null
        ? `At $${annual.toLocaleString()} added each year, and buying at roughly this size, reaching ${profile.targetAcres.toLocaleString()} acres takes on the order of ${yearsAtCurrentCadence} years. That is a planning figure, not a forecast — it ignores appreciation, income from the land and the fact that your second purchase should be better than your first.`
        : reference === null
          ? "Enter an expected price per acre to see how many purchases the target implies."
          : "Add an annual contribution figure to project a timeline to the target.",
    compoundingNote:
      "Three things bend this curve. Contiguity: adjacent parcels share infrastructure, one set of agency relationships and, in a few jurisdictions such as Oklahoma, literally more water allocation. Income: land that produces can fund the next purchase rather than waiting on savings. And judgement: your fifth diligence process costs a fraction of your first, so the diligence line in this budget shrinks as you go.",
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function buildFirstPurchaseGuide(profile: BuyerProfile): FirstPurchaseGuide {
  const homeCountry = (profile.homeCountry || "US").toUpperCase();
  const shortlist = buildShortlist(profile, homeCountry);

  // Cross-border only if the buyer is actually pointed abroad.
  const crossBorder =
    profile.geographyPreference === "international" ||
    (shortlist.length > 0 && shortlist.every((p) => {
      const j = getJurisdiction(p.code);
      return j ? (j.subnational ? "US" : j.code) !== homeCountry : false;
    }));

  const budget = buildBudget(profile, crossBorder);
  const gates = buildGates(profile, budget, crossBorder);
  const { band, score, headline } = bandFor(gates);

  return {
    readiness: { score, band, headline, gates },
    budget,
    targetProfile: buildTargetProfile(profile, budget),
    shortlist,
    steps: buildSteps(profile, budget, shortlist),
    searchBrief: buildSearchBrief(profile, shortlist, crossBorder),
    learning: buildLearning(profile, shortlist),
    pathToTarget: buildPath(profile, budget),
    crossBorder,
    generatedAt: new Date().toISOString(),
  };
}

export const READINESS_COPY: Record<ReadinessBand, { label: string; tone: string }> = {
  ready: { label: "Ready to look", tone: "var(--color-sage-400)" },
  nearly: { label: "Nearly ready", tone: "var(--accent)" },
  prepare: { label: "Prepare first", tone: "var(--color-ochre-500)" },
  "not-yet": { label: "Not yet", tone: "var(--color-rust-500)" },
};
