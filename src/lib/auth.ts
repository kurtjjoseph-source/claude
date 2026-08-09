import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Lightweight gate for the private portfolio dashboard.
 *
 * This is a shared-passphrase door, not an identity system: it keeps a
 * single-operator dashboard off the open internet and nothing more. If this
 * ever serves multiple users or anything of value beyond deal notes, replace
 * it with real authentication rather than extending it.
 */

export const PORTFOLIO_COOKIE = "hg_portfolio";

function digest(value: string): string {
  return createHash("sha256").update(`headgate:${value}`).digest("hex");
}

/** True when no passphrase is configured — the dashboard is then open. */
export function portfolioIsOpen(): boolean {
  return !process.env.PORTFOLIO_PASSPHRASE;
}

export function expectedToken(): string {
  return digest(process.env.PORTFOLIO_PASSPHRASE ?? "");
}

export function passphraseMatches(candidate: string): boolean {
  const expected = Buffer.from(expectedToken(), "utf8");
  const actual = Buffer.from(digest(candidate), "utf8");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function portfolioUnlocked(): Promise<boolean> {
  if (portfolioIsOpen()) return true;
  const jar = await cookies();
  const token = jar.get(PORTFOLIO_COOKIE)?.value;
  if (!token) return false;
  const expected = Buffer.from(expectedToken(), "utf8");
  const actual = Buffer.from(token, "utf8");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
