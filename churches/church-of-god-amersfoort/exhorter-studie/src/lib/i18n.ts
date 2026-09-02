import type { Lang } from "@/lib/types";

/**
 * Interface strings. Dutch is the primary language of the platform; English is
 * kept complete so a student can switch mid-sentence and lose nothing.
 */
const STRINGS = {
  appName:        { nl: "Exhorter Studie",              en: "Exhorter Study" },
  tagline:        { nl: "Studiegids voor ministeriële licentie — Church of God",
                    en: "Ministerial Licensure Study Guide — Church of God" },

  // navigation
  navHome:        { nl: "Overzicht",        en: "Overview" },
  navCourse:      { nl: "Cursus",           en: "Course" },
  navCheatsheet:  { nl: "Spiekbriefje",     en: "Cheat sheet" },
  navGlossary:    { nl: "Woordenlijst",     en: "Glossary" },
  navFlashcards:  { nl: "Flashcards",       en: "Flashcards" },
  navPractice:    { nl: "Oefenen",          en: "Practice" },
  navExam:        { nl: "Examen",           en: "Exam" },
  navProfile:     { nl: "Profiel",          en: "Profile" },
  navAdmin:       { nl: "Beheer",           en: "Admin" },
  navPrint:       { nl: "Afdrukken / PDF",  en: "Print / PDF" },
  logout:         { nl: "Uitloggen",        en: "Sign out" },

  // auth
  signIn:         { nl: "Inloggen",         en: "Sign in" },
  signUp:         { nl: "Account aanmaken", en: "Create account" },
  email:          { nl: "E-mailadres",      en: "Email" },
  password:       { nl: "Wachtwoord",       en: "Password" },
  name:           { nl: "Naam",             en: "Name" },
  firstUserAdmin: { nl: "Dit is het eerste account: het wordt de beheerder van deze site.",
                    en: "This is the first account, so it becomes the administrator of this site." },
  inviteOnly:     { nl: "Registratie is alleen op uitnodiging. Vraag de beheerder om een uitnodiging.",
                    en: "Registration is by invitation only. Ask the administrator for an invitation." },

  // reading
  readingProgress:{ nl: "Leesvoortgang",    en: "Reading progress" },
  markRead:       { nl: "Markeer als gelezen", en: "Mark as read" },
  markUnread:     { nl: "Markeer als ongelezen", en: "Mark as unread" },
  chapterDone:    { nl: "Hoofdstuk afgerond", en: "Chapter complete" },
  page:           { nl: "Pagina",           en: "Page" },
  showBothLangs:  { nl: "Toon beide talen", en: "Show both languages" },
  notTranslated:  { nl: "Nog niet vertaald — Engelse brontekst",
                    en: "Not yet translated — English source text" },
  translated:     { nl: "vertaald",         en: "translated" },
  summary:        { nl: "Samenvatting",     en: "Summary" },
  keywords:       { nl: "Kernwoorden",      en: "Key words" },
  scriptures:     { nl: "Schriftgedeelten", en: "Scriptures" },
  examLinks:      { nl: "Examenvragen uit dit hoofdstuk", en: "Exam questions from this chapter" },

  // questions
  reviewQuestions:{ nl: "Herhalingsvragen", en: "Review questions" },
  check:          { nl: "Controleer",       en: "Check" },
  next:           { nl: "Volgende",         en: "Next" },
  previous:       { nl: "Vorige",           en: "Previous" },
  correct:        { nl: "Goed",             en: "Correct" },
  incorrect:      { nl: "Fout",             en: "Incorrect" },
  showAnswer:     { nl: "Toon antwoord",    en: "Show answer" },
  sourceIsHere:   { nl: "Bron van het antwoord", en: "Source of the answer" },
  openSource:     { nl: "Open in de cursus", en: "Open in the course" },
  score:          { nl: "Score",            en: "Score" },
  passed:         { nl: "Geslaagd",         en: "Passed" },
  failed:         { nl: "Niet geslaagd",    en: "Failed" },
  startExam:      { nl: "Start examen",     en: "Start exam" },
  submitExam:     { nl: "Examen inleveren", en: "Submit exam" },
  passRule:       { nl: "Slagen vereist gemiddeld 70% over alle delen én minimaal 60% per deel.",
                    en: "Passing requires an average of 70% across all parts and at least 60% in each part." },

  // flashcards
  again:          { nl: "Opnieuw",          en: "Again" },
  good:           { nl: "Goed",             en: "Good" },
  easy:           { nl: "Makkelijk",        en: "Easy" },
  due:            { nl: "Te herhalen",      en: "Due" },
  noCardsDue:     { nl: "Geen kaarten te herhalen. Kom later terug.",
                    en: "No cards due. Come back later." },
  flip:           { nl: "Draai om",         en: "Flip" },

  // admin
  users:          { nl: "Gebruikers",       en: "Users" },
  invitations:    { nl: "Uitnodigingen",    en: "Invitations" },
  errata:         { nl: "Errata",           en: "Errata" },
  overview:       { nl: "Overzicht",        en: "Overview" },
  invite:         { nl: "Uitnodigen",       en: "Invite" },
  role:           { nl: "Rol",              en: "Role" },
  admin:          { nl: "Beheerder",        en: "Administrator" },
  student:        { nl: "Student",          en: "Student" },
  save:           { nl: "Opslaan",          en: "Save" },
  cancel:         { nl: "Annuleren",        en: "Cancel" },
  delete:         { nl: "Verwijderen",      en: "Delete" },
  copyLink:       { nl: "Kopieer link",     en: "Copy link" },

  // misc
  settings:       { nl: "Instellingen",     en: "Settings" },
  language:       { nl: "Taal",             en: "Language" },
  theme:          { nl: "Thema",            en: "Theme" },
  textSize:       { nl: "Tekstgrootte",     en: "Text size" },
  of:             { nl: "van",              en: "of" },
  search:         { nl: "Zoeken",           en: "Search" },
  back:           { nl: "Terug",            en: "Back" },
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(key: StringKey, lang: Lang): string {
  return STRINGS[key][lang];
}

/** Bound translator, so components read `T("navCourse")`. */
export const translator = (lang: Lang) => (key: StringKey) => t(key, lang);
