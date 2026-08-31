import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { read } from "@/lib/store";
import { resolveLang } from "@/lib/session-lang";
import { translator } from "@/lib/i18n";
import { AdminNav } from "@/components/AdminNav";
import { UserTable } from "@/components/admin/UserTable";

export default async function AdminUsers() {
  const me = await currentUser();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/");
  const lang = await resolveLang(me);
  const T = translator(lang);
  const users = await read((db) => db.users.map((u) => ({
    id: u.id, email: u.email, name: u.name, role: u.role,
    disabled: !!u.disabled, createdAt: u.createdAt, lastSeenAt: u.lastSeenAt,
  })));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{T("users")}</h1>
      <AdminNav lang={lang} active="/beheer/gebruikers" />
      <UserTable users={users} lang={lang} meId={me.id} />
    </div>
  );
}
