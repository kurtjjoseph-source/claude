import test from "node:test";
import assert from "node:assert/strict";
import { LISTINGS, getListing, getListings, listingsAreSample } from "../src/lib/listings/data";
import { matchAll, matchListing } from "../src/lib/listings/match";
import { buildFirstPurchaseGuide } from "../src/lib/first-purchase/engine";
import { buildBasemap, projectPoint } from "../src/lib/listings/basemap";
import { assessParcel } from "../src/lib/water/engine";
import { getJurisdiction } from "../src/lib/water/registry";
import { decodeProfile, encodeProfile } from "../src/lib/profile-store";
import type { BuyerProfile } from "../src/lib/types";

function buyer(over: Partial<BuyerProfile> = {}): BuyerProfile {
  return {
    totalCapital: 900_000,
    financing: "cash-only",
    annualAddition: 100_000,
    targetAcres: 1000,
    monthsToFirstPurchase: 12,
    landExperience: "none",
    waterKnowledge: "none",
    operatingIntent: "lease-to-farmer",
    homeCountry: "US",
    canVisitInPerson: "yes",
    geographyPreference: "best-value-domestic",
    riskAppetite: "balanced",
    expectedPricePerAcre: 3_000,
    ...over,
  };
}

// ---------------------------------------------------------------------------
// Inventory integrity
// ---------------------------------------------------------------------------

test("the sample inventory is labelled as sample", () => {
  // If this ever flips to false without a real feed behind it, the UI would
  // start presenting invented parcels as genuine listings.
  assert.equal(listingsAreSample(), true);
});

test("every listing is well formed and scoreable", () => {
  assert.ok(LISTINGS.length >= 12);
  const ids = new Set<string>();
  for (const l of LISTINGS) {
    assert.ok(!ids.has(l.id), `duplicate listing id ${l.id}`);
    ids.add(l.id);

    assert.ok(getJurisdiction(l.input.jurisdictionCode), `${l.id} has an unknown jurisdiction`);
    assert.ok(l.input.acres > 0, `${l.id} has no acreage`);
    assert.ok(l.price > 0, `${l.id} has no price`);
    assert.equal(l.input.askingPrice, l.price, `${l.id} price and askingPrice disagree`);
    assert.ok(l.headline.length > 0 && l.description.length > 0 && l.tell.length > 0);
    assert.ok(Math.abs(l.lat) <= 90 && Math.abs(l.lng) <= 180, `${l.id} has impossible coordinates`);

    const a = assessParcel(l.input);
    assert.ok(a.composite >= 0 && a.composite <= 100, `${l.id} scored ${a.composite}`);
  }
});

test("lookup by id works and misses return null", () => {
  assert.equal(getListing(LISTINGS[0]!.id)?.id, LISTINGS[0]!.id);
  assert.equal(getListing("does-not-exist"), null);
  assert.equal(getListings().length, LISTINGS.length);
});

// ---------------------------------------------------------------------------
// Map projection
// ---------------------------------------------------------------------------

test("every listing projects onto at least one basemap", () => {
  for (const l of LISTINGS) {
    const us = projectPoint("us", l.lng, l.lat);
    const world = projectPoint("world", l.lng, l.lat);
    assert.ok(us || world, `${l.id} does not appear on either map`);

    // A US parcel must be on the US map; a foreign one must not be.
    const domestic = getJurisdiction(l.input.jurisdictionCode)!.subnational;
    if (domestic) assert.ok(us, `${l.id} is a US parcel but does not project onto the US map`);
    else assert.equal(us, null, `${l.id} is foreign but projects onto the US map`);
    assert.ok(world, `${l.id} does not project onto the world map`);
  }
});

test("basemaps build with plausible geometry", () => {
  const us = buildBasemap("us");
  const world = buildBasemap("world");
  assert.equal(us.shapes.length, 51, "50 states plus DC");
  assert.ok(world.shapes.length > 150);
  for (const b of [us, world]) {
    assert.ok(b.width > 0 && b.height > 0);
    assert.ok(b.shapes.every((d) => d.startsWith("M")), "every shape must be a valid path");
  }
});

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

test("a listing far above budget is blocked, not merely low-scoring", () => {
  const guide = buildFirstPurchaseGuide(buyer({ totalCapital: 200_000 }));
  const expensive = LISTINGS.find((l) => l.price > 1_500_000)!;
  const m = matchListing(expensive, buyer({ totalCapital: 200_000 }), guide);
  assert.equal(m.band, "blocked");
  assert.ok(m.blockers.some((b) => /budget/i.test(b)));
});

test("blocked listings always sort below unblocked ones", () => {
  const profile = buyer({ totalCapital: 250_000 });
  const { matches } = matchAll(LISTINGS, profile);
  let seenBlocked = false;
  for (const m of matches) {
    if (m.blockers.length > 0) seenBlocked = true;
    else assert.ok(!seenBlocked, "an unblocked listing appeared after a blocked one");
  }
});

test("the same listing matches differently for different buyers", () => {
  const listing = LISTINGS.find((l) => l.id === "co-rio-grande-senior")!;
  const rich = buildFirstPurchaseGuide(buyer({ totalCapital: 2_500_000 }));
  const poor = buildFirstPurchaseGuide(buyer({ totalCapital: 300_000 }));

  const a = matchListing(listing, buyer({ totalCapital: 2_500_000 }), rich);
  const b = matchListing(listing, buyer({ totalCapital: 300_000 }), poor);

  // Same parcel, same quality — different verdict for the buyer.
  assert.equal(a.composite, b.composite);
  assert.equal(a.band, "strong");
  assert.equal(b.band, "blocked", "the same parcel is simply out of reach for the smaller budget");
  assert.ok(a.score > b.score, "the affordable buyer should match better");
});

test("parcel quality and buyer match are separate numbers", () => {
  const profile = buyer({ totalCapital: 300_000 });
  const { matches } = matchAll(LISTINGS, profile);
  const differing = matches.filter((m) => Math.abs(m.score - m.composite) > 10);
  assert.ok(
    differing.length > 0,
    "if match always tracked composite, the match engine would be adding nothing",
  );
});

test("a domestic-only buyer is steered away from foreign listings", () => {
  const profile = buyer({ geographyPreference: "best-value-domestic", totalCapital: 3_000_000 });
  const guide = buildFirstPurchaseGuide(profile);
  const foreign = LISTINGS.find((l) => !getJurisdiction(l.input.jurisdictionCode)!.subnational)!;
  const m = matchListing(foreign, profile, guide);
  assert.ok(
    m.reasons.some((r) => !r.positive && /geography/i.test(r.label)),
    "a domestic-only buyer should see a geography deduction on a foreign parcel",
  );
});

test("a buyer who cannot travel is blocked from buying abroad", () => {
  const profile = buyer({
    geographyPreference: "international",
    canVisitInPerson: "no",
    landExperience: "experienced",
    totalCapital: 3_000_000,
  });
  const guide = buildFirstPurchaseGuide(profile);
  const foreign = LISTINGS.find((l) => !getJurisdiction(l.input.jurisdictionCode)!.subnational)!;
  const m = matchListing(foreign, profile, guide);
  assert.equal(m.band, "blocked");
  assert.ok(m.blockers.some((b) => /stood on/i.test(b)));
});

test("a shortlisted jurisdiction counts in a listing's favour", () => {
  const profile = buyer({ totalCapital: 1_500_000 });
  const guide = buildFirstPurchaseGuide(profile);
  const shortlisted = LISTINGS.find((l) => guide.shortlist.some((s) => s.code === l.input.jurisdictionCode));
  assert.ok(shortlisted, "the sample inventory should cover at least one shortlisted jurisdiction");
  const m = matchListing(shortlisted!, profile, guide);
  assert.ok(m.reasons.some((r) => r.positive && /shortlist/i.test(r.label)));
});

test("a parcel with critical findings is penalised for every buyer", () => {
  // The New Mexico tract has an eleven-year non-use gap against a four-year
  // forfeiture period, which is a defect regardless of who is buying.
  const nm = LISTINGS.find((l) => l.id === "nm-sierra-idle")!;
  const a = assessParcel(nm.input);
  assert.ok(a.findings.some((f) => f.severity === "critical"));

  for (const capital of [400_000, 5_000_000]) {
    const profile = buyer({ totalCapital: capital });
    const m = matchListing(nm, profile, buildFirstPurchaseGuide(profile));
    assert.ok(m.reasons.some((r) => !r.positive && /critical/i.test(r.label)), `capital ${capital}`);
  }
});

test("matchAll returns one result per listing with a usable band", () => {
  const { matches, guide } = matchAll(LISTINGS, buyer());
  assert.equal(matches.length, LISTINGS.length);
  assert.ok(guide.budget.maxPurchasePrice > 0);
  for (const m of matches) {
    assert.ok(["strong", "possible", "stretch", "blocked"].includes(m.band));
    assert.ok(m.score >= 0 && m.score <= 100);
    assert.ok(m.reasons.length > 0, `${m.listingId} produced no reasons`);
    if (m.band === "blocked") {
      assert.ok(m.blockers.length > 0);
      assert.equal(m.score, 0, "a blocked listing must not carry a score that could be sorted or shown");
    } else {
      assert.equal(m.blockers.length, 0);
    }
  }
});

// ---------------------------------------------------------------------------
// Profile cookie
// ---------------------------------------------------------------------------

test("the profile cookie round-trips and rejects rubbish", () => {
  const p = buyer();
  const decoded = decodeProfile(encodeProfile(p));
  assert.deepEqual(decoded, p);

  assert.equal(decodeProfile(undefined), null);
  assert.equal(decodeProfile("not-json"), null);
  assert.equal(decodeProfile(encodeURIComponent(JSON.stringify({ nonsense: true }))), null);
});

test("the encoded profile fits comfortably in a cookie", () => {
  // Cookies are capped around 4KB and are sent on every request.
  const encoded = encodeProfile(buyer());
  assert.ok(encoded.length < 1_000, `profile cookie is ${encoded.length} bytes`);
});
