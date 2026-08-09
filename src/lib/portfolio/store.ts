import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Holding } from "@/lib/types";

/**
 * JSON-file-backed portfolio store.
 *
 * Deliberately boring: the dataset is a few hundred rows at most, it needs to
 * survive a restart, and it needs to be trivially exportable and inspectable.
 * The module surface is narrow enough that swapping in Postgres later touches
 * only this file.
 */

const DATA_DIR = process.env.DATA_DIR || ".data";
const FILE = path.join(process.cwd(), DATA_DIR, "portfolio.json");

interface StoreShape {
  targetAcres: number;
  holdings: Holding[];
}

const DEFAULT_STORE: StoreShape = { targetAcres: 1000, holdings: [] };

/** Serializes writes so concurrent requests cannot interleave read-modify-write. */
let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function read(): Promise<StoreShape> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    return {
      targetAcres: typeof parsed.targetAcres === "number" ? parsed.targetAcres : 1000,
      holdings: Array.isArray(parsed.holdings) ? parsed.holdings : [],
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return { ...DEFAULT_STORE };
    throw err;
  }
}

async function write(store: StoreShape): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  // Write-then-rename so a crash mid-write cannot truncate the store.
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tmp, FILE);
}

export async function listHoldings(): Promise<Holding[]> {
  const store = await read();
  return store.holdings.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getTargetAcres(): Promise<number> {
  return (await read()).targetAcres;
}

export async function setTargetAcres(acres: number): Promise<number> {
  return serialize(async () => {
    const store = await read();
    store.targetAcres = Math.max(1, Math.round(acres));
    await write(store);
    return store.targetAcres;
  });
}

export type HoldingDraft = Omit<Holding, "id" | "createdAt" | "updatedAt">;

export async function addHolding(draft: HoldingDraft): Promise<Holding> {
  return serialize(async () => {
    const store = await read();
    const now = new Date().toISOString();
    const holding: Holding = { ...draft, id: randomUUID(), createdAt: now, updatedAt: now };
    store.holdings.push(holding);
    await write(store);
    return holding;
  });
}

export async function updateHolding(
  id: string,
  patch: Partial<HoldingDraft>,
): Promise<Holding | null> {
  return serialize(async () => {
    const store = await read();
    const index = store.holdings.findIndex((h) => h.id === id);
    if (index === -1) return null;
    const existing = store.holdings[index]!;
    const updated: Holding = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    store.holdings[index] = updated;
    await write(store);
    return updated;
  });
}

export async function deleteHolding(id: string): Promise<boolean> {
  return serialize(async () => {
    const store = await read();
    const next = store.holdings.filter((h) => h.id !== id);
    if (next.length === store.holdings.length) return false;
    store.holdings = next;
    await write(store);
    return true;
  });
}
