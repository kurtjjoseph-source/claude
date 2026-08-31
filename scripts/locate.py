"""Shared passage locator.

Given a question and its answer, find the block of the study guide that states
that answer. Used for both the official exam items and the guide's own review
questions, so every question in the platform can point at the sentence it came
from.
"""
import re, unicodedata

STOP = set("""a an the of to in is are was were be been being and or for on at by with as that this these
those it its his her their our your my he she they we you i not no none all any each from into than then
there which who whom what when where how why should would could may might must can will shall do does did
done one two three following above below select statement best describes correct answer question also
""".split())

def norm(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9 ]", " ", s.lower())

def toks(s):
    return {w for w in norm(s).split() if len(w) > 2 and w not in STOP}

def locate(index, question, answer, pages, shift=0, window=7, page_bonus=0.55):
    """`index` is a list of (chapter_id, block_index, printed_page, text)."""
    lo = min(pages) + shift - window
    hi = max(pages) + shift + window
    qt, at = toks(question), toks(answer)
    best, best_score = None, 0.0
    for cid, bi, page, text in index:
        if not (lo <= page <= hi):
            continue
        bt = toks(text)
        if not bt:
            continue
        score = 2.2 * (len(at & bt) / max(1, len(at))) + (len(qt & bt) / max(1, len(qt)))
        if page - shift in pages:
            score += page_bonus
        if text.isupper() or len(text) < 60:
            score -= 0.9          # prefer the prose that states the answer
        if score > best_score:
            best, best_score = (cid, bi, page), score
    return best, best_score
