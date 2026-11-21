'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const L = require('../lib/leagues');
const { MAX_POINTS } = require('../lib/numbers');

test('eight leagues, in the order players climb them, ending in Pristine', () => {
  assert.deepStrictEqual(L.LEAGUES.map((l) => l.name), ['Bronze', 'Silver', 'Gold', 'Emerald', 'Diamond', 'Sapphire', 'Ruby', 'Pristine']);
  assert.strictEqual(L.LEAGUES[L.PRISTINE].ranked, true);
  assert.strictEqual(L.LEAGUES[0].demote, 0, 'nobody drops out of Bronze');
  for (const l of L.LEAGUES.slice(0, -1)) assert.ok(l.promote > 0 && l.promote + l.demote <= L.GROUP_SIZE, l.name);
});

test('a full group: the top go up, the bottom go down, the middle stays', () => {
  const gold = L.byId('gold');
  assert.strictEqual(L.weekResult({ league: gold, rank: 1, size: 30 }), 'promote');
  assert.strictEqual(L.weekResult({ league: gold, rank: 7, size: 30 }), 'promote');
  assert.strictEqual(L.weekResult({ league: gold, rank: 8, size: 30 }), 'stay');
  assert.strictEqual(L.weekResult({ league: gold, rank: 25, size: 30 }), 'stay');
  assert.strictEqual(L.weekResult({ league: gold, rank: 26, size: 30 }), 'demote');
  assert.strictEqual(L.weekResult({ league: 0, rank: 30, size: 30 }), 'stay', 'Bronze never demotes');
});

test('a small group never demotes someone who also placed in the promotion zone', () => {
  const gold = L.byId('gold');
  for (let rank = 1; rank <= 7; rank += 1) assert.strictEqual(L.weekResult({ league: gold, rank, size: 9 }), 'promote');
  assert.strictEqual(L.weekResult({ league: gold, rank: 8, size: 9 }), 'demote');
});

test('Pristine needs a real Ruby group to get into, and has no weekly groups itself', () => {
  const ruby = L.byId('ruby');
  assert.strictEqual(L.weekResult({ league: ruby, rank: 1, size: L.MIN_GROUP_FOR_PRISTINE - 1 }), 'stay');
  assert.strictEqual(L.weekResult({ league: ruby, rank: 1, size: L.MIN_GROUP_FOR_PRISTINE }), 'promote');
  assert.strictEqual(L.weekResult({ league: ruby, rank: 4, size: 30 }), 'stay');
  assert.strictEqual(L.weekResult({ league: L.PRISTINE, rank: 1, size: 30 }), 'stay');
});

test('RR: beat a stronger player for more, lose to a weaker one for more, small numbers either way', () => {
  const even = L.rrChange({ myRR: 500, rivalRR: 500, result: 1 });
  const upset = L.rrChange({ myRR: 500, rivalRR: 900, result: 1 });
  const expected = L.rrChange({ myRR: 900, rivalRR: 500, result: 1 });
  assert.strictEqual(even, 16);
  assert.ok(upset > even && expected < even);
  assert.ok(expected >= L.RR.minWin);
  assert.strictEqual(L.rrChange({ myRR: 500, rivalRR: 500, result: 0 }), -16);
  assert.ok(L.rrChange({ myRR: 900, rivalRR: 500, result: 0 }) < -16);
  assert.strictEqual(L.rrChange({ myRR: 500, rivalRR: 500, result: 0.5 }), 0);
  assert.strictEqual(L.rrChange({ myRR: 500, rivalRR: null, result: 1 }), 8, 'beating a lower league earns little');
  assert.strictEqual(L.rrChange({ myRR: 500, rivalRR: null, result: 0 }), -24, 'losing to one costs more');
  for (let i = 0; i < 500; i += 1) {
    const d = L.rrChange({ myRR: Math.random() * 3000, rivalRR: Math.random() < 0.2 ? null : Math.random() * 3000, result: [0, 0.5, 1][i % 3] });
    assert.ok(Math.abs(d) <= L.RR.maxChange);
  }
});

test('weeks start on Monday, UTC', () => {
  assert.strictEqual(L.weekStart(new Date('2026-11-21T12:00:00Z')), '2026-11-16'); // a Saturday
  assert.strictEqual(L.weekStart(new Date('2026-11-16T00:00:00Z')), '2026-11-16'); // Monday midnight
  assert.strictEqual(L.weekStart(new Date('2026-11-15T23:59:59Z')), '2026-11-09'); // Sunday night
  assert.strictEqual(L.msUntilWeekEnd(new Date('2026-11-22T23:00:00Z')), 3600 * 1000);
});

// The database applies the same rules. If one side changes, so must the other.
test('the database uses the same league and rating numbers', () => {
  const dir = path.join(__dirname, '..', 'supabase', 'migrations');
  const sql = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  const num = (name) => {
    const m = [...sql.matchAll(new RegExp(`${name}\\s+constant\\s+(?:int|bigint|numeric)\\s*:=\\s*([\\d.e]+)`, 'g'))].pop();
    assert.ok(m, `${name} not found`);
    return Number(m[1]);
  };
  const arr = (name) => {
    const m = [...sql.matchAll(new RegExp(`${name}\\s+constant\\s+int\\[\\]\\s*:=\\s*array\\[([\\d,\\s]+)\\]`, 'g'))].pop();
    assert.ok(m, `${name} not found`);
    return m[1].split(',').map((s) => Number(s.trim()));
  };
  assert.deepStrictEqual(arr('k_promote'), L.LEAGUES.map((l) => l.promote));
  assert.deepStrictEqual(arr('k_demote'), L.LEAGUES.map((l) => l.demote));
  assert.strictEqual(num('k_group_size'), L.GROUP_SIZE);
  assert.strictEqual(num('k_min_group_pristine'), L.MIN_GROUP_FOR_PRISTINE);
  assert.strictEqual(num('k_rr_k'), L.RR.k);
  assert.strictEqual(num('k_rr_min_win'), L.RR.minWin);
  assert.strictEqual(num('k_rr_max'), L.RR.maxChange);
  assert.strictEqual(num('k_rr_vs_lower'), L.RR.expectedVsLower);
  assert.strictEqual(num('k_points_cap'), MAX_POINTS);
});
