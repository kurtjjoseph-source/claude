import { NextResponse } from "next/server";
import { holdingDraftSchema } from "@/lib/validation";
import { addHolding, getTargetAcres, listHoldings, setTargetAcres } from "@/lib/portfolio/store";
import { computeGoal, projectRunway } from "@/lib/portfolio/goal";
import { portfolioUnlocked } from "@/lib/auth";

export const runtime = "nodejs";

// The dashboard must never serve a stale roll-up. When no passphrase is set the
// guard returns before touching cookies(), so this GET reads no dynamic API and
// nothing structurally prevents it from being treated as cacheable. Pin it.
export const dynamic = "force-dynamic";

async function guard() {
  if (await portfolioUnlocked()) return null;
  return NextResponse.json({ error: "Portfolio is locked." }, { status: 401 });
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;

  const [holdings, targetAcres] = await Promise.all([listHoldings(), getTargetAcres()]);
  const goal = computeGoal(holdings, targetAcres);
  return NextResponse.json({ holdings, goal, runway: projectRunway(goal, holdings) });
}

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
  }

  const parsed = holdingDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "The holding did not validate.",
        issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
      { status: 422 },
    );
  }

  const holding = await addHolding(parsed.data);
  return NextResponse.json({ holding }, { status: 201 });
}

/** Updates the acreage target. */
export async function PUT(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as { targetAcres?: unknown } | null;
  const value = Number(body?.targetAcres);
  if (!Number.isFinite(value) || value <= 0) {
    return NextResponse.json({ error: "targetAcres must be a positive number." }, { status: 422 });
  }

  const targetAcres = await setTargetAcres(value);
  return NextResponse.json({ targetAcres });
}
