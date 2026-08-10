# Gate build-W5-vom — Live test purchase + refund  (actor: VOM)

**Workstream:** `W5_payments`  ·  **Status:** not yet opened — depends on `build-W5-client` completing

Plan staged in `turnkey/build/payments.md` §3. This gate becomes actionable only once the
connected account shows `charges_enabled: true` and `payouts_enabled: true` (i.e., the owner has
completed the hosted ID+IBAN flow in `build-W5-client`).

**Action requested:** VOM runs one real, small live-mode purchase against the Assessment price (or
a $1 disposable test price, then deprecated) using VOM's own card, confirms destination-charge
routing lands the net amount in the connected account and the application fee (if any) lands on
the platform account, then immediately refunds it in full and confirms the reversal posts
correctly.

**Why this is a gate:** this is real money actually moving through the live rail for the first
time — governance rail requires a gate + a consent-log line any time money moves, even a
self-funded certification test.

**On YES + pass:** log charge ID, refund ID, amounts, and timestamps into `turnkey/build/payments.md`
and the consent log; the payment rail is now considered certified and safe to announce to real
customers. This also unblocks `build-W6` (enable live fulfillment), since there is no point
emailing real buyers on an uncertified rail.

**On hold:** until `build-W5-client` completes.
