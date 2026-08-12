import test from "node:test";
import assert from "node:assert/strict";
import { assessParcel } from "../src/lib/water/engine";
import {
  ALL_JURISDICTIONS,
  JURISDICTIONS,
  INTERNATIONAL,
  US_STATES,
  getJurisdiction,
  isCrossBorder,
} from "../src/lib/water/registry";
import type { ParcelInput } from "../src/lib/types";

/** A deliberately clean deal: senior, adjudicated, documented, unencumbered. */
function goodParcel(overrides: Partial<ParcelInput> = {}): ParcelInput {
  return {
    label: "Test parcel",
    jurisdictionCode: "US-CO",
    county: "Prowers",
    acres: 160,
    intent: "irrigated-crop",
    irrigatedAcresPlanned: 120,
    surfaceRight: "decreed-appropriative",
    priorityDate: "1887",
    decreedAcreFeet: 600,
    adjudication: "fully-adjudicated",
    appurtenant: "yes",
    previouslySevered: "no",
    wellStatus: "permitted-and-registered",
    wellYieldGpm: 1200,
    aquiferTrend: "stable",
    inManagedDistrict: "no",
    documents: [
      "state-permit-or-decree",
      "deed-with-water-language",
      "title-commitment",
      "historical-use-records",
      "well-log-and-completion-report",
      "pump-test",
      "survey",
    ],
    documentedUseYears: 30,
    longestNonUseGapYears: 0,
    legalAccess: "yes",
    mineralEstateSevered: "no",
    conservationEasement: "no",
    existingLiens: "no",
    tribalOrFederalClaimsInBasin: "no",
    askingPrice: 1_600_000,
    closeTimelineDays: 90,
    financing: "cash",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Registry integrity
// ---------------------------------------------------------------------------

test("registry covers 50 US states plus the international set, with no code collisions", () => {
  assert.equal(Object.keys(US_STATES).length, 50);
  assert.ok(Object.keys(INTERNATIONAL).length >= 20);

  // US postal codes and ISO alpha-2 codes share a namespace, so a collision
  // would silently shadow one entry with the other.
  const overlap = Object.keys(US_STATES).filter((c) => c in INTERNATIONAL);
  assert.deepEqual(overlap, [], `colliding codes: ${overlap.join(", ")}`);
  assert.equal(JURISDICTIONS.length, Object.keys(ALL_JURISDICTIONS).length);
});

test("every profile has an agency, forum and at least one caution", () => {
  for (const s of JURISDICTIONS) {
    assert.ok(s.agency.name.length > 0, `${s.code} missing agency name`);
    assert.ok(s.agency.url.startsWith("https://"), `${s.code} agency url must be https`);
    assert.ok(s.adjudicationForum.length > 0, `${s.code} missing adjudication forum`);
    assert.ok(s.cautions.length > 0, `${s.code} has no cautions`);
    assert.ok(s.notes.length > 0, `${s.code} has no notes`);
  }
});

test("forfeiture periods are plausible where defined", () => {
  for (const s of JURISDICTIONS) {
    if (s.forfeitureYears !== null) {
      assert.ok(s.forfeitureYears >= 1 && s.forfeitureYears <= 20, `${s.code}: ${s.forfeitureYears}`);
    }
  }
});

test("known doctrine assignments are correct", () => {
  assert.equal(US_STATES["US-CO"]?.surfaceDoctrine, "prior-appropriation");
  assert.equal(US_STATES["US-TX"]?.groundwaterRegime, "rule-of-capture");
  assert.equal(US_STATES["US-CA"]?.surfaceDoctrine, "hybrid");
  assert.equal(US_STATES["US-NE"]?.groundwaterRegime, "correlative");
  assert.equal(US_STATES["US-FL"]?.surfaceDoctrine, "regulated-riparian");
  assert.equal(getJurisdiction("us-co")?.code, "US-CO");
  assert.equal(getJurisdiction("ZZ"), null);

  // The three codes that used to collide must now resolve to distinct entries.
  assert.equal(getJurisdiction("US-CA")?.name, "California");
  assert.equal(getJurisdiction("CA")?.name, "Canada");
  assert.equal(getJurisdiction("US-MA")?.name, "Massachusetts");
  assert.equal(getJurisdiction("MA")?.name, "Morocco");
  assert.equal(getJurisdiction("US-AR")?.name, "Arkansas");
  assert.equal(getJurisdiction("AR")?.name, "Argentina");
});

// ---------------------------------------------------------------------------
// Engine behavior
// ---------------------------------------------------------------------------

test("assessParcel runs for every state without throwing", () => {
  for (const s of JURISDICTIONS) {
    const result = assessParcel(goodParcel({ jurisdictionCode: s.code }));
    assert.ok(result.composite >= 0 && result.composite <= 100, `${s.code} composite out of range`);
    assert.ok(result.checklist.length > 0, `${s.code} produced no checklist`);
    assert.ok(result.sellerQuestions.length > 0, `${s.code} produced no seller questions`);
  }
});

test("a clean senior deal scores well and is not a walk", () => {
  const r = assessParcel(goodParcel());
  assert.ok(r.composite >= 70, `expected >= 70, got ${r.composite}`);
  assert.notEqual(r.verdict, "walk");
  assert.equal(r.findings.filter((f) => f.severity === "critical").length, 0);
});

test("unknown jurisdiction code throws", () => {
  assert.throws(() => assessParcel(goodParcel({ jurisdictionCode: "ZZ" })), /Unknown jurisdiction code/);
});

test("non-use beyond the forfeiture period raises a critical finding", () => {
  // Colorado forfeits after 10 years.
  const r = assessParcel(goodParcel({ longestNonUseGapYears: 12 }));
  const f = r.findings.find((x) => x.id === "forfeiture-exposure");
  assert.ok(f, "expected forfeiture-exposure finding");
  assert.equal(f.severity, "critical");
});

test("non-use below the threshold does not raise forfeiture", () => {
  const r = assessParcel(goodParcel({ longestNonUseGapYears: 3 }));
  assert.equal(
    r.findings.find((x) => x.id === "forfeiture-exposure"),
    undefined,
  );
});

test("forfeiture threshold is state-specific", () => {
  // North Dakota forfeits after 3 years; the same 4-year gap is critical there
  // and unremarkable in Colorado.
  const nd = assessParcel(goodParcel({ jurisdictionCode: "US-ND", longestNonUseGapYears: 4 }));
  const co = assessParcel(goodParcel({ jurisdictionCode: "US-CO", longestNonUseGapYears: 4 }));
  assert.ok(nd.findings.some((f) => f.id === "forfeiture-exposure"));
  assert.ok(!co.findings.some((f) => f.id === "forfeiture-exposure"));
});

test("prior severance is critical and cuts reliable yield", () => {
  const clean = assessParcel(goodParcel());
  const severed = assessParcel(goodParcel({ previouslySevered: "yes" }));
  assert.ok(severed.findings.some((f) => f.id === "previously-severed" && f.severity === "critical"));
  assert.ok(
    (severed.waterBalance.reliableAcreFeet ?? 0) < (clean.waterBalance.reliableAcreFeet ?? 0),
    "severance should reduce reliable yield",
  );
});

test("junior priority reduces reliable yield relative to senior", () => {
  const senior = assessParcel(goodParcel({ priorityDate: "1885" }));
  const junior = assessParcel(goodParcel({ priorityDate: "1998" }));
  assert.ok((junior.waterBalance.reliableAcreFeet ?? 0) < (senior.waterBalance.reliableAcreFeet ?? 0));
  assert.ok(junior.composite < senior.composite);
});

test("riparian claims are flagged in prior-appropriation states but not riparian ones", () => {
  const co = assessParcel(goodParcel({ jurisdictionCode: "US-CO", surfaceRight: "riparian" }));
  const ga = assessParcel(goodParcel({ jurisdictionCode: "US-GA", surfaceRight: "riparian" }));
  assert.ok(co.findings.some((f) => f.id === "riparian-claim-in-appropriation-state"));
  assert.ok(!ga.findings.some((f) => f.id === "riparian-claim-in-appropriation-state"));
});

test("Texas surfaces the severable groundwater estate", () => {
  const r = assessParcel(goodParcel({ jurisdictionCode: "US-TX" }));
  assert.ok(r.findings.some((f) => f.id === "groundwater-estate-severable"));
  assert.ok(r.checklist.some((c) => c.id === "groundwater-estate-search" && c.blocking));
});

test("ditch shares require a certificate and a company call", () => {
  const r = assessParcel(goodParcel({ surfaceRight: "ditch-company-shares", documents: ["title-commitment"] }));
  assert.ok(r.findings.some((f) => f.id === "ditch-shares-are-personal-property"));
  assert.ok(r.findings.some((f) => f.id === "missing-share-certificate" && f.severity === "critical"));
  assert.ok(r.checklist.some((c) => c.id === "ditch-company"));
});

test("no water plus a consumptive intent is critical; a conservation hold is not", () => {
  const dry = assessParcel(goodParcel({ surfaceRight: "none", wellStatus: "none", decreedAcreFeet: undefined }));
  assert.ok(dry.findings.some((f) => f.id === "no-water-at-all" && f.severity === "critical"));

  const hold = assessParcel(
    goodParcel({
      surfaceRight: "none",
      wellStatus: "none",
      decreedAcreFeet: undefined,
      intent: "conservation-hold",
      irrigatedAcresPlanned: 0,
    }),
  );
  assert.ok(!hold.findings.some((f) => f.id === "no-water-at-all"));
});

test("landlocked parcels are critical and gate the pre-offer phase", () => {
  const r = assessParcel(goodParcel({ legalAccess: "no" }));
  assert.ok(r.findings.some((f) => f.id === "landlocked" && f.severity === "critical"));
  const item = r.checklist.find((c) => c.id === "resolve-access");
  assert.ok(item && item.phase === "pre-offer" && item.blocking);
});

test("an unregistered well is critical", () => {
  const r = assessParcel(goodParcel({ wellStatus: "unregistered" }));
  assert.ok(r.findings.some((f) => f.id === "well-unregistered" && f.severity === "critical"));
});

test("a change of use discounts reliable yield sharply", () => {
  const irrigation = assessParcel(goodParcel({ intent: "irrigated-crop" }));
  const development = assessParcel(goodParcel({ intent: "development", irrigatedAcresPlanned: 0 }));
  assert.ok(development.findings.some((f) => f.id === "change-of-use-required"));
  assert.ok(
    (development.waterBalance.reliableAcreFeet ?? 0) < (irrigation.waterBalance.reliableAcreFeet ?? 0) * 0.6,
    "change of use should cut reliable yield by more than 40%",
  );
});

test("stacked critical failures produce a walk verdict", () => {
  const r = assessParcel(
    goodParcel({
      surfaceRight: "unknown",
      priorityDate: undefined,
      adjudication: "unadjudicated",
      appurtenant: "no",
      previouslySevered: "yes",
      wellStatus: "unregistered",
      aquiferTrend: "steeply-declining",
      documents: [],
      documentedUseYears: 0,
      longestNonUseGapYears: 15,
      legalAccess: "no",
      mineralEstateSevered: "yes",
      existingLiens: "yes",
      tribalOrFederalClaimsInBasin: "yes",
      closeTimelineDays: 21,
    }),
  );
  assert.equal(r.verdict, "walk");
  assert.ok(r.findings.filter((f) => f.severity === "critical").length >= 3);
});

test("the reliability factor never exceeds 1 and never goes negative", () => {
  for (const s of JURISDICTIONS) {
    const r = assessParcel(goodParcel({ jurisdictionCode: s.code }));
    assert.ok(r.waterBalance.reliabilityFactor > 0 && r.waterBalance.reliabilityFactor <= 1, s.code);
  }
});

test("category weights sum to 1", () => {
  const r = assessParcel(goodParcel());
  const total = r.categories.reduce((t, c) => t + c.weight, 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `weights sum to ${total}`);
});

test("findings are deduplicated and severity-ordered", () => {
  const r = assessParcel(goodParcel({ jurisdictionCode: "US-CA", previouslySevered: "unknown", aquiferTrend: "declining" }));
  const ids = r.findings.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate finding ids");

  const rank: Record<string, number> = { critical: 0, major: 1, moderate: 2, minor: 3, positive: 4 };
  for (let i = 1; i < r.findings.length; i++) {
    assert.ok(
      (rank[r.findings[i - 1]!.severity] ?? 9) <= (rank[r.findings[i]!.severity] ?? 9),
      "findings out of severity order",
    );
  }
});

test("shortfall is reported when the risk-adjusted supply misses the requirement", () => {
  const r = assessParcel(goodParcel({ decreedAcreFeet: 100, irrigatedAcresPlanned: 120 }));
  assert.ok(r.waterBalance.requiredAcreFeet && r.waterBalance.requiredAcreFeet > 0);
  assert.ok((r.waterBalance.shortfall ?? 0) > 0);
  assert.ok(r.findings.some((f) => f.id === "supply-shortfall"));
});

test("basin-closure risk survives the credit clamp", () => {
  // The same flawless deal must not score identically in a severely
  // over-appropriated basin and an open one. Credits must not absorb the
  // structural penalty.
  const severe = assessParcel(goodParcel({ jurisdictionCode: "US-NV" })); // severe closure risk
  const open = assessParcel(goodParcel({ jurisdictionCode: "US-AK" })); // low closure risk
  assert.ok(
    severe.composite < open.composite,
    `severe-risk basin (${severe.composite}) should score below an open one (${open.composite})`,
  );

  const security = (a: typeof severe) => a.categories.find((c) => c.category === "water-security")!.score;
  assert.ok(security(severe) < security(open));
  assert.ok(security(open) <= 100 && security(severe) >= 0);
});

test("a top score is only reachable where the basin carries no structural risk", () => {
  // A flawless set of answers can legitimately score 100 in a low-risk riparian
  // state — the water genuinely runs with the land there. It must never do so
  // anywhere the basin is under pressure, however clean the paperwork looks.
  for (const s of JURISDICTIONS) {
    const r = assessParcel(goodParcel({ jurisdictionCode: s.code }));
    if (s.closedBasinRisk !== "low") {
      assert.ok(r.composite < 100, `${s.code} (${s.closedBasinRisk} risk) scored ${r.composite}`);
    }
  }

  // And the penalty must scale with the risk tier.
  const byTier = (code: string) => assessParcel(goodParcel({ jurisdictionCode: code })).composite;
  assert.ok(byTier("US-NV") < byTier("US-CO"), "severe risk should score below high risk");
  assert.ok(byTier("US-CO") < byTier("US-OK"), "high risk should score below moderate risk");
  assert.ok(byTier("US-OK") < byTier("US-AK"), "moderate risk should score below low risk");
});

test("groundwater-only parcels are not penalized for having no priority date", () => {
  // Texas groundwater has no priority dates at all; scoring it as though a
  // date went missing would be a category error.
  const gw = goodParcel({
    jurisdictionCode: "US-TX",
    surfaceRight: "none",
    priorityDate: undefined,
    adjudication: "not-applicable",
  });
  const r = assessParcel(gw);
  assert.ok(!r.findings.some((f) => f.id === "no-priority-date"));

  // The reliability factor should not carry the missing-priority-date discount.
  const withDate = assessParcel({ ...gw, surfaceRight: "none", priorityDate: "1950" });
  assert.equal(r.waterBalance.reliabilityFactor, withDate.waterBalance.reliabilityFactor);
});

test("surface rights in the same state still take the seniority discount", () => {
  const senior = assessParcel(goodParcel({ jurisdictionCode: "US-TX", surfaceRight: "decreed-appropriative", priorityDate: "1890" }));
  const undated = assessParcel(goodParcel({ jurisdictionCode: "US-TX", surfaceRight: "decreed-appropriative", priorityDate: undefined }));
  assert.ok(undated.findings.some((f) => f.id === "no-priority-date"));
  assert.ok(undated.waterBalance.reliabilityFactor < senior.waterBalance.reliabilityFactor);
});

// ---------------------------------------------------------------------------
// International
// ---------------------------------------------------------------------------

test("every international profile carries ownership and country-risk data", () => {
  for (const j of Object.values(INTERNATIONAL)) {
    assert.ok(j.foreignOwnership, `${j.code} has no foreignOwnership profile`);
    assert.ok(j.countryRisk, `${j.code} has no countryRisk profile`);
    assert.equal(j.subnational, false, `${j.code} should be country-level`);
    assert.equal(j.country, j.name, `${j.code} country should equal name`);
    assert.ok(j.foreignOwnership!.summary.length > 0, `${j.code} ownership summary empty`);
    assert.ok(j.foreignOwnership!.ruralLandRule.length > 0, `${j.code} rural rule empty`);
  }
});

test("assessParcel runs for every international jurisdiction", () => {
  for (const j of Object.values(INTERNATIONAL)) {
    const r = assessParcel(goodParcel({ jurisdictionCode: j.code, buyerCountry: "US", county: "Test" }));
    assert.ok(r.composite >= 0 && r.composite <= 100, `${j.code} composite out of range`);
    assert.equal(r.crossBorder, true, `${j.code} should be cross-border for a US buyer`);
    assert.ok(r.checklist.length > 0);
  }
});

test("cross-border is decided by the buyer's country, not the jurisdiction", () => {
  // A US buyer in Colorado is domestic; the same parcel for a Chilean buyer is not.
  const domestic = assessParcel(goodParcel({ jurisdictionCode: "US-CO", buyerCountry: "US" }));
  assert.equal(domestic.crossBorder, false);
  assert.equal(isCrossBorder(getJurisdiction("US-CO")!, "US"), false);
  assert.equal(isCrossBorder(getJurisdiction("US-CO")!, "CL"), true);

  // A Chilean buying in Chile is domestic too.
  const local = assessParcel(goodParcel({ jurisdictionCode: "CL", buyerCountry: "CL", county: "Maule" }));
  assert.equal(local.crossBorder, false);

  // Omitting buyerCountry must not silently invent a cross-border deal.
  const unstated = assessParcel(goodParcel({ jurisdictionCode: "CL", county: "Maule" }));
  assert.equal(unstated.crossBorder, false);
});

test("the eligibility category only carries weight on cross-border deals", () => {
  const domestic = assessParcel(goodParcel({ jurisdictionCode: "US-CO", buyerCountry: "US" }));
  assert.ok(
    !domestic.categories.some((c) => c.category === "foreign-ownership"),
    "a zero-weight category should be dropped rather than shown at 0%",
  );

  const abroad = assessParcel(goodParcel({ jurisdictionCode: "CL", buyerCountry: "US", county: "Maule" }));
  const eligibility = abroad.categories.find((c) => c.category === "foreign-ownership");
  assert.ok(eligibility, "cross-border deals must score eligibility");
  assert.equal(eligibility!.weight, 0.2);

  // Weights must still sum to 1 in both modes.
  for (const a of [domestic, abroad]) {
    const total = a.categories.reduce((t, c) => t + c.weight, 0);
    assert.ok(Math.abs(total - 1) < 1e-9, `weights sum to ${total}`);
  }
});

test("a country that bars foreign ownership yields a deal breaker and a walk", () => {
  for (const code of ["GE", "TH", "NA", "MA"]) {
    const r = assessParcel(goodParcel({ jurisdictionCode: code, buyerCountry: "US", county: "Test" }));
    assert.ok(r.dealBreaker, `${code} should set a deal breaker`);
    assert.equal(r.verdict, "walk", `${code} should be a walk`);
    assert.ok(r.findings.some((f) => f.id === "ownership-prohibited" && f.severity === "critical"));
  }
});

test("a prohibition forces a walk even when everything else is perfect", () => {
  // Georgia is water-rich and cheap; without the constitutional bar this would
  // score well. The verdict must not be reachable by arithmetic.
  const r = assessParcel(
    goodParcel({ jurisdictionCode: "GE", buyerCountry: "US", county: "Kakheti", askingPrice: 200_000 }),
  );
  assert.equal(r.verdict, "walk");
  assert.match(r.dealBreaker!, /bars foreign ownership/);
});

test("a Georgian buyer in Georgia is not blocked by the foreign ownership bar", () => {
  const r = assessParcel(goodParcel({ jurisdictionCode: "GE", buyerCountry: "GE", county: "Kakheti" }));
  assert.equal(r.crossBorder, false);
  assert.equal(r.dealBreaker, null);
  assert.notEqual(r.verdict, "walk");
});

test("Mexico flags a structure mismatch for personal freehold", () => {
  const wrong = assessParcel(
    goodParcel({ jurisdictionCode: "MX", buyerCountry: "US", county: "Sonora", ownershipStructure: "personal-freehold" }),
  );
  assert.ok(wrong.findings.some((f) => f.id === "structure-mismatch" && f.severity === "critical"));

  const right = assessParcel(
    goodParcel({ jurisdictionCode: "MX", buyerCountry: "US", county: "Sonora", ownershipStructure: "trust-or-fideicomiso" }),
  );
  assert.ok(!right.findings.some((f) => f.id === "structure-mismatch"));
  assert.ok(right.composite > wrong.composite);
});

test("open jurisdictions score eligibility well and closed ones badly", () => {
  const score = (code: string) => {
    const a = assessParcel(goodParcel({ jurisdictionCode: code, buyerCountry: "US", county: "Test" }));
    return a.categories.find((c) => c.category === "foreign-ownership")!.score;
  };
  // Uruguay and Chile are genuinely open; Thailand and Kenya are not.
  assert.ok(score("UY") > 80, `Uruguay scored ${score("UY")}`);
  assert.ok(score("CL") > 70, `Chile scored ${score("CL")}`);
  assert.ok(score("TH") < 20, `Thailand scored ${score("TH")}`);
  assert.ok(score("KE") < 60, `Kenya scored ${score("KE")}`);
});

test("screening jurisdictions surface the approval body and a conditional-contract step", () => {
  for (const code of ["AU", "NZ"]) {
    const r = assessParcel(goodParcel({ jurisdictionCode: code, buyerCountry: "US", county: "Test" }));
    assert.ok(r.findings.some((f) => f.id === "screening-approval"), `${code} missing screening finding`);
    assert.ok(r.checklist.some((c) => c.id === "screening-application" && c.blocking), `${code} missing application step`);
  }
});

test("exchange-control countries require the inbound capital step", () => {
  const r = assessParcel(goodParcel({ jurisdictionCode: "ZA", buyerCountry: "US", county: "Northern Cape" }));
  assert.ok(r.findings.some((f) => f.id === "currency-controls"));
  assert.ok(r.checklist.some((c) => c.id === "register-inbound-capital" && c.blocking));
});

test("cross-border deals always add the eligibility and site-visit steps", () => {
  const r = assessParcel(goodParcel({ jurisdictionCode: "UY", buyerCountry: "US", county: "Salto" }));
  const first = r.checklist.find((c) => c.phase === "pre-offer");
  assert.equal(first?.id, "confirm-eligibility", "eligibility must be the first pre-offer item");
  assert.ok(r.checklist.some((c) => c.id === "walk-the-boundaries"));
  assert.ok(r.sellerQuestions.some((q) => q.id === "q-occupation"));
});

test("Chile models water as an asset separable from the land", () => {
  const cl = getJurisdiction("CL")!;
  assert.equal(cl.surfaceDoctrine, "tradable-entitlement");
  assert.equal(cl.transferability, "severable-freely");
  assert.equal(cl.foreignOwnership!.regime, "unrestricted");
});

test("every checklist item names an owner and a rationale", () => {
  for (const s of JURISDICTIONS) {
    for (const item of assessParcel(goodParcel({ jurisdictionCode: s.code })).checklist) {
      assert.ok(item.owner.trim().length > 0, `${s.code}/${item.id} has no owner`);
      assert.ok(item.rationale.trim().length > 0, `${s.code}/${item.id} has no rationale`);
    }
  }
});

test("checklist ids are unique per assessment", () => {
  for (const s of JURISDICTIONS) {
    const ids = assessParcel(goodParcel({ jurisdictionCode: s.code })).checklist.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length, `${s.code} has duplicate checklist ids`);
  }
});
