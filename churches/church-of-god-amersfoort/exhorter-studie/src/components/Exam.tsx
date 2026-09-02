"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ExamItem } from "@/lib/content";
import type { ExamAttempt, Lang } from "@/lib/types";
import { translator } from "@/lib/i18n";

type Scope = "full" | "I" | "II" | "III";

const bi = (v: { en: string; nl: string }, lang: Lang) => (lang === "nl" && v.nl ? v.nl : v.en);

/**
 * The certification test: the official examination, sat in one sitting and
 * scored to the published rule. Afterwards every item can be opened at the
 * passage in the course that carries its answer.
 */
export function Exam({ items, lang }: { items: ExamItem[]; lang: Lang }) {
  const T = translator(lang);
  const [scope, setScope] = useState<Scope>("full");
  const [started, setStarted] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ExamAttempt | null>(null);
  const [busy, setBusy] = useState(false);

  const inScope = useMemo(
    () => items.filter((q) => scope === "full" || q.part === scope),
    [items, scope]);

  const answered = inScope.filter((q) => answers[q.id]).length;

  async function submit() {
    setBusy(true);
    const res = await fetch("/api/exam", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ scope, startedAt: started, answers }),
    });
    if (res.ok) setResult(await res.json());
    setBusy(false);
  }

  if (result) {
    return <Results result={result} items={inScope} answers={answers} lang={lang} />;
  }

  if (!started) {
    const scopes: [Scope, string][] = [
      ["full", lang === "nl" ? "Volledig examen (150 vragen)" : "Full exam (150 questions)"],
      ["I", lang === "nl" ? "Deel I — Bijbelstudie (50)" : "Part I — Biblical Study (50)"],
      ["II", lang === "nl" ? "Deel II — Geschiedenis en kerkorde (50)" : "Part II — History and Polity (50)"],
      ["III", lang === "nl" ? "Deel III — Leer (50)" : "Part III — Doctrine (50)"],
    ];
    return (
      <div className="space-y-5">
        <p className="rounded border border-[var(--color-rule)] px-4 py-3 text-sm">
          {T("passRule")}
        </p>
        <div className="space-y-2">
          {scopes.map(([id, label]) => (
            <button key={id} onClick={() => setScope(id)}
                    className={`block w-full rounded border px-4 py-3 text-left text-sm ${
                      scope === id
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                        : "border-[var(--color-rule)]"}`}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={() => setStarted(new Date().toISOString())}
                className="rounded bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white">
          {T("startExam")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="no-print sticky top-14 z-20 -mx-4 border-b border-[var(--color-rule)]
                      bg-[var(--color-paper)]/95 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-4 text-sm">
          <span className="tabular-nums text-[var(--color-muted)]">
            {answered} / {inScope.length}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-rule)]">
            <div className="h-full bg-[var(--color-accent)]"
                 style={{ width: `${(answered / inScope.length) * 100}%` }} />
          </div>
          <button onClick={submit} disabled={busy}
                  className="rounded bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium
                             text-white disabled:opacity-60">
            {T("submitExam")}
          </button>
        </div>
      </div>

      <ol className="space-y-8">
        {inScope.map((q, i) => (
          <li key={q.id} className="scroll-mt-32">
            <p className="mb-3">
              <span className="mr-2 font-mono text-xs text-[var(--color-muted)]">
                {q.part}.{q.n}
              </span>
              {bi(q.prompt, lang)}
            </p>
            <ul className="space-y-1.5">
              {q.choices.map((c) => (
                <li key={c.key}>
                  <label className={`flex cursor-pointer gap-3 rounded border px-3 py-2 text-sm ${
                    answers[q.id] === c.key
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                      : "border-[var(--color-rule)] hover:border-[var(--color-accent)]"}`}>
                    <input type="radio" name={q.id} value={c.key} className="sr-only"
                           checked={answers[q.id] === c.key}
                           onChange={() => setAnswers((a) => ({ ...a, [q.id]: c.key }))} />
                    <span className="font-mono text-xs text-[var(--color-muted)]">{c.key}</span>
                    <span>{bi(c.text, lang)}</span>
                  </label>
                </li>
              ))}
            </ul>
            {i < inScope.length - 1 && <hr className="mt-8 border-[var(--color-rule)]" />}
          </li>
        ))}
      </ol>

      <button onClick={submit} disabled={busy}
              className="rounded bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium
                         text-white disabled:opacity-60">
        {T("submitExam")}
      </button>
    </div>
  );
}

function Results({ result, items, answers, lang }: {
  result: ExamAttempt; items: ExamItem[]; answers: Record<string, string>; lang: Lang;
}) {
  const T = translator(lang);
  const [filter, setFilter] = useState<"all" | "wrong">("wrong");
  const shown = items.filter((q) => filter === "all" || answers[q.id] !== q.answer);

  return (
    <div className="space-y-6">
      <div className={`rounded-lg border p-6 ${
        result.passed ? "border-emerald-600 bg-emerald-600/10" : "border-red-600 bg-red-600/10"}`}>
        <p className="text-3xl font-semibold tabular-nums">{result.score}%</p>
        <p className="mt-1 font-medium">{result.passed ? T("passed") : T("failed")}</p>
        <ul className="mt-3 space-y-0.5 text-sm">
          {Object.entries(result.perPart).map(([part, p]) => (
            <li key={part} className="tabular-nums">
              {lang === "nl" ? "Deel" : "Part"} {part}: {p.correct}/{p.total} ·{" "}
              {Math.round((p.correct / p.total) * 100)}%
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-[var(--color-muted)]">{T("passRule")}</p>
      </div>

      <div className="flex gap-2 text-sm">
        {(["wrong", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
                  className={`rounded border px-3 py-1 ${
                    filter === f
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                      : "border-[var(--color-rule)] text-[var(--color-muted)]"}`}>
            {f === "wrong"
              ? (lang === "nl" ? "Alleen fout" : "Incorrect only")
              : (lang === "nl" ? "Alle vragen" : "All questions")}
          </button>
        ))}
      </div>

      <ol className="space-y-6">
        {shown.map((q) => {
          const chose = answers[q.id];
          const right = chose === q.answer;
          const answer = q.choices.find((c) => c.key === q.answer);
          return (
            <li key={q.id} className="rounded border border-[var(--color-rule)] p-4">
              <p className="text-sm">
                <span className="mr-2 font-mono text-xs text-[var(--color-muted)]">
                  {q.part}.{q.n}
                </span>
                {bi(q.prompt, lang)}
              </p>
              <p className={`mt-2 text-sm ${right
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-red-700 dark:text-red-400"}`}>
                {right ? T("correct") : `${T("incorrect")} — ${chose ?? "—"}`}
              </p>
              <p className="mt-1 text-sm">
                <span className="text-[var(--color-muted)]">{T("showAnswer")}: </span>
                <strong>{q.answer}. {answer ? bi(answer.text, lang) : ""}</strong>
              </p>
              {q.source && (
                <p className="mt-2 text-sm">
                  <Link href={`/cursus/${q.source.chapter}?blok=${q.source.block}`}
                        className="text-[var(--color-accent)] hover:underline">
                    {T("sourceIsHere")} — {T("page")} {q.source.page} · {T("openSource")} →
                  </Link>
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
