# Exhorter Studie

A bilingual (Dutch / English) study platform for the Church of God **Exhorter**
ministerial licensure course, built for a Dutch-speaking congregation.

> **Status: in progress.** The branch has been cleared of the previous,
> unrelated application and currently holds the content model that the course
> material will be loaded into. The course texts are still to be supplied.

## What is being built

- The full course, translated to Dutch, split into modules and chapters, each
  with a summary, key points, keywords with definitions, and every scripture it
  cites — Dutch scripture from the **Herziene Statenvertaling (HSV)**, English
  alongside.
- A cheat sheet gathering all keywords, terms and scriptures, and a glossary
  linking every keyword to the places it occurs in the material.
- Multiple-choice review questions per module and a certification test exam
  covering all 150 points of the official examination, in its order. Each
  question is keyed to the key point that answers it, which is highlighted in
  the course text on review.
- Learning helpers: flashcards, self-tests, and per-chapter recall drills.
- User profiles with saved progress and settings, and a language switch that
  works anywhere in the material.
- An admin dashboard — the first registered user becomes admin — with user CRUD,
  email invitations, a course errata editor, a course import screen for adding
  new material without touching code, and an overview of everyone's progress.
- The translated course as a downloadable PDF as well as an online reader.

## Content model

Everything a learner reads is bilingual: each human-readable string is a `Bi`
pair (`{ nl, en }`). Chapters are built from **key points** — the atoms of the
course. Exam questions cite a key point by id, which doubles as the reader's
highlight anchor (`?kp=<id>`), so "where is the answer" is a link, not a page
number. See `src/lib/content/types.ts`.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind 4 · TypeScript.
