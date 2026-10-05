'use strict';

/**
 * US Tin — lessons.
 *
 * Turns the catalog into a course: one unit per catalog shelf, a handful of
 * lessons per unit, and a stream of short exercises per lesson.
 *
 * Nothing in here is hand-written quiz content. Every exercise is generated
 * from an object, a scenario (a set of follow-up answers) and the decision
 * engine, so the "right answer" in a lesson is by construction the same
 * answer the What-bin flow gives for that object. If the catalog changes, the
 * course changes with it and cannot drift out of date.
 *
 * Generation is seeded, so a lesson attempt is reproducible (the tests rely
 * on that) while a retry with a new seed gets fresh questions.
 */

(function (root, factory) {
  const rules = typeof require === 'function' ? require('./rules') : root.USTinRules;
  const api = factory(rules);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') root.USTinLessons = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (rules) {
  const { OBJECTS, SECTIONS, QUESTIONS, STREAMS, OUTCOMES, ACCEPTANCE, findObject, resolve } = rules;

  // -------------------------------------------------------------------------
  // Course shape
  // -------------------------------------------------------------------------

  const UNIT_COPY = {
    drinks: { title: 'Bottles & cans', blurb: 'Caps on, rinse it, and what the numbers mean' },
    coffee: { title: 'The coffee run', blurb: 'Why one cup is three materials' },
    packaging: { title: 'Takeout & packaging', blurb: 'Tubs, trays, film and pizza boxes' },
    kitchen: { title: 'Kitchen drawer', blurb: 'Pans, glasses and the things that break' },
    organics: { title: 'Food scraps', blurb: 'What rots, and where it should' },
    paper: { title: 'Paper trail', blurb: 'Clean, dry and not too shiny' },
    bathroom: { title: 'Bathroom shelf', blurb: 'Pumps, tubes and razors' },
    electronics: { title: 'Gadgets & batteries', blurb: 'Never in the bin, and here is why' },
    hazardous: { title: 'Under the sink', blurb: 'Paint, oil and anything that burns' },
    textiles: { title: 'Closet clear-out', blurb: 'Clothes, shoes and worn-out fabric' },
    house: { title: 'Around the house', blurb: 'Furniture, toys and the odd stuff' },
  };

  /** Objects introduced per lesson. Small enough to remember in one sitting. */
  const LESSON_SIZE = 5;
  const EXERCISES_PER_LESSON = 8;
  const EXERCISES_PER_REVIEW = 12;

  /** Split `items` into the fewest chunks of at most `size`, as evenly as possible. */
  function chunk(items, size) {
    const count = Math.max(1, Math.ceil(items.length / size));
    const out = [];
    let start = 0;
    for (let i = 0; i < count; i += 1) {
      const n = Math.ceil((items.length - start) / (count - i));
      out.push(items.slice(start, start + n));
      start += n;
    }
    return out;
  }

  const UNITS = SECTIONS.map((section, index) => {
    const copy = UNIT_COPY[section.id] || { title: section.label, blurb: '' };
    const groups = chunk(section.objects, LESSON_SIZE);
    const lessons = groups.map((objects, i) => ({
      id: `${section.id}-${i + 1}`,
      unit: section.id,
      title: `Lesson ${i + 1}`,
      objects,
      review: false,
    }));
    lessons.push({
      id: `${section.id}-review`,
      unit: section.id,
      title: 'Unit review',
      objects: section.objects.slice(),
      review: true,
    });
    return { id: section.id, index, title: copy.title, blurb: copy.blurb, shelf: section.label, lessons };
  });

  const LESSONS = UNITS.flatMap((u) => u.lessons);

  function findLesson(id) {
    return LESSONS.find((l) => l.id === id) || null;
  }

  function findUnit(id) {
    return UNITS.find((u) => u.id === id) || null;
  }

  // -------------------------------------------------------------------------
  // Scenario phrases
  // -------------------------------------------------------------------------

  /**
   * How a follow-up answer reads as a fact about the item in front of you:
   * the answer "yes" to "Is it soaked with grease?" shows up as "Greasy".
   * The tests require a phrase for every option of every question.
   */
  const SCENARIO = {
    grease: { yes: 'Greasy', no: 'Clean, no grease' },
    empty: { yes: 'Empty', no: 'Still has stuff in it' },
    rinsed: { yes: 'Rinsed', no: 'Not rinsed' },
    condition: { good: 'Still works', broken: 'Broken or worn out' },
    bulbType: { incandescent: 'Incandescent bulb', cfl: 'Curly CFL bulb', led: 'LED bulb' },
    composting: { yes: 'You have compost pickup', no: 'No compost pickup' },
    filmPlastic: { yes: 'Your city takes film', no: "Your city doesn't take film" },
    cupType: { paper: 'Paper hot cup', plastic: 'Clear plastic cold cup' },
    tubRigid: { rigid: 'Rigid tub', foam: 'Foam or flimsy tray' },
    batteryType: { alkaline: 'Alkaline (AA, AAA, 9V)', lithium: 'Lithium / rechargeable', button: 'Button cell' },
    soiled: { no: 'Clean and dry', yes: 'Wet or soiled' },
    scrunch: { yes: 'Stays scrunched', no: 'Springs back' },
    hasBattery: { yes: 'Has a built-in battery', no: 'No battery' },
    woodTreated: { no: 'Untreated wood', yes: 'Painted or treated' },
    size: { small: 'Fits in a bin', large: 'Too big for a bin' },
  };

  /** The order bins are always shown in, so each one keeps its spot on screen. */
  const BIN_ORDER = ['recycle', 'compost', 'trash', 'dropoff', 'reuse'];
  const MAIN_BINS = ['recycle', 'compost', 'trash', 'dropoff'];

  const BIN_PHRASE = {
    recycle: 'the recycling bin',
    compost: 'the compost bin',
    trash: 'the trash',
    dropoff: 'a special drop-off',
    reuse: 'reuse or donation',
  };

  const CURBSIDE_FAMILIES = ['Plastic', 'Fibre', 'Glass', 'Metal', 'Composite'];
  const PLASTICS = Object.values(STREAMS).filter((s) => s.family === 'Plastic' && s.id !== 'filmDropoff');
  const DROPOFFS = Object.values(STREAMS).filter((s) => s.family === 'Drop-off');

  // -------------------------------------------------------------------------
  // Seeded randomness
  // -------------------------------------------------------------------------

  function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /** mulberry32: small, fast, and good enough to shuffle a quiz. */
  function rng(seed) {
    let a = hash(String(seed));
    return function next() {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const pick = (rand, list) => list[Math.floor(rand() * list.length)];

  function shuffle(rand, list) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  const sample = (rand, list, n) => shuffle(rand, list).slice(0, n);

  // -------------------------------------------------------------------------
  // Exercise builders
  //
  // Every exercise has the same shape, so the app renders them all with one
  // screen:
  //   { id, type, prompt, item?, statement?, choices, answer, multi, explain, objects }
  // `answer` is always an array of choice ids; single-choice exercises have
  // exactly one.
  // -------------------------------------------------------------------------

  /** Random answers for the given questions — a concrete version of the item. */
  function scenarioFor(rand, questionIds) {
    const answers = {};
    for (const q of questionIds) {
      const def = QUESTIONS[q];
      if (def) answers[q] = pick(rand, def.options).value;
    }
    return answers;
  }

  function scenarioPhrases(answers, questionIds) {
    return questionIds.filter((q) => q in answers).map((q) => SCENARIO[q][answers[q]]);
  }

  function itemCard(obj, component, answers, questionIds, opts) {
    const multiPart = obj.components.length > 1;
    return {
      objectId: obj.id,
      label: obj.label,
      part: multiPart && component ? component.label : null,
      material: component && !(opts && opts.hideMaterial) ? component.material : null,
      scenario: scenarioPhrases(answers, questionIds),
    };
  }

  function binChoices(rand, correct, obj) {
    const offersReuse = correct === 'reuse'
      || obj.components.some((c) => (c.questions || []).includes('condition'));
    let ids;
    if (offersReuse) {
      const others = MAIN_BINS.filter((b) => b !== correct);
      ids = ['reuse', ...sample(rand, others, correct === 'reuse' ? 3 : 2)];
      if (correct !== 'reuse') ids.push(correct);
    } else {
      ids = MAIN_BINS.slice();
    }
    return BIN_ORDER.filter((b) => ids.includes(b)).map((b) => ({
      id: b,
      label: OUTCOMES[b].label,
      outcome: b,
    }));
  }

  function explainFrom(resolved, extra) {
    return {
      text: resolved.why,
      outcome: resolved.outcome.id,
      stream: resolved.stream ? { code: resolved.stream.code, label: resolved.stream.label, acceptance: resolved.stream.acceptance.label } : null,
      ...extra,
    };
  }

  /** "Where does this go?" — one component, one concrete scenario. */
  function binExercise(rand, obj, index) {
    const component = obj.components[index];
    const qs = component.questions || [];
    const answers = scenarioFor(rand, qs);
    const resolved = resolve(obj, answers).components[index];
    return {
      type: 'bin',
      prompt: obj.components.length > 1 ? 'Where does this part go?' : 'Where does this go?',
      item: itemCard(obj, component, answers, qs),
      choices: binChoices(rand, resolved.outcome.id, obj),
      answer: [resolved.outcome.id],
      multi: false,
      explain: explainFrom(resolved),
      objects: [obj.id],
    };
  }

  /** True or false: a claim about where one component goes. */
  function claimExercise(rand, obj, index) {
    const component = obj.components[index];
    const qs = component.questions || [];
    const answers = scenarioFor(rand, qs);
    const resolved = resolve(obj, answers).components[index];
    const truth = rand() < 0.5;
    const claimed = truth ? resolved.outcome.id : pick(rand, MAIN_BINS.filter((b) => b !== resolved.outcome.id));
    return {
      type: 'truefalse',
      prompt: 'True or false?',
      item: itemCard(obj, component, answers, qs),
      statement: `This goes in ${BIN_PHRASE[claimed]}.`,
      claim: claimed,
      choices: [{ id: 'true', label: 'True' }, { id: 'false', label: 'False' }],
      answer: [truth ? 'true' : 'false'],
      multi: false,
      explain: explainFrom(resolved),
      objects: [obj.id],
    };
  }

  /** True or false: a fact about a material stream's acceptance. */
  function streamFactExercise(rand, stream) {
    const truth = stream.acceptance === 'widely';
    return {
      type: 'truefalse',
      prompt: 'True or false?',
      item: null,
      statement: `${stream.code} ${stream.label} is widely accepted in curbside recycling.`,
      choices: [{ id: 'true', label: 'True' }, { id: 'false', label: 'False' }],
      answer: [truth ? 'true' : 'false'],
      multi: false,
      explain: {
        text: stream.note,
        outcome: null,
        stream: { code: stream.code, label: stream.label, acceptance: ACCEPTANCE[stream.acceptance].label },
      },
      objects: [],
    };
  }

  /** "Tap every part that goes in recycling" — the multi-material lesson. */
  function partsExercise(rand, obj) {
    const qs = [];
    for (const c of obj.components) for (const q of c.questions || []) if (!qs.includes(q)) qs.push(q);
    const answers = scenarioFor(rand, qs);
    const resolved = resolve(obj, answers);
    const present = [...new Set(resolved.components.map((c) => c.outcome.id))];
    if (present.length < 2) return null;

    // Labels must be distinct or the player cannot tell two parts apart.
    const labels = resolved.components.map((c) => c.label);
    if (new Set(labels).size !== labels.length) return null;

    const target = pick(rand, present);
    return {
      type: 'parts',
      prompt: `Tap every part that goes in ${BIN_PHRASE[target]}`,
      target,
      item: itemCard(obj, null, answers, qs),
      choices: resolved.components.map((c, i) => ({ id: `p${i}`, label: c.label, sublabel: c.material, outcome: c.outcome.id })),
      answer: resolved.components.map((c, i) => (c.outcome.id === target ? `p${i}` : null)).filter(Boolean),
      multi: true,
      explain: {
        text: resolved.components.map((c) => `${c.label}: ${c.outcome.label}. ${c.why}`).join('\n'),
        outcome: target,
        stream: null,
      },
      objects: [obj.id],
    };
  }

  /** "Which plastic is this?" — resin codes, for plastic components. */
  function codeExercise(rand, obj, index) {
    const component = obj.components[index];
    const stream = STREAMS[component.stream];
    if (!stream || stream.family !== 'Plastic' || stream.id === 'filmDropoff') return null;
    const others = sample(rand, PLASTICS.filter((s) => s.id !== stream.id), 3);
    const choices = shuffle(rand, [stream, ...others]).map((s) => ({
      id: s.id,
      label: `${s.code} ${s.short}`,
      sublabel: s.label,
    }));
    return {
      type: 'code',
      prompt: 'Which plastic is it made of?',
      item: itemCard(obj, component, {}, [], { hideMaterial: true }),
      choices,
      answer: [stream.id],
      multi: false,
      explain: {
        text: `${component.material}. ${stream.note}`,
        outcome: null,
        stream: { code: stream.code, label: stream.label, acceptance: ACCEPTANCE[stream.acceptance].label },
      },
      objects: [obj.id],
    };
  }

  /** "Which drop-off takes it?" — so drop-off units teach more than one answer. */
  function dropoffExercise(rand, obj, index) {
    const component = obj.components[index];
    const qs = component.questions || [];
    const answers = scenarioFor(rand, qs);
    const resolved = resolve(obj, answers).components[index];
    const stream = resolved.stream && STREAMS[resolved.stream.id];
    if (resolved.outcome.id !== 'dropoff' || !stream || stream.family !== 'Drop-off') return null;
    // Store film and LDPE share a code; keep the distractors unambiguous.
    const others = sample(rand, DROPOFFS.filter((s) => s.id !== stream.id), 3);
    return {
      type: 'stream',
      prompt: 'Which drop-off takes it?',
      item: itemCard(obj, component, answers, qs),
      choices: shuffle(rand, [stream, ...others]).map((s) => ({ id: s.id, label: s.label, sublabel: s.code })),
      answer: [stream.id],
      multi: false,
      explain: explainFrom(resolved, { text: `${resolved.why} ${stream.note}` }),
      objects: [obj.id],
    };
  }

  /** Objects whose verdict needs no follow-up question — safe to show bare. */
  function settled(obj) {
    if (obj.components.some((c) => (c.questions || []).length)) return null;
    return resolve(obj, {}).headline.id;
  }

  /** "Which one goes in compost?" — three items, one right answer. */
  function pickExercise(rand, pool, extended) {
    const bare = pool.map((id) => findObject(id)).filter((o) => settled(o));
    const wider = extended.map((id) => findObject(id)).filter((o) => settled(o));
    if (!bare.length) return null;

    const answer = pick(rand, bare);
    const target = settled(answer);
    const distractors = sample(rand, wider.filter((o) => o.id !== answer.id && settled(o) !== target), 2);
    if (distractors.length < 2) return null;

    const resolved = resolve(answer, {});
    return {
      type: 'pick',
      prompt: `Which one goes in ${BIN_PHRASE[target]}?`,
      target,
      item: null,
      choices: shuffle(rand, [answer, ...distractors]).map((o) => ({ id: o.id, label: o.label, objectId: o.id })),
      answer: [answer.id],
      multi: false,
      explain: {
        text: resolved.components.find((c) => c.outcome.id === target).why,
        outcome: target,
        stream: null,
      },
      objects: [answer.id, ...distractors.map((o) => o.id)],
    };
  }

  // -------------------------------------------------------------------------
  // Lesson assembly
  // -------------------------------------------------------------------------

  /** A fingerprint so the same question is not asked twice in one lesson. */
  function fingerprint(ex) {
    if (!ex.item) return [ex.type, ex.statement, ex.target, ex.answer.join()].join('|');
    return [ex.type, ex.item.objectId, ex.item.part, ex.target].join('|');
  }

  /**
   * Candidate exercises for one object. "Where does this go?" is the core
   * skill, so it is listed twice to be drawn about twice as often; the copy is
   * a fresh scenario, and the fingerprint keeps both from being used.
   */
  function candidatesFor(rand, obj) {
    const out = [];
    obj.components.forEach((_, i) => {
      out.push(binExercise(rand, obj, i));
      out.push(binExercise(rand, obj, i));
      out.push(dropoffExercise(rand, obj, i));
      out.push(codeExercise(rand, obj, i));
      out.push(claimExercise(rand, obj, i));
    });
    if (obj.components.length > 1) out.unshift(partsExercise(rand, obj));
    return out.filter(Boolean);
  }

  /**
   * Build the exercises for one attempt at a lesson.
   * @param {string} lessonId
   * @param {string|number} seed  same seed, same lesson
   */
  function buildLesson(lessonId, seed) {
    const lesson = findLesson(lessonId);
    if (!lesson) throw new Error(`unknown lesson ${lessonId}`);
    const unit = findUnit(lesson.unit);
    const rand = rng(`${lessonId}:${seed}`);
    const total = lesson.review ? EXERCISES_PER_REVIEW : EXERCISES_PER_LESSON;

    const objects = shuffle(rand, lesson.objects).map((id) => findObject(id));
    const perObject = objects.map((o) => candidatesFor(rand, o));

    const chosen = [];
    const seen = new Set();
    const take = (ex) => {
      if (!ex || chosen.length >= total) return false;
      const key = fingerprint(ex);
      if (seen.has(key)) return false;
      seen.add(key);
      chosen.push(ex);
      return true;
    };

    // One exercise per object first, so every item in the lesson is taught.
    // Prefer a type the lesson has not used yet, so it does not read as eight
    // copies of the same question.
    for (const list of perObject) {
      const used = new Set(chosen.map((e) => e.type));
      const fresh = list.filter((e) => !used.has(e.type));
      take(pick(rand, fresh.length ? fresh : list));
    }

    // Then one "which of these" and, for curbside shelves, one stream fact.
    const shelf = unit.lessons[unit.lessons.length - 1].objects;
    take(pickExercise(rand, lesson.objects, shelf) || pickExercise(rand, lesson.objects, OBJECTS.map((o) => o.id)));

    const streamsHere = new Set();
    for (const o of objects) for (const c of o.components) if (c.stream) streamsHere.add(c.stream);
    const facts = [...streamsHere].map((id) => STREAMS[id]).filter((s) => CURBSIDE_FAMILIES.includes(s.family));
    if (facts.length) take(streamFactExercise(rand, pick(rand, facts)));

    // Fill the rest round-robin from what is left.
    let guard = 0;
    while (chosen.length < total && guard < 200) {
      guard += 1;
      const list = perObject[guard % perObject.length];
      if (list.length) take(pick(rand, list));
    }

    // Avoid two of the same type back to back where a swap fixes it.
    const ordered = shuffle(rand, chosen);
    for (let i = 1; i < ordered.length; i += 1) {
      if (ordered[i].type !== ordered[i - 1].type) continue;
      const j = ordered.findIndex((e, k) => k > i && e.type !== ordered[i - 1].type);
      if (j > 0) [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    }

    return {
      lesson: { id: lesson.id, title: lesson.title, unit: unit.id, unitTitle: unit.title, review: lesson.review },
      exercises: ordered.map((ex, i) => ({ id: `${lesson.id}:${i}`, ...ex })),
    };
  }

  /** Is the given set of choice ids exactly the right answer? */
  function isCorrect(exercise, selected) {
    const a = [...exercise.answer].sort();
    const b = [...new Set(selected)].sort();
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }

  return {
    UNITS,
    LESSONS,
    SCENARIO,
    BIN_ORDER,
    BIN_PHRASE,
    findLesson,
    findUnit,
    buildLesson,
    isCorrect,
  };
}));
