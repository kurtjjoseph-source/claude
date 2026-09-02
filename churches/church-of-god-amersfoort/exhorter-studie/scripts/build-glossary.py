"""Build the glossary and the scripture index.

Glossary terms are the answers the study guide itself expects a candidate to
supply in its review questions — the vocabulary the exam actually tests. Each
term is defined by the sentence in the teaching text that states it, and linked
to every place it occurs.

The scripture index is every reference cited anywhere in the guide, with the
passages that cite it.
"""
import json, re, sys
from collections import defaultdict
from pathlib import Path

course = json.load(open("content/course.en.json"))
reviews = json.load(open("content/reviews.json"))["items"]
# Dutch definitions come from the translated course text as it lands.
try:
    course_nl = json.load(open("content/course.nl.json"))
except FileNotFoundError:
    course_nl = {}

TEXT = [c for c in course["chapters"] if c["kind"] == "text"]
CHAPTER_TITLE = {c["id"]: c["title"] for c in course["chapters"]}
CHAPTER_MODULE = {c["id"]: c["module"] for c in course["chapters"]}

# ---------------------------------------------------------------- glossary
BOOKS = (r"Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|"
         r"Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|"
         r"Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|"
         r"Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|"
         r"Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|"
         r"Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation")
SCRIPTURE_RE = re.compile(
    rf"\b((?:[1-3]\s+|First\s+|Second\s+|Third\s+)?(?:{BOOKS}))\s+(\d+):(\d+(?:\s*[-,–]\s*\d+)*)")

def is_term(s):
    if not s or len(s) < 3 or len(s) > 48:
        return False
    if SCRIPTURE_RE.search(s):
        return False
    if re.fullmatch(r"[\d\s,.;:%-]+", s):        # bare numbers and dates
        return False
    if len(s.split()) > 5:
        return False
    return True

# Split compound answers ("created; image of God") into their parts.
raw_terms = defaultdict(list)                     # lowercase term -> review items
dutch_for = {}                                    # lowercase English term -> Dutch term
for r in reviews:
    en_parts = [p.strip().strip(".,") for p in re.split(r"[;]|\s+and\s+", r["a"]["en"])]
    nl_parts = [p.strip().strip(".,") for p in re.split(r"[;]|\s+en\s+", r["a"]["nl"] or "")]
    for i, term in enumerate(en_parts):
        if not is_term(term):
            continue
        raw_terms[term.lower()].append(r)
        # Only pair up when the two languages split into the same shape;
        # otherwise the pairing would be a guess.
        if len(nl_parts) == len(en_parts) and i < len(nl_parts) and nl_parts[i]:
            dutch_for.setdefault(term.lower(), nl_parts[i])

# Index the teaching text once, for occurrences and definitions.
blocks = [(c["id"], b["i"], b["p"], b["x"]) for c in TEXT for b in c["blocks"]]

glossary = []
for key, items in sorted(raw_terms.items()):
    display = max((i["a"]["en"] for i in items), key=len)
    for part in re.split(r"[;]|\s+and\s+", display):
        if part.strip().lower() == key:
            display = part.strip()
            break
    pattern = re.compile(rf"\b{re.escape(key)}\b", re.I)
    occurrences = [{"chapter": cid, "block": bi, "page": pg}
                   for cid, bi, pg, text in blocks if pattern.search(text)]
    if not occurrences:
        continue
    # A single ordinary word that turns up all over the guide is a word, not a
    # term of art; the glossary is for vocabulary the exam actually turns on.
    if " " not in key and key[0].islower() and len(occurrences) > 22:
        continue
    # Define the term from the passage a review question points at, when there
    # is one; otherwise from its first occurrence.
    source = next((i["source"] for i in items if i.get("source")), None)
    definition = ""
    if source:
        chapter = next((c for c in TEXT if c["id"] == source["chapter"]), None)
        block = next((b for b in chapter["blocks"] if b["i"] == source["block"]), None) if chapter else None
        if block:
            definition = block["x"]
    if not definition:
        definition = occurrences[0] and next(
            (t for cid, bi, pg, t in blocks
             if cid == occurrences[0]["chapter"] and bi == occurrences[0]["block"]), "")
    # Trim the defining passage to the sentence that carries the term.
    sentences = re.split(r"(?<=[.!?])\s+", definition)
    best = max(sentences, key=lambda s: len(pattern.findall(s)) * 100 - abs(len(s) - 180),
               default=definition)
    definition_nl = ""
    if source:
        definition_nl = course_nl.get(source["chapter"], {}).get(str(source["block"]), "")
        if definition_nl:
            sents = re.split(r"(?<=[.!?])\s+", definition_nl)
            definition_nl = max(sents, key=lambda x: -abs(len(x) - 180), default=definition_nl).strip()
    glossary.append({
        "id": re.sub(r"[^a-z0-9]+", "-", key).strip("-"),
        "term": {"en": display, "nl": dutch_for.get(key, "")},
        "definition": {"en": best.strip(), "nl": definition_nl},
        "questions": [i["id"] for i in items][:6],
        "occurrences": occurrences[:24],
        "module": CHAPTER_MODULE.get(occurrences[0]["chapter"], ""),
    })

# ------------------------------------------------------------- scriptures
refs = defaultdict(list)
for cid, bi, pg, text in blocks:
    for m in SCRIPTURE_RE.finditer(text):
        book = re.sub(r"\s+", " ", m.group(1)).strip()
        book = (book.replace("First ", "1 ").replace("Second ", "2 ").replace("Third ", "3 "))
        verses = re.sub(r"\s+", "", m.group(3))
        ref = f"{book} {m.group(2)}:{verses}"
        refs[ref].append({"chapter": cid, "block": bi, "page": pg})

scriptures = [{"ref": r, "count": len(v), "occurrences": v[:12],
               "modules": sorted({CHAPTER_MODULE.get(o["chapter"], "") for o in v})}
              for r, v in sorted(refs.items())]

Path("content/glossary.json").write_text(
    json.dumps({"terms": glossary}, ensure_ascii=False, indent=1))
Path("content/scriptures.json").write_text(
    json.dumps({"refs": scriptures}, ensure_ascii=False, indent=1))
print(f"glossary terms: {len(glossary)}")
print(f"scripture references: {len(scriptures)} distinct, "
      f"{sum(s['count'] for s in scriptures)} citations")
for t in glossary[:3]:
    print(f"  · {t['term']['en']}: {t['definition']['en'][:96]}")
for s in sorted(scriptures, key=lambda x: -x["count"])[:6]:
    print(f"  § {s['ref']} ×{s['count']}")
