"use client";

import { useState } from "react";
import type { AcquisitionPlan, Assessment, ChecklistItem, ParcelInput } from "@/lib/types";
import { VERDICT_COPY } from "@/lib/water/engine";
import { DOCTRINE_LABELS, GROUNDWATER_LABELS } from "@/lib/water/states";
import { Bar, ScoreRing, SeverityBadge } from "@/components/ui";

const VERDICT_TONE: Record<string, string> = {
  pursue: "var(--color-sage-400)",
  investigate: "var(--accent)",
  caution: "var(--color-ochre-500)",
  walk: "var(--color-rust-500)",
};

const PHASE_LABELS: Record<ChecklistItem["phase"], string> = {
  "pre-offer": "Before you make an offer",
  diligence: "Diligence",
  escrow: "Contract & escrow",
  closing: "Closing",
  "post-close": "After closing",
};

const PHASE_ORDER: ChecklistItem["phase"][] = ["pre-offer", "diligence", "escrow", "closing", "post-close"];

function Section({ title, kicker, children }: { title: string; kicker?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      {kicker ? <p className="label">{kicker}</p> : null}
      <h2 className="mt-1 text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function PlanView({
  input,
  assessment,
  plan,
  onRestart,
  onEdit,
}: {
  input: ParcelInput;
  assessment: Assessment;
  plan: AcquisitionPlan;
  onRestart?: () => void;
  onEdit?: () => void;
}) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "locked" | "error">("idle");
  const verdict = VERDICT_COPY[assessment.verdict];
  const tone = VERDICT_TONE[assessment.verdict] ?? "var(--accent)";
  const sp = assessment.stateProfile;
  const wb = assessment.waterBalance;
  const [done, setDone] = useState<Set<string>>(new Set());

  const blocking = assessment.checklist.filter((c) => c.blocking);

  async function saveToPortfolio() {
    setSaveState("saving");
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: input.label,
          stateCode: input.stateCode,
          county: input.county,
          acres: input.acres,
          stage: "prospect",
          reliableAcreFeet: wb.reliableAcreFeet,
          irrigableAcres: input.irrigatedAcresPlanned ?? null,
          price: input.askingPrice ?? null,
          composite: assessment.composite,
          verdict: assessment.verdict,
          input,
        }),
      });
      if (res.status === 401) {
        setSaveState("locked");
        return;
      }
      setSaveState(res.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
  }

  function toggleDone(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="label">Acquisition plan</p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
            {input.label}
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--fg-muted)" }}>
            {input.acres.toLocaleString()} acres · {input.county} County, {sp.name} · {DOCTRINE_LABELS[sp.surfaceDoctrine]}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ScoreRing score={assessment.composite} />
          <div>
            <div className="text-lg font-semibold" style={{ color: tone }}>
              {verdict.label}
            </div>
            <div className="label mt-0.5">Composite / 100</div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg p-4 text-sm leading-relaxed" style={{ background: "var(--bg-sunken)", borderLeft: `3px solid ${tone}` }}>
        {verdict.blurb}
      </div>

      {/* Actions */}
      <div className="no-print mt-5 flex flex-wrap gap-2">
        <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
          Print / save PDF
        </button>
        <button type="button" className="btn btn-ghost" onClick={saveToPortfolio} disabled={saveState === "saving" || saveState === "saved"}>
          {saveState === "saved" ? "Added to portfolio" : saveState === "saving" ? "Saving…" : "Add to portfolio"}
        </button>
        {onEdit ? (
          <button type="button" className="btn btn-ghost" onClick={onEdit}>
            Edit answers
          </button>
        ) : null}
        {onRestart ? (
          <button type="button" className="btn btn-ghost" onClick={onRestart}>
            Screen another
          </button>
        ) : null}
      </div>
      {saveState === "locked" ? (
        <p className="no-print mt-2 text-xs" style={{ color: "var(--color-ochre-600)" }}>
          The portfolio is locked. Unlock it on the portfolio page, then save.
        </p>
      ) : null}
      {saveState === "error" ? (
        <p className="no-print mt-2 text-xs" style={{ color: "var(--color-rust-500)" }}>
          Could not save to the portfolio.
        </p>
      ) : null}

      {/* Thesis */}
      <Section title="The read" kicker={plan.templated ? "Deterministic summary" : "Strategist's take"}>
        <p className="text-[15px] leading-relaxed">{plan.thesis}</p>
        {plan.templated ? (
          <p className="mt-3 text-xs" style={{ color: "var(--fg-subtle)" }}>
            Generated from the rules engine without a language model. Set <code>ANTHROPIC_API_KEY</code> for the authored
            version — the analysis below is identical either way.
          </p>
        ) : null}
      </Section>

      {/* Water balance */}
      <Section title="Water balance" kicker="Risk-adjusted">
        <div className="surface p-5">
          <div className="grid gap-5 sm:grid-cols-4">
            {[
              { label: "Claimed", value: wb.claimedAcreFeet, unit: "AF/yr" },
              { label: "Needed", value: wb.requiredAcreFeet, unit: "AF/yr" },
              { label: "Reliable", value: wb.reliableAcreFeet, unit: "AF/yr", tone: "var(--accent)" },
              {
                label: "Shortfall",
                value: wb.shortfall,
                unit: "AF/yr",
                tone: (wb.shortfall ?? 0) > 0 ? "var(--color-rust-500)" : "var(--color-sage-400)",
              },
            ].map((cell) => (
              <div key={cell.label}>
                <div className="label">{cell.label}</div>
                <div className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: cell.tone }}>
                  {cell.value === null ? "—" : cell.value.toLocaleString()}
                </div>
                <div className="text-xs" style={{ color: "var(--fg-subtle)" }}>
                  {cell.unit}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 pt-4 text-sm leading-relaxed" style={{ borderTop: "1px solid var(--line)", color: "var(--fg-muted)" }}>
            A reliability factor of <strong style={{ color: "var(--fg)" }}>{wb.reliabilityFactor}</strong> was applied to the
            claimed volume, reflecting seniority, adjudication status, severance history, non-use exposure and aquifer trend
            — not physical hydrology. Underwrite the reliable figure, not the paper figure.
          </p>
          {wb.requiredAcreFeet === null ? (
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-ochre-600)" }}>
              No demand figure was computed, so the shortfall check did not run — the most valuable number on this page is
              missing. Go back and enter either the irrigated acres you plan to farm or the acre-feet per year you need.
            </p>
          ) : null}
        </div>
      </Section>

      {/* Category scores */}
      <Section title="Where the score comes from">
        <div className="space-y-4">
          {assessment.categories.map((c) => (
            <div key={c.category}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium">{c.label}</span>
                <span className="text-xs font-mono" style={{ color: "var(--fg-muted)" }}>
                  {c.score} · {Math.round(c.weight * 100)}% weight
                </span>
              </div>
              <div className="mt-1.5">
                <Bar
                  value={c.score}
                  tone={c.score >= 75 ? "var(--color-sage-400)" : c.score >= 50 ? "var(--accent)" : "var(--color-rust-500)"}
                />
              </div>
              {c.drivers.length > 0 ? (
                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--fg-subtle)" }}>
                  {c.drivers.join(" · ")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </Section>

      {/* Findings */}
      <Section title="Findings" kicker={`${assessment.findings.length} raised`}>
        <div className="space-y-3">
          {assessment.findings.map((f) => (
            <div key={f.id} className="surface p-4">
              <div className="flex items-start gap-2.5">
                <SeverityBadge severity={f.severity} />
                <h3 className="font-semibold text-[15px] leading-snug">{f.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                {f.detail}
              </p>
              <p className="mt-2.5 text-sm leading-relaxed">
                <span className="label">What to do</span>{" "}
                <span style={{ color: "var(--fg)" }}>{f.remedy}</span>
              </p>
              {f.cureCost ? (
                <p className="mt-1.5 text-xs" style={{ color: "var(--fg-subtle)" }}>
                  Cost to cure: {f.cureCost}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </Section>

      {/* Sequencing */}
      <Section title="The plan" kicker="In order">
        <ol className="space-y-4">
          {plan.sequencing.map((s) => (
            <li key={s.order} className="flex gap-4">
              <div
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
              >
                {s.order}
              </div>
              <div className="min-w-0 pt-0.5">
                <div className="flex flex-wrap items-baseline gap-x-2.5">
                  <h3 className="font-semibold">{s.title}</h3>
                  <span className="text-xs font-mono" style={{ color: "var(--fg-subtle)" }}>
                    {s.window}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                  {s.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* Checklist */}
      <Section
        title="Diligence checklist"
        kicker={`${assessment.checklist.length} items · ${blocking.length} blocking`}
      >
        <div className="space-y-6">
          {PHASE_ORDER.map((phase) => {
            const items = assessment.checklist.filter((c) => c.phase === phase);
            if (items.length === 0) return null;
            return (
              <div key={phase}>
                <h3 className="label">{PHASE_LABELS[phase]}</h3>
                <ul className="mt-2 space-y-2">
                  {items.map((item) => {
                    const checked = done.has(item.id);
                    return (
                      <li key={item.id} className="surface p-3.5">
                        <button
                          type="button"
                          className="flex items-start gap-3 text-left w-full"
                          onClick={() => toggleDone(item.id)}
                          aria-pressed={checked}
                        >
                          <span
                            aria-hidden="true"
                            className="mt-0.5 shrink-0 w-4 h-4 rounded-[4px] flex items-center justify-center text-[10px] font-bold"
                            style={{
                              border: `1px solid ${checked ? "var(--accent)" : "var(--line-strong)"}`,
                              background: checked ? "var(--accent)" : "transparent",
                              color: "var(--accent-fg)",
                            }}
                          >
                            {checked ? "✓" : ""}
                          </span>
                          <span className="min-w-0">
                            <span
                              className="block text-sm leading-relaxed"
                              style={{ textDecoration: checked ? "line-through" : undefined, opacity: checked ? 0.55 : 1 }}
                            >
                              {item.task}
                              {item.blocking ? (
                                <span
                                  className="ml-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider align-middle"
                                  style={{ background: "rgba(207,95,66,0.14)", color: "var(--color-rust-500)" }}
                                >
                                  Blocking
                                </span>
                              ) : null}
                            </span>
                            <span className="block mt-1 text-xs" style={{ color: "var(--fg-subtle)" }}>
                              {item.owner}
                            </span>
                            <span className="block mt-1 text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                              {item.rationale}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Seller questions */}
      <Section title="Questions for the seller" kicker="Send these in writing">
        <div className="space-y-3">
          {assessment.sellerQuestions.map((q, i) => (
            <div key={q.id} className="surface p-4">
              <div className="flex gap-3">
                <span className="text-xs font-mono shrink-0 pt-0.5" style={{ color: "var(--fg-subtle)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] leading-relaxed font-medium">{q.question}</p>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                    <span className="label">Reading the answer</span> {q.reading}
                  </p>
                  {q.documentRequested ? (
                    <p className="mt-1.5 text-xs" style={{ color: "var(--fg-subtle)" }}>
                      Ask for: {q.documentRequested}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Strategy */}
      <Section title="Negotiation">
        <p className="text-[15px] leading-relaxed">{plan.negotiationStrategy}</p>
      </Section>

      <Section title="Walk away if">
        <ul className="space-y-2">
          {plan.walkAwayTriggers.map((t, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span aria-hidden="true" style={{ color: "var(--color-rust-500)" }}>
                ✕
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Where to spend the diligence budget">
        <p className="text-[15px] leading-relaxed">{plan.budgetNotes}</p>
      </Section>

      <Section title="Portfolio fit">
        <p className="text-[15px] leading-relaxed">{plan.portfolioFit}</p>
      </Section>

      {/* State reference */}
      <Section title={`${sp.name} reference`} kicker="Governing law">
        <div className="surface p-5 text-sm space-y-3">
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {[
              ["Surface doctrine", DOCTRINE_LABELS[sp.surfaceDoctrine]],
              ["Groundwater regime", GROUNDWATER_LABELS[sp.groundwaterRegime]],
              ["Forfeiture period", sp.forfeitureYears === null ? "None" : `${sp.forfeitureYears} years of non-use`],
              ["Adjudication forum", sp.adjudicationForum],
              ["Transferability", sp.transferability.replace(/-/g, " ")],
              ["Basin closure risk", sp.closedBasinRisk],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="label">{k}</dt>
                <dd className="mt-0.5">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="pt-3" style={{ borderTop: "1px solid var(--line)" }}>
            <p className="label">Agency of record</p>
            <p className="mt-1">
              {sp.agency.name} —{" "}
              <a href={sp.agency.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
                {sp.agency.url.replace(/^https?:\/\//, "")}
              </a>
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--fg-muted)" }}>
              {sp.agency.role}
            </p>
          </div>
          {sp.cautions.length > 0 ? (
            <div className="pt-3" style={{ borderTop: "1px solid var(--line)" }}>
              <p className="label">State-specific traps</p>
              <ul className="mt-1.5 space-y-1.5">
                {sp.cautions.map((c, i) => (
                  <li key={i} className="leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                    · {c}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Section>

      <p className="mt-10 text-xs" style={{ color: "var(--fg-subtle)" }}>
        Generated {new Date(assessment.generatedAt).toLocaleString()} · Headgate is a diligence-routing tool, not legal
        advice. Confirm every item with the agency of record and counsel licensed in {sp.name}.
      </p>
    </div>
  );
}
