import type { Db } from "@/lib/types";

/** A place the database JSON lives. */
export type Backend = {
  read(): Promise<Db | null>;
  write(db: Db): Promise<void>;
  name: string;
};

export const emptyDb = (): Db => ({ users: [], invitations: [], errata: [] });
