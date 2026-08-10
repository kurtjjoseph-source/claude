#!/bin/zsh
# One reliable command to publish the whole house via the Vercel CLI.
# Rebuilds every page from _build/products.json, deploys each to production,
# and pins the clean vom-* alias to the fresh deployment.
#
# Usage:  ./deploy-all.sh            # rebuild + deploy everything
#         ./deploy-all.sh hub        # rebuild + deploy just one (folder name)
set -e
ROOT="${0:A:h}"
cd "$ROOT"

# folder -> clean alias host
typeset -A ALIAS=(
  hub                   vom-systems.vercel.app
  hundred               vom-hundred.vercel.app
  turnkey               vom-turnkey.vercel.app
  church-media-academy  vom-church-media-academy.vercel.app
  operators-academy     vom-operators-academy.vercel.app
  launch-kits           vom-launch-kits.vercel.app
  vital                 vom-vital.vercel.app
)
# hub first so the canonical products.json is live before the pages that fetch it
ORDER=(hub hundred turnkey church-media-academy operators-academy launch-kits vital)

echo "» rebuilding from _build/products.json"
node _build/build.js >/dev/null

targets=("$@")
[[ ${#targets} -eq 0 ]] && targets=($ORDER)

for f in $targets; do
  host=$ALIAS[$f]
  [[ -z $host ]] && { echo "!! unknown target: $f"; continue; }
  cd "$ROOT/$f"
  url=$(vercel deploy --prod --yes 2>/dev/null | grep -oE 'https://[a-z0-9-]+-projects\.vercel\.app' | tail -1)
  if [[ -n $url ]]; then
    vercel alias set "$url" "$host" >/dev/null 2>&1 || true
    code=$(curl -s -o /dev/null -w '%{http_code}' "https://$host")
    echo "  ✓ $f  ->  https://$host  (HTTP $code)"
  else
    echo "  ✗ $f  deploy failed"
  fi
  cd "$ROOT"
done
echo "» done."
