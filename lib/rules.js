'use strict';

/**
 * The disposal knowledge base.
 *
 * The hard part of household waste is not "what is this object" — it is that a
 * single object is usually several materials that go to different places. So an
 * object here is a list of COMPONENTS, and every component gets its own verdict.
 *
 * A component starts at `outcome` and can be overridden by its `rules`, which
 * are matched against the user's follow-up answers. Later matching rules win,
 * so order rules from general to specific.
 */

const OUTCOMES = {
  recycle: {
    id: 'recycle',
    icon: '♻️',
    label: 'Curbside Recycling',
    blurb: 'Goes in your recycling bin.',
  },
  dropoff: {
    id: 'dropoff',
    icon: '📍',
    label: 'Special Drop-Off',
    blurb: 'Needs a specific collection point — not your curbside bin.',
  },
  compost: {
    id: 'compost',
    icon: '🌱',
    label: 'Compost',
    blurb: 'Goes in your organics / green bin.',
  },
  reuse: {
    id: 'reuse',
    icon: '🔄',
    label: 'Reuse / Donate',
    blurb: 'Still has life in it — pass it on rather than bin it.',
  },
  trash: {
    id: 'trash',
    icon: '🗑️',
    label: 'Trash',
    blurb: 'Landfill. No better route for this one.',
  },
};

// Follow-up questions, asked only when a matched component actually uses them.
const QUESTIONS = {
  grease: {
    text: 'Is the cardboard soaked with grease or stuck-on food?',
    help: 'Oil ruins a paper recycling batch, but it is fine for compost.',
    options: [
      { value: 'yes', label: 'Yes, greasy' },
      { value: 'no', label: 'No, clean' },
    ],
  },
  empty: {
    text: 'Is it completely empty?',
    help: 'Leftover contents contaminate recycling and can be a hazard.',
    options: [
      { value: 'yes', label: 'Empty' },
      { value: 'no', label: 'Still has contents' },
    ],
  },
  rinsed: {
    text: 'Has it been rinsed out?',
    help: 'Food residue can send a whole batch to landfill.',
    options: [
      { value: 'yes', label: 'Rinsed clean' },
      { value: 'no', label: 'Not rinsed' },
    ],
  },
  condition: {
    text: 'What condition is it in?',
    help: 'Working or wearable items are worth far more reused than recycled.',
    options: [
      { value: 'good', label: 'Works / wearable' },
      { value: 'broken', label: 'Broken / worn out' },
    ],
  },
  bulbType: {
    text: 'What kind of bulb is it?',
    help: 'CFLs contain mercury and are regulated differently.',
    options: [
      { value: 'incandescent', label: 'Incandescent / halogen' },
      { value: 'cfl', label: 'CFL (curly)' },
      { value: 'led', label: 'LED' },
    ],
  },
  composting: {
    text: 'Do you have compost collection where you live?',
    help: 'Without organics collection, compostables go to landfill.',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  filmPlastic: {
    text: 'Does your curbside program take soft plastic film?',
    help: 'Most do not — bags jam sorting machinery. Many grocery stores collect it.',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No / not sure' },
    ],
  },
};

// Helper for the very common "compost if you can, else trash" fallback.
const compostElseTrash = (why) => [
  { when: { composting: 'no' }, outcome: 'trash', why: `${why} But with no organics collection nearby, this goes to landfill.` },
];

/**
 * Object catalog. `match` terms are what the (currently stubbed) recogniser
 * emits; keeping them here means the recogniser stays dumb and this file stays
 * the single source of truth.
 */
const OBJECTS = [
  {
    id: 'pizza-box',
    label: 'Pizza box',
    match: ['pizza box', 'pizza'],
    components: [
      {
        label: 'Box lid (clean part)',
        material: 'Corrugated cardboard',
        outcome: 'recycle',
        why: 'Clean corrugated cardboard is one of the most valuable recyclables.',
        questions: ['grease'],
        rules: [
          { when: { grease: 'yes' }, outcome: 'compost', why: 'Grease cannot be separated from paper fibre during pulping, so a greasy box is compost, not recycling.' },
        ],
      },
      {
        label: 'Base (greasy part)',
        material: 'Soiled cardboard',
        outcome: 'compost',
        why: 'The base almost always carries oil and cheese, which rules out paper recycling.',
        questions: ['composting'],
        rules: compostElseTrash('Soiled cardboard composts well.'),
      },
    ],
    tip: 'Tear the box in half: the clean lid recycles, the greasy base composts.',
  },
  {
    id: 'coffee-cup',
    label: 'Disposable coffee cup',
    match: ['coffee cup', 'paper cup', 'to-go cup', 'cup'],
    components: [
      {
        label: 'Cup body',
        material: 'Paper with polyethylene lining',
        outcome: 'trash',
        why: 'The waterproof plastic lining is fused to the paper. Very few facilities can separate the two, so the cup is landfill unless your city explicitly says otherwise.',
      },
      {
        label: 'Lid',
        material: 'Polypropylene (#5)',
        outcome: 'recycle',
        why: '#5 rigid plastic is widely accepted — just put it in loose, not inside the cup.',
      },
      {
        label: 'Sleeve',
        material: 'Corrugated cardboard',
        outcome: 'recycle',
        why: 'Plain corrugated cardboard, no lining. Straight into paper recycling.',
      },
    ],
    tip: 'Three materials, three destinations — pull it apart before you bin it.',
  },
  {
    id: 'plastic-bottle',
    label: 'Plastic drink bottle',
    match: ['plastic bottle', 'water bottle', 'soda bottle', 'bottle'],
    components: [
      {
        label: 'Bottle',
        material: 'PET (#1)',
        outcome: 'recycle',
        why: 'PET is the most reliably recycled plastic there is.',
        questions: ['rinsed'],
        rules: [
          { when: { rinsed: 'no' }, outcome: 'recycle', why: 'Still recyclable — but give it a quick rinse first, or sugary residue can spoil the bale.' },
        ],
      },
      {
        label: 'Cap',
        material: 'HDPE / PP',
        outcome: 'recycle',
        why: 'Leave the cap screwed on. Loose caps are too small for sorting machinery and fall through the screens.',
      },
    ],
    tip: 'Empty, squash, cap back on.',
  },
  {
    id: 'glass-jar',
    label: 'Glass jar',
    match: ['glass jar', 'jar', 'mason jar', 'sauce jar'],
    components: [
      {
        label: 'Jar',
        material: 'Glass',
        outcome: 'recycle',
        why: 'Glass recycles endlessly with no loss of quality.',
        questions: ['rinsed', 'condition'],
        rules: [
          { when: { rinsed: 'no' }, outcome: 'recycle', why: 'Rinse it first — dried food residue contaminates the batch.' },
          { when: { condition: 'good', rinsed: 'yes' }, outcome: 'reuse', why: 'A clean glass jar is a free storage container. Reuse beats recycling every time.' },
        ],
      },
      {
        label: 'Metal lid',
        material: 'Steel or aluminium',
        outcome: 'recycle',
        why: 'Metal recycles well, but remove it from the jar — mixed materials confuse the sorters.',
      },
    ],
    tip: 'Separate the lid from the jar; both recycle, just not together.',
  },
  {
    id: 'battery',
    label: 'Battery',
    match: ['battery', 'batteries', 'aa battery', 'lithium battery'],
    components: [
      {
        label: 'Battery',
        material: 'Lithium / alkaline cell',
        outcome: 'dropoff',
        why: 'Batteries start fires in collection trucks and sorting facilities — this is the single most dangerous thing to put in a household bin. Most hardware and grocery stores have a free drop-off bin.',
      },
    ],
    tip: 'Tape over the terminals of lithium cells before storing them for drop-off.',
    hazard: true,
  },
  {
    id: 'electronics',
    label: 'Small electronics',
    match: ['electronics', 'phone', 'laptop', 'charger', 'cable', 'headphones'],
    components: [
      {
        label: 'Device',
        material: 'Mixed metals, plastics, rare earths',
        outcome: 'dropoff',
        why: 'E-waste holds recoverable gold, copper and lithium, plus heavy metals that must not reach landfill. It is banned from curbside bins in most places.',
        questions: ['condition'],
        rules: [
          { when: { condition: 'good' }, outcome: 'reuse', why: 'A working device is worth far more to someone else than as shredded material. Wipe your data, then donate or resell.' },
        ],
      },
    ],
    tip: 'Wipe personal data before it leaves your hands.',
    hazard: true,
  },
  {
    id: 'aerosol-can',
    label: 'Aerosol can',
    match: ['aerosol', 'spray can', 'deodorant can', 'spray paint'],
    components: [
      {
        label: 'Can',
        material: 'Pressurised steel or aluminium',
        outcome: 'recycle',
        why: 'An empty aerosol is just scrap metal and recycles fine.',
        questions: ['empty'],
        rules: [
          { when: { empty: 'no' }, outcome: 'dropoff', why: 'A part-full can is pressurised and can explode when crushed. It counts as household hazardous waste.' },
        ],
      },
      {
        label: 'Plastic cap',
        material: 'Polypropylene',
        outcome: 'recycle',
        why: 'Pop the cap off and recycle it with rigid plastics.',
      },
    ],
    tip: 'Never puncture or crush an aerosol yourself.',
  },
  {
    id: 'lightbulb',
    label: 'Light bulb',
    match: ['light bulb', 'bulb', 'lamp'],
    components: [
      {
        label: 'Bulb',
        material: 'Glass and metal',
        outcome: 'trash',
        why: 'Bulb glass is a different formulation from container glass and cannot go in with jars and bottles.',
        questions: ['bulbType'],
        rules: [
          { when: { bulbType: 'cfl' }, outcome: 'dropoff', why: 'CFLs contain mercury vapour. They are hazardous waste and need a proper take-back point.' },
          { when: { bulbType: 'led' }, outcome: 'dropoff', why: 'LEDs contain electronics, so they go with e-waste rather than in the bin.' },
        ],
      },
    ],
    tip: 'Wrap a broken bulb in paper before binning it so it does not cut anyone.',
  },
  {
    id: 'chip-bag',
    label: 'Crisp / snack packet',
    match: ['chip bag', 'crisp packet', 'snack bag', 'wrapper'],
    components: [
      {
        label: 'Packet',
        material: 'Metallised plastic film (multi-layer)',
        outcome: 'trash',
        why: 'It is a laminate of plastic and aluminium bonded together. There is no economic way to split the layers, so it is landfill.',
      },
    ],
    tip: 'A quick test: if it scrunches and stays scrunched, it is film — not curbside recyclable.',
  },
  {
    id: 'plastic-bag',
    label: 'Plastic bag',
    match: ['plastic bag', 'carrier bag', 'bread bag', 'film'],
    components: [
      {
        label: 'Bag',
        material: 'LDPE film (#4)',
        outcome: 'dropoff',
        why: 'Soft film tangles in curbside sorting machinery and shuts the line down. Supermarkets usually have a film collection bin at the entrance.',
        questions: ['filmPlastic'],
        rules: [
          { when: { filmPlastic: 'yes' }, outcome: 'recycle', why: 'Your program takes film, so it can go in the curbside bin.' },
        ],
      },
    ],
    tip: 'Never bag your recycling in a plastic bag — sorters bin the whole sealed bag unopened.',
  },
  {
    id: 'food-scraps',
    label: 'Food scraps',
    match: ['food', 'food scraps', 'banana peel', 'apple core', 'vegetable', 'leftovers'],
    components: [
      {
        label: 'Scraps',
        material: 'Organic matter',
        outcome: 'compost',
        why: 'In landfill, food breaks down without oxygen and releases methane. Composted, it becomes soil.',
        questions: ['composting'],
        rules: compostElseTrash('Food waste belongs in organics.'),
      },
    ],
    tip: 'A countertop tub with a lid makes this habit stick.',
  },
  {
    id: 'clothing',
    label: 'Clothing or textiles',
    match: ['clothing', 'clothes', 'shirt', 'shoes', 'fabric', 'textile'],
    components: [
      {
        label: 'Garment',
        material: 'Mixed textile fibres',
        outcome: 'dropoff',
        why: 'Textiles are never curbside recyclable, but charity shops and textile banks take even worn-out fabric for rag and fibre recovery.',
        questions: ['condition'],
        rules: [
          { when: { condition: 'good' }, outcome: 'reuse', why: 'Wearable clothing should be donated or resold — reuse saves far more than fibre recovery does.' },
        ],
      },
    ],
    tip: 'Torn and stained items still have value as rags — do not bin them.',
  },
  {
    id: 'takeout-container',
    label: 'Takeout container',
    match: ['takeout container', 'food container', 'clamshell', 'tub'],
    components: [
      {
        label: 'Container',
        material: 'Polypropylene (#5)',
        outcome: 'recycle',
        why: 'Rigid #5 tubs are widely accepted once clean.',
        questions: ['rinsed'],
        rules: [
          { when: { rinsed: 'no' }, outcome: 'trash', why: 'Greasy, food-caked plastic is rejected at the sorting facility. Rinse it and it recycles; leave it and it is landfill.' },
        ],
      },
    ],
    tip: 'If the grease will not wash out, it is trash — do not "wish-cycle" it.',
  },
  {
    id: 'milk-carton',
    label: 'Carton (milk / juice)',
    match: ['carton', 'milk carton', 'juice box', 'tetra pak'],
    components: [
      {
        label: 'Carton',
        material: 'Paper, polyethylene and aluminium laminate',
        outcome: 'recycle',
        why: 'Cartons need a specialist pulping mill, but most curbside programs now collect them. Rinse and flatten.',
      },
      {
        label: 'Plastic cap and spout',
        material: 'HDPE',
        outcome: 'recycle',
        why: 'Leave the cap on the carton so it is not lost through the sorting screens.',
      },
      {
        label: 'Straw (juice boxes)',
        material: 'Thin plastic',
        outcome: 'trash',
        why: 'Too small and light to be sorted — it falls through every screen.',
      },
    ],
    tip: 'Rinse, flatten, cap back on.',
  },
  {
    id: 'toothpaste-tube',
    label: 'Toothpaste tube',
    match: ['toothpaste', 'tube', 'squeeze tube'],
    components: [
      {
        label: 'Tube',
        material: 'Multi-layer plastic and aluminium',
        outcome: 'trash',
        why: 'Laminated layers plus unavoidable leftover product make this one of the least recyclable items in the bathroom.',
      },
      {
        label: 'Cardboard box',
        material: 'Paperboard',
        outcome: 'recycle',
        why: 'Plain paperboard, clean and dry — straight into paper recycling.',
      },
    ],
    tip: 'A few brands now make genuinely recyclable HDPE tubes — check the crimp for a label.',
  },
  {
    id: 'paint',
    label: 'Paint or solvent',
    match: ['paint', 'paint can', 'solvent', 'varnish', 'chemicals'],
    components: [
      {
        label: 'Paint and container',
        material: 'Chemical product',
        outcome: 'dropoff',
        why: 'Liquid paint and solvents are household hazardous waste. They contaminate groundwater and must go to a hazardous waste facility.',
        questions: ['empty'],
        rules: [
          { when: { empty: 'yes' }, outcome: 'recycle', why: 'A fully dried-out, empty metal tin is just scrap metal and can go with metals.' },
        ],
      },
    ],
    tip: 'Leftover usable paint is often taken by community reuse schemes.',
    hazard: true,
  },
  {
    id: 'receipt',
    label: 'Receipt',
    match: ['receipt', 'thermal paper'],
    components: [
      {
        label: 'Receipt',
        material: 'Thermal paper (BPA/BPS coated)',
        outcome: 'trash',
        why: 'Thermal paper is chemically coated, so it contaminates paper recycling and must not be composted either.',
      },
    ],
    tip: 'Shiny, slightly slick paper that darkens when you scratch it is thermal paper.',
  },
  {
    id: 'tin-can',
    label: 'Food tin',
    match: ['tin can', 'can', 'soup can', 'aluminium can', 'soda can'],
    components: [
      {
        label: 'Can',
        material: 'Steel or aluminium',
        outcome: 'recycle',
        why: 'Metal is infinitely recyclable and recycling aluminium uses about 5% of the energy of making it new.',
        questions: ['rinsed'],
        rules: [
          { when: { rinsed: 'no' }, outcome: 'recycle', why: 'Still recyclable — a quick rinse keeps the bin from smelling and the bale clean.' },
        ],
      },
    ],
    tip: 'Push the lid inside the can so the sharp edge is contained.',
  },
  {
    id: 'styrofoam',
    label: 'Polystyrene foam',
    match: ['styrofoam', 'polystyrene', 'foam', 'packing foam'],
    components: [
      {
        label: 'Foam',
        material: 'Expanded polystyrene (#6)',
        outcome: 'trash',
        why: 'Foam is 95% air, so it costs more to transport than the recovered material is worth. Almost nowhere takes it curbside.',
      },
    ],
    tip: 'Clean block foam is sometimes accepted at shipping stores for reuse as packing.',
  },
  {
    id: 'medication',
    label: 'Medication',
    match: ['medication', 'medicine', 'pills', 'drugs', 'prescription'],
    components: [
      {
        label: 'Medicine',
        material: 'Pharmaceutical',
        outcome: 'dropoff',
        why: 'Never bin or flush medicines — they reach waterways and harm aquatic life. Pharmacies run free take-back programs.',
      },
      {
        label: 'Blister pack',
        material: 'Plastic and aluminium laminate',
        outcome: 'trash',
        why: 'Bonded plastic and foil, too small to sort. Landfill unless a pharmacy scheme takes it.',
      },
    ],
    tip: 'Most pharmacies will take back unused medication, no questions asked.',
    hazard: true,
  },
];

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

function findObject(id) {
  return OBJECTS.find((o) => o.id === id) || null;
}

/** Fuzzy lookup used by the recogniser to turn a guessed label into a catalog entry. */
function matchObject(text) {
  const needle = String(text || '').toLowerCase().trim();
  if (!needle) return null;

  const exact = OBJECTS.find((o) => o.id === needle || o.match.includes(needle));
  if (exact) return exact;

  // Prefer the longest matching term so "plastic bottle" beats a bare "bottle".
  let best = null;
  let bestLen = 0;
  for (const obj of OBJECTS) {
    for (const term of obj.match) {
      if ((needle.includes(term) || term.includes(needle)) && term.length > bestLen) {
        best = obj;
        bestLen = term.length;
      }
    }
  }
  return best;
}

/** The follow-up questions this object actually needs, in catalog order. */
function questionsFor(obj) {
  const ids = [];
  for (const c of obj.components) {
    for (const q of c.questions || []) {
      if (!ids.includes(q)) ids.push(q);
    }
  }
  return ids.map((id) => ({ id, ...QUESTIONS[id] })).filter((q) => q.text);
}

function ruleMatches(rule, answers) {
  return Object.entries(rule.when).every(([k, v]) => answers[k] === v);
}

/** Resolve one object + the user's answers into a per-component verdict. */
function resolve(obj, answers = {}) {
  const components = obj.components.map((c) => {
    let outcome = c.outcome;
    let why = c.why;

    for (const rule of c.rules || []) {
      if (ruleMatches(rule, answers)) {
        outcome = rule.outcome;
        why = rule.why;
      }
    }

    return {
      label: c.label,
      material: c.material,
      outcome: OUTCOMES[outcome],
      why,
    };
  });

  // Headline = the outcome needing the most care, so the summary never
  // understates a hazard.
  const severity = ['dropoff', 'trash', 'compost', 'recycle', 'reuse'];
  const headline = components
    .slice()
    .sort((a, b) => severity.indexOf(a.outcome.id) - severity.indexOf(b.outcome.id))[0];

  const distinct = [...new Set(components.map((c) => c.outcome.id))];

  return {
    object: { id: obj.id, label: obj.label },
    components,
    headline: headline.outcome,
    split: distinct.length > 1,
    tip: obj.tip || null,
    hazard: Boolean(obj.hazard),
  };
}

module.exports = {
  OUTCOMES,
  QUESTIONS,
  OBJECTS,
  findObject,
  matchObject,
  questionsFor,
  resolve,
};
