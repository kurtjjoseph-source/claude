import type { Assessment, BuyerProfile, FirstPurchaseGuide } from "@/lib/types";
import { assessParcel } from "@/lib/water/engine";
import { getJurisdiction } from "@/lib/water/registry";
import { buildFirstPurchaseGuide } from "@/lib/first-purchase/engine";
import type { Listing } from "@/lib/listings/data";

/**
 * Matches listings against a buyer profile.
 *
 * Two different questions are being answered and they must not be collapsed.
 * The parcel's own quality is `assessParcel` — is the water real, is the title
 * clean. The *match* is whether this particular buyer can and should transact
 * on it: does it fit the budget, the jurisdiction shortlist, the target size,
 * their eligibility. A superb parcel at three times the budget is a bad match
 * and an honest tool says so rather than ranking it first.
 *
 * Blockers are separated from deductions for the same reason. Something the
 * buyer cannot lawfully or financially do is not a low score, it is a no.
 */

export interface MatchReason {
  label: string;
  detail: string;
  /** Positive contributions read differently from deductions. */
  positive: boolean;
}

export interface ListingMatch {
  listingId: string;
  /** 0-100. Forced to 0 when blocked, so the number is always meaningful. */
  score: number;
  band: "strong" | "possible" | "stretch" | "blocked";
  reasons: MatchReason[];
  /** Reasons this buyer cannot proceed at all. */
  blockers: string[];
  /** The parcel's own quality, independent of the buyer. */
  composite: number;
  verdict: Assessment["verdict"];
  /** Price against the buyer's land budget, as a ratio. 1.0 is exactly at budget. */
  budgetRatio: number | null;
}

function bandFor(score: number, blockers: string[]): ListingMatch["band"] {
  if (blockers.length > 0) return "blocked";
  if (score >= 75) return "strong";
  if (score >= 55) return "possible";
  return "stretch";
}

export function matchListing(
  listing: Listing,
  profile: BuyerProfile,
  guide: FirstPurchaseGuide,
): ListingMatch {
  const reasons: MatchReason[] = [];
  const blockers: string[] = [];
  let score = 100;

  const deduct = (points: number, label: string, detail: string) => {
    score -= points;
    reasons.push({ label, detail, positive: false });
  };
  const credit = (points: number, label: string, detail: string) => {
    score += points;
    reasons.push({ label, detail, positive: true });
  };

  // Scored as *this buyer* would hold it: the listing is written for a local
  // buyer, so the nationality has to be overridden before the eligibility
  // rules can say anything meaningful.
  const assessment = assessParcel({
    ...listing.input,
    buyerCountry: profile.homeCountry,
  });

  const jurisdiction = getJurisdiction(listing.input.jurisdictionCode);
  const budget = guide.budget;

  // --- Budget -------------------------------------------------------------
  const budgetRatio = budget.maxPurchasePrice > 0 ? listing.price / budget.maxPurchasePrice : null;
  if (budgetRatio === null) {
    blockers.push("Your capital does not yet support a purchase once diligence and reserve are funded.");
  } else if (budgetRatio > 2) {
    blockers.push(
      `At $${listing.price.toLocaleString()} this is more than twice your $${budget.maxPurchasePrice.toLocaleString()} land budget. Financing does not close a gap this size on raw land.`,
    );
  } else if (budgetRatio > 1.25) {
    deduct(
      30,
      "Well above budget",
      `$${listing.price.toLocaleString()} against a $${budget.maxPurchasePrice.toLocaleString()} ceiling. Reaching it means either more capital or spending the reserve, and the reserve is not spare money.`,
    );
  } else if (budgetRatio > 1) {
    deduct(
      12,
      "Slightly above budget",
      `About ${Math.round((budgetRatio - 1) * 100)}% over your ceiling. Negotiable in principle, but do not fund the gap from the diligence or reserve lines.`,
    );
  } else if (budgetRatio < 0.45) {
    credit(
      5,
      "Comfortably within budget",
      "Leaves capital for a second purchase, or for the infrastructure this one will need.",
    );
  } else {
    credit(8, "Fits the budget", `$${listing.price.toLocaleString()} against a $${budget.maxPurchasePrice.toLocaleString()} ceiling.`);
  }

  // --- Eligibility --------------------------------------------------------
  if (assessment.dealBreaker) {
    blockers.push(assessment.dealBreaker);
  } else if (assessment.crossBorder) {
    const firstTimer = profile.landExperience === "none" || profile.landExperience === "residential-only";
    if (firstTimer) {
      deduct(
        15,
        "Cross-border, and this would be your first purchase",
        "Workable, but you are learning conveyancing and a second legal system at once. Engage local counsel before making any offer.",
      );
    } else {
      deduct(6, "Cross-border", "Adds eligibility, tax and repatriation questions on top of the water.");
    }
    if (profile.canVisitInPerson === "no") {
      blockers.push("You have said you cannot visit in person, and this parcel is abroad. Do not buy land you have not stood on.");
    }
  }

  // --- Jurisdiction fit ---------------------------------------------------
  const pick = guide.shortlist.find((p) => p.code === listing.input.jurisdictionCode);
  if (pick) {
    credit(
      10,
      `${pick.name} is on your shortlist`,
      `Ranked ${pick.score}/100 for a first purchase — ease ${pick.ease}, water value ${pick.waterValue}.`,
    );
  } else if (jurisdiction) {
    deduct(
      8,
      `${jurisdiction.name} is not on your shortlist`,
      "Not a reason to rule it out, but you would be learning a jurisdiction that did not rank for your profile.",
    );
  }

  if (
    (profile.geographyPreference === "near-home" || profile.geographyPreference === "best-value-domestic") &&
    assessment.crossBorder
  ) {
    deduct(20, "Outside your stated geography", "You said you wanted to buy domestically.");
  }

  // --- Size ---------------------------------------------------------------
  const acres = listing.input.acres;
  const { acreBandLow, acreBandHigh } = guide.targetProfile;
  if (acres >= acreBandLow && acres <= acreBandHigh) {
    credit(8, "Right size for a first purchase", `${acres.toLocaleString()} acres sits inside your ${acreBandLow.toLocaleString()}-${acreBandHigh.toLocaleString()} acre target band.`);
  } else if (acres > acreBandHigh * 2) {
    deduct(10, "Much larger than your target band", `${acres.toLocaleString()} acres against a ${acreBandHigh.toLocaleString()}-acre upper bound. Bigger is not automatically worse, but it usually means the price is too.`);
  } else if (acres < acreBandLow * 0.5) {
    deduct(
      10,
      "Small relative to the cost of checking it",
      `At ${acres.toLocaleString()} acres, the fixed diligence cost of about $${budget.perDealDiligence.toLocaleString()} is a large share of the deal.`,
    );
  }

  // --- Parcel quality against the buyer's own bar --------------------------
  const bar = guide.targetProfile.minComposite;
  if (assessment.composite >= bar + 10) {
    credit(12, "Comfortably clears your quality bar", `Scores ${assessment.composite} against your ${bar} minimum.`);
  } else if (assessment.composite >= bar) {
    credit(6, "Meets your quality bar", `Scores ${assessment.composite} against your ${bar} minimum.`);
  } else {
    deduct(
      Math.min(35, (bar - assessment.composite) * 1.5),
      "Below your quality bar",
      `Scores ${assessment.composite} against the ${bar} minimum your risk appetite implies.`,
    );
  }

  if (assessment.verdict === "walk") {
    deduct(20, "The engine says walk", "Read the findings before spending anything on this one.");
  }

  const criticals = assessment.findings.filter((f) => f.severity === "critical");
  if (criticals.length > 0) {
    deduct(
      Math.min(25, criticals.length * 10),
      `${criticals.length} critical ${criticals.length === 1 ? "finding" : "findings"}`,
      criticals.map((f) => f.title).join("; "),
    );
  }

  // --- Intent fit ---------------------------------------------------------
  if (profile.operatingIntent === "operate-myself" && listing.input.wellStatus === "none" && listing.input.surfaceRight === "none") {
    deduct(15, "No water for an operating plan", "You intend to farm this, and no supply was identified on the listing.");
  }
  if (profile.operatingIntent === "passive-hold" && assessment.composite >= bar) {
    credit(4, "Suits a passive hold", "No operating commitment required to justify the water.");
  }

  // --- Timeline -----------------------------------------------------------
  const close = listing.input.closeTimelineDays;
  if (close !== undefined && close < 45) {
    deduct(10, "Short closing window", `${close} days does not fit a proper water contingency. Expect to negotiate for more or walk.`);
  }

  // A blocked listing has no meaningful score: the deductions behind it can
  // still net out to 100, and returning that alongside "blocked" invites any
  // future consumer to sort or display the wrong number. Zero it.
  score = blockers.length > 0 ? 0 : Math.max(0, Math.min(100, Math.round(score)));

  return {
    listingId: listing.id,
    score,
    band: bandFor(score, blockers),
    reasons,
    blockers,
    composite: assessment.composite,
    verdict: assessment.verdict,
    budgetRatio: budgetRatio === null ? null : Math.round(budgetRatio * 100) / 100,
  };
}

export function matchAll(
  listings: Listing[],
  profile: BuyerProfile,
): { guide: FirstPurchaseGuide; matches: ListingMatch[] } {
  const guide = buildFirstPurchaseGuide(profile);
  const matches = listings
    .map((l) => matchListing(l, profile, guide))
    .sort((a, b) => {
      // Blocked always sinks, whatever the score behind it says.
      if (a.blockers.length !== b.blockers.length) return a.blockers.length - b.blockers.length;
      return b.score - a.score || b.composite - a.composite;
    });
  return { guide, matches };
}

export const MATCH_BAND_COPY: Record<ListingMatch["band"], { label: string; tone: string }> = {
  strong: { label: "Strong match", tone: "var(--color-sage-400)" },
  possible: { label: "Possible", tone: "var(--accent)" },
  stretch: { label: "Stretch", tone: "var(--color-ochre-500)" },
  blocked: { label: "Blocked", tone: "var(--color-rust-500)" },
};
