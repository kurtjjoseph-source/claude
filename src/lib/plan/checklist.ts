import type { Assessment, ChecklistItem, ParcelInput } from "@/lib/types";

/**
 * Builds the parcel-specific diligence and closing checklist.
 *
 * Items are derived from three sources: the state's own procedural
 * requirements, the findings the engine raised, and the universal steps that
 * apply to any water-rights purchase. Items tied to a critical finding are
 * marked blocking — they gate the next money you spend.
 */

export function buildChecklist(input: ParcelInput, assessment: Assessment): ChecklistItem[] {
  const { stateProfile: sp } = assessment;
  const items: ChecklistItem[] = [];
  const has = (id: string) => assessment.findings.some((f) => f.id === id);
  const severityOf = (id: string) => assessment.findings.find((f) => f.id === id)?.severity;

  const push = (item: ChecklistItem) => items.push(item);

  // -------------------------------------------------------------------------
  // Pre-offer — cheap, fast, and disqualifying
  // -------------------------------------------------------------------------

  push({
    id: "pull-state-record",
    phase: "pre-offer",
    task: `Search ${sp.agency.short}'s records for every water right of record touching this parcel — by owner name, by legal description, and by section-township-range.`,
    owner: `${sp.agency.name} — ${sp.agency.url}`,
    rationale:
      "The state's record is the authoritative statement of what exists. Do this yourself before you rely on anything in the listing.",
    blocking: true,
  });

  push({
    id: "confirm-regime",
    phase: "pre-offer",
    task: `Confirm which regulatory areas the parcel sits in: ${sp.specialRegimes.length > 0 ? sp.specialRegimes.map((r) => r.name).join("; ") : "basin designation and any local district"}.`,
    owner: `${sp.agency.short} and the county assessor`,
    rationale:
      "Regulatory geography changes the analysis more than any other single fact. Two parcels a mile apart can be under different rules.",
    blocking: true,
  });

  if (sp.closedBasinRisk === "severe" || sp.closedBasinRisk === "high") {
    push({
      id: "basin-status",
      phase: "pre-offer",
      task: "Ask the agency in writing whether the basin is open to new appropriation, and obtain the basin's committed-versus-available summary.",
      owner: sp.agency.short,
      rationale: `${sp.name} has ${sp.closedBasinRisk} basin-closure risk. If the basin is closed, no amount of money buys new water here — only transfers.`,
      blocking: true,
    });
  }

  if (has("landlocked")) {
    push({
      id: "resolve-access",
      phase: "pre-offer",
      task: "Establish whether a recorded, insurable access easement exists. If it does not, negotiate one before spending anything further.",
      owner: "Title company and neighboring landowners",
      rationale: "Access is binary. Without it the parcel has no use regardless of the water.",
      blocking: true,
    });
  }

  if (has("previously-severed") || has("severance-unknown")) {
    push({
      id: "trace-severance",
      phase: "pre-offer",
      task: "Trace the chain of title and the state's change-application file to reconcile how much water still attaches to this land.",
      owner: "Title company and water counsel",
      rationale: "Water sold off in a prior transaction is invisible on the ground and permanently gone.",
      blocking: true,
    });
  }

  if (sp.groundwaterRegime === "rule-of-capture") {
    push({
      id: "groundwater-estate-search",
      phase: "pre-offer",
      task: "Instruct the title company in writing to search and insure the groundwater estate separately from the surface estate.",
      owner: "Title company",
      rationale: `In ${sp.name} groundwater is severable real property. A prior owner may hold it, and a standard policy may not cover the gap.`,
      blocking: true,
    });
  }

  // -------------------------------------------------------------------------
  // Diligence — the substantive work
  // -------------------------------------------------------------------------

  push({
    id: "obtain-decree",
    phase: "diligence",
    task: `Obtain certified copies of the decree, certificate or permit from ${sp.adjudicationForum.includes("Court") ? sp.adjudicationForum : sp.agency.short}, showing priority date, flow rate, annual volume, point of diversion, place and type of use.`,
    owner: sp.agency.short,
    rationale:
      "These six attributes define the asset. Any one of them being different from what you assumed changes the deal.",
    blocking: true,
  });

  push({
    id: "use-evidence",
    phase: "diligence",
    task:
      sp.forfeitureYears !== null
        ? `Assemble evidence of continuous beneficial use for at least the last ${sp.forfeitureYears + 2} years: state use reports, pump power bills, FSA or crop insurance filings, and dated aerial imagery.`
        : "Assemble evidence of the existing withdrawal's history and permitted quantity.",
    owner: "Seller, plus independent verification",
    rationale:
      sp.forfeitureYears !== null
        ? `${sp.name} permits forfeiture after ${sp.forfeitureYears} years of non-use. Power bills and aerial imagery are harder to dispute than the seller's recollection.`
        : "Permit history establishes what quantity the agency will renew.",
    blocking: sp.forfeitureYears !== null,
  });

  push({
    id: "title-commitment-water",
    phase: "diligence",
    task: "Order a title commitment that expressly includes water rights, and read Schedule B exceptions line by line for water and mineral reservations.",
    owner: "Title company",
    rationale:
      "Standard commitments often except water rights entirely. An exception is the title company telling you they will not stand behind the most valuable part of the purchase.",
    blocking: true,
  });

  if (input.wellStatus !== "none") {
    push({
      id: "pump-test",
      phase: "diligence",
      task: "Commission a 24-hour constant-rate pump test with drawdown and recovery measurement on each production well.",
      owner: "Independent hydrogeologist or well contractor",
      rationale:
        "Sustained yield is the only yield that matters. Short-duration numbers routinely overstate capacity by multiples.",
      blocking: false,
    });

    push({
      id: "water-levels",
      phase: "diligence",
      task: "Pull twenty years of static water level measurements from the state and USGS for the well and nearby monitoring points; compute the annual decline rate.",
      owner: `${sp.agency.short} and USGS NWIS`,
      rationale:
        "The decline rate against remaining saturated thickness tells you the well's economic life. That number sets your hold period.",
      blocking: severityOf("aquifer-steeply-declining") === "critical",
    });

    push({
      id: "water-quality",
      phase: "diligence",
      task: "Test water quality for the intended use — at minimum total dissolved solids, sodium adsorption ratio, nitrate, and arsenic.",
      owner: "Certified laboratory",
      rationale:
        "Water that is legally and physically available can still be agronomically unusable. Salinity is the common surprise.",
      blocking: false,
    });
  }

  if (has("change-of-use-required")) {
    push({
      id: "hcu-analysis",
      phase: "diligence",
      task: "Commission a historical consumptive use analysis to establish the quantity that would survive a change application.",
      owner: "Water resources engineer",
      rationale:
        "A change is approved only up to historical consumptive use, which is typically far below the decreed diversion amount. This number, not the decree, is what you are buying.",
      blocking: true,
    });
  }

  if (input.surfaceRight === "ditch-company-shares") {
    push({
      id: "ditch-company",
      phase: "diligence",
      task: "Contact the ditch or irrigation company directly for: share certificate verification, assessment history and current standing, transfer requirements and fees, and the last five years of delivery records in acre-feet.",
      owner: "Mutual ditch / irrigation company secretary",
      rationale:
        "The company, not the seller and not the state, controls whether the shares transfer and what they actually deliver. Delivery records show the difference between paper shares and wet water.",
      blocking: true,
    });
  }

  if (input.inManagedDistrict === "yes" || sp.groundwaterRegime === "district-managed") {
    push({
      id: "district-rules",
      phase: "diligence",
      task: "Obtain the district's current rules, the parcel's allocation in acre-feet, ten years of assessment history, and any pending management plan amendments.",
      owner: "Local groundwater district",
      rationale:
        "District allocation is the operative limit on pumping and it can be reduced. Assessments are a recurring liability that transfers with the land.",
      blocking: true,
    });
  }

  if (has("reserved-rights")) {
    push({
      id: "reserved-rights-review",
      phase: "diligence",
      task: "Have water counsel assess the status of tribal and federal reserved claims in the basin and the proposed quantification relative to basin supply.",
      owner: "Water rights attorney",
      rationale:
        "Reserved rights are senior, do not require beneficial use, and are frequently unquantified. Their resolution reallocates water away from junior state-law holders.",
      blocking: false,
    });
  }

  push({
    id: "engineer-opinion",
    phase: "diligence",
    task: "Engage a water resources engineer for a written opinion on the reliability of supply for your intended use, including a dry-year analysis.",
    owner: "Water resources engineer",
    rationale:
      "An independent engineer models what the right actually delivers in the worst three years of the last thirty. That is the number to underwrite.",
    blocking: false,
  });

  push({
    id: "counsel-review",
    phase: "diligence",
    task: `Engage water counsel licensed in ${sp.name} to review the right, the chain of title and the purchase agreement's water provisions.`,
    owner: `${sp.name} water rights attorney`,
    rationale:
      "General real estate counsel is not sufficient. Water is a specialty bar and the cost of getting it wrong is the whole purchase.",
    blocking: true,
  });

  // -------------------------------------------------------------------------
  // Escrow — contract structure
  // -------------------------------------------------------------------------

  push({
    id: "water-representations",
    phase: "escrow",
    task: "Write specific water representations and warranties into the purchase agreement: quantity, priority date, permit or decree numbers, absence of prior severance, absence of forfeiture proceedings, and assessments current.",
    owner: "Buyer's counsel",
    rationale:
      "A general warranty deed does not warrant the water's quantity or standing. If the representation is not written, it does not exist.",
    blocking: true,
  });

  push({
    id: "water-contingency",
    phase: "escrow",
    task: `Include a water-specific contingency period long enough to complete state records review, the pump test and the engineer's opinion — realistically 60 to 90 days${input.closeTimelineDays !== undefined && input.closeTimelineDays < 60 ? `, against the ${input.closeTimelineDays} days currently contemplated` : ""}.`,
    owner: "Buyer's counsel",
    rationale:
      "Agency response times are outside your control. A short contingency converts diligence into a gamble.",
    blocking: has("timeline-too-short"),
  });

  if (assessment.findings.some((f) => f.severity === "critical")) {
    push({
      id: "holdback",
      phase: "escrow",
      task: "Negotiate an escrow holdback covering the water portion of the price, released only on written confirmation from the state that the right is valid, in good standing, and recorded in your name.",
      owner: "Escrow agent and buyer's counsel",
      rationale:
        "Critical findings are open on this deal. A holdback keeps the seller's incentive alive past closing, which is when problems surface.",
      blocking: true,
    });
  }

  // -------------------------------------------------------------------------
  // Closing
  // -------------------------------------------------------------------------

  push({
    id: "conveyance-instrument",
    phase: "closing",
    task:
      input.appurtenant === "no" || input.surfaceRight === "ditch-company-shares"
        ? "Confirm the water conveys by the correct separate instrument — an assignment of the right, or an endorsed and re-issued share certificate — not merely by the deed."
        : "Confirm the deed expressly conveys the water right by permit, certificate or decree number, rather than relying on generic appurtenances language.",
    owner: "Escrow agent and buyer's counsel",
    rationale:
      "The most common total loss in this asset class is a buyer who received the land and not the water because the wrong instrument was used.",
    blocking: true,
  });

  if (sp.code === "UT") {
    push({
      id: "utah-conveyance-report",
      phase: "closing",
      task: "File the Report of Water Right Conveyance with the Division of Water Rights, prepared by a qualified professional.",
      owner: "Utah Division of Water Rights",
      rationale:
        "Utah requires this filing for the state record to reflect you as owner. Without it the state still shows the seller.",
      blocking: true,
    });
  }

  // -------------------------------------------------------------------------
  // Post-close — protecting what you bought
  // -------------------------------------------------------------------------

  push({
    id: "record-ownership",
    phase: "post-close",
    task: `File the change of ownership with ${sp.agency.short} immediately, and confirm in writing that the state's record shows you as the owner of record.`,
    owner: sp.agency.short,
    rationale:
      "Notices of forfeiture, adjudication and curtailment go to the owner of record. If that is still the seller, you will not receive them.",
    blocking: true,
  });

  if (sp.forfeitureYears !== null) {
    push({
      id: "use-and-document",
      phase: "post-close",
      task: `Put the full quantity to beneficial use in the first season and keep contemporaneous records every year — measurements, power bills, imagery. Never allow a gap approaching ${sp.forfeitureYears} years.`,
      owner: "Owner",
      rationale: `${sp.name} forfeits rights after ${sp.forfeitureYears} years of non-use. Your own documentation is the defense, and it has to be built as you go.`,
      blocking: false,
    });
  }

  push({
    id: "measurement",
    phase: "post-close",
    task: "Install and maintain the measuring device the state requires, and report as required.",
    owner: "Owner",
    rationale:
      "Unmeasured diversion is the easiest enforcement target there is, and your own measurements are the record that proves beneficial use later.",
    blocking: false,
  });

  return items;
}
