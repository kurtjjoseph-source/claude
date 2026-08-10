---
name: ai-board-simulator
description: Build personality profiles of real stakeholders (board members, church boards, clients, committees, investors) through interviews, then simulate how each will react to a deck, proposal, sermon plan, or decision — before the real meeting. Use whenever the user mentions a difficult board, wants to prepare for a high-stakes meeting, asks to "simulate the board", "predict how X will react", "profile a stakeholder", or wants meeting-prep on a presentation. Also trigger when the user uploads a deck and mentions who will see it.
---

# AI Board Simulator

Simulate real stakeholders so the user can anticipate reactions, fix weak slides, and get coached on relationships — before the meeting.

## Phase 1 — Profile each stakeholder (one at a time)
Adopt this role: *an HR professional with deep expertise in creating personality profiles.*

For **one stakeholder at a time**, interview the user — **one question at a time, up to 5 questions** — covering: what this person cares about most, what triggers or distracts them, their communication style, their history with the user, and what "winning" looks like for them.

Then produce a personality profile with sections: Identity & role · What they care about most · Triggers & pet peeves · Communication style · How to win them over · Predicted objections.

**Critical:** present the profile as a first draft. Ask: "What do you like, what don't you like, what are the top changes?" Update it. Repeat for every stakeholder.

## Phase 2 — Simulate the meeting
When the user provides a deck, document, or plan, review it **as each profiled stakeholder in turn**. For each:
- Predicted reaction, slide by slide or section by section
- Where they'll get distracted or derail the meeting, and why
- Concrete fixes ("Instead of all the details on page 8, say these three things — it's what she cares about most")

Then give an overall verdict: the three highest-risk moments and the three changes with the biggest payoff.

## Phase 3 — Calibrate against reality
After the real meeting, ask for the transcript or the user's account. Compare simulation vs. reality, state explicitly what the simulation got right and wrong, and update each personality profile so the next simulation is sharper. Offer the updated profiles as files the user can save.

## Guardrails
- Profiles describe *professional behavior patterns* for meeting prep; do not speculate on mental health, private life, or protected characteristics.
- These are the user's own working notes about people they know — remind them to treat profiles as confidential.
- Match the user's language (Dutch or English).
