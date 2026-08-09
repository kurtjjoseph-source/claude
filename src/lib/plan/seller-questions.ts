import type { Assessment, ParcelInput, SellerQuestion } from "@/lib/types";

/**
 * Generates the questions to put to the seller or listing agent, each paired
 * with how to read the answer.
 *
 * The reading matters as much as the question. A seller who cannot answer
 * "what is the priority date" is telling you something specific: either the
 * right does not exist, or nobody has looked at it in a generation.
 */

export function buildSellerQuestions(input: ParcelInput, assessment: Assessment): SellerQuestion[] {
  const { stateProfile: sp } = assessment;
  const qs: SellerQuestion[] = [];
  const appropriative = sp.surfaceDoctrine === "prior-appropriation" || sp.surfaceDoctrine === "hybrid";

  qs.push({
    id: "q-identify",
    question:
      "Please identify every water right serving this property by its state permit, certificate or decree number, and provide a copy of each.",
    reading:
      "A prepared seller answers with numbers in a sentence. Vagueness — \"it has good water,\" \"the well has always been fine\" — means nobody has looked at the file, and you should assume the worst until the state's record says otherwise.",
    documentRequested: "Certified copies of all permits, certificates and decrees",
  });

  if (appropriative) {
    qs.push({
      id: "q-priority",
      question: "What is the priority date of each right, and in how many of the last twenty years was it curtailed or placed under regulation?",
      reading:
        "The date sets seniority; the curtailment history tells you what the date is worth in practice. A seller who has farmed the ground knows the call years without checking. If they do not know, the water commissioner does.",
    });

    qs.push({
      id: "q-quantity",
      question:
        "What are the decreed flow rate and annual volume, the acres the right is decreed to serve, and the legally described place of use?",
      reading:
        "Compare the decreed place of use against the parcel you are buying. Rights are commonly decreed to acreage that is only partly inside the boundaries being sold, and the seller may not realize it.",
    });
  }

  qs.push({
    id: "q-severance",
    question:
      "Has any portion of the water been sold, leased, reserved, dedicated to a subdivision, or otherwise separated from this land at any time?",
    reading:
      "Ask it as a compound question and watch which clause they answer. Sellers who have leased water to a municipality or dedicated it to a development often do not think of that as a sale. Verify against the title chain regardless of the answer.",
    documentRequested: "Copies of any lease, dedication, reservation or change application affecting the water",
  });

  if (sp.forfeitureYears !== null) {
    qs.push({
      id: "q-nonuse",
      question: `In which of the last ${sp.forfeitureYears + 3} years was the full quantity actually diverted and put to beneficial use, and what evidence exists for each year?`,
      reading: `${sp.name} allows forfeiture after ${sp.forfeitureYears} years of non-use. A gap the seller mentions casually is a gap that could void the right. Documented years are the only years that count — accept power bills, state use reports, FSA filings and dated imagery, not recollection.`,
      documentRequested: "Annual use reports, irrigation power bills, FSA/crop insurance filings, dated aerial imagery",
    });
  }

  if (input.wellStatus !== "none") {
    qs.push({
      id: "q-well",
      question:
        "For each well: what is the permit number, total depth, current static water level, and the sustained yield measured over a full day of pumping — and when was that last measured?",
      reading:
        "\"It makes 900 gallons a minute\" is usually a short-duration figure from the day it was drilled, sometimes decades ago. Ask when it was measured. If the answer is the drilling date, treat current capacity as unknown.",
      documentRequested: "Well logs, completion reports, any pump test results, recent static water level readings",
    });

    qs.push({
      id: "q-well-history",
      question: "Has any well on the property been deepened, re-drilled, re-cased or lowered its pump setting in the last twenty years, and why?",
      reading:
        "Deepening is the tell for aquifer decline. A seller who has lowered the pump twice has already answered the question about the water table, whatever the marketing says.",
    });
  }

  if (input.inManagedDistrict === "yes" || sp.groundwaterRegime === "district-managed" || sp.groundwaterRegime === "rule-of-capture") {
    qs.push({
      id: "q-district",
      question:
        "Which groundwater district or management area governs this parcel, what is the current annual allocation in acre-feet, and has the allocation been reduced in the last ten years?",
      reading:
        "The allocation, not the well's capacity, is your ceiling. A history of reductions is a forecast of further reductions — districts do not usually reverse course.",
      documentRequested: "District allocation statement and assessment history",
    });
  }

  if (sp.groundwaterRegime === "rule-of-capture") {
    qs.push({
      id: "q-gw-estate",
      question: "Does the conveyance include one hundred percent of the groundwater estate, and has any part of it ever been reserved or conveyed separately?",
      reading: `In ${sp.name} groundwater is severable real property like minerals. Sellers frequently do not know their own reservation history. The title search answers this, not the seller — but their answer tells you how carefully they have looked.`,
    });
  }

  if (input.surfaceRight === "ditch-company-shares") {
    qs.push({
      id: "q-shares",
      question:
        "How many shares are held, in whose name is the certificate, are all assessments current, and what has the company actually delivered per share in each of the last five years?",
      reading:
        "Paper shares and delivered acre-feet are different numbers, and in a short year the difference is the whole story. Confirm every element with the company directly — the seller's certificate may be pledged, cancelled for assessments, or already assigned.",
      documentRequested: "Share certificate, company estoppel letter, five years of delivery records",
    });
  }

  qs.push({
    id: "q-disputes",
    question:
      "Are there any pending or threatened disputes over this water — calls, objections, adjudication filings, enforcement actions, or disagreements with neighbors, the ditch company or the district?",
    reading:
      "Ask about neighbors explicitly. Informal disputes never appear in a record search but they predict formal ones, and the seller's willingness to discuss them is itself informative.",
  });

  qs.push({
    id: "q-infrastructure",
    question:
      "What is the condition and age of the diversion structure, headgate, measuring device, pump, motor and distribution system, and what has been replaced in the last ten years?",
    reading:
      "Deferred irrigation infrastructure is a six-figure liability on a working farm. Ask for the replacement history rather than the condition — history is verifiable and opinion is not.",
    documentRequested: "Maintenance and replacement records, equipment invoices",
  });

  qs.push({
    id: "q-access",
    question: "Is legal access to the property by recorded easement or public road frontage, and does the same hold for access to the point of diversion and any ditch you must maintain?",
    reading:
      "Buyers check access to the house and forget access to the headgate. A right you cannot physically reach and maintain is not usable, and ditch easements are frequently unrecorded.",
    documentRequested: "Recorded easements for both parcel access and ditch/diversion access",
  });

  qs.push({
    id: "q-why-selling",
    question: "Why are you selling, and how long has the property been on the market?",
    reading:
      "In water-scarce regions a long marketing period on good ground usually means the water story does not survive diligence. Buyers before you may have already found what you are looking for.",
  });

  if (assessment.findings.some((f) => f.severity === "critical")) {
    qs.push({
      id: "q-critical",
      question:
        "Would you accept an escrow holdback on the water portion of the price, released when the state confirms in writing that the right is valid and recorded in my name?",
      reading:
        "This is the single most informative question you can ask when critical issues are open. A seller confident in their water agrees readily. A refusal, or a demand for a premium in exchange, is a substantive answer about the water.",
    });
  }

  return qs;
}
