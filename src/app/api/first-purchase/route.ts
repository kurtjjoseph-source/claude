import { NextResponse } from "next/server";
import { buyerProfileSchema } from "@/lib/validation";
import { buildFirstPurchaseGuide } from "@/lib/first-purchase/engine";
import { generateFirstPurchaseBrief } from "@/lib/ai/first-purchase";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
  }

  const parsed = buyerProfileSchema.safeParse((body as { profile?: unknown })?.profile ?? body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "The buyer profile did not validate.",
        issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
      { status: 422 },
    );
  }

  const profile = parsed.data;
  const guide = buildFirstPurchaseGuide(profile);
  const brief = await generateFirstPurchaseBrief(profile, guide);

  return NextResponse.json({ profile, guide, brief });
}
