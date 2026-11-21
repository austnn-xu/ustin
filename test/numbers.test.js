'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { MAX_POINTS, clampPoints, addPoints, compact } = require('../lib/numbers');

test('the ceiling is just under the largest exact integer, in the quadrillions', () => {
  assert.ok(MAX_POINTS < Number.MAX_SAFE_INTEGER);
  assert.ok(MAX_POINTS >= 1e15);
  // Every whole number up to the ceiling is exact: adding one always changes it.
  assert.notStrictEqual(MAX_POINTS - 1, MAX_POINTS - 2);
});

test('counters saturate instead of overflowing or going negative', () => {
  assert.strictEqual(addPoints(MAX_POINTS - 10, 1000), MAX_POINTS);
  assert.strictEqual(addPoints(MAX_POINTS, MAX_POINTS), MAX_POINTS);
  assert.strictEqual(addPoints(5, 7), 12);
  assert.strictEqual(addPoints(5, -100), 5);
  assert.strictEqual(clampPoints(-3), 0);
  assert.strictEqual(clampPoints(NaN), 0);
  assert.strictEqual(clampPoints(Infinity), 0);
  assert.strictEqual(clampPoints(1e300), MAX_POINTS);
  assert.strictEqual(clampPoints(12.9), 12);
});

test('small numbers are shown in full, big ones with simulator suffixes', () => {
  const cases = [
    [0, '0'],
    [999, '999'],
    [9999, '9,999'],
    [10000, '10K'],
    [12_345, '12.3K'],
    [999_999, '999K'],
    [1_000_000, '1M'],
    [1_234_567, '1.23M'],
    [45_600_000_000, '45.6B'],
    [7_890_000_000_000, '7.89T'],
    [1e15, '1Qa'],
    [MAX_POINTS, '9Qa'],
    [1.5e18, '1.5Qi'],
    [-12_345, '-12.3K'],
  ];
  for (const [n, s] of cases) assert.strictEqual(compact(n), s, String(n));
});

test('suffixes never round a total up', () => {
  assert.strictEqual(compact(999_999_999), '999M');
  assert.strictEqual(compact(1_999_999), '1.99M');
  for (let i = 0; i < 2000; i += 1) {
    const n = Math.floor(Math.random() * 10 ** (4 + Math.random() * 11));
    const s = compact(n).replace(/,/g, "");
    const m = s.match(/^([\d.]+)([A-Za-z]*)$/);
    assert.ok(m, s);
    const back = Number(m[1]) * 10 ** (3 * ['', 'K', 'M', 'B', 'T', 'Qa'].indexOf(m[2]));
    assert.ok(back <= n + 1e-6 * n, `${n} shown as ${s}`);
  }
});

test('anything that is not a number shows as 0', () => {
  for (const v of [NaN, undefined, null, 'lots', Infinity]) assert.strictEqual(compact(v), '0');
});
