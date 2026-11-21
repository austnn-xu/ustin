'use strict';

const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

const { SECURITY_HEADERS, HSTS, cacheControlFor } = require('../security-headers');
const vercel = require('../vercel.json');
const { server } = require('../server');

test('vercel.json sends exactly the security headers the dev server sends, plus HSTS', () => {
  const all = vercel.headers.find((h) => h.source === '/(.*)');
  assert.ok(all, 'a catch-all header rule');
  const sent = Object.fromEntries(all.headers.map((h) => [h.key, h.value]));
  assert.deepStrictEqual(sent, { ...SECURITY_HEADERS, ...HSTS });
});

test('the policy forbids inline script, eval, plugins and framing', () => {
  const csp = SECURITY_HEADERS['Content-Security-Policy'];
  assert.match(csp, /script-src 'self' 'wasm-unsafe-eval'(;|$)/);
  assert.doesNotMatch(csp, /'unsafe-eval'|'unsafe-inline'[^;]*;?\s*$|script-src[^;]*unsafe-inline/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
});

test('pages revalidate, files cache briefly, the API never caches', () => {
  assert.strictEqual(cacheControlFor('/'), 'no-cache');
  assert.strictEqual(cacheControlFor('/index.html'), 'no-cache');
  assert.strictEqual(cacheControlFor('/api/catalog'), 'no-store');
  assert.match(cacheControlFor('/assets/app.js'), /max-age=3600/);
});

function get(port, path) {
  return new Promise((resolve, reject) => {
    // Raw paths, so the dot segments reach the server exactly as an attacker would send them.
    const req = http.request({ host: '127.0.0.1', port, path, method: 'GET' }, (res) => {
      res.resume();
      res.on('end', () => resolve(res));
    });
    req.on('error', reject);
    req.end();
  });
}

test('the dev server sends the headers and keeps /lib/ inside lib/', async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  try {
    const page = await get(port, '/');
    assert.strictEqual(page.statusCode, 200);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) assert.strictEqual(page.headers[k.toLowerCase()], v, k);
    assert.strictEqual(page.headers['cache-control'], 'no-cache');

    assert.strictEqual((await get(port, '/lib/rules.js')).statusCode, 200);
    for (const bad of ['/lib/../server.js', '/lib/%2e%2e/server.js', '/lib/..%2fserver.js', '/lib/../package.json', '/../server.js', '/lib/']) {
      const res = await get(port, bad);
      assert.ok(res.statusCode === 403 || res.statusCode === 404, `${bad} gave ${res.statusCode}`);
    }
    const api = await get(port, '/api/catalog');
    assert.strictEqual(api.headers['cache-control'], 'no-store');
    assert.strictEqual(api.headers['x-content-type-options'], 'nosniff');
  } finally {
    await new Promise((r) => server.close(r));
  }
});
