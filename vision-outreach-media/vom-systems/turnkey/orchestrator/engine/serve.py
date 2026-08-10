#!/usr/bin/env python3
"""
serve — the hosted entrypoint for the platform factory.

`factory.py serve()` is the local mode: loopback only, one-time token printed to a
terminal, single operator sitting at the machine. None of that survives being put on
the internet, so this is the hosted variant of the same app:

    bind         0.0.0.0 on $PORT            (Render/Fly/any container host)
    auth         a password, not a printed token
    storage      $IDEAS_ROOT on a mounted disk, because container disks are wiped
    deploys      the Vercel REST API, because there is no CLI in the image

Everything else — the actions, the milestones, the artifacts — is factory.py unchanged.

Start command:
    python3 serve.py

Required environment:
    FACTORY_PASSWORD   the only thing between the internet and the deploy token
    IDEAS_ROOT         where businesses are written (must be on a persistent disk)
    VERCEL_TOKEN       so Forge can deploy without the CLI
    ANTHROPIC_API_KEY  so ideation can draft (optional; the form works without it)
"""

from __future__ import annotations

import hashlib
import hmac
import html
import http.cookies
import json
import os
import secrets
import socketserver
import sys
import time
from urllib.parse import urlparse, parse_qs

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import factory  # noqa: E402

COOKIE = "factory_session"
SESSION_HOURS = 12


def _require(name: str) -> str:
    v = os.environ.get(name)
    if not v:
        sys.exit(f"{name} is not set — refusing to start.\n"
                 f"A hosted factory without {name} is either unreachable or unprotected.")
    return v


class Sessions:
    """Signed, expiring session cookies. No store, no library, no state to lose."""

    def __init__(self, password: str):
        self.password = password
        # A per-process secret: restarting the service logs everyone out, which for a
        # single-operator tool is the right trade against persisting a signing key.
        self.secret = secrets.token_bytes(32)

    def check_password(self, attempt: str) -> bool:
        return hmac.compare_digest((attempt or "").encode(), self.password.encode())

    def issue(self) -> str:
        expires = str(int(time.time()) + SESSION_HOURS * 3600)
        sig = hmac.new(self.secret, expires.encode(), hashlib.sha256).hexdigest()[:32]
        return f"{expires}.{sig}"

    def valid(self, token: str) -> bool:
        try:
            expires, sig = (token or "").split(".", 1)
        except ValueError:
            return False
        expect = hmac.new(self.secret, expires.encode(), hashlib.sha256).hexdigest()[:32]
        if not hmac.compare_digest(sig, expect):
            return False
        return int(expires) > time.time()


LOGIN_PAGE = """<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Platform Factory</title><style>
:root{--bg:#f6f5f1;--surface:#fff;--line:#e1dfd4;--ink:#1a1d1b;--soft:#535b56;--c:#c47716}
@media(prefers-color-scheme:dark){:root{--bg:#0e100f;--surface:#161a18;--line:#2a322d;
  --ink:#f0f2ee;--soft:#a8b1aa;--c:#f0a24b}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;
  background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,sans-serif}
form{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:32px;
  width:min(380px,92vw);display:grid;gap:14px}
h1{font-family:ui-serif,Georgia,serif;font-weight:600;font-size:24px;margin:0}
p{margin:0;color:var(--soft);font-size:13.5px}
input{font:inherit;padding:11px 13px;border:1px solid var(--line);border-radius:9px;
  background:var(--bg);color:var(--ink)}
button{font:inherit;font-weight:700;padding:11px;border:0;border-radius:999px;
  background:var(--c);color:#fff;cursor:pointer}
.e{color:#c0523a;font-size:13px;font-weight:600}
</style></head><body>
<form method="post" action="/login">
  <h1>Platform Factory</h1>
  <p>Vision Outreach Media</p>
  __ERROR__
  <input type="password" name="password" placeholder="Password" autofocus required>
  <button type="submit">Enter</button>
</form></body></html>"""


def build_handler(root: str, sessions: Sessions):
    class H(factory.make_handler(root)):  # type: ignore[misc]
        def _authed(self) -> bool:
            raw = self.headers.get("Cookie")
            if not raw:
                return False
            c = http.cookies.SimpleCookie()
            try:
                c.load(raw)
            except http.cookies.CookieError:
                return False
            m = c.get(COOKIE)
            return bool(m and sessions.valid(m.value))

        def _login(self, error: str = ""):
            body = LOGIN_PAGE.replace(
                "__ERROR__", f'<p class="e">{html.escape(error)}</p>' if error else "")
            self._send(200, body, "text/html; charset=utf-8", raw=True)

        # --- auth gate in front of everything factory.py serves -----------
        def do_GET(self):
            u = urlparse(self.path)
            if not self._authed():
                # An API path must answer as an API. A stale tab polling /api/state
                # would otherwise try to JSON.parse a login page and fail obscurely.
                if u.path.startswith("/api/"):
                    return self._send(401, {"error": "session expired", "login": "/"})
                return self._login()
            if u.path in ("/", "/index.html"):
                with open(factory.PAGE, encoding="utf-8") as f:
                    return self._send(200, f.read(), "text/html; charset=utf-8", raw=True)
            return super().do_GET()

        def do_POST(self):
            u = urlparse(self.path)
            if u.path == "/login":
                n = int(self.headers.get("Content-Length") or 0)
                form = parse_qs(self.rfile.read(min(n, 4096)).decode("utf-8", "replace"))
                if sessions.check_password((form.get("password") or [""])[0]):
                    self.send_response(303)
                    self.send_header("Location", "/")
                    self.send_header("Set-Cookie",
                                     f"{COOKIE}={sessions.issue()}; Path=/; HttpOnly; "
                                     f"SameSite=Lax; Secure; Max-Age={SESSION_HOURS*3600}")
                    self.send_header("Content-Length", "0")
                    self.end_headers()
                    return
                time.sleep(1)          # a hosted password deserves a rate floor
                return self._login("Wrong password.")
            if not self._authed():
                return self._send(403, {"error": "not signed in"})
            return super().do_POST()

        # The local build authenticates every call with ?t=<token>; hosted uses the
        # cookie instead, so the query-token check must always pass here.
        def _auth(self, q):
            return True

    return H


def main():
    password = _require("FACTORY_PASSWORD")
    root = os.environ.get("IDEAS_ROOT") or "/data/ideas"
    port = int(os.environ.get("PORT") or 10000)
    os.makedirs(root, exist_ok=True)

    sessions = Sessions(password)

    class Server(socketserver.ThreadingTCPServer):
        allow_reuse_address = True
        daemon_threads = True

    httpd = Server(("0.0.0.0", port), build_handler(root, sessions))
    import vercel_api
    import ideation
    print(f"  PLATFORM FACTORY  0.0.0.0:{port}", flush=True)
    print(f"  ideas root        {root}", flush=True)
    print(f"  deploys           {'Vercel API' if vercel_api.available() else 'NOT CONFIGURED (set VERCEL_TOKEN)'}",
          flush=True)
    print(f"  ideation          {ideation.MODEL if ideation.available() else 'off — ' + ideation.why_unavailable()}",
          flush=True)
    try:
        httpd.serve_forever()
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
