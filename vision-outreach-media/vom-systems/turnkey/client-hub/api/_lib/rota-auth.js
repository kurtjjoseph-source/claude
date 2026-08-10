// Identity for the shared rota.
//
// The hub already has a magic-link flow, and it is the right thing for an *owner*: one
// person, an email they control, a link. It is the wrong thing for a bar with six staff on
// split shifts, half of whom will be asked to confirm next week's rota on a phone between
// tables. So this is a second, smaller model living beside it rather than a contortion of it:
// a manager passcode, a personal PIN each, and a token.
//
// Bearer tokens, not cookies, and deliberately. The rota is served from the platform's
// origin and this API from the hub's, so a session cookie would be a third-party cookie —
// blocked outright by Safari and Firefox by default. A token in the Authorization header
// crosses origins without asking anyone's permission. The cost is that it lives in
// localStorage and is therefore readable by any script on the page; these pages load no
// third-party script at all, which is what makes that trade acceptable here and would not
// make it acceptable everywhere.
//
// PINs are short because they are typed on a phone behind a bar. Short secrets are only
// safe when guessing is expensive, so they are scrypt-hashed with a per-person salt, and
// attempts are counted and locked. A four-digit PIN with unlimited attempts is not a
// credential, it is a formality.

'use strict';

const crypto = require('crypto');

const SESSION_SECONDS = 30 * 24 * 3600;   // a season of shifts, not a banking session
const MAX_ATTEMPTS = 8;                   // per person, per hour
const LOCK_SECONDS = 3600;

const authKey = team => `rota:${team}:auth`;
const sessKey = token => `rotasess:${token}`;
const lockKey = (team, who) => `rotalock:${team}:${who}`;

function token() {
  return crypto.randomBytes(24).toString('base64url');
}

function hashPin(pin, salt) {
  return crypto.scryptSync(String(pin), salt, 32).toString('hex');
}

function makeSecret(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { salt, hash: hashPin(pin, salt) };
}

function checkPin(secret, pin) {
  if (!secret || !secret.salt || !secret.hash) return false;
  const a = Buffer.from(secret.hash, 'hex');
  const b = Buffer.from(hashPin(pin, secret.salt), 'hex');
  // Comparing hashes rather than PINs, and in constant time, so a wrong answer takes as
  // long as a right one.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* The demo has to stay walkable by someone who was handed a link, so a team that has never
   been configured gets known PINs and says so on screen. A real deployment overwrites these
   the first time a manager sets one; nothing here is a default that silently persists into
   somebody's actual business, because a real business never has a team code of "rosterly". */
function demoAuth(staffIds) {
  const people = {};
  staffIds.forEach((id, i) => { people[id] = makeSecret(String(1000 + i + 1)); });
  return { manager: makeSecret('2468'), people, demo: true };
}

async function getAuth(store, team) {
  return (await store.get(authKey(team))) || null;
}

async function putAuth(store, team, auth) {
  await store.set(authKey(team), auth);
}

async function attemptsLeft(store, team, who) {
  const n = (await store.get(lockKey(team, who))) || 0;
  return Math.max(0, MAX_ATTEMPTS - n);
}

async function noteFailure(store, team, who) {
  const n = ((await store.get(lockKey(team, who))) || 0) + 1;
  await store.set(lockKey(team, who), n, LOCK_SECONDS);
  return MAX_ATTEMPTS - n;
}

async function clearFailures(store, team, who) {
  await store.set(lockKey(team, who), null);
}

async function issue(store, team, role, person) {
  const t = token();
  await store.set(sessKey(t), { team, role, person, at: Date.now() }, SESSION_SECONDS);
  return t;
}

/* Returns {team, role, person} or null. Never throws on a malformed header — an absent or
   rubbish token is simply "not signed in". */
async function session(req, store) {
  const raw = (req.headers && req.headers.authorization) || '';
  const m = /^Bearer\s+([A-Za-z0-9_-]{16,})$/.exec(raw.trim());
  if (!m) return null;
  const s = await store.get(sessKey(m[1]));
  return s || null;
}

async function revoke(req, store) {
  const raw = (req.headers && req.headers.authorization) || '';
  const m = /^Bearer\s+([A-Za-z0-9_-]{16,})$/.exec(raw.trim());
  if (m) await store.set(sessKey(m[1]), null);
}

module.exports = {
  SESSION_SECONDS, MAX_ATTEMPTS,
  authKey, makeSecret, checkPin, demoAuth,
  getAuth, putAuth, attemptsLeft, noteFailure, clearFailures,
  issue, session, revoke,
};
