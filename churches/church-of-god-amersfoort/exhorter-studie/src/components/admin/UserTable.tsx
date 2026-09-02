"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Lang, Role } from "@/lib/types";
import { translator } from "@/lib/i18n";
import { Badge } from "@/components/ui";

export type AdminUser = {
  id: string; email: string; name: string; role: Role;
  disabled: boolean; createdAt: string; lastSeenAt: string;
};

/** User administration: rename, change role, suspend, reset password, delete. */
export function UserTable({ users, lang, meId }:
  { users: AdminUser[]; lang: Lang; meId: string }) {
  const T = translator(lang);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  async function patch(id: string, body: Record<string, unknown>) {
    setError(null);
    const res = await fetch("/api/admin/users", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? "Mislukt.");
    router.refresh();
  }

  async function remove(id: string, name: string) {
    if (!confirm(lang === "nl"
      ? `${name} definitief verwijderen, inclusief alle voortgang?`
      : `Delete ${name} permanently, including all progress?`)) return;
    setError(null);
    const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? "Mislukt.");
    router.refresh();
  }

  async function resetPassword(id: string) {
    const password = prompt(lang === "nl"
      ? "Nieuw wachtwoord (minimaal 8 tekens):"
      : "New password (at least 8 characters):");
    if (password && password.length >= 8) await patch(id, { password });
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-[var(--color-muted)]">
            <tr className="border-b border-[var(--color-rule)]">
              <th className="py-2 pr-3 font-medium">{T("name")}</th>
              <th className="py-2 pr-3 font-medium">{T("role")}</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 pr-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[var(--color-rule)] align-top">
                <td className="py-2 pr-3">
                  {editing === u.id ? (
                    <input defaultValue={u.name} autoFocus
                           onBlur={(e) => { setEditing(null); if (e.target.value !== u.name)
                             void patch(u.id, { name: e.target.value }); }}
                           className="rounded border border-[var(--color-rule)] bg-transparent px-2 py-1" />
                  ) : (
                    <button onClick={() => setEditing(u.id)} className="font-medium hover:underline">
                      {u.name}
                    </button>
                  )}
                  <span className="block text-xs text-[var(--color-muted)]">{u.email}</span>
                </td>
                <td className="py-2 pr-3">
                  <select value={u.role} disabled={u.id === meId}
                          onChange={(e) => patch(u.id, { role: e.target.value as Role })}
                          className="rounded border border-[var(--color-rule)] bg-transparent px-2 py-1
                                     text-sm disabled:opacity-50">
                    <option value="student">{T("student")}</option>
                    <option value="admin">{T("admin")}</option>
                  </select>
                </td>
                <td className="py-2 pr-3">
                  {u.disabled
                    ? <Badge tone="bad">{lang === "nl" ? "Geblokkeerd" : "Suspended"}</Badge>
                    : <Badge tone="good">{lang === "nl" ? "Actief" : "Active"}</Badge>}
                </td>
                <td className="py-2 pr-3">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button onClick={() => patch(u.id, { disabled: !u.disabled })}
                            disabled={u.id === meId}
                            className="rounded border border-[var(--color-rule)] px-2 py-1 disabled:opacity-40">
                      {u.disabled
                        ? (lang === "nl" ? "Deblokkeren" : "Restore")
                        : (lang === "nl" ? "Blokkeren" : "Suspend")}
                    </button>
                    <button onClick={() => resetPassword(u.id)}
                            className="rounded border border-[var(--color-rule)] px-2 py-1">
                      {lang === "nl" ? "Wachtwoord" : "Password"}
                    </button>
                    <button onClick={() => remove(u.id, u.name)} disabled={u.id === meId}
                            className="rounded border border-red-600/50 px-2 py-1 text-red-700
                                       disabled:opacity-40 dark:text-red-400">
                      {T("delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
