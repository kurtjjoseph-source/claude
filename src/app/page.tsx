import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { resolveLang } from "@/lib/session-lang";
import { translator } from "@/lib/i18n";
import { bi, getModules, readingChapters, translationCoverage } from "@/lib/content";
import { chapterStats, summarise, totalCards } from "@/lib/progress";
import { Card, ProgressBar, Stat } from "@/components/ui";

export default async function HomePage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const lang = await resolveLang(user);
  const T = translator(lang);

  const s = summarise(user.progress);
  const stats = new Map(chapterStats(user.progress).map((c) => [c.id, c]));
  const chapters = readingChapters();
  const coverage = translationCoverage();

  const modules = getModules().filter((m) => chapters.some((c) => c.module === m.id));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">
          {lang === "nl" ? `Welkom, ${user.name}` : `Welcome, ${user.name}`}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{T("tagline")}</p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={T("readingProgress")} value={`${Math.round(s.reading * 100)}%`}
              sub={`${s.chaptersDone}/${s.chaptersTotal} ${lang === "nl" ? "hoofdstukken" : "chapters"}`} />
        <Stat label={lang === "nl" ? "Vragen goed" : "Questions correct"}
              value={`${Math.round(s.accuracy * 100)}%`}
              sub={`${s.questionsCorrect}/${s.questionsSeen}`} />
        <Stat label={T("due")} value={s.cardsDue}
              sub={`${totalCards()} ${lang === "nl" ? "kaarten totaal" : "cards total"}`} />
        <Stat label={lang === "nl" ? "Beste examen" : "Best exam"}
              value={s.bestExam === null ? "—" : `${s.bestExam}%`}
              sub={`${s.examsTaken}× ${lang === "nl" ? "afgelegd" : "taken"}`} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["/cursus", T("navCourse"), lang === "nl"
            ? "Lees de volledige cursus, hoofdstuk voor hoofdstuk."
            : "Read the full course, chapter by chapter."],
          ["/oefenen", T("navPractice"), lang === "nl"
            ? "Herhalingsvragen per hoofdstuk, met de bron van elk antwoord."
            : "Review questions per chapter, with the source of each answer."],
          ["/examen", T("navExam"), lang === "nl"
            ? "Oefenexamen van 150 vragen, gescoord volgens de officiële norm."
            : "150-question practice exam, scored to the official rule."],
        ].map(([href, title, blurb]) => (
          <Link key={href} href={href!} className="block">
            <Card className="h-full transition-colors hover:border-[var(--color-accent)]">
              <h2 className="font-medium">{title}</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{blurb}</p>
            </Card>
          </Link>
        ))}
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-medium">{T("navCourse")}</h2>
        {modules.map((m) => (
          <div key={m.id}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {bi(m.title, lang)}
            </h3>
            <ul className="space-y-2">
              {chapters.filter((c) => c.module === m.id).map((c) => {
                const st = stats.get(c.id);
                return (
                  <li key={c.id}>
                    <Link href={`/cursus/${c.id}`}
                          className="flex items-center gap-4 rounded border border-[var(--color-rule)]
                                     px-4 py-3 transition-colors hover:border-[var(--color-accent)]">
                      <span className="min-w-0 flex-1 truncate text-sm">{bi(c.title, lang)}</span>
                      <span className="hidden shrink-0 text-xs text-[var(--color-muted)] sm:block">
                        {T("page")} {c.pageStart}–{c.pageEnd}
                      </span>
                      <span className="w-24 shrink-0">
                        <ProgressBar value={st?.fraction ?? 0} />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      {coverage < 0.999 && (
        <p className="rounded border border-[var(--color-rule)] px-4 py-3 text-sm text-[var(--color-muted)]">
          {lang === "nl"
            ? `Nederlandse vertaling: ${Math.round(coverage * 100)}% gereed. Nog niet vertaalde
               alinea's worden in het Engels getoond en zijn als zodanig gemarkeerd.`
            : `Dutch translation: ${Math.round(coverage * 100)}% complete. Untranslated paragraphs
               are shown in English and marked as such.`}
        </p>
      )}
    </div>
  );
}
