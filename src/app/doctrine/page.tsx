import type { Metadata } from "next";
import DoctrineBrowser from "@/components/DoctrineBrowser";
import { JURISDICTIONS } from "@/lib/water/registry";

export const metadata: Metadata = {
  title: "Jurisdictions",
  description:
    "Surface doctrine, groundwater regime, forfeiture periods, agencies and buyer traps for all fifty states.",
};

export default function DoctrinePage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <p className="label">Reference</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
        Jurisdictions
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed" style={{ color: "var(--fg-muted)" }}>
        The registry the engine runs on. Surface doctrine and groundwater regime are separate axes and frequently disagree
        within the same state — Texas allocates surface water by prior appropriation while groundwater belongs absolutely to
        the landowner, and Nebraska splits administration between two different agencies. The depth here is uneven on
        purpose: in appropriation states the water right is a distinct, severable, forfeitable asset and carries most of a
        deal&apos;s risk, while in riparian states it largely runs with the land.
      </p>

      <div className="mt-8">
        <DoctrineBrowser states={JURISDICTIONS} />
      </div>
    </div>
  );
}
