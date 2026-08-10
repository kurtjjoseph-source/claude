/* sync — the rota lives on a server, and both surfaces agree how.
 *
 * Written once and injected into the manager app and the team page, because a merge rule
 * that differs between two clients is not a merge rule. Everything here is deliberately
 * additive: with no endpoint configured, or with the network down, every function still
 * returns and the app carries on against localStorage exactly as before. Online is an
 * upgrade to this product, never a dependency of it — a rota you cannot read because
 * somebody's Wi-Fi is out is worse than a rota that only lives in one browser.
 *
 * The concurrency model is the server's: every write carries the revision it was based on,
 * and a stale one comes back 409 with the winning document instead of overwriting it. That
 * turns "two people edited at once" from silent data loss into a normal, handled event.
 *
 * Who owns what — the only thing that makes an automatic merge safe:
 *
 *   manager owns   shifts, staff, published, budget, coverage, weekOffset
 *   team owns      availability, acks            (each person only their own rows)
 *   shared         claims, swaps                 (staff create them, the manager decides)
 *
 * So a merge is not a generic deep-merge. Each side keeps what it owns, takes what it does
 * not, and on the shared collections unions by id with the manager's copy winning, because
 * approving or declining is the newer decision.
 */
(function (global) {
  'use strict';

  function unionById(mine, theirs, mineWins) {
    const out = [];
    const seen = new Set();
    const first = mineWins ? (mine || []) : (theirs || []);
    const second = mineWins ? (theirs || []) : (mine || []);
    first.forEach(r => { if (r && r.id != null && !seen.has(r.id)) { seen.add(r.id); out.push(r); } });
    second.forEach(r => { if (r && r.id != null && !seen.has(r.id)) { seen.add(r.id); out.push(r); } });
    return out;
  }

  function unionAcks(mine, theirs) {
    const out = {};
    Object.keys(Object.assign({}, mine || {}, theirs || {})).forEach(k => {
      out[k] = [...new Set([...((mine || {})[k] || []), ...((theirs || {})[k] || [])])];
    });
    return out;
  }

  /* Two different situations wear the same word "merge", and conflating them costs data
   * either way round:
   *
   *   a push lost a race  -> I hold an edit the server has never seen. Ownership decides,
   *                          because my unsent change must survive. That is mergeDoc().
   *   a poll found a change -> somebody else wrote and I have nothing pending, so the
   *                          server is simply newer. Ownership is the wrong question here:
   *                          applying it makes a manager permanently blind to a roster
   *                          edited from another device. That is adopt().
   *
   * Found by writing to production from curl while a browser sat open: the revision moved,
   * and the new person never appeared.
   */
  function adopt(server, keep) {
    const out = JSON.parse(JSON.stringify(server));
    // View state is this device's, not the document's — never let a remote write move the
    // week somebody is reading.
    if (keep && typeof keep.weekOffset === 'number') out.weekOffset = keep.weekOffset;
    return out;
  }

  /* `role` decides who yields. Called with the local doc and whatever the server says won. */
  function mergeDoc(mine, server, role) {
    if (!server) return mine;
    if (!mine) return server;
    const manager = role === 'manager';
    const out = JSON.parse(JSON.stringify(manager ? mine : server));

    if (manager) {
      // Keep our roster; take theirs for the rows only staff can write.
      out.availability = unionById(mine.availability, server.availability, false);
      out.acks = unionAcks(mine.acks, server.acks);
    } else {
      // The roster is the manager's; keep only our own contributions on top of it.
      out.availability = unionById(mine.availability, server.availability, true);
      out.acks = unionAcks(mine.acks, server.acks);
      out.weekOffset = server.weekOffset;
    }
    out.claims = unionById(mine.claims, server.claims, manager);
    out.swaps = unionById(mine.swaps, server.swaps, manager);
    return out;
  }

  function Sync(cfg) {
    this.url = (cfg && cfg.url) || '';
    this.team = (cfg && cfg.team) || '';
    this.role = (cfg && cfg.role) || 'team';
    /* The token is the identity. It sits in localStorage rather than a cookie because the
       app and the API are on different origins, and a third-party cookie is blocked
       outright by Safari and Firefox — a sign-in that works in one browser is not a
       sign-in. The cost is that a script on this page could read it; these pages load no
       third-party script, which is the only reason that trade is acceptable. */
    this.tokenKey = 'vom_rota_token_' + this.team;
    this.token = '';
    this.who = null;
    try { const raw = localStorage.getItem(this.tokenKey);
          if (raw) { const j = JSON.parse(raw); this.token = j.token; this.who = j; } } catch (e) {}
    this.rev = 0;
    this.state = this.url ? 'connecting' : 'offline';
    this.onstate = null;
    this.onremote = null;
    this._busy = false;
    this._again = false;
  }

  Sync.prototype._set = function (s, detail) {
    if (this.state === s && !detail) return;
    this.state = s;
    if (this.onstate) this.onstate(s, detail);
  };

  Sync.prototype.endpoint = function (extra) {
    return this.url + '?team=' + encodeURIComponent(this.team) + (extra || '');
  };

  Sync.prototype.headers = function () {
    const h = { 'Content-Type': 'application/json' };
    if (this.token) h.Authorization = 'Bearer ' + this.token;
    return h;
  };

  Sync.prototype.signedIn = function () { return !!this.token; };

  /* Who may sign in here — names only, so the page can draw the list before anyone has. */
  Sync.prototype.whoCanSignIn = async function () {
    if (!this.url) return { configured: false, people: [] };
    try {
      const r = await fetch(this.endpoint('&do=auth'), { cache: 'no-store' });
      return r.ok ? await r.json() : { configured: false, people: [] };
    } catch (e) { return { configured: false, people: [], offline: true }; }
  };

  Sync.prototype.signIn = async function (who, pin) {
    const r = await fetch(this.endpoint('&do=auth'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team: this.team, who, pin }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: j.error || ('sign-in failed (' + r.status + ')'),
                        attempts_left: j.attempts_left };
    this.token = j.token; this.who = j;
    try { localStorage.setItem(this.tokenKey, JSON.stringify(j)); } catch (e) {}
    return { ok: true, role: j.role, person: j.person, demo: j.demo };
  };

  Sync.prototype.signOut = async function () {
    try { await fetch(this.endpoint('&do=auth'), { method: 'DELETE', headers: this.headers() }); }
    catch (e) {}
    this.token = ''; this.who = null;
    try { localStorage.removeItem(this.tokenKey); } catch (e) {}
  };

  /* A staff member changing their own row. The server performs the edit and hands back the
     whole document, so there is no revision to lose a race over — and no field anywhere in
     the request naming whose row it is. */
  Sync.prototype.act = async function (intent) {
    if (!this.url || !this.token) return { ok: false, error: 'not signed in' };
    try {
      const r = await fetch(this.endpoint('&do=act'), {
        method: 'POST', headers: this.headers(), body: JSON.stringify(intent),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return { ok: false, error: j.error || ('failed (' + r.status + ')') };
      if (typeof j.rev === 'number') this.rev = j.rev;
      this._set('online');
      return { ok: true, doc: j.doc, rev: j.rev };
    } catch (e) { this._set('offline', 'unreachable'); return { ok: false, error: 'offline' }; }
  };

  /* Returns the server document, or null when there is nothing there or no server. */
  Sync.prototype.pull = async function () {
    if (!this.url) return null;
    try {
      const r = await fetch(this.endpoint(), { cache: 'no-store', headers: this.headers() });
      if (r.status === 401) { this._set('signedout'); return null; }
      if (!r.ok) { this._set('offline', 'server said ' + r.status); return null; }
      const j = await r.json();
      this.rev = j.rev || 0;
      this._set('online');
      return j.doc || null;
    } catch (e) {
      this._set('offline', 'unreachable');
      return null;
    }
  };

  /* Push, merging and retrying once if somebody else got there first. The caller hands us
     a getter rather than a document so that a retry re-reads whatever the app now holds
     instead of resurrecting a snapshot the user has already moved past. */
  Sync.prototype.push = async function (getDoc, applyMerged) {
    if (!this.url) return false;
    if (this._busy) { this._again = true; return false; }
    this._busy = true;
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        let res;
        try {
          res = await fetch(this.endpoint(), {
            method: 'PUT', headers: this.headers(),
            body: JSON.stringify({ rev: this.rev, doc: getDoc() }),
          });
        } catch (e) { this._set('offline', 'unreachable'); return false; }

        if (res.ok) {
          const j = await res.json();
          this.rev = j.rev;
          this._set('online');
          return true;
        }
        if (res.status === 401 || res.status === 403) { this._set('signedout'); return false; }
        if (res.status === 409) {
          // Normal here, not an error: merge their winning copy under ours and go again.
          const j = await res.json();
          this.rev = j.rev || 0;
          applyMerged(mergeDoc(getDoc(), j.doc, this.role));
          continue;
        }
        this._set('offline', 'server said ' + res.status);
        return false;
      }
      return false;
    } finally {
      this._busy = false;
      if (this._again) { this._again = false; this.push(getDoc, applyMerged); }
    }
  };

  /* Poll for other people's writes. Cheap: one GET, and it only calls back when the
     revision actually moved, so a quiet rota costs nothing but a request. */
  Sync.prototype.watch = function (everyMs) {
    if (!this.url) return;
    const tick = async () => {
      if (document.hidden || this._busy) return;
      try {
        const r = await fetch(this.endpoint(), { cache: 'no-store', headers: this.headers() });
        if (r.status === 401) { this._set('signedout'); return; }
        if (!r.ok) { this._set('offline', 'server said ' + r.status); return; }
        const j = await r.json();
        this._set('online');
        if ((j.rev || 0) > this.rev && j.doc) {
          this.rev = j.rev;
          if (this.onremote) this.onremote(j.doc);
        }
      } catch (e) { this._set('offline', 'unreachable'); }
    };
    setInterval(tick, everyMs || 5000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  };

  Sync.mergeDoc = mergeDoc;
  Sync.adopt = adopt;
  global.Sync = Sync;
})(window);
