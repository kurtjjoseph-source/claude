// GET /api/tenant -> the SESSION owner's tenant operating profile (session-gated, tenant-scoped)
//
// Multi-tenant: one Client Business Hub deployment now serves many launched businesses, so
// there is no single global operating profile to hand back pre-auth anymore. The profile
// lives under `tenant:<id>:profile`, written at provisioning time by POST /api/provision
// (the Turnkey pipeline's registration step, see api/provision.js) — there's no endpoint
// here to write it, by design; that's a provisioning-time concern, not something the hub UI
// mutates at runtime. Which tenant's profile to return is resolved from the session (the
// tenant_id set at sign-in from the owner_email -> tenant_id mapping, see
// api/auth/callback.js), so unlike the old single-tenant version this endpoint is now
// session-gated: pre-auth, the deployment doesn't yet know which business the visitor
// belongs to.

'use strict';

const { sendJson, methodNotAllowed, withErrorHandling } = require('./_lib/http');
const { getStore } = require('./_lib/store');
const { getSession } = require('./_lib/auth');
const { tenantProfileKey } = require('./_lib/tenant');

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const store = getStore();
  const session = await getSession(req, store);
  if (!session) {
    return sendJson(res, 401, { error: 'unauthorized' });
  }

  const profile = await store.get(tenantProfileKey(session.tenantId));
  return sendJson(res, 200, profile || {});
});
