#!/bin/sh
# Assemble the static site: the page plus the shared rules engine.
# There is no bundler and no dependencies — this is a copy.
set -e
rm -rf dist
mkdir -p dist/lib
cp public/index.html public/app.js public/styles.css dist/
cp lib/rules.js lib/identify.js dist/lib/
echo "built dist/ ($(find dist -type f | wc -l | tr -d ' ') files)"
