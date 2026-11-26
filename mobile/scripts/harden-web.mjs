#!/usr/bin/env node
// Lock down the exported web build (dist/) before it is published.
//
// GitHub Pages cannot send custom HTTP headers, so the policies that can be expressed in the page itself go in as
// <meta> tags, first thing in <head> so they apply before any script loads:
//
//   Content-Security-Policy  scripts only from this site (no inline scripts, no eval), network only to the services
//                            the app really uses, no plugins, no <base> hijacking, no form posts.
//   Referrer                 other sites see only our origin, never a full URL (a game PIN, a search).
//
// Headers a meta tag cannot set (frame-ancestors, X-Content-Type-Options, HSTS) are documented in SECURITY.md; serve
// the build from a host with header support to add them.
//
// The script also refuses to publish a build with an inline <script>, which the policy would block anyway.
//
// Usage: node scripts/harden-web.mjs [distDir]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const files = ['index.html', '404.html'].map((f) => join(dist, f)).filter(existsSync);
if (!files.length) {
  console.error(`harden-web: no index.html in ${dist}`);
  process.exit(1);
}

/** Expo reads mobile/.env at build time; read it the same way so the policy names the same Supabase project. */
function envVar(name) {
  if (process.env[name]) return process.env[name];
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue;
    const line = readFileSync(file, 'utf8')
      .split('\n')
      .find((l) => l.trim().startsWith(`${name}=`));
    const value = line?.slice(line.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '');
    if (value) return value;
  }
  return '';
}

const supabase = envVar('EXPO_PUBLIC_SUPABASE_URL');
let supabaseOrigins = [];
if (supabase) {
  const url = new URL(supabase);
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) {
    console.error(`harden-web: EXPO_PUBLIC_SUPABASE_URL must be https (got ${url.origin})`);
    process.exit(1);
  }
  supabaseOrigins = [url.origin, url.origin.replace(/^http/, 'ws')];
}

// Every host the app talks to. Adding a service means adding it here, on purpose.
const CONNECT = [
  'https://api.zippopotam.us', // US ZIP → coordinates
  'https://nominatim.openstreetmap.org', // other postcodes, reverse geocoding
  'https://overpass-api.de', // nearby places (and its three mirrors)
  'https://overpass.kumi.systems',
  'https://overpass.private.coffee',
  'https://overpass.openstreetmap.fr',
  'https://storage.googleapis.com', // MobileNet weights (tfjs-models), photo recognition
  ...supabaseOrigins, // the Arena's leaderboard
];

const policy = {
  'default-src': ["'self'"],
  // The app bundle and the vendored TensorFlow.js, both from this site. No inline scripts, no eval.
  // 'wasm-unsafe-eval' lets TensorFlow.js compile WebAssembly; it does not allow JavaScript eval.
  'script-src': ["'self'", "'wasm-unsafe-eval'"],
  // react-native-web writes its styles into <style> tags at runtime, which cannot be hashed ahead of time.
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'", 'data:'],
  'media-src': ["'self'", 'blob:'],
  'connect-src': ["'self'", 'data:', 'blob:', ...CONNECT],
  // The Near me map is OpenStreetMap's own embed.
  'frame-src': ['https://www.openstreetmap.org'],
  'worker-src': ["'self'", 'blob:'],
  'manifest-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'none'"],
  'upgrade-insecure-requests': [],
};
const csp = Object.entries(policy)
  .map(([k, v]) => [k, ...v].join(' '))
  .join('; ');

const tags = [
  `<meta http-equiv="Content-Security-Policy" content="${csp}">`,
  '<meta name="referrer" content="strict-origin-when-cross-origin">',
].join('\n    ');

// Page metadata: a real title, installable on a phone's home screen, and a proper link preview when shared.
const base = (process.env.EXPO_BASE_URL ?? '').replace(/\/$/, '');
const site = (process.env.SITE_URL ?? 'https://austnn-xu.github.io/ustin').replace(/\/$/, '');
const TITLE = 'US Tin: learn where things go';
const DESCRIPTION = 'Learn where everything goes, one short lesson at a time. Look up any item and find the nearest drop-off.';
const meta = [
  `<link rel="manifest" href="${base}/manifest.webmanifest">`,
  `<link rel="apple-touch-icon" href="${base}/apple-touch-icon.png">`,
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="US Tin">',
  '<meta property="og:type" content="website">',
  '<meta property="og:site_name" content="US Tin">',
  `<meta property="og:title" content="${TITLE}">`,
  `<meta property="og:description" content="${DESCRIPTION}">`,
  `<meta property="og:image" content="${site}/apple-touch-icon.png">`,
  `<meta property="og:url" content="${site}/">`,
  '<meta name="twitter:card" content="summary">',
].join('\n    ');

for (const file of files) {
  let html = readFileSync(file, 'utf8');
  // Idempotent page metadata. viewport-fit=cover lets the app draw under the notch; screens already use safe areas.
  html = html
    .replace(/\s*<link rel="manifest"[^>]*>/gi, '')
    .replace(/\s*<link rel="apple-touch-icon"[^>]*>/gi, '')
    .replace(/\s*<meta (?:name="(?:apple-mobile-web-app-capable|mobile-web-app-capable|apple-mobile-web-app-title|twitter:card)"|property="og:[^"]*")[^>]*>/gi, '')
    .replace(/<title>[^<]*<\/title>/i, `<title>${TITLE}</title>`)
    .replace(/(<meta name="viewport" content="[^"]*?)(,\s*viewport-fit=cover)?"/i, '$1, viewport-fit=cover"')
    .replace(/(<meta name="description"[^>]*>)/i, `$1\n    ${meta}`);
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/gi)];
  if (inline.length) {
    console.error(`harden-web: ${file} has ${inline.length} inline <script>; the CSP would block it. Move it to a file.`);
    process.exit(1);
  }
  // Idempotent: replace a previous run's tags.
  html = html.replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*>/i, '').replace(/\s*<meta name="referrer"[^>]*>/i, '');
  // Right after the charset (which must stay in the first 1024 bytes), before anything that loads.
  html = /<meta charset[^>]*>/i.test(html)
    ? html.replace(/(<meta charset[^>]*>)/i, `$1\n    ${tags}`)
    : html.replace(/<head>/i, `<head>\n    ${tags}`);
  // Expo's template writes the React spelling, which browsers ignore.
  html = html.replace('httpEquiv="X-UA-Compatible"', 'http-equiv="X-UA-Compatible"');
  writeFileSync(file, html);
}
console.log(`harden-web: CSP + referrer policy in ${files.length} file(s)${supabase ? '' : ' (no Supabase URL set: leaderboard hosts not allowed)'}`);
