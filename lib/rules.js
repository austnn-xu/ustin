'use strict';

/**
 * US Tin — the disposal knowledge base.
 *
 * Two ideas drive the shape of this file:
 *
 * 1. A household object is usually SEVERAL MATERIALS that go to different
 *    places, so an object is a list of components and each gets its own
 *    verdict.
 * 2. "Recycling" is not one bin. A #1 PET bottle, a #6 polystyrene tray and a
 *    sheet of LDPE film are all "plastic" and all go somewhere different. So
 *    every component also carries a STREAM — the specific resin code or
 *    material class that decides whether it is genuinely accepted.
 *
 * A component starts at `outcome` + `stream` and can be overridden by its
 * `rules`, which match against the user's follow-up answers. Later matching
 * rules win, so order them general to specific.
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

/**
 * Recycling and drop-off streams.
 *
 * `acceptance` is the honest answer to "will my curbside program actually take
 * this?" — the difference between #1 PET and #6 polystyrene is the whole
 * reason people get recycling wrong.
 *
 *   widely — accepted almost everywhere
 *   varies — real programs differ; check locally
 *   rarely — technically recyclable, almost nowhere takes it curbside
 */
const ACCEPTANCE = {
  widely: { id: 'widely', label: 'Widely accepted' },
  varies: { id: 'varies', label: 'Varies by program' },
  rarely: { id: 'rarely', label: 'Rarely accepted curbside' },
};

const STREAMS = {
  // --- plastics, by resin identification code -----------------------------
  pet: {
    id: 'pet', code: '#1', short: 'PET', label: 'PET plastic',
    family: 'Plastic', acceptance: 'widely',
    note: 'The most valuable and most reliably recycled plastic. Bottles and clear tubs.',
  },
  hdpe: {
    id: 'hdpe', code: '#2', short: 'HDPE', label: 'HDPE plastic',
    family: 'Plastic', acceptance: 'widely',
    note: 'Rigid opaque plastic — milk jugs, detergent bottles, caps. Strong market.',
  },
  pvc: {
    id: 'pvc', code: '#3', short: 'PVC', label: 'PVC / vinyl',
    family: 'Plastic', acceptance: 'rarely',
    note: 'Contains chlorine, which contaminates other plastics when melted. Almost no curbside program takes it.',
  },
  ldpe: {
    id: 'ldpe', code: '#4', short: 'LDPE', label: 'LDPE film',
    family: 'Plastic', acceptance: 'rarely',
    note: 'Soft, stretchy film. Tangles in curbside sorting machinery — take it to a store film bin instead.',
  },
  pp: {
    id: 'pp', code: '#5', short: 'PP', label: 'Polypropylene',
    family: 'Plastic', acceptance: 'widely',
    note: 'Tubs, lids, takeout containers. Acceptance has improved a lot and most programs now take it.',
  },
  ps: {
    id: 'ps', code: '#6', short: 'PS', label: 'Polystyrene',
    family: 'Plastic', acceptance: 'rarely',
    note: 'Rigid polystyrene and foam. Light, bulky and worth less than the cost of hauling it.',
  },
  other7: {
    id: 'other7', code: '#7', short: 'Other', label: 'Mixed / other plastic',
    family: 'Plastic', acceptance: 'rarely',
    note: 'The catch-all code, including multi-layer laminates. No single melt stream exists for it.',
  },

  // --- everything that is not plastic -------------------------------------
  paper: {
    id: 'paper', code: 'PAP', short: 'Paper', label: 'Paper & cardboard',
    family: 'Fibre', acceptance: 'widely',
    note: 'Must be clean and dry. Grease and food residue ruin the pulping process.',
  },
  glass: {
    id: 'glass', code: 'GL', short: 'Glass', label: 'Container glass',
    family: 'Glass', acceptance: 'widely',
    note: 'Bottles and jars only. Infinitely recyclable with no loss of quality.',
  },
  aluminium: {
    id: 'aluminium', code: 'ALU', short: 'Aluminium', label: 'Aluminium',
    family: 'Metal', acceptance: 'widely',
    note: 'The most profitable thing in your bin. Recycling it uses about 5% of the energy of making it new.',
  },
  steel: {
    id: 'steel', code: 'FE', short: 'Steel', label: 'Steel / tin',
    family: 'Metal', acceptance: 'widely',
    note: 'Magnetically separated at the facility, so it is easy and cheap to recover.',
  },
  carton: {
    id: 'carton', code: 'PAP 84', short: 'Carton', label: 'Beverage carton',
    family: 'Composite', acceptance: 'varies',
    note: 'Paper, plastic and foil bonded together. Needs a specialist pulping mill, but most programs now collect them.',
  },

  // --- drop-off destinations ----------------------------------------------
  ewaste: {
    id: 'ewaste', code: 'WEEE', short: 'E-waste', label: 'Electronic waste',
    family: 'Drop-off', acceptance: 'varies',
    note: 'Holds recoverable gold, copper and lithium plus heavy metals. Banned from curbside bins in most places.',
  },
  battery: {
    id: 'battery', code: 'BATT', short: 'Batteries', label: 'Battery collection',
    family: 'Drop-off', acceptance: 'widely',
    note: 'Free collection bins at most hardware and grocery stores.',
  },
  hazardous: {
    id: 'hazardous', code: 'HHW', short: 'Hazardous', label: 'Household hazardous waste',
    family: 'Drop-off', acceptance: 'varies',
    note: 'Municipal facility or a collection event. Never bin, never pour down a drain.',
  },
  textile: {
    id: 'textile', code: 'TEX', short: 'Textiles', label: 'Textile recovery',
    family: 'Drop-off', acceptance: 'widely',
    note: 'Charity shops and textile banks take even worn-out fabric for rag and fibre recovery.',
  },
  pharmacy: {
    id: 'pharmacy', code: 'RX', short: 'Pharmacy', label: 'Pharmacy take-back',
    family: 'Drop-off', acceptance: 'widely',
    note: 'Most pharmacies accept unused medication, no questions asked.',
  },
  filmDropoff: {
    id: 'filmDropoff', code: '#4', short: 'Store film bin', label: 'Store film drop-off',
    family: 'Drop-off', acceptance: 'widely',
    note: 'The bin at the supermarket entrance. Takes bags, wraps and bread bags — clean and dry only.',
  },
  organics: {
    id: 'organics', code: 'ORG', short: 'Organics', label: 'Organics / green bin',
    family: 'Organic', acceptance: 'varies',
    note: 'Composted into soil instead of generating methane in landfill.',
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
  cupType: {
    text: 'Is the cup plastic or paper?',
    help: 'A clear plastic cold cup and a lined paper hot cup are different materials.',
    options: [
      { value: 'paper', label: 'Paper (hot cup)' },
      { value: 'plastic', label: 'Clear plastic (cold cup)' },
    ],
  },
  tubRigid: {
    text: 'Is the container rigid or flimsy?',
    help: 'Rigid #5 tubs are recyclable; thin black or foam trays usually are not.',
    options: [
      { value: 'rigid', label: 'Rigid plastic tub' },
      { value: 'foam', label: 'Foam or flimsy tray' },
    ],
  },
};

// The very common "compost if you can, else landfill" fallback.
const compostElseTrash = (why) => [
  {
    when: { composting: 'no' },
    outcome: 'trash',
    stream: null,
    why: `${why} But with no organics collection nearby, this goes to landfill.`,
  },
];

/**
 * Object catalog. `match` terms are what the (currently stubbed) recogniser
 * emits; keeping them here means the recogniser stays dumb and this file
 * remains the single source of truth.
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
        stream: 'paper',
        why: 'Clean corrugated cardboard is one of the most valuable things in the bin.',
        questions: ['grease'],
        rules: [
          {
            when: { grease: 'yes' },
            outcome: 'compost',
            stream: 'organics',
            why: 'Grease cannot be separated from paper fibre during pulping, so a greasy box is compost, not recycling.',
          },
        ],
      },
      {
        label: 'Base (greasy part)',
        material: 'Soiled cardboard',
        outcome: 'compost',
        stream: 'organics',
        why: 'The base almost always carries oil and cheese, which rules out paper recycling.',
        questions: ['composting'],
        rules: compostElseTrash('Soiled cardboard composts well.'),
      },
    ],
    tip: 'Tear the box in half: the clean lid recycles as paper, the greasy base composts.',
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
        stream: null,
        why: 'The waterproof plastic lining is fused to the paper. Very few facilities can separate the two.',
        questions: ['cupType'],
        rules: [
          {
            when: { cupType: 'plastic' },
            outcome: 'recycle',
            stream: 'pet',
            why: 'A clear cold cup is usually single-material #1 PET, which recycles well — unlike a lined hot cup.',
          },
        ],
      },
      {
        label: 'Lid',
        material: 'Polypropylene',
        outcome: 'recycle',
        stream: 'pp',
        why: '#5 rigid plastic is widely accepted. Put it in loose, not pushed inside the cup.',
      },
      {
        label: 'Sleeve',
        material: 'Corrugated cardboard',
        outcome: 'recycle',
        stream: 'paper',
        why: 'Plain corrugated cardboard with no lining — straight into paper.',
      },
    ],
    tip: 'Three materials, three destinations. Pull it apart before you bin it.',
  },
  {
    id: 'plastic-bottle',
    label: 'Plastic drink bottle',
    match: ['plastic bottle', 'water bottle', 'soda bottle', 'bottle'],
    components: [
      {
        label: 'Bottle',
        material: 'PET',
        outcome: 'recycle',
        stream: 'pet',
        why: '#1 PET is the most reliably recycled plastic there is, with a genuine market for the material.',
        questions: ['rinsed'],
        rules: [
          {
            when: { rinsed: 'no' },
            outcome: 'recycle',
            stream: 'pet',
            why: 'Still recyclable — but rinse it, or sugary residue can spoil the bale.',
          },
        ],
      },
      {
        label: 'Cap',
        material: 'HDPE or polypropylene',
        outcome: 'recycle',
        stream: 'hdpe',
        why: 'Leave the cap screwed on. Loose caps are too small for the sorting screens and fall through.',
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
        material: 'Container glass',
        outcome: 'recycle',
        stream: 'glass',
        why: 'Glass recycles endlessly with no loss of quality.',
        questions: ['rinsed', 'condition'],
        rules: [
          {
            when: { rinsed: 'no' },
            outcome: 'recycle',
            stream: 'glass',
            why: 'Rinse it first — dried food residue contaminates the batch.',
          },
          {
            when: { condition: 'good', rinsed: 'yes' },
            outcome: 'reuse',
            stream: null,
            why: 'A clean glass jar is a free storage container. Reuse beats recycling every time.',
          },
        ],
      },
      {
        label: 'Metal lid',
        material: 'Steel',
        outcome: 'recycle',
        stream: 'steel',
        why: 'Steel is magnetically separated at the facility, but take the lid off the jar first — the sorters read mixed materials as contamination.',
      },
    ],
    tip: 'Separate the lid from the jar. Both recycle, just not in the same stream.',
  },
  {
    id: 'battery',
    label: 'Battery',
    match: ['battery', 'batteries', 'aa battery', 'lithium battery'],
    components: [
      {
        label: 'Battery',
        material: 'Lithium or alkaline cell',
        outcome: 'dropoff',
        stream: 'battery',
        why: 'Batteries start fires in collection trucks and sorting facilities — the single most dangerous thing to put in a household bin.',
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
        stream: 'ewaste',
        why: 'E-waste holds recoverable gold, copper and lithium, plus heavy metals that must not reach landfill.',
        questions: ['condition'],
        rules: [
          {
            when: { condition: 'good' },
            outcome: 'reuse',
            stream: null,
            why: 'A working device is worth far more to someone else than as shredded material. Wipe your data, then donate or resell.',
          },
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
        stream: 'steel',
        why: 'An empty aerosol is just scrap metal and recycles normally.',
        questions: ['empty'],
        rules: [
          {
            when: { empty: 'no' },
            outcome: 'dropoff',
            stream: 'hazardous',
            why: 'A part-full can is pressurised and can explode when crushed. That makes it household hazardous waste.',
          },
        ],
      },
      {
        label: 'Plastic cap',
        material: 'Polypropylene',
        outcome: 'recycle',
        stream: 'pp',
        why: 'Pop the cap off and recycle it with rigid #5 plastics.',
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
        stream: null,
        why: 'Bulb glass is a different formulation from container glass and cannot go in with jars and bottles.',
        questions: ['bulbType'],
        rules: [
          {
            when: { bulbType: 'cfl' },
            outcome: 'dropoff',
            stream: 'hazardous',
            why: 'CFLs contain mercury vapour, so they are hazardous waste and need a proper take-back point.',
          },
          {
            when: { bulbType: 'led' },
            outcome: 'dropoff',
            stream: 'ewaste',
            why: 'LEDs contain a driver circuit, so they count as electronics rather than glass.',
          },
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
        material: 'Metallised plastic laminate',
        outcome: 'trash',
        stream: 'other7',
        why: 'A laminate of plastic and aluminium bonded together. No economic way to split the layers, so it is landfill.',
      },
    ],
    tip: 'Scrunch test: if it stays scrunched, it is film or laminate — not curbside recyclable.',
  },
  {
    id: 'plastic-bag',
    label: 'Plastic bag',
    match: ['plastic bag', 'carrier bag', 'bread bag', 'film'],
    components: [
      {
        label: 'Bag',
        material: 'LDPE film',
        outcome: 'dropoff',
        stream: 'filmDropoff',
        why: '#4 soft film tangles in curbside sorting machinery and shuts the line down. Supermarkets collect it at the entrance.',
        questions: ['filmPlastic'],
        rules: [
          {
            when: { filmPlastic: 'yes' },
            outcome: 'recycle',
            stream: 'ldpe',
            why: 'Your program takes film, so it can go curbside — clean and dry.',
          },
        ],
      },
    ],
    tip: 'Never bag your recycling in a plastic bag. Sorters bin the whole sealed bag unopened.',
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
        stream: 'organics',
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
        stream: 'textile',
        why: 'Textiles are never curbside recyclable, but textile banks take even worn-out fabric for rag and fibre recovery.',
        questions: ['condition'],
        rules: [
          {
            when: { condition: 'good' },
            outcome: 'reuse',
            stream: null,
            why: 'Wearable clothing should be donated or resold — reuse saves far more than fibre recovery does.',
          },
        ],
      },
    ],
    tip: 'Torn and stained items still have value as rags. Do not bin them.',
  },
  {
    id: 'takeout-container',
    label: 'Takeout container',
    match: ['takeout container', 'food container', 'clamshell', 'tub'],
    components: [
      {
        label: 'Container',
        material: 'Polypropylene',
        outcome: 'recycle',
        stream: 'pp',
        why: 'Rigid #5 tubs are widely accepted once clean.',
        questions: ['tubRigid', 'rinsed'],
        rules: [
          {
            when: { tubRigid: 'foam' },
            outcome: 'trash',
            stream: 'ps',
            why: 'Foam and flimsy black trays are #6 polystyrene. Too light and low-value to recycle, and black plastic is invisible to optical sorters.',
          },
          {
            when: { rinsed: 'no' },
            outcome: 'trash',
            stream: null,
            why: 'Greasy, food-caked plastic is rejected at the facility. Rinse it and it recycles; leave it and it is landfill.',
          },
        ],
      },
    ],
    tip: 'If the grease will not wash out, it is trash. Do not wish-cycle it.',
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
        stream: 'carton',
        why: 'Cartons need a specialist pulping mill that separates the layers, but most curbside programs now collect them.',
      },
      {
        label: 'Plastic cap and spout',
        material: 'HDPE',
        outcome: 'recycle',
        stream: 'hdpe',
        why: 'Leave the cap on the carton so it is not lost through the sorting screens.',
      },
      {
        label: 'Straw (juice boxes)',
        material: 'Thin plastic',
        outcome: 'trash',
        stream: null,
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
        stream: 'other7',
        why: 'Laminated layers plus unavoidable leftover product make this one of the least recyclable things in the bathroom.',
      },
      {
        label: 'Cardboard box',
        material: 'Paperboard',
        outcome: 'recycle',
        stream: 'paper',
        why: 'Plain paperboard, clean and dry — straight into paper.',
      },
    ],
    tip: 'A few brands now make genuinely recyclable HDPE tubes. Check the crimp for a label.',
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
        stream: 'hazardous',
        why: 'Liquid paint and solvents contaminate groundwater and must go to a hazardous waste facility.',
        questions: ['empty'],
        rules: [
          {
            when: { empty: 'yes' },
            outcome: 'recycle',
            stream: 'steel',
            why: 'A fully dried-out, empty metal tin is just scrap steel and goes with metals.',
          },
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
        stream: null,
        why: 'Thermal paper is chemically coated, so it contaminates paper recycling and must not be composted either.',
      },
    ],
    tip: 'Shiny, slightly slick paper that darkens when you scratch it is thermal paper.',
  },
  {
    id: 'tin-can',
    label: 'Food tin or drinks can',
    match: ['tin can', 'can', 'soup can', 'aluminium can', 'soda can'],
    components: [
      {
        label: 'Can',
        material: 'Steel or aluminium',
        outcome: 'recycle',
        stream: 'aluminium',
        why: 'Aluminium is the most profitable thing in your bin — recycling it uses about 5% of the energy of making it new.',
        questions: ['rinsed'],
        rules: [
          {
            when: { rinsed: 'no' },
            outcome: 'recycle',
            stream: 'aluminium',
            why: 'Still recyclable — a quick rinse keeps the bin from smelling and the bale clean.',
          },
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
        material: 'Expanded polystyrene',
        outcome: 'trash',
        stream: 'ps',
        why: '#6 foam is 95% air, so it costs more to transport than the recovered material is worth. Almost nowhere takes it curbside.',
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
        stream: 'pharmacy',
        why: 'Never bin or flush medicines — they reach waterways and harm aquatic life.',
      },
      {
        label: 'Blister pack',
        material: 'PVC and aluminium laminate',
        outcome: 'trash',
        stream: 'pvc',
        why: 'Bonded #3 PVC and foil, too small to sort. Landfill unless a pharmacy scheme takes it.',
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

function expandStream(id) {
  if (!id) return null;
  const s = STREAMS[id];
  if (!s) return null;
  return { ...s, acceptance: ACCEPTANCE[s.acceptance] };
}

/** Resolve one object + the user's answers into a per-component verdict. */
function resolve(obj, answers = {}) {
  const components = obj.components.map((c) => {
    let outcome = c.outcome;
    let stream = c.stream || null;
    let why = c.why;

    for (const rule of c.rules || []) {
      if (ruleMatches(rule, answers)) {
        outcome = rule.outcome;
        // `stream: null` in a rule is a deliberate clear, so only fall through
        // to the base stream when the rule omits the key entirely.
        stream = 'stream' in rule ? rule.stream : stream;
        why = rule.why;
      }
    }

    return {
      label: c.label,
      material: c.material,
      outcome: OUTCOMES[outcome],
      stream: expandStream(stream),
      why,
    };
  });

  // Headline = the outcome needing the most care, so a summary never
  // understates a hazard.
  const severity = ['dropoff', 'trash', 'compost', 'recycle', 'reuse'];
  const headline = components
    .slice()
    .sort((a, b) => severity.indexOf(a.outcome.id) - severity.indexOf(b.outcome.id))[0];

  const distinct = [...new Set(components.map((c) => c.outcome.id))];

  // Streams the user actually has to sort into, deduplicated for the summary.
  const streams = [];
  for (const c of components) {
    if (c.stream && !streams.some((s) => s.id === c.stream.id)) streams.push(c.stream);
  }

  return {
    object: { id: obj.id, label: obj.label },
    components,
    headline: headline.outcome,
    streams,
    split: distinct.length > 1 || streams.length > 1,
    tip: obj.tip || null,
    hazard: Boolean(obj.hazard),
  };
}

// Runs unchanged in Node (server + tests) and in the browser (static build),
// so the knowledge base has exactly one copy.
const API = {
  OUTCOMES,
  STREAMS,
  ACCEPTANCE,
  QUESTIONS,
  OBJECTS,
  findObject,
  matchObject,
  questionsFor,
  resolve,
};

if (typeof module !== 'undefined' && module.exports) module.exports = API;
if (typeof window !== 'undefined') window.USTinRules = API;
