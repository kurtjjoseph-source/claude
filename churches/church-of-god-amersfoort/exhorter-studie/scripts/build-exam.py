"""Build content/exam.json: the 150 exam items, their answers, and a pointer to
the passage in the study guide that contains each answer.

The official Answer Key gives, for every item, the page in the *2019* guide
where the answer is found. This project uses the 2025 edition, which repaginated
Part Three by four to five pages, so the page number alone cannot be trusted.
Instead the key's page is used only to bound a search window, and the passage is
found by matching the wording of the item and its correct option against the
text of the guide.
"""
import json, re, sys, unicodedata
from pathlib import Path

SP = Path("/tmp/claude-0/-home-user-claude/a6ad3bdb-26e5-5798-b9a6-300f62f720e8/scratchpad")
exam_parsed = json.loads((SP / "exam_parsed.json").read_text())
course = json.loads(Path("content/course.en.json").read_text())

# Answer Key (September 2025). value = (correct option, pages in the 2019 guide)
KEY = {
 "I": {1:("A",[13]),2:("B",[13]),3:("A",[13]),4:("C",[15]),5:("B",[15]),6:("D",[16]),
   7:("C",[22]),8:("A",[22]),9:("B",[23]),10:("C",[23,24]),11:("A",[26]),12:("D",[26]),
   13:("A",[29]),14:("B",[29]),15:("C",[30]),16:("A",[30]),17:("C",[32]),18:("A",[37]),
   19:("B",[38]),20:("C",[39]),21:("A",[42]),22:("C",[43]),23:("C",[45]),24:("B",[45]),
   25:("A",[46]),26:("B",[48]),27:("A",[51]),28:("C",[51]),29:("B",[51]),30:("A",[51]),
   31:("B",[52]),32:("A",[52]),33:("B",[54]),34:("D",[53,54]),35:("D",[57]),36:("B",[57]),
   37:("C",[57]),38:("C",[57]),39:("D",[59,60]),40:("D",[60]),41:("C",[61]),42:("B",[61]),
   43:("A",[62]),44:("C",[63]),45:("A",[64]),46:("C",[64,65]),47:("A",[68]),48:("A",[69]),
   49:("D",[69]),50:("A",[71])},
 "II": {1:("D",[89]),2:("B",[89]),3:("A",[90]),4:("C",[93]),5:("A",[93]),6:("C",[95]),
   7:("B",[97]),8:("B",[97]),9:("A",[97]),10:("C",[98]),11:("A",[104]),12:("C",[103]),
   13:("C",[98]),14:("A",[163]),15:("B",[115,183]),16:("A",[97,183]),17:("B",[186]),
   18:("B",[186]),19:("C",[187]),20:("A",[188]),21:("A",[188]),22:("D",[191]),23:("B",[190]),
   24:("C",[194]),25:("B",[196]),26:("A",[203]),27:("C",[244]),28:("D",[245]),29:("B",[245]),
   30:("B",[245]),31:("D",[248,251]),32:("A",[250]),33:("C",[251]),34:("A",[257]),
   35:("C",[257]),36:("B",[261]),37:("A",[263]),38:("B",[263]),39:("A",[263]),40:("B",[263]),
   41:("B",[263]),42:("C",[265]),43:("B",[266]),44:("D",[266,267]),45:("A",[266]),
   46:("B",[268]),47:("C",[274]),48:("C",[230]),49:("A",[278]),50:("D",[224])},
 "III": {1:("B",[309]),2:("C",[310]),3:("B",[310]),4:("D",[311]),5:("C",[311]),6:("B",[311]),
   7:("B",[314]),8:("E",[314]),9:("D",[314,318]),10:("A",[315]),11:("C",[315]),12:("A",[314]),
   13:("B",[315]),14:("D",[317]),15:("C",[319]),16:("B",[320]),17:("B",[321]),18:("D",[322]),
   19:("A",[323]),20:("C",[325]),21:("A",[325]),22:("D",[327]),23:("B",[327]),24:("D",[328]),
   25:("C",[329]),26:("D",[331]),27:("A",[331]),28:("B",[334]),29:("A",[334]),30:("A",[332]),
   31:("A",[334]),32:("D",[343]),33:("A",[343]),34:("C",[344]),35:("B",[346]),36:("A",[349]),
   37:("C",[383]),38:("B",[383]),39:("B",[383]),40:("A",[383]),41:("B",[383]),42:("C",[383]),
   43:("A",[383]),44:("C",[384]),45:("D",[384]),46:("D",[384]),47:("B",[384]),48:("A",[384]),
   49:("D",[384]),50:("C",[384])},
}

# The 2025 edition repaginated Part Three; Parts One and Two line up.
EDITION_SHIFT = {"I": 0, "II": 0, "III": 4}
WINDOW = 7          # pages either side of the shifted key page

STOP = set("""a an the of to in is are was were be been and or for on at by with as that this these those
it its his her their our your my he she they we you i not no none all any each from into than then there
which who whom what when where how why should would could may might must can will shall do does did done
one two three following above below select statement best describes correct answer question""".split())

def norm(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9 ]", " ", s.lower())

def toks(s):
    return {w for w in norm(s).split() if len(w) > 2 and w not in STOP}

# flat index of every teaching block, with its chapter
INDEX = []
for ch in course["chapters"]:
    # "refs" is the Declaration of Faith scripture list: printed as reference
    # matter, but it is the source the last fourteen doctrine items are drawn from.
    if ch["kind"] != "text" and ch["id"] != "refs":
        continue
    for b in ch["blocks"]:
        INDEX.append((ch["id"], b["i"], b["p"], b["x"]))

def locate(part, n, q, ans_text):
    pages = KEY[part][n][1]
    shift = EDITION_SHIFT[part]
    lo = min(pages) + shift - WINDOW
    hi = max(pages) + shift + WINDOW
    qt = toks(q["prompt"])
    at = toks(ans_text)
    best, best_score = None, 0.0
    for cid, bi, page, text in INDEX:
        if not (lo <= page <= hi):
            continue
        bt = toks(text)
        if not bt:
            continue
        heading = text.isupper() or len(text) < 60
        # the answer's own wording matters most: it is what must appear
        hit_a = len(at & bt) / max(1, len(at))
        hit_q = len(qt & bt) / max(1, len(qt))
        score = 2.2 * hit_a + hit_q
        # a page the key names outright is a strong signal
        if page - shift in pages:
            score += 0.55
        if heading:
            score -= 0.9        # land on the prose that states the answer
        if score > best_score:
            best, best_score = (cid, bi, page), score
    return best, best_score

out = []
weak = []
for part in ("I", "II", "III"):
    for n in range(1, 51):
        q = exam_parsed[part][str(n)]
        ans = KEY[part][n][0]
        ans_text = next((c["text"] for c in q["choices"] if c["key"] == ans), "")
        loc, score = locate(part, n, q, ans_text)
        item = {
            "id": f"{part}.{n}", "part": part, "n": n,
            "prompt": {"en": q["prompt"], "nl": ""},
            "choices": [{"key": c["key"], "text": {"en": c["text"], "nl": ""}} for c in q["choices"]],
            "answer": ans,
            "keyPages2019": KEY[part][n][1],
            "source": ({"chapter": loc[0], "block": loc[1], "page": loc[2]} if loc else None),
            "matchScore": round(score, 3),
        }
        out.append(item)
        if score < 0.75:
            weak.append(item)

Path("content").mkdir(exist_ok=True)
Path("content/exam.json").write_text(json.dumps({"items": out}, ensure_ascii=False, indent=1))
print(f"items: {len(out)}   located: {sum(1 for i in out if i['source'])}")
print(f"weak matches (score < 0.75): {len(weak)}")
for i in weak[:25]:
    print(f"  {i['id']:7s} score={i['matchScore']:<6} key p{i['keyPages2019']} "
          f"-> {i['source']['chapter'] if i['source'] else '-'} p{i['source']['page'] if i['source'] else '-'}"
          f"  | {i['prompt']['en'][:60]}")
