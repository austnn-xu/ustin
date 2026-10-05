'use strict';

/**
 * US Tin — the object catalog.
 *
 * An object is a list of COMPONENTS, because most things are several
 * materials with several destinations. A component starts at `outcome` +
 * `stream` and can be overridden by its `rules`, which match against the
 * user's follow-up answers. Later matching rules win, so order them general
 * to specific.
 *
 * The same physical part turns up on dozens of objects — a PET bottle body, a
 * paperboard carton, a lithium cell — so components are built by the factories
 * below rather than copied. Every factory takes the label and an explanation,
 * because the reason is the product: a verdict with a generic sentence under
 * it teaches nothing.
 */

(function (root, factory) {
  const streams = typeof require === 'function' ? require('./streams') : root.USTinStreams;
  const api = factory(streams);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') root.USTinCatalog = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  // -------------------------------------------------------------------------
  // Rule fragments
  // -------------------------------------------------------------------------

  /** The very common "compost if you can, else landfill" fallback. */
  const compostElseTrash = (why) => [{
    when: { composting: 'no' },
    outcome: 'trash',
    stream: null,
    why: `${why} But with no organics collection nearby, this goes to landfill.`,
  }];

  /** Rinse-or-reject: clean it and it recycles, leave it and it does not. */
  const rinseOrReject = (stream) => [{
    when: { rinsed: 'no' },
    outcome: 'trash',
    stream: null,
    why: 'Food residue gets the whole item pulled at the sorting line. Rinse it and it recycles; leave it and it is landfill.',
  }];

  /** A nudge rather than a downgrade — the material recycles either way. */
  const rinseNudge = (stream, why) => [{
    when: { rinsed: 'no' },
    outcome: 'recycle',
    stream,
    why: why || 'Still recyclable — but give it a rinse, or residue can spoil the bale around it.',
  }];

  /** Working things are worth more to a person than to a shredder. */
  const reuseIfGood = (why) => [{
    when: { condition: 'good' },
    outcome: 'reuse',
    stream: null,
    why,
  }];

  // -------------------------------------------------------------------------
  // Component factories
  // -------------------------------------------------------------------------

  const part = {
    pet: (label, why, opts) => ({
      label, material: 'PET (#1)', outcome: 'recycle', stream: 'pet',
      why: why || '#1 PET is the most reliably recycled plastic there is, with a genuine market for the material.',
      questions: ['rinsed'], rules: rinseNudge('pet'), ...opts,
    }),

    hdpe: (label, why, opts) => ({
      label, material: 'HDPE (#2)', outcome: 'recycle', stream: 'hdpe',
      why: why || 'Rigid #2 HDPE has a strong market and is accepted almost everywhere.',
      questions: ['rinsed'], rules: rinseNudge('hdpe'), ...opts,
    }),

    pp: (label, why, opts) => ({
      label, material: 'Polypropylene (#5)', outcome: 'recycle', stream: 'pp',
      why: why || 'Rigid #5 polypropylene is widely accepted once it is clean.',
      questions: ['rinsed'], rules: rinseOrReject('pp'), ...opts,
    }),

    foam: (label, why, opts) => ({
      label, material: 'Expanded polystyrene (#6)', outcome: 'trash', stream: 'ps',
      why: why || '#6 foam is 95% air, so it costs more to haul than the recovered material is worth.',
      ...opts,
    }),

    /** Bonded layers of different materials. No melt stream exists for these. */
    laminate: (label, material, why, opts) => ({
      label, material, outcome: 'trash', stream: 'other7',
      why: why || 'Bonded layers of different materials with no economic way to separate them, so it is landfill.',
      ...opts,
    }),

    film: (label, material, why, opts) => ({
      label, material: material || 'LDPE film (#4)', outcome: 'dropoff', stream: 'filmDropoff',
      why: why || 'Soft film tangles in curbside sorting machinery and shuts the line down. Supermarkets collect it at the entrance.',
      questions: ['filmPlastic'],
      rules: [{
        when: { filmPlastic: 'yes' },
        outcome: 'recycle', stream: 'ldpe',
        why: 'Your program takes film, so it can go curbside — as long as it is clean and dry.',
      }],
      ...opts,
    }),

    paper: (label, material, why, opts) => ({
      label, material: material || 'Paper', outcome: 'recycle', stream: 'paper',
      why: why || 'Clean, dry paper fibre is one of the most valuable things in the bin.',
      questions: ['soiled'],
      rules: [{
        when: { soiled: 'yes' },
        outcome: 'compost', stream: 'organics',
        why: 'Wet or food-soiled paper cannot be pulped, but it composts well.',
      }],
      ...opts,
    }),

    /** Card with no lining and no question attached — boxes, sleeves, tubes. */
    card: (label, why, opts) => ({
      label, material: 'Paperboard', outcome: 'recycle', stream: 'paper',
      why: why || 'Plain paperboard, clean and dry — straight into the paper stream.',
      ...opts,
    }),

    steel: (label, material, why, opts) => ({
      label, material: material || 'Steel', outcome: 'recycle', stream: 'steel',
      why: why || 'Steel is pulled out magnetically at the facility, making it one of the easiest materials to recover.',
      ...opts,
    }),

    aluminium: (label, material, why, opts) => ({
      label, material: material || 'Aluminium', outcome: 'recycle', stream: 'aluminium',
      why: why || 'Aluminium is the most profitable thing in your bin — recycling it uses about 5% of the energy of making it new.',
      ...opts,
    }),

    glass: (label, why, opts) => ({
      label, material: 'Container glass', outcome: 'recycle', stream: 'glass',
      why: why || 'Container glass recycles endlessly with no loss of quality.',
      questions: ['rinsed'], rules: rinseNudge('glass', 'Still recyclable — rinse it so the bale stays clean.'),
      ...opts,
    }),

    organic: (label, material, why, opts) => ({
      label, material: material || 'Organic matter', outcome: 'compost', stream: 'organics',
      why: why || 'In landfill this breaks down without oxygen and releases methane. Composted, it becomes soil.',
      questions: ['composting'], rules: compostElseTrash('This belongs in organics.'),
      ...opts,
    }),

    device: (label, material, why, opts) => ({
      label, material: material || 'Mixed metals, plastics and rare earths', outcome: 'dropoff', stream: 'ewaste',
      why: why || 'E-waste holds recoverable gold, copper and lithium, plus heavy metals that must not reach landfill.',
      questions: ['condition'],
      rules: reuseIfGood('A working device is worth far more to someone else than as shredded material. Wipe your data, then donate or resell.'),
      ...opts,
    }),

    cell: (label, material, why, opts) => ({
      label, material: material || 'Electrochemical cell', outcome: 'dropoff', stream: 'battery',
      why: why || 'Cells start fires in collection trucks and sorting halls — the single most dangerous thing to put in a household bin.',
      ...opts,
    }),

    hazard: (label, material, why, opts) => ({
      label, material, outcome: 'dropoff', stream: 'hazardous',
      why: why || 'Household hazardous waste. It poisons groundwater or ignites, so it needs a staffed collection point.',
      ...opts,
    }),

    textile: (label, material, why, opts) => ({
      label, material: material || 'Mixed textile fibres', outcome: 'dropoff', stream: 'textile',
      why: why || 'Textiles are never curbside recyclable, but textile banks take even worn-out fabric for rag and fibre recovery.',
      questions: ['condition'],
      rules: reuseIfGood('Usable textiles should be donated or resold — reuse saves far more than fibre recovery does.'),
      ...opts,
    }),

    /** Landfill, but still named: the material IS the explanation. */
    landfill: (label, material, why, stream, opts) => ({
      label, material, outcome: 'trash', stream: stream || null, why, ...opts,
    }),
  };

  const cap = {
    plastic: (why) => part.pp('Cap', why || 'Leave the cap screwed on. Loose caps are too small for the sorting screens and fall straight through.', { questions: [], rules: [] }),
    metal: (why) => part.steel('Metal lid', 'Steel', why || 'Take the lid off the jar first — sorters read a mixed-material item as contamination.'),
  };

  // -------------------------------------------------------------------------
  // The catalog
  // -------------------------------------------------------------------------

  const OBJECTS = [

    // === Drinks & bottles ==================================================
    {
      id: 'water-bottle', label: 'Plastic water bottle',
      match: ['plastic bottle', 'water bottle', 'drink bottle', 'bottle'],
      components: [part.pet('Bottle'), cap.plastic()],
      tip: 'Empty, squash, cap back on.',
    },
    {
      id: 'soda-bottle', label: 'Soda bottle',
      match: ['soda bottle', 'pop bottle', 'fizzy drink bottle', 'cola bottle'],
      components: [
        part.pet('Bottle', 'Clear #1 PET is the single most valuable plastic in the bin — it becomes new bottles and fibre.'),
        cap.plastic(),
        part.landfill('Shrink label', 'PVC or PETG sleeve', 'Full-body shrink sleeves are a different plastic from the bottle and confuse optical sorters. Tear it off if it peels.', 'other7'),
      ],
      tip: 'Peel the shrink sleeve off if it comes away easily — the bare bottle sorts far better.',
    },
    {
      id: 'milk-jug', label: 'Milk jug',
      match: ['milk jug', 'milk bottle', 'plastic jug', 'gallon jug'],
      components: [part.hdpe('Jug', 'Natural (uncoloured) #2 HDPE is the highest-value plastic after PET.'), cap.plastic()],
      tip: 'Rinse it or the bin will smell within a day.',
    },
    {
      id: 'milk-carton', label: 'Carton (milk / juice)',
      match: ['carton', 'milk carton', 'tetra pak', 'juice carton'],
      components: [
        {
          label: 'Carton', material: 'Paper, polyethylene and aluminium laminate',
          outcome: 'recycle', stream: 'carton',
          why: 'Cartons need a specialist pulping mill that separates the layers, but most curbside programs now collect them.',
        },
        part.hdpe('Cap and spout', 'Leave the cap on the carton so it is not lost through the sorting screens.', { questions: [], rules: [] }),
      ],
      tip: 'Rinse, flatten, cap back on.',
    },
    {
      id: 'juice-box', label: 'Juice box',
      match: ['juice box', 'drink box', 'juice carton small'],
      components: [
        {
          label: 'Box', material: 'Paper, polyethylene and aluminium laminate',
          outcome: 'recycle', stream: 'carton',
          why: 'Same laminate as a milk carton, and the same specialist mill recovers the paper fibre from it.',
        },
        part.landfill('Straw and wrapper', 'Thin polypropylene', 'Too small and light to be sorted — it falls through every screen in the plant.', null),
      ],
      tip: 'Push the straw inside the box so it does not escape into the sorting line.',
    },
    {
      id: 'soup-carton', label: 'Soup or stock carton',
      match: ['soup carton', 'stock carton', 'broth carton'],
      components: [
        {
          label: 'Carton', material: 'Aseptic paper laminate', outcome: 'recycle', stream: 'carton',
          why: 'Aseptic cartons carry more plastic than a chilled carton, but the same carton mills take them.',
          questions: ['rinsed'], rules: rinseNudge('carton'),
        },
        part.hdpe('Cap', 'Screw the cap back on so it travels with the carton.', { questions: [], rules: [] }),
      ],
    },
    {
      id: 'wine-bottle', label: 'Wine bottle',
      match: ['wine bottle', 'green bottle', 'glass bottle'],
      components: [part.glass('Bottle', 'Coloured container glass recycles endlessly, though it can only become coloured glass again.')],
      tip: 'Leave the label on — it burns off in the furnace.',
    },
    {
      id: 'beer-bottle', label: 'Beer bottle',
      match: ['beer bottle', 'brown bottle'],
      components: [part.glass('Bottle'), cap.metal('Crown caps are steel. They are small, so collect them in a tin can and crimp it shut.')],
      tip: 'In deposit states the bottle is worth more returned than recycled.',
    },
    {
      id: 'drink-can', label: 'Drinks can',
      match: ['drink can', 'soda can', 'beer can', 'aluminium can', 'aluminum can', 'can'],
      components: [part.aluminium('Can', 'Aluminium', 'An aluminium can is back on the shelf as a new can within about six weeks.', { questions: ['rinsed'], rules: rinseNudge('aluminium') })],
      tip: 'Do not crush it flat if your program uses optical sorters — they read the shape.',
    },
    {
      id: 'glass-jar', label: 'Glass jar',
      match: ['glass jar', 'jar', 'mason jar', 'sauce jar', 'pickle jar'],
      components: [
        part.glass('Jar', 'Glass recycles endlessly with no loss of quality.', {
          questions: ['rinsed', 'condition'],
          rules: [
            ...rinseNudge('glass', 'Rinse it first — dried food residue contaminates the batch.'),
            {
              when: { condition: 'good', rinsed: 'yes' }, outcome: 'reuse', stream: null,
              why: 'A clean glass jar is a free storage container. Reuse beats recycling every time.',
            },
          ],
        }),
        cap.metal(),
      ],
      tip: 'Separate the lid from the jar. Both recycle, just not in the same stream.',
    },
    {
      id: 'bottle-cap-plastic', label: 'Plastic bottle cap',
      match: ['bottle cap', 'plastic cap', 'lid', 'screw cap'],
      components: [part.pp('Cap', 'On its own a cap is below the 3-inch minimum most sorters use and falls through the screens. Screwed onto its bottle it survives the line.', { questions: [], rules: [] })],
      tip: 'Never put loose caps in the bin. Screw them back onto the bottle.',
    },
    {
      id: 'bottle-cap-metal', label: 'Metal bottle cap',
      match: ['crown cap', 'metal cap', 'beer cap'],
      components: [part.steel('Cap', 'Steel', 'Steel, and magnetically recoverable — but only if it is big enough to reach the magnet. Collect caps inside a steel can.')],
      tip: 'Fill an empty steel can with caps and crimp the top shut, then recycle the whole thing.',
    },
    {
      id: 'six-pack-rings', label: 'Six-pack rings',
      match: ['six pack rings', 'can rings', 'yoke'],
      components: [part.film('Rings', 'LDPE film (#4)', 'Ring carriers are #4 film, not rigid plastic. They snag in sorting machinery and are notorious for trapping wildlife.')],
      tip: 'Snip every ring before it leaves your kitchen, whichever bin it ends up in.',
    },
    {
      id: 'drink-pouch', label: 'Drink pouch',
      match: ['drink pouch', 'capri sun', 'juice pouch', 'squeeze pouch'],
      components: [part.laminate('Pouch', 'Foil and plastic laminate', 'A metallised laminate with a plastic spout welded on — three materials bonded into one thin wall. Nothing recovers it.')],
    },

    // === Coffee & tea =======================================================
    {
      id: 'coffee-cup', label: 'Disposable coffee cup',
      match: ['coffee cup', 'paper cup', 'to-go cup', 'cup', 'espresso'],
      components: [
        {
          label: 'Cup body', material: 'Paper with polyethylene lining', outcome: 'trash', stream: null,
          why: 'The waterproof plastic lining is fused to the paper. Very few facilities can separate the two.',
          questions: ['cupType'],
          rules: [{
            when: { cupType: 'plastic' }, outcome: 'recycle', stream: 'pet',
            why: 'A clear cold cup is usually single-material #1 PET, which recycles well — unlike a lined hot cup.',
          }],
        },
        part.pp('Lid', '#5 rigid plastic is widely accepted. Put it in loose, not pushed inside the cup.', { questions: [], rules: [] }),
        part.card('Sleeve', 'Plain corrugated cardboard with no lining — straight into paper.'),
      ],
      tip: 'Three materials, three destinations. Pull it apart before you bin it.',
    },
    {
      id: 'coffee-pod', label: 'Coffee pod',
      match: ['coffee pod', 'k-cup', 'nespresso', 'capsule'],
      components: [
        part.aluminium('Aluminium pod', 'Aluminium', 'Aluminium pods are recyclable, but only through the brand\'s own mail-back or store scheme — they are far too small for curbside sorting.', { outcome: 'dropoff' }),
        part.organic('Coffee grounds', 'Spent coffee', 'Empty the grounds out before you do anything else. They compost, and the pod cannot be processed with them inside.'),
        part.landfill('Plastic pod and lid film', 'Mixed plastic and foil', 'Plastic pods are a composite of body, filter and foil lid. No program separates them.', 'other7'),
      ],
      tip: 'The empty pod is only recyclable through the brand scheme. Kerbside will lose it.',
    },
    {
      id: 'tea-bag', label: 'Tea bag',
      match: ['tea bag', 'teabag', 'tea'],
      components: [
        part.organic('Leaves and bag', 'Tea leaves and filter paper', 'Loose leaves and paper bags compost readily. Many bags are heat-sealed with polypropylene, which does not — tear one open and check for a plastic mesh.'),
        part.landfill('Staple and tag', 'Steel and paper', 'Too small to recover, and the staple contaminates a compost batch. Pull it off first.', null),
      ],
      tip: 'If the bag holds its shape after brewing and will not tear, it has a plastic mesh.',
    },
    {
      id: 'coffee-grounds', label: 'Coffee grounds',
      match: ['coffee grounds', 'used coffee', 'espresso puck'],
      components: [part.organic('Grounds', 'Spent coffee', 'Coffee grounds are nitrogen-rich and among the best things you can put in a compost bin.')],
      tip: 'Grounds also work straight onto the garden as a mulch.',
    },

    // === Food packaging =====================================================
    {
      id: 'pizza-box', label: 'Pizza box',
      match: ['pizza box', 'pizza'],
      components: [
        {
          label: 'Box lid (clean part)', material: 'Corrugated cardboard', outcome: 'recycle', stream: 'paper',
          why: 'Clean corrugated cardboard is one of the most valuable things in the bin.',
          questions: ['grease'],
          rules: [{
            when: { grease: 'yes' }, outcome: 'compost', stream: 'organics',
            why: 'Grease cannot be separated from paper fibre during pulping, so a greasy box is compost, not recycling.',
          }],
        },
        {
          label: 'Base (greasy part)', material: 'Soiled cardboard', outcome: 'compost', stream: 'organics',
          why: 'The base almost always carries oil and cheese, which rules out paper recycling.',
          questions: ['composting'], rules: compostElseTrash('Soiled cardboard composts well.'),
        },
      ],
      tip: 'Tear the box in half: the clean lid recycles as paper, the greasy base composts.',
    },
    {
      id: 'cardboard-box', label: 'Cardboard box',
      match: ['cardboard box', 'shipping box', 'carton box', 'corrugated', 'crate'],
      components: [part.card('Box', 'Corrugated cardboard is in constant demand and is the easiest win in the whole bin.', { material: 'Corrugated cardboard' })],
      tip: 'Flatten it. An unflattened box wastes most of the truck.',
    },
    {
      id: 'cereal-box', label: 'Cereal box',
      match: ['cereal box', 'cracker box', 'food box', 'packet box'],
      components: [
        part.card('Box', 'Thin paperboard pulps easily and is accepted everywhere paper is.'),
        part.film('Inner liner', 'HDPE or LDPE film', 'The bag inside is soft film — the single most common cause of sorting breakdowns. It never goes in with the box.'),
      ],
      tip: 'Pull the liner out first. It is a different material from the box around it.',
    },
    {
      id: 'egg-carton-paper', label: 'Egg carton (cardboard)',
      match: ['egg carton', 'egg box', 'pulp carton'],
      components: [
        {
          label: 'Carton', material: 'Moulded paper pulp', outcome: 'recycle', stream: 'paper',
          why: 'Moulded pulp is already made from recycled fibre and can be pulped once or twice more.',
          questions: ['composting'],
          rules: [{
            when: { composting: 'yes' }, outcome: 'compost', stream: 'organics',
            why: 'The fibre is short and near the end of its life, so composting it is at least as good as recycling it.',
          }],
        },
      ],
      tip: 'Tear it up and it composts in weeks.',
    },
    {
      id: 'egg-carton-foam', label: 'Egg carton (foam)',
      match: ['foam egg carton', 'polystyrene egg box'],
      components: [part.foam('Carton', 'Foam egg cartons are #6 polystyrene: too light, too bulky and worth less than the cost of hauling them.')],
    },
    {
      id: 'egg-carton-plastic', label: 'Egg carton (clear plastic)',
      match: ['plastic egg carton', 'clear egg box'],
      components: [part.pet('Carton', 'Clear #1 PET egg boxes are the same plastic as a drinks bottle and sort with them.', { questions: [], rules: [] })],
    },
    {
      id: 'yogurt-cup', label: 'Yogurt pot',
      match: ['yogurt cup', 'yoghurt pot', 'yogurt', 'dessert pot'],
      components: [
        part.pp('Pot', 'Rigid #5 pots are widely accepted, but only once the residue is out.'),
        part.landfill('Foil lid', 'Aluminium laminate', 'The peel-off lid is foil bonded to plastic and is far too small and thin to sort.', null),
        part.card('Cardboard sleeve', 'The printed sleeve is plain paperboard — pull it off and recycle it with paper.'),
      ],
      tip: 'Rinse the pot; a smear of yogurt is enough to get it rejected.',
    },
    {
      id: 'butter-tub', label: 'Butter or margarine tub',
      match: ['butter tub', 'margarine tub', 'spread tub'],
      components: [part.pp('Tub'), part.pp('Lid', 'The lid is the same #5 plastic as the tub. Leave them separated so both get seen.', { questions: [], rules: [] })],
      tip: 'A clean tub is a perfectly good food container. Reuse it a few times first.',
    },
    {
      id: 'takeout-container', label: 'Takeout container',
      match: ['takeout container', 'food container', 'clamshell', 'tub', 'takeaway box'],
      components: [
        {
          label: 'Container', material: 'Polypropylene (#5)', outcome: 'recycle', stream: 'pp',
          why: 'Rigid #5 tubs are widely accepted once clean.',
          questions: ['tubRigid', 'rinsed'],
          rules: [
            {
              when: { tubRigid: 'foam' }, outcome: 'trash', stream: 'ps',
              why: 'Foam and flimsy black trays are #6 polystyrene. Too light and low-value to recycle, and black plastic is invisible to optical sorters.',
            },
            {
              when: { rinsed: 'no' }, outcome: 'trash', stream: null,
              why: 'Greasy, food-caked plastic is rejected at the facility. Rinse it and it recycles; leave it and it is landfill.',
            },
          ],
        },
      ],
      tip: 'If the grease will not wash out, it is trash. Do not wish-cycle it.',
    },
    {
      id: 'foam-takeout-tray', label: 'Foam takeout tray',
      match: ['foam tray', 'styrofoam container', 'polystyrene box', 'clamshell foam'],
      components: [part.foam('Tray', 'Foam food trays carry grease as well, which rules out even the rare drop-off schemes that take clean block foam.')],
      tip: 'The same meal in a rigid #5 tub recycles. The foam version never does.',
    },
    {
      id: 'meat-tray', label: 'Meat tray',
      match: ['meat tray', 'supermarket tray', 'produce tray'],
      components: [
        {
          label: 'Tray', material: 'Foam or PET tray', outcome: 'trash', stream: 'ps',
          why: 'White foam meat trays are #6 polystyrene and hold raw meat residue, so they are landfill.',
          questions: ['tubRigid'],
          rules: [{
            when: { tubRigid: 'rigid' }, outcome: 'recycle', stream: 'pet',
            why: 'A rigid clear tray is #1 PET and recycles — wash the blood and juice off it first.',
          }],
        },
        part.landfill('Absorbent pad', 'Plastic and cellulose pad', 'The soaker pad under the meat is a plastic-wrapped gel. It is landfill, and it must never reach a compost bin.', null),
      ],
    },
    {
      id: 'produce-bag', label: 'Produce bag',
      match: ['produce bag', 'fruit bag', 'vegetable bag', 'plastic bag', 'carrier bag'],
      components: [part.film('Bag')],
      tip: 'Never bag your recycling in a plastic bag. Sorters bin the whole sealed bag unopened.',
    },
    {
      id: 'cling-film', label: 'Cling film',
      match: ['cling film', 'plastic wrap', 'saran wrap', 'food wrap'],
      components: [part.landfill('Film', 'PVC or LDPE film', 'Cling film is usually too thin and too contaminated with food to be taken even by store film bins.', 'other7')],
      tip: 'Beeswax wraps and a lid on a bowl do the same job without this problem.',
    },
    {
      id: 'aluminium-foil', label: 'Aluminium foil',
      match: ['aluminium foil', 'aluminum foil', 'tin foil', 'foil'],
      components: [
        part.aluminium('Foil', 'Aluminium', 'Clean foil is genuinely recyclable — scrunch it into a ball the size of a golf ball so the sorters can see it.', {
          questions: ['rinsed'],
          rules: [{
            when: { rinsed: 'no' }, outcome: 'trash', stream: null,
            why: 'Greasy foil is rejected. Either wipe it clean or bin it.',
          }],
        }),
      ],
      tip: 'Scrunch it into a ball. A flat sheet gets sorted as paper and ruins the bale.',
    },
    {
      id: 'foil-tray', label: 'Foil takeaway tray',
      match: ['foil tray', 'aluminium tray', 'curry tray', 'pie dish'],
      components: [part.aluminium('Tray', 'Aluminium', 'A foil tray is thick enough to sort easily and is worth real money as scrap aluminium.', { questions: ['rinsed'], rules: rinseOrReject('aluminium') })],
    },
    {
      id: 'tin-can', label: 'Food tin',
      match: ['tin can', 'food can', 'soup can', 'baked bean tin', 'tin'],
      components: [part.steel('Can', 'Steel tinplate', 'Steel is pulled out magnetically and is one of the few materials that genuinely recycles forever.', { questions: ['rinsed'], rules: rinseNudge('steel') })],
      tip: 'Push the lid inside the can so the sharp edge is contained.',
    },
    {
      id: 'chip-bag', label: 'Crisp / snack packet',
      match: ['chip bag', 'crisp packet', 'snack bag', 'wrapper', 'packet'],
      components: [part.laminate('Packet', 'Metallised plastic laminate', 'A laminate of plastic and aluminium bonded together. There is no economic way to split the layers, so it is landfill.')],
      tip: 'Scrunch test: if it stays scrunched, it is film or laminate — not curbside recyclable.',
    },
    {
      id: 'candy-wrapper', label: 'Sweet wrapper',
      match: ['candy wrapper', 'sweet wrapper', 'chocolate wrapper'],
      components: [part.laminate('Wrapper', 'Plastic or foil laminate', 'Too small to sort even if the material were recoverable — anything under about three inches falls through the screens.')],
    },
    {
      id: 'bread-bag', label: 'Bread bag',
      match: ['bread bag', 'bakery bag'],
      components: [part.film('Bag', 'LDPE film (#4)', 'Bread bags are clean, dry #4 film — exactly what the store film bin is for.')],
    },
    {
      id: 'bread-tag', label: 'Bread tag',
      match: ['bread tag', 'bag clip'],
      components: [part.landfill('Tag', 'Polystyrene (#6)', 'A few grams of #6 plastic, far below the size any sorter can catch.', 'ps')],
    },
    {
      id: 'frozen-food-bag', label: 'Frozen food bag',
      match: ['frozen food bag', 'freezer bag', 'frozen peas bag'],
      components: [part.landfill('Bag', 'Multi-layer film', 'Freezer bags are usually a laminate built to resist moisture, which is exactly what stops them being recycled as film.', 'other7')],
    },
    {
      id: 'condiment-packet', label: 'Sauce sachet',
      match: ['condiment packet', 'ketchup packet', 'sauce sachet', 'sachet'],
      components: [part.laminate('Sachet', 'Foil and plastic laminate', 'Laminated, tiny and full of residue. Three separate reasons it cannot be recycled.')],
      tip: 'Refusing them at the counter is the only real fix here.',
    },
    {
      id: 'ice-cream-tub', label: 'Ice cream tub',
      match: ['ice cream tub', 'ice cream carton'],
      components: [
        {
          label: 'Tub', material: 'Poly-coated paperboard', outcome: 'trash', stream: null,
          why: 'Card tubs are coated with plastic to survive the freezer, and that coating puts them outside the paper stream.',
          questions: ['tubRigid'],
          rules: [{
            when: { tubRigid: 'rigid' }, outcome: 'recycle', stream: 'pp',
            why: 'A rigid plastic tub is #5 polypropylene and recycles once rinsed.',
          }],
        },
      ],
    },
    {
      id: 'squeeze-pouch', label: 'Baby food pouch',
      match: ['squeeze pouch', 'baby food pouch', 'yogurt pouch'],
      components: [part.laminate('Pouch and cap', 'Foil laminate with polypropylene cap', 'A metallised laminate body with a rigid cap welded on. The two cannot be separated at any facility.')],
    },

    // === Tableware & kitchen ================================================
    {
      id: 'plastic-cutlery', label: 'Plastic cutlery',
      match: ['plastic cutlery', 'plastic fork', 'plastic spoon', 'plastic knife'],
      components: [part.landfill('Cutlery', 'Polystyrene or polypropylene', 'Long, thin and light: cutlery jams sorting equipment and is below the size threshold anyway. Even #5 cutlery is landfill.', 'ps')],
      tip: 'A fork in your bag removes this decision permanently.',
    },
    {
      id: 'wooden-cutlery', label: 'Wooden cutlery',
      match: ['wooden cutlery', 'wooden fork', 'bamboo cutlery'],
      components: [part.organic('Cutlery', 'Untreated wood or bamboo', 'Plain wood composts, though slowly. Snap it into pieces to speed it up.')],
    },
    {
      id: 'chopsticks', label: 'Chopsticks',
      match: ['chopsticks', 'disposable chopsticks'],
      components: [part.organic('Chopsticks', 'Untreated wood or bamboo', 'Bare wood composts. The paper sleeve they arrive in recycles with paper.')],
    },
    {
      id: 'paper-plate', label: 'Paper plate',
      match: ['paper plate', 'disposable plate'],
      components: [
        {
          label: 'Plate', material: 'Coated paper pulp', outcome: 'compost', stream: 'organics',
          why: 'Food-soiled paper is compost, not recycling — and a plate is soiled by definition.',
          questions: ['composting'], rules: compostElseTrash('An uncoated paper plate composts well.'),
        },
      ],
      tip: 'A glossy plastic-coated plate is landfill. Matte, uncoated card composts.',
    },
    {
      id: 'plastic-straw', label: 'Plastic straw',
      match: ['plastic straw', 'straw'],
      components: [part.landfill('Straw', 'Polypropylene (#5)', 'The right plastic, the wrong shape: straws fall through every sorting screen in the plant.', 'pp')],
    },
    {
      id: 'paper-straw', label: 'Paper straw',
      match: ['paper straw'],
      components: [part.organic('Straw', 'Wound paper', 'Soggy and small, so it is compost rather than paper recycling.')],
    },
    {
      id: 'drinking-glass', label: 'Drinking glass',
      match: ['drinking glass', 'tumbler', 'wine glass', 'goblet', 'beer glass'],
      components: [
        {
          label: 'Glass', material: 'Tempered or lead glass', outcome: 'trash', stream: null,
          why: 'Drinking glasses melt at a different temperature from bottle glass. A single one can ruin a whole furnace batch.',
          questions: ['condition'],
          rules: reuseIfGood('An unbroken glass should be donated. Charity shops take them readily.'),
        },
      ],
      tip: 'Never put drinking glasses, ovenware or window glass in with bottles and jars.',
    },
    {
      id: 'ceramic-mug', label: 'Ceramic mug',
      match: ['ceramic mug', 'mug', 'coffee mug', 'cup ceramic'],
      components: [
        {
          label: 'Mug', material: 'Glazed ceramic', outcome: 'dropoff', stream: 'rubble',
          why: 'Ceramic does not melt with glass and is one of the worst contaminants in a glass bale. Broken, it is rubble.',
          questions: ['condition'],
          rules: reuseIfGood('A mug with no chips is the easiest thing in the world to donate.'),
        },
      ],
    },
    {
      id: 'ceramic-plate', label: 'Ceramic plate or bowl',
      match: ['ceramic plate', 'dinner plate', 'bowl', 'crockery', 'china'],
      components: [
        {
          label: 'Crockery', material: 'Glazed ceramic', outcome: 'dropoff', stream: 'rubble',
          why: 'Fired ceramic is inert. It is crushed for aggregate at a tip, never recycled with glass.',
          questions: ['condition'],
          rules: reuseIfGood('Matching, unchipped crockery is always wanted by charity shops and community kitchens.'),
        },
      ],
    },
    {
      id: 'ovenware', label: 'Pyrex or ovenware',
      match: ['pyrex', 'ovenware', 'casserole dish', 'baking dish'],
      components: [part.landfill('Dish', 'Borosilicate glass', 'Borosilicate is engineered not to melt, which is exactly why it cannot be recycled with container glass.', null)],
      tip: 'Intact ovenware is worth donating — it lasts decades.',
    },
    {
      id: 'nonstick-pan', label: 'Non-stick pan',
      match: ['non-stick pan', 'frying pan', 'skillet', 'saucepan', 'cookware'],
      components: [
        {
          label: 'Pan', material: 'Aluminium with PTFE coating', outcome: 'dropoff', stream: 'scrap',
          why: 'Scrap yards take pans and burn the coating off. The curbside bin cannot, because the coating is not metal.',
          questions: ['condition'],
          rules: reuseIfGood('A pan with an intact surface has years left. Pass it on.'),
        },
      ],
    },
    {
      id: 'cast-iron-pan', label: 'Cast iron pan',
      match: ['cast iron', 'iron skillet'],
      components: [
        {
          label: 'Pan', material: 'Cast iron', outcome: 'dropoff', stream: 'scrap',
          why: 'Solid iron is valuable scrap, but too heavy and dense for a curbside bin.',
          questions: ['condition'],
          rules: reuseIfGood('Cast iron is effectively immortal. Rust is not damage — it scrubs off and re-seasons.'),
        },
      ],
      tip: 'Almost no cast iron pan is actually beyond saving.',
    },
    {
      id: 'metal-cutlery', label: 'Metal cutlery',
      match: ['metal cutlery', 'fork', 'spoon', 'knife', 'silverware'],
      components: [
        {
          label: 'Cutlery', material: 'Stainless steel', outcome: 'dropoff', stream: 'scrap',
          why: 'Stainless steel is barely magnetic, so curbside magnets miss it. A scrap yard will take it by weight.',
          questions: ['condition'],
          rules: reuseIfGood('Working cutlery is always wanted somewhere.'),
        },
      ],
    },
    {
      id: 'sponge', label: 'Kitchen sponge',
      match: ['sponge', 'scourer', 'dish sponge'],
      components: [part.landfill('Sponge', 'Polyurethane foam and nylon', 'Plastic foam soaked in food residue. There is no recovery route and it must not go in compost.', null)],
      tip: 'Cellulose sponges and loofahs do compost. Plastic foam ones never do.',
    },

    // === Organics ===========================================================
    {
      id: 'food-scraps', label: 'Food scraps',
      match: ['food', 'food scraps', 'leftovers', 'vegetable', 'plate scrapings'],
      components: [part.organic('Scraps', 'Organic matter')],
      tip: 'A countertop tub with a lid makes this habit stick.',
    },
    {
      id: 'fruit-peel', label: 'Fruit or vegetable peel',
      match: ['banana peel', 'apple core', 'fruit peel', 'orange', 'banana', 'peelings'],
      components: [part.organic('Peel', 'Plant matter', 'Peelings are the easiest thing to compost — high moisture, high nitrogen, and they break down in weeks.')],
      tip: 'Citrus peel is slow and acidic. A little is fine, a lot is not.',
    },
    {
      id: 'eggshells', label: 'Eggshells',
      match: ['eggshells', 'egg shell'],
      components: [part.organic('Shells', 'Calcium carbonate', 'Eggshells add calcium to compost. Crush them first or they will still be recognisable a year later.')],
    },
    {
      id: 'bones', label: 'Bones and meat scraps',
      match: ['bones', 'meat scraps', 'chicken bones'],
      components: [
        {
          label: 'Bones', material: 'Animal matter', outcome: 'compost', stream: 'organics',
          why: 'Municipal organics collection handles meat and bone; the industrial process runs hot enough to be safe.',
          questions: ['composting'],
          rules: compostElseTrash('Council organics collection takes meat and bone.'),
        },
      ],
      tip: 'Never put meat or bone in a home compost heap — only in council collection.',
    },
    {
      id: 'cooking-oil', label: 'Used cooking oil',
      match: ['cooking oil', 'frying oil', 'grease', 'fat'],
      components: [
        {
          label: 'Oil', material: 'Vegetable oil', outcome: 'dropoff', stream: 'cookingOil',
          why: 'Poured down the drain it congeals into fatbergs that block sewers. Collected, it is refined into biodiesel.',
        },
      ],
      tip: 'Let it cool, pour it back into the bottle it came from, and take it to a collection point.',
      hazard: true,
    },
    {
      id: 'yard-waste', label: 'Garden waste',
      match: ['yard waste', 'garden waste', 'leaves', 'grass clippings', 'branches'],
      components: [part.organic('Green waste', 'Plant matter', 'Garden waste is the bulk of what green bins exist for, and it composts faster than food does.')],
    },
    {
      id: 'houseplant', label: 'Dead houseplant',
      match: ['houseplant', 'dead plant', 'flowers', 'bouquet'],
      components: [
        part.organic('Plant and soil', 'Plant matter and compost', 'Plants and potting soil go straight into the green bin.'),
        part.landfill('Plastic pot liner', 'Polypropylene (#5)', 'Thin black nursery pots are #5 plastic, but black pigment makes them invisible to the optical sorters that separate plastics.', 'ps'),
      ],
    },
    {
      id: 'pet-waste', label: 'Pet waste',
      match: ['pet waste', 'dog poop', 'animal waste'],
      components: [part.landfill('Waste and bag', 'Animal waste', 'Pet waste carries pathogens that municipal composting is not designed to kill, so it is landfill even in a compostable bag.', null)],
      hazard: true,
    },
    {
      id: 'cat-litter', label: 'Cat litter',
      match: ['cat litter', 'kitty litter', 'litter'],
      components: [part.landfill('Litter', 'Clay or silica granules', 'Clumping clay litter is mined clay and does not break down. Soiled litter also carries pathogens, so it stays out of organics.', null)],
      tip: 'Wood or paper pellet litters can go in council organics in some areas. Clay never can.',
    },
    {
      id: 'wine-cork', label: 'Cork',
      match: ['cork', 'wine cork', 'bottle cork'],
      components: [
        {
          label: 'Cork', material: 'Natural cork bark', outcome: 'compost', stream: 'organics',
          why: 'Natural cork is tree bark and composts, slowly. Plastic look-alike stoppers do not — a real cork is slightly spongy and shows a grain.',
          questions: ['composting'], rules: compostElseTrash('Real cork composts.'),
        },
      ],
      tip: 'Several wine merchants run cork collection for flooring and insulation.',
    },

    // === Paper & office =====================================================
    {
      id: 'office-paper', label: 'Office paper',
      match: ['office paper', 'printer paper', 'a4 paper', 'paper', 'document'],
      components: [part.paper('Paper', 'White office paper', 'White office paper has the longest, strongest fibre in the bin and is the most valuable grade of paper there is.')],
      tip: 'Staples and paperclips are fine — they are removed during pulping.',
    },
    {
      id: 'newspaper', label: 'Newspaper',
      match: ['newspaper', 'newsprint', 'paper news'],
      components: [part.paper('Newspaper', 'Newsprint', 'Newsprint fibre is already short and recycled, but it still has one or two lives left in it.')],
    },
    {
      id: 'magazine', label: 'Magazine',
      match: ['magazine', 'catalogue', 'glossy'],
      components: [part.paper('Magazine', 'Coated paper', 'The clay coating that makes it glossy is removed during pulping. Glossy paper recycles perfectly well.')],
    },
    {
      id: 'junk-mail', label: 'Junk mail',
      match: ['junk mail', 'flyer', 'leaflet', 'advertising mail'],
      components: [part.paper('Mail', 'Mixed paper', 'Mixed paper, and worth putting in the bin rather than the fire.')],
      tip: 'Registering with a mail preference service stops most of this at source.',
    },
    {
      id: 'envelope', label: 'Envelope',
      match: ['envelope', 'letter'],
      components: [part.paper('Envelope', 'Paper', 'Paper envelopes recycle as ordinary mixed paper — the gum line is not a problem.')],
    },
    {
      id: 'window-envelope', label: 'Window envelope',
      match: ['window envelope'],
      components: [
        part.paper('Envelope', 'Paper', 'The paper part is ordinary mixed paper.'),
        part.landfill('Plastic window', 'Polystyrene or cellulose film', 'Most mills screen the window out during pulping, so it can stay on. Tear it off if you want to be certain.', null),
      ],
    },
    {
      id: 'padded-mailer', label: 'Padded mailer',
      match: ['padded mailer', 'bubble mailer', 'jiffy bag', 'shipping envelope'],
      components: [
        {
          label: 'Mailer', material: 'Paper with bubble wrap lining', outcome: 'trash', stream: null,
          why: 'Paper glued to plastic bubble film. Neither stream can process it while they are bonded together.',
          questions: ['scrunch'],
          rules: [{
            when: { scrunch: 'no' }, outcome: 'recycle', stream: 'paper',
            why: 'A paper-only mailer padded with shredded or honeycomb paper recycles as ordinary card.',
          }],
        },
      ],
      tip: 'Tear a corner: grey paper padding recycles, plastic bubbles do not.',
    },
    {
      id: 'shredded-paper', label: 'Shredded paper',
      match: ['shredded paper', 'shreddings'],
      components: [
        {
          label: 'Shreddings', material: 'Shortened paper fibre', outcome: 'compost', stream: 'organics',
          why: 'Shredding cuts the fibre too short to pulp, and loose shreddings blow around the sorting hall. Compost is the better route.',
          questions: ['composting'], rules: compostElseTrash('Shredded paper is excellent compost carbon.'),
        },
      ],
      tip: 'If you must recycle it, seal it inside a paper bag first.',
    },
    {
      id: 'receipt', label: 'Receipt',
      match: ['receipt', 'thermal paper', 'till slip'],
      components: [part.landfill('Receipt', 'Thermal paper (BPA/BPS coated)', 'Thermal paper is chemically coated, so it contaminates paper recycling and must not be composted either.', null)],
      tip: 'Shiny, slightly slick paper that darkens when you scratch it is thermal paper.',
    },
    {
      id: 'sticky-notes', label: 'Sticky notes',
      match: ['sticky notes', 'post-it', 'notes'],
      components: [part.paper('Notes', 'Paper with adhesive strip', 'The adhesive is removed as "stickies" during pulping. Small quantities are no problem at all.')],
    },
    {
      id: 'greeting-card', label: 'Greeting card',
      match: ['greeting card', 'birthday card', 'christmas card'],
      components: [
        {
          label: 'Card', material: 'Paperboard', outcome: 'recycle', stream: 'paper',
          why: 'Plain printed card recycles normally.',
          questions: ['scrunch'],
          rules: [{
            when: { scrunch: 'yes' }, outcome: 'trash', stream: null,
            why: 'Glitter is microplastic and foil is a laminate. Either one makes the card landfill.',
          }],
        },
      ],
      tip: 'Glitter is microplastic. A glittered card is landfill, every time.',
    },
    {
      id: 'gift-wrap', label: 'Gift wrap',
      match: ['gift wrap', 'wrapping paper', 'christmas paper'],
      components: [
        {
          label: 'Paper', material: 'Printed or laminated paper', outcome: 'recycle', stream: 'paper',
          why: 'Plain printed paper recycles.',
          questions: ['scrunch'],
          rules: [{
            when: { scrunch: 'no' }, outcome: 'trash', stream: null,
            why: 'Foil, plastic-coated or glittered wrap springs back when you scrunch it. That means a laminate, which is landfill.',
          }],
        },
      ],
      tip: 'The scrunch test settles it: stays crumpled, recycles; springs back, does not.',
    },
    {
      id: 'tissue-paper', label: 'Tissues and kitchen roll',
      match: ['tissue', 'kleenex', 'paper towel', 'kitchen roll', 'napkin'],
      components: [
        {
          label: 'Tissue', material: 'Short-fibre tissue paper', outcome: 'compost', stream: 'organics',
          why: 'Tissue fibre is already too short to recycle again, and it is usually soiled. It composts readily.',
          questions: ['composting'], rules: compostElseTrash('Used tissue is good compost carbon.'),
        },
      ],
      tip: 'Tissue used on chemicals or disinfectant is landfill, not compost.',
    },
    {
      id: 'paperback-book', label: 'Book',
      match: ['book', 'paperback', 'hardcover', 'novel'],
      components: [
        {
          label: 'Book', material: 'Paper with glued spine', outcome: 'recycle', stream: 'paper',
          why: 'Paperbacks pulp whole. A hardcover needs its board and cloth cover torn off first.',
          questions: ['condition'],
          rules: reuseIfGood('Books are the single most re-usable thing in a house. Charity shops, street libraries and schools all take them.'),
        },
      ],
      tip: 'Almost no book needs to be recycled. Pass it on instead.',
    },
    {
      id: 'spiral-notebook', label: 'Spiral notebook',
      match: ['notebook', 'spiral notebook', 'notepad', 'binder'],
      components: [
        part.paper('Pages', 'Paper', 'The paper block recycles normally once the spine is off.'),
        part.landfill('Wire or plastic spiral', 'Steel wire or PVC', 'The spiral is too small and too tangled to sort. Pull it out and bin it separately.', null),
      ],
      tip: 'Twenty seconds with a pair of pliers turns this into clean paper.',
    },
    {
      id: 'laminated-paper', label: 'Laminated paper',
      match: ['laminated paper', 'laminate sheet', 'id card', 'menu'],
      components: [part.laminate('Sheet', 'Paper sealed in polyester film', 'Paper permanently sealed inside plastic film. The pulper cannot get at the fibre.')],
    },
    {
      id: 'photograph', label: 'Photograph',
      match: ['photograph', 'photo', 'print'],
      components: [part.landfill('Photo', 'Resin-coated paper with silver halide', 'Photographic paper is plastic-coated and carries chemical residues, so it stays out of both paper and compost.', null)],
    },
    {
      id: 'cardboard-tube', label: 'Cardboard tube',
      match: ['cardboard tube', 'toilet roll tube', 'kitchen roll tube'],
      components: [part.card('Tube', 'Spiral-wound card with no lining. It recycles with paper and composts just as happily.', { material: 'Wound cardboard' })],
    },
    {
      id: 'pens', label: 'Pen or marker',
      match: ['pen', 'marker', 'biro', 'highlighter'],
      components: [part.landfill('Pen', 'Mixed plastics with metal tip and ink', 'Four materials in something the size of a finger. Too small and too mixed for any sorting line.', 'other7')],
      tip: 'Some stationers run mail-back schemes that do recover these.',
    },
    {
      id: 'crayons', label: 'Crayons',
      match: ['crayons', 'wax crayons'],
      components: [part.landfill('Crayons', 'Paraffin wax', 'Paraffin is a petroleum product, not an organic one, so it is landfill rather than compost.', null)],
      tip: 'Broken crayons melt down into new ones — several charities collect them.',
    },
    {
      id: 'cd-dvd', label: 'CD or DVD',
      match: ['cd', 'dvd', 'disc', 'blu-ray'],
      components: [
        {
          label: 'Disc and case', material: 'Polycarbonate with aluminium layer', outcome: 'trash', stream: 'other7',
          why: 'Polycarbonate sputtered with aluminium and lacquer. Specialist recyclers exist, but nothing curbside takes it.',
          questions: ['condition'],
          rules: reuseIfGood('Playable discs still sell and charity shops take them.'),
        },
      ],
    },

    // === Bathroom & personal care ===========================================
    {
      id: 'toothpaste-tube', label: 'Toothpaste tube',
      match: ['toothpaste', 'tube', 'squeeze tube'],
      components: [
        part.laminate('Tube', 'Multi-layer plastic and aluminium', 'Laminated layers plus unavoidable leftover product make this one of the least recyclable things in the bathroom.'),
        part.card('Cardboard box', 'Plain paperboard, clean and dry — straight into paper.'),
      ],
      tip: 'A few brands now make genuinely recyclable HDPE tubes. Check the crimp for a label.',
    },
    {
      id: 'toothbrush', label: 'Toothbrush',
      match: ['toothbrush', 'tooth brush'],
      components: [part.landfill('Brush', 'Polypropylene handle with nylon bristles', 'Two plastics fused together, with nylon bristles anchored by metal staples. Nothing separates them.', 'other7')],
      tip: 'Bamboo handles compost once you pull the nylon bristles out with pliers.',
    },
    {
      id: 'dental-floss', label: 'Dental floss',
      match: ['dental floss', 'floss'],
      components: [
        part.landfill('Floss', 'Nylon or PTFE thread', 'A fine plastic thread that tangles in machinery and is far too small to sort.', null),
        part.landfill('Container', 'Polypropylene case', 'The case is #5 but tiny, and usually glued shut around a metal cutter.', 'ps'),
      ],
    },
    {
      id: 'shampoo-bottle', label: 'Shampoo bottle',
      match: ['shampoo bottle', 'conditioner bottle', 'body wash'],
      components: [part.hdpe('Bottle', 'Bathroom bottles are ordinary #2 HDPE and recycle as readily as a milk jug.'), cap.plastic()],
      tip: 'Bathroom plastics are the most commonly missed recyclables in the house.',
    },
    {
      id: 'soap-pump', label: 'Pump bottle',
      match: ['soap pump', 'pump bottle', 'hand soap', 'lotion', 'soap dispenser'],
      components: [
        part.hdpe('Bottle', 'The bottle itself is straightforward #2 plastic.'),
        part.landfill('Pump mechanism', 'Mixed plastic with a metal spring', 'The pump holds a steel spring inside a plastic body. Mixed materials in a small part means landfill.', 'other7'),
      ],
      tip: 'Pull the pump off and bin it; recycle the bottle.',
    },
    {
      id: 'disposable-razor', label: 'Disposable razor',
      match: ['razor', 'disposable razor', 'shaver'],
      components: [part.landfill('Razor', 'Plastic handle with steel blade', 'A steel blade moulded into a plastic handle: hazardous to sorters and impossible to separate.', 'other7')],
      tip: 'Wrap it in card and tape before binning so nobody is cut.',
    },
    {
      id: 'razor-blades', label: 'Loose razor blades',
      match: ['razor blades', 'blades', 'safety razor blades'],
      components: [
        {
          label: 'Blades', material: 'Stainless steel', outcome: 'dropoff', stream: 'sharps',
          why: 'Loose blades cut refuse workers. They need a rigid puncture-proof container, exactly like needles.',
        },
      ],
      hazard: true,
      tip: 'A blade bank, or a taped-shut tin, keeps them contained.',
    },
    {
      id: 'cotton-swabs', label: 'Cotton buds',
      match: ['cotton swabs', 'cotton buds', 'q-tips', 'ear buds'],
      components: [
        {
          label: 'Bud', material: 'Cotton on a paper or plastic stem', outcome: 'compost', stream: 'organics',
          why: 'Paper-stemmed buds compost. Plastic-stemmed ones are landfill and are among the most common items found on beaches.',
          questions: ['composting'], rules: compostElseTrash('Paper-stemmed buds compost.'),
        },
      ],
      tip: 'Never flush them. Plastic stems are a signature item in sewage debris.',
    },
    {
      id: 'cotton-pads', label: 'Cotton pads',
      match: ['cotton pads', 'makeup remover pads', 'cotton wool'],
      components: [part.organic('Pads', 'Cotton wool', 'Plain cotton composts. Pads used with nail polish remover or heavy cosmetics are landfill.')],
    },
    {
      id: 'makeup-compact', label: 'Makeup compact',
      match: ['makeup', 'compact', 'foundation', 'eyeshadow', 'cosmetics'],
      components: [part.landfill('Compact', 'Mixed plastics, mirror and metal pan', 'Plastic case, glass mirror, metal pan and product residue, all glued together in a palm-sized object.', 'other7')],
      tip: 'Several cosmetics brands run in-store take-back for empties.',
    },
    {
      id: 'lipstick-tube', label: 'Lipstick tube',
      match: ['lipstick', 'lip balm', 'chapstick'],
      components: [part.landfill('Tube', 'Plastic and metal mechanism', 'A twist mechanism means several materials in a very small part. Below the sorting threshold regardless.', 'other7')],
    },
    {
      id: 'deodorant-stick', label: 'Deodorant stick',
      match: ['deodorant', 'antiperspirant stick'],
      components: [
        part.pp('Body', 'The barrel is usually #5 polypropylene and recycles if you can get it apart.', { questions: [], rules: [] }),
        part.landfill('Twist mechanism', 'Mixed plastic', 'The screw base and dial are a different plastic from the barrel and are not separable in practice.', 'other7'),
      ],
    },
    {
      id: 'sunscreen-bottle', label: 'Sunscreen bottle',
      match: ['sunscreen', 'sunblock', 'suncream'],
      components: [part.hdpe('Bottle', 'The bottle is #2 HDPE. Residue is the problem, not the plastic — rinse it well.'), cap.plastic()],
    },
    {
      id: 'wet-wipes', label: 'Wet wipes',
      match: ['wet wipes', 'baby wipes', 'cleaning wipes'],
      components: [part.landfill('Wipes', 'Polyester or viscose non-woven', 'Most wipes are plastic fabric. They do not break down, and flushed they are the main ingredient of fatbergs.', null)],
      tip: 'Never flush a wipe, whatever the packet claims.',
      hazard: true,
    },
    {
      id: 'sanitary-products', label: 'Period products',
      match: ['tampon', 'sanitary pad', 'period products', 'menstrual'],
      components: [part.landfill('Product and applicator', 'Cotton, plastic and superabsorbent polymer', 'Absorbent gel and plastic backing make these landfill, and they must never be flushed or composted.', null)],
      tip: 'Wrap and bin. Flushing blocks the pipes in your own home first.',
    },
    {
      id: 'diaper', label: 'Nappy',
      match: ['diaper', 'nappy', 'pull-ups'],
      components: [part.landfill('Nappy', 'Plastic, pulp and superabsorbent polymer', 'A laminate of plastic film, wood pulp and gel, with human waste in it. There is no recycling or composting route.', null)],
      hazard: true,
    },
    {
      id: 'contact-lenses', label: 'Contact lenses',
      match: ['contact lenses', 'contacts', 'lens blister'],
      components: [
        part.landfill('Lenses', 'Hydrogel', 'Flushed lenses fragment into microplastic. Bin them, never rinse them down the sink.', null),
        part.landfill('Blister pack', 'Polypropylene with foil lid', 'The blister is #5 with a foil lid bonded on, and is far too small for curbside sorting.', 'ps'),
      ],
      tip: 'Optician chains run free mail-back schemes that recycle both parts.',
    },
    {
      id: 'medication', label: 'Medication',
      match: ['medication', 'medicine', 'pills', 'drugs', 'prescription'],
      components: [
        {
          label: 'Medicine', material: 'Pharmaceutical', outcome: 'dropoff', stream: 'pharmacy',
          why: 'Never bin or flush medicines — they reach waterways and harm aquatic life.',
        },
        part.landfill('Blister pack', 'PVC and aluminium laminate', 'Bonded #3 PVC and foil, too small to sort. Landfill unless a pharmacy scheme takes it.', 'pvc'),
      ],
      tip: 'Most pharmacies will take back unused medication, no questions asked.',
      hazard: true,
    },
    {
      id: 'pill-bottle', label: 'Pill bottle',
      match: ['pill bottle', 'prescription bottle', 'tablet bottle'],
      components: [
        part.pp('Bottle', 'Amber pill bottles are #5 polypropylene, but many programs reject them on size. Check before you put one in.', { questions: [], rules: [] }),
        part.landfill('Label', 'Adhesive label with personal data', 'Peel the label off before recycling — not for the recycler\'s sake, for yours.', null),
      ],
      tip: 'Scratch your name off the label before it leaves the house.',
    },
    {
      id: 'bandages', label: 'Plasters and bandages',
      match: ['bandage', 'plaster', 'band aid', 'first aid'],
      components: [part.landfill('Dressing', 'Plastic or fabric with adhesive', 'Used dressings are contaminated waste and are landfill, whatever they are made of.', null)],
    },

    // === Electronics & batteries ============================================
    {
      id: 'smartphone', label: 'Smartphone',
      match: ['smartphone', 'phone', 'mobile phone', 'cell phone', 'iphone'],
      components: [part.device('Phone', 'Glass, aluminium, lithium cell and rare earths', 'A phone holds more gold per tonne than gold ore, plus a lithium cell that must never reach a crusher.')],
      tip: 'Factory reset and remove the SIM before it leaves your hands.',
      hazard: true,
    },
    {
      id: 'laptop', label: 'Laptop',
      match: ['laptop', 'notebook computer', 'macbook', 'computer'],
      components: [part.device('Laptop', 'Aluminium, circuit boards and lithium cell', 'Laptops are the densest source of recoverable precious metal in a household, and the battery makes them a fire risk in a bin.')],
      tip: 'Wipe the drive, or physically remove it, before you hand it over.',
      hazard: true,
    },
    {
      id: 'tablet', label: 'Tablet',
      match: ['tablet', 'ipad', 'e-reader', 'kindle'],
      components: [part.device('Tablet', 'Glass, aluminium and lithium cell')],
      hazard: true,
    },
    {
      id: 'charging-cable', label: 'Cable or charger',
      match: ['cable', 'charger', 'usb cable', 'power adapter', 'cord'],
      components: [
        {
          label: 'Cable', material: 'Copper core in PVC sheath', outcome: 'dropoff', stream: 'ewaste',
          why: 'Copper is valuable and PVC sheathing is not something you want incinerated. Cables also tangle sorting machinery badly.',
          questions: ['condition'],
          rules: reuseIfGood('A working cable is wanted by somebody. Most households have a drawer short of one.'),
        },
      ],
    },
    {
      id: 'headphones', label: 'Headphones',
      match: ['headphones', 'earphones', 'headset'],
      components: [part.device('Headphones', 'Plastic, copper and magnets')],
    },
    {
      id: 'wireless-earbuds', label: 'Wireless earbuds',
      match: ['earbuds', 'airpods', 'wireless earbuds'],
      components: [part.device('Earbuds and case', 'Plastic with sealed lithium cells', 'Three sealed lithium cells glued into plastic shells. Genuinely unrepairable, and a serious fire risk if crushed.')],
      hazard: true,
    },
    {
      id: 'battery', label: 'Battery',
      match: ['battery', 'batteries', 'aa battery', 'lithium battery', 'aaa'],
      components: [
        part.cell('Battery', 'Electrochemical cell', 'Batteries start fires in collection trucks and sorting facilities — the single most dangerous thing to put in a household bin.', {
          questions: ['batteryType'],
          rules: [
            {
              when: { batteryType: 'lithium' }, outcome: 'dropoff', stream: 'battery',
              why: 'Lithium cells ignite when punctured and burn at temperatures water will not put out. Tape the terminals before storing them.',
            },
            {
              when: { batteryType: 'button' }, outcome: 'dropoff', stream: 'hazardous',
              why: 'Button cells hold mercury, silver or lithium, and are a swallowing hazard for small children. Keep them contained until drop-off.',
            },
          ],
        }),
      ],
      tip: 'Tape over the terminals of lithium cells before storing them for drop-off.',
      hazard: true,
    },
    {
      id: 'power-bank', label: 'Power bank',
      match: ['power bank', 'portable charger', 'battery pack'],
      components: [part.cell('Power bank', 'Lithium-ion pack in a plastic shell', 'A large lithium cell in a sealed case. Battery collection points take these; a household bin is how sorting halls catch fire.')],
      hazard: true,
    },
    {
      id: 'television', label: 'Television or monitor',
      match: ['television', 'tv', 'monitor', 'screen', 'display'],
      components: [
        {
          label: 'Screen', material: 'LCD panel, circuit boards and backlight', outcome: 'dropoff', stream: 'ewaste',
          why: 'Screens hold mercury backlights or leaded glass depending on age, and are regulated e-waste everywhere.',
          questions: ['size', 'condition'],
          rules: [
            ...reuseIfGood('A working screen is worth far more to a person than a recycler.'),
            {
              when: { size: 'large' }, outcome: 'dropoff', stream: 'bulky',
              why: 'Too big for a drop-off bin — book a bulky waste collection or take it to a civic amenity site.',
            },
          ],
        },
      ],
      hazard: true,
    },
    {
      id: 'printer', label: 'Printer',
      match: ['printer', 'scanner', 'all-in-one'],
      components: [part.device('Printer', 'Plastic housing, circuit boards and rollers')],
    },
    {
      id: 'ink-cartridge', label: 'Ink or toner cartridge',
      match: ['ink cartridge', 'toner', 'printer cartridge'],
      components: [
        {
          label: 'Cartridge', material: 'Plastic with a chip and residual ink', outcome: 'dropoff', stream: 'ewaste',
          why: 'Cartridges are refilled and remanufactured, which is worth far more than shredding them. Every stationer runs a take-back bin.',
        },
      ],
      tip: 'Many charities collect empties for money. It costs you nothing.',
    },
    {
      id: 'light-bulb', label: 'Light bulb',
      match: ['light bulb', 'bulb', 'lamp', 'spotlight', 'led bulb'],
      components: [
        {
          label: 'Bulb', material: 'Glass and metal', outcome: 'trash', stream: null,
          why: 'Bulb glass is a different formulation from container glass and cannot go in with jars and bottles.',
          questions: ['bulbType'],
          rules: [
            {
              when: { bulbType: 'cfl' }, outcome: 'dropoff', stream: 'ewasteBulb',
              why: 'CFLs contain mercury vapour, so they need a lamp take-back bin rather than any household bin.',
            },
            {
              when: { bulbType: 'led' }, outcome: 'dropoff', stream: 'ewaste',
              why: 'LEDs contain a driver circuit, so they count as electronics rather than glass.',
            },
          ],
        },
      ],
      tip: 'Wrap a broken bulb in paper before binning it so it does not cut anyone.',
    },
    {
      id: 'fluorescent-tube', label: 'Fluorescent tube',
      match: ['fluorescent tube', 'strip light', 'tube light', 'striplight'],
      components: [
        {
          label: 'Tube', material: 'Glass tube with mercury vapour and phosphor', outcome: 'dropoff', stream: 'ewasteBulb',
          why: 'Every tube holds a few milligrams of mercury. Broken in a bin lorry it becomes an airborne exposure for the crew.',
        },
      ],
      tip: 'Keep it intact and take it to a hardware store lamp bin.',
      hazard: true,
    },
    {
      id: 'smoke-detector', label: 'Smoke detector',
      match: ['smoke detector', 'smoke alarm', 'fire alarm'],
      components: [
        {
          label: 'Detector', material: 'Plastic with electronics, sometimes americium-241', outcome: 'dropoff', stream: 'hazardous',
          why: 'Ionising detectors contain a sealed radioactive source. Tiny, harmless intact, and not something to crush in a bin lorry.',
        },
        part.cell('Backup battery', 'Alkaline or lithium cell', 'Take the battery out and send it to battery collection separately.'),
      ],
      hazard: true,
      tip: 'The manufacturer will usually take it back by post.',
    },
    {
      id: 'remote-control', label: 'Remote control',
      match: ['remote control', 'remote', 'tv remote'],
      components: [
        part.device('Remote', 'Plastic with a circuit board'),
        part.cell('Batteries', 'Alkaline cells', 'Take the batteries out first — they are the part that starts fires.'),
      ],
    },
    {
      id: 'keyboard-mouse', label: 'Keyboard or mouse',
      match: ['keyboard', 'mouse', 'computer mouse', 'keypad'],
      components: [part.device('Peripheral', 'Plastic housing with circuit board')],
    },
    {
      id: 'vape', label: 'Vape or e-cigarette',
      match: ['vape', 'e-cigarette', 'disposable vape', 'pod'],
      components: [
        {
          label: 'Vape', material: 'Lithium cell, circuit board and nicotine residue', outcome: 'dropoff', stream: 'ewaste',
          why: 'A sealed lithium cell, electronics and nicotine liquid in one disposable body. It is simultaneously e-waste, battery waste and hazardous waste.',
        },
      ],
      hazard: true,
      tip: 'Vape shops are legally required to take these back in many places.',
    },
    {
      id: 'small-appliance', label: 'Small appliance',
      match: ['toaster', 'kettle', 'hair dryer', 'blender', 'appliance', 'iron'],
      components: [part.device('Appliance', 'Metal, plastic and a heating element or motor', 'Motors and heating elements are mostly copper and steel, which makes appliances worth recycling properly.')],
    },
    {
      id: 'microwave', label: 'Microwave or large appliance',
      match: ['microwave', 'washing machine', 'fridge', 'dishwasher', 'oven'],
      components: [
        {
          label: 'Appliance', material: 'Steel case with motor and electronics', outcome: 'dropoff', stream: 'bulky',
          why: 'Mostly recoverable steel, but far too heavy for any bin. Councils and retailers both collect these.',
          questions: ['condition'],
          rules: reuseIfGood('A working appliance is worth collecting. Many charities will pick it up free.'),
        },
      ],
      tip: 'Fridges hold refrigerant gases and are illegal to scrap yourself.',
      hazard: true,
    },

    {
      id: 'electronics', label: 'Small electronic device',
      match: ['electronics', 'gadget', 'device', 'electronic'],
      components: [part.device('Device', 'Mixed metals, plastics and rare earths')],
      tip: 'Wipe any personal data before it leaves your hands.',
      hazard: true,
    },

    // === Household chemicals & hazardous ====================================
    {
      id: 'paint', label: 'Paint',
      match: ['paint', 'paint can', 'emulsion', 'gloss'],
      components: [
        {
          label: 'Paint and container', material: 'Chemical product', outcome: 'dropoff', stream: 'hazardous',
          why: 'Liquid paint contaminates groundwater and must go to a hazardous waste facility.',
          questions: ['empty'],
          rules: [{
            when: { empty: 'yes' }, outcome: 'recycle', stream: 'steel',
            why: 'A fully dried-out, empty metal tin is just scrap steel and goes with metals.',
          }],
        },
      ],
      tip: 'Leftover usable paint is often taken by community reuse schemes.',
      hazard: true,
    },
    {
      id: 'paint-thinner', label: 'Solvent or thinner',
      match: ['paint thinner', 'solvent', 'white spirit', 'turpentine', 'acetone'],
      components: [part.hazard('Solvent', 'Flammable organic solvent', 'Flammable, volatile and toxic to aquatic life. It must never go in a bin or a drain.')],
      hazard: true,
    },
    {
      id: 'motor-oil', label: 'Motor oil',
      match: ['motor oil', 'engine oil', 'used oil'],
      components: [
        {
          label: 'Oil', material: 'Used mineral oil', outcome: 'dropoff', stream: 'motorOil',
          why: 'One litre of used motor oil contaminates a million litres of water. Every garage and auto shop takes it back.',
        },
      ],
      hazard: true,
    },
    {
      id: 'antifreeze', label: 'Antifreeze',
      match: ['antifreeze', 'coolant', 'screenwash'],
      components: [
        {
          label: 'Coolant', material: 'Ethylene glycol', outcome: 'dropoff', stream: 'motorOil',
          why: 'Ethylene glycol is sweet-tasting and lethal to pets and children. It goes to automotive fluid take-back, never a drain.',
        },
      ],
      hazard: true,
    },
    {
      id: 'pesticide', label: 'Pesticide or weedkiller',
      match: ['pesticide', 'weedkiller', 'herbicide', 'insecticide', 'bug spray'],
      components: [part.hazard('Product and container', 'Agricultural chemical', 'Designed to kill living things and persistent in soil and water. Even the empty container is hazardous waste.')],
      hazard: true,
    },
    {
      id: 'cleaning-spray', label: 'Cleaning product',
      match: ['cleaning spray', 'detergent', 'disinfectant', 'cleaner', 'bleach'],
      components: [
        {
          label: 'Bottle', material: 'HDPE or PET bottle', outcome: 'recycle', stream: 'hdpe',
          why: 'A rinsed, empty cleaning bottle recycles with other rigid plastics.',
          questions: ['empty'],
          rules: [{
            when: { empty: 'no' }, outcome: 'dropoff', stream: 'hazardous',
            why: 'Part-full cleaning products are hazardous waste. Never pour them down a drain to empty the bottle.',
          }],
        },
        part.landfill('Trigger spray', 'Mixed plastic with a metal spring', 'The trigger holds a steel spring and several plastics. Pull it off and bin it.', 'other7'),
      ],
      tip: 'Never mix leftover cleaning products together — some combinations produce chlorine gas.',
      hazard: true,
    },
    {
      id: 'aerosol-can', label: 'Aerosol can',
      match: ['aerosol', 'spray can', 'deodorant can', 'spray paint', 'hair spray'],
      components: [
        {
          label: 'Can', material: 'Pressurised steel or aluminium', outcome: 'recycle', stream: 'steel',
          why: 'An empty aerosol is just scrap metal and recycles normally.',
          questions: ['empty'],
          rules: [{
            when: { empty: 'no' }, outcome: 'dropoff', stream: 'hazardous',
            why: 'A part-full can is pressurised and can explode when crushed. That makes it household hazardous waste.',
          }],
        },
        part.pp('Plastic cap', 'Pop the cap off and recycle it with rigid #5 plastics.', { questions: [], rules: [] }),
      ],
      tip: 'Never puncture or crush an aerosol yourself.',
    },
    {
      id: 'propane-canister', label: 'Gas canister',
      match: ['propane canister', 'butane', 'camping gas', 'gas cylinder'],
      components: [
        {
          label: 'Canister', material: 'Pressurised steel', outcome: 'dropoff', stream: 'hazardous',
          why: 'Even a canister you believe is empty holds residual pressure. Crushed in a truck it becomes a bomb.',
        },
      ],
      hazard: true,
      tip: 'Camping shops and gas suppliers take these back.',
    },
    {
      id: 'lighter', label: 'Lighter',
      match: ['lighter', 'disposable lighter'],
      components: [part.hazard('Lighter', 'Plastic body with butane', 'Residual butane under pressure inside a plastic shell, plus a flint. It is a small pressurised container, not a plastic item.')],
      hazard: true,
    },
    {
      id: 'matches', label: 'Matches',
      match: ['matches', 'matchbox', 'matchstick'],
      components: [
        part.organic('Used matches', 'Burnt wood', 'Spent wooden matches are just charred wood and compost fine.'),
        part.card('Matchbox', 'The box is plain paperboard.'),
      ],
      tip: 'Make sure they are fully out before they go anywhere near a bin.',
    },
    {
      id: 'nail-polish', label: 'Nail polish',
      match: ['nail polish', 'nail varnish', 'polish remover'],
      components: [part.hazard('Bottle and contents', 'Solvent-based lacquer in glass', 'Nail polish is a flammable solvent lacquer. The glass bottle cannot be recycled with the product still inside it.')],
      hazard: true,
    },
    {
      id: 'glue', label: 'Glue or adhesive',
      match: ['glue', 'adhesive', 'superglue', 'epoxy'],
      components: [
        {
          label: 'Adhesive', material: 'Chemical adhesive', outcome: 'dropoff', stream: 'hazardous',
          why: 'Solvent-based and two-part adhesives are hazardous waste while wet.',
          questions: ['empty'],
          rules: [{
            when: { empty: 'yes' }, outcome: 'trash', stream: null,
            why: 'A fully dried-out tube is inert, but the mixed plastic and metal tube is still landfill.',
          }],
        },
      ],
    },
    {
      id: 'fire-extinguisher', label: 'Fire extinguisher',
      match: ['fire extinguisher', 'extinguisher'],
      components: [
        {
          label: 'Extinguisher', material: 'Pressurised steel cylinder', outcome: 'dropoff', stream: 'hazardous',
          why: 'A pressurised steel cylinder that must be professionally discharged before the metal can be recycled.',
        },
      ],
      hazard: true,
      tip: 'Fire services and servicing companies dispose of these properly.',
    },
    {
      id: 'car-battery', label: 'Car battery',
      match: ['car battery', 'lead acid battery', 'vehicle battery'],
      components: [
        {
          label: 'Battery', material: 'Lead-acid cell', outcome: 'dropoff', stream: 'hazardous',
          why: 'Lead and sulphuric acid, and one of the most successfully recycled products in the world — over 95% of the lead is recovered.',
        },
      ],
      hazard: true,
      tip: 'Scrap yards and auto shops will usually pay you for it.',
    },
    {
      id: 'tyres', label: 'Tyre',
      match: ['tyre', 'tire', 'car tyre', 'bike tyre'],
      components: [
        {
          label: 'Tyre', material: 'Vulcanised rubber with steel belt', outcome: 'dropoff', stream: 'tyre',
          why: 'Banned from landfill almost everywhere because they trap gas and float back to the surface. They are shredded for crumb rubber instead.',
        },
      ],
      tip: 'The fitter selling you the new one is obliged to take the old one.',
    },

    // === Textiles & soft goods ==============================================
    {
      id: 'clothing', label: 'Clothing',
      match: ['clothing', 'clothes', 'shirt', 'jersey', 'jeans', 'dress', 'jumper', 'coat'],
      components: [part.textile('Garment')],
      tip: 'Torn and stained items still have value as rags. Do not bin them.',
    },
    {
      id: 'shoes', label: 'Shoes',
      match: ['shoes', 'trainers', 'sneakers', 'boots', 'sandal', 'running shoe'],
      components: [
        part.textile('Shoes', 'Mixed textile, rubber and adhesive', 'Shoes are glued composites and are almost never recycled into new material, but reuse markets for them are enormous.'),
      ],
      tip: 'Tie the laces together so the pair stays a pair.',
    },
    {
      id: 'towels-linens', label: 'Towels and bedding',
      match: ['towels', 'bedding', 'sheets', 'linens', 'duvet cover'],
      components: [
        part.textile('Textile', 'Cotton or polyester blend', 'Animal shelters take old towels and bedding constantly, and textile banks take whatever they cannot use.'),
      ],
      tip: 'Ring your local animal shelter before the textile bank.',
    },
    {
      id: 'pillow', label: 'Pillow or duvet',
      match: ['pillow', 'duvet', 'comforter', 'cushion'],
      components: [
        {
          label: 'Pillow', material: 'Polyester fill in a fabric shell', outcome: 'dropoff', stream: 'textile',
          why: 'Most textile banks reject pillows and duvets because the fill cannot be graded. Shelters take them; otherwise it is bulky waste.',
          questions: ['condition'],
          rules: reuseIfGood('Clean pillows and duvets are wanted by animal shelters year-round.'),
        },
      ],
    },
    {
      id: 'mattress', label: 'Mattress',
      match: ['mattress', 'bed'],
      components: [
        {
          label: 'Mattress', material: 'Steel springs, foam and fabric', outcome: 'dropoff', stream: 'bulky',
          why: 'Specialist facilities strip mattresses into steel, foam and fibre, all of which have markets. Fly-tipped they are one of the most common bulky waste items.',
          questions: ['condition'],
          rules: reuseIfGood('A clean mattress in good condition can be donated, though many charities have strict rules about fire labels.'),
        },
      ],
    },
    {
      id: 'backpack', label: 'Bag or backpack',
      match: ['backpack', 'bag', 'handbag', 'rucksack', 'suitcase'],
      components: [part.textile('Bag', 'Nylon or polyester with metal fittings', 'Bags are mixed textile with zips and buckles, so fibre recovery is limited — but reuse is easy.')],
    },
    {
      id: 'stuffed-animal', label: 'Soft toy',
      match: ['stuffed animal', 'soft toy', 'teddy bear', 'plush'],
      components: [
        {
          label: 'Toy', material: 'Polyester fabric and fill', outcome: 'dropoff', stream: 'textile',
          why: 'Polyester fabric and stuffing, sometimes with a sound box inside. Textile banks take them if clean.',
          questions: ['condition'],
          rules: reuseIfGood('Clean soft toys are wanted by charity shops, though many will not take them for hygiene reasons — ring first.'),
        },
      ],
    },
    {
      id: 'carpet', label: 'Carpet or rug',
      match: ['carpet', 'rug', 'flooring'],
      components: [
        {
          label: 'Carpet', material: 'Nylon or polypropylene pile on a backing', outcome: 'dropoff', stream: 'bulky',
          why: 'Carpet is a laminate of pile, backing and latex adhesive. A handful of specialist recyclers exist; for most people it is bulky waste.',
        },
      ],
    },
    {
      id: 'umbrella', label: 'Umbrella',
      match: ['umbrella', 'parasol'],
      components: [
        part.landfill('Canopy', 'Polyester or nylon fabric', 'The canopy is riveted to the frame, and textile banks will not take fabric with metal through it.', null),
        {
          label: 'Frame', material: 'Steel and fibreglass ribs', outcome: 'dropoff', stream: 'scrap',
          why: 'Strip the fabric off and the frame is scrap metal.',
        },
      ],
      tip: 'A broken umbrella is usually a broken rib. They are repairable.',
    },

    // === Around the house ===================================================
    {
      id: 'furniture-wood', label: 'Wooden furniture',
      match: ['furniture', 'chair', 'table', 'wooden furniture', 'desk', 'bookcase'],
      components: [
        {
          label: 'Furniture', material: 'Timber or particle board', outcome: 'dropoff', stream: 'bulky',
          why: 'Solid timber is chipped for board and biomass. Particle board is glued and usually cannot be, so it is landfilled at the tip.',
          questions: ['condition'],
          rules: reuseIfGood('Usable furniture is collected free by many reuse charities, who then sell or give it on.'),
        },
      ],
      tip: 'Reuse charities will collect furniture from your door, often the same week.',
    },
    {
      id: 'wood-offcut', label: 'Scrap wood',
      match: ['wood', 'timber', 'offcut', 'plank', 'pallet'],
      components: [
        {
          label: 'Wood', material: 'Timber', outcome: 'dropoff', stream: 'wood',
          why: 'Untreated timber is chipped for particle board and biomass fuel.',
          questions: ['woodTreated'],
          rules: [{
            when: { woodTreated: 'yes' }, outcome: 'dropoff', stream: 'hazardous',
            why: 'Pressure-treated and painted timber holds preservatives or lead, so it cannot be chipped or burned and needs hazardous handling.',
          }],
        },
      ],
    },
    {
      id: 'mirror', label: 'Mirror',
      match: ['mirror'],
      components: [part.landfill('Mirror', 'Silvered glass', 'The metallic backing means a mirror will not melt with container glass. It is landfill, or rubble if the tip takes it.', null)],
      tip: 'Tape the face before moving a broken one.',
    },
    {
      id: 'window-glass', label: 'Window or sheet glass',
      match: ['window glass', 'sheet glass', 'pane', 'windscreen'],
      components: [
        {
          label: 'Glass', material: 'Float or laminated glass', outcome: 'dropoff', stream: 'rubble',
          why: 'Window glass has a different chemistry and melting point from bottles, and laminated glass has a plastic interlayer. Neither goes with containers.',
        },
      ],
    },
    {
      id: 'plastic-toy', label: 'Plastic toy',
      match: ['toy', 'plastic toy', 'lego', 'action figure', 'doll'],
      components: [
        {
          label: 'Toy', material: 'Mixed rigid plastics', outcome: 'trash', stream: 'other7',
          why: 'Toys combine several plastics, paint and often metal fixings, which is why kerbside programs exclude them even though the plastic is good.',
          questions: ['hasBattery', 'condition'],
          rules: [
            ...reuseIfGood('Working toys are always in demand. Charity shops and nurseries take them.'),
            {
              when: { hasBattery: 'yes' }, outcome: 'dropoff', stream: 'ewaste',
              why: 'Anything with a cell or a circuit inside is e-waste, however much it looks like a toy. The battery makes the whole thing a drop-off.',
            },
          ],
        },
      ],
      tip: 'A battery inside turns the whole object into e-waste.',
    },
    {
      id: 'bicycle', label: 'Bicycle',
      match: ['bicycle', 'bike', 'cycle'],
      components: [
        {
          label: 'Bicycle', material: 'Steel or aluminium frame with rubber tyres', outcome: 'dropoff', stream: 'scrap',
          why: 'A frame is valuable scrap metal, but almost every bike is worth more repaired than scrapped.',
          questions: ['condition'],
          rules: reuseIfGood('Bike recycling projects will take anything with a straight frame, refurbish it and pass it on.'),
        },
      ],
      tip: 'Almost no bicycle is beyond repair. Find a bike project before a scrap yard.',
    },
    {
      id: 'plant-pot-plastic', label: 'Plastic plant pot',
      match: ['plant pot', 'nursery pot', 'flower pot'],
      components: [
        {
          label: 'Pot', material: 'Polypropylene (#5)', outcome: 'trash', stream: 'ps',
          why: 'Nursery pots are #5 plastic, but the carbon black pigment makes them invisible to the near-infrared sorters that separate plastics.',
          questions: ['tubRigid'],
          rules: [{
            when: { tubRigid: 'rigid' }, outcome: 'recycle', stream: 'pp',
            why: 'A coloured (not black) rigid pot is sortable #5 and recycles once the soil is knocked out.',
          }],
        },
      ],
      tip: 'Garden centres increasingly take pots back, black ones included.',
    },
    {
      id: 'plant-pot-terracotta', label: 'Terracotta pot',
      match: ['terracotta pot', 'clay pot', 'ceramic pot'],
      components: [
        {
          label: 'Pot', material: 'Fired clay', outcome: 'dropoff', stream: 'rubble',
          why: 'Fired clay is inert and crushes into aggregate. It must never go in with glass.',
          questions: ['condition'],
          rules: reuseIfGood('An unbroken terracotta pot never needs disposing of — someone will want it.'),
        },
      ],
      tip: 'Broken crocks are the ideal drainage layer in the bottom of another pot.',
    },
    {
      id: 'coat-hanger-wire', label: 'Wire coat hanger',
      match: ['wire hanger', 'coat hanger', 'clothes hanger'],
      components: [
        {
          label: 'Hanger', material: 'Steel wire', outcome: 'dropoff', stream: 'scrap',
          why: 'Steel, but long and thin: hangers tangle in sorting screens and are pulled out by hand. Dry cleaners take them back.',
        },
      ],
      tip: 'Your dry cleaner will reuse them directly.',
    },
    {
      id: 'coat-hanger-plastic', label: 'Plastic coat hanger',
      match: ['plastic hanger'],
      components: [part.landfill('Hanger', 'Polystyrene or polypropylene', 'An awkward shape in mixed plastic, usually with a metal hook moulded in. Stores take them back for reuse.', 'ps')],
      tip: 'Hand them back at the till. Retailers reuse them.',
    },
    {
      id: 'eyeglasses', label: 'Glasses',
      match: ['glasses', 'eyeglasses', 'spectacles', 'sunglasses'],
      components: [
        {
          label: 'Glasses', material: 'Plastic or metal frame with lenses', outcome: 'reuse', stream: null,
          why: 'Opticians and charities collect old prescription glasses, grade them and send them where eye care is scarce. That is worth far more than the material.',
        },
      ],
      tip: 'Most opticians have a collection box on the counter.',
    },
    {
      id: 'bubble-wrap', label: 'Bubble wrap',
      match: ['bubble wrap', 'packing film'],
      components: [part.film('Bubble wrap', 'LDPE film (#4)', 'Bubble wrap is clean #4 film, which is exactly what store film bins want.')],
      tip: 'Reuse it first. It survives many parcels.',
    },
    {
      id: 'packing-peanuts', label: 'Packing peanuts',
      match: ['packing peanuts', 'foam peanuts', 'loose fill'],
      components: [
        {
          label: 'Peanuts', material: 'Polystyrene or starch foam', outcome: 'trash', stream: 'ps',
          why: 'Polystyrene peanuts are landfill. Starch-based ones dissolve in water — drop one in a glass to tell them apart.',
          questions: ['composting'],
          rules: [{
            when: { composting: 'yes' }, outcome: 'compost', stream: 'organics',
            why: 'If they dissolve in water they are starch, and they can go in the green bin or straight down the sink.',
          }],
        },
      ],
      tip: 'Shipping stores will often take clean peanuts back for reuse.',
    },
    {
      id: 'packing-tape', label: 'Tape',
      match: ['tape', 'packing tape', 'sellotape', 'duct tape'],
      components: [part.landfill('Tape', 'Polypropylene or PVC film with adhesive', 'A thin plastic film with adhesive. It is screened out as a contaminant at the paper mill.', 'other7')],
      tip: 'A small amount of tape on a box is fine — the mill screens it out.',
    },
    {
      id: 'rubber-gloves', label: 'Rubber gloves',
      match: ['rubber gloves', 'latex gloves', 'washing up gloves', 'nitrile gloves'],
      components: [part.landfill('Gloves', 'Latex or nitrile rubber', 'Vulcanised rubber cannot be remelted, and used gloves are contaminated. Landfill.', null)],
    },
    {
      id: 'scrap-metal', label: 'Scrap metal',
      match: ['scrap metal', 'metal', 'pipe', 'bracket', 'nails', 'screws'],
      components: [
        {
          label: 'Metal', material: 'Mixed ferrous and non-ferrous metal', outcome: 'dropoff', stream: 'scrap',
          why: 'Metal never loses quality when recycled, but loose hardware is too small or too heavy for curbside. Scrap yards take it by weight.',
          questions: ['size'],
          rules: [{
            when: { size: 'small' }, outcome: 'recycle', stream: 'steel',
            why: 'Small steel items can go in the curbside bin if you collect them inside a steel can so the magnet catches them together.',
          }],
        },
      ],
    },
    {
      id: 'brick-rubble', label: 'Brick or concrete',
      match: ['brick', 'concrete', 'rubble', 'tile', 'plaster'],
      components: [
        {
          label: 'Rubble', material: 'Inert mineral construction waste', outcome: 'dropoff', stream: 'rubble',
          why: 'Crushed into aggregate for road base and new concrete. Heavy, inert and entirely outside the household waste system.',
        },
      ],
    },
    {
      id: 'christmas-lights', label: 'String lights',
      match: ['christmas lights', 'fairy lights', 'string lights'],
      components: [
        {
          label: 'Lights', material: 'Copper wire, plastic and LEDs', outcome: 'dropoff', stream: 'ewaste',
          why: 'Copper wire with electronics attached. They also tangle sorting machinery badly, which is why they must never go in a curbside bin.',
        },
      ],
      tip: 'Scrap yards take these for the copper.',
    },
    {
      id: 'garden-hose', label: 'Garden hose',
      match: ['garden hose', 'hose', 'hosepipe'],
      components: [part.landfill('Hose', 'Reinforced PVC', 'Reinforced PVC with a polyester braid inside. It is a "tanglers" item that shuts down sorting lines.', 'pvc')],
      tip: 'Anything long and flexible is a tangler. Keep it out of the bin.',
    },
    {
      id: 'vacuum-bag', label: 'Vacuum bag',
      match: ['vacuum bag', 'hoover bag', 'dust bag'],
      components: [part.landfill('Bag and dust', 'Paper or fabric bag with mixed dust', 'Household dust is a mix of fibres, skin, grit and microplastic. It goes to landfill, not compost.', null)],
    },
    {
      id: 'desiccant-packet', label: 'Silica gel packet',
      match: ['silica gel', 'desiccant', 'do not eat packet'],
      components: [part.landfill('Packet', 'Silica beads in a paper or plastic sachet', 'Inert silica in a small sachet. Harmless, but too small and too mixed to sort.', null)],
      tip: 'Keep a few in a toolbox or camera bag — they genuinely work.',
    },
    {
      id: 'balloon', label: 'Balloon',
      match: ['balloon', 'party balloon', 'foil balloon'],
      components: [part.landfill('Balloon', 'Latex or metallised film', 'Latex balloons take years to break down and are a serious hazard to wildlife; foil balloons are a laminate and also conduct, causing power cuts.', null)],
      hazard: true,
      tip: 'Never release balloons outdoors. They always come down somewhere.',
    },
    {
      id: 'cigarette-butt', label: 'Cigarette butt',
      match: ['cigarette', 'cigarette butt', 'filter', 'ash'],
      components: [part.landfill('Butt', 'Cellulose acetate filter', 'Filters are plastic, not cotton, and they carry concentrated toxins. They are the most littered item on earth and never compost.', null)],
      hazard: true,
    },
    {
      id: 'chewing-gum', label: 'Chewing gum',
      match: ['chewing gum', 'gum'],
      components: [part.landfill('Gum', 'Synthetic rubber base', 'Modern gum base is synthetic rubber — effectively soft plastic. It does not break down.', null)],
    },
    {
      id: 'pet-food-bag', label: 'Pet food bag',
      match: ['pet food bag', 'dog food bag', 'cat food bag'],
      components: [part.laminate('Bag', 'Woven polypropylene or foil laminate', 'Heavy multi-layer bags built to survive shipping, which is exactly what makes them unrecyclable.')],
      tip: 'They make excellent rubble and garden sacks before they are binned.',
    },
    {
      id: 'sports-equipment', label: 'Sports equipment',
      match: ['sports equipment', 'ball', 'racket', 'basketball', 'tennis'],
      components: [
        {
          label: 'Equipment', material: 'Mixed plastics, rubber and metal', outcome: 'trash', stream: 'other7',
          why: 'Sports gear is glued composite: foam, rubber, fabric and metal in one object. Reuse is the only good route.',
          questions: ['condition'],
          rules: reuseIfGood('Sports gear is expensive and clubs, schools and charities all take working equipment.'),
        },
      ],
    },
  ];


  return { OBJECTS, part, cap, compostElseTrash, reuseIfGood, rinseNudge, rinseOrReject };
}));
