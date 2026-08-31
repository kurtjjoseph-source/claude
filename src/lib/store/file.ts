import { promises as fs } from "node:fs";
import path from "node:path";
import type { Db } from "@/lib/types";
import { type Backend, emptyDb } from "./backend";

/**
 * JSON file on disk. Used in local development and anywhere a writable volume
 * exists. Writes go to a temporary file and are renamed over the target so a
 * crash mid-write cannot truncate the database.
 */
export function fileBackend(dir = process.env.DATA_DIR || ".data"): Backend {
  const file = path.join(dir, "db.json");
  return {
    name: `file(${file})`,
    async read() {
      try {
        return JSON.parse(await fs.readFile(file, "utf8")) as Db;
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw err;
      }
    },
    async write(db: Db) {
      await fs.mkdir(dir, { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
      await fs.rename(tmp, file);
    },
  };
}

export { emptyDb };
