#!/bin/sh
# Build the website and the app (scripts/build-pages.sh) and publish them to the gh-pages branch, served at
# https://us-tin.org (the custom domain comes from ../site/CNAME, which the build copies; without it Pages drops the domain).
# Roll back with: git -C <gh-pages worktree> revert HEAD && git push origin gh-pages
set -e
cd "$(dirname "$0")/.."
REPO_ROOT=$(git rev-parse --show-toplevel)
SRC=$(git rev-parse --short HEAD)
WT=$(mktemp -d)

./scripts/build-pages.sh
test -f pages/CNAME || { echo "publish-web: pages/CNAME is missing; refusing to publish without the custom domain"; exit 1; }

git -C "$REPO_ROOT" fetch -q origin gh-pages
git -C "$REPO_ROOT" worktree add -q "$WT" origin/gh-pages
git -C "$WT" checkout -q -B gh-pages
git -C "$WT" rm -rq --ignore-unmatch .
cp -r pages/. "$WT/"
git -C "$WT" add -A
git -C "$WT" commit -q -m "Publish the US Tin website and app (build of $SRC)"
git -C "$WT" push -q origin gh-pages
git -C "$REPO_ROOT" worktree remove --force "$WT"
echo "published $SRC to gh-pages"
