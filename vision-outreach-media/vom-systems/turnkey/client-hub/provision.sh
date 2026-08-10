#!/usr/bin/env bash
# provision.sh — build a per-tenant Client Business Hub bundle.
#
# Usage:
#   ./provision.sh <idea-folder> <out-dir>
#
# Reads <idea-folder>/business-operating-profile.json and produces a standalone,
# per-tenant hub bundle in <out-dir>:
#   <out-dir>/index.html   — a copy of this directory's index.html, with a
#                            <script src="tenant.js"></script> tag injected right
#                            before its main inline <script>.
#   <out-dir>/tenant.js    — `window.__TENANT__ = <profile JSON>;`
#
# On boot, index.html reads window.__TENANT__ first (before ever probing a backend),
# so this bundle renders that tenant's business name and only its client_hub[] modules
# on a fresh load — with or without a backend present at /api.
#
# This script only reads the idea folder and writes into <out-dir>. It never touches
# this directory's own index.html, api/, or package.json.

set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage: ./provision.sh <idea-folder> <out-dir>

  <idea-folder>   A business idea folder containing business-operating-profile.json
  <out-dir>       Where to write the provisioned per-tenant bundle (created if missing)

Example:
  ./provision.sh "../../Business Ideas/Grace Community Church" ./dist/grace-community-church
EOF
  exit 1
}

err() { echo "provision.sh: error: $*" >&2; }

if [ "$#" -ne 2 ]; then
  usage
fi

IDEA_DIR="$1"
OUT_DIR="$2"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_HTML="$SCRIPT_DIR/index.html"
PROFILE_JSON="$IDEA_DIR/business-operating-profile.json"

# ---- sanity checks -------------------------------------------------------

if [ ! -f "$SRC_HTML" ]; then
  err "source index.html not found next to this script at: $SRC_HTML"
  exit 1
fi

if [ ! -d "$IDEA_DIR" ]; then
  err "idea folder not found: $IDEA_DIR"
  exit 1
fi

if [ ! -f "$PROFILE_JSON" ]; then
  err "missing $PROFILE_JSON"
  err "every idea folder needs a business-operating-profile.json to provision a hub."
  exit 1
fi

# Validate the profile is actually valid JSON (and, minimally, a JSON object) before
# we bake it into a <script> tag. Prefer node (repo standard), fall back to python3.
validate_json() {
  local file="$1"
  if command -v node >/dev/null 2>&1; then
    node -e '
      const fs = require("fs");
      const raw = fs.readFileSync(process.argv[1], "utf8");
      let parsed;
      try { parsed = JSON.parse(raw); } catch (e) { console.error(e.message); process.exit(1); }
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        console.error("profile JSON must be a JSON object, got " + (Array.isArray(parsed) ? "an array" : typeof parsed));
        process.exit(1);
      }
    ' "$file"
    return $?
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c '
import json, sys
with open(sys.argv[1], "r", encoding="utf-8") as f:
    raw = f.read()
try:
    parsed = json.loads(raw)
except Exception as e:
    print(e, file=sys.stderr)
    sys.exit(1)
if not isinstance(parsed, dict):
    print("profile JSON must be a JSON object, got " + type(parsed).__name__, file=sys.stderr)
    sys.exit(1)
' "$file"
    return $?
  else
    err "neither node nor python3 is available to validate JSON — cannot safely provision."
    exit 1
  fi
}

if ! validate_json "$PROFILE_JSON" 2>/tmp/provision-json-err.$$; then
  err "$PROFILE_JSON is not a valid business-operating-profile.json:"
  sed 's/^/  /' /tmp/provision-json-err.$$ >&2 || true
  rm -f /tmp/provision-json-err.$$
  exit 1
fi
rm -f /tmp/provision-json-err.$$

# ---- build the bundle -----------------------------------------------------

mkdir -p "$OUT_DIR"
cp "$SRC_HTML" "$OUT_DIR/index.html"

{
  printf 'window.__TENANT__ = '
  cat "$PROFILE_JSON"
  printf ';\n'
} > "$OUT_DIR/tenant.js"

# Inject <script src="tenant.js"></script> immediately before the main inline <script>
# tag (there is exactly one bare `<script>` in index.html — its main script). Using
# perl -0777 so the whole file is one string and the non-`g` substitution touches only
# the first match.
if ! perl -0777 -pe 's/<script>/<script src="tenant.js"><\/script>\n<script>/' -i "$OUT_DIR/index.html"; then
  err "failed to inject tenant.js <script> tag into $OUT_DIR/index.html"
  exit 1
fi

if ! grep -q '<script src="tenant.js"></script>' "$OUT_DIR/index.html"; then
  err "tenant.js script tag was not found in the provisioned bundle — provisioning failed."
  exit 1
fi

echo "Provisioned client hub bundle:"
echo "  $OUT_DIR/index.html"
echo "  $OUT_DIR/tenant.js   (window.__TENANT__ <- $PROFILE_JSON)"
