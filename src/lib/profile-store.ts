import type { BuyerProfile } from "@/lib/types";

/**
 * Buyer profile persistence.
 *
 * Stored in a cookie rather than localStorage so the server can read it at
 * render time. That is the whole point: the listings page can then match
 * server-side and send down finished results, instead of the client mounting,
 * discovering a profile, fetching, and re-rendering. No loading flash, no
 * effect-driven data fetch, and the page works with JavaScript disabled.
 *
 * There is no account system and there does not need to be one. The profile is
 * personal financial information — capital, timeline, risk appetite — and it
 * lives with the user, travelling only as far as the request that scores it.
 */

export const PROFILE_COOKIE = "hg_profile";

/** A year. Long enough to be useful, short enough not to be forever. */
const MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Only the fields the matcher needs, kept deliberately compact — cookies are
 * sent on every request and a 4KB ceiling is easy to reach carelessly.
 */
export function encodeProfile(profile: BuyerProfile): string {
  return encodeURIComponent(JSON.stringify(profile));
}

export function decodeProfile(raw: string | undefined): BuyerProfile | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<BuyerProfile>;
    // Enough of a shape check to avoid handing rubbish to the engine; the
    // server revalidates properly with zod before using it.
    if (typeof parsed.totalCapital !== "number" || typeof parsed.targetAcres !== "number") return null;
    return parsed as BuyerProfile;
  } catch {
    return null;
  }
}

/** Client-side write. Not httpOnly by design — the browser owns this value. */
export function saveProfileCookie(profile: BuyerProfile): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${PROFILE_COOKIE}=${encodeProfile(profile)}; path=/; max-age=${MAX_AGE}; samesite=lax${secure}`;
}

export function clearProfileCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${PROFILE_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
