#!/usr/bin/env python3
"""
data — what the gallery is allowed to say, and where each claim comes from.

A capabilities page is the easiest thing in a studio to let drift. Someone writes
"and a full booking diary" on a Tuesday, the product changes in March, and the page keeps
selling the March-before version for two years. So nothing here is typed twice: every
module name, every page name and every live URL is read at build time from the artefacts
of a real Forge run — the compiled `platform-spec.json` and the run's own `receipt.json`.

If Forge stops building a booking diary for venues, the venue page stops saying it does.

What *is* written here by hand is the part no machine can derive: who each kind of
business is, what they are actually worried about, and the visual world their page should
live in. That is the studio's judgement, and it belongs in a file a person edits.

Stdlib only.
"""

from __future__ import annotations

import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
DEMOS = os.path.join(HERE, "..", "turnkey", "forge", "demos")

# The operator's own brand. The shell is Vision Outreach Media on every page — the studio
# is the constant; the work is what changes.
VOM = {
    "navy": "#1B2A4A",
    "orange": "#E8843C",
    "teal": "#2FA8A0",
    "ink": "#1B2233",
}


# ===========================================================================
# the ten kinds of business
# ===========================================================================
#
# `art` is the visual world the page lives in, and it is deliberately not derived from
# the archetype's accent alone: a church page and a venue page differ in ground, in type,
# in scale and in what the first screen *is*, not in hue. A page that only swapped a
# colour would be a worse advertisement for a design studio than no page at all.

TYPES = [
    {
        "slug": "churches", "demo": "Bethel Chapel", "archetype": "church",
        "label": "Churches", "one": "A church",
        "headline": "The website answers the question people are too shy to ask.",
        "lede": "“Can I come on Sunday, and what happens if I do?” Everything else on a "
                "church website is secondary to that, and most church websites answer it "
                "last — somewhere under a menu called Ministries.",
        "worry": "The people most likely to visit are the people least likely to ask.",
        "gets": [
            ("A visit page that removes every unknown",
             "What to wear, where the children go, whether anyone will make you speak. "
             "Written out, not implied."),
            ("Giving that is not embarrassing",
             "One-off or monthly, by fund, with the annual figures published to anyone "
             "who asks."),
            ("The sermon archive people actually return for",
             "The single most-visited page on a church site, and usually the worst-made one."),
            ("A serving rota that is not a group chat",
             "Who is on which team, which Sunday, confirmed or not."),
        ],
        "art": {
            "ground": "#F7F4ED", "ink": "#1B1815", "muted": "#6A6259", "line": "#E4DED2",
            "accent": "#C25508", "accent2": "#E8843C", "scheme": "light",
            "display": "'Iowan Old Style','Palatino Linotype',Palatino,'Book Antiqua',Georgia,serif",
            "body": "'Avenir Next','Segoe UI',system-ui,sans-serif",
            "hero": "arch",
        },
    },
    {
        "slug": "studios", "demo": "Vale Studio", "archetype": "solo_business",
        "label": "One-person studios", "one": "A one-person business",
        "headline": "You are the product. The back office should not be your second job.",
        "lede": "A studio of one lives or dies on the hours it can bill. Every hour spent "
                "chasing a quote, rewriting an invoice or remembering who was supposed to "
                "reply is an hour taken directly off the top.",
        "worry": "The admin does not scale, and it is always you.",
        "gets": [
            ("A site whose only job is a booked call",
             "Not a brochure. A path from stranger to a time in your diary."),
            ("Every enquiry in one pipeline",
             "Who asked, what for, what you quoted, what they said."),
            ("Quotes and contracts that go out the same day",
             "Because the quote you send on Friday wins the work the one you send on "
             "Wednesday would have."),
            ("Invoices with the VAT already worked out",
             "And a view of what is owed that you do not have to assemble."),
        ],
        "art": {
            "ground": "#FFFFFF", "ink": "#0F141A", "muted": "#5A6672", "line": "#E4E8EC",
            "accent": "#0B7BB5", "accent2": "#38BDF8", "scheme": "light",
            "display": "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
            "body": "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
            "hero": "index",
        },
    },
    {
        "slug": "charities", "demo": "Warm Coats Foundation", "archetype": "nonprofit",
        "label": "Charities", "one": "A charity",
        "headline": "Publish the account before anyone asks for it.",
        "lede": "A charity is funded by people who will never use the service. The only "
                "thing that keeps them giving a second time is being told, in numbers, "
                "what the first gift did.",
        "worry": "Trust is the whole product, and it is rebuilt every year.",
        "gets": [
            ("An annual account that is a page, not a PDF nobody opens",
             "Income, spending, what it bought, and the parts that did not go to plan."),
            ("Giving, restricted or general",
             "Restricted gifts tracked and reported separately, because that is the promise."),
            ("A volunteer desk that answers within a week",
             "With something specific, never a generic newsletter."),
            ("Supporters in one place",
             "So the thank-you goes to the right person and the ask does not go to the "
             "person who just gave."),
        ],
        "art": {
            "ground": "#F3F6F4", "ink": "#15211C", "muted": "#54635C", "line": "#DDE6E1",
            "accent": "#046B4E", "accent2": "#10B981", "scheme": "light",
            "display": "'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif",
            "body": "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
            "hero": "ledger",
        },
    },
    {
        "slug": "shops", "demo": "Kade Ceramics", "archetype": "ecommerce",
        "label": "Shops", "one": "An online shop",
        "headline": "Describe the object. Let it do the selling.",
        "lede": "What it is made of, how big it is, when it arrives. A shop that has to "
                "shout has usually failed to say those three things clearly.",
        "worry": "Stock, dispatch and returns — the unglamorous half nobody demos.",
        "gets": [
            ("A catalogue with the price on it",
             "No “enquire for pricing”, no permanent sale, no invented original price."),
            ("Stock that cannot be oversold",
             "Because the reorder point is in the same system as the listing."),
            ("Delivery and returns written out before checkout",
             "The two questions that stop a first order, answered where they are asked."),
            ("Orders, customers and messages in one place",
             "So the person who packed it is the person who can fix it."),
        ],
        "art": {
            "ground": "#FAF7F4", "ink": "#1A1414", "muted": "#6B5C5C", "line": "#E8DEDA",
            "accent": "#A8102F", "accent2": "#F43F5E", "scheme": "light",
            "display": "'Didot','Bodoni 72','Playfair Display',Georgia,serif",
            "body": "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
            "hero": "objects",
        },
    },
    {
        "slug": "digital-products", "demo": "Plainsheet", "archetype": "digital_products",
        "label": "Digital products", "one": "A digital product",
        "headline": "Ten seconds between paying and having the file.",
        "lede": "Everything else is detail. A digital product cannot be picked up and "
                "flicked through, so it has to be described precisely — file by file — or "
                "it is a promise rather than a purchase.",
        "worry": "One payment, instant delivery, and no support queue.",
        "gets": [
            ("A contents list, not a sales page",
             "Formats, page counts, what needs which software. Stated before payment."),
            ("Checkout with nothing after it",
             "No account to create, no upsell on the way through, no subscription hiding "
             "behind the price."),
            ("Delivery that stays valid",
             "The original link keeps working and always points at the current version."),
            ("The list of everyone who bought",
             "Which is the asset — the product is just what you sold them first."),
        ],
        "art": {
            "ground": "#0D0D12", "ink": "#EDECF5", "muted": "#9A98AE", "line": "#252431",
            "accent": "#A78BFA", "accent2": "#8B5CF6", "scheme": "dark",
            "display": "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
            "body": "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
            "hero": "manifest",
        },
    },
    {
        "slug": "clubs", "demo": "The Long Table", "archetype": "membership",
        "label": "Clubs & memberships", "one": "A membership",
        "headline": "A membership nobody can leave is a membership nobody joins.",
        "lede": "Recurring money for continuing access. The two numbers that decide whether "
                "it works are who is in and who quietly left — and the second one is the "
                "one most systems hide.",
        "worry": "Churn you find out about a quarter late.",
        "gets": [
            ("One-click cancellation, said out loud",
             "On the join page, before payment. It is why people join."),
            ("Members, and when each of them joined",
             "So a lapse is something you notice in the week, not the quarter."),
            ("A calendar members turn up to",
             "The part of a membership that is actually the membership."),
            ("Somewhere that is theirs",
             "Posts, recordings and the archive — behind the same login as the billing."),
        ],
        "art": {
            "ground": "#17120C", "ink": "#F6EFE4", "muted": "#B3A491", "line": "#332818",
            "accent": "#F5B544", "accent2": "#F59E0B", "scheme": "dark",
            "display": "'Avenir Next','Segoe UI',ui-sans-serif,system-ui,sans-serif",
            "body": "'Avenir Next','Segoe UI',ui-sans-serif,system-ui,sans-serif",
            "hero": "card",
        },
    },
    {
        "slug": "schools", "demo": "Northlight School", "archetype": "education",
        "label": "Courses & schools", "one": "A course business",
        "headline": "Say what they will be able to do at the end.",
        "lede": "Not what the course covers — what the person can do afterwards that they "
                "cannot do now. Everything a prospective student weighs comes down to "
                "that, the hours it costs, and whether anyone answers their questions.",
        "worry": "The second cohort should be easier to run than the first.",
        "gets": [
            ("A curriculum on the page",
             "Lesson by lesson, with the hours, before anyone is asked to enrol."),
            ("Students and how far each has got",
             "So the person stuck on lesson three gets an email, not a survey in June."),
            ("Enrolment that takes one payment",
             "Or two instalments, or an invoice with the employer's details on it."),
            ("Access that does not expire",
             "Including the updates — which is what makes the second cohort cheap."),
        ],
        "art": {
            "ground": "#F5F7F6", "ink": "#131E1C", "muted": "#556360", "line": "#DEE7E4",
            "accent": "#0E6A63", "accent2": "#14B8A6", "scheme": "light",
            "display": "'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif",
            "body": "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
            "hero": "syllabus",
        },
    },
    {
        "slug": "venues", "demo": "De Zaal", "archetype": "local_venue",
        "label": "Venues", "one": "A venue",
        "headline": "What's on, can I book, how do I get there.",
        "lede": "Three questions. A venue website that answers them in the first screen "
                "fills the room; one that opens with a paragraph about atmosphere does not.",
        "worry": "Two bookings landing on one evening.",
        "gets": [
            ("A calendar that is the front page",
             "The most-visited page a venue has, treated like it."),
            ("A diary two people cannot double-book",
             "Tables, private hire and whole-venue bookings in one place."),
            ("Booking in thirty seconds",
             "Date, time, how many. Confirmed the same day — including when the answer is "
             "no."),
            ("Getting here, without a map app",
             "Opening hours, step-free access, where to leave the bike."),
        ],
        "art": {
            "ground": "#0A090C", "ink": "#F4EFF6", "muted": "#9E93A6", "line": "#241F28",
            "accent": "#EC6FF5", "accent2": "#D946EF", "scheme": "dark",
            "display": "'Didot','Bodoni 72','Playfair Display',Georgia,serif",
            "body": "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
            "hero": "poster",
        },
    },
    {
        "slug": "software", "demo": "Rosterly", "archetype": "saas",
        "label": "Software", "one": "A software product",
        "headline": "Publish the price. A pricing page with a form on it is not one.",
        "lede": "Software rented by the month lives on one number: how many people who "
                "start a trial are still paying in month three. Everything the public site "
                "does is in service of getting the right people to that trial.",
        "worry": "Trials that never become customers, and nobody knows why.",
        "gets": [
            ("Pricing on a page, per month, no call",
             "The single fastest way to stop wasting your time and theirs."),
            ("A trial with every feature switched on",
             "Nothing held back to make the paid version look better."),
            ("Accounts and subscriptions in one system",
             "Upgrades prorated, cancellations honoured, exports always available."),
            ("Support and sales in the same inbox",
             "Which keeps both of them honest."),
        ],
        "art": {
            "ground": "#F7F8FC", "ink": "#121424", "muted": "#5B6076", "line": "#E2E4F0",
            "accent": "#4338CA", "accent2": "#6366F1", "scheme": "light",
            "display": "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
            "body": "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
            "hero": "window",
        },
    },
    {
        "slug": "prelaunch", "demo": "Ferry Coffee", "archetype": "prelaunch",
        "label": "Ideas not yet built", "one": "An idea",
        "headline": "Find out whether anyone wants it before you build it.",
        "lede": "One page that states the promise, asks for a name and an email, and "
                "counts. It costs an afternoon, and it is the only honest way to find out "
                "whether the thing is worth the six months.",
        "worry": "Building for a year for an audience that was never there.",
        "gets": [
            ("A page that makes one specific promise",
             "Not a teaser. Something a person can say yes or no to."),
            ("A count you can act on",
             "Names, dates, and where they came from."),
            ("A decision, not a vibe",
             "Enough signal and you build. Not enough and you have lost an afternoon "
             "instead of a year."),
            ("A funnel that keeps running",
             "It deploys separately, so building the real platform never takes down the "
             "page still collecting names."),
        ],
        "art": {
            "ground": "#FFFFFF", "ink": "#0E1512", "muted": "#55655D", "line": "#E3EAE6",
            "accent": "#1F7F4C", "accent2": "#2F9E63", "scheme": "light",
            "display": "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
            "body": "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
            "hero": "counter",
        },
    },
]


# ===========================================================================
# the rest of what the studio builds
# ===========================================================================

CAPABILITIES = [
    {
        "key": "platforms", "title": "Platforms",
        "one": "A website and the back office behind it, built together.",
        "body": "Most businesses end up with a website from one place and a pile of "
                "spreadsheets from another, and spend years typing things into both. "
                "These are built as one system: what the owner types into Events is what "
                "a visitor reads on the site.",
        "proof": "Ten kinds of business, each with a working example you can open.",
    },
    {
        "key": "presence", "title": "Presence benchmarking",
        "one": "Your public footprint, scored across eight channels.",
        "body": "Website, Google Business, YouTube, Facebook, Instagram, LinkedIn, X and "
                "news coverage — measured on the same rubric every month, so “we should "
                "post more” becomes a ranked list of what is actually costing you.",
        "proof": "The same analysis runs on competitors, which is usually the more "
                 "uncomfortable half.",
    },
    {
        "key": "funnels", "title": "Validation funnels",
        "one": "Evidence before investment.",
        "body": "A single page that makes one promise and counts who says yes. Deployed "
                "on its own, so it keeps collecting while the real thing is built — or "
                "tells you not to build it.",
        "proof": "An afternoon, against six months of building the wrong thing.",
    },
    {
        "key": "custom", "title": "Everything else",
        "one": "When the shape does not fit any of the above.",
        "body": "Internal tools, client portals, reporting consoles, integrations between "
                "two systems that were never meant to speak. Built the same way and to "
                "the same standard as the rest.",
        "proof": "Including the system that built this page.",
    },
]


# ===========================================================================
# facts, read from the artefacts of real runs
# ===========================================================================

def _read_json(path, default=None):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def live_url(demo: str) -> str:
    """The address a real run actually published to.

    Read from the run receipts, never composed from the project name. A guessed URL that
    404s on a page selling reliability is the worst possible advertisement."""
    folder = os.path.join(DEMOS, demo, "forge")
    best = ""
    if not os.path.isdir(folder):
        return ""
    for rid in sorted(os.listdir(folder)):
        rec = _read_json(os.path.join(folder, rid, "receipt.json"))
        if rec and rec.get("target") == "vercel":
            alias = (rec.get("artifacts") or {}).get("alias")
            if alias:
                best = alias
    return best


def facts(t: dict) -> dict:
    """Everything the page is allowed to state about what gets built."""
    sp = _read_json(os.path.join(DEMOS, t["demo"], "turnkey", "platform-spec.json"))
    if not sp:
        raise SystemExit(
            f"no compiled spec for {t['demo']}. The gallery is generated from real runs, "
            f"so run `python3 turnkey/forge/build.py` first rather than publishing a page "
            f"that describes a build nobody made.")
    return {
        "business": sp["business"]["name"],
        "city": sp["business"].get("city", ""),
        "forge": sp["archetype"]["forge"]["name"],
        "summary": sp["archetype"]["summary"],
        "modules": [m["title"] for m in sp["modules"]],
        "pages": [p["title"] for p in sp["site"]["pages"]],
        "n_modules": len(sp["modules"]),
        "n_pages": len(sp["site"]["pages"]),
        "live": live_url(t["demo"]),
    }


def all_types() -> list:
    return [dict(t, facts=facts(t)) for t in TYPES]
