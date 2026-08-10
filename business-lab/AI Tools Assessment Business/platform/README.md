# AI Tools Assessment Business — business platform

The working platform for this business. Generated from its blueprint, so it carries the
modules a **Service business / consultancy / agency** actually needs and nothing it does not.

Open `index.html` in a browser. It runs as-is — no install, no build, no server.

## Modules

| Module | What it does |
|---|---|
| **Contacts** | Everyone this business deals with, and where each one stands. |
| **Content** | Posts and announcements, drafted here before they go out. |
| **Bookings** | Appointments, who they are with, and whether they are confirmed. |
| **Orders** | What has been sold and whether the money arrived. |
| **Inbox** | Questions coming in, and what was sent back. |
| **Mailing list** | The list, and what has been sent to it. |
| **Invoices** | What has been billed, what has been paid, and the VAT on it. |
| **Quotes** | Proposals out, and which ones came back signed. |
| **Enquiries** | People who put their hand up, before they become contacts. |

Every module lists, creates, edits and deletes real records, and everything persists in the
browser. The dashboard is computed from those records, not seeded. **Backup** writes a JSON
file of everything; **Restore** reads one back, which is also how you move the data to
another machine.

## Where it came from

- Org type: **Service business / consultancy / agency** (`service_business`)
- Site decision: **Custom app (Vercel)**
- Prepared by Vision Outreach Media · 2026-08-01T09:44:36Z

Regenerate after a blueprint change:

```bash
python3 <engine>/turnkey.py platform "<this idea folder>"
```

Regenerating rewrites `index.html` and `business.json`. Your records live in the browser,
so they survive it — take a Backup first if you are moving machines.
