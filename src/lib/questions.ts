import { reviewItems, type ReviewItem } from "@/lib/content";
import type { Lang } from "@/lib/types";

export type Choice = { key: string; text: string };
export type MCQuestion = {
  id: string;
  prompt: string;
  choices: Choice[];
  answer: string;
  /** The answer as written in the guide, for the explanation line. */
  answerText: string;
  source: { chapter: string; block: number; page: number } | null;
  section: string;
};

/* A small deterministic PRNG, so a question's options keep the same order
   between renders and between the server and the client. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let x = seed || 1;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5;  x >>>= 0;
    return x / 4294967296;
  };
}

function shuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  const next = rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const KEYS = ["A", "B", "C", "D"];
const answerOf = (it: ReviewItem, lang: Lang) =>
  (lang === "nl" && it.a.nl ? it.a.nl : it.a.en);
const promptOf = (it: ReviewItem, lang: Lang) =>
  (lang === "nl" && it.q.nl ? it.q.nl : it.q.en);

/**
 * Turns a fill-in-the-blank review item from the guide into a multiple-choice
 * question. Distractors are drawn from the answers to *other* items in the same
 * section, so the wrong options are the same kind of thing as the right one —
 * scripture references against scripture references, offices against offices —
 * rather than obviously implausible filler.
 */
function toMC(item: ReviewItem, pool: ReviewItem[], lang: Lang): MCQuestion | null {
  const correct = answerOf(item, lang).trim();
  if (!correct) return null;

  const seen = new Set([correct.toLowerCase()]);
  const candidates = pool.filter((other) => {
    if (other.id === item.id) return false;
    const text = answerOf(other, lang).trim();
    if (!text || seen.has(text.toLowerCase())) return false;
    // Keep distractors of a similar shape: a reference for a reference, a
    // phrase for a phrase.
    const isRef = (s: string) => /\d+:\d+|\d{4}/.test(s);
    if (isRef(correct) !== isRef(text)) return false;
    seen.add(text.toLowerCase());
    return true;
  });

  const seed = hash(item.id);
  const distractors = shuffle(candidates, seed).slice(0, 3).map((d) => answerOf(d, lang).trim());
  if (distractors.length < 2) return null;

  const options = shuffle([correct, ...distractors], seed + 7);
  const choices = options.map((text, i) => ({ key: KEYS[i]!, text }));
  const answer = choices.find((c) => c.text === correct)!.key;

  return {
    id: item.id,
    prompt: promptOf(item, lang),
    choices,
    answer,
    answerText: correct,
    source: item.source ?? null,
    section: item.section,
  };
}

/** Review questions for one chapter, drawn from the guide's own question bank. */
export function questionsForChapter(chapterId: string, lang: Lang): MCQuestion[] {
  const forChapter = reviewItems.filter((r) => r.source?.chapter === chapterId);
  const pool = reviewItems.filter(
    (r) => r.module === forChapter[0]?.module || r.section === forChapter[0]?.section);
  return forChapter
    .map((item) => toMC(item, pool.length > 6 ? pool : reviewItems, lang))
    .filter((q): q is MCQuestion => q !== null);
}

/** Every chapter that has review questions, with how many. */
export function chaptersWithQuestions(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const r of reviewItems) {
    if (!r.source) continue;
    counts.set(r.source.chapter, (counts.get(r.source.chapter) ?? 0) + 1);
  }
  return counts;
}
