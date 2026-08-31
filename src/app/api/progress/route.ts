import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { transact } from "@/lib/store";
import { bad, guard, ok } from "@/lib/api";

const Body = z.object({
  chapterId: z.string().min(1),
  /** Block indices newly read. */
  read: z.array(z.number().int().nonnegative()).max(5000).optional(),
  done: z.boolean().optional(),
});

export async function POST(req: Request) {
  return guard(async () => {
    const user = await requireUser();
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return bad("Ongeldig verzoek.");
    const { chapterId, read, done } = parsed.data;

    await transact((db) => {
      const u = db.users.find((x) => x.id === user.id);
      if (!u) return;
      const entry = (u.progress.chapters[chapterId] ??= {
        read: [], done: false, updatedAt: new Date().toISOString(),
      });
      if (read?.length) {
        entry.read = [...new Set([...entry.read, ...read])].sort((a, b) => a - b);
      }
      if (done !== undefined) entry.done = done;
      entry.updatedAt = new Date().toISOString();
    });
    return ok();
  });
}
