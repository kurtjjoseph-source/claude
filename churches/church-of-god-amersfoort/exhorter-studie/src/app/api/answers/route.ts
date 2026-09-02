import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { transact } from "@/lib/store";
import { bad, guard, ok } from "@/lib/api";

const Body = z.object({
  questionId: z.string().min(1),
  chose: z.string().min(1).max(400),
  correct: z.boolean(),
});

/** Records one answered review/practice question. */
export async function POST(req: Request) {
  return guard(async () => {
    const user = await requireUser();
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return bad("Ongeldig verzoek.");
    const { questionId, chose, correct } = parsed.data;
    await transact((db) => {
      const u = db.users.find((x) => x.id === user.id);
      if (!u) return;
      const prev = u.progress.answers[questionId];
      u.progress.answers[questionId] = {
        correct,
        attempts: (prev?.attempts ?? 0) + 1,
        chose,
        lastAt: new Date().toISOString(),
      };
    });
    return ok();
  });
}
