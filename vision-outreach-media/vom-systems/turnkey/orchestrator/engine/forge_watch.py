#!/usr/bin/env python3
"""
forge_watch — the visual stage cues, live in a browser.

A build that nobody is in the loop for still has to be watchable. This serves the forge
console on localhost while the run happens: the stage rail lights up as each stage takes
its turn, the log streams, the clock runs, and when it finishes the artifacts appear with
their URLs.

The server exists only for the length of the run. It binds 127.0.0.1, mints a one-time
token that every API call must carry, and shuts down once the console has seen the final
state — a build tool should not leave a listening socket behind.

The same page also replays a finished run with no server at all (`forge-console`), which
is how a run is reviewed after the fact. Same rendering both times.

Stdlib only.
"""

from __future__ import annotations

import http.server
import json
import os
import secrets
import socketserver
import threading
import time
import webbrowser
from urllib.parse import urlparse, parse_qs

import forge

HERE = os.path.dirname(os.path.abspath(__file__))
CONSOLE = os.path.join(HERE, "forge_console.html")


def _console_html() -> str:
    with open(CONSOLE, encoding="utf-8") as f:
        return f.read()


class _State:
    """What the console reads. Written by the build thread, read by the server thread."""

    def __init__(self):
        self.run = None            # the live Run object
        self.lock = threading.Lock()
        self.done = threading.Event()
        self.seen_final = threading.Event()


def serve(idea_folder: str, sp: dict, *, port: int = 0, open_browser: bool = True,
          dry_run: bool = False, terminal_cue=None) -> forge.Run:
    """Run the build with the console watching it, and return the finished run."""
    state = _State()
    token = secrets.token_urlsafe(16)

    class Handler(http.server.BaseHTTPRequestHandler):
        def log_message(self, *a):  # the console is the log; keep stdout for the build
            pass

        def _send(self, code, body, ctype):
            data = body.encode("utf-8") if isinstance(body, str) else body
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            try:
                self.wfile.write(data)
            except (BrokenPipeError, ConnectionResetError):
                pass

        def do_GET(self):
            u = urlparse(self.path)
            q = parse_qs(u.query)

            if u.path in ("/", "/index.html"):
                return self._send(200, _console_html(), "text/html; charset=utf-8")

            if u.path == "/api/run":
                if (q.get("t") or [""])[0] != token:
                    return self._send(403, json.dumps({"error": "bad token"}), "application/json")
                after = int((q.get("after") or ["0"])[0])
                with state.lock:
                    run = state.run
                    snap = run.snapshot() if run else None
                    evs = forge.read_events(run.events_path, after) if run else []
                if snap and snap["outcome"] != "running":
                    state.seen_final.set()
                return self._send(200, json.dumps({"run": snap, "events": evs},
                                                  ensure_ascii=False), "application/json")

            return self._send(404, "not found", "text/plain")

    httpd = socketserver.TCPServer(("127.0.0.1", port), Handler)
    httpd.allow_reuse_address = True
    actual = httpd.server_address[1]
    url = f"http://127.0.0.1:{actual}/?t={token}"

    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()

    forge_name = (sp["archetype"].get("forge") or {}).get("name", "FORGE")
    print(f"{forge_name} console: {url}")
    if open_browser:
        try:
            webbrowser.open(url)
        except Exception:
            pass
    # A moment for the page to load, so the first stage is watched rather than missed.
    time.sleep(0.6)

    result = {}

    def build():
        def cue(ev, run):
            with state.lock:
                state.run = run
            if terminal_cue:
                terminal_cue(ev, run)
        try:
            result["run"] = forge.execute(idea_folder, sp, cue=cue, dry_run=dry_run)
        finally:
            state.done.set()

    t = threading.Thread(target=build, daemon=True)
    t.start()
    t.join()

    # Give the console one last poll to paint the final state before the socket closes.
    state.seen_final.wait(timeout=4)
    time.sleep(0.4)
    httpd.shutdown()
    httpd.server_close()
    return result.get("run")


def replay(idea_folder: str, run_dir: str = None, *, open_browser: bool = True) -> str:
    """Write a standalone, serverless copy of the console for a finished run.

    The review copy is a single file with the run baked into it — it opens from disk,
    survives being emailed, and needs nothing running."""
    if run_dir:
        state_path = os.path.join(run_dir, "run.json")
        events_path = os.path.join(run_dir, "events.jsonl")
    else:
        ptr_path = os.path.join(idea_folder, "forge", "latest.json")
        if not os.path.exists(ptr_path):
            raise FileNotFoundError("no forge run in this business folder yet")
        with open(ptr_path, encoding="utf-8") as f:
            ptr = json.load(f)
        state_path, events_path = ptr["state"], ptr["events"]
        run_dir = ptr["dir"]

    with open(state_path, encoding="utf-8") as f:
        run = json.load(f)
    events = forge.read_events(events_path, 0)

    html = _console_html().replace(
        "<script>\n\"use strict\";",
        "<script>\nwindow.__RUN__ = " + json.dumps(run, ensure_ascii=False) + ";\n"
        "window.__EVENTS__ = " + json.dumps(events, ensure_ascii=False) + ";\n</script>\n"
        "<script>\n\"use strict\";", 1)

    out = os.path.join(run_dir, "console.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)
    if open_browser:
        try:
            webbrowser.open("file://" + out)
        except Exception:
            pass
    return out
