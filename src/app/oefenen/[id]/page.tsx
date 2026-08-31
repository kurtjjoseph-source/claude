import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { resolveLang } from "@/lib/session-lang";
import { translator } from "@/lib/i18n";
import { bi, getChapter } from "@/lib/content";
import { questionsForChapter } from "@/lib/questions";
import { Quiz } from "@/components/Quiz";

export default async function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const lang = await resolveLang(user);
  const T = translator(lang);
  const chapter = getChapter(id);
  if (!chapter) notFound();
  const questions = questionsForChapter(id, lang);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="border-b border-[var(--color-rule)] pb-4">
        <Link href="/oefenen" className="text-sm text-[var(--color-accent)]">← {T("navPractice")}</Link>
        <h1 className="mt-2 text-xl font-semibold">{bi(chapter.title, lang)}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {questions.length} {T("reviewQuestions").toLowerCase()} ·{" "}
          <Link href={`/cursus/${id}`} className="text-[var(--color-accent)]">{T("navCourse")} →</Link>
        </p>
      </header>
      <Quiz questions={questions} lang={lang} />
    </div>
  );
}
