import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, noUsersYet } from "@/lib/auth";
import { resolveLang } from "@/lib/session-lang";
import { translator } from "@/lib/i18n";
import { AuthForm } from "@/components/AuthForm";
import { Card } from "@/components/ui";

export default async function LoginPage() {
  const user = await currentUser();
  if (user) redirect("/");
  const lang = await resolveLang(null);
  const T = translator(lang);
  const first = await noUsersYet();

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-semibold">{T("signIn")}</h1>
      <p className="mb-6 text-sm text-[var(--color-muted)]">{T("tagline")}</p>
      <Card>
        <AuthForm mode="login" lang={lang} />
      </Card>
      {first && (
        <p className="mt-4 text-center text-sm">
          Nog geen accounts.{" "}
          <Link href="/register" className="font-medium text-[var(--color-accent)]">
            Maak het eerste account aan
          </Link>{" "}
          — dat wordt de beheerder.
        </p>
      )}
    </div>
  );
}
