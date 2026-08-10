# Intent-based browsing — the thesis

Vision Outreach Media · prototype notes for `wizard.html`

This document sits behind the prototype. It names what is broken in the browser, defines each of
the six primitives in the brief as a response to a specific break, and draws a hard line between
what the prototype demonstrates and what it only stages. It makes no claim about any product or
company, and it contains no statistics, because nothing here needs one.

---

## 1. What the tab-and-URL model actually breaks

The address bar is a good tool for one task: reaching a known document at a known address. The
sessions this prototype is aimed at are not that. They are a goal being worked out. The browser has
no representation of a goal, so five specific things break.

**A comparison task explodes into tabs, and nothing holds the comparison itself.** Comparing three
CRMs on price per seat, contract length and export policy means three pricing pages, three docs
pages, two review sites and a forum thread. Nine surfaces, each answering a different subset of the
question. The browser holds nine addresses. It does not hold the three-by-three grid that is the
actual work product. That grid exists only wherever the operator keeps it, and nothing in the
browser preserves it when the window closes.

**The query is discarded the moment it returns results.** "Flight to Lisbon in March under €200"
is a structured statement. It has a destination, a window, a ceiling and an implied success
condition. The moment it produces a results page, the browser throws the structure away and keeps
only the page. Change the ceiling to €250 and there is no operation for that. There is only
retyping the whole sentence and starting again, losing every judgement made in between.

**History is a list of addresses, not a list of purposes.** Two weeks later the operator remembers
"I was working out whether to replace the roof this year." History offers a booking site, a forum
thread, three PDF viewer URLs and a search results page. The addresses are the residue of the
purpose, not the purpose. Nothing in the record says what was being decided, what was ruled out, or
what was still open.

**The browser cannot hold a goal across sessions.** The tasks this model is aimed at run past one
sitting. Prices change, a quote arrives, a spec is revised. The browser has no notion of "this is
still open, tell me when it moves." That leaves two workarounds: re-run the same searches on a
schedule the operator enforces personally, or leave tabs open for weeks as a memory device. Read
that way, tab clutter is a broken persistence layer.

**Intent gets re-typed into every site's own search box.** The constraints are stated once in the
address bar, then again in the airline's form, again in the aggregator's filters, again in the
supplier's catalogue. Each site has a different filter vocabulary and a different set of things it
refuses to filter on. That translation is done by hand at each step, and no single site is ever
given the whole constraint set.

None of these is a rendering problem or a speed problem. They are all the same missing thing: the
browser has no object that represents what the user is trying to achieve.

---

## 2. The six primitives

### 2.1 The intent bar replaces the address bar

**What it is.** One input at the top of the surface. You type an outcome, not a destination.

**Why it follows.** If the browser is going to hold a goal, the goal has to enter somewhere. The
address bar's input type is a location, and a location cannot express "under €200" or "quotable
this month." The entry point changes first, or every later primitive has nowhere to come from.

**What changes for the user.** The first thing typed is the thing actually wanted, stated once,
rather than translated into a site choice before it is ever stated.

### 2.2 Intent is an object, not a string

**What it is.** The sentence resolves into a typed, visible structure: goal, constraints, entities,
success condition. Every field is on screen, and every constraint is editable. Change a constraint
and the surface re-resolves; the goal, the entities and the success condition are shown as read-out
rather than as controls, and the success condition is what re-reports when a constraint moves.

**Why it follows.** This answers the discarded query directly. A string can only be replaced. An
object can be amended. It also answers the re-typing problem, because the constraint set now exists
in one place that can be pushed outward rather than re-entered inward.

**What changes for the user.** Raising the budget is a control, not a retype. The user can see what
the system believes it was asked and correct the constraints it inferred, which is the difference
between a system that guesses and one that can be argued with. This is the load-bearing primitive.
If the object is not visible and its constraints are not editable, everything else is a results
page with better typography.

### 2.3 The result is a workspace, not a tab

**What it is.** One composed surface made of panes drawn from several sources. Each pane is
attributed, swappable and dismissable.

**Why it follows.** This is the direct answer to tab explosion. The nine-tab comparison was one
document all along, assembled by hand. The workspace is that document, assembled by the surface,
with the assembly visible rather than implied.

**What changes for the user.** The comparison grid becomes the artifact instead of the by-product.
Swapping a pane is the operator saying "not that source, this one," an act of editorial control
that tabs never offered.

### 2.4 Every claim carries provenance

**What it is.** Nothing renders without a traceable source chip. Rows carry their own source, not
just panes. Unattributed synthesis does not render at all.

**Why it follows.** The moment a surface composes several sources into one view it takes on the
authority of an editor. Composition without attribution is laundering. The rule has to be
structural rather than a policy, which is why a claim without a resolvable source is treated as a
defect here, not a formatting lapse.

**What changes for the user.** A price on the screen can be traced to who said it, which makes
disagreeing with the surface possible: there is something specific to disagree with.

### 2.5 Intents can stand

**What it is.** An intent left running re-resolves and reports what changed. History becomes a list
of intents rather than a list of URLs.

**Why it follows.** One mechanism answers both the cross-session failure and the history failure.
If the goal is an object with an identity it can persist, and persistence gives the record a spine:
not where you went, but what you were trying to settle and whether it moved.

**What changes for the user.** Tabs no longer have to serve as the memory device. The record reads
as a list of purposes, some closed, some open, some reporting change.

### 2.6 Acting is gated

**What it is.** The surface prepares the next action and stages it. It never sends, buys or changes
an account. The staged action is shown with its consequence, and it waits.

**Why it follows.** Everything above increases the surface's ability to act on the user's behalf,
and that capability is exactly the part that must not be automatic. A system that composes an
outbound message is useful. A system that sends it can be steered by whatever it read on the way
there.

**What changes for the user.** The last mile stays with the person. In the roofer intent the
request-for-quote is fully drafted and addressed and still not sent, and the gate is shown rather
than assumed.

---

## 3. Real, scripted, and not yet built

The prototype demonstrates an interaction model. Being precise about the line is part of the
deliverable.

| Layer | Status | Notes |
|---|---|---|
| The interaction model (bar, object, workspace, standing list, gate) | **Real** | Fully implemented behaviour. This is the thing under test. |
| The intent object and its typed fields | **Real** | A real data structure that other parts of the surface read and re-render from. |
| The edit-and-re-resolve loop | **Real** | Editing a constraint genuinely changes what renders. It is deterministic, not live. |
| The action gate | **Real** | The staging step, the consequence line and the refusal to execute are actually implemented. |
| All data: fares, prices, quotes, vendor rows | **Scripted** | Fixture data. Not sampled, not current, not drawn from any live service. |
| All sources and source chips | **Scripted** | The provenance mechanism is real. The sources it points at are fixtures. |
| All change events on standing intents | **Scripted** | Nothing polls anything. Change is triggered on demand for demonstration. |
| Understanding of an arbitrary sentence | **Scripted** | No model runs. A deterministic keyword score against three fixtures: words are weighted strong or weak, and a sentence needs a score of three plus one clear winner. A strong word is worth three and a weak word one, and a repeated word counts once, so the threshold is one strong word or three different weak ones. A sentence that clears it is matched to the *nearest* scripted intent and the seeded sentence is substituted for what was typed, and the bar says so when it does. Anything under three resolves to nothing rather than to a guess, including a sentence that overlaps a little and has an obvious leader; so does a tie at the top between two fixtures. Matching is exact string comparison against a hand-written word list, with no stemming, so a near miss on a form of the word ("subscriptions" where the list holds "subscription") scores zero. |
| A resolver that turns any sentence into a typed object | **Needed** | The hard part of the real product. |
| Source adapters per domain | **Needed** | Real panes need real connectors, with per-source terms, rate limits and freshness handling. |
| A standing-intent scheduler | **Needed** | Background re-resolution, change detection, and a notification budget that does not become spam. |
| A permissions and consent layer behind the gate | **Needed** | Credentials, scopes, per-action authorisation, and an audit trail of what was staged and what was approved. |

The page says on screen that it is a scripted demonstration, and says it again when it substitutes
a seeded sentence for what was typed. That is not a disclaimer bolted on. A demo of this concept
that implies live retrieval tests the wrong thing: the claim is about the interaction model, and
the interaction model is the part that is real.

---

## 4. The honest objections

**"This is a search engine with extra steps."** A search engine takes a string and returns links.
The difference is not the front end, it is that the query survives. A search engine keeps no
representation of the query after it answers, so it cannot be amended in place, cannot persist,
cannot report change and cannot stage an action. If the object were not editable and the intent
could not stand, this objection would be correct and the prototype would be a skin. That is why
primitive 2 is the load-bearing one.

**"Who pays when the browser bypasses the sites?"** The strongest objection, and it has no clean
answer. A surface that composes panes from several sources and answers the question in place
removes the page view that funds those sources. Attribution is not compensation. A serious version
needs a settlement model between the resolver and the sources it draws from, and the answer cannot
be that sources should be grateful for the chip. This is an unresolved commercial dependency, not a
detail to be tidied later.

**"The resolver becomes the new gatekeeper."** Also true. Deciding which panes render and which
sources fill them is editorial power, and moving it from a search ranking to a resolver does not
dissolve it. The mitigations here are partial and deliberate: panes are swappable so the user can
override the choice, and every row is attributed so the choice is inspectable. Partial is not
solved. A real product needs the resolver's selection policy to be legible and the alternates to be
genuine rather than decorative.

**"Users cannot articulate intent."** A fair challenge, and it is why the object is shown rather
than hidden. The design does not assume a full constraint set arrives on the first try. The bet is
that people recognise a wrong constraint more readily than they compose a right sentence: state
something rough, see it typed, fix the field that is wrong. If the model required a perfect
sentence up front, it would fail, and that bet is the thing a real trial would have to test.

**"The provenance chips are cosmetic if nobody clicks them."** Fair as a measure of individual
behaviour, and it misses what the chip is for. Requiring a resolvable source for every row
constrains what the system is allowed to render, and it binds whether or not anyone clicks. The
surface cannot output a confident sentence with nothing behind it, because there is nowhere for
such a sentence to live. The clickable chip is the visible edge of that rule. The rule is the
point.

---

## 5. What the prototype is for

It demonstrates that a browser can hold a goal. Six primitives, one surface, scripted data, honest
about the line. If the edit-and-re-resolve loop feels obviously right in use, and the standing list
reads as a record of purposes rather than addresses, the concept is worth the infrastructure listed
above. If it does not, no amount of real data would have saved it.
