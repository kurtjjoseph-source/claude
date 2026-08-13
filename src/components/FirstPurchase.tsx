"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { BuyerProfile, FirstPurchaseBrief, FirstPurchaseGuide, GateStatus } from "@/lib/types";
import { READINESS_COPY } from "@/lib/first-purchase/engine";
import { BUYER_COUNTRIES } from "@/lib/water/registry";
import { ChoiceGroup, NumberField } from "@/components/ui";
import { saveProfileCookie } from "@/lib/profile-store";

const STEP_TITLES = ["Capital", "Goal & timeline", "Experience", "Where & how"];

const INITIAL: BuyerProfile = {
  totalCapital: 0,
  financing: "cash-only",
  targetAcres: 1000,
  monthsToFirstPurchase: 9,
  landExperience: "none",
  waterKnowledge: "none",
  operatingIntent: "lease-to-farmer",
  homeCountry: "US",
  canVisitInPerson: "yes",
  geographyPreference: "best-value-domestic",
  riskAppetite: "balanced",
};

const GATE_TONE: Record<GateStatus, { bg: string; fg: string; mark: string }> = {
  pass: { bg: "rgba(127,160,122,0.16)", fg: "var(--color-sage-600)", mark: "✓" },
  warn: { bg: "rgba(201,150,47,0.16)", fg: "var(--color-ochre-600)", mark: "!" },
  fail: { bg: "rgba(207,95,66,0.14)", fg: "var(--color-rust-600)", mark: "✕" },
};

function money(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

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

export default function FirstPurchase() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<BuyerProfile>(INITIAL);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ guide: FirstPurchaseGuide; brief: FirstPurchaseBrief } | null>(null);

  function set<K extends keyof BuyerProfile>(key: K, value: BuyerProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  const canContinue = useMemo(() => {
    if (step === 0) return profile.totalCapital > 0;
    if (step === 1) return profile.targetAcres > 0 && profile.monthsToFirstPurchase > 0;
    return true;
  }, [step, profile.totalCapital, profile.targetAcres, profile.monthsToFirstPurchase]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/first-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = Array.isArray(data?.issues)
          ? data.issues.map((i: { path: string; message: string }) => `${i.path}: ${i.message}`).join("; ")
          : "";
        throw new Error(detail || data?.error || "Something went wrong building your guide.");
      }
      setResult({ guide: data.guide, brief: data.brief });
      // Written as a cookie so the listings pages can match server-side.
      saveProfileCookie(profile);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  // -------------------------------------------------------------------------
  // Guide
  // -------------------------------------------------------------------------
  if (result) {
    const { guide, brief } = result;
    const readiness = READINESS_COPY[guide.readiness.band];
    const b = guide.budget;

    return (
      <div className="mx-auto max-w-4xl px-5 py-10">
        <p className="label">Your first purchase</p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
          {readiness.label}
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--fg-muted)" }}>
          {guide.readiness.headline}
        </p>

        <div className="no-print mt-5 flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
            Print / save PDF
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => { setResult(null); setStep(0); }}>
            Change my answers
          </button>
          <Link href="/listings" className="btn btn-primary">
            See matched listings
          </Link>
        </div>

        <Section title="The read" kicker={brief.templated ? "Deterministic summary" : "Your brief"}>
          <p className="text-[15px] leading-relaxed">{brief.opening}</p>
          {brief.templated ? (
            <p className="mt-3 text-xs" style={{ color: "var(--fg-subtle)" }}>
              Generated from the rules engine without a language model. Set <code>ANTHROPIC_API_KEY</code> for the authored
              version — the numbers below are identical either way.
            </p>
          ) : null}
        </Section>

        {/* Budget */}
        <Section title="What you can actually spend" kicker="Budget envelope">
          <div className="surface p-5">
            <div className="grid gap-5 sm:grid-cols-4">
              {[
                { label: "On the land", value: money(b.maxPurchasePrice), tone: "var(--accent)" },
                { label: "Diligence", value: money(b.diligenceProgram) },
                { label: "Closing costs", value: money(b.estimatedClosingCosts) },
                { label: "Reserve", value: money(b.workingReserve) },
              ].map((c) => (
                <div key={c.label}>
                  <div className="label">{c.label}</div>
                  <div className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: c.tone }}>
                    {c.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--line)" }}>
              <p className="label">What that buys, at different land prices</p>
              <div className="mt-2 overflow-x-auto">
                <table className="text-sm w-full">
                  <thead>
                    <tr style={{ color: "var(--fg-subtle)" }}>
                      {b.impliedAcres.map((i) => (
                        <th key={i.pricePerAcre} className="text-left font-medium pr-6 pb-1 whitespace-nowrap">
                          ${i.pricePerAcre.toLocaleString()}/ac
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {b.impliedAcres.map((i) => (
                        <td key={i.pricePerAcre} className="pr-6 font-mono whitespace-nowrap">
                          {i.acres.toLocaleString()} ac
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--fg-subtle)" }}>
                Reference points, not a market forecast. Land prices are local and this tool does not carry price data.
              </p>
            </div>

            <ul className="mt-4 pt-4 space-y-2 text-sm" style={{ borderTop: "1px solid var(--line)", color: "var(--fg-muted)" }}>
              {b.notes.map((n, i) => (
                <li key={i} className="leading-relaxed">
                  · {n}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* Gates */}
        <Section title="Where you stand" kicker={`${guide.readiness.gates.length} checks`}>
          <div className="space-y-2.5">
            {guide.readiness.gates.map((g) => {
              const t = GATE_TONE[g.status];
              return (
                <div key={g.id} className="surface p-4 flex gap-3">
                  <span
                    aria-hidden="true"
                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5"
                    style={{ background: t.bg, color: t.fg }}
                  >
                    {t.mark}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[15px] leading-snug">{g.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                      {g.detail}
                    </p>
                    {g.action ? (
                      <p className="mt-1.5 text-sm leading-relaxed">
                        <span className="label">Do this</span> {g.action}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="What a good first parcel looks like">
          <p className="text-[15px] leading-relaxed">{brief.whatGoodLooksLike}</p>
          <div className="mt-4 surface p-5 text-sm">
            <p className="leading-relaxed" style={{ color: "var(--fg-muted)" }}>
              {guide.targetProfile.rationale}
            </p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="label" style={{ color: "var(--color-sage-600)" }}>
                  Look for
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {guide.targetProfile.prefer.map((p, i) => (
                    <li key={i} className="leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                      · {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="label" style={{ color: "var(--color-rust-500)" }}>
                  Walk away from
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {guide.targetProfile.avoid.map((p, i) => (
                    <li key={i} className="leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                      · {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-4 pt-3 text-xs" style={{ borderTop: "1px solid var(--line)", color: "var(--fg-subtle)" }}>
              Target size {guide.targetProfile.acreBandLow.toLocaleString()}–{guide.targetProfile.acreBandHigh.toLocaleString()} acres ·
              only pursue parcels scoring {guide.targetProfile.minComposite}+ in the parcel wizard
            </p>
          </div>
        </Section>

        <Section title="Where to look first" kicker="Shortlist for a first purchase">
          <p className="text-sm mb-4 max-w-2xl" style={{ color: "var(--fg-muted)" }}>
            Ranked on two things at once. <strong>Ease</strong> is how simple the place is to transact in as a first-time
            buyer; <strong>water value</strong> is whether water there is an asset worth building a position around. They pull
            in opposite directions — the simplest states are riparian ones where water just runs with the land — so the
            ranking blends them according to your risk appetite, and both numbers are shown so you can see the trade.
          </p>
          <div className="space-y-2.5">
            {guide.shortlist.map((p) => (
              <div key={p.code} className="surface p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="font-semibold">{p.name}</h3>
                  <span className="text-xs font-mono" style={{ color: "var(--fg-subtle)" }}>
                    ease {p.ease} · water value {p.waterValue}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                  {p.why}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed">
                  <span className="label">Watch out</span> <span style={{ color: "var(--fg-muted)" }}>{p.watchOut}</span>
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="The biggest risk for you specifically">
          <p className="text-[15px] leading-relaxed">{brief.biggestRisk}</p>
        </Section>

        <Section title="This week">
          <ol className="space-y-2.5">
            {brief.thisWeek.map((t, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                >
                  {i + 1}
                </span>
                <span className="text-[15px] leading-relaxed pt-0.5">{t}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="From here to closing" kicker="Sequenced">
          <ol className="space-y-4">
            {guide.steps.map((s) => (
              <li key={s.order} className="flex gap-4">
                <div
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{
                    background: s.gate ? "var(--accent)" : "var(--accent-soft)",
                    color: s.gate ? "var(--accent-fg)" : "var(--accent)",
                  }}
                >
                  {s.order}
                </div>
                <div className="min-w-0 pt-0.5">
                  <div className="flex flex-wrap items-baseline gap-x-2.5">
                    <h3 className="font-semibold">{s.title}</h3>
                    <span className="text-xs font-mono" style={{ color: "var(--fg-subtle)" }}>
                      {s.window}
                    </span>
                    {s.gate ? (
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: "var(--bg-sunken)", color: "var(--accent)" }}
                      >
                        Gate
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                    {s.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="How to search" kicker="Search brief">
          <div className="surface p-5 text-sm space-y-4">
            <div>
              <p className="label">Where the inventory actually is</p>
              <ul className="mt-1.5 space-y-1.5">
                {guide.searchBrief.channels.map((c, i) => (
                  <li key={i} className="leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                    · {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-3" style={{ borderTop: "1px solid var(--line)" }}>
              <p className="label">Filters</p>
              <ul className="mt-1.5 space-y-1.5">
                {guide.searchBrief.filters.map((c, i) => (
                  <li key={i} className="leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                    · {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-3" style={{ borderTop: "1px solid var(--line)" }}>
              <p className="label">Ask on first contact</p>
              <ul className="mt-1.5 space-y-1.5">
                {guide.searchBrief.firstContactQuestions.map((c, i) => (
                  <li key={i} className="leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                    {i + 1}. {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section title="Learn these before you offer" kicker="Not after">
          <div className="space-y-3">
            {guide.learning.map((l) => (
              <div key={l.topic} className="surface p-4">
                <h3 className="font-semibold text-[15px]">{l.topic}</h3>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                  {l.why}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed">
                  <span className="label">How</span> <span style={{ color: "var(--fg-muted)" }}>{l.how}</span>
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section title={`Getting to ${profile.targetAcres.toLocaleString()} acres`} kicker="The next real purchase">
          <div className="surface p-5">
            {guide.pathToTarget.firstPurchaseAcres !== null ? (
              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <div className="label">First purchase</div>
                  <div className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--accent)" }}>
                    ~{guide.pathToTarget.firstPurchaseAcres.toLocaleString()} ac
                  </div>
                </div>
                <div>
                  <div className="label">Purchases after that</div>
                  <div className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-serif)" }}>
                    {guide.pathToTarget.parcelsAtThisSize ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="label">Years at your cadence</div>
                  <div className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-serif)" }}>
                    {guide.pathToTarget.yearsAtCurrentCadence ?? "—"}
                  </div>
                </div>
              </div>
            ) : null}
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
              {guide.pathToTarget.cadenceNote}
            </p>
            <p className="mt-3 pt-3 text-sm leading-relaxed" style={{ borderTop: "1px solid var(--line)", color: "var(--fg-muted)" }}>
              {guide.pathToTarget.compoundingNote}
            </p>
          </div>
          <p className="mt-5 text-[15px] leading-relaxed">{brief.encouragement}</p>
        </Section>

        <div className="no-print mt-10 flex flex-wrap gap-3">
          <Link href="/wizard" className="btn btn-primary">
            Screen your first parcel
          </Link>
          <Link href="/doctrine" className="btn btn-ghost">
            Read the jurisdiction entry
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Intake
  // -------------------------------------------------------------------------
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-8">
        <p className="label">
          Step {step + 1} of {STEP_TITLES.length}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
          {STEP_TITLES[step]}
        </h1>
        <div className="mt-4 flex gap-1.5">
          {STEP_TITLES.map((t, i) => (
            <button
              key={t}
              type="button"
              aria-label={`Go to step ${i + 1}: ${t}`}
              disabled={i > step}
              onClick={() => setStep(i)}
              className="h-1 flex-1 rounded-full transition-colors disabled:cursor-not-allowed"
              style={{ background: i <= step ? "var(--accent)" : "var(--bg-sunken)" }}
            />
          ))}
        </div>
      </div>

      <div className="surface p-6 space-y-6">
        {step === 0 && (
          <>
            <NumberField
              label="Capital available for this purchase *"
              hint="Everything you could put in, all-in. This has to cover diligence and a reserve as well as the land."
              value={profile.totalCapital || undefined}
              onChange={(v) => set("totalCapital", v ?? 0)}
              prefix="$"
              placeholder="250000"
            />
            <ChoiceGroup
              label="How are you paying?"
              value={profile.financing}
              onChange={(v) => set("financing", v)}
              options={[
                { value: "cash-only", label: "Cash", hint: "Strongest negotiating position" },
                { value: "bank", label: "Bank / Farm Credit", hint: "Expect 35-50% down on raw land" },
                { value: "seller-carry", label: "Seller carry" },
                { value: "partners", label: "With partners" },
                { value: "undecided", label: "Undecided" },
              ]}
              columns={2}
            />
            <NumberField
              label="Roughly how much could you add each year afterwards?"
              hint="Optional. Used to project how long the acreage target takes."
              value={profile.annualAddition}
              onChange={(v) => set("annualAddition", v)}
              prefix="$"
              placeholder="75000"
            />
          </>
        )}

        {step === 1 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label="Acreage target *"
                hint="The whole programme, not this purchase."
                value={profile.targetAcres || undefined}
                onChange={(v) => set("targetAcres", v ?? 0)}
                suffix="acres"
              />
              <NumberField
                label="Months to first purchase *"
                hint="Six is a realistic floor from a standing start."
                value={profile.monthsToFirstPurchase || undefined}
                onChange={(v) => set("monthsToFirstPurchase", v ?? 0)}
                suffix="months"
              />
            </div>
            <NumberField
              label="Expected price per acre where you're looking"
              hint="Optional. If you know your market, this sharpens the acreage and timeline projections."
              value={profile.expectedPricePerAcre}
              onChange={(v) => set("expectedPricePerAcre", v)}
              prefix="$"
              placeholder="3000"
            />
          </>
        )}

        {step === 2 && (
          <>
            <ChoiceGroup
              label="Have you bought land before?"
              value={profile.landExperience}
              onChange={(v) => set("landExperience", v)}
              options={[
                { value: "none", label: "Never bought property" },
                { value: "residential-only", label: "A house, but not land" },
                { value: "one-or-two-rural", label: "One or two rural parcels" },
                { value: "experienced", label: "Several rural purchases" },
              ]}
              columns={2}
            />
            <ChoiceGroup
              label="How well do you know water rights?"
              hint="Honest answers produce a better guide. This is the part most first-time buyers have not met before."
              value={profile.waterKnowledge}
              onChange={(v) => set("waterKnowledge", v)}
              options={[
                { value: "none", label: "New to it" },
                { value: "some", label: "I know the basics" },
                { value: "strong", label: "I've dealt with them" },
              ]}
              columns={3}
            />
            <ChoiceGroup
              label="What will you do with the land?"
              value={profile.operatingIntent}
              onChange={(v) => set("operatingIntent", v)}
              options={[
                { value: "passive-hold", label: "Hold it", hint: "No operation — cheapest to diligence" },
                { value: "lease-to-farmer", label: "Lease to a local operator", hint: "Income without agronomic risk" },
                { value: "operate-myself", label: "Farm it myself", hint: "Highest return, highest learning curve" },
              ]}
              columns={3}
            />
          </>
        )}

        {step === 3 && (
          <>
            <label className="block">
              <span className="label">Where are you based?</span>
              <span className="block mb-1.5" />
              <select className="field" value={profile.homeCountry} onChange={(e) => set("homeCountry", e.target.value)}>
                {BUYER_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <ChoiceGroup
              label="Where are you willing to buy?"
              value={profile.geographyPreference}
              onChange={(v) => set("geographyPreference", v)}
              options={[
                { value: "near-home", label: "Close to home", hint: "You can visit often" },
                { value: "best-value-domestic", label: "Anywhere in my country" },
                { value: "international", label: "Abroad" },
                { value: "open", label: "Open to anything" },
              ]}
              columns={2}
            />
            <ChoiceGroup
              label="Can you visit the property in person before buying?"
              hint="Occupation, access and well condition never appear in any record."
              value={profile.canVisitInPerson}
              onChange={(v) => set("canVisitInPerson", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "unknown", label: "Not sure" },
              ]}
              columns={3}
            />
            <ChoiceGroup
              label="Risk appetite"
              value={profile.riskAppetite}
              onChange={(v) => set("riskAppetite", v)}
              options={[
                { value: "conservative", label: "Conservative", hint: "Certainty over upside" },
                { value: "balanced", label: "Balanced" },
                { value: "aggressive", label: "Aggressive", hint: "Will trade simplicity for water value" },
              ]}
              columns={3}
            />
          </>
        )}

        {error ? (
          <div
            className="rounded-lg p-3 text-sm"
            style={{ background: "rgba(207,95,66,0.12)", color: "var(--color-rust-600)" }}
            role="alert"
          >
            {error}
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button type="button" className="btn btn-ghost" disabled={step === 0 || busy} onClick={() => setStep((s) => s - 1)}>
          Back
        </button>
        {step < STEP_TITLES.length - 1 ? (
          <button type="button" className="btn btn-primary" disabled={!canContinue || busy} onClick={() => setStep((s) => s + 1)}>
            Continue
          </button>
        ) : (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={submit}>
            {busy ? "Building your guide…" : "Build my buyer's guide"}
          </button>
        )}
      </div>

      {!canContinue ? (
        <p className="mt-3 text-xs" style={{ color: "var(--fg-subtle)" }}>
          {step === 0 ? "Enter the capital available to continue." : "Fill in the required fields to continue."}
        </p>
      ) : null}
    </div>
  );
}
