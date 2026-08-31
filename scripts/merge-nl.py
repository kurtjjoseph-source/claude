"""Apply the Dutch translations onto the built content.

Translations are kept as plain text keyed by id, separate from the built
English content, so the content can be rebuilt from the PDF at any time without
losing translation work, and so a translator can work on one file at a time.

  content/nl/exam.tsv          id <TAB> prompt <TAB> choiceA | choiceB | ...
  content/nl/reviews.tsv       id <TAB> question <TAB> answer
  content/nl/course/<id>.txt   "#<block index>" lines, each followed by its text
"""
import json, re
from pathlib import Path

def read_tsv(path):
    rows = {}
    if not Path(path).exists():
        return rows
    for line in Path(path).read_text(encoding="utf8").splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) >= 2:
            rows[parts[0].strip()] = [p.strip() for p in parts[1:]]
    return rows

# ---- exam ------------------------------------------------------------------
exam_path = Path("content/exam.json")
exam = json.loads(exam_path.read_text())
tr = read_tsv("content/nl/exam.tsv")
n_exam = 0
for item in exam["items"]:
    row = tr.get(item["id"])
    if not row:
        continue
    item["prompt"]["nl"] = row[0]
    if len(row) > 1:
        choices = [c.strip() for c in row[1].split("|")]
        for choice, text in zip(item["choices"], choices):
            if text:
                choice["text"]["nl"] = text
    n_exam += 1
exam_path.write_text(json.dumps(exam, ensure_ascii=False, indent=1))

# ---- review questions ------------------------------------------------------
rev_path = Path("content/reviews.json")
reviews = json.loads(rev_path.read_text())
tr = read_tsv("content/nl/reviews.tsv")
n_rev = 0
for item in reviews["items"]:
    row = tr.get(item["id"])
    if not row:
        continue
    item["q"]["nl"] = row[0]
    if len(row) > 1:
        item["a"]["nl"] = row[1]
    n_rev += 1
rev_path.write_text(json.dumps(reviews, ensure_ascii=False, indent=1))

# ---- course text -----------------------------------------------------------
course = json.loads(Path("content/course.en.json").read_text())
sizes = {c["id"]: len(c["blocks"]) for c in course["chapters"]}
out, n_blocks = {}, 0
for path in sorted(Path("content/nl/course").glob("*.txt")):
    chapter_id = path.stem
    blocks, current, buf = {}, None, []
    for line in path.read_text(encoding="utf8").splitlines():
        m = re.fullmatch(r"#(\d+)", line.strip())
        if m:
            if current is not None and buf:
                blocks[current] = " ".join(x.strip() for x in buf).strip()
            current, buf = m.group(1), []
        elif current is not None:
            buf.append(line)
    if current is not None and buf:
        blocks[current] = " ".join(x.strip() for x in buf).strip()
    blocks = {k: v for k, v in blocks.items() if v}
    if blocks:
        out[chapter_id] = blocks
        n_blocks += len(blocks)

Path("content/course.nl.json").write_text(
    json.dumps(out, ensure_ascii=False, separators=(",", ":")))

total = sum(sizes.get(cid, 0) for cid in sizes)
print(f"exam items translated:   {n_exam}/{len(exam['items'])}")
print(f"review items translated: {n_rev}/{len(reviews['items'])}")
print(f"course blocks translated: {n_blocks}/{total}"
      f"  ({n_blocks / total * 100:.1f}%)")
for cid, blocks in sorted(out.items()):
    print(f"   {cid:8s} {len(blocks):5d}/{sizes.get(cid, 0):<5d}")
