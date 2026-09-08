# Exhorter Studie

A bilingual (Dutch / English) study platform for the Church of God **Exhorter**
ministerial licensure course, built for a Dutch-speaking congregation.

**Live: https://exhorter-studie.netlify.app** — invitation-only.

---

## What it is

The source material is the 388-page *Exhorter Ministerial Licensure Study
Guide* (2025), the 150-question licensure examination, and the official answer
key. The platform turns those three documents into a study system: a bilingual
reader, practice questions, flashcards, a glossary, a cheat sheet, and a
practice exam scored to the official rule — with **every question linked to the
passage in the guide that answers it**.

## The central design decision

**The answer to every question is a pointer into the course text, not a fact
typed in beside it.**

The answer key gives, for each of the 150 exam items, the page in the *2019*
edition of the guide where the answer is found. This project uses the 2025
edition, which repaginated Part Three by four to five pages, so those page
numbers cannot be followed directly. Instead the key's page only bounds a
search window, and the passage is located by matching the wording of the item
and its correct option against the text of the guide
(`scripts/build-exam.py`, `scripts/locate.py`). All 150 items resolve to a
passage; 614 of the guide's own 627 review questions do too.

The consequence is that answering a question wrongly is one click from the
sentence that teaches it, deep-linked to the block so the reader highlights it
on arrival — and that the study material cannot drift out of step with the
source, because it *is* the source.

```
studyguide.pdf ─▶ parse-pdf.py ─▶ blocks ─▶ split-chapters.py ─▶ course.en.json
                                                │
exam PDF + answer key ─▶ build-exam.py ─────────┼─▶ exam.json      (150 items)
review banks in the PDF ─▶ build-reviews.py ────┼─▶ reviews.json   (627 items)
                                                └─▶ build-glossary.py
                                                    glossary.json  (404 terms)
                                                    scriptures.json (774 refs)
content/nl/** ─▶ merge-nl.py ─▶ course.nl.json + Dutch fields on the above
```

## Parsing the guide

Structure comes from typography, which the book applies consistently, rather
than from indentation:

| Signal | Meaning |
| --- | --- |
| 20pt bold | chapter title |
| 14pt bold | section heading |
| 12pt bold / ALL CAPS | subsection heading |
| 12pt regular | body text |
| **11pt regular** | block quote (scripture) |

Three things this had to get right, each of which silently corrupts the content
if got wrong:

- **Scripture quotations are a point smaller than body text.** Indentation
  cannot be used to find them: the Book of Church Order indents its numbered
  rules several levels deep, so indentation carries nesting depth, not quoting.
- **"C." is both a letter and a Roman numeral.** Heading level is decided by
  capitalisation instead — sections are set in caps, subsections in title case.
- **Numbered items use a hanging indent.** Read naively, every line of every
  numbered list becomes its own paragraph.

The review-question banks are printed in three columns — number, question,
answer — and the answer's baseline sits a *fraction of a point above* the
baseline of its question's number. Reading the page in document order therefore
attaches every answer to the preceding question: "Sacrament implies \_\_\_\_" gets
answered "Communion" instead of "mystery and celebration", and the entire column
is off by one. Answers are collected separately and assigned to the last
question starting at or just below them (`scripts/build-reviews.py`).

## The platform

| Route | What it does |
| --- | --- |
| `/` | progress dashboard |
| `/cursus`, `/cursus/[id]` | the reader; `?blok=N` highlights a block |
| `/oefenen` | multiple-choice review questions per chapter |
| `/flashcards` | Leitner-scheduled cards, hardest first |
| `/examen` | the 150-question exam, scored to the official rule |
| `/spiekbriefje` | every fact, key word and scripture on one printable page |
| `/woordenlijst` | glossary, each term linked to every occurrence |
| `/print` | the whole course as one document, to save as PDF |
| `/profiel` | language, bilingual display, theme, text size |
| `/beheer` | admin: overview, users, invitations, errata |

**Reading progress is observed, not asked for.** A paragraph counts as read once
it has been on screen; newly read blocks are batched and flushed, so scrolling a
long chapter costs a couple of requests rather than one per paragraph.

**Multiple choice is generated from the guide's own fill-in-the-blank banks.**
Distractors are drawn from answers to other items *in the same section*, so the
wrong options are the same kind of thing as the right one — a scripture
reference against scripture references, an office against offices.

**Scoring follows the examining board**: an average of 70% across the parts sat,
and no part below 60%.

## Accounts

The **first account to register owns the site** — there is no bootstrap password
to leak and no seeded admin to forget about. Everyone after that needs an
invitation. Invitations work with no mail provider configured: the invitation is
created either way and the admin screen shows a link to pass on by hand.

## Errata

Corrections are stored as errata keyed by chapter, block and language rather
than edited into the content files. So a correction applies immediately without
a redeploy, stays reversible, and survives a rebuild of the content from the
PDF. This is also how a doctrinal or polity point can be corrected against the
official *Minutes* without touching code.

## Translation

Dutch is the platform's primary language. Translations live in `content/nl/`
as plain text keyed by id, applied over the built content by `merge-nl.py`, so
the content can be rebuilt from the PDF at any time without losing translation
work.

Current coverage:

| | Dutch |
| --- | --- |
| Interface | complete |
| Exam (150 items, prompts and every option) | complete |
| Review questions (627) — drives practice, flashcards, cheat sheet | complete |
| Glossary terms (392 of 404) | complete |
| **Part Three — Doctrine** (Declaration of Faith, Practical Commitments) | **complete** |
| General Information | complete |
| Part One — Bible | not started |
| Part Two — History and Polity | not started |

**Untranslated paragraphs are shown in English and marked `· EN`**, and each
chapter shows its own percentage, so partial translation is a visible state
rather than a silent gap. To continue: add `content/nl/course/<chapterId>.txt`
with `#<block index>` lines followed by the Dutch text, then run
`npm run build` after `python3 scripts/merge-nl.py`. Or translate in place from
**Beheer → Errata**, which needs no checkout.

## Where this lives

Canonical home: **`kurtjjoseph-source/exhorter`** (private), on `main`.

Two things that have caught a session out before:

- A Claude Code session resets `origin` to the repository it was started from at
  the beginning of every turn, so `git remote set-url` does not stick. Push to
  this project explicitly:
  `git push https://github.com/kurtjjoseph-source/exhorter.git HEAD:main`
- The site is **not** built from the repo. Deploys upload this directory
  straight to Netlify site `776cda50-382c-4e6b-9a13-72f27269628f`, so a push
  alone changes nothing that is live, and a deploy works even with the repo
  untouched.

## Running it

```bash
npm install
cp .env.example .env.local     # set SESSION_SECRET
npm run dev
```

Rebuilding the content from the PDFs (they are not in the repo):

```bash
python3 scripts/parse-pdf.py        # studyguide.pdf -> blocks
python3 scripts/split-chapters.py   # blocks -> chapters
python3 scripts/build-exam.py       # exam + answer key -> exam.json
python3 scripts/build-reviews.py    # review banks -> reviews.json
python3 scripts/build-glossary.py   # glossary + scripture index
python3 scripts/merge-nl.py         # apply content/nl/**
```

On Netlify the store uses Netlify Blobs, because serverless functions get a
fresh filesystem on every invocation; locally it is a JSON file under
`DATA_DIR`.

## Source material

Study guide and examination © Church of God Ministerial Development, Cleveland,
Tennessee. This platform is a study aid for internal congregational use; the
source PDFs are deliberately not committed. Access to the deployed site is by
invitation only.
