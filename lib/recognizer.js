'use strict';

/**
 * Turns a MobileNet class distribution into a US Tin catalog object.
 *
 * The model is trained on ILSVRC-2012, not on waste, so its label space and
 * ours only partly overlap. This file is the translation layer, and it is
 * deliberately conservative:
 *
 *   - A class maps to one or more catalog objects with a weight. A photo of a
 *     pizza is usually a pizza in its box, so `pizza` leans towards the box
 *     but keeps food scraps as a live alternative.
 *   - Scores are summed across the whole distribution, not taken from the top
 *     class alone. `beer bottle` + `wine bottle` + `goblet` at 12% each is a
 *     much stronger glass verdict than any one of them suggests.
 *   - Below RECOGNITION_FLOOR we say so and hand over to the picker. A wrong
 *     confident answer is worse for the user than an honest shrug.
 *
 * Four catalog objects — batteries, polystyrene foam, paint and receipts —
 * have no usable ILSVRC class at all. They are reachable from the picker and
 * from search, never from the camera. UNREACHABLE_OBJECTS below names them and
 * the test suite asserts the list, so the gap stays known rather than
 * discovered by a user.
 */

(function (root, factory) {
  const rules = typeof require === 'function' ? require('./rules') : root.USTinRules;
  const labels = typeof require === 'function' ? require('./imagenet-labels') : root.USTinImagenetLabels;
  const api = factory(rules, labels);

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') root.USTinRecognizer = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (rules, labels) {
  const { LABELS } = labels;

  /** Below this summed score, admit we do not know. */
  const RECOGNITION_FLOOR = 0.15;

  /** Classes under this probability are noise and never contribute. */
  const CLASS_FLOOR = 0.004;

  /**
   * ILSVRC class name -> catalog object, or -> weighted spread over several.
   * Keys are exact class strings; a typo fails the test suite rather than
   * silently dropping a mapping.
   */
  const MAPPING = {
    // --- drink containers ---------------------------------------------------
    'pop bottle, soda bottle': 'plastic-bottle',
    'water bottle': 'plastic-bottle',
    'bottlecap': { 'plastic-bottle': 0.7, 'tin-can': 0.3 },
    'beer bottle': 'glass-jar',
    'wine bottle': 'glass-jar',
    'beer glass': 'glass-jar',
    'goblet': 'glass-jar',
    'vase': 'glass-jar',
    'water jug': { 'glass-jar': 0.5, 'plastic-bottle': 0.5 },
    'whiskey jug': 'glass-jar',
    'pitcher, ewer': 'glass-jar',
    'carton': 'milk-carton',

    // --- cups and takeaway --------------------------------------------------
    'coffee mug': 'coffee-cup',
    'cup': 'coffee-cup',
    'espresso': 'coffee-cup',
    'measuring cup': { 'coffee-cup': 0.5, 'takeout-container': 0.5 },
    'tray': 'takeout-container',
    'soup bowl': 'takeout-container',
    'mixing bowl': 'takeout-container',
    'plate': 'takeout-container',
    'hot pot, hotpot': 'takeout-container',
    'wooden spoon': 'takeout-container',

    // --- packaging ----------------------------------------------------------
    'packet': 'chip-bag',
    'plastic bag': 'plastic-bag',
    'shopping basket': { 'plastic-bag': 0.6, 'takeout-container': 0.4 },
    'can opener, tin opener': 'tin-can',
    'pizza, pizza pie': { 'pizza-box': 0.65, 'food-scraps': 0.35 },

    // --- food ---------------------------------------------------------------
    'banana': 'food-scraps',
    'orange': 'food-scraps',
    'lemon': 'food-scraps',
    'fig': 'food-scraps',
    'pineapple, ananas': 'food-scraps',
    'strawberry': 'food-scraps',
    'pomegranate': 'food-scraps',
    'jackfruit, jak, jack': 'food-scraps',
    'custard apple': 'food-scraps',
    'Granny Smith': 'food-scraps',
    'head cabbage': 'food-scraps',
    'broccoli': 'food-scraps',
    'cauliflower': 'food-scraps',
    'zucchini, courgette': 'food-scraps',
    'spaghetti squash': 'food-scraps',
    'acorn squash': 'food-scraps',
    'butternut squash': 'food-scraps',
    'cucumber, cuke': 'food-scraps',
    'artichoke, globe artichoke': 'food-scraps',
    'bell pepper': 'food-scraps',
    'cardoon': 'food-scraps',
    'mushroom': 'food-scraps',
    'corn': 'food-scraps',
    'ear, spike, capitulum': 'food-scraps',
    'bagel, beigel': 'food-scraps',
    'pretzel': 'food-scraps',
    'French loaf': 'food-scraps',
    'dough': 'food-scraps',
    'cheeseburger': 'food-scraps',
    'hotdog, hot dog, red hot': 'food-scraps',
    'mashed potato': 'food-scraps',
    'meat loaf, meatloaf': 'food-scraps',
    'guacamole': 'food-scraps',
    'consomme': 'food-scraps',
    'trifle': 'food-scraps',
    'ice cream, icecream': 'food-scraps',
    'ice lolly, lolly, lollipop, popsicle': 'food-scraps',
    'carbonara': 'food-scraps',
    'potpie': 'food-scraps',
    'burrito': 'food-scraps',

    // --- electricals --------------------------------------------------------
    'cellular telephone, cellular phone, cellphone, cell, mobile phone': 'electronics',
    'dial telephone, dial phone': 'electronics',
    'pay-phone, pay-station': 'electronics',
    'laptop, laptop computer': 'electronics',
    'notebook, notebook computer': 'electronics',
    'desktop computer': 'electronics',
    'hand-held computer, hand-held microcomputer': 'electronics',
    'computer keyboard, keypad': 'electronics',
    'typewriter keyboard': 'electronics',
    'mouse, computer mouse': 'electronics',
    'monitor': 'electronics',
    'screen, CRT screen': 'electronics',
    'television, television system': 'electronics',
    'remote control, remote': 'electronics',
    'iPod': 'electronics',
    'cassette player': 'electronics',
    'cassette': 'electronics',
    'tape player': 'electronics',
    'CD player': 'electronics',
    'radio, wireless': 'electronics',
    'loudspeaker, speaker, speaker unit, loudspeaker system, speaker system': 'electronics',
    'microphone, mike': 'electronics',
    'modem': 'electronics',
    'hard disc, hard disk, fixed disk': 'electronics',
    'printer': 'electronics',
    'projector': 'electronics',
    'joystick': 'electronics',
    'power drill': 'electronics',
    'vacuum, vacuum cleaner': 'electronics',
    'electric fan, blower': 'electronics',
    'digital clock': 'electronics',
    'digital watch': 'electronics',
    'switch, electric switch, electrical switch': 'electronics',
    'Polaroid camera, Polaroid Land camera': 'electronics',
    'reflex camera': 'electronics',
    'hand blower, blow dryer, blow drier, hair dryer, hair drier': 'electronics',
    'space heater': 'electronics',
    'toaster': 'electronics',
    'microwave, microwave oven': 'electronics',

    // --- bathroom and household chemicals -----------------------------------
    'hair spray': 'aerosol-can',
    'lotion': { 'plastic-bottle': 0.7, 'toothpaste-tube': 0.3 },
    'sunscreen, sunblock, sun blocker': { 'plastic-bottle': 0.6, 'toothpaste-tube': 0.4 },
    'soap dispenser': 'plastic-bottle',
    'pill bottle': 'medication',
    'syringe': 'medication',

    // --- lighting -----------------------------------------------------------
    'spotlight, spot': 'lightbulb',
    'table lamp': 'lightbulb',
    'lampshade, lamp shade': 'lightbulb',

    // --- textiles -----------------------------------------------------------
    'jersey, T-shirt, tee shirt': 'clothing',
    'sweatshirt': 'clothing',
    'cardigan': 'clothing',
    'jean, blue jean, denim': 'clothing',
    'suit, suit of clothes': 'clothing',
    'gown': 'clothing',
    'academic gown, academic robe, judge\'s robe': 'clothing',
    'lab coat, laboratory coat': 'clothing',
    'trench coat': 'clothing',
    'fur coat': 'clothing',
    'cloak': 'clothing',
    'poncho': 'clothing',
    'kimono': 'clothing',
    'abaya': 'clothing',
    'sarong': 'clothing',
    'miniskirt, mini': 'clothing',
    'overskirt': 'clothing',
    'hoopskirt, crinoline': 'clothing',
    'pajama, pyjama, pj\'s, jammies': 'clothing',
    'brassiere, bra, bandeau': 'clothing',
    'maillot': 'clothing',
    'bikini, two-piece': 'clothing',
    'swimming trunks, bathing trunks': 'clothing',
    'apron': 'clothing',
    'sock': 'clothing',
    'mitten': 'clothing',
    'running shoe': 'clothing',
    'sandal': 'clothing',
    'clog, geta, patten, sabot': 'clothing',
    'Loafer': 'clothing',
    'cowboy boot': 'clothing',
    'sombrero': 'clothing',
    'cowboy hat, ten-gallon hat': 'clothing',
    'bonnet, poke bonnet': 'clothing',
    'bow tie, bow-tie, bowtie': 'clothing',
    'Windsor tie': 'clothing',
    'bolo tie, bolo, bola tie, bola': 'clothing',
    'velvet': 'clothing',
    'wool, woolen, woollen': 'clothing',
    'stole': 'clothing',
    'feather boa, boa': 'clothing',
  };

  /** Catalog objects the camera path cannot reach. Asserted by the tests. */
  const UNREACHABLE_OBJECTS = [
    'battery', 'styrofoam', 'paint', 'receipt',
  ];

  /** class name -> index, built once. */
  const INDEX_OF = new Map(LABELS.map((name, i) => [name, i]));

  /**
   * index -> [[objectId, weight], ...]. Built once from MAPPING so inference
   * is a couple of lookups per class rather than a string compare.
   */
  const WEIGHTS = new Map();
  for (const [name, target] of Object.entries(MAPPING)) {
    const index = INDEX_OF.get(name);
    if (index === undefined) continue; // the test suite fails on these
    const pairs = typeof target === 'string'
      ? [[target, 1]]
      : Object.entries(target).filter(([, w]) => w > 0);
    WEIGHTS.set(index, pairs);
  }

  /** "pizza, pizza pie" -> "pizza". What the model saw, said plainly. */
  function shortLabel(name) {
    return String(name || '').split(',')[0].trim();
  }

  /**
   * Score a full 1000-class distribution against the catalog.
   *
   * Returns the ranked catalog candidates, plus the model's own top class so
   * the UI can name what it saw even when nothing in the catalog matches.
   */
  function interpret(probabilities, options) {
    const limit = (options && options.limit) || 3;
    const scores = new Map();

    let topIndex = 0;
    let topProbability = -1;

    for (let i = 0; i < probabilities.length; i += 1) {
      const p = probabilities[i];
      if (p > topProbability) {
        topProbability = p;
        topIndex = i;
      }
      if (p < CLASS_FLOOR) continue;

      const pairs = WEIGHTS.get(i);
      if (!pairs) continue;
      for (const [id, weight] of pairs) {
        scores.set(id, (scores.get(id) || 0) + p * weight);
      }
    }

    const candidates = [...scores.entries()]
      .map(([id, score]) => ({ object: rules.findObject(id), score }))
      .filter((c) => c.object)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const best = candidates[0];

    return {
      candidates,
      recognized: Boolean(best) && best.score >= RECOGNITION_FLOOR,
      saw: { label: shortLabel(LABELS[topIndex]), probability: topProbability },
    };
  }

  return {
    interpret,
    shortLabel,
    MAPPING,
    WEIGHTS,
    UNREACHABLE_OBJECTS,
    RECOGNITION_FLOOR,
    CLASS_FLOOR,
  };
}));
