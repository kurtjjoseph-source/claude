"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Lang } from "@/lib/types";

/**
 * Switching language writes the choice to the signed-in profile when there is
 * one, and always to a cookie, so a reader who is not signed in keeps their
 * choice too.
 */
export function LangSwitch({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function choose(next: Lang) {
    if (next === lang) return;
    document.cookie = `lang=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    void fetch("/api/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lang: next }),
    }).finally(() => start(() => router.refresh()));
  }

  return (
    <div className="flex overflow-hidden rounded border border-[var(--color-rule)]"
         aria-label="Taal / Language" data-pending={pending}>
      {(["nl", "en"] as const).map((code) => (
        <button key={code} onClick={() => choose(code)}
                aria-current={lang === code}
                className={`px-2 py-0.5 text-xs font-medium uppercase ${
                  lang === code
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-muted)] hover:text-[var(--color-accent)]"}`}>
          {code}
        </button>
      ))}
    </div>
  );
}
