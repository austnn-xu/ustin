'use strict';

/**
 * US Tin — keeping big numbers sane.
 *
 * Simulator games on Roblox hit the same wall every time they get popular: totals grow until they overflow, lose
 * precision, or become walls of digits nobody can read. They solve it in three ways, and so does this app:
 *
 *  1. **A ceiling inside exact arithmetic.** JavaScript (like Roblox's Luau) stores numbers as 64-bit floats, which
 *     count exactly only up to 2^53 ≈ 9.007 quadrillion. Every counter here — coins, XP, leaderboard points — saturates
 *     at MAX_POINTS, 9 quadrillion, just under that line. Past it, adding more does nothing instead of corrupting the
 *     number. The database applies the same ceiling (supabase/migrations), and its bigint columns could hold a
 *     thousand times more.
 *  2. **Short suffixes.** 12,400,000 is shown as 12.4M, the way simulator games show it: K, M, B, T, Qa, Qi, …
 *     always at most three significant digits, rounded down so a total never looks bigger than it is.
 *  3. **Resets that keep the race small.** The numbers people actually compete on reset: league points every week,
 *     and Pristine's rating (RR) moves by tens per match. Only the all-time total keeps growing, and at about 15,000
 *     points a match it would take tens of billions of matches to reach the ceiling.
 */

(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') root.USTinNumbers = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  /** 9 quadrillion: the highest any counter goes. Below 2^53, so every value up to it is exact. */
  const MAX_POINTS = 9e15;

  /** Thousand, million, billion, trillion, quadrillion, quintillion, … (the suffixes simulator players know). */
  const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

  const finite = (n) => typeof n === 'number' && Number.isFinite(n);

  /** A whole number in [0, MAX_POINTS]. Anything else (NaN, negative, too big) is pulled back in. */
  function clampPoints(n) {
    if (!finite(n)) return 0;
    return Math.max(0, Math.min(MAX_POINTS, Math.floor(n)));
  }

  /** a + b, saturating at MAX_POINTS instead of overflowing. */
  function addPoints(a, b) {
    return clampPoints(clampPoints(a) + clampPoints(b));
  }

  /**
   * A number for people: in full with commas below `from` (9,999), then three significant digits and a suffix:
   * 12.4K, 999K, 1.23M, 45.6B, 7.89T, 9Qa. Rounded down, never up.
   */
  function compact(n, from = 10000) {
    if (!finite(n)) return '0';
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    if (abs < from) return sign + Math.floor(abs).toLocaleString('en-US');
    let tier = Math.floor(Math.log10(abs) / 3);
    // log10 can land a hair under an exact power of ten; nudge it back.
    if (abs >= 10 ** ((tier + 1) * 3)) tier += 1;
    if (tier >= SUFFIXES.length) return sign + abs.toExponential(2).replace('+', '');
    const scaled = abs / 10 ** (tier * 3);
    const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
    const f = 10 ** decimals;
    // A tiny epsilon so 1.23 stored as 1.2299999 still floors to 1.23.
    const value = Math.floor(scaled * f + 1e-9) / f;
    return sign + String(Number(value.toFixed(decimals))) + SUFFIXES[tier];
  }

  return { MAX_POINTS, SUFFIXES, clampPoints, addPoints, compact };
}));
