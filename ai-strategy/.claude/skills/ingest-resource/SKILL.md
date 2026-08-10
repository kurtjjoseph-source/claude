---
name: ingest-resource
description: Ingest a new source (YouTube video, article URL, or pasted text/transcript) into the ai-strategy internal-os knowledge base — saves the raw material under knowledge/raw/[slug]/ and regenerates a synthesis wiki at knowledge/wiki/[slug].md. Use when Kurt says "/ingest-resource", "ingest this", "add this to the board/knowledge base", or pastes a link/transcript/article and wants it folded into a board member's profile or a knowledge/frameworks or knowledge/audience file.
---

# Ingest Resource

Turn a raw source into two things: an untouched raw copy (`knowledge/raw/`) and an updated synthesis (`knowledge/wiki/`). Never skip straight to synthesis without saving the raw material — the raw copy is what lets a future re-synthesis correct for a bad summary.

## Steps

1. **Identify the slug.** Ask Kurt (or infer from context) whose knowledge this belongs to — a board member's `person-slug`, or a non-person category like `frameworks` or `audience` if it's not about a specific person.
2. **Get the content, in order of preference:**
   - **Pasted text** — use as-is.
   - **Article/webpage URL** — fetch it (`WebFetch`) and extract the substantive content, not nav/boilerplate.
   - **YouTube URL** — pull captions first, since it's fast and free:
     ```bash
     python3 -m yt_dlp --skip-download --write-auto-sub --write-sub --sub-lang en --sub-format vtt \
       --extractor-args "youtube:player_client=android" -o "video" "<URL>"
     ```
     If that errors with a PO-token/format warning, that's just a noisy warning, not a failure — check whether the `.vtt` file was written before troubleshooting further. Auto-captions are rolling/duplicated; deduplicate consecutive overlapping caption lines into a single clean transcript before saving (don't save the raw duplicated VTT).
     If the video's substance is shown as on-screen text/graphics rather than spoken (e.g. a tutorial with prompt text on screen), captions alone will miss it. In that case download the video (`yt-dlp -f "best[height<=720]" --extractor-args "youtube:player_client=android"`) and pull frames at relevant timestamps with `ffmpeg` (install via `pip3 install --user --break-system-packages imageio-ffmpeg` if no system ffmpeg is available) to read the on-screen text directly. Delete the downloaded video and frames afterward — only the extracted text is worth keeping.
3. **Save the raw file.** Write it to `knowledge/raw/[slug]/<descriptive-name>.md`, with a one-line header noting the source URL/title and date ingested. Don't summarize here — this is the archival copy.
4. **Regenerate the synthesis wiki.** Read everything currently in `knowledge/raw/[slug]/` (not just the new file) and rewrite `knowledge/wiki/[slug].md` covering: core ideas, vocabulary/phrasing they actually use, stances on relevant topics, and recurring stories/examples. This is a full regeneration from all raw material, not an append — that's what keeps the wiki coherent as more sources get added over time.
5. **Confirm.** Tell Kurt what was saved and where, and whether this created a new board member or updated an existing one.

## Notes

- If ingesting into `knowledge/frameworks/` or `knowledge/audience/` rather than a person, skip the "vocabulary/stances/stories" synthesis shape — just extract the material relevant to that folder's purpose (see root `CLAUDE.md`).
- Clean up temp files (downloaded video/audio/frames) in the scratchpad directory when done — only the distilled markdown belongs in the repo.
