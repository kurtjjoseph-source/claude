#!/usr/bin/env python3
"""Pull a YouTube transcript and write it as timestamped paragraphs.

    python3 fetch-transcript.py <video-url-or-id> [out.txt] [--seconds 45]

Writes `out.txt` (default: raw.txt) with one paragraph per ~45s of speech,
each prefixed [MM:SS] — the working file you read before writing transcript.md.
Also writes <out>.json with the raw segments in case you need finer timing.

Needs `youtube-transcript-api` (pip3 install --quiet youtube-transcript-api).
Handles both the 1.x instance API and the older classmethod API.
"""
import json
import re
import sys
import warnings

warnings.filterwarnings("ignore")


def video_id(s):
    m = re.search(r"(?:v=|youtu\.be/|/shorts/|/embed/)([A-Za-z0-9_-]{11})", s)
    return m.group(1) if m else s.strip()


def fetch(vid):
    from youtube_transcript_api import YouTubeTranscriptApi as Y

    try:  # 1.x: instance .fetch() returning objects
        return [{"t": round(s.start, 1), "x": s.text} for s in Y().fetch(vid)]
    except AttributeError:
        pass
    except Exception as e:
        print(f"   instance API failed ({type(e).__name__}: {e}); trying classmethod", file=sys.stderr)
    # 0.6.x: classmethod returning dicts
    return [{"t": round(s["start"], 1), "x": s["text"]} for s in Y.get_transcript(vid)]


def paragraphs(segs, every=45.0):
    out, buf, start = [], [], segs[0]["t"]
    for s in segs:
        if s["t"] - start >= every and buf:
            m, sec = divmod(int(start), 60)
            out.append(f"[{m:02d}:{sec:02d}] " + " ".join(buf))
            buf, start = [], s["t"]
        buf.append(s["x"].replace("\n", " ").strip())
    if buf:
        m, sec = divmod(int(start), 60)
        out.append(f"[{m:02d}:{sec:02d}] " + " ".join(buf))
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        print(__doc__)
        return 2
    every = 45.0
    if "--seconds" in sys.argv:
        every = float(sys.argv[sys.argv.index("--seconds") + 1])

    vid = video_id(args[0])
    out = args[1] if len(args) > 1 else "raw.txt"

    segs = fetch(vid)
    json.dump(segs, open(out + ".json", "w", encoding="utf-8"))
    paras = paragraphs(segs, every)
    open(out, "w", encoding="utf-8").write("\n\n".join(paras))

    mins = int(segs[-1]["t"] // 60)
    words = sum(len(s["x"].split()) for s in segs)
    print(f"   {vid}: {len(paras)} paragraphs, ~{mins} min, ~{words} words -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
