import { promises as fs } from "node:fs";
import path from "node:path";
import type { Holding } from "@/lib/types";
import { DEFAULT_TARGET_ACRES, type PortfolioBackend } from "@/lib/portfolio/backend";

/**
 * JSON-file backend for local development and single-process deployments.
 *
 * Keeps the whole portfolio in one document, which is safe here because writes
 * are serialized in-process by the caller and there is only one process. Uses
 * write-then-rename so a crash mid-write cannot truncate the store.
 */

interface FileShape {
  targetAcres: number;
  holdings: Holding[];
}

function filePath(): string {
  return path.join(process.cwd(), process.env.DATA_DIR || ".data", "portfolio.json");
}

async function read(): Promise<FileShape> {
  try {
    const parsed = JSON.parse(await fs.readFile(filePath(), "utf8")) as Partial<FileShape>;
    return {
      targetAcres: typeof parsed.targetAcres === "number" ? parsed.targetAcres : DEFAULT_TARGET_ACRES,
      holdings: Array.isArray(parsed.holdings) ? parsed.holdings : [],
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { targetAcres: DEFAULT_TARGET_ACRES, holdings: [] };
    }
    throw err;
  }
}

async function write(shape: FileShape): Promise<void> {
  const file = filePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(shape, null, 2), "utf8");
  await fs.rename(tmp, file);
}

export const fileBackend: PortfolioBackend = {
  name: "file",

  async listHoldings() {
    return (await read()).holdings;
  },

  async getHolding(id) {
    return (await read()).holdings.find((h) => h.id === id) ?? null;
  },

  async putHolding(holding) {
    const shape = await read();
    const index = shape.holdings.findIndex((h) => h.id === holding.id);
    if (index === -1) shape.holdings.push(holding);
    else shape.holdings[index] = holding;
    await write(shape);
  },

  async removeHolding(id) {
    const shape = await read();
    const next = shape.holdings.filter((h) => h.id !== id);
    if (next.length === shape.holdings.length) return false;
    shape.holdings = next;
    await write(shape);
    return true;
  },

  async getTargetAcres() {
    return (await read()).targetAcres;
  },

  async putTargetAcres(acres) {
    const shape = await read();
    shape.targetAcres = acres;
    await write(shape);
  },
};
