import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { transact } from "@/lib/store";
import { examItems } from "@/lib/content";
import type { ExamAttempt } from "@/lib/types";
import { bad, guard, ok } from "@/lib/api";
import { randomBytes } from "node:crypto";

const Body = z.object({
  scope: z.enum(["full", "I", "II", "III"]),
  startedAt: z.string(),
  answers: z.record(z.string(), z.string()),
});

/**
 * Scored against the official rule: an average of 70% across the parts sat,
 * and no part below 60%.
 */
export async function POST(req: Request) {
  return guard(async () => {
    const user = await requireUser();
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return bad("Ongeldig verzoek.");
    const { scope, startedAt, answers } = parsed.data;

    const inScope = examItems.filter((q) => scope === "full" || q.part === scope);
    const perPart: Record<string, { correct: number; total: number }> = {};
    for (const q of inScope) {
      const p = (perPart[q.part] ??= { correct: 0, total: 0 });
      p.total += 1;
      if (answers[q.id] === q.answer) p.correct += 1;
    }
    const parts = Object.values(perPart);
    const percentages = parts.map((p) => (p.total ? (p.correct / p.total) * 100 : 0));
    const score = percentages.length
      ? percentages.reduce((a, b) => a + b, 0) / percentages.length : 0;
    const passed = score >= 70 && percentages.every((p) => p >= 60);

    const attempt: ExamAttempt = {
      id: randomBytes(6).toString("base64url"),
      startedAt, finishedAt: new Date().toISOString(),
      scope, perPart, score: Math.round(score * 10) / 10, passed, answers,
    };

    await transact((db) => {
      const u = db.users.find((x) => x.id === user.id);
      if (!u) return;
      u.progress.exams.push(attempt);
      // Feed exam answers back into the per-question record, so weak items
      // surface in practice and flashcards too.
      for (const q of inScope) {
        const chose = answers[q.id];
        if (!chose) continue;
        const prev = u.progress.answers[q.id];
        u.progress.answers[q.id] = {
          correct: chose === q.answer,
          attempts: (prev?.attempts ?? 0) + 1,
          chose,
          lastAt: attempt.finishedAt,
        };
      }
    });
    return ok(attempt);
  });
}
