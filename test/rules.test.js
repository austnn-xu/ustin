'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { OBJECTS, OUTCOMES, QUESTIONS, findObject, matchObject, questionsFor, resolve } = require('../lib/rules');
const { identify } = require('../lib/identify');

const outcomesOf = (result) => result.components.map((c) => c.outcome.id);

test('catalog is internally consistent', () => {
  const ids = new Set();
  for (const obj of OBJECTS) {
    assert.ok(!ids.has(obj.id), `duplicate object id: ${obj.id}`);
    ids.add(obj.id);
    assert.ok(obj.components.length > 0, `${obj.id} has no components`);

    for (const c of obj.components) {
      assert.ok(OUTCOMES[c.outcome], `${obj.id}: unknown outcome "${c.outcome}"`);
      assert.ok(c.why && c.why.length > 20, `${obj.id}: component "${c.label}" needs a real explanation`);

      for (const q of c.questions || []) {
        assert.ok(QUESTIONS[q], `${obj.id}: unknown question "${q}"`);
      }

      for (const rule of c.rules || []) {
        assert.ok(OUTCOMES[rule.outcome], `${obj.id}: rule targets unknown outcome "${rule.outcome}"`);
        assert.ok(rule.why, `${obj.id}: rule missing explanation`);

        // A rule can only key off a question the component actually asks,
        // otherwise it can never fire.
        for (const key of Object.keys(rule.when)) {
          assert.ok(
            (c.questions || []).includes(key),
            `${obj.id}: rule keys off "${key}" but the component never asks it`,
          );
        }
      }
    }
  }
});

test('every question is reachable and well formed', () => {
  const used = new Set();
  for (const obj of OBJECTS) {
    for (const c of obj.components) (c.questions || []).forEach((q) => used.add(q));
  }
  for (const [id, q] of Object.entries(QUESTIONS)) {
    assert.ok(used.has(id), `question "${id}" is never asked by any object`);
    assert.ok(q.options.length >= 2, `question "${id}" needs at least two options`);
  }
});

test('questions are deduplicated across components', () => {
  const pizza = findObject('pizza-box');
  const ids = questionsFor(pizza).map((q) => q.id);
  assert.deepStrictEqual(ids, [...new Set(ids)], 'a question should only be asked once');
});

test('an object with no conditional rules asks nothing', () => {
  assert.deepStrictEqual(questionsFor(findObject('coffee-cup')), []);
});

test('coffee cup splits three materials across two destinations', () => {
  const result = resolve(findObject('coffee-cup'));
  assert.strictEqual(result.components.length, 3);
  assert.deepStrictEqual(outcomesOf(result), ['trash', 'recycle', 'recycle']);
  assert.strictEqual(result.split, true);
});

test('grease flips the pizza box lid from recycling to compost', () => {
  const box = findObject('pizza-box');
  assert.strictEqual(resolve(box, { grease: 'no' }).components[0].outcome.id, 'recycle');
  assert.strictEqual(resolve(box, { grease: 'yes' }).components[0].outcome.id, 'compost');
});

test('no compost collection sends organics to landfill', () => {
  const result = resolve(findObject('food-scraps'), { composting: 'no' });
  assert.strictEqual(result.components[0].outcome.id, 'trash');
});

test('a part-full aerosol becomes hazardous drop-off', () => {
  const can = findObject('aerosol-can');
  assert.strictEqual(resolve(can, { empty: 'yes' }).components[0].outcome.id, 'recycle');
  assert.strictEqual(resolve(can, { empty: 'no' }).components[0].outcome.id, 'dropoff');
});

test('working electronics are routed to reuse over recycling', () => {
  const device = findObject('electronics');
  assert.strictEqual(resolve(device, { condition: 'good' }).components[0].outcome.id, 'reuse');
  assert.strictEqual(resolve(device, { condition: 'broken' }).components[0].outcome.id, 'dropoff');
});

test('a later rule wins over an earlier one', () => {
  // A clean, intact jar should be reuse, not merely recycle.
  const result = resolve(findObject('glass-jar'), { rinsed: 'yes', condition: 'good' });
  assert.strictEqual(result.components[0].outcome.id, 'reuse');
});

test('headline never understates the most careful outcome', () => {
  // The cup body is trash while two parts recycle — trash must lead.
  assert.strictEqual(resolve(findObject('coffee-cup')).headline.id, 'trash');
  // Drop-off outranks everything.
  assert.strictEqual(resolve(findObject('medication')).headline.id, 'dropoff');
});

test('unanswered questions fall back to the base outcome', () => {
  const result = resolve(findObject('pizza-box'), {});
  assert.strictEqual(result.components[0].outcome.id, 'recycle');
});

test('matchObject prefers the most specific term', () => {
  assert.strictEqual(matchObject('plastic bottle').id, 'plastic-bottle');
  assert.strictEqual(matchObject('Pizza Box').id, 'pizza-box');
  assert.strictEqual(matchObject(''), null);
  assert.strictEqual(matchObject('quantum toaster'), null);
});

test('recognition stub is deterministic and prefers a user hint', () => {
  const image = Buffer.from('a fixed test image');
  assert.strictEqual(identify(image).object.id, identify(image).object.id);

  const hinted = identify(image, 'battery');
  assert.strictEqual(hinted.object.id, 'battery');
  assert.strictEqual(hinted.source, 'user');
  assert.strictEqual(hinted.confidence, 1);

  assert.strictEqual(identify(null), null);
});
