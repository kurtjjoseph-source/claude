"""Parse the Exhorter Study Guide PDF into a structured, page-anchored document.

Structure comes from typography, which the book applies consistently:

  20pt bold ............... chapter title            -> h1
  14pt bold ............... section heading          -> h2
  12pt bold / ALL CAPS .... subsection heading       -> h2/h3 (by numbering)
  12pt regular ............ body text                -> p
  11pt regular ............ block quote (scripture)  -> quote
  <=10.5pt ................ footnote                 -> note

Indentation is *nesting depth*, not quoting: the Book of Church Order indents
its numbered rules several levels deep. So x0 is kept as an `indent` level for
the renderer, while the quote/body distinction comes from font size.
"""
import fitz, json, re
from collections import Counter

doc = fitz.open("studyguide.pdf")
BASE_X = 72.0

HEAD_RE = re.compile(r"^(Exhorter Study Guide|Bible|General Information|Doctrine|"
                     r"Church of God History and Polity|Page \d+)$", re.I)
ROMAN_RE  = re.compile(r"^[IVXLC]+[\.\)]\s")
LETTER_RE = re.compile(r"^[A-Z][\.\)]\s")
NUM_RE    = re.compile(r"^\d+[\.\)]\s")

def spans(ln):
    return [s for s in ln["spans"] if s["text"].strip()]

def text_of(ln):
    out = []
    for s in ln["spans"]:
        t = s["text"]
        if s["font"].endswith("-S") and s["size"] < 10:
            t = t.upper()                      # restore small caps
        out.append(t)
    return re.sub(r"[\s ]+", " ", "".join(out)).strip()

def is_upper(t):
    letters = [c for c in t if c.isalpha()]
    return bool(letters) and sum(c.isupper() for c in letters) / len(letters) > 0.85

def classify(ln, page_h):
    sp = spans(ln)
    if not sp:
        return None
    x0   = min(s["bbox"][0] for s in sp)
    y0   = min(s["bbox"][1] for s in sp)
    size = max(s["size"] for s in sp)
    bold = any("Bold" in s["font"] for s in sp)
    t    = text_of(ln)
    if not t:
        return None
    if y0 < 62 and HEAD_RE.match(t):
        return None                                   # running head / folio
    if size <= 10.6:
        return {"kind": "note", "text": t, "x0": x0, "y": y0}
    if y0 > page_h - 110 and re.match(r"^\d[A-Z\u201c]", t):
        return {"kind": "note", "text": t, "x0": x0, "y": y0, "size": size}
    kind = None
    if size >= 17:
        kind = "h1"
    elif size >= 13 and bold:
        kind = "h2"
    elif (bold or is_upper(t)) and len(t) < 130:
        # "C." is both a letter and a Roman numeral, so numbering cannot decide
        # the level. Capitalisation can: sections are set in caps, subsections
        # in title case.
        kind = "h2" if is_upper(t) else "h3"
    if kind is None:
        kind = "quote" if size < 11.6 else "p"
    return {"kind": kind, "text": t, "x0": x0, "y": y0, "size": size}

# ---- collect lines, page by page --------------------------------------------
page_lines = []
for pno in range(doc.page_count):
    page = doc[pno]
    ph = page.rect.height
    lines = []
    for blk in page.get_text("dict")["blocks"]:
        if "lines" not in blk:
            continue
        for ln in blk["lines"]:
            c = classify(ln, ph)
            if c:
                lines.append(c)
    lines.sort(key=lambda l: (l["y"], l["x0"]))
    page_lines.append(lines)

# ---- merge wrapped lines into paragraphs ------------------------------------
def clean(text):
    text = re.sub(r"(\w)-\s+(\w)", r"\1\2", text)     # join hyphenated line breaks
    text = re.sub(r"\s+", " ", text)
    return text.strip()

blocks = []
for pno, lines in enumerate(page_lines):
    printed = pno + 1
    i, n = 0, len(lines)
    while i < n:
        ln = lines[i]
        if ln["kind"] in ("h1", "h2", "h3"):
            blocks.append({"type": ln["kind"], "text": clean(ln["text"]),
                           "page": printed, "indent": max(0, round((ln["x0"] - BASE_X) / 18))})
            i += 1
            continue
        # Find the run of same-kind lines, and take its base indent to be the
        # leftmost. Lines set in from that base are first lines of paragraphs;
        # lines at the base continue one.
        kind = ln["kind"]
        end = i
        while end < n and lines[end]["kind"] == kind:
            end += 1
        base = min(l["x0"] for l in lines[i:end])
        buf = [ln["text"]]
        j = i + 1
        while j < end:
            nx = lines[j]
            if nx["x0"] > base + 8 or NUM_RE.match(nx["text"]) or LETTER_RE.match(nx["text"]):
                break                       # a new paragraph opens here
            buf.append(nx["text"])
            j += 1
        blocks.append({"type": kind, "text": clean(" ".join(buf)), "page": printed,
                       "indent": max(0, round((base - BASE_X) / 18))})
        i = j

json.dump(blocks, open("sg_blocks.json", "w"), indent=0)
print("blocks:", len(blocks), Counter(b["type"] for b in blocks))
