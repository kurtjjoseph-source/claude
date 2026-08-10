#!/usr/bin/env python3
"""
turnkey — the deterministic engine behind the /onboard-business orchestrator.

Vision Outreach Media (VOM) · Turnkey Launch OS.

The orchestrator SKILL.md is prose the model follows; this engine is the part that
must NOT be left to good intentions: persistent launch state, an append-only
hash-chained consent log, and mechanical gate enforcement so that nothing that
publishes, sends, or moves money can be marked done without a logged YES that
existed *before* the action.

Design constraints (match the ratified Turnkey design):
  - Python 3 stdlib only. No pip, no network. Runs anywhere the operator's macOS runs.
  - All state lives INSIDE the business folder (<idea-folder>/turnkey/) so any agent
    in any session resumes cleanly. See SKILL.md §3.
  - The consent log is append-only and tamper-evident (each line carries prev_hash +
    hash forming a chain). `verify` recomputes the chain. See SKILL.md §4.
  - Gate enforcement is not advisory: `set --status done` on a workstream that
    publishes/sends/moves money is REFUSED unless a matching YES consent line exists.

Exit codes: 0 ok · 2 usage error · 3 guard/enforcement refusal · 4 integrity failure.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone

# The org-type → business-function model (which functions to build, and whether the
# site runs on WordPress). Deterministic, stdlib-only, sits next to this file.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import blueprints  # noqa: E402

SCHEMA = 1

# --- exit codes ------------------------------------------------------------
EX_OK = 0
EX_USAGE = 2
EX_GUARD = 3
EX_INTEGRITY = 4

# --- stage ordering (SKILL.md §6) -----------------------------------------
STAGES = ["intake", "foundation", "build", "market", "operate", "launched"]

# --- status vocabulary (SKILL.md §3) --------------------------------------
# not_applicable = the operating profile has configured this workstream OUT of the run
#                  (e.g. payments.stripe=false); non-blocking, dropped from advance criteria.
STATUSES = ["not_started", "in_progress", "gate_pending", "blocked", "done", "not_applicable"]

ACTORS = ["AUTO", "VOM", "CLIENT"]

# --- the workstream registry ----------------------------------------------
# requires_consent = True  ->  cannot be marked `done` without a matching YES
#                              in the consent log (publish / send / money actions).
# depends_on = intra-run workstreams that must be `done` (or gate-cleared) first.
REGISTRY = {
    "intake": {
        "stage": "intake",
        "title": "Intake — capture, KYB, disclosure + terms",
        "agent": "biz-intake",
        "requires_consent": True,   # the terms YES gates the whole pipeline
        "depends_on": [],
    },
    "W1_profile": {
        "stage": "foundation",
        "title": "W1 — Business profile finalization",
        "agent": "biz-foundation",
        "requires_consent": False,
        "depends_on": ["intake"],
    },
    "W2_legal": {
        "stage": "foundation",
        "title": "W2 — NL legal & financial (VAT, trade name, bookkeeping)",
        "agent": "biz-foundation",
        "requires_consent": False,  # filings are VOM/CLIENT gates, not money-movement by an agent
        "depends_on": ["W1_profile"],
    },
    "W3_domain": {
        "stage": "foundation",
        "title": "W3 — Domain & email (subdomain, custom domain, Brevo sender)",
        "agent": "biz-foundation",
        "requires_consent": False,
        "depends_on": ["W1_profile"],
    },
    "W4_website": {
        "stage": "build",
        "title": "W4 — Website & deployment (go-live is a publish gate)",
        "agent": "biz-build",
        "requires_consent": True,   # promoting to a live public URL = publish
        "depends_on": ["W3_domain"],
    },
    "W5_payments": {
        "stage": "build",
        "title": "W5 — Payments (Stripe Connect; test purchase+refund is a money gate)",
        "agent": "biz-build",
        "requires_consent": True,   # money movement
        "depends_on": ["W2_legal"],
    },
    "W6_products": {
        "stage": "build",
        "title": "W6 — Digital products & webhook fulfillment (buyer-email is a send gate)",
        "agent": "biz-build",
        "requires_consent": True,   # enabling live buyer-emailing fulfillment = send
        "depends_on": ["W4_website"],
    },
    "W7_presence": {
        "stage": "market",
        "title": "W7 — Presence & Engage AI benchmark loop",
        "agent": "biz-market",
        "requires_consent": False,  # Google Business verify is a VOM gate, not publish/send
        "depends_on": ["W4_website"],
    },
    "W8_social": {
        "stage": "market",
        "title": "W8 — Social delivery swarm (weekly digest approval before any post)",
        "agent": "biz-market",
        "requires_consent": True,   # scheduling real posts = publish
        "depends_on": ["W7_presence"],
    },
    "W9_leads": {
        "stage": "market",
        "title": "W9 — Leads & distribution (batch-approved sending only)",
        "agent": "biz-market",
        "requires_consent": True,   # outreach send
        "depends_on": ["W7_presence"],
    },
    "W10_crm": {
        "stage": "operate",
        "title": "W10 — CRM & per-client running inventory",
        "agent": "biz-operate",
        "requires_consent": False,
        "depends_on": ["W9_leads"],
    },
    "W11_followups": {
        "stage": "operate",
        "title": "W11 — Follow-ups (every send human-approved)",
        "agent": "biz-operate",
        "requires_consent": True,   # each follow-up send
        "depends_on": ["W10_crm"],
    },
}

# --- the master gate matrix (README platform-bootstrap prerequisites) ------
# One-time-ever human gates. Business #2+ inherits those cleared for business #1.
GATE_MATRIX_DEFAULTS = {
    "stripe_connect": "pending",       # #1 enable Connect Express on the platform account
    "cloudflare_delegation": "pending",# #2 delegate clients.visionoutreachmedia.nl (NS at one.com)
    "credential_baseline": "pending",  # #3 pw manager + MFA + scoped keys + rotate VERCEL_OIDC_TOKEN
    "dutch_lawyer_terms": "pending",   # #4 terms/disclosure legal review + fee values
    "registrar_nl": "pending",         # #5 wholesale registrar for client .nl domains — DECIDED
                                       #    (Openprovider Basic S, client-as-registrant, at cost);
                                       #    clears when the account + API key are provisioned.
                                       #    Runbook: vom-systems/domains/registrar-decision.md §4
    "provisioned_accounts": "pending", # #6 Vercel / Brevo / bookkeeping connected once
}

# --- the OPERATOR profile (white-label / franchising) ----------------------
# Turnkey is a generic launcher; the ONLY brand-specific config is the operator
# profile (operator.json), one per Turnkey instance (per franchisee). The engine
# stays brand-agnostic and reads the operator's identity from here. Resolution
# order: --operator flag > $TURNKEY_OPERATOR > <orchestrator>/operator.json.
DEFAULT_OPERATOR_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "operator.json")

# Where the operator's idea folders live: <…>/Business Ideas/, i.e. three levels above
# this engine (engine/ -> orchestrator/ -> turnkey/ -> vom-systems/ -> Business Ideas/).
DEFAULT_IDEAS_ROOT = os.environ.get("TURNKEY_IDEAS_ROOT") or os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

# Fallback when no operator.json is found (keeps the tool usable + selftest hermetic).
GENERIC_OPERATOR = {
    "schema": 1,
    "operator": {
        "id": "operator", "name": "the operator", "short": "OP",
        "author_as": "the operator",
        "voice": "clear, plain-spoken, professional; never hype",
        "model": "operator-run",
    },
    "platform": {}, "brand": {}, "gate_matrix_status": {},
}


def load_operator(path=None) -> dict:
    p = path or os.environ.get("TURNKEY_OPERATOR") or DEFAULT_OPERATOR_PATH
    if p and os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            op = json.load(f)
        op["_source"] = os.path.abspath(p)
        return op
    op = dict(GENERIC_OPERATOR)
    op["_source"] = None
    return op


def operator_identity(op: dict) -> dict:
    """The compact identity stamped into each business's launch-state."""
    o = op.get("operator", {})
    return {
        "id": o.get("id", "operator"),
        "name": o.get("name", "the operator"),
        "short": o.get("short", "OP"),
        "author_as": o.get("author_as", o.get("name", "the operator")),
        "voice": o.get("voice", ""),
        "model": o.get("model", "operator-run"),
        "profile_source": op.get("_source"),
    }


# ===========================================================================
# helpers
# ===========================================================================

def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def tk_dir(idea_folder: str) -> str:
    return os.path.join(idea_folder, "turnkey")


def state_path(idea_folder: str) -> str:
    return os.path.join(tk_dir(idea_folder), "launch-state.json")


def consent_path(idea_folder: str) -> str:
    return os.path.join(tk_dir(idea_folder), "consent-log.jsonl")


def decision_path(idea_folder: str) -> str:
    return os.path.join(tk_dir(idea_folder), "decision-log.jsonl")


def consent_genesis(idea_folder: str) -> str:
    """The anchor the first consent line chains onto.

    It was originally computed from the folder name, which made a rename look identical
    to tampering: a verifier recomputing the anchor from the new basename reported a
    broken chain on a log nobody had touched. So the anchor is pinned into launch-state
    the moment a business is renamed, and read from there afterwards. Businesses that
    have never been renamed have nothing pinned and fall back to the original rule, so
    every chain written before this existed still verifies unchanged."""
    try:
        with open(state_path(idea_folder), encoding="utf-8") as f:
            pinned = json.load(f).get("consent_genesis")
        if pinned:
            return pinned
    except (OSError, ValueError):
        pass
    return "GENESIS:" + os.path.basename(idea_folder.rstrip("/"))


def profile_path(idea_folder: str) -> str:
    return os.path.join(tk_dir(idea_folder), "business-profile.md")


def blueprint_path(idea_folder: str) -> str:
    return os.path.join(tk_dir(idea_folder), "blueprint.md")


def spec_path(idea_folder: str) -> str:
    """The automatable platform blueprint — the machine half of `blueprint.md`.
    This is the artifact Forge executes; nothing else is consulted during a build."""
    return os.path.join(tk_dir(idea_folder), "platform-spec.json")


def spec_doc_path(idea_folder: str) -> str:
    return os.path.join(tk_dir(idea_folder), "platform-spec.md")


def operating_profile_path(idea_folder: str) -> str:
    """The wizard-emitted Business Operating Profile. Lives in the idea folder itself
    (not turnkey/), since a wizard external to the engine produces it before `init`
    necessarily runs."""
    return os.path.join(idea_folder, "business-operating-profile.json")


# Workstreams that BUILD business functions: they cannot be marked done until the
# blueprint says which functions exist and what the site runs on. Building before
# that decision is how you ship a generic site that fits nobody.
BLUEPRINT_REQUIRED_WS = {"W4_website", "W5_payments", "W6_products", "W10_crm"}

# --- Business Operating Profile (BOP) — schema + stack mapping -------------
# The wizard emits business-operating-profile.json; the engine reads it and a launch
# run is DRIVEN by it (stack/pages/features/channels are decided there, not re-decided
# by later stages). See SKILL.md / task brief for the full schema.
PROFILE_REQUIRED_KEYS = ("business", "tagline", "org_type", "stack", "domain", "pages",
                         "payments", "features", "publications", "operations_model",
                         "client_hub")
PROFILE_STACKS = ("wordpress", "app", "ecom", "static")
PROFILE_FEATURES = ("crm", "forms", "tracking", "booking", "ticketing", "members",
                    "inbox", "invoicing")
PROFILE_PUBLICATION_FLAGS = ("engage_ai", "content_studio", "social_swarm", "lead_outreach")
PROFILE_OPS_MODELS = ("vom", "hub", "hybrid")
PROFILE_CLIENT_HUB_ITEMS = ("crm", "content", "bookings", "inbox", "payments", "reports")

# The multi-tenant Client Hub (turnkey/client-hub/) — the operations_model: "hub"/"hybrid"
# deliverable. Provisioning a tenant into it is a POST /api/provision call gated behind
# PROVISION_TOKEN, which only the operator ever holds. See `cmd_provision_hub` below and
# turnkey/client-hub/README.md.
DEFAULT_CLIENT_HUB_URL = "https://vom-client-hub.vercel.app"

# Business Operating Profile `stack` -> blueprints.py `platform` decision. blueprints.py
# only knows {wordpress, vercel_app, hybrid}; the profile's vocabulary is coarser, so we
# resolve it onto the nearest platform the blueprint machinery understands.
STACK_TO_PLATFORM = {
    "wordpress": "wordpress",
    "app": "vercel_app",
    "ecom": "wordpress",   # WooCommerce is Turnkey's e-commerce default (see blueprints.ecommerce)
    "static": "vercel_app",
}


def die(msg: str, code: int = EX_USAGE):
    sys.stderr.write("turnkey: " + msg + "\n")
    sys.exit(code)


def load_state(idea_folder: str) -> dict:
    p = state_path(idea_folder)
    if not os.path.exists(p):
        die(f"no launch-state.json at {p} — run `turnkey init` first", EX_USAGE)
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def atomic_write_json(path: str, data: dict):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)


def save_state(idea_folder: str, state: dict):
    state["updated"] = now_iso()
    atomic_write_json(state_path(idea_folder), state)


def canonical(obj: dict) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def read_consent_lines(idea_folder: str) -> list:
    p = consent_path(idea_folder)
    if not os.path.exists(p):
        return []
    out = []
    with open(p, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                out.append(json.loads(line))
    return out


def append_jsonl(path: str, record: dict):
    # append-only: open in append mode, never rewrite an existing line.
    with open(path, "a", encoding="utf-8") as f:
        f.write(canonical(record) + "\n")
        f.flush()
        os.fsync(f.fileno())


def has_yes(idea_folder: str, workstream: str) -> bool:
    """True iff the most recent consent decision for this workstream is YES."""
    latest = None
    for rec in read_consent_lines(idea_folder):
        if rec.get("workstream") == workstream:
            latest = rec
    return latest is not None and latest.get("decision") == "YES"


# ===========================================================================
# Business Operating Profile — load + validate (does not touch state)
# ===========================================================================

def validate_operating_profile(data) -> list:
    """Return a list of clear, human-readable error strings. Empty list = valid."""
    errs = []
    if not isinstance(data, dict):
        return ["file does not contain a JSON object"]

    for k in PROFILE_REQUIRED_KEYS:
        if k not in data:
            errs.append(f"missing required key: '{k}'")

    if "business" in data and not isinstance(data["business"], str):
        errs.append("'business' must be a string")
    if "tagline" in data and not isinstance(data["tagline"], str):
        errs.append("'tagline' must be a string")
    if "org_type" in data and (not isinstance(data["org_type"], str) or not data["org_type"].strip()):
        errs.append("'org_type' must be a non-empty string")

    if "stack" in data and data["stack"] not in PROFILE_STACKS:
        errs.append(f"invalid 'stack' value '{data.get('stack')}' — must be one of: "
                    + " | ".join(PROFILE_STACKS))

    if "domain" in data:
        dom = data["domain"]
        if not isinstance(dom, dict):
            errs.append("'domain' must be an object with 'mode' and 'value'")
        else:
            if "mode" not in dom:
                errs.append("missing required key: 'domain.mode'")
            if "value" not in dom:
                errs.append("missing required key: 'domain.value'")

    if "pages" in data and not isinstance(data["pages"], list):
        errs.append("'pages' must be a list")

    if "payments" in data:
        pay = data["payments"]
        if not isinstance(pay, dict):
            errs.append("'payments' must be an object")
        else:
            for bkey in ("stripe", "subscriptions", "ideal", "donations"):
                if bkey in pay and not isinstance(pay[bkey], bool):
                    errs.append(f"'payments.{bkey}' must be true/false")
            if "currency" in pay and not isinstance(pay["currency"], str):
                errs.append("'payments.currency' must be a string")

    if "features" in data:
        feats = data["features"]
        if not isinstance(feats, list):
            errs.append("'features' must be a list")
        else:
            bad = sorted(set(f for f in feats if f not in PROFILE_FEATURES))
            if bad:
                errs.append(f"invalid 'features' value(s) {bad} — allowed: "
                            + " | ".join(PROFILE_FEATURES))

    if "publications" in data:
        pub = data["publications"]
        if not isinstance(pub, dict):
            errs.append("'publications' must be an object")
        else:
            for fkey in PROFILE_PUBLICATION_FLAGS:
                if fkey in pub and not isinstance(pub[fkey], bool):
                    errs.append(f"'publications.{fkey}' must be true/false")
            if "channels" in pub and not isinstance(pub["channels"], list):
                errs.append("'publications.channels' must be a list")

    if "operations_model" in data and data["operations_model"] not in PROFILE_OPS_MODELS:
        errs.append(f"invalid 'operations_model' value '{data.get('operations_model')}' — "
                    "must be one of: " + " | ".join(PROFILE_OPS_MODELS))

    if "client_hub" in data:
        hub = data["client_hub"]
        if not isinstance(hub, list):
            errs.append("'client_hub' must be a list")
        else:
            bad = sorted(set(h for h in hub if h not in PROFILE_CLIENT_HUB_ITEMS))
            if bad:
                errs.append(f"invalid 'client_hub' value(s) {bad} — allowed: "
                            + " | ".join(PROFILE_CLIENT_HUB_ITEMS))

    return errs


def load_operating_profile(idea_folder: str):
    """Load + validate business-operating-profile.json if present.

    Returns (data, errors):
      (None, [])       -> no profile file at all (not an error; the run simply isn't profile-driven)
      (None, [errs])   -> file exists but is not readable/parseable JSON
      (data, [errs])   -> file parsed but failed schema validation (errs non-empty)
      (data, [])       -> valid profile, ready to apply
    """
    p = operating_profile_path(idea_folder)
    if not os.path.exists(p):
        return None, []
    try:
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        return None, [f"could not read/parse {p}: {e}"]
    return data, validate_operating_profile(data)


# ===========================================================================
# commands
# ===========================================================================

def cmd_init(args):
    idea = os.path.abspath(args.idea_folder)
    if not os.path.isdir(idea):
        die(f"idea folder does not exist: {idea}", EX_USAGE)
    if not os.path.exists(os.path.join(idea, "business-idea.md")) and not args.allow_missing_idea:
        die("no business-idea.md in the idea folder (pass --allow-missing-idea to override)", EX_USAGE)

    d = tk_dir(idea)
    os.makedirs(d, exist_ok=True)
    for sub in ("gates", "intake", "foundation", "build", "market", "operate"):
        os.makedirs(os.path.join(d, sub), exist_ok=True)

    # consent log — create empty if absent, NEVER truncate an existing one.
    cp = consent_path(idea)
    if not os.path.exists(cp):
        open(cp, "a", encoding="utf-8").close()
    dp = decision_path(idea)
    if not os.path.exists(dp):
        open(dp, "a", encoding="utf-8").close()

    sp = state_path(idea)
    if os.path.exists(sp) and not args.reset:
        # resume, do not clobber
        state = load_state(idea)
        print(f"launch-state.json already exists at stage '{state.get('stage')}' — resuming (use --reset to reinitialize).")
        loaded, prof_errors, _ = _maybe_stamp_operating_profile(idea, state)
        if prof_errors:
            print("warning: business-operating-profile.json present but INVALID — not stamped:")
            for e in prof_errors:
                print(f"  - {e}")
        elif loaded:
            save_state(idea, state)
            op = state["operating_profile"]
            print(f"  operating profile: stamped (stack:{op['stack']} org_type:{op['org_type']})")
        _print_status(idea, state)
        return

    workstreams = {}
    for name, meta in REGISTRY.items():
        workstreams[name] = {
            "status": "not_started",
            "actor_waiting": None,
            "blocked_by": [],
            "note": None,
            "updated": now_iso(),
        }

    # Operator profile (white-label): the tool ships pre-branded via operator.json,
    # and a franchisee rebrands by swapping it (see `rebrand`) or pointing --operator.
    op = load_operator(args.operator)
    gate_matrix = dict(GATE_MATRIX_DEFAULTS)
    for k, v in (op.get("gate_matrix_status") or {}).items():
        if k in gate_matrix and v in ("done", "pending"):
            gate_matrix[k] = v

    state = {
        "schema": SCHEMA,
        "business": args.name or os.path.basename(idea.rstrip("/")),
        "idea_folder": idea,
        "operator": operator_identity(op),   # who launched this business (franchise-aware)
        "started": now_iso(),
        "updated": now_iso(),
        "stage": "intake",
        "throttle": args.throttle,          # D3 blast-radius cap
        "gate_matrix": gate_matrix,
        "workstreams": workstreams,
    }
    loaded, prof_errors, _ = _maybe_stamp_operating_profile(idea, state)

    atomic_write_json(sp, state)
    _log_decision(idea, "init", {"business": state["business"], "throttle": args.throttle,
                                 "operator": state["operator"]["id"]})
    print(f"initialized turnkey/ for '{state['business']}' at {d}")
    print(f"  operator: {state['operator']['name']} ({state['operator']['id']})"
          + ("" if op.get("_source") else "  [no operator.json found — using generic fallback]"))
    if prof_errors:
        print("  operating profile: business-operating-profile.json present but INVALID — not stamped:")
        for e in prof_errors:
            print(f"    - {e}")
    elif loaded:
        oprof = state["operating_profile"]
        print(f"  operating profile: stamped (stack:{oprof['stack']} org_type:{oprof['org_type']})")
    _print_status(idea, state)


def _print_status(idea, state):
    op = state.get("operator") or {}
    print()
    print(f"  business : {state['business']}")
    print(f"  operator : {op.get('name','—')} ({op.get('id','—')})")
    print(f"  stage    : {state['stage']}   throttle: {state.get('throttle')}")
    print(f"  started  : {state['started']}")
    bp = state.get("blueprint")
    if bp:
        p = bp["platform"]
        core = sorted(k for k, v in bp["functions"].items() if v["tier"] == "core")
        print(f"  blueprint: {bp['org_label']} ({bp['org_type']})"
              f" · site: {p['label']} [WordPress: {'YES' if p['wordpress_used'] else 'NO'}]")
        print(f"             {len(core)} core functions: {', '.join(core)}")
    else:
        print("  blueprint: NOT DEFINED — run `turnkey blueprint <idea> --save` "
              "(org type, functions, WordPress?)")
    prof = state.get("operating_profile")
    if prof:
        div = f"  [DIVERGENCE: profile overrides default '{prof['divergence']['blueprint_recommendation']}']" \
              if prof.get("divergence") else ""
        print(f"  op.profile: LOADED — stack:{prof.get('stack')} org_type:{prof.get('org_type')} "
              f"ops_model:{prof.get('operations_model')} payments.stripe:"
              f"{(prof.get('payments') or {}).get('stripe')}{div}")
        if prof.get("operations_model") in ("hub", "hybrid"):
            w6_gate_script = ((state["workstreams"].get("W6_products", {}).get("gate") or {})
                              .get("script") or "")
            if "provision-hub" not in w6_gate_script:
                print("  hint      : client-hub deliverable pending — run "
                      "`turnkey provision-hub \"<idea-folder>\"`")
    else:
        print("  op.profile: none loaded (no business-operating-profile.json — run `turnkey profile <idea>`)")
    print("  gate matrix (platform bootstrap):")
    for k, v in state.get("gate_matrix", {}).items():
        mark = "OK " if v == "done" else "-- "
        print(f"    [{mark}] {k}: {v}")
    print("  workstreams:")
    for stage in STAGES[:-1]:
        rows = [(n, w) for n, w in state["workstreams"].items() if REGISTRY[n]["stage"] == stage]
        if not rows:
            continue
        cur = " <-- current stage" if stage == state["stage"] else ""
        print(f"    [{stage}]{cur}")
        for name, w in rows:
            waiting = f"  waiting:{w['actor_waiting']}" if w.get("actor_waiting") else ""
            blocked = f"  blocked_by:{','.join(w['blocked_by'])}" if w.get("blocked_by") else ""
            consent = "  (consent-required)" if REGISTRY[name]["requires_consent"] else ""
            print(f"       - {name:<14} {w['status']:<12}{waiting}{blocked}{consent}")
    # frontier hint
    nxt = _next_actions(state)
    if nxt:
        print("  next actionable (frontier):")
        for n in nxt:
            print(f"       -> {n}")


def _next_actions(state) -> list:
    """Workstreams in the current (or any earlier) stage that are ready to advance."""
    out = []
    stage = state["stage"]
    if stage == "launched":
        return ["launch complete — steady-state operation"]
    for name, meta in REGISTRY.items():
        if meta["stage"] != stage:
            continue
        w = state["workstreams"][name]
        if w["status"] in ("done", "not_applicable"):
            continue
        deps = meta["depends_on"]
        deps_ready = all(state["workstreams"].get(d, {}).get("status") == "done"
                         or state["workstreams"].get(d, {}).get("status") == "gate_pending"
                         for d in deps)
        if w["status"] == "not_started" and deps_ready:
            out.append(f"dispatch {meta['agent']} for {name} ({meta['title']})")
        elif w["status"] == "gate_pending":
            out.append(f"resolve gate on {name} (waiting {w['actor_waiting']})")
        elif w["status"] == "in_progress":
            out.append(f"continue {name}")
    return out


def cmd_status(args):
    idea = os.path.abspath(args.idea_folder)
    state = load_state(idea)
    if args.json:
        print(json.dumps(state, indent=2, ensure_ascii=False))
    else:
        _print_status(idea, state)


def cmd_set(args):
    idea = os.path.abspath(args.idea_folder)
    state = load_state(idea)
    ws = args.workstream
    if ws not in REGISTRY:
        die(f"unknown workstream '{ws}'. Known: {', '.join(REGISTRY)}", EX_USAGE)
    if args.status not in STATUSES:
        die(f"invalid status '{args.status}'. Allowed: {', '.join(STATUSES)}", EX_USAGE)

    w = state["workstreams"][ws]
    new = args.status

    # --- BLUEPRINT ENFORCEMENT — you cannot finish building what was never scoped ---
    if new == "done" and ws in BLUEPRINT_REQUIRED_WS and not state.get("blueprint"):
        die(
            f"REFUSED: '{ws}' builds business functions, but this launch has no blueprint —\n"
            f"        the org type, the function set (CRM / finance / catalog / …) and the\n"
            f"        WordPress-or-custom-app decision are undefined.\n"
            f"        Decide first:  turnkey blueprint \"{idea}\" --save [--org-type <type>]",
            EX_GUARD,
        )

    # --- structural validation ---
    if new == "gate_pending":
        if not args.actor_waiting:
            die("status gate_pending requires --actor-waiting VOM|CLIENT", EX_USAGE)
        if args.actor_waiting not in ("VOM", "CLIENT"):
            die("--actor-waiting must be VOM or CLIENT", EX_USAGE)
    if new == "blocked" and not (args.blocked_by or w.get("blocked_by")):
        die("status blocked requires --blocked-by <workstream[,workstream]>", EX_USAGE)

    # --- GATE ENFORCEMENT — the load-bearing invariant (SKILL.md §1.1) ---
    if new == "done" and REGISTRY[ws]["requires_consent"]:
        if not has_yes(idea, ws):
            die(
                f"REFUSED: '{ws}' publishes/sends/moves money and cannot be marked done "
                f"without a logged YES.\n"
                f"        Record consent first:  turnkey consent \"{idea}\" "
                f"--workstream {ws} --actor VOM|CLIENT --action \"...\" --decision YES ...",
                EX_GUARD,
            )

    # --- intake extra guard: profile must exist + terms YES ---
    if ws == "intake" and new == "done":
        if not os.path.exists(profile_path(idea)):
            die("REFUSED: intake cannot be done without business-profile.md present.", EX_GUARD)

    # apply
    w["status"] = new
    w["actor_waiting"] = args.actor_waiting if new in ("gate_pending",) else (args.actor_waiting or None)
    if new != "gate_pending" and not args.actor_waiting:
        w["actor_waiting"] = None
    if args.blocked_by:
        w["blocked_by"] = [x.strip() for x in args.blocked_by.split(",") if x.strip()]
    if new != "blocked":
        w["blocked_by"] = [] if not args.blocked_by else w["blocked_by"]
    if args.note is not None:
        w["note"] = args.note
    w["updated"] = now_iso()

    save_state(idea, state)
    _log_decision(idea, "set_status", {"workstream": ws, "status": new,
                                       "actor_waiting": w["actor_waiting"], "note": args.note})
    print(f"{ws}: {new}" + (f"  waiting:{w['actor_waiting']}" if w["actor_waiting"] else ""))


def cmd_gate(args):
    """Open a human gate: workstream -> gate_pending, record the 'do this now' script."""
    idea = os.path.abspath(args.idea_folder)
    state = load_state(idea)
    ws = args.workstream
    if ws not in REGISTRY:
        die(f"unknown workstream '{ws}'", EX_USAGE)
    if args.actor not in ("VOM", "CLIENT"):
        die("--actor must be VOM or CLIENT (gates are human)", EX_USAGE)

    script_rel = None
    if args.script_file:
        if not os.path.exists(args.script_file):
            die(f"--script-file not found: {args.script_file}", EX_USAGE)
        script_rel = os.path.relpath(os.path.abspath(args.script_file), idea)

    w = state["workstreams"][ws]
    w["status"] = "gate_pending"
    w["actor_waiting"] = args.actor
    w["note"] = args.action
    w["gate"] = {
        "action": args.action,
        "actor": args.actor,
        "channel": args.channel,
        "script": script_rel,
        "opened_at": now_iso(),
    }
    w["updated"] = now_iso()
    save_state(idea, state)
    _log_decision(idea, "gate_open", {"workstream": ws, "actor": args.actor,
                                      "action": args.action, "channel": args.channel})
    print(f"gate opened: {ws} -> gate_pending (waiting {args.actor}) — {args.action}")
    if script_rel:
        print(f"  script: {script_rel}")
    else:
        print(f"  (no --script-file recorded; write turnkey/gates/{ws}-N.md and re-run with --script-file)")


def append_consent(idea: str, ws: str, action: str, actor: str, channel: str,
                   decision: str, evidence: str = None, scope: str = None) -> dict:
    """Append one hash-chained line to the append-only consent log, and return it.

    Every path that records a human decision goes through here so the chain is built
    exactly once, the same way — including the unattended-run authorization that Forge
    later reads."""
    lines = read_consent_lines(idea)
    record = {
        "seq": len(lines),
        "ts": now_iso(),
        "workstream": ws,
        "action": action,
        "actor": actor,
        "channel": channel,
        "decision": decision,
        "evidence": evidence,
        "scope": scope,
        "prev_hash": lines[-1]["hash"] if lines else consent_genesis(idea),
    }
    record["hash"] = sha(canonical(record))  # hash covers everything above incl. prev_hash
    append_jsonl(consent_path(idea), record)
    return record


def cmd_consent(args):
    """Append one hash-chained line to the append-only consent log (SKILL.md §4)."""
    idea = os.path.abspath(args.idea_folder)
    load_state(idea)  # ensure initialized
    ws = args.workstream
    if ws not in REGISTRY:
        die(f"unknown workstream '{ws}'", EX_USAGE)
    if args.decision not in ("YES", "NO"):
        die("--decision must be YES or NO (verbatim)", EX_USAGE)
    if args.actor not in ("VOM", "CLIENT"):
        die("--actor must be VOM or CLIENT (consent is human)", EX_USAGE)

    record = append_consent(idea, ws, args.action, args.actor, args.channel,
                            args.decision, args.evidence, args.scope)
    seq, prev_hash = record["seq"], record["prev_hash"]
    print(f"consent logged [{seq}] {ws} {args.decision} by {args.actor} via {args.channel}")
    print(f"  action: {args.action}")
    print(f"  hash  : {record['hash'][:16]}…  (chained on {str(prev_hash)[:16]}…)")
    if args.decision == "NO":
        print("  NOTE: decision NO — the workstream stays blocked; pipeline continues around it.")


def cmd_verify(args):
    """Recompute the consent hash-chain — proves the append-only log was not edited."""
    idea = os.path.abspath(args.idea_folder)
    lines = read_consent_lines(idea)
    if not lines:
        print("consent log empty — nothing to verify (OK).")
        return
    ok = True
    prev = consent_genesis(idea)
    for i, rec in enumerate(lines):
        if rec.get("seq") != i:
            print(f"  [FAIL] line {i}: seq mismatch (got {rec.get('seq')})"); ok = False
        if rec.get("prev_hash") != prev:
            print(f"  [FAIL] line {i}: broken chain (prev_hash != prior hash)"); ok = False
        body = {k: v for k, v in rec.items() if k != "hash"}
        if sha(canonical(body)) != rec.get("hash"):
            print(f"  [FAIL] line {i}: hash does not match content (line was edited)"); ok = False
        prev = rec.get("hash")
    if ok:
        print(f"consent log verified: {len(lines)} entries, chain intact, no edits detected.")
    else:
        die("consent log integrity FAILED — the append-only log was tampered with.", EX_INTEGRITY)


def cmd_log(args):
    idea = os.path.abspath(args.idea_folder)
    lines = read_consent_lines(idea)
    if not lines:
        print("(consent log empty)")
        return
    for rec in lines:
        print(f"[{rec['seq']}] {rec['ts']}  {rec['workstream']:<14} {rec['decision']:<3} "
              f"{rec['actor']:<7} {rec.get('channel','')}")
        print(f"      {rec['action']}")
        if rec.get("scope"):
            print(f"      scope: {rec['scope']}")


def cmd_matrix(args):
    """Read or set the platform-bootstrap gate matrix (one-time-ever human gates)."""
    idea = os.path.abspath(args.idea_folder)
    state = load_state(idea)
    if args.key:
        if args.key not in state["gate_matrix"]:
            die(f"unknown gate-matrix key '{args.key}'. Known: {', '.join(state['gate_matrix'])}", EX_USAGE)
        if args.value:
            state["gate_matrix"][args.key] = args.value
            save_state(idea, state)
            _log_decision(idea, "gate_matrix", {"key": args.key, "value": args.value})
            print(f"gate_matrix.{args.key} = {args.value}")
        else:
            print(f"{args.key}: {state['gate_matrix'][args.key]}")
    else:
        for k, v in state["gate_matrix"].items():
            print(f"{k}: {v}")


def cmd_operator(args):
    """Show the operator identity this run is branded under (white-label).
    The orchestrator calls this to get the name/voice to pass into every subagent
    brief, so no 'VOM' is hardcoded in the pipeline. Backfills state.operator if a
    run predates the operator profile."""
    idea = os.path.abspath(args.idea_folder)
    state = load_state(idea)
    if not state.get("operator") or args.refresh:
        op = load_operator(args.operator)
        state["operator"] = operator_identity(op)
        save_state(idea, state)
        _log_decision(idea, "operator_set", {"operator": state["operator"]["id"]})
    o = state["operator"]
    if args.json:
        # include the full profile (brand/platform) for agents that need it
        full = load_operator(args.operator or o.get("profile_source"))
        print(json.dumps({"identity": o, "brand": full.get("brand", {}),
                          "platform": full.get("platform", {})}, indent=2, ensure_ascii=False))
        return
    print(f"operator : {o['name']} ({o['id']})   model: {o.get('model')}")
    print(f"author as: {o['author_as']}")
    print(f"voice    : {o.get('voice','')}")
    print(f"profile  : {o.get('profile_source') or '(generic fallback — no operator.json)'}")


# --- business functions & site platform (blueprints.py) --------------------

def _source_text(idea: str) -> str:
    """Everything Turnkey knows in prose about this business, for classification."""
    parts = []
    for p in (profile_path(idea), os.path.join(idea, "business-idea.md")):
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                parts.append(f.read())
    return "\n\n".join(parts)


def _csv(v):
    return [x.strip() for x in (v or "").split(",") if x.strip()]


def _compact_blueprint(bp: dict) -> dict:
    """What gets stamped into launch-state.json (the full rationale lives in blueprint.md)."""
    return {
        "schema": bp["schema"],
        "org_type": bp["org_type"],
        "org_label": bp["org_label"],
        "classified": {"source": bp["classification"]["source"],
                       "confidence": bp["classification"]["confidence"]},
        "platform": {
            "decision": bp["platform"]["decision"],
            "label": bp["platform"]["label"],
            "wordpress_used": bp["platform"]["wordpress_used"],
            "hosting": bp["platform"]["hosting"],
            "confidence": bp["platform"]["confidence"],
            "scores": bp["platform"]["scores"],
            "headline": bp["platform"]["headline"],
            "source": bp["platform"].get("source", "engine"),
        },
        "functions": {k: {"tier": v["tier"], "workstream": v["workstream"],
                          "title": v["title"], "gated": v["gated"],
                          "implementation": v["implementation"]}
                      for k, v in bp["functions"].items()},
        "workstream_scope": bp["workstream_scope"],
        "overrides": bp["overrides"],
        "doc": "turnkey/blueprint.md",
        "decided": now_iso(),
    }


def _make_blueprint(idea, state, args, add=None, remove=None, platform_override=None):
    op = load_operator(getattr(args, "operator", None)
                       or (state.get("operator") or {}).get("profile_source"))
    text = _source_text(idea)
    try:
        bp = blueprints.build_blueprint(
            text,
            org_type_hint=getattr(args, "org_type", None),
            add=add, remove=remove,
            operator_platform=op.get("platform", {}),
        )
    except ValueError as e:
        die(str(e), EX_USAGE)
    if platform_override:
        val, reason = platform_override
        bp["platform"]["decision"] = val
        bp["platform"]["label"] = blueprints.PLATFORMS[val]["label"]
        bp["platform"]["wordpress_used"] = val in ("wordpress", "hybrid")
        bp["platform"]["confidence"] = "explicit"
        bp["platform"]["source"] = "operator"
        bp["platform"]["headline"] = reason or "Operator decision."
        bp["platform"]["reasons"].insert(0, {"platform": val, "weight": "override",
                                             "kind": "operator",
                                             "reason": reason or "Operator decision."})
        for k, v in bp["functions"].items():
            v["implementation"] = blueprints.implementation(k, val)
    return bp, op


def _save_blueprint(idea, state, bp, op):
    author = (state.get("operator") or {}).get("author_as") or "the operator"
    md = blueprints.render_markdown(bp, state.get("business", os.path.basename(idea)),
                                    author, now_iso())
    with open(blueprint_path(idea), "w", encoding="utf-8") as f:
        f.write(md)
    state["blueprint"] = _compact_blueprint(bp)
    save_state(idea, state)
    _log_decision(idea, "blueprint", {
        "org_type": bp["org_type"],
        "classified": bp["classification"]["source"],
        "confidence": bp["classification"]["confidence"],
        "platform": bp["platform"]["decision"],
        "wordpress_used": bp["platform"]["wordpress_used"],
        "platform_source": bp["platform"].get("source", "engine"),
        "core": sorted(k for k, v in bp["functions"].items() if v["tier"] == "core"),
        "overrides": bp["overrides"],
    })


def cmd_blueprint(args):
    """Define WHAT to build: org type -> business functions + the WordPress decision."""
    idea = os.path.abspath(args.idea_folder)
    state = load_state(idea)
    add, remove = _csv(args.add), _csv(args.remove)
    if args.reuse_overrides and state.get("blueprint"):
        prev = state["blueprint"].get("overrides", {})
        add = list(dict.fromkeys(prev.get("added", []) + add))
        remove = list(dict.fromkeys(prev.get("removed", []) + remove))
    bp, op = _make_blueprint(idea, state, args, add=add, remove=remove)

    # PROFILE WINS: if an operating profile is loaded and its stack maps to a different
    # platform than blueprints.py just recommended for this org_type, the profile's
    # choice overrides the recommendation here (before it's ever saved), and the
    # divergence is logged.
    prof = state.get("operating_profile")
    if prof:
        was = _apply_profile_stack_to_blueprint(bp, prof)
        if was:
            _log_decision(idea, "profile_platform_override", {
                "org_type": bp["org_type"], "profile_stack": prof.get("stack"),
                "profile_platform": prof.get("platform"), "blueprint_recommendation": was,
                "resolution": "profile wins", "at": "blueprint",
            })

    if args.save:
        # A guessed org type must never silently become a build order.
        if bp["classification"]["confidence"] == "low" and not args.org_type:
            die("REFUSED: org type could not be determined confidently from the profile "
                f"(best guess: {bp['org_type']}).\n"
                "        Decide it explicitly: --org-type <" + "|".join(blueprints.ORG_TYPES) + ">\n"
                "        (`turnkey orgtypes` lists what each type builds.)", EX_GUARD)
        _save_blueprint(idea, state, bp, op)
        print(f"blueprint saved -> {os.path.relpath(blueprint_path(idea), idea)}")
        print()

    if args.json:
        print(json.dumps(bp, indent=2, ensure_ascii=False))
    else:
        print(blueprints.render_text(bp))
        if not args.save:
            print("\n(preview only — re-run with --save to make it the build order)")


def cmd_orgtypes(args):
    """Print the org-type catalog: what each kind of organization gets built."""
    if args.json:
        print(json.dumps({"org_types": blueprints.ORG_TYPES,
                          "functions": blueprints.FUNCTIONS,
                          "universal_core": blueprints.UNIVERSAL_CORE,
                          "universal_recommended": blueprints.UNIVERSAL_RECOMMENDED},
                         indent=2, ensure_ascii=False))
        return
    print(blueprints.render_catalog())


def cmd_functions(args):
    """List, or override, the business functions this launch will build."""
    idea = os.path.abspath(args.idea_folder)
    state = load_state(idea)
    bpstate = state.get("blueprint")
    if not bpstate:
        die("no blueprint yet — run `turnkey blueprint \"<idea>\" --save` first", EX_USAGE)

    if not args.add and not args.remove:
        fns = bpstate["functions"]
        for tier in ("core", "recommended", "optional"):
            keys = [k for k, v in fns.items() if v["tier"] == tier]
            if not keys:
                continue
            print(f"[{tier}]")
            for k in sorted(keys, key=lambda x: fns[x]["title"]):
                v = fns[k]
                print(f"  {k:<22} {v['title']:<46} {v['workstream']:<14}"
                      f"{'  (gated)' if v['gated'] else ''}")
                print(f"  {'':<22} -> {v['implementation']}")
        return

    # override: re-resolve with cumulative overrides, keeping the decided org type
    args.org_type = bpstate["org_type"]
    args.reuse_overrides = True
    prev = bpstate.get("overrides", {})
    add = list(dict.fromkeys(prev.get("added", []) + _csv(args.add)))
    remove = list(dict.fromkeys(prev.get("removed", []) + _csv(args.remove)))
    plat = bpstate["platform"]
    override = (plat["decision"], plat["headline"]) if plat.get("source") == "operator" else None
    bp, op = _make_blueprint(idea, state, args, add=add, remove=remove, platform_override=override)
    _save_blueprint(idea, state, bp, op)
    print(f"functions updated (+{', '.join(_csv(args.add)) or '—'} / "
          f"-{', '.join(_csv(args.remove)) or '—'}) — blueprint re-saved.")
    print(blueprints.render_text(bp))


def cmd_platform(args):
    """Read, or override, the site-platform decision (WordPress / custom app / hybrid)."""
    idea = os.path.abspath(args.idea_folder)
    state = load_state(idea)
    bpstate = state.get("blueprint")
    if not bpstate:
        die("no blueprint yet — run `turnkey blueprint \"<idea>\" --save` first", EX_USAGE)

    if not args.value:
        p = bpstate["platform"]
        print(f"platform : {p['label']} ({p['decision']})")
        print(f"WordPress: {'YES' if p['wordpress_used'] else 'NO'}")
        print(f"hosting  : {p['hosting']}")
        print(f"decided  : {p.get('source', 'engine')} · confidence {p['confidence']} "
              f"· wp {p['scores']['wordpress']} vs app {p['scores']['vercel_app']}")
        print(f"rationale: {p['headline']}")
        return

    if args.value not in blueprints.PLATFORMS:
        die(f"--value must be one of: {', '.join(blueprints.PLATFORMS)}", EX_USAGE)
    if not args.reason:
        die("an operator override needs --reason (it goes in the audit trail)", EX_USAGE)

    args.org_type = bpstate["org_type"]
    prev = bpstate.get("overrides", {})
    bp, op = _make_blueprint(idea, state, args,
                             add=prev.get("added", []), remove=prev.get("removed", []),
                             platform_override=(args.value, args.reason))
    _save_blueprint(idea, state, bp, op)
    print(f"platform override: {bp['platform']['label']} "
          f"(WordPress: {'YES' if bp['platform']['wordpress_used'] else 'NO'})")
    print(f"  reason: {args.reason}")
    print(f"  implementations re-resolved for {len(bp['functions'])} functions; blueprint re-saved.")


def cmd_rebrand(args):
    """White-label: scaffold a fresh operator profile for a new franchisee to fill in.
    The tool ships pre-branded (operator.json); rebranding = swapping that file. This
    writes a template; the franchisee edits it and points Turnkey at it via
    `--operator <path>` or $TURNKEY_OPERATOR (or replaces the default operator.json)."""
    dest = os.path.abspath(args.path)
    if os.path.exists(dest) and not args.force:
        die(f"{dest} already exists — pass --force to overwrite", EX_USAGE)
    if args.from_profile:
        base = load_operator(args.from_profile)
        base.pop("_source", None)
        template = base
    else:
        template = {
            "schema": 1,
            "_comment": "Turnkey OPERATOR profile — one per instance. Fill in your brand; the engine, gates, consent log, and agents are all brand-agnostic and read your identity from here.",
            "operator": {
                "id": "<slug>", "name": "<Your Company>", "short": "<ABBR>",
                "author_as": "<Your Company (ABBR)>",
                "tagline": "<one-line promise>",
                "voice": "<how your deliverables should sound>",
                "model": "operator-run",
                "niche_focus": "<your specialization, if any>",
            },
            "brand": {"logo": "<mark>", "palette": {}, "typography": {"display": "", "body": ""}, "web": "<domain>"},
            "platform": {"dns_zone": "", "apex_domain": "", "registrar": "", "dns_provider": "",
                         "email_sender": "", "stripe": "", "hosting": "", "bookkeeping": ""},
            "gate_matrix_status": {"stripe_connect": "pending", "provisioned_accounts": "pending",
                                   "cloudflare_delegation": "pending", "credential_baseline": "pending",
                                   "dutch_lawyer_terms": "pending", "registrar_nl": "pending"},
        }
    atomic_write_json(dest, template)
    print(f"operator profile scaffolded: {dest}")
    print("Next: edit it, then run Turnkey with  --operator " + dest + "  (or export TURNKEY_OPERATOR),")
    print("or replace the default operator.json to make it the instance default.")


# ===========================================================================
# Business Operating Profile — apply it to launch-state (this is what "DRIVEN by it" means)
# ===========================================================================

def _compute_profile_divergence(idea, state, org_type, profile_stack, profile_platform):
    """Compare the profile's stack against blueprints.py's OWN algorithmic recommendation
    for this org_type (independent of whatever may already be saved on this launch).
    Returns a divergence record, or None if they agree (or org_type isn't a known type)."""
    if org_type not in blueprints.ORG_TYPES:
        return None
    op = load_operator((state.get("operator") or {}).get("profile_source"))
    functions = blueprints.resolve_functions(org_type)
    recommended = blueprints.decide_platform(org_type, functions, "", op.get("platform", {}))
    if recommended["decision"] == profile_platform:
        return None
    return {
        "org_type": org_type,
        "profile_stack": profile_stack,
        "profile_platform": profile_platform,
        "blueprint_recommendation": recommended["decision"],
        "resolution": "profile wins",
    }


def _apply_profile_stack_to_blueprint(bp: dict, prof: dict):
    """Mutate a FULL (non-compact) blueprint dict in place so its platform decision
    matches the operating profile's stack — the PROFILE WINS over blueprints.py's own
    org-type recommendation. Returns the prior decision if a change was made, else None."""
    target = prof.get("platform")
    if not target or bp["platform"]["decision"] == target:
        return None
    was = bp["platform"]["decision"]
    reason = (f"business-operating-profile.json stack='{prof.get('stack')}' (-> {target}) "
             f"overrides the blueprint's own recommendation ('{was}') for org_type "
             f"'{bp['org_type']}'. The profile wins.")
    bp["platform"]["decision"] = target
    bp["platform"]["label"] = blueprints.PLATFORMS[target]["label"]
    bp["platform"]["wordpress_used"] = target in ("wordpress", "hybrid")
    bp["platform"]["confidence"] = "explicit"
    bp["platform"]["source"] = "operating_profile"
    bp["platform"]["headline"] = reason
    bp["platform"]["reasons"].insert(0, {"platform": target, "weight": "override",
                                         "kind": "operating_profile", "reason": reason})
    for k, v in bp["functions"].items():
        v["implementation"] = blueprints.implementation(k, target)
    return was


def _apply_operating_profile(idea, state, data: dict):
    """Stamp a validated Business Operating Profile into state AND configure the run
    from it (payments off -> W5 not_applicable; hub/hybrid ops model -> client-hub
    deliverable flag on W6; the chosen stack/pages/features/channels are recorded so
    later stages read them rather than re-deciding). Returns the divergence record, if any.
    Mutates `state` in place; caller is responsible for save_state()."""
    stack = data["stack"]
    mapped_platform = STACK_TO_PLATFORM[stack]
    org_type = data.get("org_type")
    payments = data.get("payments") or {}
    stripe_on = bool(payments.get("stripe"))
    publications = data.get("publications") or {}
    ops_model = data.get("operations_model")
    client_hub = data.get("client_hub") or []

    divergence = _compute_profile_divergence(idea, state, org_type, stack, mapped_platform)
    if divergence:
        _log_decision(idea, "profile_platform_divergence", divergence)

    state["operating_profile"] = {
        "source": os.path.relpath(operating_profile_path(idea), idea),
        "business": data.get("business"),
        "tagline": data.get("tagline"),
        "org_type": org_type,
        "stack": stack,
        "platform": mapped_platform,          # resolved onto blueprints.py's vocabulary
        "domain": data.get("domain"),
        "pages": data.get("pages"),
        "payments": payments,
        "features": data.get("features"),
        "publications": publications,
        "operations_model": ops_model,
        "client_hub": client_hub,
        "divergence": divergence,
        "stamped": now_iso(),
    }

    # --- CONFIGURE THE RUN ---------------------------------------------------
    W = state["workstreams"]

    # payments off -> W5 is a non-blocking no-op, dropped from advance criteria (see
    # _advance_ok). Only move it if nothing has already happened to it, so re-stamping
    # (idempotent) never clobbers real progress.
    w5 = W["W5_payments"]
    if not stripe_on:
        if w5["status"] in ("not_started", "not_applicable"):
            w5["status"] = "not_applicable"
            w5["actor_waiting"] = None
            w5["blocked_by"] = []
            w5["note"] = "operating profile: payments.stripe=false — not applicable to this launch."
            w5["updated"] = now_iso()
    elif w5["status"] == "not_applicable":
        # the profile flipped payments back on -> undo the earlier auto-configuration.
        w5["status"] = "not_started"
        w5["note"] = None
        w5["updated"] = now_iso()

    # hub / hybrid operations model -> a per-client hub is part of this launch's delivery.
    # Record it as a flag (operating_profile.client_hub, above) AND leave a note on W6 so
    # the workstream that assembles deliverables sees it without re-deciding.
    w6 = W["W6_products"]
    marker = "operating profile: client-hub deliverable required"
    if ops_model in ("hub", "hybrid") and marker not in (w6.get("note") or ""):
        hub_desc = ", ".join(client_hub) if client_hub else "(no client_hub items listed)"
        addition = f"{marker} ({ops_model}): {hub_desc}."
        w6["note"] = ((w6.get("note") + "  ") if w6.get("note") else "") + addition
        w6["updated"] = now_iso()

    # PROFILE WINS: if a blueprint is already saved on this launch and its platform
    # decision conflicts with the profile's stack, override it now (logged).
    bpstate = state.get("blueprint")
    if bpstate and bpstate["platform"]["decision"] != mapped_platform:
        args_ns = argparse.Namespace(org_type=bpstate["org_type"], operator=None)
        prev = bpstate.get("overrides", {})
        bp, op = _make_blueprint(idea, state, args_ns,
                                 add=prev.get("added", []), remove=prev.get("removed", []))
        was = _apply_profile_stack_to_blueprint(bp, state["operating_profile"])
        if was:
            _log_decision(idea, "profile_platform_override", {
                "org_type": bp["org_type"], "profile_stack": stack,
                "profile_platform": mapped_platform, "blueprint_recommendation": was,
                "resolution": "profile wins", "at": "profile_stamp",
            })
            _save_blueprint(idea, state, bp, op)   # re-persists state["blueprint"] + blueprint.md

    return divergence


def _maybe_stamp_operating_profile(idea, state):
    """Used by `init` (and available to any command): stamp the profile into state if a
    valid one exists. Returns (loaded, errors, divergence). Never raises — an invalid or
    absent profile just means this run isn't profile-driven (yet)."""
    data, errors = load_operating_profile(idea)
    if data is None or errors:
        return False, errors, None
    divergence = _apply_operating_profile(idea, state, data)
    return True, [], divergence


def _print_operating_profile_summary(idea, state):
    prof = state.get("operating_profile")
    if not prof:
        print("no operating profile loaded (no business-operating-profile.json).")
        return
    print(f"  business     : {prof.get('business')}")
    print(f"  tagline      : {prof.get('tagline')}")
    print(f"  org type     : {prof.get('org_type')}")
    print(f"  stack        : {prof.get('stack')}  -> platform: {prof.get('platform')}")
    dom = prof.get("domain") or {}
    print(f"  domain       : {dom.get('mode', '—')} {dom.get('value', '')}")
    print(f"  pages        : {', '.join(prof.get('pages') or []) or '—'}")
    pay = prof.get("payments") or {}
    print(f"  payments     : stripe={pay.get('stripe')} subscriptions={pay.get('subscriptions')} "
          f"ideal={pay.get('ideal')} donations={pay.get('donations')} "
          f"currency={pay.get('currency', '—')}")
    print(f"  features     : {', '.join(prof.get('features') or []) or '—'}")
    pub = prof.get("publications") or {}
    flags = [k for k in PROFILE_PUBLICATION_FLAGS if pub.get(k)]
    print(f"  publications : {', '.join(flags) or '—'}  channels: "
          f"{', '.join(pub.get('channels') or []) or '—'}")
    print(f"  ops model    : {prof.get('operations_model')}")
    print(f"  client hub   : {', '.join(prof.get('client_hub') or []) or '—'}")
    if prof.get("divergence"):
        dv = prof["divergence"]
        print(f"  DIVERGENCE   : profile stack -> '{dv['profile_platform']}' overrides the "
              f"blueprint default '{dv['blueprint_recommendation']}' for org_type "
              f"'{dv['org_type']}'  (profile wins)")
    print(f"  stamped      : {prof.get('stamped')} -> {os.path.relpath(state_path(idea), idea)}")


def cmd_profile(args):
    """Load, validate, and stamp the Business Operating Profile — the wizard-authored
    JSON that DRIVES this launch run (stack/pages/features/channels, payments,
    operations model, client-hub scope). Idempotent: re-running just re-stamps."""
    idea = os.path.abspath(args.idea_folder)
    state = load_state(idea)  # requires `init` to have run first

    data, errors = load_operating_profile(idea)
    if data is None and not errors:
        die(f"no business-operating-profile.json at {operating_profile_path(idea)}", EX_USAGE)
    if errors:
        print(f"business-operating-profile.json is INVALID ({operating_profile_path(idea)}):")
        for e in errors:
            print(f"  - {e}")
        die("operating profile validation failed — fix the file above and re-run `turnkey profile`.",
            EX_GUARD)

    _apply_operating_profile(idea, state, data)
    save_state(idea, state)
    prof = state["operating_profile"]
    _log_decision(idea, "operating_profile", {
        "stack": prof["stack"], "org_type": prof["org_type"],
        "operations_model": prof["operations_model"],
        "payments_stripe": (prof["payments"] or {}).get("stripe"),
        "divergence": bool(prof.get("divergence")),
    })
    print(f"operating profile loaded + stamped -> {os.path.relpath(state_path(idea), idea)}")
    print()
    _print_operating_profile_summary(idea, state)


# --- advance criteria (SKILL.md §6) ---------------------------------------

def _advance_ok(state) -> tuple:
    """Return (target_stage, ok, missing[]) for advancing from the current stage."""
    stage = state["stage"]
    W = state["workstreams"]

    def st(name):
        return W[name]["status"]

    if stage == "intake":
        missing = []
        if st("intake") != "done":
            missing.append("intake not done (needs profile + KYB clear + terms YES)")
        return ("foundation", not missing, missing)

    if stage == "foundation":
        missing = []
        if st("W1_profile") != "done":
            missing.append("W1_profile not done (profile must be locked)")
        if st("W3_domain") not in ("done", "gate_pending"):
            missing.append("W3_domain has no working/pending hostname to build on")
        if not state.get("blueprint"):
            missing.append("no blueprint — org type, business functions (CRM/finance/catalog/…) "
                           "and the WordPress-or-app decision are undefined "
                           "(`turnkey blueprint <idea> --save`)")
        # W2 may remain a pending gate; a subdomain is enough to build (SKILL §2)
        return ("build", not missing, missing)

    if stage == "build":
        missing = []
        if not has_yes_done(state, "W4_website"):
            missing.append("W4_website not live-confirmed (needs go-live YES + done)")
        # W5 required only if the model takes payments; treat as required by default.
        # not_applicable = the operating profile turned payments off for this launch
        # (payments.stripe=false) — dropped from advance criteria, non-blocking.
        if st("W5_payments") not in ("done", "gate_pending", "not_applicable"):
            missing.append("W5_payments rail not certified or pending")
        return ("market", not missing, missing)

    if stage == "market":
        missing = []
        if st("W7_presence") not in ("done", "gate_pending"):
            missing.append("W7_presence baseline benchmark not captured")
        if not has_yes_done(state, "W8_social"):
            missing.append("W8_social has no approved+scheduled cycle")
        return ("operate", not missing, missing)

    if stage == "operate":
        missing = []
        if st("W10_crm") != "done":
            missing.append("W10_crm not live")
        if not has_yes_done(state, "W11_followups"):
            missing.append("W11_followups first approved cycle not done")
        return ("launched", not missing, missing)

    return ("launched", False, ["already launched"])


def has_yes_done(state, ws) -> bool:
    return state["workstreams"][ws]["status"] == "done"


def cmd_advance(args):
    idea = os.path.abspath(args.idea_folder)
    state = load_state(idea)
    target, ok, missing = _advance_ok(state)
    if state["stage"] == "launched":
        print("already launched.")
        return
    if not ok and not args.force:
        print(f"cannot advance {state['stage']} -> {target}. Missing:")
        for m in missing:
            print(f"  - {m}")
        die("advance refused (use --force only with an operator decision to record).", EX_GUARD)
    prev = state["stage"]
    state["stage"] = target
    save_state(idea, state)
    _log_decision(idea, "advance", {"from": prev, "to": target, "forced": bool(args.force),
                                    "missing": missing if args.force else []})
    if args.force and missing:
        print(f"advanced {prev} -> {target} (FORCED past: {'; '.join(missing)})")
    else:
        print(f"advanced {prev} -> {target}")


def cmd_dispatch(args):
    """Record a subagent dispatch + model tier (SKILL.md §5). Does not run the agent —
    the orchestrator runs it with the Agent tool; this makes the routing auditable."""
    idea = os.path.abspath(args.idea_folder)
    load_state(idea)
    _log_decision(idea, "dispatch", {
        "workstream": args.workstream,
        "agent": REGISTRY.get(args.workstream, {}).get("agent"),
        "tier": args.tier,
        "escalated": bool(args.escalated),
        "note": args.note,
    })
    print(f"dispatch logged: {args.workstream} -> {REGISTRY.get(args.workstream, {}).get('agent')} "
          f"@ {args.tier}" + ("  (escalated)" if args.escalated else ""))


def _log_decision(idea, kind, data):
    record = {"ts": now_iso(), "kind": kind, "data": data}
    append_jsonl(decision_path(idea), record)


def cmd_check(args):
    """Definition-of-done audit (SKILL.md §8)."""
    idea = os.path.abspath(args.idea_folder)
    state = load_state(idea)
    W = state["workstreams"]
    problems = []

    # 1. every consent-required workstream that is `done` must have a matching YES
    for name, meta in REGISTRY.items():
        if meta["requires_consent"] and W[name]["status"] == "done":
            if not has_yes(idea, name):
                problems.append(f"{name} is done but has NO consent YES (GOVERNANCE VIOLATION)")

    # 2. consent log integrity
    try:
        lines = read_consent_lines(idea)
        prev = consent_genesis(idea)
        for i, rec in enumerate(lines):
            body = {k: v for k, v in rec.items() if k != "hash"}
            if rec.get("prev_hash") != prev or sha(canonical(body)) != rec.get("hash"):
                problems.append(f"consent line {i} fails integrity")
            prev = rec.get("hash")
    except Exception as e:  # noqa
        problems.append(f"consent log unreadable: {e}")

    # 3. launched requires all workstreams done (or not_applicable — the operating
    # profile configured them out of this run, e.g. payments.stripe=false)
    launched = state["stage"] == "launched"
    if launched:
        for name, w in W.items():
            if w["status"] not in ("done", "not_applicable"):
                problems.append(f"stage=launched but {name} is {w['status']}")

    # 4. anything past foundation must know WHAT it is building
    bp = state.get("blueprint")
    if not bp and STAGES.index(state["stage"]) >= STAGES.index("build"):
        problems.append("stage is build+ but no blueprint exists (org type / business functions / "
                        "WordPress decision undefined)")
    if bp and launched:
        # every core function must be carried by a workstream that actually completed
        for key, f in bp["functions"].items():
            if f["tier"] != "core":
                continue
            ws = f["workstream"]
            if ws in W and W[ws]["status"] not in ("done", "not_applicable"):
                problems.append(f"core function '{key}' ({f['title']}) is undelivered — "
                                f"{ws} is {W[ws]['status']}")

    if problems:
        print("CHECK: not clean:")
        for p in problems:
            print(f"  - {p}")
        die("definition-of-done check found problems.", EX_GUARD)
    done_ct = sum(1 for w in W.values() if w["status"] == "done")
    print(f"CHECK ok: stage={state['stage']}, {done_ct}/{len(W)} workstreams done, "
          f"consent chain intact, no governance violations.")
    if bp:
        core = [k for k, v in bp["functions"].items() if v["tier"] == "core"]
        delivered = [k for k in core if W.get(bp["functions"][k]["workstream"], {}).get("status")
                     == "done"]
        print(f"          blueprint: {bp['org_label']} · site {bp['platform']['label']} "
              f"(WordPress: {'YES' if bp['platform']['wordpress_used'] else 'NO'}) · "
              f"{len(delivered)}/{len(core)} core functions delivered.")


# ===========================================================================
# Client Hub provisioning gate (operations_model: hub/hybrid)
# ===========================================================================

def _slugify(text: str) -> str:
    """Lowercase, hyphenated, ASCII-safe slug (stdlib only) — used to derive tenant_id
    from the business name. Never empty: falls back to 'tenant'."""
    out = []
    prev_dash = False
    for ch in (text or "").strip().lower():
        if ch.isalnum():
            out.append(ch)
            prev_dash = False
        elif not prev_dash:
            out.append("-")
            prev_dash = True
    return "".join(out).strip("-") or "tenant"


def cmd_provision_hub(args):
    """Emit the human gate that provisions a launched business into the multi-tenant
    Client Hub (turnkey/client-hub/) — the operations_model: 'hub'/'hybrid' deliverable.

    The engine NEVER calls the network and NEVER holds PROVISION_TOKEN or any other
    credential. It writes the exact curl steps + payload; the OPERATOR runs the curl by
    hand, from a shell where PROVISION_TOKEN is set. See turnkey/client-hub/README.md
    for the hub side (KV env vars, the /api/provision contract)."""
    idea = os.path.abspath(args.idea_folder)
    state = load_state(idea)

    prof = state.get("operating_profile")
    if not prof:
        die(
            "REFUSED: no operating profile is stamped on this launch — provisioning "
            "needs to know the operations model.\n"
            f"        Stamp one first:  turnkey profile \"{idea}\"",
            EX_GUARD,
        )

    ops_model = prof.get("operations_model")
    if ops_model not in ("hub", "hybrid"):
        print(f"provision-hub: operations_model='{ops_model}' — this launch runs on "
              "VOM's own systems, not the Client Hub. Nothing to provision. No-op.")
        return

    business = prof.get("business") or state.get("business") or os.path.basename(idea.rstrip("/"))
    tenant_id = _slugify(business)
    owner_email = args.owner or f"TODO(operator): fill in {business}'s owner email before running this"
    hub_url = (args.hub_url or DEFAULT_CLIENT_HUB_URL).rstrip("/")

    gates_dir = os.path.join(tk_dir(idea), "gates")
    os.makedirs(gates_dir, exist_ok=True)

    payload_name = "W6-provision-hub-payload.json"
    payload_path = os.path.join(gates_dir, payload_name)
    payload = {"tenant_id": tenant_id, "owner_email": owner_email, "operating_profile": prof}
    atomic_write_json(payload_path, payload)

    script_name = "W6-provision-hub.md"
    script_path = os.path.join(gates_dir, script_name)
    md = f"""# W6 — Provision the Client Hub for {business}

operations_model: **{ops_model}** — this business's client-hub deliverable lives in the
Turnkey Client Hub (multi-tenant), not a bespoke build. Provisioning it means calling the
hub's `/api/provision` endpoint with a token only the operator holds — Turnkey's agents
never see credentials and never make this call themselves.

## Before you run this
1. The Client Hub Vercel project (`client-hub`, {hub_url}) must have these env vars set:
   - `PROVISION_TOKEN` — a secret only the operator knows
   - `KV_REST_API_URL` + `KV_REST_API_TOKEN` — Vercel KV / Upstash Redis (REST shape);
     without this the hub stays in ephemeral/local-only mode and provisioning won't persist
   See turnkey/client-hub/README.md for both.
2. The payload has already been written for you:
   `{os.path.relpath(payload_path, idea)}`

## Run this (operator only — needs PROVISION_TOKEN in their shell)
```bash
cd "{gates_dir}"
curl -X POST "{hub_url}/api/provision" \\
  -H "x-provision-token: $PROVISION_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d @{payload_name}
```

## Payload (`{payload_name}`)
```json
{json.dumps(payload, indent=2, ensure_ascii=False)}
```

## What to paste back
Paste the full JSON response here (success body with the tenant's hub URL, or the error
body on failure) so this gate can be closed:

```
<paste response here>
```

## Closing this gate
Once provisioning succeeds:
```
python3 turnkey.py set "{idea}" --workstream W6_products --status gate_pending --actor-waiting VOM --note "hub provisioned: tenant_id={tenant_id}"
```
(or `--status done` once W6_products' own definition-of-done / consent criteria are met.)
"""
    with open(script_path, "w", encoding="utf-8") as f:
        f.write(md)

    # --- open the gate on W6_products (existing gate mechanism) --------------
    w6 = state["workstreams"]["W6_products"]
    note = (f"client-hub provisioning gate opened: tenant_id={tenant_id} hub={hub_url} "
            f"— see turnkey/gates/{script_name}")
    if w6["status"] == "done":
        # never regress a completed workstream — just record the gate + append a note.
        w6["note"] = ((w6.get("note") + "  ") if w6.get("note") else "") + note
    else:
        w6["status"] = "gate_pending"
        w6["actor_waiting"] = "VOM"
        w6["note"] = note
    w6["gate"] = {
        "action": f"provision Client Hub tenant for {business}",
        "actor": "VOM",
        "channel": "in-session",
        "script": os.path.relpath(script_path, idea),
        "opened_at": now_iso(),
    }
    w6["updated"] = now_iso()
    save_state(idea, state)

    _log_decision(idea, "gate_open", {"workstream": "W6_products", "actor": "VOM",
                                      "action": w6["gate"]["action"], "channel": "in-session"})
    _log_decision(idea, "provision_hub", {
        "tenant_id": tenant_id, "owner_email": owner_email, "hub_url": hub_url,
        "operations_model": ops_model,
        "script": os.path.relpath(script_path, idea),
        "payload": os.path.relpath(payload_path, idea),
    })

    print(f"provision-hub gate opened for '{business}' (operations_model={ops_model})")
    print(f"  tenant_id : {tenant_id}")
    print(f"  owner     : {owner_email}")
    print(f"  hub       : {hub_url}")
    print(f"  script    : {os.path.relpath(script_path, idea)}")
    print(f"  payload   : {os.path.relpath(payload_path, idea)}")
    print("Next: the operator runs the curl in that script (needs PROVISION_TOKEN set), "
          "pastes the response back, then closes the W6_products gate.")


# ===========================================================================
# selftest — proves the engine runs a full cycle & enforces the invariants
# ===========================================================================

def cmd_build_platform(args):
    """BUILD the business platform this blueprint describes — the tangible output.

    Everything else in this engine tracks a launch. This writes one: a working,
    module-driven platform for the business, specialised to its org type and the
    functions its blueprint selected."""
    import base64
    import platform_gen

    idea = os.path.abspath(args.idea_folder)
    state = load_state(idea)
    logo = ""
    logo_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))))), "vom-logo.jpg")
    if os.path.exists(logo_path):
        with open(logo_path, "rb") as f:
            logo = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode("ascii")
    try:
        res = platform_gen.build(idea, state, logo, out_dir=args.out)
    except ValueError as e:
        die(str(e), EX_GUARD)

    _log_decision(idea, "platform_built", {"modules": res["modules"], "dir": res["dir"]})
    print(f"built the platform for '{res['business']['name']}'")
    print(f"  org type : {res['business']['org_label']}")
    print(f"  modules  : {', '.join(res['modules'])}")
    print(f"  folder   : {res['dir']}")
    print(f"  open     : {res['index']}")
    return res


def cmd_publish_platform(args):
    """Put this business's platform on the hub, so its owner can sign in from anywhere.

    Two halves: (1) install the shell into the hub deployment (one shell serves every
    tenant), and (2) register the tenant — business name, org type, module list, owner
    email — so the hub knows what to render and whose records to load.

    The provisioning token is the operator's; it is read from PROVISION_TOKEN in the
    environment and never handled by an agent."""
    import base64
    import json as _json
    import urllib.error
    import urllib.request
    import platform_gen

    idea = os.path.abspath(args.idea_folder)
    state = load_state(idea)
    if not state.get("blueprint"):
        die("no blueprint yet — decide the org type and functions first", EX_GUARD)

    logo = ""
    logo_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))))), "vom-logo.jpg")
    if os.path.exists(logo_path):
        with open(logo_path, "rb") as f:
            logo = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode("ascii")

    # (1) the shell the hub serves — written into the hub source tree
    hub_dir = args.hub_dir or os.path.join(os.path.dirname(os.path.dirname(
        os.path.dirname(os.path.abspath(__file__)))), "client-hub")
    lib = os.path.join(hub_dir, "api", "_lib")
    if os.path.isdir(lib):
        with open(os.path.join(lib, "platform-shell.js"), "w", encoding="utf-8") as f:
            f.write(platform_gen.shell_module(logo))
        print(f"shell installed  : {os.path.join(lib, 'platform-shell.js')}")
    else:
        print(f"NOTE: no hub source at {hub_dir} — skipped installing the shell")

    if not args.owner_email:
        print("\nNo --owner-email given, so the tenant was not registered.")
        print("Re-run with the owner's address to finish:")
        print(f'  turnkey publish-platform "{idea}" --owner-email owner@example.com')
        return

    payload = platform_gen.tenant_payload(idea, state, args.owner_email)

    # (2) register the tenant on the hub
    base = (args.hub_url or os.environ.get("TURNKEY_HUB_URL")
            or "https://vom-client-hub.vercel.app").rstrip("/")
    token = os.environ.get("PROVISION_TOKEN")
    if not token:
        gate = os.path.join(idea, "turnkey", "gates", "platform-provision.md")
        os.makedirs(os.path.dirname(gate), exist_ok=True)
        with open(gate, "w", encoding="utf-8") as f:
            f.write("# Gate — publish the platform\n\n"
                    "PROVISION_TOKEN is not in this environment, so the tenant was not "
                    "registered. Run this yourself (you hold the token):\n\n"
                    "```bash\ncurl -X POST " + base + "/api/provision \\\n"
                    "  -H 'Content-Type: application/json' \\\n"
                    "  -H \"x-provision-token: $PROVISION_TOKEN\" \\\n"
                    "  -d '" + _json.dumps(payload) + "'\n```\n")
        print(f"\nPROVISION_TOKEN not set — wrote the exact request to {gate}")
        return

    req = urllib.request.Request(base + "/api/provision", method="POST",
                                 data=_json.dumps(payload).encode("utf-8"),
                                 headers={"Content-Type": "application/json",
                                          "x-provision-token": token})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            body = _json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        die(f"the hub refused the registration: HTTP {e.code} {e.read().decode('utf-8')[:200]}", EX_GUARD)
    except Exception as e:
        die(f"could not reach the hub: {e}", EX_GUARD)

    _log_decision(idea, "platform_published", {"tenant": body.get("tenant_id"),
                                               "owner": args.owner_email, "hub": base,
                                               "modules": payload["operating_profile"]["platform_modules"]})
    print(f"\npublished '{payload['operating_profile']['business_name']}' to the hub")
    print(f"  tenant   : {body.get('tenant_id')}")
    print(f"  modules  : {', '.join(payload['operating_profile']['platform_modules'])}")
    print(f"  owner    : {args.owner_email}")
    print(f"  they open: {base}/app   (sign in with a magic link — no password)")
    print("\nRedeploy the hub for the shell to take effect:  cd client-hub && vercel deploy --prod --yes")


# ===========================================================================
# FORGE — the automatable spec, and the runner that executes it unattended
# ===========================================================================

def cmd_archetypes(args):
    """The platform archetypes: what each forge builds, before any launch exists."""
    import archetypes
    if args.json:
        print(json.dumps({"archetypes": archetypes.ARCHETYPES,
                          "org_type_map": archetypes.ORG_TYPE_MAP,
                          "sections": archetypes.SECTION_KINDS}, indent=2, ensure_ascii=False))
    else:
        print(archetypes.render_catalog())


def cmd_brand(args):
    """The branding milestone on the command line.

    With no `--kit` it lists the library and says which kit this business currently
    builds under; with one it writes the three brand files. Same three files the console
    writes, from the same library — the CLI and the factory cannot drift because neither
    owns the kits."""
    import brand_kits

    if args.list or not args.idea_folder:
        for k in brand_kits.KITS:
            mark = "*" if k["house"] else " "
            print(f"{mark} {k['id']:20} {k['name']:22} {k['family']:12} "
                  f"{k.get('scheme', 'light'):5} {k['type']['preset']:9} "
                  f"{k['primary']}  {k['best_for']}")
        print()
        print("* = the default for an archetype; it reproduces that archetype's own "
              "colours exactly.")
        return

    idea = args.idea_folder
    state = load_state(idea)
    import archetypes
    org_type = (state.get("blueprint") or {}).get("org_type") or args.org_type or ""
    aid = archetypes.ORG_TYPE_MAP.get(org_type, "generic")

    if not args.kit:
        cur = brand_kits.read_choice(idea)
        kit, source = brand_kits.resolve(cur.get("kit", ""), aid)
        print(f"{kit['name']} ({kit['id']}) — {source}")
        print(f"  accent {kit['primary']} · {kit['type']['preset']} type · "
              f"{kit.get('scheme', 'light')} ground")
        if source != "chosen":
            print("  nothing has been chosen; this is the default for "
                  f"'{aid}'. Choose with --kit <id>.")
        return

    kit = brand_kits.by_id(args.kit)
    if not kit:
        raise SystemExit(f"no such brand kit: {args.kit}. Run `turnkey brand --list`.")

    bad = brand_kits.audit(kit)
    if bad:
        raise SystemExit("that kit fails its own contrast check:\n  " + "\n  ".join(bad))

    # `state["business"]` is the name, a string — not a record. Reading it as a dict is
    # how this crashed the one-shot forge path on its first real run.
    biz = state.get("business")
    name = (biz if isinstance(biz, str) else (biz or {}).get("name")) \
        or os.path.basename(os.path.abspath(idea).rstrip("/"))
    label = archetypes.ARCHETYPES[aid]["label"]

    brand_kits.write_choice(idea, kit, aid, chosen_by=args.actor,
                            at=datetime.now(timezone.utc).replace(microsecond=0)
                            .isoformat().replace("+00:00", "Z"))
    os.makedirs(os.path.join(idea, "turnkey"), exist_ok=True)
    md = os.path.join(idea, *brand_kits.MANUAL_REL.split("/"))
    html_p = os.path.join(idea, *brand_kits.MANUAL_HTML_REL.split("/"))
    with open(md, "w", encoding="utf-8") as f:
        f.write(brand_kits.manual_md(kit, name, label))
    with open(html_p, "w", encoding="utf-8") as f:
        f.write(brand_kits.manual_html(kit, name, label))

    print(f"{kit['name']} applied to {name}.")
    for p in (brand_kits.CHOICE_REL, brand_kits.MANUAL_REL, brand_kits.MANUAL_HTML_REL):
        print("  wrote", p)
    print("  recompile the spec (`turnkey spec … --save`) for the build to pick it up.")


def _compile_spec(idea, state, args):
    """Compile the platform spec for this launch from the current flags."""
    import spec as spec_mod
    return spec_mod.compile_spec(
        idea, state,
        target=getattr(args, "target", "local") or "local",
        archetype_override=getattr(args, "archetype", None),
        hub_url=getattr(args, "hub_url", None),
        domain=getattr(args, "domain", None),
        hub_link=_hub_link(args),
    )


def _hub_link(args):
    """The 'part of something bigger' route home, or nothing.

    A label without a URL is decoration, so both are required together."""
    url = (getattr(args, "hub_link", None) or "").strip()
    if not url:
        return None
    return {"url": url,
            "label": (getattr(args, "hub_label", None) or "").strip() or "All the ideas",
            "note": (getattr(args, "hub_note", None) or "").strip()}


def _authorize_unattended(idea, state, args):
    """Log the one YES that covers an entire unattended run, then stamp it into state.

    Turnkey's rule does not bend for automation: a publish needs a logged YES that
    existed *before* the action. What changes for an unattended build is only the
    granularity — one prior, scoped, enumerated authorization for the whole run instead
    of a person answering eleven prompts while a machine waits."""
    target = args.target or "local"
    scope = (f"unattended forge build + deploy to '{target}' for this business, "
             "limited to: composing the platform modules, writing the public site, "
             "wiring rails that already have credentials, publishing the result, and — "
             "for a hosting target that gates new projects behind a login — making that "
             "one deployment publicly reachable. Does not authorize sending email, "
             "charging anyone, or posting to any channel.")
    action = f"AUTHORIZE an unattended Forge run that builds and deploys to '{target}'"
    rec = append_consent(idea, "W4_website", action, args.actor,
                         args.channel or "operator console", "YES",
                         evidence=args.evidence, scope=scope)
    state["forge_authorization"] = {
        "mode": "unattended",
        "targets": sorted(set((state.get("forge_authorization") or {}).get("targets", [])
                              + [target])),
        "scope": scope,
        "consent_ref": rec["hash"][:16],
        "consent_seq": rec["seq"],
        "granted_by": args.actor,
        "granted_at": rec["ts"],
        "channel": rec["channel"],
    }
    save_state(idea, state)
    _log_decision(idea, "forge_authorized", {"target": target, "actor": args.actor,
                                             "consent": rec["hash"][:16]})
    print(f"unattended run authorized for target '{target}' "
          f"(consent [{rec['seq']}] {rec['hash'][:16]}…)")
    print("  scope:", scope)
    print()


def cmd_spec(args):
    """Compile the blueprint into the automatable platform spec Forge executes."""
    import spec as spec_mod

    idea = os.path.abspath(args.idea_folder)
    state = load_state(idea)

    if args.authorize_unattended:
        if args.actor not in ("VOM", "CLIENT"):
            die("--actor must be VOM or CLIENT (an authorization is a human decision)", EX_USAGE)
        _authorize_unattended(idea, state, args)
        state = load_state(idea)

    sp = _compile_spec(idea, state, args)

    if args.save:
        with open(spec_path(idea), "w", encoding="utf-8") as f:
            json.dump(sp, f, indent=2, ensure_ascii=False)
            f.write("\n")
        with open(spec_doc_path(idea), "w", encoding="utf-8") as f:
            f.write(spec_mod.render_markdown(sp))
        _log_decision(idea, "platform_spec", {
            "archetype": sp["archetype"]["id"], "target": sp["deploy"]["target"],
            "modules": [m["key"] for m in sp["modules"]],
            "pages": len(sp["site"]["pages"]), "ready": sp["readiness"]["ready"],
            "fingerprint": sp["fingerprint"],
        })
        print(f"spec saved -> {os.path.relpath(spec_path(idea), idea)}"
              f" (+ {os.path.basename(spec_doc_path(idea))})")
        print()

    if args.json:
        print(json.dumps(sp, indent=2, ensure_ascii=False))
    else:
        print(spec_mod.render_text(sp))
        if not args.save:
            print("\n(preview only — re-run with --save to make it the build order)")
    if not sp["readiness"]["ready"] and args.strict:
        sys.exit(EX_GUARD)


def _scaffold_new_business(args) -> str:
    """Create a business folder from nothing but a name — the fast path.

    A platform should be initiable in the time it takes to describe it. This writes the
    minimum a launch needs (`business-idea.md`), and the rest of the chain — init,
    blueprint, spec, build — runs straight through it without stopping."""
    root = args.into or DEFAULT_IDEAS_ROOT
    idea = os.path.join(root, args.new)
    if os.path.exists(idea) and not args.reuse:
        die(f"'{idea}' already exists — pass --reuse to build in it", EX_USAGE)
    os.makedirs(idea, exist_ok=True)
    p = os.path.join(idea, "business-idea.md")
    if not os.path.exists(p):
        about = args.about or f"{args.new} — a {args.org_type or 'business'}."
        with open(p, "w", encoding="utf-8") as f:
            f.write(f"""# {args.new}

## Offer
{about}

## Niche / Positioning
{args.new}{(' in ' + args.city) if args.city else ''}.

## Organization
{args.new} is a {args.org_type or 'business'}{(' based in ' + args.city) if args.city else ''}.
{('Contact: ' + args.email) if args.email else ''}

## Pricing
On request.
""")
    return idea


def cmd_forge(args):
    """Build and deploy the platform this spec describes, with nobody in the loop."""
    import forge
    import spec as spec_mod

    if not args.new and not args.idea_folder:
        die("say which business to build: either an existing folder, or "
            '--new "<Business Name>" --org-type <type>', EX_USAGE)

    # --- the fast path: name a business, get a platform ---------------------
    if args.new:
        idea = _scaffold_new_business(args)
        print(f"business folder: {idea}")
        init_args = argparse.Namespace(idea_folder=idea, name=args.new, reset=False,
                                       throttle=3, allow_missing_idea=False,
                                       operator=getattr(args, "operator", None))
        cmd_init(init_args)
        print()
    else:
        idea = os.path.abspath(args.idea_folder)

    state = load_state(idea)

    # --- the blueprint, made if it is missing and the org type is known -----
    if not state.get("blueprint"):
        if not args.org_type:
            die("no blueprint for this business yet. Either run "
                f'`turnkey blueprint "{idea}" --org-type <type> --save` first, or pass '
                "--org-type here and Forge will decide it in place.", EX_GUARD)
        bp_args = argparse.Namespace(org_type=args.org_type,
                                     operator=getattr(args, "operator", None))
        bp, op = _make_blueprint(idea, state, bp_args)
        _save_blueprint(idea, state, bp, op)
        state = load_state(idea)
        print(f"blueprint: {bp['org_label']} · {bp['platform']['label']}")

    # --- the brand kit, if this run names one -------------------------------
    # The branding milestone, on the one-shot path. Forge will resolve a kit either way —
    # the archetype's default when nothing is on disk — so this exists to let an unattended
    # run *choose*, and to leave the manual behind while it is at it.
    if getattr(args, "kit", None):
        import brand_kits
        _k = brand_kits.by_id(args.kit)
        if not _k:
            die(f"no such brand kit: {args.kit}. Run `turnkey brand --list`.", EX_USAGE)
        cmd_brand(argparse.Namespace(
            idea_folder=idea, kit=args.kit, list=False,
            org_type=args.org_type or "", actor=getattr(args, "actor", "VOM")))
        print()

    # --- authorization, if this run is being authorized right now -----------
    if args.authorize_unattended:
        if args.actor not in ("VOM", "CLIENT"):
            die("--actor must be VOM or CLIENT (an authorization is a human decision)", EX_USAGE)
        _authorize_unattended(idea, state, args)
        state = load_state(idea)

    # --- compile, and refuse early rather than half-way through ------------
    sp = _compile_spec(idea, state, args)
    if args.owner_email:
        sp["deploy"]["owner_email"] = args.owner_email
        sp["fingerprint"] = spec_mod.fingerprint(sp)
    with open(spec_path(idea), "w", encoding="utf-8") as f:
        json.dump(sp, f, indent=2, ensure_ascii=False)
    with open(spec_doc_path(idea), "w", encoding="utf-8") as f:
        f.write(spec_mod.render_markdown(sp))

    if not sp["readiness"]["ready"]:
        print(spec_mod.render_text(sp))
        die("Forge will not run an unready spec. Nothing was built.", EX_GUARD)

    resume_from = forge.load_latest(idea) if args.resume else None
    cue = forge.TerminalCue(sys.stdout, sp["archetype"].get("forge", {})) if not args.quiet else None

    if args.watch:
        import forge_watch
        run = forge_watch.serve(idea, sp, port=args.port, open_browser=not args.no_open,
                                dry_run=args.dry_run, terminal_cue=cue)
    else:
        run = forge.execute(idea, sp, cue=cue, dry_run=args.dry_run, resume_from=resume_from)

    _log_decision(idea, "forge_run", {
        "run": run.id, "outcome": run.outcome, "target": sp["deploy"]["target"],
        "archetype": sp["archetype"]["id"], "fingerprint": sp["fingerprint"],
        "elapsed": round(run.snapshot()["elapsed"], 2),
        "url": run.artifacts.get("url", ""),
    })

    if args.console and run.outcome != "running":
        import forge_watch
        out = forge_watch.replay(idea, run.dir, open_browser=not args.no_open)
        print(f"console: file://{out}")

    if run.outcome == "failed":
        sys.exit(EX_GUARD)


def cmd_forge_console(args):
    """Open the visual console for a finished run — the same cues, after the fact."""
    import forge_watch
    idea = os.path.abspath(args.idea_folder)
    try:
        out = forge_watch.replay(idea, args.run_dir, open_browser=not args.no_open)
    except FileNotFoundError as e:
        die(str(e), EX_USAGE)
    print(f"console: file://{out}")


def service_auth_path() -> str:
    """Operator-level, not per-business: one grant covering the whole service."""
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "service-authorization.json")


def load_service_auth() -> dict:
    p = service_auth_path()
    if not os.path.exists(p):
        return {}
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except ValueError:
        return {}


def cmd_authorize_service(args):
    """Grant ONE standing authorization covering every business the service launches.

    A service where the human only ideates cannot ask for consent per run — there is
    nobody in the loop to ask. So the grant moves up a level: the operator authorizes the
    *service*, once, over a declared scope and a declared set of targets. Every business
    it later launches still gets its own consent line on its own hash-chained log, but
    that line cites this grant as its evidence instead of a click.

    What does NOT move: the scope is still enumerated, the grant is still revocable
    (delete the file), and nothing outside the declared targets is covered."""
    if args.revoke:
        p = service_auth_path()
        if os.path.exists(p):
            os.remove(p)
            print("standing service authorization REVOKED — the service can no longer "
                  "publish. Existing deployments are untouched.")
        else:
            print("no standing authorization on file.")
        return

    if args.actor not in ("VOM", "CLIENT"):
        die("--actor must be VOM or CLIENT (a grant is a human decision)", EX_USAGE)
    targets = _csv(args.targets) or ["vercel"]
    for t in targets:
        if t not in ("local", "hub", "vercel"):
            die(f"unknown target '{t}'", EX_USAGE)

    scope = (args.scope or
             "unattended build and deploy of any business submitted through this service, "
             "to the targets listed. Covers: composing the platform modules, writing the "
             "public site and the prelaunch funnel, wiring rails that already have "
             "credentials, publishing the result, and making those deployments publicly "
             "reachable. Does NOT cover sending email, charging anyone, posting to any "
             "channel, or registering a domain.")
    rec = {
        "schema": 1,
        "mode": "standing",
        "granted_by": args.actor,
        "granted_at": now_iso(),
        "channel": args.channel or "operator console",
        "targets": targets,
        "scope": scope,
        "operator": (load_operator(args.operator) or {}).get("operator", {}).get("id"),
    }
    rec["hash"] = sha(canonical(rec))
    with open(service_auth_path(), "w", encoding="utf-8") as f:
        json.dump(rec, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"standing service authorization GRANTED by {args.actor}")
    print(f"  targets : {', '.join(targets)}")
    print(f"  ref     : {rec['hash'][:16]}")
    print(f"  file    : {service_auth_path()}")
    print("\n  Every business the service launches appends its own consent line citing")
    print("  this grant. Revoke with:  turnkey authorize-service --revoke")


def cmd_factory(args):
    """The platform factory — minimal forms in a set order, each leaving a real artifact.

    Every milestone here is a file on disk or a URL that answers, and the next stage reads
    it. Nothing prints a command for a person to run."""
    import factory
    root = args.ideas_folder or DEFAULT_IDEAS_ROOT
    if not os.path.isdir(root):
        die(f"ideas folder does not exist: {root}", EX_USAGE)
    factory.serve(root, port=args.port, open_browser=not args.no_open)


def cmd_wizard(args):
    """Open the guided wizard: one command instead of a session of them.

    The wizard never reimplements a rule — it shells out to this same engine, so every
    gate, refusal and consent guard applies exactly as it does on the command line."""
    import wizard  # local module, next to this file
    root = args.ideas_folder or DEFAULT_IDEAS_ROOT
    wizard.serve(root, port=args.port, open_browser=not args.no_open)


def cmd_selftest(args):
    import tempfile, shutil, subprocess
    tmp = tempfile.mkdtemp(prefix="turnkey-selftest-")
    idea = os.path.join(tmp, "Demo Idea")
    os.makedirs(idea)
    with open(os.path.join(idea, "business-idea.md"), "w") as f:
        f.write("# Demo\nA test idea.\n")

    me = os.path.abspath(__file__)

    def run(*a, expect=0):
        r = subprocess.run([sys.executable, me, *a], capture_output=True, text=True)
        if r.returncode != expect:
            print(r.stdout); print(r.stderr)
            raise AssertionError(f"expected exit {expect}, got {r.returncode} for: {' '.join(a)}")
        return r

    failures = []
    try:
        # init + resume idempotency
        run("init", idea)
        run("init", idea)  # resume, must not clobber
        assert os.path.exists(state_path(idea)), "state not created"

        # GATE ENFORCEMENT: cannot mark a consent-required ws done without YES
        run("set", idea, "--workstream", "W4_website", "--status", "done", expect=EX_GUARD)

        # intake cannot be done without profile present
        run("set", idea, "--workstream", "intake", "--status", "done", expect=EX_GUARD)
        with open(profile_path(idea), "w") as f:
            f.write("# profile\n")
        # still can't: intake requires a terms YES (requires_consent)
        run("set", idea, "--workstream", "intake", "--status", "done", expect=EX_GUARD)
        # log the terms YES, then it passes
        run("consent", idea, "--workstream", "intake", "--action", "accept terms",
            "--actor", "CLIENT", "--channel", "magic-link", "--decision", "YES",
            "--evidence", "token abc tapped YES", "--scope", "terms")
        run("set", idea, "--workstream", "intake", "--status", "done")

        # append-only tamper detection
        run("consent", idea, "--workstream", "W4_website", "--action", "go live",
            "--actor", "VOM", "--channel", "in-session", "--decision", "YES",
            "--evidence", "operator said go", "--scope", "this deploy")
        run("verify", idea)
        # now tamper: rewrite a consent line's action, verify must FAIL
        cp = consent_path(idea)
        with open(cp) as f:
            data = [json.loads(x) for x in f if x.strip()]
        data[0]["action"] = "TAMPERED"
        with open(cp, "w") as f:
            for d in data:
                f.write(canonical(d) + "\n")
        run("verify", idea, expect=EX_INTEGRITY)

        # ---- BLUEPRINT: functions + platform must be decided before building ----
        # W10_crm needs no consent, so this isolates the blueprint guard.
        run("set", idea, "--workstream", "W10_crm", "--status", "done", expect=EX_GUARD)
        # the demo text is unclassifiable -> saving must refuse rather than guess
        run("blueprint", idea, "--save", expect=EX_GUARD)
        run("blueprint", idea)  # preview without --save is always allowed
        run("blueprint", idea, "--org-type", "church", "--save")
        st = json.load(open(state_path(idea)))
        assert st["blueprint"]["org_type"] == "church", "org type not stamped"
        assert st["blueprint"]["platform"]["wordpress_used"] is True, \
            "a church should land on WordPress by default"
        for must in ("crm", "finance_admin", "donations", "media_library"):
            assert must in st["blueprint"]["functions"], f"church blueprint missing {must}"
        assert os.path.exists(blueprint_path(idea)), "blueprint.md not written"
        run("set", idea, "--workstream", "W10_crm", "--status", "done")  # now allowed

        # a SaaS must NOT be pushed onto WordPress
        r = run("blueprint", idea, "--org-type", "saas", "--json")
        saas = json.loads(r.stdout)
        assert saas["platform"]["decision"] == "vercel_app", "saas should not resolve to WordPress"
        assert "custom_app" in saas["functions"], "saas blueprint missing the application itself"

        # operator override of the platform is honoured + re-resolves implementations
        run("platform", idea, "--value", "hybrid", "--reason", "owner insists on self-editing")
        st = json.load(open(state_path(idea)))
        assert st["blueprint"]["platform"]["decision"] == "hybrid", "platform override not applied"
        assert st["blueprint"]["platform"]["source"] == "operator"
        # function overrides survive and cannot strip a universal core function
        run("functions", idea, "--add", "courses_lms")
        st = json.load(open(state_path(idea)))
        assert st["blueprint"]["functions"]["courses_lms"]["tier"] == "core"
        assert st["blueprint"]["platform"]["decision"] == "hybrid", "override lost on re-resolve"
        run("functions", idea, "--remove", "crm", expect=EX_USAGE)

        # ---- OPERATING PROFILE: a launch run DRIVEN by business-operating-profile.json ----
        idea2 = os.path.join(tmp, "Demo Idea Profile")
        os.makedirs(idea2)
        with open(os.path.join(idea2, "business-idea.md"), "w") as f:
            f.write("# Demo Profile\nA profile-driven test idea.\n")
        profile = {
            "business": "Profile Demo Co", "tagline": "Testing the operating profile.",
            "org_type": "saas", "stack": "app",
            "domain": {"mode": "subdomain", "value": "profile-demo"},
            "pages": ["home", "pricing"],
            "payments": {"stripe": False, "subscriptions": False, "ideal": False,
                        "donations": False, "currency": "EUR"},
            "features": ["crm", "forms"],
            "publications": {"engage_ai": True, "content_studio": False, "social_swarm": False,
                             "lead_outreach": False, "channels": ["instagram"]},
            "operations_model": "hub",
            "client_hub": ["crm", "reports"],
        }
        with open(os.path.join(idea2, "business-operating-profile.json"), "w") as f:
            json.dump(profile, f)

        run("init", idea2)  # init must pick the profile up automatically
        st2 = json.load(open(state_path(idea2)))
        assert st2.get("operating_profile"), "init did not stamp operating_profile"
        assert st2["operating_profile"]["stack"] == "app", "stack not recorded"
        assert st2["operating_profile"]["org_type"] == "saas", "org_type not recorded"
        assert st2["operating_profile"]["platform"] == "vercel_app", "stack->platform mapping wrong"
        assert not st2["operating_profile"]["divergence"], \
            "saas + stack=app should NOT diverge from the saas blueprint default"
        assert st2["workstreams"]["W5_payments"]["status"] == "not_applicable", \
            "payments.stripe=false must set W5_payments not_applicable"
        assert "client-hub" in (st2["workstreams"]["W6_products"].get("note") or ""), \
            "hub operations_model must flag a client-hub deliverable on W6"

        # the explicit `profile` subcommand must be idempotent
        run("profile", idea2)
        run("profile", idea2)
        st2b = json.load(open(state_path(idea2)))
        assert st2b["operating_profile"]["stack"] == "app", "profile command not idempotent"
        assert st2b["workstreams"]["W5_payments"]["status"] == "not_applicable", \
            "re-running profile must not clobber the not_applicable configuration"

        # PROFILE WINS: force a divergence (a church pushed onto a custom app) and prove the
        # profile beats blueprints.py's own org-type recommendation, with the divergence logged
        idea3 = os.path.join(tmp, "Demo Idea Divergence")
        os.makedirs(idea3)
        with open(os.path.join(idea3, "business-idea.md"), "w") as f:
            f.write("# Demo Divergence\n")
        div_profile = dict(profile)
        div_profile["org_type"] = "church"
        div_profile["stack"] = "app"  # churches default to WordPress -> forces a divergence
        div_profile["payments"] = {"stripe": True, "subscriptions": False, "ideal": True,
                                   "donations": True, "currency": "EUR"}
        div_profile["operations_model"] = "vom"
        with open(os.path.join(idea3, "business-operating-profile.json"), "w") as f:
            json.dump(div_profile, f)
        run("init", idea3)
        st3 = json.load(open(state_path(idea3)))
        assert st3["operating_profile"]["divergence"], \
            "church + stack=app must be flagged as diverging from the WordPress default"
        assert st3["operating_profile"]["divergence"]["blueprint_recommendation"] == "wordpress"
        assert st3["workstreams"]["W5_payments"]["status"] != "not_applicable", \
            "payments.stripe=true must leave W5_payments alone"
        run("blueprint", idea3, "--org-type", "church", "--save")
        st3b = json.load(open(state_path(idea3)))
        assert st3b["blueprint"]["platform"]["decision"] == "vercel_app", \
            "PROFILE WINS: blueprint platform must follow the profile's stack, not the org-type default"
        assert st3b["blueprint"]["platform"]["source"] == "operating_profile"

        # an invalid profile must be reported clearly and refused, not silently accepted
        idea4 = os.path.join(tmp, "Demo Idea Bad Profile")
        os.makedirs(idea4)
        with open(os.path.join(idea4, "business-idea.md"), "w") as f:
            f.write("# Bad\n")
        with open(os.path.join(idea4, "business-operating-profile.json"), "w") as f:
            json.dump({"business": "Bad Co"}, f)  # missing required keys
        run("init", idea4)  # init must not fail hard on a bad profile...
        st4 = json.load(open(state_path(idea4)))
        assert not st4.get("operating_profile"), "an invalid profile must not be stamped"
        run("profile", idea4, expect=EX_GUARD)  # ...but `profile` must refuse it explicitly

        # ---- PROVISION-HUB: the Client Hub gate for operations_model hub/hybrid ----
        # `idea` (the very first demo folder) never got an operating profile stamped —
        # provisioning must refuse cleanly rather than guess an operations model.
        run("provision-hub", idea, expect=EX_GUARD)

        # `idea2` is operations_model=hub — must open a real gate, write the script +
        # payload, and log a provision_hub decision.
        gate_md = os.path.join(tk_dir(idea2), "gates", "W6-provision-hub.md")
        gate_payload = os.path.join(tk_dir(idea2), "gates", "W6-provision-hub-payload.json")
        run("provision-hub", idea2, "--owner", "owner@example.com", "--hub-url",
            "https://example-hub.vercel.app/")
        assert os.path.exists(gate_md), "provision-hub did not write the gate script"
        assert os.path.exists(gate_payload), "provision-hub did not write the payload JSON"
        payload = json.load(open(gate_payload))
        assert payload["tenant_id"] == "profile-demo-co", \
            f"tenant_id not slugified from business name (got {payload['tenant_id']!r})"
        assert payload["owner_email"] == "owner@example.com", "--owner not honoured"
        assert payload["operating_profile"]["org_type"] == "saas"
        with open(gate_md) as f:
            gate_text = f.read()
        assert "https://example-hub.vercel.app/api/provision" in gate_text, \
            "--hub-url override not reflected in the curl command (no trailing slash)"
        assert "x-provision-token: $PROVISION_TOKEN" in gate_text, "curl header missing"
        st2c = json.load(open(state_path(idea2)))
        assert st2c["workstreams"]["W6_products"]["status"] == "gate_pending", \
            "provision-hub must open a gate on W6_products"
        assert st2c["workstreams"]["W6_products"]["actor_waiting"] == "VOM"
        assert "W6-provision-hub.md" in st2c["workstreams"]["W6_products"]["gate"]["script"]
        decisions = [json.loads(x) for x in open(decision_path(idea2)) if x.strip()]
        assert any(d["kind"] == "provision_hub" and d["data"]["tenant_id"] == "profile-demo-co"
                   for d in decisions), "provision_hub decision-log entry missing"

        # ---- FORGE: the automatable spec and the unattended builder ----------
        # A spec must refuse to be built until every decision is resolved, and Forge must
        # refuse the spec rather than produce a half-decided platform.
        idea5 = os.path.join(tmp, "Forge Church")
        run("forge", "--new", "Forge Church", "--into", tmp, "--reuse",
            "--org-type", "church", "--city", "Amersfoort",
            "--email", "hello@forgechurch.example",
            "--about", "A church with weekly Sunday services, giving and events.",
            "--target", "local", "--no-open", "--quiet")

        sp5 = json.load(open(spec_path(idea5)))
        assert sp5["schema"] == "apb/1", "spec schema"
        assert sp5["readiness"]["ready"], f"church spec not ready: {sp5['readiness']['blocking']}"
        assert sp5["archetype"]["id"] == "church", "a church must forge as CHURCHforge"
        assert sp5["archetype"]["forge"]["name"] == "CHURCHforge"
        assert sp5["archetype"]["forge"]["accent"] == "#F97316", "CHURCHforge is orange on black"
        assert any(m["key"] == "donations" for m in sp5["modules"]), \
            "the church archetype always builds giving"
        assert not any(m["key"] == "product_catalog" for m in sp5["modules"]), \
            "the church archetype never builds a product catalog"

        # the fingerprint must actually bind the contents
        import spec as _spec
        assert _spec.verify_fingerprint(sp5), "fingerprint does not match the spec it is on"
        tampered = json.loads(json.dumps(sp5))
        tampered["business"]["name"] = "Someone Else"
        assert not _spec.verify_fingerprint(tampered), "an edited spec must fail its fingerprint"

        # the build itself: every stage ran, every check passed, nothing was published
        latest5 = json.load(open(os.path.join(idea5, "forge", "latest.json")))
        rec5 = json.load(open(latest5["state"]))
        assert rec5["outcome"] == "built", f"unexpected outcome {rec5['outcome']}"
        assert all(s["state"] in ("ok", "skipped") for s in rec5["stages"]), \
            "a stage did not complete: " + str([s["id"] for s in rec5["stages"]
                                                if s["state"] not in ("ok", "skipped")])
        assert rec5["checks"] and all(c["ok"] for c in rec5["checks"]), "a spec check failed"
        build5 = os.path.join(rec5["dir"], "build")
        for page in ("index.html", "visit.html", "give.html"):
            assert os.path.getsize(os.path.join(build5, page)) > 2000, f"{page} too small"
        with open(os.path.join(build5, "index.html")) as f:
            home5 = f.read()
        assert "{business}" not in home5 and "{city}" not in home5, \
            "an unresolved token reached a built page"
        assert "Amersfoort" in home5, "the profile's city never made it onto the page"

        # a solo business forges as BIZforge, with a different composition of the SAME modules
        idea6 = os.path.join(tmp, "Forge Studio")
        run("forge", "--new", "Forge Studio", "--into", tmp, "--reuse",
            "--org-type", "service_business", "--city", "Utrecht",
            "--email", "hi@forgestudio.example",
            "--about", "Fixed-price brand and web design. A brand kit for EUR 2.400.",
            "--target", "local", "--no-open", "--quiet")
        sp6 = json.load(open(spec_path(idea6)))
        assert sp6["archetype"]["id"] == "solo_business"
        assert sp6["archetype"]["forge"]["name"] == "BIZforge"
        assert sp6["archetype"]["forge"]["accent"] == "#38BDF8", "BIZforge is sky blue on black"
        assert not any(m["key"] == "donations" for m in sp6["modules"]), \
            "a solo business never builds giving"
        assert any(m["key"] == "finance_admin" for m in sp6["modules"]), \
            "a business that cannot invoice is not launched"

        # AUTHORIZATION: a public target is refused without a prior logged YES...
        r = run("spec", idea6, "--target", "vercel", "--strict", expect=EX_GUARD)
        assert "authorization" in (r.stdout + r.stderr).lower(), \
            "the refusal must name the missing authorization"
        run("forge", idea6, "--target", "vercel", "--no-open", "--quiet", expect=EX_GUARD)

        # ...and permitted once one exists, which is a real line on the consent chain.
        before = len(read_consent_lines(idea6))
        run("spec", idea6, "--target", "vercel", "--authorize-unattended",
            "--actor", "VOM", "--channel", "selftest", "--save")
        after = read_consent_lines(idea6)
        assert len(after) == before + 1, "authorizing must append exactly one consent line"
        assert after[-1]["decision"] == "YES" and after[-1]["workstream"] == "W4_website"
        run("verify", idea6)  # the chain must still verify after Forge wrote to it
        sp6b = json.load(open(spec_path(idea6)))
        assert sp6b["readiness"]["ready"], \
            f"authorized vercel spec still unready: {sp6b['readiness']['blocking']}"
        assert sp6b["authorization"]["mode"] == "unattended"
        assert sp6b["authorization"]["consent_ref"] == after[-1]["hash"][:16]

        # a dry run must build and check but never deploy
        run("forge", idea6, "--target", "vercel", "--dry-run", "--no-open", "--quiet")
        rec6 = json.load(open(json.load(
            open(os.path.join(idea6, "forge", "latest.json")))["state"]))
        assert rec6["outcome"] == "built"
        assert next(s for s in rec6["stages"] if s["id"] == "deploy")["state"] == "skipped", \
            "a dry run must not deploy"

        # the console replays a finished run with no server involved
        run("forge-console", idea6, "--no-open")
        assert os.path.exists(os.path.join(rec6["dir"], "console.html")), "no replay console"

        # `idea3` is operations_model=vom — a clean no-op, no gate, no state mutation.
        run("provision-hub", idea3)
        assert not os.path.exists(os.path.join(tk_dir(idea3), "gates", "W6-provision-hub.md")), \
            "operations_model=vom must NOT write a provisioning gate script"
        st3c = json.load(open(state_path(idea3)))
        assert st3c["workstreams"]["W6_products"]["status"] != "gate_pending", \
            "operations_model=vom must be a clean no-op (no gate opened)"

        print("\nSELFTEST PASSED: init/resume, gate enforcement, terms guard, "
              "append-only tamper detection, blueprint enforcement (org type -> functions + "
              "WordPress decision), operating-profile-driven init/profile (stamping, "
              "payments-off configuration, profile-wins reconciliation), provision-hub "
              "(hub/hybrid gate emission, vom no-op, missing-profile refusal), and FORGE "
              "(apb/1 spec readiness + fingerprint binding, CHURCHforge/BIZforge composition, "
              "unattended-run authorization refused then honoured on the consent chain, "
              "dry run never deploying, replay console) all hold.")
    except AssertionError as e:
        failures.append(str(e))
        print(f"\nSELFTEST FAILED: {e}")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    if failures:
        sys.exit(EX_INTEGRITY)


# ===========================================================================
# argparse wiring
# ===========================================================================

def build_parser():
    p = argparse.ArgumentParser(prog="turnkey", description="Turnkey launch-orchestrator engine.")
    sub = p.add_subparsers(dest="cmd", required=True)

    def add_idea(sp):
        sp.add_argument("idea_folder", help="path to the business idea folder")

    sp = sub.add_parser("init", help="scaffold turnkey/ and seed launch-state.json")
    add_idea(sp)
    sp.add_argument("--name", help="business display name (default: folder name)")
    sp.add_argument("--throttle", default="single", choices=["single", "parallel"],
                    help="blast-radius cap (D3); default single")
    sp.add_argument("--reset", action="store_true", help="reinitialize state (does NOT touch consent log)")
    sp.add_argument("--allow-missing-idea", action="store_true")
    sp.add_argument("--operator", help="path to an operator.json profile (white-label); default: orchestrator/operator.json or $TURNKEY_OPERATOR")
    sp.set_defaults(func=cmd_init)

    sp = sub.add_parser("status", help="print the launch frontier (resume primitive)")
    add_idea(sp)
    sp.add_argument("--json", action="store_true")
    sp.set_defaults(func=cmd_status)

    sp = sub.add_parser("set", help="update a workstream status (enforces gates)")
    add_idea(sp)
    sp.add_argument("--workstream", required=True)
    sp.add_argument("--status", required=True)
    sp.add_argument("--actor-waiting", dest="actor_waiting")
    sp.add_argument("--blocked-by", dest="blocked_by")
    sp.add_argument("--note")
    sp.set_defaults(func=cmd_set)

    sp = sub.add_parser("gate", help="open a human gate (-> gate_pending)")
    add_idea(sp)
    sp.add_argument("--workstream", required=True)
    sp.add_argument("--actor", required=True, help="VOM or CLIENT")
    sp.add_argument("--action", required=True, help="what the human must do")
    sp.add_argument("--channel", default="in-session")
    sp.add_argument("--script-file", dest="script_file", help="path to the 'do this now' gate script")
    sp.set_defaults(func=cmd_gate)

    sp = sub.add_parser("consent", help="append a YES/NO to the append-only consent log")
    add_idea(sp)
    sp.add_argument("--workstream", required=True)
    sp.add_argument("--action", required=True)
    sp.add_argument("--actor", required=True, help="VOM or CLIENT")
    sp.add_argument("--channel", required=True, help="magic-link | whatsapp | in-session | ...")
    sp.add_argument("--decision", required=True, help="YES or NO (verbatim)")
    sp.add_argument("--evidence", default="", help="proof (token tapped, operator quote, ...)")
    sp.add_argument("--scope", default="", help="scope of this consent (this batch/deploy only)")
    sp.set_defaults(func=cmd_consent)

    sp = sub.add_parser("verify", help="recompute the consent hash-chain (tamper check)")
    add_idea(sp)
    sp.set_defaults(func=cmd_verify)

    sp = sub.add_parser("log", help="print the consent log")
    add_idea(sp)
    sp.set_defaults(func=cmd_log)

    sp = sub.add_parser("matrix", help="read/set the platform-bootstrap gate matrix")
    add_idea(sp)
    sp.add_argument("--key")
    sp.add_argument("--value")
    sp.set_defaults(func=cmd_matrix)

    sp = sub.add_parser("operator", help="show the operator identity this run is branded under (white-label)")
    add_idea(sp)
    sp.add_argument("--operator", help="path to an operator.json to (re)read")
    sp.add_argument("--refresh", action="store_true", help="re-read the profile and overwrite state.operator")
    sp.add_argument("--json", action="store_true", help="emit identity + brand + platform (for agent briefs)")
    sp.set_defaults(func=cmd_operator)

    sp = sub.add_parser("blueprint", help="define the business functions + WordPress-or-app decision from the org type")
    add_idea(sp)
    sp.add_argument("--org-type", dest="org_type",
                    help="force the org type: " + " | ".join(blueprints.ORG_TYPES))
    sp.add_argument("--add", help="extra function keys to force in (comma-separated)")
    sp.add_argument("--remove", help="function keys to drop (comma-separated)")
    sp.add_argument("--reuse-overrides", dest="reuse_overrides", action="store_true",
                    help="keep the overrides already saved on this launch")
    sp.add_argument("--save", action="store_true", help="write blueprint.md + stamp launch-state")
    sp.add_argument("--json", action="store_true")
    sp.add_argument("--operator", help="path to an operator.json profile")
    sp.set_defaults(func=cmd_blueprint)

    sp = sub.add_parser("profile", help="load + validate business-operating-profile.json; "
                                        "stamp it into launch-state so the run is driven by it")
    add_idea(sp)
    sp.set_defaults(func=cmd_profile)

    sp = sub.add_parser("orgtypes", help="catalog: what each org type gets built (no idea folder needed)")
    sp.add_argument("--json", action="store_true")
    sp.set_defaults(func=cmd_orgtypes)

    sp = sub.add_parser("functions", help="list or override this launch's business functions")
    add_idea(sp)
    sp.add_argument("--add", help="function keys to add (comma-separated)")
    sp.add_argument("--remove", help="function keys to remove (comma-separated)")
    sp.add_argument("--operator")
    sp.set_defaults(func=cmd_functions)

    sp = sub.add_parser("platform", help="read or override the site platform (WordPress / app / hybrid)")
    add_idea(sp)
    sp.add_argument("--value", help="wordpress | vercel_app | hybrid")
    sp.add_argument("--reason", help="why (required with --value; goes in the audit trail)")
    sp.add_argument("--operator")
    sp.set_defaults(func=cmd_platform)

    sp = sub.add_parser("rebrand", help="white-label: scaffold a fresh operator profile for a new franchisee")
    sp.add_argument("path", help="where to write the new operator.json")
    sp.add_argument("--from-profile", dest="from_profile", help="clone an existing operator.json instead of a blank template")
    sp.add_argument("--force", action="store_true", help="overwrite if the path exists")
    sp.set_defaults(func=cmd_rebrand)

    sp = sub.add_parser("advance", help="advance to the next stage if criteria hold")
    add_idea(sp)
    sp.add_argument("--force", action="store_true", help="advance despite missing criteria (logs a decision)")
    sp.set_defaults(func=cmd_advance)

    sp = sub.add_parser("dispatch", help="record a subagent dispatch + model tier (audit)")
    add_idea(sp)
    sp.add_argument("--workstream", required=True)
    sp.add_argument("--tier", required=True, help="haiku|sonnet|opus")
    sp.add_argument("--escalated", action="store_true")
    sp.add_argument("--note")
    sp.set_defaults(func=cmd_dispatch)

    sp = sub.add_parser("check", help="definition-of-done audit (SKILL §8)")
    add_idea(sp)
    sp.set_defaults(func=cmd_check)

    sp = sub.add_parser("provision-hub", help="emit the Client Hub provisioning gate "
                                              "(operations_model: hub/hybrid launches only)")
    add_idea(sp)
    sp.add_argument("--owner", help="owner's email (default: a TODO(operator) placeholder)")
    sp.add_argument("--hub-url", dest="hub_url",
                    help=f"Client Hub base URL (default {DEFAULT_CLIENT_HUB_URL})")
    sp.set_defaults(func=cmd_provision_hub)

    sp = sub.add_parser("build-platform", help="BUILD the business platform from the blueprint (the tangible output)")
    add_idea(sp)
    sp.add_argument("--out", help="where to write it (default: <idea-folder>/platform)")
    sp.set_defaults(func=cmd_build_platform)

    sp = sub.add_parser("publish-platform", help="put the platform on the hub so its owner can sign in anywhere")
    add_idea(sp)
    sp.add_argument("--owner-email", dest="owner_email", help="the business owner's email (their sign-in)")
    sp.add_argument("--hub-url", dest="hub_url", help="hub base URL (default: the VOM client hub)")
    sp.add_argument("--hub-dir", dest="hub_dir", help="path to the hub source tree")
    sp.set_defaults(func=cmd_publish_platform)

    # --- FORGE: the automatable spec and the unattended builder -------------
    sp = sub.add_parser("archetypes", help="the platform archetypes each forge builds "
                                           "(CHURCHforge, BIZforge, …)")
    sp.add_argument("--json", action="store_true")
    sp.set_defaults(func=cmd_archetypes)

    sp = sub.add_parser("brand", help="choose the predesigned brand kit this business is "
                                      "built in, and write its manual")
    sp.add_argument("idea_folder", nargs="?")
    sp.add_argument("--kit", help="the kit id (see --list)")
    sp.add_argument("--list", action="store_true", help="print the kit library and exit")
    sp.add_argument("--org-type", dest="org_type", default="",
                    help="the org type, when no blueprint has been saved yet")
    sp.add_argument("--actor", default="VOM")
    sp.set_defaults(func=cmd_brand)

    sp = sub.add_parser("spec", help="compile the blueprint into the automatable platform "
                                     "spec Forge executes")
    sp.add_argument("idea_folder")
    sp.add_argument("--target", choices=["local", "hub", "vercel"], default="local")
    sp.add_argument("--archetype", help="override the archetype (church | solo_business | generic)")
    sp.add_argument("--domain", help="the domain this platform will answer on")
    sp.add_argument("--hub-url", dest="hub_url")
    sp.add_argument("--save", action="store_true", help="write platform-spec.json + .md")
    sp.add_argument("--json", action="store_true")
    sp.add_argument("--strict", action="store_true", help="exit 3 if the spec is not ready")
    sp.add_argument("--authorize-unattended", action="store_true",
                    help="log the single prior YES that lets an unattended run publish")
    sp.add_argument("--actor", choices=["VOM", "CLIENT"], help="who is authorizing")
    sp.add_argument("--channel", help="how the authorization was given")
    sp.add_argument("--evidence", help="pointer to the evidence for the authorization")
    sp.add_argument("--operator")
    sp.set_defaults(func=cmd_spec)

    sp = sub.add_parser("forge", help="BUILD AND DEPLOY the platform, unattended, with "
                                      "visual stage cues")
    sp.add_argument("idea_folder", nargs="?", help="the business folder (omit with --new)")
    sp.add_argument("--new", metavar="NAME", help="create the business folder and build in "
                                                  "one command")
    sp.add_argument("--into", help="where --new creates the folder (default: the ideas root)")
    sp.add_argument("--reuse", action="store_true", help="allow --new to build in an existing folder")
    sp.add_argument("--about", help="one line describing the business (used by --new)")
    sp.add_argument("--city")
    sp.add_argument("--email")
    sp.add_argument("--org-type", help="decide the org type here if no blueprint exists yet")
    sp.add_argument("--archetype", help="override the archetype")
    sp.add_argument("--kit", help="the brand kit to build in (see `turnkey brand --list`); "
                                  "omit and the archetype's default kit applies")
    sp.add_argument("--target", choices=["local", "hub", "vercel"], default="local")
    sp.add_argument("--domain")
    sp.add_argument("--hub-url", dest="hub_url")
    sp.add_argument("--hub-link", dest="hub_link",
                    help="a public page this site belongs to; every page gets the same "
                         "route back to it")
    sp.add_argument("--hub-label", dest="hub_label", help="what that link is called")
    sp.add_argument("--hub-note", dest="hub_note",
                    help="one line above the link explaining what the hub is")
    sp.add_argument("--owner-email", help="the owner the hub registers the tenant against")
    sp.add_argument("--watch", action="store_true", help="follow the build in a browser console")
    sp.add_argument("--console", action="store_true", help="write a standalone console for the run")
    sp.add_argument("--port", type=int, default=0)
    sp.add_argument("--no-open", action="store_true")
    sp.add_argument("--dry-run", action="store_true", help="build and check, but do not deploy")
    sp.add_argument("--resume", action="store_true", help="continue the last run from its frontier")
    sp.add_argument("--quiet", action="store_true", help="no terminal stage rail")
    sp.add_argument("--authorize-unattended", action="store_true")
    sp.add_argument("--actor", choices=["VOM", "CLIENT"])
    sp.add_argument("--channel")
    sp.add_argument("--evidence")
    sp.add_argument("--operator")
    sp.set_defaults(func=cmd_forge)

    sp = sub.add_parser("forge-console", help="open the visual console for a finished run")
    sp.add_argument("idea_folder")
    sp.add_argument("--run-dir", help="a specific run (default: the most recent)")
    sp.add_argument("--no-open", action="store_true")
    sp.set_defaults(func=cmd_forge_console)

    sp = sub.add_parser("authorize-service", help="grant ONE standing authorization so the "
                                                 "service can launch businesses unattended")
    sp.add_argument("--actor", choices=["VOM", "CLIENT"])
    sp.add_argument("--targets", default="vercel", help="comma-separated: local,hub,vercel")
    sp.add_argument("--scope")
    sp.add_argument("--channel")
    sp.add_argument("--operator")
    sp.add_argument("--revoke", action="store_true")
    sp.set_defaults(func=cmd_authorize_service)

    sp = sub.add_parser("factory", help="THE PLATFORM FACTORY — idea to deployed platform, "
                                       "one artifact per milestone")
    sp.add_argument("ideas_folder", nargs="?")
    sp.add_argument("--port", type=int, default=0)
    sp.add_argument("--no-open", action="store_true")
    sp.set_defaults(func=cmd_factory)

    sp = sub.add_parser("wizard", help="open the guided, clickable launch wizard (local, no scripting)")
    sp.add_argument("ideas_folder", nargs="?",
                    help="the folder your idea folders live in (default: your Business Ideas root)")
    sp.add_argument("--port", type=int, default=0, help="port (default: pick a free one)")
    sp.add_argument("--no-open", dest="no_open", action="store_true", help="do not open a browser")
    sp.set_defaults(func=cmd_wizard)

    sp = sub.add_parser("selftest", help="run a full cycle in a temp dir; assert invariants")
    sp.set_defaults(func=cmd_selftest)

    return p


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
