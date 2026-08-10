// POST /api/auth/request  {email} -> {ok:true}
//
// Creates a short-lived, single-use magic-link token and emails it (Brevo).
//
// The link is NEVER returned in the response in production. Handing a working sign-in link
// back to whoever asked for it turns "I know an owner's email address" into "I am that
// owner" — so `devLink` now requires HUB_DEV_LINKS=1 *and* a non-production environment.
// Without an email provider configured in production the request fails closed instead.
//
// Rate-limited per address and per IP: this endpoint spends the operator's Brevo reputation
// on whatever address it is handed, so it is not left open.

'use strict';

const { readJsonBody, sendJson, methodNotAllowed, withErrorHandling } = require('../_lib/http');
const { getStore, storeWritable } = require('../_lib/store');
const { isValidEmail, createMagicToken } = require('../_lib/auth');
const { sendMagicLink } = require('../_lib/email');

const MAX_PER_EMAIL = 5;        // per hour
const MAX_PER_IP = 20;          // per hour
const RATE_WINDOW = 60 * 60;

function clientIp(req) {
  const fwd = (req.headers && req.headers['x-forwarded-for']) || '';
  return String(Array.isArray(fwd) ? fwd[0] : fwd).split(',')[0].trim() || 'unknown';
}

async function overLimit(store, key, max) {
  try {
    const n = (await store.get(key)) || 0;
    if (n >= max) return true;
    await store.set(key, n + 1, RATE_WINDOW);
    return false;
  } catch (_) {
    return false;   // never let the limiter itself break sign-in
  }
}

function devLinksAllowed() {
  return process.env.HUB_DEV_LINKS === '1' && process.env.VERCEL_ENV !== 'production';
}

function buildOrigin(req) {
  const host = (req.headers && req.headers.host) || 'localhost';
  const proto = (req.headers && req.headers['x-forwarded-proto']) || (/^(localhost|127\.0\.0\.1)/.test(host) ? 'http' : 'https');
  return `${proto}://${host}`;
}

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const body = await readJsonBody(req);
  const email = typeof body.email === 'string' ? body.email.trim() : '';

  if (!isValidEmail(email)) {
    return sendJson(res, 400, { error: 'a valid email is required' });
  }

  const store = getStore();

  // A store that cannot be written to means the token would never exist to be redeemed.
  // Say so plainly instead of throwing a generic 500 that takes a log dive to diagnose.
  const probe = await storeWritable();
  if (!probe.writable) {
    console.error('[client-hub] auth/request blocked — store not writable:', probe.error);
    return sendJson(res, 503, {
      error: 'sign-in is unavailable: this deployment cannot write to its store',
      detail: probe.error && /NOPERM|permission/i.test(probe.error)
        ? 'the configured KV token appears to be read-only'
        : undefined,
    });
  }

  const ip = clientIp(req);
  if (await overLimit(store, `rate:email:${email}`, MAX_PER_EMAIL)
      || await overLimit(store, `rate:ip:${ip}`, MAX_PER_IP)) {
    return sendJson(res, 429, { error: 'too many sign-in requests — try again later' });
  }

  const token = await createMagicToken(store, email);
  const link = `${buildOrigin(req)}/api/auth/callback?token=${encodeURIComponent(token)}`;

  let result;
  try {
    result = await sendMagicLink(email, link);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[client-hub] sendMagicLink failed:', err);
    return sendJson(res, 502, { error: 'failed to send magic link email' });
  }

  if (result.sent) {
    return sendJson(res, 200, { ok: true });
  }
  // No email provider configured.
  if (devLinksAllowed()) {
    return sendJson(res, 200, { ok: true, devLink: result.devLink });
  }
  console.error('[client-hub] BREVO_API_KEY not set — refusing to return a sign-in link');
  return sendJson(res, 503, { error: 'sign-in email is not configured on this deployment' });
});
