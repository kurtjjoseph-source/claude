// GET /api/session -> {authed:bool, owner?:string, tenant_id?:string, persistent:bool}
//
// Reads the session cookie and reports whether it maps to a live session in the store.
// Multi-tenant: the session record carries the tenant_id resolved at sign-in (see
// api/auth/callback.js), so it's echoed back here too — harmless additive field, the
// front-end already tolerates unknown keys and /api/tenant remains the source of truth for
// the actual operating profile.

'use strict';

const { sendJson, methodNotAllowed, withErrorHandling } = require('./_lib/http');
const { getStore, storeWritable } = require('./_lib/store');
const { getSession } = require('./_lib/auth');

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const store = getStore();
  // `persistent` decides whether the hub enters connected mode, so it must mean "the store
  // can actually be written to" — a read-only KV token passes every env check and then 403s
  // on the first write, which is precisely how sign-in broke.
  const probe = await storeWritable();
  const persistent = probe.writable;
  const session = await getSession(req, store);

  const base = { persistent, storage: store.kind };
  if (!persistent && probe.error) base.storage_error = probe.error;

  if (!session) return sendJson(res, 200, { authed: false, ...base });
  return sendJson(res, 200, { authed: true, owner: session.owner, tenant_id: session.tenantId, ...base });
});
