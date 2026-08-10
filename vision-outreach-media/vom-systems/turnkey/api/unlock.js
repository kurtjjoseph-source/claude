// POST /api/unlock  { key }        -> exchange a licence key for an OS session
// POST /api/unlock  { lock: true } -> end the session
//
// Every failure returns the same message: a gate that explains WHY a key was rejected
// is a gate that helps someone guess one.

'use strict';

const { redeemKey, endSession, gateConfigured } = require('./_lib/gate');

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  const body = await readBody(req);

  if (body.lock) {
    const cookie = await endSession(req);
    res.setHeader('Set-Cookie', cookie);
    res.status(200).json({ ok: true, locked: true });
    return;
  }

  const result = await redeemKey(req, body.key);

  if (!result.ok) {
    if (result.reason === 'unconfigured') {
      // The operator has not set TURNKEY_LICENCE_KEYS or STRIPE_SECRET_KEY yet.
      // Say so plainly — this state is the operator's own setup, not an attacker probe.
      res.status(503).json({ ok: false,
        error: 'The gate is not configured on this deployment yet.' });
      return;
    }
    // Slow every rejection down a little; identical response for invalid and throttled.
    await new Promise((r) => setTimeout(r, 400));
    res.status(401).json({ ok: false, error: "That key didn't unlock anything." });
    return;
  }

  res.setHeader('Set-Cookie', result.cookie);
  res.status(200).json({ ok: true, label: result.label });
};

module.exports.gateConfigured = gateConfigured;
