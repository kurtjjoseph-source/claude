# User Stories — Church Media Academy Launch Site

## Landing Page

### Story 1: Understand the offer in 10 seconds
**As a** church media volunteer  
**I want** to quickly grasp what the Church Media Academy is and whether it's for me  
**So that** I can decide whether to join

**Acceptance Criteria:**
- [ ] The landing page headline, tagline, and key benefit are visible above the fold on both desktop (1280px) and mobile (375px) without scrolling
- [ ] Within 10 seconds of page load, a visitor can identify: (1) what it is, (2) who it's for, (3) what they'll get in 90 days
- [ ] Pricing is visible and accurate: €39/mo, €390/yr, or founding €29/mo
- [ ] The founding member cap is displayed: "Founding spots: X of 10 taken" (X updates on each signup)
- [ ] Copy voice is direct and specific to church media life (e.g., references Sunday pressure, livestream fails, volunteer challenges)

### Story 2: See real member benefits and community proof
**As a** church media coordinator  
**I want** to preview the manuals, community, and reporting I'll get  
**So that** I trust the offering is real and valuable before joining

**Acceptance Criteria:**
- [ ] All 5 content manual titles are listed and visible: Sunday Livestream Playbook, YouTube Growth for Churches, Reading Your Engagement Benchmark, Volunteer Media Team Handbook, Social Posts from One Sunday Sermon
- [ ] At least one manual shows a real ~150-word opening section (not lorem ipsum) that describes the topic and value
- [ ] A sample community post from a named church media person is visible (e.g., "Sarah from Grace Baptist: 'Does anyone have a trick for live captions on YouTube?'")
- [ ] A sample Engage AI report card is visible showing real metrics and multiple channels (website, Google Business, Facebook, Instagram, YouTube, LinkedIn, X)
- [ ] Office hours are mentioned with a frequency (e.g., "Monthly live Q&A with Kurt")

### Story 3: Know how to join
**As a** interested volunteer  
**I want** a clear, visible call-to-action to begin the signup process  
**So that** I can proceed without confusion

**Acceptance Criteria:**
- [ ] A prominent "Join Now" or "Start Free Trial" button is visible on desktop without scrolling below the fold
- [ ] The button is also visible and tap-able on mobile (375px viewport)
- [ ] Clicking the button navigates to the join flow (Step 1: Name/Church/Email)
- [ ] The button has sufficient color contrast (WCAG AA minimum) and visible focus state for keyboard navigation
- [ ] Button text is action-oriented and urgent (e.g., "Join Now" not "Click Here")

---

## Join Flow

### Story 4: Enter basic information quickly
**As a** prospective member  
**I want** a simple, single-page form to provide my name, church, and email  
**So that** I can join in under a minute

**Acceptance Criteria:**
- [ ] Join flow Step 1 displays exactly 3 required fields: Name, Church Name, Email (labeled clearly); submission is blocked if any are empty, with an inline error message
- [ ] Mobile layout keeps fields legible: single column at 375px, two columns max at larger viewports
- [ ] Form completes from page load to Step 2 in under 30 seconds of user interaction
- [ ] Enter key submits the form when focus is on any field
- [ ] Entered data persists if the user navigates back to Step 1 before confirming

### Story 5: Choose a membership plan with transparent demo labeling
**As a** prospective member  
**I want** to select between monthly, annual, and founding pricing  
**So that** I can pick the option that fits my budget

**Acceptance Criteria:**
- [ ] Join flow Step 2 displays two price-option cards: (1) Monthly/Annual (€39/mo or €390/yr), (2) Founding (€29/mo locked for life)
- [ ] The founding option shows: "€29/mo • Locked for life" and "Founding spots: X of 10 taken" with X updating in real-time
- [ ] Only one plan can be selected at a time (radio button or card toggle behavior), and a "Continue" or "Proceed to confirm" button becomes enabled only after a plan is selected
- [ ] Selecting a plan takes under 15 seconds of interaction
- [ ] The selected plan persists when navigating back to this step

### Story 6: Confirm signup with explicit demo-mode labeling (no real payment)
**As a** prospective member  
**I want** to be absolutely clear that I'm in a demo and no real payment is being charged  
**So that** I have confidence this is a safe test drive

**Acceptance Criteria:**
- [ ] Join flow Step 3 displays the chosen plan summary (name, price, church name) prominently
- [ ] The text "Simulate payment — demo mode" appears above the final confirmation button (in a badge or warning-style container)
- [ ] The confirmation button is labeled "Simulate payment" or "Complete signup (demo)"
- [ ] No credit card number, CVV, expiry, or other payment fields appear anywhere in the entire join flow, and no external payment service is called — the "payment" is purely local (testable via Network tab showing zero payment-processor requests)
- [ ] Clicking the confirmation button logs the user in (localStorage key `cma-member-v1` is set) and immediately navigates to the member area

---

## Member Area

### Story 7: See a personalized welcome with founding member status
**As a** new member  
**I want** to see my name, church, and founding member number on entry  
**So that** I feel recognized and special as an early adopter

**Acceptance Criteria:**
- [ ] The member area displays "Welcome, [Name]" at the top, using the name entered during signup
- [ ] Directly below the welcome is the church name (e.g., "Grace Baptist")
- [ ] A "Founding member #X" badge is visible (X = signup order, e.g., "Founding member #4"); the number increments with each new signup
- [ ] This welcome message persists on page reload (testable by refreshing and confirming data remains)
- [ ] The welcome section is visible within 2 seconds of page load (no lazy loading or spinners blocking it)

### Story 8: Access all five learning manuals with readable content
**As a** member  
**I want** to browse and read the 5 content manuals  
**So that** I can immediately start learning how to improve my church's media

**Acceptance Criteria:**
- [ ] All 5 manuals are listed and titled accurately: Sunday Livestream Playbook, YouTube Growth for Churches, Reading Your Engagement Benchmark, Volunteer Media Team Handbook, Social Posts from One Sunday Sermon
- [ ] Each manual displays a real ~150-word opening section (not lorem ipsum) that describes the topic, intended audience, and key takeaway
- [ ] Manual titles are clickable to expand/collapse or toggle full content view
- [ ] At least one manual shows a "Mark as read" interaction (checkbox or button) that toggles a visual state (e.g., grayed-out title or checkmark)
- [ ] The manual state persists on page reload (e.g., expanded/collapsed and read status)

### Story 9: See sample community posts to feel part of a peer network
**As a** member  
**I want** to see real-world questions and wins from other church media people  
**So that** I understand the community value and feel less alone in my role

**Acceptance Criteria:**
- [ ] A community feed displays at least 6-8 sample posts, each with author name (e.g., "Sarah"), church name (e.g., "Grace Baptist"), and post text
- [ ] Each post is clearly labeled as "Sample data" or "Example post" (to avoid confusion with real posts in future)
- [ ] Posts are varied in tone and content: at least one question (e.g., "Anyone have tips for live captions?"), one win (e.g., "We hit 500 new YouTube subscribers!"), one resource share
- [ ] The feed is scrollable on mobile (375px) and all posts are readable without text overflow
- [ ] Posts are ordered chronologically (newest first) or grouped by category (optional)

### Story 10: See a sample Engage AI monthly report to understand benchmarking value
**As a** member  
**I want** to view a sample monthly engagement report for my church  
**So that** I see concrete evidence of the engagement-tracking perk's value

**Acceptance Criteria:**
- [ ] A card titled "Your monthly Engage AI report" or "Engagement benchmark" is visible in the member area
- [ ] The card displays a sample report with real numbers for multiple channels: website, Google Business, Facebook, Instagram, YouTube, LinkedIn, X
- [ ] Each channel shows an engagement score, trend indicator (up/down/stable), and a short insight (e.g., "YouTube up 12% this month")
- [ ] The report is labeled "Sample data for [Current Month]" or similar (to clarify it's not live)
- [ ] The data is context-appropriate to church media (not generic SaaS metrics)

---

## Return Visit & Session Management

### Story 11: Sign out and return as a remembered member
**As a** member  
**I want** to sign out of my session and later sign back in without re-joining  
**So that** I can end my session safely and resume where I left off

**Acceptance Criteria:**
- [ ] A "Sign out" button is visible in the member area (e.g., top right corner or in a menu); clicking it clears the localStorage (`cma-member-v1` is emptied) and returns the user to the landing page
- [ ] After sign-out, the landing page displays a "Sign in" link or button
- [ ] Clicking "Sign in" shows a form requesting Email only (no password, since this is demo)
- [ ] Entering the signup email and clicking "Sign in" retrieves the saved member state and displays the same welcome message, founding number, and data as before
- [ ] If a user reloads the landing page while signed out, the join flow is offered and no member data is accessible via the landing page; if a member's page is reloaded, the member area persists (no sign-out until explicitly clicked)

---

## Sprint Goal Coverage

These 11 stories collectively satisfy the sprint goal:

1. **Visitor understands offer in 10 seconds** ← Stories 1, 2, 3 (landing page clarity, proofs, CTA)
2. **Joins in under a minute** ← Stories 4, 5, 6 (rapid form, plan choice, demo-mode confirmation)
3. **Member area proves value** ← Stories 7, 8, 9, 10 (welcome, manuals, community, reporting)
4. **Sign-out / return works** ← Story 11 (session lifecycle)

---

## Notes for QA / Acceptance Testing

- **Demo mode labeling (Story 6):** This is critical. Verify "Simulate payment — demo mode" is rendered on every test run, and confirm no card fields appear anywhere.
- **Founding member countdown (Story 5, 7):** Increment the "X of 10" counter with each completed signup to verify the state updates correctly.
- **Responsive testing:** Test all stories at 375px mobile and 1280px desktop to ensure layout, button taps, and form usability.
- **Keyboard navigation:** Tab through all interactive elements and confirm focus is visible (blue outline or equivalent).
- **Dark/light theme:** Confirm all text meets WCAG AA contrast in both themes and that CSS custom properties control colors (no hardcoded hex).
- **Console / network:** Verify no console errors and no external requests to CDNs, payment processors, or analytics.
- **localStorage persistence:** Open dev tools, inspect `cma-member-v1` after signup, and confirm it contains the member's name, church, email, plan, and founding number.
