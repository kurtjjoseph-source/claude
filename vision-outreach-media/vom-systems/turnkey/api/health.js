// GET /api/health — is this deployment actually able to remember a launch?
//
// Unauthenticated on purpose, and deliberately boring: it reports which storage adapter
// won, whether a real write→read→delete round-trip succeeded, and whether the gate has
// keys configured. No launch data, no key material, no env values — nothing here helps
// anyone get in, and it is the difference between "the OS is up" and "the OS will forget
// everything you do".

'use strict';

const crypto = require('crypto');
const { getStore } = require('./_lib/store');
const { gateConfigured } = require('./_lib/gate');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const store = getStore();
  const probe = `tkos:health:${crypto.randomBytes(8).toString('hex')}`;
  const stamp = new Date().toISOString();

  let roundtrip = false;
  let error = null;
  try {
    await store.set(probe, { stamp }, 60);
    const back = await store.get(probe);
    roundtrip = !!(back && back.stamp === stamp);
    await store.set(probe, null);
  } catch (e) {
    error = String((e && e.message) || e).slice(0, 200);
  }

  res.status(200).json({
    ok: true,
    storage: store.kind,                       // kv | redis | memory
    persists_across_cold_starts: store.persisted && roundtrip,
    roundtrip,
    gate_configured: gateConfigured(),
    error,
  });
};
