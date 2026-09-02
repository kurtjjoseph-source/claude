import { redirect } from "next/navigation";
import { currentUser, noUsersYet } from "@/lib/auth";
import { resolveLang } from "@/lib/session-lang";
import { translator } from "@/lib/i18n";
import { AuthForm } from "@/components/AuthForm";
import { Card } from "@/components/ui";

/**
 * Open only while the site has no accounts: whoever registers first becomes the
 * administrator. After that this page explains that entry is by invitation.
 */
export default async function RegisterPage() {
  if (await currentUser()) redirect("/");
  const lang = await resolveLang(null);
  const T = translator(lang);
  const first = await noUsersYet();

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-semibold">{T("signUp")}</h1>
      <p className="mb-6 text-sm text-[var(--color-muted)]">{T("tagline")}</p>
      <Card>
        {first
          ? <AuthForm mode="register" lang={lang} hint={T("firstUserAdmin")} />
          : <p className="text-sm">{T("inviteOnly")}</p>}
      </Card>
    </div>
  );
}
