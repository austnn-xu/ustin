#!/usr/bin/env node
// Write the site-wide 404.html for GitHub Pages, which serves it for any path that has no file.
//
// It is the app's own page (its assets are absolute, under /app/, so it works from any path) with redirect.js
// loaded first. Under /app/ the app starts and its router shows the screen, or its own branded not-found.
// Anywhere else, redirect.js sends the visitor to the same path under /app/: links shared before the app moved
// (game PINs, lessons) keep working.
//
// Usage: node scripts/pages-404.mjs <pagesDir>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2] ?? 'pages';
let html = readFileSync(join(out, 'app', 'index.html'), 'utf8');
const base = process.env.BASE_PATH ?? ''; // where the site sits on its host: '' on us-tin.org
if (html.includes('redirect.js')) throw new Error('pages-404: redirect already present');
// Right after the security <meta> tags, before any app script, so the redirect wins the race.
html = html.replace(/(<meta name="referrer"[^>]*>)/i, `$1\n    <script src="${base}/redirect.js"></script>`);
if (!html.includes('redirect.js')) {
  console.error('pages-404: could not find where to load redirect.js (is harden-web run first?)');
  process.exit(1);
}
writeFileSync(join(out, '404.html'), html);
console.log('pages-404: wrote 404.html');
