import Anthropic from "@anthropic-ai/sdk";
import type { BuyerProfile, FirstPurchaseBrief, FirstPurchaseGuide } from "@/lib/types";

const DEFAULT_MODEL = "claude-opus-5";

const SYSTEM_PROMPT = `You are an experienced land buyer briefing someone on their first purchase of land with water rights.

A deterministic engine has already produced their readiness assessment, budget envelope, jurisdiction shortlist, target profile for the first parcel, a sequenced plan and a learning list. You are given all of it. Your job is to write the short human framing around those numbers.

Hard constraints:
- Never contradict the engine's figures, gates or shortlist. You may explain and prioritise them; you may not overturn them.
- Never invent a statutory period, a legal rule, an agency requirement or a dollar figure that is not in the material you were given.
- If the engine has raised a blocking gate, say so plainly and early. Do not encourage someone to proceed past a failed gate.
- Never suggest a nominee arrangement or any structure whose purpose is to disguise beneficial ownership.
- No disclaimers about being an AI. The application carries its own legal disclaimer.

Tone: a straight-talking colleague who has done this several times, talking to someone doing it once. Warm but unsentimental. Short sentences, concrete nouns. Encouraging where the facts support it and direct where they do not. Never patronising — this is an adult making a large financial decision, not a beginner to be coddled.`;

const BRIEF_TOOL = {
  name: "emit_brief",
  description: "Emit the personal framing around the first-purchase guide.",
  input_schema: {
    type: "object" as const,
    properties: {
      opening: {
        type: "string",
        description:
          "3-5 sentences. Where this buyer actually stands, what their budget realistically buys, and the single most important thing about their situation. Lead with the conclusion.",
      },
      whatGoodLooksLike: {
        type: "string",
        description:
          "3-5 sentences describing the specific parcel they should be trying to find — concrete enough that they would recognise it in a listing.",
      },
      biggestRisk: {
        type: "string",
        description:
          "3-5 sentences on the one thing most likely to go wrong for this particular buyer, drawn from their gates and profile. Be specific to them, not generic.",
      },
      thisWeek: {
        type: "array",
        description: "3-5 concrete actions to take in the next seven days. Each must be something they can actually start on Monday.",
        items: { type: "string" },
      },
      encouragement: {
        type: "string",
        description:
          "2-3 sentences. Honest perspective on the path from here to a first closing and on to the acreage target. Earned optimism only — if the engine flagged blocking issues, this should acknowledge the work ahead rather than paper over it.",
      },
    },
    required: ["opening", "whatGoodLooksLike", "biggestRisk", "thisWeek", "encouragement"],
  },
};

function buildPrompt(profile: BuyerProfile, guide: FirstPurchaseGuide): string {
  const b = guide.budget;
  const lines: string[] = [];

  lines.push("## The buyer");
  lines.push(`- Capital available: $${profile.totalCapital.toLocaleString()}`);
  lines.push(`- Financing: ${profile.financing}`);
  if (profile.annualAddition) lines.push(`- Can add per year: $${profile.annualAddition.toLocaleString()}`);
  lines.push(`- Acreage target: ${profile.targetAcres.toLocaleString()}`);
  lines.push(`- Months to first purchase: ${profile.monthsToFirstPurchase}`);
  lines.push(`- Land experience: ${profile.landExperience}`);
  lines.push(`- Water rights knowledge: ${profile.waterKnowledge}`);
  lines.push(`- Intent: ${profile.operatingIntent}`);
  lines.push(`- Home country: ${profile.homeCountry}; geography preference: ${profile.geographyPreference}`);
  lines.push(`- Can visit in person: ${profile.canVisitInPerson}`);
  lines.push(`- Risk appetite: ${profile.riskAppetite}`);
  if (profile.expectedPricePerAcre) lines.push(`- Expected price per acre: $${profile.expectedPricePerAcre.toLocaleString()}`);

  lines.push("");
  lines.push(`## Readiness: ${guide.readiness.band} (${guide.readiness.score}/100)`);
  lines.push(guide.readiness.headline);
  for (const g of guide.readiness.gates) {
    lines.push(`- [${g.status.toUpperCase()}] ${g.title}: ${g.detail}${g.action ? ` ACTION: ${g.action}` : ""}`);
  }

  lines.push("");
  lines.push("## Budget envelope");
  lines.push(`- Maximum for the land: $${b.maxPurchasePrice.toLocaleString()}`);
  lines.push(`- Diligence programme: $${b.diligenceProgram.toLocaleString()} (about $${b.perDealDiligence.toLocaleString()} per deal, ${b.dealsScreenedAssumed} deals assumed)`);
  lines.push(`- Closing costs at ${Math.round(b.closingCostsRate * 100)}%: $${b.estimatedClosingCosts.toLocaleString()}`);
  lines.push(`- Working reserve: $${b.workingReserve.toLocaleString()}`);
  lines.push(`- Acreage at reference prices: ${b.impliedAcres.map((i) => `${i.acres} ac at $${i.pricePerAcre}/ac`).join("; ")}`);
  for (const n of b.notes) lines.push(`- Note: ${n}`);

  lines.push("");
  lines.push("## Target profile for the first parcel");
  lines.push(`- Acreage band: ${guide.targetProfile.acreBandLow}-${guide.targetProfile.acreBandHigh}`);
  lines.push(`- Minimum wizard score to pursue: ${guide.targetProfile.minComposite}`);
  lines.push(`- Prefer: ${guide.targetProfile.prefer.join(" | ")}`);
  lines.push(`- Avoid: ${guide.targetProfile.avoid.join(" | ")}`);
  lines.push(`- Rationale: ${guide.targetProfile.rationale}`);

  lines.push("");
  lines.push("## Jurisdiction shortlist");
  for (const p of guide.shortlist) {
    lines.push(`- ${p.name} (${p.score}/100): ${p.why} WATCH: ${p.watchOut}`);
  }

  lines.push("");
  lines.push("## Sequenced plan");
  for (const s of guide.steps) {
    lines.push(`- ${s.order}. (${s.window}${s.gate ? ", gate" : ""}) ${s.title}: ${s.detail}`);
  }

  lines.push("");
  lines.push("## Learning list");
  for (const l of guide.learning) lines.push(`- ${l.topic}: ${l.why}`);

  lines.push("");
  lines.push("## Path to the acreage target");
  lines.push(guide.pathToTarget.cadenceNote);
  lines.push(guide.pathToTarget.compoundingNote);

  lines.push("");
  lines.push("Write the brief now by calling the `emit_brief` tool. Ground everything in the material above.");
  return lines.join("\n");
}

export async function generateFirstPurchaseBrief(
  profile: BuyerProfile,
  guide: FirstPurchaseGuide,
): Promise<FirstPurchaseBrief> {
  if (!process.env.ANTHROPIC_API_KEY) return templateBrief(profile, guide);

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: [BRIEF_TOOL],
      tool_choice: { type: "tool", name: BRIEF_TOOL.name },
      messages: [{ role: "user", content: buildPrompt(profile, guide) }],
    });

    const block = response.content.find((c) => c.type === "tool_use");
    if (!block || block.type !== "tool_use") return templateBrief(profile, guide);

    const parsed = block.input as Partial<FirstPurchaseBrief>;
    if (!parsed.opening || !Array.isArray(parsed.thisWeek)) return templateBrief(profile, guide);

    return {
      opening: parsed.opening,
      whatGoodLooksLike: parsed.whatGoodLooksLike ?? "",
      biggestRisk: parsed.biggestRisk ?? "",
      thisWeek: parsed.thisWeek,
      encouragement: parsed.encouragement ?? "",
      templated: false,
    };
  } catch (err) {
    console.error("[headgate] first-purchase brief failed, using template:", err);
    return templateBrief(profile, guide);
  }
}

// ---------------------------------------------------------------------------
// Deterministic fallback
// ---------------------------------------------------------------------------

function templateBrief(profile: BuyerProfile, guide: FirstPurchaseGuide): FirstPurchaseBrief {
  const b = guide.budget;
  const fails = guide.readiness.gates.filter((g) => g.status === "fail");
  const warns = guide.readiness.gates.filter((g) => g.status === "warn");
  const top = guide.shortlist[0];

  const opening = [
    fails.length > 0
      ? `Before anything else: ${fails[0]!.title.toLowerCase()}. ${fails[0]!.action ?? ""}`
      : `You are in a position to start looking seriously.`,
    b.maxPurchasePrice > 0
      ? `Of your $${profile.totalCapital.toLocaleString()}, about $${b.maxPurchasePrice.toLocaleString()} should go to the land itself — the rest is diligence and reserve, and both are load-bearing.`
      : `On the current numbers there is nothing left for the land once diligence and reserve are funded, which is the finding to act on.`,
    top ? `${top.name} is the best fit for a first purchase given what you have told me.` : "",
    `Your target is ${profile.targetAcres.toLocaleString()} acres, but the first purchase is not where you chase it.`,
  ]
    .filter(Boolean)
    .join(" ");

  const whatGoodLooksLike = [
    `Something in the ${guide.targetProfile.acreBandLow}-${guide.targetProfile.acreBandHigh} acre range that scores at least ${guide.targetProfile.minComposite} in the parcel wizard.`,
    `A water right the seller can name by permit, certificate or decree number in the first conversation, appurtenant to the land, with recorded legal access.`,
    `Simple enough that you can check it properly for the diligence budget you have, and small enough that being wrong about it is survivable.`,
    guide.targetProfile.avoid[0] ? `Specifically avoid: ${guide.targetProfile.avoid[0].toLowerCase()}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const risk =
    fails.length > 0
      ? `${fails[0]!.title}. ${fails[0]!.detail}`
      : warns.length > 0
        ? `${warns[0]!.title}. ${warns[0]!.detail} ${warns[0]!.action ?? ""}`
        : `The most likely failure for any first-time buyer is emotional commitment arriving before the records do. You will find a parcel you want, and the temptation will be to compress the water contingency to keep the seller happy. That is the moment the budget above stops being a plan and starts being a suggestion.`;

  const thisWeek = [
    `Move $${b.diligenceProgram.toLocaleString()} for diligence and $${b.workingReserve.toLocaleString()} for reserve into separate accounts so the purchase budget is unambiguous.`,
    top
      ? `Read the ${top.name} entry in the jurisdiction reference end to end, then bookmark its water agency's records search.`
      : `Pick one jurisdiction and read its entry in the reference end to end.`,
    `Call that agency and ask how a prospective buyer searches rights by legal description. It is a five-minute call and it changes everything downstream.`,
    `Find five listings and run each through the parcel wizard using only what the listing says. You are calibrating, not shopping.`,
  ];
  if (fails.length > 0 && fails[0]!.action) thisWeek.unshift(fails[0]!.action);

  const encouragement =
    fails.length > 0
      ? `None of this is a reason not to do it — it is a reason to fix one thing first. The buyers who do well here are the ones who treated the first purchase as tuition rather than as the destination.`
      : `The first purchase is slower and more expensive per acre than every one after it, and that is normal. What you are really buying is the process: the agency contacts, the escrow language, the instinct for which listings are lying. Your fifth diligence run will cost a fraction of your first.`;

  return { opening, whatGoodLooksLike, biggestRisk: risk, thisWeek, encouragement, templated: true };
}
