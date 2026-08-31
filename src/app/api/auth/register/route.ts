import { z } from "zod";
import { createUser, noUsersYet, startSession } from "@/lib/auth";
import { transact } from "@/lib/store";
import { bad, ok } from "@/lib/api";

const Body = z.object({
  email: z.email(),
  name: z.string().min(1).max(80),
  password: z.string().min(8).max(200),
  token: z.string().optional(),
});

/**
 * Registration is open only for the very first account, which becomes the
 * administrator. Everyone after that needs a live invitation token.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Controleer je gegevens. Wachtwoord: minimaal 8 tekens.");
  const { email, name, password, token } = parsed.data;

  const first = await noUsersYet();
  let role: "admin" | "student" = "student";

  if (!first) {
    if (!token) return bad("Registratie is alleen op uitnodiging.", 403);
    const invite = await transact((db) => {
      const inv = db.invitations.find((i) => i.token === token);
      if (!inv || inv.acceptedAt) return null;
      if (new Date(inv.expiresAt) < new Date()) return null;
      if (inv.email.toLowerCase() !== email.toLowerCase()) return null;
      inv.acceptedAt = new Date().toISOString();
      return inv;
    });
    if (!invite) return bad("Deze uitnodiging is ongeldig, verlopen of al gebruikt.", 403);
    role = invite.role;
  }

  const result = await createUser({ email, name, password, role });
  if ("error" in result) return bad(result.error, 409);
  await startSession(result.user.id);
  return ok({ id: result.user.id, role: result.user.role });
}
