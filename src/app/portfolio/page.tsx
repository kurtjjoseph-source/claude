import type { Metadata } from "next";
import PortfolioDashboard from "@/components/PortfolioDashboard";
import PortfolioLock from "@/components/PortfolioLock";
import { portfolioUnlocked } from "@/lib/auth";
import { getTargetAcres, listHoldings } from "@/lib/portfolio/store";
import { computeGoal, projectRunway } from "@/lib/portfolio/goal";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Track every parcel from prospect to closing against an acreage target.",
};

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  if (!(await portfolioUnlocked())) {
    return <PortfolioLock />;
  }

  // Loaded here rather than in a mount effect: the dashboard renders complete on
  // first paint, with no loading flash and no fetch waterfall. The client only
  // re-reads after it has changed something.
  const [holdings, targetAcres] = await Promise.all([listHoldings(), getTargetAcres()]);
  const goal = computeGoal(holdings, targetAcres);

  return <PortfolioDashboard initial={{ holdings, goal, runway: projectRunway(goal, holdings) }} />;
}
