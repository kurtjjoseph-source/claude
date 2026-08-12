import type {
  Assessment,
  CategoryScore,
  Finding,
  ParcelInput,
  ScoreCategory,
  JurisdictionProfile,
  Verdict,
} from "@/lib/types";
import { getJurisdiction, isCrossBorder } from "@/lib/water/registry";
import { buildChecklist } from "@/lib/plan/checklist";
import { buildSellerQuestions } from "@/lib/plan/seller-questions";

/**
 * Deterministic assessment engine.
 *
 * Everything a buyer could act on — scores, red flags, the reliable-water
 * estimate — is computed here from structured facts and the state registry.
 * The model layer never touches this; it only narrates the result.
 */

/**
 * Domestic weighting. Water security dominates because, at home, the right to
 * own the land is assumed and the water right is the hard part.
 */
const WEIGHTS_DOMESTIC: Record<ScoreCategory, number> = {
  "water-security": 0.38,
  "title-transferability": 0.24,
  "foreign-ownership": 0,
  "physical-supply": 0.16,
  "land-access": 0.12,
  economics: 0.1,
};

/**
 * Cross-border weighting. Eligibility, title integrity and sovereign risk take
 * a fifth of the score, drawn proportionally from the other categories: a
 * flawless water entitlement on land a foreigner may not hold is worth nothing,
 * and that has to be able to move the number, not just add a footnote.
 */
const WEIGHTS_CROSS_BORDER: Record<ScoreCategory, number> = {
  "water-security": 0.3,
  "title-transferability": 0.19,
  "foreign-ownership": 0.2,
  "physical-supply": 0.13,
  "land-access": 0.1,
  economics: 0.08,
};

const CATEGORY_LABELS: Record<ScoreCategory, string> = {
  "water-security": "Water security",
  "title-transferability": "Title & transferability",
  "foreign-ownership": "Eligibility & country risk",
  "physical-supply": "Physical supply",
  "land-access": "Land & access",
  economics: "Acquisition economics",
};

/** Irrigation duty of water, acre-feet per acre per year, by intended use. */
const DUTY_BY_INTENT: Record<string, number> = {
  "irrigated-crop": 3.0,
  "pasture-grazing": 2.0,
  livestock: 0.05,
  "domestic-homestead": 0.5,
  "recharge-banking": 1.0,
  development: 0.5,
  "conservation-hold": 0,
};

const RISK_PENALTY: Record<string, number> = {
  low: 0,
  moderate: 6,
  high: 14,
  severe: 24,
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

function priorityYear(input: ParcelInput): number | null {
  if (!input.priorityDate) return null;
  const match = /(\d{4})/.exec(input.priorityDate);
  if (!match?.[1]) return null;
  const year = Number(match[1]);
  return year >= 1600 && year <= new Date().getFullYear() ? year : null;
}

function isAppropriationState(profile: JurisdictionProfile): boolean {
  return profile.surfaceDoctrine === "prior-appropriation" || profile.surfaceDoctrine === "hybrid";
}

function hasDoc(input: ParcelInput, id: string): boolean {
  return input.documents.includes(id as ParcelInput["documents"][number]);
}

function needsWater(input: ParcelInput): boolean {
  return input.intent !== "conservation-hold";
}

/**
 * Tracks deductions so each category can explain itself.
 *
 * Deal-quality adjustments net out against a 100 baseline and clamp there —
 * credits offset deductions but cannot bank headroom. Structural penalties are
 * held back and applied *after* that clamp, because they describe where the
 * land sits rather than how good the deal is: an otherwise flawless parcel in a
 * severely over-appropriated basin must not score the same as one in an open
 * basin, and letting credits absorb the basin penalty is exactly how it would.
 */
class Scorer {
  private score = 100;
  private structural = 0;
  readonly drivers: string[] = [];

  deduct(points: number, reason: string): void {
    if (points <= 0) return;
    this.score -= points;
    this.drivers.push(`−${points} ${reason}`);
  }

  /** A penalty that survives the credit clamp. */
  deductStructural(points: number, reason: string): void {
    if (points <= 0) return;
    this.structural += points;
    this.drivers.push(`−${points} ${reason}`);
  }

  credit(points: number, reason: string): void {
    if (points <= 0) return;
    this.score += points;
    this.drivers.push(`+${points} ${reason}`);
  }

  note(reason: string): void {
    this.drivers.push(reason);
  }

  value(): number {
    return Math.round(clamp(clamp(this.score) - this.structural));
  }
}

// ---------------------------------------------------------------------------
// Category: water security
// ---------------------------------------------------------------------------

function scoreWaterSecurity(
  input: ParcelInput,
  profile: JurisdictionProfile,
  findings: Finding[],
): CategoryScore {
  const s = new Scorer();
  const appropriative = isAppropriationState(profile);

  // --- The right itself -----------------------------------------------------
  if (input.surfaceRight === "none" && input.wellStatus === "none" && needsWater(input)) {
    s.deduct(55, "no surface right and no well for a use that requires water");
    findings.push({
      id: "no-water-at-all",
      severity: "critical",
      title: "The parcel has no identified water supply",
      detail: `You have selected an intended use (${humanIntent(input.intent)}) that requires water, but no surface right and no well were identified. In ${profile.name}, new supply ${profile.closedBasinRisk === "severe" || profile.closedBasinRisk === "high" ? "is generally unavailable — basins are closed and the only route is buying and transferring an existing right" : "requires a new appropriation through the state agency, which takes time and is not guaranteed"}.`,
      remedy: `Before making an offer, confirm with ${profile.agency.short} whether the basin is open to new appropriation, and price the cost of acquiring a transferable right separately from the land.`,
      cureCost: "Highly variable; in closed basins the water can exceed the land price",
      category: "water-security",
    });
  }

  switch (input.surfaceRight) {
    case "decreed-appropriative":
      s.credit(4, "right is decreed rather than merely permitted");
      break;
    case "permitted-appropriative":
      s.deduct(4, "permitted but not yet adjudicated to certificate/decree");
      findings.push({
        id: "permit-not-perfected",
        severity: "moderate",
        title: "Right is a permit, not a perfected certificate",
        detail:
          "A permit is an authorization to develop a right, and it usually carries deadlines for construction and for proving beneficial use. If the seller has not met them, you inherit the deadline — and the risk of cancellation.",
        remedy: `Pull the permit file from ${profile.agency.short} and confirm the proof-of-beneficial-use deadline and whether any extensions have been granted.`,
        category: "water-security",
      });
      break;
    case "pre-1914-or-vested":
      s.credit(8, "senior pre-code or vested right");
      findings.push({
        id: "vested-right-documentation",
        severity: "moderate",
        title: "Senior vested right — valuable, but only as documented",
        detail:
          "Pre-code and vested rights are the most senior water in the state and require no permit. That also means there is no state file proving them. Their entire value rests on the diversion and use records the owner has kept.",
        remedy:
          "Demand the full documentary chain: historical diversion records, aerial photography showing irrigated acreage by year, tax records, and any statements of diversion and use filed with the state.",
        category: "water-security",
      });
      break;
    case "ditch-company-shares":
      s.note("supply delivered through a mutual ditch or irrigation company");
      findings.push({
        id: "ditch-shares-are-personal-property",
        severity: "major",
        title: "Ditch company shares do not transfer by deed",
        detail:
          "Shares in a mutual ditch or irrigation company are personal property evidenced by a stock certificate. A deed conveying the land 'together with all water rights' does not move the shares. Buyers regularly close and then discover the seller still owns the water.",
        remedy:
          "Require the original share certificate, endorsed and assigned to you, plus written confirmation from the company that it will re-issue in your name at closing and that assessments are current. Make it a closing condition.",
        cureCost: "Transfer fees are modest; failing to do it is total loss of the water",
        category: "water-security",
      });
      break;
    case "federal-project-contract":
      s.deduct(8, "supply depends on a federal project contract rather than a state right");
      findings.push({
        id: "reclamation-contract",
        severity: "major",
        title: "Supply comes from a federal project contract",
        detail:
          "Bureau of Reclamation and district contract water is contractual, not a state-law property right. Allocations are set annually and have been cut to a fraction of contract quantity in dry years. The contract also carries acreage limitations, repayment obligations and district assessments.",
        remedy:
          "Get the district contract, the last ten years of actual allocation percentages, and the current per-acre assessment. Model the deal on the ten-year median allocation, not the contract face amount.",
        category: "water-security",
      });
      break;
    case "unknown":
      s.deduct(18, "the nature of the water right has not been established");
      findings.push({
        id: "right-kind-unknown",
        severity: "major",
        title: "The type of water right is unknown",
        detail:
          "Until you know whether this is a decree, a permit, a vested claim, company shares or nothing at all, no meaningful valuation of the water is possible. Every downstream question depends on this answer.",
        remedy: `Search ${profile.agency.short}'s records by owner name and by legal description, and separately by the parcel's section-township-range. Do this yourself rather than relying on the listing.`,
        category: "water-security",
      });
      break;
    case "riparian":
      if (appropriative) {
        s.deduct(30, "riparian claim asserted in a state that does not recognize new riparian rights");
        findings.push({
          id: "riparian-claim-in-appropriation-state",
          severity: "critical",
          title: `A riparian claim carries little weight in ${profile.name}`,
          detail:
            profile.surfaceDoctrine === "prior-appropriation"
              ? `${profile.name} is a pure prior-appropriation state. Owning land along a stream confers no right to divert from it. If the seller is describing the water as "riparian," they are describing something the state does not recognize.`
              : `${profile.name} recognizes riparian claims only where they predate the state's appropriation statute and were properly preserved. Most such claims were extinguished.`,
          remedy: `Ask ${profile.agency.short} directly whether any appropriative right of record serves this parcel. Treat the answer, not the listing language, as the fact.`,
          category: "water-security",
        });
      }
      break;
    case "none":
      break;
  }

  // --- Seniority ------------------------------------------------------------
  // Only meaningful for an appropriative surface right; a groundwater-only
  // parcel has no priority date and must not be scored as though it lost one.
  if (appropriative && input.surfaceRight !== "none") {
    const year = priorityYear(input);
    if (year === null) {
      s.deduct(12, "no priority date established");
      findings.push({
        id: "no-priority-date",
        severity: "major",
        title: "No priority date on record",
        detail:
          "In a prior-appropriation state the priority date is the single most important attribute of the right. Without it you cannot know whether the water is reliable in a dry year or first in line to be shut off.",
        remedy: `Obtain the decree, certificate or permit showing the priority date from ${profile.agency.short}. Two rights on the same stream with different dates are entirely different assets.`,
        category: "water-security",
      });
    } else if (year !== null) {
      if (year <= 1890) {
        s.credit(10, `very senior priority (${year})`);
      } else if (year <= 1922) {
        s.credit(5, `senior priority (${year})`);
      } else if (year <= 1955) {
        s.note(`mid-seniority priority (${year})`);
      } else if (year <= 1975) {
        s.deduct(10, `junior priority (${year})`);
        findings.push({
          id: "junior-priority",
          severity: "moderate",
          title: `Junior priority date (${year})`,
          detail:
            "A right of this vintage sits behind most agricultural seniors on the same source. In a call year it is curtailed while senior neighbors continue to divert. Historical curtailment frequency, not the paper amount, is what you are buying.",
          remedy: `Ask ${profile.agency.short} or the local water commissioner how many of the last twenty years this priority was in regulation, and for how many days.`,
          category: "water-security",
        });
      } else {
        s.deduct(18, `very junior priority (${year})`);
        findings.push({
          id: "very-junior-priority",
          severity: "major",
          title: `Very junior priority date (${year})`,
          detail:
            "A post-1975 priority on an established source is close to the end of the line. On most western streams it yields water only in wet years and should be valued as an option on surplus flow, not as a firm supply.",
          remedy:
            "Model the deal assuming this water is unavailable in dry years. If the business case requires it every year, the case does not close.",
          category: "water-security",
        });
      }
    }
  }

  // --- Adjudication ---------------------------------------------------------
  if (appropriative && input.surfaceRight !== "none") {
    switch (input.adjudication) {
      case "fully-adjudicated":
        s.credit(6, "right is adjudicated and quantified");
        break;
      case "adjudication-pending":
        s.deduct(12, "adjudication pending — quantity and priority can still change");
        findings.push({
          id: "adjudication-pending",
          severity: "major",
          title: "The right is still in adjudication",
          detail: `${profile.adjudicationForum} has not issued a final determination. Until it does, the flow rate, annual volume, acreage and priority you are buying are all claims subject to objection. Adjudications routinely reduce claims.`,
          remedy:
            "Get the current claim, any objections filed against it, and counsel's read on exposure. Consider a price holdback tied to the final decreed quantity.",
          cureCost: "Legal representation in an adjudication runs into five or six figures",
          category: "water-security",
        });
        break;
      case "unadjudicated":
        s.deduct(16, "basin is unadjudicated");
        findings.push({
          id: "unadjudicated-basin",
          severity: "major",
          title: "Unadjudicated basin",
          detail:
            "Nobody's rights on this source have been judicially quantified against each other. Paper claims in unadjudicated basins commonly exceed the physical supply by a wide margin, and a future adjudication will resolve that gap at someone's expense.",
          remedy:
            "Compare the sum of claimed rights on the source against measured average annual yield. If claims exceed supply, discount accordingly.",
          category: "water-security",
        });
        break;
      case "unknown":
        s.deduct(8, "adjudication status unknown");
        break;
      case "not-applicable":
        break;
    }
  }

  // --- Non-use and forfeiture ----------------------------------------------
  const gap = input.longestNonUseGapYears ?? 0;
  if (profile.forfeitureYears !== null && gap > 0) {
    if (gap >= profile.forfeitureYears) {
      s.deduct(30, `documented non-use of ${gap} years meets or exceeds the ${profile.forfeitureYears}-year forfeiture period`);
      findings.push({
        id: "forfeiture-exposure",
        severity: "critical",
        title: `Non-use exceeds ${profile.name}'s ${profile.forfeitureYears}-year forfeiture period`,
        detail: `The right has a documented gap of ${gap} years without beneficial use. ${profile.name} law permits forfeiture after ${profile.forfeitureYears} years of non-use. The right may already be void in part or in whole, and a right that is void does not become valid because you paid for it.`,
        remedy: `Obtain a written status determination from ${profile.agency.short} before closing, and confirm whether any statutory exception (participation in a conservation program, unavailability of water, litigation) was in force during the gap. Absent a clean answer, escrow the water portion of the price.`,
        cureCost: "Often incurable — the remedy is to reprice or walk",
        category: "water-security",
      });
    } else if (gap >= profile.forfeitureYears - 2) {
      s.deduct(14, `non-use of ${gap} years is approaching the ${profile.forfeitureYears}-year forfeiture period`);
      findings.push({
        id: "forfeiture-approaching",
        severity: "major",
        title: "Non-use is approaching the forfeiture threshold",
        detail: `A ${gap}-year gap against a ${profile.forfeitureYears}-year statutory period leaves very little margin. You would be buying a right that must be put back to beneficial use immediately.`,
        remedy:
          "Plan to divert and beneficially use the full quantity in the first season after closing, and document it — flow records, photographs, receipts. Budget for the infrastructure needed to do that.",
        category: "water-security",
      });
    }
  }

  if (
    profile.forfeitureYears !== null &&
    needsWater(input) &&
    input.surfaceRight !== "none" &&
    (input.documentedUseYears ?? 0) === 0 &&
    !hasDoc(input, "historical-use-records")
  ) {
    s.deduct(12, "no evidence of recent beneficial use");
    findings.push({
      id: "no-use-evidence",
      severity: "major",
      title: "No evidence of beneficial use has been produced",
      detail: `In ${profile.name} a right survives only through continued beneficial use. The seller has not produced use records, so there is currently no basis to believe the right is in good standing.`,
      remedy:
        "Request annual water use reports, pump power records, crop insurance or FSA filings, and dated aerial imagery for each of the last ten years. Power bills are unusually persuasive because they are hard to fabricate.",
      category: "water-security",
    });
  }

  // --- Basin and overlay risk ----------------------------------------------
  s.deductStructural(
    RISK_PENALTY[profile.closedBasinRisk] ?? 0,
    `${profile.closedBasinRisk} basin-closure risk in ${profile.name}`,
  );

  if (input.tribalOrFederalClaimsInBasin === "yes") {
    s.deduct(16, "unquantified tribal or federal reserved claims in the basin");
    findings.push({
      id: "reserved-rights",
      severity: "major",
      title: "Unquantified reserved rights in the basin",
      detail:
        "Federal and tribal reserved rights carry priority dates as of the date the reservation was established — typically far senior to any state-law right — and they do not require beneficial use to stay valid. When they are finally quantified, junior state-law rights absorb the shortfall.",
      remedy:
        "Determine whether a settlement or quantification proceeding is underway, and what the proposed quantity is relative to basin supply. This is a question for water counsel, not for the listing agent.",
      category: "water-security",
    });
  } else if (input.tribalOrFederalClaimsInBasin === "unknown") {
    s.deduct(6, "reserved rights exposure not investigated");
  }

  if (input.aquiferTrend === "steeply-declining") {
    s.deduct(18, "steeply declining aquifer");
  } else if (input.aquiferTrend === "declining") {
    s.deduct(10, "declining aquifer");
  }

  // Surface a state's own special regimes as findings so the buyer sees them.
  for (const regime of profile.specialRegimes) {
    if (regime.severity === "severe" || regime.severity === "high") {
      findings.push({
        id: `regime-${slug(regime.name)}`,
        severity: regime.severity === "severe" ? "major" : "moderate",
        title: `${profile.name}: ${regime.name}`,
        detail: `${regime.effect} Applies to: ${regime.appliesTo}.`,
        remedy: `Confirm with ${profile.agency.short} whether this parcel falls inside the affected area, and obtain the governing rules in writing before you price the water.`,
        category: "water-security",
      });
    }
  }

  return {
    category: "water-security",
    label: CATEGORY_LABELS["water-security"],
    score: s.value(),
    weight: 0,
    drivers: s.drivers,
  };
}

// ---------------------------------------------------------------------------
// Category: title & transferability
// ---------------------------------------------------------------------------

function scoreTitle(input: ParcelInput, profile: JurisdictionProfile, findings: Finding[]): CategoryScore {
  const s = new Scorer();

  if (input.previouslySevered === "yes") {
    s.deduct(40, "water has previously been severed from the land");
    findings.push({
      id: "previously-severed",
      severity: "critical",
      title: "Water has been severed from this land before",
      detail:
        "A prior owner sold, leased or reserved some portion of the water. What remains attached to the land is whatever survived that transaction — which is frequently much less than the original decreed amount, and occasionally nothing.",
      remedy:
        "Trace every conveyance in the chain of title and every change application filed with the state, and reconcile the quantity that remains against the quantity being marketed. This is a title-and-water-records task, not a conversation with the seller.",
      cureCost: "Not curable; determines what you are actually buying",
      category: "title-transferability",
    });
  } else if (input.previouslySevered === "unknown") {
    s.deduct(14, "severance history not investigated");
    findings.push({
      id: "severance-unknown",
      severity: "major",
      title: "Severance history has not been checked",
      detail:
        "Water can be sold away from land without any visible change to the property. The only way to know what remains is to read the chain of title and the state's change-application file.",
      remedy: `Order a title commitment that expressly covers water rights, and separately pull the change-application history from ${profile.agency.short}.`,
      category: "title-transferability",
    });
  }

  if (input.appurtenant === "no") {
    s.deduct(22, "right is not appurtenant to the parcel");
    findings.push({
      id: "not-appurtenant",
      severity: "critical",
      title: "The right is not appurtenant to this parcel",
      detail:
        "A right that is not attached to the land does not travel with the deed. It has to be conveyed by a separate instrument and, in most states, a change application approved by the state engineer. If that does not happen, you buy dirt.",
      remedy:
        "Require a separate written assignment of the water right at closing, contingent on the state's approval of the change of ownership. Do not accept 'together with all water rights' deed language as a substitute.",
      category: "title-transferability",
    });
  } else if (input.appurtenant === "unknown") {
    s.deduct(10, "appurtenancy not confirmed");
  }

  // Documentary evidence.
  const criticalDocs: Array<[string, string, string]> = [
    [
      "state-permit-or-decree",
      "No state permit, certificate or decree produced",
      "The state's own document is the only authoritative statement of what the right is. Marketing materials, deeds and seller recollection are not substitutes.",
    ],
    [
      "deed-with-water-language",
      "No deed with water rights language produced",
      "The deed determines whether the water was intended to convey with the land. Its exact wording matters, and generic 'appurtenances' language is weaker than an express grant.",
    ],
    [
      "title-commitment",
      "No title commitment produced",
      "A title commitment reveals liens, easements and reservations — including water and mineral reservations that the seller may not remember or disclose.",
    ],
  ];

  for (const [doc, title, detail] of criticalDocs) {
    if (!hasDoc(input, doc)) {
      s.deduct(10, `missing: ${doc.replace(/-/g, " ")}`);
      findings.push({
        id: `missing-${doc}`,
        severity: "major",
        title,
        detail,
        remedy: "Make production of this document a condition of proceeding past the letter of intent.",
        category: "title-transferability",
      });
    }
  }

  if (!hasDoc(input, "historical-use-records")) {
    s.deduct(8, "missing: historical use records");
  }

  if (input.surfaceRight === "ditch-company-shares" && !hasDoc(input, "ditch-company-share-certificate")) {
    s.deduct(16, "ditch shares claimed but no share certificate produced");
    findings.push({
      id: "missing-share-certificate",
      severity: "critical",
      title: "Ditch shares claimed without a certificate",
      detail:
        "The certificate is the water. Without it in hand, endorsed and transferable, there is nothing to convey — and unpaid assessments can mean the company has already cancelled the shares.",
      remedy:
        "Get a copy of the certificate and a current assessment statement from the company directly, not from the seller.",
      category: "title-transferability",
    });
  }

  // Transfer regime.
  switch (profile.transferability) {
    case "appurtenant-transfers-with-land":
      s.credit(5, "rights transfer with the land in this state");
      break;
    case "severable-with-approval":
      s.deduct(4, "transfers require state approval");
      break;
    case "severable-freely":
      s.deduct(6, "water is freely severable in this state — verify it has not already been sold");
      break;
    case "limited":
      s.deduct(8, "transfers off the described acreage are restricted");
      break;
  }

  // Change of use shrinks the right in appropriation states.
  if (
    isAppropriationState(profile) &&
    (input.intent === "development" || input.intent === "recharge-banking") &&
    input.surfaceRight !== "none"
  ) {
    s.deduct(12, "intended use requires a change application");
    findings.push({
      id: "change-of-use-required",
      severity: "major",
      title: "Your intended use requires a change application",
      detail:
        "Moving an agricultural right to municipal, industrial or recharge use requires state approval under the no-injury rule. Approval is granted only up to the right's historical consumptive use — typically a third to a half of the decreed diversion amount. The rest is returned to the stream for downstream seniors.",
      remedy:
        "Commission a historical consumptive use analysis from a water engineer before you set a price. Buy the consumptive use figure, not the decreed figure.",
      cureCost: "Engineering and legal work commonly runs $25,000-$150,000; the quantity loss is usually larger",
      category: "title-transferability",
    });
  }

  // Texas-specific: the groundwater estate is severable like minerals.
  if (profile.groundwaterRegime === "rule-of-capture") {
    s.deduct(8, "groundwater estate is severable in this state and must be title-searched separately");
    findings.push({
      id: "groundwater-estate-severable",
      severity: "major",
      title: "The groundwater estate can be owned by someone else",
      detail: `In ${profile.name}, groundwater is real property that can be reserved or conveyed apart from the surface, exactly like minerals. A prior owner may have kept it. Nothing about the land's appearance would tell you.`,
      remedy:
        "Instruct the title company in writing to search and insure the groundwater estate specifically. A standard owner's policy does not necessarily cover it.",
      category: "title-transferability",
    });
  }

  if (input.existingLiens === "yes") {
    s.deduct(10, "existing liens against the property");
  }

  return {
    category: "title-transferability",
    label: CATEGORY_LABELS["title-transferability"],
    score: s.value(),
    weight: 0,
    drivers: s.drivers,
  };
}

// ---------------------------------------------------------------------------
// Category: physical supply
// ---------------------------------------------------------------------------

function scorePhysical(input: ParcelInput, profile: JurisdictionProfile, findings: Finding[]): CategoryScore {
  const s = new Scorer();

  switch (input.wellStatus) {
    case "permitted-and-registered":
      s.credit(8, "well is permitted and registered");
      break;
    case "registered-only":
      if (profile.permitRequiredForNewWells) {
        s.deduct(14, "well is registered but no permit of record");
        findings.push({
          id: "well-registered-not-permitted",
          severity: "major",
          title: "Well is registered but not permitted",
          detail: `${profile.name} requires a permit for production wells. Registration alone records that a hole exists; it does not authorize pumping. An unpermitted well can be ordered plugged.`,
          remedy: `Ask ${profile.agency.short} whether a permit of record exists for this well, and if not, whether one can be issued now. In a closed basin the answer is often no.`,
          category: "physical-supply",
        });
      }
      break;
    case "unregistered":
      s.deduct(22, "well is unregistered");
      findings.push({
        id: "well-unregistered",
        severity: "critical",
        title: "Unregistered well",
        detail:
          "An unregistered well is an illegal well. Beyond the enforcement exposure, it means there is no state record of its depth, construction, yield or the right to use it — and no basis for the seller's claims about capacity.",
        remedy: `Contact ${profile.agency.short} about the path to registration or permitting, and make that path a condition of closing. Budget for the possibility that the well must be plugged and abandoned at your cost.`,
        cureCost: "Registration is cheap; plugging and re-drilling runs $15,000-$100,000+",
        category: "physical-supply",
      });
      break;
    case "abandoned-or-unknown":
      s.deduct(16, "well condition unknown or abandoned");
      break;
    case "none":
      if (input.surfaceRight === "none" && needsWater(input)) {
        s.deduct(30, "no physical means of delivering water to the land");
      }
      break;
  }

  if (input.wellStatus !== "none" && !hasDoc(input, "well-log-and-completion-report")) {
    s.deduct(10, "no well log or completion report");
    findings.push({
      id: "missing-well-log",
      severity: "moderate",
      title: "No well log or completion report",
      detail:
        "The driller's log tells you the total depth, the casing and screen intervals, the static water level at completion and the formation. Without it you cannot tell whether declining yield reflects the aquifer or a failing well.",
      remedy: `Search ${profile.agency.short}'s well log database by legal description — logs are usually public even when the seller has lost their copy.`,
      category: "physical-supply",
    });
  }

  if (input.wellStatus !== "none" && !hasDoc(input, "pump-test")) {
    s.deduct(8, "no pump test");
    findings.push({
      id: "missing-pump-test",
      severity: "moderate",
      title: "No recent pump test",
      detail:
        "Instantaneous yield in gallons per minute says little about sustained capacity. A well that makes 800 gpm for ten minutes and 200 gpm after eight hours is a 200 gpm well, and only a constant-rate test will show you that.",
      remedy:
        "Order a 24-hour constant-rate pump test with drawdown and recovery measurement, at your expense if necessary. It is the cheapest meaningful diligence on this list.",
      cureCost: "$1,500-$5,000",
      category: "physical-supply",
    });
  }

  switch (input.aquiferTrend) {
    case "rising":
      s.credit(5, "aquifer levels rising");
      break;
    case "stable":
      s.credit(3, "aquifer levels stable");
      break;
    case "declining":
      s.deduct(14, "aquifer in decline");
      findings.push({
        id: "aquifer-declining",
        severity: "major",
        title: "Declining aquifer",
        detail:
          "A falling water table raises lift cost every year and eventually strands the well above the water. It also invites regulatory intervention — pumping caps and management areas follow decline, not precede it.",
        remedy:
          "Get static water level measurements for the last twenty years from the state or USGS, compute the annual decline rate, and project the well's remaining life at that rate against your hold period.",
        category: "physical-supply",
      });
      break;
    case "steeply-declining":
      s.deduct(26, "aquifer in steep decline");
      findings.push({
        id: "aquifer-steeply-declining",
        severity: "critical",
        title: "Steeply declining aquifer",
        detail:
          "At this rate of decline the asset is depleting under you. Deepening a well buys time at real cost, and regulatory curtailment in steeply declining areas is a question of when, not whether.",
        remedy:
          "Model the deal on a shortened irrigable life and confirm the depth to the base of the aquifer. If saturated thickness is under roughly 30 feet, price the land as dryland.",
        cureCost: "Deepening or replacing a well: $50,000-$300,000, and it does not add water",
        category: "physical-supply",
      });
      break;
    case "unknown":
      s.deduct(8, "aquifer trend not investigated");
      break;
  }

  if (input.inManagedDistrict === "yes") {
    s.note("parcel lies within a managed groundwater district");
    findings.push({
      id: "managed-district",
      severity: "moderate",
      title: "Parcel is inside a managed groundwater district",
      detail:
        "The district's rules — not state law generally — determine what you may pump, how it is measured, what it costs and whether the allocation can be reduced. Districts differ substantially from one another.",
      remedy:
        "Obtain the district's current rules, the parcel's allocation in acre-feet, the assessment history, and any pending management plan amendments. Ask specifically whether allocations have been reduced in the past ten years.",
      category: "physical-supply",
    });
  } else if (input.inManagedDistrict === "unknown") {
    s.deduct(6, "district membership not determined");
  }

  // Yield adequacy against intended irrigated acreage.
  const planned = input.irrigatedAcresPlanned ?? 0;
  if (planned > 0 && input.wellYieldGpm) {
    // Rule of thumb: ~7-8 gpm per acre sustains most irrigated row crops.
    const acresSupported = input.wellYieldGpm / 7.5;
    if (acresSupported < planned * 0.6) {
      s.deduct(18, `well yield supports roughly ${Math.round(acresSupported)} acres against ${planned} planned`);
      findings.push({
        id: "insufficient-yield",
        severity: "major",
        title: "Well yield is short of the planned irrigated acreage",
        detail: `At ${input.wellYieldGpm} gpm, this well sustains roughly ${Math.round(acresSupported)} irrigated acres under a typical 7.5 gpm-per-acre requirement. You have planned ${planned} acres.`,
        remedy:
          "Either reduce planned acreage, add a second well where the basin permits it, or shift to a lower-duty crop or dryland rotation on the balance.",
        category: "physical-supply",
      });
    }
  }

  return {
    category: "physical-supply",
    label: CATEGORY_LABELS["physical-supply"],
    score: s.value(),
    weight: 0,
    drivers: s.drivers,
  };
}

// ---------------------------------------------------------------------------
// Category: land & access
// ---------------------------------------------------------------------------

function scoreLand(input: ParcelInput, _profile: JurisdictionProfile, findings: Finding[]): CategoryScore {
  const s = new Scorer();

  if (input.legalAccess === "no") {
    s.deduct(45, "no legal access — parcel is landlocked");
    findings.push({
      id: "landlocked",
      severity: "critical",
      title: "The parcel is landlocked",
      detail:
        "Without a recorded easement or public road frontage there is no right to reach the property. Physical access across a neighbor's ground by long practice is not a legal right, and it ends when the neighbor sells.",
      remedy:
        "Require a recorded, insurable access easement as a closing condition, or confirm an existing one appears in the title commitment. Do not accept an oral assurance or a two-track that 'everyone uses.'",
      cureCost: "Negotiated easements range from thousands to prohibitive; a hostile neighbor makes it unbuyable",
      category: "land-access",
    });
  } else if (input.legalAccess === "unknown") {
    s.deduct(15, "legal access not confirmed");
  }

  if (input.mineralEstateSevered === "yes") {
    s.deduct(14, "mineral estate is severed");
    findings.push({
      id: "severed-minerals",
      severity: "major",
      title: "Severed mineral estate",
      detail:
        "The mineral estate is generally dominant: its owner may use as much of the surface as is reasonably necessary to develop the minerals. That can mean pads, roads and pipelines across irrigated ground, and in some cases risk to shallow aquifers.",
      remedy:
        "Determine who owns the minerals, whether the acreage is leased, and whether any surface use agreement exists. Where the minerals are unleased and held by many fractional owners, the practical risk is lower but not zero.",
      category: "land-access",
    });
  } else if (input.mineralEstateSevered === "unknown") {
    s.deduct(6, "mineral estate status not checked");
  }

  if (input.conservationEasement === "yes") {
    s.deduct(10, "conservation easement encumbers the property");
    findings.push({
      id: "conservation-easement",
      severity: "moderate",
      title: "Conservation easement on the property",
      detail:
        "A conservation easement runs with the land in perpetuity and can restrict subdivision, structures, tillage and sometimes water use or transfer. It also lowers the price, which is often why the parcel looks like a bargain.",
      remedy:
        "Read the easement in full, note the reserved rights, and contact the holding land trust about what they have approved for similar parcels. Confirm whether the water right is separately encumbered.",
        category: "land-access",
    });
  }

  if (input.existingLiens === "yes") {
    s.deduct(12, "liens of record");
    findings.push({
      id: "liens",
      severity: "moderate",
      title: "Liens of record against the property",
      detail:
        "Liens must be cleared or subordinated at closing. Irrigation district assessments and ditch company assessments are frequently senior and can survive an ordinary payoff.",
      remedy:
        "Get a written payoff or estoppel from every lienholder, and specifically from the irrigation district or ditch company, showing assessments current through closing.",
      category: "land-access",
    });
  }

  if (!hasDoc(input, "survey")) {
    s.deduct(6, "no survey");
  }

  return {
    category: "land-access",
    label: CATEGORY_LABELS["land-access"],
    score: s.value(),
    weight: 0,
    drivers: s.drivers,
  };
}

// ---------------------------------------------------------------------------
// Category: economics
// ---------------------------------------------------------------------------

function scoreEconomics(
  input: ParcelInput,
  _profile: JurisdictionProfile,
  findings: Finding[],
  reliableAcreFeet: number | null,
): CategoryScore {
  const s = new Scorer();

  if (!input.askingPrice || input.askingPrice <= 0 || input.acres <= 0) {
    s.note("no price supplied — economics not scored");
    return {
      category: "economics",
      label: CATEGORY_LABELS.economics,
      score: 60,
      weight: 0,
      drivers: ["Neutral placeholder: supply an asking price to score acquisition economics."],
    };
  }

  const perAcre = input.askingPrice / input.acres;
  s.note(`$${Math.round(perAcre).toLocaleString()} per deeded acre`);

  if (reliableAcreFeet && reliableAcreFeet > 0) {
    const perAf = input.askingPrice / reliableAcreFeet;
    s.note(`$${Math.round(perAf).toLocaleString()} per reliable acre-foot of annual yield`);
    if (perAf > 40000) {
      s.deduct(20, "price per reliable acre-foot is very high");
      findings.push({
        id: "expensive-water",
        severity: "moderate",
        title: "The implied price of the water is high",
        detail: `Allocating the full purchase price against the engine's reliable-yield estimate gives roughly $${Math.round(perAf).toLocaleString()} per acre-foot of annual supply. That is at or above what firmed municipal water trades for in most western markets, and you are also buying the discount risk.`,
        remedy:
          "Separate the land value from the water value explicitly. Comp the dryland value of the acreage, subtract it, and test what the remainder implies per acre-foot against recent transfers in the same basin.",
        category: "economics",
      });
    } else if (perAf < 8000) {
      s.credit(10, "price per reliable acre-foot is attractive");
    }
  } else if (needsWater(input)) {
    s.deduct(15, "no reliable yield to price against");
  }

  if (input.closeTimelineDays !== undefined && input.closeTimelineDays < 45) {
    s.deduct(12, `${input.closeTimelineDays}-day close is too short for water diligence`);
    findings.push({
      id: "timeline-too-short",
      severity: "major",
      title: "The closing timeline does not fit water diligence",
      detail: `Water records requests, a pump test, a title commitment covering water, and an engineer's opinion do not reliably complete in ${input.closeTimelineDays} days. A compressed timeline is how buyers end up waiving the diligence that mattered.`,
      remedy:
        "Negotiate a longer water-specific contingency period, or structure a holdback on the water portion of the price that survives closing until the state confirms the right.",
      category: "economics",
    });
  }

  if (input.financing === "1031-exchange") {
    findings.push({
      id: "1031-timing",
      severity: "moderate",
      title: "1031 exchange deadlines compress diligence",
      detail:
        "The 45-day identification and 180-day closing windows are unforgiving, and they pressure buyers into accepting unresolved water questions. In several states a water right severed from land is itself like-kind real property, which can widen your options.",
      remedy:
        "Identify more replacement candidates than you need, and confirm with your qualified intermediary how the state characterizes standalone water rights for exchange purposes.",
      category: "economics",
    });
  }

  return {
    category: "economics",
    label: CATEGORY_LABELS.economics,
    score: s.value(),
    weight: 0,
    drivers: s.drivers,
  };
}

// ---------------------------------------------------------------------------
// Category: eligibility & country risk
// ---------------------------------------------------------------------------

const OWNERSHIP_PENALTY: Record<string, number> = {
  unrestricted: 0,
  "restricted-rural": 22,
  "approval-required": 18,
  "structure-required": 16,
  "leasehold-only": 26,
  prohibited: 100,
};

/** Structures that actually satisfy each regime, where one exists. */
const LAWFUL_STRUCTURES: Record<string, string[]> = {
  "structure-required": ["trust-or-fideicomiso", "local-company", "joint-venture-with-national"],
  "leasehold-only": ["long-lease", "local-company", "joint-venture-with-national"],
  "approval-required": ["personal-freehold", "local-company", "foreign-company", "joint-venture-with-national"],
  "restricted-rural": ["personal-freehold", "local-company", "joint-venture-with-national"],
};

interface OwnershipOutcome {
  category: CategoryScore;
  dealBreaker: string | null;
}

function scoreForeignOwnership(
  input: ParcelInput,
  profile: JurisdictionProfile,
  findings: Finding[],
  crossBorder: boolean,
): OwnershipOutcome {
  const s = new Scorer();

  if (!crossBorder) {
    s.note("Domestic acquisition — foreign ownership rules do not apply.");
    return {
      category: {
        category: "foreign-ownership",
        label: CATEGORY_LABELS["foreign-ownership"],
        score: 100,
        weight: 0,
        drivers: s.drivers,
      },
      dealBreaker: null,
    };
  }

  const fo = profile.foreignOwnership;
  const cr = profile.countryRisk;
  let dealBreaker: string | null = null;

  if (!fo || !cr) {
    s.deduct(30, "no foreign ownership profile on record for this jurisdiction");
    findings.push({
      id: "ownership-unknown",
      severity: "major",
      title: `Foreign ownership rules for ${profile.name} are not modeled`,
      detail:
        "This jurisdiction has no eligibility profile in the registry, so the engine cannot tell you whether a foreign buyer may hold this land. That is a gap in the tool, not a clean bill of health.",
      remedy: "Instruct local counsel on foreign ownership eligibility before any other diligence spend.",
      category: "foreign-ownership",
    });
    return {
      category: {
        category: "foreign-ownership",
        label: CATEGORY_LABELS["foreign-ownership"],
        score: s.value(),
        weight: 0,
        drivers: s.drivers,
      },
      dealBreaker: null,
    };
  }

  const structure = input.ownershipStructure ?? "undecided";

  // --- Eligibility ----------------------------------------------------------
  s.deduct(OWNERSHIP_PENALTY[fo.regime] ?? 0, `${fo.regime.replace(/-/g, " ")} regime in ${profile.name}`);

  if (fo.regime === "prohibited") {
    dealBreaker = `${profile.name} bars foreign ownership of this class of land. ${fo.ruralLandRule}`;
    findings.push({
      id: "ownership-prohibited",
      severity: "critical",
      title: `Foreign buyers cannot own this land in ${profile.name}`,
      detail: `${fo.summary} ${fo.ruralLandRule}`,
      remedy: fo.nomineeWarning
        ? `Do not attempt a workaround. ${fo.nomineeWarning} If you want exposure to this country, look at a long lease or a genuine operating joint venture — and take local advice before spending anything.`
        : "Consider a long lease or an operating joint venture instead, and take local advice before committing.",
      cureCost: "Not curable — this is a legal bar, not a cost",
      category: "foreign-ownership",
    });
  } else if (fo.regime === "leasehold-only") {
    findings.push({
      id: "leasehold-only",
      severity: "major",
      title: `${profile.name} offers use rights, not ownership`,
      detail: `${fo.summary} ${fo.ruralLandRule} A finite, renewable interest behaves nothing like freehold: it amortises, its renewal is discretionary, and it is harder to finance and to sell.`,
      remedy:
        "Confirm the unexpired term, the renewal mechanism and who must consent to an assignment. Underwrite the asset over the remaining term, not in perpetuity.",
      category: "foreign-ownership",
    });
  } else if (fo.regime === "structure-required") {
    const lawful = LAWFUL_STRUCTURES[fo.regime] ?? [];
    if (structure !== "undecided" && !lawful.includes(structure)) {
      s.deduct(25, `${structure.replace(/-/g, " ")} is not an available route for a foreign buyer here`);
      findings.push({
        id: "structure-mismatch",
        severity: "critical",
        title: "The chosen ownership structure is not lawful here",
        detail: `You selected ${structure.replace(/-/g, " ")}, but ${profile.name} requires one of: ${lawful
          .map((l) => l.replace(/-/g, " "))
          .join(", ")}. ${fo.borderCoastalRule ?? fo.ruralLandRule}`,
        remedy:
          "Restructure before making an offer. Getting this wrong is not a technicality — a purchase in breach can be void and unrecoverable.",
        category: "foreign-ownership",
      });
    } else if (structure === "undecided") {
      s.deduct(10, "ownership structure not yet chosen and one is mandatory");
    }
    findings.push({
      id: "structure-required",
      severity: "major",
      title: `${profile.name} requires a specific holding structure`,
      detail: `${fo.summary} ${fo.borderCoastalRule ?? ""}`,
      remedy:
        "Decide the vehicle before you negotiate price — it affects tax, financing, exit and the timetable, and it cannot be retrofitted after closing.",
      category: "foreign-ownership",
    });
  } else if (fo.regime === "approval-required" && fo.approvalBody) {
    findings.push({
      id: "screening-approval",
      severity: "major",
      title: `${fo.approvalBody.short} approval is required before completion`,
      detail: `${fo.ruralLandRule} Expect roughly ${fo.approvalTimelineDays ?? 90} days, and treat refusal as a live possibility rather than a formality.`,
      remedy: `Make the contract conditional on ${fo.approvalBody.short} approval, with a long-stop date and a full deposit refund if consent is refused.`,
      category: "foreign-ownership",
    });
  } else if (fo.regime === "restricted-rural") {
    findings.push({
      id: "rural-restriction",
      severity: "major",
      title: `${profile.name} restricts foreign acquisition of rural land`,
      detail: `${fo.ruralLandRule}${fo.caps ? ` Caps: ${fo.caps}` : ""}`,
      remedy:
        "Confirm eligibility and headroom under the cap in writing before making an offer, and build the clearance into the contract as a condition precedent.",
      category: "foreign-ownership",
    });
  }

  // --- Border and coastal exclusion zones -----------------------------------
  if (fo.borderCoastalRule && fo.regime !== "structure-required") {
    s.deduct(6, "border or coastal exclusion zone rules apply somewhere in this country");
    findings.push({
      id: "border-zone",
      severity: "moderate",
      title: "Border or coastal exclusion zone",
      detail: fo.borderCoastalRule,
      remedy:
        "Plot the parcel against the exclusion zone before anything else. This is a map question with a yes or no answer, and it is free to resolve.",
      category: "foreign-ownership",
    });
  }

  // --- Nominee structures ---------------------------------------------------
  if (fo.nomineeWarning && fo.regime !== "prohibited") {
    findings.push({
      id: "nominee-warning",
      severity: "major",
      title: "Nominee arrangements do not work here",
      detail: fo.nomineeWarning,
      remedy:
        "If the only route being offered involves a local person or company holding on your behalf, treat that as a reason to walk rather than a structuring idea.",
      category: "foreign-ownership",
    });
  }

  // --- Sovereign and title risk ---------------------------------------------
  s.deduct(RISK_PENALTY[cr.expropriationRisk] ?? 0, `${cr.expropriationRisk} expropriation risk`);
  s.deduct(RISK_PENALTY[cr.titleReliability] ?? 0, `${cr.titleReliability} risk of defective title`);

  if (cr.expropriationRisk === "high" || cr.expropriationRisk === "severe") {
    findings.push({
      id: "expropriation-risk",
      severity: "major",
      title: `Elevated expropriation and tenure-policy risk in ${profile.name}`,
      detail: cr.notes,
      remedy:
        "Check whether a bilateral investment treaty covers your nationality and structure the holding to sit inside it. Price the policy risk rather than assuming continuity.",
      category: "foreign-ownership",
    });
  }

  if (cr.titleReliability === "high" || cr.titleReliability === "severe") {
    findings.push({
      id: "title-fraud-risk",
      severity: "critical",
      title: `Registered title is not reliable on its own in ${profile.name}`,
      detail: `${cr.notes} A ${cr.titleSystem.replace(/-/g, " ")} system proves ownership by the chain of transactions, so a clean-looking current extract can sit on top of a forged or duplicated link.`,
      remedy:
        "Commission an independent title investigation going back decades, using counsel you found yourself rather than anyone introduced by the seller or the agent.",
      cureCost: "A few thousand dollars against the whole purchase price",
      category: "foreign-ownership",
    });
  }

  if (cr.customaryTenureRisk === "high" || cr.customaryTenureRisk === "severe") {
    s.deduct(RISK_PENALTY[cr.customaryTenureRisk] ?? 0, `${cr.customaryTenureRisk} customary or community claim risk`);
    findings.push({
      id: "customary-claims",
      severity: "major",
      title: "Formal title may sit over live community claims",
      detail:
        "Land that is properly registered can still be occupied or claimed under customary, indigenous or agrarian-reform rights that the register does not show. These claims are frequently valid, and they are the most common source of post-closing conflict in this class of acquisition.",
      remedy:
        "Visit the land, walk the boundaries, and speak to neighbouring occupiers and the local authority before closing. A desk-only diligence process will not surface this.",
      category: "foreign-ownership",
    });
  }

  // --- Capital controls -----------------------------------------------------
  if (cr.currencyControls) {
    s.deduct(10, "exchange controls apply");
    findings.push({
      id: "currency-controls",
      severity: "major",
      title: "Exchange controls affect how you get money in and out",
      detail: `${cr.currencyControls} ${cr.repatriationNote}`,
      remedy:
        "Route the purchase funds through the prescribed channel and obtain the registration or endorsement at the time of transfer. Retrofitting this after closing is usually impossible.",
      category: "foreign-ownership",
    });
  }

  if (fo.reportingObligation) {
    findings.push({
      id: "post-close-reporting",
      severity: "moderate",
      title: "Post-closing registration obligations",
      detail: fo.reportingObligation,
      remedy: "Diarise the filing deadlines at closing. Penalties for missing foreign-ownership registers are real and avoidable.",
      category: "foreign-ownership",
    });
  }

  if (input.hasLocalResidency === "yes" && (fo.regime === "restricted-rural" || fo.regime === "leasehold-only")) {
    s.credit(12, "buyer holds local residency, which relaxes several restrictions");
  }

  if (fo.regime === "unrestricted" && cr.expropriationRisk === "low" && cr.titleReliability === "low") {
    findings.push({
      id: "clean-jurisdiction",
      severity: "positive",
      title: `${profile.name} is genuinely open to foreign buyers`,
      detail: `${fo.summary} Combined with low expropriation risk and a reliable register, the eligibility question here is simply not a source of risk.`,
      remedy: "Spend the diligence budget you would have used on structuring on the water and the land instead.",
      category: "foreign-ownership",
    });
  }

  return {
    category: {
      category: "foreign-ownership",
      label: CATEGORY_LABELS["foreign-ownership"],
      score: s.value(),
      weight: 0,
      drivers: s.drivers,
    },
    dealBreaker,
  };
}

// ---------------------------------------------------------------------------
// Water balance
// ---------------------------------------------------------------------------

function computeWaterBalance(input: ParcelInput, profile: JurisdictionProfile) {
  const claimed = input.decreedAcreFeet ?? null;

  let required = input.intendedAcreFeet ?? null;
  if (required === null) {
    const duty = DUTY_BY_INTENT[input.intent] ?? 0;
    const acres = input.irrigatedAcresPlanned ?? (input.intent === "pasture-grazing" ? input.acres : 0);
    required = acres > 0 ? Math.round(acres * duty * 10) / 10 : null;
  }

  // Each unresolved risk multiplies down the volume you should count on.
  let factor = 1;
  const apply = (f: number) => {
    factor *= f;
  };

  // Seniority and adjudication only bear on an appropriative *surface* right.
  // A Texas or Nebraska parcel whose supply is groundwater has no priority date
  // to discount, and penalizing it for the absence of one would be nonsense.
  if (isAppropriationState(profile) && input.surfaceRight !== "none") {
    const year = priorityYear(input);
    if (year === null) apply(0.75);
    else if (year > 1975) apply(0.45);
    else if (year > 1955) apply(0.7);
    else if (year > 1922) apply(0.88);

    if (input.adjudication === "unadjudicated") apply(0.75);
    else if (input.adjudication === "adjudication-pending") apply(0.82);
    else if (input.adjudication === "unknown") apply(0.85);
  }

  if (input.previouslySevered === "yes") apply(0.6);
  else if (input.previouslySevered === "unknown") apply(0.85);

  if (input.appurtenant === "no") apply(0.5);
  else if (input.appurtenant === "unknown") apply(0.9);

  const gap = input.longestNonUseGapYears ?? 0;
  if (profile.forfeitureYears !== null && gap >= profile.forfeitureYears) apply(0.4);
  else if (profile.forfeitureYears !== null && gap >= profile.forfeitureYears - 2) apply(0.75);

  if (input.aquiferTrend === "steeply-declining") apply(0.7);
  else if (input.aquiferTrend === "declining") apply(0.85);

  if (profile.closedBasinRisk === "severe") apply(0.85);
  else if (profile.closedBasinRisk === "high") apply(0.92);

  // A change of use is capped at historical consumptive use.
  if (isAppropriationState(profile) && (input.intent === "development" || input.intent === "recharge-banking")) {
    apply(0.45);
  }

  const reliabilityFactor = Math.round(factor * 100) / 100;
  const reliable = claimed === null ? null : Math.round(claimed * reliabilityFactor * 10) / 10;
  const shortfall = reliable !== null && required !== null ? Math.round((required - reliable) * 10) / 10 : null;

  return {
    claimedAcreFeet: claimed,
    requiredAcreFeet: required,
    reliableAcreFeet: reliable,
    reliabilityFactor,
    shortfall,
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function assessParcel(input: ParcelInput): Assessment {
  const profile = getJurisdiction(input.jurisdictionCode);
  if (!profile) {
    throw new Error(`Unknown jurisdiction code: ${input.jurisdictionCode}`);
  }

  const findings: Finding[] = [];
  const crossBorder = isCrossBorder(profile, input.buyerCountry);
  const weights = crossBorder ? WEIGHTS_CROSS_BORDER : WEIGHTS_DOMESTIC;

  const balance = computeWaterBalance(input, profile);
  const ownership = scoreForeignOwnership(input, profile, findings, crossBorder);

  const categories: CategoryScore[] = [
    scoreWaterSecurity(input, profile, findings),
    scoreTitle(input, profile, findings),
    ownership.category,
    scorePhysical(input, profile, findings),
    scoreLand(input, profile, findings),
    scoreEconomics(input, profile, findings, balance.reliableAcreFeet),
  ]
    // Weights depend on whether this is a cross-border deal, so they are
    // applied here rather than baked into each scorer.
    .map((c) => ({ ...c, weight: weights[c.category] }))
    .filter((c) => c.weight > 0);

  if (balance.shortfall !== null && balance.shortfall > 0) {
    findings.push({
      id: "supply-shortfall",
      severity: balance.shortfall > (balance.requiredAcreFeet ?? 0) * 0.4 ? "critical" : "major",
      title: `Projected shortfall of ${balance.shortfall} acre-feet per year`,
      detail: `Your intended use needs about ${balance.requiredAcreFeet} acre-feet annually. Against a claimed ${balance.claimedAcreFeet} acre-feet, the engine's risk-adjusted reliable figure is ${balance.reliableAcreFeet} acre-feet — a ${balance.shortfall} acre-foot gap. The discount reflects seniority, adjudication status, severance history and non-use exposure, not physical hydrology.`,
      remedy:
        "Close the gap before closing the deal: reduce planned acreage, acquire supplemental supply, or reprice. Assume the risk-adjusted figure is what you will actually get in a dry year.",
      category: "water-security",
    });
  }

  // Positive findings — worth telling a buyer what is actually working.
  if (isAppropriationState(profile)) {
    const year = priorityYear(input);
    if (year !== null && year <= 1922 && input.adjudication === "fully-adjudicated") {
      findings.push({
        id: "senior-adjudicated",
        severity: "positive",
        title: `Senior, adjudicated right (${year})`,
        detail:
          "A pre-1922 adjudicated priority on a western stream is a genuinely scarce asset. It is rarely curtailed, it is the collateral other buyers want, and it tends to hold value independent of the land.",
        remedy:
          "Protect it: keep beneficial use continuous and documented from day one, and never let the state's record lag behind the actual ownership.",
        category: "water-security",
      });
    }
  }

  const composite = Math.round(
    categories.reduce((sum, c) => sum + c.score * c.weight, 0),
  );

  const criticals = findings.filter((f) => f.severity === "critical").length;
  const verdict = decideVerdict(composite, criticals, ownership.dealBreaker);

  const assessment: Assessment = {
    composite,
    verdict,
    categories,
    findings: sortFindings(findings),
    checklist: [],
    sellerQuestions: [],
    waterBalance: balance,
    jurisdiction: profile,
    dealBreaker: ownership.dealBreaker,
    crossBorder,
    generatedAt: new Date().toISOString(),
  };

  assessment.checklist = buildChecklist(input, assessment);
  assessment.sellerQuestions = buildSellerQuestions(input, assessment);

  return assessment;
}

function decideVerdict(composite: number, criticals: number, dealBreaker: string | null): Verdict {
  // A legal bar is not a bad score, it is the absence of a transaction.
  if (dealBreaker) return "walk";
  if (criticals >= 3) return "walk";
  if (criticals >= 1 && composite < 55) return "walk";
  if (composite >= 78 && criticals === 0) return "pursue";
  if (composite >= 60) return "investigate";
  if (composite >= 42) return "caution";
  return "walk";
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  major: 1,
  moderate: 2,
  minor: 3,
  positive: 4,
};

function sortFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  return findings
    .filter((f) => {
      if (seen.has(f.id)) return false;
      seen.add(f.id);
      return true;
    })
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9));
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function humanIntent(intent: ParcelInput["intent"]): string {
  const labels: Record<ParcelInput["intent"], string> = {
    "irrigated-crop": "irrigated cropland",
    "pasture-grazing": "irrigated pasture and grazing",
    livestock: "livestock water",
    "domestic-homestead": "domestic and homestead use",
    "recharge-banking": "recharge and water banking",
    development: "development",
    "conservation-hold": "conservation or long-term hold",
  };
  return labels[intent];
}

export const VERDICT_COPY: Record<Verdict, { label: string; blurb: string }> = {
  pursue: {
    label: "Pursue",
    blurb: "The water story holds up. Move to a letter of intent with the diligence conditions below written in.",
  },
  investigate: {
    label: "Investigate",
    blurb: "Promising, with specific unresolved questions. Do not make a non-refundable commitment until the blocking items clear.",
  },
  caution: {
    label: "Caution",
    blurb: "Material defects are present. Proceed only with a repriced offer and a water-rights holdback that survives closing.",
  },
  walk: {
    label: "Walk",
    blurb: "One or more issues here are likely fatal or uncurable at any sensible price. Spend your diligence budget elsewhere.",
  },
};
