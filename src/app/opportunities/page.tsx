import type { Metadata } from "next";
import Link from "next/link";
import { opportunitiesByAccessibility, type Accessibility } from "@/lib/opportunities";
import { getJurisdiction } from "@/lib/water/registry";

export const metadata: Metadata = {
  title: "Where to buy",
  description:
    "Curated cross-border theses for acquiring water-secured acreage: what the play is, what kills it, and who it suits.",
};

const TONE: Record<Accessibility, string> = {
  open: "var(--color-sage-400)",
  friction: "var(--accent)",
  "operator-only": "var(--color-ochre-500)",
  closed: "var(--color-rust-500)",
};

const BLURB: Record<Accessibility, string> = {
  open: "No approval, no cap, no structuring required. You can transact here on the same terms as a local.",
  friction: "Real opportunity behind a screening regime, a cap or a title-quality problem. Workable with preparation.",
  "operator-only": "Use rights rather than ownership, and only viable with a genuine project and local partners.",
  closed: "Legally barred or practically unobtainable for a foreign buyer of farmland.",
};

export default function OpportunitiesPage() {
  const groups = opportunitiesByAccessibility();

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <p className="label">Worldwide</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
        Where a thousand water-secured acres is actually achievable
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed" style={{ color: "var(--fg-muted)" }}>
        Going international inverts the domestic risk order. At home the water right is the hard part and the right to own
        the land is assumed. Abroad the first question is whether a foreigner may hold the interest at all — and in a
        meaningful number of countries the answer is no, or only through a prescribed structure. What follows is organised
        by that constraint first and by hydrology second.
      </p>

      <div
        className="mt-6 rounded-lg p-4 text-sm leading-relaxed"
        style={{ background: "rgba(207,95,66,0.1)", borderLeft: "3px solid var(--color-rust-500)" }}
      >
        <strong>One rule that applies everywhere below.</strong> If the only route into a country involves a local person
        or company holding title on your behalf, that is a reason to walk, not a structuring idea. Nominee arrangements are
        a criminal offence in several of these jurisdictions, void in most of the rest, and unenforceable almost
        everywhere. The countries worth your time are the ones where you can hold the asset in your own name or in a
        vehicle the law explicitly provides for.
      </div>

      <div className="mt-12 space-y-14">
        {groups.map((group) => (
          <section key={group.accessibility}>
            <div className="flex items-baseline gap-3">
              <h2 className="text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)", color: TONE[group.accessibility] }}>
                {group.label}
              </h2>
              <span className="text-xs" style={{ color: "var(--fg-subtle)" }}>
                {group.items.length} {group.items.length === 1 ? "thesis" : "theses"}
              </span>
            </div>
            <p className="mt-1.5 text-sm max-w-2xl" style={{ color: "var(--fg-muted)" }}>
              {BLURB[group.accessibility]}
            </p>

            <div className="mt-6 space-y-5">
              {group.items.map((o) => (
                <article key={o.id} className="surface p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                    <h3 className="text-lg font-semibold tracking-tight">{o.title}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {o.jurisdictions.map((code) => {
                        const j = getJurisdiction(code);
                        return (
                          <span
                            key={code}
                            className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                            style={{ background: "var(--bg-sunken)", color: "var(--fg-muted)" }}
                          >
                            {j?.name ?? code}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <p className="mt-3 text-[15px] leading-relaxed">{o.premise}</p>

                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <p className="label">Why it works</p>
                      <p className="mt-1 leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                        {o.mechanism}
                      </p>
                    </div>
                    <div>
                      <p className="label" style={{ color: "var(--color-rust-500)" }}>
                        What kills it
                      </p>
                      <p className="mt-1 leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                        {o.killer}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 pt-1">
                      <div>
                        <p className="label">Suits</p>
                        <p className="mt-1 leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                          {o.suits}
                        </p>
                      </div>
                      <div>
                        <p className="label">At 1,000 acres</p>
                        <p className="mt-1 leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                          {o.scaleNote}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-16 pt-8" style={{ borderTop: "1px solid var(--line)" }}>
        <h2 className="text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
          If the target is a thousand acres
        </h2>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed max-w-2xl">
          <p>
            A thousand acres is 405 hectares. That is a large farm in Portugal, a mid-sized one in Uruguay, and a rounding
            error in Paraguay or the Brazilian Cerrado. The number means nothing until you attach it to a jurisdiction, and
            the same capital buys wildly different positions depending on which risk you agree to carry.
          </p>
          <p>
            The structural argument for splitting the target across two or three jurisdictions is not diversification for
            its own sake — it is that the failure modes are genuinely uncorrelated. A drought in the Alentejo has nothing to
            do with a currency control in Buenos Aires or a policy shift in Pretoria. The argument against is that every
            additional jurisdiction adds a full set of advisers, a tax filing and a learning curve, and three shallow
            positions are usually worse than one deep one.
          </p>
          <p>
            If you want one recommendation: establish the first position somewhere the eligibility question is simply not a
            risk, learn the operating reality there, and only then take on a jurisdiction that pays you for accepting
            country risk. Uruguay, Portugal and Chile are the three places where an outside buyer can transact essentially
            as a local, and they are very different bets on climate and on price.
          </p>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/wizard" className="btn btn-primary">
            Screen a parcel
          </Link>
          <Link href="/doctrine" className="btn btn-ghost">
            Compare jurisdictions
          </Link>
        </div>
      </section>

      <p className="mt-10 text-xs leading-relaxed" style={{ color: "var(--fg-subtle)" }}>
        These are starting points for research, not recommendations to buy, and foreign investment rules change faster than
        water law — Argentina, Romania and South Africa have all moved in the last few years. Confirm the current position
        with counsel in the country before committing capital.
      </p>
    </div>
  );
}
