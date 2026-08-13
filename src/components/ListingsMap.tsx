"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ListingMatch } from "@/lib/listings/match";
import { MATCH_BAND_COPY } from "@/lib/listings/match";

export interface MapPin {
  id: string;
  headline: string;
  jurisdictionName: string;
  county: string;
  acres: number;
  price: number;
  composite: number;
  /** Pixel position on each basemap; null where the projection excludes it. */
  us: { x: number; y: number } | null;
  world: { x: number; y: number } | null;
}

interface Props {
  pins: MapPin[];
  /** Server-computed, keyed by listing id. Empty when there is no profile. */
  matches: Record<string, ListingMatch>;
  hasProfile: boolean;
  landBudget: number | null;
  basemaps: {
    us: { width: number; height: number; shapes: string[] };
    world: { width: number; height: number; shapes: string[] };
  };
}

type View = "us" | "world";

function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${Math.round(n / 1000)}k`;
}

function toneFor(match: ListingMatch | undefined, composite: number): string {
  if (match) return MATCH_BAND_COPY[match.band].tone;
  return composite >= 78
    ? "var(--color-sage-400)"
    : composite >= 60
      ? "var(--accent)"
      : composite >= 42
        ? "var(--color-ochre-500)"
        : "var(--color-rust-500)";
}

export default function ListingsMap({ pins, matches, hasProfile, landBudget, basemaps }: Props) {
  // The only client state here is genuinely interactive: which basemap is
  // showing and which pin the pointer is over. Matching arrives finished.
  const [view, setView] = useState<View>("us");
  const [hovered, setHovered] = useState<string | null>(null);

  const base = basemaps[view];
  const visible = useMemo(() => pins.filter((p) => p[view] !== null), [pins, view]);

  const ranked = useMemo(() => {
    if (Object.keys(matches).length === 0) {
      return [...visible].sort((a, b) => b.composite - a.composite);
    }
    return [...visible].sort((a, b) => {
      const ma = matches[a.id];
      const mb = matches[b.id];
      const ba = ma?.blockers.length ?? 0;
      const bb = mb?.blockers.length ?? 0;
      if (ba !== bb) return ba - bb;
      return (mb?.score ?? 0) - (ma?.score ?? 0);
    });
  }, [visible, matches]);

  const hoveredPin = hovered ? pins.find((p) => p.id === hovered) ?? null : null;

  return (
    <div>
      {/* Controls */}
      <div className="no-print flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-1.5">
          {(["us", "world"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: view === v ? "var(--accent)" : "var(--bg-sunken)",
                color: view === v ? "var(--accent-fg)" : "var(--fg-muted)",
              }}
            >
              {v === "us" ? "United States" : "World"}
            </button>
          ))}
        </div>
        <div className="text-xs" style={{ color: "var(--fg-subtle)" }}>
          {hasProfile
            ? `Matched against your profile${landBudget ? ` · $${landBudget.toLocaleString()} land budget` : ""}`
            : "No buyer profile yet — pins are coloured by parcel quality"}
        </div>
      </div>

      {!hasProfile ? (
        <div
          className="no-print mt-4 rounded-lg p-4 text-sm flex flex-wrap items-center justify-between gap-3"
          style={{ background: "var(--bg-sunken)" }}
        >
          <span style={{ color: "var(--fg-muted)" }}>
            Build a first-purchase profile and these listings get scored against your budget, shortlist and target size.
          </span>
          <Link href="/start" className="btn btn-primary">
            Build my profile
          </Link>
        </div>
      ) : null}

      {/* Map */}
      <div className="mt-5 surface overflow-hidden">
        <svg
          viewBox={`0 0 ${base.width} ${base.height}`}
          className="w-full h-auto block"
          role="img"
          aria-label={`Map of sample listings, ${view === "us" ? "United States" : "world"} view`}
          style={{ background: "var(--bg-sunken)" }}
        >
          <g>
            {base.shapes.map((d, i) => (
              <path key={i} d={d} fill="var(--bg-raised)" stroke="var(--line-strong)" strokeWidth={0.5} />
            ))}
          </g>
          <g>
            {visible.map((p) => {
              const pos = p[view]!;
              const match = matches[p.id];
              const tone = toneFor(match, p.composite);
              const isHover = hovered === p.id;
              return (
                <g key={p.id}>
                  {isHover ? <circle cx={pos.x} cy={pos.y} r={14} fill={tone} opacity={0.18} /> : null}
                  <Link href={`/listings/${p.id}`} aria-label={`${p.headline}, ${p.county}`}>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isHover ? 8 : 6}
                      fill={tone}
                      stroke="var(--bg-raised)"
                      strokeWidth={2}
                      style={{ cursor: "pointer", transition: "r 120ms ease" }}
                      onMouseEnter={() => setHovered(p.id)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(p.id)}
                      onBlur={() => setHovered(null)}
                    />
                  </Link>
                </g>
              );
            })}
          </g>
          {hoveredPin && hoveredPin[view] ? (
            <g transform={`translate(${Math.min(hoveredPin[view]!.x + 14, base.width - 220)}, ${Math.max(hoveredPin[view]!.y - 34, 8)})`} pointerEvents="none">
              <rect width={210} height={46} rx={6} fill="var(--bg-raised)" stroke="var(--line-strong)" />
              <text x={10} y={19} fontSize={12} fontWeight={600} fill="var(--fg)">
                {hoveredPin.headline.length > 30 ? `${hoveredPin.headline.slice(0, 29)}…` : hoveredPin.headline}
              </text>
              <text x={10} y={35} fontSize={11} fill="var(--fg-muted)">
                {hoveredPin.acres.toLocaleString()} ac · {money(hoveredPin.price)} · score {hoveredPin.composite}
              </text>
            </g>
          ) : null}
        </svg>
      </div>

      {/* List */}
      <div className="mt-6 space-y-2.5">
        {ranked.map((p) => {
          const match = matches[p.id];
          const tone = toneFor(match, p.composite);
          return (
            <Link
              key={p.id}
              href={`/listings/${p.id}`}
              className="surface p-4 flex flex-wrap items-center gap-x-5 gap-y-2 justify-between hover:bg-[var(--bg-sunken)] transition-colors"
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2.5">
                  <span className="font-semibold">{p.headline}</span>
                  {match ? (
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: "var(--bg-sunken)", color: tone }}
                    >
                      {MATCH_BAND_COPY[match.band].label}
                      {match.band !== "blocked" ? ` ${match.score}` : ""}
                    </span>
                  ) : null}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
                  {p.acres.toLocaleString()} ac · {p.county}, {p.jurisdictionName} · {money(p.price)} ·{" "}
                  {Math.round(p.price / p.acres).toLocaleString()}/ac
                </div>
                {match && match.blockers.length > 0 ? (
                  <div className="text-xs mt-1" style={{ color: "var(--color-rust-500)" }}>
                    {match.blockers[0]}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs" style={{ color: "var(--fg-subtle)" }}>
                  parcel score
                </span>
                <span
                  className="rounded px-2 py-1 text-xs font-mono"
                  style={{ background: "var(--bg-sunken)", color: toneFor(undefined, p.composite) }}
                >
                  {p.composite}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
