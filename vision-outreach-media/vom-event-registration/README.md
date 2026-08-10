# Vision Outreach Event Registration

Bilingual (English / Nederlands) registration & sign-up forms for churches and ministries. One engine, several ready-made **form types** — the picnic potluck is just one of them. Responses are stored in your WordPress database and exportable to CSV.

## Install

1. **Plugins → Add New → Upload Plugin** → choose `vom-event-registration.zip` → **Install Now** → **Activate**.
   - On activation it creates one database table and auto-publishes a **Picknick** page (at `/picknick`) with the picnic form. The live link shows in a green banner and in the **Event Registration** admin menu.
   - Upgrading from the older "Picnic Sign-Up" plugin? Your existing sign-ups are kept — they're automatically tagged as the "picnic" event.

## Using it — one shortcode, pick the form

Put this on any page and choose the `event`:

```
[event_registration event="picnic"]      → Picnic / potluck sign-up (dishes & supplies)
[event_registration event="rsvp"]        → Simple event RSVP (name + headcount)
[event_registration event="volunteer"]   → Volunteer / serving sign-up (pick roles)
[event_registration event="workshop"]    → Workshop / course registration (pick sessions)
```

`[picnic_signup]` still works too (it maps to the picnic form), so any page you already made keeps working.

Each event stores its responses separately, so you can run several forms on different pages at the same time.

## The four built-in form types

| Event | What it's for | Headcount? | Pick options? |
|-------|----------------|-----------|----------------|
| **picnic** | Potluck — who's coming & what they'll bring, grouped by food category + supplies | Yes | Yes (+ add your own) |
| **rsvp** | Yes-I'm-coming for a dinner, service, gathering | Yes | No |
| **volunteer** | Serving sign-up — people choose roles (setup, kitchen, welcome, tech…) | No | Yes (fixed roles) |
| **workshop** | Course/seminar — people register and choose sessions/tracks | Yes | Yes (fixed sessions) |

All four are bilingual and auto-detect the visitor's language, with an EN/NL toggle.

## Where the data lives

Admin menu **Event Registration** → switch between the form types with the tabs at the top. Each shows its totals, a table of responses, and an **Export CSV** button.

## Customising

- **Wording, categories, options, and adding your own form types** live in `vom-event-registration.php` in the `vom_evreg_presets()` function — copy a preset block, change the fields, give it a new key, and use it with `[event_registration event="yourkey"]`.
- Titles, blurbs and labels are set per preset under `overrides` (English + Dutch).

Runs on a standard WordPress site with no other plugins required.
