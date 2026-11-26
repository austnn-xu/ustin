'use strict';

/**
 * US Tin — talking to the Overpass API (OpenStreetMap's place search) without waiting forever.
 *
 * Overpass is free, shared and often busy. The first version of Near me asked one mirror at a time with a 30 second
 * timeout, and widened the search radius up to three times, so a slow afternoon could take 3 x 3 x 30 s: minutes.
 * This module is what makes it fast and honest instead:
 *
 *  - `fetchOverpass` starts the mirrors one after another, a moment apart, and takes whichever answers first. A mirror
 *    that fails (or answers 200 with a "runtime error: query timed out" remark and no data, which Overpass does) hands
 *    over to the next immediately instead of after its timeout. The losers are cancelled.
 *  - `widen` tries the radii nearest first, but the whole search has one deadline. If the deadline hits after a
 *    smaller radius already found something, you get that rather than an error.
 *
 * Plain JavaScript with the network passed in, so the tests can drive it with a fake and tiny timings.
 */

(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') root.USTinOverpass = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULTS = {
    /** How long one mirror gets before it counts as failed. */
    timeoutMs: 11000,
    /** The next mirror starts this long after the previous one (sooner if the previous one fails). */
    staggerMs: 2500,
    /** The whole search, across every radius. */
    deadlineMs: 28000,
  };

  class TimeoutError extends Error {
    constructor(message) {
      super(message || 'The map service took too long.');
      this.name = 'TimeoutError';
    }
  }

  /** Overpass reports a failed query as a normal 200 with a `remark` and (usually) no elements. */
  function problemWith(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.elements)) return 'Overpass sent something unexpected';
    if (typeof data.remark === 'string' && /runtime error|out of memory|timed out|too busy/i.test(data.remark)) return `Overpass: ${data.remark.slice(0, 120)}`;
    return null;
  }

  /**
   * Run one query against several mirrors (`onSuccess(endpoint)` is told which one answered, so the caller can ask
   * it first next time) and resolve with the first good `elements` array.
   * Rejects when every mirror has failed, when `signal` aborts, or never later than the mirrors' own timeouts.
   */
  function fetchOverpass(query, options) {
    const o = Object.assign({}, DEFAULTS, options);
    const endpoints = o.endpoints;
    const doFetch = o.fetch;
    return new Promise((resolve, reject) => {
      let settled = false;
      let started = 0;
      let failed = 0;
      let lastError = null;
      let nextTimer = null;
      const controllers = [];
      const timers = [];

      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(nextTimer);
        timers.forEach(clearTimeout);
        controllers.forEach((c) => c.abort());
        if (o.signal && onAbort) o.signal.removeEventListener('abort', onAbort);
        fn(value);
      };

      let onAbort = null;
      if (o.signal) {
        if (o.signal.aborted) return reject(new TimeoutError());
        onAbort = () => finish(reject, new TimeoutError());
        o.signal.addEventListener('abort', onAbort);
      }

      const startNext = () => {
        if (settled || started >= endpoints.length) return;
        const endpoint = endpoints[started++];
        const controller = new AbortController();
        controllers.push(controller);
        timers.push(setTimeout(() => controller.abort(), o.timeoutMs));
        // Another mirror joins in after the stagger, unless this one answers first.
        clearTimeout(nextTimer);
        if (started < endpoints.length) nextTimer = setTimeout(startNext, o.staggerMs);

        Promise.resolve()
          .then(() =>
            doFetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `data=${encodeURIComponent(query)}`,
              signal: controller.signal,
            }),
          )
          .then(async (res) => {
            if (!res.ok) throw new Error(`Overpass ${res.status}`);
            const data = await res.json();
            const bad = problemWith(data);
            if (bad) throw new Error(bad);
            return data.elements;
          })
          .then(
            (elements) => {
              if (!settled && o.onSuccess) o.onSuccess(endpoint);
              finish(resolve, elements);
            },
            (err) => {
              if (settled) return;
              lastError = err;
              failed++;
              if (failed >= endpoints.length) finish(reject, lastError);
              else startNext(); // hand over now, do not wait for the stagger
            },
          );
      };

      startNext();
    });
  }

  /**
   * Try each radius nearest first with one deadline for everything.
   * `run(radius, signal)` returns the sites for that radius; `enough(sites)` says when to stop widening.
   * Resolves `{ value, radius }`. If a later radius fails or the deadline passes, the best earlier result is returned;
   * with nothing at all, the error is thrown.
   */
  async function widen({ radii, run, enough, deadlineMs, now }) {
    const clock = now || Date.now;
    const limit = deadlineMs || DEFAULTS.deadlineMs;
    const start = clock();
    const master = new AbortController();
    const timer = setTimeout(() => master.abort(), limit);
    let best = null;
    let lastError = null;
    try {
      for (const radius of radii) {
        if (master.signal.aborted) break;
        try {
          const value = await run(radius, master.signal);
          best = { value, radius };
          if (enough(value)) break;
        } catch (err) {
          lastError = err;
          break; // the mirrors are failing or the clock ran out: wider will not help
        }
        if (clock() - start >= limit) break;
      }
    } finally {
      clearTimeout(timer);
    }
    if (best) return best;
    throw lastError || new TimeoutError();
  }

  return { DEFAULTS, TimeoutError, problemWith, fetchOverpass, widen };
}));
