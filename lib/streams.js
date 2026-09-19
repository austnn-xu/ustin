'use strict';

/**
 * US Tin — outcomes, material streams and follow-up questions.
 *
 * Two ideas drive the shape of this file:
 *
 * 1. A household object is usually SEVERAL MATERIALS that go to different
 *    places, so an object is a list of components and each gets its own
 *    verdict. That composition happens in lib/catalog.js.
 * 2. "Recycling" is not one bin. A #1 PET bottle, a #6 polystyrene tray and a
 *    sheet of LDPE film are all "plastic" and all go somewhere different. So
 *    every component also carries a STREAM — the specific resin code or
 *    material class that decides whether it is genuinely accepted.
 */

(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') root.USTinStreams = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  const OUTCOMES = {
    recycle: {
      id: 'recycle',
      icon: 'recycle',
      label: 'Curbside Recycling',
      blurb: 'Goes in your recycling bin.',
    },
    dropoff: {
      id: 'dropoff',
      icon: 'dropoff',
      label: 'Special Drop-Off',
      blurb: 'Needs a specific collection point — not your curbside bin.',
    },
    compost: {
      id: 'compost',
      icon: 'compost',
      label: 'Compost',
      blurb: 'Goes in your organics / green bin.',
    },
    reuse: {
      id: 'reuse',
      icon: 'reuse',
      label: 'Reuse / Donate',
      blurb: 'Still has life in it — pass it on rather than bin it.',
    },
    trash: {
      id: 'trash',
      icon: 'trash',
      label: 'Trash',
      blurb: 'Landfill. No better route for this one.',
    },
  };

  /**
   * `acceptance` is the honest answer to "will my curbside program actually
   * take this?" — the difference between #1 PET and #6 polystyrene is the
   * whole reason people get recycling wrong.
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
      note: 'The most profitable thing in the bin. Recycling it takes about 5% of the energy of making it new.',
    },
    steel: {
      id: 'steel', code: 'FE', short: 'Steel', label: 'Steel / tin',
      family: 'Metal', acceptance: 'widely',
      note: 'Magnetically separated at the facility, so it is one of the easiest materials to recover.',
    },
    carton: {
      id: 'carton', code: 'PAP 84', short: 'Carton', label: 'Beverage carton',
      family: 'Composite', acceptance: 'varies',
      note: 'Paper, polyethylene and foil bonded together. Needs a specialist mill that can separate the layers.',
    },

    // --- drop-off destinations ----------------------------------------------
    ewaste: {
      id: 'ewaste', code: 'WEEE', short: 'E-waste', label: 'Electronic waste',
      family: 'Drop-off', acceptance: 'varies',
      note: 'Holds recoverable gold, copper and lithium, plus heavy metals that must not reach landfill.',
    },
    battery: {
      id: 'battery', code: 'BATT', short: 'Batteries', label: 'Battery collection',
      family: 'Drop-off', acceptance: 'widely',
      note: 'Cells start fires in collection trucks and sorting halls. Most supermarkets and hardware stores collect them.',
    },
    hazardous: {
      id: 'hazardous', code: 'HHW', short: 'Hazardous', label: 'Household hazardous waste',
      family: 'Drop-off', acceptance: 'varies',
      note: 'Chemicals, pressurised containers and anything that burns or poisons. Councils run collection days for it.',
    },
    textile: {
      id: 'textile', code: 'TEX', short: 'Textiles', label: 'Textile recovery',
      family: 'Drop-off', acceptance: 'widely',
      note: 'Never curbside recyclable, but textile banks take even worn-out fabric for rag and fibre recovery.',
    },
    pharmacy: {
      id: 'pharmacy', code: 'RX', short: 'Pharmacy', label: 'Pharmacy take-back',
      family: 'Drop-off', acceptance: 'widely',
      note: 'Most pharmacies take back unused medicine, no questions asked.',
    },
    filmDropoff: {
      id: 'filmDropoff', code: '#4', short: 'Store film bin', label: 'Store film drop-off',
      family: 'Drop-off', acceptance: 'widely',
      note: 'The bin at the supermarket entrance. Takes clean, dry bags, wraps and bread bags.',
    },
    scrap: {
      id: 'scrap', code: 'SCRAP', short: 'Scrap metal', label: 'Scrap metal yard',
      family: 'Drop-off', acceptance: 'widely',
      note: 'Anything mostly metal and too big or too mixed for the curbside bin. Scrap yards pay for it.',
    },
    ewasteBulb: {
      id: 'ewasteBulb', code: 'LAMP', short: 'Lamp take-back', label: 'Lamp & tube collection',
      family: 'Drop-off', acceptance: 'varies',
      note: 'Fluorescent tubes and CFLs hold mercury vapour, so hardware stores run a separate lamp bin.',
    },
    cookingOil: {
      id: 'cookingOil', code: 'OIL', short: 'Cooking oil', label: 'Cooking oil collection',
      family: 'Drop-off', acceptance: 'varies',
      note: 'Poured down the drain it congeals into fatbergs. Collected, it becomes biodiesel.',
    },
    motorOil: {
      id: 'motorOil', code: 'AUTO', short: 'Auto fluids', label: 'Automotive fluid take-back',
      family: 'Drop-off', acceptance: 'widely',
      note: 'One litre of motor oil contaminates a million litres of water. Every auto shop takes it back.',
    },
    tyre: {
      id: 'tyre', code: 'TYRE', short: 'Tyres', label: 'Tyre take-back',
      family: 'Drop-off', acceptance: 'widely',
      note: 'Banned from landfill almost everywhere. The fitter who sells you the new one takes the old one.',
    },
    sharps: {
      id: 'sharps', code: 'SHARPS', short: 'Sharps', label: 'Sharps disposal',
      family: 'Drop-off', acceptance: 'varies',
      note: 'Needles and blades need a rigid puncture-proof container, never a bin bag.',
    },
    bulky: {
      id: 'bulky', code: 'BULKY', short: 'Bulky waste', label: 'Bulky waste / civic amenity',
      family: 'Drop-off', acceptance: 'widely',
      note: 'Too large for a bin. Councils run collection points or a booked kerbside pickup.',
    },
    wood: {
      id: 'wood', code: 'WOOD', short: 'Wood', label: 'Wood recycling',
      family: 'Drop-off', acceptance: 'varies',
      note: 'Untreated timber is chipped for board and biomass. Painted or treated wood is not accepted.',
    },
    rubble: {
      id: 'rubble', code: 'INERT', short: 'Rubble', label: 'Inert / rubble',
      family: 'Drop-off', acceptance: 'varies',
      note: 'Ceramics, brick and concrete are crushed for aggregate. They must never go in with container glass.',
    },
    organics: {
      id: 'organics', code: 'ORG', short: 'Organics', label: 'Organics / green bin',
      family: 'Organic', acceptance: 'varies',
      note: 'In landfill, organics break down without oxygen and release methane. Composted, they become soil.',
    },
  };

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
      text: 'Does your program collect soft plastic film?',
      help: 'Most do not. Film is the single most common cause of sorting breakdowns.',
      options: [
        { value: 'yes', label: 'Yes, film is collected' },
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

    // --- added with the larger catalog --------------------------------------
    batteryType: {
      text: 'What kind of cell is it?',
      help: 'Lithium cells are the fire risk; button cells also carry heavy metals.',
      options: [
        { value: 'alkaline', label: 'Alkaline (AA, AAA, 9V)' },
        { value: 'lithium', label: 'Lithium / rechargeable' },
        { value: 'button', label: 'Button / coin cell' },
      ],
    },
    soiled: {
      text: 'Is it clean and dry?',
      help: 'Wet or food-soiled paper cannot be pulped.',
      options: [
        { value: 'no', label: 'Clean and dry' },
        { value: 'yes', label: 'Wet or soiled' },
      ],
    },
    scrunch: {
      text: 'Does it stay scrunched when you squeeze it?',
      help: 'The scrunch test: film and laminate stay balled up, rigid plastic springs back.',
      options: [
        { value: 'yes', label: 'Stays scrunched (film)' },
        { value: 'no', label: 'Springs back (rigid)' },
      ],
    },
    hasBattery: {
      text: 'Does it have a built-in battery?',
      help: 'A sealed cell makes an otherwise ordinary object a fire risk and e-waste.',
      options: [
        { value: 'yes', label: 'Yes, it charges or lights up' },
        { value: 'no', label: 'No battery' },
      ],
    },
    woodTreated: {
      text: 'Is the wood painted, stained or pressure-treated?',
      help: 'Treated timber cannot be chipped and is handled as hazardous in many areas.',
      options: [
        { value: 'no', label: 'Bare, untreated wood' },
        { value: 'yes', label: 'Painted or treated' },
      ],
    },
    size: {
      text: 'How big is it?',
      help: 'Anything larger than the bin needs a different route, however recyclable the material is.',
      options: [
        { value: 'small', label: 'Fits in a bin' },
        { value: 'large', label: 'Too big for a bin' },
      ],
    },
  };

  return { OUTCOMES, ACCEPTANCE, STREAMS, QUESTIONS };
}));
