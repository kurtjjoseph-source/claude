# This 1 Claude Skill fully replaces your Higgsfield Subscription — working transcript

**Channel:** Jay E | RoboNuggets — https://www.youtube.com/@RoboNuggets
**Video:** https://www.youtube.com/watch?v=9C4TRbucmhQ
**Length:** ~15:35 · solo episode, screen-share demos throughout

> **Note on this file.** This is a cleaned, condensed working record built from the auto-generated
> captions — filler removed, argument preserved in the speaker's first person, organised by
> section. It keeps every substantive claim, number, tool name and prescribed move, which is what
> the wizard is built from. It is not a word-for-word reproduction; watch the video at the link
> above for that.
>
> Auto-caption spellings corrected throughout: *Higsfield* → **Higgsfield**, *file AI / fall / F AI*
> → **fal.ai**, *wave speed* → **WaveSpeed**, *key / KI / Kir / keys* → **Kie.ai**, *GBD image 2 /
> GPD image 2 / GPT2 image* → **GPT Image 2**, *VO* → **Veo**, *cling* → **Kling**, *C dance to
> fast* → **Seedance 2 fast**, *clawed / cloud* → **Claude**, *Robbo Nuggets* → **RoboNuggets**.
> All dollar figures are as the speaker quoted them (he notes he is in Australia); treat them as
> his screen, not a global price list.

**Sections**

| | |
|---|---|
| 00:00 | The claim, and the demo brief |
| 00:45 | Three ad sets, three models, one $3 cap |
| 02:17 | From a still you like to a whole website |
| 03:02 | What Higgsfield actually is under the hood |
| 04:34 | Why people are leaving: terms, deletion window, "unlimited" |
| 06:05 | The subscription's real flaw: you pay the peak every month |
| 06:51 | The three aggregators: fal.ai, WaveSpeed, Kie.ai |
| 07:37 | Is it actually cheaper? The GPT Image 2 comparison |
| 08:23 | Why Kie.ai is that cheap — a guess, clearly labelled |
| 09:56 | Video: the gap almost closes, so the argument changes |
| 10:43 | Which one I use, and when |
| 11:29 | What a skill actually is: a written document with hard rules |
| 12:15 | The four steps of `/generate` |
| 13:46 | The gallery: you cannot judge images from a terminal |
| 14:32 | Extending it: paste the docs, get a new model |

---

## [00:00] The claim, and the demo brief

I just replaced Higgsfield with one Claude skill. Higgsfield are good at marketing their service,
but it is quite expensive and they have repeatedly frustrated their users — the most recent case
being a planned update to their terms that supposedly let them own the content you generate.

So today I'll show you an alternative. Instead of paying $100 a month or more, you use a Claude
skill to create whatever you want with any model, and **only pay for what you generate**. And by
the end I'll show you how to build the skill yourself, so it is hyper-customised to the work you do.

I'm in the Claude desktop app. I invoke a skill called `/generate` and paste a prompt: create a
variety of image ads for **Ketone IQ energy shot** — a real product — to launch a green apple
flavour.

## [00:45] Three ad sets, three models, one $3 cap

Two things in that prompt matter more than the brief itself.

First, I gave it **reference images**, so Claude understands the design systems this brand has used
in the past.

Second, in the rules section I set things you cannot really do in Higgsfield:

- a **total budget of $3** for these generations;
- **use a variety of image models** — I want GPT Image 2 versus Nano Banana 2 versus Nano Banana
  Pro, so I can compare;
- **use the cheapest model provider** from the sources the skill is connected to.

I send it, and Claude does all the work: crafts the prompts to my direction and sends them to the
model providers the skill is linked to.

When it's done, it has created **three image ads for each model**. These were made with GPT Image 2;
these with Nano Banana 2 Lite. They're all different, because I asked Claude to make them different.
That's a useful way to get variety so you can pin down the style you want — and to explore which
model works best for you.

## [02:17] From a still you like to a whole website

The other benefit of generating inside Claude rather than Higgsfield: the output is *in* the same
session as everything else you build.

Say I'm partial to one of these designs and want a website inspired by it. I copy the path of that
file and prompt Claude Code in the same session: here's the path to the photo we like, build us a
website for this drink, **animate that image to video using Kling**, align the colours to the image
I gave you, and generate a few more images in that style.

So it doesn't just generate — it built the website *and* incorporated the media it generated. Open
it and you can see it already did the hard work: it passed that still to video and put it in the
background; scroll down and there are more images in the same style.

That's a one-shot prompt, so obviously it's not finished — but it takes you maybe **70–80% of the
way** to the site in a few minutes. All of that is made possible by the `/generate` skill.

## [03:02] What Higgsfield actually is under the hood

To understand how the skill works it helps to understand how Higgsfield works.

Strip Higgsfield down to its core and **it is a wrapper around creative AI models**. The Google ones
— Nano Banana, Veo — you can use directly without subscribing to Higgsfield at all. Do a quick
search and you can find the official documentation for how to connect to these models. For Veo 3.1
it used to be that you needed a lot of technical jargon to wire it up; today, if you were Higgsfield,
you'd point your AI agent at that whole documentation page and have it learn how to connect your
application to the model.

That's basically what they do. Once they aggregate those models and those connections, **that is the
business model**. They charge something like **$79 a month for the max plan**, which you pay in
exchange for credits to access the models.

There's nothing inherently wrong with that — there is real value in aggregation.

## [04:34] Why people are leaving: terms, deletion window, "unlimited"

A big part of why people are looking for alternatives is the business practices.

**The terms.** The upcoming update to their terms of use said everything you generate will be usable
by them and that they would have rights to it. They have since withdrawn that statement and issued a
clarifying article: you own what you make, but you do have to agree that **the content you generate
will be used to run the service and even improve some of their models**. If you don't mind that,
Higgsfield may be for you.

**The deletion window.** To stop you cancelling cleanly: if you remove your account or unsubscribe,
you have a **limited amount of time to download your images before they are deleted forever**.

Contrast that with the skill. I have **every single image we generated, along with its prompts** —
all the prompts Claude used are sitting locally on my device. So I own it, it doesn't have to be
used for training anyone's models, and **I** control which ones get deleted and which ones I keep.

**"Unlimited".** Every time I go to Higgsfield's pricing page there's an unlimited access trial
running. At this point I'm not sure it's really unlimited — I've heard it's unlimited with a lot of
caveats and limits on which models you can use. And that pricing page might be one of the most
complex ones I've ever seen.

## [06:05] The subscription's real flaw: you pay the peak every month

Right now, at least here in Australia, it's **$49/month for the plus plan and $79/month for the max
plan**.

The drawback of subscription-based usage: in a month where you only make some images and a few
videos and you don't fully utilise that $79, **you still pay $79**.

The good news is there are real alternatives, and they're what the skill uses. These providers do
the same thing — they aggregate models by crawling the documentation from Google, Dreamina and
OpenAI to learn how to connect directly, then serve them through their own websites. There are a lot
of these aggregators, but the three we use consistently in our platform and our work are **fal.ai,
WaveSpeed and Kie.ai**.

Their business model differs from Higgsfield's in one decisive way: **they don't charge monthly,
they charge pay-as-you-go**. Generate five images this month and you're charged for five images.

## [06:51] The three aggregators: fal.ai, WaveSpeed, Kie.ai

Go to fal.ai's explore tab and it's the same idea as Higgsfield: aggregate the models, let you reach
them through **one account and one API key**.

fal.ai and WaveSpeed probably have the most models available through a single account — **close to
500 models** at this point, spanning text-to-image, text-to-3D, text-to-audio, speech-to-text and so
on.

## [07:37] Is it actually cheaper? The GPT Image 2 comparison

The obvious question is whether fal, WaveSpeed or Kie are actually cheaper than Higgsfield. The
honest answer is **it's complex, because it depends on the model**.

But here's one clear benefit of knowing how to use these tools. Take **GPT Image 2** — in my opinion
the best image editing model out there right now. Generate a **2K, 1:1** image:

| | cost for one 2K 1:1 GPT Image 2 generation |
|---|---|
| Higgsfield | ~**$0.31–0.34** depending on your plan |
| fal.ai / WaveSpeed | slightly more than Higgsfield |
| Kie.ai | **$0.05** |

So on that single model Higgsfield is a bit cheaper than fal or WaveSpeed. But remember the benefit
of fal and WaveSpeed: **pay as you go**. Without shelling out $79 or $49 you can still use GPT Image
2 programmatically, from a tool like Claude.

The outlier is **Kie.ai**. We've used it many times on our platform and channel — we were probably
one of the first to mention them — and they're popular because of how cheap they are. I double-checked
this myself: GPT Image 2 through Kie is **5 cents an image**. On Kie's own GPT Image 2 page the
pricing is **$0.03 for 1K, $0.05 for 2K, $0.08 for 4K**.

## [08:23] Why Kie.ai is that cheap — a guess, clearly labelled

How can they offer the model at those prices? Only the Kie team would know for sure.

If I had to hazard a guess — and **I can't confirm this** — they're probably using the OpenAI
subscription, something like **$20 a month**, since you can use GPT Image 2 right from the ChatGPT
window. They did something similar with Sora before. Most likely they found a way to take those
highly subsidised subscription accounts and offer them programmatically through their API service.

It's up to you how you use that information. Just know that if you want GPT Image 2 programmatically
through a tool like Claude, **Kie is probably the cheapest you'll get it at the moment**.

## [09:56] Video: the gap almost closes, so the argument changes

This varies by modality. For video I summarised the numbers for **Seedance 2 fast** at **720p, 8
seconds**: the cost per video is **not that far apart across the board**. Higgsfield and Kie are
again the cheapest.

But the drawback with Higgsfield stays the same: the **monthly subscription cost**, plus all the
terms you have to agree to — like having what you generate used to train whatever models they want.

So it's up to you whether you keep using Higgsfield. What I'm showing you is that there is **a lot of
optionality** among model aggregators, and that awareness of at least these three — the leaders, in
my view — gives you flexibility if you're not a fan of Higgsfield's model.

## [10:43] Which one I use, and when

There's always a question in our community about the difference between the three and what I use
personally. Broadly, as a guiding principle:

- **Cost is the deciding factor → Kie.ai.** The only problem is that Kie sometimes has **reliability
  issues**, supposedly because of how much demand they get, since they offer the cheapest models.
- **Most projects → fal.ai.** I default to it because it's **much more reliable**, and the cost
  difference is usually just a few cents anyway.
- **Niche models not available on fal → WaveSpeed.** They also have a huge library to choose from.

## [11:29] What a skill actually is: a written document with hard rules

Back to the `/generate` skill and how you start using one.

A skill, in essence — if I open it — **is just a written document that provides instructions to
Claude** on how to access these different models. So it's highly customisable depending on the type
of work you do, and you can add any hard rules you want.

For example: **have the cost quoted before submitting**. This matters, because with a tool like
Claude, if you ask it to generate 100 images **it will actually go and do it and drain your credits**.
Hard rules like that are quite important as you keep refining the skill to your liking.

## [12:15] The four steps of `/generate`

I put the flow in a Flows tab. Whenever I invoke the skill:

1. **Route the model.** By default it looks for the cheapest option available across its sources. If
   the cheapest is Kie it tries that first; if Kie is unavailable it **routes to fal, then
   WaveSpeed**, and so on.
2. **Load the references and craft the prompts.** This is very flexible with Claude — if you want to
   inspect the prompts before it actually generates anything, you can.
3. **Generate the media.** It calls the model itself to make the images or videos.
4. **Log it.** The step I hadn't shown: it **stores every prompt Claude passed to those models**, so
   you can go back to them later. And it auto-loads everything you generate into the generations tab.

## [13:46] The gallery: you cannot judge images from a terminal

That generations tab is quite similar to Higgsfield's masonry grid: every image and video you
generate on **one infinite canvas**.

For matters of design and visuals this is really important, versus living in Claude Code's terminal
or chat window. **You need to be able to see what Claude and these models are actually generating**
to properly assess whether they're any good.

The great part about owning your own micro-application like this is that you can add features you
want. Open the **styles** area and you'll see the styles I use myself: if I want a cinematic liquid
glass look, I click it, and that **copies the prompt plus the file paths to reference images** for
that style, which I then send to Claude so we generate in that style whenever we want.

## [14:32] Extending it: paste the docs, get a new model

To make it easy to build your own `/generate` skill — and to set up your API keys at Kie.ai and
fal.ai — I made a comprehensive **eight-page PDF guide**. You can read it, or just pass it to Claude
Code and it will set you up.

The good thing is it's entirely flexible. Say you want to add Google's new **Omni Flash** model to
the skill: head to fal.ai, hit **copy the content for LLMs** at the top right, then tell Claude to
add this to the `/generate` skill and paste that whole block of text.

Keep tailoring `/generate` for yourself and what you end up with is **a genuinely strong Higgsfield
alternative, without being locked into a monthly subscription**. If you want the gallery wall too, I
included a simple prompt to get started there.

The PDF is in the pinned comment.
