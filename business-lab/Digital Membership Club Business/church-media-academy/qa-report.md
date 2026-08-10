# Church Media Academy — Manual Browser Test Checklist

**Run in**: Desktop (1280px) and Mobile (375px) viewports; both light and dark themes; console clean

---

## Story 1: Understand the offer in 10 seconds

### Desktop (1280px) — Light + Dark
- [ ] Landing page loads; headline, tagline, key benefit visible without scrolling (above fold)
- [ ] Headline, tagline, and benefit copy are legible in both light and dark themes
- [ ] Pricing (€39/mo, €390/yr, founding €29/mo) visible above fold
- [ ] Founding member cap ("X of 10 taken") visible and accurate
- [ ] Copy is direct and specific to church media (references to Sunday, livestream, volunteers)

### Mobile (375px) — Light + Dark
- [ ] Same headline, tagline, benefit visible without scrolling at 375px
- [ ] Pricing and founding cap visible on mobile
- [ ] All text readable and not truncated

---

## Story 2: See real member benefits and community proof

### Desktop (1280px) — Light + Dark
- [ ] All 5 manual titles listed: "The Sunday Livestream Playbook", "YouTube Growth for Churches", "Reading Your Engagement Benchmark", "The Volunteer Media Team Handbook", "Social Posts from One Sunday Sermon"
- [ ] At least one manual shows ~150-word opening section (real content, not lorem ipsum)
- [ ] Sample community post visible with author name, church name, and post text
- [ ] Sample post is labeled "Sample"
- [ ] Sample Engage AI report visible with 7 channel scores (Website, Google Business, Facebook, Instagram, YouTube, LinkedIn, X)
- [ ] Report is labeled as "Sample data"
- [ ] Office hours mention visible (e.g., "Monthly live Q&A with Kurt")

### Mobile (375px) — Light + Dark
- [ ] All 5 manuals listed on mobile
- [ ] Sample post visible and readable at 375px
- [ ] Report card visible and readable on mobile

---

## Story 3: Know how to join

### Desktop (1280px) — Light + Dark
- [ ] Prominent "Join Now" or "Start Free Trial" button visible without scrolling below fold
- [ ] Button text is action-oriented (e.g., "Join Now")
- [ ] Button has visible focus state (keyboard navigation tab through it)
- [ ] Button has sufficient color contrast (readable in both light and dark themes)

### Mobile (375px) — Light + Dark
- [ ] CTA button visible and tap-able on mobile (not covered, no scroll required)
- [ ] Button is full-width or appropriately sized for touch
- [ ] Clicking button navigates to join flow Step 1

---

## Story 4: Enter basic information quickly

### Desktop (1280px) — Light
- [ ] Join flow Step 1 displays 3 fields: Name, Church Name, Email (labeled clearly)
- [ ] Form fields accept input (name text, church name text, email text)
- [ ] Submit form without filling any field → inline error message appears
- [ ] Fill all 3 fields with: Name="Test User", Church="Grace Baptist", Email="test@example.com"
- [ ] Click "Continue" or press Enter on any field → advances to Step 2
- [ ] Form submission completes within 30 seconds of interaction

### Mobile (375px) — Light
- [ ] Same 3 fields at 375px, single column layout
- [ ] Fields legible and touch-friendly
- [ ] Form submission works on mobile

### Navigation persistence
- [ ] Navigate back to Step 1 (if multi-step, verify back button exists)
- [ ] Verify entered Name, Church, Email data persists in fields

### Dark theme
- [ ] Form fields readable and accessible in dark theme
- [ ] Error messages visible in dark theme

---

## Story 5: Choose a membership plan with transparent demo labeling

### Desktop (1280px) — Light
- [ ] Step 2 displays two plan cards: Monthly/Annual and Founding
- [ ] Monthly/Annual card shows: "€39/mo or €390/yr"
- [ ] Founding card shows: "€29/mo • Locked for life" + "Founding spots: X of 10 taken"
- [ ] Only one plan can be selected at a time (radio/toggle behavior)
- [ ] Selecting a plan enables "Continue" button (disabled state before selection)
- [ ] X of 10 counter updates after each signup (if testing multiple signups)

### Mobile (375px) — Light
- [ ] Both plan cards visible at 375px (may be stacked)
- [ ] Plan selection and button enable/disable works on mobile
- [ ] "X of 10 taken" counter text visible on mobile

### Navigation persistence
- [ ] Navigate back to Step 1 and forward to Step 2
- [ ] Verify selected plan persists

### Dark theme
- [ ] Plan cards and "Continue" button visible in dark theme

---

## Story 6: Confirm signup with explicit demo-mode labeling

### Desktop (1280px) — Light
- [ ] Step 3 displays selected plan summary (name, price, church name)
- [ ] Text "Simulate payment — demo mode" visible (in badge or warning style)
- [ ] Button labeled "Simulate payment" or "Complete signup (demo)"
- [ ] NO credit card, CVV, expiry, or other payment fields anywhere
- [ ] Open DevTools Network tab before clicking
- [ ] Click "Simulate payment" button
- [ ] Verify no requests to payment processors (should see 0 payment-related requests)
- [ ] Page redirects to member area (Step 4+)

### Mobile (375px) — Light
- [ ] Demo mode warning text visible at 375px
- [ ] Confirm button visible and tap-able
- [ ] Same no-payment-processor behavior on mobile

### Dark theme
- [ ] Demo mode warning and button visible in dark theme

### localStorage verification
- [ ] After signup, open DevTools Console
- [ ] Run: `localStorage.getItem('cma-member-v1')`
- [ ] Verify output contains: Name, Church, Email, Plan, Founding number (JSON or object)

---

## Story 7: See a personalized welcome with founding member status

### Desktop (1280px) — Light
- [ ] Member area displays "Welcome, Test User" at top (using name from signup)
- [ ] Church name "Grace Baptist" displayed below welcome
- [ ] "Founding member #X" badge visible (X = signup order, increments with each test signup)
- [ ] Welcome section persists after page reload (F5 or Cmd+R)
- [ ] Welcome message visible within 2 seconds of page load (no lazy loading blocking)

### Mobile (375px) — Light
- [ ] Same welcome, church name, and founding badge visible at 375px
- [ ] Layout responsive and readable at 375px

### Dark theme
- [ ] Welcome section and founding badge visible in dark theme
- [ ] Text contrast meets WCAG AA

---

## Story 8: Access all five learning manuals with readable content

### Desktop (1280px) — Light
- [ ] All 5 manuals listed with titles (same as Story 2)
- [ ] Each manual shows ~150-word opening section (not lorem ipsum)
- [ ] Manual titles are clickable to expand/collapse or toggle view
- [ ] At least one manual has "Mark as read" checkbox or button
- [ ] Click "Mark as read" → visual state changes (e.g., title grayed out, checkmark visible)

### Mobile (375px) — Light
- [ ] All 5 manuals visible and readable at 375px
- [ ] Manual expand/collapse works on mobile
- [ ] "Mark as read" interaction works on mobile

### Persistence
- [ ] Click "Mark as read" on Manual 1
- [ ] Reload page (F5)
- [ ] Verify Manual 1 still shows read state (not reset)

### Dark theme
- [ ] Manual content readable in dark theme
- [ ] Read/unread state visually distinct in dark theme

---

## Story 9: See sample community posts to feel part of a peer network

### Desktop (1280px) — Light
- [ ] Community feed displays 6-8 sample posts
- [ ] Each post shows: author name (e.g., "Sarah"), church name (e.g., "Grace Baptist"), post text
- [ ] Each post has "Sample" tag or "Example post" label
- [ ] Posts include variety: at least one question, one win, one resource share
- [ ] Posts ordered chronologically (newest first) or by category

### Mobile (375px) — Light
- [ ] All posts visible and readable at 375px without text overflow
- [ ] Posts are scrollable on mobile (feed scrolls vertically)
- [ ] "Sample" labels remain visible on mobile

### Dark theme
- [ ] Post text and "Sample" tags visible in dark theme
- [ ] Background and text contrast meets WCAG AA

---

## Story 10: See a sample Engage AI monthly report to understand benchmarking value

### Desktop (1280px) — Light
- [ ] "Your monthly Engage AI report" or "Engagement benchmark" card visible
- [ ] Report displays 7 channel scores: Website, Google Business, Facebook, Instagram, YouTube, LinkedIn, X
- [ ] Each channel shows engagement score, trend indicator (up/down/stable), and short insight
- [ ] Report labeled "Sample data for July 2026" or similar
- [ ] Data context-appropriate to church media (not generic SaaS metrics)

### Mobile (375px) — Light
- [ ] Report card visible and readable at 375px
- [ ] 7 channel scores visible (may be in scrollable table or vertical list)
- [ ] Insights readable on mobile

### Dark theme
- [ ] Report card visible and readable in dark theme
- [ ] Channel scores and trends visible in dark theme

---

## Story 11: Sign out and return as a remembered member

### Sign-out flow — Desktop (1280px) — Light
- [ ] "Sign out" button visible in member area (e.g., top right, menu)
- [ ] Click "Sign out"
- [ ] localStorage is cleared: run `localStorage.getItem('cma-member-v1')` → returns `null`
- [ ] Page returns to landing page
- [ ] "Sign in" link or button now visible on landing page

### Sign-in flow (returning member) — Desktop (1280px) — Light
- [ ] Click "Sign in"
- [ ] Form displays Email field only (no password)
- [ ] Enter email: "test@example.com" (the signup email)
- [ ] Click "Sign in" or press Enter
- [ ] Member area loads with same welcome message: "Welcome back, Test User"
- [ ] Church name and founding number (e.g., "#1") restored
- [ ] Manual read state and community posts re-display

### Sign-in with wrong email — Desktop (1280px) — Light
- [ ] Click "Sign in" again
- [ ] Enter email: "wrong@example.com"
- [ ] Click "Sign in"
- [ ] Inline error or rejection message appears (member not found)
- [ ] User remains on sign-in form

### Mobile (375px) — Light
- [ ] Sign-out button visible and tap-able on mobile
- [ ] "Sign in" form works and is readable at 375px
- [ ] Sign-in submission works on mobile
- [ ] Returning member welcome displays correctly at 375px

### Dark theme
- [ ] Sign-out button and "Sign in" form visible in dark theme

---

## Responsive & Accessibility (all viewports)

### Desktop (1280px)
- [ ] Page renders correctly with no layout shifts
- [ ] Tab through all interactive elements (buttons, links, form fields) → visible focus state (blue outline or equivalent)
- [ ] All text readable: sufficient color contrast in light and dark themes

### Mobile (375px)
- [ ] No horizontal scroll required
- [ ] All buttons and links tap-able (not too small, not overlapping)
- [ ] Form fields full-width or appropriately sized
- [ ] Touch targets are ≥48px

### Keyboard Navigation (all viewports)
- [ ] Tab through all buttons, links, form fields
- [ ] Shift+Tab navigates backward
- [ ] Enter key submits forms
- [ ] Space key toggles checkboxes and buttons

### Color Themes (both light and dark)
- [ ] Toggle color theme button (usually top right)
- [ ] Switch between light and dark → all content readable
- [ ] Text color, backgrounds, accent colors adapt
- [ ] No hardcoded colors override theme (CSS uses custom properties)

### Console Clean
- [ ] Open DevTools Console (F12, then Console tab)
- [ ] Perform all actions (join, sign-out, sign-in, expand manuals, click RSVP)
- [ ] Verify zero console errors
- [ ] Verify zero console warnings related to app (ignore browser warnings)

### Network Clean
- [ ] Open DevTools Network tab
- [ ] Reload page
- [ ] Perform all actions (join, navigate, sign-out, sign-in)
- [ ] Verify no requests to external CDNs, payment processors, or analytics
- [ ] All requests should be to same origin or `data:` URIs

---

## Test Summary

**Pass Criteria:**
- All checkboxes in Stories 1–11 are checked
- Responsive layout works at 375px and 1280px
- Both light and dark themes are accessible
- Keyboard navigation works across all interactive elements
- Console and Network tabs show no errors or external requests
- localStorage persistence works as expected

**Fail Criteria:**
- Any story's checkbox left unchecked
- Layout breaks or is unreadable at 375px or 1280px
- Color theme toggle missing or inactive
- Console errors or warnings related to app
- External requests to payment processors, CDNs, or analytics
- Sign-out or sign-in flow broken or unclear

---

## Orchestrator run record — 2026-07-19

Static: qa-check.mjs 31/31 PASS (run twice: pre-fix and post-fix builds).
Runtime (http://127.0.0.1:8742, doctype-wrapped parity with deploy skeleton):
- Stories 1–3 landing: PASS (hero/CTA/counter/sample previews; 375px + desktop; light + dark)
- Stories 4–6 join: PASS (inline validation; plan select; "Simulate payment — demo mode" banner above confirm; no card fields; founding #4 assigned; counter 3→4 of 10)
- Stories 7–10 member: PASS (Welcome, Kurt Joseph; badge; 5 manuals + mark-as-read 0→1 of 5; composer prepends member post; per-card Sample tags; 7-channel report; RSVP toggle)
- Story 11: FAIL first run → 3 defects filed (annual copy duplicate; "Welcome back" missing; session.active not set on sign-in → reload lost session). Fixed by FE, re-verified PASS: sign-out keeps record/clears session; wrong email rejected; sign-in → "Welcome back, Kurt Joseph."; real reload restores member area.
- Console: no errors. No horizontal scroll at 375/789px.
