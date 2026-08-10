# Church Media Academy — Design Tokens & Copy Deck

## DESIGN TOKENS

### Palette

#### Light Theme
```
--ground: #FAFBFB         /* Near-white background */
--surface: #FFFFFF        /* Card and panel surfaces */
--ink: #1A1E2E            /* Deep church-slate text */
--ink-muted: #5A6370      /* Secondary text, muted slate */
--line: #DFE3E8           /* Borders and dividers */
--accent: #D4A574         /* Warm gold "stage light" accent */
--accent-soft: #E8D5C4    /* Soft gold for backgrounds and hover states */
--semantic-good: #2E7D32  /* Success green */
--semantic-warn: #C62828  /* Alert red */
```

#### Dark Theme
```
--ground: #0F1419         /* Deep slate background */
--surface: #1A1E2E        /* Card surface in dark */
--ink: #F0F2F5            /* Light text on dark */
--ink-muted: #9DA4AD      /* Muted light text */
--line: #2D3139           /* Borders in dark mode */
--accent: #D4A574         /* Warm gold (unchanged for visual anchor) */
--accent-soft: #3D3428    /* Dark gold overlay for dark mode */
--semantic-good: #66BB6A  /* Lighter success for contrast */
--semantic-warn: #EF5350  /* Lighter warning for contrast */
```

### Type Scale

**Display (Landing hero headlines)**
- Size: 48px / 60px (mobile / desktop)
- Weight: 600 (Iowan Old Style, Palatino, Georgia, serif)
- Line height: 1.2

**H2 (Section headers)**
- Size: 32px / 40px (mobile / desktop)
- Weight: 600 (serif)
- Line height: 1.3

**H3 (Card titles, subsection headers)**
- Size: 20px / 24px (mobile / desktop)
- Weight: 600 (sans)
- Line height: 1.4

**Body (Paragraphs, prose)**
- Size: 16px / 18px (mobile / desktop)
- Weight: 400 (system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif)
- Line height: 1.6

**Small (Labels, metadata, timestamps)**
- Size: 12px / 13px (mobile / desktop)
- Weight: 500 (sans)
- Line height: 1.4
- Letter-spacing: 0.3px

**Label (Form labels, navigation)**
- Size: 13px / 14px (mobile / desktop)
- Weight: 600 (sans)
- Line height: 1.4
- Letter-spacing: 0.2px

### Spacing Scale

Rhythm base: 8px

```
spacing-xs:    4px
spacing-sm:    8px
spacing-md:   16px
spacing-lg:   24px
spacing-xl:   32px
spacing-2xl:  48px
spacing-3xl:  64px
```

---

## COPY DECK

### LANDING PAGE

#### Hero Headline
**"90 days to a repeatable media system."**

#### Subheading
**"Join a community of church media volunteers building your Sunday livestream, growth strategy, and team playbooks—with real support when you need it."**

#### CTA Label
**"Join Now"**

---

### Perk Cards (Landing)

**Card 1: Monthly Engage AI Report**
*Your church's engagement benchmarked across 7 channels—YouTube, Facebook, Instagram, LinkedIn, X, Google Business, website. See what's working and where to focus.*
(This is the flagship retention perk.)

**Card 2: Five Learning Manuals**
*The Sunday Livestream Playbook, YouTube Growth for Churches, Reading Your Engagement Benchmark, Volunteer Media Team Handbook, Social Posts from One Sunday Sermon. Real steps, no filler.*

**Card 3: Same-Day Community Answers**
*Ask a question in the feed. Sarah from Grace Baptist answers in an hour. Tom from Northside shares a template. You're never the only one troubleshooting captions or encoding.*

**Card 4: Monthly Live Office Hours**
*Ask me anything. Every month, 1 hour on Zoom. Your livestream crashed on Sunday? We debug it. New volunteer joining your team? Let's build their onboarding checklist.*

---

### Founder Story Block

**"I run the livestream every Sunday at Church of God Amersfoort. I also benchmark churches' digital reach for Vision Outreach Media with Engage AI. Every week I hear the same bottlenecks: 'We don't have a system,' 'Our volunteers don't talk to each other,' 'We have no idea if anyone's actually watching.' I started Church Media Academy to give you the playbook I've built—and the community you need to keep it running. You won't get generic SaaS metrics. You'll get real advice from someone in the pews every Sunday."**

---

### Testimonials (Illustrative)

**Sarah Chen, Grace Baptist Church, Austin TX**
*"Before joining, every livestream Sunday felt like we were winging it. Now we have the checklist, the team knows their role, and our YouTube is actually growing. Best €39 I spend each month."*

**Marcus Johnson, Northside Community, Chicago IL**
*"The manual on social posts genuinely changed how we share our sermons. We weren't reaching anyone before. Three months in, we've got real community engagement on Facebook and YouTube."*

---

### Pricing Section

**Monthly Plan**
**€39/mo**
Cancel anytime. Full access to all manuals, community, and your monthly Engage AI report.

**Annual Plan**
**€390/yr** (save €78)
Locked-in price. Pay once, access all year.

**Founding Plan**
**€29/mo • Locked for life**
Early access rate that never expires, even if we raise pricing later. Limited to 10 founding members.
*Founding spots: 3 of 10 taken*

---

### FAQ Section

**Q: Is this for volunteers or for staff?**
A: Both. If you're a volunteer managing the livestream or social media, this is built for you. If you're a paid communications director, you'll get the same playbooks and community. The Academy works for teams of any size—solo volunteer or team of five.

**Q: We're just starting out. Is this still for us?**
A: Yes. In fact, the first manual, "The Sunday Livestream Playbook," is written specifically for churches that are new to streaming. We start with "what do we need" and "why it matters," not just tactics. The community also has experienced people happy to answer beginner questions.

**Q: Can I cancel anytime?**
A: Yes. Monthly or annual—cancel with 1 email. No lock-in, no gate. We want you to stay because the community and benchmarks genuinely help you, not because you're trapped.

**Q: What does "demo mode" mean in the signup?**
A: This site is a working demo. When you click "Simulate payment," no real charge happens—you're test-driving the member area to see the manuals, community, and report format. A real launch would use Stripe or Mollie. Right now, you're seeing what the experience will feel like.

---

### Footer Line

*"Church Media Academy. Built by Kurt Joseph. Shipping soon."*

---

## JOIN FLOW

### Step 1: Your Details

**Step title:** "Let's start with the basics."

**Field labels:**
- **Name** (required, e.g., "Sarah")
- **Church Name** (required, e.g., "Grace Baptist")
- **Email** (required, e.g., "sarah@gracebaptist.org")

**Button label:** "Next"

**Validation copy (inline error):** "Please fill in all fields to continue."

---

### Step 2: Choose Your Plan

**Step title:** "Pick a plan that fits your budget."

**Monthly/Annual Card Microcopy:**
*"Flexibility. Cancel anytime. Perfect for exploring what works for your church."*

**Founding Card Microcopy:**
*"Rare opportunity. Lock in €29/mo for life. Founding spots: X of 10 taken."*

**Button label:** "Review Order"

**Selection validation copy:** "Please select a plan to continue."

---

### Step 3: Confirm Signup (Demo Payment)

**Step title:** "You're almost there."

**Order summary block:**
- Name: [entered name]
- Church: [entered church]
- Plan: [chosen plan and price]

**Demo-mode warning label (badge/alert style):**
**"Simulate payment — demo mode"**

**Supporting copy:**
*"This is a demo. No card will be charged. When the Academy launches, real payment happens here. For now, explore the member area and give us feedback."*

**Button label:** "Simulate Payment"

**Success copy (on next page, just before member area loads):**
*"Welcome! You're in. Let's show you around."*

---

## MEMBER AREA

### Welcome Section

**Headline template:**
*"Welcome back, {name}."*

**Subheading:**
*"{church}"*

**Badge:**
*"Founding member #{founding_number}"*

(E.g., "Welcome back, Sarah. Grace Baptist. Founding member #3.")

---

### Section Intros

**Manuals Section:**
*"Everything you need to build a repeatable system. Start with the livestream playbook, or jump straight to YouTube growth—whatever your bottleneck is right now."*

**Community Section:**
*"Real questions, real answers, real wins. Ask something Thursday, get help by Friday. Organized by topic and newest-first."*

**Your Engagement Report Section:**
*"Every month, Engage AI benchmarks your church against your own growth trend and similar-sized churches. See what's working on each channel and what needs focus."*

**Office Hours Section:**
*"Monthly live Zoom with me. Bring your toughest problem: livestream setup, volunteer onboarding, social strategy, captions, encoding, anything. One hour, no agenda but yours."*

---

### Interactions & Empty States

**Mark as Read (Manual progress):**
- Label: "Mark as read"
- Visual toggle: Checkbox or checkmark icon
- Confirmation: "Marked. You can revisit anytime."

**Community Post Placeholder (composer):**
*"Share a win, ask a question, post a resource. What's on your mind?"*

**Office Hours RSVP:**
- RSVP label: "I'll be there"
- Toggled state: "See you Thursday at 2pm CET"
- Cancel label: "Can't make it"

**Sign Out:**
- Label: "Sign Out"
- Confirmation: "See you next time, {name}."

---

## THE 5 MANUALS

### Manual 1: The Sunday Livestream Playbook

**Title:** "The Sunday Livestream Playbook"

**Opening Section (~150 words):**

The Sunday livestream is the gateway. If it works, your church stays connected. If it fails—frozen frame, bad audio, dropped connection—you lose reach and trust. This playbook gives you the exact system we use at Church of God Amersfoort every single week.

You'll start with what you actually need (spoiler: less than you think—a camera, mixer, and encoding software can handle 500+ viewers). We walk through setup step-by-step, then move to troubleshooting: why your captions disappear, how to recover from a dropped connection in the first 30 seconds, what to tell your pastor when a technical glitch happens live.

By the end of this section, you'll have a checklist for every Sunday, a clear role for each volunteer, and the confidence to know what's urgent and what can wait until Monday.

**Coming Next:**
- Encoder setup for OBS and StreamYard
- Audio levels and why they matter (a technical deep-dive that prevents 60% of livestream crashes)
- The pre-broadcast rundown: the 10 minutes before you go live

---

### Manual 2: YouTube Growth for Churches

**Title:** "YouTube Growth for Churches"

**Opening Section (~150 words):**

YouTube is where people discover your church outside Sunday morning. A visitor Googles "church near me" or "sermon on forgiveness" and finds your channel. But growth doesn't happen by uploading sermons and hoping. This manual shows you exactly how to build a system that gets your videos watched.

We start with what actually works for churches: playlists organized by series or topic (so a visitor watches three sermons in a row, not just one). Then we cover thumbnails—not fancy graphic design, just simple, readable, on-brand. Title strategy: how to write a title that YouTube's algorithm favors and humans want to click. We end with consistency: the exact cadence that builds a habit in your audience without burning out your volunteers.

You'll see real numbers from churches that applied these steps. We're talking 200, 300, sometimes 500 new subscribers per month. Not because the sermons got better—because the system did.

**Coming Next:**
- Playlist architecture that keeps viewers engaged
- Thumbnail psychology (colors, text, contrast for mobile)
- The Title-Description-Tags framework that YouTube rewards

---

### Manual 3: Reading Your Engagement Benchmark

**Title:** "Reading Your Engagement Benchmark"

**Opening Section (~150 words):**

Every month, your Engage AI report arrives with five channel scores: YouTube, Facebook, Instagram, LinkedIn, X, Google Business, and website. Each score is 0-100. But what does a 72 on YouTube actually mean? Is that good? How does it compare to last month? And—the real question—what do you do about it?

This manual is a decoder. We explain each metric: what drives YouTube engagement (watch time, click-through rate, retention), what Facebook prioritizes (shares over likes), why Instagram's algorithm favors Reels now, not carousels. We show you how to read the trend line: is your Facebook climbing, stable, or falling? Why it matters. And crucially: how to identify your biggest opportunity each month.

We end with the action part. If YouTube is 85 but Instagram is 52, we tell you exactly what to focus on. This isn't overwhelm—it's strategy. Pick your one channel to improve each month, act for 30 days, then check the benchmark again.

**Coming Next:**
- The metrics behind each channel (why Instagram dropped, what X values most)
- Building a one-page strategy from your report
- Seasonal patterns in church engagement (why you drop in July, spike in November)

---

### Manual 4: The Volunteer Media Team Handbook

**Title:** "The Volunteer Media Team Handbook"

**Opening Section (~150 words):**

You've got three volunteers: one runs the camera, one manages audio, one handles the chat. But they've never talked about what "ready to go live" means, so one person thinks 2 minutes is enough and another thinks 15. Chaos. Bad captions. Panic.

This handbook fixes that. We start with role clarity: what the camera operator owns, what the audio person owns, what the chat moderator owns, and where those responsibilities overlap. Then we build a decision matrix: if the WiFi drops 30 seconds before go-live, who decides what? (Spoiler: you pre-decide, so there's no confusion at 10:58am Sunday morning.)

We cover volunteer onboarding—the actual checklist a new person gets on day one. Cross-training (so you're never one person away from disaster). How to run a 20-minute dry run Saturday morning instead of a 2-hour panic sprint Sunday morning. And the culture piece: how to make volunteering feel like a team, not like you're frantically covering gaps.

**Coming Next:**
- The role-clarity template (camera / audio / chat / production lead)
- Pre-service checklist and contingency playbook
- Monthly volunteer sync meeting agenda and template

---

### Manual 5: Social Posts from One Sunday Sermon

**Title:** "Social Posts from One Sunday Sermon"

**Opening Section (~150 words):**

You delivered a sermon on hope on Sunday. By Tuesday, you want to extend its reach. But how do you turn 35 minutes of audio into seven platform-specific posts without sounding like a robot or eating 4 hours?

This manual gives you the template. We show you how to extract five quotes from the sermon (the exact lines people will share), and then we remix those five quotes for each platform: a long-form post for Facebook (where people read), a punchy quote for Instagram (carousel format with text overlay), a thread starter for X (five tweets that work as a series), a LinkedIn post (if your church has professionals), and a YouTube community post (one line linking to the full sermon).

We include real examples from actual sermons. We also cover timing: post this quote Sunday evening while people are still thinking about the message. This one Tuesday morning when people need encouragement. This one Thursday when engagement is highest.

By the end, you'll have a system that takes one sermon and reaches people across seven channels without feeling forced.

**Coming Next:**
- The sermon-mining template (how to identify the five core quotes)
- Platform-specific voice guidelines (how your tone changes from Facebook to LinkedIn)
- Scheduling and cross-posting without looking spammy

---

## COMMUNITY FEED (Sample Data)

**Post 1 (Win)**
Sarah Chen, Grace Baptist, posted:
*"Hit 5,000 YouTube subscribers this week. Started with the playlist strategy from the Academy and just stayed consistent. Three months of small changes, big payoff. Grateful."*
— Tuesday 2:34 PM

**Post 2 (Question)**
Marcus Johnson, Northside Community, posted:
*"Anyone have a solid workflow for live captions on YouTube while streaming from OBS? We're using the native YouTube captions but they're 5-10 seconds behind. Driving us crazy."*
— Monday 10:12 AM

**Post 3 (Resource Share)**
Elena Rossi, St. Paul's, posted:
*"Encoded a lighting guide I made for our sanctuary setup. Thought someone might find it useful. DM me if you want the PDF."*
— Sunday 8:45 PM

**Post 4 (Answer)**
David Park, West Side Fellowship, posted:
*"@Marcus—we switched to CCAPTION and it's cut the delay to 1-2 seconds. Costs €8/mo but worth it for our audience. Happy to walk you through setup if needed."*
— Monday 1:22 PM

**Post 5 (Prayer of Thanks)**
Jennifer Torres, Mission Heights, posted:
*"The livestream that crashed last Sunday? We implemented the backup encoder tip from the playbook and it literally saved us this morning. Crisis averted. Huge thanks to everyone sharing playbooks here."*
— Wednesday 6:18 PM

**Post 6 (Question)**
Robert Kim, River's Edge, posted:
*"We're moving to a new sanctuary in Q4. Completely redesigning our setup. Any of you done a full A/V overhaul? Where do I even start?"*
— Saturday 4:05 PM

**Post 7 (Tactical Tip)**
Leah Martinez, Desert Hope, posted:
*"Found a trick: schedule your Facebook posts to go live 10 minutes AFTER the YouTube premiere ends, not during. Keeps momentum and you get the comment conversation on both platforms."*
— Thursday 3:47 PM

---

## SAMPLE ENGAGE AI REPORT

**Church Name:** Grace Baptist Church, Austin TX  
**Month:** July 2026  
**Report Period:** July 1–31

### Channel Scores & Insights

**YouTube: 78/100**
*Up 8 points. Playlist strategy is working—average watch time up 22%. Keep the consistent upload schedule.*

**Facebook: 71/100**
*Stable. Post engagement is solid but share rate could lift. Try the "social post remixes" from the Academy—more variation in format.*

**Instagram: 58/100**
*Down 4 points. Reels are underperforming. If you shift more content to Reels format, we expect a 15-20 point jump in 60 days.*

**Google Business: 82/100**
*Up 5 points. Your hours, photos, and recent posts are fully filled out. This is nearly optimal. Maintain it.*

**LinkedIn: 45/100**
*Minimal activity. Low opportunity cost to invest here if you have a strategy—very underserved channel for churches. Consider quarterly posts.*

### Overall Recommendation

**Focus:** YouTube and Instagram (YouTube is your strength, Instagram is your biggest opportunity). Allocate 80% of effort here. Maintain Facebook consistency but don't grow. LinkedIn and Google Business are healthy as-is.

**Next Action:** Test Reels for the next 30 days and rescan. You could hit 75+ on Instagram by September.

---

**Generated by Engage AI** | Church Media Academy | Sample data for demonstration purposes
