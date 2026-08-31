import type { Db } from "@/lib/types";
import type { Backend } from "./backend";

type BlobStore = { get(k: string, o: { type: "text" }): Promise<string | null>;
                   set(k: string, v: string): Promise<unknown> };

let storePromise: Promise<BlobStore> | null = null;

/** Resolved lazily: @netlify/blobs only configures itself inside Netlify's runtime. */
function store(): Promise<BlobStore> {
  storePromise ??= import("@netlify/blobs").then(
    ({ getStore }) => getStore({ name: "exhorter", consistency: "strong" }) as unknown as BlobStore,
  );
  return storePromise;
}

/**
 * Netlify Blobs. Serverless functions get a fresh filesystem on every
 * invocation, so on Netlify the database has to live outside the bundle.
 */
export function blobsBackend(): Backend {
  return {
    name: "netlify-blobs",
    async read() {
      const raw = await (await store()).get("db", { type: "text" });
      return raw ? (JSON.parse(raw) as Db) : null;
    },
    async write(db: Db) {
      await (await store()).set("db", JSON.stringify(db));
    },
  };
}
