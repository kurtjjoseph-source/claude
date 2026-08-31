import { cookies } from "next/headers";
import type { Lang, User } from "@/lib/types";

/**
 * Reading language: the signed-in profile wins, then the cookie set by the
 * language switch, then Dutch — the platform's primary language.
 */
export async function resolveLang(user: User | null): Promise<Lang> {
  if (user) return user.settings.lang;
  const cookie = (await cookies()).get("lang")?.value;
  return cookie === "en" ? "en" : "nl";
}
