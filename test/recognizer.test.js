'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { OBJECTS, findObject, STREAMS } = require('../lib/rules');
const { LABELS } = require('../lib/imagenet-labels');
const {
  interpret, byMaterial, topMaterial, familiesOf, shortLabel,
  MAPPING, MATERIAL_CLASSES, RECOGNITION_FLOOR,
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

const material = (weights) => {
  const out = {};
  for (const name of MATERIAL_CLASSES) out[name] = weights[name] || 0;
  return out;
};

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

test('the camera reaches a useful share of the catalog', () => {
  const reachable = new Set();
  for (const target of Object.values(MAPPING)) {
    if (typeof target === 'string') reachable.add(target);
    else Object.keys(target).forEach((id) => reachable.add(id));
  }

  // The rest are reachable by search, by the picker, or by material. This is a
  // floor, not a target: it exists so a careless edit cannot quietly gut the
  // mapping without a test going red.
  assert.ok(reachable.size >= 60, `only ${reachable.size} objects are reachable from the camera`);
});

test('a 1001-long vector is refused rather than read one class off', () => {
  // MobileNet emits a leading background logit. A caller that forgets to drop
  // it would otherwise get confident nonsense out of every lookup.
  assert.throws(() => interpret(new Float32Array(1001)), /expected 1000 class probabilities/);
});

test('a confident class resolves to its catalog object', () => {
  const reading = interpret(distribution({ 'pop bottle, soda bottle': 0.71 }));

  assert.strictEqual(reading.recognized, true);
  assert.strictEqual(reading.candidates[0].object.id, 'soda-bottle');
  assert.strictEqual(reading.saw.label, 'pop bottle');
});

test('related classes accumulate rather than competing', () => {
  // No single clothing class clears the floor; together they clearly should.
  const reading = interpret(distribution({
    'jersey, T-shirt, tee shirt': 0.08, sweatshirt: 0.06, cardigan: 0.05,
  }));

  assert.strictEqual(reading.recognized, true);
  assert.strictEqual(reading.candidates[0].object.id, 'clothing');
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

test('the material head breaks a tie the object model cannot', () => {
  // "water bottle" is genuinely ambiguous between a plastic bottle and a
  // metal flask, and the object model splits it. The material head decides.
  const probabilities = distribution({ 'water bottle': 0.6 });

  const asPlastic = interpret(probabilities, { material: material({ plastic: 0.9 }) });
  const asMetal = interpret(probabilities, { material: material({ metal: 0.9 }) });

  assert.strictEqual(asPlastic.candidates[0].object.id, 'water-bottle');
  assert.strictEqual(asMetal.candidates[0].object.id, 'tin-can');
});

test('the material head lifts but never vetoes', () => {
  const probabilities = distribution({ 'pop bottle, soda bottle': 0.7 });
  const reading = interpret(probabilities, { material: material({ metal: 0.95 }) });

  // Wrong material, overwhelming object evidence: the bottle still wins.
  assert.strictEqual(reading.candidates[0].object.id, 'soda-bottle');
});

test('material alone narrows the catalog to something usable', () => {
  const glass = byMaterial(material({ glass: 0.88 }));

  assert.strictEqual(glass.material.id, 'glass');
  const ids = glass.objects.map((o) => o.id);
  assert.ok(ids.includes('wine-bottle'));
  assert.ok(ids.includes('glass-jar'));
  assert.ok(!ids.includes('clothing'), 'clothing is not glass');
  assert.ok(glass.objects.length < OBJECTS.length / 3, 'a material should be a real narrowing');
});

test('an unsure material head is not leaned on', () => {
  assert.strictEqual(byMaterial(material({ glass: 0.3, plastic: 0.28, metal: 0.22 })), null);
});

test('topMaterial reports the head\'s own best guess', () => {
  const top = topMaterial(material({ cardboard: 0.7, paper: 0.2 }));
  assert.strictEqual(top.id, 'cardboard');
  assert.strictEqual(top.family, 'Fibre');
});

test('every object family is a family some stream actually declares', () => {
  const declared = new Set(Object.values(STREAMS).map((s) => s.family));
  declared.add('Fibre'); // cartons are folded into fibre for material matching

  for (const object of OBJECTS) {
    for (const family of familiesOf(object)) {
      assert.ok(declared.has(family), `${object.id} claims unknown family "${family}"`);
    }
  }
});

test('shortLabel keeps the first synonym only', () => {
  assert.strictEqual(shortLabel('pizza, pizza pie'), 'pizza');
  assert.strictEqual(shortLabel('carton'), 'carton');
});
