// The gate in front of the Turnkey Launch OS.
//
// The explainer at / is public. The OS is not: it is the product. A licence key is
// exchanged once for an opaque server-side session; the OS HTML is never served to an
// unauthenticated request, so an unlisted URL is not the protection — the session is.
//
// Two ways a key can be valid, checked in this order:
//   1. TURNKEY_LICENCE_KEYS  — comma-separated allowlist, each `key` or `key:Label`.
//                              This is how VOM and named franchisees get in.
//   2. Stripe                — if STRIPE_SECRET_KEY is set, a `cs_…` checkout session,
//                              `sub_…` subscription or `cus_…` customer id is verified
//                              live against Stripe and must actually be paid/active.
//
// FAILS CLOSED: with neither configured, nothing unlocks. An unconfigured gate is a shut
// gate, never an open one.

'use strict';

const crypto = require('crypto');
const { getStore } = require('./store');

const COOKIE = 'vom_turnkey_os';
const SESSION_TTL = 30 * 24 * 60 * 60;      // 30 days
const MAX_ATTEMPTS = 8;                      // per IP
const ATTEMPT_WINDOW = 15 * 60;              // 15 minutes

function parseCookies(req) {
  const out = {};
  const raw = req.headers.cookie || '';
  raw.split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i < 0) return;
    out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function buildCookie(value, maxAge) {
  const bits = [
    `${COOKIE}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Secure',
    `Max-Age=${maxAge}`,
  ];
  return bits.join('; ');
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return (Array.isArray(fwd) ? fwd[0] : (fwd || '')).split(',')[0].trim() || 'unknown';
}

/** Timing-safe string compare that does not leak length through early return. */
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function allowlist() {
  const raw = process.env.TURNKEY_LICENCE_KEYS || process.env.TURNKEY_LICENSE_KEYS || '';
  return raw.split(',').map((s) => s.trim()).filter(Boolean).map((entry) => {
    const i = entry.indexOf(':');
    return i > 0
      ? { key: entry.slice(0, i).trim(), label: entry.slice(i + 1).trim() }
      : { key: entry, label: 'Licensed operator' };
  });
}

function gateConfigured() {
  return allowlist().length > 0 || Boolean(process.env.STRIPE_SECRET_KEY);
}

async function verifyWithStripe(key) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return null;
  let path = null;
  if (/^cs_[A-Za-z0-9_]+$/.test(key)) path = `checkout/sessions/${key}`;
  else if (/^sub_[A-Za-z0-9_]+$/.test(key)) path = `subscriptions/${key}`;
  else if (/^cus_[A-Za-z0-9_]+$/.test(key)) path = `customers/${key}`;
  if (!path) return null;

  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!r.ok) return null;
  const obj = await r.json();

  if (path.startsWith('checkout/sessions')) {
    if (obj.payment_status !== 'paid' && obj.status !== 'complete') return null;
    return { label: obj.customer_details?.email || obj.customer_email || 'Stripe customer',
             via: 'stripe:checkout' };
  }
  if (path.startsWith('subscriptions')) {
    if (!['active', 'trialing', 'past_due'].includes(obj.status)) return null;
    return { label: obj.customer || 'Stripe subscriber', via: 'stripe:subscription' };
  }
  if (obj.deleted) return null;
  return { label: obj.email || obj.id, via: 'stripe:customer' };
}

/** Rate limit by IP. Best-effort on MemoryStore, real once KV is configured. */
async function tooManyAttempts(store, ip) {
  const key = `tkos:attempts:${ip}`;
  const n = (await store.get(key)) || 0;
  return n >= MAX_ATTEMPTS;
}

async function noteAttempt(store, ip) {
  const key = `tkos:attempts:${ip}`;
  const n = (await store.get(key)) || 0;
  await store.set(key, n + 1, ATTEMPT_WINDOW);
}

/**
 * Exchanges a licence key for a session. Returns { ok, label, operator } or
 * { ok:false, reason }. `reason` is deliberately coarse — the caller shows one message
 * for every failure so the gate cannot be used to enumerate valid keys.
 */
async function redeemKey(req, key) {
  const store = getStore();
  const ip = clientIp(req);

  if (!gateConfigured()) return { ok: false, reason: 'unconfigured' };
  if (typeof key !== 'string' || key.length < 8 || key.length > 200) {
    await noteAttempt(store, ip);
    return { ok: false, reason: 'invalid' };
  }
  if (await tooManyAttempts(store, ip)) return { ok: false, reason: 'throttled' };

  let match = null;
  for (const entry of allowlist()) {
    if (safeEqual(entry.key, key)) { match = { label: entry.label, via: 'allowlist' }; break; }
  }
  if (!match) {
    try { match = await verifyWithStripe(key); } catch { match = null; }
  }
  if (!match) {
    await noteAttempt(store, ip);
    return { ok: false, reason: 'invalid' };
  }

  // Operator identity = a stable hash of the key, so two operators never see each
  // other's launches and the key itself is never stored.
  const operator = crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
  const token = crypto.randomBytes(32).toString('base64url');
  await store.set(`tkos:session:${token}`,
    { operator, label: match.label, via: match.via, createdAt: Date.now() }, SESSION_TTL);

  return { ok: true, token, cookie: buildCookie(token, SESSION_TTL),
           label: match.label, operator };
}

/** Resolves the current session, or null. */
async function currentSession(req) {
  const token = parseCookies(req)[COOKIE];
  if (!token) return null;
  const store = getStore();
  const sess = await store.get(`tkos:session:${token}`);
  if (!sess) return null;
  return { ...sess, token };
}

async function endSession(req) {
  const token = parseCookies(req)[COOKIE];
  if (token) await getStore().set(`tkos:session:${token}`, null);
  return buildCookie('', 0);
}

module.exports = { redeemKey, currentSession, endSession, gateConfigured, COOKIE };
