import type { StateWaterProfile, SpecialRegime } from "@/lib/types";

/**
 * Per-state water law registry.
 *
 * Depth is deliberately uneven, and that is the honest shape of the problem:
 * in prior-appropriation and hybrid states the water right is a separate,
 * severable, datable, forfeitable property interest and most of a land deal's
 * risk lives there. In riparian states the right largely runs with the land and
 * the buyer's exposure collapses to withdrawal permitting and wetlands. The
 * western entries are therefore modeled in detail; the eastern entries carry
 * the correct regime, the correct agency, and the traps that actually apply.
 *
 * This is a diligence-routing aid. It is not legal advice, and statutory
 * periods change — the checklist always routes the buyer to the agency of
 * record to confirm.
 */

// ---------------------------------------------------------------------------
// Shared special regimes
// ---------------------------------------------------------------------------

const COLORADO_RIVER_COMPACT: SpecialRegime = {
  name: "Law of the River / Colorado River Compact",
  effect:
    "Basin-wide shortage tiers can curtail deliveries regardless of your state-law priority. Junior Colorado River water is the first to be cut and has been cut.",
  appliesTo: "Colorado River mainstem and tributary supplies",
  severity: "high",
};

const ESA_OVERLAY: SpecialRegime = {
  name: "Endangered Species Act consultation",
  effect:
    "Listed species in the reach can impose bypass flows or pumping restrictions that override a valid state right.",
  appliesTo: "Reaches with listed aquatic or riparian species",
  severity: "moderate",
};

const WINTERS_RESERVED: SpecialRegime = {
  name: "Federal & tribal reserved rights (Winters doctrine)",
  effect:
    "Reserved rights carry priority dates as of reservation establishment — typically senior to nearly everything — and are often unquantified. Quantification can retroactively subordinate your right.",
  appliesTo: "Basins with tribal reservations or federal withdrawals",
  severity: "high",
};

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

type Overrides = Partial<StateWaterProfile>;

/** Eastern common-law riparian state with a modern withdrawal permit overlay. */
function riparian(
  code: string,
  name: string,
  agencyName: string,
  agencyShort: string,
  url: string,
  overrides: Overrides = {},
): StateWaterProfile {
  return {
    code,
    name,
    surfaceDoctrine: "regulated-riparian",
    groundwaterRegime: "reasonable-use",
    agency: {
      name: agencyName,
      short: agencyShort,
      role: "Issues and tracks water withdrawal permits or registrations; holds the record of any existing withdrawal authorization on the parcel.",
      url,
    },
    adjudicationForum: "State courts of general jurisdiction (rights are not systematically adjudicated)",
    forfeitureYears: null,
    permitRequiredForNewWells: false,
    exemptWellNote:
      "Domestic and small agricultural wells are generally exempt from withdrawal permitting; local health department well construction permits still apply.",
    transferability: "appurtenant-transfers-with-land",
    specialRegimes: [],
    keyStatutes: [],
    closedBasinRisk: "low",
    cautions: [
      "Riparian status depends on the parcel physically abutting the watercourse and on the tract never having been severed from the riparian frontage — check the chain of title for a split that stranded the back acreage.",
      "A large irrigation withdrawal usually needs a state permit even though the underlying right is riparian; permit capacity, not the common-law right, is the real constraint.",
      "Wetlands and Clean Water Act §404 jurisdiction are the dominant land-use risk in the East, not allocation.",
    ],
    notes:
      "Water rights run with riparian land and are not separately conveyed, so purchase risk concentrates in withdrawal permitting, wetlands and drainage rather than in seniority.",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------

export const STATE_PROFILES: Record<string, StateWaterProfile> = {
  // =========================================================================
  // Pure prior appropriation — the West
  // =========================================================================

  CO: {
    code: "CO",
    name: "Colorado",
    surfaceDoctrine: "prior-appropriation",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Colorado Division of Water Resources (Office of the State Engineer)",
      short: "DWR",
      role: "Administers decrees in priority, permits wells, and maintains the tabulation and decennial abandonment list. Your first call is the Division Engineer for the parcel's division.",
      url: "https://dwr.colorado.gov",
    },
    adjudicationForum: "Colorado Water Courts — seven divisions, one per major river basin",
    forfeitureYears: 10,
    permitRequiredForNewWells: true,
    exemptWellNote:
      "Exempt household-use-only and domestic wells are strictly limited — typically 15 gpm, and irrigation limited to one acre of home lawn and garden. An exempt well cannot legally irrigate a farm.",
    transferability: "severable-with-approval",
    specialRegimes: [
      {
        name: "Augmentation plan requirement",
        effect:
          "Any well pumping tributary groundwater must be covered by a court-approved augmentation plan that replaces depletions to the stream, or it gets shut off. Buying land with an unaugmented well is buying a well you cannot legally run.",
        appliesTo: "Tributary groundwater statewide, acutely in the South Platte and Arkansas basins",
        severity: "severe",
      },
      {
        name: "Tributary vs. non-tributary classification",
        effect:
          "Non-tributary Denver Basin groundwater is allocated by overlying acreage and is a fundamentally different (and non-renewable) asset than a decreed surface right.",
        appliesTo: "Denver Basin aquifers along the Front Range",
        severity: "moderate",
      },
      COLORADO_RIVER_COMPACT,
      WINTERS_RESERVED,
    ],
    keyStatutes: ["C.R.S. § 37-92 (Water Right Determination and Administration Act)", "C.R.S. § 37-90 (Groundwater Management Act)"],
    closedBasinRisk: "high",
    cautions: [
      "Colorado has no state permit for surface water — the right is a court decree. If the seller offers a 'permit number' for a ditch right, something is wrong.",
      "Ditch company shares are personal property conveyed by stock certificate, not by the deed. A deed conveying 'all water rights' does not move the shares; you need an assigned and re-issued certificate.",
      "Historical consumptive use, not the decreed paper amount, is what survives a change of use. Expect the usable volume to shrink materially on transfer.",
      "Check the decennial abandonment list for the division — appearance on it starts a clock the buyer inherits.",
    ],
    notes:
      "The most procedurally demanding water state in the country. Water court is slow and expensive, and augmentation obligations are the single most common way buyers discover their new well is worthless.",
  },

  NM: {
    code: "NM",
    name: "New Mexico",
    surfaceDoctrine: "prior-appropriation",
    groundwaterRegime: "appropriation",
    agency: {
      name: "New Mexico Office of the State Engineer",
      short: "OSE",
      role: "Permits all appropriations and transfers, maintains WATERS database of rights, and administers priority. Every change of ownership requires a filing.",
      url: "https://www.ose.nm.gov",
    },
    adjudicationForum: "State and federal district courts — long-running stream system adjudications",
    forfeitureYears: 4,
    permitRequiredForNewWells: true,
    exemptWellNote:
      "Domestic wells under § 72-12-1.1 are permitted almost as of right but capped (typically 3 acre-feet/year) and cannot support commercial irrigation.",
    transferability: "severable-with-approval",
    specialRegimes: [
      {
        name: "Incomplete stream adjudications",
        effect:
          "Major systems have been in adjudication for decades. Until a subfile order issues, the quantity and priority you are buying is a claim, not a determination.",
        appliesTo: "Lower Rio Grande, Aamodt (Pojoaque), San Juan and others",
        severity: "high",
      },
      {
        name: "Rio Grande Compact & Texas v. New Mexico",
        effect:
          "Compact delivery obligations constrain in-state use below Elephant Butte and drove active water resource management rules.",
        appliesTo: "Rio Grande basin",
        severity: "high",
      },
      WINTERS_RESERVED,
    ],
    keyStatutes: ["NMSA § 72-5 (surface water)", "NMSA § 72-12 (underground water)", "NMSA § 72-5-28 (forfeiture)"],
    closedBasinRisk: "severe",
    cautions: [
      "Nearly every declared underground water basin is closed to new appropriation. New supply comes only from buying and transferring an existing right.",
      "Forfeiture runs four years from the end of beneficial use, and the State Engineer must give notice and a one-year cure — but a right idle for a decade is a target.",
      "Pueblo and tribal reserved claims are senior to essentially all state-law rights in several basins and remain unquantified.",
    ],
    notes:
      "Supply is fully allocated. Treat New Mexico acquisitions as buying an existing right and moving it, never as developing new water.",
  },

  AZ: {
    code: "AZ",
    name: "Arizona",
    surfaceDoctrine: "prior-appropriation",
    groundwaterRegime: "district-managed",
    agency: {
      name: "Arizona Department of Water Resources",
      short: "ADWR",
      role: "Administers surface water appropriations, AMA groundwater rights, well registration, and the Assured Water Supply program.",
      url: "https://www.azwater.gov",
    },
    adjudicationForum: "Gila River and Little Colorado River general stream adjudications (Maricopa County Superior Court)",
    forfeitureYears: 5,
    permitRequiredForNewWells: true,
    exemptWellNote:
      "Exempt wells pump under 35 gpm for domestic and stock use. Outside AMAs they are the main tool available, and they are increasingly contested.",
    transferability: "severable-with-approval",
    specialRegimes: [
      {
        name: "Active Management Areas (AMAs)",
        effect:
          "Inside an AMA, groundwater pumping requires a grandfathered right or a withdrawal permit, and new subdivisions must demonstrate a 100-year Assured Water Supply. Land without an assured supply designation cannot be developed.",
        appliesTo: "Phoenix, Pinal, Tucson, Prescott, Santa Cruz, Douglas, Willcox AMAs",
        severity: "severe",
      },
      {
        name: "Irrigation Non-Expansion Areas (INAs)",
        effect: "Irrigation is frozen to acreage historically irrigated. You cannot bring new ground into production.",
        appliesTo: "Joseph City, Douglas, Harquahala INAs",
        severity: "high",
      },
      {
        name: "Unregulated rural basins",
        effect:
          "Outside AMAs and INAs groundwater is essentially unmanaged, which cuts both ways: you can pump, and so can the neighbor who drills deeper.",
        appliesTo: "Most rural Arizona",
        severity: "high",
      },
      COLORADO_RIVER_COMPACT,
      WINTERS_RESERVED,
    ],
    keyStatutes: ["A.R.S. Title 45 (Waters)", "Groundwater Management Act of 1980"],
    closedBasinRisk: "severe",
    cautions: [
      "The first question on any Arizona parcel is whether it sits inside an AMA, an INA, or neither — the three regimes are barely the same body of law.",
      "The Gila River adjudication has run since 1974 and remains unresolved; surface claims in that system are not final.",
      "Rural land marketed as having 'unlimited water' is usually unregulated-basin land where the aquifer is dropping and there is no legal protection against a larger neighbor.",
    ],
    notes:
      "Arizona rewards buyers who verify regulatory geography before anything else. Assured Water Supply status is the difference between developable and not.",
  },

  NV: {
    code: "NV",
    name: "Nevada",
    surfaceDoctrine: "prior-appropriation",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Nevada Division of Water Resources (State Engineer)",
      short: "NDWR",
      role: "Permits and certificates all rights, maintains the hydrographic basin abstracts, and orders curtailment in over-appropriated basins.",
      url: "https://water.nv.gov",
    },
    adjudicationForum: "State Engineer adjudications confirmed by district court",
    forfeitureYears: 5,
    permitRequiredForNewWells: true,
    exemptWellNote: "Domestic wells under 2 acre-feet/year are exempt from permitting but are junior in effect and have been curtailed.",
    transferability: "severable-with-approval",
    specialRegimes: [
      {
        name: "Over-appropriated basins & Critical Management Areas",
        effect:
          "Many basins have paper rights far exceeding perennial yield. Designation as a CMA can force a groundwater management plan that cuts junior pumping.",
        appliesTo: "Diamond Valley and numerous Great Basin hydrographic areas",
        severity: "severe",
      },
      COLORADO_RIVER_COMPACT,
      WINTERS_RESERVED,
    ],
    keyStatutes: ["NRS Chapter 533 (surface water)", "NRS Chapter 534 (underground water)"],
    closedBasinRisk: "severe",
    cautions: [
      "Pull the State Engineer's basin abstract before offering. Committed duty versus perennial yield tells you immediately whether the basin is oversubscribed.",
      "Nevada actively cancels and forfeits rights for non-use, and the record is public — check the right's status, not just its existence.",
    ],
    notes:
      "The driest state, and the paper record often exceeds the wet water. Basin-level arithmetic matters more than the individual right.",
  },

  UT: {
    code: "UT",
    name: "Utah",
    surfaceDoctrine: "prior-appropriation",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Utah Division of Water Rights",
      short: "DWRi",
      role: "Permits appropriations and changes, maintains the water rights database, and requires a Report of Water Right Conveyance on transfer.",
      url: "https://waterrights.utah.gov",
    },
    adjudicationForum: "District court general adjudications administered through the State Engineer",
    forfeitureYears: 7,
    permitRequiredForNewWells: true,
    exemptWellNote: "No broad domestic well exemption — most wells require a right. This surprises out-of-state buyers.",
    transferability: "severable-with-approval",
    specialRegimes: [
      {
        name: "Great Salt Lake and Colorado River obligations",
        effect: "Declining lake levels and compact exposure are driving new restrictions on depletion and change applications.",
        appliesTo: "Great Salt Lake tributaries; Upper Colorado basin",
        severity: "high",
      },
      WINTERS_RESERVED,
    ],
    keyStatutes: ["Utah Code § 73-1", "Utah Code § 73-3", "Utah Code § 73-1-4 (forfeiture)"],
    closedBasinRisk: "high",
    cautions: [
      "Utah requires a Report of Water Right Conveyance filed by a qualified professional when a right changes hands. Skipping it leaves the state record showing the seller as owner.",
      "Most of the state is closed to new appropriation; shares in a mutual irrigation company are the common vehicle and transfer by certificate, not deed.",
    ],
    notes:
      "Administratively clean records by western standards, but the conveyance reporting requirement and the near-universal use of company shares trip up buyers.",
  },

  WY: {
    code: "WY",
    name: "Wyoming",
    surfaceDoctrine: "prior-appropriation",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Wyoming State Engineer's Office and Board of Control",
      short: "SEO",
      role: "SEO permits; the Board of Control adjudicates rights to certificate and rules on abandonment and change petitions.",
      url: "https://seo.wyo.gov",
    },
    adjudicationForum: "Board of Control (administrative adjudication to certificate of appropriation)",
    forfeitureYears: 5,
    permitRequiredForNewWells: true,
    exemptWellNote: "Stock and domestic wells are permitted but small-volume; permits are readily granted outside control areas.",
    transferability: "limited",
    specialRegimes: [
      {
        name: "Attachment to the land",
        effect:
          "Wyoming rights are strongly appurtenant. Moving water off the described acreage requires a petition and is disfavored, which protects buyers of irrigated ground but limits speculation.",
        appliesTo: "Statewide",
        severity: "moderate",
      },
      WINTERS_RESERVED,
    ],
    keyStatutes: ["Wyo. Stat. § 41-3-101 et seq.", "Wyo. Stat. § 41-3-401 (abandonment)"],
    closedBasinRisk: "moderate",
    cautions: [
      "Abandonment requires a contested proceeding brought by a senior appropriator who stands to benefit — idle rights are less fragile here than in Nevada or New Mexico, but not safe.",
      "Confirm the right is adjudicated to certificate rather than sitting as an unproven permit; unproven permits carry proof-of-appropriation deadlines the buyer inherits.",
    ],
    notes:
      "Buyer-friendly relative to its neighbors because rights stay with the land, and the Board of Control record is unusually clear about status.",
  },

  MT: {
    code: "MT",
    name: "Montana",
    surfaceDoctrine: "prior-appropriation",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Montana Department of Natural Resources and Conservation",
      short: "DNRC",
      role: "Permits new appropriations and changes; maintains the water right query system used for every diligence pull.",
      url: "https://dnrc.mt.gov/Water-Resources",
    },
    adjudicationForum: "Montana Water Court (statewide adjudication of pre-1973 claims)",
    forfeitureYears: 10,
    permitRequiredForNewWells: true,
    exemptWellNote:
      "Exempt wells up to 35 gpm and 10 acre-feet/year, but the 'combined appropriation' rule blocks stacking exempt wells to serve a subdivision.",
    transferability: "severable-with-approval",
    specialRegimes: [
      {
        name: "Closed basins",
        effect: "Legislatively and administratively closed basins bar most new surface appropriations outright.",
        appliesTo: "Upper Missouri, Bitterroot, Teton, Jefferson and others",
        severity: "high",
      },
      {
        name: "Pre-1973 claims still in adjudication",
        effect:
          "Historic claims carry temporary preliminary decree status. Objections can still reduce the flow rate, volume or acreage you thought you bought.",
        appliesTo: "Statewide",
        severity: "high",
      },
      WINTERS_RESERVED,
    ],
    keyStatutes: ["Mont. Code Ann. Title 85, Ch. 2", "MCA § 85-2-404 (abandonment)"],
    closedBasinRisk: "high",
    cautions: [
      "Read the decree status on the abstract. 'Claim' is not 'decree,' and a temporary preliminary decree can still move against you.",
      "The combined appropriation rule is the standard failure mode for buyers planning to split a ranch into parcels served by exempt wells.",
    ],
    notes:
      "The statewide adjudication is the defining feature. Verify where the parcel's claims sit in the decree process before pricing the water.",
  },

  ID: {
    code: "ID",
    name: "Idaho",
    surfaceDoctrine: "prior-appropriation",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Idaho Department of Water Resources",
      short: "IDWR",
      role: "Permits, licenses and administers rights; runs conjunctive administration and approves mitigation plans on the Eastern Snake Plain.",
      url: "https://idwr.idaho.gov",
    },
    adjudicationForum: "Snake River Basin Adjudication (complete) and Coeur d'Alene–Spokane River Basin Adjudication (ongoing)",
    forfeitureYears: 5,
    permitRequiredForNewWells: true,
    exemptWellNote: "Domestic wells up to 13,000 gallons/day are exempt, which covers a home and small stock but not irrigation.",
    transferability: "severable-with-approval",
    specialRegimes: [
      {
        name: "Eastern Snake Plain Aquifer conjunctive administration",
        effect:
          "Junior groundwater pumpers face curtailment orders on delivery calls from senior surface users unless they participate in an approved mitigation or settlement plan. Ongoing mitigation cost transfers to the buyer.",
        appliesTo: "ESPA — Idaho Falls to Twin Falls",
        severity: "severe",
      },
      WINTERS_RESERVED,
    ],
    keyStatutes: ["Idaho Code Title 42", "Idaho Code § 42-222 (forfeiture)"],
    closedBasinRisk: "high",
    cautions: [
      "The SRBA gave Idaho unusually reliable decreed records — use them, and match the decree number on the abstract to the deed.",
      "On the ESPA, ask specifically which mitigation plan or ground water district the parcel belongs to and what the assessment has run per acre. That is a recurring liability, not a one-time cost.",
    ],
    notes:
      "Best-documented rights in the West thanks to the SRBA, paired with the most active curtailment regime. Both facts matter to a buyer.",
  },

  AK: {
    code: "AK",
    name: "Alaska",
    surfaceDoctrine: "prior-appropriation",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Alaska Department of Natural Resources, Division of Mining, Land and Water",
      short: "DNR",
      role: "Issues water rights certificates and temporary water use authorizations.",
      url: "https://dnr.alaska.gov/mlw/water",
    },
    adjudicationForum: "DNR administrative adjudication",
    forfeitureYears: 5,
    permitRequiredForNewWells: true,
    exemptWellNote: "Small domestic uses under 500 gallons/day per household do not require a right.",
    transferability: "appurtenant-transfers-with-land",
    specialRegimes: [WINTERS_RESERVED],
    keyStatutes: ["AS 46.15 (Water Use Act)"],
    closedBasinRisk: "low",
    cautions: [
      "Water is abundant but access, seasonality and permitting for any diversion structure dominate feasibility.",
      "Confirm whether the parcel's water use was ever certificated — many long-standing uses in Alaska were never filed.",
    ],
    notes: "Appropriation doctrine on paper, but scarcity is rarely the binding constraint. Access and infrastructure are.",
  },

  // =========================================================================
  // Hybrid / dual systems
  // =========================================================================

  CA: {
    code: "CA",
    name: "California",
    surfaceDoctrine: "hybrid",
    groundwaterRegime: "correlative",
    agency: {
      name: "State Water Resources Control Board, Division of Water Rights",
      short: "SWRCB",
      role: "Permits and licenses post-1914 appropriative rights, receives statements of diversion for riparian and pre-1914 claims, and issues curtailment orders in dry years.",
      url: "https://www.waterboards.ca.gov/waterrights",
    },
    adjudicationForum: "Superior Court basin adjudications and SWRCB statutory adjudications",
    forfeitureYears: 5,
    permitRequiredForNewWells: false,
    exemptWellNote:
      "Well construction is permitted at the county level. The binding constraint is the local Groundwater Sustainability Agency allocation, not a state well permit.",
    transferability: "severable-with-approval",
    specialRegimes: [
      {
        name: "Sustainable Groundwater Management Act (SGMA)",
        effect:
          "Groundwater Sustainability Agencies in critically overdrafted basins are imposing pumping allocations, metering and fees, with allocations often well below historical use. This is the dominant valuation variable for California ag land.",
        appliesTo: "All medium- and high-priority basins; acute in the San Joaquin Valley",
        severity: "severe",
      },
      {
        name: "Pre-1914 and riparian claims",
        effect:
          "These are the most valuable rights in the state and require no permit — but they are also the least documented, and the Board has asserted authority to curtail them.",
        appliesTo: "Statewide",
        severity: "moderate",
      },
      {
        name: "Adjudicated basins",
        effect: "In an adjudicated basin your pumping is a court-decreed quantity administered by a watermaster. There is no upside beyond the decree.",
        appliesTo: "Much of Southern California, Mojave, Santa Maria",
        severity: "moderate",
      },
      COLORADO_RIVER_COMPACT,
      ESA_OVERLAY,
    ],
    keyStatutes: ["Cal. Water Code § 1200 et seq.", "Cal. Water Code § 10720 et seq. (SGMA)"],
    closedBasinRisk: "severe",
    cautions: [
      "Ask for the parcel's GSA allocation in acre-feet per acre, in writing, and the fee schedule. An orchard with a half-acre-foot allocation is a stranded asset.",
      "A pre-1914 claim is only worth what the diversion records prove. Demand the Statements of Diversion and Use filed with the Board.",
      "Land in a critically overdrafted basin may be subject to mandatory fallowing programs; confirm whether the seller has enrolled acreage.",
    ],
    notes:
      "The most complex water state in the country: four overlapping surface regimes plus a groundwater transition that is actively repricing farmland. SGMA allocation is the first question, not the last.",
  },

  TX: {
    code: "TX",
    name: "Texas",
    surfaceDoctrine: "hybrid",
    groundwaterRegime: "rule-of-capture",
    agency: {
      name: "Texas Commission on Environmental Quality (surface water) and the local Groundwater Conservation District",
      short: "TCEQ / GCD",
      role: "TCEQ holds all surface water permits and certificates of adjudication; the GCD — not the state — regulates well spacing and production for groundwater.",
      url: "https://www.tceq.texas.gov/permitting/water_rights",
    },
    adjudicationForum: "Completed surface water adjudication (Water Rights Adjudication Act); groundwater is not adjudicated",
    forfeitureYears: 10,
    permitRequiredForNewWells: false,
    exemptWellNote:
      "Wells incapable of producing more than 25,000 gallons/day for domestic or livestock use are exempt from GCD permitting almost everywhere.",
    transferability: "severable-freely",
    specialRegimes: [
      {
        name: "Rule of capture (absolute ownership)",
        effect:
          "Groundwater belongs to the overlying landowner as real property and can be pumped without liability for draining a neighbor, subject only to GCD rules. It is also severable and separately conveyable — which is exactly how buyers get surprised.",
        appliesTo: "Statewide",
        severity: "high",
      },
      {
        name: "Groundwater Conservation Districts",
        effect:
          "Roughly a hundred districts set spacing, production limits and export fees, and they differ from one another substantially. There are also areas with no district and no rules at all.",
        appliesTo: "Most but not all of the state",
        severity: "high",
      },
      {
        name: "Edwards Aquifer Authority",
        effect: "Pumping is capped and requires an EAA permit measured in acre-feet — a genuine property right, and expensive.",
        appliesTo: "Edwards Aquifer region around San Antonio",
        severity: "severe",
      },
      {
        name: "Severed groundwater estate",
        effect:
          "Texas treats groundwater like minerals: a prior owner may have reserved or sold it. A warranty deed for the surface can convey land whose water belongs to someone else.",
        appliesTo: "Statewide",
        severity: "severe",
      },
    ],
    keyStatutes: ["Tex. Water Code Ch. 11 (surface)", "Tex. Water Code Ch. 36 (GCDs)", "Edwards Aquifer Authority Act"],
    closedBasinRisk: "moderate",
    cautions: [
      "Run the groundwater estate through the title search the same way you would run minerals. A reservation in a 1960s deed is binding and common.",
      "Identify the GCD by name and pull its rules. 'Texas has rule of capture' tells you almost nothing about what you may actually pump.",
      "Surface water in Texas is state-owned; a riverfront parcel confers no automatic right to divert. You need a TCEQ permit or certificate of adjudication.",
    ],
    notes:
      "The most transactable water in the country because groundwater is private property — and the most dangerous for the same reason, since it can be severed away before you ever see the parcel.",
  },

  OR: {
    code: "OR",
    name: "Oregon",
    surfaceDoctrine: "hybrid",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Oregon Water Resources Department",
      short: "OWRD",
      role: "Permits, certificates and transfers all rights; maintains the Water Rights Information System used for diligence.",
      url: "https://www.oregon.gov/owrd",
    },
    adjudicationForum: "OWRD administrative adjudication confirmed by circuit court (Klamath Basin most notably)",
    forfeitureYears: 5,
    permitRequiredForNewWells: true,
    exemptWellNote:
      "Exempt uses include stock water, up to 15,000 gallons/day domestic, and up to a half acre of lawn or noncommercial garden irrigation.",
    transferability: "severable-with-approval",
    specialRegimes: [
      {
        name: "Klamath Basin adjudication and calls",
        effect: "Determined claims and active calls have shut off junior irrigation entirely in dry years.",
        appliesTo: "Klamath Basin",
        severity: "severe",
      },
      {
        name: "Groundwater Restricted and Critical Groundwater Areas",
        effect: "New appropriation is barred and existing use may be cut back where the aquifer is declining.",
        appliesTo: "Umatilla, Harney, Mosier and other designated areas",
        severity: "high",
      },
      WINTERS_RESERVED,
    ],
    keyStatutes: ["ORS Chapter 537", "ORS 540.610 (forfeiture)"],
    closedBasinRisk: "high",
    cautions: [
      "Oregon enforces five-year forfeiture and publishes cancellation proceedings. Ask for evidence of use in each of the last five irrigation seasons.",
      "A certificate is the goal; a permit with an unmet proof deadline is an obligation.",
    ],
    notes:
      "Clean records, real enforcement, and several basins where the water has already been curtailed. Basin identity drives everything.",
  },

  WA: {
    code: "WA",
    name: "Washington",
    surfaceDoctrine: "hybrid",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Washington State Department of Ecology",
      short: "Ecology",
      role: "Issues permits and certificates, administers relinquishment, and sets instream flow rules by WRIA.",
      url: "https://ecology.wa.gov/water-shorelines/water-supply/water-rights",
    },
    adjudicationForum: "Superior court general adjudications (Yakima; Nooksack initiated 2024)",
    forfeitureYears: 5,
    permitRequiredForNewWells: true,
    exemptWellNote:
      "Permit-exempt wells allow up to 5,000 gallons/day plus a half acre of irrigation, but the Streamflow Restoration Act now caps and conditions new domestic connections in many basins.",
    transferability: "severable-with-approval",
    specialRegimes: [
      {
        name: "Instream flow rules and closed streams",
        effect:
          "Adopted minimum instream flows are themselves water rights with priority dates. Junior rights are interruptible and streams may be closed to new appropriation year-round.",
        appliesTo: "Most WRIAs",
        severity: "high",
      },
      {
        name: "Streamflow Restoration Act (ESSB 6091) limits",
        effect:
          "In affected basins a new permit-exempt domestic well is limited (commonly 950 gallons/day annual average) and carries a mitigation fee. This directly limits how finely a large tract can be split.",
        appliesTo: "Basins with adopted instream flow rules",
        severity: "high",
      },
      WINTERS_RESERVED,
      ESA_OVERLAY,
    ],
    keyStatutes: ["RCW 90.03 (surface)", "RCW 90.44 (groundwater)", "RCW 90.14.160 (relinquishment)"],
    closedBasinRisk: "high",
    cautions: [
      "Relinquishment is automatic on five successive years of non-use unless a statutory exception applies — sufficient-cause exceptions are narrow and must be documented.",
      "Ecology's records include many claims filed in the 1970s water rights claims registry that were never examined. A claim is not a right.",
    ],
    notes:
      "Instream flows plus relinquishment make Washington one of the easier states in which to buy a right that quietly no longer exists.",
  },

  KS: {
    code: "KS",
    name: "Kansas",
    surfaceDoctrine: "hybrid",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Kansas Department of Agriculture, Division of Water Resources",
      short: "DWR",
      role: "Permits and administers all appropriations; requires annual water use reports that are the best evidence of actual use.",
      url: "https://agriculture.ks.gov/divisions-programs/dwr",
    },
    adjudicationForum: "Administrative determination by the Chief Engineer",
    forfeitureYears: 5,
    permitRequiredForNewWells: true,
    exemptWellNote: "Domestic use up to roughly 2 acre-feet/year is exempt from permitting.",
    transferability: "severable-with-approval",
    specialRegimes: [
      {
        name: "Groundwater Management Districts and LEMAs",
        effect:
          "Local Enhanced Management Areas impose enforceable pumping reductions — commonly 20% or more — on every right in the area. The allocation, not the paper right, is what you can pump.",
        appliesTo: "GMD 1-5, especially the Ogallala in western Kansas",
        severity: "severe",
      },
      {
        name: "Ogallala Aquifer depletion",
        effect: "Saturated thickness is declining and in places is projected to fall below irrigation viability within decades.",
        appliesTo: "Western Kansas High Plains",
        severity: "severe",
      },
    ],
    keyStatutes: ["K.S.A. 82a-701 et seq. (Water Appropriation Act)", "K.S.A. 82a-718 (abandonment)"],
    closedBasinRisk: "high",
    cautions: [
      "Kansas abolished riparian rights in 1945; only vested rights predating the Act survive. Streamfront acreage confers nothing on its own.",
      "Pull the annual water use reports for the last ten years. They are the cleanest use record in the country and they will show you whether the right is real.",
      "Ask for saturated thickness and the well's decline trend, not just its current yield.",
    ],
    notes:
      "Excellent public use data makes Kansas unusually verifiable — and the data usually shows aquifer decline. Buy on saturated thickness, not on paper acre-feet.",
  },

  NE: {
    code: "NE",
    name: "Nebraska",
    surfaceDoctrine: "hybrid",
    groundwaterRegime: "correlative",
    agency: {
      name: "Nebraska Department of Natural Resources and the local Natural Resources District",
      short: "DNR / NRD",
      role: "DNR administers surface appropriations; the 23 NRDs regulate groundwater, certify irrigated acres and set allocations.",
      url: "https://dnr.nebraska.gov",
    },
    adjudicationForum: "DNR administrative process; district court review",
    forfeitureYears: 5,
    permitRequiredForNewWells: true,
    exemptWellNote: "Domestic wells are exempt from NRD permitting but must be registered with DNR.",
    transferability: "limited",
    specialRegimes: [
      {
        name: "Certified irrigated acres",
        effect:
          "In fully appropriated basins the NRD certifies which specific acres may be irrigated. Uncertified ground cannot be brought into production, and certification is the asset that carries value.",
        appliesTo: "Republican, Platte and other fully/over-appropriated basins",
        severity: "severe",
      },
      {
        name: "Republican River Compact",
        effect: "Compact compliance has forced pumping shutdowns and acre retirement in dry years.",
        appliesTo: "Republican River basin",
        severity: "high",
      },
    ],
    keyStatutes: ["Neb. Rev. Stat. § 46-201 et seq.", "Neb. Rev. Stat. § 46-701 et seq. (Ground Water Management and Protection Act)"],
    closedBasinRisk: "high",
    cautions: [
      "The number that matters is certified irrigated acres from the NRD, in writing, tied to the legal description — not the seller's account of what they have farmed.",
      "Nebraska groundwater is not an appropriative right with a priority date; it is a correlative, NRD-allocated privilege. Do not price it like a Colorado decree.",
    ],
    notes:
      "The split between DNR surface administration and NRD groundwater control is the defining structural feature. Two agencies, two records, two sets of questions.",
  },

  OK: {
    code: "OK",
    name: "Oklahoma",
    surfaceDoctrine: "hybrid",
    groundwaterRegime: "correlative",
    agency: {
      name: "Oklahoma Water Resources Board",
      short: "OWRB",
      role: "Permits stream water appropriations and groundwater allocations based on overlying acreage.",
      url: "https://oklahoma.gov/owrb.html",
    },
    adjudicationForum: "District court stream adjudications; OWRB maximum annual yield determinations for groundwater basins",
    forfeitureYears: 7,
    permitRequiredForNewWells: true,
    exemptWellNote: "Domestic use — including irrigating up to three acres of garden and household lawn — is exempt from permitting.",
    transferability: "severable-with-approval",
    specialRegimes: [
      {
        name: "Groundwater allocation by overlying acreage",
        effect:
          "Groundwater is allocated as an annual quantity per acre owned, set by the basin's maximum annual yield. More acres literally means more water, which makes acreage assembly the water strategy.",
        appliesTo: "Statewide, per designated basin",
        severity: "moderate",
      },
      {
        name: "Tribal water settlements",
        effect: "The Chickasaw and Choctaw settlement and related agreements condition permitting in the southeast.",
        appliesTo: "Southeastern Oklahoma",
        severity: "moderate",
      },
    ],
    keyStatutes: ["82 O.S. § 105.1 et seq. (stream water)", "82 O.S. § 1020.1 et seq. (groundwater)"],
    closedBasinRisk: "moderate",
    cautions: [
      "Because groundwater tracks overlying acreage, contiguous assembly compounds: each added acre adds allocation. Model this explicitly when sequencing purchases.",
      "Confirm the basin has an approved maximum annual yield; where it does not, a temporary permit at 2 acre-feet per acre is the default and can be revised downward.",
    ],
    notes:
      "The most acreage-responsive groundwater regime in the country. For a buyer accumulating land, Oklahoma's allocation math rewards contiguity more directly than anywhere else.",
  },

  ND: {
    code: "ND",
    name: "North Dakota",
    surfaceDoctrine: "hybrid",
    groundwaterRegime: "appropriation",
    agency: {
      name: "North Dakota Department of Water Resources (State Engineer)",
      short: "DWR",
      role: "Permits all appropriations above domestic and stock use and maintains the water permit record.",
      url: "https://www.swc.nd.gov",
    },
    adjudicationForum: "State Engineer administrative determination",
    forfeitureYears: 3,
    permitRequiredForNewWells: true,
    exemptWellNote: "Domestic and livestock uses under 12.5 acre-feet/year are exempt from permitting.",
    transferability: "severable-with-approval",
    specialRegimes: [WINTERS_RESERVED],
    keyStatutes: ["N.D.C.C. Ch. 61-04", "N.D.C.C. § 61-04-23 (forfeiture)"],
    closedBasinRisk: "low",
    cautions: [
      "The three-year forfeiture period is among the shortest in the country — an idle irrigation permit is genuinely at risk.",
      "Conditional permits carry construction and beneficial-use deadlines that pass to the buyer.",
    ],
    notes: "Water is comparatively available; the risk is administrative lapse rather than scarcity.",
  },

  SD: {
    code: "SD",
    name: "South Dakota",
    surfaceDoctrine: "hybrid",
    groundwaterRegime: "appropriation",
    agency: {
      name: "South Dakota Department of Agriculture and Natural Resources, Water Rights Program",
      short: "DANR",
      role: "Permits appropriations and licenses completed works; the Water Management Board hears contested matters.",
      url: "https://danr.sd.gov/Environment/WaterRights",
    },
    adjudicationForum: "Water Management Board; circuit court review",
    forfeitureYears: 3,
    permitRequiredForNewWells: true,
    exemptWellNote: "Domestic use up to 25,920 gallons/day, including irrigating up to one acre, is exempt.",
    transferability: "severable-with-approval",
    specialRegimes: [WINTERS_RESERVED],
    keyStatutes: ["S.D.C.L. Ch. 46-5", "S.D.C.L. § 46-5-37 (forfeiture)"],
    closedBasinRisk: "low",
    cautions: [
      "Three-year forfeiture applies. Confirm licensed status rather than permit status.",
      "Several aquifers are fully appropriated despite the state's overall availability.",
    ],
    notes: "Straightforward administration and generally available supply outside a handful of fully appropriated aquifers.",
  },

  // =========================================================================
  // Riparian and regulated riparian
  // =========================================================================

  FL: riparian("FL", "Florida", "Florida Department of Environmental Protection and the five Water Management Districts", "FDEP / WMD", "https://floridadep.gov/water-policy", {
    groundwaterRegime: "reasonable-use",
    permitRequiredForNewWells: true,
    exemptWellNote: "Consumptive Use Permits are required for most non-domestic withdrawals; districts set thresholds.",
    closedBasinRisk: "high",
    specialRegimes: [
      {
        name: "Consumptive Use Permits and Water Use Caution Areas",
        effect:
          "Districts cap withdrawals and may deny new permits outright in caution areas. A CUP is transferable with the land but must be modified for a change of use.",
        appliesTo: "SWFWMD, SJRWMD and other district caution areas",
        severity: "high",
      },
      {
        name: "Wetlands and Everglades restoration constraints",
        effect: "Extensive jurisdictional wetlands limit the developable and irrigable share of a tract.",
        appliesTo: "Statewide, acutely in South Florida",
        severity: "high",
      },
    ],
    cautions: [
      "Ask for the existing Consumptive Use Permit number, its allocated quantity, its expiration date, and whether the district has flagged the parcel in a Water Use Caution Area.",
      "A CUP is the asset in Florida. Land without one, in a caution area, may never get one.",
      "Delineate wetlands before pricing acreage — net usable acres can be a fraction of deeded acres.",
    ],
    notes:
      "Florida is regulated-riparian in form but operates like a permit-allocation state in practice. The Consumptive Use Permit is the water right that matters.",
  }),

  GA: riparian("GA", "Georgia", "Georgia Environmental Protection Division", "EPD", "https://epd.georgia.gov/watershed-protection-branch", {
    closedBasinRisk: "moderate",
    permitRequiredForNewWells: true,
    specialRegimes: [
      {
        name: "Agricultural withdrawal permit moratoria",
        effect: "The Flint River basin has been subject to permit suspensions; new agricultural withdrawal permits are not guaranteed.",
        appliesTo: "Lower Flint and Chattahoochee basins",
        severity: "high",
      },
      {
        name: "Tri-state water litigation legacy",
        effect: "Interstate allocation disputes with Alabama and Florida continue to shape permitting posture.",
        appliesTo: "ACF and ACT basins",
        severity: "moderate",
      },
    ],
    cautions: [
      "Agricultural withdrawal permits are the binding constraint and are not always available for new acreage. Confirm the parcel holds one and that it is metered and in good standing.",
      "Permits attach to the withdrawal point and the acreage served; verify the permit covers the tract you are buying.",
    ],
  }),

  NC: riparian("NC", "North Carolina", "North Carolina Department of Environmental Quality, Division of Water Resources", "DEQ DWR", "https://www.deq.nc.gov/about/divisions/water-resources", {
    specialRegimes: [
      {
        name: "Capacity Use Areas",
        effect: "Withdrawals above threshold require permits and reductions have been mandated in the Central Coastal Plain.",
        appliesTo: "Central Coastal Plain Capacity Use Area",
        severity: "moderate",
      },
    ],
    cautions: [
      "Registration is required above 100,000 gallons/day; permits are required inside Capacity Use Areas.",
      "Riparian frontage must be verified against the survey — braided and shifting channels create disputes.",
    ],
  }),

  SC: riparian("SC", "South Carolina", "South Carolina Department of Environmental Services", "SCDES", "https://des.sc.gov", {
    specialRegimes: [
      {
        name: "Capacity Use Areas and surface water registration",
        effect: "Agricultural surface withdrawals register rather than compete, which favors early registrants in a shortage.",
        appliesTo: "Designated capacity use areas",
        severity: "moderate",
      },
    ],
    cautions: ["Agricultural surface withdrawal registration is comparatively permissive — confirm the registration exists and its quantity."],
  }),

  VA: riparian("VA", "Virginia", "Virginia Department of Environmental Quality", "DEQ", "https://www.deq.virginia.gov/water", {
    specialRegimes: [
      {
        name: "Groundwater Management Areas",
        effect: "Withdrawal permits in the Eastern Shore and Eastern Virginia GWMAs have been cut to address aquifer decline.",
        appliesTo: "Eastern Virginia and Eastern Shore GWMAs",
        severity: "high",
      },
    ],
    cautions: ["Inside a Groundwater Management Area, a withdrawal permit is required and renewals have come back reduced."],
  }),

  MD: riparian("MD", "Maryland", "Maryland Department of the Environment", "MDE", "https://mde.maryland.gov/programs/water", {
    cautions: ["Water Appropriation and Use Permits are required above modest thresholds and are tied to the specific use and acreage."],
  }),
  DE: riparian("DE", "Delaware", "Delaware Department of Natural Resources and Environmental Control", "DNREC", "https://dnrec.delaware.gov"),
  NJ: riparian("NJ", "New Jersey", "New Jersey Department of Environmental Protection", "NJDEP", "https://dep.nj.gov/watersupply", {
    cautions: ["Water allocation permits and Highlands/Pinelands overlays sharply limit new withdrawals and land use."],
  }),
  NY: riparian("NY", "New York", "New York State Department of Environmental Conservation", "DEC", "https://dec.ny.gov/environmental-protection/water", {
    cautions: ["Water withdrawal permits are required at 100,000 gallons/day; Great Lakes Compact rules apply in the western basins."],
  }),
  PA: riparian("PA", "Pennsylvania", "Pennsylvania Department of Environmental Protection (with SRBC and DRBC)", "DEP", "https://www.dep.pa.gov", {
    specialRegimes: [
      {
        name: "Susquehanna and Delaware River Basin Commissions",
        effect: "Interstate compact commissions independently approve withdrawals and consumptive use, on top of state law.",
        appliesTo: "Susquehanna and Delaware basins",
        severity: "moderate",
      },
    ],
    cautions: ["Pennsylvania has no general state withdrawal permit, but the basin commissions do — and they are the real regulator for most of the state."],
  }),
  OH: riparian("OH", "Ohio", "Ohio Department of Natural Resources, Division of Water Resources", "ODNR", "https://ohiodnr.gov/discover-and-learn/safety-conservation/about-ODNR/water-resources"),
  IN: riparian("IN", "Indiana", "Indiana Department of Natural Resources, Division of Water", "IDNR", "https://www.in.gov/dnr/water"),
  IL: riparian("IL", "Illinois", "Illinois Department of Natural Resources, Office of Water Resources", "IDNR OWR", "https://dnr.illinois.gov/waterresources.html"),
  MI: riparian("MI", "Michigan", "Michigan Department of Environment, Great Lakes, and Energy", "EGLE", "https://www.michigan.gov/egle", {
    groundwaterRegime: "restatement",
    specialRegimes: [
      {
        name: "Water Withdrawal Assessment Tool and Great Lakes Compact",
        effect: "Large withdrawals must clear an online assessment for adverse resource impact before proceeding.",
        appliesTo: "Statewide",
        severity: "moderate",
      },
    ],
  }),
  WI: riparian("WI", "Wisconsin", "Wisconsin Department of Natural Resources", "WDNR", "https://dnr.wisconsin.gov", {
    groundwaterRegime: "restatement",
    cautions: ["High-capacity well approvals are required above 100,000 gallons/day and are contested in groundwater protection areas."],
  }),
  MN: riparian("MN", "Minnesota", "Minnesota Department of Natural Resources", "MnDNR", "https://www.dnr.state.mn.us/waters", {
    cautions: [
      "Minnesota runs a genuine water appropriation permit system despite riparian roots; irrigation requires a DNR permit tied to acreage.",
      "Permits in groundwater management areas carry conservation conditions and can be reduced.",
    ],
  }),
  IA: riparian("IA", "Iowa", "Iowa Department of Natural Resources", "Iowa DNR", "https://www.iowadnr.gov", {
    cautions: ["Water use permits are required above 25,000 gallons/day; allocation is by regulated riparian permit, renewable on ten-year terms."],
  }),
  MO: riparian("MO", "Missouri", "Missouri Department of Natural Resources", "MoDNR", "https://dnr.mo.gov/water"),
  AR: riparian("AR", "Arkansas", "Arkansas Department of Agriculture, Natural Resources Division", "ANRD", "https://www.agriculture.arkansas.gov/natural-resources", {
    specialRegimes: [
      {
        name: "Critical Groundwater Areas",
        effect: "Alluvial aquifer decline in the Delta has produced critical designations and conversion incentives to surface water.",
        appliesTo: "Mississippi River alluvial aquifer, eastern Arkansas",
        severity: "high",
      },
    ],
    cautions: ["In the Delta, aquifer decline — not law — is the binding constraint. Ask for static water level history on every well."],
  }),
  LA: riparian("LA", "Louisiana", "Louisiana Department of Energy and Natural Resources", "LDENR", "https://www.dnr.louisiana.gov", {
    cautions: ["Saltwater intrusion in coastal aquifers is the dominant groundwater risk; test water quality, not just quantity."],
  }),
  MS: riparian("MS", "Mississippi", "Mississippi Department of Environmental Quality", "MDEQ", "https://www.mdeq.ms.gov", {
    cautions: ["Mississippi requires a water use permit for most non-domestic withdrawals; Delta alluvial aquifer decline is significant."],
  }),
  AL: riparian("AL", "Alabama", "Alabama Office of Water Resources (ADECA)", "OWR", "https://adeca.alabama.gov/water-resources", {
    cautions: ["Alabama issues Certificates of Use rather than permits; the certificate documents priority in a shortage."],
  }),
  TN: riparian("TN", "Tennessee", "Tennessee Department of Environment and Conservation", "TDEC", "https://www.tn.gov/environment"),
  KY: riparian("KY", "Kentucky", "Kentucky Division of Water", "KDOW", "https://eec.ky.gov/environmental-protection/water", {
    cautions: ["Withdrawal permits are required above 10,000 gallons/day — a low threshold that catches modest irrigation."],
  }),
  WV: riparian("WV", "West Virginia", "West Virginia Department of Environmental Protection", "WVDEP", "https://dep.wv.gov"),
  CT: riparian("CT", "Connecticut", "Connecticut Department of Energy and Environmental Protection", "CT DEEP", "https://portal.ct.gov/deep"),
  RI: riparian("RI", "Rhode Island", "Rhode Island Department of Environmental Management", "RIDEM", "https://dem.ri.gov"),
  MA: riparian("MA", "Massachusetts", "Massachusetts Department of Environmental Protection", "MassDEP", "https://www.mass.gov/orgs/massachusetts-department-of-environmental-protection", {
    cautions: ["The Water Management Act requires registration or a permit above 100,000 gallons/day, with streamflow criteria attached."],
  }),
  NH: riparian("NH", "New Hampshire", "New Hampshire Department of Environmental Services", "NHDES", "https://www.des.nh.gov"),
  VT: riparian("VT", "Vermont", "Vermont Department of Environmental Conservation", "VTDEC", "https://dec.vermont.gov/water"),
  ME: riparian("ME", "Maine", "Maine Department of Environmental Protection", "MEDEP", "https://www.maine.gov/dep"),
  HI: {
    code: "HI",
    name: "Hawaii",
    surfaceDoctrine: "riparian",
    groundwaterRegime: "correlative",
    agency: {
      name: "Hawaii Commission on Water Resource Management",
      short: "CWRM",
      role: "Administers the State Water Code, designates water management areas and issues use permits.",
      url: "https://dlnr.hawaii.gov/cwrm",
    },
    adjudicationForum: "CWRM and the Hawaii Supreme Court public trust jurisprudence",
    forfeitureYears: null,
    permitRequiredForNewWells: true,
    exemptWellNote: "Well construction permits are required statewide; use permits are required inside designated water management areas.",
    transferability: "limited",
    specialRegimes: [
      {
        name: "Public trust doctrine and appurtenant kuleana rights",
        effect:
          "Water is held in public trust with constitutional protection for traditional and customary Native Hawaiian rights and appurtenant kuleana taro rights, which are senior and can defeat a private use.",
        appliesTo: "Statewide",
        severity: "severe",
      },
      {
        name: "Instream Flow Standards",
        effect: "Restoration of stream flows has reallocated water away from former plantation ditch systems.",
        appliesTo: "East Maui, Windward Oahu and others",
        severity: "high",
      },
    ],
    keyStatutes: ["HRS Chapter 174C (State Water Code)", "Haw. Const. art. XI"],
    closedBasinRisk: "high",
    cautions: [
      "Hawaii is not a mainland analogue. Public trust and appurtenant rights are constitutional and take precedence over private commercial use.",
      "Former plantation ditch water is heavily contested; do not assume historical delivery continues.",
    ],
    notes:
      "A public-trust jurisdiction where the state's obligation to protect traditional rights and instream flows outranks the buyer's intended use.",
  },
};

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export const STATE_LIST = Object.values(STATE_PROFILES).sort((a, b) => a.name.localeCompare(b.name));

export function getStateProfile(code: string): StateWaterProfile | null {
  return STATE_PROFILES[code.toUpperCase()] ?? null;
}

export const DOCTRINE_LABELS: Record<string, string> = {
  "prior-appropriation": "Prior appropriation",
  hybrid: "Hybrid (appropriative + riparian)",
  riparian: "Riparian",
  "regulated-riparian": "Regulated riparian",
};

export const GROUNDWATER_LABELS: Record<string, string> = {
  appropriation: "Appropriative (priority-dated)",
  "rule-of-capture": "Rule of capture (absolute ownership)",
  correlative: "Correlative / shared basin yield",
  "reasonable-use": "Reasonable use (American rule)",
  restatement: "Restatement § 858 reasonable use",
  "district-managed": "District-managed",
};
