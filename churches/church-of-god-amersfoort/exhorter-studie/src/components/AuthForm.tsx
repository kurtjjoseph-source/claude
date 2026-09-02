"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Lang } from "@/lib/types";
import { translator } from "@/lib/i18n";

type Mode = "login" | "register";

export function AuthForm({ mode, lang, token, email: fixedEmail, hint }:
  { mode: Mode; lang: Lang; token?: string; email?: string; hint?: string }) {
  const T = translator(lang);
  const router = useRouter();
  const [email, setEmail] = useState(fixedEmail ?? "");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(mode === "login"
        ? { email, password }
        : { email, name, password, token }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Er ging iets mis.");
      setBusy(false);
    }
  }

  const field = "w-full rounded border border-[var(--color-rule)] bg-transparent px-3 py-2 " +
                "text-sm outline-none focus:border-[var(--color-accent)]";

  return (
    <form onSubmit={submit} className="space-y-4">
      {hint && (
        <p className="rounded border border-[var(--color-accent-soft)] bg-[var(--color-accent-soft)]
                      px-3 py-2 text-sm">{hint}</p>
      )}
      {mode === "register" && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{T("name")}</span>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)}
                 required autoComplete="name" />
        </label>
      )}
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{T("email")}</span>
        <input className={field} type="email" value={email} readOnly={!!fixedEmail}
               onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{T("password")}</span>
        <input className={field} type="password" value={password} minLength={mode === "register" ? 8 : 1}
               onChange={(e) => setPassword(e.target.value)} required
               autoComplete={mode === "register" ? "new-password" : "current-password"} />
        {mode === "register" && (
          <span className="mt-1 block text-xs text-[var(--color-muted)]">
            Minimaal 8 tekens.
          </span>
        )}
      </label>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button disabled={busy}
              className="w-full rounded bg-[var(--color-accent)] px-4 py-2 text-sm font-medium
                         text-white disabled:opacity-60">
        {busy ? "…" : mode === "login" ? T("signIn") : T("signUp")}
      </button>
    </form>
  );
}
