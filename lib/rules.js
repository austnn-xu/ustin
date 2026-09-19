'use strict';

/**
 * US Tin — the decision engine.
 *
 * The knowledge lives in two files beside this one: lib/streams.js holds the
 * outcomes, material streams and follow-up questions, and lib/catalog.js holds
 * the objects themselves. This file turns an object plus a set of answers into
 * a per-component verdict, and is the only module the app and the tests talk
 * to.
 *
 * It runs unchanged in Node (server + tests) and in the browser (static
 * build), so the knowledge base has exactly one copy.
 */

(function (root, factory) {
  const isNode = typeof require === 'function';
  const streams = isNode ? require('./streams') : root.USTinStreams;
  const catalog = isNode ? require('./catalog') : root.USTinCatalog;
  const api = factory(streams, catalog);

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') root.USTinRules = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (streams, catalog) {
  const { OUTCOMES, ACCEPTANCE, STREAMS, QUESTIONS } = streams;
  const { OBJECTS } = catalog;

  function findObject(id) {
    return OBJECTS.find((o) => o.id === id) || null;
  }

  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  /**
   * Whole-word containment. Plain substring matching finds "phone" inside
   * "xylophone" and confidently tells you to take it to an e-waste point.
   */
  function containsWord(haystack, word) {
    return new RegExp(`(^|[^a-z0-9])${escapeRe(word)}([^a-z0-9]|$)`).test(haystack);
  }

  /** Fuzzy lookup that turns a free-text label into a catalog entry. */
  function matchObject(text) {
    const needle = String(text || '').toLowerCase().trim();
    if (!needle) return null;

    const exact = OBJECTS.find((o) => o.id === needle || o.match.includes(needle));
    if (exact) return exact;

    // Prefer the longest matching term so "plastic bottle" beats a bare
    // "bottle".
    let best = null;
    let bestLen = 0;
    for (const obj of OBJECTS) {
      for (const term of obj.match) {
        const hit = containsWord(needle, term) || containsWord(term, needle);
        if (hit && term.length > bestLen) {
          best = obj;
          bestLen = term.length;
        }
      }
    }
    return best;
  }

  /**
   * Free-text search over the catalog, ranked so an exact label beats a label
   * prefix, which beats an alias, which beats a substring anywhere.
   */
  function search(query, limit) {
    const needle = String(query || '').toLowerCase().trim();
    if (!needle) return OBJECTS.slice(0, limit || OBJECTS.length);

    const scored = [];
    for (const obj of OBJECTS) {
      const label = obj.label.toLowerCase();
      let score = 0;

      if (label === needle) score = 100;
      else if (label.startsWith(needle)) score = 80;
      else if (label.includes(needle)) score = 60;
      else if (obj.match.some((t) => t === needle)) score = 55;
      else if (obj.match.some((t) => t.startsWith(needle))) score = 40;
      else if (obj.match.some((t) => t.includes(needle))) score = 25;
      else if (obj.components.some((c) => c.material.toLowerCase().includes(needle))) score = 12;

      if (score) scored.push({ obj, score, label });
    }

    scored.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
    return scored.slice(0, limit || scored.length).map((s) => s.obj);
  }

  /** The follow-up questions this object actually needs, in catalog order. */
  function questionsFor(obj) {
    const ids = [];
    for (const c of obj.components) {
      for (const q of c.questions || []) {
        if (!ids.includes(q)) ids.push(q);
      }
    }
    return ids.map((id) => ({ id, ...QUESTIONS[id] })).filter((q) => q.text);
  }

  function ruleMatches(rule, answers) {
    return Object.entries(rule.when).every(([k, v]) => answers[k] === v);
  }

  function expandStream(id) {
    if (!id) return null;
    const s = STREAMS[id];
    if (!s) return null;
    return { ...s, acceptance: ACCEPTANCE[s.acceptance] };
  }

  /** Resolve one object + the user's answers into a per-component verdict. */
  function resolve(obj, answers = {}) {
    const components = obj.components.map((c) => {
      let outcome = c.outcome;
      let stream = c.stream || null;
      let why = c.why;

      for (const rule of c.rules || []) {
        if (ruleMatches(rule, answers)) {
          outcome = rule.outcome;
          // `stream: null` in a rule is a deliberate clear, so only fall
          // through to the base stream when the rule omits the key entirely.
          stream = 'stream' in rule ? rule.stream : stream;
          why = rule.why;
        }
      }

      return {
        label: c.label,
        material: c.material,
        outcome: OUTCOMES[outcome],
        stream: expandStream(stream),
        why,
      };
    });

    // Headline = the outcome needing the most care, so a summary never
    // understates a hazard.
    const severity = ['dropoff', 'trash', 'compost', 'recycle', 'reuse'];
    const headline = components
      .slice()
      .sort((a, b) => severity.indexOf(a.outcome.id) - severity.indexOf(b.outcome.id))[0];

    const distinct = [...new Set(components.map((c) => c.outcome.id))];

    // Streams the user actually has to sort into, deduplicated for the summary.
    const streamList = [];
    for (const c of components) {
      if (c.stream && !streamList.some((s) => s.id === c.stream.id)) streamList.push(c.stream);
    }

    return {
      object: { id: obj.id, label: obj.label },
      components,
      headline: headline.outcome,
      streams: streamList,
      split: distinct.length > 1 || streamList.length > 1,
      tip: obj.tip || null,
      hazard: Boolean(obj.hazard),
    };
  }

  return {
    OUTCOMES,
    STREAMS,
    ACCEPTANCE,
    QUESTIONS,
    OBJECTS,
    findObject,
    matchObject,
    search,
    questionsFor,
    resolve,
  };
}));
