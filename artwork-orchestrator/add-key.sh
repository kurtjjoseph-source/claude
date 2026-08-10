#!/usr/bin/env bash
# Artwork Orchestrator — add/update an API key in ~/.config/ai-images/env, safely.
# The key is prompted with hidden input, so it never lands in your shell history,
# in the terminal scrollback, or in any transcript.
#
# Usage:
#   ./add-key.sh                 # interactive: pick the provider, paste the key
#   ./add-key.sh openai          # jump straight to one provider
#   ./add-key.sh gemini|openai|openrouter
#
# Where to get each key (live links):
#   gemini      https://aistudio.google.com/apikey
#               (image models need billing ON: https://aistudio.google.com/plan)
#   openai      https://platform.openai.com/api-keys
#   openrouter  https://openrouter.ai/settings/keys
set -euo pipefail

ENV_FILE="$HOME/.config/ai-images/env"

# NOTE: macOS ships bash 3.2 — no associative arrays; keep this POSIX-friendly.
provider="${1:-}"
if [ -z "$provider" ]; then
  echo "Which provider key do you want to set?"
  echo "  1) gemini      — Nano Banana models   https://aistudio.google.com/apikey"
  echo "  2) openai      — GPT Image models     https://platform.openai.com/api-keys"
  echo "  3) openrouter  — fallback routing     https://openrouter.ai/settings/keys"
  echo "  4) etsy        — auto-publish keystring     https://www.etsy.com/developers/register"
  echo "  5) etsy-secret — auto-publish shared secret (same app page as the keystring)"
  read -rp "Choice [1-5]: " c
  case "$c" in 1) provider=gemini ;; 2) provider=openai ;; 3) provider=openrouter ;; 4) provider=etsy ;; 5) provider=etsy-secret ;;
    *) echo "Invalid choice." >&2; exit 1 ;; esac
fi
provider="$(echo "$provider" | tr '[:upper:]' '[:lower:]')"
case "$provider" in
  gemini)     VAR="GEMINI_API_KEY";     LINK="https://aistudio.google.com/apikey" ;;
  openai)     VAR="OPENAI_API_KEY";     LINK="https://platform.openai.com/api-keys" ;;
  openrouter) VAR="OPENROUTER_API_KEY"; LINK="https://openrouter.ai/settings/keys" ;;
  etsy)        VAR="ETSY_API_KEY";       LINK="https://www.etsy.com/developers/register (use the app KEYSTRING)" ;;
  etsy-secret) VAR="ETSY_SHARED_SECRET"; LINK="https://www.etsy.com/developers/your-apps (the app's SHARED SECRET)" ;;
  *) echo "Unknown provider '$provider' (use gemini|openai|openrouter|etsy|etsy-secret)." >&2; exit 1 ;;
esac

echo
echo "Get your key here if you don't have one yet:  $LINK"
read -rsp "Paste your $VAR (input hidden): " KEY
echo
KEY="$(echo -n "$KEY" | tr -d '[:space:]')"
[ -n "$KEY" ] || { echo "Empty input — nothing changed." >&2; exit 1; }

# Scaffold the file if it doesn't exist yet (same shape setup.sh creates).
if [ ! -f "$ENV_FILE" ]; then
  mkdir -p "$(dirname "$ENV_FILE")"
  cat > "$ENV_FILE" <<'EOF'
# Artwork Orchestrator — your own API keys (this file is NOT shared).
export GEMINI_API_KEY=""       # https://aistudio.google.com/apikey   (required)
export OPENAI_API_KEY=""       # https://platform.openai.com/api-keys (optional: GPT Image)
export OPENROUTER_API_KEY=""   # https://openrouter.ai/settings/keys  (optional: fallback)
EOF
fi

cp "$ENV_FILE" "$ENV_FILE.bak"
if grep -q "^export $VAR=" "$ENV_FILE"; then
  # Replace only the value, keep any trailing comment on the line.
  awk -v var="$VAR" -v key="$KEY" '
    $0 ~ "^export " var "=" {
      comment = ""
      if (match($0, /#.*$/)) comment = "   " substr($0, RSTART)
      print "export " var "=\"" key "\"" comment
      next
    } { print }' "$ENV_FILE.bak" > "$ENV_FILE"
else
  printf 'export %s="%s"\n' "$VAR" "$KEY" >> "$ENV_FILE"
fi
chmod 600 "$ENV_FILE"

echo "Saved $VAR (${#KEY} chars) -> $ENV_FILE   (backup: $ENV_FILE.bak)"
echo "Verify it's live:   ./check-keys.sh"
