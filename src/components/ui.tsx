"use client";

import type { ReactNode } from "react";

/** Shared form and display primitives used by the wizard and dashboard. */

export function Labeled({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {hint ? (
        <span className="block text-xs mt-0.5 mb-1.5" style={{ color: "var(--fg-subtle)" }}>
          {hint}
        </span>
      ) : (
        <span className="block mb-1.5" />
      )}
      {children}
    </label>
  );
}

export interface Choice<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

export function ChoiceGroup<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
  columns = 1,
}: {
  label: string;
  hint?: string;
  options: ReadonlyArray<Choice<T>>;
  value: T;
  onChange: (v: T) => void;
  columns?: 1 | 2 | 3;
}) {
  const cols = columns === 3 ? "sm:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : "";
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      {hint ? (
        <p className="text-xs mt-0.5" style={{ color: "var(--fg-subtle)" }}>
          {hint}
        </p>
      ) : null}
      <div className={`mt-2 grid gap-2 ${cols}`}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className="choice"
            data-selected={value === o.value}
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
          >
            <span className="text-sm font-medium">{o.label}</span>
            {o.hint ? (
              <span className="block text-xs mt-0.5 leading-snug" style={{ color: "var(--fg-muted)" }}>
                {o.hint}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function CheckGroup<T extends string>({
  label,
  hint,
  options,
  values,
  onToggle,
}: {
  label: string;
  hint?: string;
  options: ReadonlyArray<Choice<T>>;
  values: T[];
  onToggle: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      {hint ? (
        <p className="text-xs mt-0.5" style={{ color: "var(--fg-subtle)" }}>
          {hint}
        </p>
      ) : null}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((o) => {
          const on = values.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              className="choice flex items-start gap-2.5"
              data-selected={on}
              aria-pressed={on}
              onClick={() => onToggle(o.value)}
            >
              <span
                aria-hidden="true"
                className="mt-0.5 shrink-0 w-4 h-4 rounded-[4px] flex items-center justify-center text-[10px] font-bold"
                style={{
                  border: `1px solid ${on ? "var(--accent)" : "var(--line-strong)"}`,
                  background: on ? "var(--accent)" : "transparent",
                  color: "var(--accent-fg)",
                }}
              >
                {on ? "✓" : ""}
              </span>
              <span className="text-sm">{o.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function NumberField({
  label,
  hint,
  value,
  onChange,
  min = 0,
  step = "any",
  placeholder,
  prefix,
  suffix,
}: {
  label: string;
  hint?: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  min?: number;
  step?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <Labeled label={label} hint={hint}>
      <div className="relative flex items-center">
        {prefix ? (
          <span className="absolute left-2.5 text-sm pointer-events-none" style={{ color: "var(--fg-subtle)" }}>
            {prefix}
          </span>
        ) : null}
        <input
          type="number"
          className="field"
          style={{ paddingLeft: prefix ? "1.6rem" : undefined, paddingRight: suffix ? "3.2rem" : undefined }}
          min={min}
          step={step}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === "" ? undefined : Number(raw));
          }}
        />
        {suffix ? (
          <span className="absolute right-2.5 text-xs pointer-events-none" style={{ color: "var(--fg-subtle)" }}>
            {suffix}
          </span>
        ) : null}
      </div>
    </Labeled>
  );
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <Labeled label={required ? `${label} *` : label} hint={hint}>
      <input className="field" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Labeled>
  );
}

const SEVERITY_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  critical: { bg: "rgba(207,95,66,0.14)", fg: "var(--color-rust-500)", label: "Critical" },
  major: { bg: "rgba(201,150,47,0.16)", fg: "var(--color-ochre-600)", label: "Major" },
  moderate: { bg: "rgba(37,134,161,0.13)", fg: "var(--accent)", label: "Moderate" },
  minor: { bg: "var(--bg-sunken)", fg: "var(--fg-muted)", label: "Minor" },
  positive: { bg: "rgba(127,160,122,0.18)", fg: "var(--color-sage-600)", label: "Strength" },
};

export function SeverityBadge({ severity }: { severity: string }) {
  const s = SEVERITY_STYLE[severity] ?? SEVERITY_STYLE.minor!;
  return (
    <span
      className="inline-block shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}

export function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tone =
    score >= 78 ? "var(--color-sage-400)" : score >= 60 ? "var(--accent)" : score >= 42 ? "var(--color-ochre-500)" : "var(--color-rust-500)";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Composite score ${score} out of 100`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={tone}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${(c * score) / 100} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.3}
        fontWeight="600"
        fill="var(--fg)"
        fontFamily="var(--font-serif)"
      >
        {score}
      </text>
    </svg>
  );
}

export function Bar({ value, tone }: { value: number; tone?: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-sunken)" }}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: tone ?? "var(--accent)" }}
      />
    </div>
  );
}
