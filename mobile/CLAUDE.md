@AGENTS.md

# ustin — design & engineering rules

The bar is **"Duolingo, but for putting things in the right bin"**: playful, warm, a little bit emotional, and
genuinely educational. It should feel like a game you want to open every day, built with the polish of a funded
startup — not like a template.
These rules apply to **every screen and component**. If a rule blocks you, change the rule here first — don't quietly break it.

## Product — read this first

ustin (US Tin) teaches people **where things go** and answers **"What bin does this go in?"** in the moment.
Three jobs, one app:

1. **Learn** — a Duolingo-style course. One unit per catalog shelf, short lessons of generated exercises, XP, streaks,
   hearts, a daily goal, and a mascot who reacts to how you do.
2. **What bin?** — look up a real item (search, or a photo on the web build), answer a follow-up only if it changes the
   answer, and get where **each part** goes, down to the resin code, with the reason why.
3. **Near me** — from a ZIP code or your location, find the nearest place that takes the item: drop-off sites,
   recycling centres, transfer stations, donation shops. Real data from OpenStreetMap, never invented places.

It is **not** a delivery, booking or marketplace app. Never write copy about drivers, orders, pickups, prices or bookings.

The knowledge base lives in `../lib` (`rules.js`, `catalog.js`, `streams.js`, `lessons.js`, `recognizer.js`) and is
shared with the web app and the Node tests. The app imports it through `src/lib/engine.ts`; it never reimplements a
verdict or invents a lesson answer.

Outcomes ("bins") and their hue + Lucide icon — the same everywhere, because consistency is how people learn them:

| Outcome | Hue | Icon |
|---|---|---|
| Curbside recycling | blue | `Recycle` |
| Compost | brown | `Sprout` |
| Trash | slate | `Trash2` |
| Special drop-off | orange | `MapPin` |
| Reuse / donate | purple | `Repeat2` |

Always pair the hue with the icon and the label; color is never the only signal.

## The mascot

**Tin** is a little tin can with a face (`src/components/art/Mascot.tsx`). Tin carries the emotion of the app:
happy on the path, cheering on a correct answer and at the end of a lesson, worried on a wrong one, sad when you run out of
hearts, sleepy when the streak is at risk, thinking while a photo is analysed. Use Tin wherever a moment has a feeling —
never more than one Tin on screen.

## Stack

- Expo SDK 57 + React Native + TypeScript (strict). Expo Router, routes in `src/app/`.
- `react-native-reanimated` + `react-native-gesture-handler` for animation and gestures.
- `react-native-svg` for the mascot and illustrations. `expo-haptics` for feedback (always through `src/lib/haptics.ts`).
- `expo-location` for location, `expo-image-picker` for photos. OpenStreetMap (Overpass) for places, Zippopotam / Nominatim
  for ZIP lookup. TanStack Query for anything fetched, Zustand + AsyncStorage for progress and settings (`src/stores/`).
- Recognition: MobileNet + the TrashNet material head, in the browser through the vendored TensorFlow.js
  (`src/lib/vision.web.ts`). Native builds fall back to search.
- Icons: **Lucide only** (`lucide-react-native`), always rendered through `<Icon />`, which fixes the stroke weight.
- Font: Nunito (600/700/800/900) — rounded and friendly. Loaded in the root layout.
- Install packages with `EXPO_OFFLINE=1 npx expo install <pkg>` in this sandbox (api.expo.dev is blocked).

## Layout

```
src/app/              routes only (Expo Router): (tabs)/ learn · what-bin · near me · profile, plus lesson/ and item/
src/theme/            tokens + ThemeProvider + makeStyles — the only place raw values live
src/components/ui/    primitives: Text, Button, ChoiceCard, ProgressBar, Input, Chip, Skeleton, Icon, Screen, PressableScale
src/components/art/   the mascot, confetti, bins, item artwork — the only place SVG coordinates live
src/components/       product components, composed from primitives
src/lib/              engine bridge, places, vision, haptics, dates
src/stores/           zustand stores (progress, settings)
```

## Design system (`src/theme`)

- **No hardcoded values in components, ever.** No hex colors, no raw numbers for spacing/radius/font size/shadow.
  Use `makeStyles((t) => ...)` or `useTheme()` and read `t.colors`, `t.space`, `t.radius`, `t.type`, `t.shadow`, `t.motion`.
  Exceptions: `0`, `1` / `StyleSheet.hairlineWidth` borders, `flex` values, percentages, and SVG geometry inside
  `src/components/art/` (artwork is drawn in its own viewBox).
- **Spacing is a 4pt grid.** Screen gutter is always `t.layout.gutter`. Content is capped at `t.layout.maxWidth` and centered
  on wide screens.
- **Type:** Nunito, variants `hero, display, title, heading, body, bodyStrong, callout, caption, label, button`. Buttons and
  labels are uppercase and extra-bold. Only `<Text>` renders text.
- **Color:** white (or deep blue-grey in dark mode) surfaces, and named hues from `t.colors.hue` that each carry a meaning —
  see `src/theme/colors.ts`. Hues are for actions, feedback, bins and rewards, never decoration. No gradients.
- **Chunky and tactile.** Buttons, option cards and path nodes are 3D: a `depth` edge in the hue's `depth` shade that the face
  presses down into. Cards are flat with a 2px border, not shadows. Shadows only for things that float (feedback panel,
  popovers, tab bar).
- **Light and dark mode** are both first-class. Every color comes from `t.colors`; check every screen in both.

## Feel

- **Celebrate.** A correct answer gets the green panel, Tin cheering and a success haptic. Finishing a lesson gets confetti,
  the XP count-up and the streak. Wrong answers are gentle: red panel, the right answer, and *why* — that is the lesson.
- **Teach in every verdict.** Every answer shows the reason from the catalog. A verdict with no why teaches nothing.
- **Streaks, hearts, XP and the daily goal are real** (persisted), never decorative numbers.
- Springs (`t.motion.spring.*`) for every state change. Timing-based motion only for loops (idle bob, skeleton pulse) and
  one-shot celebrations (confetti).
- Every tap gives feedback: `PressableScale` or a primitive built on it. Light haptic on primary actions, selection haptic on
  choices, success/error haptics on answers.
- Safe areas on every screen (`<Screen>`). Keyboard avoidance on every screen with an input.
- Fetched data (places) has skeleton loading, a real empty state with something useful to do, and an error state with retry.

## Never do

- Gradients, glassmorphism, glowing shadows.
- Spinners for loading content — use `<Skeleton>` or Tin thinking with a progress bar.
- Invented data: no fake drop-off sites, no made-up stats, no lorem ipsum. Places come from OpenStreetMap or are links out.
- `Alert.alert` / system alerts. Errors are inline or shown by Tin.
- Emoji as icons. Mixing icon sets. Changing icon stroke width per screen.
- More than one primary (green) action on a screen.

## Process (per screen)

1. Build one screen at a time, composed only from primitives + product components.
2. Run it and screenshot it (iOS simulator when on macOS; in the Linux cloud sandbox use Expo web + Playwright at iPhone viewport,
   see `scripts/screenshot.mjs`). Critique against this file before moving on.
3. Definition of done:
   - [ ] Only tokens used (`npm run check:tokens` passes)
   - [ ] Loading, empty and error states handled where data is fetched
   - [ ] Dark mode checked
   - [ ] Every tappable has press feedback; primary action has haptics
   - [ ] `npm run typecheck` passes, and `npm test` in `../` passes
