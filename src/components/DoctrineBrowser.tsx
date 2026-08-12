"use client";

import { useMemo, useState } from "react";
import type { JurisdictionProfile } from "@/lib/types";
import { DOCTRINE_LABELS, GROUNDWATER_LABELS, OWNERSHIP_LABELS } from "@/lib/water/registry";

const RISK_TONE: Record<string, string> = {
  low: "var(--color-sage-400)",
  moderate: "var(--accent)",
  high: "var(--color-ochre-500)",
  severe: "var(--color-rust-500)",
};

const FILTERS = [
  { value: "all", label: "Everywhere" },
  { value: "international", label: "International only" },
  { value: "open", label: "Open to foreign buyers" },
  { value: "closed", label: "Closed or restricted" },
  { value: "tradable-entitlement", label: "Tradable water" },
  { value: "prior-appropriation", label: "Prior appropriation" },
] as const;

const OWNERSHIP_TONE: Record<string, string> = {
  unrestricted: "var(--color-sage-400)",
  "restricted-rural": "var(--color-ochre-500)",
  "approval-required": "var(--color-ochre-500)",
  "structure-required": "var(--color-ochre-500)",
  "leasehold-only": "var(--color-rust-400)",
  prohibited: "var(--color-rust-500)",
};

export default function DoctrineBrowser({ states }: { states: JurisdictionProfile[] }) {
  const [query, setQuery] = useState("");
  const [doctrine, setDoctrine] = useState<(typeof FILTERS)[number]["value"]>("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return states.filter((s) => {
      const regime = s.foreignOwnership?.regime;
      if (doctrine === "international" && s.subnational) return false;
      if (doctrine === "open" && regime !== "unrestricted") return false;
      if (doctrine === "closed" && (!regime || regime === "unrestricted")) return false;
      if (
        (doctrine === "tradable-entitlement" || doctrine === "prior-appropriation") &&
        s.surfaceDoctrine !== doctrine
      ) {
        return false;
      }
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.code.toLowerCase() === q ||
        s.agency.short.toLowerCase().includes(q) ||
        s.specialRegimes.some((r) => r.name.toLowerCase().includes(q))
      );
    });
  }, [states, query, doctrine]);

  return (
    <div>
      <div className="no-print flex flex-wrap gap-3 items-center">
        <input
          className="field max-w-xs"
          placeholder="Search state, agency or regime…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search states"
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setDoctrine(f.value)}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: doctrine === f.value ? "var(--accent)" : "var(--bg-sunken)",
                color: doctrine === f.value ? "var(--accent-fg)" : "var(--fg-muted)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs" style={{ color: "var(--fg-subtle)" }}>
        {visible.length} {visible.length === 1 ? "state" : "states"}
      </p>

      <div className="mt-4 space-y-3">
        {visible.map((s) => (
          <details key={s.code} className="surface overflow-hidden group">
            <summary className="cursor-pointer list-none p-4 flex flex-wrap items-center gap-x-4 gap-y-2 justify-between hover:bg-[var(--bg-sunken)]">
              <div className="flex items-baseline gap-3 min-w-0">
                <span className="font-mono text-xs" style={{ color: "var(--fg-subtle)" }}>
                  {s.subnational ? s.code.replace("US-", "") : s.code}
                </span>
                <span className="font-semibold tracking-tight">{s.name}</span>
                <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  {DOCTRINE_LABELS[s.surfaceDoctrine]}
                </span>
                {s.foreignOwnership ? (
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                    style={{ background: "var(--bg-sunken)", color: OWNERSHIP_TONE[s.foreignOwnership.regime] }}
                  >
                    {OWNERSHIP_LABELS[s.foreignOwnership.regime]}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span style={{ color: "var(--fg-subtle)" }}>
                  {s.forfeitureYears === null ? "No forfeiture" : `${s.forfeitureYears}-yr forfeiture`}
                </span>
                <span
                  className="rounded px-1.5 py-0.5 font-medium uppercase tracking-wide text-[10px]"
                  style={{ background: "var(--bg-sunken)", color: RISK_TONE[s.closedBasinRisk] }}
                >
                  {s.closedBasinRisk} closure risk
                </span>
              </div>
            </summary>

            <div className="px-4 pb-5 pt-1 text-sm space-y-4" style={{ borderTop: "1px solid var(--line)" }}>
              <p className="leading-relaxed pt-3">{s.notes}</p>

              <dl className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                <div>
                  <dt className="label">Groundwater regime</dt>
                  <dd className="mt-0.5">{GROUNDWATER_LABELS[s.groundwaterRegime]}</dd>
                </div>
                <div>
                  <dt className="label">Adjudication forum</dt>
                  <dd className="mt-0.5">{s.adjudicationForum}</dd>
                </div>
                <div>
                  <dt className="label">Transferability</dt>
                  <dd className="mt-0.5 capitalize">{s.transferability.replace(/-/g, " ")}</dd>
                </div>
                <div>
                  <dt className="label">New well permit required</dt>
                  <dd className="mt-0.5">{s.permitRequiredForNewWells ? "Yes" : "No"}</dd>
                </div>
              </dl>

              {s.exemptWellNote ? (
                <div>
                  <p className="label">Exempt wells</p>
                  <p className="mt-1 leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                    {s.exemptWellNote}
                  </p>
                </div>
              ) : null}

              <div>
                <p className="label">Agency of record</p>
                <p className="mt-1">
                  {s.agency.name} ·{" "}
                  <a href={s.agency.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
                    {s.agency.url.replace(/^https?:\/\//, "")}
                  </a>
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                  {s.agency.role}
                </p>
              </div>

              {s.foreignOwnership && s.countryRisk ? (
                <div>
                  <p className="label">Foreign buyers</p>
                  <p className="mt-1 leading-relaxed">{s.foreignOwnership.summary}</p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                    {s.foreignOwnership.ruralLandRule}
                  </p>
                  {s.foreignOwnership.borderCoastalRule ? (
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                      {s.foreignOwnership.borderCoastalRule}
                    </p>
                  ) : null}
                  {s.foreignOwnership.nomineeWarning ? (
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-rust-500)" }}>
                      {s.foreignOwnership.nomineeWarning}
                    </p>
                  ) : null}
                  <p className="mt-1.5 text-xs" style={{ color: "var(--fg-subtle)" }}>
                    Expropriation risk {s.countryRisk.expropriationRisk} · defective title risk{" "}
                    {s.countryRisk.titleReliability} · community claim risk {s.countryRisk.customaryTenureRisk}
                    {s.countryRisk.currencyControls ? " · exchange controls apply" : ""}
                  </p>
                </div>
              ) : null}

              {s.specialRegimes.length > 0 ? (
                <div>
                  <p className="label">Special regimes</p>
                  <ul className="mt-1.5 space-y-2">
                    {s.specialRegimes.map((r) => (
                      <li key={r.name} className="leading-relaxed">
                        <span className="font-medium">{r.name}</span>{" "}
                        <span
                          className="rounded px-1 py-0.5 text-[10px] font-bold uppercase tracking-wider align-middle"
                          style={{ background: "var(--bg-sunken)", color: RISK_TONE[r.severity] }}
                        >
                          {r.severity}
                        </span>
                        <span className="block text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
                          {r.effect} <em>Applies to: {r.appliesTo}.</em>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {s.cautions.length > 0 ? (
                <div>
                  <p className="label">Traps for buyers</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {s.cautions.map((c, i) => (
                      <li key={i} className="leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                        · {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {s.keyStatutes.length > 0 ? (
                <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>
                  {s.keyStatutes.join(" · ")}
                </p>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
