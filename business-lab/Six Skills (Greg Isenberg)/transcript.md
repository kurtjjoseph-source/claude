# "Learn AI" Is Bad Advice. Learn This Instead — working transcript

**Channel:** Greg Isenberg (The Startup Ideas Podcast)
**Video:** https://www.youtube.com/watch?v=jJIOA4GroBw
**Posted:** 2026-06-25 · 29:53 · solo episode

**Description (author's own):** In this solo episode, I lay out the six skills I believe stay valuable as AI grows more capable. I chose these six because each one is open to anyone, each one starts this weekend, and each one rises in value as AI improves. I walk through agents and local models, distribution, robotics, curation, the builder distributor, and IRL community building, with one concrete first rep for every skill. My goal is to hand you one simple, clear map of where the world is heading and exactly how to begin.

**Chapters**

| | |
|---|---|
| 00:00 | Intro |
| 00:57 | Skill 1 — Running AI agents and local models |
| 04:51 | Skill 2 — Marketers who build distribution |
| 09:03 | Skill 3 — Robotics engineers who build and source hardware |
| 14:29 | Skill 4 — Curators who yap and make short-form video |
| 19:05 | Skill 5 — The builder distributor |
| 23:11 | Skill 6 — IRL community builders |
| 27:34 | Build your skill stack |

> **Note on this file.** This is a cleaned, condensed working record of the episode from the auto-generated captions — filler removed, argument preserved in the speaker's first person, organised by chapter. It keeps every substantive claim, example, tool name and prescribed exercise, which is what the wizard is built from. It is not a word-for-word reproduction of the episode; watch the video at the link above for that.

---

## 00:00 — Intro

Imagine it's a few years from now. AI can build almost anything, write almost anything, and do most of the tasks people used to get paid for. In that world, what skill is still valuable?

I've been thinking about this non-stop and I've narrowed it down to six core skills. None of them require a fancy degree or connections. All of them could be started this weekend. And every single one of them gets *more* valuable as AI gets better, not less.

They're in no particular order. The more of them you know, the better.

---

## 00:57 — Skill 1: Running AI agents and local models

The first skill is being able to set up agents properly, manage them, and run local AI models. This is the grown-up version of prompt engineering.

A lot of people learned how to type a good prompt into ChatGPT, which is useful. The next layer is designing a little AI employee that has context, tools, permissions, memory, a goal, and a way to check its own work before it bothers you.

That skill is valuable because most companies are about to have the exact same problem: ten AI tools, fifty workflows, a bunch of half-working automations, and nobody who understands how to turn that into an operating system — which is what they actually want. The person who can walk in and say *here's the customer support agent, here's the research agent, here's the sales follow-up agent, here are the rules, here's what each is allowed to do, here's where it needs approval, here's how we know if it's working* becomes really hard to replace.

**The local part.** There are workflows where privacy, cost, latency or control matter a lot — and model prices keep going up. If you can run models locally with something like Ollama or LM Studio, you start to understand what can happen on your own machine, what needs the cloud, what should touch private docs, and what should stay behind the wall. People in the comments always say local models are getting smaller and this won't matter. Even so — you learn the architecture for the future. You learn which jobs need a giant brain and which jobs just need a reliable worker that never sleeps.

**The first rep.** Build a daily briefing agent for yourself. Give it three sources: your calendar, a folder of notes, and a few saved links. Its job is to tell you what matters today, what decisions are waiting on you, and what follow-ups you owe people. Then add one rule: it has to show sources, and it has to ask for approval before sending anything.

That one project teaches you context, retrieval, tool use, permissions, and evals. It sounds small and maybe boring as a first agent, but that is basically the shape of every serious agent inside a company.

The mistake people make is trying to build the all-knowing agent first — the really big agent project. The better move is to build a small agent, make it genuinely valuable, schedule it, and give it a clear success metric. The metric can be simple: did it save me ten minutes? did it catch something I would have missed? did it produce something I would actually have used? If the answer is yes, you're learning the skill.

---

## 04:51 — Skill 2: Marketers who build distribution

The second skill is marketers who know how to build distribution. This one is underrated because people confuse distribution with posting. Distribution is much deeper than posting on social media. It's knowing where attention already lives, what people are already anxious about, what language they use when they describe the problem, and how to turn that into trust *before* you ask them to buy anything.

In the AI world, building product is easy. Building demand keeps getting more important. When anyone can ship a landing page or an app or a SaaS, the bottleneck moves to a single question: can you make people care?

The marketers who win in the agentic era will be part researcher, part storyteller, part media operator, part community builder. They know how to take one insight and turn it into a tweet, a short-form video, a YouTube title, a newsletter angle, a landing page headline, a founder story, and a sales conversation. Marketers are becoming generalists — which is the broader trend, because if your job is to manage agents you need to understand all the components.

**First rep — the distribution map.** Pick a niche you care about: dentists using AI, solo consultants, real estate agents, Shopify operators, whatever. It can be a business you want to start or one you're already building. Write down the twenty places their attention goes — the newsletters, the creators they follow, the Reddit threads that get popular, Slack groups, podcasts, events, search terms, the tools they already pay for.

Then write one painful sentence they would actually say out loud. Something like: *"I know I should follow up with leads faster, but by the time I sit down to do it, half of them are cold."* That sentence is where distribution starts, because you're transporting yourself into their shoes.

**Second rep — twenty hooks.** Write twenty hooks for the same idea. Some curiosity hooks, some fear hooks, some status hooks, some money hooks, some "I wish I knew this earlier" hooks.

If you want to be great at distribution, you stop asking *how do I promote this?* after the product is done, and start asking *what existing desire am I pointing this at?* before you build. That mindset shift alone changes the quality of your ideas.

The short version: put yourself in their shoes, be part storyteller, part researcher, part media operator — and take a lot of shots on net, because some win and some don't.

---

## 09:03 — Skill 3: Robotics engineers who build and source hardware

The third skill is robotics engineers who can build hardware, wire in AI, and source manufacturing. Very few people have robotics experience, so let me explain why it's on the list.

Software was an incredible business for the last twenty years, and there are still opportunities in SaaS, consumer mobile and enterprise apps. But the moat is moving to hardware, and a lot of people are sleeping on this. The last decade rewarded people who moved pixels around — I was one of them. The next decade will also reward people who can move atoms. That was the big insight for me.

Robotics used to feel like a PhD thing: expensive parts, custom hardware, weird tooling, long timelines. That's not the world anymore. Now there are open-source robot learning projects, cheap cameras, low-cost arms, better simulation, multimodal motor models, and communities sharing datasets. Hugging Face has **LeRobot**, which is trying to make robot learning accessible — and Hugging Face itself is almost a database of open-source projects you can pull down and inject into a robot. There are low-cost arm projects like the **SO-100 / SO-101** ecosystem. And there are smaller vision-language-action models like **SmolVLA** pushing toward robot policies you can train and run without a giant industrial setup.

The interesting part goes beyond the AI layer. It's the person who can make the whole loop work. Can you get a cheap arm on your desk? Can you mount the camera? Can you collect demonstrations? Can you train or fine-tune the model? Can you make the robot repeat one useful task? Can you look at a supplier listing in China and understand whether the thing is actually manufacturable? Someone who can do all three — build the hardware, wire in the AI, source the manufacturing — has a serious skill set. I'm learning this in real time because I think it's that important.

**First rep.** Buy or assemble a low-cost robot arm. Add a cheap camera. Teach it one boring task: sorting three objects, pressing a button, moving something from one tray to another. Then document every failure — the camera angle was bad, the lighting changed, the gripper slipped, the dataset was too small, the model looked smart in one setup and fell apart when the object moved two inches. That's the point. Robotics teaches humility quickly, and that humility becomes your expertise.

**The sourcing side.** Most people listening to this are software people who like digital products, but physical products matter now too. Go on Alibaba or a similar marketplace (I'm not affiliated) and study how components are sold. Ask for a sample before you talk about bulk. Ask for motor specs, controller board details, CAD files if they exist, replacement parts, lead times, minimum order quantity, shipping terms, and a short video of the part doing the exact thing you need.

You're learning a new language, and the language is: *can this actually be made, shipped, repaired, and used by a normal person?*

This skill is rare because it sits between worlds. Software people avoid hardware; hardware people avoid distribution and AI. The person who can connect open-source AI models, physical prototyping, and manufacturing has a shot at building things that feel like science fiction but sell like practical tools.

---

## 14:29 — Skill 4: Curators who yap and make short-form video

The fourth skill is curators — people who can yap, in the best possible sense, and make short-form video in their sleep.

The internet is drowning in information, and the person who can make sense of it in public is valuable. Curation has evolved past "here are five links in a newsletter." Curation now looks like *here are five products in this niche you'd love*, explained in a storytelling way.

The curator of the agentic era watches the timeline and says *this matters because…* They can see a new model demo, a weird startup launch, a robotics clip, a policy change, a news item, a pricing update — and translate it for one specific niche. What should you learn? What should you ignore? What should you try this weekend? What's hype and what's actually useful?

Here's the insight, which might sound obvious: you don't need to be exceptionally smart to build a big following. You don't even need millions — fifty or a hundred thousand followers in a niche is enough to build an incredible business on. And you don't need net-new content. You can look at what's happening in your niche and curate the interesting parts in short form, authentically, just yapping to your phone.

The algorithms are prioritising yapping right now, because AI slop is flooding the timeline and people are tired of it. There's nothing more raw than authentic: *"Hey, my name is Greg Isenberg, I suffered from X until I found these five products / this story / this person who helped me — let me tell you about it."* That's the type of content the timeline is promoting.

Learning to yap is just a very good skill. The people who are great at it make you feel like you're in a group chat that hands you a research report — fast, opinionated, useful, a little entertaining. You know the people in your niche where you watch them and think *I feel like I know this person.*

**First rep — a seven-day curation sprint.** Pick a lane: AI agents for real estate, robotics for small businesses, whatever it is. Every day, find three things and make one short video using the same structure:

> *I saw this. Most people will think it means this. I think it actually means this. Here's the move.*

That structure forces you to have a take, which is the difference between curation and forwarding links. Curators who do this well are either anti-something or pro-something. Have a take.

**Build a taste file.** Some people call it a swipe file — a document of examples you love: great hooks, great analogies, great titles, weird use cases, comments that reveal what people are genuinely confused about. Curators are only as good as their taste inputs. Generic inputs produce generic outputs. Weird, specific, high-signal inputs mean people start trusting you, because you consistently find the thing before they do. That's what makes you worth the follow.

---

## 19:05 — Skill 5: The builder distributor

The fifth skill is what I call the builder distributor — the person who can ship the product *and* get it in front of people. This might be the most important one if you're a founder.

For years there was a clean split: one person builds, one person sells. You had your Wozniak, the technical person, and your Steve Jobs, the marketer. One writes code, one writes copy. One makes the thing, one gets the attention.

AI is compressing that split. One person can now prototype the product, make the landing page, write the launch thread, make a video about it, record the demo, DM the first hundred users, edit short-form clips, and iterate on feedback. That person has leverage because they never wait for a handoff. They complete the loop themselves, so nothing gets lost in translation.

The loop is the whole game: build something small, put it in front of people, watch where they get confused, change the product, change the story, try again. Most people only do half — they build in private forever, or they talk in public forever and never ship. The builder distributor learns by cycling between both.

This is what the one-person billion-dollar company that Sam Altman talks about actually looks like. When you see someone like Peter, who founded Open Claw — he built something incredible technically, but if you read how he writes and how he handles customer support, he's an excellent marketer too. That's the type.

**First rep — the 48-hour loop.** Pick one tiny problem you personally understand. Build the smallest version of a solution with AI. It can be ugly — a script, a form, a simple web app, an automation, anything. Then create ten pieces of distribution for it before you feel ready: one demo video, three short clips, three posts, two DMs to people who have the problem, and a landing page.

You're training yourself to stop separating the product from the market. AI makes the building part faster, so the marketing part can start much earlier. You don't spend six months wondering if people want it — you spend a weekend building enough to earn a real reaction. Then the builder distributor gets dangerous, because attention turns into product feedback and product feedback turns into better attention.

The only way to become great at this is to spend more time building, more time launching and distributing, and to keep the loop turning. This is also what I've called the **ACP funnel**: build audience at the top, convert it into community, then build product from there — another loop the builder distributor runs well.

---

## 23:11 — Skill 6: IRL community builders

The last skill is in-real-life community builders. This one feels old school next to AI, robotics, open source and local models — which is exactly why I like it.

As more work moves to agents and chats and tools and feeds, real rooms become more valuable. People still want to meet other ambitious people, people like them, into the same things. They still want trust, energy, and to be around people who teach them something or entertain them.

AI makes content abundant, software abundant, advice abundant. So where does scarcity move? It moves to belonging, trust and context. Who do you actually know? Who would answer your text? Who would help you hire? Who would introduce you to a customer? Who would tell you the honest version of what's happening in their market?

The IRL community builder knows how to create that: pick the right room, set the right topic, invite the right mix of people, and create a ritual people want to come back to. A great community is more like a habit than an event — same time, same kind of people, same promise, better conversations each time.

There are hundreds of millions, arguably billions, up for grabs for people who can create great events. I'm not making that number up — look at the big event companies. Jason Lemkin built SaaStr as an event around SaaS and the numbers are massive. Look at South by Southwest. And in general people don't want giant events anymore — they want smaller, more bespoke ones. That's where the opportunity is.

**First rep.** Don't start with a massive event. Host six, seven or eight people around one sharp question — a dinner, a walk, a hike, a breakfast. The question could be *what skill are you learning because of AI?*, or *what are you automating in your company right now?*, or *what do you think everything in tech is missing?* Then invite people who can actually answer it.

Afterwards, send a short recap: the best quotes, the inside jokes, the ideas, and the one follow-up everyone should do. The recap matters because it turns the room into a network. It creates memory, it gives people a reason to forward it, and it makes the next invite easier. Over time the room becomes a media asset, a recruiting asset, a deal-flow asset, and honestly a life asset.

This skill pairs beautifully with the others: the agent person builds tools for the community, the marketer grows it, the curator turns the best conversations into content, the builder distributor launches products from it, the robotics person brings the weird demos. That's when it gets really interesting.

---

## 27:34 — Build your skill stack

So, the six skills:

1. People who can set up agents properly, manage them, and run local models.
2. Marketers who know how to build distribution.
3. Robotics engineers who can build hardware, wire in AI, and source manufacturing.
4. Curators who are good at yapping and can do short-form video in their sleep.
5. The builder distributor — the one person who can both ship the product and get in front of people.
6. The IRL community builder, who brings people into rooms and starts networks from them.

The bigger point is that the future favours the person who can *combine* these. There are too many tools to know all of them; the advantage goes to the people who know how the pieces fit together. Can you make agents useful? Can you get attention? Can you build physical things? Can you explain what matters? Can you ship and distribute? Can you bring people together in real life?

You don't have to be amazing at all six. **Pick one and get dangerous. Pick two and you have leverage. Pick three and you become the kind of person everyone wants on the team, in the room, or building the company.**

We're in for a crazy next five, ten, fifteen years in the job market and the economy. Nobody really knows what happens. The one thing we do know is that skill is your defence — it's your shield. I made this episode because a lot of people know they should be doing *something* and aren't sure what.

---

## Named tools & references

| | |
|---|---|
| Local model runtimes | Ollama, LM Studio |
| Robot learning | Hugging Face **LeRobot**; **SmolVLA** (small vision-language-action model) |
| Low-cost arms | **SO-100 / SO-101** open-source arm ecosystem |
| Sourcing | Alibaba and similar component marketplaces (unaffiliated) |
| Frameworks named | The **ACP funnel** — audience → community → product |
| People cited | Jason Lemkin (SaaStr), Sam Altman (one-person billion-dollar company), Peter / Open Claw, Wozniak & Jobs as the old build/sell split |
