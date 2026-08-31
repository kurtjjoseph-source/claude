import { read } from "@/lib/store";
import { resolveLang } from "@/lib/session-lang";
import { AuthForm } from "@/components/AuthForm";
import { Card } from "@/components/ui";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lang = await resolveLang(null);
  const invite = await read((db) => db.invitations.find((i) => i.token === token) ?? null);
  const live = invite && !invite.acceptedAt && new Date(invite.expiresAt) > new Date();

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-semibold">Uitnodiging</h1>
      <Card>
        {live ? (
          <>
            <p className="mb-4 text-sm text-[var(--color-muted)]">
              {invite.invitedBy} heeft je uitgenodigd. Kies een wachtwoord om te beginnen.
            </p>
            <AuthForm mode="register" lang={lang} token={token} email={invite.email} />
          </>
        ) : (
          <p className="text-sm">
            Deze uitnodiging is niet (meer) geldig. Vraag de beheerder om een nieuwe.
          </p>
        )}
      </Card>
    </div>
  );
}
