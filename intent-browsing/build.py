#!/usr/bin/env python3
# ============================================================================
# build.py — intent-based browsing prototype (Vision Outreach Media)
#
# Assembles the six source pieces into ONE self-contained page.
#
#   src/shell.html          the artifact fragment (starts at <title>)
#   src/vom-kit-v2.css      the house design system   -> <style>
#   src/app.css             this page's layout layer  -> <style>
#   src/fixtures.js  \
#   src/resolve.js    \
#   src/workspace.js   >    concatenated IN THIS ORDER -> <script>
#   src/standing.js   /
#   src/intent-bar.js/
#   src/logo.datauri.txt    replaces __LOGO_DATA_URI__
#
# Two outputs, identical in content:
#
#   wizard.html         ARTIFACT FRAGMENT — starts at <title>, no doctype/head/
#                       body. This is the deploy artifact. vom-systems/
#                       deploy-wizard.sh splits it at "</title>" and supplies
#                       the document shell itself, so a fragment is required.
#   wizard.local.html   the same content inside a real document, so the page
#                       can be opened and tested from a file:// path.
#
# Dependency-free. Python 3.8+.  Run:  python3 build.py
# ============================================================================

import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")

SHELL = "shell.html"
CSS_FILES = ["vom-kit-v2.css", "app.css"]
# Load order is part of the module contract. Do not reorder.
JS_FILES = ["fixtures.js", "resolve.js", "workspace.js", "standing.js", "intent-bar.js"]
LOGO = "logo.datauri.txt"

CSS_MARK = "<!--INLINE_CSS-->"
JS_MARK = "<!--INLINE_JS-->"
LOGO_MARK = "__LOGO_DATA_URI__"

OUT_FRAGMENT = os.path.join(ROOT, "wizard.html")
OUT_LOCAL = os.path.join(ROOT, "wizard.local.html")


class BuildError(Exception):
    pass


def die(msg, *details):
    print("\n  !! BUILD FAILED\n", file=sys.stderr)
    print("     " + msg, file=sys.stderr)
    for d in details:
        print("       - " + str(d), file=sys.stderr)
    print("", file=sys.stderr)
    sys.exit(1)


def read(path, what):
    if not os.path.isfile(path):
        raise BuildError(
            "missing source file: %s  (needed for %s)" % (os.path.relpath(path, ROOT), what)
        )
    with open(path, "r", encoding="utf-8") as fh:
        return fh.read()


# --------------------------------------------------------------- collect ---

def collect():
    missing = []

    def want(name):
        p = os.path.join(SRC, name)
        if not os.path.isfile(p):
            missing.append("src/" + name)
        return p

    paths = {
        "shell": want(SHELL),
        "logo": want(LOGO),
        "css": [want(n) for n in CSS_FILES],
        "js": [want(n) for n in JS_FILES],
    }
    if missing:
        die(
            "%d source file(s) are missing. Another builder has not written them yet."
            % len(missing),
            *missing
        )
    return paths


# ----------------------------------------------------------------- inline ---

def build_css(paths):
    chunks = []
    for name, path in zip(CSS_FILES, paths["css"]):
        chunks.append("/* ==== src/%s ==== */\n%s" % (name, read(path, "the style block").rstrip()))
    return "<style>\n" + "\n\n".join(chunks) + "\n</style>"


def build_js(paths):
    # One IIFE around the whole concatenation. Safe because every file talks to
    # the others only through window.IB (the module contract), so nothing needs
    # to be a true global. Each file keeps a boundary comment so the built page
    # stays debuggable, and a leading ";" so a file that ends without one cannot
    # swallow the next file's opening paren.
    chunks = []
    for name, path in zip(JS_FILES, paths["js"]):
        body = read(path, "the script block").strip()
        chunks.append(
            "/* ==================== src/%s ==================== */\n;%s" % (name, body)
        )
    inner = "\n\n".join(chunks)
    return (
        "<script>\n"
        "/* Built by build.py — %d files, concatenated in contract order:\n"
        "   %s\n"
        "   Wrapped in one IIFE; every cross-file reference goes through window.IB. */\n"
        "(function(){\n%s\n})();\n"
        "</script>"
    ) % (len(JS_FILES), " -> ".join(JS_FILES), inner)


def build_logo(paths):
    raw = read(paths["logo"], "the VOM mark")
    uri = "".join(raw.split())  # strip every newline / space / tab
    if not uri:
        raise BuildError("src/%s is empty — the VOM mark cannot be inlined." % LOGO)
    if not uri.startswith("data:"):
        raise BuildError(
            "src/%s does not start with 'data:' — it must be a data URI, not a path or URL." % LOGO
        )
    return uri


# ------------------------------------------------------------- validation ---

RE_LINK_CSS = re.compile(r"<link\b[^>]*\brel\s*=\s*[\"']?stylesheet", re.I)
RE_SCRIPT_SRC = re.compile(r"<script\b[^>]*\bsrc\s*=", re.I)
RE_ATTR_URL = re.compile(
    r"\b(src|href|srcset|action|formaction|poster|manifest|ping|data)\s*=\s*[\"']?\s*(https?:)?//",
    re.I,
)
RE_CSS_URL = re.compile(r"url\(\s*[\"']?\s*(https?:)?//", re.I)
RE_IMPORT = re.compile(r"@import\s+(?:url\()?\s*[\"']?\s*(https?:)?//", re.I)
RE_XMLNS = re.compile(r"xmlns(:[\w-]+)?\s*=\s*[\"']?\s*$", re.I)
RE_NET = re.compile(
    r"\b(fetch\s*\(|XMLHttpRequest|new\s+WebSocket|new\s+EventSource|importScripts\s*\(|navigator\.sendBeacon)",
)

# The accent slot. vom-kit-v2.css ships the selector [data-brand="vom"] itself,
# so looking for that string anywhere in the built document always succeeds and
# guards nothing. Only an ASSIGNMENT counts: a real attribute in real markup, or
# a setAttribute call in a script.
RE_BRAND_ATTR = re.compile(r"""<[^>]*\bdata-brand\s*=\s*["']\s*vom\s*["']""", re.I)
RE_BRAND_SET = re.compile(
    r"""setAttribute\s*\(\s*["']data-brand["']\s*,\s*["']\s*vom\s*["']\s*\)""", re.I
)

# ------------------------------------------------------------- palette guard
# BRIEF: "Palette, type, spacing come from src/vom-kit-v2.css only. No new
# colours." vom-kit-v2.css is the source of truth and is exempt; everything
# else the build inlines must express colour as a var() or a color-mix() of
# them. Comments are exempt — naming a hex while explaining a rule is fine.
RE_HEX = re.compile(r"(?<![&\w])#[0-9a-fA-F]{3,8}\b")     # (?<!&) spares &#9681;
RE_COLOR_FN = re.compile(r"\b(?:rgba?|hsla?)\s*\(")
RE_DECL = re.compile(r"([-a-zA-Z]+)\s*:\s*([^;{}]{0,160})")

# A named colour only means anything in a colour-bearing property, so anchoring
# there is what keeps "the red flag" in a fixture sentence from failing a build.
COLOUR_PROPS = re.compile(
    r"^(?:-\w+-)?(?:color|fill|stroke|background|background-image|border|border-top|"
    r"border-right|border-bottom|border-left|border-block|border-inline|outline|"
    r"box-shadow|text-shadow|column-rule|text-decoration|caret-color|accent-color|"
    r"scrollbar-color|.*-color)$", re.I
)
NAMED_COLOURS = set("""
aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue
blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk
crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki
darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen
darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue
dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite
gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki
lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan
lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen
lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen
magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen
mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream
mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid
palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum
powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown
seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen
steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow
yellowgreen
""".split())


def _line_of(text, idx):
    return text.count("\n", 0, idx) + 1


def _excerpt(text, idx, span=60):
    lo = max(0, idx - 20)
    hi = min(len(text), idx + span)
    return text[lo:hi].replace("\n", " ")


def markup_only(doc):
    """The document with <script>/<style> bodies and HTML comments blanked out,
    so a tag NAMED in prose or in a CSS comment is not mistaken for real markup."""
    out = re.sub(r"<script\b[^>]*>.*?</script\s*>", " ", doc, flags=re.S | re.I)
    out = re.sub(r"<style\b[^>]*>.*?</style\s*>", " ", out, flags=re.S | re.I)
    out = re.sub(r"<!--.*?-->", " ", out, flags=re.S)
    return out


def _blank_span(s):
    """The same text with every character replaced by a space, newlines kept.
    Blanking rather than deleting is what lets every guard below report a line
    number that still points at the real line in the real source file."""
    return "".join("\n" if ch == "\n" else " " for ch in s)


def _blank(pattern, text, flags=0):
    return re.sub(pattern, lambda m: _blank_span(m.group(0)), text, flags=flags)


def decomment(text):
    """Blank /* */ blocks, whole-line // comments and <!-- --> so a guard never
    fires on prose that merely NAMES the thing it forbids. Only whole-line //
    comments go, because a trailing // may live inside a string literal."""
    out = _blank(r"/\*.*?\*/", text, re.S)
    out = _blank(r"<!--.*?-->", out, re.S)
    out = _blank(r"(?m)^[ \t]*//.*$", out)
    return out


def script_only(text):
    """The inverse of markup_only(): everything EXCEPT <script> bodies blanked.

    The demo-honesty rule in BRIEF.md tells the authors to state in body copy
    that this page makes no network request — the shell's footer does exactly
    that. Body prose is not code, so a network verb written there must not read
    as a call. Offsets are preserved, so line numbers stay true."""
    out = list(_blank_span(text))
    for m in re.finditer(r"<script\b[^>]*>(.*?)</script\s*>", text, re.S | re.I):
        a, b = m.start(1), m.end(1)
        out[a:b] = list(text[a:b])
    return "".join(out)


def _blank_template_text(text):
    """Blank the literal TEXT of `template literals` while KEEPING every ${…}
    interpolation, because an interpolation is code and may legitimately need
    to be guarded. Backticks are covered deliberately: quoted prose is quoted
    prose whichever of the three quote characters wrote it."""
    out = list(text)
    i, n = 0, len(text)
    while i < n:
        if text[i] != "`":
            i += 1
            continue
        j, depth = i + 1, 0
        while j < n:
            c = text[j]
            if c == "\\":
                if depth == 0 and text[j] != "\n":
                    out[j] = " "
                    if j + 1 < n and text[j + 1] != "\n":
                        out[j + 1] = " "
                j += 2
                continue
            if depth == 0:
                if c == "`":
                    break
                if c == "$" and j + 1 < n and text[j + 1] == "{":
                    depth = 1
                    j += 2
                    continue
                if c != "\n":
                    out[j] = " "          # literal text -> blanked
                j += 1
                continue
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
            j += 1                        # inside ${…} -> kept verbatim
        i = j + 1
    return "".join(out)


def code_only(text):
    """JS with every string literal blanked, so a quoted English sentence cannot
    trip a guard while real code still does. Single- and double-quoted literals
    cannot span a line in JS, so those patterns are bounded and cannot run away;
    template literals are handled separately so ${…} survives."""
    out = _blank(r"'(?:\\.|[^'\\\n])*'|\"(?:\\.|[^\"\\\n])*\"", text)
    return _blank_template_text(out)


def guard_sources(paths):
    """The two HARD CONSTRAINTS from BRIEF.md that no other check enforces.
    Both run over the sources this build inlines, EXCEPT vom-kit-v2.css — the
    kit is the source of truth for the palette and is exempt by definition."""
    passed = []

    scanned = [("src/" + SHELL, paths["shell"])]
    scanned += [("src/" + CSS_FILES[i], paths["css"][i])
                for i in range(len(CSS_FILES)) if CSS_FILES[i] != "vom-kit-v2.css"]
    scanned += [("src/" + JS_FILES[i], paths["js"][i]) for i in range(len(JS_FILES))]

    # --- (a) palette: no raw colour anywhere but the kit ---------------------
    offenders = []
    for label, path in scanned:
        text = decomment(read(path, "the palette guard"))
        for m in RE_HEX.finditer(text):
            offenders.append("%s:%d  raw hex %s   %s"
                             % (label, _line_of(text, m.start()), m.group(0), _excerpt(text, m.start(), 40)))
        for m in RE_COLOR_FN.finditer(text):
            offenders.append("%s:%d  %s…)   %s"
                             % (label, _line_of(text, m.start()), m.group(0).strip(), _excerpt(text, m.start(), 40)))
        for m in RE_DECL.finditer(text):
            prop, value = m.group(1), m.group(2)
            if not COLOUR_PROPS.match(prop):
                continue
            # Token NAMES legitimately contain colour words (--brand-navy), and
            # so do custom-property references. Strip every var(--…) reference
            # and every bare --ident before looking for a real named colour.
            probe = re.sub(r"var\(\s*--[\w-]+", " ", value)
            probe = re.sub(r"--[\w-]+", " ", probe)
            for word in re.findall(r"[a-zA-Z]+", probe):
                if word.lower() in NAMED_COLOURS:
                    offenders.append("%s:%d  named colour '%s' in %s:%s"
                                     % (label, _line_of(text, m.start()), word, prop, value.strip()[:48]))
    if offenders:
        raise BuildError(
            "PALETTE: %d raw colour(s) outside vom-kit-v2.css. The adoption rule is that a page "
            "may add layout, never a second palette — every colour must be a var(--…) token or a "
            "color-mix() of them. If the token you need is missing, add it to the kit first."
            % len(offenders),
            *offenders[:12]
        )
    passed.append("palette: no hex / rgb() / hsl() / named colour outside vom-kit-v2.css")

    # --- (b) network: none, at all ------------------------------------------
    # CODE CONTEXT ONLY. This page's whole thesis is that it makes no request,
    # so the honest copy naturally names the very APIs the guard forbids — the
    # shell's footer says so, and a fixture may too. Comments, HTML body prose
    # and string literals are therefore carved out, exactly as markup_only()
    # is for the fragment shape and COLOUR_PROPS is for named colours. Every
    # carve-out blanks in place, so the line numbers below stay true.
    net = []
    for label, path in scanned:
        raw = read(path, "the network guard")
        text = decomment(raw)
        if label.lower().endswith((".html", ".htm")):
            text = script_only(text)      # body prose is not code
        for m in RE_NET.finditer(code_only(text)):
            net.append("%s:%d  %s   %s"
                       % (label, _line_of(raw, m.start()), m.group(1).strip(),
                          _excerpt(raw, m.start(), 40)))
    if net:
        raise BuildError(
            "NETWORK: %d network-capable call(s) in CODE. BRIEF: 'no CDN, no external fonts, no "
            "network requests of any kind', and all resolution is deterministic lookup against "
            "fixtures. (Naming these APIs in prose, a comment or a string is fine — this is a "
            "real call.)" % len(net),
            *net[:12]
        )
    passed.append("network: no fetch / XHR / WebSocket / EventSource / sendBeacon in code "
                  "(comments, body prose and string literals exempt)")

    return passed


def validate(doc):
    """Returns the list of checks that passed. Raises BuildError on the first
    real problem, with a message that says exactly where to look."""
    passed = []

    # 1 — the fragment shape deploy-wizard.sh depends on
    head = doc.lstrip()
    if not head.startswith("<title"):
        raise BuildError(
            "wizard.html must be an ARTIFACT FRAGMENT starting at <title> "
            "(vom-systems/deploy-wizard.sh splits on </title> and supplies the shell). "
            "It currently starts with: %r" % head[:60]
        )
    if "</title>" not in doc:
        raise BuildError("no closing </title> — deploy-wizard.sh has nothing to split on.")
    bare = markup_only(doc)
    for tag in ("<!doctype", "<html", "<head", "<body"):
        if re.search(re.escape(tag) + r"[\s>]", bare, re.I):
            raise BuildError(
                "wizard.html contains %r. The deploy shell supplies doctype/html/head/body; "
                "the fragment must not." % tag
            )
    passed.append("fragment shape (starts at <title>, no doctype/html/head/body)")

    # 2 — placeholders all consumed
    for mark in (CSS_MARK, JS_MARK, LOGO_MARK):
        if mark in doc:
            raise BuildError("placeholder %s survived into the output — substitution failed." % mark)
    passed.append("no placeholder survived (%s, %s, %s)" % (CSS_MARK, JS_MARK, LOGO_MARK))

    # 3 — no external stylesheet / script
    m = RE_LINK_CSS.search(doc)
    if m:
        raise BuildError(
            "output contains <link rel=\"stylesheet\"> at line %d — the page must be self-contained.\n"
            "         %s" % (_line_of(doc, m.start()), _excerpt(doc, m.start()))
        )
    m = RE_SCRIPT_SRC.search(doc)
    if m:
        raise BuildError(
            "output contains <script src=…> at line %d — the page must be self-contained.\n"
            "         %s" % (_line_of(doc, m.start()), _excerpt(doc, m.start()))
        )
    passed.append("no <link rel=stylesheet>, no <script src=>")

    # 4 — no external reference in any URL-bearing position.
    #     http(s) is allowed in visible prose and in xmlns declarations only.
    offenders = []
    for rx, what in ((RE_ATTR_URL, "attribute"), (RE_CSS_URL, "css url()"), (RE_IMPORT, "@import")):
        for m in rx.finditer(doc):
            # xmlns="http://www.w3.org/2000/svg" is a namespace name, not a fetch.
            before = doc[max(0, m.start() - 24):m.start()]
            if RE_XMLNS.search(before):
                continue
            offenders.append("line %d (%s): %s" % (_line_of(doc, m.start()), what, _excerpt(doc, m.start())))
    if offenders:
        raise BuildError(
            "output references %d external resource(s). No CDN, no external font, no network."
            % len(offenders),
            *offenders[:8]
        )
    passed.append("no external reference in src/href/url() (prose + xmlns exempt)")

    # 5 — the mark is actually present
    if "data:image/" not in doc:
        raise BuildError(
            "no data: image in the output — the real VOM mark was never placed. "
            "Check that the shell uses __LOGO_DATA_URI__."
        )
    passed.append("VOM mark inlined as a data URI")

    return passed


def advisories(doc):
    """Non-fatal. Things that are almost certainly wrong but belong to another
    builder's file, so this script reports rather than blocks."""
    notes = []
    # The accent slot. Look for an ASSIGNMENT only: the attribute in real markup
    # (markup_only, so the kit's own [data-brand="vom"] SELECTOR — which lives in
    # a <style> block and would satisfy any naive search unconditionally — cannot
    # stand in for one), or a setAttribute call in a script.
    if not (RE_BRAND_ATTR.search(markup_only(doc)) or RE_BRAND_SET.search(doc)):
        notes.append(
            "nothing ASSIGNS data-brand=\"vom\" — the accent falls back to the kit default, not VOM "
            "orange. The shell or intent-bar.js must put it on the root element."
        )
    # (network calls are no longer an advisory — guard_sources() fails on them)
    for bad in ("<link rel=\"preconnect\"", "<link rel='preconnect'", "@font-face"):
        if bad.lower() in doc.lower():
            notes.append("output contains %s — check it needs no network" % bad)
    if "scripted demonstration" not in doc.lower():
        notes.append("the phrase 'scripted demonstration' does not appear — the demo honesty rule (BRIEF) may be unmet")
    return notes


# ------------------------------------------------------------------ shell ---

LOCAL_SHELL = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
{title}
<meta name="color-scheme" content="light dark">
<!-- wizard.local.html — the SAME fragment as wizard.html, wrapped in a document
     so it can be opened from a file:// path. wizard.html stays the fragment
     because vom-systems/deploy-wizard.sh supplies this shell at deploy time.
     Do not edit either file by hand; both are written by build.py. -->
</head>
<body>
{rest}
</body>
</html>
"""


def wrap_local(fragment):
    i = fragment.index("</title>") + len("</title>")
    title, rest = fragment[:i].lstrip(), fragment[i:].lstrip("\n")
    return LOCAL_SHELL.format(title=title, rest=rest)


# ------------------------------------------------------------------- main ---

def main():
    paths = collect()
    try:
        # Source-level guards run first: they need to know WHICH file a colour
        # or a network call came from, which the concatenated output no longer
        # says, and they must exempt vom-kit-v2.css precisely.
        source_checks = guard_sources(paths)

        shell = read(paths["shell"], "the page frame")

        for mark, owner in ((CSS_MARK, "the style block"), (JS_MARK, "the script block")):
            if mark not in shell:
                raise BuildError(
                    "src/%s does not contain the placeholder %s (needed for %s). "
                    "The shell must carry it verbatim." % (SHELL, mark, owner)
                )
            if shell.count(mark) > 1:
                raise BuildError(
                    "src/%s contains %s %d times — it must appear exactly once."
                    % (SHELL, mark, shell.count(mark))
                )

        doc = shell.replace(CSS_MARK, build_css(paths))
        doc = doc.replace(JS_MARK, build_js(paths))

        logo = build_logo(paths)
        n_logo = doc.count(LOGO_MARK)
        doc = doc.replace(LOGO_MARK, logo)

        doc = doc.lstrip()
        if not doc.endswith("\n"):
            doc += "\n"

        checks = source_checks + validate(doc)
        local = wrap_local(doc)

        # The two outputs may never diverge in content. wizard.local.html is
        # wizard.html with a document shell spliced in after </title>, so both
        # halves must appear in it verbatim.
        cut = doc.index("</title>") + len("</title>")
        if doc[:cut] not in local or doc[cut:].strip() not in local:
            raise BuildError(
                "wizard.local.html does not contain wizard.html verbatim — the two outputs diverged."
            )

    except BuildError as e:
        # A BuildError raised with details carries them as extra args. str(e)
        # would render the whole tuple on one line, so unpack it back into
        # die()'s (message, *details) shape and keep the per-offender lines.
        die(e.args[0] if e.args else str(e), *e.args[1:])

    with open(OUT_FRAGMENT, "w", encoding="utf-8") as fh:
        fh.write(doc)
    with open(OUT_LOCAL, "w", encoding="utf-8") as fh:
        fh.write(local)

    notes = advisories(doc)

    print("")
    print("  VOM · intent-based browsing — build report")
    print("  " + "-" * 62)
    print("  wizard.html        %7d bytes   (artifact fragment, for deploy-wizard.sh)" % len(doc.encode("utf-8")))
    print("  wizard.local.html  %7d bytes   (wrapped document, for file:// testing)" % len(local.encode("utf-8")))
    print("  css inlined        %7d files   %s" % (len(CSS_FILES), ", ".join(CSS_FILES)))
    print("  js inlined         %7d files   %s" % (len(JS_FILES), " -> ".join(JS_FILES)))
    print("  logo substitutions %7d" % n_logo)
    print("  " + "-" * 62)
    for c in checks:
        print("  ok   " + c)
    for n in notes:
        print("  warn " + n)
    print("")


if __name__ == "__main__":
    main()
