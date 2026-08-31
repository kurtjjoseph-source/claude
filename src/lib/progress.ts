import type { Progress, User } from "@/lib/types";
import { examItems, readingChapters, reviewItems } from "@/lib/content";

export type ChapterStat = {
  id: string;
  blocks: number;
  read: number;
  done: boolean;
  fraction: number;
};

/** Per-chapter reading progress for one student. */
export function chapterStats(progress: Progress): ChapterStat[] {
  return readingChapters().map((c) => {
    const entry = progress.chapters[c.id];
    const read = entry ? entry.read.length : 0;
    const blocks = c.blocks.length;
    return {
      id: c.id, blocks, read,
      done: entry?.done ?? false,
      fraction: entry?.done ? 1 : blocks ? Math.min(1, read / blocks) : 0,
    };
  });
}

export type Summary = {
  reading: number;          // 0..1 across all teaching chapters
  chaptersDone: number;
  chaptersTotal: number;
  questionsSeen: number;
  questionsCorrect: number;
  accuracy: number;         // 0..1 over questions answered at least once
  cardsDue: number;
  bestExam: number | null;  // best percentage
  lastExamPassed: boolean | null;
  examsTaken: number;
};

export function summarise(progress: Progress): Summary {
  const stats = chapterStats(progress);
  const totalBlocks = stats.reduce((n, s) => n + s.blocks, 0);
  const readBlocks = stats.reduce((n, s) => n + (s.done ? s.blocks : s.read), 0);

  const answers = Object.values(progress.answers);
  const correct = answers.filter((a) => a.correct).length;

  const now = Date.now();
  const cardsDue = Object.values(progress.cards)
    .filter((c) => new Date(c.dueAt).getTime() <= now).length;

  const exams = progress.exams;
  const last = exams.at(-1) ?? null;

  return {
    reading: totalBlocks ? readBlocks / totalBlocks : 0,
    chaptersDone: stats.filter((s) => s.fraction >= 0.999).length,
    chaptersTotal: stats.length,
    questionsSeen: answers.length,
    questionsCorrect: correct,
    accuracy: answers.length ? correct / answers.length : 0,
    cardsDue,
    bestExam: exams.length ? Math.max(...exams.map((e) => e.score)) : null,
    lastExamPassed: last ? last.passed : null,
    examsTaken: exams.length,
  };
}

/** Total number of flashcards available (review bank + exam items). */
export const totalCards = () => reviewItems.length + examItems.length;

export const displayName = (u: User) => u.name || u.email;
