// GET /api/auth/callback?token=... -> validates token, resolves tenant, sets session cookie, 302 -> /
//
// This is the endpoint the emailed/dev link points at. On success it sets an httpOnly,
// SameSite=Lax session cookie and redirects the browser to the hub. On failure (missing,
// invalid, expired, or already-used token) it returns a JSON error instead of redirecting,
// since a 302 into the app with no session would just bounce the user back to sign-in with
// no explanation.
//
// Multi-tenant: a valid token only proves the email address. Before minting a session we
// resolve owner_email -> tenant_id (registered by POST /api/provision, the Turnkey
// pipeline's registration step — see api/provision.js and api/_lib/auth.js). If the owner
// has no tenant mapping we fail closed with a 403 rather than auto-creating a personal
// tenant: an unprovisioned email should never be able to talk its way into hub storage just
// by requesting a magic link, and a clear "not provisioned" error is easier to diagnose than
// a silently-created empty tenant nobody in Turnkey knows about.

'use strict';

const { getQuery, sendJson, methodNotAllowed, withErrorHandling } = require('../_lib/http');
const { getStore } = require('../_lib/store');
const { consumeMagicToken, createSession, setSessionCookie, getTenantForOwner } = require('../_lib/auth');

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const { token } = getQuery(req);
  if (!token) {
    return sendJson(res, 400, { error: 'missing token' });
  }

  const store = getStore();
  const email = await consumeMagicToken(store, token);
  if (!email) {
    return sendJson(res, 401, { error: 'invalid or expired token' });
  }

  const tenantId = await getTenantForOwner(store, email);
  if (!tenantId) {
    // Name the address. The reader just clicked a link emailed to it, so this reveals
    // nothing they don't know — and "which address did I actually sign in with" is the
    // one fact needed to fix a mismatch between sign-in and provisioning.
    return sendJson(res, 403, {
      error: `this account (${email}) is not provisioned for any business`,
      signed_in_as: email,
    });
  }

  const sid = await createSession(store, email, tenantId);
  setSessionCookie(req, res, sid);

  res.statusCode = 302;
  res.setHeader('Location', '/');
  res.end();
});
