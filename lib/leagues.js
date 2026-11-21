'use strict';

/**
 * US Tin — leagues: competing with people at your own level.
 *
 * Eight leagues, climbed one week at a time. In Bronze through Ruby you are put in a group of up to 30 players from
 * the same league who played that week (Duolingo's leagues); league points are your match points that week, the top
 * of the group moves up, the bottom moves down, and everyone starts the next week at zero. That reset is what keeps
 * the numbers people race on small (see numbers.js).
 *
 * The top league, Pristine, works like Valorant's Radiant: no groups and no weekly reset, one ladder of every Pristine
 * player ranked by rating (RR). Quick matches against other players move RR up or down by tens, Elo-style (beat a
 * higher-rated player for more, lose to a lower-rated one for more); drop below 0 RR and you are back in Ruby. Matches
 * against Tin and game PINs never change RR, so it cannot be farmed.
 *
 * Quick match pairs you with runs from your own league (and, in Pristine, the closest RR): equal skill, like chess
 * matchmaking.
 *
 * The database applies these rules (supabase/migrations); test/leagues.test.js keeps the numbers identical.
 */

(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') root.USTinLeagues = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  /** In order, lowest first. `promote` / `demote`: how many of a group go up / down at the end of the week. */
  const LEAGUES = [
    { id: 'bronze', name: 'Bronze', promote: 10, demote: 0 },
    { id: 'silver', name: 'Silver', promote: 10, demote: 5 },
    { id: 'gold', name: 'Gold', promote: 7, demote: 5 },
    { id: 'emerald', name: 'Emerald', promote: 7, demote: 5 },
    { id: 'diamond', name: 'Diamond', promote: 5, demote: 5 },
    { id: 'sapphire', name: 'Sapphire', promote: 5, demote: 5 },
    { id: 'ruby', name: 'Ruby', promote: 3, demote: 5 },
    { id: 'pristine', name: 'Pristine', promote: 0, demote: 0, ranked: true },
  ];

  const PRISTINE = LEAGUES.length - 1;
  /** Players per weekly group. */
  const GROUP_SIZE = 30;
  /** Pristine is earned against real competition: a Ruby group needs at least this many players to send anyone up. */
  const MIN_GROUP_FOR_PRISTINE = 5;

  const RR = {
    /** How far one match can move the rating (the Elo K-factor). */
    k: 32,
    /** A win is always worth at least this. */
    minWin: 5,
    /** And no single match moves it more than this either way. */
    maxChange: 40,
    /** Against a player from a lower league you are expected to win this often (so beating them earns little). */
    expectedVsLower: 0.75,
  };

  const byId = (id) => LEAGUES.findIndex((l) => l.id === id);

  /**
   * Where a finished week leaves you, from your place in your group. Ties are already broken by the time `rank` is
   * worked out (more points first, then whoever got there first).
   */
  function weekResult({ league, rank, size }) {
    const l = LEAGUES[league];
    if (!l || l.ranked || !(rank >= 1) || !(size >= rank)) return 'stay';
    const gatedOut = league === PRISTINE - 1 && size < MIN_GROUP_FOR_PRISTINE;
    if (l.promote > 0 && rank <= l.promote && !gatedOut) return 'promote';
    if (l.demote > 0 && rank > Math.max(l.promote, size - l.demote)) return 'demote';
    return 'stay';
  }

  /** The zone a rank sits in right now, for drawing a group's table. */
  function zoneOf({ league, rank, size }) {
    const r = weekResult({ league, rank, size });
    return r === 'promote' ? 'up' : r === 'demote' ? 'down' : 'safe';
  }

  /** Chance of winning, Elo: 50% at equal rating, about 91% when 400 RR above. */
  function expectedScore(mine, theirs) {
    return 1 / (1 + 10 ** ((theirs - mine) / 400));
  }

  /**
   * How a Pristine player's RR changes after a quick match against another player. `rivalRR` is null when the rival
   * is not in Pristine. `result`: 1 win, 0.5 tie, 0 loss.
   */
  function rrChange({ myRR, rivalRR, result }) {
    const expected = rivalRR == null ? RR.expectedVsLower : expectedScore(myRR, rivalRR);
    let d = Math.round(RR.k * (result - expected));
    if (result === 1) d = Math.max(d, RR.minWin);
    return Math.max(-RR.maxChange, Math.min(RR.maxChange, d));
  }

  /** Monday 00:00 UTC of the week containing `date`, as YYYY-MM-DD: when every group starts and ends. */
  function weekStart(date = new Date()) {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = (d.getUTCDay() + 6) % 7; // Monday = 0
    d.setUTCDate(d.getUTCDate() - day);
    return d.toISOString().slice(0, 10);
  }

  /** Milliseconds until this week's groups close. */
  function msUntilWeekEnd(now = new Date()) {
    const start = new Date(`${weekStart(now)}T00:00:00Z`);
    return start.getTime() + 7 * 24 * 3600 * 1000 - now.getTime();
  }

  return { LEAGUES, PRISTINE, GROUP_SIZE, MIN_GROUP_FOR_PRISTINE, RR, byId, weekResult, zoneOf, expectedScore, rrChange, weekStart, msUntilWeekEnd };
}));
