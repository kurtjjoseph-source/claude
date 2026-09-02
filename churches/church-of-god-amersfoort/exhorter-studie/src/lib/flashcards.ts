import { examItems, reviewItems } from "@/lib/content";
import type { Lang, Progress } from "@/lib/types";

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  hint: string;
  source: { chapter: string; block: number; page: number } | null;
  /** Where the card came from, so a deck can be filtered. */
  deck: "part1" | "part2" | "part3";
};

const pick = (v: { en: string; nl: string }, lang: Lang) =>
  (lang === "nl" && v.nl ? v.nl : v.en);

/** The full deck: every review item, plus every official exam item. */
export function buildDeck(lang: Lang): Flashcard[] {
  const cards: Flashcard[] = reviewItems.map((r) => ({
    id: `r:${r.id}`,
    front: pick(r.q, lang),
    back: pick(r.a, lang),
    hint: r.section,
    source: r.source,
    deck: r.module as Flashcard["deck"],
  }));

  for (const q of examItems) {
    const answer = q.choices.find((c) => c.key === q.answer);
    if (!answer) continue;
    cards.push({
      id: `x:${q.id}`,
      front: pick(q.prompt, lang),
      back: pick(answer.text, lang),
      hint: `Examen ${q.part}.${q.n}`,
      source: q.source,
      deck: (q.part === "I" ? "part1" : q.part === "II" ? "part2" : "part3"),
    });
  }
  return cards;
}

/**
 * Cards due now, hardest first: never-seen cards come after lapsed ones, so a
 * short session spends its time on what is actually failing.
 */
export function dueCards(deck: Flashcard[], progress: Progress, limit = 30): Flashcard[] {
  const now = Date.now();
  const scored = deck
    .map((card) => {
      const state = progress.cards[card.id];
      const due = state ? new Date(state.dueAt).getTime() : 0;
      return { card, state, due };
    })
    .filter((c) => c.due <= now);

  scored.sort((a, b) => {
    const lapses = (b.state?.lapses ?? 0) - (a.state?.lapses ?? 0);
    if (lapses) return lapses;
    const box = (a.state?.box ?? 0) - (b.state?.box ?? 0);
    if (box) return box;
    return a.due - b.due;
  });
  return scored.slice(0, limit).map((c) => c.card);
}
