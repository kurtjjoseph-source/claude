import { randomUUID } from "node:crypto";
import type { Holding } from "@/lib/types";
import type { PortfolioBackend } from "@/lib/portfolio/backend";
import { fileBackend } from "@/lib/portfolio/backends/file";
import { blobsAvailable, blobsBackend } from "@/lib/portfolio/backends/blobs";

/**
 * Portfolio persistence.
 *
 * Picks Netlify Blobs when the deployment provides it and falls back to a local
 * JSON file otherwise, so `npm run dev` needs no cloud credentials and the
 * deployed site needs no writable disk.
 */

let backend: PortfolioBackend | null = null;

export function activeBackend(): PortfolioBackend {
  backend ??= blobsAvailable() ? blobsBackend : fileBackend;
  return backend;
}

/**
 * Serializes writes within this process. Necessary for the file backend, which
 * rewrites one document; harmless for Blobs, whose writes are per-record and
 * independent. Cross-instance safety comes from the Blobs key layout, not here.
 */
let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

export async function listHoldings(): Promise<Holding[]> {
  const holdings = await activeBackend().listHoldings();
  return holdings.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getTargetAcres(): Promise<number> {
  return activeBackend().getTargetAcres();
}

export async function setTargetAcres(acres: number): Promise<number> {
  const value = Math.max(1, Math.round(acres));
  await activeBackend().putTargetAcres(value);
  return value;
}

export type HoldingDraft = Omit<Holding, "id" | "createdAt" | "updatedAt">;

export async function addHolding(draft: HoldingDraft): Promise<Holding> {
  const now = new Date().toISOString();
  const holding: Holding = { ...draft, id: randomUUID(), createdAt: now, updatedAt: now };
  await serialize(() => activeBackend().putHolding(holding));
  return holding;
}

export async function updateHolding(
  id: string,
  patch: Partial<HoldingDraft>,
): Promise<Holding | null> {
  return serialize(async () => {
    const existing = await activeBackend().getHolding(id);
    if (!existing) return null;
    const updated: Holding = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    await activeBackend().putHolding(updated);
    return updated;
  });
}

export async function deleteHolding(id: string): Promise<boolean> {
  return serialize(() => activeBackend().removeHolding(id));
}
