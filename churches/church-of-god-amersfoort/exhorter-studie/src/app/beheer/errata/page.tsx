import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { read } from "@/lib/store";
import { resolveLang } from "@/lib/session-lang";
import { translator } from "@/lib/i18n";
import { bi, getChapter, getChapters } from "@/lib/content";
import { AdminNav } from "@/components/AdminNav";
import { ErrataEditor } from "@/components/admin/ErrataEditor";

export default async function AdminErrata(
  { searchParams }: { searchParams: Promise<{ h?: string; q?: string }> },
) {
  const me = await currentUser();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/");
  const { h, q } = await searchParams;
  const lang = await resolveLang(me);
  const T = translator(lang);

  const errata = await read((db) => db.errata);
  const chapters = getChapters(errata);
  const chapterId = h ?? chapters[0]?.id ?? "";
  const chapter = getChapter(chapterId, errata);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{T("errata")}</h1>
      <AdminNav lang={lang} active="/beheer/errata" />
      <p className="text-sm text-[var(--color-muted)]">
        {lang === "nl"
          ? "Corrigeer de cursustekst of de Nederlandse vertaling. Wijzigingen worden direct toegepast, zonder nieuwe deploy, en overleven een herbouw van de inhoud."
          : "Correct the course text or its Dutch translation. Changes apply immediately, without a redeploy, and survive a rebuild of the content."}
      </p>
      {chapter && (
        <ErrataEditor
          lang={lang}
          query={q ?? ""}
          chapters={chapters.map((c) => ({ id: c.id, title: bi(c.title, lang),
                                           translated: c.translated }))}
          chapter={{
            id: chapter.id,
            blocks: chapter.blocks.map((b) => ({
              index: b.index, type: b.type, page: b.page, en: b.en, nl: b.nl,
            })),
          }}
          errata={errata.filter((e) => e.chapterId === chapter.id)}
        />
      )}
    </div>
  );
}
