// Minimal HTTP helpers shared by the api/*.js handlers.
//
// Deliberately framework-free: Vercel's Node.js runtime passes a plain
// http.IncomingMessage / http.ServerResponse pair (with a few convenience
// extras layered on in production), so handlers here only rely on stdlib
// behaviour. That also keeps them runnable under a bare `node` harness for
// local testing without pulling in @vercel/node.

'use strict';

const { URL } = require('url');

/** Parses the query string off req.url into a plain object. */
function getQuery(req) {
  const base = `http://${req.headers && req.headers.host ? req.headers.host : 'localhost'}`;
  const u = new URL(req.url, base);
  const out = {};
  for (const [k, v] of u.searchParams.entries()) out[k] = v;
  return out;
}

/** Reads and JSON-parses the request body. Resolves to {} on empty/invalid body. */
function readJsonBody(req) {
  return new Promise((resolve) => {
    if (req.body !== undefined) {
      // Some runtimes (or the local test harness) may pre-parse the body.
      if (typeof req.body === 'string') {
        try {
          return resolve(req.body ? JSON.parse(req.body) : {});
        } catch {
          return resolve({});
        }
      }
      return resolve(req.body || {});
    }
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) req.destroy(); // 1MB guard
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

/** Parses the Cookie request header into a plain object. */
function parseCookies(req) {
  const header = (req.headers && req.headers.cookie) || '';
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

/** Builds a Set-Cookie header value. */
function buildCookie(name, value, { maxAge, httpOnly = true, sameSite = 'Lax', path = '/', secure } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`, `SameSite=${sameSite}`];
  if (httpOnly) parts.push('HttpOnly');
  if (secure !== false) parts.push('Secure');
  if (typeof maxAge === 'number') parts.push(`Max-Age=${maxAge}`);
  return parts.join('; ');
}

function isLocalHost(req) {
  const host = (req.headers && req.headers.host) || '';
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
}

function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj));
}

function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  sendJson(res, 405, { error: `method not allowed, use ${allowed.join('/')}` });
}

/** Wraps a handler so uncaught errors become a clean 500 JSON response. */
function withErrorHandling(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[client-hub] handler error:', err);
      if (!res.headersSent && !res.writableEnded) {
        sendJson(res, 500, { error: 'internal server error' });
      }
    }
  };
}

module.exports = {
  getQuery,
  readJsonBody,
  parseCookies,
  buildCookie,
  isLocalHost,
  sendJson,
  methodNotAllowed,
  withErrorHandling,
};
