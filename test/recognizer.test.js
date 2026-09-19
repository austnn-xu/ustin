'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { OBJECTS, findObject } = require('../lib/rules');
const { LABELS } = require('../lib/imagenet-labels');
const {
  interpret, shortLabel, MAPPING, UNREACHABLE_OBJECTS, RECOGNITION_FLOOR,
} = require('../lib/recognizer');

/** A 1000-class distribution with the named classes set to the given mass. */
function distribution(weights) {
  const probabilities = new Float32Array(LABELS.length);
  for (const [name, p] of Object.entries(weights)) {
    const index = LABELS.indexOf(name);
    assert.notStrictEqual(index, -1, `no such ILSVRC class: ${name}`);
    probabilities[index] = p;
  }
  return probabilities;
}

test('every mapped class name is a real ILSVRC class', () => {
  const known = new Set(LABELS);
  for (const name of Object.keys(MAPPING)) {
    assert.ok(known.has(name), `mapping names a class the model cannot emit: "${name}"`);
  }
});

test('every mapping target is a catalog object, with sane weights', () => {
  for (const [name, target] of Object.entries(MAPPING)) {
    const pairs = typeof target === 'string' ? [[target, 1]] : Object.entries(target);

    let total = 0;
    for (const [id, weight] of pairs) {
      assert.ok(findObject(id), `"${name}" maps to unknown object "${id}"`);
      assert.ok(weight > 0 && weight <= 1, `"${name}" -> "${id}" has weight ${weight}`);
      total += weight;
    }

    // A split mapping shares one class's probability out; it must not invent
    // confidence by summing to more than the class itself carried.
    assert.ok(Math.abs(total - 1) < 1e-6, `"${name}" weights sum to ${total}, not 1`);
  }
});

test('UNREACHABLE_OBJECTS names exactly what the camera cannot reach', () => {
  const reachable = new Set();
  for (const target of Object.values(MAPPING)) {
    if (typeof target === 'string') reachable.add(target);
    else Object.keys(target).forEach((id) => reachable.add(id));
  }

  const actual = OBJECTS.map((o) => o.id).filter((id) => !reachable.has(id)).sort();
  assert.deepStrictEqual(actual, [...UNREACHABLE_OBJECTS].sort());
});

test('a confident class resolves to its catalog object', () => {
  const reading = interpret(distribution({ 'coffee mug': 0.71 }));

  assert.strictEqual(reading.recognized, true);
  assert.strictEqual(reading.candidates[0].object.id, 'coffee-cup');
  assert.strictEqual(reading.saw.label, 'coffee mug');
});

test('related classes accumulate rather than competing', () => {
  // No single glass class clears the floor; together they clearly should.
  const reading = interpret(distribution({
    'beer bottle': 0.09, 'wine bottle': 0.07, goblet: 0.06,
  }));

  assert.strictEqual(reading.recognized, true);
  assert.strictEqual(reading.candidates[0].object.id, 'glass-jar');
  assert.ok(reading.candidates[0].score > RECOGNITION_FLOOR);
});

test('a split class keeps the alternative alive', () => {
  const reading = interpret(distribution({ 'pizza, pizza pie': 0.8 }));
  const ids = reading.candidates.map((c) => c.object.id);

  assert.strictEqual(ids[0], 'pizza-box');
  assert.ok(ids.includes('food-scraps'), 'food scraps should stay on offer');
});

test('an unmapped subject is reported as unrecognised, not guessed at', () => {
  const reading = interpret(distribution({ 'tiger cat': 0.94 }));

  assert.strictEqual(reading.recognized, false);
  assert.strictEqual(reading.saw.label, 'tiger cat');
});

test('noise below the class floor never contributes', () => {
  const reading = interpret(distribution({ 'coffee mug': 0.003, cup: 0.002 }));
  assert.strictEqual(reading.recognized, false);
});

test('candidates are ranked and capped', () => {
  const reading = interpret(distribution({
    'coffee mug': 0.4, 'beer bottle': 0.2, 'jersey, T-shirt, tee shirt': 0.1, 'laptop, laptop computer': 0.05,
  }), { limit: 2 });

  assert.strictEqual(reading.candidates.length, 2);
  assert.ok(reading.candidates[0].score >= reading.candidates[1].score);
});

test('shortLabel keeps the first synonym only', () => {
  assert.strictEqual(shortLabel('pizza, pizza pie'), 'pizza');
  assert.strictEqual(shortLabel('carton'), 'carton');
});
