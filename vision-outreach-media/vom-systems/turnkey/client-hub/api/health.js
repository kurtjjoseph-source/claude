// GET /api/health — can this deployment actually sign someone in?
//
// Written after a live failure that no status page would have caught: the KV token was the
// read-only one, so every env check passed, `/api/session` reported `persistent: true`, the
// hub entered connected mode — and every magic-link request 500'd on the first write. This
// endpoint proves the round-trip instead of trusting configuration.
//
// Unauthenticated and deliberately dull: adapter name, booleans, and a storage error string.
// No tenant data, no addresses, no key material, no env values.

'use strict';

const { sendJson, methodNotAllowed, withErrorHandling } = require('./_lib/http');
const { getStore, storeWritable } = require('./_lib/store');

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const store = getStore();
  const probe = await storeWritable(true);   // force a fresh probe, this is the health check

  const email_configured = !!process.env.BREVO_API_KEY;
  const provisioning_configured = !!process.env.PROVISION_TOKEN;
  // A fingerprint, never the token: enough to tell "your shell and the server disagree"
  // apart from "the token is wrong", without putting any secret on the wire.
  const raw = (process.env.PROVISION_TOKEN || '').trim();
  const provision_fingerprint = raw
    ? require('crypto').createHash('sha256').update(raw).digest('hex').slice(0, 12)
    : null;

  // Counts only — no emails, no business names. Enough to tell "provisioning never wrote"
  // apart from "sign-in cannot find what provisioning wrote".
  let owners = null, tenants = null, sample = null;
  try {
    const o = await store.list('owner:');
    const t = await store.list('tenant:');
    owners = o.length; tenants = t.length;
    sample = o.length ? String(o[0].key).slice(0, 9) + '…' : null;
  } catch (e) { /* counts are diagnostics, never fatal */ }

  res.setHeader('Cache-Control', 'no-store');
  return sendJson(res, 200, {
    ok: true,
    storage: store.kind,                       // kv | redis | memory
    store_writable: probe.writable,
    storage_error: probe.error || null,
    email_configured,
    provisioning_configured,
    provision_fingerprint,
    owner_mappings: owners,
    tenant_keys: tenants,
    owner_key_prefix: sample,
    // The whole point: every one of these must be true before a magic link can complete.
    sign_in_ready: probe.writable && email_configured && provisioning_configured,
  });
});
