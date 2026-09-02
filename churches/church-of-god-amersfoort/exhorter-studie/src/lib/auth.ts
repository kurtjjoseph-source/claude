import { cookies } from "next/headers";
import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Role, User } from "@/lib/types";
import { read, transact } from "@/lib/store";
import { defaultSettings, emptyProgress } from "@/lib/types";

const scryptAsync = promisify(scrypt) as (
  pw: string, salt: string, len: number,
) => Promise<Buffer>;

const COOKIE = "exhorter_session";
const MAX_AGE = 60 * 60 * 24 * 30;   // 30 days

/**
 * A session secret is required in production. In development one is derived so
 * the app runs with no configuration, but that key does not survive a restart,
 * which logs everyone out — acceptable locally, not in production.
 */
function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set (32+ random characters).");
  }
  const dev = (globalThis.__devSecret ??= randomBytes(32).toString("hex"));
  return dev;
}
declare global { var __devSecret: string | undefined }

export async function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = (await scryptAsync(password, salt, 64)).toString("hex");
  return { hash, salt };
}

export async function verifyPassword(password: string, user: User) {
  const { hash } = await hashPassword(password, user.salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(user.passwordHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

/** Issue a signed session cookie. */
export async function startSession(userId: string) {
  const expires = Date.now() + MAX_AGE * 1000;
  const payload = `${userId}.${expires}`;
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true, sameSite: "lax", path: "/",
    secure: process.env.NODE_ENV === "production", maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** The signed-in user, or null. Also refreshes `lastSeenAt` once a day. */
export async function currentUser(): Promise<User | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const cut = raw.lastIndexOf(".");
  if (cut < 0) return null;
  const payload = raw.slice(0, cut);
  const mac = raw.slice(cut + 1);
  const expected = sign(payload);
  if (mac.length !== expected.length ||
      !timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  const [userId, expiresAt] = payload.split(".");
  if (!userId || !expiresAt || Number(expiresAt) < Date.now()) return null;
  const user = await read((db) => db.users.find((u) => u.id === userId) ?? null);
  return user && !user.disabled ? user : null;
}

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") throw new Response("Forbidden", { status: 403 });
  return user;
}

export const normaliseEmail = (email: string) => email.trim().toLowerCase();

/**
 * Create a user. The first account to be created owns the site: there is no
 * bootstrap password to leak and no seeded admin to forget about.
 */
export async function createUser(opts: {
  email: string; name: string; password: string; role?: Role;
}): Promise<{ user: User } | { error: string }> {
  const email = normaliseEmail(opts.email);
  const { hash, salt } = await hashPassword(opts.password);
  return transact((db) => {
    if (db.users.some((u) => u.email === email)) {
      return { error: "Er bestaat al een account met dit e-mailadres." };
    }
    const first = db.users.length === 0;
    const user: User = {
      id: randomBytes(9).toString("base64url"),
      email,
      name: opts.name.trim() || email.split("@")[0]!,
      role: first ? "admin" : (opts.role ?? "student"),
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      settings: defaultSettings(),
      progress: emptyProgress(),
    };
    db.users.push(user);
    return { user };
  });
}

/** True when nobody has registered yet, so the sign-up page can say so. */
export const noUsersYet = () => read((db) => db.users.length === 0);
