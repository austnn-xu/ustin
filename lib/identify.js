'use strict';

const crypto = require('node:crypto');
const { OBJECTS, matchObject } = require('./rules');

/**
 * Object recognition — STUBBED.
 *
 * This is the one piece of the product that is faked. Everything downstream
 * (materials, follow-up questions, disposal logic) is real.
 *
 * The stub derives its guess from a hash of the image bytes, so the same photo
 * always returns the same object. That keeps demos repeatable and makes the
 * "wrong guess → correct it" path easy to show.
 *
 * To make it real, replace the body of `identify()` with a vision model call
 * that returns `{ label, confidence }`; `matchObject()` already maps a free-text
 * label onto the catalog, so nothing else has to change.
 */

const STUBBED = true;

function identify(imageBuffer, hint) {
  // A caller-supplied hint (the user picking from the list) always wins.
  if (hint) {
    const picked = matchObject(hint);
    if (picked) {
      return { object: picked, confidence: 1, source: 'user' };
    }
  }

  if (!imageBuffer || !imageBuffer.length) return null;

  const digest = crypto.createHash('sha256').update(imageBuffer).digest();
  const object = OBJECTS[digest.readUInt32BE(0) % OBJECTS.length];

  // A plausible-looking 0.72–0.95, stable for a given image.
  const confidence = 0.72 + (digest[4] / 255) * 0.23;

  return { object, confidence: Number(confidence.toFixed(2)), source: 'stub' };
}

module.exports = { identify, STUBBED };
