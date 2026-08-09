import { NextResponse } from "next/server";
import { parcelInputSchema } from "@/lib/validation";
import { assessParcel } from "@/lib/water/engine";
import { generatePlan } from "@/lib/ai/plan";
import { computeGoal } from "@/lib/portfolio/goal";
import { getTargetAcres, listHoldings } from "@/lib/portfolio/store";
import { portfolioUnlocked } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
  }

  const parsed = parcelInputSchema.safeParse((body as { input?: unknown })?.input ?? body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "The parcel details did not validate.",
        issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
      { status: 422 },
    );
  }

  const input = parsed.data;

  let assessment;
  try {
    assessment = assessParcel(input);
  } catch (err) {
    console.error("[headgate] assessment failed:", err);
    return NextResponse.json({ error: "Could not assess this parcel." }, { status: 500 });
  }

  // Portfolio context sharpens the plan, but only for an unlocked operator.
  let goal = null;
  if (await portfolioUnlocked()) {
    try {
      const [holdings, target] = await Promise.all([listHoldings(), getTargetAcres()]);
      goal = computeGoal(holdings, target);
    } catch (err) {
      console.error("[headgate] portfolio context unavailable:", err);
    }
  }

  const plan = await generatePlan(input, assessment, goal);

  return NextResponse.json({ input, assessment, plan });
}
