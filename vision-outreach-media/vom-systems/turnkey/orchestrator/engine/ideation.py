#!/usr/bin/env python3
"""
ideation — turn a sentence into a business the factory can build.

The rest of this engine is stdlib-only on purpose: `turnkey.py` runs anywhere, with
no pip and no network. Ideation cannot honour that — it is a call to a model — so it
is the one module with a dependency, and it is **imported lazily**. If `anthropic`
is not installed the factory says so and falls back to the manual form; nothing else
in the engine notices.

What it does: takes the operator's rough description and returns the same structured
answers the factory's form collects — who it is for, the problem, the offer, what
they get, a price, the org type. That is the whole facade. A person writes a
sentence; everything downstream (idea → profile → provisioning → build) already
knows what to do with the result.

The model is constrained to the exact schema the factory consumes, so the output
needs no parsing heuristics and no repair pass — a field is either there and valid
or the call failed.
"""

from __future__ import annotations

import json
import os

MODEL = "claude-opus-5"

ORG_TYPES = ["church", "nonprofit", "service_business", "ecommerce", "digital_products",
             "membership", "education", "local_venue", "saas", "creator_media"]

# The contract with factory.py: these are exactly the answer keys the form collects,
# so an AI-drafted business and a hand-typed one are indistinguishable downstream.
SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string", "description": "The business name. If the operator "
                                                  "did not give one, invent something plain and "
                                                  "sayable — never a pun or a portmanteau."},
        "org_type": {"type": "string", "enum": ORG_TYPES,
                     "description": "What kind of organization this is, structurally."},
        "who": {"type": "string", "description": "Who it is for. Narrow and concrete — a "
                                                 "describable group, not 'everyone' or 'businesses'."},
        "problem": {"type": "string", "description": "The problem they have, phrased the way "
                                                     "they would say it, not in industry language."},
        "solution": {"type": "string", "description": "What this business would do about it. "
                                                      "One or two sentences."},
        "promise": {"type": "string", "description": "The offer in one sentence a stranger "
                                                     "could repeat back. Concrete outcome, no adjectives."},
        "gets": {"type": "array", "items": {"type": "string"}, "maxItems": 3,
                 "description": "Up to three things the customer actually receives. "
                                "Deliverables, not benefits."},
        "price": {"type": "integer", "description": "A plausible price in euros for one sale. "
                                                    "0 if the org type does not sell (e.g. a church)."},
        "target": {"type": "integer", "description": "A plausible monthly revenue target in "
                                                     "euros. 0 if not applicable."},
        "city": {"type": "string", "description": "Where it is based. Empty string if unknown — "
                                                  "do not guess a city."},
        "email": {"type": "string", "description": "Empty string unless the operator gave one."},
        "positioning": {"type": "string", "description": "One sentence on what makes this "
                                                         "different from the obvious alternative."},
        "voice": {"type": "string", "description": "How it should sound, in one sentence."},
        "channels": {"type": "string", "description": "Where its customers already are."},
        "assumptions": {"type": "array", "items": {"type": "string"},
                        "description": "Anything you decided that the operator did not tell you. "
                                       "Be exhaustive and specific — this is shown to them so they "
                                       "can correct it, and an unlisted invention is a lie."},
    },
    "required": ["name", "org_type", "who", "problem", "solution", "promise", "gets",
                 "price", "target", "city", "email", "positioning", "voice", "channels",
                 "assumptions"],
    "additionalProperties": False,
}

SYSTEM = """You turn a rough business idea into the structured brief a build system \
executes. Everything you return becomes real: the words go on a live website, the price \
goes on a live pricing page, the org type decides which platform gets built.

Write like the person running this business, not like someone describing it. Plain, \
concrete, specific. No marketing register, no "empower", no "seamless", no em-dash \
flourishes, no three-adjective stacks.

Be decisive: the operator gave you a sentence and expects a business back, so make the \
calls a competent consultant would make rather than returning vague placeholders. But \
record every one of those calls in `assumptions` — the operator reads that list and \
corrects it, and an invention you did not disclose becomes an unreviewed claim on a \
public page.

Narrow the audience. "Small businesses" is not an audience; "independent bookkeepers in \
the Netherlands with no website" is. The whole downstream system produces better output \
from a narrow one, and a narrow audience is easier to correct than a vague one."""


def _has_credentials() -> bool:
    """An unset ANTHROPIC_API_KEY does not mean there are no credentials.

    The SDK resolves in order: ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, then a stored
    profile from `ant auth login`. Checking only the env var reports a false negative
    for anyone signed in through the CLI, so check the profile directory too."""
    if os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN"):
        return True
    cfg = os.environ.get("ANTHROPIC_CONFIG_DIR") or os.path.expanduser("~/.config/anthropic")
    return os.path.isdir(os.path.join(cfg, "credentials"))


def available() -> bool:
    """Whether this environment can do AI ideation at all."""
    try:
        import anthropic  # noqa: F401
    except ImportError:
        return False
    return _has_credentials()


def why_unavailable() -> str:
    try:
        import anthropic  # noqa: F401
    except ImportError:
        return ("the `anthropic` package is not installed here (`pip install anthropic`) "
                "— the form below still works")
    if not _has_credentials():
        return ("no Anthropic credentials in this environment — set ANTHROPIC_API_KEY, "
                "or run `ant auth login`. The form below still works.")
    return ""


def _archetype_brief(org_type: str) -> str:
    """What the chosen kind of business actually gets built, in the model's context.

    Without this the draft is generic and the compiler then squeezes it into pages it was
    never written for — a venue's copy arriving with nothing to say on its booking page.
    The archetype already knows its pages, its modules and its voice, so the writing is
    briefed on the thing being built rather than on 'a business'."""
    try:
        import archetypes
    except Exception:
        return ""
    a = archetypes.resolve(org_type or "")["archetype"]
    pages = ", ".join(p["title"] for p in a["site"]["pages"])
    mods = ", ".join((a["modules"].get("require") or [])[:8]).replace("_", " ")
    return (
        f"WHAT GETS BUILT FOR THIS KIND OF BUSINESS\n"
        f"Kind: {a['label']}\n"
        f"Summary: {a['summary']}\n"
        f"Public pages that will exist and need copy: {pages}\n"
        f"Back-office it runs on: {mods}\n"
        f"Required voice: {a['voice']}\n"
        f"Write so that every one of those pages has something true and specific to say. "
        f"A page you give nothing to is a page that ships empty."
    )


def draft(description: str, hint_name: str = "", hint_city: str = "",
          org_type: str = "") -> dict:
    """One sentence in, a complete business brief out.

    The model is constrained to SCHEMA, so the result either validates or the call
    raises — there is no half-parsed middle state for the caller to defend against."""
    import anthropic

    if not (description or "").strip():
        raise ValueError("describe the idea first — even one sentence")

    client = anthropic.Anthropic()
    known = []
    if hint_name:
        known.append(f"The operator has already named it: {hint_name}. Use that name.")
    if hint_city:
        known.append(f"It is based in {hint_city}.")
    if org_type:
        # Chosen from the directory, so it is a decision and not a guess to be second-guessed.
        known.append(f"The operator has already chosen the kind of business: {org_type}. "
                     f"Return exactly that org_type; do not reclassify it.")
        brief = _archetype_brief(org_type)
        if brief:
            known.append(brief)

    response = client.messages.create(
        model=MODEL,
        max_tokens=16000,
        system=SYSTEM,
        output_config={"effort": "medium",
                       "format": {"type": "json_schema", "schema": SCHEMA}},
        messages=[{"role": "user", "content":
                   "\n\n".join(known + ["Here is the idea:", description.strip()])}],
    )

    if response.stop_reason == "refusal":
        raise RuntimeError("the model declined to draft this idea"
                           + (f" ({response.stop_details.category})"
                              if getattr(response, "stop_details", None) else ""))
    if response.stop_reason == "max_tokens":
        raise RuntimeError("the draft was cut off before it finished — try a shorter description")

    text = next((b.text for b in response.content if b.type == "text"), "")
    if not text:
        raise RuntimeError("the model returned no draft")
    a = json.loads(text)

    # The factory stores `gets` as newline-separated text (one deliverable per line).
    a["gets"] = "\n".join(a.get("gets") or [])
    a["_assumptions"] = a.pop("assumptions", [])
    a["_drafted_by"] = MODEL
    return a
