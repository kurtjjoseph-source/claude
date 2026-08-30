/**
 * Content model for the Exhorter course.
 *
 * Everything the learner reads is bilingual: every human-readable string is a
 * `Bi` pair. Dutch is the primary language of this platform (the course was
 * translated for a Dutch-speaking congregation); English is kept alongside so a
 * student can check a term against the wording of the English exam.
 */
export type Lang = "nl" | "en";

/** A string in both languages. */
export type Bi = { nl: string; en: string };

/** Bible book/chapter/verse reference, e.g. "Romeinen 8:7" / "Romans 8:7". */
export type ScriptureRef = {
  /** Stable id used for cross-linking, e.g. "rom-8-7". */
  id: string;
  /** Reference as displayed, per language. */
  ref: Bi;
  /** Verse text. Dutch is Herziene Statenvertaling (HSV); English is KJV. */
  text: Bi;
  /** Why this passage matters in the course. */
  note?: Bi;
};

/**
 * One teachable statement. Key points are the atoms of the course: chapters are
 * built from them, exam questions cite them, and the reader's highlight anchor
 * (`?kp=<id>`) points at one.
 */
export type KeyPoint = {
  /** Stable id, e.g. "p1c1-identity". Used as the highlight anchor. */
  id: string;
  text: Bi;
  /** Scripture ids supporting this point. */
  scriptures?: string[];
  /** Position in the official exam this point answers, e.g. "I.2". */
  examRef?: string;
};

/** A term the student must be able to define. */
export type Keyword = {
  /** Stable id, e.g. "rechtvaardiging". */
  id: string;
  term: Bi;
  definition: Bi;
  scriptures?: string[];
};

export type Choice = {
  key: "A" | "B" | "C" | "D" | "E";
  text: Bi;
};

export type Question = {
  id: string;
  prompt: Bi;
  choices: Choice[];
  answer: Choice["key"];
  /** Shown after answering. */
  explanation: Bi;
  /** Key point whose text contains the answer; highlighted in review. */
  sourceKeyPoint: string;
  /** Chapter the source key point lives in. */
  sourceChapter: string;
};

export type Chapter = {
  /** Stable id, e.g. "p1c3". */
  id: string;
  /** Chapter number within its module. */
  number: number;
  title: Bi;
  /** Which official exam items this chapter covers, e.g. "I.13–I.17". */
  examRange: string;
  summary: Bi;
  keyPoints: KeyPoint[];
  keywords: Keyword[];
  /** Scripture ids read in this chapter, in reading order. */
  scriptures: string[];
  /** Multiple-choice review questions for this chapter. */
  review: Question[];
};

export type Module = {
  /** Stable id: "part1" | "part2" | "part3". */
  id: string;
  number: number;
  title: Bi;
  subtitle: Bi;
  intro: Bi;
  chapters: Chapter[];
};

export type Course = {
  title: Bi;
  subtitle: Bi;
  modules: Module[];
  scriptures: Record<string, ScriptureRef>;
};
