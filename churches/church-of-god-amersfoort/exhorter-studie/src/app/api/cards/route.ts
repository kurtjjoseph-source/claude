import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { transact } from "@/lib/store";
import { bad, guard, ok } from "@/lib/api";

const Body = z.object({
  cardId: z.string().min(1),
  grade: z.enum(["again", "good", "easy"]),
});

/** Leitner intervals in days, indexed by box (1..5). */
const INTERVAL = [0, 1, 2, 5, 10, 21];

export async function POST(req: Request) {
  return guard(async () => {
    const user = await requireUser();
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return bad("Ongeldig verzoek.");
    const { cardId, grade } = parsed.data;

    await transact((db) => {
      const u = db.users.find((x) => x.id === user.id);
      if (!u) return;
      const card = (u.progress.cards[cardId] ??= {
        box: 1, dueAt: new Date().toISOString(), lapses: 0,
      });
      if (grade === "again") {
        card.box = 1;
        card.lapses += 1;
      } else {
        card.box = Math.min(5, card.box + (grade === "easy" ? 2 : 1));
      }
      const days = INTERVAL[card.box] ?? 21;
      card.dueAt = new Date(Date.now() + days * 86_400_000).toISOString();
    });
    return ok();
  });
}
