'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { fetchOverpass, widen, problemWith, TimeoutError } = require('../lib/overpass');

const ok = (elements, extra) => ({ ok: true, status: 200, json: async () => Object.assign({ elements }, extra) });
const status = (code) => ({ ok: false, status: code, json: async () => ({}) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** A fetch that answers per endpoint after a delay, and honours abort. */
function fakeFetch(plan, log) {
  return (endpoint, init) =>
    new Promise((resolve, reject) => {
      log && log.push(endpoint);
      const step = plan[endpoint];
      const t = setTimeout(() => (step.fail ? reject(new Error(step.fail)) : resolve(step.res)), step.after || 0);
      init.signal.addEventListener('abort', () => {
        clearTimeout(t);
        const e = new Error('aborted');
        e.name = 'AbortError';
        reject(e);
      });
    });
}
const EP = ['a', 'b', 'c'];
const fast = { staggerMs: 30, timeoutMs: 200 };

test('the first mirror that answers wins, and the slower ones are cancelled', async () => {
  const log = [];
  const aborted = [];
  const f = (endpoint, init) => {
    init.signal.addEventListener('abort', () => aborted.push(endpoint));
    return fakeFetch({ a: { after: 150, res: ok([{ id: 'slow' }]) }, b: { after: 5, res: ok([{ id: 'fast' }]) }, c: { after: 5, res: ok([]) } }, log)(endpoint, init);
  };
  const t = Date.now();
  const out = await fetchOverpass('q', Object.assign({ endpoints: EP, fetch: f }, fast));
  assert.deepEqual(out, [{ id: 'fast' }]);
  assert.ok(Date.now() - t < 100, 'did not wait for the slow mirror');
  assert.ok(aborted.includes('a'), 'the slow mirror was cancelled');
});

test('a failing mirror hands over at once, not after its timeout', async () => {
  const t = Date.now();
  const out = await fetchOverpass('q', {
    endpoints: EP, fetch: fakeFetch({ a: { fail: 'boom' }, b: { fail: 'boom' }, c: { after: 5, res: ok([{ id: 'c' }]) } }), staggerMs: 5000, timeoutMs: 5000,
  });
  assert.deepEqual(out, [{ id: 'c' }]);
  assert.ok(Date.now() - t < 150, `took ${Date.now() - t}ms with a 5s stagger`);
});

test('HTTP errors and Overpass "runtime error" remarks count as failures, so the next mirror answers', async () => {
  const out = await fetchOverpass('q', Object.assign({
    endpoints: EP,
    fetch: fakeFetch({ a: { res: status(429) }, b: { res: ok([], { remark: 'runtime error: Query timed out in "query" at line 3 after 26 seconds.' }) }, c: { res: ok([{ id: 'ok' }]) } }),
  }, fast));
  assert.deepEqual(out, [{ id: 'ok' }]);
});

test('an empty answer without a remark is a real "nothing here", not a failure', async () => {
  const out = await fetchOverpass('q', Object.assign({ endpoints: EP, fetch: fakeFetch({ a: { res: ok([]) }, b: { res: ok([{ id: 'x' }]) }, c: { res: ok([{ id: 'y' }]) } }) }, fast));
  assert.deepEqual(out, []);
});

test('when every mirror fails it rejects with the last error', async () => {
  await assert.rejects(
    fetchOverpass('q', Object.assign({ endpoints: EP, fetch: fakeFetch({ a: { fail: 'one' }, b: { fail: 'two' }, c: { fail: 'three' } }) }, fast)),
    /three/,
  );
});

test('a mirror that never answers is cut off by its own timeout', async () => {
  const t = Date.now();
  await assert.rejects(fetchOverpass('q', { endpoints: ['a', 'b'], fetch: fakeFetch({ a: { after: 5000 }, b: { after: 5000 } }), staggerMs: 20, timeoutMs: 80 }));
  assert.ok(Date.now() - t < 400, `took ${Date.now() - t}ms`);
});

test('mirrors are started a moment apart, not all at once', async () => {
  const log = [];
  await fetchOverpass('q', { endpoints: EP, fetch: fakeFetch({ a: { after: 5, res: ok([1]) }, b: { res: ok([2]) }, c: { res: ok([3]) } }, log), staggerMs: 100, timeoutMs: 500 });
  assert.deepEqual(log, ['a'], 'a fast first mirror means the others never get asked');
});

test('an aborted signal stops the search', async () => {
  const c = new AbortController();
  const p = fetchOverpass('q', { endpoints: EP, fetch: fakeFetch({ a: { after: 500 }, b: { after: 500 }, c: { after: 500 } }), staggerMs: 20, timeoutMs: 1000, signal: c.signal });
  setTimeout(() => c.abort(), 20);
  await assert.rejects(p, TimeoutError);
  await assert.rejects(fetchOverpass('q', { endpoints: EP, fetch: fakeFetch({}), signal: c.signal }), TimeoutError);
});

test('problemWith spots broken replies', () => {
  assert.equal(problemWith({ elements: [] }), null);
  assert.match(problemWith({ elements: [], remark: 'runtime error: out of memory' }), /Overpass/);
  assert.ok(problemWith(null) && problemWith({}) && problemWith({ elements: 'x' }));
  assert.equal(problemWith({ elements: [], remark: 'something harmless' }), null);
});

test('widen stops at the first radius that finds enough', async () => {
  const seen = [];
  const out = await widen({ radii: [1, 2, 3], run: async (r) => (seen.push(r), Array(r === 1 ? 2 : 6).fill(r)), enough: (v) => v.length >= 5 });
  assert.deepEqual(seen, [1, 2]);
  assert.equal(out.radius, 2);
});

test('widen returns what a smaller radius found when a wider one fails', async () => {
  const out = await widen({ radii: [1, 2, 3], run: async (r) => { if (r === 2) throw new Error('busy'); return ['one']; }, enough: () => false });
  assert.deepEqual(out, { value: ['one'], radius: 1 });
});

test('widen throws when nothing was found before the failure', async () => {
  await assert.rejects(widen({ radii: [1, 2], run: async () => { throw new Error('down'); }, enough: () => true }), /down/);
});

test('widen gives up at the deadline instead of running every radius to its own timeout', async () => {
  const t = Date.now();
  const out = await widen({
    radii: [1, 2, 3], deadlineMs: 120, enough: () => false,
    run: (r, signal) => new Promise((resolve, reject) => {
      if (r === 1) return resolve(['near']);
      const timer = setTimeout(() => resolve(['late']), 5000);
      signal.addEventListener('abort', () => { clearTimeout(timer); reject(new TimeoutError()); });
    }),
  });
  assert.deepEqual(out, { value: ['near'], radius: 1 });
  assert.ok(Date.now() - t < 500, `took ${Date.now() - t}ms`);
  await assert.rejects(widen({ radii: [1], deadlineMs: 50, enough: () => true, run: (r, s) => new Promise((_, rej) => s.addEventListener('abort', () => rej(new TimeoutError()))) }), TimeoutError);
});

test('worst case is bounded: three dead mirrors across three radii finish well inside the deadline', async () => {
  const t = Date.now();
  await assert.rejects(widen({
    radii: [1, 2, 3], deadlineMs: 600, enough: () => true,
    run: (r, signal) => fetchOverpass('q', { endpoints: EP, fetch: fakeFetch({ a: { after: 9000 }, b: { after: 9000 }, c: { after: 9000 } }), staggerMs: 20, timeoutMs: 100, signal }),
  }));
  assert.ok(Date.now() - t < 700, `took ${Date.now() - t}ms`);
});

test('onSuccess says which mirror answered, so the next search can start there', async () => {
  let winner = null;
  await fetchOverpass('q', Object.assign({
    endpoints: EP, onSuccess: (e) => { winner = e; },
    fetch: fakeFetch({ a: { fail: 'down' }, b: { after: 5, res: ok([1]) }, c: { after: 200, res: ok([2]) } }),
  }, fast));
  assert.equal(winner, 'b');
});
