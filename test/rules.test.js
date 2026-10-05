'use strict';

const test = require('node:test');
const assert = require('node:assert');

const {
  OBJECTS, OUTCOMES, STREAMS, ACCEPTANCE, QUESTIONS,
  findObject, matchObject, questionsFor, resolve,
} = require('../lib/rules');

const outcomesOf = (result) => result.components.map((c) => c.outcome.id);
const streamsOf = (result) => result.components.map((c) => (c.stream ? c.stream.id : null));

test('catalog is internally consistent', () => {
  const ids = new Set();
  for (const obj of OBJECTS) {
    assert.ok(!ids.has(obj.id), `duplicate object id: ${obj.id}`);
    ids.add(obj.id);
    assert.ok(obj.components.length > 0, `${obj.id} has no components`);

    for (const c of obj.components) {
      assert.ok(OUTCOMES[c.outcome], `${obj.id}: unknown outcome "${c.outcome}"`);
      assert.ok(c.why && c.why.length > 20, `${obj.id}: component "${c.label}" needs a real explanation`);
      if (c.stream) assert.ok(STREAMS[c.stream], `${obj.id}: unknown stream "${c.stream}"`);

      // Anything that recycles or goes to drop-off must say WHICH stream —
      // "recycling" on its own is the vagueness this app exists to fix.
      if (c.outcome === 'recycle' || c.outcome === 'dropoff') {
        assert.ok(c.stream, `${obj.id}: component "${c.label}" is ${c.outcome} but names no stream`);
      }

      for (const q of c.questions || []) {
        assert.ok(QUESTIONS[q], `${obj.id}: unknown question "${q}"`);
      }

      for (const rule of c.rules || []) {
        assert.ok(OUTCOMES[rule.outcome], `${obj.id}: rule targets unknown outcome "${rule.outcome}"`);
        assert.ok(rule.why, `${obj.id}: rule missing explanation`);
        if (rule.stream) assert.ok(STREAMS[rule.stream], `${obj.id}: rule targets unknown stream "${rule.stream}"`);

        if (rule.outcome === 'recycle' || rule.outcome === 'dropoff') {
          assert.ok(rule.stream, `${obj.id}: rule sends to ${rule.outcome} but names no stream`);
        }

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
  assert.deepStrictEqual(questionsFor(findObject('receipt')), []);
  assert.deepStrictEqual(questionsFor(findObject('foam-takeout-tray')), []);
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
  const device = findObject('smartphone');
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

// --- recycling streams -----------------------------------------------------

test('stream catalog is well formed', () => {
  for (const [id, s] of Object.entries(STREAMS)) {
    assert.strictEqual(s.id, id, `stream "${id}" has a mismatched id`);
    assert.ok(ACCEPTANCE[s.acceptance], `stream "${id}" has unknown acceptance "${s.acceptance}"`);
    assert.ok(s.code && s.short && s.label && s.family, `stream "${id}" is missing display fields`);
    assert.ok(s.note.length > 20, `stream "${id}" needs a real note`);
  }
});

test('every stream is actually reachable from some object', () => {
  const used = new Set();
  for (const obj of OBJECTS) {
    for (const c of obj.components) {
      if (c.stream) used.add(c.stream);
      for (const rule of c.rules || []) if (rule.stream) used.add(rule.stream);
    }
  }
  for (const id of Object.keys(STREAMS)) {
    assert.ok(used.has(id), `stream "${id}" is defined but never used`);
  }
});

test('resolve expands a stream with its resin code and acceptance', () => {
  const bottle = resolve(findObject('water-bottle'));
  const [body, cap] = bottle.components;

  assert.strictEqual(body.stream.code, '#1');
  assert.strictEqual(body.stream.short, 'PET');
  assert.strictEqual(body.stream.family, 'Plastic');
  assert.strictEqual(body.stream.acceptance.id, 'widely');
  assert.strictEqual(cap.stream.code, '#5');
});

test('the same outcome can still mean different streams', () => {
  // Both parts of a carton "recycle", but into two different streams.
  const carton = resolve(findObject('milk-carton'));
  assert.deepStrictEqual(outcomesOf(carton), ['recycle', 'recycle']);
  assert.deepStrictEqual(streamsOf(carton), ['carton', 'hdpe']);
  assert.strictEqual(carton.split, true, 'differing streams should count as a split');
});

test('a jar and its lid recycle into different streams', () => {
  const jar = resolve(findObject('glass-jar'), { rinsed: 'yes', condition: 'broken' });
  assert.deepStrictEqual(streamsOf(jar), ['glass', 'steel']);
});

test('rules can change the stream, not just the outcome', () => {
  const cup = findObject('coffee-cup');
  // A lined paper hot cup is landfill with no stream...
  assert.strictEqual(resolve(cup, { cupType: 'paper' }).components[0].stream, null);
  // ...while a clear cold cup is single-material #1 PET.
  const cold = resolve(cup, { cupType: 'plastic' }).components[0];
  assert.strictEqual(cold.outcome.id, 'recycle');
  assert.strictEqual(cold.stream.id, 'pet');
});

test('a rule clearing the stream does not fall back to the base stream', () => {
  // A reusable jar has no recycling stream at all — it must not keep 'glass'.
  const jar = resolve(findObject('glass-jar'), { rinsed: 'yes', condition: 'good' }).components[0];
  assert.strictEqual(jar.outcome.id, 'reuse');
  assert.strictEqual(jar.stream, null, 'reuse must not inherit the glass stream');
});

test('a trash verdict still names the material that caused it', () => {
  // Rigid #5 PP recycles, but the same product as foam is #6 PS and does not.
  const tub = findObject('takeout-container');
  assert.strictEqual(resolve(tub, { tubRigid: 'rigid', rinsed: 'yes' }).components[0].stream.id, 'pp');

  const foam = resolve(tub, { tubRigid: 'foam' }).components[0];
  assert.strictEqual(foam.outcome.id, 'trash');
  assert.strictEqual(foam.stream.id, 'ps');
  assert.strictEqual(foam.stream.acceptance.id, 'rarely', 'the chip should explain why it is trash');
});

test('film routes to store drop-off unless the program takes it curbside', () => {
  const bag = findObject('produce-bag');
  const dropoff = resolve(bag, { filmPlastic: 'no' }).components[0];
  assert.strictEqual(dropoff.outcome.id, 'dropoff');
  assert.strictEqual(dropoff.stream.id, 'filmDropoff');

  const curbside = resolve(bag, { filmPlastic: 'yes' }).components[0];
  assert.strictEqual(curbside.outcome.id, 'recycle');
  assert.strictEqual(curbside.stream.id, 'ldpe');
});

test('summary streams are deduplicated', () => {
  const result = resolve(findObject('coffee-cup'), { cupType: 'plastic' });
  const ids = result.streams.map((s) => s.id);
  assert.deepStrictEqual(ids, [...new Set(ids)]);
  // pet (body) + pp (lid) + paper (sleeve)
  assert.deepStrictEqual(ids.sort(), ['paper', 'pet', 'pp']);
});

test('acceptance is honest about low-value plastics', () => {
  assert.strictEqual(STREAMS.pet.acceptance, 'widely');
  assert.strictEqual(STREAMS.pp.acceptance, 'widely');
  assert.strictEqual(STREAMS.ps.acceptance, 'rarely');
  assert.strictEqual(STREAMS.pvc.acceptance, 'rarely');
  assert.strictEqual(STREAMS.ldpe.acceptance, 'rarely');
});

test('matchObject prefers the most specific term', () => {
  assert.strictEqual(matchObject('plastic bottle').id, 'water-bottle');
  assert.strictEqual(matchObject('Pizza Box').id, 'pizza-box');
  assert.strictEqual(matchObject(''), null);
  assert.strictEqual(matchObject('xylophone'), null);
});
