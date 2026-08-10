# Kurt Joseph — Personal Site

Project 3's AI-optimized public profile. Static Node.js/Express site (no build step) covering VOM, Engage AI, Church of God Amersfoort, education products, and music — the "broader personal portrait" version.

## Run it locally

```bash
npm install
npm start
```

Open http://localhost:4200. (Or use the `public-site` launch config via the `run` skill / Claude Preview.)

## AI optimization

- `public/llms.txt` — plain-language summary for LLM crawlers.
- `public/robots.txt` — allows all crawlers.
- Semantic HTML (`<header>`, `<main>`, `<section>`, `<footer>`), one `<h1>`, real meta description.
- Footer "Ask AI about me" block — links to ChatGPT/Claude/Perplexity/Gemini with a pre-populated prompt, domain filled in dynamically via `location.hostname` so it's correct wherever it's deployed.

## Before going live — things to confirm/update

- **Domain**: `robots.txt`'s sitemap line and any hardcoded references currently assume `kurtjoseph.dev` as a placeholder. Update once a real domain is chosen (or just use the Render-provided `.onrender.com` URL — the Ask-AI links work correctly either way since they read `location.hostname` at runtime).
- **Contact email**: currently `kurtjjoseph@gmail.com` — confirm this is the one you want public.
- **Photo/headshot**: none included yet — purely text for now.

## Deploy (Render)

`render.yaml` is set up as a blueprint (`rootDir: projects/public-site`, Node web service, free plan). To deploy:

1. Push this repo to GitHub (see root `CLAUDE.md` / Project 4 step 4).
2. In the Render dashboard, "New +" → "Blueprint" → connect the GitHub repo. Render will read `render.yaml` and provision the service automatically.
3. Alternatively, deploy just this service directly ("New +" → "Web Service", root directory `projects/public-site`) without the blueprint.

You already run Engage AI's API on Render (`engage-ai-api.onrender.com`), so the account and workflow should already be familiar.
