import { NextResponse } from "next/server";
import { PORTFOLIO_COOKIE, expectedToken, passphraseMatches, portfolioIsOpen } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (portfolioIsOpen()) {
    return NextResponse.json({ ok: true, note: "No passphrase configured." });
  }

  const body = (await request.json().catch(() => null)) as { passphrase?: unknown } | null;
  const candidate = typeof body?.passphrase === "string" ? body.passphrase : "";

  if (!passphraseMatches(candidate)) {
    return NextResponse.json({ error: "Incorrect passphrase." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(PORTFOLIO_COOKIE, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(PORTFOLIO_COOKIE);
  return response;
}
