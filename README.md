# US Tin

**What bin does this go in?** Point your camera at something, answer a question or two, get the right answer — down to the resin code — and the reason behind it.

## The problem

People want to dispose of things correctly and mostly can't. Looking up each item individually is too slow to do in the moment, so people guess. The guesses fail in two specific ways:

1. **One object is several materials.** A disposable coffee cup is three materials with three destinations. Most people bin it as one object, and all three parts go to landfill.
2. **"Recyclable" is not one thing.** A #1 PET bottle, a #5 PP tub and a #6 PS foam tray are all "plastic" and all go somewhere different. Telling someone "recycle it" is not an answer — it's how contamination happens.

## The approach

US Tin breaks an object into **components**, and gives each one both a destination and a **stream** — the specific resin code or material class that decides whether it's genuinely accepted.

```
Camera → Classify on device ─┬─ recognised → Confirm the match ─┐
                             ├─ material only → Narrowed picker ─┤
                             └─ nothing → Full picker ───────────┴→ Questions → Verdict
```

Follow-up questions are asked only when the answer actually changes the outcome. A greasy pizza box goes somewhere different from a clean one, so it's worth one tap to ask.

### Disposal outcomes

| Outcome | Meaning |
|---|---|
| Curbside Recycling | Goes in your recycling bin |
| Special Drop-Off | Needs a specific collection point |
| Compost | Organics / green bin |
| Reuse / Donate | Still has life in it |
| Trash | Landfill, no better route |

### Recycling streams

The outcome says *which bin*. The stream says *what it actually is* — and every stream carries an honest acceptance rating, because that's the part people get wrong.

| Code | Stream | Acceptance |
|---|---|---|
| `#1` | PET | Widely accepted |
| `#2` | HDPE | Widely accepted |
| `#3` | PVC / vinyl | Rarely accepted curbside |
| `#4` | LDPE film | Rarely accepted curbside |
| `#5` | Polypropylene | Widely accepted |
| `#6` | Polystyrene | Rarely accepted curbside |
| `#7` | Mixed / other | Rarely accepted curbside |
| `PAP` | Paper & cardboard | Widely accepted |
| `GL` | Container glass | Widely accepted |
| `ALU` / `FE` | Aluminium / steel | Widely accepted |
| `PAP 84` | Beverage carton | Varies by program |

Plus drop-off destinations: `WEEE` e-waste, `BATT` batteries, `HHW` hazardous, `TEX` textiles, `RX` pharmacy take-back, `#4` store film bin, `ORG` organics.

**A trash verdict still names its material.** A foam takeout tray returns Trash *and* a `#6 PS · Rarely accepted curbside` chip — the material is the explanation, not a footnote. The same product in rigid form returns `#5 PP · Widely accepted` and recycles.

## Recognition

Recognition is real and runs **on the device**. MobileNet v2 executes in the browser through TensorFlow.js: the weights travel to the phone, the photo never leaves it. There is no inference server, no API key and no upload.

Two models run on every photo, from a single forward pass:

**1. The object model** is MobileNet's 1000-way ILSVRC-2012 classifier. Its label space only partly overlaps with household waste, so `lib/recognizer.js` translates:

- An ILSVRC class maps to one or more catalog objects with a weight. `pizza` leans towards the pizza box but keeps food scraps on offer.
- Scores are summed across the whole distribution rather than read off the top class. `beer bottle` + `wine bottle` + `goblet` at 12% each is a much stronger glass verdict than any one of them looks.
- Below the recognition floor the app says so rather than guessing.

**2. The material head** is a linear classifier over MobileNet's 1280-dimensional embedding, trained here on [TrashNet](https://github.com/garythung/trashnet) — 2,527 photographs of real household waste labelled cardboard / glass / metal / paper / plastic / trash. It ships as a 63 KB JSON file and runs in plain JavaScript, so it never touches the WebGL path.

The two are **fused**: material agreement lifts a candidate, but never vetoes one (see below for why). `water bottle` is genuinely ambiguous between a plastic bottle and a metal flask, and the object model splits it — the material head breaks the tie.

And when the object model has nothing confident, the material head usually still does, so instead of a dead end the picker opens pre-filtered and ranked: *"Not certain what it is, but the material reads as glass. These are the closest matches — the likeliest first."* The ordering comes from the object model's own scores, because failing to clear the naming threshold is not the same as having no opinion. That turns a failed guess into two taps.

The confirm screen shows the match, the score, the raw class the model read, and the runner-up catalog objects, so a wrong guess is one tap from being corrected.

### The bug this all started with

The first version of this was, in the user's words, *insanely inaccurate*. The cause was one line: this MobileNet graph emits **1001** logits — a leading "background" class, then the 1000 real ones — and the code read index *i* as class *i*. Every lookup landed one class off, which turns a classifier into a random number generator. It was invisible in casual testing because the neighbouring class is often plausible: a photo of an espresso cup returned "cup" instead of "espresso", and both point at a coffee cup.

`interpret()` now refuses a vector that is not exactly 1000 long, and a test pins that. Silent nonsense is worse than a crash.

### Measured

The numbers come from evaluating against 506 held-out [TrashNet](https://github.com/garythung/trashnet) photographs, scoring whether the material family of the object the app would show matches what the photograph actually is. The material head evaluated is trained only on the other 80%.

| | Names an item | Of those, correct | Confidently wrong | Useful answer |
|---|---|---|---|---|
| As first shipped (off-by-one bug) | 37.2% | 14.9% | 31.6% | **5.5%** |
| Off-by-one fixed | 54.9% | 24.1% | 41.7% | **13.2%** |
| + material head, retuned | 14.0% | 69.0% | 4.3% | **77.1%** |

"Useful answer" counts a correct named item *or* a correct material narrowing. The material head scores 79.8% on the same held-out split.

Two things worth reading off that table. The bug was real and severe — but **fixing it was not sufficient**. The object model on its own, pointed at photographs of actual waste, gets its own answers right about a quarter of the time. It was never going to carry this product. What made the app usable was adding a second model trained on the right data, and then *answering far less often*: naming an item dropped from 55% of photos to 14%, and that is the point. A confident wrong answer is what made the first version feel broken.

### What the benchmark cannot see

TrashNet photographs are single objects on a white posterboard, so they are kinder than a real kitchen counter. Treat these as an upper bound.

More importantly, **every TrashNet image is one of the six materials the head knows**, and most of what people actually photograph is not. The head has no "none of the above" to reach for, so off its distribution it is confidently wrong: a cat reads 58% plastic, a rocket 82% cardboard, a ceramic espresso cup 91% metal.

That is why the head is allowed to *lift* a candidate but never to *veto* one. On the benchmark a veto scores better — 77.5% against 77.1% useful, and named answers 70.8% correct against 69.0%. It is not worth it: the benchmark is blind to exactly the case where a veto does damage, and the failure it causes is deleting a correct answer. The test suite pins the no-veto behaviour with that reasoning attached, so it does not get "optimised" back in.

**About half the catalog is reachable from the camera.** The rest — anything with no ILSVRC counterpart — is reachable by search, by the picker and by material narrowing. A test asserts a floor on camera coverage so a careless edit cannot quietly gut the mapping.

## Running it

No dependencies, no install, no build step for development.

```bash
node server.js          # http://localhost:3000
PORT=8080 node server.js
npm test                # 40 checks across the engine, the catalog and the recogniser
./build.sh              # assemble dist/ for static hosting
```

Node 18+. Tested on Node 22.

First load fetches ~14 MB of model weights, reported as a progress bar on the capture screen, and the browser caches them afterwards. The library itself is vendored, so the only third-party runtime requests are the weights and the webfonts.

The camera needs a secure context, so `localhost` works, but testing from a phone on your LAN over plain `http://` will not — the browser blocks `getUserMedia`. Use a tunnel, or the **Upload a photo** / **Choose from the list** paths, which work everywhere.

## Layout

```
lib/catalog.js             177 objects, built from component factories  ← the substance
lib/streams.js             Outcomes, material streams, follow-up questions
lib/rules.js               The decision engine
lib/recognizer.js          ILSVRC classes + material head -> catalog objects
lib/imagenet-labels.js     The 1000 class names (generated)
public/index.html          App shell and icon set
public/assets/app.js       Screen flow and rendering
public/assets/vision.js    MobileNet loading and inference
public/assets/material-head.json  The trained material classifier
public/vendor/             TensorFlow.js, vendored
server.js                  Dev server: static files + two JSON endpoints
test/                      Engine, catalog and recognizer checks
```

### `lib/catalog.js`

The file that matters. Each object lists its components; each component has a base outcome and stream, plus optional `rules` that override either one based on answers. Later matching rules win.

The same physical part turns up on dozens of objects — a PET bottle body, a paperboard sleeve, a lithium cell — so components are built by factories rather than copied:

```js
{
  id: 'shampoo-bottle', label: 'Shampoo bottle',
  match: ['shampoo bottle', 'conditioner bottle', 'body wash'],
  components: [part.hdpe('Bottle', 'Bathroom bottles are ordinary #2 HDPE…'), cap.plastic()],
  tip: 'Bathroom plastics are the most commonly missed recyclables in the house.',
}
```

Every factory takes an explanation, because the reason is the product: a verdict with a generic sentence under it teaches nothing. Where an object needs real nuance, it is written out longhand instead:

```js
{
  label: 'Container',
  material: 'Polypropylene',
  outcome: 'recycle',
  stream: 'pp',
  why: 'Rigid #5 tubs are widely accepted once clean.',
  questions: ['tubRigid', 'rinsed'],
  rules: [
    { when: { tubRigid: 'foam' }, outcome: 'trash', stream: 'ps',
      why: 'Foam and flimsy black trays are #6 polystyrene…' },
  ],
}
```

Adding an object is a data edit — no engine changes. 177 objects currently, spanning kitchen packaging, organics, paper, bathroom, electronics, hazardous household chemicals, textiles and durables.

The headline verdict is the component needing the **most** care, so a summary never understates a hazard: a battery inside a toy makes the whole thing a drop-off.

Test guards enforce the invariants that matter: anything routed to recycling or drop-off **must** name a stream, rules can only key off questions their component actually asks, every defined stream has to be reachable from some object, and every mapped ILSVRC class has to be one the model can actually emit.

## API

The browser does not call these — the engine and the classifier both run client-side, which is why the app deploys as static files. `server.js` exposes them for local experimentation.

| Endpoint | Purpose |
|---|---|
| `GET /api/catalog` | Objects for the manual picker |
| `POST /api/resolve` | `{ objectId, answers }` → per-component verdicts + streams |

## Known limits

- **Rules are generic, not local.** Disposal is set by your municipality, and the acceptance ratings are national averages. A real version needs postcode-level rule sets; questions like "does your program take film?" paper over this for now.
- **Recognition is as good as MobileNet.** It is solid on bottles, cups, cans, cartons, packets, bags, food, electronics and clothing, and weak on everything the ILSVRC label space does not cover. The alternatives list, the material narrowing and the picker all exist because of this.
- **The material head learned from posed photographs.** TrashNet is single objects on white posterboard. Cluttered, badly-lit real photos are harder than anything it was trained on.
- **177 objects.** Anything outside the catalog still has no answer, though material narrowing now gets a user close.
- **No history**, accounts, or persistence. Every scan is standalone.
