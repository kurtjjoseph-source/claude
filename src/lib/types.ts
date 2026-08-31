/** Domain types shared by the server and the client components. */

export type Lang = "nl" | "en";
export type Role = "admin" | "student";

/** Per-chapter reading state. Blocks are stored as a sorted list of indices. */
export type ChapterProgress = {
  read: number[];
  /** Marked complete by the student, independent of blocks read. */
  done: boolean;
  updatedAt: string;
};

/** One answered question, whether from a review set or a practice exam. */
export type AnswerRecord = {
  correct: boolean;
  attempts: number;
  /** Last option the student chose. */
  chose: string;
  lastAt: string;
};

/** Leitner box scheduling for a flashcard. */
export type CardState = {
  box: number;        // 1..5; higher means seen less often
  dueAt: string;
  lapses: number;
};

export type ExamAttempt = {
  id: string;
  startedAt: string;
  finishedAt: string;
  /** "full" = all three parts; otherwise the part sat. */
  scope: "full" | "I" | "II" | "III";
  perPart: Record<string, { correct: number; total: number }>;
  score: number;      // percentage across the attempt
  passed: boolean;
  /** questionId -> option chosen. */
  answers: Record<string, string>;
};

export type Progress = {
  chapters: Record<string, ChapterProgress>;
  answers: Record<string, AnswerRecord>;
  cards: Record<string, CardState>;
  exams: ExamAttempt[];
};

export type Settings = {
  lang: Lang;
  /** Show the other language underneath the primary one while reading. */
  bilingual: boolean;
  theme: "light" | "dark" | "system";
  fontScale: number;   // 1 = default
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastSeenAt: string;
  disabled?: boolean;
  settings: Settings;
  progress: Progress;
};

export type Invitation = {
  token: string;
  email: string;
  role: Role;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  /** Set when the mail could not be delivered, so the admin can copy the link. */
  deliveryError?: string;
};

/** An admin correction to the course text, applied over the built content. */
export type Erratum = {
  id: string;
  chapterId: string;
  blockIndex: number;
  lang: Lang;
  text: string;
  note: string;
  editedBy: string;
  editedAt: string;
};

export type Db = {
  users: User[];
  invitations: Invitation[];
  errata: Erratum[];
};

export const emptyProgress = (): Progress => ({
  chapters: {}, answers: {}, cards: {}, exams: [],
});

export const defaultSettings = (): Settings => ({
  lang: "nl", bilingual: false, theme: "system", fontScale: 1,
});
