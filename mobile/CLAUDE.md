@AGENTS.md

# ustin — design & engineering rules

The bar is "looks like a funded startup shipped it" (Airbnb / Uber / DoorDash), not "looks AI generated".
These rules apply to **every screen and component**. If a rule blocks you, change the rule here first — don't quietly break it.

## Product — read this first

ustin (US Tin) answers one question: **"What bin does this go in?"** Point the camera at something, answer a question
or two only if it changes the answer, and get where **each part** goes, down to the resin code, with the reason why.
It is **not** a delivery, booking, or marketplace app. We borrow the *UX quality* of Uber / DoorDash / Airbnb
(camera + bottom sheet, sheets for choices, rich detail pages, skeletons, springs), not their business model.
Never write sample copy about drivers, orders, pickups, prices, or bookings.

Core flow (same as the web app in `../`): Camera → Identify object → Follow-up questions → Per-component verdict + stream → Explanation.
The knowledge base and decision engine live in `../lib/rules.js`; the app reuses it rather than reimplementing it.

Outcomes: Curbside recycling · Special drop-off · Compost · Reuse/donate · Trash. Each has a Lucide icon
(`Recycle`, `MapPin`, `Sprout`, `Repeat2`, `Trash`). Outcomes are told apart by **icon + label, not color**: accent marks
"Widely accepted", `danger` only marks genuinely hazardous items (batteries, HHW). No emoji (the web app's emoji stay on the web).

Screens:
1. **Scan (home)** — full-screen camera, shutter, Uber-style draggable sheet with recent scans + "Pick from list".
2. **Identify** — sheet over the frozen photo: "Looks like a disposable coffee cup", confirm or correct.
3. **Questions** — one follow-up per sheet, option rows, skippable.
4. **Result** — Airbnb-detail-style page: photo, headline verdict, one row per component (outcome, stream badge,
   acceptance, why), tip, sticky bottom CTA ("Scan another" / "Find a drop-off" when needed).
5. **Drop-off finder** — map + draggable sheet of nearby sites, only reached from drop-off verdicts.
6. **History + settings** — past scans, location/local program, appearance.

## Stack

- Expo SDK 57 + React Native + TypeScript (strict). Expo Router, routes in `src/app/`.
- `react-native-reanimated` + `react-native-gesture-handler` for all animation and gestures.
- `@gorhom/bottom-sheet` for sheets, `@shopify/flash-list` for lists, `expo-image` for images.
- `react-native-maps` for maps, `expo-haptics` for feedback (always through `src/lib/haptics.ts`).
- Supabase (auth, db, realtime). Zustand for client state (`src/stores/`), TanStack Query for server state.
- Icons: **Lucide only** (`lucide-react-native`), always rendered through `<Icon />`, which fixes the stroke weight.
- Font: Inter (400/500/600/700), loaded in the root layout.
- Install packages with `EXPO_OFFLINE=1 npx expo install <pkg>` in this sandbox (api.expo.dev is blocked).

## Layout

```
src/app/              routes only (Expo Router)
src/theme/            tokens + ThemeProvider + makeStyles — the only place raw values live
src/components/ui/    primitives: Text, Button, Input, Card, ListRow, Avatar, Badge, Sheet, Skeleton (+ Icon, Divider, Screen, PressableScale)
src/components/       product components, composed from primitives
src/lib/              haptics, supabase client, utils
src/stores/           zustand stores
```

## Design system (`src/theme`)

- **No hardcoded values in components, ever.** No hex colors, no raw numbers for spacing/radius/font size/shadow.
  Use `makeStyles((t) => ...)` or `useTheme()` and read `t.colors`, `t.space`, `t.radius`, `t.type`, `t.shadow`, `t.motion`.
  Exceptions: `0`, `1` / `StyleSheet.hairlineWidth` borders, `flex` values, percentages, and opacity values defined in `t.opacity`.
- **Spacing is a 4pt grid.** `t.space[1]=4 … t.space[16]=64`. Screen gutter is always `t.layout.gutter` — never pick a per-screen padding.
- **Type scale has 6 sizes** (28 / 22 / 17 / 15 / 13 / 11) exposed as variants: `display, title, heading, body, bodyStrong, callout, caption, label`.
  Hierarchy comes from weight and color (`text`, `textSecondary`, `textTertiary`), not from adding sizes. Only `<Text>` renders text.
- **Color:** neutral palette (near-black, grays, off-white) + **one accent** (`accent`, green). Accent is for the primary action on a screen,
  selected states, and the occasional key number. Never decorative, never for backgrounds of large areas.
  `danger` exists only for errors and destructive actions. No other hues.
- **Light and dark mode** are both first-class. Every color comes from `t.colors`; check every screen in both.
- **Elevation is rare.** Cards are flat (border or subtle fill). Shadows (`t.shadow`) are only for things that float above content:
  sheets, the sticky CTA bar, map overlays. In dark mode, elevation = lighter surface + border, not shadow.

## Never do (screams "vibecoded")

- Purple/blue gradients, glowing shadows, glassmorphism.
- Everything in a rounded card with a shadow. Prefer lists, dividers and whitespace.
- Centered text blocks and giant hero headers on app screens. App screens are left-aligned with a normal title.
- Spinners for loading content. Use `<Skeleton>` shaped like the real content.
- "Lorem ipsum", "John Doe", placeholder.com, or obviously fake data.
- Inconsistent padding between screens (use `<Screen>` and `t.layout.gutter`).
- `Alert.alert` / system alerts for errors. Errors are inline (field errors, error states with retry) or a toast.
- Pressables with no feedback. Everything tappable uses `PressableScale` (or a primitive built on it).
- Emoji as icons. Mixing icon sets. Changing icon stroke width per screen.

## Motion & feel

- All state/gesture-driven animation uses springs (`withSpring` with `t.motion.spring.*`). No linear `withTiming` for transitions.
  The only timing-based animations allowed are continuous loops (skeleton pulse, progress indicators).
- Every tap gives feedback: press scale `t.motion.pressScale` (0.97). Light haptic on primary actions (`haptics.light()`),
  selection haptic on toggles/segments, success/error notification haptics on completed/failed actions.
- Bottom sheets have snap points and drag-to-dismiss (Uber ride sheet). Use `<Sheet>`.
- Optimistic UI for saving a scan, deleting from history, correcting an identification: update the TanStack Query cache
  in `onMutate`, roll back in `onError`, show a toast.
- History item / photo → Result uses a shared/smooth transition, never a hard cut.
- Lists: FlashList, images sized to their container via expo-image with `recyclingKey`. Hold 60fps.
- Safe areas respected on every screen (`<Screen>`). Keyboard avoidance on every screen with an input.
- Every data screen has: pull-to-refresh, a real empty state (with a helpful action), a real error state with retry, skeleton loading.

## Data

- Seed data must be realistic and come from the real catalog in `../lib/rules.js` (objects, materials, streams, why-text),
  with real Unsplash photos of those objects. Real-sounding names for accounts, real places for drop-off sites.
- Never ship placeholder copy. Write the actual microcopy.

## Process (per screen)

1. Build one screen at a time, composed only from primitives + product components.
2. Run it and screenshot it (iOS simulator when on macOS; in the Linux cloud sandbox use Expo web + Playwright at iPhone viewport,
   see `scripts/screenshot.mjs`). Critique against this file before moving on.
3. Definition of done checklist:
   - [ ] Spacing consistent, gutter = `t.layout.gutter`, all values on the 4pt grid
   - [ ] Only tokens used (`npm run check:tokens` passes)
   - [ ] Loading (skeleton), empty, and error (with retry) states handled
   - [ ] Dark mode checked
   - [ ] Every tappable has press feedback; primary action has haptics
   - [ ] Safe areas + keyboard avoidance
   - [ ] `npm run typecheck` passes
