#!/bin/sh
# Assemble everything GitHub Pages serves at https://us-tin.org/ into mobile/pages/:
#
#   /           the website (../site): home page, legal pages, install guide, and CNAME (the custom domain)
#   /app/       the app's web build (Expo export with EXPO_BASE_URL=/app)
#   /404.html   the app's page plus redirect.js, so a deep link survives a refresh and an old link from before
#               the app moved (/pin/123456) lands on its new address (/app/pin/123456)
#
# BASE_PATH is where the site sits on its host: empty for the custom domain (the default), or e.g. /ustin to serve it
# from austnn-xu.github.io/ustin without one.
#
# Preview the result locally with: node scripts/preview-pages.mjs   (serves it at http://localhost:4173/)
set -e
cd "$(dirname "$0")/.."
ROOT=$(git rev-parse --show-toplevel)
OUT=pages
BASE_PATH=${BASE_PATH:-}
export BASE_PATH

rm -rf dist "$OUT"
node scripts/web-assets.mjs
EXPO_OFFLINE=1 EXPO_BASE_URL=$BASE_PATH/app npx expo export --platform web
EXPO_BASE_URL=$BASE_PATH/app node scripts/harden-web.mjs dist   # Content-Security-Policy + referrer policy (see SECURITY.md)

mkdir -p "$OUT/app"
# The website, minus its notes.
(cd "$ROOT/site" && find . -type f ! -name '*.md' ! -name '.DS_Store' ! -path './tools/*') | while read -r f; do
  mkdir -p "$OUT/$(dirname "$f")"
  cp "$ROOT/site/$f" "$OUT/$f"
done
cp -R dist/. "$OUT/app/"
node scripts/pages-404.mjs "$OUT"
touch "$OUT/.nojekyll"   # Pages' Jekyll would drop the app's _expo/ folder
echo "built $OUT/ ($(find "$OUT" -type f | wc -l | tr -d ' ') files)"
