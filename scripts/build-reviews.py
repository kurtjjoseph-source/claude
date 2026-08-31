"""Parse the study guide's own review-question banks into structured items.

The banks print each item as a fill-in-the-blank sentence on the left and its
answer on the right. Reading a page in y-order interleaves the two columns, so
they are separated by x position and then re-joined per item.

The left column is set two ways in the book: with the item number in its own
narrow column, and with the number run inline with the question. Both open an
item here. Line breaks inside a sentence are hyphenated with a soft hyphen,
which must be closed up rather than turned into a space.
"""
import pymupdf, json, re
from pathlib import Path

BANKS = [("bank1", 77, 86, "part1"), ("bank2", 299, 310, "part2"), ("bank3", 355, 386, "part3")]
ANSWER_X = 380          # right-hand answer column
SOFT = "­"

doc = pymupdf.open("/tmp/claude-0/-home-user-claude/a6ad3bdb-26e5-5798-b9a6-300f62f720e8/scratchpad/studyguide.pdf")
NUM_ONLY = re.compile(r"^(\d{1,3})\.$")
NUM_LEAD = re.compile(r"^(\d{1,3})\.[\s\t]+(.*)$", re.S)

def join(lines):
    """Join wrapped lines, closing up soft-hyphenated breaks."""
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
    section, pending = "", None

    def close():
        global pending
        if pending:
            items.append(pending)
            pending = None

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
        for y, x, size, txt in rows:
            if size >= 13:                                   # section heading
                close()
                if not re.fullmatch(r"REVIEW QUESTIONS", txt, re.I):
                    section = join([txt])
                continue
            if x >= ANSWER_X:
                if pending:
                    pending["a"].append(txt)
                continue
            m_only, m_lead = NUM_ONLY.match(txt), NUM_LEAD.match(txt)
            if m_only or m_lead:
                close()
                pending = {"bank": bank_id, "module": module, "section": section,
                           "n": int((m_only or m_lead).group(1)),
                           "q": [m_lead.group(2)] if m_lead else [],
                           "a": [], "page": pno}
                continue
            if pending:
                pending["q"].append(txt)
    close()

out, dropped = [], 0
for i, it in enumerate(items):
    q, a = join(it["q"]), join(it["a"])
    if not q or not a:
        dropped += 1
        continue
    out.append({"id": f"{it['bank']}-{it['n']}-{i}", "bank": it["bank"], "module": it["module"],
                "section": it["section"], "n": it["n"], "page": it["page"],
                "q": {"en": q, "nl": ""}, "a": {"en": a, "nl": ""}})

Path("content/reviews.json").write_text(json.dumps({"items": out}, ensure_ascii=False, indent=1))
from collections import Counter
print(f"review items: {len(out)}  (dropped {dropped} incomplete)")
print(Counter(i["bank"] for i in out))
for i in (out[0], out[130], out[-1]):
    print(f"  [{i['bank']} p{i['page']}] {i['q']['en'][:70]}  =>  {i['a']['en'][:40]}")
