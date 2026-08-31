import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { transact } from "@/lib/store";
import { ok } from "@/lib/api";

const Body = z.object({
  lang: z.enum(["nl", "en"]).optional(),
  bilingual: z.boolean().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  fontScale: z.number().min(0.8).max(1.6).optional(),
});

/** Settings changes are also allowed while signed out; they just do nothing. */
export async function POST(req: Request) {
  const user = await currentUser();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !user) return ok();
  await transact((db) => {
    const u = db.users.find((x) => x.id === user.id);
    if (u) Object.assign(u.settings, parsed.data);
  });
  return ok();
}
