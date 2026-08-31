import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { resolveLang } from "@/lib/session-lang";
import { translator } from "@/lib/i18n";
import { examItems } from "@/lib/content";
import { Exam } from "@/components/Exam";
import { Badge } from "@/components/ui";

export default async function ExamPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const lang = await resolveLang(user);
  const T = translator(lang);
  const history = [...user.progress.exams].reverse().slice(0, 5);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">{T("navExam")}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {lang === "nl"
            ? "Het officiële examen van 150 vragen, gescoord volgens de norm van het examenbestuur."
            : "The official 150-question examination, scored to the examining board's rule."}
        </p>
      </header>

      {history.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            {lang === "nl" ? "Eerdere pogingen" : "Previous attempts"}
          </h2>
          <ul className="space-y-1 text-sm">
            {history.map((a) => (
              <li key={a.id} className="flex items-center gap-3">
                <span className="tabular-nums text-[var(--color-muted)]">
                  {new Date(a.finishedAt).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB")}
                </span>
                <span className="tabular-nums font-medium">{a.score}%</span>
                <Badge tone={a.passed ? "good" : "bad"}>
                  {a.passed ? T("passed") : T("failed")}
                </Badge>
                <span className="text-xs text-[var(--color-muted)]">
                  {a.scope === "full" ? (lang === "nl" ? "volledig" : "full") : `deel ${a.scope}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Exam items={examItems} lang={lang} />
    </div>
  );
}
