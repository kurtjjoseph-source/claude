import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { resolveLang } from "@/lib/session-lang";
import { translator } from "@/lib/i18n";
import { summarise } from "@/lib/progress";
import { Card, ProgressBar, Stat } from "@/components/ui";
import { SettingsForm } from "@/components/SettingsForm";

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const lang = await resolveLang(user);
  const T = translator(lang);
  const s = summarise(user.progress);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">{user.name}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {user.email} · {user.role === "admin" ? T("admin") : T("student")}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {T("readingProgress")}
        </h2>
        <ProgressBar value={s.reading}
                     label={`${s.chaptersDone}/${s.chaptersTotal} ${lang === "nl" ? "hoofdstukken afgerond" : "chapters complete"}`} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={lang === "nl" ? "Vragen" : "Questions"} value={s.questionsSeen} />
          <Stat label={lang === "nl" ? "Goed" : "Correct"} value={`${Math.round(s.accuracy * 100)}%`} />
          <Stat label={T("due")} value={s.cardsDue} />
          <Stat label={lang === "nl" ? "Examens" : "Exams"}
                value={s.bestExam === null ? "—" : `${s.bestExam}%`} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {T("settings")}
        </h2>
        <Card><SettingsForm settings={user.settings} lang={lang} /></Card>
      </section>
    </div>
  );
}
