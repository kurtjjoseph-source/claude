// GET /api/state          -> the SESSION owner's tenant hub state JSON (session-gated; {} if none)
// PUT /api/state {state}  -> persist that tenant's state (session-gated)
//
// Multi-tenant: state is stored under `tenant:<id>:state`, scoped to the session's
// tenant_id (resolved at sign-in from the owner_email -> tenant_id mapping — see
// api/_lib/auth.js and api/auth/callback.js). Both verbs require a live session cookie (see
// api/_lib/auth.js getSession), so there is never a tenant-less or cross-tenant read/write.

'use strict';

const { readJsonBody, sendJson, methodNotAllowed, withErrorHandling } = require('./_lib/http');
const { getStore } = require('./_lib/store');
const { getSession } = require('./_lib/auth');
const { tenantStateKey } = require('./_lib/tenant');

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return methodNotAllowed(res, ['GET', 'PUT']);
  }

  const store = getStore();
  const session = await getSession(req, store);
  if (!session) {
    return sendJson(res, 401, { error: 'unauthorized' });
  }

  const key = tenantStateKey(session.tenantId);

  if (req.method === 'GET') {
    const state = await store.get(key);
    return sendJson(res, 200, state || {});
  }

  // PUT
  const body = await readJsonBody(req);
  if (typeof body.state !== 'object' || body.state === null || Array.isArray(body.state)) {
    return sendJson(res, 400, { error: '"state" must be a JSON object' });
  }

  await store.set(key, body.state);
  return sendJson(res, 200, { ok: true });
});
