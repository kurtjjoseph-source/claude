// Storage adapter for the Turnkey Launch OS.
//
// Deliberately the SAME contract and the SAME env vars as the Client Business Hub
// (client-hub/api/_lib/store.js), so the operator configures ONE KV store and both
// products become persistent at once.
//
//   get(key)                  -> Promise<any | undefined>
//   set(key, value, ttlSec?)  -> Promise<void>   (null/undefined value = delete)
//   list(prefix)              -> Promise<Array<{key, value}>>
//
// Persistence is the whole point here: an operator must be able to close the tab on a
// launch that is half-built and come back to it next week. With no KV configured the
// adapter still works, but only inside one warm serverless instance — so the OS is told
// `persisted: false` and says so in the UI rather than pretending.

'use strict';

const MEMORY_WARNING =
  '[turnkey-os] MemoryStore is EPHEMERAL — launches will NOT survive a cold start or a ' +
  'redeploy, and are not shared between serverless instances. Set REDIS_URL (any Redis) or ' +
  'KV_REST_API_URL + KV_REST_API_TOKEN (Vercel KV / Upstash REST) to make launch persistence real.';

class MemoryStore {
  constructor() {
    if (!globalThis.__VOM_TURNKEY_MEMORY__) globalThis.__VOM_TURNKEY_MEMORY__ = new Map();
    this._map = globalThis.__VOM_TURNKEY_MEMORY__;
    this.kind = 'memory';
    this.persisted = false;
    if (!globalThis.__VOM_TURNKEY_MEMORY_WARNED__) {
      globalThis.__VOM_TURNKEY_MEMORY_WARNED__ = true;
      console.warn(MEMORY_WARNING);
    }
  }

  async get(key) {
    const e = this._map.get(key);
    if (!e) return undefined;
    if (e.exp && Date.now() > e.exp) { this._map.delete(key); return undefined; }
    return e.v;
  }

  async set(key, value, ttlSeconds) {
    if (value === undefined || value === null) { this._map.delete(key); return; }
    this._map.set(key, { v: value, exp: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null });
  }

  async list(prefix) {
    const out = [];
    for (const [k, e] of this._map.entries()) {
      if (!k.startsWith(prefix)) continue;
      if (e.exp && Date.now() > e.exp) { this._map.delete(k); continue; }
      out.push({ key: k, value: e.v });
    }
    return out;
  }
}

/** Upstash Redis / Vercel KV over REST — no SDK, plain fetch. */
class KVStore {
  constructor(url, token) {
    this.url = url.replace(/\/+$/, '');
    this.token = token;
    this.kind = 'kv';
    this.persisted = true;
  }

  async _cmd(cmd) {
    const r = await fetch(this.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd),
    });
    if (!r.ok) throw new Error(`kv ${cmd[0]} failed: ${r.status}`);
    const j = await r.json();
    return j.result;
  }

  async get(key) {
    const raw = await this._cmd(['GET', key]);
    if (raw === null || raw === undefined) return undefined;
    try { return JSON.parse(raw); } catch { return raw; }
  }

  async set(key, value, ttlSeconds) {
    if (value === undefined || value === null) { await this._cmd(['DEL', key]); return; }
    const cmd = ['SET', key, JSON.stringify(value)];
    if (ttlSeconds) cmd.push('EX', String(ttlSeconds));
    await this._cmd(cmd);
  }

  async list(prefix) {
    // SCAN rather than KEYS: a launch registry stays small, but SCAN is the safe habit.
    const keys = [];
    let cursor = '0';
    do {
      const res = await this._cmd(['SCAN', cursor, 'MATCH', `${prefix}*`, 'COUNT', '200']);
      cursor = Array.isArray(res) ? String(res[0]) : '0';
      const batch = Array.isArray(res) ? res[1] || [] : [];
      keys.push(...batch);
    } while (cursor !== '0');
    const out = [];
    for (const k of keys) {
      const v = await this.get(k);
      if (v !== undefined) out.push({ key: k, value: v });
    }
    return out;
  }
}

/**
 * Plain Redis over TCP/TLS from `REDIS_URL` — the shape Vercel's Redis integrations and
 * a self-hosted Redis both hand you, and the one this project actually has. Speaks RESP
 * directly so the function keeps zero dependencies: adding an npm client to a zero-config
 * serverless function is a build step and a supply-chain edge nobody asked for.
 *
 * One short-lived connection per operation batch, which is the right trade in a serverless
 * process that may be frozen between invocations.
 */
class RedisUrlStore {
  constructor(url) {
    const u = new URL(url);
    this.tls = u.protocol === 'rediss:';
    this.host = u.hostname;
    this.port = Number(u.port || 6379);
    this.username = decodeURIComponent(u.username || '');
    this.password = decodeURIComponent(u.password || '');
    this.kind = 'redis';
    this.persisted = true;
  }

  _connect() {
    const net = require('net');
    const tls = require('tls');
    return new Promise((resolve, reject) => {
      const sock = this.tls
        ? tls.connect({ host: this.host, port: this.port, servername: this.host })
        : net.connect({ host: this.host, port: this.port });

      let buf = Buffer.alloc(0);
      const waiters = [];
      let settled = false;

      const fail = (e) => { if (!settled) { settled = true; reject(e); } waiters.splice(0).forEach(w => w.reject(e)); };
      sock.setTimeout(8000, () => fail(new Error('redis timeout')));
      sock.on('error', fail);

      sock.on('data', (chunk) => {
        buf = Buffer.concat([buf, chunk]);
        for (;;) {
          const parsed = parseReply(buf, 0);
          if (!parsed) break;
          buf = buf.slice(parsed.next);
          const w = waiters.shift();
          if (!w) continue;
          if (parsed.error) w.reject(new Error(parsed.error)); else w.resolve(parsed.value);
        }
      });

      const send = (args) => new Promise((res, rej) => {
        waiters.push({ resolve: res, reject: rej });
        sock.write(encodeCommand(args));
      });

      const ready = () => {
        settled = true;
        resolve({
          send,
          close: () => { try { sock.write(encodeCommand(['QUIT'])); } catch (_) {} sock.end(); },
        });
      };

      sock.on(this.tls ? 'secureConnect' : 'connect', async () => {
        try {
          if (this.password) {
            await send(this.username ? ['AUTH', this.username, this.password] : ['AUTH', this.password]);
          }
          ready();
        } catch (e) { fail(e); }
      });
    });
  }

  async _run(fn) {
    const conn = await this._connect();
    try { return await fn(conn.send); } finally { conn.close(); }
  }

  async get(key) {
    const raw = await this._run((send) => send(['GET', key]));
    if (raw === null || raw === undefined) return undefined;
    try { return JSON.parse(raw); } catch { return raw; }
  }

  async set(key, value, ttlSeconds) {
    await this._run((send) => {
      if (value === undefined || value === null) return send(['DEL', key]);
      const cmd = ['SET', key, JSON.stringify(value)];
      if (ttlSeconds) cmd.push('EX', String(ttlSeconds));
      return send(cmd);
    });
  }

  async list(prefix) {
    return this._run(async (send) => {
      const keys = [];
      let cursor = '0';
      do {
        const res = await send(['SCAN', cursor, 'MATCH', prefix + '*', 'COUNT', '200']);
        cursor = String(res[0]);
        (res[1] || []).forEach((k) => keys.push(k));
      } while (cursor !== '0');
      const out = [];
      for (const k of keys) {
        const raw = await send(['GET', k]);
        if (raw === null || raw === undefined) continue;
        let v; try { v = JSON.parse(raw); } catch { v = raw; }
        out.push({ key: k, value: v });
      }
      return out;
    });
  }
}

/** RESP command encoder: *N\r\n$len\r\narg\r\n… */
function encodeCommand(args) {
  let s = '*' + args.length + '\r\n';
  for (const a of args) {
    const b = Buffer.from(String(a), 'utf8');
    s += '$' + b.length + '\r\n' + b.toString('utf8') + '\r\n';
  }
  return Buffer.from(s, 'utf8');
}

/** RESP reply parser. Returns {value|error, next} or null when more bytes are needed. */
function parseReply(buf, i) {
  if (i >= buf.length) return null;
  const type = String.fromCharCode(buf[i]);
  const eol = buf.indexOf('\r\n', i);
  if (eol === -1) return null;
  const head = buf.slice(i + 1, eol).toString('utf8');

  if (type === '+') return { value: head, next: eol + 2 };
  if (type === '-') return { error: head, next: eol + 2 };
  if (type === ':') return { value: Number(head), next: eol + 2 };
  if (type === '$') {
    const len = Number(head);
    if (len === -1) return { value: null, next: eol + 2 };
    const start = eol + 2;
    if (buf.length < start + len + 2) return null;
    return { value: buf.slice(start, start + len).toString('utf8'), next: start + len + 2 };
  }
  if (type === '*') {
    const n = Number(head);
    if (n === -1) return { value: null, next: eol + 2 };
    const items = [];
    let cur = eol + 2;
    for (let k = 0; k < n; k++) {
      const el = parseReply(buf, cur);
      if (!el) return null;
      if (el.error) return { error: el.error, next: el.next };
      items.push(el.value);
      cur = el.next;
    }
    return { value: items, next: cur };
  }
  return { error: 'unparseable reply type ' + type, next: eol + 2 };
}

let cached = null;

/**
 * Preference order: REST KV (cheapest per call in a serverless context) → a plain Redis
 * URL → memory. Persistence is never faked: whichever wins reports `persisted` honestly
 * and the OS shows the operator which one is in play.
 */
function getStore() {
  if (cached) return cached;
  const restUrl = process.env.KV_REST_API_URL;
  const restToken = process.env.KV_REST_API_TOKEN;
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  if (restUrl && restToken) cached = new KVStore(restUrl, restToken);
  else if (redisUrl) {
    try { cached = new RedisUrlStore(redisUrl); }
    catch (e) { console.error('[turnkey-os] bad REDIS_URL, falling back to memory:', e.message); cached = new MemoryStore(); }
  } else cached = new MemoryStore();
  return cached;
}

module.exports = { getStore, MemoryStore, KVStore, RedisUrlStore, encodeCommand, parseReply };
