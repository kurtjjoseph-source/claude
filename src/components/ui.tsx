import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] p-5 ${className}`}>
      {children}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-rule)]">
        <div className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-500"
             style={{ width: `${pct}%` }} />
      </div>
      {label && (
        <p className="mt-1 text-xs text-[var(--color-muted)]">{label} — {pct}%</p>
      )}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-rule)] p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[var(--color-muted)]">{sub}</p>}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }:
  { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const tones = {
    neutral: "bg-[var(--color-rule)] text-[var(--color-ink)]",
    good: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400",
    warn: "bg-amber-500/20 text-amber-800 dark:text-amber-300",
    bad: "bg-red-600/15 text-red-700 dark:text-red-400",
  };
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
