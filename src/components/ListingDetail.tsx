"use client";

import Link from "next/link";
import type { Assessment } from "@/lib/types";
import type { ListingMatch } from "@/lib/listings/match";
import { MATCH_BAND_COPY } from "@/lib/listings/match";
import { SeverityBadge, ScoreRing, Bar } from "@/components/ui";

interface Props {
  listing: {
    id: string;
    headline: string;
    description: string;
    tell: string;
    price: number;
    acres: number;
    county: string;
    jurisdictionName: string;
    jurisdictionCode: string;
  };
  assessment: Assessment;
  /** Computed on the server from the profile cookie. */
  match: ListingMatch | null;
  hasProfile: boolean;
}

export default function ListingDetail({ listing, assessment, match, hasProfile }: Props) {
  const band = match ? MATCH_BAND_COPY[match.band] : null;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <Link href="/listings" className="text-sm" style={{ color: "var(--accent)" }}>
        ← All listings
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="label">Sample listing</p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
            {listing.headline}
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--fg-muted)" }}>
            {listing.acres.toLocaleString()} acres · {listing.county}, {listing.jurisdictionName} ·{" "}
            ${listing.price.toLocaleString()} · ${Math.round(listing.price / listing.acres).toLocaleString()}/acre
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ScoreRing score={assessment.composite} size={84} />
          <div>
            <div className="label">Parcel score</div>
            <div className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
              independent of you
            </div>
          </div>
        </div>
      </div>

      <p className="mt-5 text-[15px] leading-relaxed">{listing.description}</p>
      <div
        className="mt-4 rounded-lg p-4 text-sm leading-relaxed"
        style={{ background: "var(--bg-sunken)", borderLeft: "3px solid var(--accent)" }}
      >
        <span className="label">What to notice</span> {listing.tell}
      </div>

      {/* Match */}
      <section className="mt-10">
        <p className="label">Against your profile</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
          {match ? band!.label : "No buyer profile yet"}
        </h2>

        {!hasProfile ? (
          <div className="mt-4 surface p-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm max-w-xl" style={{ color: "var(--fg-muted)" }}>
              The score above is the parcel&apos;s own quality. Whether it is a good purchase <em>for you</em> depends on your
              budget, your shortlist and your target size — build a profile and this section fills in.
            </p>
            <Link href="/start" className="btn btn-primary">
              Build my profile
            </Link>
          </div>
        ) : match ? (
          <div className="mt-4 surface p-5">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <div className="label">Match</div>
                <div className="mt-1 text-2xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: band!.tone }}>
                  {match.band === "blocked" ? "Blocked" : `${match.score}/100`}
                </div>
              </div>
              {match.budgetRatio !== null ? (
                <div className="flex-1 min-w-[200px]">
                  <div className="flex justify-between items-baseline gap-4 text-xs">
                    <span className="label">Against your budget</span>
                    <span className="font-mono" style={{ color: "var(--fg-muted)" }}>
                      {Math.round(match.budgetRatio * 100)}%
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <Bar
                      value={Math.min(100, match.budgetRatio * 100)}
                      tone={match.budgetRatio > 1 ? "var(--color-rust-500)" : "var(--color-sage-400)"}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {match.blockers.length > 0 ? (
              <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--line)" }}>
                <p className="label" style={{ color: "var(--color-rust-600)" }}>
                  Why this is blocked for you
                </p>
                <ul className="mt-2 space-y-2">
                  {match.blockers.map((b, i) => (
                    <li key={i} className="text-sm leading-relaxed">
                      ✕ {b}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-5 pt-4 grid gap-5 sm:grid-cols-2" style={{ borderTop: "1px solid var(--line)" }}>
              <div>
                <p className="label" style={{ color: "var(--color-sage-600)" }}>
                  In its favour
                </p>
                <ul className="mt-1.5 space-y-2">
                  {match.reasons.filter((r) => r.positive).map((r, i) => (
                    <li key={i} className="text-sm leading-relaxed">
                      <span className="font-medium">{r.label}.</span>{" "}
                      <span style={{ color: "var(--fg-muted)" }}>{r.detail}</span>
                    </li>
                  ))}
                  {match.reasons.filter((r) => r.positive).length === 0 ? (
                    <li className="text-sm" style={{ color: "var(--fg-subtle)" }}>
                      Nothing here counts in its favour for your profile.
                    </li>
                  ) : null}
                </ul>
              </div>
              <div>
                <p className="label" style={{ color: "var(--color-ochre-600)" }}>
                  Against it
                </p>
                <ul className="mt-1.5 space-y-2">
                  {match.reasons.filter((r) => !r.positive).map((r, i) => (
                    <li key={i} className="text-sm leading-relaxed">
                      <span className="font-medium">{r.label}.</span>{" "}
                      <span style={{ color: "var(--fg-muted)" }}>{r.detail}</span>
                    </li>
                  ))}
                  {match.reasons.filter((r) => !r.positive).length === 0 ? (
                    <li className="text-sm" style={{ color: "var(--fg-subtle)" }}>
                      Nothing counts against it for your profile.
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Engine findings */}
      <section className="mt-10">
        <p className="label">{assessment.findings.length} raised</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
          What the engine found
        </h2>
        <div className="mt-4 space-y-4">
          {assessment.categories.map((c) => (
            <div key={c.category}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium">{c.label}</span>
                <span className="text-xs font-mono" style={{ color: "var(--fg-muted)" }}>
                  {c.score} · {Math.round(c.weight * 100)}%
                </span>
              </div>
              <div className="mt-1.5">
                <Bar
                  value={c.score}
                  tone={c.score >= 75 ? "var(--color-sage-400)" : c.score >= 50 ? "var(--accent)" : "var(--color-rust-500)"}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {assessment.findings.slice(0, 6).map((f) => (
            <div key={f.id} className="surface p-4">
              <div className="flex items-start gap-2.5">
                <SeverityBadge severity={f.severity} />
                <h3 className="font-semibold text-[15px] leading-snug">{f.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                {f.detail}
              </p>
            </div>
          ))}
        </div>
        {assessment.findings.length > 6 ? (
          <p className="mt-3 text-sm" style={{ color: "var(--fg-subtle)" }}>
            {assessment.findings.length - 6} further findings appear in the full acquisition plan.
          </p>
        ) : null}
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/wizard" className="btn btn-primary">
          Run the full plan on a parcel like this
        </Link>
        <Link href="/listings" className="btn btn-ghost">
          Back to the map
        </Link>
      </div>

      <p className="mt-8 text-xs leading-relaxed" style={{ color: "var(--fg-subtle)" }}>
        Sample listing. This parcel is not for sale and the details are constructed to exercise the engine. Location is a
        county centroid, not a property boundary.
      </p>
    </div>
  );
}
