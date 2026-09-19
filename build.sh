#!/bin/sh
# Assemble the static site. There is no bundler and no dependencies — the
# browser loads exactly the files in this repository, so a build is a copy.
set -e

rm -rf dist
mkdir -p dist/lib

cp -R public/. dist/
cp lib/rules.js lib/recognizer.js lib/imagenet-labels.js dist/lib/

echo "built dist/ ($(find dist -type f | wc -l | tr -d ' ') files, $(du -sh dist | cut -f1))"
