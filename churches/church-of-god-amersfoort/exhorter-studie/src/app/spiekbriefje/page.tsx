import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { resolveLang } from "@/lib/session-lang";
import { translator } from "@/lib/i18n";
import { bi, getChapters, getModules, reviewItems } from "@/lib/content";
import { glossary, sortedScriptures } from "@/lib/reference";

const pick = (v: { en: string; nl: string }, lang: "nl" | "en") =>
  (lang === "nl" && v.nl ? v.nl : v.en);

/**
 * One page holding everything worth memorising: the facts the guide's own
 * review questions turn on, the glossary in brief, and every scripture cited.
 * Built to be printed.
 */
export default async function CheatSheetPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const lang = await resolveLang(user);
  const T = translator(lang);
  const chapters = getChapters();
  const titles = Object.fromEntries(chapters.map((c) => [c.id, c.title]));
  const refs = sortedScriptures();

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{T("navCheatsheet")}</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {lang === "nl"
              ? "Alle kernwoorden, feiten en schriftverwijzingen op één plek. Geschikt om af te drukken."
              : "Every key word, fact and scripture reference in one place. Made to print."}
          </p>
        </div>
        <Link href="/print"
              className="no-print rounded border border-[var(--color-rule)] px-3 py-1.5 text-sm">
          {T("navPrint")}
        </Link>
      </header>

      {getModules().map((m) => {
        const items = reviewItems.filter((r) => r.module === m.id);
        if (!items.length) return null;
        const sections = [...new Set(items.map((i) => i.section))];
        return (
          <section key={m.id} className="page-break">
            <h2 className="mb-3 border-b border-[var(--color-rule)] pb-1 text-lg font-semibold">
              {bi(m.title, lang)}
            </h2>
            {sections.map((section) => (
              <div key={section} className="mb-5">
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide
                               text-[var(--color-muted)]">{section}</h3>
                <ul className="space-y-1 text-sm">
                  {items.filter((i) => i.section === section).map((i) => (
                    <li key={i.id} className="flex gap-2">
                      <span className="min-w-0 flex-1">{pick(i.q, lang)}</span>
                      <strong className="shrink-0 text-[var(--color-accent)]">{pick(i.a, lang)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        );
      })}

      <section className="page-break">
        <h2 className="mb-3 border-b border-[var(--color-rule)] pb-1 text-lg font-semibold">
          {T("keywords")} ({glossary.length})
        </h2>
        <dl className="grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
          {glossary.map((t) => (
            <div key={t.id}>
              <dt className="inline font-medium">{pick(t.term, lang)} — </dt>
              <dd className="inline text-[var(--color-muted)]">
                {pick(t.definition, lang).slice(0, 150)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="page-break">
        <h2 className="mb-3 border-b border-[var(--color-rule)] pb-1 text-lg font-semibold">
          {T("scriptures")} ({refs.length})
        </h2>
        <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
          {refs.map((s) => (
            <li key={s.ref}>
              <Link href={`/cursus/${s.occurrences[0]!.chapter}?blok=${s.occurrences[0]!.block}`}
                    className="hover:text-[var(--color-accent)]">
                {s.ref}
                <span className="ml-1 text-xs text-[var(--color-muted)]">
                  p{s.occurrences[0]!.page}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
