import test from "node:test";
import assert from "node:assert/strict";
import { buildFirstPurchaseGuide } from "../src/lib/first-purchase/engine";
import { getJurisdiction } from "../src/lib/water/registry";
import type { BuyerProfile } from "../src/lib/types";

function buyer(over: Partial<BuyerProfile> = {}): BuyerProfile {
  return {
    totalCapital: 400_000,
    financing: "cash-only",
    annualAddition: 100_000,
    targetAcres: 1000,
    monthsToFirstPurchase: 9,
    landExperience: "none",
    waterKnowledge: "none",
    operatingIntent: "lease-to-farmer",
    homeCountry: "US",
    canVisitInPerson: "yes",
    geographyPreference: "best-value-domestic",
    riskAppetite: "balanced",
    ...over,
  };
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

test("the budget reconciles: land plus closing plus reserve plus diligence fits the capital", () => {
  for (const capital of [150_000, 400_000, 1_200_000, 5_000_000]) {
    const g = buildFirstPurchaseGuide(buyer({ totalCapital: capital }));
    const b = g.budget;
    const spent = b.maxPurchasePrice + b.estimatedClosingCosts + b.workingReserve + b.diligenceProgram;
    assert.ok(spent <= capital * 1.02, `capital ${capital}: allocated ${spent} exceeds available`);
    assert.ok(b.maxPurchasePrice >= 0);
  }
});

test("diligence and reserve are never funded out of the land budget", () => {
  const g = buildFirstPurchaseGuide(buyer({ totalCapital: 400_000 }));
  assert.ok(g.budget.diligenceProgram > 0);
  assert.ok(g.budget.workingReserve >= 15_000, "reserve floor should hold");
  assert.ok(g.budget.maxPurchasePrice < 400_000, "the land budget must be less than total capital");
});

test("a passive hold costs less to diligence than an operating purchase", () => {
  const passive = buildFirstPurchaseGuide(buyer({ operatingIntent: "passive-hold" }));
  const operating = buildFirstPurchaseGuide(buyer({ operatingIntent: "operate-myself" }));
  assert.ok(passive.budget.perDealDiligence < operating.budget.perDealDiligence);
  assert.ok(passive.budget.maxPurchasePrice > operating.budget.maxPurchasePrice);
});

test("cross-border raises both diligence cost and closing costs", () => {
  const home = buildFirstPurchaseGuide(buyer({ geographyPreference: "best-value-domestic" }));
  const abroad = buildFirstPurchaseGuide(buyer({ geographyPreference: "international", landExperience: "experienced" }));
  assert.ok(abroad.budget.perDealDiligence > home.budget.perDealDiligence);
  assert.ok(abroad.budget.closingCostsRate > home.budget.closingCostsRate);
  assert.equal(abroad.crossBorder, true);
  assert.equal(home.crossBorder, false);
});

test("thin capital fails the affordability gate rather than producing a fantasy budget", () => {
  const g = buildFirstPurchaseGuide(buyer({ totalCapital: 20_000 }));
  assert.equal(g.budget.maxPurchasePrice, 0);
  const gate = g.readiness.gates.find((x) => x.id === "capital-floor");
  assert.equal(gate?.status, "fail");
  assert.ok(gate?.action, "a failing gate must say what to do about it");
});

test("the acreage table reflects the land budget at each reference price", () => {
  const g = buildFirstPurchaseGuide(buyer({ totalCapital: 1_000_000 }));
  for (const row of g.budget.impliedAcres) {
    assert.equal(row.acres, Math.round(g.budget.maxPurchasePrice / row.pricePerAcre));
  }
  // A stated local price joins the table, which stays sorted as a scale.
  const withPrice = buildFirstPurchaseGuide(buyer({ totalCapital: 1_000_000, expectedPricePerAcre: 2_750 }));
  const prices = withPrice.budget.impliedAcres.map((i) => i.pricePerAcre);
  assert.ok(prices.includes(2_750));
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b), "the price scale must be ascending");
});

// ---------------------------------------------------------------------------
// Readiness gates
// ---------------------------------------------------------------------------

test("a first-timer is told not to make their first purchase abroad", () => {
  const g = buildFirstPurchaseGuide(buyer({ landExperience: "none", geographyPreference: "international" }));
  const gate = g.readiness.gates.find((x) => x.id === "first-deal-abroad");
  assert.equal(gate?.status, "fail");
  assert.match(g.readiness.band, /prepare|not-yet/);
});

test("an experienced buyer going abroad gets a warning, not a block", () => {
  const g = buildFirstPurchaseGuide(buyer({ landExperience: "experienced", geographyPreference: "international" }));
  const gate = g.readiness.gates.find((x) => x.id === "first-deal-abroad");
  assert.equal(gate?.status, "warn");
});

test("not visiting is fatal abroad and a warning at home", () => {
  const home = buildFirstPurchaseGuide(buyer({ canVisitInPerson: "no" }));
  assert.equal(home.readiness.gates.find((x) => x.id === "site-visit")?.status, "warn");

  const abroad = buildFirstPurchaseGuide(
    buyer({ canVisitInPerson: "no", geographyPreference: "international", landExperience: "experienced" }),
  );
  assert.equal(abroad.readiness.gates.find((x) => x.id === "site-visit")?.status, "fail");
});

test("an unrealistic timeline is flagged", () => {
  const rushed = buildFirstPurchaseGuide(buyer({ monthsToFirstPurchase: 2 }));
  assert.equal(rushed.readiness.gates.find((x) => x.id === "timeline")?.status, "warn");
  const paced = buildFirstPurchaseGuide(buyer({ monthsToFirstPurchase: 12 }));
  assert.equal(paced.readiness.gates.find((x) => x.id === "timeline")?.status, "pass");
});

test("readiness band degrades as gates fail", () => {
  const clean = buildFirstPurchaseGuide(
    buyer({ landExperience: "experienced", waterKnowledge: "strong", monthsToFirstPurchase: 12, totalCapital: 900_000 }),
  );
  assert.equal(clean.readiness.band, "ready");
  assert.equal(clean.readiness.score, 100);

  const rough = buildFirstPurchaseGuide(
    buyer({ totalCapital: 20_000, geographyPreference: "international", canVisitInPerson: "no", monthsToFirstPurchase: 1 }),
  );
  assert.equal(rough.readiness.band, "not-yet");
  assert.ok(rough.readiness.score < clean.readiness.score);
});

// ---------------------------------------------------------------------------
// Shortlist
// ---------------------------------------------------------------------------

test("the shortlist respects the geography preference", () => {
  const domestic = buildFirstPurchaseGuide(buyer({ geographyPreference: "best-value-domestic" }));
  for (const p of domestic.shortlist) {
    assert.ok(getJurisdiction(p.code)?.subnational, `${p.code} should be a US state`);
  }

  const abroad = buildFirstPurchaseGuide(buyer({ geographyPreference: "international", landExperience: "experienced" }));
  for (const p of abroad.shortlist) {
    assert.equal(getJurisdiction(p.code)?.subnational, false, `${p.code} should be international`);
  }
});

test("jurisdictions closed to foreign buyers never reach an international shortlist", () => {
  const g = buildFirstPurchaseGuide(
    buyer({ geographyPreference: "international", landExperience: "experienced", homeCountry: "US" }),
  );
  for (const p of g.shortlist) {
    const j = getJurisdiction(p.code)!;
    assert.notEqual(j.foreignOwnership?.regime, "prohibited", `${p.name} is closed and should not be recommended`);
  }
});

test("the shortlist is not a simplicity contest won by states without water", () => {
  // Ranked on ease alone the engine recommends Delaware and Connecticut to
  // someone assembling a thousand water-secured acres, because riparian states
  // are the easiest to transact in precisely because water is not a separate
  // asset there. The blend has to prevent that.
  const g = buildFirstPurchaseGuide(buyer({ geographyPreference: "best-value-domestic" }));
  const doctrines = g.shortlist.map((p) => getJurisdiction(p.code)!.surfaceDoctrine);
  const appropriative = doctrines.filter((d) => d === "prior-appropriation" || d === "hybrid").length;
  assert.ok(
    appropriative >= 4,
    `expected mostly appropriative jurisdictions, got ${JSON.stringify(g.shortlist.map((p) => p.name))}`,
  );

  for (const p of g.shortlist) {
    assert.ok(p.waterValue >= 50, `${p.name} has water value ${p.waterValue} and should not be recommended`);
    assert.ok(p.ease > 0 && p.ease <= 100);
  }
});

test("ties break deterministically rather than alphabetically", () => {
  // Two runs of the same profile must produce the same order, and the order
  // must not simply be the alphabet.
  const a = buildFirstPurchaseGuide(buyer());
  const b = buildFirstPurchaseGuide(buyer());
  assert.deepEqual(a.shortlist.map((p) => p.code), b.shortlist.map((p) => p.code));

  const names = a.shortlist.map((p) => p.name);
  const alphabetical = [...names].sort((x, y) => x.localeCompare(y));
  assert.notDeepEqual(names, alphabetical, "a purely alphabetical shortlist means the scores are not discriminating");
});

test("risk appetite shifts the ease/value blend in the expected direction", () => {
  const avgValue = (appetite: BuyerProfile["riskAppetite"]) => {
    const g = buildFirstPurchaseGuide(buyer({ riskAppetite: appetite }));
    return g.shortlist.reduce((t, p) => t + p.waterValue, 0) / g.shortlist.length;
  };
  assert.ok(
    avgValue("aggressive") >= avgValue("conservative"),
    "an aggressive buyer should be shown jurisdictions where water is worth more",
  );
});

test("the shortlist is ranked and bounded", () => {
  const g = buildFirstPurchaseGuide(buyer({ geographyPreference: "open" }));
  assert.ok(g.shortlist.length > 0 && g.shortlist.length <= 6);
  for (let i = 1; i < g.shortlist.length; i++) {
    assert.ok(g.shortlist[i - 1]!.score >= g.shortlist[i]!.score, "shortlist must be sorted by score");
  }
  for (const p of g.shortlist) {
    assert.ok(p.why.length > 0 && p.watchOut.length > 0, `${p.name} missing rationale or caveat`);
  }
});

test("an aggressive buyer sees tradable-water jurisdictions rank higher than a conservative one does", () => {
  const rank = (appetite: BuyerProfile["riskAppetite"]) => {
    const g = buildFirstPurchaseGuide(
      buyer({ riskAppetite: appetite, geographyPreference: "international", landExperience: "experienced" }),
    );
    return g.shortlist.findIndex((p) => getJurisdiction(p.code)?.surfaceDoctrine === "tradable-entitlement");
  };
  const aggressive = rank("aggressive");
  const conservative = rank("conservative");
  // -1 means absent; present-and-earlier beats absent or later.
  assert.ok(aggressive !== -1, "an aggressive buyer should see at least one tradable-water jurisdiction");
  assert.ok(conservative === -1 || aggressive <= conservative);
});

// ---------------------------------------------------------------------------
// Plan and path
// ---------------------------------------------------------------------------

test("the plan is ordered, gated and complete", () => {
  const g = buildFirstPurchaseGuide(buyer());
  assert.ok(g.steps.length >= 8);
  g.steps.forEach((s, i) => {
    assert.equal(s.order, i + 1, "steps must be sequentially numbered");
    assert.ok(s.title.length > 0 && s.detail.length > 0 && s.window.length > 0);
  });
  assert.ok(g.steps.some((s) => s.gate), "at least one step must gate further spending");
  assert.ok(g.searchBrief.firstContactQuestions.length >= 4);
  assert.ok(g.learning.length >= 3);
});

test("a buyer new to water rights gets the forfeiture lesson added", () => {
  const novice = buildFirstPurchaseGuide(buyer({ waterKnowledge: "none" }));
  const expert = buildFirstPurchaseGuide(buyer({ waterKnowledge: "strong" }));
  const hasForfeiture = (g: typeof novice) => g.learning.some((l) => /forfeiture/i.test(l.topic));
  assert.ok(hasForfeiture(novice));
  assert.ok(!hasForfeiture(expert));
});

test("the path to target only projects when it has the inputs", () => {
  const withoutPrice = buildFirstPurchaseGuide(buyer({ expectedPricePerAcre: undefined }));
  assert.equal(withoutPrice.pathToTarget.firstPurchaseAcres, null);
  assert.equal(withoutPrice.pathToTarget.yearsAtCurrentCadence, null);
  assert.match(withoutPrice.pathToTarget.cadenceNote, /price per acre/i);

  const withPrice = buildFirstPurchaseGuide(
    buyer({ expectedPricePerAcre: 2_000, totalCapital: 500_000, annualAddition: 150_000 }),
  );
  assert.ok((withPrice.pathToTarget.firstPurchaseAcres ?? 0) > 0);
  assert.ok((withPrice.pathToTarget.parcelsAtThisSize ?? 0) > 0);
  assert.ok((withPrice.pathToTarget.yearsAtCurrentCadence ?? 0) > 0);
});

test("a bigger first purchase means fewer purchases to the same target", () => {
  const small = buildFirstPurchaseGuide(buyer({ expectedPricePerAcre: 8_000, totalCapital: 500_000 }));
  const large = buildFirstPurchaseGuide(buyer({ expectedPricePerAcre: 1_000, totalCapital: 500_000 }));
  assert.ok((large.pathToTarget.firstPurchaseAcres ?? 0) > (small.pathToTarget.firstPurchaseAcres ?? 0));
  assert.ok((large.pathToTarget.parcelsAtThisSize ?? 99) < (small.pathToTarget.parcelsAtThisSize ?? 0));
});

test("a conservative buyer gets a higher bar and more exclusions than an aggressive one", () => {
  const cautious = buildFirstPurchaseGuide(buyer({ riskAppetite: "conservative" }));
  const bold = buildFirstPurchaseGuide(buyer({ riskAppetite: "aggressive" }));
  assert.ok(cautious.targetProfile.minComposite > bold.targetProfile.minComposite);
  assert.ok(cautious.targetProfile.avoid.length > bold.targetProfile.avoid.length);
});

test("the target acreage band is derived from the budget, not invented", () => {
  const g = buildFirstPurchaseGuide(buyer({ totalCapital: 600_000, expectedPricePerAcre: 3_000 }));
  const mid = g.budget.maxPurchasePrice / 3_000;
  assert.ok(g.targetProfile.acreBandLow <= mid && mid <= g.targetProfile.acreBandHigh);
  assert.ok(g.targetProfile.acreBandLow < g.targetProfile.acreBandHigh);
});
