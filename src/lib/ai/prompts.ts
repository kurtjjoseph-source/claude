import type { Assessment, ParcelInput, PortfolioGoal } from "@/lib/types";
import { humanIntent } from "@/lib/water/engine";
import { DOCTRINE_LABELS, GROUNDWATER_LABELS } from "@/lib/water/states";

/**
 * The model's job is narrow and stated plainly: sequence, strategize and
 * explain, using only the facts the engine computed. It is explicitly barred
 * from inventing legal conclusions, because those are exactly the outputs a
 * buyer would act on and exactly the place a language model is least reliable.
 */

export const SYSTEM_PROMPT = `You are the acquisition strategist inside Headgate, a diligence tool for buying land with water rights in the United States.

A deterministic rules engine has already analyzed the parcel. You are given its complete output: a composite score, category scores, findings ranked by severity, a risk-adjusted water balance, a diligence checklist, and the governing state's water law profile. Your job is to turn that into an acquisition plan a buyer can execute.

Hard constraints:
- Never state a legal rule, statutory period, priority-date consequence, agency requirement or dollar figure that is not present in the engine output you were given. If you need a fact you do not have, say what needs to be determined and who determines it.
- Never contradict the engine's verdict, scores or findings. You may explain them, weight them against each other, and sequence the response to them. You may not overturn them.
- Do not add disclaimers about being an AI. The application already carries a legal disclaimer.
- Write for a working buyer, not a lawyer. Short sentences. Concrete nouns. No filler like "it is important to note."
- Be direct about bad deals. If the engine says walk, the plan should say walk and explain what would have to change.

Tone: a seasoned land buyer briefing a colleague. Specific, unsentimental, useful. No hedging for its own sake, no enthusiasm the facts do not support.`;

export function buildUserPrompt(
  input: ParcelInput,
  assessment: Assessment,
  goal: PortfolioGoal | null,
): string {
  const sp = assessment.stateProfile;
  const wb = assessment.waterBalance;

  const lines: string[] = [];

  lines.push("## Parcel");
  lines.push(`- Label: ${input.label}`);
  lines.push(`- Location: ${input.county} County, ${sp.name} (${sp.code})`);
  lines.push(`- Size: ${input.acres.toLocaleString()} deeded acres`);
  if (input.basinOrWatercourse) lines.push(`- Basin / watercourse: ${input.basinOrWatercourse}`);
  lines.push(`- Intended use: ${humanIntent(input.intent)}`);
  if (input.irrigatedAcresPlanned) lines.push(`- Irrigated acres planned: ${input.irrigatedAcresPlanned}`);
  if (input.askingPrice) {
    lines.push(
      `- Asking price: $${input.askingPrice.toLocaleString()} ($${Math.round(input.askingPrice / input.acres).toLocaleString()}/acre)`,
    );
  }
  if (input.closeTimelineDays !== undefined) lines.push(`- Contemplated close: ${input.closeTimelineDays} days`);
  if (input.financing) lines.push(`- Financing: ${input.financing}`);
  if (input.notes) lines.push(`- Buyer notes: ${input.notes}`);

  lines.push("");
  lines.push(`## Governing law — ${sp.name}`);
  lines.push(`- Surface doctrine: ${DOCTRINE_LABELS[sp.surfaceDoctrine]}`);
  lines.push(`- Groundwater regime: ${GROUNDWATER_LABELS[sp.groundwaterRegime]}`);
  lines.push(`- Agency of record: ${sp.agency.name} (${sp.agency.short})`);
  lines.push(`- Adjudication forum: ${sp.adjudicationForum}`);
  lines.push(`- Forfeiture period: ${sp.forfeitureYears === null ? "none" : `${sp.forfeitureYears} years of non-use`}`);
  lines.push(`- Basin closure risk: ${sp.closedBasinRisk}`);
  lines.push(`- Transferability: ${sp.transferability.replace(/-/g, " ")}`);
  if (sp.specialRegimes.length > 0) {
    lines.push(`- Special regimes: ${sp.specialRegimes.map((r) => `${r.name} (${r.severity}) — ${r.effect}`).join(" | ")}`);
  }
  lines.push(`- State-specific cautions: ${sp.cautions.join(" | ")}`);

  lines.push("");
  lines.push("## Engine assessment");
  lines.push(`- Composite score: ${assessment.composite}/100`);
  lines.push(`- Verdict: ${assessment.verdict.toUpperCase()}`);
  for (const c of assessment.categories) {
    lines.push(`- ${c.label}: ${c.score}/100 (weight ${Math.round(c.weight * 100)}%) — ${c.drivers.join("; ") || "no adjustments"}`);
  }

  lines.push("");
  lines.push("## Risk-adjusted water balance");
  lines.push(`- Claimed: ${wb.claimedAcreFeet ?? "not stated"} acre-feet/year`);
  lines.push(`- Required for intended use: ${wb.requiredAcreFeet ?? "not computed"} acre-feet/year`);
  lines.push(`- Reliability factor applied: ${wb.reliabilityFactor}`);
  lines.push(`- Risk-adjusted reliable supply: ${wb.reliableAcreFeet ?? "not computable"} acre-feet/year`);
  lines.push(`- Shortfall: ${wb.shortfall === null ? "not computable" : `${wb.shortfall} acre-feet/year`}`);

  lines.push("");
  lines.push(`## Findings (${assessment.findings.length})`);
  for (const f of assessment.findings) {
    lines.push(`- [${f.severity.toUpperCase()}] ${f.title}: ${f.detail} REMEDY: ${f.remedy}${f.cureCost ? ` COST: ${f.cureCost}` : ""}`);
  }

  lines.push("");
  lines.push("## Diligence checklist already generated");
  for (const item of assessment.checklist) {
    lines.push(`- (${item.phase}${item.blocking ? ", blocking" : ""}) ${item.task} [${item.owner}]`);
  }

  if (goal) {
    lines.push("");
    lines.push("## Buyer's portfolio position");
    lines.push(`- Target: ${goal.targetAcres.toLocaleString()} acres`);
    lines.push(`- Closed: ${goal.closedAcres.toLocaleString()} acres (${goal.percentComplete}% of target)`);
    lines.push(`- Under contract / LOI: ${goal.committedAcres.toLocaleString()} acres`);
    lines.push(`- Pipeline: ${goal.pipelineAcres.toLocaleString()} acres`);
    lines.push(`- Water-secured acres held: ${goal.waterSecuredAcres.toLocaleString()}`);
    lines.push(`- Reliable supply across portfolio: ${goal.totalReliableAcreFeet.toLocaleString()} acre-feet/year`);
    lines.push(`- Capital deployed: $${goal.capitalDeployed.toLocaleString()}`);
    lines.push(`- Remaining to target: ${goal.remainingAcres.toLocaleString()} acres`);
    if (goal.averageComposite !== null) lines.push(`- Average composite of closed holdings: ${goal.averageComposite}`);
  }

  lines.push("");
  lines.push(
    "Produce the acquisition plan now by calling the `emit_plan` tool. Ground every claim in the material above.",
  );

  return lines.join("\n");
}

/** Tool schema used to force a structured plan out of the model. */
export const PLAN_TOOL = {
  name: "emit_plan",
  description: "Emit the structured acquisition plan for this parcel.",
  input_schema: {
    type: "object" as const,
    properties: {
      thesis: {
        type: "string",
        description:
          "3-5 sentences. What this deal actually is, whether the water supports the intended use, and the one thing that decides it. Lead with the conclusion.",
      },
      sequencing: {
        type: "array",
        description:
          "The ordered plan of attack, 5-9 steps, from first phone call through post-closing protection. Each step should be something the buyer does, not a topic.",
        items: {
          type: "object",
          properties: {
            order: { type: "number" },
            window: {
              type: "string",
              description: "When this happens, e.g. 'Days 1-3', 'Before LOI', 'Escrow, weeks 2-4', 'First season after closing'.",
            },
            title: { type: "string", description: "Short imperative title, under 60 characters." },
            detail: {
              type: "string",
              description:
                "2-4 sentences: exactly what to do, who to contact, what a good and bad outcome look like, and whether it gates further spending.",
            },
          },
          required: ["order", "window", "title", "detail"],
        },
      },
      negotiationStrategy: {
        type: "string",
        description:
          "4-8 sentences. How to use the engine's findings as leverage: what to price down, what to make a condition, what to put in a holdback, and what the seller's likely counter-position is. Concrete.",
      },
      walkAwayTriggers: {
        type: "array",
        description:
          "3-6 specific, observable facts that should end the deal if discovered. Each must be checkable, not a feeling.",
        items: { type: "string" },
      },
      budgetNotes: {
        type: "string",
        description:
          "3-6 sentences on what diligence will cost and in what order to spend it — cheapest disqualifying checks first. Use only cost figures present in the engine output; otherwise describe relative cost.",
      },
      portfolioFit: {
        type: "string",
        description:
          "3-5 sentences on how this parcel fits the buyer's accumulation target: acreage contribution, water contribution, capital efficiency, and whether it should be prioritized over other pipeline deals. If no portfolio context was supplied, address how it would fit a program building toward a large contiguous position.",
      },
    },
    required: ["thesis", "sequencing", "negotiationStrategy", "walkAwayTriggers", "budgetNotes", "portfolioFit"],
  },
};
