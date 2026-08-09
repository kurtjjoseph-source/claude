import { getDeployStore, getStore, type Store } from "@netlify/blobs";
import type { Holding } from "@/lib/types";
import { DEFAULT_TARGET_ACRES, type PortfolioBackend } from "@/lib/portfolio/backend";

/**
 * Netlify Blobs backend.
 *
 * One blob per holding, keyed `holding/<id>`, plus a `settings` blob. Blobs
 * offers no compare-and-swap, so anything resembling a whole-document
 * read-modify-write would lose concurrent writes across function instances.
 * Per-record keys make an add or a delete a single independent operation.
 *
 * Reads request strong consistency: the default is eventual, which would let
 * the dashboard re-read immediately after a mutation and show the state before
 * it. For a dataset this small the latency cost is irrelevant next to showing
 * an operator a stale acreage roll-up.
 */

const STORE_NAME = "headgate-portfolio";
const HOLDING_PREFIX = "holding/";
const SETTINGS_KEY = "settings";

let cached: Store | null = null;

/**
 * Production uses the global store; every other context (deploy previews,
 * branch deploys) gets a deploy-scoped store that is discarded with the deploy.
 * Without this split, a preview built from a feature branch would read and
 * write the real portfolio — and a test holding added from a preview URL would
 * quietly land in the operator's live acreage roll-up.
 */
function openStore(): Store {
  const options = { name: STORE_NAME, consistency: "strong" } as const;
  return process.env.CONTEXT === "production" ? getStore(options) : getDeployStore(options);
}

function store(): Store {
  cached ??= openStore();
  return cached;
}

interface Settings {
  targetAcres: number;
}

export const blobsBackend: PortfolioBackend = {
  name: "netlify-blobs",

  async listHoldings() {
    const { blobs } = await store().list({ prefix: HOLDING_PREFIX });
    const holdings = await Promise.all(
      blobs.map((b) => store().get(b.key, { type: "json" }) as Promise<Holding | null>),
    );
    // A key can vanish between list and get if something was deleted mid-read.
    return holdings.filter((h): h is Holding => h !== null);
  },

  async getHolding(id) {
    return (await store().get(HOLDING_PREFIX + id, { type: "json" })) as Holding | null;
  },

  async putHolding(holding) {
    await store().setJSON(HOLDING_PREFIX + holding.id, holding);
  },

  async removeHolding(id) {
    const key = HOLDING_PREFIX + id;
    const existing = await store().get(key, { type: "json" });
    if (existing === null) return false;
    await store().delete(key);
    return true;
  },

  async getTargetAcres() {
    const settings = (await store().get(SETTINGS_KEY, { type: "json" })) as Settings | null;
    return typeof settings?.targetAcres === "number" ? settings.targetAcres : DEFAULT_TARGET_ACRES;
  },

  async putTargetAcres(acres) {
    await store().setJSON(SETTINGS_KEY, { targetAcres: acres } satisfies Settings);
  },
};

/**
 * True when the Blobs environment is wired up. `getStore` throws rather than
 * returning null when it is not, which is why this is a probe and not a flag.
 */
export function blobsAvailable(): boolean {
  try {
    openStore();
    return true;
  } catch {
    return false;
  }
}
