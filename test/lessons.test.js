'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { OBJECTS, SECTIONS, QUESTIONS, findObject, resolve } = require('../lib/rules');
const { UNITS, LESSONS, SCENARIO, buildLesson, isCorrect } = require('../lib/lessons');
const { TOPICS, SOURCES } = require('../lib/topics');

const SEEDS = [1, 2, 3, 'retry', 42];

/** Every exercise of every lesson, across several seeds. */
function* everyExercise() {
  for (const lesson of LESSONS) {
    for (const seed of SEEDS) {
      for (const ex of buildLesson(lesson.id, seed).exercises) yield { lesson, seed, ex };
    }
  }
}

test('every catalog object is taught in exactly one regular lesson', () => {
  const taught = new Map();
  for (const lesson of LESSONS.filter((l) => !l.review)) {
    for (const id of lesson.objects) {
      assert.ok(!taught.has(id), `${id} is taught in both ${taught.get(id)} and ${lesson.id}`);
      taught.set(id, lesson.id);
    }
  }
  for (const obj of OBJECTS) assert.ok(taught.has(obj.id), `${obj.id} is never taught`);
});

test('there is one unit per catalog shelf plus each topic, each ending in a review', () => {
  assert.deepStrictEqual(UNITS.filter((u) => u.kind === 'shelf').map((u) => u.id), SECTIONS.map((s) => s.id));
  assert.strictEqual(UNITS.length, SECTIONS.length + TOPICS.length);
  UNITS.forEach((unit, i) => assert.strictEqual(unit.index, i, `${unit.id} has the wrong index`));
  for (const unit of UNITS) {
    assert.ok(unit.title && unit.blurb, `${unit.id} needs a title and blurb`);
    assert.ok(unit.lessons.length >= 2, `${unit.id} needs at least one lesson and a review`);
    assert.ok(unit.lessons[unit.lessons.length - 1].review, `${unit.id} should end with its review`);
  }
});

test('every follow-up answer has a scenario phrase', () => {
  for (const [id, q] of Object.entries(QUESTIONS)) {
    for (const option of q.options) {
      assert.ok(SCENARIO[id] && SCENARIO[id][option.value], `no scenario phrase for ${id}=${option.value}`);
    }
  }
});

test('lessons are full length and reproducible from their seed', () => {
  for (const lesson of LESSONS) {
    const a = buildLesson(lesson.id, 7);
    const b = buildLesson(lesson.id, 7);
    assert.deepStrictEqual(a, b, `${lesson.id} is not deterministic`);
    assert.strictEqual(a.exercises.length, lesson.review ? 12 : 8, `${lesson.id} is short`);
  }
});

test('a retry with a new seed asks different questions', () => {
  const first = JSON.stringify(buildLesson('packaging-2', 1).exercises);
  const second = JSON.stringify(buildLesson('packaging-2', 2).exercises);
  assert.notStrictEqual(first, second);
});

test('every exercise is well formed and has an answer among its choices', () => {
  for (const { lesson, seed, ex } of everyExercise()) {
    const where = `${lesson.id}@${seed} ${ex.type}`;
    const ids = ex.choices.map((c) => c.id);
    const labels = ex.choices.map((c) => c.label);
    assert.strictEqual(new Set(ids).size, ids.length, `${where}: duplicate choice ids`);
    assert.strictEqual(new Set(labels).size, labels.length, `${where}: two choices read the same`);
    assert.ok(ex.answer.length >= 1, `${where}: no answer`);
    for (const a of ex.answer) assert.ok(ids.includes(a), `${where}: answer ${a} is not a choice`);
    if (!ex.multi) assert.strictEqual(ex.answer.length, 1, `${where}: single choice with several answers`);
    if (ex.multi) assert.ok(ex.answer.length < ex.choices.length, `${where}: every part is right, nothing to learn`);
    assert.ok(ex.explain && ex.explain.text && ex.explain.text.length > 20, `${where}: needs a real explanation`);
    assert.ok(ex.prompt, `${where}: no prompt`);
    assert.ok(isCorrect(ex, ex.answer), `${where}: its own answer does not check out`);
  }
});

test('"where does this go" answers agree with the decision engine', () => {
  // Rebuild the scenario from its phrases and resolve it independently.
  const byPhrase = {};
  for (const [q, options] of Object.entries(SCENARIO)) {
    for (const [value, phrase] of Object.entries(options)) byPhrase[phrase] = [q, value];
  }
  let checked = 0;
  for (const { ex } of everyExercise()) {
    if (ex.type !== 'bin') continue;
    const obj = findObject(ex.item.objectId);
    const answers = Object.fromEntries(ex.item.scenario.map((p) => byPhrase[p]));
    const index = ex.item.part ? obj.components.findIndex((c) => c.label === ex.item.part) : 0;
    assert.ok(index >= 0, `${obj.id}: unknown part ${ex.item.part}`);
    assert.strictEqual(ex.answer[0], resolve(obj, answers).components[index].outcome.id, `${obj.id} ${ex.item.part || ''}`);
    checked += 1;
  }
  assert.ok(checked > 100, 'too few bin exercises to be a meaningful check');
});

test('"which one" exercises have exactly one item that fits', () => {
  for (const { lesson, ex } of everyExercise()) {
    if (ex.type !== 'pick') continue;
    const fits = ex.choices.filter((c) => resolve(findObject(c.objectId), {}).headline.id === ex.target);
    assert.strictEqual(fits.length, 1, `${lesson.id}: ${ex.prompt} has ${fits.length} right answers`);
  }
});

test('the material is hidden when the material is the question', () => {
  for (const { ex } of everyExercise()) {
    if (ex.type === 'code') assert.strictEqual(ex.item.material, null);
  }
});

test('isCorrect needs the exact set, in any order', () => {
  const ex = { answer: ['p0', 'p2'] };
  assert.ok(isCorrect(ex, ['p2', 'p0']));
  assert.ok(!isCorrect(ex, ['p0']));
  assert.ok(!isCorrect(ex, ['p0', 'p1', 'p2']));
});

test('each topic unit sits right after the shelf it explains', () => {
  for (const topic of TOPICS) {
    const at = UNITS.findIndex((u) => u.id === topic.id);
    assert.ok(at > 0, `${topic.id} is not in the course`);
    assert.strictEqual(UNITS[at - 1].id, topic.after, `${topic.id} should follow ${topic.after}`);
  }
});

test('topic cards are well formed, unique and sourced where they cite a number', () => {
  const ids = new Set();
  const sources = new Set(Object.values(SOURCES));
  for (const topic of TOPICS) {
    assert.ok(topic.guide.length >= 1, `${topic.id} needs a guidebook`);
    for (const point of topic.guide) assert.ok(sources.has(point.source), `${topic.id}: guide point "${point.title}" needs a known source`);
    for (const lesson of topic.lessons) {
      assert.ok(lesson.cards.length >= 8, `${topic.id}: "${lesson.title}" needs at least 8 cards for a full lesson`);
      for (const card of lesson.cards) {
        assert.ok(!ids.has(card.id), `duplicate card ${card.id}`);
        ids.add(card.id);
        assert.ok(card.explain && card.explain.length > 20, `${card.id}: needs a real explanation`);
        if (card.source) assert.ok(sources.has(card.source), `${card.id}: unknown source`);
        // A percentage or an "N times" is a statistic, and a statistic has to say where it came from.
        const text = [card.true, card.false, card.prompt, card.explain, ...(card.choices || [])].join(' ');
        if (/\d+\s*%|\d+ times/.test(text)) assert.ok(card.source, `${card.id}: cites a number with no source`);
        if (card.kind === 'tf') assert.ok(card.true && card.false && card.true !== card.false, `${card.id}: needs both statements`);
        else {
          assert.strictEqual(card.kind, 'choice', `${card.id}: unknown kind`);
          assert.ok(card.prompt && card.choices.length >= 3, `${card.id}: needs a prompt and at least 3 choices`);
          assert.strictEqual(new Set(card.choices).size, card.choices.length, `${card.id}: two choices read the same`);
        }
      }
    }
  }
});

test('a topic lesson asks each of its cards at most once, and a review covers the unit', () => {
  for (const unit of UNITS.filter((u) => u.kind === 'topic')) {
    for (const lesson of unit.lessons) {
      for (const seed of SEEDS) {
        const { exercises } = buildLesson(lesson.id, seed);
        const asked = exercises.map((e) => e.statement || e.prompt);
        assert.strictEqual(new Set(asked).size, asked.length, `${lesson.id}@${seed} repeats a card`);
        assert.ok(exercises.every((e) => e.explain.source !== undefined), `${lesson.id}: explain should carry a source field`);
      }
    }
    const review = unit.lessons[unit.lessons.length - 1];
    assert.strictEqual(review.cards.length, unit.lessons.filter((l) => !l.review).reduce((n, l) => n + l.cards.length, 0));
  }
});

test('the methane unit agrees with the catalog: food scraps compost, or go in the trash without pickup', () => {
  const scraps = findObject('food-scraps');
  assert.strictEqual(resolve(scraps, { composting: 'yes' }).headline.id, 'compost');
  assert.strictEqual(resolve(scraps, { composting: 'no' }).headline.id, 'trash');
  assert.match(resolve(scraps, { composting: 'yes' }).components[0].why, /methane/);
});
