"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { Holding, HoldingStage, PortfolioGoal } from "@/lib/types";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/portfolio/goal";
import { JURISDICTIONS } from "@/lib/water/registry";
import { NumberField, TextField } from "@/components/ui";

interface Runway {
  avgParcelAcres: number;
  avgPricePerAcre: number;
  parcelsRemaining: number | null;
  capitalRemaining: number | null;
  funnelCoverage: number;
}

interface Payload {
  holdings: Holding[];
  goal: PortfolioGoal;
  runway: Runway;
}

const STAGE_TONE: Record<HoldingStage, string> = {
  prospect: "var(--fg-subtle)",
  diligence: "var(--color-ochre-500)",
  loi: "var(--color-sage-400)",
  "under-contract": "var(--color-sage-600)",
  closed: "var(--accent)",
  passed: "var(--color-rust-500)",
};

function money(n: number | null): string {
  if (n === null || n === 0) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1000)}k`;
  return `$${n}`;
}

function Metric({ value, label, sub, tone }: { value: string; label: string; sub?: string; tone?: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)", color: tone }}>
        {value}
      </div>
      <div className="label mt-1">{label}</div>
      {sub ? (
        <div className="text-xs mt-0.5" style={{ color: "var(--fg-subtle)" }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}

export default function PortfolioDashboard({ initial }: { initial: Payload }) {
  const [data, setData] = useState<Payload>(initial);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    label: "",
    jurisdictionCode: "US-CO",
    county: "",
    acres: undefined as number | undefined,
    price: undefined as number | undefined,
    reliableAcreFeet: undefined as number | undefined,
    stage: "prospect" as HoldingStage,
  });

  /** Re-reads the roll-up after a mutation. The first render is server-provided. */
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio");
      if (!res.ok) throw new Error("Could not load the portfolio.");
      setData((await res.json()) as Payload);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the portfolio.");
    }
  }, []);

  async function setStage(id: string, stage: HoldingStage) {
    await fetch(`/api/portfolio/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
    await load();
  }

  async function setTarget(targetAcres: number) {
    await fetch("/api/portfolio", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetAcres }),
    });
    await load();
  }

  async function addHolding(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.label.trim() || !draft.acres) return;
    await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: draft.label,
        jurisdictionCode: draft.jurisdictionCode,
        county: draft.county,
        acres: draft.acres,
        stage: draft.stage,
        price: draft.price ?? null,
        reliableAcreFeet: draft.reliableAcreFeet ?? null,
        irrigableAcres: null,
        composite: null,
        verdict: null,
      }),
    });
    setDraft({ label: "", jurisdictionCode: "US-CO", county: "", acres: undefined, price: undefined, reliableAcreFeet: undefined, stage: "prospect" });
    setAdding(false);
    await load();
  }

  const grouped = useMemo(
    () =>
      STAGE_ORDER.map((stage) => ({
        stage,
        items: data.holdings.filter((h) => h.stage === stage),
      })).filter((g) => g.items.length > 0),
    [data],
  );

  const { goal, runway, holdings } = data;
  const bars = [
    { label: "Closed", value: goal.closedAcres, tone: "var(--accent)" },
    { label: "Under contract / LOI", value: goal.committedAcres, tone: "var(--color-sage-400)" },
    { label: "Pipeline", value: goal.pipelineAcres, tone: "var(--color-ochre-500)" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label">Private dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
            {goal.closedAcres.toLocaleString()} of {goal.targetAcres.toLocaleString()} acres
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--fg-muted)" }}>
            {goal.percentComplete}% closed · {goal.remainingAcres.toLocaleString()} acres remaining
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/wizard" className="btn btn-primary">
            Screen a parcel
          </Link>
          <button type="button" className="btn btn-ghost" onClick={() => setAdding((v) => !v)}>
            {adding ? "Cancel" : "Add holding"}
          </button>
        </div>
      </div>

      {error ? (
        <div
          className="mt-6 rounded-lg p-3 text-sm"
          style={{ background: "rgba(207,95,66,0.12)", color: "var(--color-rust-600)" }}
          role="alert"
        >
          {error} The figures below may be out of date.
        </div>
      ) : null}

      {/* Goal bars */}
      <div className="mt-8 surface p-6">
        <div className="space-y-4">
          {bars.map((b) => (
            <div key={b.label}>
              <div className="flex justify-between text-sm">
                <span>{b.label}</span>
                <span className="font-mono" style={{ color: "var(--fg-muted)" }}>
                  {b.value.toLocaleString()} ac
                </span>
              </div>
              <div className="mt-1.5 h-2.5 rounded-full overflow-hidden" style={{ background: "var(--bg-sunken)" }}>
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${Math.min(100, (b.value / goal.targetAcres) * 100)}%`, background: b.tone }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-5 grid gap-6 grid-cols-2 sm:grid-cols-4" style={{ borderTop: "1px solid var(--line)" }}>
          <Metric
            value={goal.waterSecuredAcres.toLocaleString()}
            label="Water-secured acres"
            sub="Closed, scored 60+, with reliable supply"
            tone="var(--accent)"
          />
          <Metric value={goal.totalReliableAcreFeet.toLocaleString()} label="Reliable AF/yr" sub="Risk-adjusted, closed only" />
          <Metric value={money(goal.capitalDeployed)} label="Capital deployed" sub={`${money(goal.capitalCommitted)} committed`} />
          <Metric
            value={goal.averageComposite === null ? "—" : String(goal.averageComposite)}
            label="Avg deal quality"
            sub="Acreage-weighted composite"
          />
        </div>
      </div>

      {/* Runway */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="surface p-5">
          <Metric
            value={runway.parcelsRemaining === null ? "—" : String(runway.parcelsRemaining)}
            label="Parcels to target"
            sub={runway.avgParcelAcres > 0 ? `At your ${runway.avgParcelAcres} ac average` : "Close one deal to project"}
          />
        </div>
        <div className="surface p-5">
          <Metric
            value={money(runway.capitalRemaining)}
            label="Capital to target"
            sub={runway.avgPricePerAcre > 0 ? `At $${runway.avgPricePerAcre.toLocaleString()}/ac` : "Close one deal to project"}
          />
        </div>
        <div className="surface p-5">
          <Metric
            value={`${runway.funnelCoverage}%`}
            label="Funnel coverage"
            sub="Committed + pipeline vs. remaining"
            tone={runway.funnelCoverage >= 100 ? "var(--color-sage-400)" : "var(--color-ochre-500)"}
          />
        </div>
      </div>

      {/* Add form */}
      {adding ? (
        <form onSubmit={addHolding} className="mt-4 surface p-5 space-y-4">
          <p className="label">New holding</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Label" required value={draft.label} onChange={(v) => setDraft((d) => ({ ...d, label: v }))} />
            <TextField label="County" value={draft.county} onChange={(v) => setDraft((d) => ({ ...d, county: v }))} />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <label className="block">
              <span className="label">State</span>
              <span className="block mb-1.5" />
              <select className="field" value={draft.jurisdictionCode} onChange={(e) => setDraft((d) => ({ ...d, jurisdictionCode: e.target.value }))}>
                {JURISDICTIONS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code}
                  </option>
                ))}
              </select>
            </label>
            <NumberField label="Acres" value={draft.acres} onChange={(v) => setDraft((d) => ({ ...d, acres: v }))} />
            <NumberField label="Price" value={draft.price} onChange={(v) => setDraft((d) => ({ ...d, price: v }))} prefix="$" />
            <NumberField
              label="Reliable water"
              value={draft.reliableAcreFeet}
              onChange={(v) => setDraft((d) => ({ ...d, reliableAcreFeet: v }))}
              suffix="AF"
            />
          </div>
          <label className="block max-w-xs">
            <span className="label">Stage</span>
            <span className="block mb-1.5" />
            <select
              className="field"
              value={draft.stage}
              onChange={(e) => setDraft((d) => ({ ...d, stage: e.target.value as HoldingStage }))}
            >
              {STAGE_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn btn-primary" disabled={!draft.label.trim() || !draft.acres}>
            Add
          </button>
        </form>
      ) : null}

      {/* Holdings */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
          Holdings
        </h2>

        {holdings.length === 0 ? (
          <p className="mt-4 text-sm" style={{ color: "var(--fg-muted)" }}>
            Nothing tracked yet. Screen a parcel and add it from the plan, or add one directly above.
          </p>
        ) : (
          <div className="mt-4 space-y-7">
            {grouped.map((g) => (
              <div key={g.stage}>
                <div className="flex items-baseline gap-2">
                  <h3 className="label" style={{ color: STAGE_TONE[g.stage] }}>
                    {STAGE_LABELS[g.stage]}
                  </h3>
                  <span className="text-xs" style={{ color: "var(--fg-subtle)" }}>
                    {g.items.reduce((t, h) => t + h.acres, 0).toLocaleString()} ac
                  </span>
                </div>
                <div className="mt-2 space-y-2">
                  {g.items.map((h) => (
                    <div key={h.id} className="surface p-4 flex flex-wrap items-center gap-x-5 gap-y-3 justify-between">
                      <div className="min-w-0">
                        <div className="font-medium">{h.label}</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
                          {h.acres.toLocaleString()} ac · {h.county ? `${h.county} County, ` : ""}
                          {h.jurisdictionCode}
                          {h.reliableAcreFeet ? ` · ${h.reliableAcreFeet} AF/yr` : ""}
                          {h.price ? ` · ${money(h.price)}` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {h.composite !== null ? (
                          <span
                            className="rounded px-2 py-1 text-xs font-mono"
                            style={{
                              background: "var(--bg-sunken)",
                              color:
                                h.composite >= 78
                                  ? "var(--color-sage-400)"
                                  : h.composite >= 60
                                    ? "var(--accent)"
                                    : h.composite >= 42
                                      ? "var(--color-ochre-500)"
                                      : "var(--color-rust-500)",
                            }}
                          >
                            {h.composite}
                          </span>
                        ) : null}
                        <select
                          className="field text-xs py-1.5 w-auto"
                          value={h.stage}
                          onChange={(e) => void setStage(h.id, e.target.value as HoldingStage)}
                          aria-label={`Stage for ${h.label}`}
                        >
                          {STAGE_ORDER.map((s) => (
                            <option key={s} value={s}>
                              {STAGE_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => void remove(h.id)}
                          className="text-xs px-2 py-1.5 rounded-md hover:bg-[var(--bg-sunken)]"
                          style={{ color: "var(--fg-subtle)" }}
                          aria-label={`Remove ${h.label}`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Target */}
      <section className="mt-12 pt-6" style={{ borderTop: "1px solid var(--line)" }}>
        <label className="block max-w-xs">
          <span className="label">Acreage target</span>
          <span className="block mb-1.5" />
          <input
            type="number"
            className="field"
            defaultValue={goal.targetAcres}
            min={1}
            onBlur={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v) && v > 0 && v !== goal.targetAcres) void setTarget(v);
            }}
          />
        </label>
        <p className="mt-2 text-xs" style={{ color: "var(--fg-subtle)" }}>
          Changes save when the field loses focus.
        </p>
      </section>
    </div>
  );
}
