import Link from "next/link";
import type { Lang, User } from "@/lib/types";
import { translator } from "@/lib/i18n";
import { LangSwitch } from "./LangSwitch";

/** Site chrome: masthead, primary navigation, language switch. */
export function Shell({ user, lang, children }:
  { user: User | null; lang: Lang; children: React.ReactNode }) {
  const T = translator(lang);
  const nav: [string, string][] = [
    ["/", T("navHome")],
    ["/cursus", T("navCourse")],
    ["/oefenen", T("navPractice")],
    ["/flashcards", T("navFlashcards")],
    ["/examen", T("navExam")],
    ["/spiekbriefje", T("navCheatsheet")],
    ["/woordenlijst", T("navGlossary")],
  ];
  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-30 border-b border-[var(--color-rule)]
                         bg-[var(--color-paper)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          <Link href="/" className="font-semibold tracking-tight">{T("appName")}</Link>
          {user && (
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {nav.slice(1).map(([href, label]) => (
                <Link key={href} href={href}
                      className="text-[var(--color-muted)] hover:text-[var(--color-accent)]">
                  {label}
                </Link>
              ))}
              {user.role === "admin" && (
                <Link href="/beheer" className="text-[var(--color-muted)] hover:text-[var(--color-accent)]">
                  {T("navAdmin")}
                </Link>
              )}
            </nav>
          )}
          <div className="ml-auto flex items-center gap-3 text-sm">
            <LangSwitch lang={lang} />
            {user ? (
              <>
                <Link href="/profiel" className="text-[var(--color-muted)] hover:text-[var(--color-accent)]">
                  {user.name}
                </Link>
                <form action="/api/auth/logout" method="post">
                  <button className="text-[var(--color-muted)] hover:text-[var(--color-accent)]">
                    {T("logout")}
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="font-medium text-[var(--color-accent)]">{T("signIn")}</Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="no-print mx-auto max-w-6xl px-4 pb-10 pt-4 text-xs text-[var(--color-muted)]">
        <p>
          Studiemateriaal © Church of God Ministerial Development, Cleveland, Tennessee.
          Deze vertaling is een studiehulp voor intern gebruik.
        </p>
      </footer>
    </div>
  );
}
