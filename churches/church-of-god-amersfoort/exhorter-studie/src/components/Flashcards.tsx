"use client";
import Link from "next/link";
import { useState } from "react";
import type { Flashcard } from "@/lib/flashcards";
import type { Lang } from "@/lib/types";
import { translator } from "@/lib/i18n";

/** Leitner-style review: see the front, recall, flip, then grade yourself. */
export function Flashcards({ cards, lang }: { cards: Flashcard[]; lang: Lang }) {
  const T = translator(lang);
  const [queue, setQueue] = useState(cards);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);

  const card = queue[0];
  if (!card) {
    return (
      <div className="rounded border border-[var(--color-rule)] p-8 text-center">
        <p className="text-sm text-[var(--color-muted)]">{T("noCardsDue")}</p>
        {done > 0 && (
          <p className="mt-2 text-sm">
            {done} {lang === "nl" ? "kaarten herhaald" : "cards reviewed"}.
          </p>
        )}
      </div>
    );
  }

  async function grade(g: "again" | "good" | "easy") {
    const current = card!;
    setFlipped(false);
    setDone((n) => n + 1);
    // "Again" puts the card back near the end of this session's queue.
    setQueue((q) => (g === "again" ? [...q.slice(1), current] : q.slice(1)));
    await fetch("/api/cards", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ cardId: current.id, grade: g }),
    }).catch(() => {});
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-[var(--color-muted)]">
        <span>{card.hint}</span>
        <span className="tabular-nums">{queue.length} {T("due").toLowerCase()}</span>
      </div>

      <button onClick={() => setFlipped((f) => !f)}
              className="flex min-h-56 w-full flex-col items-center justify-center gap-4 rounded-lg
                         border border-[var(--color-rule)] p-8 text-center transition-colors
                         hover:border-[var(--color-accent)]">
        <p className="text-lg">{card.front}</p>
        {flipped ? (
          <p className="text-xl font-semibold text-[var(--color-accent)]">{card.back}</p>
        ) : (
          <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
            {T("flip")}
          </span>
        )}
      </button>

      {flipped && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => grade("again")}
                    className="rounded border border-red-600/50 px-3 py-2 text-sm font-medium
                               text-red-700 dark:text-red-400">{T("again")}</button>
            <button onClick={() => grade("good")}
                    className="rounded border border-[var(--color-rule)] px-3 py-2 text-sm font-medium">
              {T("good")}
            </button>
            <button onClick={() => grade("easy")}
                    className="rounded border border-emerald-600/50 px-3 py-2 text-sm font-medium
                               text-emerald-700 dark:text-emerald-400">{T("easy")}</button>
          </div>
          {card.source && (
            <p className="text-center text-sm">
              <Link href={`/cursus/${card.source.chapter}?blok=${card.source.block}`}
                    className="text-[var(--color-accent)] hover:underline">
                {T("sourceIsHere")} — {T("page")} {card.source.page} →
              </Link>
            </p>
          )}
        </>
      )}
    </div>
  );
}
