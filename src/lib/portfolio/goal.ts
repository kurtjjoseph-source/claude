import type { Holding, HoldingStage, PortfolioGoal } from "@/lib/types";

/**
 * Rolls a set of holdings up against the acreage target.
 *
 * The distinction that matters is between deeded acres and *water-secured*
 * acres. A thousand acres of dryland is not the goal; a thousand acres with
 * reliable, transferable water is. Both numbers are tracked so the gap between
 * them stays visible.
 */

const COMMITTED: HoldingStage[] = ["loi", "under-contract"];
const PIPELINE: HoldingStage[] = ["prospect", "diligence"];

/** A holding counts as water-secured when the engine liked it and found real water. */
function isWaterSecured(h: Holding): boolean {
  return (h.reliableAcreFeet ?? 0) > 0 && (h.composite ?? 0) >= 60;
}

export function computeGoal(holdings: Holding[], targetAcres: number): PortfolioGoal {
  const closed = holdings.filter((h) => h.stage === "closed");
  const committed = holdings.filter((h) => COMMITTED.includes(h.stage));
  const pipeline = holdings.filter((h) => PIPELINE.includes(h.stage));

  const sum = (list: Holding[], pick: (h: Holding) => number | null | undefined) =>
    list.reduce((total, h) => total + (pick(h) ?? 0), 0);

  const closedAcres = sum(closed, (h) => h.acres);
  const committedAcres = sum(committed, (h) => h.acres);
  const pipelineAcres = sum(pipeline, (h) => h.acres);

  const waterSecuredAcres = sum(closed.filter(isWaterSecured), (h) => h.acres);
  const totalReliableAcreFeet = sum(closed, (h) => h.reliableAcreFeet);

  const capitalDeployed = sum(closed, (h) => h.price);
  const capitalCommitted = sum(committed, (h) => h.price);

  // Acreage-weighted, so a 400-acre block counts for more than a 40-acre one.
  const scored = closed.filter((h) => h.composite !== null && h.acres > 0);
  const weightedAcres = sum(scored, (h) => h.acres);
  const averageComposite =
    weightedAcres > 0
      ? Math.round(scored.reduce((t, h) => t + (h.composite ?? 0) * h.acres, 0) / weightedAcres)
      : null;

  return {
    targetAcres,
    closedAcres: round(closedAcres),
    committedAcres: round(committedAcres),
    pipelineAcres: round(pipelineAcres),
    waterSecuredAcres: round(waterSecuredAcres),
    totalReliableAcreFeet: round(totalReliableAcreFeet),
    capitalDeployed: Math.round(capitalDeployed),
    capitalCommitted: Math.round(capitalCommitted),
    averageComposite,
    remainingAcres: round(Math.max(0, targetAcres - closedAcres)),
    percentComplete: targetAcres > 0 ? Math.round((closedAcres / targetAcres) * 1000) / 10 : 0,
  };
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

export const STAGE_LABELS: Record<HoldingStage, string> = {
  prospect: "Prospect",
  diligence: "Diligence",
  loi: "LOI signed",
  "under-contract": "Under contract",
  closed: "Closed",
  passed: "Passed",
};

export const STAGE_ORDER: HoldingStage[] = [
  "prospect",
  "diligence",
  "loi",
  "under-contract",
  "closed",
  "passed",
];

/**
 * Given the current position, what does the remaining runway look like?
 * Used by the dashboard to turn a percentage into a plan.
 */
export function projectRunway(goal: PortfolioGoal, holdings: Holding[]) {
  const closed = holdings.filter((h) => h.stage === "closed");
  const avgParcelAcres = closed.length > 0 ? goal.closedAcres / closed.length : 0;
  const avgPricePerAcre =
    goal.closedAcres > 0 && goal.capitalDeployed > 0 ? goal.capitalDeployed / goal.closedAcres : 0;

  return {
    avgParcelAcres: Math.round(avgParcelAcres),
    avgPricePerAcre: Math.round(avgPricePerAcre),
    /** Parcels still needed at the historical average size. */
    parcelsRemaining: avgParcelAcres > 0 ? Math.ceil(goal.remainingAcres / avgParcelAcres) : null,
    /** Capital still required at the historical average price. */
    capitalRemaining: avgPricePerAcre > 0 ? Math.round(goal.remainingAcres * avgPricePerAcre) : null,
    /** Acreage in the funnel that would close the gap if it all converted. */
    funnelCoverage:
      goal.remainingAcres > 0
        ? Math.round(((goal.committedAcres + goal.pipelineAcres) / goal.remainingAcres) * 100)
        : 100,
  };
}
