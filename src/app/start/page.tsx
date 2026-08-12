import type { Metadata } from "next";
import FirstPurchase from "@/components/FirstPurchase";

export const metadata: Metadata = {
  title: "First purchase",
  description:
    "A personalised buyer's guide to your first land-with-water purchase: what you can afford, where to look, and what to do this week.",
};

export default function StartPage() {
  return <FirstPurchase />;
}
