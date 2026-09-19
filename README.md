# US Tin

**What bin does this go in?** Point your phone at something, answer a question or two, get the right answer — down to the resin code — and the reason behind it.

## The problem

People want to dispose of things correctly and mostly can't. Looking up each item individually is too slow to do in the moment, so people guess. The guesses fail in two specific ways:

1. **One object is several materials.** A disposable coffee cup is three materials with three destinations. Most people bin it as one object, and all three parts go to landfill.
2. **"Recyclable" is not one thing.** A #1 PET bottle, a #5 PP tub and a #6 PS foam tray are all "plastic" and all go somewhere different. Telling someone "recycle it" is not an answer — it's how contamination happens.

## The approach

US Tin breaks an object into **components**, and gives each one both a destination and a **stream** — the specific resin code or material class that decides whether it's genuinely accepted.

```
Open App → Camera → Identify Object → Determine Material
         → Follow-Up Questions → Disposal Method → Explanation
```

Follow-up questions are asked only when the answer actually changes the outcome. A greasy pizza box goes somewhere different from a clean one, so it's worth one tap to ask.

### Disposal outcomes

| | Outcome | |
|---|---|---|
| ♻️ | Curbside Recycling | Goes in your recycling bin |
| 📍 | Special Drop-Off | Needs a specific collection point |
| 🌱 | Compost | Organics / green bin |
| 🔄 | Reuse / Donate | Still has life in it |
| 🗑️ | Trash | Landfill, no better route |

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

## Running it

No dependencies, no build step, no install.

```bash
node server.js          # http://localhost:3000
PORT=8080 node server.js
npm test                # 25 rules-engine checks
```

Node 18+. Tested on Node 22.

The camera needs a secure context, so `localhost` works, but testing from a phone on your LAN over plain `http://` will not — the browser blocks `getUserMedia`. Use a tunnel, or the **Upload a photo** / **Pick from list** paths, which work everywhere.

## Recognition is stubbed

**This is the one faked piece.** It is deliberately isolated in `lib/identify.js`.

The stub hashes the image bytes and picks a catalog object, so the same photo always returns the same guess — repeatable for demos, and the "wrong guess → correct it" path is easy to show. Confidence is cosmetic.

Everything downstream is real: materials, streams, follow-up logic, per-component verdicts, explanations.

To make it real, replace the body of `identify()` with a vision call returning `{ label, confidence }`. `matchObject()` already maps free text onto the catalog, so nothing else changes:

```js
function identify(imageBuffer, hint) {
  const label = await callVisionModel(imageBuffer);  // <- the only new part
  return { object: matchObject(label), confidence: 0.9, source: 'model' };
}
```

## Layout

```
server.js          HTTP server, three JSON endpoints, static files
lib/rules.js       Knowledge base + decision engine  ← the actual substance
lib/identify.js    Object recognition (STUBBED)
public/            Camera UI, one screen per workflow step
test/rules.test.js Engine checks
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

Test guards enforce the invariants that matter: anything routed to recycling or drop-off **must** name a stream, rules can only key off questions their component actually asks, and every defined stream has to be reachable from some object.

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/catalog` | Objects for the manual picker |
| `POST /api/identify` | `{ image }` or `{ hint }` → object + required questions |
| `POST /api/resolve` | `{ objectId, answers }` → per-component verdicts + streams |

## Known limits

- **Rules are generic, not local.** Disposal is set by your municipality, and the acceptance ratings are national averages. A real version needs postcode-level rule sets; questions like "does your program take film?" paper over this for now.
- **20 objects.** Anything outside the catalog has no answer — no graceful degradation to a material-level guess yet.
- **No history**, accounts, or persistence. Every scan is standalone.
