# The US Tin website: research and design notes

The home page (`site/`) is the front door: a company site that says plainly what US Tin is, then hands people the
app (`mobile/`, published under `/app/`). This file records why it looks the way it does, so the next change
starts from the reasoning and not just the result.

## What we studied

Each site was opened in a real browser (Playwright, 1440x900), scrolled top to bottom, and its fonts and colours read
from the computed styles. The WebGL award sites mostly refuse a headless browser ("your browser is not supported", an
"Enter / enter without audio" gate), so for those the notes also lean on public write-ups.

### The Frontier Design page: "Bad Move" (the main reference)

A crowdfunding page for a party card game, and the closest thing to US Tin's world we found.

- **A drawn world as the hero.** A cream sky, pink clouds, two big cartoon trees, a lime meadow, and three sheep
  standing on the grass with coloured shadow ellipses under their feet. The headline ("Say the weird thing out loud")
  sits centred in the sky. We took this almost directly: a sky, a meadow, trees, and Tin standing beside the three bins.
- **One ink for everything.** Every outline and every word is the same dark plum (`#312747`). Ours is Tin's own
  outline colour, `#26323B`, so type and drawing look made by one hand.
- **Flat, loud fills.** Lime `#D6E652`, pink `#EF5D97`, orange `#FF6B3C` on cream `#F3E6D1`. No gradients, no shadows
  except hard offset ones.
- **Chunky, tactile controls.** Pill buttons and cards with a 3px ink border and a solid offset shadow underneath,
  the same "pressable" depth the US Tin app already uses.
- **Data with a character on it.** The funding bar has a sheep riding it at 74%. Ours is the course as a road, with
  Tin's truck parked where *you* are, read from the app's own progress in your browser.
- **A wall of characters.** The backer's wall is a grid of sheep in coloured circles with filter chips. Ours is Tin's
  wardrobe: all 27 shop items, drawn by the app itself, filterable by hats, glasses, neckwear and paint.
- **A faint topographic texture** behind the paper sections. Ours is generated (`tools/make-art.py`) and tiles.
- Type: Whyte Inktrap for display, K Stabil for text. Ours: Bricolage Grotesque (which has its own ink traps) and
  Plus Jakarta Sans, the app's own pair.

### pear.no (Oslo, Awwwards Honorable Mention, August 2026)

- **One idea, held all the way down.** Full-bleed Renaissance-style paintings on a deep cobalt sky, with clouds
  rendered as halftone dots. Every section is a new painting; the scroll plays video between them (GSAP).
- **Quiet, confident type.** A light serif (Flecha) for headlines, a grotesque (GT Standard) for text, tiny mono
  labels in the corners, hairline grid lines with crosshair marks where they meet.
- **Copy that tells the truth.** "We say no more often than yes." "If you're pre-revenue... we're the wrong partner,
  and we'll tell you so in the first call." The FAQ answers what a client actually worries about (what it costs).
- What we took: the cobalt sky, real halftone clouds (a dot screen whose dots grow toward the middle of the cloud),
  and the honesty: the home page publishes that the first version of recognition was right about 1 time in 18.

### The S-tier list

| Site | What it does that we can borrow |
|---|---|
| Igloo Inc (Abeto, Site of the Year 2024) | One object (an igloo of ice blocks) is the whole hero. Your scroll moves the camera around it. Small type sits in the corners like instrument readouts. |
| Lusion (Site of the Year 2023) | Physical objects you can disturb. The copy is one confident sentence, and the craft carries the rest. |
| Active Theory | A world you enter rather than a page you read. A hidden text layer keeps it accessible under the WebGL. |
| Bruno Simon | The vehicle *is* the navigation: you drive to the content. Playful without being childish, because the physics are taken seriously. |
| Unseen Studio | Soft, dreamy art direction and transitions that never cut, always carry you from one scene to the next. |

### What they share (and what we took)

1. **One art direction, used everywhere.** Pear's paintings, Igloo's ice, Bad Move's meadow. Ours: *the cartoon town
   Tin lives in*, drawn in one ink with flat colour, under a cobalt sky with printed (halftone) clouds.
2. **One object as the hero.** Igloo has an igloo; we have a takeaway coffee cup.
3. **Scroll moves something physical.** The cup comes apart into its three parts as you scroll, and each part
   drops into the bin the catalog sends it to. That is the product's central idea in one motion: *one object is
   several materials*.
4. **The vehicle carries information.** Tin's recycling truck sits on a road that is the course, at the stop you
   have reached in the app.
5. **Small details that carry real information.** The route card, the wardrobe prices, the changelog dates and the
   install guide that opens on your own device are all real.
6. **Confident, short copy.** One sentence per idea.
7. **It is still a company.** Nav, a clear product line, install instructions, FAQ, legal pages, a footer with
   contact and colophon.
8. **Honesty as craft.** The site shows measured numbers, including the embarrassing ones (5.5% useful answers
   before the fix).
9. **Motion budget.** One orchestrated sequence (the cup), one ambient loop (the clouds), and Tin, who breathes,
   blinks, waves once and hops when poked. Nothing fades in on scroll.
10. **Accessible underneath.** Real text in the DOM, keyboard focus, reduced motion turns the sequence into a
    still, labelled diagram.

## How to not look generated

Things a template or a generator does by default, and what we do instead:

- Generic: a gradient hero, a three-card feature grid with icons, "Revolutionize your…". **Ours:** a drawn object,
  a route with real stops, and plain claims taken from the codebase.
- Generic: invented testimonials and round numbers. **Ours:** only numbers the code or a cited source backs
  (177 items, 12 units, 53 lessons, the TrashNet benchmark, EPA figures with their source named).
- Generic: stock phone mockups. **Ours:** real screenshots of the app, taken from the web build.
- Generic: an all-caps eyebrow on every section, `A · B · C` meta strings, arrows in every button.
  **Ours:** sentence case everywhere, labels only where they carry information.
- Human details: a changelog taken from the real commit history, a colophon, a print stylesheet, a `humans.txt`,
  a cookie banner that tells the truth (we set no cookies), a branded 404, and Tin, who waves if you poke it.

## Tokens

| Token | Hex | Role |
|---|---|---|
| Sky | `#2D7BC0` | The hero, the legal page headers, the app icon (the recycling bin's blue) |
| Paper | `#FAF7F0` | The page, as in the app, with a faint topographic texture |
| Ink | `#26323B` | Text, outlines and hard shadows (Tin's outline colour) |
| Grass | `#5DBB4A` | The meadow, done states |
| Jade | `#1F965C` | The one primary action: open the app |
| Card fills | `#8BD9A9` `#93C4EE` `#F3C24F` `#F4A48E` | The four app cards and the wardrobe circles, always with ink text |
| Tomato | `#D9533F` | The honest numbers' bad bars |

Type: Bricolage Grotesque 800 for display, Plus Jakarta Sans for reading, both self-hosted (no third-party
requests, so the privacy page stays true).

## Layout

```
┌ nav: Tin  US Tin            How it works  The app  Install  FAQ   [Open the app] ┐
│ HERO: cobalt sky, halftone clouds                                                │
│               Know where everything goes.                                        │
│               [Open the app] [Add to home screen]                                │
│   tree     ~~~ meadow ~~~  [trash] [compost] [recycling]  Tin        tree        │
├ ROUTE CARD (overlaps the meadow): 53 stops, a road, the truck at your stop ──────┤
├ HOW IT WORKS (pinned while you scroll): the coffee cup comes apart ──────────────┤
│  steps 1-2-3 on the left      lid, sleeve, cup fly apart, labelled, drop in bins │
├ THE APP: four big colour cards with real screenshots ────────────────────────────┤
├ TIN'S WARDROBE: 27 items in circles, filter chips ───────────────────────────────┤
├ HONEST NUMBERS (ink band): the off-by-one bug, the benchmark bars ───────────────┤
├ WHY FOOD MATTERS: one sourced figure ────────────────────────────────────────────┤
├ PUT IT ON YOUR PHONE: iPhone · iPad · Android · Computer, picked for you ─────────┤
├ WORKSHOP NOTES: the changelog ───────────────────────────────────────────────────┤
├ FAQ ─────────────────────────────────────────────────────────────────────────────┤
└ footer: big wordmark, links, legal, colophon, cookie settings ───────────────────┘
```

The hero and the wardrobe are centred, like Bad Move's; everything you read at length is left aligned.
