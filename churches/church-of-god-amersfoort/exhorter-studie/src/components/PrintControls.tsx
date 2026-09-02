"use client";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/types";

/** Choices for the printed copy: which language, and which part. */
export function PrintControls({ lang, deel }: { lang: Lang; deel: string }) {
  const router = useRouter();

  function go(next: { taal?: string; deel?: string }) {
    const params = new URLSearchParams({ taal: next.taal ?? lang, deel: next.deel ?? deel });
    if (!params.get("deel")) params.delete("deel");
    router.push(`/print?${params.toString()}`);
  }

  const parts: [string, string][] = [
    ["", lang === "nl" ? "Volledige cursus" : "Complete course"],
    ["part1", lang === "nl" ? "Deel I — Bijbel" : "Part I — Bible"],
    ["part2", lang === "nl" ? "Deel II — Geschiedenis en kerkorde" : "Part II — History and Polity"],
    ["part3", lang === "nl" ? "Deel III — Leer" : "Part III — Doctrine"],
  ];

  return (
    <div className="no-print mb-8 flex flex-wrap items-center gap-3 rounded border
                    border-[var(--color-rule)] p-4 text-sm">
      <select value={lang} onChange={(e) => go({ taal: e.target.value })}
              className="rounded border border-[var(--color-rule)] bg-transparent px-2 py-1">
        <option value="nl">Nederlands</option>
        <option value="en">English</option>
      </select>
      <select value={deel} onChange={(e) => go({ deel: e.target.value })}
              className="rounded border border-[var(--color-rule)] bg-transparent px-2 py-1">
        {parts.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>
      <button onClick={() => window.print()}
              className="rounded bg-[var(--color-accent)] px-4 py-1.5 font-medium text-white">
        {lang === "nl" ? "Afdrukken / opslaan als PDF" : "Print / save as PDF"}
      </button>
      <p className="text-xs text-[var(--color-muted)]">
        {lang === "nl"
          ? "Tip: kies in het printvenster “Opslaan als PDF”."
          : "Tip: choose “Save as PDF” in the print dialog."}
      </p>
    </div>
  );
}
