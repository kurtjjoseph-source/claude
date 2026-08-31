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
 * Writes are serialised through one in-process promise chain so two concurrent
 * requests cannot read-modify-write over each other within a single instance.
 */
let backend: Backend | null = null;

function pick(): Backend {
  if (backend) return backend;
  backend = process.env.NETLIFY ? blobsBackend() : fileBackend();
  return backend;
}

let queue: Promise<unknown> = Promise.resolve();

/** Run `fn` with exclusive access to the database, persisting any changes. */
export function transact<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = async (): Promise<T> => {
    const store = pick();
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
  const db = (await pick().read()) ?? emptyDb();
  return fn(db);
}

export { emptyDb };
