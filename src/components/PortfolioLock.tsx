"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PortfolioLock() {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/portfolio/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });
      if (!res.ok) {
        setError("Incorrect passphrase.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-20">
      <p className="label">Private</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
        Portfolio is locked
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>
        The acquisition dashboard is gated by the passphrase set in <code>PORTFOLIO_PASSPHRASE</code>.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          type="password"
          className="field"
          placeholder="Passphrase"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          autoFocus
        />
        {error ? (
          <p className="text-sm" style={{ color: "var(--color-rust-500)" }} role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary w-full" disabled={busy || passphrase.length === 0}>
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
