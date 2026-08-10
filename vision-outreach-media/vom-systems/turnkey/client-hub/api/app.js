// GET /app — the business's own platform, served to its owner.
//
// This is where a generated platform stops being a file on someone's laptop. The hub
// renders the SAME platform shell Turnkey generates, but per tenant: the modules come from
// the tenant's operating profile, and the records live server-side under
// `tenant:<id>:state`, so the owner sees the same business from their phone, the office
// machine, or anywhere else they sign in.
//
// Same-origin by design. The session cookie is HttpOnly + SameSite=Lax, so a platform
// hosted on another domain could not carry it; serving the app from the hub itself means
// the auth that already works keeps working, with no CORS and no third-party cookies.
//
// No session -> 302 to the hub's sign-in. Unprovisioned owner -> the callback already
// refuses, so we never reach here without a tenant.

'use strict';

const { withErrorHandling, methodNotAllowed } = require('./_lib/http');
const { getStore } = require('./_lib/store');
const { getSession } = require('./_lib/auth');
const { tenantProfileKey } = require('./_lib/tenant');

let SHELL = null;
try {
  SHELL = require('./_lib/platform-shell');   // generated: the platform HTML as a string
} catch (_) {
  SHELL = null;
}

/** The module list for this tenant, from whatever shape the operating profile carries. */
function modulesFrom(profile) {
  if (!profile) return [];
  if (Array.isArray(profile.platform_modules)) return profile.platform_modules;   // Turnkey's shape
  if (Array.isArray(profile.client_hub)) return profile.client_hub;               // the hub's older shape
  return [];
}

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  const store = getStore();
  const session = await getSession(req, store);
  if (!session) {
    res.statusCode = 302;
    res.setHeader('Location', '/?next=/app');
    res.end();
    return;
  }

  if (!SHELL) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<h1>Platform shell not built</h1><p>Run <code>turnkey publish-platform</code> to '
          + 'generate <code>api/_lib/platform-shell.js</code>, then redeploy.</p>');
    return;
  }

  const profile = (await store.get(tenantProfileKey(session.tenantId))) || {};
  const keys = modulesFrom(profile);

  const config = {
    schema: 1,
    business: {
      name: profile.business_name || profile.name || session.tenantId,
      org_type: profile.org_type || null,
      org_label: profile.org_label || "",
      platform_choice: profile.platform_choice || "",
      operator: profile.operator || "",
      generated: profile.generated || "",
    },
    modules: keys.map(k => SHELL.MODULES[k]).filter(Boolean),
    hub: { enabled: true, tenant: session.tenantId, owner: session.owner },
  };

  const html = SHELL.html
    .replace("{{CONFIG}}", JSON.stringify(config).replace(/</g, "\\u003c"))
    .replace(/\{\{NAME\}\}/g, String(config.business.name).replace(/[<>&"]/g, ""))
    .replace(/\{\{LOGO\}\}/g, SHELL.LOGO || "");

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
});
