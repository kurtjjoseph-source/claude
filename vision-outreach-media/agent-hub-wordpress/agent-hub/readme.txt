=== Agent Hub ===
Contributors: visionoutreachmedia
Tags: ai, automation, agent, business
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 8.0
Stable tag: 0.1.0
License: GPLv2 or later

SUPERSEDED 2026-07-08: this plugin's Tickets dashboard was merged into the "Engage AI" WordPress plugin as a new "Agents" page (with module checkboxes on its Settings page), since the side-hustle agents are meant to serve the same organizations already using Engage AI, not a separate audience. Install/use the "Engage AI" plugin instead - this one is kept for reference only.

Dashboard for autonomous business agents (Agent Cloud API) - review proposed tickets, approve/reject/redirect, and trigger check-in cycles from WordPress.

== Description ==

Agent Hub connects your WordPress site to the Agent Cloud API - a supervised autonomous agent that runs scheduled check-in cycles for a business, proposes concrete work, and holds anything with real-world consequence for your explicit approval. This plugin is the dashboard: no curl, no raw API calls, just tickets to approve, reject, or redirect.

= Setup =

1. Deploy the Agent Cloud API (see the `agent-cloud-api` project) and note its base URL.
2. In WordPress, go to Agent Hub > Settings and enter the API URL.
3. Connect with an existing email/password, or create a new account right there.
4. Select or create the business/client the agent should run for (e.g. a YouTube channel), filling in its profile (topic, audience, tone, posting cadence).
5. Go to Agent Hub > Tickets. Run a check-in cycle on demand, or wait for the scheduler. Review what's proposed, and approve, reject, or redirect each ticket. If the agent asks a clarifying question, answer it via the "Update the agent's memory" form so the next cycle has that context.

== Changelog ==

= 0.1.0 =
* Initial release: settings/connection flow, client management, ticket review with approve/reject/redirect, manual cycle trigger, cycle history.
