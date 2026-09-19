# Binly

**What bin does this go in?** Point your phone at something, answer a question or two, get the right answer — and the reason behind it.

## The problem

People want to dispose of things correctly and mostly can't. Looking up each item individually is too slow to do in the moment, so people guess. The guesses are worst exactly where it matters most: a single object is usually **several materials that go to different places**, and the whole thing ends up in one bin.

A disposable coffee cup is three materials with three different destinations. Most people bin it as one object, and all three parts go to landfill.

## The approach

Rather than return one verdict per object, Binly breaks an object into **components** and gives each one its own destination, plus the reason. Follow-up questions are asked only when the answer actually changes the outcome — a greasy pizza box goes somewhere different from a clean one, so it's worth one tap to ask.

```
Open App → Camera → Identify Object → Determine Material
         → Follow-Up Questions → Disposal Method → Explanation
```

### Disposal outcomes

| | Outcome | |
|---|---|---|
| ♻️ | Curbside Recycling | Goes in your recycling bin |
| 📍 | Special Drop-Off | Needs a specific collection point |
| 🌱 | Compost | Organics / green bin |
| 🔄 | Reuse / Donate | Still has life in it |
| 🗑️ | Trash | Landfill, no better route |

## Running it

No dependencies, no build step, no install.

```bash
node server.js          # http://localhost:3000
PORT=8080 node server.js
npm test                # rules engine checks
```

Node 18+. Tested on Node 22.

The camera needs a secure context, so `localhost` works, but testing from a phone on your LAN over plain `http://` will not — the browser blocks `getUserMedia`. Use a tunnel, or the **Upload a photo** / **Pick from list** paths, which work everywhere.

## Recognition is stubbed

**This is the one faked piece.** It is deliberately isolated in `lib/identify.js`.

The stub hashes the image bytes and picks a catalog object, so the same photo always returns the same guess — repeatable for demos, and the "wrong guess → correct it" path is easy to show. Confidence is cosmetic.

Everything downstream is real: materials, follow-up logic, per-component verdicts, explanations.

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

The file that matters. Each catalog object lists its components; each component has a base outcome and optional `rules` that override it based on answers. Later matching rules win.

```js
{
  label: 'Box lid (clean part)',
  material: 'Corrugated cardboard',
  outcome: 'recycle',
  why: 'Clean corrugated cardboard is one of the most valuable recyclables.',
  questions: ['grease'],
  rules: [
    { when: { grease: 'yes' }, outcome: 'compost',
      why: 'Grease cannot be separated from paper fibre during pulping…' },
  ],
}
```

Adding an object is a data edit — no engine changes. 20 objects currently, chosen for the ones people actually get wrong.

The headline verdict is the component needing the **most** care, so a summary never understates a hazard: a battery inside a toy makes the whole thing a drop-off.

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/catalog` | Objects for the manual picker |
| `POST /api/identify` | `{ image }` or `{ hint }` → object + required questions |
| `POST /api/resolve` | `{ objectId, answers }` → per-component verdicts |

## Known limits

- **Rules are generic, not local.** Disposal is set by your municipality; a real version needs postcode-level rule sets. Questions like "do you have compost collection?" paper over this for now.
- **20 objects.** Anything outside the catalog has no answer — no graceful degradation to a material-level guess yet.
- **No history**, accounts, or persistence. Every scan is standalone.
