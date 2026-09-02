import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { resolveLang } from "@/lib/session-lang";
import { translator } from "@/lib/i18n";
import { bi, getModules, readingChapters } from "@/lib/content";
import { chaptersWithQuestions } from "@/lib/questions";
import { Badge } from "@/components/ui";

export default async function PracticeIndex() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const lang = await resolveLang(user);
  const T = translator(lang);
  const counts = chaptersWithQuestions();
  const chapters = readingChapters();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">{T("navPractice")}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {lang === "nl"
            ? "Meerkeuzevragen per hoofdstuk, gebouwd op de herhalingsvragen uit de studiegids. Na elk antwoord kun je direct naar de passage waar het antwoord staat."
            : "Multiple-choice questions per chapter, built from the study guide's own review questions. After each answer you can jump straight to the passage that states it."}
        </p>
      </header>

      {getModules().map((m) => {
        const inModule = chapters.filter((c) => c.module === m.id && counts.get(c.id));
        if (!inModule.length) return null;
        return (
          <section key={m.id}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {bi(m.title, lang)}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {inModule.map((c) => {
                const answered = Object.keys(user.progress.answers);
                const n = counts.get(c.id) ?? 0;
                const seen = answered.filter((id) => id.startsWith("bank")).length;
                return (
                  <li key={c.id}>
                    <Link href={`/oefenen/${c.id}`}
                          className="flex items-center gap-3 rounded border border-[var(--color-rule)]
                                     px-4 py-3 text-sm transition-colors hover:border-[var(--color-accent)]">
                      <span className="min-w-0 flex-1 truncate">{bi(c.title, lang)}</span>
                      <Badge>{n}</Badge>
                      {seen > 0 && <span className="sr-only">{seen}</span>}
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
