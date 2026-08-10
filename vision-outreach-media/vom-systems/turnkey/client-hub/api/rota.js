// GET  /api/rota?team=<code>            -> { rev, doc } | { rev: 0, doc: null } if never written
// PUT  /api/rota?team=<code> {rev, doc} -> { rev } | 409 { rev, doc } when someone else won
//
// The shared rota behind the scheduling product. Until this existed, "the team" meant one
// person in several tabs of one browser: every surface read and wrote localStorage, so a
// manager on a laptop and a bartender on a phone were two unrelated worlds that happened
// to start from the same seed.
//
// Concurrency is the whole problem, so it is the whole design. A rota is one document that
// several people edit at once — a manager dragging Thursday around while two staff claim
// shifts from the bus. Last-write-wins would delete somebody's request with no error, which
// is exactly the bug this product already had once, locally, and is the reason the client
// merges rather than overwrites. So every write carries the revision it was based on:
//
//   * `rev` matches  -> stored, `rev + 1` returned
//   * `rev` is stale -> 409 with the current { rev, doc }, and the caller merges and retries
//
// The client already knows how to merge (union-by-id for rows staff create, the manager's
// decision winning on a row both know), so a 409 is a normal event here, not an error path.
//
// Auth: a bearer token from /api/rota-auth, and it is required to read as well as to write.
// A rota is who works when and what they are paid, so a team code alone was never the right
// gate — it was defensible only while there was no way to know who was asking, and there is
// now. Reading needs any member; rewriting the document needs the manager, because staff
// change their own rows through /api/rota-act where the server does the edit for them.
// Keys are namespaced under `rota:` so nothing here can collide with, or be read as,
// tenant state.

'use strict';

const { getQuery, readJsonBody, sendJson, methodNotAllowed, withErrorHandling } =
  require('./_lib/http');
const { getStore } = require('./_lib/store');
const A = require('./_lib/rota-auth');
const id = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// A rota is a few hundred shifts at the very most. The cap is here so a public endpoint
// cannot be used to park arbitrary data in the operator's Redis.
const MAX_BYTES = 512 * 1024;

// Team codes name a key, so they may only contain what a key may contain.
const TEAM_RE = /^[a-z0-9][a-z0-9_-]{1,38}$/;

const key = team => `rota:${team}`;

function cors(res) {
  // The rota is served from the platform's own origin and this API from the hub's, so the
  // browser will preflight. Same operator, two deployments — the alternative is putting a
  // datastore credential on a second project, which is worse.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Cache-Control', 'no-store');
}

/* Three endpoints in one function, and not for elegance: this project is one function
   under a hard platform ceiling, and a deploy that fails on a quota is a worse outcome for
   the reader than a router. `?do=auth` signs in, `?do=act` is the staff intent endpoint,
   and no `do` is the document itself. */
async function handleAuth(req, res) {
  const store = getStore();

  if (req.method === 'DELETE') {
    await A.revoke(req, store);
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === 'GET') {
    const team = String(getQuery(req).team || '').toLowerCase().trim();
    if (!TEAM_RE.test(team)) return sendJson(res, 400, { error: 'bad team' });
    let auth = await A.getAuth(store, team);
    if (!auth) {
      /* First ask for a team that has never been configured. Rather than a dead end, mint
         demo credentials from whoever is on the rota, and flag them as demo so the sign-in
         screen can print them. A real deployment replaces them the moment a manager sets a
         PIN; nothing here quietly becomes somebody's actual security. */
      const rec = await store.get(key(team));
      const ids = rec && rec.doc && Array.isArray(rec.doc.staff)
        ? rec.doc.staff.map(p => p.id) : [];
      if (ids.length) { auth = A.demoAuth(ids); await A.putAuth(store, team, auth); }
    }
    // Enough for the page to draw a "who are you" list, and nothing more. No hashes, no
    // salts, no attempt counts — a sign-in screen should not be a source of intelligence.
    return sendJson(res, 200, {
      configured: !!auth,
      demo: !!(auth && auth.demo),
      people: auth ? Object.keys(auth.people || {}) : [],
    });
  }

  if (req.method !== 'POST') return methodNotAllowed(res, ['GET', 'POST', 'DELETE', 'OPTIONS']);

  const body = await readJsonBody(req);
  const team = String(body.team || '').toLowerCase().trim();
  const who = String(body.who || '').trim();
  const pin = String(body.pin || '').trim();
  if (!TEAM_RE.test(team)) return sendJson(res, 400, { error: 'bad team' });
  if (!who || !pin) return sendJson(res, 400, { error: 'who and pin are required' });

  const left = await A.attemptsLeft(store, team, who);
  if (left <= 0) {
    // Deliberately says how long rather than just "no": a locked-out bartender needs to
    // know whether to wait or to go and find the manager.
    return sendJson(res, 429, { error: 'too many attempts — try again in an hour' });
  }

  const auth = await A.getAuth(store, team);
  if (!auth) return sendJson(res, 404, { error: 'no such team' });

  const secret = who === 'manager' ? auth.manager : (auth.people || {})[who];
  if (!A.checkPin(secret, pin)) {
    const remaining = await A.noteFailure(store, team, who);
    return sendJson(res, 401, { error: 'that PIN is not right', attempts_left: Math.max(0, remaining) });
  }

  await A.clearFailures(store, team, who);
  const role = who === 'manager' ? 'manager' : 'staff';
  const t = await A.issue(store, team, role, who === 'manager' ? null : who);
  return sendJson(res, 200, { token: t, role, person: role === 'staff' ? who : null,
                              demo: !!auth.demo });
}

async function handleAct(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST', 'OPTIONS']);

  const store = getStore();
  const sess = await A.session(req, store);
  if (!sess) return sendJson(res, 401, { error: 'sign in first' });
  if (sess.role !== 'staff' || !sess.person) {
    return sendJson(res, 403, { error: 'this is the staff endpoint; a manager writes the rota directly' });
  }

  const rec = await store.get(key(sess.team));
  if (!rec || !rec.doc) return sendJson(res, 404, { error: 'no rota yet' });
  const doc = rec.doc;
  const me = sess.person;

  const body = await readJsonBody(req);
  const type = String(body.type || '');

  doc.availability = doc.availability || [];
  doc.claims = doc.claims || [];
  doc.acks = doc.acks || {};
  doc.swaps = doc.swaps || [];

  const wk = Number(body.wk);
  const day = Number(body.day);

  if (type === 'availability.set') {
    if (!Number.isInteger(wk) || !Number.isInteger(day) || day < 0 || day > 6) {
      return sendJson(res, 400, { error: 'wk and day (0-6) are required' });
    }
    if (wk < 0) return sendJson(res, 400, { error: 'that week has already happened' });
    const kind = body.kind === 'prefer_not' ? 'prefer_not' : 'off';
    // One mark per person per day: setting again replaces rather than stacks.
    doc.availability = doc.availability.filter(a => !(a.person === me && a.wk === wk && a.day === day));
    doc.availability.push({ id: id('av'), person: me, wk, day, kind,
                            note: String(body.note || '').slice(0, 120) });

  } else if (type === 'availability.clear') {
    doc.availability = doc.availability.filter(a => !(a.person === me && a.wk === wk && a.day === day));

  } else if (type === 'claim') {
    const shift = doc.shifts.find(s => s.id === String(body.shift || ''));
    if (!shift) return sendJson(res, 404, { error: 'no such shift' });
    if (shift.who) return sendJson(res, 409, { error: 'somebody already has that shift' });
    if (shift.wk < 0) return sendJson(res, 400, { error: 'that week has already happened' });
    if (doc.claims.some(c => c.shift === shift.id && c.person === me && c.state === 'pending')) {
      return sendJson(res, 200, { ok: true, note: 'already asked' });
    }
    doc.claims.push({ id: id('cl'), shift: shift.id, person: me,
                      note: String(body.note || '').slice(0, 120), state: 'pending' });

  } else if (type === 'swap') {
    const shift = doc.shifts.find(s => s.id === String(body.shift || ''));
    if (!shift) return sendJson(res, 404, { error: 'no such shift' });
    // Only your own shift is yours to hand over.
    if (shift.who !== me) return sendJson(res, 403, { error: 'that is not your shift' });
    const to = String(body.to || '');
    if (!doc.staff.some(p => p.id === to)) return sendJson(res, 400, { error: 'no such person' });
    doc.swaps.push({ id: id('sw'), shift: shift.id, from: me, to,
                     note: String(body.note || '').slice(0, 120), state: 'pending' });

  } else if (type === 'ack') {
    const k = String(body.wk);
    if (!doc.published || !doc.published[k]) {
      return sendJson(res, 400, { error: 'that week is not published, so there is nothing to confirm' });
    }
    doc.acks[k] = [...new Set([...(doc.acks[k] || []), me])];

  } else {
    return sendJson(res, 400, { error: 'unknown action' });
  }

  const next = { rev: (rec.rev || 0) + 1, doc, at: new Date().toISOString() };
  await store.set(key(sess.team), next);
  return sendJson(res, 200, { ok: true, rev: next.rev, doc });
}

module.exports = withErrorHandling(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  const doWhat = String(getQuery(req).do || '');
  if (doWhat === 'auth') return handleAuth(req, res);
  if (doWhat === 'act') return handleAct(req, res);

  const team = String(getQuery(req).team || '').toLowerCase().trim();
  if (!TEAM_RE.test(team)) {
    return sendJson(res, 400, { error: 'team must be 2-39 chars of a-z, 0-9, - or _' });
  }

  const store = getStore();

  /* Bootstrap. A team with no credentials yet cannot be signed into, and credentials are
     minted from the people on the rota — so a team with neither is a locked room with the
     key inside. The first write to an unclaimed team is therefore allowed and claims it:
     the rota is stored and demo credentials are minted from its staff. Every write after
     that needs a token like any other.

     Stated plainly because it is a real hole: anyone can claim a team nobody has claimed.
     For a public demo that is the point. A real deployment provisions credentials with the
     tenant and never leaves a team unclaimed. */
  if (req.method === 'PUT' && !(await A.getAuth(store, team))) {
    const body = await readJsonBody(req);
    const doc = body.doc;
    if (!doc || typeof doc !== 'object' || !Array.isArray(doc.staff) || !doc.staff.length) {
      return sendJson(res, 400, { error: 'to claim a team, send a rota with staff on it' });
    }
    const cur = await store.get(key(team));
    await store.set(key(team), { rev: (cur ? cur.rev : 0) + 1, doc,
                                 at: new Date().toISOString() });
    await A.putAuth(store, team, A.demoAuth(doc.staff.map(p => p.id)));
    return sendJson(res, 200, { rev: (cur ? cur.rev : 0) + 1, claimed: true });
  }

  // A rota is who works when and what they are paid. It was readable by anyone who knew
  // the team code, which was defensible only while there was no way to know who was
  // asking. There is now.
  const sess = await A.session(req, store);
  if (!sess || sess.team !== team) {
    return sendJson(res, 401, { error: 'sign in first' });
  }

  if (req.method === 'GET') {
    const rec = await store.get(key(team));
    // rev 0 means "nobody has written this team yet", which the client treats as an
    // invitation to seed it rather than as an error.
    return sendJson(res, 200, rec || { rev: 0, doc: null });
  }

  // Only a manager rewrites the document. Staff send intents through `?do=act`, where the
  // server makes the edit for them and they cannot reach anybody else's rows.
  if (sess.role !== 'manager') {
    return sendJson(res, 403, { error: 'only a manager can rewrite the rota' });
  }

  const body = await readJsonBody(req);
  if (typeof body.doc !== 'object' || body.doc === null || Array.isArray(body.doc)) {
    return sendJson(res, 400, { error: '"doc" must be a JSON object' });
  }
  const size = Buffer.byteLength(JSON.stringify(body.doc), 'utf8');
  if (size > MAX_BYTES) {
    return sendJson(res, 413, { error: `doc is ${size} bytes, limit ${MAX_BYTES}` });
  }

  const base = Number(body.rev);
  if (!Number.isInteger(base) || base < 0) {
    return sendJson(res, 400, { error: '"rev" must be the integer revision you read' });
  }

  const current = await store.get(key(team));
  const have = current ? Number(current.rev) : 0;

  // The interesting case, and the reason this endpoint is not a plain setter.
  if (have !== base) {
    return sendJson(res, 409, {
      error: 'stale revision — someone else wrote first',
      rev: have,
      doc: current ? current.doc : null,
    });
  }

  const next = { rev: have + 1, doc: body.doc, at: new Date().toISOString() };
  await store.set(key(team), next);
  return sendJson(res, 200, { rev: next.rev, at: next.at });
});
