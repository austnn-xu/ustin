# US Tin

**What bin does this go in?** Point your camera at something, answer a question or two, get the right answer — down to the resin code — and the reason behind it.

## The problem

People want to dispose of things correctly and mostly can't. Looking up each item individually is too slow to do in the moment, so people guess. The guesses fail in two specific ways:

1. **One object is several materials.** A disposable coffee cup is three materials with three destinations. Most people bin it as one object, and all three parts go to landfill.
2. **"Recyclable" is not one thing.** A #1 PET bottle, a #5 PP tub and a #6 PS foam tray are all "plastic" and all go somewhere different. Telling someone "recycle it" is not an answer — it's how contamination happens.

## The approach

US Tin breaks an object into **components**, and gives each one both a destination and a **stream** — the specific resin code or material class that decides whether it's genuinely accepted.

```
Camera → Classify on device → Confirm the match
       → Follow-up questions → Per-component verdict → Explanation
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

The model is trained on ILSVRC-2012, whose label space only partly overlaps with household waste, so `lib/recognizer.js` is the translation layer between them:

- An ILSVRC class maps to one or more catalog objects with a weight. `pizza` leans towards the pizza box but keeps food scraps on offer.
- Scores are summed across the whole distribution rather than read off the top class. `beer bottle` + `wine bottle` + `goblet` at 12% each is a much stronger glass verdict than any one of them looks.
- Below the recognition floor the app says so and opens the picker. A confident wrong answer is worse for the user than an honest shrug.

The confirm screen shows the match, the score, the raw class the model read, and the runner-up catalog objects, so a wrong guess is one tap from being corrected.

**Four catalog objects are unreachable from the camera** — batteries, polystyrene foam, paint and receipts have no usable ILSVRC class. They're reachable from the picker and search, and `UNREACHABLE_OBJECTS` is asserted by the test suite so the gap stays visible rather than being discovered by a user.

Swapping in a stronger model means changing `MODEL_URL` and the mapping table; nothing downstream of `interpret()` changes.

## Running it

No dependencies, no install, no build step for development.

```bash
node server.js          # http://localhost:3000
PORT=8080 node server.js
npm test                # 34 checks across the rules engine and the mapping
./build.sh              # assemble dist/ for static hosting
```

Node 18+. Tested on Node 22.

First load fetches ~14 MB of model weights, reported as a progress bar on the capture screen, and the browser caches them afterwards. The library itself is vendored, so the only third-party runtime requests are the weights and the webfonts.

The camera needs a secure context, so `localhost` works, but testing from a phone on your LAN over plain `http://` will not — the browser blocks `getUserMedia`. Use a tunnel, or the **Upload a photo** / **Choose from the list** paths, which work everywhere.

## Layout

```
lib/rules.js            Knowledge base + decision engine  ← the actual substance
lib/recognizer.js       ILSVRC classes -> catalog objects
lib/imagenet-labels.js  The 1000 class names (generated)
public/index.html       App shell and icon set
public/assets/app.js    Screen flow and rendering
public/assets/vision.js MobileNet loading and inference
public/vendor/          TensorFlow.js, vendored
server.js               Dev server: static files + two JSON endpoints
test/                   Engine and mapping checks
```

### `lib/rules.js`

The file that matters. Each catalog object lists its components; each component has a base outcome and stream, plus optional `rules` that override either one based on answers. Later matching rules win.

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

Adding an object is a data edit — no engine changes. 20 objects currently, chosen for the ones people actually get wrong.

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
- **Recognition is as good as MobileNet.** It is solid on bottles, cups, cans, cartons, packets, bags, food, electronics and clothing, and weak on everything the ILSVRC label space does not cover. The alternatives list and the picker exist because of this.
- **20 objects.** Anything outside the catalog has no answer — no graceful degradation to a material-level guess yet.
- **No history**, accounts, or persistence. Every scan is standalone.
