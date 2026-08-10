# Invoice Accepted — evidence

Source: [Single-Action AI Businesses research](../Single-Action%20AI%20Businesses/research.md) (2026-08-06),
action #2 *"Produce the regulatory artifact"* — **21/25**, the only action on the board scoring
FORCED 5, because the buyer's alternative is a fine.

Live waitlist: **https://invoice-accepted-prelaunch.vercel.app** · back office `/platform/`

## The single action

An invoice goes out to a customer in a country with an active e-invoicing mandate → it arrives in the
structured format that country's law requires, and is accepted.

## Why the buyer has no choice

| Country | What is already true |
|---|---|
| **Belgium** | All B2B via Peppol since **1 Jan 2026**, penalties enforced |
| **Poland** | Phased mandate from **1 Feb 2026** |
| **France** | Receiving capability for all, issuing for large/mid from **1 Sept 2026** |
| **Germany** | >€800K turnover from **1 Jan 2027**, all businesses by **1 Jan 2028** |

([Peppol mandates by country](https://peppolvalidator.com/peppol-mandates) ·
[fiskaly](https://www.fiskaly.com/blog/e-invoicing-mandates-in-europe-2026))

## The positioning decision, and why it is the whole business

The Netherlands has **no domestic B2B mandate**. Peppol B2B stays voluntary here, with rollout only
*proposed* for **2030–2032** and a cabinet position due summer 2026
([Peppol NL](https://peppolvalidator.com/peppol-netherlands)).

So this is deliberately **not** sold to Dutch firms invoicing domestically — they know they are not
forced, and they are right. It is sold to **Dutch firms invoicing into BE / FR / PL / DE**, who are
forced *today* by their customers' governments. One sentence, no persuasion:

> *"Your Belgian customer legally cannot accept your PDF any more."*

Every competitor selling "Dutch e-invoicing readiness" is selling a 2030 deadline. This sells a
deadline that already passed.

## Willingness to pay

Compliance tooling already clears **€4,800–€42,000/yr**, median **~€14,500/yr** for 50–500 employee
firms, for GDPR + NIS2 alone ([Legiscope](https://www.legiscope.com/blog/eu-compliance-stack-2026.html)).
**54% of Dutch small businesses already spend €500–€2,000/month on AI tools**, and the stated barrier
is **lack of experience (74.6%)**, not cost ([Mape](https://mapemedia.com/blog/dutch-smbs-using-ai) ·
[Dominik Gabor](https://dominikgabor.com/blog/dutch-sme-ai-adoption-statistics-2026.html)).

Priced at **€950 connection + €95/month monitoring** — a setup fee is honest here because the work is
front-loaded, and the monitoring is what stops it becoming a one-off project.

## Cheapest test

Pull 40 Dutch firms from KVK export registers with Belgian B2B customers. Ask one question by phone:
*"Has a Belgian customer bounced one of your invoices since January?"* Twenty-five yeses on the
waitlist and it is real. That is the threshold set in `prelaunch/signal.json`.

## Known risk

Delivery depends on a Peppol **access point** partner — VOM does not become one. Pick the access
point before the first paying customer, or the €95/month has no floor under it. Second risk: accounting
software that cannot emit structured output at all, which turns a €950 connection into a migration
project. Qualify for the software on the call, not after.
