// Storage adapter for the Client Business Hub backend.
//
// Interface (both impls, both async):
//   get(key) -> Promise<any>           resolves to the stored value, or undefined if absent/expired
//   set(key, value, ttlSeconds?) -> Promise<void>
//
// Everything the API touches (magic-link tokens, sessions, tenant profile, hub state) goes
// through this adapter, so swapping MemoryStore for KVStore is the only thing needed to make
// persistence real.
//
// Values are stored internally as { v: <value>, exp: <epoch-ms|null> } so both impls share the
// same TTL semantics. A value of `undefined`/`null` passed to set() is treated as "delete".

'use strict';

const MEMORY_TTL_WARNING =
  '[client-hub] MemoryStore is EPHEMERAL: it lives only in this serverless function\'s ' +
  'process memory and is wiped on every cold start / redeploy / new instance. Magic-link ' +
  'tokens, sessions and tenant state will all reset unexpectedly. Set KV_REST_API_URL + ' +
  'KV_REST_API_TOKEN (Vercel KV / Upstash Redis REST) as operator env vars to make this real.';

/**
 * In-process Map-backed store. Default fallback when no KV env vars are configured.
 * EPHEMERAL — resets on cold start, and is NOT shared across concurrent serverless
 * instances. Fine for local dev / demoing the flow end-to-end in a single process.
 */
class MemoryStore {
  constructor() {
    this.kind = 'memory';
    this.persisted = false;
    // Attach the Map to globalThis so it at least survives module re-evaluation within
    // the same warm lambda instance (Vercel may reuse the process across invocations).
    if (!globalThis.__VOM_HUB_MEMORY_STORE__) {
      globalThis.__VOM_HUB_MEMORY_STORE__ = new Map();
    }
    this._map = globalThis.__VOM_HUB_MEMORY_STORE__;
    if (!globalThis.__VOM_HUB_MEMORY_WARNED__) {
      globalThis.__VOM_HUB_MEMORY_WARNED__ = true;
      // eslint-disable-next-line no-console
      console.warn(MEMORY_TTL_WARNING);
    }
  }

  async get(key) {
    const entry = this._map.get(key);
    if (!entry) return undefined;
    if (entry.exp && Date.now() > entry.exp) {
      this._map.delete(key);
      return undefined;
    }
    return entry.v;
  }

  async set(key, value, ttlSeconds) {
    if (value === undefined || value === null) {
      this._map.delete(key);
      return;
    }
    const exp = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this._map.set(key, { v: value, exp });
  }
}

/**
 * REST-backed store for Upstash Redis / Vercel KV (same REST shape). Used automatically
 * when KV_REST_API_URL + KV_REST_API_TOKEN are present in the environment — this is the
 * "operator adds a KV store" upgrade path referenced in the hub README. No SDK dependency;
 * plain fetch against the documented REST command endpoints.
 *
 *   GET  {KV_REST_API_URL}/get/<key>              -> { result: string | null }
 *   POST {KV_REST_API_URL}/set/<key>               body: raw string value
 *   POST {KV_REST_API_URL}/set/<key>?EX=<seconds>   same, with TTL
 *
 * Values are JSON-stringified before storage and JSON-parsed on read so the adapter can
 * hold arbitrary JS values just like MemoryStore.
 */
class KVStore {
  constructor(url, token) {
    this.kind = 'kv';
    this.persisted = true;
    this._url = url.replace(/\/+$/, '');
    this._token = token;
  }

  async get(key) {
    const res = await fetch(`${this._url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${this._token}` },
    });
    if (!res.ok) {
      throw new Error(`KVStore.get(${key}) failed: ${res.status} ${await res.text().catch(() => '')}`);
    }
    const body = await res.json();
    if (body == null || body.result == null) return undefined;
    try {
      return JSON.parse(body.result);
    } catch {
      // Value wasn't JSON (shouldn't happen for keys we wrote) — return as-is.
      return body.result;
    }
  }

  async set(key, value, ttlSeconds) {
    if (value === undefined || value === null) {
      // Best-effort delete via the REST DEL command.
      await fetch(`${this._url}/del/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this._token}` },
      }).catch(() => {});
      return;
    }
    const path = ttlSeconds
      ? `${this._url}/set/${encodeURIComponent(key)}?EX=${ttlSeconds}`
      : `${this._url}/set/${encodeURIComponent(key)}`;
    const res = await fetch(path, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this._token}`,
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(value),
    });
    if (!res.ok) {
      throw new Error(`KVStore.set(${key}) failed: ${res.status} ${await res.text().catch(() => '')}`);
    }
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

let _singleton = null;

/**
 * Returns the process-wide store singleton. Preference: KV REST -> a plain REDIS_URL ->
 * memory. The Redis path speaks RESP over TCP/TLS directly so the function keeps zero
 * dependencies, and it means a project that only has REDIS_URL is fully supported.
 */
function getStore() {
  if (_singleton) return _singleton;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  if (url && token) {
    _singleton = new KVStore(url, token);
  } else if (redisUrl) {
    try { _singleton = new RedisUrlStore(redisUrl); }
    catch (e) {
      console.error('[client-hub] bad REDIS_URL, falling back to memory:', e.message);
      _singleton = new MemoryStore();
    }
  } else {
    _singleton = new MemoryStore();
  }
  return _singleton;
}

// Configured-looking is not the same as working. A read-only KV token satisfies every env
// check and then 403s on the first write, which is exactly how the magic link broke: the hub
// reported `persistent: true`, entered connected mode, and every sign-in died at token
// creation. So persistence is decided by an actual write, not by the presence of env vars.
function isConfigured() {
  return !!((process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
    || process.env.REDIS_URL || process.env.KV_URL);
}

let _writable = null;   // memoised per warm instance: one probe per cold start, not per call

/**
 * A configured store that cannot be written to is worse than no store: it looks healthy and
 * fails at the worst moment. So if the primary adapter refuses a write and another one is
 * configured, fail over to it once and keep going.
 */
async function failoverIfDead() {
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  if (!redisUrl || !_singleton || _singleton.kind !== 'kv') return false;
  try {
    const alt = new RedisUrlStore(redisUrl);
    const probe = `health:failover:${Math.random().toString(36).slice(2)}`;
    await alt.set(probe, { t: Date.now() }, 60);
    const back = await alt.get(probe);
    await alt.set(probe, null);
    if (back && back.t) {
      console.warn('[client-hub] KV REST is not writable — failed over to REDIS_URL');
      _singleton = alt;
      return true;
    }
  } catch (e) {
    console.error('[client-hub] failover to REDIS_URL also failed:', e.message);
  }
  return false;
}

/**
 * Proves the store can actually be written to. Returns {writable, error}. Memoised, so the
 * cost is one throwaway key per cold start.
 */
async function storeWritable(force) {
  if (_writable && !force) return _writable;
  const store = getStore();
  if (!store.persisted) { _writable = { writable: false, error: 'no shared store configured' }; return _writable; }
  const probe = `health:${Math.random().toString(36).slice(2)}`;
  try {
    await store.set(probe, { t: Date.now() }, 60);
    const back = await store.get(probe);
    await store.set(probe, null);
    _writable = back && back.t
      ? { writable: true, error: null }
      : { writable: false, error: 'write accepted but read back empty' };
  } catch (e) {
    // "NOPERM ... 'set'" means a READ-ONLY token was configured. Before giving up, try the
    // other store this project may already have.
    if (await failoverIfDead()) {
      _writable = null;
      return storeWritable(true);
    }
    _writable = { writable: false, error: String((e && e.message) || e).slice(0, 300) };
  }
  return _writable;
}

/** @deprecated env-presence only — prefer storeWritable(). Kept for callers not yet migrated. */
function isPersistent() {
  return isConfigured();
}

module.exports = { getStore, MemoryStore, KVStore, RedisUrlStore, isPersistent, isConfigured, storeWritable };
