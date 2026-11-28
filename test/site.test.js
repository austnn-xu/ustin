'use strict';

// The website (site/) quotes the app's real numbers and draws its real course and shop. These checks keep it honest:
// if the catalog, the course or the shop changes, the site has to change with it.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { OBJECTS } = require('../lib/rules');
const { UNITS } = require('../lib/lessons');

const SITE = path.join(__dirname, '..', 'site');
const read = (rel) => fs.readFileSync(path.join(SITE, rel), 'utf8');
const pages = ['index.html', 'terms/index.html', 'privacy/index.html', 'cookies/index.html', 'accessibility/index.html', 'press/index.html'];
const stops = UNITS.reduce((n, u) => n + u.lessons.length, 0);

test('course.json is the course, unit by unit and stop by stop', () => {
  const course = JSON.parse(read('assets/course.json'));
  assert.deepEqual(course, UNITS.map((u) => ({ title: u.title, stops: u.lessons.map((l) => l.id) })),
    'site/assets/course.json is stale: run node site/tools/make-data.cjs');
});

test('the numbers the home page quotes are the real ones', () => {
  const home = read('index.html');
  assert.match(home, new RegExp(`Search ${OBJECTS.length} items`), 'item count');
  assert.match(home, new RegExp(`>${stops} stops<`), 'stop count on the route card');
  assert.match(home, new RegExp(`${stops} lessons`), 'lesson count on the Learn card');
  assert.match(home, new RegExp(`Across ${UNITS.length} neighbourhoods`), 'unit count');
  assert.match(home, new RegExp(`from ${UNITS[0].title.replace('&', '&amp;')} to ${UNITS.at(-1).title}`), 'first and last unit');
});

test('the coffee cup on the home page matches the catalog verdict', () => {
  const { resolve, findObject } = require('../lib/rules');
  const verdict = resolve(findObject('coffee-cup'), {});
  const bins = Object.fromEntries(verdict.components.map((c) => [c.label, c.outcome.id]));
  assert.deepEqual(bins, { 'Cup body': 'trash', Lid: 'recycle', Sleeve: 'recycle' });
  const lid = verdict.components.find((c) => c.label === 'Lid');
  assert.equal(lid.stream.code, '#5');
  assert.match(read('index.html'), /Polypropylene, #5/);
});

test('the wardrobe wall shows exactly what the shop sells', () => {
  const wardrobe = JSON.parse(read('assets/wardrobe.json'));
  const shop = fs.readFileSync(path.join(__dirname, '..', 'mobile', 'src', 'lib', 'cosmetics.ts'), 'utf8');
  const sold = [...shop.matchAll(/\{ id: '[^']+', slot: '[^']+', name: (['"])(.+?)\1, price: (\d+)/g)].map((m) => [m[2], Number(m[3])]);
  assert.ok(sold.length > 20, 'read the shop');
  assert.deepEqual(wardrobe.map((w) => w.name).sort(), sold.map(([n]) => n).sort(),
    'site/assets/wardrobe.json is stale: run node mobile/scripts/capture-site-art.cjs');
  const js = read('assets/site.js');
  for (const [name, price] of sold) {
    const quoted = [`${name}: ${price}`, `'${name}': ${price}`, `"${name}": ${price}`];
    assert.ok(quoted.some((q) => js.includes(q)), `the wall's price for ${name} should be ${price}`);
  }
  assert.match(read('index.html'), new RegExp(`${sold.length} things to wear`));
});

test('every page carries the security policy and nothing it would block', () => {
  for (const rel of pages) {
    const html = read(rel);
    assert.match(html, /<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self';/, `${rel}: CSP`);
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i, `${rel}: inline script`);
    assert.doesNotMatch(html, /\sstyle="/i, `${rel}: inline style attribute (blocked by style-src 'self')`);
    assert.doesNotMatch(html, /\son[a-z]+="/i, `${rel}: inline event handler`);
    assert.doesNotMatch(html, /https?:\/\/(fonts\.googleapis|fonts\.gstatic|www\.google-analytics|googletagmanager)/, `${rel}: third-party request`);
  }
});

test('every local link and picture on the site exists', () => {
  for (const rel of pages) {
    const html = read(rel);
    const dir = path.dirname(path.join(SITE, rel));
    for (const m of html.matchAll(/\s(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)) {
      const url = m[1];
      if (/^(https?:|mailto:|data:)/.test(url)) continue;
      // The app is published beside the site at build time (mobile/scripts/build-pages.sh).
      if (/^(\.\.\/)*app\//.test(url)) continue;
      let target = path.join(dir, url);
      if (url.endsWith('/') || url === './' || url === '../') target = path.join(target, 'index.html');
      assert.ok(fs.existsSync(target), `${rel} links to ${url}, which does not exist`);
    }
  }
});

test('the redirect for old app links keeps the path, query and hash', () => {
  const src = read('redirect.js');
  const run = (pathname, search = '', hash = '', scriptUrl = 'https://us-tin.org/redirect.js') => {
    let replaced = null;
    const window = { location: { pathname, search, hash, replace: (u) => { replaced = u; } } };
    const document = { currentScript: { src: scriptUrl } };
    new Function('window', 'document', 'URL', src)(window, document, URL);
    return replaced;
  };
  assert.equal(run('/pin/123456', '?x=1', '#top'), '/app/pin/123456?x=1#top');
  assert.equal(run('/lesson/drinks-1'), '/app/lesson/drinks-1');
  assert.equal(run('/app/lesson/drinks-1'), null, 'already in the app');
  assert.equal(run('/app'), null);
  // Served from a subpath instead of the custom domain (BASE_PATH=/ustin), the same rules hold.
  const sub = 'https://austnn-xu.github.io/ustin/redirect.js';
  assert.equal(run('/ustin/pin/123456', '', '', sub), '/ustin/app/pin/123456');
  assert.equal(run('/ustin/app/pin/123456', '', '', sub), null);
  assert.equal(run('/elsewhere/x', '', '', sub), null, 'outside the site');
});
