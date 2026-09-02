"""Split the parsed blocks into the course's chapters, by printed page range."""
import json

CHAPTERS = [
  # id,      module,  start, end,  English title
  ("info",   "info",      5,  10, "General Information"),

  ("p1c1",   "part1",    13,  20, "The Minister: “Who Am I?”"),
  ("p1c2",   "part1",    21,  28, "The Minister: “What Is a Minister’s Role?”"),
  ("p1c3",   "part1",    29,  36, "The Minister: “How Do I Plan the Worship Service?”"),
  ("p1c4",   "part1",    37,  44, "The Minister: “How Do I Administer the Ordinances?”"),
  ("p1c5",   "part1",    45,  50, "The Minister: “How Do I Conduct Family Ministry?”"),
  ("p1c6",   "part1",    51,  56, "The Minister: “How Do I Bring Comfort?”"),
  ("p1c7",   "part1",    57,  76, "The Minister: “How Do I Serve as an Administrator?”"),

  ("p2c1",   "part2",    89,  92, "Introduction"),
  ("p2c2",   "part2",    93, 112, "Church of God History"),
  ("p2c3",   "part2",   113, 118, "International General Assembly: Organization and Functions"),
  ("p2c4",   "part2",   119, 124, "International General Council: Organization and Functions"),
  ("p2c5",   "part2",   125, 140, "Organizational Levels"),
  ("p2c6",   "part2",   141, 144, "Summary"),
  ("p2c7",   "part2",   145, 176, "Book of Church Order: Declaration of Faith and Church Teachings"),
  ("p2c8",   "part2",   177, 218, "Church Government—General (S1–S20)"),
  ("p2c9",   "part2",   219, 244, "Church Government—Ministry (S21–S31)"),
  ("p2c10",  "part2",   245, 258, "Church Government—State (S32–S45)"),
  ("p2c11",  "part2",   259, 286, "Church Government—Local (S46–S65)"),
  ("p2c12",  "part2",   287, 298, "Church Government—Personnel (S66–S73)"),

  ("p3c1",   "part3",   313, 346, "Declaration of Faith"),
  ("p3c2",   "part3",   347, 354, "Practical Commitments"),
]

# Question banks printed in the guide; kept apart from the teaching text.
BANKS = [
  ("bank1", "part1",  77,  86, "Part One Review Questions"),
  ("bank2", "part2", 299, 310, "Part Two Review Questions"),
  ("bank3", "part3", 355, 386, "Part Three Review Questions"),
  ("refs",  "part3", 387, 388, "Scripture References for the Declaration of Faith"),
]

blocks = json.load(open("sg_blocks.json"))

def slice_blocks(lo, hi):
    return [b for b in blocks if lo <= b["page"] <= hi]

out = []
for cid, mod, lo, hi, title in CHAPTERS + BANKS:
    bs = slice_blocks(lo, hi)
    out.append({"id": cid, "module": mod, "pageStart": lo, "pageEnd": hi,
                "title": title, "blocks": bs})
json.dump(out, open("sg_chapters.json", "w"), indent=0)

print(f"{'id':8s} {'module':7s} {'pages':>9s} {'blocks':>7s} {'chars':>8s}  title")
tot = 0
for c in out:
    n = sum(len(b["text"]) for b in c["blocks"])
    tot += n
    print(f"{c['id']:8s} {c['module']:7s} {c['pageStart']:4d}-{c['pageEnd']:<4d} "
          f"{len(c['blocks']):7d} {n:8d}  {c['title'][:52]}")
print(f"{'TOTAL':8s} {'':7s} {'':9s} {'':7s} {tot:8d}")
