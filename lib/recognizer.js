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

  /** Below this the material head is guessing too, so do not lean on it. */
  const MATERIAL_FLOOR = 0.4;

  /**
   * ILSVRC class name -> catalog object, or -> weighted spread over several.
   * Keys are exact class strings; a typo fails the test suite rather than
   * silently dropping a mapping.
   */
  const MAPPING = {
    // --- drink containers ---------------------------------------------------
    'pop bottle, soda bottle': 'soda-bottle',
    'water bottle': { 'water-bottle': 0.55, 'tin-can': 0.45 },
    'bottlecap': { 'bottle-cap-plastic': 0.6, 'bottle-cap-metal': 0.4 },
    'beer bottle': 'beer-bottle',
    'wine bottle': 'wine-bottle',
    'beer glass': 'drinking-glass',
    'goblet': 'drinking-glass',
    'vase': { 'glass-jar': 0.5, 'plant-pot-terracotta': 0.5 },
    'water jug': { 'milk-jug': 0.6, 'glass-jar': 0.4 },
    'whiskey jug': 'glass-jar',
    'pitcher, ewer': 'drinking-glass',
    'carton': 'milk-carton',
    'cocktail shaker': 'drinking-glass',

    // --- cups and takeaway --------------------------------------------------
    'coffee mug': { 'ceramic-mug': 0.6, 'coffee-cup': 0.4 },
    'cup': { 'coffee-cup': 0.5, 'ceramic-mug': 0.3, 'drinking-glass': 0.2 },
    'espresso': 'coffee-cup',
    'measuring cup': { 'drinking-glass': 0.5, 'takeout-container': 0.5 },
    'tray': { 'foil-tray': 0.4, 'meat-tray': 0.3, 'takeout-container': 0.3 },
    'soup bowl': { 'takeout-container': 0.5, 'ceramic-plate': 0.5 },
    'mixing bowl': { 'ceramic-plate': 0.6, 'takeout-container': 0.4 },
    'plate': 'ceramic-plate',
    'hot pot, hotpot': 'nonstick-pan',
    'frying pan, frypan, skillet': 'nonstick-pan',
    'Dutch oven': 'cast-iron-pan',
    'caldron, cauldron': 'cast-iron-pan',
    'wok': 'nonstick-pan',
    'wooden spoon': 'wooden-cutlery',
    'spatula': 'nonstick-pan',
    'ladle': 'metal-cutlery',

    // --- packaging ----------------------------------------------------------
    'packet': 'chip-bag',
    'plastic bag': 'produce-bag',
    'shopping basket': 'produce-bag',
    'can opener, tin opener': 'tin-can',
    'pizza, pizza pie': { 'pizza-box': 0.6, 'food-scraps': 0.4 },
    'carpenter\'s kit, tool kit': 'scrap-metal',
    'crate': 'cardboard-box',
    'envelope': 'envelope',
    'binder, ring-binder': 'spiral-notebook',
    'menu': 'laminated-paper',
    'book jacket, dust cover, dust jacket, dust wrapper': 'paperback-book',
    'comic book': 'paperback-book',
    'notebook, notebook computer': 'laptop',
    'paper towel': 'tissue-paper',
    'toilet tissue, toilet paper, bathroom tissue': 'tissue-paper',
    'handkerchief, hankie, hanky, hankey': 'tissue-paper',

    // --- food ---------------------------------------------------------------
    'banana': 'fruit-peel',
    'orange': 'fruit-peel',
    'lemon': 'fruit-peel',
    'fig': 'fruit-peel',
    'pineapple, ananas': 'fruit-peel',
    'strawberry': 'fruit-peel',
    'pomegranate': 'fruit-peel',
    'jackfruit, jak, jack': 'fruit-peel',
    'custard apple': 'fruit-peel',
    'Granny Smith': 'fruit-peel',
    'head cabbage': 'fruit-peel',
    'broccoli': 'fruit-peel',
    'cauliflower': 'fruit-peel',
    'zucchini, courgette': 'fruit-peel',
    'spaghetti squash': 'fruit-peel',
    'acorn squash': 'fruit-peel',
    'butternut squash': 'fruit-peel',
    'cucumber, cuke': 'fruit-peel',
    'artichoke, globe artichoke': 'fruit-peel',
    'bell pepper': 'fruit-peel',
    'cardoon': 'fruit-peel',
    'mushroom': 'fruit-peel',
    'corn': 'fruit-peel',
    'ear, spike, capitulum': 'fruit-peel',
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
    'ice cream, icecream': { 'ice-cream-tub': 0.5, 'food-scraps': 0.5 },
    'ice lolly, lolly, lollipop, popsicle': 'food-scraps',
    'carbonara': 'food-scraps',
    'potpie': 'food-scraps',
    'burrito': 'food-scraps',
    'espresso maker': 'small-appliance',

    // --- electricals --------------------------------------------------------
    'cellular telephone, cellular phone, cellphone, cell, mobile phone': 'smartphone',
    'dial telephone, dial phone': 'electronics',
    'pay-phone, pay-station': 'electronics',
    'laptop, laptop computer': 'laptop',
    'desktop computer': 'television',
    'hand-held computer, hand-held microcomputer': 'tablet',
    'computer keyboard, keypad': 'keyboard-mouse',
    'typewriter keyboard': 'keyboard-mouse',
    'mouse, computer mouse': 'keyboard-mouse',
    'monitor': 'television',
    'screen, CRT screen': 'television',
    'television, television system': 'television',
    'home theater, home theatre': 'television',
    'remote control, remote': 'remote-control',
    'iPod': 'electronics',
    'cassette player': 'electronics',
    'cassette': 'cd-dvd',
    'tape player': 'electronics',
    'CD player': 'electronics',
    'radio, wireless': 'electronics',
    'loudspeaker, speaker, speaker unit, loudspeaker system, speaker system': 'electronics',
    'microphone, mike': 'electronics',
    'modem': 'electronics',
    'hard disc, hard disk, fixed disk': 'electronics',
    'printer': 'printer',
    'photocopier': 'printer',
    'projector': 'electronics',
    'joystick': 'electronics',
    'power drill': 'small-appliance',
    'vacuum, vacuum cleaner': 'small-appliance',
    'electric fan, blower': 'small-appliance',
    'digital clock': 'electronics',
    'digital watch': 'electronics',
    'switch, electric switch, electrical switch': 'electronics',
    'Polaroid camera, Polaroid Land camera': 'electronics',
    'reflex camera': 'electronics',
    'hand blower, blow dryer, blow drier, hair dryer, hair drier': 'small-appliance',
    'space heater': 'small-appliance',
    'toaster': 'small-appliance',
    'microwave, microwave oven': 'microwave',
    'washer, automatic washer, washing machine': 'microwave',
    'dishwasher, dish washer, dishwashing machine': 'microwave',
    'refrigerator, icebox': 'microwave',
    'Crock Pot': 'small-appliance',

    // --- bathroom and household chemicals -----------------------------------
    'hair spray': 'aerosol-can',
    'lotion': 'soap-pump',
    'sunscreen, sunblock, sun blocker': 'sunscreen-bottle',
    'soap dispenser': 'soap-pump',
    'lipstick, lip rouge': 'lipstick-tube',
    'perfume, essence': 'nail-polish',
    'face powder': 'makeup-compact',
    'pill bottle': 'pill-bottle',
    'syringe': 'razor-blades',
    'Band Aid': 'bandages',
    'toilet seat': 'ceramic-plate',
    'plunger, plumber\'s helper': 'scrap-metal',
    'lighter, light, igniter, ignitor': 'lighter',
    'matchstick': 'matches',
    'candle, taper, wax light': 'crayons',
    'paintbrush': 'paint',
    'screwdriver': 'scrap-metal',
    'hammer': 'scrap-metal',
    'screw': 'scrap-metal',
    'nail': 'scrap-metal',
    'hatchet': 'scrap-metal',
    'letter opener, paper knife, paperknife': 'metal-cutlery',
    'corkscrew, bottle screw': 'metal-cutlery',
    'safety pin': 'scrap-metal',
    'thimble': 'scrap-metal',
    'padlock': 'scrap-metal',
    'chain': 'scrap-metal',

    // --- lighting -----------------------------------------------------------
    'spotlight, spot': 'light-bulb',
    'table lamp': 'light-bulb',
    'lampshade, lamp shade': 'light-bulb',

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
    'running shoe': 'shoes',
    'sandal': 'shoes',
    'clog, geta, patten, sabot': 'shoes',
    'Loafer': 'shoes',
    'cowboy boot': 'shoes',
    'sombrero': 'clothing',
    'cowboy hat, ten-gallon hat': 'clothing',
    'bonnet, poke bonnet': 'clothing',
    'bow tie, bow-tie, bowtie': 'clothing',
    'Windsor tie': 'clothing',
    'bolo tie, bolo, bola tie, bola': 'clothing',
    'velvet': 'towels-linens',
    'wool, woolen, woollen': 'clothing',
    'stole': 'clothing',
    'feather boa, boa': 'clothing',
    'bath towel': 'towels-linens',
    'quilt, comforter, comfort, puff': 'pillow',
    'pillow': 'pillow',
    'studio couch, day bed': 'furniture-wood',
    'backpack, back pack, knapsack, packsack, rucksack, haversack': 'backpack',
    'purse': 'backpack',
    'mailbag, postbag': 'backpack',
    'teddy, teddy bear': 'stuffed-animal',
    'umbrella': 'umbrella',
    'sunglasses, dark glasses, shades': 'eyeglasses',
    'sunglass': 'eyeglasses',
    'diaper, nappy, napkin': 'diaper',

    // --- around the house ---------------------------------------------------
    'rocking chair, rocker': 'furniture-wood',
    'folding chair': 'furniture-wood',
    'barber chair': 'furniture-wood',
    'dining table, board': 'furniture-wood',
    'desk': 'furniture-wood',
    'wardrobe, closet, press': 'furniture-wood',
    'chest': 'furniture-wood',
    'bookcase': 'furniture-wood',
    'file, file cabinet, filing cabinet': 'furniture-wood',
    'park bench': 'furniture-wood',
    'mountain bike, all-terrain bike, off-roader': 'bicycle',
    'bicycle-built-for-two, tandem bicycle, tandem': 'bicycle',
    'tricycle, trike, velocipede': 'bicycle',
    'unicycle, monocycle': 'bicycle',
    'pot, flowerpot': 'plant-pot-terracotta',
    'ashcan, trash can, garbage can, wastebin, ash bin, ash-bin, ashbin, dustbin, trash barrel, trash bin': 'scrap-metal',
    'bucket, pail': 'plant-pot-plastic',
    'basketball': 'sports-equipment',
    'soccer ball': 'sports-equipment',
    'tennis ball': 'sports-equipment',
    'volleyball': 'sports-equipment',
    'rugby ball': 'sports-equipment',
    'golf ball': 'sports-equipment',
    'ping-pong ball': 'sports-equipment',
    'racket, racquet': 'sports-equipment',
    'balloon': 'balloon',
    'rubber eraser, rubber, pencil eraser': 'pens',
    'ballpoint, ballpoint pen, ballpen, Biro': 'pens',
    'fountain pen': 'pens',
    'quill, quill pen': 'pens',
    'pencil sharpener': 'pens',
    'car mirror': 'mirror',
    'window screen': 'window-glass',
    'window shade': 'window-glass',
    'sliding door': 'window-glass',
    'doormat, welcome mat': 'carpet',
    'prayer rug, prayer mat': 'carpet',
    'four-poster': 'mattress',
    'car wheel': 'tyres',
    'disk brake, disc brake': 'scrap-metal',
    'spider web, spider\'s web': 'desiccant-packet',
  };

  /**
   * The six labels the material head emits, in its output order, and the
   * stream family each one corresponds to. `trash` is a genuine "none of the
   * above" in TrashNet, so it maps to nothing.
   */
  const MATERIAL_CLASSES = ['cardboard', 'glass', 'metal', 'paper', 'plastic', 'trash'];

  const MATERIAL_FAMILY = {
    cardboard: 'Fibre',
    paper: 'Fibre',
    glass: 'Glass',
    metal: 'Metal',
    plastic: 'Plastic',
    trash: null,
  };

  /**
   * How hard a material agreement may push a candidate up the ranking. Set so
   * that a confident material head can overturn a two-to-one object-model
   * preference, but not a decisive one — it was trained on actual waste
   * photographs, which the object model was not.
   */
  const MATERIAL_BOOST = 2.2;

  /** Keywords for components that carry no stream — landfill still has a material. */
  const FAMILY_WORDS = [
    ['Plastic', /plastic|polyester|polypropylene|polyethylene|polystyrene|pvc|nylon|acrylic|foam|film|laminate|resin|latex|rubber|acetate|hydrogel/i],
    ['Fibre', /paper|card|pulp|fibre|fiber|tissue|newsprint/i],
    ['Glass', /glass/i],
    ['Metal', /steel|aluminium|aluminum|metal|tin|iron|copper|brass/i],
  ];

  /**
   * Drop-off streams are categories rather than materials, so the family has
   * to be stated. The ones left out are deliberate: a phone is not "glass" to
   * a material classifier trained on bottles, and there is no TrashNet class
   * for ceramics, timber or textiles.
   */
  const DROPOFF_FAMILY = {
    scrap: 'Metal',
    filmDropoff: 'Plastic',
  };

  /** Every material family an object touches, for matching against the head. */
  function familiesOf(object) {
    const families = new Set();

    for (const component of object.components) {
      const stream = component.stream && rules.STREAMS[component.stream];

      if (stream) {
        const family = stream.family === 'Drop-off'
          ? DROPOFF_FAMILY[stream.id]
          // A carton is mostly paper fibre as far as a material model is concerned.
          : (stream.family === 'Composite' ? 'Fibre' : stream.family);
        if (family && family !== 'Organic') families.add(family);
        continue;
      }

      // No stream at all means landfill — which still has a material, and the
      // material is exactly what the head can see.
      for (const [family, pattern] of FAMILY_WORDS) {
        if (pattern.test(component.material)) {
          families.add(family);
          break;
        }
      }
    }

    return families;
  }

  /** object id -> families, built once. */
  const FAMILIES = new Map(rules.OBJECTS.map((o) => [o.id, familiesOf(o)]));

  /**
   * Total probability the material head assigns to a family, so "cardboard"
   * and "paper" reinforce each other rather than splitting the fibre vote.
   */
  function familyProbability(material, family) {
    if (!material || !family) return 0;
    let total = 0;
    for (const name of MATERIAL_CLASSES) {
      if (MATERIAL_FAMILY[name] === family) total += material[name] || 0;
    }
    return total;
  }

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
    // A caller that forgets to drop MobileNet's leading background logit hands
    // us 1001 numbers, and every lookup below lands one class off. Silent
    // nonsense is worse than a crash, so refuse it.
    if (probabilities.length !== LABELS.length) {
      throw new Error(`expected ${LABELS.length} class probabilities, got ${probabilities.length}`);
    }

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

    const material = (options && options.material) || null;

    const candidates = [...scores.entries()]
      .map(([id, score]) => {
        const object = rules.findObject(id);
        if (!object) return null;

        // The object classifier says what it is; the material head says what
        // it is made of. Agreement lifts a candidate, disagreement does not
        // veto it — the material head is a prior, not a judge.
        let agreement = 0;
        for (const family of FAMILIES.get(id) || []) {
          agreement = Math.max(agreement, familyProbability(material, family));
        }

        return { object, score: score * (1 + MATERIAL_BOOST * agreement), base: score, agreement };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const best = candidates[0];

    return {
      candidates,
      recognized: Boolean(best) && best.score >= RECOGNITION_FLOOR,
      saw: { label: shortLabel(LABELS[topIndex]), probability: topProbability },
      material: material ? topMaterial(material) : null,
    };
  }

  /** The material head's own best guess, with its confidence. */
  function topMaterial(material) {
    let best = null;
    for (const name of MATERIAL_CLASSES) {
      const p = material[name] || 0;
      if (!best || p > best.probability) best = { id: name, probability: p, family: MATERIAL_FAMILY[name] };
    }
    return best;
  }

  /**
   * When the object classifier has nothing, the material head usually still
   * does — and "it is glass" narrows 177 catalog entries to a dozen. That
   * turns a failed guess into two taps instead of a dead end.
   */
  function byMaterial(material, limit) {
    const top = topMaterial(material);
    if (!top || !top.family || top.probability < MATERIAL_FLOOR) return null;

    const objects = rules.OBJECTS.filter((o) => (FAMILIES.get(o.id) || new Set()).has(top.family));
    return {
      material: top,
      objects: limit ? objects.slice(0, limit) : objects,
    };
  }

  return {
    interpret,
    byMaterial,
    topMaterial,
    familiesOf,
    shortLabel,
    MATERIAL_CLASSES,
    MATERIAL_FAMILY,
    MAPPING,
    WEIGHTS,
    RECOGNITION_FLOOR,
    CLASS_FLOOR,
    MATERIAL_FLOOR,
  };
}));
