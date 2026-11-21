'use strict';

/**
 * US Tin — the Arena: quick, timed matches for friendly competition.
 *
 * A match is ten questions drawn from the whole course (the question bank is
 * every unit's review, so it is the same generated, engine-checked content the
 * lessons teach). Each question is on a clock: a right answer scores more the
 * faster it comes, a run of right answers adds a streak bonus, and a wrong or
 * missed answer scores nothing but still shows the answer and why.
 *
 * Everything here is deterministic from a seed. That is what makes a match
 * fair to compare: two people who play the same seed answer the same ten
 * questions in the same order, whether they play side by side or days apart.
 *
 * The scoring and reward rules are mirrored, number for number, by the
 * leaderboard's database functions (`supabase/migrations`), which re-check
 * every submitted run. A test keeps the two in step.
 */

(function (root, factory) {
  const lessons = typeof require === 'function' ? require('./lessons') : root.USTinLessons;
  const api = factory(lessons);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') root.USTinArena = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (lessons) {
  const { UNITS, buildLesson } = lessons;

  const MATCH = {
    /** Questions per match. */
    questions: 10,
    /** Time on the clock for each question (ms). */
    questionMs: 20000,
    /** A right answer scores between `minPoints` (on the buzzer) and `maxPoints` (instantly). */
    maxPoints: 1000,
    minPoints: 500,
    /** From the second right answer in a row, +100 per answer in the run, up to +500. */
    streakStep: 100,
    streakCap: 500,
  };

  /** The most one question can score: instant, on a long streak. */
  const MAX_QUESTION_POINTS = MATCH.maxPoints + MATCH.streakCap;

  const REWARDS = {
    /** Coins: one per right answer, like lessons, plus a bonus for the result. */
    coinPerCorrect: 1,
    coinsWin: 15,
    coinsTie: 5,
    coinsPerfect: 10,
    /** Leaderboard points on top of the match score. Beating Tin counts for half a win against a person. */
    pointsWin: 1000,
    pointsWinTin: 500,
    pointsTie: 500,
  };

  /** Tin as a rival: right about seven times in ten, answering in 3 to 15 seconds. */
  const TIN = { accuracy: 0.72, fastestMs: 3000, slowestMs: 15000 };

  // -------------------------------------------------------------------------
  // Seeded randomness (the same generator the lessons use)
  // -------------------------------------------------------------------------

  function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rng(seed) {
    let a = hash(String(seed));
    return function next() {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(rand, list) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /** A fresh seed for a new match: short, URL-safe, and unlikely to repeat. */
  function newSeed(rand = Math.random) {
    const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
    let s = '';
    for (let i = 0; i < 10; i += 1) s += alphabet[Math.floor(rand() * alphabet.length)];
    return s;
  }

  // -------------------------------------------------------------------------
  // The question bank
  // -------------------------------------------------------------------------

  function fingerprint(ex) {
    if (!ex.item) return [ex.type, ex.statement, ex.prompt, ex.answer.join()].join('|');
    return [ex.type, ex.item.objectId, ex.item.part].join('|');
  }

  /**
   * Ten questions for a seed, spread across the course: units are visited in a
   * seeded order and each gives one question from its review, so a match moves
   * from bottles to batteries to compost rather than drilling one shelf.
   * Multi-select questions are left out: on a clock, one tap is one answer.
   */
  function buildMatch(seed) {
    const rand = rng(`match:${seed}`);
    const units = shuffle(rand, UNITS);
    const chosen = [];
    const seen = new Set();

    for (let round = 0; chosen.length < MATCH.questions && round < 4; round += 1) {
      for (const unit of units) {
        if (chosen.length >= MATCH.questions) break;
        const review = unit.lessons[unit.lessons.length - 1];
        const pool = buildLesson(review.id, `${seed}:${unit.id}:${round}`).exercises.filter((ex) => !ex.multi);
        const fresh = shuffle(rand, pool).find((ex) => !seen.has(fingerprint(ex)));
        if (!fresh) continue;
        seen.add(fingerprint(fresh));
        chosen.push({ ...fresh, unit: unit.id, unitTitle: unit.title });
      }
    }

    return {
      seed: String(seed),
      questionMs: MATCH.questionMs,
      exercises: chosen.map((ex, i) => ({ ...ex, id: `match:${seed}:${i}` })),
    };
  }

  // -------------------------------------------------------------------------
  // Scoring
  // -------------------------------------------------------------------------

  /**
   * Points for one answer. `ms` is how long it took; `streak` is the run of
   * right answers including this one. Faster is worth more: half the points
   * are for being right, half for being quick.
   */
  function pointsFor({ correct, ms, streak }) {
    if (!correct) return 0;
    const used = Math.max(0, Math.min(1, ms / MATCH.questionMs));
    const base = Math.round(MATCH.maxPoints * (1 - used / 2));
    const bonus = Math.min(MATCH.streakCap, Math.max(0, streak - 1) * MATCH.streakStep);
    return base + bonus;
  }

  /** The streak bonus inside a question's points, for showing it apart. */
  function streakBonus(streak) {
    return Math.min(MATCH.streakCap, Math.max(0, streak - 1) * MATCH.streakStep);
  }

  const total = (points) => points.reduce((sum, p) => sum + p, 0);

  /**
   * Is a list of per-question points a run someone could actually score?
   * The leaderboard's `submit_run` applies exactly these checks.
   */
  function isPlausibleRun(points) {
    if (!Array.isArray(points) || points.length !== MATCH.questions) return false;
    let streak = 0;
    for (const p of points) {
      if (!Number.isInteger(p) || p < 0) return false;
      if (p === 0) {
        streak = 0;
        continue;
      }
      streak += 1;
      const bonus = streakBonus(streak);
      if (p < MATCH.minPoints + bonus || p > MATCH.maxPoints + bonus) return false;
    }
    return true;
  }

  function outcomeOf(score, rivalScore) {
    if (rivalScore == null) return 'solo';
    return score > rivalScore ? 'win' : score < rivalScore ? 'loss' : 'tie';
  }

  /**
   * What a finished match pays. `rival` says who it was against: a real
   * player's run, Tin, or nobody yet (the first to play a game PIN).
   */
  function rewardsFor({ points, rival, rivalScore }) {
    const score = total(points);
    const correct = points.filter((p) => p > 0).length;
    const outcome = outcomeOf(score, rivalScore);
    const perfect = correct === points.length;
    const coins = correct * REWARDS.coinPerCorrect
      + (outcome === 'win' ? REWARDS.coinsWin : outcome === 'tie' ? REWARDS.coinsTie : 0)
      + (perfect ? REWARDS.coinsPerfect : 0);
    const bonus = outcome === 'win'
      ? (rival === 'tin' ? REWARDS.pointsWinTin : REWARDS.pointsWin)
      : outcome === 'tie' ? REWARDS.pointsTie : 0;
    return { score, correct, outcome, perfect, coins, bonus, earned: score + bonus };
  }

  /** Tin's run for a seed: the same every time, so a rematch is the same race. */
  function tinRun(seed) {
    const rand = rng(`tin:${seed}`);
    const points = [];
    let streak = 0;
    for (let i = 0; i < MATCH.questions; i += 1) {
      const correct = rand() < TIN.accuracy;
      const ms = TIN.fastestMs + rand() * (TIN.slowestMs - TIN.fastestMs);
      streak = correct ? streak + 1 : 0;
      points.push(pointsFor({ correct, ms, streak }));
    }
    return points;
  }

  return {
    MATCH,
    MAX_QUESTION_POINTS,
    REWARDS,
    TIN,
    newSeed,
    buildMatch,
    pointsFor,
    streakBonus,
    total,
    isPlausibleRun,
    outcomeOf,
    rewardsFor,
    tinRun,
  };
}));
