import { z } from "zod";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { transact } from "@/lib/store";
import { bad, guard, ok } from "@/lib/api";

const Patch = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80).optional(),
  role: z.enum(["admin", "student"]).optional(),
  disabled: z.boolean().optional(),
  password: z.string().min(8).max(200).optional(),
});

export async function PATCH(req: Request) {
  return guard(async () => {
    const admin = await requireAdmin();
    const parsed = Patch.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return bad("Ongeldig verzoek.");
    const { id, password, ...fields } = parsed.data;

    const creds = password ? await hashPassword(password) : null;
    const error = await transact((db) => {
      const u = db.users.find((x) => x.id === id);
      if (!u) return "Gebruiker niet gevonden.";
      // The site must not be left without an administrator.
      const admins = db.users.filter((x) => x.role === "admin" && !x.disabled);
      const demoting = (fields.role && fields.role !== "admin") || fields.disabled;
      if (u.role === "admin" && demoting && admins.length <= 1) {
        return "Dit is de laatste beheerder; wijs eerst een andere beheerder aan.";
      }
      Object.assign(u, fields);
      if (creds) { u.passwordHash = creds.hash; u.salt = creds.salt; }
      return null;
    });
    return error ? bad(error, 409) : ok({ by: admin.id });
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return bad("Ontbrekende id.");
    const error = await transact((db) => {
      const u = db.users.find((x) => x.id === id);
      if (!u) return "Gebruiker niet gevonden.";
      const admins = db.users.filter((x) => x.role === "admin" && !x.disabled);
      if (u.role === "admin" && admins.length <= 1) {
        return "Dit is de laatste beheerder en kan niet verwijderd worden.";
      }
      db.users = db.users.filter((x) => x.id !== id);
      return null;
    });
    return error ? bad(error, 409) : ok();
  });
}
