'use strict';

/**
 * US Tin — topic units.
 *
 * Most of the course is generated from the catalog: "where does this go?" has
 * one right answer per item, and the engine knows it. Some things worth
 * learning are not about one item, though. They are about *why* the bins are
 * what they are. A topic unit teaches one of those ideas with short,
 * hand-written cards.
 *
 * Hand-written means every card is held to the same bar as a verdict: it has
 * to agree with what the catalog tells people to do, and every number in it
 * names where it came from. No invented statistics.
 *
 * A card is either:
 *   { id, kind: 'tf', true: '...', false: '...', explain, source? }
 *       A true/false question; the lesson asks one of the two statements.
 *   { id, kind: 'choice', prompt, choices: [right, wrong, wrong], explain, source? }
 *       A multiple-choice question; the first choice is the right one.
 *
 * A topic can also carry optional `extras`: a hands-on guide, one illustrated
 * step per screen, with a short check at the end. Extras sit off the route:
 * skipping one never locks anything.
 */

(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') root.USTinTopics = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const SOURCES = {
    epaFoodMethane: 'EPA, Quantifying Methane Emissions from Landfilled Food Waste (2023)',
    epaLmop: 'EPA Landfill Methane Outreach Program',
    ipcc: 'IPCC Sixth Assessment Report (2021)',
    usda: 'USDA, Food Waste FAQs',
    usdaDates: 'USDA Food Safety and Inspection Service, Food Product Dating',
    epaScale: "EPA's Wasted Food Scale (2023)",
    epaHome: 'EPA, Composting at Home',
  };

  const TOPICS = [
    {
      id: 'methane',
      after: 'organics',
      title: 'Food & methane',
      blurb: 'Why food in the trash heats the planet',
      // The guidebook: what the unit says, readable before (or instead of) a lesson.
      guide: [
        {
          title: 'Food in the trash makes methane',
          text: 'Buried in a landfill, food is cut off from air. The microbes that break it down without oxygen give off methane, a gas that traps about 80 times more heat than CO₂ over 20 years.',
          source: SOURCES.epaFoodMethane,
        },
        {
          title: 'Compost done right barely does',
          text: 'Composting is rotting with air. Those microbes breathe out mostly CO₂, water and heat. A pile only makes methane when it goes soggy and airless, which is why you turn it and mix in dry browns.',
          source: SOURCES.epaHome,
        },
        {
          title: 'Not wasting it beats both',
          text: 'Composting beats the trash, but eating the food, or giving it away, beats composting. Everything it took to grow, ship and chill it is lost the moment it is thrown out.',
          source: SOURCES.epaScale,
        },
      ],
      extras: [
        {
          id: 'diy-compost-bin',
          title: 'Build your own compost bin',
          blurb: 'A storage tote, a drill and an afternoon',
          // Each step names the drawing that goes with it (src/components/art/DiyArt.tsx).
          steps: [
            {
              art: 'tote',
              title: 'Find a tote with a lid',
              text: 'Any plastic storage tote with a tight lid works, about 18 gallons or bigger. A used one is perfect. Dark plastic soaks up the sun and keeps the inside warm, which speeds things up.',
              tip: 'Small kitchen? A lidded bucket from a bakery or deli works the same way, just smaller.',
            },
            {
              art: 'holes',
              title: 'Drill air holes all over',
              text: 'Drill holes about the width of a pencil every few inches: in the lid, around all four sides and across the bottom. Air is the whole trick. It keeps the bin from going airless, which is when it starts to make methane.',
              tip: 'The holes in the bottom also let extra water drain out.',
            },
            {
              art: 'raise',
              title: 'Raise it up in the shade',
              text: 'Stand the tote on two bricks with a tray underneath to catch drips. Pick a spot in part shade, so it stays warm without baking dry.',
            },
            {
              art: 'browns',
              title: 'Start with a layer of browns',
              text: "Put a few inches of 'browns' in the bottom: shredded cardboard, newspaper or dry leaves. They soak up moisture and hold air pockets open.",
            },
            {
              art: 'greens',
              title: 'Add your greens',
              text: "Fruit and vegetable scraps, coffee grounds, tea leaves and crushed eggshells are your 'greens'. Chop big pieces small so they break down faster.",
              tip: 'Leave out meat, fish, dairy and oily food. A home bin does not get hot enough for them, and they draw pests.',
            },
            {
              art: 'layers',
              title: 'Always cover with browns',
              text: 'Every time you add scraps, cover them with a layer of browns. That one habit stops smells and fruit flies, and keeps the mix from going soggy.',
            },
            {
              art: 'roll',
              title: 'Keep it damp, mix it weekly',
              text: 'Keep it as damp as a wrung-out sponge: add a splash of water if it is dry, more browns if it is wet. About once a week, close the lid and roll the tote on its side, or stir it with a garden fork, to let air in.',
            },
            {
              art: 'harvest',
              title: 'Harvest your compost',
              text: 'After a few months the bottom turns dark and crumbly and smells like a forest floor. That is finished compost. Scoop it out for your plants and keep the rest going.',
              tip: 'Big yard? Four wooden pallets tied into a square make a roomy bin for leaves and garden waste.',
            },
          ],
          fixes: [
            { problem: 'Smells like rotten eggs', fix: 'Too wet, not enough air. Mix in dry browns and roll it.' },
            { problem: 'Fruit flies', fix: 'Bury fresh scraps under a layer of browns.' },
            { problem: 'Nothing is happening', fix: 'Too dry. Add water and a few more greens.' },
          ],
          source: SOURCES.epaHome,
          check: [
            {
              id: 'diy-why-holes',
              kind: 'choice',
              prompt: 'Why drill holes all over the bin?',
              choices: ['To let air in, so it never goes airless', 'To let rain in', 'To make it lighter to carry'],
              explain: 'Air keeps the microbes that make methane away. A sealed tub of scraps would rot just like a landfill.',
            },
            {
              id: 'diy-first-layer',
              kind: 'choice',
              prompt: 'What goes in the bottom of a new bin?',
              choices: ['A layer of browns, like shredded cardboard', 'A layer of food scraps', 'A plastic bag liner'],
              explain: 'Browns soak up the moisture that drips down from the scraps and keep air pockets open at the bottom.',
            },
            {
              id: 'diy-cover',
              kind: 'tf',
              true: 'Every time you add scraps, you should cover them with browns.',
              false: 'Food scraps should be left uncovered on top so they get more air.',
              explain: 'A layer of browns over fresh scraps stops smells and fruit flies, and soaks up extra water.',
            },
            {
              id: 'diy-leave-out',
              kind: 'choice',
              prompt: 'Which one stays out of a home compost bin?',
              choices: ['Leftover chicken', 'Carrot peels', 'Coffee grounds'],
              explain: 'Meat, fish, dairy and oily food draw pests, and a home bin does not get hot enough to break them down safely. Peels and grounds are perfect.',
            },
            {
              id: 'diy-flies',
              kind: 'choice',
              prompt: 'Fruit flies are buzzing around your bin. What helps?',
              choices: ['Bury scraps under browns', 'Add more fruit on top', 'Tape over the air holes'],
              explain: 'Flies find uncovered fruit. A layer of browns hides it. Taping the holes would cut off the air the bin needs.',
            },
            {
              id: 'diy-finished',
              kind: 'tf',
              true: 'Finished compost is dark, crumbly and smells earthy.',
              false: 'Finished compost should smell sour and look slimy.',
              explain: 'Sour and slimy means it went airless. Ready compost looks and smells like rich soil.',
            },
          ],
        },
      ],
      lessons: [
        {
          title: 'Why the trash makes methane',
          summary: 'Landfills, methane, and why food is the problem',
          cards: [
            {
              id: 'landfill-top-material',
              kind: 'tf',
              true: 'Food is the most common material in US landfills.',
              false: 'Plastic is the most common material in US landfills.',
              explain: 'Food is about 24% of what US towns send to landfill: more than plastic, paper or anything else.',
              source: SOURCES.epaFoodMethane,
            },
            {
              id: 'why-landfill-methane',
              kind: 'choice',
              prompt: 'Why does food in a landfill make methane?',
              choices: ['It is buried with no oxygen', 'Landfills are too hot', 'Plastic bags react with it'],
              explain: 'Under tons of trash, food is cut off from air. The microbes that can break it down without oxygen give off methane as they go.',
            },
            {
              id: 'landfill-rank',
              kind: 'tf',
              true: 'Landfills are one of the biggest human-made sources of methane in the US.',
              false: 'Landfills give off almost no methane.',
              explain: 'City landfills are the third-largest human-made source of methane in the US, after farm animals and the oil and gas industry.',
              source: SOURCES.epaLmop,
            },
            {
              id: 'methane-strength',
              kind: 'tf',
              true: 'Methane warms the planet much faster than carbon dioxide does.',
              false: 'Methane is a weaker greenhouse gas than carbon dioxide.',
              explain: 'Ton for ton, methane traps about 80 times more heat than CO₂ over 20 years. It fades sooner, so cutting it slows warming quickly.',
              source: SOURCES.ipcc,
            },
            {
              id: 'food-share-of-methane',
              kind: 'choice',
              prompt: 'Of the methane that escapes US city landfills, how much comes from food?',
              choices: ['More than half', 'About a tenth', 'Almost none'],
              explain: 'The EPA estimates about 58% of the methane that escapes city landfills comes from food: more than any other material.',
              source: SOURCES.epaFoodMethane,
            },
            {
              id: 'gas-capture',
              kind: 'tf',
              true: 'Food rots so fast that much of its methane escapes before landfill gas pipes are in place.',
              false: 'Landfill gas pipes catch almost all of the methane from food.',
              explain: 'Many landfills pipe off gas, but the pipes go in after an area is filled. Food breaks down quickly, so a lot of its methane leaks out first.',
              source: SOURCES.epaFoodMethane,
            },
            {
              id: 'peel-in-trash',
              kind: 'choice',
              prompt: 'A banana peel goes in the trash. What happens to it?',
              choices: ['It rots without air and gives off methane', 'It turns into soil in a few weeks', 'It stays exactly as it is'],
              explain: 'In a landfill the peel does rot, just without oxygen, and that kind of rotting makes methane. In a compost bin the same peel would become soil.',
            },
            {
              id: 'food-wasted-share',
              kind: 'tf',
              true: 'About a third of the food supply in the US is never eaten.',
              false: 'Almost all the food in the US ends up being eaten.',
              explain: 'The USDA estimates 30 to 40% of the US food supply is wasted, at farms, in shops and at home.',
              source: SOURCES.usda,
            },
          ],
        },
        {
          title: 'Compost done right',
          summary: 'Why compost barely makes methane, and how to keep it that way',
          cards: [
            {
              id: 'compost-has-air',
              kind: 'choice',
              prompt: 'Why does a healthy compost pile make so little methane?',
              choices: ['Its microbes get oxygen', 'Compost is too cold to make gas', 'The methane soaks into the soil'],
              explain: 'Composting is rotting with air. Microbes that breathe oxygen give off mostly CO₂, water and heat, not methane.',
            },
            {
              id: 'compost-myth',
              kind: 'tf',
              true: 'Composting food releases far less greenhouse gas than sending it to landfill.',
              false: 'Composting food releases more methane than throwing it in the trash.',
              explain: 'That last one is a common myth. A landfill is airless by design; a compost pile is kept airy on purpose. That is why the EPA ranks composting above landfill.',
              source: SOURCES.epaScale,
            },
            {
              id: 'soggy-pile',
              kind: 'tf',
              true: 'A compost pile that is soggy and packed down can make methane.',
              false: 'A compost pile can never make methane, however it is kept.',
              explain: 'This is the true part of the myth: if a pile gets too wet and dense, air cannot reach the middle, and those pockets rot like a landfill. Keeping it airy fixes it.',
            },
            {
              id: 'rotten-egg-smell',
              kind: 'choice',
              prompt: 'Your compost smells like rotten eggs. What is wrong?',
              choices: ['Too wet, not enough air', 'Nothing, it is working well', 'It needs more food scraps'],
              explain: 'A healthy pile smells earthy. A rotten-egg smell means parts of it have run out of air. Turn it and mix in something dry.',
            },
            {
              id: 'how-damp',
              kind: 'choice',
              prompt: 'How damp should a compost pile be?',
              choices: ['Like a wrung-out sponge', 'Bone dry', 'Soaking wet'],
              explain: 'Damp enough for microbes to live, dry enough for air to get in. Too dry and nothing happens; too wet and it goes airless.',
              source: SOURCES.epaHome,
            },
            {
              id: 'add-browns',
              kind: 'choice',
              prompt: 'Your pile is soggy and smelly. What should you add?',
              choices: ['Dry leaves or shredded cardboard', 'More fruit peels', 'A plastic cover to seal it'],
              explain: "Dry 'browns' soak up water and open up air pockets. Wet peels make it worse, and sealing it cuts off the air it needs.",
              source: SOURCES.epaHome,
            },
            {
              id: 'turning',
              kind: 'tf',
              true: 'Turning a compost pile helps keep methane down.',
              false: 'Turning a compost pile makes it give off more methane.',
              explain: 'Turning lets fresh air into the middle, so the microbes that make methane never get going.',
              source: SOURCES.epaHome,
            },
            {
              id: 'which-brown',
              kind: 'choice',
              prompt: "Which of these is a 'brown' for compost?",
              choices: ['Dry leaves', 'Grass clippings', 'Coffee grounds'],
              explain: "Browns are dry and woody: leaves, twigs, paper, cardboard. Grass clippings and coffee grounds are wet, nitrogen-rich 'greens'. A pile needs both.",
              source: SOURCES.epaHome,
            },
          ],
        },
        {
          title: 'Better than compost',
          summary: 'Waste less, give it away, and what to do with the rest',
          cards: [
            {
              id: 'best-option',
              kind: 'choice',
              prompt: 'What is the best thing to do about food waste?',
              choices: ['Not waste it in the first place', 'Compost it', 'Bag it tightly in the trash'],
              explain: "Top of the EPA's Wasted Food Scale is preventing waste. Composting is good, but it only saves the nutrients, not everything it took to grow the food.",
              source: SOURCES.epaScale,
            },
            {
              id: 'compost-not-a-pass',
              kind: 'tf',
              true: 'Composting beats landfill, but eating the food beats composting.',
              false: 'If you compost, it does not matter how much food you waste.',
              explain: 'Growing, shipping and chilling food all cost energy and water. Composting saves the scraps, not that.',
              source: SOURCES.epaScale,
            },
            {
              id: 'donate',
              kind: 'choice',
              prompt: 'Unopened food you will not eat in time. Best move?',
              choices: ['Give it to a food bank', 'Compost it', 'Put it in the trash'],
              explain: 'Feeding people ranks just below not wasting food at all, and well above composting it.',
              source: SOURCES.epaScale,
            },
            {
              id: 'digester',
              kind: 'choice',
              prompt: 'Which one makes methane on purpose, and captures it?',
              choices: ['An anaerobic digester', 'A backyard compost bin', 'A recycling plant'],
              explain: 'A digester breaks food down without air in a sealed tank, catches the methane and burns it for energy. Same chemistry as a landfill, but the gas is caught and used.',
              source: SOURCES.epaScale,
            },
            {
              id: 'best-by',
              kind: 'tf',
              true: "For most foods, a 'best by' date is about quality, not safety.",
              false: "Food is unsafe to eat the day after its 'best by' date.",
              explain: "Apart from baby formula, US date labels are about when food is at its best, not when it becomes unsafe. Check it before you toss it.",
              source: SOURCES.usdaDates,
            },
            {
              id: 'freeze',
              kind: 'choice',
              prompt: 'Bread you will not finish before it goes stale. Best move?',
              choices: ['Freeze it', 'Compost it now', 'Put it in the trash'],
              explain: 'Freezing hits pause. Bread toasts straight from frozen, so none of it has to be thrown out at all.',
            },
            {
              id: 'no-pickup',
              kind: 'tf',
              true: 'With no compost pickup or pile, food scraps go in the trash, so wasting less matters even more.',
              false: 'With no compost pickup, food scraps should go in the recycling bin.',
              explain: 'Food never goes in recycling: it soaks into paper and spoils a whole load. If you cannot compost, the trash is the only bin left.',
            },
            {
              id: 'scale-bottom',
              kind: 'choice',
              prompt: "Which ranks lowest on the EPA's Wasted Food Scale?",
              choices: ['Sending it to landfill', 'Composting it', 'Giving it to a food bank'],
              explain: 'Landfill is at the very bottom: the food is lost, and once buried it turns into methane.',
              source: SOURCES.epaScale,
            },
          ],
        },
      ],
    },
  ];

  return { TOPICS, SOURCES };
}));
