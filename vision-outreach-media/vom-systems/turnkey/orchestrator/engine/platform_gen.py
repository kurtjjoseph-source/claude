#!/usr/bin/env python3
"""
platform_gen — turns a blueprint into a working business platform.

The rest of this engine tracks a launch. This part *builds* one. Given a business
folder whose blueprint has decided the org type and the business functions, it
assembles a real, running platform for that business: the modules that org type
actually needs, wired to a shared data layer, branded, populated from the profile,
and openable in a browser in one click.

Generic platform, specialised by the blueprint:

    church          -> giving, services & media, events, people & roster, inbox
    consultancy     -> deals, quotes, bookings, invoices, contacts
    shop            -> catalog, orders, stock, customers
    membership      -> members, plans, content, payments
    ...             (whatever the blueprint's function set resolved to)

Nothing here is a mock: every module lists, creates, edits, deletes and persists,
the dashboard is computed from the real records, and the whole thing exports and
imports its own data. It ships as a self-contained folder that can be opened from
disk or deployed as-is.

Stdlib only.
"""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone

SCHEMA_VERSION = 1


# ===========================================================================
# THE MODULE LIBRARY — one real module per business function
# ===========================================================================
# Each module declares its records: what a row IS, which fields it has, and how a
# row is summarised. The generated app renders every module from this declaration,
# so a module is never a stub — list, create, edit, delete and persistence come for
# free, and the few modules that deserve a richer view (a pipeline board, giving
# totals, an upcoming-events strip) declare a `view`.
#
# field types: text | textarea | number | money | date | select | check

MODULES = {
    "crm": {
        "title": "Contacts", "icon": "◍", "record": "contact",
        "blurb": "Everyone this business deals with, and where each one stands.",
        "view": "pipeline",
        "stages": ["Lead", "Contacted", "In conversation", "Customer", "Lapsed"],
        "fields": [
            {"k": "name", "label": "Name", "type": "text", "required": True},
            {"k": "email", "label": "Email", "type": "text"},
            {"k": "phone", "label": "Phone", "type": "text"},
            {"k": "stage", "label": "Stage", "type": "select", "from": "stages"},
            {"k": "value", "label": "Value", "type": "money"},
            {"k": "note", "label": "Notes", "type": "textarea"},
        ],
        "tiles": [{"label": "Contacts", "calc": "count"},
                  {"label": "In pipeline", "calc": "sum:value", "money": True}],
    },
    "donations": {
        "title": "Giving", "icon": "♥", "record": "gift",
        "blurb": "Gifts and pledges, one-off and recurring.",
        "view": "ledger",
        "fields": [
            {"k": "giver", "label": "Giver", "type": "text", "required": True},
            {"k": "amount", "label": "Amount", "type": "money", "required": True},
            {"k": "date", "label": "Date", "type": "date"},
            {"k": "recurring", "label": "Recurring", "type": "check"},
            {"k": "fund", "label": "Fund", "type": "select",
             "options": ["General", "Building", "Missions", "Benevolence"]},
            {"k": "note", "label": "Note", "type": "textarea"},
        ],
        "tiles": [{"label": "Given this month", "calc": "sum_month:amount", "money": True},
                  {"label": "Recurring givers", "calc": "count_true:recurring"},
                  {"label": "Given all time", "calc": "sum:amount", "money": True}],
    },
    "events": {
        "title": "Events", "icon": "◷", "record": "event",
        "blurb": "What is happening, and who is coming.",
        "view": "upcoming",
        "fields": [
            {"k": "title", "label": "Event", "type": "text", "required": True},
            {"k": "date", "label": "Date", "type": "date", "required": True},
            {"k": "time", "label": "Time", "type": "text"},
            {"k": "place", "label": "Where", "type": "text"},
            {"k": "rsvp", "label": "RSVPs", "type": "number"},
            {"k": "note", "label": "Details", "type": "textarea"},
        ],
        "tiles": [{"label": "Upcoming", "calc": "count_future:date"},
                  {"label": "Expected people", "calc": "sum_future:rsvp"}],
    },
    "media_library": {
        "title": "Media", "icon": "▶", "record": "item",
        "blurb": "Talks, sermons and recordings, with where they live.",
        "fields": [
            {"k": "title", "label": "Title", "type": "text", "required": True},
            {"k": "speaker", "label": "Speaker", "type": "text"},
            {"k": "date", "label": "Date", "type": "date"},
            {"k": "series", "label": "Series", "type": "text"},
            {"k": "url", "label": "Link (YouTube/Spotify)", "type": "text"},
            {"k": "summary", "label": "Summary", "type": "textarea"},
        ],
        "tiles": [{"label": "In the library", "calc": "count"}],
    },
    "content_publishing": {
        "title": "Content", "icon": "✎", "record": "post",
        "blurb": "Posts and announcements, drafted here before they go out.",
        "fields": [
            {"k": "title", "label": "Title", "type": "text", "required": True},
            {"k": "status", "label": "Status", "type": "select",
             "options": ["Idea", "Draft", "Ready", "Published"]},
            {"k": "channel", "label": "Channel", "type": "select",
             "options": ["Website", "Newsletter", "Facebook", "Instagram", "LinkedIn", "YouTube"]},
            {"k": "date", "label": "Planned for", "type": "date"},
            {"k": "body", "label": "The piece", "type": "textarea"},
        ],
        "tiles": [{"label": "Ready to publish", "calc": "count_eq:status:Ready"},
                  {"label": "Published", "calc": "count_eq:status:Published"}],
    },
    "booking": {
        "title": "Bookings", "icon": "◔", "record": "booking",
        "blurb": "Appointments, who they are with, and whether they are confirmed.",
        "view": "upcoming",
        "fields": [
            {"k": "title", "label": "What", "type": "text", "required": True},
            {"k": "who", "label": "With", "type": "text"},
            {"k": "date", "label": "Date", "type": "date", "required": True},
            {"k": "time", "label": "Time", "type": "text"},
            {"k": "status", "label": "Status", "type": "select",
             "options": ["Requested", "Confirmed", "Done", "No-show"]},
            {"k": "note", "label": "Notes", "type": "textarea"},
        ],
        "tiles": [{"label": "Upcoming", "calc": "count_future:date"},
                  {"label": "Awaiting confirmation", "calc": "count_eq:status:Requested"}],
    },
    "product_catalog": {
        "title": "Catalog", "icon": "▤", "record": "product",
        "blurb": "What is for sale, at what price.",
        "fields": [
            {"k": "name", "label": "Product", "type": "text", "required": True},
            {"k": "price", "label": "Price", "type": "money", "required": True},
            {"k": "kind", "label": "Kind", "type": "select",
             "options": ["Digital", "Physical", "Service", "Subscription"]},
            {"k": "sku", "label": "SKU / code", "type": "text"},
            {"k": "stock", "label": "In stock", "type": "number"},
            {"k": "live", "label": "On sale", "type": "check"},
            {"k": "description", "label": "Description", "type": "textarea"},
        ],
        "tiles": [{"label": "Products", "calc": "count"},
                  {"label": "On sale", "calc": "count_true:live"}],
    },
    "checkout_payments": {
        "title": "Orders", "icon": "€", "record": "order",
        "blurb": "What has been sold and whether the money arrived.",
        "view": "ledger",
        "fields": [
            {"k": "customer", "label": "Customer", "type": "text", "required": True},
            {"k": "item", "label": "What they bought", "type": "text"},
            {"k": "amount", "label": "Amount", "type": "money", "required": True},
            {"k": "date", "label": "Date", "type": "date"},
            {"k": "status", "label": "Status", "type": "select",
             "options": ["Pending", "Paid", "Refunded", "Failed"]},
        ],
        "tiles": [{"label": "Paid this month", "calc": "sum_month_eq:amount:status:Paid", "money": True},
                  {"label": "Awaiting payment", "calc": "count_eq:status:Pending"},
                  {"label": "Revenue all time", "calc": "sum_eq:amount:status:Paid", "money": True}],
    },
    "inventory_shipping": {
        "title": "Stock", "icon": "▥", "record": "line",
        "blurb": "What is on the shelf and what needs reordering.",
        "fields": [
            {"k": "item", "label": "Item", "type": "text", "required": True},
            {"k": "qty", "label": "In stock", "type": "number", "required": True},
            {"k": "reorder_at", "label": "Reorder at", "type": "number"},
            {"k": "supplier", "label": "Supplier", "type": "text"},
        ],
        "tiles": [{"label": "Lines", "calc": "count"}, {"label": "Units", "calc": "sum:qty"}],
    },
    "membership_access": {
        "title": "Members", "icon": "◎", "record": "member",
        "blurb": "Who is a member, on what plan, and since when.",
        "fields": [
            {"k": "name", "label": "Name", "type": "text", "required": True},
            {"k": "email", "label": "Email", "type": "text"},
            {"k": "plan", "label": "Plan", "type": "select",
             "options": ["Free", "Monthly", "Annual", "Founding"]},
            {"k": "since", "label": "Member since", "type": "date"},
            {"k": "active", "label": "Active", "type": "check"},
        ],
        "tiles": [{"label": "Members", "calc": "count"},
                  {"label": "Active", "calc": "count_true:active"}],
    },
    "courses_lms": {
        "title": "Courses", "icon": "◈", "record": "course",
        "blurb": "What you teach, and who is working through it.",
        "fields": [
            {"k": "title", "label": "Course", "type": "text", "required": True},
            {"k": "lessons", "label": "Lessons", "type": "number"},
            {"k": "enrolled", "label": "Enrolled", "type": "number"},
            {"k": "price", "label": "Price", "type": "money"},
            {"k": "live", "label": "Open for enrolment", "type": "check"},
            {"k": "outline", "label": "Outline", "type": "textarea"},
        ],
        "tiles": [{"label": "Courses", "calc": "count"}, {"label": "Learners", "calc": "sum:enrolled"}],
    },
    "people_roster": {
        "title": "People & roster", "icon": "◇", "record": "slot",
        "blurb": "Who is serving, when, and in what role.",
        "view": "upcoming",
        "fields": [
            {"k": "person", "label": "Person", "type": "text", "required": True},
            {"k": "role", "label": "Role", "type": "text"},
            {"k": "date", "label": "Date", "type": "date", "required": True},
            {"k": "confirmed", "label": "Confirmed", "type": "check"},
            {"k": "phone", "label": "Phone", "type": "text"},
        ],
        "tiles": [{"label": "Slots ahead", "calc": "count_future:date"},
                  {"label": "Unconfirmed", "calc": "count_false:confirmed"}],
    },
    "support_inbox": {
        "title": "Inbox", "icon": "✉", "record": "message",
        "blurb": "Questions coming in, and what was sent back.",
        "fields": [
            {"k": "who", "label": "From", "type": "text", "required": True},
            {"k": "subject", "label": "About", "type": "text"},
            {"k": "date", "label": "Received", "type": "date"},
            {"k": "status", "label": "Status", "type": "select",
             "options": ["New", "Replied", "Closed"]},
            {"k": "message", "label": "What they said", "type": "textarea"},
            {"k": "reply", "label": "Draft reply", "type": "textarea"},
        ],
        "tiles": [{"label": "Needs a reply", "calc": "count_eq:status:New"}],
    },
    "email_marketing": {
        "title": "Mailing list", "icon": "✦", "record": "subscriber",
        "blurb": "The list, and what has been sent to it.",
        "fields": [
            {"k": "email", "label": "Email", "type": "text", "required": True},
            {"k": "name", "label": "Name", "type": "text"},
            {"k": "source", "label": "Came from", "type": "text"},
            {"k": "date", "label": "Joined", "type": "date"},
            {"k": "subscribed", "label": "Subscribed", "type": "check"},
        ],
        "tiles": [{"label": "On the list", "calc": "count_true:subscribed"}],
    },
    "finance_admin": {
        "title": "Invoices", "icon": "◫", "record": "invoice",
        "blurb": "What has been billed, what has been paid, and the VAT on it.",
        "view": "ledger",
        "fields": [
            {"k": "number", "label": "Invoice no.", "type": "text", "required": True},
            {"k": "client", "label": "To", "type": "text", "required": True},
            {"k": "amount", "label": "Amount (excl. VAT)", "type": "money", "required": True},
            {"k": "vat", "label": "VAT %", "type": "number"},
            {"k": "date", "label": "Date", "type": "date"},
            {"k": "status", "label": "Status", "type": "select",
             "options": ["Draft", "Sent", "Paid", "Overdue"]},
        ],
        "tiles": [{"label": "Outstanding", "calc": "sum_eq:amount:status:Sent", "money": True},
                  {"label": "Paid this month", "calc": "sum_month_eq:amount:status:Paid", "money": True},
                  {"label": "VAT collected", "calc": "sum_vat", "money": True}],
    },
    "documents_contracts": {
        "title": "Quotes", "icon": "◨", "record": "quote",
        "blurb": "Proposals out, and which ones came back signed.",
        "fields": [
            {"k": "title", "label": "Proposal", "type": "text", "required": True},
            {"k": "client", "label": "For", "type": "text"},
            {"k": "amount", "label": "Value", "type": "money"},
            {"k": "sent", "label": "Sent", "type": "date"},
            {"k": "status", "label": "Status", "type": "select",
             "options": ["Drafting", "Sent", "Accepted", "Declined"]},
            {"k": "scope", "label": "Scope", "type": "textarea"},
        ],
        "tiles": [{"label": "Out for decision", "calc": "count_eq:status:Sent"},
                  {"label": "Won", "calc": "sum_eq:amount:status:Accepted", "money": True}],
    },
    "donor_reporting": {
        "title": "Donor report", "icon": "◰", "record": "entry",
        "blurb": "The annual picture a foundation has to be able to show.",
        "fields": [
            {"k": "year", "label": "Year", "type": "number", "required": True},
            {"k": "income", "label": "Income", "type": "money"},
            {"k": "spent", "label": "Spent on the mission", "type": "money"},
            {"k": "note", "label": "Notes", "type": "textarea"},
        ],
        "tiles": [{"label": "Years recorded", "calc": "count"}],
    },
    "lead_capture": {
        "title": "Enquiries", "icon": "◌", "record": "enquiry",
        "blurb": "People who put their hand up, before they become contacts.",
        "fields": [
            {"k": "name", "label": "Name", "type": "text", "required": True},
            {"k": "email", "label": "Email", "type": "text"},
            {"k": "asked", "label": "What they want", "type": "textarea"},
            {"k": "date", "label": "When", "type": "date"},
            {"k": "handled", "label": "Handled", "type": "check"},
        ],
        "tiles": [{"label": "New enquiries", "calc": "count_false:handled"}],
    },
}

# Functions that are not a platform module (they are decisions or external rails).
NOT_A_MODULE = {"web_presence", "analytics_reporting", "social_publishing",
                "digital_fulfillment", "subscriptions", "custom_app"}


def modules_for(blueprint: dict) -> list:
    """The modules this business gets: its core + recommended functions, in a sane order."""
    order = list(MODULES.keys())
    chosen = []
    for key, meta in (blueprint.get("functions") or {}).items():
        if meta.get("tier") == "optional":
            continue
        if key in NOT_A_MODULE or key not in MODULES:
            continue
        chosen.append(key)
    return sorted(set(chosen), key=lambda k: order.index(k))


# ===========================================================================
# reading the business
# ===========================================================================

def read_business(idea_folder: str, state: dict) -> dict:
    """Everything the platform needs to know about who it belongs to."""
    bp = state.get("blueprint") or {}
    op = state.get("operator") or {}
    profile_path = os.path.join(idea_folder, "turnkey", "business-profile.md")
    profile = ""
    if os.path.exists(profile_path):
        with open(profile_path, encoding="utf-8") as f:
            profile = f.read()

    def section(name):
        m = re.search(r"^#+\s*" + name + r"\s*$(.*?)(?=^#+\s|\Z)", profile,
                      re.S | re.M | re.I)
        return (m.group(1).strip() if m else "")

    return {
        "name": state.get("business") or os.path.basename(idea_folder.rstrip("/")),
        "org_type": bp.get("org_type"),
        "org_label": bp.get("org_label"),
        "platform_choice": (bp.get("platform") or {}).get("label"),
        "wordpress": bool((bp.get("platform") or {}).get("wordpress_used")),
        "operator": op.get("name") or "the operator",
        "operator_short": op.get("short") or "",
        "offer": section("Offer")[:600],
        "organization": section("Organization")[:800],
        "generated": datetime.now(timezone.utc).replace(microsecond=0)
                            .isoformat().replace("+00:00", "Z"),
    }


# ===========================================================================
# generating
# ===========================================================================

def build(idea_folder: str, state: dict, logo_data_uri: str = "", out_dir: str = None) -> dict:
    bp = state.get("blueprint")
    if not bp:
        raise ValueError("this launch has no blueprint yet — decide the org type and functions first")

    keys = modules_for(bp)
    if not keys:
        raise ValueError("the blueprint selected no platform modules")

    biz = read_business(idea_folder, state)
    out = out_dir or os.path.join(idea_folder, "platform")
    os.makedirs(out, exist_ok=True)

    config = {
        "schema": SCHEMA_VERSION,
        "business": biz,
        "modules": [{"key": k, **{kk: vv for kk, vv in MODULES[k].items()}} for k in keys],
    }

    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, "platform_app.html"), encoding="utf-8") as f:
        shell = f.read()

    html = (shell.replace("{{CONFIG}}", json.dumps(config, ensure_ascii=False))
                 .replace("{{LOGO}}", logo_data_uri)
                 .replace("{{NAME}}", biz["name"]))

    with open(os.path.join(out, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    with open(os.path.join(out, "business.json"), "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
        f.write("\n")
    with open(os.path.join(out, "README.md"), "w", encoding="utf-8") as f:
        f.write(readme(biz, keys))

    return {"dir": out, "modules": keys, "business": biz,
            "index": os.path.join(out, "index.html")}


def shell_module(logo_data_uri: str = "") -> str:
    """The platform shell as a CommonJS module the hub can serve per tenant.

    The hub renders the same app Turnkey generates locally, but fills CONFIG from the
    tenant's own operating profile — so one deployed shell serves every business, each
    seeing only its own modules and its own records."""
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, "platform_app.html"), encoding="utf-8") as f:
        html = f.read()
    return (
        "// GENERATED by turnkey publish-platform — do not edit.\n"
        "// The business-platform shell, served per tenant by api/app.js.\n"
        "'use strict';\n"
        "module.exports = {\n"
        "  html: " + json.dumps(html) + ",\n"
        "  LOGO: " + json.dumps(logo_data_uri) + ",\n"
        "  MODULES: " + json.dumps({k: dict(v, key=k) for k, v in MODULES.items()},
                                   ensure_ascii=False) + ",\n"
        "};\n"
    )


def tenant_payload(idea_folder: str, state: dict, owner_email: str) -> dict:
    """What the hub needs to serve this business its platform."""
    bp = state.get("blueprint") or {}
    biz = read_business(idea_folder, state)
    tenant_id = re.sub(r"[^a-z0-9]+", "-", biz["name"].lower()).strip("-")[:64] or "business"
    return {
        "tenant_id": tenant_id,
        "owner_email": owner_email,
        "operating_profile": {
            "business_name": biz["name"],
            "org_type": biz["org_type"],
            "org_label": biz["org_label"],
            "platform_choice": biz["platform_choice"],
            "operator": biz["operator"],
            "generated": biz["generated"],
            "platform_modules": modules_for(bp),
        },
    }


def readme(biz: dict, keys: list) -> str:
    rows = "\n".join(f"| **{MODULES[k]['title']}** | {MODULES[k]['blurb']} |" for k in keys)
    return f"""# {biz['name']} — business platform

The working platform for this business. Generated from its blueprint, so it carries the
modules a **{biz['org_label']}** actually needs and nothing it does not.

Open `index.html` in a browser. It runs as-is — no install, no build, no server.

## Modules

| Module | What it does |
|---|---|
{rows}

Every module lists, creates, edits and deletes real records, and everything persists in the
browser. The dashboard is computed from those records, not seeded. **Backup** writes a JSON
file of everything; **Restore** reads one back, which is also how you move the data to
another machine.

## Where it came from

- Org type: **{biz['org_label']}** (`{biz['org_type']}`)
- Site decision: **{biz['platform_choice']}**
- Prepared by {biz['operator']} · {biz['generated']}

Regenerate after a blueprint change:

```bash
python3 <engine>/turnkey.py platform "<this idea folder>"
```

Regenerating rewrites `index.html` and `business.json`. Your records live in the browser,
so they survive it — take a Backup first if you are moving machines.
"""
