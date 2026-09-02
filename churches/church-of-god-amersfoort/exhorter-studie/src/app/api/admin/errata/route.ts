import { z } from "zod";
import { randomBytes } from "node:crypto";
import { requireAdmin } from "@/lib/auth";
import { transact } from "@/lib/store";
import { bad, guard, ok } from "@/lib/api";

const Body = z.object({
  chapterId: z.string().min(1),
  blockIndex: z.number().int().nonnegative(),
  lang: z.enum(["nl", "en"]),
  text: z.string().min(1).max(20_000),
  note: z.string().max(500).default(""),
});

/**
 * An erratum overlays one block of the built course text. Corrections live in
 * the database rather than the content files so they can be made from the admin
 * screen without a redeploy — and so they survive a rebuild of the content.
 */
export async function POST(req: Request) {
  return guard(async () => {
    const admin = await requireAdmin();
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return bad("Ongeldig verzoek.");
    const { chapterId, blockIndex, lang, text, note } = parsed.data;

    const saved = await transact((db) => {
      const existing = db.errata.find(
        (e) => e.chapterId === chapterId && e.blockIndex === blockIndex && e.lang === lang);
      if (existing) {
        Object.assign(existing, { text, note, editedBy: admin.name,
                                  editedAt: new Date().toISOString() });
        return existing;
      }
      const erratum = {
        id: randomBytes(6).toString("base64url"),
        chapterId, blockIndex, lang, text, note,
        editedBy: admin.name, editedAt: new Date().toISOString(),
      };
      db.errata.push(erratum);
      return erratum;
    });
    return ok(saved);
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return bad("Ontbrekende id.");
    await transact((db) => { db.errata = db.errata.filter((e) => e.id !== id); });
    return ok();
  });
}
