import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { resolveLang } from "@/lib/session-lang";
import { translator } from "@/lib/i18n";
import { glossary } from "@/lib/reference";
import { getChapters } from "@/lib/content";
import { GlossaryList } from "@/components/GlossaryList";

export default async function GlossaryPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const lang = await resolveLang(user);
  const T = translator(lang);
  const titles = Object.fromEntries(getChapters().map((c) => [c.id, c.title]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{T("navGlossary")}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {lang === "nl"
            ? `${glossary.length} kernwoorden uit de studiegids, met een definitie en een link naar elke plaats waar het woord voorkomt.`
            : `${glossary.length} key words from the study guide, each with a definition and links to every place it occurs.`}
        </p>
      </header>
      <GlossaryList terms={glossary} lang={lang} titles={titles} />
    </div>
  );
}
