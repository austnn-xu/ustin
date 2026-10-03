#!/bin/sh
# Export the app for the web and publish it to the gh-pages branch (GitHub Pages, served at /ustin).
# Roll back with: git -C <gh-pages worktree> revert HEAD && git push origin gh-pages
set -e
cd "$(dirname "$0")/.."
REPO_ROOT=$(git rev-parse --show-toplevel)
SRC=$(git rev-parse --short HEAD)
WT=$(mktemp -d)

rm -rf dist
EXPO_OFFLINE=1 EXPO_BASE_URL=/ustin npx expo export --platform web
sed -i 's#<title>ustin</title>#<title>US Tin — What bin does this go in?</title>#' dist/index.html
cp dist/index.html dist/404.html   # SPA fallback so deep links survive a refresh
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
