'use strict';

/**
 * Object recognition — STUBBED.
 *
 * This is the one piece of the product that is faked. Everything downstream
 * (materials, streams, follow-up questions, disposal logic) is real.
 *
 * The stub derives its guess from a hash of the image bytes, so the same photo
 * always returns the same object. That keeps demos repeatable and makes the
 * "wrong guess -> correct it" path easy to show.
 *
 * To make it real, replace the body of `identify()` with a vision model call
 * that returns `{ label, confidence }`; `matchObject()` already maps a
 * free-text label onto the catalog, so nothing else has to change.
 */

(function (root, factory) {
  // Node (server + tests) pulls the catalog in; the browser already has it on
  // window from rules.js, loaded first.
  const rules = typeof require === 'function' ? require('./rules') : root.USTinRules;
  const api = factory(rules);

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') root.USTinIdentify = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (rules) {
  const { OBJECTS, matchObject } = rules;
  const STUBBED = true;

  /**
   * FNV-1a over the image bytes. Deliberately not node:crypto — this has to
   * run in the browser too, and a stub does not need a real digest.
   */
  function hash(bytes) {
    let h = 0x811c9dc5;
    // A few thousand bytes is plenty to spread the input, and it keeps the
    // hash cheap on a multi-megapixel photo.
    const step = Math.max(1, Math.floor(bytes.length / 4096));
    for (let i = 0; i < bytes.length; i += step) {
      h ^= bytes[i];
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  function identify(imageBytes, hint) {
    // A caller-supplied hint (the user picking from the list) always wins.
    if (hint) {
      const picked = matchObject(hint);
      if (picked) return { object: picked, confidence: 1, source: 'user' };
    }

    if (!imageBytes || !imageBytes.length) return null;

    const h = hash(imageBytes);
    const object = OBJECTS[h % OBJECTS.length];

    // A plausible-looking 0.72-0.95, stable for a given image.
    const confidence = 0.72 + ((h >>> 8) & 0xff) / 255 * 0.23;

    return { object, confidence: Number(confidence.toFixed(2)), source: 'stub' };
  }

  return { identify, STUBBED };
}));
