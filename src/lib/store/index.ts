import type { Db } from "@/lib/types";
import { type Backend, emptyDb } from "./backend";
import { fileBackend } from "./file";
import { blobsBackend } from "./blobs";

/**
 * The store is a single JSON document. A congregation-sized roll (tens of
 * users, not thousands) does not justify a database server, and keeping it in
 * one document makes the admin errata editor and the progress dashboard cheap
 * to implement.
 *
 * The backend is chosen by trying it rather than by reading an environment
 * variable: on Netlify the filesystem is read-only and Blobs is the only place
 * a write can land, but which env vars are present at runtime varies by
 * platform version. A probe read settles it once per instance.
 *
 * Writes are serialised through one in-process promise chain so two concurrent
 * requests cannot read-modify-write over each other within a single instance.
 */
let chosen: Backend | null = null;
let choosing: Promise<Backend> | null = null;

async function probe(candidate: Backend): Promise<Backend | null> {
  try {
    await candidate.read();          // null is fine; throwing is not
    return candidate;
  } catch {
    return null;
  }
}

async function pick(): Promise<Backend> {
  if (chosen) return chosen;
  choosing ??= (async () => {
    for (const candidate of [blobsBackend(), fileBackend()]) {
      const ok = await probe(candidate);
      if (ok) {
        chosen = ok;
        return ok;
      }
    }
    throw new Error("No writable store: neither Netlify Blobs nor the filesystem is available.");
  })();
  return choosing;
}

let queue: Promise<unknown> = Promise.resolve();

/** Run `fn` with exclusive access to the database, persisting any changes. */
export function transact<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = async (): Promise<T> => {
    const store = await pick();
    const db = (await store.read()) ?? emptyDb();
    const before = JSON.stringify(db);
    const result = await fn(db);
    const after = JSON.stringify(db);
    if (after !== before) await store.write(db);
    return result;
  };
  const next = queue.then(run, run);
  // Keep the chain alive even when a caller's work rejects.
  queue = next.catch(() => undefined);
  return next;
}

/** Read-only access. */
export async function read<T>(fn: (db: Db) => T): Promise<T> {
  const db = (await (await pick()).read()) ?? emptyDb();
  return fn(db);
}

/** Which backend is in use, for the health check. */
export async function backendName(): Promise<string> {
  return (await pick()).name;
}

export { emptyDb };
