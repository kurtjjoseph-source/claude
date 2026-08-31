"use client";
import Link from "next/link";
import { useState } from "react";
import type { MCQuestion } from "@/lib/questions";
import type { Lang } from "@/lib/types";
import { translator } from "@/lib/i18n";

/**
 * One question at a time, answered then checked. After checking, the passage in
 * the course that states the answer is linked directly, deep-linked to the
 * block so the reader highlights it on arrival.
 */
export function Quiz({ questions, lang }: { questions: MCQuestion[]; lang: Lang }) {
  const T = translator(lang);
  const [at, setAt] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [tally, setTally] = useState({ right: 0, done: 0 });

  const q = questions[at];
  if (!q) {
    return <p className="text-sm text-[var(--color-muted)]">
      {lang === "nl" ? "Geen vragen voor dit hoofdstuk." : "No questions for this chapter."}
    </p>;
  }

  const correct = chosen === q.answer;

  async function check() {
    if (!chosen || checked) return;
    setChecked(true);
    setTally((t) => ({ right: t.right + (chosen === q!.answer ? 1 : 0), done: t.done + 1 }));
    await fetch("/api/answers", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ questionId: q!.id, chose: chosen, correct: chosen === q!.answer }),
    }).catch(() => {});
  }

  function next() {
    setChosen(null);
    setChecked(false);
    setAt((i) => Math.min(i + 1, questions.length - 1));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm text-[var(--color-muted)]">
        <span>{at + 1} {T("of")} {questions.length}</span>
        <span className="tabular-nums">
          {T("score")}: {tally.right}/{tally.done}
        </span>
      </div>

      <p className="text-lg">{q.prompt}</p>

      <ul className="space-y-2">
        {q.choices.map((c) => {
          const isAnswer = c.key === q.answer;
          const isChosen = c.key === chosen;
          const tone = !checked
            ? isChosen
              ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
              : "border-[var(--color-rule)] hover:border-[var(--color-accent)]"
            : isAnswer
              ? "border-emerald-600 bg-emerald-600/10"
              : isChosen
                ? "border-red-600 bg-red-600/10"
                : "border-[var(--color-rule)] opacity-60";
          return (
            <li key={c.key}>
              <button onClick={() => !checked && setChosen(c.key)} disabled={checked}
                      className={`flex w-full gap-3 rounded border px-4 py-2.5 text-left text-sm ${tone}`}>
                <span className="font-mono text-xs text-[var(--color-muted)]">{c.key}</span>
                <span>{c.text}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {checked && (
        <div className="rounded border border-[var(--color-rule)] p-4 text-sm">
          <p className={correct ? "font-medium text-emerald-700 dark:text-emerald-400"
                                : "font-medium text-red-700 dark:text-red-400"}>
            {correct ? T("correct") : T("incorrect")}
          </p>
          <p className="mt-1">
            <span className="text-[var(--color-muted)]">{T("showAnswer")}: </span>
            <strong>{q.answerText}</strong>
          </p>
          {q.source && (
            <p className="mt-2">
              <Link href={`/cursus/${q.source.chapter}?blok=${q.source.block}`}
                    className="text-[var(--color-accent)] hover:underline">
                {T("sourceIsHere")} — {T("page")} {q.source.page} · {T("openSource")} →
              </Link>
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {!checked ? (
          <button onClick={check} disabled={!chosen}
                  className="rounded bg-[var(--color-accent)] px-4 py-2 text-sm font-medium
                             text-white disabled:opacity-50">
            {T("check")}
          </button>
        ) : (
          <button onClick={next} disabled={at >= questions.length - 1}
                  className="rounded bg-[var(--color-accent)] px-4 py-2 text-sm font-medium
                             text-white disabled:opacity-50">
            {T("next")}
          </button>
        )}
      </div>
    </div>
  );
}
