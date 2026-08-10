#!/usr/bin/env python3
"""
blueprints — Turnkey's org-type → business-function model.

The launch pipeline used to assume every business needed the same machine: a site,
a payment rail, a CRM. That is wrong the moment you launch a second kind of business.
A church needs giving, a sermon library and a roster; a webshop needs a catalog,
stock and shipping; a consultancy needs proposals and an invoicing rhythm.

This module answers two questions BEFORE the Build layer runs, deterministically and
with a written rationale:

  1. **Which business functions must exist for this org type?**  (CRM, finance/admin,
     product catalog, donations, booking, membership, fulfilment, …) — each one tiered
     core / recommended / optional and mapped to the workstream that must deliver it.
  2. **Is WordPress the right site platform, or a custom app?** — a scored, explainable
     decision over {wordpress · vercel_app · hybrid}, driven by the org type, the
     functions selected, signals found in the business profile, and the operator's own
     rails (e.g. an operator that ships a WordPress plugin gets a WordPress bonus).

No model call, no network: same inputs → same blueprint, so it is auditable and the
operator can override any part of it (overrides are logged by the engine).

Stdlib only. Imported by turnkey.py; also runnable: `python3 blueprints.py --catalog`.
"""

from __future__ import annotations

import re

SCHEMA = 1

# ===========================================================================
# 1. THE FUNCTION CATALOG — the universe of business functions Turnkey builds
# ===========================================================================
# workstream = who delivers it in the existing 11-workstream pipeline.
# wp_fit     = how well WordPress serves this function:
#              "strong" (mature plugin ecosystem, owner-editable)
#              "neutral" (works either way, usually an external SaaS anyway)
#              "weak"   (custom logic; WordPress is the wrong tool)
# wp / app   = the default implementation on each platform.
# gated      = touching this function's live switch is a publish/send/money action.

FUNCTIONS = {
    "web_presence": {
        "title": "Public web presence",
        "domain": "Front of house",
        "workstream": "W4_website",
        "wp_fit": "neutral",
        "wp": "WordPress site (block theme) — home, offer, about, contact",
        "app": "Next.js site on Vercel — home, offer, about, contact",
        "gated": True,
    },
    "content_publishing": {
        "title": "Content publishing (blog / news / articles)",
        "domain": "Front of house",
        "workstream": "W4_website",
        "wp_fit": "strong",
        "wp": "WordPress posts + categories; owner edits without a developer",
        "app": "MDX content collection — every edit is a code deploy",
        "gated": False,
    },
    "media_library": {
        "title": "Media library (sermons / video / podcast archive)",
        "domain": "Front of house",
        "workstream": "W4_website",
        "wp_fit": "strong",
        "wp": "Custom post type + embeds (YouTube/Spotify), series taxonomy",
        "app": "Media index page fed by the channel APIs",
        "gated": False,
    },
    "events": {
        "title": "Events calendar & RSVP",
        "domain": "Front of house",
        "workstream": "W4_website",
        "wp_fit": "strong",
        "wp": "Events plugin (The Events Calendar) + RSVP form",
        "app": "Events collection + form endpoint",
        "gated": False,
    },
    "booking": {
        "title": "Appointment booking / scheduling",
        "domain": "Front of house",
        "workstream": "W4_website",
        "wp_fit": "strong",
        "wp": "Booking plugin, or embed the operator's scheduling SaaS",
        "app": "Embedded scheduling SaaS (Cal.com/Calendly) + webhook to CRM",
        "gated": False,
    },
    "lead_capture": {
        "title": "Lead capture (forms, lead magnet, CTA)",
        "domain": "Front of house",
        "workstream": "W9_leads",
        "wp_fit": "neutral",
        "wp": "Form plugin → CRM + Brevo list",
        "app": "Form route → CRM + Brevo list",
        "gated": False,
    },
    "product_catalog": {
        "title": "Product catalog (what is for sale, at what price)",
        "domain": "Revenue",
        "workstream": "W6_products",
        "wp_fit": "strong",
        "wp": "WooCommerce products/variations; Stripe as the gateway",
        "app": "Catalog defined in Stripe products/prices, rendered from the API",
        "gated": False,
    },
    "checkout_payments": {
        "title": "Checkout & payments",
        "domain": "Revenue",
        "workstream": "W5_payments",
        "wp_fit": "neutral",
        "wp": "Stripe checkout (hosted) linked from Woo/pages; iDEAL enabled for NL",
        "app": "Stripe Checkout / Payment Links; iDEAL enabled for NL",
        "gated": True,
    },
    "donations": {
        "title": "Donations & recurring giving",
        "domain": "Revenue",
        "workstream": "W5_payments",
        "wp_fit": "strong",
        "wp": "Giving plugin (GiveWP) or Stripe donation links + campaign pages",
        "app": "Stripe recurring Payment Links + a giving page",
        "gated": True,
    },
    "subscriptions": {
        "title": "Subscriptions / recurring billing",
        "domain": "Revenue",
        "workstream": "W5_payments",
        "wp_fit": "neutral",
        "wp": "Stripe Billing (portal hosted by Stripe), membership plugin for access",
        "app": "Stripe Billing + customer portal",
        "gated": True,
    },
    "membership_access": {
        "title": "Member area & access control",
        "domain": "Delivery",
        "workstream": "W6_products",
        "wp_fit": "strong",
        "wp": "Membership plugin gating pages by plan; login lives on the client's site",
        "app": "Auth + entitlement check per route",
        "gated": False,
    },
    "courses_lms": {
        "title": "Course delivery (LMS)",
        "domain": "Delivery",
        "workstream": "W6_products",
        "wp_fit": "strong",
        "wp": "LMS plugin (LearnDash/TutorLMS) — lessons, progress, certificates",
        "app": "Course routes + progress store, or an external LMS embed",
        "gated": False,
    },
    "digital_fulfillment": {
        "title": "Digital fulfilment (deliver the file / grant the access)",
        "domain": "Delivery",
        "workstream": "W6_products",
        "wp_fit": "neutral",
        "wp": "Stripe webhook → email delivery; WP only hosts the thank-you page",
        "app": "Stripe webhook → signed download link + buyer email (Brevo)",
        "gated": True,
    },
    "inventory_shipping": {
        "title": "Stock, shipping & physical fulfilment",
        "domain": "Delivery",
        "workstream": "W6_products",
        "wp_fit": "strong",
        "wp": "WooCommerce stock + shipping zones + NL carrier plugin",
        "app": "Custom stock model + carrier API — only worth it above real volume",
        "gated": False,
    },
    "crm": {
        "title": "CRM — contacts, pipeline, running inventory",
        "domain": "Back office",
        "workstream": "W10_crm",
        "wp_fit": "neutral",
        "wp": "Operator-side CRM (not in WordPress); site forms feed it",
        "app": "Operator-side CRM; app forms feed it",
        "gated": False,
    },
    "finance_admin": {
        "title": "Finance & admin (invoicing, VAT, bookkeeping)",
        "domain": "Back office",
        "workstream": "W2_legal",
        "wp_fit": "neutral",
        "wp": "NL bookkeeping tool + Stripe payouts reconciled monthly",
        "app": "NL bookkeeping tool + Stripe payouts reconciled monthly",
        "gated": False,
    },
    "email_marketing": {
        "title": "Email list & broadcasts",
        "domain": "Growth",
        "workstream": "W9_leads",
        "wp_fit": "neutral",
        "wp": "Brevo list + form plugin; broadcasts sent from Brevo",
        "app": "Brevo list + form route; broadcasts sent from Brevo",
        "gated": True,
    },
    "social_publishing": {
        "title": "Social content production & scheduling",
        "domain": "Growth",
        "workstream": "W8_social",
        "wp_fit": "neutral",
        "wp": "Engage AI Content Studio inside wp-admin (owner-operable)",
        "app": "Content produced operator-side; owner approves the weekly digest",
        "gated": True,
    },
    "analytics_reporting": {
        "title": "Analytics & presence reporting",
        "domain": "Growth",
        "workstream": "W7_presence",
        "wp_fit": "neutral",
        "wp": "Engage AI plugin reports real page/post counts as ground truth",
        "app": "Analytics + the Engage AI server-side website probe",
        "gated": False,
    },
    "support_inbox": {
        "title": "Support inbox & FAQ",
        "domain": "Back office",
        "workstream": "W11_followups",
        "wp_fit": "neutral",
        "wp": "Shared mailbox + FAQ pages; replies drafted, human-approved",
        "app": "Shared mailbox + FAQ routes; replies drafted, human-approved",
        "gated": True,
    },
    "documents_contracts": {
        "title": "Quotes, proposals & contracts",
        "domain": "Back office",
        "workstream": "W10_crm",
        "wp_fit": "neutral",
        "wp": "Template pack + e-sign SaaS, tracked on the CRM record",
        "app": "Template pack + e-sign SaaS, tracked on the CRM record",
        "gated": False,
    },
    "people_roster": {
        "title": "People, volunteers & rosters",
        "domain": "Back office",
        "workstream": "W10_crm",
        "wp_fit": "neutral",
        "wp": "Roster in the CRM; a public sign-up form on the site",
        "app": "Roster in the CRM; a public sign-up route",
        "gated": False,
    },
    "donor_reporting": {
        "title": "Donor & grant reporting (ANBI-ready)",
        "domain": "Back office",
        "workstream": "W2_legal",
        "wp_fit": "neutral",
        "wp": "Giving exports → bookkeeping; annual public ANBI page on the site",
        "app": "Giving exports → bookkeeping; annual public ANBI page",
        "gated": False,
    },
    "custom_app": {
        "title": "The product application itself",
        "domain": "Delivery",
        "workstream": "W4_website",
        "wp_fit": "weak",
        "wp": "Not a WordPress job — WordPress can only market it",
        "app": "The application, built by the dev swarm and deployed on Vercel",
        "gated": True,
    },
}

# Every launched business gets these, whatever it is.
UNIVERSAL_CORE = ["web_presence", "crm", "finance_admin", "analytics_reporting"]
UNIVERSAL_RECOMMENDED = ["lead_capture", "email_marketing", "social_publishing"]


# ===========================================================================
# 2. THE ORG TYPES — what each kind of organization actually needs
# ===========================================================================
# core        = must exist for the business to function at all
# recommended = ship it unless the operator opts out
# optional    = offer it; only build on request
# site_bias   = (platform, weight, reason) — the org type's starting lean
# signals     = keywords used to classify a profile automatically

ORG_TYPES = {
    "church": {
        "label": "Church / faith community",
        "summary": "Gathering-led, content-heavy, funded by giving rather than sales.",
        "core": ["content_publishing", "media_library", "events", "donations", "people_roster"],
        "recommended": ["support_inbox"],
        "optional": ["membership_access", "product_catalog", "checkout_payments", "booking"],
        "revenue": "Recurring giving + occasional event/ticket income",
        "site_bias": ("wordpress", 3,
                      "Weekly self-edited content (sermons, events, announcements) by non-technical "
                      "staff is exactly WordPress's job; the plugin ecosystem covers giving, events "
                      "and media out of the box."),
        "signals": ["church", "kerk", "ministry", "congregation", "gemeente", "sermon", "worship",
                    "pastor", "faith", "parish", "gospel", "discipleship", "tithe", "bible"],
    },
    "nonprofit": {
        "label": "Nonprofit / foundation (stichting)",
        "summary": "Mission-funded; donors and grants instead of customers.",
        "core": ["content_publishing", "donations", "donor_reporting", "people_roster", "events"],
        "recommended": ["support_inbox"],
        "optional": ["membership_access", "product_catalog", "checkout_payments"],
        "revenue": "Donations, grants, membership dues",
        "site_bias": ("wordpress", 3,
                      "Programme pages, annual reports and an ANBI/transparency page change often "
                      "and must be editable by staff without a developer."),
        "signals": ["nonprofit", "non-profit", "charity", "stichting", "foundation", "ngo",
                    "donor", "anbi", "volunteer", "goede doel", "fundraising", "grant"],
    },
    "service_business": {
        "label": "Service business / consultancy / agency",
        "summary": "Sells time and expertise to a small number of higher-value clients.",
        "core": ["lead_capture", "documents_contracts", "booking", "checkout_payments"],
        "recommended": ["content_publishing", "support_inbox"],
        "optional": ["product_catalog", "membership_access", "courses_lms", "subscriptions"],
        "revenue": "Projects and retainers, invoiced; deposits via checkout",
        "site_bias": ("vercel_app", 1,
                      "A service business sells through a small set of high-conversion pages that "
                      "rarely change — a fast custom site beats a CMS unless the owner publishes "
                      "regularly."),
        "signals": ["consulting", "consultancy", "agency", "freelance", "coaching", "coach",
                    "services", "retainer", "b2b", "advisory", "studio", "contractor",
                    "installation", "maintenance", "productized", "productised", "assessment",
                    "audit", "discovery call", "engagement", "done-for-you", "deliverable",
                    "implementation", "proposal", "scope of work", "hourly", "day rate"],
    },
    "ecommerce": {
        "title_note": "physical goods",
        "label": "E-commerce (physical products)",
        "summary": "Sells stocked goods that must be picked, packed and shipped.",
        "core": ["product_catalog", "checkout_payments", "inventory_shipping"],
        "recommended": ["content_publishing", "support_inbox", "email_marketing"],
        "optional": ["subscriptions", "membership_access", "booking"],
        "revenue": "Per-order product sales, margin on goods",
        "site_bias": ("wordpress", 3,
                      "WooCommerce gives catalog, stock, tax and NL shipping zones on day one; "
                      "rebuilding that in a custom app only pays off at real volume."),
        "signals": ["webshop", "web shop", "e-commerce", "ecommerce", "shop", "store", "shipping",
                    "inventory", "stock", "sku", "woocommerce", "shopify", "physical product",
                    "warehouse", "packaging"],
    },
    "digital_products": {
        "label": "Digital products",
        "summary": "Sells files, templates or downloads — no stock, instant delivery.",
        "core": ["product_catalog", "checkout_payments", "digital_fulfillment"],
        "recommended": ["content_publishing", "email_marketing"],
        "optional": ["membership_access", "courses_lms", "subscriptions", "support_inbox"],
        "revenue": "One-off digital sales; near-100% margin, fulfilment is a webhook",
        "site_bias": ("vercel_app", 3,
                      "The whole business is a funnel plus a fulfilment webhook; a CMS adds "
                      "surface area and maintenance without adding sales."),
        "signals": ["ebook", "e-book", "template", "download", "digital product", "printable",
                    "preset", "toolkit", "pdf", "worksheet", "swipe file", "notion template"],
    },
    "membership": {
        "label": "Membership / community / academy",
        "summary": "Recurring access to content, community or software for a fee.",
        "core": ["membership_access", "subscriptions", "checkout_payments", "content_publishing"],
        "recommended": ["courses_lms", "email_marketing", "support_inbox"],
        "optional": ["events", "product_catalog", "digital_fulfillment"],
        "revenue": "Monthly/annual dues; retention is the whole game",
        "site_bias": ("wordpress", 2,
                      "Gated content, drip release and member logins are a solved WordPress "
                      "problem, and the owner can add member content without a deploy."),
        "signals": ["membership", "members", "community", "club", "academy", "subscription",
                    "recurring access", "cohort", "mastermind", "inner circle"],
    },
    "education": {
        "label": "Education / training provider",
        "summary": "Teaches a curriculum to enrolled learners, online or in person.",
        "core": ["courses_lms", "checkout_payments", "content_publishing", "membership_access"],
        "recommended": ["events", "email_marketing", "support_inbox", "booking"],
        "optional": ["subscriptions", "product_catalog", "people_roster"],
        "revenue": "Course/cohort fees, sometimes subsidised or invoiced to employers",
        "site_bias": ("wordpress", 2,
                      "Curriculum pages and lesson content change constantly and are written by "
                      "teaching staff, not developers; the LMS plugins are mature."),
        "signals": ["course", "curriculum", "training", "school", "students", "lms", "workshop",
                    "cohort", "opleiding", "cursus", "certification", "bootcamp", "teacher"],
    },
    "local_venue": {
        "label": "Local venue / practice (appointment-led)",
        "summary": "A physical place customers visit — books time or serves walk-ins.",
        "core": ["booking", "lead_capture", "checkout_payments"],
        "recommended": ["content_publishing", "events", "support_inbox"],
        "optional": ["product_catalog", "inventory_shipping", "subscriptions", "membership_access"],
        "revenue": "Per-visit services, packages, sometimes retail add-ons",
        "site_bias": ("wordpress", 2,
                      "Opening hours, menus, price lists and staff pages are edited by the venue "
                      "itself; local SEO plugins and booking plugins do the rest."),
        "signals": ["restaurant", "salon", "barber", "gym", "clinic", "cafe", "praktijk",
                    "dentist", "physio", "kapper", "walk-in", "appointment", "opening hours",
                    "studio space", "wellness"],
    },
    "saas": {
        "label": "SaaS / software product",
        "summary": "The product is software; the site only sells and supports it.",
        "core": ["custom_app", "subscriptions", "checkout_payments", "support_inbox"],
        "recommended": ["content_publishing", "lead_capture", "email_marketing"],
        "optional": ["membership_access", "courses_lms"],
        "revenue": "Seats/usage subscriptions",
        "site_bias": ("vercel_app", 4,
                      "The application is the product — it needs its own auth, data model and "
                      "deploy pipeline. WordPress could at most host the marketing pages."),
        "signals": ["saas", "software", "platform", "api", "dashboard", "app users", "seats",
                    "web app", "integration", "developer tool"],
    },
    "creator_media": {
        "label": "Creator / media brand",
        "summary": "Builds an audience first; monetises it through sponsors and products.",
        "core": ["content_publishing", "media_library", "email_marketing"],
        "recommended": ["product_catalog", "checkout_payments", "digital_fulfillment"],
        "optional": ["membership_access", "subscriptions", "events", "booking"],
        "revenue": "Sponsorship, digital products, memberships",
        "site_bias": ("wordpress", 1,
                      "Publishing cadence is the business; the owner must post without help."),
        "signals": ["podcast", "youtube channel", "newsletter", "audience", "creator",
                    "influencer", "media brand", "content creator", "vlog", "substack"],
    },
}

DEFAULT_ORG_TYPE = "service_business"


# ===========================================================================
# 3. CLASSIFICATION — which org type is this, from the profile text?
# ===========================================================================

# A signal that appears while the profile is describing WHO IT SELLS TO is evidence
# about the customer, not about the organization. "A consultancy that serves churches"
# is a consultancy. Lines like these get their hits heavily discounted.
CUSTOMER_CONTEXT = re.compile(
    r"\b(target|niche|customer|client|clients|audience|prospect|buyer|market|segment|"
    r"icp|serve|serving|sell to|sold to|sells to|for (?:small|local|independent)|"
    r"who it'?s for|ideal customer)\b")

CUSTOMER_CONTEXT_WEIGHT = 0.25


def classify(text: str, hint: str = None) -> dict:
    """Deterministic keyword classification over the business profile / idea text.

    Returns {org_type, confidence, scores, matched, source}. Confidence is `high` only
    when one type clearly leads; the engine refuses to SAVE a low-confidence blueprint
    without an explicit --org-type, so a guess never silently becomes a build order.
    """
    if hint:
        if hint not in ORG_TYPES:
            raise ValueError(f"unknown org type '{hint}'. Known: {', '.join(ORG_TYPES)}")
        return {"org_type": hint, "confidence": "explicit", "scores": {}, "matched": {},
                "source": "operator"}

    lines = [ln.lower() for ln in (text or "").splitlines() if ln.strip()]
    scores, matched = {}, {}
    for key, meta in ORG_TYPES.items():
        weighted, distinct = 0.0, {}
        for sig in meta["signals"]:
            pat = re.compile(r"(?<![a-z])" + re.escape(sig) + r"(?![a-z])")
            for ln in lines:
                n = len(pat.findall(ln))
                if not n:
                    continue
                w = CUSTOMER_CONTEXT_WEIGHT if CUSTOMER_CONTEXT.search(ln) else 1.0
                weighted += n * w
                distinct[sig] = distinct.get(sig, 0) + n * w
        if weighted:
            scores[key] = round(weighted + 0.5 * len(distinct), 2)  # breadth counts too
            matched[key] = [s for s, _ in sorted(distinct.items(), key=lambda kv: -kv[1])][:6]

    if not scores:
        return {"org_type": DEFAULT_ORG_TYPE, "confidence": "low", "scores": {},
                "matched": {}, "source": "fallback"}

    ranked = sorted(scores.items(), key=lambda kv: -kv[1])
    top, top_score = ranked[0]
    runner = ranked[1][1] if len(ranked) > 1 else 0
    margin = top_score - runner
    if top_score >= 6 and margin >= 4:
        conf = "high"
    elif top_score >= 3 and margin >= 2:
        conf = "medium"
    else:
        conf = "low"
    return {"org_type": top, "confidence": conf, "scores": dict(ranked),
            "matched": matched, "source": "classifier"}


# ===========================================================================
# 4. THE PLATFORM DECISION — WordPress, custom app, or hybrid?
# ===========================================================================

PLATFORMS = {
    "wordpress": {
        "label": "WordPress",
        "what": "A WordPress site the owner can edit — themes/plugins carry the functions.",
    },
    "vercel_app": {
        "label": "Custom app (Vercel)",
        "what": "A purpose-built site/app from the dev swarm, deployed on Vercel.",
    },
    "hybrid": {
        "label": "Hybrid — WordPress front, custom app behind",
        "what": "WordPress for owner-edited content; the custom application for the logic "
                "WordPress cannot carry.",
    },
}

# Signals read straight out of the business profile text.
TEXT_SIGNALS = [
    # (regex, platform, weight, reason)
    (r"\b(wordpress|wp-admin|woocommerce|elementor)\b", "wordpress", 4,
     "The business already runs on WordPress — rebuilding elsewhere means a migration "
     "nobody asked for."),
    (r"\b(wix|squarespace|jimdo|one\.com site)\b", "wordpress", 1,
     "Currently on a hosted site builder; WordPress is the natural upgrade that keeps the "
     "owner editing."),
    (r"\b(landing page|one[- ]pager|single page|funnel|sales page)\b", "vercel_app", 2,
     "The site is a funnel, not a library — a fast custom page beats a CMS."),
    (r"\b(shopify)\b", "wordpress", 1,
     "Already selling on a hosted commerce platform; WooCommerce keeps the same shape "
     "under the operator's control."),
    (r"\b(self[- ]edit|edit (?:it |the site )?(?:them|him|her)self|update the site|"
     r"post weekly|publish weekly|non[- ]technical (?:owner|staff|team))\b", "wordpress", 2,
     "The owner intends to edit and publish without a developer."),
    (r"\b(api|integration|custom logic|algorithm|dashboard for (?:users|clients)|"
     r"member portal|calculator|quiz engine)\b", "vercel_app", 2,
     "The offer contains custom application logic that a CMS would fight."),
    (r"\b(headless|next\.js|react app)\b", "vercel_app", 2,
     "The stated direction is already a custom front end."),
]


def decide_platform(org_type: str, functions: dict, text: str, operator_platform: dict) -> dict:
    """Score {wordpress, vercel_app} and return the decision with its full rationale."""
    scores = {"wordpress": 0.0, "vercel_app": 0.0}
    reasons = []

    def add(platform, weight, reason, kind):
        scores[platform] += weight
        reasons.append({"platform": platform, "weight": weight, "reason": reason, "kind": kind})

    # (a) the org type's own lean
    plat, weight, why = ORG_TYPES[org_type]["site_bias"]
    add(plat, weight, f"{ORG_TYPES[org_type]['label']}: {why}", "org_type")

    # (b) the selected functions — what does each one actually want to run on?
    strong, weak = [], []
    for key, f in functions.items():
        if f["tier"] not in ("core", "recommended"):
            continue
        fit = FUNCTIONS[key]["wp_fit"]
        w = 1.0 if f["tier"] == "core" else 0.5
        if fit == "strong":
            scores["wordpress"] += w
            strong.append(FUNCTIONS[key]["title"])
        elif fit == "weak":
            scores["vercel_app"] += w * 1.5
            weak.append(FUNCTIONS[key]["title"])
    if strong:
        reasons.append({"platform": "wordpress", "weight": round(scores["wordpress"], 1),
                        "kind": "functions",
                        "reason": "Functions with mature WordPress coverage: " + ", ".join(strong)})
    if weak:
        reasons.append({"platform": "vercel_app", "weight": round(scores["vercel_app"], 1),
                        "kind": "functions",
                        "reason": "Functions WordPress cannot carry well: " + ", ".join(weak)})

    # (c) signals in the profile text
    low = (text or "").lower()
    for pattern, platform, w, why in TEXT_SIGNALS:
        if re.search(pattern, low):
            add(platform, w, why, "profile_signal")

    # (d) the operator's own rails — a franchisee with a WordPress product gets a real bonus
    cms_default = (operator_platform or {}).get("cms_default")
    wp_capability = (operator_platform or {}).get("wordpress_capability")
    # These two say the same thing at different strengths, so take the stronger — never
    # both. A tie-breaker-weight advantage: enough to decide a close call, never enough
    # to push a business onto WordPress that structurally needs an application.
    if wp_capability:
        add("wordpress", 1.5, f"Operator rail: {wp_capability}", "operator_rail")
    elif cms_default == "wordpress":
        add("wordpress", 1, "Operator's default CMS is WordPress (support and templates exist).",
            "operator_rail")
    if cms_default in ("vercel_app", "none", "custom"):
        add("vercel_app", 1, "Operator's default build is a custom app on their hosting rail.",
            "operator_rail")

    # --- resolve ---
    wp, app = scores["wordpress"], scores["vercel_app"]
    margin = abs(wp - app)
    has_weak_core = any(FUNCTIONS[k]["wp_fit"] == "weak" and v["tier"] == "core"
                        for k, v in functions.items())

    if wp >= app and has_weak_core:
        decision = "hybrid"
        headline = ("WordPress for the owner-edited surface, plus a custom app for the logic "
                    "WordPress cannot carry.")
    elif wp > app:
        decision = "wordpress"
        headline = "WordPress — the owner keeps control of content without a developer."
    elif app > wp:
        decision = "vercel_app"
        headline = "A custom app — the offer needs logic and speed more than it needs a CMS."
    else:
        decision = "vercel_app"
        headline = ("Tie on the evidence; defaulting to the custom app (cheaper to run, "
                    "no plugin maintenance) — operator can override.")

    confidence = "high" if margin >= 3 else ("medium" if margin >= 1.5 else "low")

    hosting = {
        "wordpress": (operator_platform or {}).get("wordpress_hosting")
                     or "managed WordPress hosting (operator rail — set platform.wordpress_hosting)",
        "vercel_app": (operator_platform or {}).get("hosting") or "Vercel",
    }
    hosting["hybrid"] = f"{hosting['wordpress']} (content) + {hosting['vercel_app']} (app)"

    return {
        "decision": decision,
        "label": PLATFORMS[decision]["label"],
        "headline": headline,
        "confidence": confidence,
        "scores": {"wordpress": round(wp, 1), "vercel_app": round(app, 1)},
        "margin": round(margin, 1),
        "hosting": hosting[decision],
        "wordpress_used": decision in ("wordpress", "hybrid"),
        "reasons": reasons,
        "reconsider_if": _reconsider(decision),
    }


def _reconsider(decision: str) -> list:
    if decision == "wordpress":
        return ["The owner will never edit the site themselves (then the CMS is pure maintenance).",
                "A core function turns out to need custom logic → move to hybrid.",
                "Plugin licence cost exceeds the build saving."]
    if decision == "vercel_app":
        return ["The owner starts publishing weekly and every edit becomes a deploy.",
                "A catalog with stock/shipping appears → WooCommerce stops being reinvented.",
                "Staff turnover means nobody can touch the code."]
    return ["The custom part shrinks to nothing → collapse back to plain WordPress.",
            "The content surface stops changing → collapse to the app alone."]


# ===========================================================================
# 5. BUILD THE BLUEPRINT
# ===========================================================================

def resolve_functions(org_type: str, add=None, remove=None) -> dict:
    """Tiered function set for an org type, plus the universal core, plus overrides."""
    meta = ORG_TYPES[org_type]
    out = {}

    def put(key, tier, why):
        if key not in FUNCTIONS:
            raise ValueError(f"unknown function '{key}'. Known: {', '.join(FUNCTIONS)}")
        rank = {"core": 3, "recommended": 2, "optional": 1}
        if key in out and rank[out[key]["tier"]] >= rank[tier]:
            return
        out[key] = {"tier": tier, "why": why}

    for k in UNIVERSAL_CORE:
        put(k, "core", "Every launched business needs this.")
    for k in UNIVERSAL_RECOMMENDED:
        put(k, "recommended", "Turnkey's standard growth loop.")
    for k in meta["core"]:
        put(k, "core", f"Core to a {meta['label'].lower()}.")
    for k in meta.get("recommended", []):
        put(k, "recommended", f"Standard for a {meta['label'].lower()}.")
    for k in meta.get("optional", []):
        put(k, "optional", "Offer it; build on request.")

    for k in (add or []):
        put(k, "core", "Operator override: explicitly added.")
        out[k] = {"tier": "core", "why": "Operator override: explicitly added."}
    for k in (remove or []):
        if k in UNIVERSAL_CORE:
            raise ValueError(f"'{k}' is universal core and cannot be removed")
        out.pop(k, None)

    # decorate with catalog metadata
    for k, v in out.items():
        f = FUNCTIONS[k]
        v.update({"title": f["title"], "domain": f["domain"], "workstream": f["workstream"],
                  "wp_fit": f["wp_fit"], "gated": f["gated"]})
    return out


def implementation(key: str, platform_decision: str) -> str:
    f = FUNCTIONS[key]
    if platform_decision == "wordpress":
        return f["wp"]
    if platform_decision == "vercel_app":
        return f["app"]
    # hybrid: WordPress carries everything it can; the app carries only what it cannot
    return f["app"] if f["wp_fit"] == "weak" else f["wp"]


def build_blueprint(text: str, org_type_hint=None, add=None, remove=None,
                    operator_platform=None) -> dict:
    cls = classify(text, org_type_hint)
    org_type = cls["org_type"]
    functions = resolve_functions(org_type, add=add, remove=remove)
    platform = decide_platform(org_type, functions, text, operator_platform or {})
    for k, v in functions.items():
        v["implementation"] = implementation(k, platform["decision"])

    by_ws = {}
    for k, v in functions.items():
        if v["tier"] == "optional":
            continue
        by_ws.setdefault(v["workstream"], []).append(k)

    return {
        "schema": SCHEMA,
        "org_type": org_type,
        "org_label": ORG_TYPES[org_type]["label"],
        "org_summary": ORG_TYPES[org_type]["summary"],
        "revenue_model": ORG_TYPES[org_type]["revenue"],
        "classification": cls,
        "functions": functions,
        "platform": platform,
        "workstream_scope": by_ws,
        "overrides": {"added": list(add or []), "removed": list(remove or [])},
    }


# ===========================================================================
# 6. RENDERING
# ===========================================================================

TIER_ORDER = {"core": 0, "recommended": 1, "optional": 2}
TIER_MARK = {"core": "● core", "recommended": "◐ recommended", "optional": "○ optional"}


def render_markdown(bp: dict, business: str, author_as: str, generated: str) -> str:
    p = bp["platform"]
    cls = bp["classification"]
    L = []
    L.append(f"# Business blueprint — {business}")
    L.append("")
    L.append(f"> Which business functions this organization needs, and what its site runs on. "
             f"Produced deterministically by the Turnkey engine from the business profile; "
             f"every line is overridable by the operator and every override is logged.")
    L.append("")
    L.append(f"**Prepared by {author_as}** · {generated}")
    L.append("")
    L.append("## 1. Organization type")
    L.append("")
    L.append(f"**{bp['org_label']}** — {bp['org_summary']}")
    L.append("")
    L.append(f"- Classification: `{cls['source']}`, confidence **{cls['confidence']}**")
    if cls.get("matched", {}).get(bp["org_type"]):
        L.append(f"- Evidence in the profile: {', '.join(cls['matched'][bp['org_type']])}")
    if cls.get("scores"):
        runners = [f"{k} ({v})" for k, v in list(cls["scores"].items())[1:4]]
        if runners:
            L.append(f"- Also considered: {', '.join(runners)}")
    L.append(f"- Revenue shape: {bp['revenue_model']}")
    L.append("")
    L.append("## 2. Site platform decision")
    L.append("")
    L.append(f"### {p['label']} — confidence {p['confidence']}")
    L.append("")
    L.append(p["headline"])
    L.append("")
    L.append(f"- **WordPress used:** {'YES' if p['wordpress_used'] else 'NO'}")
    L.append(f"- **Hosting:** {p['hosting']}")
    L.append(f"- **Score:** WordPress {p['scores']['wordpress']} · custom app "
             f"{p['scores']['vercel_app']} (margin {p['margin']})")
    L.append("")
    L.append("**Why:**")
    L.append("")
    for r in p["reasons"]:
        L.append(f"- *({PLATFORMS[r['platform']]['label']}, +{r['weight']})* {r['reason']}")
    L.append("")
    L.append("**Revisit this decision if:**")
    L.append("")
    for r in p["reconsider_if"]:
        L.append(f"- {r}")
    L.append("")
    L.append("## 3. Business functions to build")
    L.append("")
    L.append("| Function | Tier | Area | Workstream | How it gets built |")
    L.append("|---|---|---|---|---|")
    for k, v in sorted(bp["functions"].items(),
                       key=lambda kv: (TIER_ORDER[kv[1]["tier"]], kv[1]["domain"], kv[1]["title"])):
        gate = " 🔒" if v["gated"] else ""
        L.append(f"| **{v['title']}**{gate} | {TIER_MARK[v['tier']]} | {v['domain']} | "
                 f"`{v['workstream']}` | {v['implementation']} |")
    L.append("")
    L.append("🔒 = switching this function on for real is a publish/send/money gate — it needs a "
             "logged YES before it can go live.")
    L.append("")
    L.append("## 4. What each workstream must now deliver")
    L.append("")
    for ws, keys in sorted(bp["workstream_scope"].items()):
        L.append(f"- **`{ws}`** — " + "; ".join(bp["functions"][k]["title"] for k in sorted(keys)))
    L.append("")
    if bp["overrides"]["added"] or bp["overrides"]["removed"]:
        L.append("## 5. Operator overrides")
        L.append("")
        for k in bp["overrides"]["added"]:
            L.append(f"- **added** `{k}` — {FUNCTIONS[k]['title']}")
        for k in bp["overrides"]["removed"]:
            L.append(f"- **removed** `{k}`")
        L.append("")
    return "\n".join(L) + "\n"


def render_text(bp: dict) -> str:
    p = bp["platform"]
    L = [f"org type : {bp['org_label']}  ({bp['org_type']}, confidence "
         f"{bp['classification']['confidence']}, via {bp['classification']['source']})",
         f"revenue  : {bp['revenue_model']}",
         f"platform : {p['label']}   [WordPress: {'YES' if p['wordpress_used'] else 'NO'}]  "
         f"confidence {p['confidence']}  (wp {p['scores']['wordpress']} vs app "
         f"{p['scores']['vercel_app']})",
         f"hosting  : {p['hosting']}",
         "  why:"]
    for r in p["reasons"][:6]:
        L.append(f"    - ({r['platform']} +{r['weight']}) {r['reason']}")
    L.append("functions:")
    for tier in ("core", "recommended", "optional"):
        keys = [k for k, v in bp["functions"].items() if v["tier"] == tier]
        if not keys:
            continue
        L.append(f"  [{tier}]")
        for k in sorted(keys, key=lambda x: bp["functions"][x]["title"]):
            v = bp["functions"][k]
            L.append(f"    - {v['title']:<48} {v['workstream']:<14}"
                     f"{'  (gated)' if v['gated'] else ''}")
    return "\n".join(L)


def render_catalog() -> str:
    L = ["ORG TYPES", "========="]
    for k, m in ORG_TYPES.items():
        L.append(f"\n{k}  —  {m['label']}")
        L.append(f"  {m['summary']}")
        L.append(f"  revenue    : {m['revenue']}")
        L.append(f"  site bias  : {m['site_bias'][0]} (+{m['site_bias'][1]})")
        L.append(f"  core       : {', '.join(m['core'])}")
        L.append(f"  recommended: {', '.join(m.get('recommended', [])) or '—'}")
        L.append(f"  optional   : {', '.join(m.get('optional', [])) or '—'}")
    L.append("\n\nUNIVERSAL (added to every org type)")
    L.append("  core       : " + ", ".join(UNIVERSAL_CORE))
    L.append("  recommended: " + ", ".join(UNIVERSAL_RECOMMENDED))
    L.append("\n\nFUNCTION CATALOG")
    L.append("================")
    for k, f in FUNCTIONS.items():
        L.append(f"\n{k}  —  {f['title']}")
        L.append(f"  area {f['domain']} · workstream {f['workstream']} · WordPress fit "
                 f"{f['wp_fit']}" + (" · GATED" if f["gated"] else ""))
        L.append(f"  wp : {f['wp']}")
        L.append(f"  app: {f['app']}")
    return "\n".join(L)


if __name__ == "__main__":  # pragma: no cover - convenience
    import sys
    if "--catalog" in sys.argv:
        print(render_catalog())
    else:
        print(__doc__)
        print("Run with --catalog to print the org-type and function catalog.")
