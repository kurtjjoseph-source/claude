import type { Metadata } from "next";
import Wizard from "@/components/Wizard";

export const metadata: Metadata = {
  title: "Screen a parcel",
  description: "Seven steps to a scored acquisition plan for land with water rights.",
};

export default function WizardPage() {
  return <Wizard />;
}
