"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Invitation, Lang, Role } from "@/lib/types";
import { translator } from "@/lib/i18n";
import { Badge } from "@/components/ui";

/**
 * Invitations. When no mail provider is configured the invitation is still
 * created and its link shown here to pass on by hand, so the site works before
 * any email is set up.
 */
export function Invitations({ invitations, lang, mailConfigured }:
  { invitations: Invitation[]; lang: Lang; mailConfigured: boolean }) {
  const T = translator(lang);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ url: string; delivered: boolean; error?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setNotice(null);
    const res = await fetch("/api/admin/invitations", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { setNotice(data); setEmail(""); router.refresh(); }
    else setError(data.error ?? "Mislukt.");
    setBusy(false);
  }

  async function revoke(token: string) {
    await fetch(`/api/admin/invitations?token=${encodeURIComponent(token)}`, { method: "DELETE" });
    router.refresh();
  }

  const live = invitations.filter((i) => !i.acceptedAt);
  const used = invitations.filter((i) => i.acceptedAt);

  return (
    <div className="space-y-6">
      {!mailConfigured && (
        <p className="rounded border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          {lang === "nl"
            ? "Geen e-mailprovider ingesteld (RESEND_API_KEY en MAIL_FROM). Uitnodigingen worden wel aangemaakt; deel de link hieronder handmatig."
            : "No mail provider configured (RESEND_API_KEY and MAIL_FROM). Invitations are still created; share the link below by hand."}
        </p>
      )}

      <form onSubmit={invite} className="flex flex-wrap items-end gap-3">
        <label className="min-w-56 flex-1">
          <span className="mb-1 block text-sm font-medium">{T("email")}</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                 className="w-full rounded border border-[var(--color-rule)] bg-transparent px-3 py-2
                            text-sm outline-none focus:border-[var(--color-accent)]" />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium">{T("role")}</span>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}
                  className="rounded border border-[var(--color-rule)] bg-transparent px-3 py-2 text-sm">
            <option value="student">{T("student")}</option>
            <option value="admin">{T("admin")}</option>
          </select>
        </label>
        <button disabled={busy}
                className="rounded bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white
                           disabled:opacity-60">
          {T("invite")}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {notice && (
        <div className="rounded border border-[var(--color-rule)] p-4 text-sm">
          <p className="font-medium">
            {notice.delivered
              ? (lang === "nl" ? "Uitnodiging verstuurd." : "Invitation sent.")
              : (lang === "nl" ? "Uitnodiging aangemaakt — deel deze link:" : "Invitation created — share this link:")}
          </p>
          <p className="mt-1 break-all font-mono text-xs">{notice.url}</p>
          <button onClick={() => navigator.clipboard.writeText(notice.url)}
                  className="mt-2 rounded border border-[var(--color-rule)] px-2 py-1 text-xs">
            {T("copyLink")}
          </button>
          {notice.error && (
            <p className="mt-2 text-xs text-[var(--color-muted)]">{notice.error}</p>
          )}
        </div>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {lang === "nl" ? "Openstaand" : "Outstanding"} ({live.length})
        </h2>
        <ul className="space-y-2 text-sm">
          {live.map((i) => {
            const expired = new Date(i.expiresAt) < new Date();
            return (
              <li key={i.token}
                  className="flex flex-wrap items-center gap-3 rounded border border-[var(--color-rule)] px-4 py-2">
                <span className="font-medium">{i.email}</span>
                <Badge>{i.role === "admin" ? T("admin") : T("student")}</Badge>
                {expired
                  ? <Badge tone="bad">{lang === "nl" ? "Verlopen" : "Expired"}</Badge>
                  : <span className="text-xs text-[var(--color-muted)]">
                      {lang === "nl" ? "geldig tot" : "valid until"}{" "}
                      {new Date(i.expiresAt).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB")}
                    </span>}
                {i.deliveryError && <Badge tone="warn">{lang === "nl" ? "niet gemaild" : "not mailed"}</Badge>}
                <button onClick={() => navigator.clipboard.writeText(
                          `${location.origin}/uitnodiging/${i.token}`)}
                        className="ml-auto rounded border border-[var(--color-rule)] px-2 py-1 text-xs">
                  {T("copyLink")}
                </button>
                <button onClick={() => revoke(i.token)}
                        className="rounded border border-red-600/50 px-2 py-1 text-xs text-red-700
                                   dark:text-red-400">
                  {T("delete")}
                </button>
              </li>
            );
          })}
          {!live.length && (
            <li className="text-[var(--color-muted)]">
              {lang === "nl" ? "Geen openstaande uitnodigingen." : "No outstanding invitations."}
            </li>
          )}
        </ul>
      </section>

      {used.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            {lang === "nl" ? "Gebruikt" : "Accepted"} ({used.length})
          </h2>
          <ul className="space-y-1 text-sm text-[var(--color-muted)]">
            {used.map((i) => (
              <li key={i.token}>
                {i.email} — {new Date(i.acceptedAt!).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB")}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
