import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { read } from "@/lib/store";
import { resolveLang } from "@/lib/session-lang";
import { translator } from "@/lib/i18n";
import { summarise } from "@/lib/progress";
import { readingChapters, translationCoverage } from "@/lib/content";
import { AdminNav } from "@/components/AdminNav";
import { Badge, ProgressBar, Stat } from "@/components/ui";

/** Everyone's progress at a glance, which is what an overseer actually needs. */
export default async function AdminOverview() {
  const me = await currentUser();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/");
  const lang = await resolveLang(me);
  const T = translator(lang);

  const { users, invitations, errata } = await read((db) => ({
    users: db.users, invitations: db.invitations, errata: db.errata,
  }));

  const rows = users.map((u) => ({ user: u, stats: summarise(u.progress) }))
                    .sort((a, b) => b.stats.reading - a.stats.reading);
  const active = rows.filter((r) => r.stats.reading > 0).length;
  const passing = rows.filter((r) => (r.stats.bestExam ?? 0) >= 70).length;
  const pending = invitations.filter((i) => !i.acceptedAt).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{T("navAdmin")}</h1>
      <AdminNav lang={lang} active="/beheer" />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label={T("users")} value={users.length} sub={`${active} ${lang === "nl" ? "actief" : "active"}`} />
        <Stat label={lang === "nl" ? "Uitnodigingen open" : "Invitations open"} value={pending} />
        <Stat label={lang === "nl" ? "Haalt 70%+" : "Scoring 70%+"} value={passing} />
        <Stat label={T("errata")} value={errata.length} />
        <Stat label={lang === "nl" ? "Vertaald" : "Translated"}
              value={`${Math.round(translationCoverage() * 100)}%`}
              sub={`${readingChapters().length} ${lang === "nl" ? "hoofdstukken" : "chapters"}`} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {lang === "nl" ? "Voortgang per gebruiker" : "Progress per user"}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-[var(--color-muted)]">
              <tr className="border-b border-[var(--color-rule)]">
                <th className="py-2 pr-3 font-medium">{lang === "nl" ? "Naam" : "Name"}</th>
                <th className="py-2 pr-3 font-medium">{T("readingProgress")}</th>
                <th className="py-2 pr-3 font-medium">{lang === "nl" ? "Vragen" : "Questions"}</th>
                <th className="py-2 pr-3 font-medium">{lang === "nl" ? "Goed" : "Correct"}</th>
                <th className="py-2 pr-3 font-medium">{lang === "nl" ? "Beste examen" : "Best exam"}</th>
                <th className="py-2 pr-3 font-medium">{lang === "nl" ? "Laatst actief" : "Last seen"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ user, stats }) => (
                <tr key={user.id} className="border-b border-[var(--color-rule)]">
                  <td className="py-2 pr-3">
                    <span className="font-medium">{user.name}</span>
                    {user.role === "admin" && <Badge>{T("admin")}</Badge>}
                    {user.disabled && <Badge tone="bad">off</Badge>}
                    <span className="block text-xs text-[var(--color-muted)]">{user.email}</span>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="w-32"><ProgressBar value={stats.reading} /></div>
                    <span className="text-xs text-[var(--color-muted)]">
                      {stats.chaptersDone}/{stats.chaptersTotal}
                    </span>
                  </td>
                  <td className="py-2 pr-3 tabular-nums">{stats.questionsSeen}</td>
                  <td className="py-2 pr-3 tabular-nums">{Math.round(stats.accuracy * 100)}%</td>
                  <td className="py-2 pr-3 tabular-nums">
                    {stats.bestExam === null ? "—" : (
                      <>
                        {stats.bestExam}%{" "}
                        <Badge tone={stats.bestExam >= 70 ? "good" : "warn"}>
                          {stats.examsTaken}×
                        </Badge>
                      </>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-xs text-[var(--color-muted)]">
                    {new Date(user.lastSeenAt).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
