import courseEn from "@/../content/course.en.json";
import courseNl from "@/../content/course.nl.json";
import examData from "@/../content/exam.json";
import reviewData from "@/../content/reviews.json";
import type { Erratum, Lang } from "@/lib/types";

/* ------------------------------------------------------------------ types */

export type BlockType = "h1" | "h2" | "h3" | "p" | "quote" | "note";

/** A block as built: `x` is the English text, `p` the printed page. */
type RawBlock = { i: number; t: string; x: string; p: number; d: number };
type RawChapter = {
  id: string; module: string; title: { en: string; nl: string };
  pageStart: number; pageEnd: number; kind: string; blocks: RawBlock[];
};

export type Block = {
  index: number;
  type: BlockType;
  page: number;
  indent: number;
  en: string;
  /** Dutch text, or null where the chapter is not yet translated. */
  nl: string | null;
};

export type Chapter = {
  id: string;
  module: string;
  title: { en: string; nl: string };
  pageStart: number;
  pageEnd: number;
  kind: "text" | "bank";
  blocks: Block[];
  /** Fraction of blocks with a Dutch translation, 0..1. */
  translated: number;
};

export type Module = { id: string; number: number; title: { en: string; nl: string } };

export type ExamItem = {
  id: string; part: "I" | "II" | "III"; n: number;
  prompt: { en: string; nl: string };
  choices: { key: string; text: { en: string; nl: string } }[];
  answer: string;
  keyPages2019: number[];
  source: { chapter: string; block: number; page: number } | null;
};

export type ReviewItem = {
  id: string; bank: string; module: string; section: string; n: number; page: number;
  q: { en: string; nl: string };
  a: { en: string; nl: string };
  /** Passage in the teaching text that states this answer, where one was found. */
  source: { chapter: string; block: number; page: number } | null;
  matchScore: number;
};

/* --------------------------------------------------------------- loading */

const NL = courseNl as Record<string, Record<string, string>>;

const MODULES = (courseEn as { modules: Module[] }).modules;
const RAW = (courseEn as unknown as { chapters: RawChapter[] }).chapters;

function build(raw: RawChapter, errata: Erratum[]): Chapter {
  const nlFor = NL[raw.id] ?? {};
  const patch = new Map<string, string>();
  for (const e of errata) {
    if (e.chapterId === raw.id) patch.set(`${e.lang}:${e.blockIndex}`, e.text);
  }
  let translated = 0;
  const blocks: Block[] = raw.blocks.map((b) => {
    const en = patch.get(`en:${b.i}`) ?? b.x;
    const nl = patch.get(`nl:${b.i}`) ?? nlFor[String(b.i)] ?? null;
    if (nl) translated++;
    return { index: b.i, type: b.t as BlockType, page: b.p, indent: b.d, en, nl };
  });
  return {
    id: raw.id, module: raw.module, title: raw.title,
    pageStart: raw.pageStart, pageEnd: raw.pageEnd,
    kind: raw.kind === "bank" ? "bank" : "text",
    blocks,
    translated: blocks.length ? translated / blocks.length : 1,
  };
}

/** All chapters, with any admin errata applied. */
export function getChapters(errata: Erratum[] = []): Chapter[] {
  return RAW.map((r) => build(r, errata));
}

export function getChapter(id: string, errata: Erratum[] = []): Chapter | null {
  const raw = RAW.find((r) => r.id === id);
  return raw ? build(raw, errata) : null;
}

export const getModules = (): Module[] => MODULES;

/** Chapters a student works through, in order (question banks excluded). */
export const readingChapters = (errata: Erratum[] = []) =>
  getChapters(errata).filter((c) => c.kind === "text");

export const examItems = (examData as { items: ExamItem[] }).items;
export const reviewItems = (reviewData as { items: ReviewItem[] }).items;

/** Exam items whose answer is found in a given chapter. */
export const examItemsForChapter = (chapterId: string) =>
  examItems.filter((q) => q.source?.chapter === chapterId);

/** Pick the text to show for a block, falling back to English. */
export function textOf(b: Block, lang: Lang): { text: string; isFallback: boolean } {
  if (lang === "en") return { text: b.en, isFallback: false };
  return b.nl ? { text: b.nl, isFallback: false } : { text: b.en, isFallback: true };
}

export function bi(v: { en: string; nl: string }, lang: Lang): string {
  const primary = lang === "nl" ? v.nl : v.en;
  return primary || v.en;
}

/** Overall Dutch coverage across the teaching chapters, 0..1. */
export function translationCoverage(): number {
  const chapters = readingChapters();
  const total = chapters.reduce((n, c) => n + c.blocks.length, 0);
  const done = chapters.reduce(
    (n, c) => n + c.blocks.filter((b) => b.nl).length, 0);
  return total ? done / total : 0;
}
