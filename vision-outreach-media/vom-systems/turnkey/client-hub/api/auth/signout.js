// POST /api/auth/signout -> clears the session cookie (and the server-side session record)

'use strict';

const { sendJson, methodNotAllowed, withErrorHandling } = require('../_lib/http');
const { getStore } = require('../_lib/store');
const { destroySession, clearSessionCookie } = require('../_lib/auth');

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const store = getStore();
  await destroySession(req, store);
  clearSessionCookie(req, res);

  return sendJson(res, 200, { ok: true });
});
