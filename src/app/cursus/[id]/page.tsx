import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { read } from "@/lib/store";
import { resolveLang } from "@/lib/session-lang";
import { translator } from "@/lib/i18n";
import { bi, examItemsForChapter, getChapter, readingChapters } from "@/lib/content";
import { Reader } from "@/components/Reader";
import { Badge } from "@/components/ui";

export default async function ChapterPage(
  { params, searchParams }: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ blok?: string }>;
  },
) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const { blok } = await searchParams;
  const lang = await resolveLang(user);
  const T = translator(lang);

  const errata = await read((db) => db.errata);
  const chapter = getChapter(id, errata);
  if (!chapter) notFound();

  const order = readingChapters();
  const position = order.findIndex((c) => c.id === id);
  const prev = position > 0 ? order[position - 1] : null;
  const next = position >= 0 && position < order.length - 1 ? order[position + 1] : null;

  const entry = user.progress.chapters[id];
  const examQuestions = examItemsForChapter(id);
  const highlight = blok !== undefined && blok !== "" ? Number(blok) : undefined;

  return (
    <div className="space-y-6">
      <header className="border-b border-[var(--color-rule)] pb-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Link href="/cursus" className="no-print text-sm text-[var(--color-accent)]">
            ← {T("navCourse")}
          </Link>
          <span className="text-xs text-[var(--color-muted)]">
            {T("page")} {chapter.pageStart}–{chapter.pageEnd}
          </span>
          {chapter.translated < 0.999 && (
            <Badge tone="warn">
              {Math.round(chapter.translated * 100)}% {T("translated")}
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-semibold">{bi(chapter.title, lang)}</h1>
      </header>

      {examQuestions.length > 0 && (
        <details className="no-print rounded border border-[var(--color-rule)] px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium">
            {T("examLinks")} ({examQuestions.length})
          </summary>
          <ul className="mt-3 space-y-2 text-sm">
            {examQuestions.map((q) => (
              <li key={q.id} className="flex gap-2">
                <span className="shrink-0 font-mono text-xs text-[var(--color-muted)]">
                  {q.part}.{q.n}
                </span>
                <Link href={`/cursus/${id}?blok=${q.source!.block}`}
                      className="text-[var(--color-accent)] hover:underline">
                  {bi(q.prompt, lang) || `${q.part}.${q.n}`}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}

      <Reader chapterId={chapter.id} blocks={chapter.blocks} lang={lang}
              bilingual={user.settings.bilingual}
              alreadyRead={entry?.read ?? []} done={entry?.done ?? false}
              highlight={Number.isFinite(highlight) ? highlight : undefined} />

      <nav className="no-print flex justify-between border-t border-[var(--color-rule)] pt-4 text-sm">
        {prev
          ? <Link href={`/cursus/${prev.id}`} className="text-[var(--color-accent)]">
              ← {bi(prev.title, lang)}
            </Link>
          : <span />}
        {next
          ? <Link href={`/cursus/${next.id}`} className="text-right text-[var(--color-accent)]">
              {bi(next.title, lang)} →
            </Link>
          : <span />}
      </nav>
    </div>
  );
}
