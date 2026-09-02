import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { resolveLang } from "@/lib/session-lang";
import { translator } from "@/lib/i18n";
import { buildDeck, dueCards } from "@/lib/flashcards";
import { Flashcards } from "@/components/Flashcards";

export default async function FlashcardsPage(
  { searchParams }: { searchParams: Promise<{ deel?: string }> },
) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { deel } = await searchParams;
  const lang = await resolveLang(user);
  const T = translator(lang);

  const all = buildDeck(lang);
  const deck = deel ? all.filter((c) => c.deck === deel) : all;
  const due = dueCards(deck, user.progress);

  const decks: [string, string][] = [
    ["", lang === "nl" ? "Alles" : "All"],
    ["part1", lang === "nl" ? "Deel I — Bijbel" : "Part I — Bible"],
    ["part2", lang === "nl" ? "Deel II — Geschiedenis" : "Part II — History"],
    ["part3", lang === "nl" ? "Deel III — Leer" : "Part III — Doctrine"],
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{T("navFlashcards")}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {lang === "nl"
            ? `${all.length} kaarten uit de herhalingsvragen en het examen. Kaarten die je fout hebt, komen vaker terug.`
            : `${all.length} cards from the review questions and the exam. Cards you get wrong come back sooner.`}
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 text-sm">
        {decks.map(([id, label]) => (
          <a key={id} href={id ? `/flashcards?deel=${id}` : "/flashcards"}
             className={`rounded border px-3 py-1 ${
               (deel ?? "") === id
                 ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                 : "border-[var(--color-rule)] text-[var(--color-muted)]"}`}>
            {label}
          </a>
        ))}
      </nav>

      <Flashcards cards={due} lang={lang} />
    </div>
  );
}
