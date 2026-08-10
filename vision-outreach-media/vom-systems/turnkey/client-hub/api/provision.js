// POST /api/provision  {tenant_id, owner_email, operating_profile} -> {ok:true, tenant_id}
//
// Guarded tenant-registration endpoint. This is what turns the Client Business Hub into a
// real multi-tenant deployment: the Turnkey pipeline calls this once a business has cleared
// Build/Market and is ready to hand its owner a hub login, registering the owner_email ->
// tenant_id mapping that sign-in (api/auth/callback.js) resolves, plus the tenant's initial
// operating profile and state.
//
// --- Guard -----------------------------------------------------------------------------
// Requires the shared secret in the `x-provision-token` header, or `Authorization: Bearer
// <token>`, to match process.env.PROVISION_TOKEN exactly. If the operator hasn't set
// PROVISION_TOKEN at all, provisioning is refused outright with a 503 — an unset secret
// must never be silently treated as "provisioning is open to anyone who finds the URL".
//
// --- Effects (idempotent) ---------------------------------------------------------------
// Re-provisioning the same tenant_id updates rather than duplicates:
//   owner:<owner_email>        -> tenant_id          (overwritten — lets Turnkey re-point
//                                                      an owner's email if it ever changes)
//   tenant:<tenant_id>:profile -> operating_profile   (always overwritten with the latest)
//   tenant:<tenant_id>:state   -> {}                  (seeded ONLY if not already present,
//                                                      so re-provisioning never wipes a
//                                                      tenant's live hub state)

'use strict';

const { readJsonBody, sendJson, methodNotAllowed, withErrorHandling } = require('./_lib/http');
const { getStore } = require('./_lib/store');
const { isValidEmail, setTenantForOwner } = require('./_lib/auth');
const { tenantProfileKey, tenantStateKey } = require('./_lib/tenant');

// Loose but sane: lowercase/uppercase alphanumerics plus -/_, 2-64 chars. Turnkey generates
// these; this just guards against empty strings, whitespace, and accidental key-injection
// (e.g. a tenant_id containing ":" that would collide with the `tenant:<id>:...` key shape).
const TENANT_ID_RE = /^[a-z0-9][a-z0-9_-]{1,63}$/i;

function isValidTenantId(id) {
  return typeof id === 'string' && TENANT_ID_RE.test(id);
}

/** Reads the provisioning secret off `x-provision-token` or an `Authorization: Bearer` header. */
function extractProvidedToken(req) {
  const header = req.headers && req.headers['x-provision-token'];
  if (typeof header === 'string' && header.trim()) return header.trim();
  const auth = req.headers && req.headers.authorization;
  if (typeof auth === 'string' && /^bearer\s+/i.test(auth)) {
    return auth.replace(/^bearer\s+/i, '').trim();
  }
  return null;
}

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  // --- Env-gated: provisioning stays disabled until the operator sets PROVISION_TOKEN. ---
  // Trim both sides: the header is trimmed on the way in, so an env value stored with a
  // stray newline or space would never match and the 401 would look like a wrong token.
  const expectedToken = (process.env.PROVISION_TOKEN || '').trim();
  if (!expectedToken) {
    return sendJson(res, 503, { error: 'provisioning not configured' });
  }

  const providedToken = extractProvidedToken(req);
  const same = providedToken && providedToken.length === expectedToken.length
    && require('crypto').timingSafeEqual(Buffer.from(providedToken), Buffer.from(expectedToken));
  if (!same) {
    return sendJson(res, 401, { error: 'invalid or missing provisioning token' });
  }

  const body = await readJsonBody(req);
  const tenantId = typeof body.tenant_id === 'string' ? body.tenant_id.trim() : '';
  const ownerEmail = typeof body.owner_email === 'string' ? body.owner_email.trim() : '';
  const operatingProfile = body.operating_profile;

  if (!isValidTenantId(tenantId)) {
    return sendJson(res, 400, {
      error: 'a valid "tenant_id" is required (letters, numbers, -, _, 2-64 chars)',
    });
  }
  if (!isValidEmail(ownerEmail)) {
    return sendJson(res, 400, { error: 'a valid "owner_email" is required' });
  }
  if (typeof operatingProfile !== 'object' || operatingProfile === null || Array.isArray(operatingProfile)) {
    return sendJson(res, 400, { error: '"operating_profile" must be a JSON object' });
  }

  const store = getStore();

  await setTenantForOwner(store, ownerEmail, tenantId);
  await store.set(tenantProfileKey(tenantId), operatingProfile);

  // Seed empty state only on first provision — never clobber a tenant's live hub state on
  // a re-provision (e.g. Turnkey re-running to update the operating profile later).
  const existingState = await store.get(tenantStateKey(tenantId));
  if (existingState === undefined) {
    await store.set(tenantStateKey(tenantId), {});
  }

  return sendJson(res, 200, { ok: true, tenant_id: tenantId });
});
