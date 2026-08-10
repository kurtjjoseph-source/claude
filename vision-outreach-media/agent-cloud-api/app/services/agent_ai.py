import json
from anthropic import Anthropic
from app.config import settings

# Same protocol as agent-lab/PROTOCOL.md, translated into a system prompt the
# model executes directly instead of Kurt manually reading a markdown file.
BASE_PROTOCOL = """You are an autonomous business-development agent running ONE check-in cycle for a single client.

Each cycle:
1. Read the client profile, recent run history, and open tickets you're given.
2. Report what changed since the last cycle in 2-3 sentences (the "summary").
3. Propose 1-3 concrete next actions as tickets. Be specific - no vague ideas, no filler, no hedging.

Rules for every ticket:
- "risk": "low" means reversible, no money spent, nothing posted publicly, no real person contacted directly.
  For "low" risk tickets, do the work now - the "payload" must contain the actual finished draft/output, not a description of what you'd do.
- "risk": "high" means it would spend money, publish/post publicly, or contact a real person directly.
  This system cannot execute those yet - just surface the proposal clearly in the payload so a human can act on it manually.
- Do not re-propose a ticket that is already open in "open_tickets" unless its status is "backlog" with a decision_note
  (that means the client redirected it - address the note, don't just repeat the same idea).
- If the client profile is too empty to propose anything grounded, propose your best-guess ticket AND include one ticket
  with risk "low" whose payload is just {"question": "..."} asking for the specific missing information.

Return ONLY valid JSON, no markdown code fences, no commentary outside the JSON, matching exactly this shape:
{
  "summary": "string",
  "tickets": [
    {"title": "string", "rationale": "string", "risk": "low", "payload": {}}
  ]
}
"""

# Niche-specific addendum. Keyed by Client.niche, so the same engine above
# runs any business idea - only this block changes per hustle.
NICHE_PROMPTS: dict[str, str] = {
    "youtube_channel": """
## Niche: YouTube channel growth (side hustle #3 - "Start a YouTube Channel")

The client is building a YouTube channel teaching a skill or topic they already know professionally.
Your job each cycle is to propose specific, filmable video ideas - not vague topics like "post about music."

Each video-idea ticket's "payload" must contain:
- "working_title": string
- "hook": the first 5-10 seconds, written out word for word
- "outline": array of section bullet points
- "thumbnail_concepts": array of 2-3 short concepts
- "why_this_now": one line connecting it to the client's stated audience/niche

Prefer narrow, specific, even "boring" practical topics over broad generic ones - specificity beats generality here.
Respect the client's stated posting cadence in their profile (e.g. "1 video per week") - never propose more videos
in one cycle than they could realistically film before the next check-in.
""",
}


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    return json.loads(text)


class AgentAI:
    def __init__(self):
        self.client = Anthropic(api_key=settings.anthropic_api_key) if settings.anthropic_api_key else None

    def run_cycle(self, niche: str, client_profile: dict, recent_runs: list[dict], open_tickets: list[dict]) -> dict:
        if not self.client:
            return {
                "summary": "ANTHROPIC_API_KEY is not set - no cycle was run. Set it in .env to enable the agent.",
                "tickets": [],
            }

        system = BASE_PROTOCOL + "\n" + NICHE_PROMPTS.get(niche, "")
        user_payload = {
            "client_profile": client_profile,
            "recent_runs": recent_runs,
            "open_tickets": open_tickets,
        }

        response = self.client.messages.create(
            model=settings.anthropic_model,
            max_tokens=4096,
            system=system,
            messages=[{"role": "user", "content": json.dumps(user_payload)}],
        )
        text = "".join(block.text for block in response.content if block.type == "text")
        try:
            return _extract_json(text)
        except json.JSONDecodeError:
            return {"summary": "Agent returned non-JSON output; this cycle produced no tickets.", "tickets": []}
