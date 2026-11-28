#!/bin/sh
# Export the app for the web and publish it to the gh-pages branch (GitHub Pages, served at https://us-tin.org).
# Override SITE_URL / EXPO_BASE_URL to publish somewhere else (the old home was https://austnn-xu.github.io/ustin, base /ustin).
# Roll back with: git -C <gh-pages worktree> revert HEAD && git push origin gh-pages
set -e
SITE_URL=${SITE_URL:-https://us-tin.org}
EXPO_BASE_URL=${EXPO_BASE_URL-}
export SITE_URL EXPO_BASE_URL
cd "$(dirname "$0")/.."
REPO_ROOT=$(git rev-parse --show-toplevel)
SRC=$(git rev-parse --short HEAD)
WT=$(mktemp -d)

rm -rf dist
node scripts/web-assets.mjs
EXPO_OFFLINE=1 npx expo export --platform web
cp dist/index.html dist/404.html   # SPA fallback so deep links survive a refresh
node scripts/harden-web.mjs dist   # Content-Security-Policy + referrer policy (see SECURITY.md)
[ -z "$EXPO_BASE_URL" ] && echo "${SITE_URL#https://}" > dist/CNAME   # custom domain for GitHub Pages
touch dist/.nojekyll               # Pages' Jekyll would drop the _expo/ folder

git -C "$REPO_ROOT" fetch -q origin gh-pages
git -C "$REPO_ROOT" worktree add -q "$WT" origin/gh-pages
git -C "$WT" checkout -q -B gh-pages
git -C "$WT" rm -rq --ignore-unmatch .
cp -r dist/. "$WT/"
git -C "$WT" add -A
git -C "$WT" commit -q -m "Publish US Tin mobile app (web build of $SRC)"
git -C "$WT" push -q origin gh-pages
git -C "$REPO_ROOT" worktree remove --force "$WT"
echo "published $SRC to gh-pages"
