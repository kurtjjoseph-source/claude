import type { JurisdictionProfile, Region } from "@/lib/types";
import { US_STATES, DOCTRINE_LABELS, GROUNDWATER_LABELS } from "@/lib/water/states";
import {
  INTERNATIONAL,
  OWNERSHIP_LABELS,
  REGION_LABELS,
  TITLE_SYSTEM_LABELS,
} from "@/lib/water/international";

/**
 * The single lookup the rest of the app uses.
 *
 * US states and foreign countries sit in one namespace because a buyer
 * comparing a Colorado quarter-section against an Alentejo estate is running
 * one decision, not two. Codes do not collide: states are two-letter USPS
 * codes and countries are ISO alpha-2, and the only overlaps that could arise
 * are guarded by a test.
 */

export const ALL_JURISDICTIONS: Record<string, JurisdictionProfile> = {
  ...US_STATES,
  ...INTERNATIONAL,
};

export const JURISDICTIONS = Object.values(ALL_JURISDICTIONS).sort((a, b) =>
  a.name.localeCompare(b.name),
);

export function getJurisdiction(code: string): JurisdictionProfile | null {
  return ALL_JURISDICTIONS[code.toUpperCase()] ?? null;
}

/** Country code a jurisdiction belongs to: "US-CO" -> "US", "CL" -> "CL". */
export function countryCodeOf(j: JurisdictionProfile): string {
  return j.subnational ? (j.code.split("-")[0] ?? j.code) : j.code;
}

/** Display name without the country prefix, e.g. "Colorado" not "US-CO". */
export function shortLabel(j: JurisdictionProfile): string {
  return j.subnational ? `${j.name}, USA` : j.name;
}

/** True when the buyer would be acquiring outside their home country. */
export function isCrossBorder(j: JurisdictionProfile, buyerCountry: string | undefined): boolean {
  if (!buyerCountry) return false;
  return countryCodeOf(j) !== buyerCountry.toUpperCase();
}

export const REGION_ORDER: Region[] = [
  "united-states",
  "canada",
  "latin-america",
  "europe",
  "africa",
  "asia",
  "oceania",
];

/** Jurisdictions grouped by region, for pickers and the reference browser. */
export function byRegion(): Array<{ region: Region; label: string; items: JurisdictionProfile[] }> {
  return REGION_ORDER.map((region) => ({
    region,
    label: REGION_LABELS[region] ?? region,
    items: JURISDICTIONS.filter((j) => j.region === region),
  })).filter((g) => g.items.length > 0);
}

/** Countries a buyer can declare as home, for the nationality picker. */
export const BUYER_COUNTRIES = [
  { code: "US", name: "United States" },
  ...Object.values(INTERNATIONAL)
    .map((j) => ({ code: j.code, name: j.name }))
    .sort((a, b) => a.name.localeCompare(b.name)),
];

export { US_STATES, INTERNATIONAL, DOCTRINE_LABELS, GROUNDWATER_LABELS, REGION_LABELS, OWNERSHIP_LABELS, TITLE_SYSTEM_LABELS };
