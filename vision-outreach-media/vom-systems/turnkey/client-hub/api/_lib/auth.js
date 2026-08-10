// Passwordless auth helpers: opaque token generation, magic-link tokens and session
// lookup. No passwords anywhere. Tokens are opaque random strings looked up server-side
// through the storage adapter (api/_lib/store.js) rather than signed JWTs — simpler, no
// extra dependency, and revocable (delete the store key) rather than just expirable.

'use strict';

const crypto = require('crypto');
const { parseCookies, buildCookie, isLocalHost } = require('./http');

const SESSION_COOKIE = 'vom_hub_session';
const TOKEN_TTL_SECONDS = 15 * 60; // magic-link token: 15 minutes, single-use
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // session: 30 days

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email.trim());
}

function generateOpaqueToken() {
  return crypto.randomBytes(32).toString('base64url');
}

/** Creates a short-lived, single-use magic-link token for `email` and persists it. */
async function createMagicToken(store, email) {
  const token = generateOpaqueToken();
  await store.set(
    `token:${token}`,
    { email, createdAt: Date.now() },
    TOKEN_TTL_SECONDS
  );
  return token;
}

/**
 * Redeems a magic-link token: looks it up, deletes it (single-use), returns the
 * associated email, or null if missing/expired.
 */
async function consumeMagicToken(store, token) {
  if (!token || typeof token !== 'string') return null;
  const record = await store.get(`token:${token}`);
  if (!record) return null;
  await store.set(`token:${token}`, null); // delete — single use
  return record.email;
}

/** Creates a session for `email` scoped to `tenantId`, persists it, returns the opaque session id. */
async function createSession(store, email, tenantId) {
  const sid = generateOpaqueToken();
  await store.set(
    `session:${sid}`,
    { owner: email, tenantId, createdAt: Date.now() },
    SESSION_TTL_SECONDS
  );
  return sid;
}

/** Reads the session cookie off `req` and resolves the session record (or null). */
async function getSession(req, store) {
  const cookies = parseCookies(req);
  const sid = cookies[SESSION_COOKIE];
  if (!sid) return null;
  const record = await store.get(`session:${sid}`);
  if (!record) return null;
  return { sid, owner: record.owner, tenantId: record.tenantId };
}

// --- Multi-tenant: owner_email -> tenant_id mapping ---------------------------------------
//
// Registered by POST /api/provision (the guarded Turnkey-pipeline endpoint, see
// api/provision.js) and resolved at sign-in (api/auth/callback.js) so the session it creates
// carries the tenant_id. Kept here alongside session helpers since it's consulted at the same
// point in the auth flow, even though the mapping itself isn't a session or token.

/** Looks up the tenant registered for `email`, or null if that owner has never been provisioned. */
async function getTenantForOwner(store, email) {
  // Email addresses are case-insensitive in practice, and phones capitalise the first
  // letter. Keying the mapping on the raw string means "Kurt@x.com" is a different owner
  // from "kurt@x.com" — a provisioned owner locked out of their own business.
  const key = String(email || '').trim().toLowerCase();
  const tenantId = (await store.get(`owner:${key}`)) || (await store.get(`owner:${email}`));
  return tenantId || null;
}

/** Registers/updates the owner_email -> tenant_id mapping. Idempotent. */
async function setTenantForOwner(store, email, tenantId) {
  await store.set(`owner:${String(email || '').trim().toLowerCase()}`, tenantId);
}

async function destroySession(req, store) {
  const cookies = parseCookies(req);
  const sid = cookies[SESSION_COOKIE];
  if (sid) await store.set(`session:${sid}`, null);
}

function setSessionCookie(req, res, sid) {
  const cookie = buildCookie(SESSION_COOKIE, sid, {
    maxAge: SESSION_TTL_SECONDS,
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    secure: !isLocalHost(req),
  });
  res.setHeader('Set-Cookie', cookie);
}

function clearSessionCookie(req, res) {
  const cookie = buildCookie(SESSION_COOKIE, '', {
    maxAge: 0,
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    secure: !isLocalHost(req),
  });
  res.setHeader('Set-Cookie', cookie);
}

module.exports = {
  SESSION_COOKIE,
  TOKEN_TTL_SECONDS,
  SESSION_TTL_SECONDS,
  isValidEmail,
  createMagicToken,
  consumeMagicToken,
  createSession,
  getSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  getTenantForOwner,
  setTenantForOwner,
};
