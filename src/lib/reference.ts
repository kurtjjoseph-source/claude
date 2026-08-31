import glossaryData from "@/../content/glossary.json";
import scriptureData from "@/../content/scriptures.json";

export type Occurrence = { chapter: string; block: number; page: number };

export type GlossaryTerm = {
  id: string;
  term: { en: string; nl: string };
  definition: { en: string; nl: string };
  questions: string[];
  occurrences: Occurrence[];
  module: string;
};

export type ScriptureRef = {
  ref: string;
  count: number;
  occurrences: Occurrence[];
  modules: string[];
};

export const glossary = (glossaryData as { terms: GlossaryTerm[] }).terms;
export const scriptures = (scriptureData as { refs: ScriptureRef[] }).refs;

/** Sort scripture references into canonical book order for the cheat sheet. */
const BOOK_ORDER = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
  "Nehemiah", "Esther", "Job", "Psalm", "Psalms", "Proverbs", "Ecclesiastes",
  "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea",
  "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai",
  "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
  "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians",
  "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon",
  "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation",
];

function parseRef(ref: string) {
  const m = /^(.*?)\s+(\d+):(\d+)/.exec(ref);
  if (!m) return { book: ref, chapter: 0, verse: 0 };
  return { book: m[1]!, chapter: Number(m[2]), verse: Number(m[3]) };
}

export function sortedScriptures(): ScriptureRef[] {
  return [...scriptures].sort((a, b) => {
    const pa = parseRef(a.ref), pb = parseRef(b.ref);
    const ia = BOOK_ORDER.indexOf(pa.book), ib = BOOK_ORDER.indexOf(pb.book);
    if (ia !== ib) return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    if (pa.chapter !== pb.chapter) return pa.chapter - pb.chapter;
    return pa.verse - pb.verse;
  });
}
