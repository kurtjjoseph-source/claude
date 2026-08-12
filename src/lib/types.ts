/**
 * Domain model for water-rights land acquisition.
 *
 * Design rule for this codebase: every legally-consequential conclusion is
 * computed by the deterministic engine in `lib/water/engine.ts` from the
 * structured facts below. The language model narrates, sequences and
 * strategizes on top of engine output — it never originates a rule, a
 * priority date, a statutory period, or a red flag.
 */

// ---------------------------------------------------------------------------
// Legal regimes
// ---------------------------------------------------------------------------

/** How a jurisdiction allocates *surface* water. */
export type SurfaceDoctrine =
  /** "First in time, first in right." Seniority governs; use it or lose it. */
  | "prior-appropriation"
  /** Recognizes both pre-existing riparian claims and appropriative permits. */
  | "hybrid"
  /** Rights run with land touching the watercourse; reasonable use, no permit. */
  | "riparian"
  /** Riparian in origin, but withdrawals above a threshold need a state permit. */
  | "regulated-riparian"
  /**
   * Civil-law default outside the Anglosphere: water is public domain and use
   * is granted by revocable administrative concession, licence or permit.
   */
  | "administrative-concession"
  /**
   * A concession regime where the entitlement is a freely tradable asset in its
   * own right, with a market and a register — Chile and the Australian states.
   */
  | "tradable-entitlement"
  /** Allocation governed primarily by customary or communal tenure. */
  | "customary";

/** How a state allocates *groundwater* — a separate axis from surface water. */
export type GroundwaterRegime =
  /** Wells are appropriative rights with priority dates, like surface water. */
  | "appropriation"
  /** Absolute dominion / rule of capture: pump what you can, subject to districts. */
  | "rule-of-capture"
  /** Overlying owners share a basin's safe yield pro rata. */
  | "correlative"
  /** Reasonable use on the overlying land ("American rule"). */
  | "reasonable-use"
  /** Restatement (Second) of Torts § 858 reasonable-use balancing. */
  | "restatement"
  /** Allocation delegated primarily to local conservation districts. */
  | "district-managed"
  /** Groundwater is public domain, abstracted under a revocable licence. */
  | "administrative-concession";

/** A statutory overlay that changes the analysis inside part of a state. */
export interface SpecialRegime {
  name: string;
  /** Short description of what it does to a buyer. */
  effect: string;
  /** Where it bites. */
  appliesTo: string;
  severity: RiskLevel;
}

export type RiskLevel = "low" | "moderate" | "high" | "severe";

export interface Agency {
  name: string;
  short: string;
  /** What this office actually does for you during diligence. */
  role: string;
  url: string;
}

export type Region =
  | "united-states"
  | "canada"
  | "latin-america"
  | "europe"
  | "africa"
  | "asia"
  | "oceania";

/**
 * Whether a foreign buyer may hold the interest at all.
 *
 * For a cross-border acquisition this outranks every hydrological question:
 * a perfect water right on land you are legally barred from owning is worth
 * nothing, and the workaround people reach for — a local nominee holding title
 * on your behalf — is a criminal offence in several of these countries.
 */
export type ForeignOwnershipRegime =
  /** Foreign buyers are treated substantially the same as nationals. */
  | "unrestricted"
  /** Freehold is available but rural/agricultural land carries caps or conditions. */
  | "restricted-rural"
  /** A screening body must approve the acquisition before it can complete. */
  | "approval-required"
  /** No freehold for foreigners; long leases or use rights only. */
  | "leasehold-only"
  /** Freehold only through a prescribed vehicle — a trust or local company. */
  | "structure-required"
  /** Foreign acquisition of this class of land is barred outright. */
  | "prohibited";

export type TitleSystem =
  /** State-guaranteed register; the register *is* the title. */
  | "torrens"
  /** Register of deeds; title is proved by the chain, not the register. */
  | "deeds-registry"
  | "mixed"
  /** A formal register sitting over unextinguished customary/communal rights. */
  | "customary-overlay"
  /** The state owns the land and grants time-limited use rights. */
  | "state-allocated";

export interface ForeignOwnershipProfile {
  regime: ForeignOwnershipRegime;
  summary: string;
  /** What specifically applies to farmland and large rural holdings. */
  ruralLandRule: string;
  /** Border, coastal and strategic exclusion zones, where they exist. */
  borderCoastalRule: string | null;
  /** Whether a foreign holder can take the water entitlement itself. */
  waterRightsForeignRule: string;
  /** The screening or approval body, where one exists. */
  approvalBody: Agency | null;
  /** Realistic elapsed time for approval, in days. */
  approvalTimelineDays: number | null;
  /** Acreage or percentage ceilings. */
  caps: string | null;
  /** Set where nominee arrangements are common *and* unlawful. */
  nomineeWarning: string | null;
  /** Reporting obligations that attach after closing. */
  reportingObligation: string | null;
}

export interface CountryRiskProfile {
  expropriationRisk: RiskLevel;
  titleSystem: TitleSystem;
  /** Risk that registered title turns out to be defective or contested. */
  titleReliability: RiskLevel;
  /** Risk that formally titled land carries live customary/communal claims. */
  customaryTenureRisk: RiskLevel;
  /** Controls on moving capital in and profits out. */
  currencyControls: string | null;
  repatriationNote: string;
  notes: string;
}

export interface JurisdictionProfile {
  code: string;
  name: string;
  /** Country this sits in. Equal to `name` for country-level entries. */
  country: string;
  region: Region;
  /** True for states and provinces inside a larger country. */
  subnational: boolean;
  /** Present only for jurisdictions outside the buyer's home country. */
  foreignOwnership?: ForeignOwnershipProfile;
  countryRisk?: CountryRiskProfile;
  /** Local term for the county-equivalent, used to label the wizard field. */
  subdivisionLabel?: string;
  /** Local unit buyers actually transact in, e.g. "hectares". */
  areaUnitNote?: string;
  surfaceDoctrine: SurfaceDoctrine;
  groundwaterRegime: GroundwaterRegime;
  /** Primary state water agency — the office you call first. */
  agency: Agency;
  /** Where rights are adjudicated / quantified. */
  adjudicationForum: string;
  /** Statutory non-use period after which a right may be forfeited. */
  forfeitureYears: number | null;
  /** Whether drilling a new production well requires a state permit. */
  permitRequiredForNewWells: boolean;
  /** Domestic/stock exemption, and its acreage or volume ceiling. */
  exemptWellNote: string | null;
  /** How readily a right moves off the land it currently serves. */
  transferability:
    | "appurtenant-transfers-with-land"
    | "severable-with-approval"
    | "severable-freely"
    | "limited";
  specialRegimes: SpecialRegime[];
  keyStatutes: string[];
  /** Baseline likelihood the relevant basins are closed to new appropriation. */
  closedBasinRisk: RiskLevel;
  /** State-specific traps worth surfacing on every deal here. */
  cautions: string[];
  notes: string;
}

// ---------------------------------------------------------------------------
// What the wizard collects
// ---------------------------------------------------------------------------

export type WaterUseIntent =
  | "irrigated-crop"
  | "pasture-grazing"
  | "livestock"
  | "domestic-homestead"
  | "recharge-banking"
  | "development"
  | "conservation-hold";

export type SurfaceRightKind =
  | "none"
  | "decreed-appropriative"
  | "permitted-appropriative"
  | "pre-1914-or-vested"
  | "riparian"
  | "ditch-company-shares"
  | "federal-project-contract"
  | "unknown";

export type AdjudicationStatus =
  | "fully-adjudicated"
  | "adjudication-pending"
  | "unadjudicated"
  | "not-applicable"
  | "unknown";

export type WellStatus =
  | "none"
  | "permitted-and-registered"
  | "registered-only"
  | "unregistered"
  | "abandoned-or-unknown";

export type TrendDirection = "rising" | "stable" | "declining" | "steeply-declining" | "unknown";

export type YesNoUnknown = "yes" | "no" | "unknown";

/** Documents the seller has actually produced (not merely promised). */
export type DocumentId =
  | "deed-with-water-language"
  | "state-permit-or-decree"
  | "well-log-and-completion-report"
  | "historical-use-records"
  | "pump-test"
  | "engineers-report"
  | "title-commitment"
  | "ditch-company-share-certificate"
  | "assessment-history"
  | "survey"
  | "water-quality-analysis";

/** How the buyer would take title. Determines which restrictions bite. */
export type OwnershipStructure =
  | "personal-freehold"
  | "local-company"
  | "foreign-company"
  | "trust-or-fideicomiso"
  | "long-lease"
  | "joint-venture-with-national"
  | "undecided";

export interface ParcelInput {
  // Step 1 — location & size
  label: string;
  jurisdictionCode: string;
  county: string;
  apn?: string;
  acres: number;
  basinOrWatercourse?: string;

  // Step 1b — the buyer, for cross-border deals
  /** ISO-ish country code of the buyer's nationality/residence, or "US". */
  buyerCountry?: string;
  ownershipStructure?: OwnershipStructure;
  /** Whether the buyer already holds residency in the target country. */
  hasLocalResidency?: YesNoUnknown;

  // Step 2 — intent
  intent: WaterUseIntent;
  /** Acre-feet per year the buyer's intended use actually needs. */
  intendedAcreFeet?: number;
  irrigatedAcresPlanned?: number;

  // Step 3 — surface water
  surfaceRight: SurfaceRightKind;
  priorityDate?: string; // ISO date or year
  decreedAcreFeet?: number;
  adjudication: AdjudicationStatus;
  appurtenant: YesNoUnknown;
  /** Has any portion of the water been sold off or leased away historically? */
  previouslySevered: YesNoUnknown;

  // Step 4 — groundwater
  wellStatus: WellStatus;
  wellDepthFt?: number;
  wellYieldGpm?: number;
  aquiferTrend: TrendDirection;
  inManagedDistrict: YesNoUnknown;

  // Step 5 — evidence on hand
  documents: DocumentId[];
  /** Years of continuous documented beneficial use the seller can evidence. */
  documentedUseYears?: number;
  /** Longest documented gap in beneficial use, in years. */
  longestNonUseGapYears?: number;

  // Step 6 — land, title & access
  legalAccess: YesNoUnknown;
  mineralEstateSevered: YesNoUnknown;
  conservationEasement: YesNoUnknown;
  existingLiens: YesNoUnknown;
  tribalOrFederalClaimsInBasin: YesNoUnknown;

  // Step 7 — deal
  askingPrice?: number;
  closeTimelineDays?: number;
  financing?: "cash" | "seller-carry" | "bank" | "1031-exchange" | "undecided";
  notes?: string;
}

// ---------------------------------------------------------------------------
// What the engine produces
// ---------------------------------------------------------------------------

export type FindingSeverity = "critical" | "major" | "moderate" | "minor" | "positive";

export interface Finding {
  id: string;
  severity: FindingSeverity;
  title: string;
  /** Plain-language explanation of what this means for a buyer. */
  detail: string;
  /** Concrete next action that resolves or prices the issue. */
  remedy: string;
  /** Rough cost/effort to cure, when curable. */
  cureCost?: string;
  category: ScoreCategory;
}

export type ScoreCategory =
  | "water-security"
  | "title-transferability"
  | "foreign-ownership"
  | "physical-supply"
  | "land-access"
  | "economics";

export interface CategoryScore {
  category: ScoreCategory;
  label: string;
  /** 0-100 within the category. */
  score: number;
  /** Contribution weight toward the composite. */
  weight: number;
  /** Why it landed where it did. */
  drivers: string[];
}

export type Verdict = "pursue" | "investigate" | "caution" | "walk";

export interface ChecklistItem {
  id: string;
  phase: "pre-offer" | "diligence" | "escrow" | "closing" | "post-close";
  task: string;
  /** Who or which office you contact. */
  owner: string;
  /** Why this matters — tied back to a finding where applicable. */
  rationale: string;
  blocking: boolean;
}

export interface SellerQuestion {
  id: string;
  question: string;
  /** What a good answer looks like, and what a bad one tells you. */
  reading: string;
  documentRequested?: string;
}

export interface Assessment {
  composite: number;
  verdict: Verdict;
  categories: CategoryScore[];
  findings: Finding[];
  checklist: ChecklistItem[];
  sellerQuestions: SellerQuestion[];
  /** Acre-feet the engine believes is actually reliable, vs. what's claimed. */
  waterBalance: {
    claimedAcreFeet: number | null;
    requiredAcreFeet: number | null;
    reliableAcreFeet: number | null;
    /** Multiplier applied to claimed volume to reflect legal/physical risk. */
    reliabilityFactor: number;
    shortfall: number | null;
  };
  jurisdiction: JurisdictionProfile;
  /**
   * Set when something makes the deal impossible rather than merely bad —
   * chiefly an outright bar on foreign ownership with no lawful structure.
   * Forces a walk verdict irrespective of the composite.
   */
  dealBreaker: string | null;
  /** True when the buyer is acquiring outside their home country. */
  crossBorder: boolean;
  generatedAt: string;
}

/** The AI-authored layer that sits on top of `Assessment`. */
export interface AcquisitionPlan {
  thesis: string;
  sequencing: PlanStep[];
  negotiationStrategy: string;
  walkAwayTriggers: string[];
  budgetNotes: string;
  portfolioFit: string;
  /** True when this was templated rather than model-authored. */
  templated: boolean;
}

export interface PlanStep {
  order: number;
  window: string;
  title: string;
  detail: string;
}

// ---------------------------------------------------------------------------
// Portfolio (private dashboard)
// ---------------------------------------------------------------------------

export type HoldingStage =
  | "prospect"
  | "diligence"
  | "loi"
  | "under-contract"
  | "closed"
  | "passed";

export interface Holding {
  id: string;
  label: string;
  jurisdictionCode: string;
  county: string;
  acres: number;
  stage: HoldingStage;
  /** Acre-feet per year the engine considers reliable. */
  reliableAcreFeet: number | null;
  irrigableAcres: number | null;
  price: number | null;
  composite: number | null;
  verdict: Verdict | null;
  createdAt: string;
  updatedAt: string;
  /** Snapshot of the inputs, so a holding can be re-scored later. */
  input?: ParcelInput;
}

export interface PortfolioGoal {
  targetAcres: number;
  closedAcres: number;
  committedAcres: number;
  pipelineAcres: number;
  waterSecuredAcres: number;
  totalReliableAcreFeet: number;
  capitalDeployed: number;
  capitalCommitted: number;
  /** Weighted-average composite across closed holdings. */
  averageComposite: number | null;
  remainingAcres: number;
  percentComplete: number;
}
