// The launch registry — the reason the OS is more than a viewer.
//
//   GET    /api/launches        -> every launch this operator has, newest activity first
//   PUT    /api/launches        -> upsert one launch (body = the record)
//   DELETE /api/launches?id=…   -> remove one
//
// A launch is imported from the `launch-state.json` the engine writes in the business
// folder, then lives here: an operator can pause a half-built launch, close the tab, and
// pick it up weeks later on another machine. Re-importing the same business updates the
// record and appends to its history, so the folder stays the source of truth for state
// and this stays the source of truth for "what am I running, and where did I leave it".
//
// Scoped to the session's operator id — one operator never sees another's launches.

'use strict';

const { currentSession } = require('./_lib/gate');
const { getStore } = require('./_lib/store');

const MAX_BYTES = 512 * 1024;          // one launch record
const MAX_LAUNCHES = 200;
const STATUSES = ['in_progress', 'paused', 'live', 'archived'];
const STAGES = ['intake', 'foundation', 'build', 'market', 'operate', 'launched'];

function slug(s) {
  return String(s || 'launch').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '').slice(0, 60) || 'launch';
}

function str(v, max, fallback = '') {
  return typeof v === 'string' ? v.slice(0, max) : fallback;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > MAX_BYTES) throw new Error('too_large');
    chunks.push(c);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

/** Everything the list view needs, so rendering a dashboard never parses full state. */
function summarize(state) {
  const ws = (state && state.workstreams) || {};
  const names = Object.keys(ws);
  const gates = names
    .filter((n) => ws[n].status === 'gate_pending')
    .map((n) => ({ workstream: n, actor: ws[n].actor_waiting || null,
                   action: str((ws[n].gate && ws[n].gate.action) || ws[n].note, 200) }));
  const bp = state && state.blueprint;
  return {
    stage: STAGES.includes(state && state.stage) ? state.stage : null,
    business: str(state && state.business, 120),
    operator: str(state && state.operator && state.operator.name, 120),
    done: names.filter((n) => ws[n].status === 'done').length,
    total: names.length,
    gates,
    blueprint: bp ? {
      org_type: str(bp.org_type, 40),
      org_label: str(bp.org_label, 80),
      platform: str(bp.platform && bp.platform.label, 60),
      wordpress: Boolean(bp.platform && bp.platform.wordpress_used),
      core: Object.keys(bp.functions || {}).filter((k) => bp.functions[k].tier === 'core').length,
    } : null,
  };
}

function normalize(input, existing) {
  const state = input.state && typeof input.state === 'object' ? input.state : (existing && existing.state) || null;
  const id = slug(input.id || (state && state.business) || input.business);
  const now = new Date().toISOString();
  const consent = Array.isArray(input.consent) ? input.consent.slice(0, 2000) : (existing && existing.consent) || [];
  const notes = Array.isArray(input.notes)
    ? input.notes.slice(-200).map((n) => ({ ts: str(n.ts, 40, now), text: str(n.text, 2000) }))
    : (existing && existing.notes) || [];

  let status = STATUSES.includes(input.status) ? input.status : (existing && existing.status) || 'in_progress';
  if (state && state.stage === 'launched' && status === 'in_progress') status = 'live';

  const history = ((existing && existing.history) || []).slice(-100);
  const lastStage = history.length ? history[history.length - 1].stage : null;
  const stage = state && state.stage;
  if (stage && stage !== lastStage) history.push({ ts: now, stage, status });

  return {
    id,
    business: str(input.business || (state && state.business), 120) || id,
    status,
    state,
    consent,
    notes,
    history,
    summary: summarize(state),
    created_at: (existing && existing.created_at) || now,
    updated_at: now,
  };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const session = await currentSession(req);
  if (!session) { res.status(401).json({ ok: false, error: 'locked' }); return; }

  const store = getStore();
  const prefix = `tkos:launch:${session.operator}:`;

  try {
    if (req.method === 'GET') {
      const rows = await store.list(prefix);
      const launches = rows.map((r) => r.value).filter(Boolean)
        .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
      res.status(200).json({
        ok: true,
        persisted: store.persisted,
        storage: store.kind,
        operator: session.operator,
        label: session.label,
        launches,
      });
      return;
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = await readBody(req);
      const incoming = body.launch || body;
      if (!incoming || typeof incoming !== 'object') {
        res.status(400).json({ ok: false, error: 'no_launch' }); return;
      }
      const id = slug(incoming.id || (incoming.state && incoming.state.business) || incoming.business);
      const existing = await store.get(prefix + id);
      if (!existing) {
        const rows = await store.list(prefix);
        if (rows.length >= MAX_LAUNCHES) {
          res.status(409).json({ ok: false, error: 'too_many_launches' }); return;
        }
      }
      const record = normalize(incoming, existing);
      await store.set(prefix + record.id, record);
      res.status(200).json({ ok: true, persisted: store.persisted, launch: record });
      return;
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url, 'http://x');
      const id = slug(url.searchParams.get('id') || '');
      if (!id) { res.status(400).json({ ok: false, error: 'no_id' }); return; }
      await store.set(prefix + id, null);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ ok: false, error: 'method_not_allowed' });
  } catch (err) {
    const code = err && err.message === 'too_large' ? 413 : 500;
    res.status(code).json({ ok: false, error: code === 413 ? 'launch_too_large' : 'server_error' });
  }
};
