#!/usr/bin/env python3
"""
archetypes — the platform templates Forge builds from.

`blueprints.py` decides *what a business needs* (org type -> functions -> WordPress or
app). That is a decision model: it is right, but it is abstract. An automated builder
cannot run on "this church needs donations and events" — it needs to know which pages
exist, what each one says, which modules the owner opens on Monday morning, what the
first records look like so the thing is not an empty shell, and what must be true before
anyone calls it built.

An ARCHETYPE is that missing layer — but it is **not a bespoke platform**. There is one
general, module-based platform engine, and an archetype is a *composition* over it:

    a set of modules (from the shared module catalog)
  + a set of page sections (from the shared section vocabulary below)
  + a content pack (copy, seed records, rails)
  + a forge identity (the name and colours the operator watches it build under)

Nothing here is a code path. CHURCHforge and BIZforge run the same builder, the same
renderer and the same module runtime; they differ only in what they compose. That is
what makes a third archetype a data change rather than a project, and what lets a
platform be *initiated dynamically* — named, composed and launched in minutes, with no
build step waiting on a person.

Every decision is made here, in advance, once — which is precisely what makes an
unattended build possible. Forge asks the archetype and never asks a person.

Two are first-class, in the order the operator asked for them:

    church          — gathering-led, funded by giving. Services, sermons, events,
                      giving, the people who serve, and a public site that answers
                      "can I come on Sunday?" before it asks for anything.
    solo_business   — one person selling their own time or craft. Pipeline, quotes,
                      invoices, bookings, enquiries, and a site whose whole job is to
                      turn a stranger into a booked call.

All ten org types are now written: church, solo_business, nonprofit, ecommerce,
digital_products, membership, education, local_venue, saas — plus `prelaunch`, which is a
phase rather than a kind of business. `generic` remains as the resolver's answer for an
org type nobody has written yet. It is honest, not a stub: it produces a working platform
and a plain site, and reports `curated: false` so nobody mistakes it for a tailored one.

Stdlib only, like the rest of the engine. No network, no randomness — the same business
always compiles to the same platform.
"""

from __future__ import annotations

SCHEMA = 1

# Placeholders resolved at compile time: {business} {operator} {city} {year}
# Anything unresolved is a build failure, not a shipped "{business}" on a live page.

# The shared section vocabulary. Every archetype page is assembled from these and only
# these, and the site renderer implements exactly this list — so a new archetype is
# written in data, never in code, and can never need a renderer change to launch.
SECTION_KINDS = {
    "facts":   "a labelled key/value strip — the answers people scan for",
    "cards":   "three-to-twelve short cards, from a content block or written inline",
    "steps":   "a numbered sequence — how something goes, in order",
    "faq":     "question and answer pairs",
    "prose":   "a block of written text under a heading",
    "feed":    "records from a platform module, rendered live (events, media, …)",
    "form":    "a capture form whose submissions land in a named module",
    "pay":     "a payment or giving block, live or clearly labelled as not yet wired",
    "pricing": "published prices",
    "cta":     "a closing call to action",
}

# Module keys come from the shared catalog in platform_gen.MODULES — an archetype selects
# from it, never defines its own. Same runtime, different composition.


# ===========================================================================
# CHURCH
# ===========================================================================

CHURCH = {
    "id": "church",
    "label": "Church / faith community",
    "type_preset": "editorial",
    "curated": True,
    "org_types": ["church"],
    "summary": "A gathering-led community funded by giving. The platform runs Sunday "
               "and the week around it: services and sermons, events, giving, the "
               "people who serve, and the messages that come in.",

    # The forge that builds this archetype has its own identity — the operator sees
    # CHURCHforge running, not a generic progress bar. Orange on black.
    "forge": {
        "name": "CHURCHforge",
        "scheme": "dark",
        "base": "#0A0A0B",
        "base_soft": "#141416",
        "accent": "#F97316",
        "accent_2": "#FDBA74",
        # The console runs on black, where a bright accent is legible. A client's site runs
        # on the house's warm paper, where the same value fails contrast — so the built site
        # carries a darkened sibling of the same hue. Same colour, honest ratios.
        "accent_site": "#e2670a",
        "on_accent": "#0A0A0B",
        "line": "Building a church platform.",
    },
    "accent": "#F97316",          # orange on black — the CHURCHforge signature
    "accent_soft": "#FFF1E6",
    "voice": "Warm, plain, unhurried. Welcoming before it is informative, informative "
             "before it asks for anything. No hype, no jargon, no pressure.",

    # --- the operating platform --------------------------------------------
    # `require` is added even if the blueprint did not select it; `drop` is removed
    # even if it did. Both are archetype convictions, and both are logged.
    "modules": {
        "require": ["donations", "events", "media_library", "people_roster",
                    "support_inbox", "content_publishing"],
        "drop": ["product_catalog", "inventory_shipping", "courses_lms"],
        "order": ["events", "donations", "media_library", "people_roster",
                  "crm", "support_inbox", "content_publishing", "email_marketing",
                  "finance_admin", "donor_reporting", "lead_capture"],
        "rename": {
            "crm": "People",                 # the congregation, not a sales pipeline
            "people_roster": "Serving rota",  # who is on which team, which Sunday
            "media_library": "Sermons",
            "finance_admin": "Finances",
            "lead_capture": "New here",
            "support_inbox": "Messages",
        },
    },

    # --- the public site ----------------------------------------------------
    "site": {
        "primary_cta": {"label": "Plan your visit", "href": "/visit"},
        "secondary_cta": {"label": "Give", "href": "/give"},
        "nav": ["home", "visit", "about", "sermons", "events", "give", "contact"],
        "pages": [
            {
                "slug": "home", "path": "index.html", "title": "Home",
                "purpose": "Answer 'can I come on Sunday, and what happens if I do?' "
                           "in the first screen.",
                "hero": {
                    "eyebrow": "You are welcome here",
                    "title": "{business}",
                    "lede": "A church in {city} that gathers every Sunday. Come as you "
                            "are — there is a seat, and someone will show you where it is.",
                    "cta": "Plan your visit", "cta_href": "/visit",
                    "cta2": "Listen to a sermon", "cta2_href": "/sermons",
                },
                "sections": [
                    {"kind": "facts", "title": "Sunday at a glance", "items": [
                        {"label": "We gather", "value": "Sunday, 10:00"},
                        {"label": "Where", "value": "{city}"},
                        {"label": "How long", "value": "About 90 minutes"},
                        {"label": "Children", "value": "Welcome, with their own programme"},
                    ]},
                    {"kind": "cards", "title": "What you will find", "items": [
                        {"title": "A real welcome",
                         "body": "Someone at the door who knows you are new, and does not "
                                 "make a thing of it."},
                        {"title": "Teaching you can use",
                         "body": "Straight from the text, in ordinary language, about the "
                                 "week you are actually living."},
                        {"title": "People, not a programme",
                         "body": "Coffee afterwards. Nobody hurries out. That is on purpose."},
                    ]},
                    {"kind": "feed", "title": "Coming up", "source": "events", "limit": 3,
                     "empty": "The next gatherings will be listed here."},
                    {"kind": "feed", "title": "Latest teaching", "source": "media_library",
                     "limit": 3, "empty": "Recent sermons will be listed here."},
                    {"kind": "cta", "title": "Thinking about coming?",
                     "body": "Tell us you are coming and we will look out for you. "
                             "No follow-up you did not ask for.",
                     "cta": "Plan your visit", "cta_href": "/visit"},
                ],
            },
            {
                "slug": "visit", "path": "visit.html", "title": "Plan your visit",
                "purpose": "Remove every unknown that keeps a first-time visitor at home.",
                "hero": {"eyebrow": "First time", "title": "What to expect",
                         "lede": "Everything you might wonder about, answered before you ask."},
                "sections": [
                    {"kind": "steps", "title": "How Sunday goes", "items": [
                        {"title": "Arrive", "body": "Doors open 20 minutes early. Park, come in, "
                                                    "take a coffee. Someone will say hello."},
                        {"title": "Gather", "body": "Singing, a reading, and a talk from the Bible. "
                                                    "About 90 minutes in total."},
                        {"title": "Stay a while", "body": "Coffee afterwards. Stay as long or as "
                                                          "short as you like — both are normal."},
                    ]},
                    {"kind": "faq", "title": "The questions people actually ask", "items": [
                        {"q": "What do I wear?",
                         "a": "Whatever you would wear to meet a friend. Nobody is checking."},
                        {"q": "Where do my children go?",
                         "a": "There is a programme for children during the talk. You can keep "
                              "them with you if you would rather."},
                        {"q": "Will I have to say anything?",
                         "a": "No. You can sit at the back and leave straight after. That is fine."},
                        {"q": "Do I have to give money?",
                         "a": "No. Giving is for people who call this their church home, and it "
                              "is never collected from visitors."},
                    ]},
                    {"kind": "form", "title": "Tell us you are coming", "form": "visit",
                     "body": "Optional, but it means someone will be looking out for you.",
                     "fields": ["name", "email", "when", "message"], "target": "lead_capture"},
                ],
            },
            {
                "slug": "about", "path": "about.html", "title": "About",
                "purpose": "Say what this church believes and who leads it, without jargon.",
                "hero": {"eyebrow": "About us", "title": "Who we are",
                         "lede": "{business} in {city} — what we believe, and how we try to live it."},
                "sections": [
                    {"kind": "prose", "title": "What we believe", "body": "{beliefs}"},
                    {"kind": "cards", "title": "How we try to live", "items": [
                        {"title": "Scripture first",
                         "body": "We teach through the Bible rather than around it."},
                        {"title": "Open table",
                         "body": "Everyone is welcome long before they agree with everything."},
                        {"title": "Local and practical",
                         "body": "We serve the neighbourhood we are actually in."},
                    ]},
                    {"kind": "prose", "title": "Leadership", "body": "{leadership}"},
                ],
            },
            {
                "slug": "sermons", "path": "sermons.html", "title": "Sermons",
                "purpose": "The teaching archive — the main reason people return to a church site.",
                "hero": {"eyebrow": "Teaching", "title": "Sermons",
                         "lede": "Listen back, catch up, or start with the most recent."},
                "sections": [
                    {"kind": "feed", "title": "All teaching", "source": "media_library",
                     "limit": 30, "empty": "Sermons appear here as they are added."},
                ],
            },
            {
                "slug": "events", "path": "events.html", "title": "Events",
                "purpose": "Everything on the calendar, with enough detail to turn up.",
                "hero": {"eyebrow": "Calendar", "title": "What is on",
                         "lede": "Gatherings, groups and one-off events."},
                "sections": [
                    {"kind": "feed", "title": "Coming up", "source": "events", "limit": 30,
                     "empty": "Upcoming events appear here."},
                ],
            },
            {
                "slug": "give", "path": "give.html", "title": "Give",
                "purpose": "Make giving simple and unembarrassing, and say where it goes.",
                "hero": {"eyebrow": "Giving", "title": "Give",
                         "lede": "{business} runs on the generosity of the people who call it home."},
                "sections": [
                    {"kind": "prose", "title": "Where it goes",
                     "body": "Giving covers the ordinary costs of a church — the building, the "
                             "people who serve full time, the work we do in {city}, and support "
                             "for people in need. The annual figures are published to anyone "
                             "who asks."},
                    {"kind": "pay", "title": "Give now", "provider": "stripe",
                     "options": ["One-off", "Monthly"],
                     "funds": ["General", "Building", "Missions", "Benevolence"],
                     "fallback": "Bank transfer details are below until online giving is switched on."},
                    {"kind": "faq", "title": "Questions about giving", "items": [
                        {"q": "Is it tax deductible?",
                         "a": "For registered charitable status in the Netherlands (ANBI), gifts are "
                              "deductible under the usual conditions. Ask us for the details."},
                        {"q": "Can I stop a recurring gift?",
                         "a": "Any time, yourself, without a conversation."},
                        {"q": "Do you know who gives what?",
                         "a": "Only the person who keeps the books, and only because the law "
                              "requires it."},
                    ]},
                ],
            },
            {
                "slug": "contact", "path": "contact.html", "title": "Contact",
                "purpose": "One place to reach a human, plus prayer requests.",
                "hero": {"eyebrow": "Get in touch", "title": "Contact",
                         "lede": "A real person reads these."},
                "sections": [
                    {"kind": "form", "title": "Send a message", "form": "contact",
                     "body": "Questions, prayer requests, or anything else.",
                     "fields": ["name", "email", "subject", "message"], "target": "support_inbox"},
                    {"kind": "facts", "title": "Find us", "items": [
                        {"label": "Where", "value": "{city}"},
                        {"label": "Sundays", "value": "10:00"},
                        {"label": "Email", "value": "{email}"},
                    ]},
                ],
            },
        ],
    },

    # --- what the owner sees on day one -------------------------------------
    # Seed records are examples, clearly dated and obviously editable. An empty
    # platform teaches nobody how to use it; a seeded one is self-documenting.
    "seed": {
        "events": [
            {"title": "Sunday gathering", "date": "{next_sunday}", "time": "10:00",
             "place": "{city}", "rsvp": 0,
             "note": "Weekly. Children's programme runs during the talk."},
            {"title": "Prayer evening", "date": "{date_later}", "time": "19:30",
             "place": "{city}", "rsvp": 0, "note": "Second Tuesday of the month."},
            {"title": "Newcomers' coffee", "date": "{date_further}", "time": "11:45",
             "place": "{city}", "rsvp": 0,
             "note": "After the gathering, first Sunday of the month."},
        ],
        "media_library": [
            {"title": "Begin here", "speaker": "Teaching team", "date": "{date_recent}",
             "series": "Foundations",
             "summary": "An opening talk on what this church is for."},
            {"title": "The long obedience", "speaker": "Teaching team", "date": "{date_earlier}",
             "series": "Foundations",
             "summary": "On staying with something past the first enthusiasm."},
        ],
        "donations": [
            {"giver": "Example — replace me", "amount": 50, "date": "{date_recent}",
             "recurring": True, "fund": "General",
             "note": "Seed record so the giving view is not empty. Delete when real gifts arrive."},
        ],
        "people_roster": [
            {"person": "Example — replace me", "role": "Welcome", "date": "{next_sunday}",
             "confirmed": False},
            {"person": "Example — replace me", "role": "Sound", "date": "{next_sunday}",
             "confirmed": False},
        ],
        "content_publishing": [
            {"title": "Welcome to our new site", "status": "Draft", "channel": "Website",
             "date": "{today}",
             "body": "A short post announcing the new site and how to plan a visit."},
        ],
    },

    # --- rails --------------------------------------------------------------
    "integrations": {
        "payments": {"provider": "stripe", "purpose": "online giving, one-off and recurring",
                     "env": ["STRIPE_PUBLISHABLE_KEY", "STRIPE_SECRET_KEY"]},
        "email": {"provider": "brevo", "purpose": "newsletter and reply-from-inbox",
                  "env": ["BREVO_API_KEY", "BREVO_SENDER_EMAIL"]},
        "analytics": {"provider": "engage_ai", "purpose": "presence benchmark across 8 channels",
                      "env": ["ENGAGE_AI_BASE_URL"]},
    },

    "checks": [
        {"id": "visit_path", "kind": "site_path",
         "assert": "A first-time visitor can reach 'Plan your visit' from the home page in one click."},
        {"id": "giving_present", "kind": "module_present", "target": "donations",
         "assert": "Giving exists in the platform — a church that cannot record a gift is not launched."},
        {"id": "events_seeded", "kind": "seed_present", "target": "events",
         "assert": "The events view opens with something in it."},
        {"id": "no_ask_before_welcome", "kind": "copy_order",
         "assert": "The home page welcomes before it asks for money."},
    ],
}


# ===========================================================================
# SOLO BUSINESS
# ===========================================================================

SOLO_BUSINESS = {
    "id": "solo_business",
    "label": "Solo business / one-person service company",
    "type_preset": "humanist",
    "curated": True,
    "org_types": ["service_business", "creator_media"],
    "summary": "One person selling their own time, skill or craft. The platform is the "
               "back office they do not have: who is in the pipeline, what was quoted, "
               "what is booked, what is owed, and what still needs an answer.",

    # BIZforge — sky blue on black. Distinct from CHURCHforge at a glance, so an
    # operator watching a build always knows which kind of platform is being made.
    "forge": {
        "name": "BIZforge",
        "scheme": "dark",
        "base": "#0A0A0B",
        "base_soft": "#141416",
        "accent": "#38BDF8",
        "accent_2": "#7DD3FC",
        "accent_site": "#0d87c4",     # sky blue is unreadable on paper; this is not
        "on_accent": "#0A0A0B",
        "line": "Building a one-person business platform.",
    },
    "accent": "#38BDF8",          # sky blue on black — the BIZforge signature
    "accent_soft": "#E6F6FE",
    "voice": "Direct, competent, unpretentious. The reader should finish a page knowing "
             "exactly what happens next and what it costs. No 'we' from a company of one.",

    "modules": {
        "require": ["crm", "booking", "documents_contracts", "finance_admin",
                    "lead_capture", "support_inbox"],
        "drop": ["donations", "donor_reporting", "people_roster", "inventory_shipping"],
        "order": ["crm", "lead_capture", "booking", "documents_contracts", "finance_admin",
                  "support_inbox", "content_publishing", "email_marketing",
                  "product_catalog", "checkout_payments"],
        "rename": {
            "crm": "Pipeline",
            "documents_contracts": "Quotes",
            "finance_admin": "Invoices",
            "lead_capture": "Enquiries",
        },
    },

    "site": {
        "primary_cta": {"label": "Book a call", "href": "/book"},
        "secondary_cta": {"label": "See pricing", "href": "/pricing"},
        "nav": ["home", "services", "process", "pricing", "about", "book", "contact"],
        "pages": [
            {
                "slug": "home", "path": "index.html", "title": "Home",
                "purpose": "Say what is sold, to whom, and what it costs to start — above the fold.",
                "hero": {
                    "eyebrow": "{tagline}",
                    "title": "{business}",
                    "lede": "{offer_line}",
                    "cta": "Book a call", "cta_href": "/book",
                    "cta2": "See pricing", "cta2_href": "/pricing",
                },
                "sections": [
                    {"kind": "cards", "title": "What I do", "source": "services", "limit": 3},
                    {"kind": "steps", "title": "How it works", "items": [
                        {"title": "A short call",
                         "body": "Twenty minutes. You describe the problem; I say whether I am "
                                 "the right person for it."},
                        {"title": "A written quote",
                         "body": "Fixed scope, fixed price, a date. No hourly surprises."},
                        {"title": "The work",
                         "body": "You get progress you can see, not status meetings."},
                    ]},
                    {"kind": "facts", "title": "Straight answers", "items": [
                        {"label": "Based in", "value": "{city}"},
                        {"label": "Typical start", "value": "Within two weeks"},
                        {"label": "How I price", "value": "Fixed price per project"},
                        {"label": "First call", "value": "Free, 20 minutes"},
                    ]},
                    {"kind": "cta", "title": "Have something in mind?",
                     "body": "Book twenty minutes. If I am not the right fit I will say so on "
                             "the call and point you somewhere better.",
                     "cta": "Book a call", "cta_href": "/book"},
                ],
            },
            {
                "slug": "services", "path": "services.html", "title": "Services",
                "purpose": "Each offer as a concrete deliverable, not a capability list.",
                "hero": {"eyebrow": "Services", "title": "What I do",
                         "lede": "Each one is a defined piece of work with a price and an end."},
                "sections": [
                    {"kind": "cards", "title": "Offers", "source": "services", "limit": 12},
                    {"kind": "prose", "title": "Not sure which one?",
                     "body": "Book the call and describe the problem in your own words. Picking "
                             "the right piece of work is my job, not yours."},
                ],
            },
            {
                "slug": "process", "path": "process.html", "title": "How it works",
                "purpose": "Remove the fear of hiring a one-person business.",
                "hero": {"eyebrow": "Process", "title": "How working together goes",
                         "lede": "From first message to finished work, with nothing hidden."},
                "sections": [
                    {"kind": "steps", "title": "Step by step", "items": [
                        {"title": "1 · You get in touch",
                         "body": "A form, an email, or a booked call. Whichever is easiest."},
                        {"title": "2 · We talk for twenty minutes",
                         "body": "What you need, when, and whether I am the right person."},
                        {"title": "3 · A written quote",
                         "body": "Scope, price, dates, and what I need from you. Valid 30 days."},
                        {"title": "4 · The work",
                         "body": "Regular, visible progress. You always know what stage it is at."},
                        {"title": "5 · Handover and invoice",
                         "body": "You get everything, owned outright. The invoice follows."},
                    ]},
                    {"kind": "faq", "title": "Fair questions", "items": [
                        {"q": "What if you get sick or busy?",
                         "a": "You are told immediately and given a new date. A one-person business "
                              "that hides a delay does not stay in business."},
                        {"q": "Who owns the work?",
                         "a": "You do, in full, once the invoice is settled."},
                        {"q": "Do you take deposits?",
                         "a": "For larger projects, a third up front. It is in the quote, never a surprise."},
                    ]},
                ],
            },
            {
                "slug": "pricing", "path": "pricing.html", "title": "Pricing",
                "purpose": "Publish prices. Most competitors will not, and that is the advantage.",
                "hero": {"eyebrow": "Pricing", "title": "What it costs",
                         "lede": "Published, so you can decide before you spend a call on it."},
                "sections": [
                    {"kind": "pricing", "title": "Ways to work together", "source": "pricing"},
                    {"kind": "prose", "title": "What is always included",
                     "body": "A written scope before anything starts, a fixed price, one round of "
                             "revisions, and everything handed over in a form you can use without me."},
                ],
            },
            {
                "slug": "about", "path": "about.html", "title": "About",
                "purpose": "The person behind the business — the actual differentiator.",
                "hero": {"eyebrow": "About", "title": "Who you would be working with",
                         "lede": "{business} is one person. That is the point."},
                "sections": [
                    {"kind": "prose", "title": "Background", "body": "{about}"},
                    {"kind": "cards", "title": "How I work", "items": [
                        {"title": "You talk to me",
                         "body": "No account manager, no handover to someone you have not met."},
                        {"title": "Fixed price",
                         "body": "You know the number before the work starts."},
                        {"title": "I say no",
                         "body": "If a job is not right for me I will say so, and say who is."},
                    ]},
                ],
            },
            {
                "slug": "book", "path": "book.html", "title": "Book a call",
                "purpose": "The conversion point. Everything else exists to get someone here.",
                "hero": {"eyebrow": "Twenty minutes, free", "title": "Book a call",
                         "lede": "Pick a time, tell me roughly what it is about, and that is it."},
                "sections": [
                    {"kind": "form", "title": "Request a time", "form": "booking",
                     "body": "I confirm by email, usually the same day.",
                     "fields": ["name", "email", "when", "message"], "target": "booking"},
                    {"kind": "facts", "title": "What happens on the call", "items": [
                        {"label": "Length", "value": "20 minutes"},
                        {"label": "Cost", "value": "Nothing"},
                        {"label": "Afterwards", "value": "A written quote, or an honest no"},
                    ]},
                ],
            },
            {
                "slug": "contact", "path": "contact.html", "title": "Contact",
                "purpose": "For people who would rather write than book.",
                "hero": {"eyebrow": "Contact", "title": "Send a message",
                         "lede": "Replies within one working day."},
                "sections": [
                    {"kind": "form", "title": "Message", "form": "contact",
                     "body": "Describe it in your own words — no form fields to translate it into.",
                     "fields": ["name", "email", "subject", "message"], "target": "support_inbox"},
                    {"kind": "facts", "title": "Details", "items": [
                        {"label": "Email", "value": "{email}"},
                        {"label": "Based in", "value": "{city}"},
                        {"label": "Reply time", "value": "One working day"},
                    ]},
                ],
            },
        ],
    },

    "seed": {
        "crm": [
            {"name": "Example — replace me", "stage": "Lead", "value": 0,
             "note": "Seed record so the pipeline board is not empty."},
            {"name": "Example — replace me", "stage": "In conversation", "value": 0,
             "note": "Move cards between stages by editing the record."},
        ],
        "documents_contracts": [
            {"title": "Example quote", "client": "Example — replace me", "amount": 0,
             "sent": "{today}", "status": "Drafting",
             "scope": "What is included, what is not, the price, and the dates. Replace this."},
        ],
        "finance_admin": [
            {"number": "{year}-001", "client": "Example — replace me", "amount": 0, "vat": 21,
             "date": "{today}", "status": "Draft"},
        ],
        "booking": [
            {"title": "Intro call", "who": "Example — replace me", "date": "{date_soon}",
             "time": "10:00", "status": "Requested", "note": "Twenty minutes."},
        ],
        "content_publishing": [
            {"title": "What I actually do", "status": "Draft", "channel": "Website",
             "date": "{today}",
             "body": "A short post explaining the offer in plain language."},
        ],
    },

    "integrations": {
        "payments": {"provider": "stripe", "purpose": "invoices and deposits",
                     "env": ["STRIPE_PUBLISHABLE_KEY", "STRIPE_SECRET_KEY"]},
        "email": {"provider": "brevo", "purpose": "enquiry replies and follow-up sequences",
                  "env": ["BREVO_API_KEY", "BREVO_SENDER_EMAIL"]},
        "analytics": {"provider": "engage_ai", "purpose": "presence benchmark across 8 channels",
                      "env": ["ENGAGE_AI_BASE_URL"]},
    },

    "checks": [
        {"id": "price_published", "kind": "site_path",
         "assert": "A price is published on the site — the whole positioning depends on it."},
        {"id": "booking_one_click", "kind": "site_path",
         "assert": "'Book a call' is reachable from every page."},
        {"id": "pipeline_present", "kind": "module_present", "target": "crm",
         "assert": "The pipeline exists — it is the one thing a solo operator opens daily."},
        {"id": "invoice_present", "kind": "module_present", "target": "finance_admin",
         "assert": "Invoicing exists; a business that cannot bill is not launched."},
    ],
}


# ===========================================================================
# PRELAUNCH — the phase before there is a business
# ===========================================================================
# Prelaunch is not an org type; it is a *phase*. A church's validation funnel is still
# a church. So this archetype is selected explicitly (`--archetype prelaunch`) and can sit
# in front of any org type: one page whose entire job is to find out whether anyone wants
# the thing, before a cent is spent building it.
#
# It wears Hundred's green on purpose. The signal it collects is Hundred's raw material —
# waitlist names become pipeline prospects — so the surface that collects them looks like
# the system they land in.

PRELAUNCH = {
    "id": "prelaunch",
    "label": "Prelaunch validation funnel",
    "type_preset": "grotesk",
    "curated": True,
    "org_types": [],           # a phase, not a kind of business
    "summary": "One page that turns an idea into evidence. It states the promise, asks "
               "for a name and an email, and counts. Nothing else is built until enough "
               "people say they want it.",
    "forge": {
        "name": "PRELAUNCHforge",
        "scheme": "dark",
        "base": "#0A0A0B",
        "base_soft": "#141416",
        "accent": "#38D07F",
        "accent_2": "#7BE3AC",
        "accent_site": "#2f9e63",     # Hundred's green — this is Hundred's front door
        "on_accent": "#0A0A0B",
        "line": "Building a validation funnel.",
    },
    "accent": "#2f9e63",
    "accent_soft": "#E8F5EE",
    "voice": "Direct and unembarrassed. It is asking for a small commitment to an idea "
             "that does not exist yet, so it must be specific about what it is, honest "
             "that it is early, and clear about what happens next. No fake scarcity.",

    "modules": {
        "require": ["lead_capture", "crm", "email_marketing", "content_publishing"],
        "drop": ["donations", "donor_reporting", "people_roster", "inventory_shipping",
                 "product_catalog", "checkout_payments", "finance_admin", "booking",
                 "documents_contracts", "courses_lms", "membership_access", "media_library"],
        "order": ["lead_capture", "crm", "email_marketing", "content_publishing",
                  "support_inbox"],
        "rename": {
            "lead_capture": "Waitlist",
            "crm": "People",
            "email_marketing": "Announcements",
        },
    },

    "site": {
        "primary_cta": {"label": "Join the waitlist", "href": "/"},
        "secondary_cta": None,
        "nav": ["home", "faq"],
        "pages": [
            {
                "slug": "home", "path": "index.html", "title": "Home",
                "purpose": "Say what it is, who it is for, and ask for an email. "
                           "One screen, one decision.",
                "hero": {
                    # NOT "{tagline}": with no operating profile stamped yet — and at
                    # prelaunch there rarely is one — that token falls back to the
                    # archetype's own label, so the first line a stranger read was
                    # "Prelaunch validation funnel". Internal vocabulary on the hero.
                    # This line is true of every funnel this archetype will ever build.
                    "eyebrow": "Not built yet — this list decides",
                    "title": "{business}",
                    "lede": "{offer_line}",
                    "cta": "Join the waitlist", "cta_href": "#waitlist",
                    "cta2": "What happens next", "cta2_href": "/faq",
                },
                "sections": [
                    {"kind": "cards", "title": "What you get", "source": "services", "limit": 3},
                    {"kind": "steps", "title": "Where this is", "items": [
                        {"title": "Today — finding out if it should exist",
                         "body": "You are early. Nothing is built yet, and that is the point: "
                                 "the people on this list decide what gets built."},
                        {"title": "Next — the first version, for this list only",
                         "body": "Everyone here sees it before anyone else, and pays less "
                                 "than everyone else, permanently."},
                        {"title": "Then — open to everyone",
                         "body": "At full price, with the list's fingerprints all over it."},
                    ]},
                    {"kind": "form", "title": "Join the waitlist", "form": "waitlist",
                     "body": "A name and an email. No spam, no drip sequence — you hear from "
                             "us when there is something real to see.",
                     "fields": ["name", "email", "message"], "target": "lead_capture"},
                    {"kind": "facts", "title": "Straight answers", "items": [
                        {"label": "Cost to join", "value": "Nothing"},
                        {"label": "What you get", "value": "First access, lower price"},
                        {"label": "How often we write", "value": "Only when it matters"},
                        {"label": "Leaving", "value": "One click, any time"},
                    ]},
                    {"kind": "cta", "title": "Want it to exist?",
                     "body": "That is the whole ask. A name on the list is the signal that "
                             "decides whether this gets built.",
                     "cta": "Join the waitlist", "cta_href": "#waitlist"},
                ],
            },
            {
                "slug": "faq", "path": "faq.html", "title": "What happens next",
                "purpose": "Answer the suspicion that a waitlist is a trick.",
                "hero": {"eyebrow": "Before you sign up", "title": "What happens next",
                         "lede": "What joining actually means, and what it does not."},
                "sections": [
                    {"kind": "faq", "title": "Fair questions", "items": [
                        {"q": "Is this real, or an idea?",
                         "a": "An idea, openly. It gets built if enough people here say they "
                              "want it. That is what the list is for."},
                        {"q": "Am I committing to buy anything?",
                         "a": "No. You are saying you would be interested. Nothing is charged, "
                              "and there is nothing to charge for yet."},
                        {"q": "What do you do with my email?",
                         "a": "Write to you when there is something to see. It is not sold, "
                              "shared, or added to anything else."},
                        {"q": "What if it never gets built?",
                         "a": "Then you get one message saying so. That is a real outcome and "
                              "you deserve to be told."},
                    ]},
                    {"kind": "cta", "title": "Still in?",
                     "body": "Add your name and we will keep you posted either way.",
                     "cta": "Join the waitlist", "cta_href": "/"},
                ],
            },
        ],
    },

    "seed": {
        "lead_capture": [
            {"name": "Example — replace me", "email": "someone@example.com",
             "date": "{today}", "handled": False,
             "asked": "Seed record so the waitlist view is not empty. Delete it when the "
                      "first real name arrives."},
        ],
        "content_publishing": [
            {"title": "Why I am building this", "status": "Draft", "channel": "Website",
             "date": "{today}",
             "body": "The founding post. Say what you noticed, who it hurts, and what you "
                     "intend to do about it. This is what people share."},
        ],
    },

    "integrations": {
        "email": {"provider": "brevo", "purpose": "the one announcement the list is waiting for",
                  "env": ["BREVO_API_KEY", "BREVO_SENDER_EMAIL"]},
        "analytics": {"provider": "engage_ai", "purpose": "where the signups came from",
                      "env": ["ENGAGE_AI_BASE_URL"]},
    },

    "checks": [
        {"id": "waitlist_present", "kind": "module_present", "target": "lead_capture",
         "assert": "The waitlist exists — a validation funnel that cannot capture a name is not a funnel."},
        {"id": "ask_on_first_screen", "kind": "site_path",
         "assert": "The ask is reachable without leaving the first page."},
        {"id": "no_payment_rail", "kind": "module_present", "target": "crm",
         "assert": "People are captured; nothing is charged at this stage."},
    ],
}


# ===========================================================================
# GENERIC — the honest fallback
# ===========================================================================

GENERIC = {
    "id": "generic",
    "label": "General business",
    "type_preset": "humanist",
    "curated": False,
    "org_types": [],
    "summary": "Built from the blueprint's own function set, with a plain site and no "
               "tailored copy. Everything works; nothing is specialised. The next "
               "archetype to be written is whichever org type keeps landing here.",
    "forge": {
        "name": "FORGE",
        "scheme": "dark",
        "base": "#0A0A0B",
        "base_soft": "#141416",
        "accent": "#2FA8A0",
        "accent_2": "#7FD1CB",
        "accent_site": "#0f8f86",
        "on_accent": "#0A0A0B",
        "line": "Building from the blueprint alone — no archetype written for this org type yet.",
    },
    "accent": "#2FA8A0",
    "accent_soft": "#E8F6F5",
    "voice": "Plain and factual. Says what the business does and how to reach it.",

    "modules": {"require": [], "drop": [], "order": [], "rename": {}},

    "site": {
        "primary_cta": {"label": "Get in touch", "href": "/contact"},
        "secondary_cta": None,
        "nav": ["home", "offer", "about", "contact"],
        "pages": [
            {
                "slug": "home", "path": "index.html", "title": "Home",
                "purpose": "State the offer and give one way to respond.",
                "hero": {"eyebrow": "{tagline}", "title": "{business}",
                         "lede": "{offer_line}",
                         "cta": "Get in touch", "cta_href": "/contact"},
                "sections": [
                    {"kind": "cards", "title": "What we offer", "source": "services", "limit": 3},
                    {"kind": "cta", "title": "Get in touch",
                     "body": "Tell us what you need and we will come back to you.",
                     "cta": "Contact", "cta_href": "/contact"},
                ],
            },
            {
                "slug": "offer", "path": "offer.html", "title": "What we do",
                "purpose": "The offer in more detail.",
                "hero": {"eyebrow": "What we do", "title": "Our work", "lede": "{offer_line}"},
                "sections": [{"kind": "cards", "title": "Offers", "source": "services", "limit": 12}],
            },
            {
                "slug": "about", "path": "about.html", "title": "About",
                "purpose": "Who is behind it.",
                "hero": {"eyebrow": "About", "title": "About {business}", "lede": ""},
                "sections": [{"kind": "prose", "title": "About", "body": "{about}"}],
            },
            {
                "slug": "contact", "path": "contact.html", "title": "Contact",
                "purpose": "One reliable way to reach a person.",
                "hero": {"eyebrow": "Contact", "title": "Get in touch", "lede": ""},
                "sections": [
                    {"kind": "form", "title": "Send a message", "form": "contact",
                     "body": "", "fields": ["name", "email", "subject", "message"],
                     "target": "support_inbox"},
                    {"kind": "facts", "title": "Details", "items": [
                        {"label": "Email", "value": "{email}"},
                        {"label": "Based in", "value": "{city}"},
                    ]},
                ],
            },
        ],
    },

    "seed": {},

    "integrations": {
        "email": {"provider": "brevo", "purpose": "enquiry replies",
                  "env": ["BREVO_API_KEY", "BREVO_SENDER_EMAIL"]},
        "analytics": {"provider": "engage_ai", "purpose": "presence benchmark",
                      "env": ["ENGAGE_AI_BASE_URL"]},
    },

    "checks": [
        {"id": "contactable", "kind": "site_path",
         "assert": "There is a working way to contact the business."},
    ],
}


# ===========================================================================
# NONPROFIT
# ===========================================================================

NONPROFIT = {
    "id": "nonprofit",
    "label": "Nonprofit / charity",
    "type_preset": "editorial",
    "curated": True,
    "org_types": ["nonprofit"],
    "summary": "A cause funded by people who will never use the service. The platform "
               "runs the two loops that keep it alive: the work itself, and the account "
               "of that work given back to the people who paid for it.",
    "forge": {
        "name": "NONPROFITforge",
        "scheme": "dark",
        "base": "#0A0A0B",
        "base_soft": "#141416",
        "accent": "#10B981",
        "accent_2": "#6EE7B7",
        "accent_site": "#047857",
        "on_accent": "#0A0A0B",
        "line": "Building a charity platform.",
    },
    "accent": "#047857",
    "accent_soft": "#E7F6F0",
    "voice": "Plain and accountable. It says what the money did, in numbers, before it "
             "asks for more. No suffering used as decoration, no adjective doing work a "
             "figure should do.",

    "modules": {
        "require": ["donations", "donor_reporting", "people_roster", "events",
                    "content_publishing", "email_marketing", "lead_capture",
                    "support_inbox"],
        "drop": ["product_catalog", "inventory_shipping", "courses_lms", "booking"],
        "order": ["donations", "donor_reporting", "people_roster", "events",
                  "crm", "lead_capture", "email_marketing", "content_publishing",
                  "support_inbox", "finance_admin"],
        "rename": {
            "crm": "Supporters",
            "people_roster": "Volunteers",
            "donor_reporting": "Annual account",
            "lead_capture": "Get involved",
            "support_inbox": "Messages",
        },
    },

    "site": {
        "primary_cta": {"label": "Donate", "href": "/donate"},
        "secondary_cta": {"label": "Volunteer", "href": "/involved"},
        "nav": ["home", "work", "impact", "involved", "donate", "contact"],
        "pages": [
            {
                "slug": "home", "path": "index.html", "title": "Home",
                "purpose": "Say what this charity does, for whom, and what a gift buys — "
                           "in the first screen, without a single adjective doing the work "
                           "of a number.",
                "hero": {
                    "eyebrow": "{tagline}",
                    "title": "{business}",
                    "lede": "{offer_line}",
                    "cta": "Donate", "cta_href": "/donate",
                    "cta2": "See the work", "cta2_href": "/work",
                },
                "sections": [
                    {"kind": "facts", "title": "This year so far", "items": [
                        {"label": "Where we work", "value": "{city}"},
                        {"label": "Run by", "value": "Volunteers and a small core team"},
                        {"label": "Published accounts", "value": "Every year, in full"},
                        {"label": "Admin overhead", "value": "Reported, not hidden"},
                    ]},
                    {"kind": "cards", "title": "What we do", "source": "services", "limit": 6},
                    {"kind": "steps", "title": "What a gift actually does", "items": [
                        {"title": "It arrives whole",
                         "body": "Card fees are the only deduction, and they are shown on "
                                 "the receipt rather than absorbed quietly."},
                        {"title": "It is assigned",
                         "body": "Every gift is allocated to a named piece of work in the "
                                 "week it arrives, not held in a general pot."},
                        {"title": "It is accounted for",
                         "body": "The annual account lists what came in, what went out, and "
                                 "what it bought. It is published whether or not it flatters us."},
                    ]},
                    {"kind": "feed", "title": "What is coming up", "source": "events", "limit": 3,
                     "empty": "Events and campaigns will be listed here."},
                    {"kind": "cta", "title": "Stand behind this work",
                     "body": "A monthly gift is worth more than its size, because it lets "
                             "us plan past the end of the month.",
                     "cta": "Donate", "cta_href": "/donate"},
                ],
            },
            {
                "slug": "work", "path": "work.html", "title": "Our work",
                "purpose": "Describe the actual programmes in enough detail to be checked.",
                "hero": {"eyebrow": "Programmes", "title": "The work",
                         "lede": "What we run, where, and who it is for."},
                "sections": [
                    {"kind": "cards", "title": "Programmes", "source": "services", "limit": 12},
                    {"kind": "prose", "title": "How we decide what to take on", "body": "{about}"},
                ],
            },
            {
                "slug": "impact", "path": "impact.html", "title": "Impact",
                "purpose": "Give the account before it is asked for — the difference "
                           "between a charity and an appeal.",
                "hero": {"eyebrow": "Accountability", "title": "What your money did",
                         "lede": "Published every year, in full, including the parts that "
                                 "did not go to plan."},
                "sections": [
                    {"kind": "facts", "title": "The headline figures", "items": [
                        {"label": "Reporting year", "value": "{year}"},
                        {"label": "Income", "value": "Published in the annual account"},
                        {"label": "Spent on programmes", "value": "Published in the annual account"},
                        {"label": "Independent review", "value": "Yes"},
                    ]},
                    {"kind": "prose", "title": "The account in words",
                     "body": "Numbers on their own can be arranged to say almost anything, "
                             "so the annual account is written out as well as tabulated: what "
                             "we set out to do, what we actually did, what it cost, and what "
                             "we would do differently.\n\nWhere a programme underperformed, it "
                             "is named here rather than left out."},
                    {"kind": "faq", "title": "The questions a careful donor asks", "items": [
                        {"q": "How much of my gift reaches the work?",
                         "a": "The annual account states it as a percentage, with the overhead "
                              "broken out. We do not claim a figure we cannot show."},
                        {"q": "Can I give to one programme only?",
                         "a": "Yes. Restricted gifts are tracked separately and reported "
                              "separately."},
                        {"q": "Who checks the figures?",
                         "a": "An independent reviewer, annually. Their statement is published "
                              "alongside the account."},
                    ]},
                ],
            },
            {
                "slug": "involved", "path": "involved.html", "title": "Get involved",
                "purpose": "Turn sympathy into a specific next action.",
                "hero": {"eyebrow": "Volunteer", "title": "Get involved",
                         "lede": "Time is worth as much as money here, and it is easier to give."},
                "sections": [
                    {"kind": "steps", "title": "How volunteering goes", "items": [
                        {"title": "Tell us what you can do",
                         "body": "Skills, hours, and how far you can travel. Two lines is enough."},
                        {"title": "We match you to a need",
                         "body": "You will hear back within a week, with something specific — "
                                 "never a generic newsletter."},
                        {"title": "Start small",
                         "body": "One session, then decide. Nobody is asked to commit to a "
                                 "year on the first conversation."},
                    ]},
                    {"kind": "form", "title": "Offer your time", "form": "volunteer",
                     "body": "Tell us roughly what you can do and we will come back with "
                             "something concrete.",
                     "fields": ["name", "email", "message"], "target": "lead_capture"},
                ],
            },
            {
                "slug": "donate", "path": "donate.html", "title": "Donate",
                "purpose": "Make giving quick, and say exactly where it goes.",
                "hero": {"eyebrow": "Give", "title": "Donate",
                         "lede": "{business} is funded by people who will never use what "
                                 "they are paying for."},
                "sections": [
                    {"kind": "pay", "title": "Make a gift", "provider": "stripe",
                     "action": "Donate",
                     "options": ["One-off", "Monthly"],
                     "funds": ["Where needed most", "Programmes", "Emergency response"],
                     "fallback": "Bank transfer details are below until card giving is "
                                 "switched on."},
                    {"kind": "prose", "title": "Where it goes",
                     "body": "Gifts marked 'where needed most' are allocated within the week "
                             "to whichever programme is closest to running short. Restricted "
                             "gifts go where you say and nowhere else."},
                    {"kind": "faq", "title": "Giving questions", "items": [
                        {"q": "Is my gift tax deductible?",
                         "a": "For registered charitable status in the Netherlands (ANBI), gifts "
                              "are deductible under the usual conditions. Ask us for the details."},
                        {"q": "Can I stop a monthly gift?",
                         "a": "Any time, yourself, without a conversation."},
                        {"q": "Will you sell my details?",
                         "a": "No. They are never shared, sold or swapped, and you can ask us "
                              "to delete them."},
                    ]},
                ],
            },
            {
                "slug": "contact", "path": "contact.html", "title": "Contact",
                "purpose": "One reliable way to reach a person.",
                "hero": {"eyebrow": "Contact", "title": "Get in touch",
                         "lede": "A real person reads these."},
                "sections": [
                    {"kind": "form", "title": "Send a message", "form": "contact",
                     "body": "", "fields": ["name", "email", "subject", "message"],
                     "target": "support_inbox"},
                    {"kind": "facts", "title": "Details", "items": [
                        {"label": "Email", "value": "{email}"},
                        {"label": "Based in", "value": "{city}"},
                        {"label": "Annual account", "value": "Published each {year}"},
                    ]},
                ],
            },
        ],
    },

    "seed": {
        "donations": [
            {"giver": "Example — replace me", "amount": 25, "date": "{date_recent}",
             "recurring": True, "fund": "Where needed most",
             "note": "Seed record so the giving view is not empty. Delete when real gifts arrive."},
        ],
        "donor_reporting": [
            {"year": 2026, "income": 0, "spent": 0,
             "note": "The annual account for this year, filled in as it goes. Publishing this "
                     "is the whole reason the module exists."},
        ],
        "events": [
            {"title": "Volunteer induction", "date": "{date_soon}", "time": "19:00",
             "place": "{city}", "rsvp": 0, "note": "Monthly. An hour, no commitment after it."},
            {"title": "Annual account published", "date": "{date_further}", "time": "",
             "place": "Online", "rsvp": 0, "note": "The year's figures, in full."},
        ],
        "people_roster": [
            {"person": "Example — replace me", "role": "Volunteer coordinator",
             "date": "{date_soon}", "confirmed": False},
        ],
        "content_publishing": [
            {"title": "What we did this quarter", "status": "Draft", "channel": "Website",
             "date": "{today}",
             "body": "A short account of the quarter — what was done, what it cost, what is next."},
        ],
    },

    "integrations": {
        "payments": {"provider": "stripe", "purpose": "donations, one-off and recurring",
                     "env": ["STRIPE_PUBLISHABLE_KEY", "STRIPE_SECRET_KEY"]},
        "email": {"provider": "brevo", "purpose": "supporter updates and volunteer replies",
                  "env": ["BREVO_API_KEY", "BREVO_SENDER_EMAIL"]},
        "analytics": {"provider": "engage_ai", "purpose": "presence benchmark across 8 channels",
                      "env": ["ENGAGE_AI_BASE_URL"]},
    },

    "checks": [
        {"id": "donate_reachable", "kind": "site_path",
         "assert": "Donating is reachable from every page, not only the appeal."},
        {"id": "giving_present", "kind": "module_present", "target": "donations",
         "assert": "The platform can record a gift."},
        {"id": "account_present", "kind": "module_present", "target": "donor_reporting",
         "assert": "The platform can publish an annual account."},
        {"id": "account_before_ask", "kind": "copy_order",
         "assert": "The home page describes the work before it asks for money."},
    ],
}


# ===========================================================================
# ECOMMERCE
# ===========================================================================

ECOMMERCE = {
    "id": "ecommerce",
    "label": "Online shop",
    "type_preset": "gallery",
    "curated": True,
    "org_types": ["ecommerce"],
    "summary": "Physical things, sold and shipped. The platform is the shop floor and the "
               "stockroom at once: what is listed, what is left, what has been paid for, "
               "and what still has to go in a box.",
    "forge": {
        "name": "SHOPforge",
        "scheme": "dark",
        "base": "#0A0A0B",
        "base_soft": "#141416",
        "accent": "#F43F5E",
        "accent_2": "#FDA4AF",
        "accent_site": "#be123c",
        "on_accent": "#0A0A0B",
        "line": "Building a shop.",
    },
    "accent": "#be123c",
    "accent_soft": "#FDECEF",
    "voice": "Concrete. It describes the object — what it is made of, how big it is, when "
             "it arrives — and lets that do the selling. No hype, no countdown timers.",

    "modules": {
        "require": ["product_catalog", "checkout_payments", "inventory_shipping",
                    "crm", "email_marketing", "support_inbox", "content_publishing"],
        "drop": ["donations", "donor_reporting", "people_roster", "courses_lms"],
        "order": ["product_catalog", "checkout_payments", "inventory_shipping",
                  "crm", "support_inbox", "email_marketing", "content_publishing",
                  "finance_admin", "lead_capture"],
        "rename": {
            "crm": "Customers",
            "checkout_payments": "Orders",
            "inventory_shipping": "Stock",
            "support_inbox": "Customer messages",
        },
    },

    "site": {
        "primary_cta": {"label": "Shop", "href": "/shop"},
        "secondary_cta": {"label": "Delivery", "href": "/delivery"},
        "nav": ["home", "shop", "about", "delivery", "contact"],
        "pages": [
            {
                "slug": "home", "path": "index.html", "title": "Home",
                "purpose": "Show what is for sale and what it costs, before anything else.",
                "hero": {
                    "eyebrow": "{tagline}",
                    "title": "{business}",
                    "lede": "{offer_line}",
                    "cta": "Shop", "cta_href": "/shop",
                    "cta2": "Delivery & returns", "cta2_href": "/delivery",
                },
                "sections": [
                    {"kind": "facts", "title": "Ordering here", "items": [
                        {"label": "Ships from", "value": "{city}"},
                        {"label": "Dispatch", "value": "Within 2 working days"},
                        {"label": "Returns", "value": "30 days, no reason needed"},
                        {"label": "Payment", "value": "Card, iDEAL, bank transfer"},
                    ]},
                    {"kind": "cards", "title": "What we make", "source": "services", "limit": 6},
                    {"kind": "pricing", "title": "Current prices", "source": "pricing", "limit": 4},
                    {"kind": "faq", "title": "Before you order", "items": [
                        {"q": "When will it arrive?",
                         "a": "Orders placed before 15:00 on a working day are dispatched the "
                              "next. Delivery inside the Netherlands is one to two days after that."},
                        {"q": "What if it is not right?",
                         "a": "Send it back within 30 days, unused, and we refund the item in "
                              "full. You pay the return postage unless it arrived damaged."},
                        {"q": "Do you ship outside the Netherlands?",
                         "a": "Yes, across the EU. The rate is calculated at checkout before "
                              "you pay."},
                    ]},
                    {"kind": "cta", "title": "Questions before you buy?",
                     "body": "Ask. A person answers, usually the same day.",
                     "cta": "Contact us", "cta_href": "/contact"},
                ],
            },
            {
                "slug": "shop", "path": "shop.html", "title": "Shop",
                "purpose": "The catalogue — everything for sale, with the price on it.",
                "hero": {"eyebrow": "Catalogue", "title": "Everything for sale",
                         "lede": "Prices include VAT. Stock is live — if it is listed, it is here."},
                "sections": [
                    {"kind": "feed", "title": "In stock", "source": "product_catalog", "limit": 30,
                     "empty": "Products appear here as they are added to the catalogue."},
                    {"kind": "pricing", "title": "Prices", "source": "pricing", "limit": 6},
                ],
            },
            {
                "slug": "about", "path": "about.html", "title": "About",
                "purpose": "Who makes this, and why it is worth the money.",
                "hero": {"eyebrow": "About", "title": "Who makes this",
                         "lede": "{tagline}"},
                "sections": [
                    {"kind": "prose", "title": "The short version", "body": "{about}"},
                    {"kind": "cards", "title": "How we work", "items": [
                        {"title": "Made in small runs",
                         "body": "Which is why some things sell out and stay out for a while."},
                        {"title": "Priced once",
                         "body": "No permanent sale, no invented original price to discount from."},
                        {"title": "Packed by a person",
                         "body": "If something is wrong, the person who packed it will be the "
                                 "one who fixes it."},
                    ]},
                ],
            },
            {
                "slug": "delivery", "path": "delivery.html", "title": "Delivery & returns",
                "purpose": "Answer the two questions that stop a first order.",
                "hero": {"eyebrow": "Practical", "title": "Delivery & returns",
                         "lede": "The rules, in full, before you pay rather than after."},
                "sections": [
                    {"kind": "steps", "title": "What happens after you order", "items": [
                        {"title": "Confirmation",
                         "body": "An email within minutes, with what you bought and what you paid."},
                        {"title": "Dispatch",
                         "body": "Within two working days, with a tracking link."},
                        {"title": "Delivery",
                         "body": "One to two days inside the Netherlands, two to five across the EU."},
                    ]},
                    {"kind": "faq", "title": "Returns", "items": [
                        {"q": "How long do I have?",
                         "a": "Thirty days from delivery, unused and in its packaging."},
                        {"q": "Who pays the return postage?",
                         "a": "You do, unless the item arrived damaged or was not what you ordered."},
                        {"q": "How fast is the refund?",
                         "a": "Within five working days of the parcel reaching us."},
                    ]},
                ],
            },
            {
                "slug": "contact", "path": "contact.html", "title": "Contact",
                "purpose": "One reliable way to reach a person about an order.",
                "hero": {"eyebrow": "Contact", "title": "Ask us anything",
                         "lede": "Order questions answered the same working day."},
                "sections": [
                    {"kind": "form", "title": "Send a message", "form": "contact",
                     "body": "If it is about an order, include the order number.",
                     "fields": ["name", "email", "subject", "message"],
                     "target": "support_inbox"},
                    {"kind": "facts", "title": "Details", "items": [
                        {"label": "Email", "value": "{email}"},
                        {"label": "Ships from", "value": "{city}"},
                        {"label": "Replies", "value": "Same working day"},
                    ]},
                ],
            },
        ],
    },

    "seed": {
        "product_catalog": [
            {"name": "Example product — replace me", "price": 45, "kind": "Physical",
             "sku": "EX-001", "stock": 12, "live": False,
             "description": "A seed listing so the catalogue is not empty. Replace the name, "
                            "price and description, then set it live."},
            {"name": "Example product — second", "price": 90, "kind": "Physical",
             "sku": "EX-002", "stock": 4, "live": False,
             "description": "Two rows is enough to see how the list behaves. Delete both when "
                            "the real catalogue goes in."},
        ],
        "inventory_shipping": [
            {"item": "EX-001", "qty": 12, "reorder_at": 4, "supplier": "To be set"},
            {"item": "EX-002", "qty": 4, "reorder_at": 2, "supplier": "To be set"},
        ],
        "checkout_payments": [
            {"customer": "Example — replace me", "item": "EX-001", "amount": 45,
             "date": "{date_recent}", "status": "Paid"},
        ],
        "content_publishing": [
            {"title": "New in the shop", "status": "Draft", "channel": "Website",
             "date": "{today}", "body": "A short post announcing what has just been listed."},
        ],
    },

    "integrations": {
        "payments": {"provider": "stripe", "purpose": "checkout — card and iDEAL",
                     "env": ["STRIPE_PUBLISHABLE_KEY", "STRIPE_SECRET_KEY"]},
        "email": {"provider": "brevo", "purpose": "order confirmations and customer replies",
                  "env": ["BREVO_API_KEY", "BREVO_SENDER_EMAIL"]},
        "analytics": {"provider": "engage_ai", "purpose": "presence benchmark across 8 channels",
                      "env": ["ENGAGE_AI_BASE_URL"]},
    },

    "checks": [
        {"id": "catalogue_present", "kind": "module_present", "target": "product_catalog",
         "assert": "There is somewhere to list what is for sale."},
        {"id": "stock_present", "kind": "module_present", "target": "inventory_shipping",
         "assert": "Stock is tracked, so the shop cannot sell what it does not have."},
        {"id": "catalogue_seeded", "kind": "seed_present", "target": "product_catalog",
         "assert": "The catalogue opens with rows in it, not an empty table."},
        {"id": "terms_published", "kind": "links_resolve",
         "assert": "Delivery and returns are a page, reachable from the nav."},
    ],
}


# ===========================================================================
# DIGITAL PRODUCTS
# ===========================================================================

DIGITAL_PRODUCTS = {
    "id": "digital_products",
    "label": "Digital products",
    "type_preset": "grotesk",
    "curated": True,
    "org_types": ["digital_products"],
    "summary": "Something made once and sold many times — a template, a course pack, a "
               "toolkit. The platform's whole job is the ten seconds between paying and "
               "having the file, and the list of people who bought it.",
    "forge": {
        "name": "DIGITALforge",
        "scheme": "dark",
        "base": "#0A0A0B",
        "base_soft": "#141416",
        "accent": "#8B5CF6",
        "accent_2": "#C4B5FD",
        "accent_site": "#6d28d9",
        "on_accent": "#0A0A0B",
        "line": "Building a digital product store.",
    },
    "accent": "#6d28d9",
    "accent_soft": "#F1ECFD",
    "voice": "Specific about what is inside. It lists the files, the formats and the "
             "number of pages, because a digital product that cannot be held has to be "
             "described precisely or it is a promise.",

    "modules": {
        "require": ["product_catalog", "checkout_payments", "email_marketing",
                    "content_publishing", "lead_capture", "support_inbox"],
        "drop": ["inventory_shipping", "people_roster", "donations", "donor_reporting",
                 "booking"],
        "order": ["product_catalog", "checkout_payments", "crm", "lead_capture",
                  "email_marketing", "content_publishing", "support_inbox",
                  "finance_admin"],
        "rename": {
            "product_catalog": "Products",
            "checkout_payments": "Sales",
            "crm": "Buyers",
            "lead_capture": "List",
        },
    },

    "site": {
        "primary_cta": {"label": "Get it", "href": "/pricing"},
        "secondary_cta": {"label": "What's inside", "href": "/inside"},
        "nav": ["home", "inside", "pricing", "faq", "contact"],
        "pages": [
            {
                "slug": "home", "path": "index.html", "title": "Home",
                "purpose": "Say what the thing is, who it is for, and what it costs — "
                           "above the fold, in that order.",
                "hero": {
                    "eyebrow": "{tagline}",
                    "title": "{business}",
                    "lede": "{offer_line}",
                    "cta": "Get it", "cta_href": "/pricing",
                    "cta2": "See what's inside", "cta2_href": "/inside",
                },
                "sections": [
                    {"kind": "facts", "title": "The short answer", "items": [
                        {"label": "Delivery", "value": "Instant, by email"},
                        {"label": "Format", "value": "Download — yours to keep"},
                        {"label": "Updates", "value": "Included, free"},
                        {"label": "Refund", "value": "14 days, no questions"},
                    ]},
                    {"kind": "cards", "title": "What it is", "source": "services", "limit": 6},
                    {"kind": "steps", "title": "How it works", "items": [
                        {"title": "Pay",
                         "body": "Card or iDEAL. No account to create, no upsell on the way through."},
                        {"title": "Get the link",
                         "body": "The download arrives by email within seconds, and stays valid."},
                        {"title": "Keep it",
                         "body": "Including every update we publish afterwards, at no extra cost."},
                    ]},
                    {"kind": "pricing", "title": "Price", "source": "pricing", "limit": 4},
                    {"kind": "cta", "title": "Not sure yet?",
                     "body": "Ask a question before you buy — it is answered by whoever made it.",
                     "cta": "Ask first", "cta_href": "/contact"},
                ],
            },
            {
                "slug": "inside", "path": "inside.html", "title": "What's inside",
                "purpose": "List the contents precisely enough that nobody feels misled.",
                "hero": {"eyebrow": "Contents", "title": "What you actually get",
                         "lede": "Listed file by file, because you cannot pick this up and "
                                 "flick through it."},
                "sections": [
                    {"kind": "cards", "title": "In the download", "source": "services", "limit": 12},
                    {"kind": "feed", "title": "Everything published so far",
                     "source": "product_catalog", "limit": 20,
                     "empty": "Products appear here as they are published."},
                    {"kind": "prose", "title": "Who it is for", "body": "{about}"},
                ],
            },
            {
                "slug": "pricing", "path": "pricing.html", "title": "Pricing",
                "purpose": "One page, one decision, no hidden second charge.",
                "hero": {"eyebrow": "Pricing", "title": "What it costs",
                         "lede": "One payment. No subscription hiding behind it."},
                "sections": [
                    {"kind": "pricing", "title": "Choose", "source": "pricing", "limit": 4},
                    {"kind": "pay", "title": "Buy now", "provider": "stripe",
                     "action": "Buy now",
                     "options": ["One payment"],
                     "fallback": "Card payment is switched on the moment the operator "
                                 "supplies the keys."},
                    {"kind": "faq", "title": "About paying", "items": [
                        {"q": "Is it really one payment?",
                         "a": "Yes. There is no subscription, no licence renewal and no seat count."},
                        {"q": "Can I use it for client work?",
                         "a": "Yes. You may use it in work you are paid for; you may not resell "
                              "the files themselves."},
                        {"q": "What if it is not what I expected?",
                         "a": "Ask for a refund within 14 days and you get one, without a "
                              "conversation about why."},
                    ]},
                ],
            },
            {
                "slug": "faq", "path": "faq.html", "title": "FAQ",
                "purpose": "Remove the last objections without a sales call.",
                "hero": {"eyebrow": "Questions", "title": "Asked often enough to publish",
                         "lede": ""},
                "sections": [
                    {"kind": "faq", "title": "Practical", "items": [
                        {"q": "What format is it in?",
                         "a": "Open formats wherever possible, so it still opens in five years."},
                        {"q": "Do I need anything else to use it?",
                         "a": "No. If a piece needs particular software, it is stated on the "
                              "product page before you buy."},
                        {"q": "How do I get the updates?",
                         "a": "The original download link keeps working and always points at "
                              "the current version."},
                        {"q": "Can I get an invoice with my company details?",
                         "a": "Yes — reply to the receipt and one is issued the same day."},
                    ]},
                    {"kind": "form", "title": "Still unanswered?", "form": "contact",
                     "body": "Ask, and the answer usually ends up on this page.",
                     "fields": ["name", "email", "message"], "target": "support_inbox"},
                ],
            },
            {
                "slug": "contact", "path": "contact.html", "title": "Contact",
                "purpose": "One reliable way to reach the person who made it.",
                "hero": {"eyebrow": "Contact", "title": "Ask before you buy",
                         "lede": "Answered by whoever made the thing."},
                "sections": [
                    {"kind": "form", "title": "Send a message", "form": "contact",
                     "body": "", "fields": ["name", "email", "subject", "message"],
                     "target": "support_inbox"},
                    {"kind": "facts", "title": "Details", "items": [
                        {"label": "Email", "value": "{email}"},
                        {"label": "Based in", "value": "{city}"},
                        {"label": "Replies", "value": "Within one working day"},
                    ]},
                ],
            },
        ],
    },

    "seed": {
        "product_catalog": [
            {"name": "Example product — replace me", "price": 39, "kind": "Digital",
             "sku": "DIG-001", "stock": 0, "live": False,
             "description": "A seed listing. Replace the name, price and contents, attach the "
                            "file, then set it live."},
        ],
        "checkout_payments": [
            {"customer": "Example — replace me", "item": "DIG-001", "amount": 39,
             "date": "{date_recent}", "status": "Paid"},
        ],
        "email_marketing": [
            {"email": "example@replace.me", "name": "Example — replace me",
             "source": "Website", "date": "{date_recent}", "subscribed": True},
        ],
        "content_publishing": [
            {"title": "Launch post", "status": "Draft", "channel": "Website",
             "date": "{today}",
             "body": "A short post announcing the product, what is in it, and what it costs."},
        ],
    },

    "integrations": {
        "payments": {"provider": "stripe", "purpose": "one-off purchases, instant fulfilment",
                     "env": ["STRIPE_PUBLISHABLE_KEY", "STRIPE_SECRET_KEY"]},
        "email": {"provider": "brevo", "purpose": "delivery emails and the list",
                  "env": ["BREVO_API_KEY", "BREVO_SENDER_EMAIL"]},
        "analytics": {"provider": "engage_ai", "purpose": "presence benchmark across 8 channels",
                      "env": ["ENGAGE_AI_BASE_URL"]},
    },

    "checks": [
        {"id": "catalogue_present", "kind": "module_present", "target": "product_catalog",
         "assert": "There is somewhere to publish the product."},
        {"id": "sales_present", "kind": "module_present", "target": "checkout_payments",
         "assert": "A sale can be recorded and fulfilled."},
        {"id": "price_published", "kind": "links_resolve",
         "assert": "The price is on a page of its own, reachable from the nav."},
        {"id": "no_placeholders", "kind": "no_placeholders",
         "assert": "No unresolved token reached a page."},
    ],
}


# ===========================================================================
# MEMBERSHIP
# ===========================================================================

MEMBERSHIP = {
    "id": "membership",
    "label": "Membership / club",
    "type_preset": "humanist",
    "curated": True,
    "org_types": ["membership"],
    "summary": "Recurring money for continuing access. The platform tracks the only two "
               "numbers that matter — who is in, and who quietly left — and gives members "
               "somewhere that is theirs.",
    "forge": {
        "name": "MEMBERforge",
        "scheme": "dark",
        "base": "#0A0A0B",
        "base_soft": "#141416",
        "accent": "#F59E0B",
        "accent_2": "#FCD34D",
        "accent_site": "#b45309",
        "on_accent": "#0A0A0B",
        "line": "Building a membership platform.",
    },
    "accent": "#b45309",
    "accent_soft": "#FDF3E3",
    "voice": "Straight about the deal. It says what arrives, how often, what it costs and "
             "how to leave — because a membership that is hard to cancel is a membership "
             "people never join.",

    "modules": {
        "require": ["membership_access", "checkout_payments", "content_publishing",
                    "email_marketing", "events", "crm", "support_inbox"],
        "drop": ["inventory_shipping", "donations", "donor_reporting", "people_roster"],
        "order": ["membership_access", "checkout_payments", "content_publishing",
                  "events", "crm", "email_marketing", "support_inbox", "finance_admin",
                  "lead_capture"],
        "rename": {
            "membership_access": "Members",
            "checkout_payments": "Subscriptions",
            "content_publishing": "Member posts",
            "crm": "People",
        },
    },

    "site": {
        "primary_cta": {"label": "Join", "href": "/join"},
        "secondary_cta": {"label": "What you get", "href": "/membership"},
        "nav": ["home", "membership", "events", "join", "contact"],
        "pages": [
            {
                "slug": "home", "path": "index.html", "title": "Home",
                "purpose": "Say what a member gets, how often, and what it costs.",
                "hero": {
                    "eyebrow": "{tagline}",
                    "title": "{business}",
                    "lede": "{offer_line}",
                    "cta": "Join", "cta_href": "/join",
                    "cta2": "What you get", "cta2_href": "/membership",
                },
                "sections": [
                    {"kind": "facts", "title": "The deal", "items": [
                        {"label": "Billed", "value": "Monthly, cancel any time"},
                        {"label": "Members meet", "value": "{city} and online"},
                        {"label": "New material", "value": "Every month"},
                        {"label": "Leaving", "value": "One click, no call"},
                    ]},
                    {"kind": "cards", "title": "What members get", "source": "services", "limit": 6},
                    {"kind": "feed", "title": "Coming up for members", "source": "events",
                     "limit": 3, "empty": "Member events will be listed here."},
                    {"kind": "pricing", "title": "Membership", "source": "pricing", "limit": 3},
                    {"kind": "cta", "title": "Join this month",
                     "body": "Everything above, from the day you join. Cancel whenever you like.",
                     "cta": "Join", "cta_href": "/join"},
                ],
            },
            {
                "slug": "membership", "path": "membership.html", "title": "What you get",
                "purpose": "Describe the membership honestly, including what it is not.",
                "hero": {"eyebrow": "Membership", "title": "What being a member means",
                         "lede": "In detail, including the parts that are not for everyone."},
                "sections": [
                    {"kind": "cards", "title": "Included", "source": "services", "limit": 12},
                    {"kind": "prose", "title": "Who this is for", "body": "{about}"},
                    {"kind": "faq", "title": "Honest answers", "items": [
                        {"q": "How much time does it take?",
                         "a": "As much as you give it. Nothing is scheduled that you have to "
                              "attend live, and everything is kept afterwards."},
                        {"q": "What if I fall behind?",
                         "a": "Nothing expires. The archive stays open for as long as you are "
                              "a member."},
                        {"q": "How do I cancel?",
                         "a": "One click inside your account. Access runs to the end of the "
                              "period you already paid for."},
                    ]},
                ],
            },
            {
                "slug": "events", "path": "events.html", "title": "Events",
                "purpose": "The calendar — the part of a membership people actually turn up for.",
                "hero": {"eyebrow": "Calendar", "title": "What is on",
                         "lede": "Member sessions, meet-ups and one-off things."},
                "sections": [
                    {"kind": "feed", "title": "Coming up", "source": "events", "limit": 30,
                     "empty": "Events appear here as they are scheduled."},
                ],
            },
            {
                "slug": "join", "path": "join.html", "title": "Join",
                "purpose": "Take the payment with the fewest possible steps.",
                "hero": {"eyebrow": "Join", "title": "Become a member",
                         "lede": "Monthly, cancel any time, everything included from day one."},
                "sections": [
                    {"kind": "pricing", "title": "Choose your membership",
                     "source": "pricing", "limit": 3},
                    {"kind": "pay", "title": "Start now", "provider": "stripe",
                     "action": "Join now",
                     "options": ["Monthly", "Yearly"],
                     "fallback": "Card payment is switched on the moment the operator "
                                 "supplies the keys."},
                    {"kind": "steps", "title": "What happens next", "items": [
                        {"title": "You pay",
                         "body": "Card or iDEAL. The first charge is today, then the same date "
                                 "each month."},
                        {"title": "You get in",
                         "body": "Access arrives by email immediately — no waiting for approval."},
                        {"title": "You can leave",
                         "body": "One click, any time, and you keep access to the end of the "
                                 "period you paid for."},
                    ]},
                ],
            },
            {
                "slug": "contact", "path": "contact.html", "title": "Contact",
                "purpose": "One reliable way to reach a person.",
                "hero": {"eyebrow": "Contact", "title": "Ask first",
                         "lede": "Questions about the membership are answered by a person."},
                "sections": [
                    {"kind": "form", "title": "Send a message", "form": "contact",
                     "body": "", "fields": ["name", "email", "subject", "message"],
                     "target": "support_inbox"},
                    {"kind": "facts", "title": "Details", "items": [
                        {"label": "Email", "value": "{email}"},
                        {"label": "Based in", "value": "{city}"},
                        {"label": "Replies", "value": "Within one working day"},
                    ]},
                ],
            },
        ],
    },

    "seed": {
        "membership_access": [
            {"name": "Example member — replace me", "email": "example@replace.me",
             "plan": "Monthly", "since": "{date_recent}", "active": True},
        ],
        "checkout_payments": [
            {"customer": "Example member — replace me", "item": "Monthly membership",
             "amount": 19, "date": "{date_recent}", "status": "Paid"},
        ],
        "events": [
            {"title": "Members' session", "date": "{date_soon}", "time": "20:00",
             "place": "Online", "rsvp": 0, "note": "Monthly. Recorded and kept in the archive."},
            {"title": "Meet-up in {city}", "date": "{date_further}", "time": "18:30",
             "place": "{city}", "rsvp": 0, "note": "Quarterly, in person."},
        ],
        "content_publishing": [
            {"title": "Welcome to the club", "status": "Draft", "channel": "Members",
             "date": "{today}",
             "body": "The first member post — what to expect, and how to get the most out of it."},
        ],
    },

    "integrations": {
        "payments": {"provider": "stripe", "purpose": "recurring subscriptions",
                     "env": ["STRIPE_PUBLISHABLE_KEY", "STRIPE_SECRET_KEY"]},
        "email": {"provider": "brevo", "purpose": "member announcements and access emails",
                  "env": ["BREVO_API_KEY", "BREVO_SENDER_EMAIL"]},
        "analytics": {"provider": "engage_ai", "purpose": "presence benchmark across 8 channels",
                      "env": ["ENGAGE_AI_BASE_URL"]},
    },

    "checks": [
        {"id": "members_present", "kind": "module_present", "target": "membership_access",
         "assert": "There is somewhere to see who is a member."},
        {"id": "subscriptions_present", "kind": "module_present", "target": "checkout_payments",
         "assert": "Recurring payment can be recorded."},
        {"id": "join_reachable", "kind": "links_resolve",
         "assert": "Joining is one click from every page."},
        {"id": "cancel_stated", "kind": "no_placeholders",
         "assert": "No unresolved token reached a page."},
    ],
}


# ===========================================================================
# EDUCATION
# ===========================================================================

EDUCATION = {
    "id": "education",
    "label": "Education / training",
    "type_preset": "editorial",
    "curated": True,
    "org_types": ["education"],
    "summary": "Teaching, sold by the course. The platform holds the curriculum, the "
               "people taking it and how far each of them has got — so the second cohort "
               "is easier to run than the first.",
    "forge": {
        "name": "LEARNforge",
        "scheme": "dark",
        "base": "#0A0A0B",
        "base_soft": "#141416",
        "accent": "#14B8A6",
        "accent_2": "#5EEAD4",
        "accent_site": "#0f766e",
        "on_accent": "#0A0A0B",
        "line": "Building a training platform.",
    },
    "accent": "#0f766e",
    "accent_soft": "#E6F4F2",
    "voice": "Teacherly without being stiff. It says what you will be able to do at the "
             "end, how long it takes, and what is expected of you — the three things a "
             "person weighs before enrolling.",

    "modules": {
        "require": ["courses_lms", "membership_access", "checkout_payments",
                    "content_publishing", "email_marketing", "support_inbox", "crm"],
        "drop": ["inventory_shipping", "donations", "donor_reporting", "product_catalog"],
        "order": ["courses_lms", "membership_access", "checkout_payments", "crm",
                  "content_publishing", "events", "email_marketing", "support_inbox",
                  "finance_admin", "lead_capture"],
        "rename": {
            "courses_lms": "Courses",
            "membership_access": "Students",
            "checkout_payments": "Enrolments",
            "crm": "Enquiries",
            "lead_capture": "Course interest",
        },
    },

    "site": {
        "primary_cta": {"label": "Enrol", "href": "/pricing"},
        "secondary_cta": {"label": "Courses", "href": "/courses"},
        "nav": ["home", "courses", "how", "pricing", "contact"],
        "pages": [
            {
                "slug": "home", "path": "index.html", "title": "Home",
                "purpose": "State what a student will be able to do afterwards, and what "
                           "it takes to get there.",
                "hero": {
                    "eyebrow": "{tagline}",
                    "title": "{business}",
                    "lede": "{offer_line}",
                    "cta": "Enrol", "cta_href": "/pricing",
                    "cta2": "See the courses", "cta2_href": "/courses",
                },
                "sections": [
                    {"kind": "facts", "title": "Before you enrol", "items": [
                        {"label": "Format", "value": "Online, at your own pace"},
                        {"label": "Time needed", "value": "About 3 hours a week"},
                        {"label": "Access", "value": "Keeps working after you finish"},
                        {"label": "Support", "value": "Questions answered by the teacher"},
                    ]},
                    {"kind": "cards", "title": "What you will learn", "source": "services",
                     "limit": 6},
                    {"kind": "feed", "title": "Courses running now", "source": "courses_lms",
                     "limit": 4, "empty": "Courses appear here as they are published."},
                    {"kind": "steps", "title": "How a course goes", "items": [
                        {"title": "Enrol",
                         "body": "One payment. Access arrives immediately — there is no cohort "
                                 "to wait for unless the course says so."},
                        {"title": "Work through it",
                         "body": "Short lessons with something to do after each one. Stop and "
                                 "start as often as you need."},
                        {"title": "Finish and keep it",
                         "body": "The material stays available afterwards, including updates."},
                    ]},
                    {"kind": "cta", "title": "Not sure which course?",
                     "body": "Describe where you are starting from and we will tell you "
                             "honestly whether this is the right thing.",
                     "cta": "Ask us", "cta_href": "/contact"},
                ],
            },
            {
                "slug": "courses", "path": "courses.html", "title": "Courses",
                "purpose": "The catalogue, with the outcome of each course stated plainly.",
                "hero": {"eyebrow": "Catalogue", "title": "Courses",
                         "lede": "What each one covers, how long it takes, and what it costs."},
                "sections": [
                    {"kind": "feed", "title": "All courses", "source": "courses_lms", "limit": 30,
                     "empty": "Courses appear here as they are published."},
                    {"kind": "cards", "title": "Also included", "source": "services", "limit": 12},
                ],
            },
            {
                "slug": "how", "path": "how.html", "title": "How it works",
                "purpose": "Set expectations honestly enough that the right people enrol.",
                "hero": {"eyebrow": "Method", "title": "How the teaching works",
                         "lede": "What is expected of you, and what you can expect of us."},
                "sections": [
                    {"kind": "prose", "title": "The approach", "body": "{about}"},
                    {"kind": "faq", "title": "The practical questions", "items": [
                        {"q": "How long do I have?",
                         "a": "There is no deadline. Access does not expire, and neither does "
                              "your progress."},
                        {"q": "Can I ask questions?",
                         "a": "Yes — they go to the person who wrote the course, and are "
                              "answered within a working day."},
                        {"q": "Is there a certificate?",
                         "a": "Yes, on completion. It states what you did rather than implying "
                              "an accreditation nobody granted."},
                        {"q": "What if it is not for me?",
                         "a": "Ask for a refund within 14 days of enrolling and you get one."},
                    ]},
                ],
            },
            {
                "slug": "pricing", "path": "pricing.html", "title": "Pricing",
                "purpose": "One page, the whole cost, no surprise second charge.",
                "hero": {"eyebrow": "Pricing", "title": "What it costs",
                         "lede": "Per course. Nothing recurring unless it says so."},
                "sections": [
                    {"kind": "pricing", "title": "Enrolment", "source": "pricing", "limit": 4},
                    {"kind": "pay", "title": "Enrol now", "provider": "stripe",
                     "action": "Enrol",
                     "options": ["One payment", "Two instalments"],
                     "fallback": "Card payment is switched on the moment the operator "
                                 "supplies the keys."},
                    {"kind": "faq", "title": "Paying", "items": [
                        {"q": "Can my employer pay?",
                         "a": "Yes. Ask for an invoice with the company details and it is "
                              "issued the same day."},
                        {"q": "Is there a discount for more than one person?",
                         "a": "Yes, from three people upwards. Ask before enrolling."},
                    ]},
                ],
            },
            {
                "slug": "contact", "path": "contact.html", "title": "Contact",
                "purpose": "One reliable way to reach the teacher.",
                "hero": {"eyebrow": "Contact", "title": "Ask before you enrol",
                         "lede": "Answered by the person who teaches it."},
                "sections": [
                    {"kind": "form", "title": "Send a message", "form": "contact",
                     "body": "Tell us where you are starting from — the answer will be more useful.",
                     "fields": ["name", "email", "subject", "message"],
                     "target": "support_inbox"},
                    {"kind": "facts", "title": "Details", "items": [
                        {"label": "Email", "value": "{email}"},
                        {"label": "Based in", "value": "{city}"},
                        {"label": "Replies", "value": "Within one working day"},
                    ]},
                ],
            },
        ],
    },

    "seed": {
        "courses_lms": [
            {"title": "Example course — replace me", "lessons": 8, "enrolled": 0,
             "price": 149, "live": False,
             "outline": "A seed course so the catalogue is not empty: eight lessons, each "
                        "with one thing to do afterwards. Replace and set live."},
        ],
        "membership_access": [
            {"name": "Example student — replace me", "email": "example@replace.me",
             "plan": "Course access", "since": "{date_recent}", "active": True},
        ],
        "checkout_payments": [
            {"customer": "Example student — replace me", "item": "Example course",
             "amount": 149, "date": "{date_recent}", "status": "Paid"},
        ],
        "content_publishing": [
            {"title": "Course announcement", "status": "Draft", "channel": "Website",
             "date": "{today}",
             "body": "A short post announcing the course, who it is for, and when it opens."},
        ],
    },

    "integrations": {
        "payments": {"provider": "stripe", "purpose": "course enrolment, one-off or instalments",
                     "env": ["STRIPE_PUBLISHABLE_KEY", "STRIPE_SECRET_KEY"]},
        "email": {"provider": "brevo", "purpose": "enrolment emails and student announcements",
                  "env": ["BREVO_API_KEY", "BREVO_SENDER_EMAIL"]},
        "analytics": {"provider": "engage_ai", "purpose": "presence benchmark across 8 channels",
                      "env": ["ENGAGE_AI_BASE_URL"]},
    },

    "checks": [
        {"id": "courses_present", "kind": "module_present", "target": "courses_lms",
         "assert": "There is somewhere to hold the curriculum."},
        {"id": "students_present", "kind": "module_present", "target": "membership_access",
         "assert": "Students and their access are tracked."},
        {"id": "courses_seeded", "kind": "seed_present", "target": "courses_lms",
         "assert": "The course list opens with something in it."},
        {"id": "price_published", "kind": "links_resolve",
         "assert": "The price is a page, reachable from the nav."},
    ],
}


# ===========================================================================
# LOCAL VENUE
# ===========================================================================

LOCAL_VENUE = {
    "id": "local_venue",
    "label": "Local venue",
    "type_preset": "gallery",
    "curated": True,
    "org_types": ["local_venue"],
    "summary": "A room people come to. The platform answers the three questions that fill "
               "it — what is on, can I book, and how do I get there — and keeps the diary "
               "that stops two bookings landing on one evening.",
    "forge": {
        "name": "VENUEforge",
        "scheme": "dark",
        "base": "#0A0A0B",
        "base_soft": "#141416",
        "accent": "#D946EF",
        "accent_2": "#F0ABFC",
        "accent_site": "#a21caf",
        "on_accent": "#0A0A0B",
        "line": "Building a venue platform.",
    },
    "accent": "#a21caf",
    "accent_soft": "#F9ECFB",
    "voice": "Like a person behind a bar: short sentences, real details, no brochure "
             "language. Opening hours before atmosphere.",

    "modules": {
        "require": ["booking", "events", "media_library", "crm", "support_inbox",
                    "content_publishing", "finance_admin"],
        "drop": ["donations", "donor_reporting", "courses_lms", "inventory_shipping"],
        "order": ["booking", "events", "crm", "media_library", "support_inbox",
                  "content_publishing", "finance_admin", "email_marketing", "lead_capture"],
        "rename": {
            "booking": "Diary",
            "crm": "Regulars",
            "media_library": "Gallery",
            "support_inbox": "Enquiries",
            # Without this, the website's capture form and the enquiries inbox both
            # arrive in the interface as "Enquiries" and the owner has two of them.
            "lead_capture": "Sign-ups",
        },
    },

    "site": {
        "primary_cta": {"label": "Book", "href": "/book"},
        "secondary_cta": {"label": "What's on", "href": "/whats-on"},
        "nav": ["home", "whats-on", "book", "about", "find-us"],
        "pages": [
            {
                "slug": "home", "path": "index.html", "title": "Home",
                "purpose": "Answer 'are you open, what is on, and can I book' in the first "
                           "screen.",
                "hero": {
                    "eyebrow": "{tagline}",
                    "title": "{business}",
                    "lede": "{offer_line}",
                    "cta": "Book", "cta_href": "/book",
                    "cta2": "What's on", "cta2_href": "/whats-on",
                },
                "sections": [
                    {"kind": "facts", "title": "Practical", "items": [
                        {"label": "Where", "value": "{city}"},
                        {"label": "Open", "value": "Wednesday to Sunday"},
                        {"label": "Booking", "value": "Online, or just turn up"},
                        {"label": "Private hire", "value": "Yes — ask"},
                    ]},
                    {"kind": "feed", "title": "This week", "source": "events", "limit": 4,
                     "empty": "Upcoming nights will be listed here."},
                    {"kind": "cards", "title": "The room", "source": "services", "limit": 6},
                    {"kind": "cta", "title": "Hold a date",
                     "body": "Tables, private hire and whole-venue bookings all start with "
                             "the same short form.",
                     "cta": "Book", "cta_href": "/book"},
                ],
            },
            {
                "slug": "whats-on", "path": "whats-on.html", "title": "What's on",
                "purpose": "The calendar — the single most visited page a venue has.",
                "hero": {"eyebrow": "Calendar", "title": "What's on",
                         "lede": "Every night we are open, and what is happening on it."},
                "sections": [
                    {"kind": "feed", "title": "Coming up", "source": "events", "limit": 30,
                     "empty": "Events appear here as they are booked in."},
                    {"kind": "feed", "title": "From the room", "source": "media_library",
                     "limit": 6, "empty": "Photographs and recordings appear here."},
                ],
            },
            {
                "slug": "book", "path": "book.html", "title": "Book",
                "purpose": "Take the booking with the fewest possible questions.",
                "hero": {"eyebrow": "Booking", "title": "Book a table or the room",
                         "lede": "Tell us when and how many. We confirm the same day."},
                "sections": [
                    {"kind": "steps", "title": "How booking works", "items": [
                        {"title": "Send the request",
                         "body": "Date, time and how many of you. Thirty seconds."},
                        {"title": "We confirm",
                         "body": "The same day, by email — and we say so plainly if we are full."},
                        {"title": "Turn up",
                         "body": "The table is held for fifteen minutes past the time you booked."},
                    ]},
                    {"kind": "form", "title": "Request a booking", "form": "booking",
                     "body": "For private hire, say what the occasion is and we will come back "
                             "with what is possible.",
                     "fields": ["name", "email", "when", "message"], "target": "booking"},
                    {"kind": "faq", "title": "Booking questions", "items": [
                        {"q": "Can I book for a large group?",
                         "a": "Yes. Above ten people we will ring you to sort out the details."},
                        {"q": "Do you take walk-ins?",
                         "a": "Always, if there is room. Booking only guarantees the table."},
                        {"q": "What does private hire cost?",
                         "a": "It depends on the night and the length. Ask, and you will get a "
                              "figure rather than a range."},
                    ]},
                ],
            },
            {
                "slug": "about", "path": "about.html", "title": "About",
                "purpose": "Say what kind of place this is, so the right people come.",
                "hero": {"eyebrow": "About", "title": "The place",
                         "lede": "{tagline}"},
                "sections": [
                    {"kind": "prose", "title": "What this is", "body": "{about}"},
                    {"kind": "feed", "title": "Gallery", "source": "media_library", "limit": 9,
                     "empty": "Photographs appear here."},
                ],
            },
            {
                "slug": "find-us", "path": "find-us.html", "title": "Find us",
                "purpose": "Getting here, without a map app.",
                "hero": {"eyebrow": "Getting here", "title": "Find us",
                         "lede": "Where we are, when we are open, and where to leave the bike."},
                "sections": [
                    {"kind": "facts", "title": "Where and when", "items": [
                        {"label": "Address", "value": "{city}"},
                        {"label": "Open", "value": "Wed–Sun, from 17:00"},
                        {"label": "Email", "value": "{email}"},
                        {"label": "Accessible", "value": "Step-free entrance"},
                    ]},
                    {"kind": "form", "title": "Ask us something", "form": "contact",
                     "body": "", "fields": ["name", "email", "message"],
                     "target": "support_inbox"},
                ],
            },
        ],
    },

    "seed": {
        "booking": [
            {"title": "Example booking — replace me", "who": "Example guest",
             "date": "{date_soon}", "time": "19:30", "status": "Confirmed",
             "note": "Seed record so the diary is not empty. Delete when real bookings land."},
        ],
        "events": [
            {"title": "Friday night", "date": "{date_soon}", "time": "20:00",
             "place": "{city}", "rsvp": 0, "note": "Weekly. Doors at 19:30."},
            {"title": "Sunday session", "date": "{date_later}", "time": "16:00",
             "place": "{city}", "rsvp": 0, "note": "Every other week."},
        ],
        "media_library": [
            {"title": "The room", "speaker": "", "date": "{date_recent}", "series": "Gallery",
             "url": "", "summary": "A photograph of the room, so people know what they are "
                                   "walking into."},
        ],
        "content_publishing": [
            {"title": "What's on this month", "status": "Draft", "channel": "Website",
             "date": "{today}", "body": "A short post listing the month's nights."},
        ],
    },

    "integrations": {
        "payments": {"provider": "stripe", "purpose": "deposits for private hire",
                     "env": ["STRIPE_PUBLISHABLE_KEY", "STRIPE_SECRET_KEY"]},
        "email": {"provider": "brevo", "purpose": "booking confirmations and the mailing list",
                  "env": ["BREVO_API_KEY", "BREVO_SENDER_EMAIL"]},
        "analytics": {"provider": "engage_ai", "purpose": "presence benchmark across 8 channels",
                      "env": ["ENGAGE_AI_BASE_URL"]},
    },

    "checks": [
        {"id": "diary_present", "kind": "module_present", "target": "booking",
         "assert": "There is a diary, so two bookings cannot land on one evening."},
        {"id": "whats_on_present", "kind": "module_present", "target": "events",
         "assert": "What is on can be published."},
        {"id": "events_seeded", "kind": "seed_present", "target": "events",
         "assert": "The calendar opens with something in it."},
        {"id": "findable", "kind": "links_resolve",
         "assert": "Finding the place is a page, reachable from the nav."},
    ],
}


# ===========================================================================
# SAAS
# ===========================================================================

SAAS = {
    "id": "saas",
    "label": "Software as a service",
    "type_preset": "grotesk",
    # The one archetype whose buyers judge the product by whether the site behaves like
    # one. A restrained page for a software company reads as "made by someone who does
    # not build software", so this is the archetype that takes the second skin.
    "skin": "hitech",
    "site_scheme": "dark",
    # And the product itself. Every other archetype sells something that exists outside
    # the software; this one *is* the software, so Forge builds it rather than leaving a
    # "Start free" button pointing at a form.
    "product_app": "scheduling",
    "curated": True,
    "org_types": ["saas"],
    "summary": "Software rented by the month. The public site's only job is to get a "
               "person from 'what is this' to a trial; the platform holds the accounts, "
               "the subscriptions and the support that keeps them.",
    "forge": {
        "name": "SAASforge",
        "scheme": "dark",
        "base": "#0A0A0B",
        "base_soft": "#141416",
        "accent": "#6366F1",
        "accent_2": "#A5B4FC",
        "accent_site": "#4338ca",
        "on_accent": "#0A0A0B",
        "line": "Building a SaaS platform.",
    },
    "accent": "#4338ca",
    "accent_soft": "#ECEDFD",
    "voice": "Concrete and unexcited. It describes what the software does in the user's "
             "words, shows the price without a form, and never says 'seamless'.",

    "modules": {
        "require": ["membership_access", "checkout_payments", "crm", "support_inbox",
                    "content_publishing", "email_marketing", "lead_capture",
                    "finance_admin"],
        "drop": ["donations", "donor_reporting", "inventory_shipping", "people_roster",
                 "booking", "product_catalog"],
        "order": ["membership_access", "checkout_payments", "crm", "lead_capture",
                  "support_inbox", "finance_admin", "email_marketing",
                  "content_publishing"],
        "rename": {
            "membership_access": "Accounts",
            "checkout_payments": "Subscriptions",
            "crm": "Pipeline",
            "lead_capture": "Trials",
            "support_inbox": "Support",
        },
    },

    "site": {
        "primary_cta": {"label": "Start free", "href": "/trial"},
        "secondary_cta": {"label": "Pricing", "href": "/pricing"},
        "nav": ["home", "product", "pricing", "trial", "contact"],
        "pages": [
            {
                "slug": "home", "path": "index.html", "title": "Home",
                "purpose": "Say what the software does, for whom, in one sentence a user "
                           "would recognise as their own problem.",
                "hero": {
                    "eyebrow": "{tagline}",
                    "title": "{business}",
                    "lede": "{offer_line}",
                    "cta": "Start free", "cta_href": "/trial",
                    "cta2": "See the price", "cta2_href": "/pricing",
                },
                "sections": [
                    {"kind": "facts", "title": "The shape of it", "items": [
                        {"label": "Setup", "value": "Minutes, not a project"},
                        {"label": "Contract", "value": "Monthly, cancel any time"},
                        {"label": "Your data", "value": "Exportable, always"},
                        {"label": "Support", "value": "A person, not a bot"},
                    ]},
                    {"kind": "cards", "title": "What it does", "source": "services", "limit": 6},
                    {"kind": "steps", "title": "Getting started", "items": [
                        {"title": "Start a trial",
                         "body": "No card. The trial is the real product, not a demo account."},
                        {"title": "Put your own work in it",
                         "body": "Import or type it. If it does not fit your work in a week, it "
                                 "will not fit it in a year."},
                        {"title": "Decide",
                         "body": "Subscribe or walk away, and take your data with you either way."},
                    ]},
                    {"kind": "pricing", "title": "Pricing", "source": "pricing", "limit": 3},
                    {"kind": "cta", "title": "Try it on your own work",
                     "body": "The trial has every feature in it. Nothing is held back to make "
                             "the paid version look better.",
                     "cta": "Start free", "cta_href": "/trial"},
                ],
            },
            {
                "slug": "product", "path": "product.html", "title": "Product",
                "purpose": "Explain the software feature by feature, without screenshots "
                           "of software that does not exist yet.",
                "hero": {"eyebrow": "Product", "title": "What it actually does",
                         "lede": "Described in the words a user would use, not the ones the "
                                 "architecture would."},
                "sections": [
                    {"kind": "cards", "title": "Features", "items": [
                        {"title": "Nobody rostered on their day off",
                         "body": "Staff say when they cannot work. You see it when building the "
                                 "rota, not when they call in."},
                        {"title": "Starters and leavers, sorted",
                         "body": "Set their hourly rate, weekly hours cap, and role. Edit or delete "
                                 "them whenever you need to."},
                        {"title": "Conflicts are caught",
                         "body": "Double-booked shifts show as problems. Shifts less than 11 hours "
                                 "apart are flagged before you confirm."},
                        {"title": "You're warned before you're short-staffed",
                         "body": "Say how many people you need per role on each day. You are warned "
                                 "when you are short."},
                        {"title": "You know the cost before you publish it",
                         "body": "A weekly spending target and labour as a percentage of your "
                                 "forecast revenue. The cost has meaning."},
                        {"title": "Shifts get covered without chasing",
                         "body": "An unclaimed shift sits there until someone takes it. You approve "
                                 "the claim or it goes back."},
                        {"title": "They have read the rota",
                         "body": "You see who has confirmed they have read the published roster. No "
                                 "surprises on the day."},
                        {"title": "Mistakes are not permanent",
                         "body": "Delete the wrong shift, override the wrong hours, undo it. Nothing "
                                 "you do while building the rota is unrecoverable."},
                    ]},
                    {"kind": "prose", "title": "Who it is for", "body": "{about}"},
                    {"kind": "faq", "title": "The technical questions", "items": [
                        {"q": "Where is my data held?",
                         "a": "In the EU, and you can export all of it at any time in an open "
                              "format."},
                        {"q": "Is there an API?",
                         "a": "Yes, on every plan — an integration is not a reason to charge more."},
                        {"q": "What happens if I stop paying?",
                         "a": "The account goes read-only rather than being deleted, and the "
                              "export keeps working."},
                    ]},
                ],
            },
            {
                "slug": "pricing", "path": "pricing.html", "title": "Pricing",
                "purpose": "Publish the price. A pricing page with a contact form on it is "
                           "not a pricing page.",
                "hero": {"eyebrow": "Pricing", "title": "What it costs",
                         "lede": "Published, per month, with no call required to find out."},
                "sections": [
                    {"kind": "pricing", "title": "Plans", "source": "pricing", "limit": 4},
                    {"kind": "pay", "title": "Subscribe", "provider": "stripe",
                     "action": "Subscribe",
                     "options": ["Monthly", "Yearly"],
                     "fallback": "Card payment is switched on the moment the operator "
                                 "supplies the keys."},
                    {"kind": "faq", "title": "Billing", "items": [
                        {"q": "Can I change plan later?",
                         "a": "Yes, up or down, and the change is prorated."},
                        {"q": "Do you charge per user?",
                         "a": "Only where the plan says so. Nothing is added to the bill "
                              "without you agreeing to it first."},
                        {"q": "Is there a discount for paying yearly?",
                         "a": "Yes — two months, and you can still leave."},
                    ]},
                ],
            },
            {
                "slug": "trial", "path": "trial.html", "title": "Start free",
                "purpose": "Take the trial signup with the fewest possible fields.",
                "hero": {"eyebrow": "Free trial", "title": "Start on your own work",
                         "lede": "No card, no sales call, every feature switched on."},
                "sections": [
                    {"kind": "form", "title": "Start a trial", "form": "trial",
                     "body": "Two fields. The account is created immediately.",
                     "fields": ["name", "email"], "target": "lead_capture"},
                    {"kind": "steps", "title": "What happens next", "items": [
                        {"title": "You get in",
                         "body": "Immediately, by email. Nobody has to approve you."},
                        {"title": "Nobody rings you",
                         "body": "One email at the halfway point asking whether it is working. "
                                 "That is all."},
                        {"title": "It ends quietly",
                         "body": "If you do nothing, the trial stops. You are not charged for "
                                 "forgetting."},
                    ]},
                ],
            },
            {
                "slug": "contact", "path": "contact.html", "title": "Contact",
                "purpose": "One reliable way to reach a person.",
                "hero": {"eyebrow": "Contact", "title": "Talk to a person",
                         "lede": "Support and sales are the same inbox, which keeps both honest."},
                "sections": [
                    {"kind": "form", "title": "Send a message", "form": "contact",
                     "body": "", "fields": ["name", "email", "subject", "message"],
                     "target": "support_inbox"},
                    {"kind": "facts", "title": "Details", "items": [
                        {"label": "Email", "value": "{email}"},
                        {"label": "Based in", "value": "{city}"},
                        {"label": "Replies", "value": "Within one working day"},
                    ]},
                ],
            },
        ],
    },

    "seed": {
        "membership_access": [
            {"name": "Example account — replace me", "email": "example@replace.me",
             "plan": "Trial", "since": "{date_recent}", "active": True},
        ],
        "checkout_payments": [
            {"customer": "Example account — replace me", "item": "Monthly plan",
             "amount": 29, "date": "{date_recent}", "status": "Paid"},
        ],
        "lead_capture": [
            {"name": "Example trial — replace me", "email": "example@replace.me",
             "asked": "Started a trial from the website.", "date": "{date_recent}",
             "handled": False},
        ],
        "content_publishing": [
            {"title": "What we shipped this month", "status": "Draft", "channel": "Website",
             "date": "{today}",
             "body": "A short changelog post — what changed, and why it matters to a user."},
        ],
    },

    "integrations": {
        "payments": {"provider": "stripe", "purpose": "monthly and yearly subscriptions",
                     "env": ["STRIPE_PUBLISHABLE_KEY", "STRIPE_SECRET_KEY"]},
        "email": {"provider": "brevo", "purpose": "trial emails and product announcements",
                  "env": ["BREVO_API_KEY", "BREVO_SENDER_EMAIL"]},
        "analytics": {"provider": "engage_ai", "purpose": "presence benchmark across 8 channels",
                      "env": ["ENGAGE_AI_BASE_URL"]},
    },

    "checks": [
        {"id": "accounts_present", "kind": "module_present", "target": "membership_access",
         "assert": "Accounts and their access are tracked."},
        {"id": "subscriptions_present", "kind": "module_present", "target": "checkout_payments",
         "assert": "A subscription can be recorded."},
        {"id": "price_published", "kind": "links_resolve",
         "assert": "The price is published on its own page, reachable from the nav."},
        {"id": "trial_before_pay", "kind": "copy_order",
         "assert": "The home page explains the software before it asks for money."},
    ],
}


ARCHETYPES = {a["id"]: a for a in (CHURCH, SOLO_BUSINESS, NONPROFIT, ECOMMERCE,
                                   DIGITAL_PRODUCTS, MEMBERSHIP, EDUCATION,
                                   LOCAL_VENUE, SAAS, PRELAUNCH, GENERIC)}

# Which org types are first-class today, and which are honest fallbacks. Kept explicit
# so `archetypes --catalog` can say "not written yet" instead of implying coverage.
ORG_TYPE_MAP = {
    "church": "church",
    "service_business": "solo_business",
    "creator_media": "solo_business",
    "nonprofit": "nonprofit",
    "ecommerce": "ecommerce",
    "digital_products": "digital_products",
    "membership": "membership",
    "education": "education",
    "local_venue": "local_venue",
    "saas": "saas",
}


# Whether a prelaunch funnel is worth running before the platform is built.
#
# A waitlist buys one thing: evidence that strangers want a thing that does not exist yet.
# A church already has a congregation, a service business already has a phone that rings,
# a venue already has a street — for those the funnel is a detour, and the site IS the
# first deliverable. A course, a membership, a SaaS or a product line is sold to people
# who have not met it, and there the 100 no's are the cheapest thing you will ever build.
#
# This is advice, not a gate: the factory offers both paths for every archetype and
# records which one was chosen. Unlisted archetypes give no advice rather than a guess.
PRELAUNCH_RECOMMENDED = {
    "church": False,
    "solo_business": False,
    "nonprofit": False,
    "local_venue": False,
    "ecommerce": True,
    "digital_products": True,
    "membership": True,
    "education": True,
    "saas": True,
}


def prelaunch_advice(org_type: str) -> str:
    """"recommended", "optional", or "" when nothing is known about this org type."""
    aid = ORG_TYPE_MAP.get(org_type or "", "")
    if aid not in PRELAUNCH_RECOMMENDED:
        return ""
    return "recommended" if PRELAUNCH_RECOMMENDED[aid] else "optional"


# ===========================================================================
# resolution
# ===========================================================================

def resolve(org_type: str, override: str = None) -> dict:
    """The archetype this business builds from, and why.

    An override is honoured (an operator may know their church-adjacent nonprofit should
    build as a church), but it is recorded as an override, not as a classification."""
    if override:
        if override not in ARCHETYPES:
            raise ValueError(f"unknown archetype '{override}'. Known: {', '.join(ARCHETYPES)}")
        a = ARCHETYPES[override]
        return {"archetype": a, "id": a["id"], "source": "operator override",
                "curated": a["curated"], "org_type": org_type}

    aid = ORG_TYPE_MAP.get(org_type or "", "generic")
    a = ARCHETYPES[aid]
    source = (f"org type '{org_type}' builds as {a['label']}" if aid != "generic"
              else f"no archetype written for org type '{org_type}' yet — building generic")
    return {"archetype": a, "id": aid, "source": source,
            "curated": a["curated"], "org_type": org_type}


def apply_modules(archetype: dict, blueprint_modules: list) -> dict:
    """The archetype's convictions applied to the blueprint's module list.

    Returns the final ordered list plus exactly what changed, so the spec can carry the
    reasoning and nobody has to diff two lists to understand the build."""
    mods = archetype["modules"]
    chosen = list(blueprint_modules)
    added, dropped = [], []

    for k in mods.get("require", []):
        if k not in chosen:
            chosen.append(k)
            added.append(k)
    for k in mods.get("drop", []):
        if k in chosen:
            chosen.remove(k)
            dropped.append(k)

    order = mods.get("order") or []
    def rank(k):
        return order.index(k) if k in order else len(order) + sorted(chosen).index(k)
    chosen = sorted(set(chosen), key=rank)

    return {"modules": chosen, "added_by_archetype": added,
            "dropped_by_archetype": dropped, "renamed": mods.get("rename", {})}


def render_catalog() -> str:
    """What each archetype builds — readable without running a launch."""
    out = ["ARCHETYPE PLATFORMS", "=" * 60, ""]
    for a in ARCHETYPES.values():
        mark = "●" if a["curated"] else "○"
        out.append(f"{mark} {a['forge']['name']}  ({a['id']})  —  {a['label']}")
        out.append(f"   {a['summary']}")
        req = a["modules"].get("require") or []
        drop = a["modules"].get("drop") or []
        if req:
            out.append("   always builds : " + ", ".join(req))
        if drop:
            out.append("   never builds  : " + ", ".join(drop))
        out.append("   site pages    : " + ", ".join(p["title"] for p in a["site"]["pages"]))
        out.append("   seeded with   : " + (", ".join(a["seed"]) if a["seed"] else "nothing"))
        out.append("   must be true  : " + str(len(a["checks"])) + " checks")
        out.append("")
    out.append("● written and specialised   ○ honest fallback, built from the blueprint alone")
    out.append("")
    out.append("`prelaunch` is a PHASE, not a kind of business: select it with --archetype")
    out.append("prelaunch in front of any org type, to test the idea before building it.")
    out.append("")
    out.append("Org types resolve as:")
    for ot, aid in sorted(ORG_TYPE_MAP.items()):
        note = "" if ARCHETYPES[aid]["curated"] else "   (no archetype written yet)"
        out.append(f"   {ot:<18} -> {aid}{note}")
    return "\n".join(out)


if __name__ == "__main__":
    print(render_catalog())
