import Link from "next/link";
import { JURISDICTIONS, INTERNATIONAL, US_STATES } from "@/lib/water/registry";

const FAILURE_MODES = [
  {
    title: "The water was already sold",
    body: "A prior owner severed the right and kept it, or leased it to a city for thirty years. The land looks identical. The deed says “together with all water rights.” There is nothing left to convey.",
  },
  {
    title: "The right died of non-use",
    body: "Most western states forfeit a right after a fixed period without beneficial use — three years in the Dakotas, four in New Mexico, ten in Colorado. A right that is void does not become valid because you paid for it.",
  },
  {
    title: "The shares never moved",
    body: "Ditch and mutual company shares are personal property that transfer by endorsed stock certificate. Buyers close on the deed, never get the certificate, and discover the seller still owns the water.",
  },
  {
    title: "The decree shrank on transfer",
    body: "Change a right from irrigation to municipal or recharge use and the state approves only historical consumptive use — often a third of the decreed amount. The rest goes back to the stream.",
  },
  {
    title: "The well was never legal",
    body: "An unregistered well has no permit, no log, no proven yield and no right to pump. It can be ordered plugged, and the seller's capacity claims have nothing behind them.",
  },
  {
    title: "The aquifer is leaving",
    body: "Saturated thickness under much of the High Plains is falling. A well that made 900 gpm in 1985 is a different asset today, and pumping caps follow decline rather than precede it.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Describe the parcel",
    body: "Seven short steps: location, what you want the water for, the right itself, the wells, what the seller has actually produced, the land, and the deal terms. Two minutes if you have the listing in front of you.",
  },
  {
    n: "02",
    title: "The engine scores it",
    body: "A deterministic rules engine applies the governing state's doctrine to your facts — seniority, forfeiture exposure, adjudication status, severability, aquifer trend — and produces a weighted score, ranked red flags, and a risk-adjusted estimate of how much water you can actually count on.",
  },
  {
    n: "03",
    title: "You get a plan, not a verdict",
    body: "A sequenced acquisition plan: what to do this week, who to call, which questions to put to the seller in writing, how to structure the offer, and the specific facts that should end the deal. Print it and work it.",
  },
];

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
        {value}
      </div>
      <div className="label mt-1">{label}</div>
    </div>
  );
}

export default function Home() {
  const countries = Object.keys(INTERNATIONAL).length;
  const states = Object.keys(US_STATES).length;
  const openToForeign = JURISDICTIONS.filter((j) => j.foreignOwnership?.regime === "unrestricted").length;

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-16 pb-14">
        <p className="label">Water rights diligence for land buyers</p>
        <h1
          className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight max-w-4xl leading-[1.05]"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Most land deals go wrong in the water, not the dirt.
        </h1>
        <p className="mt-6 text-lg max-w-2xl leading-relaxed" style={{ color: "var(--fg-muted)" }}>
          Headgate screens a parcel against the water law of the place it sits in — any US state or a growing set of
          countries — scores what you are actually buying, and hands you a sequenced plan for getting to closing, or for
          walking away before you have spent anything.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/start" className="btn btn-primary">
            Plan my first purchase
          </Link>
          <Link href="/wizard" className="btn btn-ghost">
            Screen a parcel
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl">
          <Stat value={String(states)} label="US states modeled" />
          <Stat value={String(countries)} label="Countries modeled" />
          <Stat value={String(openToForeign)} label="Open to foreign buyers" />
          <Stat value="1,000" label="Acre target tracked" />
        </div>
      </section>

      {/* The problem */}
      <section style={{ background: "var(--bg-sunken)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
            Six ways a water deal fails
          </h2>
          <p className="mt-3 max-w-2xl" style={{ color: "var(--fg-muted)" }}>
            None of these are visible from the road. All of them are findable in an afternoon if you know which record to
            pull.
          </p>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FAILURE_MODES.map((f) => (
              <div key={f.title} className="surface p-5">
                <h3 className="font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
          How it works
        </h2>
        <div className="mt-9 grid gap-8 lg:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n}>
              <div className="text-sm font-mono" style={{ color: "var(--accent)" }}>
                {s.n}
              </div>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 surface p-6 max-w-3xl">
          <p className="label">Why the scoring is not left to the model</p>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
            Every legally consequential output — the score, the red flags, the forfeiture exposure, the reliable-yield
            estimate — is computed by a deterministic rules engine from the state registry. The language model receives that
            output and writes the plan around it. It is explicitly barred from originating a statutory period, a priority-date
            consequence or an agency requirement, because those are precisely the claims a buyer would act on and precisely
            where a model is least trustworthy.
          </p>
        </div>
      </section>

      {/* International */}
      <section style={{ background: "var(--bg-sunken)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="label">Cross-border</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
            Abroad, the first question is whether you may own it at all
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed" style={{ color: "var(--fg-muted)" }}>
            Going international inverts the risk order. At home the water right is the hard part and ownership is assumed.
            In Georgia, Thailand, Morocco and Namibia a foreign buyer simply cannot hold farmland; in Mexico and Zambia you
            can, but only through a prescribed vehicle; in Australia and New Zealand a screening body decides. A flawless
            entitlement on land you may not own is worth nothing, so the engine scores eligibility before hydrology.
          </p>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "Chile", d: "Water rights are registered, tradable property, separable from land — and foreigners get full national treatment." },
              { t: "Uruguay", d: "No approval, no cap, strong registry, Guaraní Aquifer. The straightforward option, priced accordingly." },
              { t: "Australia", d: "The deepest water market on earth. Entitlements trade on screen, but FIRB screens the land." },
              { t: "Thailand", d: "Foreigners cannot own land, and the nominee company structures sold to them are criminal offences." },
            ].map((c) => (
              <div key={c.t} className="surface p-5">
                <h3 className="font-semibold tracking-tight">{c.t}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                  {c.d}
                </p>
              </div>
            ))}
          </div>
          <Link href="/opportunities" className="btn btn-ghost mt-8">
            See where to buy
          </Link>
        </div>
      </section>

      {/* Accumulation */}
      <section style={{ borderTop: "1px solid var(--line)" }}>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="label">Private dashboard</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
                Built for accumulating to a target, not for one transaction
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                <p>
                  The portfolio tracks every parcel from prospect through closing against an acreage goal — 1,000 acres by
                  default, adjustable. It separates deeded acres from <em>water-secured</em> acres, because a thousand acres
                  of dryland is not the same achievement as a thousand acres with reliable, transferable water.
                </p>
                <p>
                  It also rolls up risk-adjusted acre-feet, capital deployed, acreage-weighted deal quality, and how many
                  parcels remain at your historical average size and price. When the portfolio is unlocked, new screenings
                  are scored in its context — the plan tells you whether a parcel deserves priority over what is already in
                  the funnel.
                </p>
              </div>
              <Link href="/portfolio" className="btn btn-ghost mt-6">
                Open the portfolio
              </Link>
            </div>

            <div className="surface p-6">
              <div className="label">Illustrative</div>
              <div className="mt-4 space-y-4">
                {[
                  { label: "Closed", value: 412, tone: "var(--accent)" },
                  { label: "Under contract / LOI", value: 180, tone: "var(--color-sage-400)" },
                  { label: "Pipeline", value: 640, tone: "var(--color-ochre-500)" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-sm">
                      <span>{row.label}</span>
                      <span className="font-mono" style={{ color: "var(--fg-muted)" }}>
                        {row.value} ac
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-sunken)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(100, (row.value / 1000) * 100)}%`, background: row.tone }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 grid grid-cols-2 gap-4" style={{ borderTop: "1px solid var(--line)" }}>
                <Stat value="41%" label="of 1,000 acres closed" />
                <Stat value="388" label="water-secured acres" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--bg-sunken)", borderTop: "1px solid var(--line)" }}>
        <div className="mx-auto max-w-6xl px-5 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
            Screen the parcel before you fall in love with it
          </h2>
          <p className="mt-3 max-w-xl mx-auto" style={{ color: "var(--fg-muted)" }}>
            Two minutes of structured questions is cheaper than a title company&apos;s water exception discovered in week
            six.
          </p>
          <Link href="/wizard" className="btn btn-primary mt-7">
            Start
          </Link>
        </div>
      </section>
    </div>
  );
}
