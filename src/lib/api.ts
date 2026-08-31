import { NextResponse } from "next/server";

export const ok = (data: unknown = { ok: true }) => NextResponse.json(data);
export const bad = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

/** Turns the Response thrown by requireUser/requireAdmin into a JSON reply. */
export async function guard<T>(fn: () => Promise<T>): Promise<T | NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: err.statusText || "Unauthorized" },
                               { status: err.status });
    }
    throw err;
  }
}
