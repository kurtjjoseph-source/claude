import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { read } from "@/lib/store";
import { resolveLang } from "@/lib/session-lang";
import { translator } from "@/lib/i18n";
import { AdminNav } from "@/components/AdminNav";
import { Invitations } from "@/components/admin/Invitations";

export default async function AdminInvitations() {
  const me = await currentUser();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/");
  const lang = await resolveLang(me);
  const T = translator(lang);
  const invitations = await read((db) => db.invitations);
  const mailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{T("invitations")}</h1>
      <AdminNav lang={lang} active="/beheer/uitnodigingen" />
      <Invitations invitations={invitations} lang={lang} mailConfigured={mailConfigured} />
    </div>
  );
}
