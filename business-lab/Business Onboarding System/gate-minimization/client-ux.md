# Client UX — Vision Outreach Media

De klant: Dutch church leaders / small-org owners. Phone-comfortable, WhatsApp-comfortable, email-comfortable. **Not** comfortable with dashboards, passwords, accounts, or jargon. Every step below must finish on a phone in under 5 minutes, in the client's own words, with zero new things to learn.

## Pattern language (applies to all 8 steps)

1. **WhatsApp first, email is only a mirror.** Same message, same wording, sent to email in case WhatsApp is missed — never the primary channel.
2. **No client-facing logins or dashboards, ever.** Every link is a one-time **magic link**: it opens straight to one screen, does one thing, and expires. No username, no password, no "create an account."
3. **One-tap YES / NO.** Every approval is answerable by replying `JA` / `NEE` to the WhatsApp message itself, or tapping one big button on the magic-link screen. Never more than 3 taps total (open message → open link if any → tap answer).
4. **Voice-note fallback.** Every message ends with "Of stuur een spraakbericht" — de klant can just talk instead of typing or tapping. A voice note saying anything that sounds like approval or refusal is logged and, if ambiguous, triggers a same-day human call rather than a guess.
5. **Never leave an approval hanging.** No response ever defaults to "approved." Silence always escalates to a reminder, then to the operator calling — it never becomes a yes by default.

## Communication doctrine — two registers, no middle

*(Added 2026-07-20. Governs every client-facing message in this document and everywhere else in the system.)*

The relationship must be **personal but sterile**: warmth is real and human; process is clean and machine-like. The trust killer is the middle — automation that performs intimacy. People trust a bank notification precisely *because* it doesn't pretend to be a friend. So every client contact belongs to exactly one of two registers:

| | **Register 1 — Personal** | **Register 2 — Sterile** |
|---|---|---|
| Voice | The operator, as themself | The system, as a system |
| Channel | The operator's own phone / a live call | The contact gateway (WhatsApp API number) |
| Content | Setup call, monthly voice note, bad news, anything relational or exceptional | Approvals, digests, codes, statements, reminders |
| Who presses send | **Always a human** (agents may prepare talking points) | Automated, from templates ratified once |
| Cadence | Scarce and scheduled (~1–2 touches/month) | Predictable and fixed (same day, same format) |
| Review overhead | Human judgment per message | **Zero** once templates are ratified |

**Rules:**
1. **No third register.** An agent never sends a message *as* the operator. Agent-drafted personal messages (e.g. W11 replies) are legitimate only because a human reviews and sends them — the human owns it at the moment of sending.
2. **Register 2 may be friendly-plain, never fake-personal.** Simple kind language and the existing NL copy stay (accessibility demands warmth-adjacent simplicity) — but the sender identity is always visibly the organization's service number, the wording never claims a human is typing right now ("ik zit even naar je site te kijken…" is banned), and any client reply beyond JA/NEE routes to a human, never to a bot conversation.
3. **The gateway transmits register 2 only.** Register 1 never touches the gateway; it lives on the operator's own phone. This one rule removes most of the system's trust surface.
4. **The client can always tell which is which** — sibling promise to "nothing without your YES": *you always know when it's the machine and when it's us.* This is stated in the plain-language terms summary (Step 8).

## Shared building block: the magic-link approval screen

Used wherever a link is needed (profile, content, batches). One phone screen, no navigation:
- Big title in plain language ("Dit gaan we voor je maken" / "Dit plaatsen we deze week").
- The actual content shown directly on the page (not a PDF, not a download) — text and images render inline, large font (min. 20px), high contrast.
- Two big buttons: **JA, dit is goed** / **Nee, ik wil iets veranderen**.
- A "Lees dit hardop voor" (read aloud) control using the phone's built-in text-to-speech.
- Link expires after the decision is made or after 14 days, whichever is first.

## Consent log (per tenant, timestamped)

Every YES/NO/timeout is written to one append-only table, one row per approval event:

| field | example |
|---|---|
| `tenant_id` | church-of-hope-utrecht |
| `event_id` | approve-social-batch-2026w29 |
| `step_type` | profile / terms-privacy / content / social-batch / outreach / pricing / refund |
| `content_ref` | hash or version id of the exact thing shown |
| `channel` | whatsapp / email / voice-note / phone-call |
| `sent_at`, `responded_at` | ISO timestamps |
| `response` | YES / NO / CHANGES-REQUESTED / TIMEOUT-ESCALATED |
| `responder` | phone number the reply came from |
| `escalated` | true/false + who called |

This log is the record of what de klant actually authorized, when, and through what exact content — it is what Vision Outreach Media point to if a client later asks "did I approve this?"

## Reminder / escalation ladder (default, unless a step overrides it)

- **T+0**: message sent (WhatsApp + email mirror).
- **T+24h**, no reply: one gentle reminder, same channel, no new content added.
- **T+48h**, still no reply: final reminder + the operator calls de klant directly by phone. The call is warm, not a scolding — "Ik wilde even checken of je mijn bericht hebt gezien."
- **Nothing ships, sends, or changes without an explicit YES.** A stalled approval simply means that week's item waits — it is never silently skipped as if approved, and never silently published as if approved.

---

## The 8 steps (1 and 8 usually happen in one screen)

### 1. Approve the business profile

- **Why this step exists:** de klant needs to see, in their own words, what Vision Outreach Media understood about their church/org before anything is built on top of it. This is the foundation — everything downstream (website, posts, outreach) inherits it.
- **Channel:** WhatsApp, magic-link screen for the actual profile, email mirror.
- **Copy (NL):** "Hoi [naam]! We hebben opgeschreven wie jullie zijn en wat we voor [organisatie] gaan bouwen. Wil je het even checken? 👉 [magic link] Klopt het? Antwoord gewoon JA of NEE, of stuur een spraakbericht."
- **Copy (EN):** "Hi [name]! We've written down who you are and what we're about to build for [organization]. Want to take a quick look? 👉 [magic link] Does it look right? Just reply YES or NO, or send a voice note."
- **Tap-flow (max 3 taps):** open WhatsApp message → tap link → tap **JA, dit klopt** (or **NEE**, which opens a voice-note prompt: "Vertel ons wat je anders wil").
- **Fallback at 48h:** standard ladder above; profile work pauses for that client until resolved — nothing else starts building on an unapproved profile.
- **Accessibility:** large-font summary, read-aloud button, plain sentences (no "target audience," no "value proposition" — just "wie jullie zijn" and "wat we bouwen").
- **Bundled step:** this same screen also carries the terms & privacy sign-off (Step 8, below) as a second section — one visit, one YES, two consent-log entries.

### 2. Stripe-hosted payment onboarding (ID photo + IBAN)

- **Why this step exists:** to pay de klant out (or receive their payment, depending on flow), a bank-grade identity check is legally required. We don't build this — Stripe does — but we own how it's introduced.
- **Channel:** WhatsApp with the Stripe-hosted link; email mirror.
- **Copy (NL):** "Om betalingen veilig te kunnen regelen, vraagt onze betaalpartner Stripe (een groot, betrouwbaar bedrijf dat ook door duizenden andere kerken en kleine organisaties gebruikt wordt) om een foto van je ID en je bankrekeningnummer (IBAN). Dit duurt zo'n 5 minuten. 👉 [Stripe-link] Lukt het niet, of heb je vragen? Bel of app ons gewoon, dan doen we het samen."
- **Copy (EN):** "To handle payments safely, our payment partner Stripe (a large, trusted company used by thousands of other churches and small organizations) needs a photo of your ID and your bank account number (IBAN). It takes about 5 minutes. 👉 [Stripe link] If it doesn't work, or you have questions, just call or message us — we'll do it together."
- **Tap-flow (max 3 taps):** open message → tap Stripe link → follow Stripe's own two on-screen prompts (photo, IBAN). We cannot reduce Stripe's own flow below their standard, so we frame it clearly and offer a live call instead of a self-serve fallback.
- **Fallback at 48h:** reminder at 24h; at 48h the operator calls proactively and offers to stay on the phone while de klant completes it — this step blocks getting paid, so escalation is a phone call, not another message.
- **Accessibility:** we cannot change Stripe's own screen, but we prepare de klant in advance ("dit lijkt op je bank-app, heel normaal") and always offer doing it together on a call as the accessible path.

### 3. Approve content before it ships (website copy, manuals)

- **Why this step exists:** anything published carries de klant's name and voice — they must see and bless the words before the world does.
- **Channel:** WhatsApp, magic-link screen showing the text/pages directly, email mirror.
- **Copy (NL):** "We hebben de tekst voor [website/handleiding] klaar. Wil je hem even lezen? 👉 [magic link] Staat er iets in dat je anders wil? Antwoord JA om te publiceren, NEE als je iets wil aanpassen — of spreek het gewoon in."
- **Copy (EN):** "We've finished the text for [your website/manual]. Want to give it a read? 👉 [magic link] Anything you'd want changed? Reply YES to publish, NO if something should change — or just say it in a voice note."
- **Tap-flow (max 3 taps):** open message → tap link (full text renders inline, read-aloud available) → tap **JA, publiceer** or **NEE, ik wil iets aanpassen**.
- **Fallback at 48h:** standard ladder; the content simply doesn't go live until answered — never published on a timeout.
- **Accessibility:** large font, read-aloud, and voice-note replies are treated as full alternatives to reading — de klant never has to type or read if they don't want to.

### 4. Approve each social-media post batch (weekly, recurring)

- **Why this step exists:** nothing posts under de klant's name without them seeing it first — but a ping every time one post is ready would wear anyone out, so this is folded into the weekly digest (see below).
- **Channel:** WhatsApp, one weekly magic-link screen showing all posts for the week, email mirror.
- **Copy (NL):** "Hier zijn de berichten voor social media van deze week 📱 👉 [magic link] Alles goed zo? Antwoord JA om alles te plaatsen, of NEE als er eentje anders moet."
- **Copy (EN):** "Here are this week's social media posts 📱 👉 [magic link] All good? Reply YES to post everything, or NO if one of them needs a change."
- **Tap-flow (max 3 taps):** open message → tap link (all posts shown as a simple scrollable preview, like scrolling Instagram) → tap **JA, plaats alles** or tap **NEE** next to the one post that needs work (a voice note explains what to change).
- **Fallback at 48h:** reminder at 24h, call at 48h; that week's batch simply doesn't post — we never publish on silence, and we tell de klant plainly that nothing went out.
- **Accessibility:** posts shown as images/text exactly as they'll appear (no jargon like "caption" or "carousel" — just "het bericht" and "de foto").

### 5. Approve outreach messages sent in their name (recurring)

- **Why this step exists:** anything sent to a real person (email, DM, follow-up) in de klant's name needs their blessing first — trust is the entire product here.
- **Channel:** folded into the same weekly digest as step 4 (see below); WhatsApp, email mirror.
- **Copy (NL):** "En hier zijn de berichten die we deze week namens jullie willen versturen naar mensen die interesse toonden 💬 👉 [magic link] Goed om te versturen? JA of NEE."
- **Copy (EN):** "And here are the messages we'd like to send this week, on your behalf, to people who showed interest 💬 👉 [magic link] Okay to send? YES or NO."
- **Tap-flow (max 3 taps):** open the same weekly digest link used for posts → scroll to the outreach section → tap **JA, verstuur** or **NEE** per message.
- **Fallback at 48h:** standard ladder; unapproved messages simply aren't sent that week — never sent on a timeout.
- **Accessibility:** each message shown with "aan wie" (to whom) and "waarom" (why, one line) in plain terms — no CRM terms like "lead" or "sequence."

### 6. Google Business verification (postcard or phone call)

- **Why this step exists:** Google requires proof that de klant really runs this organization at this address. This is the one step Google controls end-to-end — we cannot remove or shorten it, only make it less confusing.
- **Channel:** WhatsApp, with clear timing expectations (postcard takes 5–14 days by post — outside our control), plus a magic-link screen for entering the code once it arrives.
- **Copy (NL) — when waiting starts:** "Google stuurt jullie een kaartje op de post met een code erop (dat kan 1-2 weken duren, heel normaal). Zodra hij er is, app je ons de code gewoon terug, of vul hem hier in: 👉 [magic link]."
- **Copy (EN) — when waiting starts:** "Google will mail you a postcard with a code on it (can take 1-2 weeks, totally normal). Once it arrives, just message us the code, or enter it here: 👉 [magic link]."
- **Copy (NL) — code arrived, nudge):** "Is het kaartje van Google al aangekomen? Stuur ons de code — 6 cijfers — gewoon terug, of typ 'm hier: 👉 [magic link]."
- **Copy (EN) — nudge:** "Has the Google postcard arrived yet? Just send us the code — 6 digits — or type it here: 👉 [magic link]."
- **Tap-flow (max 3 taps):** open link → tap the code field (numeric keypad only, 6 boxes) → tap **Bevestigen**. Or skip the link entirely and just reply to WhatsApp with the digits.
- **Fallback:** because the postcard transit time is outside our control, the 48h ladder only starts counting **after** the expected arrival window (14 days) — we don't nag de klant about a card that's still in the mail. If the card is lost or a phone call is required instead, the operator handles the call with de klant, live, by phone.
- **Accessibility:** numeric-only input (easiest possible typing), voice-note option to just say the digits, phone-call escalation is the built-in accessible path since Google itself sometimes requires a live call.

### 7. Occasional yes/no decisions (pricing change, refund approval)

- **Why this step exists:** some decisions are money-related and one-off — de klant must explicitly say yes, no scheduling, no batching.
- **Channel:** WhatsApp, plain text, no link needed unless the decision needs supporting detail (then a magic-link screen with the one relevant number).
- **Copy (NL) — pricing:** "Even een korte vraag: mogen we de prijs van [dienst] aanpassen naar €[bedrag] vanaf [datum]? Antwoord JA of NEE — geen haast."
- **Copy (EN) — pricing:** "Quick question: can we change the price of [service] to €[amount] starting [date]? Reply YES or NO — no rush."
- **Copy (NL) — refund:** "[Naam klant/persoon] vraagt om €[bedrag] terug voor [reden]. Mogen we dat terugstorten? JA of NEE."
- **Copy (EN) — refund:** "[Name] is asking for a €[amount] refund for [reason]. Okay to send it back? YES or NO."
- **Tap-flow (max 3 taps, usually 1):** read WhatsApp message → reply `JA`/`NEE` directly in the chat — no link needed for a plain yes/no.
- **Fallback at 48h:** standard ladder; the change or refund simply waits — never assumed either way.
- **Accessibility:** plain reply-in-chat is the whole interaction, no app to open at all — the lowest-friction option in the entire system, used deliberately here because these decisions are rare and often time-pressured.

### 8. Approve the terms & privacy sign-off (bundled with Step 1)

- **Why this step exists:** Dutch law and basic fairness mean de klant must know what they're agreeing to and how their data is used — but that shouldn't cost them a second contact moment, so it rides along on the Step 1 screen instead of arriving separately.
- **Channel:** the same magic-link screen as Step 1, one section further down: "Wat dit betekent voor u" — a plain-language summary of the terms & privacy policy, max 10 bullet lines, with "Lees het hele document" (read the full document) one tap deeper for anyone who wants it. Email mirror included.
- **Copy (NL):** "Hoi [naam]! Op datzelfde scherm hebben we ook de afspraken en de privacyregels in gewone taal voor je gezet, onder 'Wat dit betekent voor u.' Ga je akkoord? Antwoord JA — dat geldt dan voor je profiel én de voorwaarden — of NEE als je eerst iets wil bespreken."
- **Copy (EN):** "Hi [name]! On that same screen we've also put the agreement and privacy rules into plain language, under 'What this means for you.' Do you agree? Reply YES — that covers both your profile and the terms — or NO if you'd like to talk something through first."
- **Tap-flow (max 3 taps):** open the Step 1 magic link (1 tap, no separate link) → scroll to "Wat dit betekent voor u" (same screen, no tap) → tap **JA, ik ga akkoord** (covers profile + terms together); optionally tap "Lees het hele document" first, then back and tap JA/NEE.
- **Fallback at 48h:** rides the same clock as Step 1 — one unanswered screen blocks both the profile and the terms sign-off together, so there's only ever one reminder ladder to track, not two.
- **Accessibility:** same large-font, read-aloud screen as the profile; the 10-bullet summary uses no legal vocabulary ("aansprakelijkheid," "grondslag") — those words exist only in the optional full document one tap deeper, never in what de klant is asked to read to decide.
- **Consent logging:** one YES writes **two** consent-log rows (`step_type: profile` and `step_type: terms-privacy`), same `event_id` group and timestamp, so each is independently auditable even though de klant only acted once.

---

## The weekly digest (steps 4 + 5 combined)

Instead of a separate ping per post and per outreach message, de klant gets **one WhatsApp moment per week** (same day/time every week, e.g. Monday 9:00) that bundles everything needing a look:

- One message: "Hier is je wekelijkse overzicht 🗓️ — X berichten voor social media, Y berichten om te versturen. 👉 [one magic link]"
- One screen: posts first, outreach messages second, each individually approvable, plus one **JA voor alles** (approve everything at once) button at the top for the common case where everything looks fine.
- Same reminder ladder as everything else; the digest simply carries more items in one wrapper.

**Why:** the client need here is "don't make me feel like my phone is a work queue." One predictable weekly moment, phrased like a friendly update rather than a task list, keeps the relationship warm instead of transactional — while still requiring an explicit yes for every single thing that goes out in their name.

## Approval semantics — what a YES actually means

- A YES authorizes **exactly the content shown at that moment** (that profile version, that exact post, that exact price) — not a general "trust you with anything." Any later change to the same item requires a fresh approval.
- A NO or a voice note requesting changes pauses that item only; nothing else in the batch is affected.
- A timeout is never a yes. It always becomes a reminder, then a phone call — it never silently becomes approval or silently becomes rejection.
- The consent log entry (channel, exact content reference, timestamp, response) is the legal and practical record that de klant said yes to that specific thing — this is what protects both de klant and Vision Outreach Media if a question comes up later.

## Anti-patterns — explicitly forbidden

- **PDF attachments.** De klant should never have to download and open a file to see what they're approving. Content renders directly in the WhatsApp message or the magic-link screen.
- **"Log in to view."** No accounts, no passwords, no client-facing dashboard — ever, for any of the 8 steps.
- **Links to dashboards.** Every link is single-purpose and single-use (one profile, one batch, one code entry) — never a general "portal" to browse around in.
- **Jargon**, and its plain replacement:

| Never say to de klant | Say instead |
|---|---|
| DNS | (never mentioned — "we regelen de technische kant") |
| API / webhook | (never mentioned) |
| Onboarding | "de eerste stappen" / "we starten samen op" |
| KYC | "we controleren wie je bent, net als bij een bank" |
| Dashboard | "dit ene scherm" |
| Verification | "bevestigen" / "controleren" |
| Subscription | "je maandelijkse bijdrage" |
| Deploy / go live | "het staat online" |
