#!/usr/bin/env bash
# Artwork Orchestrator — verify the API keys in ~/.config/ai-images/env are LIVE.
# Never prints a key value; only lengths and live-check results.
#
# Usage:
#   ./check-keys.sh            # free checks: key present + valid against each API
#   ./check-keys.sh --probe    # ALSO makes one tiny real Gemini image call to prove
#                              # image quota/billing works (costs a few cents)
#
# What "valid" vs "image-ready" means for Gemini:
#   a key can be VALID but on the FREE tier, which has ZERO quota for image models
#   (gemini-3-pro-image / gemini-3.1-flash-image). Billing must be enabled on the
#   key's project: https://aistudio.google.com/plan  ->  upgrade to a paid plan.
#   Only --probe can prove image generation actually works end to end.
set -euo pipefail

ENV_FILE="$HOME/.config/ai-images/env"
PROBE=false
[ "${1:-}" = "--probe" ] && PROBE=true

[ -f "$ENV_FILE" ] || { echo "[!!] $ENV_FILE not found — run ./setup.sh first."; exit 1; }
# shellcheck disable=SC1090
source "$ENV_FILE"

status=0
line() { printf '  [%s]  %-11s %s\n' "$1" "$2" "$3"; }

echo "Artwork Orchestrator — key check ($ENV_FILE)"
echo

# ---- Gemini ---------------------------------------------------------------------
G="${GEMINI_API_KEY:-}"
if [ -z "$G" ]; then
  line '!!' gemini "EMPTY — get a key: https://aistudio.google.com/apikey"; status=1
else
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 \
         -H "x-goog-api-key: $G" \
         "https://generativelanguage.googleapis.com/v1beta/models")
  if [ "$code" = "200" ]; then
    line ok gemini "key valid (${#G} chars)"
    if $PROBE; then
      # Response can be ~1.5 MB of base64 — keep it in a file, not a shell var.
      RESP="$(mktemp)"; trap 'rm -f "$RESP"' EXIT
      curl -s --max-time 120 -o "$RESP" \
        -H "x-goog-api-key: $G" -H 'Content-Type: application/json' \
        -d '{"contents":[{"parts":[{"text":"a plain flat solid grey square, minimal"}]}],"generationConfig":{"responseModalities":["IMAGE"]}}' \
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent"
      verdict=$(python3 - "$RESP" <<'PYEOF'
import json, sys
try:
    d = json.load(open(sys.argv[1]))
except Exception:
    print("ERR|response was not JSON (network hiccup?) — re-run the probe"); sys.exit()
if any("inlineData" in p for c in d.get("candidates", [])
       for p in c.get("content", {}).get("parts", [])):
    print("OK|image generation is live"); sys.exit()
msg = d.get("error", {}).get("message", "")
if "free_tier" in json.dumps(d):
    print("ERR|FREE TIER, zero image quota -> enable billing: https://aistudio.google.com/plan")
else:
    print(f"ERR|{(msg or 'no image in response')[:120]}")
PYEOF
)
      if [ "${verdict%%|*}" = "OK" ]; then
        line ok gemini "image PROBE PASSED — ${verdict#*|}"
      else
        line '!!' gemini "image probe failed: ${verdict#*|}"; status=1
      fi
    else
      line '~ ' gemini "image quota unproven (free tier = 0) — run ./check-keys.sh --probe, or see https://aistudio.google.com/plan"
    fi
  else
    line '!!' gemini "key INVALID (HTTP $code) — regenerate: https://aistudio.google.com/apikey"; status=1
  fi
fi

# ---- OpenAI ---------------------------------------------------------------------
O="${OPENAI_API_KEY:-}"
if [ -z "$O" ]; then
  line '~ ' openai "empty (optional) — get a key: https://platform.openai.com/api-keys"
else
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 \
         -H "Authorization: Bearer $O" "https://api.openai.com/v1/models")
  if [ "$code" = "200" ]; then line ok openai "key valid (${#O} chars) — gpt-image-2 available"
  else line '!!' openai "key INVALID (HTTP $code) — https://platform.openai.com/api-keys"; status=1; fi
fi

# ---- OpenRouter -------------------------------------------------------------------
R="${OPENROUTER_API_KEY:-}"
if [ -z "$R" ]; then
  line '~ ' openrouter "empty (optional) — get a key: https://openrouter.ai/settings/keys"
else
  resp=$(curl -s --max-time 20 -H "Authorization: Bearer $R" "https://openrouter.ai/api/v1/key" || true)
  if echo "$resp" | grep -q '"data"'; then
    bal=$(echo "$resp" | python3 -c 'import json,sys
d=json.load(sys.stdin)["data"]
lim=d.get("limit"); use=d.get("usage",0)
print(f"usage ${use:.2f}" + (f" of ${lim:.2f} limit" if lim is not None else ", no limit set"))' 2>/dev/null || echo "key valid")
    line ok openrouter "key valid (${#R} chars) — $bal"
  else
    line '!!' openrouter "key INVALID — https://openrouter.ai/settings/keys"; status=1
  fi
fi

# ---- Etsy (auto-publishing) -------------------------------------------------------
E="${ETSY_API_KEY:-}"
ES="${ETSY_SHARED_SECRET:-}"
if [ -z "$E" ]; then
  line '~ ' etsy "empty (optional, auto-publish) — register an app: https://www.etsy.com/developers/register"
else
  # Etsy requires "keystring:shared_secret" in x-api-key when a secret is set.
  HDR="$E"; [ -n "$ES" ] && HDR="$E:$ES"
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 \
         -H "x-api-key: $HDR" "https://api.etsy.com/v3/application/openapi-ping")
  if [ "$code" = "200" ]; then
    if [ -f "$HOME/.config/ai-images/etsy-tokens.json" ]; then
      line ok etsy "key valid (${#E} chars), oauth tokens present"
    else
      line '~ ' etsy "key valid (${#E} chars) — authorize once: tooling/ad-creatives/.venv/bin/python tooling/etsy/publish-etsy.py auth"
    fi
  elif [ -z "$ES" ]; then
    line '!!' etsy "key rejected (HTTP $code) — Etsy also needs the app's SHARED SECRET: ./add-key.sh etsy-secret"; status=1
  else
    line '!!' etsy "key INVALID (HTTP $code) — https://www.etsy.com/developers/your-apps"; status=1
  fi
fi

echo
if [ $status -eq 0 ]; then echo "key check: PASS"
else echo "key check: ACTION NEEDED — fix the [!!] items above (links inline)"; fi
exit $status
