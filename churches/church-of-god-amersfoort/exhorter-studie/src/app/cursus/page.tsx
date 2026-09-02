import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { read } from "@/lib/store";
import { resolveLang } from "@/lib/session-lang";
import { translator } from "@/lib/i18n";
import { bi, examItemsForChapter, getChapters, getModules } from "@/lib/content";
import { chapterStats } from "@/lib/progress";
import { ProgressBar } from "@/components/ui";

export default async function CoursePage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const lang = await resolveLang(user);
  const T = translator(lang);
  const errata = await read((db) => db.errata);
  const chapters = getChapters(errata);
  const stats = new Map(chapterStats(user.progress).map((c) => [c.id, c]));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{T("navCourse")}</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {lang === "nl"
              ? "De volledige studiegids, opgesplitst in modules en hoofdstukken."
              : "The complete study guide, split into modules and chapters."}
          </p>
        </div>
        <Link href="/print" className="no-print text-sm font-medium text-[var(--color-accent)]">
          {T("navPrint")} →
        </Link>
      </header>

      {getModules().map((m) => {
        const inModule = chapters.filter((c) => c.module === m.id);
        if (!inModule.length) return null;
        return (
          <section key={m.id}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {bi(m.title, lang)}
            </h2>
            <ul className="space-y-2">
              {inModule.map((c) => {
                const st = stats.get(c.id);
                const exams = examItemsForChapter(c.id).length;
                return (
                  <li key={c.id}>
                    <Link href={`/cursus/${c.id}`}
                          className="block rounded border border-[var(--color-rule)] px-4 py-3
                                     transition-colors hover:border-[var(--color-accent)]">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="font-medium">{bi(c.title, lang)}</span>
                        <span className="text-xs text-[var(--color-muted)]">
                          {T("page")} {c.pageStart}–{c.pageEnd}
                        </span>
                        {c.kind === "bank" && (
                          <span className="text-xs text-[var(--color-muted)]">· {T("reviewQuestions")}</span>
                        )}
                        {exams > 0 && (
                          <span className="text-xs text-[var(--color-accent)]">
                            · {exams} {lang === "nl" ? "examenvragen" : "exam questions"}
                          </span>
                        )}
                        <span className="ml-auto text-xs text-[var(--color-muted)]">
                          {Math.round(c.translated * 100)}% {T("translated")}
                        </span>
                      </div>
                      {c.kind === "text" && (
                        <div className="mt-2"><ProgressBar value={st?.fraction ?? 0} /></div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
