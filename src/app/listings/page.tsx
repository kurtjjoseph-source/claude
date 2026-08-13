import type { Metadata } from "next";
import Link from "next/link";
import ListingsMap, { type MapPin } from "@/components/ListingsMap";
import { getListings, listingsAreSample } from "@/lib/listings/data";
import { buildBasemap, projectPoint } from "@/lib/listings/basemap";
import { assessParcel } from "@/lib/water/engine";
import { getJurisdiction } from "@/lib/water/registry";
import { cookies } from "next/headers";
import { PROFILE_COOKIE, decodeProfile } from "@/lib/profile-store";
import { buyerProfileSchema } from "@/lib/validation";
import { matchAll } from "@/lib/listings/match";
import type { ListingMatch } from "@/lib/listings/match";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Listings map",
  description: "Sample parcels plotted by location, scored by the engine and matched against your buyer profile.",
};

export default async function ListingsPage() {
  const listings = getListings();

  // The profile arrives in a cookie, so matching happens here rather than in a
  // client effect — the page ships finished results.
  const jar = await cookies();
  const candidate = decodeProfile(jar.get(PROFILE_COOKIE)?.value);
  const parsed = candidate ? buyerProfileSchema.safeParse(candidate) : null;
  let matches: Record<string, ListingMatch> = {};
  let landBudget: number | null = null;
  if (parsed?.success) {
    const result = matchAll(listings, parsed.data);
    matches = Object.fromEntries(result.matches.map((m) => [m.listingId, m]));
    landBudget = result.guide.budget.maxPurchasePrice;
  }

  // Scored on the server so the client never runs the engine or ships the map
  // libraries. Pins carry only what the map and list need.
  const pins: MapPin[] = listings.map((l) => {
    const assessment = assessParcel(l.input);
    const jurisdiction = getJurisdiction(l.input.jurisdictionCode);
    return {
      id: l.id,
      headline: l.headline,
      jurisdictionName: jurisdiction?.subnational ? jurisdiction.name : (jurisdiction?.name ?? l.input.jurisdictionCode),
      county: l.input.county,
      acres: l.input.acres,
      price: l.price,
      composite: assessment.composite,
      us: projectPoint("us", l.lng, l.lat),
      world: projectPoint("world", l.lng, l.lat),
    };
  });

  const us = buildBasemap("us");
  const world = buildBasemap("world");

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <p className="label">Inventory</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
        Listings map
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed" style={{ color: "var(--fg-muted)" }}>
        Every parcel here has been run through the same engine the wizard uses, so the score on each pin is the parcel&apos;s
        own quality. Build a first-purchase profile and they are additionally matched against your budget, your jurisdiction
        shortlist and your target size — which is a different question, and often gives a different answer.
      </p>

      {listingsAreSample() ? (
        <div
          className="mt-6 rounded-lg p-4 text-sm leading-relaxed"
          style={{ background: "rgba(201,150,47,0.14)", borderLeft: "3px solid var(--color-ochre-500)" }}
        >
          <strong>This inventory is synthetic. None of these parcels is for sale.</strong> There is no public feed carrying
          structured water-right data, and inventing listings that looked real would undermine the point of the tool — so
          these are constructed examples, placed at county centroids, with no broker or parcel identifiers. They exercise
          the scoring and matching end to end and define the shape a live feed would have to produce. Wiring one in means
          implementing a single interface; everything downstream already works.
        </div>
      ) : null}

      <div className="mt-8">
        <ListingsMap
          pins={pins}
          matches={matches}
          hasProfile={Boolean(parsed?.success)}
          landBudget={landBudget}
          basemaps={{
            us: { width: us.width, height: us.height, shapes: us.shapes },
            world: { width: world.width, height: world.height, shapes: world.shapes },
          }}
        />
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/start" className="btn btn-ghost">
          Build a buyer profile
        </Link>
        <Link href="/wizard" className="btn btn-ghost">
          Screen your own parcel
        </Link>
      </div>
    </div>
  );
}
