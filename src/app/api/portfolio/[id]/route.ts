import { NextResponse } from "next/server";
import { holdingPatchSchema } from "@/lib/validation";
import { deleteHolding, updateHolding } from "@/lib/portfolio/store";
import { portfolioUnlocked } from "@/lib/auth";

export const runtime = "nodejs";

async function guard() {
  if (await portfolioUnlocked()) return null;
  return NextResponse.json({ error: "Portfolio is locked." }, { status: 401 });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
  }

  const parsed = holdingPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "The patch did not validate.",
        issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
      { status: 422 },
    );
  }

  const holding = await updateHolding(id, parsed.data);
  if (!holding) return NextResponse.json({ error: "No such holding." }, { status: 404 });
  return NextResponse.json({ holding });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;

  const { id } = await ctx.params;
  const removed = await deleteHolding(id);
  if (!removed) return NextResponse.json({ error: "No such holding." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
