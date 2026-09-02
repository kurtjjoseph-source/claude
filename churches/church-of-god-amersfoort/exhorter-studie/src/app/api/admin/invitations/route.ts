import { z } from "zod";
import { randomBytes } from "node:crypto";
import { normaliseEmail, requireAdmin } from "@/lib/auth";
import { transact } from "@/lib/store";
import { invitationEmail, sendMail } from "@/lib/mail";
import { bad, guard, ok } from "@/lib/api";

const Body = z.object({
  email: z.email(),
  role: z.enum(["admin", "student"]).default("student"),
  name: z.string().max(80).optional(),
});

const DAYS = 14;

export async function POST(req: Request) {
  return guard(async () => {
    const admin = await requireAdmin();
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return bad("Vul een geldig e-mailadres in.");
    const email = normaliseEmail(parsed.data.email);

    const token = randomBytes(24).toString("base64url");
    const taken = await transact((db) => {
      if (db.users.some((u) => u.email === email)) return true;
      db.invitations = db.invitations.filter(
        (i) => !(i.email === email && !i.acceptedAt));   // replace any live invite
      db.invitations.push({
        token, email, role: parsed.data.role, invitedBy: admin.name,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + DAYS * 86_400_000).toISOString(),
      });
      return false;
    });
    if (taken) return bad("Er bestaat al een account met dit e-mailadres.", 409);

    const origin = process.env.SITE_URL || new URL(req.url).origin;
    const url = `${origin}/uitnodiging/${token}`;
    const body = invitationEmail({ name: parsed.data.name ?? "", url, inviter: admin.name });
    const result = await sendMail({
      to: email, subject: "Uitnodiging — Exhorter Studie", ...body,
    });
    if (!result.delivered) {
      await transact((db) => {
        const inv = db.invitations.find((i) => i.token === token);
        if (inv) inv.deliveryError = result.error;
      });
    }
    return ok({ token, url, delivered: result.delivered, error: result.error });
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const token = new URL(req.url).searchParams.get("token");
    if (!token) return bad("Ontbrekend token.");
    await transact((db) => {
      db.invitations = db.invitations.filter((i) => i.token !== token);
    });
    return ok();
  });
}
