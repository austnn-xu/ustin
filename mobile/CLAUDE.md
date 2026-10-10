@AGENTS.md

# ustin — design & engineering rules

The bar is **a learning app you want to open every day**: playful, warm, a little bit emotional, and genuinely
educational, with the polish of a funded startup. Duolingo is the reference for *feel* (short lessons, instant
feedback, a character with feelings), not a template to copy — US Tin has its own look and its own rules.
These rules apply to **every screen and component**. If a rule blocks you, change the rule here first — don't quietly break it.

## Product — read this first

ustin (US Tin) teaches people **where things go** and answers **"What bin does this go in?"** in the moment.
Three jobs, one app:

1. **Learn** — a course of short lessons, drawn as a cartoon **recycling route** through town: each unit is a
   neighbourhood with an overhead road sign, each lesson a wheelie bin by the road, each unit review a sorting centre,
   and Tin drives the recycling truck to your next stop. Generated exercises, XP, streaks, a daily goal, coins, and a
   mascot who reacts to how you do. **No hearts or lives:** mistakes never cost anything — a wrong answer is
   explained and comes back once at the end of the lesson. Learning where things go should never feel like a penalty.
2. **What bin?** — look up a real item (search, or a photo on the web build), answer a follow-up only if it changes the
   answer, and get where **each part** goes, down to the resin code, with the reason why.
3. **Near me** — from a ZIP code or your location, find the nearest place that takes the item: drop-off sites,
   recycling centres, transfer stations, donation shops. Real data from OpenStreetMap, never invented places.
4. **Shop** — coins earned in lessons (1 per right answer, +5 at 5 in a row, +10 at 10 in a row; see
   `src/lib/cosmetics.ts`) buy hats, glasses, neckwear and paint jobs for Tin. Try anything on before buying.

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

**Tin** is a little tin can with a face (`src/components/art/Mascot.tsx`), wearing whatever the user has dressed Tin in
(cosmetics are drawn in `OutfitArt.tsx`, in the mascot's own coordinates). Tin carries the emotion of the app:
happy on the path, cheering on a correct answer and at the end of a lesson, worried on a wrong one or when the streak is
waiting on you, sad when a lesson is abandoned, thinking while a photo is analysed. Use Tin wherever a moment has a feeling —
never more than one Tin on screen (a sheet over a dimmed screen, like a tab's tour, counts as its own screen).

Tin is a cartoon and moves like one: it blinks, every mood change lands with a squash-and-stretch, cheering jumps, a
wrong answer makes it shiver, it can `wave` hello, its mouth flaps while `MascotSays` is `typing`, and where it is the
star of the screen it is `pokeable` (tap it: it hops, grins and waves). Keep `typing` for moments where Tin explains
something (onboarding, empty states), not for every bubble.

## Stack

- Expo SDK 57 + React Native + TypeScript (strict). Expo Router, routes in `src/app/`.
- `react-native-reanimated` + `react-native-gesture-handler` for animation and gestures.
- `react-native-svg` for the mascot and illustrations. `expo-haptics` for feedback (always through `src/lib/haptics.ts`).
- `expo-location` for location, `expo-image-picker` for photos. OpenStreetMap (Overpass) for places, Zippopotam / Nominatim
  for ZIP lookup. TanStack Query for anything fetched, Zustand + AsyncStorage for progress and settings (`src/stores/`).
- Recognition: MobileNet + the TrashNet material head, in the browser through the vendored TensorFlow.js
  (`src/lib/vision.web.ts`). Native builds fall back to search.
- Icons: **Lucide only** (`lucide-react-native`), always rendered through `<Icon />`, which fixes the stroke weight.
- Fonts: Bricolage Grotesque (700/800) for display — titles, buttons, big numbers — and Plus Jakarta Sans (500/600/700)
  for reading. Loaded in the root layout.
- Install packages with `EXPO_OFFLINE=1 npx expo install <pkg>` in this sandbox (api.expo.dev is blocked).

## Layout

```
src/app/              routes only (Expo Router): (tabs)/ learn · what-bin · near me · shop · profile, plus lesson/ and item/
src/theme/            tokens + ThemeProvider + makeStyles — the only place raw values live
src/components/ui/    primitives: Text, Button, ChoiceCard, ProgressBar, Input, Chip, Skeleton, Icon, Screen, PressableScale,
                      the motion primitives Appear, Float and RollingNumber, and Deferred
src/components/art/   the mascot and its outfits, coins, confetti, bins, item artwork, the route's town — the only place SVG
                      coordinates live
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
- **Type:** variants `hero, display, title, heading, body, bodyStrong, callout, caption, label, button`. Display variants
  and buttons use Bricolage Grotesque; everything you read uses Plus Jakarta Sans. Buttons are sentence case; only the
  small `label` variant is uppercase. Only `<Text>` renders text.
- **Color:** white (or deep blue-grey in dark mode) surfaces, and named hues from `t.colors.hue` that each carry a meaning —
  see `src/theme/colors.ts`. Hues are for actions, feedback, bins and rewards, never decoration. No gradients.
  The Learn route is the one scene: sky, tinted ground per unit and town colors from `t.colors.scene`, for artwork only.
- **Chunky and tactile.** Buttons, option cards and path nodes are 3D: a `depth` edge in the hue's `depth` shade that the face
  presses down into. Cards are flat with a 2px border, not shadows. Shadows only for things that float (feedback panel,
  popovers, tab bar).
- **Light and dark mode** are both first-class. Every color comes from `t.colors`; check every screen in both.

## Feel

- **Celebrate.** A correct answer gets the green panel, Tin cheering and a success haptic. Finishing a lesson gets confetti,
  the XP count-up and the streak. Wrong answers are gentle: red panel, the right answer, and *why* — that is the lesson.
- **Teach in every verdict.** Every answer shows the reason from the catalog. A verdict with no why teaches nothing.
- **Streaks, XP and the daily goal are real** (persisted), never decorative numbers.
- Springs (`t.motion.spring.*`) for every state change. Timing-based motion only for loops (idle bob, skeleton pulse) and
  one-shot celebrations (confetti).
- Every tap gives feedback: `PressableScale` or a primitive built on it. Light haptic on primary actions, selection haptic on
  choices, success/error haptics on answers.
- Safe areas on every screen (`<Screen>`). Keyboard avoidance on every screen with an input.
- Fetched data (places) has skeleton loading, a real empty state with something useful to do, and an error state with retry.

## Motion

Family (family.co) is the reference for *how things move*: fluid, physical, and never abrupt. The rules:

- **Nothing appears from nowhere.** Content arrives with `<Appear>` (fade + a short slide or pop, on a spring). Siblings
  arriving together stagger with `index` so the eye reads them in order: question → item → answers; headline → stats.
- **Direction means something.** Moving forward (next onboarding step, next exercise) slides in from the right; going back
  slides in from the left. Sheets rise from the bottom over a fading scrim.
- **Things move from where they were.** The tab highlight slides to the new tab; progress bars spring to their new value and
  swell when they fill; numbers roll digit by digit with `<RollingNumber>` instead of snapping.
- **Feel the answer.** Choosing a tile hops it, a right answer bounces, a wrong one shakes its head (`spring.wobble`), and
  the feedback badge lands after its panel.
- **Alive at rest, sparingly.** `<Float>` for the one thing that is waiting for you (the route's Start tag, a coach tip,
  the idling truck). Never more than one or two floating things on a screen.
- **The rarer the moment, the bigger the delight.** Everyday taps get a press and a haptic; finishing onboarding, a lesson
  or a streak gets the full build-up with confetti.
- Motion respects the system's reduce-motion setting (`useReducedMotion`): entrances and loops are skipped, content just shows.

## Performance (the web build is what most people use)

Smooth beats showy. Measure with Playwright at 4× and 8× CPU throttle before and after any motion change.

- **CSS for anything that plays by itself.** Entrances (`Appear`), loops (`Float`, Tin's bob, the truck, the bin lid, the
  flame, skeletons) and confetti are Reanimated 4 CSS animations built from `src/theme/animations.ts`. On the web they run
  on the compositor; on native, on the UI thread. Never `withRepeat` or a JS-driven loop.
- **Springs only for a direct response to a touch**, one element at a time (press, the tab highlight, a mood change).
- **No per-frame React renders.** Nothing calls `setState` on a fast timer except the smallest possible leaf (the typed text
  in `MascotSays`). Tin's drawing is memoised in parts so a blink redraws only the face; a Tin with `idle={false}` (and not
  talking, waving or pokeable) is a still drawing with no hooks at all — use that for grids.
- **Big renders are transitions.** Each tab renders its content through `Deferred`; lesson Check/Continue and onboarding
  steps use `useTransition` and ignore taps while pending. The other tabs pre-build in idle time after launch.
- **Hidden means skipped.** On the web, navigators keep every screen mounted and stacked; `FocusedScene` gives unfocused
  screens `content-visibility: hidden`, and route units off screen use `content-visibility: auto`.

## The first run

Onboarding (`src/app/onboarding.tsx`) teaches by doing, one idea per screen: meet Tin, answer a real question (where a
takeaway coffee cup goes; the reveal splits it into its three parts using the real verdict), the three things the app
does, a daily goal in minutes, an optional location, then exactly what the first lesson will be and how a lesson works.
The very first lesson then coaches the loop once with `CoachTip` (pick → Check → read why → Continue).

Then the rest of the app teaches itself: the first time each tab opens, `TabTour` raises a sheet where Tin walks through
what the tab is for and how to use it, two or three steps, each with the same icon as the real control
(content in `src/lib/tour.ts`, every claim true to the screen). Skip or Got it marks it seen; Profile → Replay the tour.

## Never do

- Gradients, glassmorphism, glowing shadows.
- Spinners for loading content — use `<Skeleton>` or Tin thinking with a progress bar.
- Invented data: no fake drop-off sites, no made-up stats, no lorem ipsum. Places come from OpenStreetMap or are links out.
- `Alert.alert` / system alerts. Errors are inline or shown by Tin.
- Emoji as icons. Mixing icon sets. Changing icon stroke width per screen.
- More than one primary (green) action on a screen.
- Hearts, lives, energy or any other limit on how much someone can learn. Copying Duolingo's mechanics wholesale.

## Shipping

The owner wants every finished update live: once a change passes its checks, open a PR into the default branch, merge
it, and publish the web build to GitHub Pages (`npm run publish:web`, served at https://austnn-xu.github.io/ustin/).
Don't leave finished work sitting on a feature branch.

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
