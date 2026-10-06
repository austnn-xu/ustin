import { Platform, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import type { ColorTokens } from './colors';

/** 4pt grid. Index × 4 = points. */
export const space = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const layout = {
  /** Horizontal screen padding. Same on every screen. */
  gutter: space[4],
  /** Vertical rhythm between sections on a screen. */
  section: space[8],
  /** Readable column on wide (tablet / desktop web) screens. */
  maxWidth: 560,
  /** Minimum hit target. */
  hitTarget: 44,
  hairline: StyleSheet.hairlineWidth,
  /** Border width of chunky cards and option tiles. */
  border: 2,
  /** The 3D edge under chunky buttons and cards. */
  depth: { sm: 2, md: 4, lg: 6 },
  /** Fixed heights for controls so rows of mixed controls line up. */
  control: { sm: 36, md: 48, lg: 54 },
  icon: { sm: 16, md: 22, lg: 28, xl: 40 },
  /** Lesson path nodes and their ring. */
  node: { size: 72, ring: 88 },
  /** The Learn route: row height per stop, the road, the overhead unit sign, and the art that sits on it. */
  route: { row: 132, road: 52, sign: 150, bin: 64, truck: 96, prop: 56 },
  /** Mascot sizes. */
  mascot: { sm: 56, md: 96, lg: 140, xl: 180 },
  /** Item artwork tiles. */
  art: { sm: 40, md: 56, lg: 88 },
  /** Progress bars. */
  bar: { sm: 10, md: 16 },
  /** Status / pending dots. */
  dot: 8,
  /** Lucide stroke width. One value for the whole app — chunky to match the type. */
  iconStroke: 2.25,
  tabBar: 64,
} as const;

export const radius = {
  none: 0,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

/**
 * Two families: Bricolage Grotesque for display (titles, buttons, big numbers) — quirky and full of character — and
 * Plus Jakarta Sans for reading (body, labels, captions) — clean and friendly at small sizes.
 */
export const fontFamily = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  body: 'PlusJakartaSans_500Medium',
  bodySemibold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
} as const;

/** The only font sizes in the app. */
export const fontSize = { xs: 12, sm: 14, md: 16, lg: 19, xl: 24, xxl: 30, hero: 40 } as const;

const variant = (
  size: number,
  lineHeight: number,
  family: string,
  letterSpacing = 0,
  extra: TextStyle = {},
): TextStyle => ({ fontSize: size, lineHeight, fontFamily: family, letterSpacing, ...extra });

export const type = {
  /** Big celebratory numbers ("+15 XP", "7"). */
  hero: variant(fontSize.hero, 46, fontFamily.display, -1),
  display: variant(fontSize.xxl, 36, fontFamily.display, -0.8),
  title: variant(fontSize.xl, 30, fontFamily.displayBold, -0.5),
  heading: variant(fontSize.lg, 25, fontFamily.displayBold, -0.3),
  body: variant(fontSize.md, 24, fontFamily.body),
  bodyStrong: variant(fontSize.md, 24, fontFamily.bodyBold),
  callout: variant(fontSize.sm, 20, fontFamily.bodySemibold),
  caption: variant(fontSize.sm, 20, fontFamily.body),
  label: variant(fontSize.xs, 16, fontFamily.bodyBold, 0.8, { textTransform: 'uppercase' }),
  button: variant(fontSize.md, 22, fontFamily.displayBold, -0.1),
} as const;

export type TypeVariant = keyof typeof type;

export const opacity = {
  disabled: 0.5,
  pressed: 0.85,
  muted: 0.6,
} as const;

/** Spring presets. Every state transition uses one of these. */
export const motion = {
  pressScale: 0.96,
  spring: {
    /** Press-in/out, toggles. */
    snappy: { damping: 22, stiffness: 420, mass: 0.6 },
    /** Most UI transitions (expand, slide, progress). */
    standard: { damping: 20, stiffness: 240, mass: 1 },
    /** Panels and large surfaces. */
    gentle: { damping: 26, stiffness: 180, mass: 1 },
    /** Mascot reactions, celebrations, things that should feel alive. */
    bouncy: { damping: 9, stiffness: 200, mass: 0.8 },
  },
  /** Loop durations (ms) — loops and one-shot celebrations are the only timing-based motion. */
  pulseDuration: 900,
  idleDuration: 1600,
  confettiDuration: 2400,
  /** How long a reward toast stays up. */
  toastHold: 2600,
} as const;

/** Shadows for floating elements only (popovers, feedback panel, tab bar). */
export const makeShadow = (colors: ColorTokens, isDark: boolean) => {
  const s = (y: number, blur: number, op: number, elevation: number): ViewStyle =>
    Platform.select<ViewStyle>({
      web: { boxShadow: `0px ${y}px ${blur}px rgba(0,0,0,${isDark ? op * 2 : op})` } as ViewStyle,
      default: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: y },
        shadowRadius: blur / 2,
        shadowOpacity: isDark ? op * 2 : op,
        elevation,
      },
    });
  return {
    none: {} as ViewStyle,
    sm: s(1, 4, 0.06, 1),
    md: s(4, 16, 0.1, 4),
    lg: s(8, 32, 0.16, 12),
  };
};
