import { z } from "zod";
import { normaliseEmail, startSession, verifyPassword } from "@/lib/auth";
import { read, transact } from "@/lib/store";
import { bad, ok } from "@/lib/api";

const Body = z.object({ email: z.email(), password: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Vul een e-mailadres en wachtwoord in.");
  const email = normaliseEmail(parsed.data.email);
  const user = await read((db) => db.users.find((u) => u.email === email) ?? null);
  // The same message either way, so the form cannot be used to discover which
  // addresses have accounts.
  const fail = () => bad("E-mailadres of wachtwoord is onjuist.", 401);
  if (!user || user.disabled) return fail();
  if (!(await verifyPassword(parsed.data.password, user))) return fail();

  await transact((db) => {
    const u = db.users.find((x) => x.id === user.id);
    if (u) u.lastSeenAt = new Date().toISOString();
  });
  await startSession(user.id);
  return ok({ id: user.id, role: user.role });
}
