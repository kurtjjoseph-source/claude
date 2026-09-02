import { NextResponse } from "next/server";
import { backendName, read } from "@/lib/store";

/**
 * Deployment check. Reports whether the store is writable and whether the
 * session secret is configured — never their values.
 */
export async function GET() {
  const checks: Record<string, unknown> = {
    sessionSecret: Boolean(process.env.SESSION_SECRET),
    mailConfigured: Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM),
  };
  try {
    checks.store = await backendName();
    checks.users = await read((db) => db.users.length);
    checks.ok = true;
  } catch (err) {
    checks.ok = false;
    checks.error = err instanceof Error ? err.message : String(err);
  }
  return NextResponse.json(checks, { status: checks.ok ? 200 : 500 });
}
