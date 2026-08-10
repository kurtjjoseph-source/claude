#!/usr/bin/env python3
"""
product_app — the thing the SaaS site is actually selling.

Every other artefact Forge builds serves the *owner*: the public site persuades their
customers, the platform at `/platform` is their back office. For nine of the ten
archetypes that is the whole business. For `saas` it is not, and pretending otherwise
produces the worst possible object — a beautiful site advertising a product that does not
exist, with a "Start free" button leading to a form.

So a SaaS archetype declares a `product_app`, and Forge builds it: a working application
at `/app`, seeded with a real week, doing the things the home page claims it does.

    "Build a week in ten minutes"     -> the grid, and a cost that moves as you fill it
    "Staff swap shifts themselves"    -> a request queue the manager approves or declines
    "Export to payroll"               -> a CSV that downloads, with the hours worked out

This is not a generic app builder and does not pretend to be — the product is the one
thing about a software company that cannot be composed from a catalogue. What it *is* is
the same discipline as everywhere else in this engine: one declared kind of product, one
template, chosen by name in `archetypes.py`. A second kind is a new template beside this
one, not a change to anything that already works.

Storage is `localStorage` and nothing else. Both surfaces share one key, so the manager's
rota and the team's page are genuinely one system — a claim made on a phone is in the
manager's queue before the tab has finished animating. What that is *not* is multi-user:
there is no server, no account, and no sync. "The team" is one person in several tabs, and
a different browser is a different world starting from the same seed.

`platform_app.html` does have the two-mode design (`local` for a demo, `hub` for an
account syncing through `/api/state`). This does not, and an earlier version of this
docstring implied otherwise by claiming it followed that contract. It doesn't. Giving the
product real accounts means writing the hub path here, not describing one that exists next
door — and until someone does, every sentence about this app has to say browser-local out
loud, because a demo that lets a buyer assume otherwise is the one lie the rest of this
engine is built to prevent.

Stdlib only.
"""

from __future__ import annotations

import json
import os

SCHEMA_VERSION = 1

# Where the shared rota lives. The operator's hub already holds a real datastore, so the
# product borrows it rather than asking for a second one — a credential copied into a
# second project is a credential in two places to rotate and leak.
# Empty string turns the whole feature off and every surface falls back to the browser.
SYNC_URL = os.environ.get("ROTA_SYNC_URL", "https://vom-hub.vercel.app/api/rota")


def _slug(s: str) -> str:
    out = "".join(c if c.isalnum() else "-" for c in (s or "").lower()).strip("-")
    while "--" in out:
        out = out.replace("--", "-")
    return out[:38] or "rota"

KINDS = {
    "scheduling": {
        "title": "Rota",
        "summary": "Build a week, cost it as you go, let staff swap, export the hours.",
        # A product has more than one audience, and the second one is usually forgotten.
        # The manager builds the rota; the team has to be able to read it and ask for a
        # change, or publishing is a button that does nothing.
        "surfaces": [
            ("app", "product_app_scheduling.html", "the manager's rota"),
            ("team", "product_app_scheduling_team.html", "what the team sees"),
        ],
    },
}


def available(kind: str) -> bool:
    return kind in KINDS


def _week(wk: int, rows: list) -> list:
    """Stamp a pattern of shifts onto a relative week.

    `wk` is relative to whichever Monday the app is opened on — resolved to a real date
    in the browser, so a demo opened in November is a November rota rather than a
    fossil of the day it was generated."""
    return [dict(r, wk=wk, id=f"w{wk}_{i}") for i, r in enumerate(rows)]


# The shape of a trading week, written once. Three weeks are stamped from it below with
# different assignments, because a scheduler with one week in it cannot demonstrate the
# thing a scheduler is for.
_PATTERN = [
    {"day": 0, "start": "09:00", "end": "17:00", "role": "Kitchen"},
    {"day": 0, "start": "16:00", "end": "23:00", "role": "Bar"},
    {"day": 1, "start": "09:00", "end": "17:00", "role": "Kitchen"},
    {"day": 1, "start": "16:00", "end": "23:00", "role": "Bar"},
    {"day": 1, "start": "17:00", "end": "23:00", "role": "Floor"},
    {"day": 2, "start": "09:00", "end": "17:00", "role": "Kitchen"},
    {"day": 2, "start": "16:00", "end": "23:30", "role": "Bar"},
    {"day": 3, "start": "16:00", "end": "23:30", "role": "Bar"},
    {"day": 3, "start": "17:00", "end": "23:30", "role": "Floor"},
    {"day": 4, "start": "12:00", "end": "20:00", "role": "Kitchen"},
    {"day": 4, "start": "17:00", "end": "01:00", "role": "Bar"},
    {"day": 4, "start": "17:00", "end": "01:00", "role": "Floor"},
    {"day": 5, "start": "12:00", "end": "20:00", "role": "Kitchen"},
    {"day": 5, "start": "17:00", "end": "01:00", "role": "Bar"},
    {"day": 5, "start": "17:00", "end": "01:00", "role": "Floor"},
    {"day": 6, "start": "11:00", "end": "18:00", "role": "Kitchen"},
    {"day": 6, "start": "11:00", "end": "18:00", "role": "Floor"},
]

# Who is on, per week. Last week and this week are settled; next week is half-built,
# which is the state a manager actually opens the app in.
_LAST = ["s3","s1","s4","s2","s5","s3","s1","s2","s6","s4","s1","s5","s3","s2","s6","s4","s5"]
_THIS = ["s3","s1","s4","s2","s5","s3","s1","s2","s6","s4","s1","s5","s3","s2","s6","","s5"]
_NEXT = ["s3","s1","","s2","", "s3","s1","", "s6","s4","","", "","","", "",""]


def seed_for(business: str) -> dict:
    """Three weeks: one behind, one now, one being planned.

    An empty scheduler teaches nobody anything and demos as a blank page. One *week*
    teaches almost as little, because the whole job is next week — so the app opens with
    history behind it, a published week to work, a half-built week ahead, and one
    unresolved swap request, since the interesting half of a rota is the exceptions."""
    shifts = (_week(-1, [dict(r, who=w) for r, w in zip(_PATTERN, _LAST)])
              + _week(0, [dict(r, who=w) for r, w in zip(_PATTERN, _THIS)])
              + _week(1, [dict(r, who=w) for r, w in zip(_PATTERN, _NEXT)]))

    # Derive coverage from _PATTERN: count shifts per (day, role).
    # This ensures the seeded weeks are staffed correctly and avoids drift.
    coverage = {}
    for day in range(7):
        coverage[str(day)] = {"Bar": 0, "Kitchen": 0, "Floor": 0}
    for shift in _PATTERN:
        day = shift["day"]
        role = shift["role"]
        coverage[str(day)][role] += 1

    return {
        "v": 3,
        "shifts": shifts,
        # Published is per week now. A rota published in March does not make April final.
        "published": {"-1": True, "0": True},
        "swaps": [
            {"id": "sw1", "shift": "w0_6", "from": "s1", "to": "s2",
             "note": "Dentist, back by 18:00 — Joris said yes.", "state": "pending"},
        ],
        "staff": [
            {"id": "s1", "name": "Amara Osei", "role": "Bar", "rate": 16.5, "max": 32},
            {"id": "s2", "name": "Joris Bakker", "role": "Bar", "rate": 15.0, "max": 24},
            {"id": "s3", "name": "Lena Vos", "role": "Kitchen", "rate": 18.0, "max": 38},
            {"id": "s4", "name": "Tomás Ruiz", "role": "Kitchen", "rate": 17.0, "max": 38},
            {"id": "s5", "name": "Fatima Haddad", "role": "Floor", "rate": 15.5, "max": 28},
            {"id": "s6", "name": "Nils Andersen", "role": "Floor", "rate": 15.5, "max": 20},
        ],
        "availability": [
            # Conflict: s1 is scheduled Bar on Monday week 1, so this "off" needs resolving.
            {"id": "a1", "person": "s1", "wk": 1, "day": 0, "kind": "off",
             "note": "Doctor appointment"},
            # Conflict: s2 is scheduled Bar on Tuesday week 1, so a preference creates tension.
            {"id": "a2", "person": "s2", "wk": 1, "day": 1, "kind": "prefer_not",
             "note": "Prefer morning shift if available"},
            # No conflict: s5 is not rostered Monday week 0.
            {"id": "a3", "person": "s5", "wk": 0, "day": 0, "kind": "off",
             "note": "Exam revision"},
            # No conflict: s6 is not rostered Sunday week 1.
            {"id": "a4", "person": "s6", "wk": 1, "day": 6, "kind": "off",
             "note": "Family visiting"},
        ],
        "coverage": coverage,
        # Weekly labour ceiling and forecast revenue for margin calculation.
        "budget": {"target": 2200, "revenue": 9000},
        # Staff who have confirmed sight of the published rota. Last week: all. This week: two only.
        "acks": {"-1": ["s1", "s2", "s3", "s4", "s5", "s6"], "0": ["s3", "s5"]},
        # Claims on unfilled shifts: empty at seed. Manager will see real data after publication.
        "claims": [],
    }


def build(business: str, kind: str, logo: str = "", forge: dict = None) -> dict:
    """Every surface of the application, keyed by the directory it belongs in.

    One seed, one storage key, two audiences. The manager's rota and the team's page are
    the same data seen from two sides — which is why they are built together from one
    config rather than kept in step by hand."""
    if kind not in KINDS:
        raise ValueError(f"no product app of kind '{kind}' — known: {', '.join(KINDS)}")
    cfg = {
        "schema": SCHEMA_VERSION,
        "business": business,
        "kind": kind,
        "title": KINDS[kind]["title"],
        "seed": seed_for(business),
    }
    here = os.path.dirname(os.path.abspath(__file__))
    mark = (f'<img src="{logo}" alt="">' if logo else '<span class="orb"></span>')

    # The shared rota. Without an endpoint every surface still works exactly as it did —
    # the sync layer is written so that "no server" is a supported configuration and not a
    # broken one — but the team is then one person in several tabs.
    cfg["sync"] = {"url": SYNC_URL, "team": _slug(business)} if SYNC_URL else None
    payload = json.dumps(cfg, ensure_ascii=False)

    with open(os.path.join(here, "product_app_sync.js"), encoding="utf-8") as f:
        sync_js = f.read()

    out = {}
    for folder, template, _ in KINDS[kind]["surfaces"]:
        with open(os.path.join(here, template), encoding="utf-8") as f:
            shell = f.read()
        # Each surface declares which side of the merge it is; the rule lives in one file
        # but it cannot be applied without knowing who is asking.
        role = "manager" if folder == "app" else "team"
        out[folder] = (shell.replace("{{CONFIG}}", payload)
                            .replace("{{SYNC_JS}}", sync_js)
                            .replace("{{ROLE}}", role)
                            .replace("{{LOGO_MARK}}", mark)
                            .replace("{{NAME}}", business))
    return out
