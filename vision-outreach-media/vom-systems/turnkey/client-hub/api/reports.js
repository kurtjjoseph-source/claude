// GET /api/reports -> the tenant's monthly "running inventory" computed SERVER-SIDE from
// real stored data (session-gated, tenant-scoped), plus live read-adapters:
//
//   • revenue / content / follow-ups / CRM  -> aggregated from the tenant's own hub state
//     (tenant:<id>:state) — the owner's real entered data, server-authoritative and
//     cross-device, NOT this-browser localStorage seed.
//   • site liveness  -> a real HTTP GET against the tenant's configured domain (up/down +
//     checkedAt). Credential-free; the site is the tenant's own public URL.
//   • presence (Engage AI)  -> env-gated. If ENGAGE_AI_BASE_URL is set the adapter queries it
//     (optionally with ENGAGE_AI_TOKEN) for this business's benchmark; if not configured it is
//     honestly reported as such. No numbers are ever fabricated.
//
// Every tile carries a `source` so the hub can badge live vs derived vs not-connected instead
// of pretending seed data is real. Requires a live session cookie (getSession) — there is no
// tenant-less or cross-tenant read.

'use strict';

const { sendJson, methodNotAllowed, withErrorHandling } = require('./_lib/http');
const { getStore, isPersistent } = require('./_lib/store');
const { getSession } = require('./_lib/auth');
const { tenantProfileKey, tenantStateKey } = require('./_lib/tenant');

/** Current year-month as "YYYY-MM" (UTC) for month-to-date filtering on ISO date strings. */
function thisMonthPrefix() {
  return new Date().toISOString().slice(0, 7);
}

function isThisMonth(isoDate) {
  return typeof isoDate === 'string' && isoDate.slice(0, 7) === thisMonthPrefix();
}

/** Small fetch-with-timeout so a slow/unreachable dependency can never hang the handler. */
async function fetchWithTimeout(url, opts, ms) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), ms) : null;
  try {
    return await fetch(url, Object.assign({ signal: controller ? controller.signal : undefined }, opts));
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Normalizes a stored domain value into an absolute URL, or null if there's nothing to check. */
function siteUrl(profile) {
  const raw = profile && profile.domain && typeof profile.domain.value === 'string'
    ? profile.domain.value.trim()
    : '';
  if (!raw || raw === '—') return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  // Bare hostname / "example.com" — assume https.
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(raw)) return 'https://' + raw;
  return null;
}

/** Real liveness check on the tenant's own public site. Never throws. */
async function checkSite(profile) {
  const url = siteUrl(profile);
  const value = (profile && profile.domain && profile.domain.value) || '—';
  if (!url) return { value, live: null, checkedAt: null, source: 'none' };
  try {
    const res = await fetchWithTimeout(url, { method: 'GET', redirect: 'follow' }, 4000);
    return { value, live: res.status < 500, status: res.status, checkedAt: new Date().toISOString(), source: 'http-check' };
  } catch {
    return { value, live: false, checkedAt: new Date().toISOString(), source: 'http-check' };
  }
}

/**
 * Engage AI presence adapter. Env-gated and honest:
 *   - not configured -> { configured:false }
 *   - configured but no data endpoint reachable -> { configured:true, reachable:false }
 *   - configured + reachable -> passes through whatever benchmark JSON Engage AI returns.
 */
async function checkPresence(profile) {
  const base = process.env.ENGAGE_AI_BASE_URL;
  if (!base) return { configured: false };
  const token = process.env.ENGAGE_AI_TOKEN;
  const biz = (profile && profile.business) || '';
  const url = base.replace(/\/+$/, '') + '/api/benchmark?business=' + encodeURIComponent(biz);
  try {
    const res = await fetchWithTimeout(
      url,
      { method: 'GET', headers: token ? { Authorization: 'Bearer ' + token } : {} },
      5000
    );
    if (!res.ok) return { configured: true, reachable: false, status: res.status };
    const ct = (res.headers.get('content-type') || '');
    const data = ct.indexOf('json') !== -1 ? await res.json().catch(() => null) : null;
    return { configured: true, reachable: true, data: data || null };
  } catch {
    return { configured: true, reachable: false };
  }
}

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const store = getStore();
  const session = await getSession(req, store);
  if (!session) return sendJson(res, 401, { error: 'unauthorized' });

  const [profile, state] = await Promise.all([
    store.get(tenantProfileKey(session.tenantId)),
    store.get(tenantStateKey(session.tenantId)),
  ]);
  const p = profile || {};
  const data = (state && state.data) || {};
  const arr = (k) => (Array.isArray(data[k]) ? data[k] : []);

  const payments = arr('payments');
  const content = arr('content');
  const inbox = arr('inbox');
  const crm = arr('crm');
  const channels = (p.publications && Array.isArray(p.publications.channels) && p.publications.channels) || [];

  const revenue = payments
    .filter((x) => x && x.status === 'paid' && isThisMonth(x.date))
    .reduce((sum, x) => sum + (Number(x.amount) || 0), 0);

  const [site, presence] = await Promise.all([checkSite(p), checkPresence(p)]);

  return sendJson(res, 200, {
    ok: true,
    mode: 'server',
    persistent: isPersistent(),
    generatedAt: new Date().toISOString(),
    business: p.business || null,
    tiles: {
      site,
      channels: { count: channels.length, list: channels, source: 'profile' },
      content: {
        shipped: content.filter((x) => x && x.status === 'shipped' && isThisMonth(x.date)).length,
        total: content.length,
        source: 'tenant-state',
      },
      followUps: {
        sent: inbox.filter((x) => x && x.status === 'sent' && isThisMonth(x.sentAt)).length,
        source: 'tenant-state',
      },
      revenue: {
        amount: revenue,
        currency: (p.payments && p.payments.currency) || 'EUR',
        invoices: payments.length,
        source: 'tenant-state',
      },
      crm: {
        total: crm.length,
        retained: crm.filter((c) => c && c.stage === 'retained').length,
        source: 'tenant-state',
      },
    },
    presence,
  });
});
