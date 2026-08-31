"""Parse the study guide's own review-question banks into structured items.

Each item is printed as a fill-in-the-blank sentence on the left and its answer
on the right, so the two columns are separated by x position and re-joined per
item.

Joining them by reading order does not work: the answer's baseline is typically
a fraction of a point *above* the baseline of its question's number, which in
document order attaches every answer to the previous question — a silent
off-by-one that would teach the wrong fact. So questions and answers are
collected separately and each answer is assigned to the nearest question
starting at or just below it.

Line breaks inside a sentence are hyphenated with a soft hyphen, which must be
closed up rather than turned into a space.
"""
import pymupdf, json, re, sys
from pathlib import Path

sys.path.insert(0, "scripts")
from locate import locate

BANKS = [("bank1", 77, 86, "part1"), ("bank2", 299, 310, "part2"), ("bank3", 355, 386, "part3")]
ANSWER_X = 380       # left edge of the answer column
ALIGN = 3.0          # an answer may sit this far above its question's baseline
SOFT = "­"

PDF = "/tmp/claude-0/-home-user-claude/a6ad3bdb-26e5-5798-b9a6-300f62f720e8/scratchpad/studyguide.pdf"
doc = pymupdf.open(PDF)

NUM_ONLY = re.compile(r"^(\d{1,3})\.$")
NUM_LEAD = re.compile(r"^(\d{1,3})\.[\s\t]+(.*)$", re.S)

def join(lines):
    out = ""
    for ln in lines:
        ln = ln.strip()
        if not ln:
            continue
        if out.endswith(SOFT):
            out = out[:-1] + ln
        elif out:
            out += " " + ln
        else:
            out = ln
    out = out.replace(SOFT, "").replace("ﬁ", "fi").replace("ﬂ", "fl")
    out = re.sub(r"(\w)-\s+(\w)", r"\1\2", out)
    return re.sub(r"[ \t]+", " ", out).strip()

items = []
for bank_id, lo, hi, module in BANKS:
    section = ""
    carry = None                       # item continuing from the previous page
    for pno in range(lo, hi + 1):
        rows = []
        for blk in doc[pno - 1].get_text("dict")["blocks"]:
            if "lines" not in blk:
                continue
            for ln in blk["lines"]:
                sp = [s for s in ln["spans"] if s["text"].strip()]
                if not sp:
                    continue
                y = min(s["bbox"][1] for s in sp)
                x = min(s["bbox"][0] for s in sp)
                size = max(s["size"] for s in sp)
                txt = "".join(s["text"] for s in ln["spans"]).strip()
                if y < 60 or not txt:
                    continue
                rows.append((y, x, size, txt))
        rows.sort()

        # Pass one: questions (and section headings), in order down the page.
        page_items, answers = [], []
        for y, x, size, txt in rows:
            if size >= 13:
                if not re.fullmatch(r"REVIEW QUESTIONS", txt, re.I):
                    section = join([txt])
                carry = None
                continue
            if x >= ANSWER_X:
                answers.append((y, txt))
                continue
            m_only, m_lead = NUM_ONLY.match(txt), NUM_LEAD.match(txt)
            if m_only or m_lead:
                item = {"bank": bank_id, "module": module, "section": section,
                        "n": int((m_only or m_lead).group(1)), "y": y,
                        "q": [m_lead.group(2)] if m_lead else [], "a": [], "page": pno}
                page_items.append(item)
                items.append(item)
                carry = item
            elif carry is not None:
                carry["q"].append(txt)

        # Pass two: give each answer line to the question it is set against —
        # the last one starting at or just below the answer's own baseline.
        for y, txt in answers:
            target = None
            for item in page_items:
                if item["y"] <= y + ALIGN:
                    target = item
            if target is None:
                target = carry if carry in page_items else (page_items[0] if page_items else carry)
            if target is not None:
                target["a"].append(txt)

out, dropped = [], 0
for i, it in enumerate(items):
    q, a = join(it["q"]), join(it["a"])
    if not q or not a:
        dropped += 1
        continue
    out.append({"id": f"{it['bank']}-{it['n']}-{i}", "bank": it["bank"], "module": it["module"],
                "section": it["section"], "n": it["n"], "page": it["page"],
                "q": {"en": q, "nl": ""}, "a": {"en": a, "nl": ""}})

# Point each item at the passage in the teaching text that states its answer.
course = json.loads(Path("content/course.en.json").read_text())
index = [(c["id"], b["i"], b["p"], b["x"])
         for c in course["chapters"] if c["kind"] == "text" for b in c["blocks"]]
RANGES = {"part1": (13, 76), "part2": (89, 298), "part3": (313, 354)}
located = 0
for it in out:
    lo, hi = RANGES[it["module"]]
    mid, half = (lo + hi) // 2, (hi - lo) // 2 + 1
    loc, score = locate(index, it["q"]["en"], it["a"]["en"], [mid], window=half, page_bonus=0.0)
    it["source"] = ({"chapter": loc[0], "block": loc[1], "page": loc[2]}
                    if loc and score >= 1.0 else None)
    it["matchScore"] = round(score, 3)
    located += bool(it["source"])

Path("content/reviews.json").write_text(json.dumps({"items": out}, ensure_ascii=False, indent=1))
from collections import Counter
print(f"review items: {len(out)} (dropped {dropped} incomplete); located sources: {located}")
print(Counter(i["bank"] for i in out))
