'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const arena = require('../lib/arena');
const { UNITS, isCorrect } = require('../lib/lessons');

const { MATCH, REWARDS, buildMatch, pointsFor, isPlausibleRun, rewardsFor, tinRun, total, newSeed } = arena;
const SEEDS = ['a', 'b', 'room-123456', 7, 'abcdefghij', 'zz', 'x1', 'x2', 'x3', 'x4'];

test('a match is ten distinct single-answer questions with a right answer among the choices', () => {
  for (const seed of SEEDS) {
    const match = buildMatch(seed);
    assert.strictEqual(match.exercises.length, MATCH.questions, `seed ${seed}`);
    const ids = new Set(match.exercises.map((e) => e.id));
    assert.strictEqual(ids.size, MATCH.questions);
    for (const ex of match.exercises) {
      assert.strictEqual(ex.multi, false, `${ex.id} is multi-select`);
      assert.strictEqual(ex.answer.length, 1);
      assert.ok(ex.choices.some((c) => c.id === ex.answer[0]), `${ex.id} answer is not a choice`);
      assert.ok(isCorrect(ex, ex.answer));
      assert.ok(ex.explain && ex.explain.text, `${ex.id} has no why`);
    }
  }
});

test('the same seed always gives the same match, so two players race on the same questions', () => {
  for (const seed of SEEDS) {
    assert.deepStrictEqual(buildMatch(seed), buildMatch(seed));
  }
  assert.notDeepStrictEqual(
    buildMatch('one').exercises.map((e) => e.prompt + e.answer),
    buildMatch('two').exercises.map((e) => e.prompt + e.answer),
  );
});

test('a match draws from across the course, not one shelf', () => {
  for (const seed of SEEDS) {
    const units = new Set(buildMatch(seed).exercises.map((e) => e.unit));
    assert.ok(units.size >= Math.min(MATCH.questions, UNITS.length) - 1, `seed ${seed} uses only ${units.size} units`);
  }
});

test('faster right answers score more; wrong answers score nothing', () => {
  assert.strictEqual(pointsFor({ correct: false, ms: 100, streak: 0 }), 0);
  assert.strictEqual(pointsFor({ correct: true, ms: 0, streak: 1 }), MATCH.maxPoints);
  assert.strictEqual(pointsFor({ correct: true, ms: MATCH.questionMs, streak: 1 }), MATCH.minPoints);
  assert.strictEqual(pointsFor({ correct: true, ms: MATCH.questionMs * 5, streak: 1 }), MATCH.minPoints);
  assert.ok(pointsFor({ correct: true, ms: 2000, streak: 1 }) > pointsFor({ correct: true, ms: 9000, streak: 1 }));
});

test('a run of right answers adds a capped streak bonus', () => {
  assert.strictEqual(pointsFor({ correct: true, ms: 0, streak: 2 }), MATCH.maxPoints + MATCH.streakStep);
  assert.strictEqual(pointsFor({ correct: true, ms: 0, streak: 50 }), MATCH.maxPoints + MATCH.streakCap);
});

test('every run a player can actually score is plausible, and impossible ones are not', () => {
  for (const seed of SEEDS) assert.ok(isPlausibleRun(tinRun(seed)), `tin run for ${seed}`);
  const perfect = Array.from({ length: MATCH.questions }, (_, i) => pointsFor({ correct: true, ms: 0, streak: i + 1 }));
  assert.ok(isPlausibleRun(perfect));
  assert.ok(isPlausibleRun(new Array(MATCH.questions).fill(0)));
  assert.ok(!isPlausibleRun([...perfect.slice(0, 9)]), 'too short');
  assert.ok(!isPlausibleRun([1500, ...perfect.slice(1)]), 'a streak bonus on the first answer');
  assert.ok(!isPlausibleRun([...perfect.slice(0, 9), 99999]), 'over the cap');
  assert.ok(!isPlausibleRun([...perfect.slice(0, 9), 120]), 'under the floor for a right answer');
  assert.ok(!isPlausibleRun([...perfect.slice(0, 9), 500.5]), 'not a whole number');
});

test('winning pays more than losing, in coins and in leaderboard points', () => {
  const points = tinRun('pay');
  const score = total(points);
  const win = rewardsFor({ points, rival: 'player', rivalScore: score - 1 });
  const loss = rewardsFor({ points, rival: 'player', rivalScore: score + 1 });
  const tie = rewardsFor({ points, rival: 'player', rivalScore: score });
  const beatTin = rewardsFor({ points, rival: 'tin', rivalScore: score - 1 });
  const solo = rewardsFor({ points, rival: null, rivalScore: null });
  assert.strictEqual(win.outcome, 'win');
  assert.strictEqual(loss.outcome, 'loss');
  assert.strictEqual(tie.outcome, 'tie');
  assert.strictEqual(solo.outcome, 'solo');
  assert.ok(win.coins > tie.coins && tie.coins > loss.coins);
  assert.ok(win.earned > tie.earned && tie.earned > loss.earned);
  assert.ok(win.earned > beatTin.earned && beatTin.earned > loss.earned);
  assert.strictEqual(loss.earned, score);
  assert.strictEqual(solo.earned, score);
  assert.strictEqual(win.earned, score + REWARDS.pointsWin);
});

test('a perfect match earns the perfect bonus', () => {
  const perfect = Array.from({ length: MATCH.questions }, (_, i) => pointsFor({ correct: true, ms: 5000, streak: i + 1 }));
  const r = rewardsFor({ points: perfect, rival: 'player', rivalScore: 0 });
  assert.strictEqual(r.perfect, true);
  assert.strictEqual(r.coins, MATCH.questions * REWARDS.coinPerCorrect + REWARDS.coinsWin + REWARDS.coinsPerfect);
});

test('new seeds are short, URL-safe and varied', () => {
  const seeds = new Set(Array.from({ length: 200 }, () => newSeed()));
  assert.ok(seeds.size > 195);
  for (const s of seeds) assert.match(s, /^[a-z0-9]{10}$/);
});

// The database re-checks every submitted run with its own copy of these numbers. If one side changes, so must the other.
test('the leaderboard database uses the same scoring and reward numbers', () => {
  const dir = path.join(__dirname, '..', 'supabase', 'migrations');
  const sql = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  const constant = (name) => {
    const m = sql.match(new RegExp(`${name}\\s+constant\\s+int\\s*:=\\s*(\\d+)`));
    assert.ok(m, `${name} not found in the migration`);
    return Number(m[1]);
  };
  assert.strictEqual(constant('k_questions'), MATCH.questions);
  assert.strictEqual(constant('k_max_points'), MATCH.maxPoints);
  assert.strictEqual(constant('k_min_points'), MATCH.minPoints);
  assert.strictEqual(constant('k_streak_step'), MATCH.streakStep);
  assert.strictEqual(constant('k_streak_cap'), MATCH.streakCap);
  assert.strictEqual(constant('k_points_win'), REWARDS.pointsWin);
  assert.strictEqual(constant('k_points_win_tin'), REWARDS.pointsWinTin);
  assert.strictEqual(constant('k_points_tie'), REWARDS.pointsTie);
});
