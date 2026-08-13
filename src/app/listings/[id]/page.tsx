import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ListingDetail from "@/components/ListingDetail";
import { getListing, getListings } from "@/lib/listings/data";
import { assessParcel } from "@/lib/water/engine";
import { getJurisdiction } from "@/lib/water/registry";
import { cookies } from "next/headers";
import { PROFILE_COOKIE, decodeProfile } from "@/lib/profile-store";
import { buyerProfileSchema } from "@/lib/validation";
import { matchAll } from "@/lib/listings/match";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = getListing(id);
  if (!listing) return { title: "Listing not found" };
  return { title: listing.headline, description: listing.description };
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = getListing(id);
  if (!listing) notFound();

  const assessment = assessParcel(listing.input);
  const jurisdiction = getJurisdiction(listing.input.jurisdictionCode);

  const jar = await cookies();
  const candidate = decodeProfile(jar.get(PROFILE_COOKIE)?.value);
  const parsed = candidate ? buyerProfileSchema.safeParse(candidate) : null;
  const match = parsed?.success
    ? (matchAll(getListings(), parsed.data).matches.find((m) => m.listingId === listing.id) ?? null)
    : null;

  return (
    <ListingDetail
      listing={{
        id: listing.id,
        headline: listing.headline,
        description: listing.description,
        tell: listing.tell,
        price: listing.price,
        acres: listing.input.acres,
        county: listing.input.county,
        jurisdictionName: jurisdiction?.name ?? listing.input.jurisdictionCode,
        jurisdictionCode: listing.input.jurisdictionCode,
      }}
      assessment={assessment}
      match={match}
      hasProfile={Boolean(parsed?.success)}
    />
  );
}
