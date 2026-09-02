import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { read } from "@/lib/store";
import { resolveLang } from "@/lib/session-lang";
import { bi, getChapters, getModules } from "@/lib/content";
import { PrintControls } from "@/components/PrintControls";
import type { Lang } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * The whole course as one printable document. Printing to PDF from here is what
 * produces the offline copy: the layout is the same content the site serves, so
 * the PDF cannot drift from the web version.
 */
export default async function PrintPage(
  { searchParams }: { searchParams: Promise<{ taal?: string; deel?: string }> },
) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { taal, deel } = await searchParams;
  const fallback = await resolveLang(user);
  const lang: Lang = taal === "en" ? "en" : taal === "nl" ? "nl" : fallback;

  const errata = await read((db) => db.errata);
  const chapters = getChapters(errata).filter(
    (c) => c.kind === "text" && (!deel || c.module === deel));

  return (
    <div>
      <PrintControls lang={lang} deel={deel ?? ""} />

      <article className="prose-course mx-auto max-w-[46rem]">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-semibold">
            {lang === "nl"
              ? "Studiegids voor ministeriële licentie — Exhorter"
              : "Ministerial Licensure Study Guide — Exhorter"}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Church of God, Cleveland, Tennessee
            {lang === "nl" ? " · Nederlandse vertaling" : ""}
          </p>
        </header>

        {getModules().map((m) => {
          const inModule = chapters.filter((c) => c.module === m.id);
          if (!inModule.length) return null;
          return (
            <section key={m.id} className="page-break">
              <h2 className="mt-12 border-b border-[var(--color-rule)] pb-2 text-2xl font-semibold">
                {bi(m.title, lang)}
              </h2>
              {inModule.map((c) => (
                <section key={c.id} className="page-break">
                  <h3 className="mt-10 text-xl font-semibold">{bi(c.title, lang)}</h3>
                  <p className="mb-4 text-xs text-[var(--color-muted)]">
                    {lang === "nl" ? "Pagina" : "Page"} {c.pageStart}–{c.pageEnd}
                  </p>
                  {c.blocks.map((b) => {
                    const text = lang === "nl" ? (b.nl ?? b.en) : b.en;
                    const style = { marginLeft: `${Math.min(b.indent, 4) * 0.8}rem` };
                    switch (b.type) {
                      case "h1": return <h4 key={b.index} style={style}
                        className="mt-8 text-lg font-semibold">{text}</h4>;
                      case "h2": return <h5 key={b.index} style={style}
                        className="mt-6 font-semibold">{text}</h5>;
                      case "h3": return <h6 key={b.index} style={style}
                        className="mt-4 font-medium">{text}</h6>;
                      case "quote": return <blockquote key={b.index} style={style}
                        className="quote my-3">{text}</blockquote>;
                      case "note": return <p key={b.index} style={style}
                        className="mt-3 text-xs text-[var(--color-muted)]">{text}</p>;
                      default: return <p key={b.index} style={style}>{text}</p>;
                    }
                  })}
                </section>
              ))}
            </section>
          );
        })}
      </article>
    </div>
  );
}
