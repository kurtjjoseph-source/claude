#!/bin/zsh
# Publish a standalone wizard.html to Vercel, the way every VOM wizard ships.
#
# Wizards are authored as artifact fragments (they start at <title>, with no
# <!doctype>/<head>/<body>), because the artifact host supplies the shell.
# Vercel serves the file raw, so this wraps it into a real document first.
#
# Usage:  ./deploy-wizard.sh <wizard.html> <slug> <alias-host> <light-hex> <dark-hex> "<description>"
# e.g.    ./deploy-wizard.sh "../Graph Engineering (Greg Isenberg)/wizard.html" \
#             graph-bench vom-graph-bench.vercel.app "#E7E9E2" "#0E120F" "Turn one AI workflow into a managed graph."
set -e

SRC="$1"; SLUG="$2"; HOST="$3"; LIGHT="${4:-#FFFFFF}"; DARK="${5:-#111111}"; DESC="$6"
[[ -f "$SRC" ]] || { echo "!! no such wizard: $SRC"; exit 1 }

DIR="${SRC:h}/$SLUG"
mkdir -p "$DIR"
printf '.vercel\n' > "$DIR/.gitignore"

SRC="$SRC" OUT="$DIR/index.html" DESC="$DESC" LIGHT="$LIGHT" DARK="$DARK" python3 - <<'PY'
import os, html
src  = open(os.environ["SRC"], encoding="utf-8").read()
i    = src.index("</title>") + len("</title>")
title, rest = src[:i], src[i:].lstrip("\n")
desc = html.escape(os.environ["DESC"], quote=True)
icon = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E"
        "%3Crect width='32' height='32' rx='4' fill='" + os.environ["DARK"].replace("#", "%23") + "'/%3E%3C/svg%3E")
open(os.environ["OUT"], "w", encoding="utf-8").write(
f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
{title}
<meta name="description" content="{desc}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="{os.environ['LIGHT']}" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="{os.environ['DARK']}" media="(prefers-color-scheme: dark)">
<link rel="icon" href="{icon}">
</head>
<body>
{rest}
</body>
</html>
""")
print(f"   wrapped -> {os.environ['OUT']}")
PY

cd "$DIR"
vercel deploy --prod --yes >/dev/null 2>&1 || true
URL=$(vercel ls --format json 2>/dev/null | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['deployments'][0]['url'] if d.get('deployments') else '')" 2>/dev/null)
[[ -z "$URL" ]] && URL=$(vercel ls 2>/dev/null | grep -oE 'https://[a-z0-9-]+-projects\.vercel\.app' | head -1)
[[ -z "$URL" ]] && { echo "!! deploy produced no URL for $SLUG"; exit 1 }
[[ "$URL" != https://* ]] && URL="https://$URL"

# New Vercel projects default to SSO protection, which puts the site behind a
# login wall. Every VOM site is public, so turn it off before aliasing.
vercel project protection disable --sso >/dev/null 2>&1 || true
vercel alias set "$URL" "$HOST" >/dev/null 2>&1 || true

sleep 2
CODE=$(curl -s -o /dev/null -w '%{http_code}' "https://$HOST")
echo "  ✓ $SLUG  ->  https://$HOST  (HTTP $CODE)"
