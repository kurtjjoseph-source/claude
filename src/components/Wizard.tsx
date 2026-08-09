"use client";

import { useMemo, useState } from "react";
import type { AcquisitionPlan, Assessment, DocumentId, ParcelInput } from "@/lib/types";
import { STATE_LIST, DOCTRINE_LABELS } from "@/lib/water/states";
import { CheckGroup, ChoiceGroup, NumberField, TextField } from "@/components/ui";
import PlanView from "@/components/PlanView";

const YES_NO_UNKNOWN = [
  { value: "yes" as const, label: "Yes" },
  { value: "no" as const, label: "No" },
  { value: "unknown" as const, label: "Don't know" },
];

const DOCUMENTS: Array<{ value: DocumentId; label: string }> = [
  { value: "state-permit-or-decree", label: "State permit, certificate or decree" },
  { value: "deed-with-water-language", label: "Deed showing water rights language" },
  { value: "title-commitment", label: "Title commitment" },
  { value: "historical-use-records", label: "Historical beneficial use records" },
  { value: "well-log-and-completion-report", label: "Well log / completion report" },
  { value: "pump-test", label: "Pump test results" },
  { value: "engineers-report", label: "Engineer's report" },
  { value: "ditch-company-share-certificate", label: "Ditch company share certificate" },
  { value: "assessment-history", label: "Assessment / district billing history" },
  { value: "survey", label: "Survey" },
  { value: "water-quality-analysis", label: "Water quality analysis" },
];

const INITIAL: ParcelInput = {
  label: "",
  stateCode: "CO",
  county: "",
  acres: 0,
  intent: "irrigated-crop",
  surfaceRight: "unknown",
  adjudication: "unknown",
  appurtenant: "unknown",
  previouslySevered: "unknown",
  wellStatus: "none",
  aquiferTrend: "unknown",
  inManagedDistrict: "unknown",
  documents: [],
  legalAccess: "unknown",
  mineralEstateSevered: "unknown",
  conservationEasement: "unknown",
  existingLiens: "unknown",
  tribalOrFederalClaimsInBasin: "unknown",
};

const STEP_TITLES = [
  "Location & size",
  "What the water is for",
  "The surface right",
  "Wells & groundwater",
  "Evidence on hand",
  "Land, title & access",
  "Deal terms",
];

interface Result {
  input: ParcelInput;
  assessment: Assessment;
  plan: AcquisitionPlan;
}

export default function Wizard() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<ParcelInput>(INITIAL);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const profile = useMemo(() => STATE_LIST.find((s) => s.code === input.stateCode) ?? null, [input.stateCode]);
  const appropriative = profile?.surfaceDoctrine === "prior-appropriation" || profile?.surfaceDoctrine === "hybrid";

  function set<K extends keyof ParcelInput>(key: K, value: ParcelInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDoc(doc: DocumentId) {
    setInput((prev) => ({
      ...prev,
      documents: prev.documents.includes(doc)
        ? prev.documents.filter((d) => d !== doc)
        : [...prev.documents, doc],
    }));
  }

  const stepValid = useMemo(() => {
    if (step === 0) return input.label.trim().length > 0 && input.county.trim().length > 0 && input.acres > 0;
    return true;
  }, [step, input.label, input.county, input.acres]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = Array.isArray(data?.issues)
          ? data.issues.map((i: { path: string; message: string }) => `${i.path}: ${i.message}`).join("; ")
          : "";
        throw new Error(detail || data?.error || "Something went wrong generating the plan.");
      }
      setResult(data as Result);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <PlanView
        input={result.input}
        assessment={result.assessment}
        plan={result.plan}
        onRestart={() => {
          setResult(null);
          setStep(0);
          setInput(INITIAL);
        }}
        onEdit={() => {
          setResult(null);
          setStep(0);
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between">
          <p className="label">
            Step {step + 1} of {STEP_TITLES.length}
          </p>
          <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>
            {profile ? `${profile.name} · ${DOCTRINE_LABELS[profile.surfaceDoctrine]}` : ""}
          </p>
        </div>
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
        {/* ---------------------------------------------------------------- */}
        {step === 0 && (
          <>
            <TextField
              label="Parcel name"
              required
              hint="Anything you'll recognize later — the listing name, the road, the seller."
              value={input.label}
              onChange={(v) => set("label", v)}
              placeholder="North quarter, Sand Creek Rd"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">State *</span>
                <span className="block mb-1.5" />
                <select className="field" value={input.stateCode} onChange={(e) => set("stateCode", e.target.value)}>
                  {STATE_LIST.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <TextField label="County" required value={input.county} onChange={(v) => set("county", v)} placeholder="Prowers" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="Deeded acres *" value={input.acres || undefined} onChange={(v) => set("acres", v ?? 0)} suffix="acres" placeholder="160" />
              <TextField label="APN / parcel number" value={input.apn ?? ""} onChange={(v) => set("apn", v)} placeholder="Optional" />
            </div>
            <TextField
              label="Basin or watercourse"
              hint="The river, creek or aquifer the water comes from, if you know it."
              value={input.basinOrWatercourse ?? ""}
              onChange={(v) => set("basinOrWatercourse", v)}
              placeholder="Arkansas River / Ogallala"
            />

            {profile ? (
              <div className="rounded-lg p-4 text-sm" style={{ background: "var(--bg-sunken)" }}>
                <p className="label">What governs here</p>
                <p className="mt-2 leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                  {profile.notes}
                </p>
                <p className="mt-2 text-xs" style={{ color: "var(--fg-subtle)" }}>
                  Agency of record: {profile.agency.name}
                </p>
              </div>
            ) : null}
          </>
        )}

        {/* ---------------------------------------------------------------- */}
        {step === 1 && (
          <>
            <ChoiceGroup
              label="What do you want the water for?"
              hint="This sets the volume the engine tests the supply against, and whether a change of use is required."
              value={input.intent}
              onChange={(v) => set("intent", v)}
              options={[
                { value: "irrigated-crop", label: "Irrigated cropland", hint: "Roughly 3 acre-feet per acre per year" },
                { value: "pasture-grazing", label: "Irrigated pasture", hint: "Roughly 2 acre-feet per acre" },
                { value: "livestock", label: "Livestock water only", hint: "Small volume, often exempt" },
                { value: "domestic-homestead", label: "Domestic / homestead", hint: "House, yard, small garden" },
                { value: "recharge-banking", label: "Recharge or water banking", hint: "Requires a change application in most states" },
                { value: "development", label: "Development", hint: "Requires a change application and an assured supply showing" },
                { value: "conservation-hold", label: "Conservation or long-term hold", hint: "No consumptive requirement" },
              ]}
              columns={2}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label="Irrigated acres planned"
                hint="Leave blank if not irrigating."
                value={input.irrigatedAcresPlanned}
                onChange={(v) => set("irrigatedAcresPlanned", v)}
                suffix="acres"
              />
              <NumberField
                label="Annual water needed"
                hint="Optional — the engine estimates this from acreage if left blank."
                value={input.intendedAcreFeet}
                onChange={(v) => set("intendedAcreFeet", v)}
                suffix="AF/yr"
              />
            </div>
          </>
        )}

        {/* ---------------------------------------------------------------- */}
        {step === 2 && (
          <>
            <ChoiceGroup
              label="What kind of surface water right comes with the land?"
              value={input.surfaceRight}
              onChange={(v) => set("surfaceRight", v)}
              options={[
                { value: "decreed-appropriative", label: "Decreed appropriative right", hint: "A court decree with a priority date" },
                { value: "permitted-appropriative", label: "State permit or certificate", hint: "Issued by the state agency" },
                { value: "pre-1914-or-vested", label: "Pre-code or vested right", hint: "Predates the state's permitting statute" },
                { value: "ditch-company-shares", label: "Ditch or mutual company shares", hint: "Water delivered by a company you buy into" },
                { value: "federal-project-contract", label: "Federal project / district contract", hint: "Bureau of Reclamation or irrigation district" },
                { value: "riparian", label: "Riparian (land touches the water)", hint: "Meaningful only in riparian states" },
                { value: "none", label: "No surface right", hint: "Groundwater only, or no water at all" },
                { value: "unknown", label: "Don't know yet", hint: "Honest is better than optimistic" },
              ]}
              columns={2}
            />

            {input.surfaceRight !== "none" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Priority date"
                  hint={appropriative ? "The single most important attribute in this state. Year is enough." : "If known."}
                  value={input.priorityDate ?? ""}
                  onChange={(v) => set("priorityDate", v)}
                  placeholder="1889"
                />
                <NumberField
                  label="Decreed / permitted volume"
                  value={input.decreedAcreFeet}
                  onChange={(v) => set("decreedAcreFeet", v)}
                  suffix="AF/yr"
                  placeholder="480"
                />
              </div>
            )}

            <ChoiceGroup
              label="Has the right been adjudicated?"
              hint="Adjudication is a judicial determination of quantity and priority against everyone else on the source."
              value={input.adjudication}
              onChange={(v) => set("adjudication", v)}
              options={[
                { value: "fully-adjudicated", label: "Fully adjudicated" },
                { value: "adjudication-pending", label: "Adjudication pending" },
                { value: "unadjudicated", label: "Unadjudicated" },
                { value: "not-applicable", label: "Not applicable" },
                { value: "unknown", label: "Don't know" },
              ]}
              columns={3}
            />

            <ChoiceGroup
              label="Is the water appurtenant to this parcel?"
              hint="Appurtenant means legally attached to the land, so it moves with the deed."
              value={input.appurtenant}
              onChange={(v) => set("appurtenant", v)}
              options={YES_NO_UNKNOWN}
              columns={3}
            />

            <ChoiceGroup
              label="Has any water ever been sold, leased or reserved away from this land?"
              hint="Severance is invisible on the ground and permanent."
              value={input.previouslySevered}
              onChange={(v) => set("previouslySevered", v)}
              options={YES_NO_UNKNOWN}
              columns={3}
            />
          </>
        )}

        {/* ---------------------------------------------------------------- */}
        {step === 3 && (
          <>
            <ChoiceGroup
              label="Wells on the property"
              value={input.wellStatus}
              onChange={(v) => set("wellStatus", v)}
              options={[
                { value: "permitted-and-registered", label: "Permitted and registered" },
                { value: "registered-only", label: "Registered, no permit of record" },
                { value: "unregistered", label: "Unregistered" },
                { value: "abandoned-or-unknown", label: "Abandoned or unknown condition" },
                { value: "none", label: "No wells" },
              ]}
              columns={2}
            />

            {input.wellStatus !== "none" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField label="Well depth" value={input.wellDepthFt} onChange={(v) => set("wellDepthFt", v)} suffix="ft" placeholder="420" />
                <NumberField
                  label="Reported yield"
                  hint="Whatever the seller states — the engine tests it against your acreage."
                  value={input.wellYieldGpm}
                  onChange={(v) => set("wellYieldGpm", v)}
                  suffix="gpm"
                  placeholder="800"
                />
              </div>
            )}

            <ChoiceGroup
              label="Aquifer trend"
              hint="Static water level direction over the last two decades. Check state or USGS records rather than asking the seller."
              value={input.aquiferTrend}
              onChange={(v) => set("aquiferTrend", v)}
              options={[
                { value: "rising", label: "Rising" },
                { value: "stable", label: "Stable" },
                { value: "declining", label: "Declining" },
                { value: "steeply-declining", label: "Steeply declining" },
                { value: "unknown", label: "Don't know" },
              ]}
              columns={3}
            />

            <ChoiceGroup
              label="Is the parcel inside a groundwater district or management area?"
              hint={
                profile?.groundwaterRegime === "rule-of-capture"
                  ? "In this state the district's rules — not state law — decide what you may pump."
                  : "Districts set allocations, metering requirements and assessments."
              }
              value={input.inManagedDistrict}
              onChange={(v) => set("inManagedDistrict", v)}
              options={YES_NO_UNKNOWN}
              columns={3}
            />
          </>
        )}

        {/* ---------------------------------------------------------------- */}
        {step === 4 && (
          <>
            <CheckGroup
              label="Which documents has the seller actually produced?"
              hint="Produced, not promised. Anything you have not read does not count."
              options={DOCUMENTS}
              values={input.documents}
              onToggle={toggleDoc}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label="Years of documented beneficial use"
                hint="Years you could evidence today with records."
                value={input.documentedUseYears}
                onChange={(v) => set("documentedUseYears", v)}
                suffix="yrs"
              />
              <NumberField
                label="Longest gap without use"
                hint={
                  profile?.forfeitureYears
                    ? `${profile.name} can forfeit a right after ${profile.forfeitureYears} years of non-use.`
                    : "Consecutive years the water went unused."
                }
                value={input.longestNonUseGapYears}
                onChange={(v) => set("longestNonUseGapYears", v)}
                suffix="yrs"
              />
            </div>
          </>
        )}

        {/* ---------------------------------------------------------------- */}
        {step === 5 && (
          <>
            <ChoiceGroup
              label="Is there recorded legal access?"
              hint="A recorded easement or public road frontage. A two-track everyone uses is not legal access."
              value={input.legalAccess}
              onChange={(v) => set("legalAccess", v)}
              options={YES_NO_UNKNOWN}
              columns={3}
            />
            <ChoiceGroup
              label="Is the mineral estate severed?"
              hint="The mineral estate is generally dominant over the surface."
              value={input.mineralEstateSevered}
              onChange={(v) => set("mineralEstateSevered", v)}
              options={YES_NO_UNKNOWN}
              columns={3}
            />
            <ChoiceGroup
              label="Is there a conservation easement?"
              value={input.conservationEasement}
              onChange={(v) => set("conservationEasement", v)}
              options={YES_NO_UNKNOWN}
              columns={3}
            />
            <ChoiceGroup
              label="Are there liens, judgments or unpaid assessments?"
              value={input.existingLiens}
              onChange={(v) => set("existingLiens", v)}
              options={YES_NO_UNKNOWN}
              columns={3}
            />
            <ChoiceGroup
              label="Are there tribal or federal reserved claims in this basin?"
              hint="Reserved rights are senior, need no beneficial use, and are often unquantified."
              value={input.tribalOrFederalClaimsInBasin}
              onChange={(v) => set("tribalOrFederalClaimsInBasin", v)}
              options={YES_NO_UNKNOWN}
              columns={3}
            />
          </>
        )}

        {/* ---------------------------------------------------------------- */}
        {step === 6 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="Asking price" value={input.askingPrice} onChange={(v) => set("askingPrice", v)} prefix="$" placeholder="1250000" />
              <NumberField
                label="Contemplated close"
                hint="Water diligence realistically needs 60-90 days."
                value={input.closeTimelineDays}
                onChange={(v) => set("closeTimelineDays", v)}
                suffix="days"
                placeholder="45"
              />
            </div>
            <ChoiceGroup
              label="Financing"
              value={input.financing ?? "undecided"}
              onChange={(v) => set("financing", v)}
              options={[
                { value: "cash", label: "Cash" },
                { value: "bank", label: "Bank / Farm Credit" },
                { value: "seller-carry", label: "Seller carry" },
                { value: "1031-exchange", label: "1031 exchange" },
                { value: "undecided", label: "Undecided" },
              ]}
              columns={3}
            />
            <label className="block">
              <span className="label">Anything else worth knowing</span>
              <span className="block mb-1.5" />
              <textarea
                className="field"
                rows={4}
                value={input.notes ?? ""}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Seller is an estate, listing has been up 14 months, neighbor has a call on the ditch..."
              />
            </label>
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

      {/* Nav */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <button type="button" className="btn btn-ghost" disabled={step === 0 || busy} onClick={() => setStep((s) => s - 1)}>
          Back
        </button>

        {step < STEP_TITLES.length - 1 ? (
          <button type="button" className="btn btn-primary" disabled={!stepValid || busy} onClick={() => setStep((s) => s + 1)}>
            Continue
          </button>
        ) : (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={submit}>
            {busy ? "Building the plan…" : "Generate acquisition plan"}
          </button>
        )}
      </div>

      {!stepValid && step === 0 ? (
        <p className="mt-3 text-xs" style={{ color: "var(--fg-subtle)" }}>
          A parcel name, county and acreage are required to continue.
        </p>
      ) : null}
    </div>
  );
}
