#!/usr/bin/env python3
"""
wizard — the guided, clickable front end to the Turnkey engine.

Why this exists: every engine command is a place to mistype a path, forget a flag, or
run steps out of order. One mistake in `consent --decision` and a gate is mis-recorded.
The engine has to stay strict — it is the guard rail — but the operator should never be
the one composing the commands.

So this is a small local server that serves a wizard UI and presses the engine's keys:

    python3 turnkey.py wizard

It binds 127.0.0.1 only, mints a one-time token that every API call must carry, and
**shells out to turnkey.py for every state change** rather than reimplementing anything.
That is deliberate: the gate enforcement, the consent chain and the blueprint refusals all
live in the engine, so the wizard inherits them exactly. When the engine refuses, the
wizard shows you the refusal instead of pretending it worked.

Stdlib only, like the rest of the engine.
"""

from __future__ import annotations

import json
import os
import re
import secrets
import subprocess
import sys
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.join(HERE, "turnkey.py")
WIZARD_HTML = os.path.join(HERE, "wizard.html")

sys.path.insert(0, HERE)
import blueprints  # noqa: E402

MAX_BODY = 2 * 1024 * 1024


# ===========================================================================
# running the engine — the ONLY way this server changes anything
# ===========================================================================

def run_engine(args: list) -> dict:
    """Run turnkey.py with an argv LIST (never a shell string) and report faithfully."""
    proc = subprocess.run([sys.executable, ENGINE] + args,
                          capture_output=True, text=True)
    return {
        "ok": proc.returncode == 0,
        "code": proc.returncode,
        "stdout": proc.stdout.strip(),
        "stderr": proc.stderr.strip(),
        "command": "turnkey " + " ".join(args[:1] + ["…"] if len(args) > 1 else args),
    }


def engine_state(folder: str):
    r = run_engine(["status", folder, "--json"])
    if not r["ok"]:
        return None
    try:
        return json.loads(r["stdout"])
    except Exception:
        return None


# ===========================================================================
# validation — the wizard may only ask for things the engine understands
# ===========================================================================

import turnkey as tk  # noqa: E402  (same directory)

SAFE_NAME = re.compile(r"^[A-Za-z0-9 ()'&.,+_-]{2,80}$")


def _folder(payload, root):
    f = payload.get("folder") or ""
    f = os.path.abspath(f)
    root = os.path.abspath(root)
    # keep the wizard inside the ideas root: no driving the engine at arbitrary paths
    if not (f == root or f.startswith(root + os.sep)):
        raise ValueError("that folder is outside the ideas directory")
    if not os.path.isdir(f):
        raise ValueError("no such folder")
    return f


def _one_of(value, allowed, label):
    if value not in allowed:
        raise ValueError(f"{label} must be one of: {', '.join(allowed)}")
    return value


def _text(value, label, maxlen=2000, required=True):
    v = (value or "").strip()
    if required and not v:
        raise ValueError(f"{label} is required")
    return v[:maxlen]


# ===========================================================================
# the actions the wizard can take
# ===========================================================================

def act_folders(payload, root):
    """Every idea folder, and whether it already has a launch."""
    out = []
    for name in sorted(os.listdir(root)):
        d = os.path.join(root, name)
        if not os.path.isdir(d) or name.startswith(".") or name.startswith("_"):
            continue
        idea = os.path.exists(os.path.join(d, "business-idea.md"))
        state_p = os.path.join(d, "turnkey", "launch-state.json")
        row = {"name": name, "folder": d, "has_idea": idea, "has_launch": os.path.exists(state_p)}
        if row["has_launch"]:
            try:
                with open(state_p, encoding="utf-8") as f:
                    st = json.load(f)
                row["stage"] = st.get("stage")
                row["business"] = st.get("business")
                ws = st.get("workstreams", {})
                row["done"] = sum(1 for w in ws.values() if w.get("status") == "done")
                row["total"] = len(ws)
                row["gates"] = sum(1 for w in ws.values() if w.get("status") == "gate_pending")
                row["blueprint"] = bool(st.get("blueprint"))
            except Exception:
                pass
        if idea or row["has_launch"]:
            out.append(row)
    return {"ok": True, "folders": out, "root": root}


def act_new_idea(payload, root):
    name = _text(payload.get("name"), "idea name", 80)
    if not SAFE_NAME.match(name):
        raise ValueError("use letters, numbers, spaces and simple punctuation for the name")
    d = os.path.join(root, name)
    if os.path.exists(d):
        raise ValueError("a folder with that name already exists")
    os.makedirs(d)
    body = _text(payload.get("idea"), "the idea", 20000)
    with open(os.path.join(d, "business-idea.md"), "w", encoding="utf-8") as f:
        f.write(f"# Business idea — {name}\n\n{body}\n")
    return {"ok": True, "folder": d, "created": True}


def act_status(payload, root):
    folder = _folder(payload, root)
    state = engine_state(folder)
    if state is None:
        return {"ok": True, "state": None}
    # what the wizard should offer next, derived from the engine's own registry
    ws = state.get("workstreams", {})
    nxt = []
    for name, meta in tk.REGISTRY.items():
        if meta["stage"] != state.get("stage"):
            continue
        w = ws.get(name, {})
        if w.get("status") == "done":
            continue
        deps_ok = all(ws.get(d, {}).get("status") in ("done", "gate_pending", "not_applicable")
                      for d in meta["depends_on"])
        nxt.append({
            "workstream": name,
            "title": meta["title"],
            "agent": meta["agent"],
            "status": w.get("status"),
            "actor_waiting": w.get("actor_waiting"),
            "requires_consent": meta["requires_consent"],
            "ready": deps_ok,
            "blocked_by": [d for d in meta["depends_on"]
                           if ws.get(d, {}).get("status") not in ("done", "gate_pending", "not_applicable")],
            "has_yes": tk.has_yes(folder, name),
        })
    if state is not None:
        state["platform_built"] = os.path.exists(os.path.join(folder, "platform", "index.html"))
    return {"ok": True, "state": state, "next": nxt,
            "profile_exists": os.path.exists(tk.profile_path(folder)),
            "registry": {k: {"title": v["title"], "stage": v["stage"],
                             "requires_consent": v["requires_consent"]}
                         for k, v in tk.REGISTRY.items()}}


def act_init(payload, root):
    folder = _folder(payload, root)
    return run_engine(["init", folder])


def act_profile(payload, root):
    """Write business-profile.md — intake cannot close without it."""
    folder = _folder(payload, root)
    text = _text(payload.get("text"), "the profile", 60000)
    p = tk.profile_path(folder)
    if os.path.exists(p) and not payload.get("overwrite"):
        raise ValueError("a business profile already exists — tick overwrite to replace it")
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(text if text.startswith("#") else "# Business Profile\n\n" + text)
    return {"ok": True, "wrote": os.path.relpath(p, folder)}


def act_blueprint(payload, root):
    folder = _folder(payload, root)
    args = ["blueprint", folder]
    if payload.get("org_type"):
        args += ["--org-type", _one_of(payload["org_type"], list(blueprints.ORG_TYPES), "org type")]
    if payload.get("add"):
        args += ["--add", ",".join(_one_of(k, list(blueprints.FUNCTIONS), "function")
                                   for k in payload["add"])]
    if payload.get("remove"):
        args += ["--remove", ",".join(_one_of(k, list(blueprints.FUNCTIONS), "function")
                                      for k in payload["remove"])]
    if payload.get("save"):
        args += ["--save"]
    else:
        args += ["--json"]
    r = run_engine(args)
    if r["ok"] and not payload.get("save"):
        try:
            r["blueprint"] = json.loads(r["stdout"])
        except Exception:
            pass
    return r


def act_platform(payload, root):
    folder = _folder(payload, root)
    value = _one_of(payload.get("value"), list(blueprints.PLATFORMS), "platform")
    reason = _text(payload.get("reason"), "a reason for the override", 500)
    return run_engine(["platform", folder, "--value", value, "--reason", reason])


def act_functions(payload, root):
    folder = _folder(payload, root)
    args = ["functions", folder]
    if payload.get("add"):
        args += ["--add", ",".join(_one_of(k, list(blueprints.FUNCTIONS), "function") for k in payload["add"])]
    if payload.get("remove"):
        args += ["--remove", ",".join(_one_of(k, list(blueprints.FUNCTIONS), "function") for k in payload["remove"])]
    return run_engine(args)


def act_gate(payload, root):
    """Open a human gate, writing its do-this-now script first."""
    folder = _folder(payload, root)
    ws = _one_of(payload.get("workstream"), list(tk.REGISTRY), "workstream")
    actor = _one_of(payload.get("actor"), ["VOM", "CLIENT"], "actor")
    action = _text(payload.get("action"), "what the human must do", 500)
    channel = _text(payload.get("channel") or "in-session", "channel", 40)
    script = (payload.get("script") or "").strip()

    args = ["gate", folder, "--workstream", ws, "--actor", actor,
            "--action", action, "--channel", channel]
    if script:
        gates = os.path.join(folder, "turnkey", "gates")
        os.makedirs(gates, exist_ok=True)
        n = 1
        while os.path.exists(os.path.join(gates, f"{ws}-{n}.md")):
            n += 1
        path = os.path.join(gates, f"{ws}-{n}.md")
        with open(path, "w", encoding="utf-8") as f:
            f.write(f"# Gate — {ws}\n\n**Who:** {actor}  ·  **Channel:** {channel}\n\n"
                    f"**Do this now:** {action}\n\n{script}\n")
        args += ["--script-file", path]
    return run_engine(args)


def act_consent(payload, root):
    folder = _folder(payload, root)
    ws = _one_of(payload.get("workstream"), list(tk.REGISTRY), "workstream")
    decision = _one_of(payload.get("decision"), ["YES", "NO"], "decision")
    actor = _one_of(payload.get("actor"), ["VOM", "CLIENT"], "actor")
    return run_engine([
        "consent", folder, "--workstream", ws,
        "--action", _text(payload.get("action"), "the exact action being approved", 500),
        "--actor", actor,
        "--channel", _text(payload.get("channel") or "in-session", "channel", 40),
        "--decision", decision,
        "--evidence", _text(payload.get("evidence"), "evidence", 500, required=False),
        "--scope", _text(payload.get("scope"), "scope", 300, required=False),
    ])


def act_set(payload, root):
    folder = _folder(payload, root)
    ws = _one_of(payload.get("workstream"), list(tk.REGISTRY), "workstream")
    status = _one_of(payload.get("status"), tk.STATUSES, "status")
    args = ["set", folder, "--workstream", ws, "--status", status]
    if payload.get("actor_waiting"):
        args += ["--actor-waiting", _one_of(payload["actor_waiting"], ["VOM", "CLIENT"], "actor")]
    if payload.get("blocked_by"):
        args += ["--blocked-by", ",".join(_one_of(b, list(tk.REGISTRY), "workstream")
                                          for b in payload["blocked_by"])]
    if payload.get("note"):
        args += ["--note", _text(payload["note"], "note", 500, required=False)]
    return run_engine(args)


def act_advance(payload, root):
    folder = _folder(payload, root)
    args = ["advance", folder]
    if payload.get("force"):
        args += ["--force"]
    return run_engine(args)


def act_check(payload, root):
    return run_engine(["check", _folder(payload, root)])


def act_verify(payload, root):
    return run_engine(["verify", _folder(payload, root)])


def act_log(payload, root):
    folder = _folder(payload, root)
    return {"ok": True, "lines": tk.read_consent_lines(folder)}


def act_matrix(payload, root):
    folder = _folder(payload, root)
    if payload.get("key"):
        return run_engine(["matrix", folder, "--key", payload["key"],
                           "--value", _one_of(payload.get("value"), ["done", "pending"], "value")])
    return run_engine(["matrix", folder])


def act_catalog(payload, root):
    return {"ok": True, "org_types": blueprints.ORG_TYPES, "functions": blueprints.FUNCTIONS,
            "universal_core": blueprints.UNIVERSAL_CORE,
            "universal_recommended": blueprints.UNIVERSAL_RECOMMENDED,
            "platforms": blueprints.PLATFORMS}


def act_platform(payload, root):
    """BUILD the platform — the wizard's one button that produces something you can use."""
    folder = _folder(payload, root)
    r = run_engine(["build-platform", folder])
    if r["ok"]:
        r["index"] = os.path.join(folder, "platform", "index.html")
        r["exists"] = os.path.exists(r["index"])
    return r


def act_open_platform(payload, root):
    """Open the generated platform in the operator's browser."""
    import webbrowser
    folder = _folder(payload, root)
    index = os.path.join(folder, "platform", "index.html")
    if not os.path.exists(index):
        return {"ok": False, "code": 2, "stderr": "no platform built yet"}
    webbrowser.open("file://" + index)
    return {"ok": True, "stdout": "opened " + index}


def act_publish_platform(payload, root):
    """Publish the platform to the hub so the owner can sign in from any device."""
    folder = _folder(payload, root)
    email = _text(payload.get("owner_email"), "the owner's email", 200)
    args = ["publish-platform", folder, "--owner-email", email]
    if payload.get("hub_url"):
        args += ["--hub-url", _text(payload["hub_url"], "hub url", 200)]
    return run_engine(args)


def act_sync(payload, root):
    """Push this launch to the hosted Launch OS registry, so no file dragging.

    Uses TURNKEY_OS_KEY (the licence key) + TURNKEY_OS_URL. Without a key it says so
    rather than failing silently."""
    import urllib.request
    import urllib.error

    folder = _folder(payload, root)
    key = os.environ.get("TURNKEY_OS_KEY")
    base = os.environ.get("TURNKEY_OS_URL", "https://vom-turnkey.vercel.app").rstrip("/")
    if not key:
        return {"ok": False, "code": 2,
                "stderr": "No TURNKEY_OS_KEY set — export your licence key to sync with the hosted OS."}
    state = engine_state(folder)
    if state is None:
        return {"ok": False, "code": 2, "stderr": "No launch state to sync yet."}

    def post(path, body, cookie=None):
        req = urllib.request.Request(base + path, method="POST",
                                     data=json.dumps(body).encode("utf-8"),
                                     headers={"Content-Type": "application/json"})
        if cookie:
            req.add_header("Cookie", cookie)
        return urllib.request.urlopen(req, timeout=20)

    try:
        r = post("/api/unlock", {"key": key})
        cookie = (r.headers.get("Set-Cookie") or "").split(";")[0]
        if not cookie:
            return {"ok": False, "code": 3, "stderr": "The hosted OS did not accept that licence key."}
        payload_launch = {"launch": {"state": state, "consent": tk.read_consent_lines(folder)}}
        post("/api/launches", payload_launch, cookie)
        return {"ok": True, "stdout": f"Synced to {base}/os"}
    except urllib.error.HTTPError as e:
        return {"ok": False, "code": 3, "stderr": f"Sync failed: HTTP {e.code}"}
    except Exception as e:
        return {"ok": False, "code": 3, "stderr": f"Sync failed: {e}"}


ACTIONS = {
    "folders": act_folders, "status": act_status, "new_idea": act_new_idea,
    "init": act_init, "profile": act_profile, "blueprint": act_blueprint,
    "platform": act_platform, "functions": act_functions, "gate": act_gate,
    "consent": act_consent, "set": act_set, "advance": act_advance,
    "check": act_check, "verify": act_verify, "log": act_log, "matrix": act_matrix,
    "catalog": act_catalog, "sync": act_sync,
    "platform": act_platform, "open_platform": act_open_platform,
    "publish_platform": act_publish_platform,
}


# ===========================================================================
# the local server
# ===========================================================================

def make_handler(root: str, token: str, logo_data: str):

    class Handler(BaseHTTPRequestHandler):
        server_version = "turnkey-wizard"

        def log_message(self, fmt, *args):  # quieter console
            pass

        # --- helpers ---
        def _json(self, obj, code=200):
            body = json.dumps(obj).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def _authorized(self):
            # The token must arrive in a custom header. A hostile page in the browser
            # cannot set one cross-origin without a preflight we never approve, so this
            # keeps other local software (and any website) from driving the engine.
            if self.headers.get("X-Turnkey-Token") != token:
                return False
            origin = self.headers.get("Origin")
            if origin and not origin.startswith("http://127.0.0.1"):
                return False
            return True

        # --- routes ---
        def do_GET(self):
            path = urlparse(self.path).path
            if path in ("/", "/index.html"):
                with open(WIZARD_HTML, encoding="utf-8") as f:
                    html = f.read()
                html = (html.replace("{{TOKEN}}", token)
                            .replace("{{ROOT}}", root.replace("\\", "\\\\"))
                            .replace("{{LOGO}}", logo_data))
                body = html.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(body)
                return
            self._json({"error": "not found"}, 404)

        def do_POST(self):
            path = urlparse(self.path).path
            if not path.startswith("/api/"):
                return self._json({"error": "not found"}, 404)
            if not self._authorized():
                return self._json({"error": "unauthorized"}, 401)

            action = path[len("/api/"):]
            fn = ACTIONS.get(action)
            if not fn:
                return self._json({"error": f"unknown action '{action}'"}, 404)

            try:
                length = int(self.headers.get("Content-Length") or 0)
                if length > MAX_BODY:
                    return self._json({"error": "payload too large"}, 413)
                raw = self.rfile.read(length) if length else b"{}"
                payload = json.loads(raw or b"{}")
            except Exception:
                return self._json({"error": "invalid JSON body"}, 400)

            try:
                result = fn(payload, root)
            except ValueError as e:
                return self._json({"ok": False, "code": 2, "stderr": str(e)}, 200)
            except Exception as e:  # never leak a traceback into the browser
                return self._json({"ok": False, "code": 1,
                                   "stderr": f"{type(e).__name__}: {e}"}, 200)
            return self._json(result)

    return Handler


def serve(root: str, port: int = 0, open_browser: bool = True):
    root = os.path.abspath(root)
    if not os.path.isdir(root):
        sys.stderr.write(f"turnkey: no such ideas folder: {root}\n")
        sys.exit(2)
    if not os.path.exists(WIZARD_HTML):
        sys.stderr.write(f"turnkey: wizard.html missing next to the engine ({WIZARD_HTML})\n")
        sys.exit(2)

    logo_data = ""
    logo_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(HERE))), "vom-logo.jpg")
    if os.path.exists(logo_path):
        import base64
        with open(logo_path, "rb") as f:
            logo_data = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode("ascii")

    token = secrets.token_urlsafe(24)
    httpd = ThreadingHTTPServer(("127.0.0.1", port), make_handler(root, token, logo_data))
    actual = httpd.server_address[1]
    url = f"http://127.0.0.1:{actual}/"

    print("\n  Turnkey — guided launch wizard")
    print(f"  ideas folder : {root}")
    print(f"  open         : {url}")
    print("  (local only — 127.0.0.1, one-time token, stop with Ctrl-C)\n")

    if open_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  wizard stopped.\n")
        httpd.server_close()
