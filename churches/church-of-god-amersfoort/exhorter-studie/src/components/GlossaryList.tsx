"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { GlossaryTerm } from "@/lib/reference";
import type { Lang } from "@/lib/types";
import { translator } from "@/lib/i18n";

const pick = (v: { en: string; nl: string }, lang: Lang) => (lang === "nl" && v.nl ? v.nl : v.en);

/** Alphabetical glossary with a filter and per-term occurrence links. */
export function GlossaryList({ terms, lang, titles }: {
  terms: GlossaryTerm[]; lang: Lang; titles: Record<string, { en: string; nl: string }>;
}) {
  const T = translator(lang);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? terms.filter((t) => pick(t.term, lang).toLowerCase().includes(q) ||
                            pick(t.definition, lang).toLowerCase().includes(q))
      : terms;
    return [...list].sort((a, b) =>
      pick(a.term, lang).localeCompare(pick(b.term, lang), lang === "nl" ? "nl" : "en"));
  }, [terms, query, lang]);

  const groups = useMemo(() => {
    const map = new Map<string, GlossaryTerm[]>();
    for (const t of matches) {
      const letter = pick(t.term, lang).charAt(0).toUpperCase();
      (map.get(letter) ?? map.set(letter, []).get(letter)!).push(t);
    }
    return [...map.entries()];
  }, [matches, lang]);

  return (
    <div className="space-y-6">
      <input value={query} onChange={(e) => setQuery(e.target.value)}
             placeholder={T("search")}
             className="w-full max-w-sm rounded border border-[var(--color-rule)] bg-transparent
                        px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]" />

      {groups.map(([letter, items]) => (
        <section key={letter}>
          <h2 className="mb-2 text-sm font-semibold text-[var(--color-accent)]">{letter}</h2>
          <dl className="space-y-1">
            {items.map((t) => {
              const isOpen = open === t.id;
              return (
                <div key={t.id} className="rounded border border-[var(--color-rule)] px-4 py-2.5">
                  <dt>
                    <button onClick={() => setOpen(isOpen ? null : t.id)}
                            className="flex w-full items-baseline gap-3 text-left">
                      <span className="font-medium">{pick(t.term, lang)}</span>
                      <span className="ml-auto shrink-0 text-xs text-[var(--color-muted)]">
                        {t.occurrences.length}×
                      </span>
                    </button>
                  </dt>
                  <dd className="mt-1 text-sm text-[var(--color-muted)]">
                    {pick(t.definition, lang)}
                  </dd>
                  {isOpen && (
                    <dd className="mt-3 flex flex-wrap gap-2 border-t border-[var(--color-rule)] pt-3">
                      {t.occurrences.map((o, i) => (
                        <Link key={i} href={`/cursus/${o.chapter}?blok=${o.block}`}
                              className="rounded border border-[var(--color-rule)] px-2 py-0.5 text-xs
                                         text-[var(--color-accent)] hover:border-[var(--color-accent)]">
                          {titles[o.chapter] ? pick(titles[o.chapter]!, lang).slice(0, 28) : o.chapter}
                          {" · p"}{o.page}
                        </Link>
                      ))}
                    </dd>
                  )}
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </div>
  );
}
