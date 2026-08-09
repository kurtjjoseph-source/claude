import type { Holding } from "@/lib/types";

/**
 * Storage seam for the portfolio.
 *
 * Two backends implement this: a JSON file for local development and any
 * single-process deployment, and Netlify Blobs for serverless. The interface is
 * deliberately per-record rather than whole-document, because Netlify Blobs has
 * no compare-and-swap primitive — a read-modify-write over one shared document
 * would silently drop concurrent additions when two requests land on different
 * function instances. Writing one blob per holding removes the race instead of
 * hoping it never fires.
 */
export interface PortfolioBackend {
  readonly name: string;
  listHoldings(): Promise<Holding[]>;
  getHolding(id: string): Promise<Holding | null>;
  putHolding(holding: Holding): Promise<void>;
  removeHolding(id: string): Promise<boolean>;
  getTargetAcres(): Promise<number>;
  putTargetAcres(acres: number): Promise<void>;
}

export const DEFAULT_TARGET_ACRES = 1000;
