import Anthropic from "@anthropic-ai/sdk";
import type { AcquisitionPlan, Assessment, ParcelInput, PortfolioGoal } from "@/lib/types";
import { VERDICT_COPY } from "@/lib/water/engine";
import { PLAN_TOOL, SYSTEM_PROMPT, buildUserPrompt } from "@/lib/ai/prompts";

const DEFAULT_MODEL = "claude-opus-5";

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Authors the acquisition plan.
 *
 * Falls back to a deterministic template when no API key is configured or the
 * call fails. The fallback is genuinely usable rather than an error state —
 * the engine has already done the analytical work, so the template only has to
 * arrange it.
 */
export async function generatePlan(
  input: ParcelInput,
  assessment: Assessment,
  goal: PortfolioGoal | null,
): Promise<AcquisitionPlan> {
  if (!aiConfigured()) {
    return templatePlan(input, assessment, goal);
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [PLAN_TOOL],
      tool_choice: { type: "tool", name: PLAN_TOOL.name },
      messages: [{ role: "user", content: buildUserPrompt(input, assessment, goal) }],
    });

    const block = response.content.find((c) => c.type === "tool_use");
    if (!block || block.type !== "tool_use") {
      return templatePlan(input, assessment, goal);
    }

    const parsed = block.input as Partial<AcquisitionPlan>;
    if (!parsed.thesis || !Array.isArray(parsed.sequencing)) {
      return templatePlan(input, assessment, goal);
    }

    return {
      thesis: parsed.thesis,
      sequencing: parsed.sequencing
        .map((s, i) => ({
          order: s.order ?? i + 1,
          window: s.window ?? "",
          title: s.title ?? "",
          detail: s.detail ?? "",
        }))
        .sort((a, b) => a.order - b.order),
      negotiationStrategy: parsed.negotiationStrategy ?? "",
      walkAwayTriggers: parsed.walkAwayTriggers ?? [],
      budgetNotes: parsed.budgetNotes ?? "",
      portfolioFit: parsed.portfolioFit ?? "",
      templated: false,
    };
  } catch (err) {
    console.error("[headgate] plan generation failed, using template:", err);
    return templatePlan(input, assessment, goal);
  }
}

// ---------------------------------------------------------------------------
// Deterministic fallback
// ---------------------------------------------------------------------------

/**
 * Lowercases only the leading character so a finding title can be dropped
 * mid-sentence. Flattening the whole string mangles the proper nouns these
 * titles are full of — "Colorado's 10-year forfeiture period" and so on.
 */
function inSentence(title: string): string {
  return title.charAt(0).toLowerCase() + title.slice(1);
}

function templatePlan(
  input: ParcelInput,
  assessment: Assessment,
  goal: PortfolioGoal | null,
): AcquisitionPlan {
  const sp = assessment.stateProfile;
  const wb = assessment.waterBalance;
  const criticals = assessment.findings.filter((f) => f.severity === "critical");
  const majors = assessment.findings.filter((f) => f.severity === "major");
  const verdict = VERDICT_COPY[assessment.verdict];

  const thesisParts: string[] = [
    `${input.label} is ${input.acres.toLocaleString()} acres in ${input.county} County, ${sp.name}, scored ${assessment.composite}/100 — ${verdict.label.toLowerCase()}.`,
  ];
  if (wb.reliableAcreFeet !== null && wb.requiredAcreFeet !== null) {
    thesisParts.push(
      wb.shortfall !== null && wb.shortfall > 0
        ? `The intended use needs about ${wb.requiredAcreFeet} acre-feet a year and the risk-adjusted supply is ${wb.reliableAcreFeet}, leaving a ${wb.shortfall} acre-foot gap.`
        : `Risk-adjusted supply of ${wb.reliableAcreFeet} acre-feet covers the ${wb.requiredAcreFeet} acre-feet the intended use requires.`,
    );
  }
  thesisParts.push(
    criticals.length > 0
      ? `${criticals.length} critical ${criticals.length === 1 ? "issue is" : "issues are"} open, starting with ${inSentence(criticals[0]!.title)}. That is the item that decides this deal.`
      : majors.length > 0
        ? `Nothing critical is open, but ${majors.length} major ${majors.length === 1 ? "item needs" : "items need"} resolution before money goes hard.`
        : "No critical or major issues were raised by the engine, which is uncommon and worth verifying rather than trusting.",
  );
  thesisParts.push(verdict.blurb);

  const blocking = assessment.checklist.filter((c) => c.blocking);
  const preOffer = assessment.checklist.filter((c) => c.phase === "pre-offer");
  const diligence = assessment.checklist.filter((c) => c.phase === "diligence");

  const sequencing = [
    {
      order: 1,
      window: "Days 1-3, before spending anything",
      title: `Pull the ${sp.agency.short} record yourself`,
      detail: `${preOffer[0]?.task ?? `Search ${sp.agency.short} for every right of record touching the parcel.`} This costs nothing but time and it disqualifies a meaningful share of listings outright. Treat the state's record, not the listing, as the fact.`,
    },
    {
      order: 2,
      window: "Days 1-5",
      title: "Fix the regulatory geography",
      detail: `Determine exactly which basin, district and management area the parcel falls in. In ${sp.name} this changes the analysis more than any other single fact${sp.specialRegimes.length > 0 ? `, particularly ${sp.specialRegimes[0]!.name}` : ""}. Get the answer in writing from the agency.`,
    },
    {
      order: 3,
      window: "Before making an offer",
      title: "Put the seller questions in writing",
      detail: `Send the ${assessment.sellerQuestions.length} questions this plan generated as a written list and ask for a written reply. Written answers create a record you can rely on later, and the questions a seller declines to answer tell you where to look.`,
    },
    {
      order: 4,
      window: "LOI stage",
      title: "Structure the offer around the open findings",
      detail:
        criticals.length > 0
          ? `Price the ${criticals.length} critical ${criticals.length === 1 ? "finding" : "findings"} into the offer and make resolution a condition, not a hope. Include a water-specific contingency of 60 to 90 days and an escrow holdback on the water portion of the price.`
          : `Include a water-specific contingency of 60 to 90 days. Agency response times are outside your control and a short contingency turns diligence into a gamble.`,
    },
    {
      order: 5,
      window: "Diligence, weeks 1-4",
      title: "Run the blocking items first",
      detail: `${blocking.length} of the ${assessment.checklist.length} checklist items are blocking. Sequence them cheapest-first: records and title before engineering, engineering before the pump test${input.wellStatus === "none" ? "" : ", pump test before you commit to the crop plan"}. Every one of them can end the deal, so spend in the order that ends it soonest.`,
    },
    {
      order: 6,
      window: "Diligence, weeks 3-8",
      title: "Get independent professional opinions",
      detail: `Engage ${sp.name} water counsel and a water resources engineer. ${diligence.length > 0 ? "General real estate counsel is not sufficient here — water is a specialty bar." : ""} The engineer's dry-year analysis is the number to underwrite, not the decreed paper amount.`,
    },
    {
      order: 7,
      window: "Closing",
      title: "Confirm the water conveys by the correct instrument",
      detail: `${input.surfaceRight === "ditch-company-shares" ? "Shares transfer by endorsed certificate re-issued by the company, not by the deed." : "Confirm the deed conveys the right by permit, certificate or decree number rather than generic appurtenances language."} The most common total loss in this asset class is a buyer who got the land and not the water.`,
    },
    {
      order: 8,
      window: "First season after closing",
      title: "Record ownership and establish beneficial use",
      detail: `File the change of ownership with ${sp.agency.short} immediately so curtailment and forfeiture notices reach you.${sp.forfeitureYears !== null ? ` Put the full quantity to beneficial use in the first season and document it every year — ${sp.name} forfeits rights after ${sp.forfeitureYears} years of non-use.` : ""}`,
    },
  ];

  const walkAwayTriggers: string[] = [];
  for (const f of criticals.slice(0, 4)) {
    walkAwayTriggers.push(`${f.title} is confirmed and cannot be cured before closing.`);
  }
  if (sp.forfeitureYears !== null) {
    walkAwayTriggers.push(
      `The state confirms a non-use gap of ${sp.forfeitureYears} years or more with no statutory exception on record.`,
    );
  }
  walkAwayTriggers.push(
    `${sp.agency.short}'s record shows no right of record serving the parcel, or shows a quantity materially below what was marketed.`,
  );
  walkAwayTriggers.push("The title commitment excepts water rights and the title company will not remove the exception.");
  if (input.wellStatus !== "none") {
    walkAwayTriggers.push("A 24-hour constant-rate pump test shows sustained yield materially below the represented figure.");
  }

  const budgetNotes = [
    "Spend in order of what can kill the deal soonest per dollar.",
    `Free first: ${sp.agency.short} records, county assessor data, USGS water levels, and the seller's own documents.`,
    "Then the title commitment, which is cheap relative to what it reveals.",
    input.wellStatus !== "none"
      ? "Then the pump test — a few thousand dollars, and the single highest-value physical check available."
      : "Then the engineer's reliability opinion.",
    "Counsel and engineering are the largest line items and should follow, not precede, the free checks.",
    criticals.length > 0
      ? "With critical findings open, cap total diligence spend until the seller demonstrates the water is real — ideally by agreeing to a holdback."
      : "Budget the full diligence package; nothing here suggests holding back.",
  ].join(" ");

  const portfolioFit = goal
    ? [
        `This parcel would add ${input.acres.toLocaleString()} acres against a ${goal.targetAcres.toLocaleString()}-acre target, taking closed acreage from ${goal.closedAcres.toLocaleString()} to ${(goal.closedAcres + input.acres).toLocaleString()} if it closes — roughly ${Math.round(((goal.closedAcres + input.acres) / goal.targetAcres) * 100)}% of the goal.`,
        wb.reliableAcreFeet
          ? `It contributes about ${wb.reliableAcreFeet} acre-feet of risk-adjusted annual supply to a portfolio currently carrying ${goal.totalReliableAcreFeet.toLocaleString()}.`
          : "It contributes no verified water to the portfolio yet, which is the gap to close before it counts as a water-secured position.",
        goal.averageComposite !== null && assessment.composite < goal.averageComposite
          ? `At ${assessment.composite} it scores below your closed-portfolio average of ${goal.averageComposite}, so it should sit behind better pipeline deals unless the price reflects that.`
          : `At ${assessment.composite} it is at or above your portfolio average, which argues for prioritizing it.`,
        `${goal.remainingAcres.toLocaleString()} acres remain to target after this one.`,
      ].join(" ")
    : [
        `${input.acres.toLocaleString()} acres is a meaningful block toward a large accumulation target, and the water attributes matter more than the acreage count.`,
        "Acres without reliable, transferable water dilute a portfolio rather than build it — they carry tax and management cost while contributing nothing to productive capacity.",
        sp.groundwaterRegime === "correlative"
          ? "Note that in this state groundwater allocation tracks overlying acreage, so contiguous assembly compounds: each adjacent acre adds allocation as well as area."
          : "Prioritize contiguity where possible — shared infrastructure, one set of agency relationships, and one measurement regime scale far better than scattered parcels.",
        "Track this position in the portfolio dashboard so the acreage and water contributions roll up against the target.",
      ].join(" ");

  return {
    thesis: thesisParts.join(" "),
    sequencing,
    negotiationStrategy: buildNegotiation(input, assessment),
    walkAwayTriggers: walkAwayTriggers.slice(0, 6),
    budgetNotes,
    portfolioFit,
    templated: true,
  };
}

function buildNegotiation(input: ParcelInput, assessment: Assessment): string {
  const sp = assessment.stateProfile;
  const criticals = assessment.findings.filter((f) => f.severity === "critical");
  const majors = assessment.findings.filter((f) => f.severity === "major");
  const wb = assessment.waterBalance;

  const parts: string[] = [];

  parts.push(
    criticals.length > 0
      ? `Lead with the critical findings, framed as questions rather than accusations — a seller who has to answer "${inSentence(criticals[0]!.title)}" in writing either resolves it or reveals that they cannot.`
      : "There is no critical defect to lead with, so leverage comes from the volume of unresolved diligence rather than from any single flaw.",
  );

  if (wb.shortfall !== null && wb.shortfall > 0 && wb.requiredAcreFeet) {
    const pct = Math.round((wb.shortfall / wb.requiredAcreFeet) * 100);
    parts.push(
      `The risk-adjusted supply falls ${pct}% short of what the intended use requires. That gap is the number to negotiate against: the property is being priced as if the paper quantity were the real quantity.`,
    );
  }

  if (majors.length > 0) {
    parts.push(
      `Convert the ${majors.length} major ${majors.length === 1 ? "finding" : "findings"} into closing conditions rather than price reductions where you can — a condition costs the seller nothing if they were telling the truth, which makes it easy to accept and expensive to refuse.`,
    );
  }

  parts.push(
    `Ask for an escrow holdback on the water portion of the price, released when ${sp.agency.short} confirms in writing that the right is valid and recorded in your name. Willingness to accept it is the most informative signal you will get.`,
  );

  if (input.closeTimelineDays !== undefined && input.closeTimelineDays < 60) {
    parts.push(
      `The ${input.closeTimelineDays}-day timeline is the seller's leverage, not yours. Trade something for a longer water contingency; if they will not extend, that is information about what diligence would find.`,
    );
  }

  parts.push(
    "Expect the seller to argue that the water has always been there and never been questioned. That is a statement about the past under different conditions, not a warranty — ask for it in the contract instead, and see whether it survives their counsel's review.",
  );

  return parts.join(" ");
}
