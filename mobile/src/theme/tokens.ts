import { Platform, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import type { ColorTokens } from './colors';

/** 4pt grid. Index × 4 = points. */
export const space = {
  0: 0,
  0.5: 2,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const layout = {
  /** Horizontal screen padding. Same on every screen. */
  gutter: space[5],
  /** Vertical rhythm between sections on a screen. */
  section: space[8],
  /** Minimum hit target. */
  hitTarget: 44,
  hairline: StyleSheet.hairlineWidth,
  /** Fixed heights for controls so rows of mixed controls line up. */
  control: { sm: 32, md: 44, lg: 52 },
  avatar: { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 },
  icon: { sm: 16, md: 20, lg: 24 },
  /** Status / pending dots. */
  dot: 6,
  /** Lucide stroke width. One value for the whole app. */
  iconStroke: 1.75,
} as const;

export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** The only 6 font sizes in the app. */
export const fontSize = { xs: 11, sm: 13, md: 15, lg: 17, xl: 22, xxl: 28 } as const;

const variant = (
  size: number,
  lineHeight: number,
  family: string,
  letterSpacing = 0,
  extra: TextStyle = {},
): TextStyle => ({ fontSize: size, lineHeight, fontFamily: family, letterSpacing, ...extra });

export const type = {
  display: variant(fontSize.xxl, 34, fontFamily.bold, -0.6),
  title: variant(fontSize.xl, 28, fontFamily.semibold, -0.4),
  heading: variant(fontSize.lg, 22, fontFamily.semibold, -0.2),
  body: variant(fontSize.md, 22, fontFamily.regular, -0.1),
  bodyStrong: variant(fontSize.md, 22, fontFamily.semibold, -0.1),
  callout: variant(fontSize.sm, 18, fontFamily.medium),
  caption: variant(fontSize.sm, 18, fontFamily.regular),
  label: variant(fontSize.xs, 14, fontFamily.semibold, 0.4, { textTransform: 'uppercase' }),
} as const;

export type TypeVariant = keyof typeof type;

export const opacity = {
  disabled: 0.4,
  pressed: 0.85,
} as const;

/** Spring presets. Every transition uses one of these. */
export const motion = {
  pressScale: 0.97,
  spring: {
    /** Press-in/out, toggles. */
    snappy: { damping: 22, stiffness: 420, mass: 0.6 },
    /** Most UI transitions (expand, slide, focus rings). */
    standard: { damping: 24, stiffness: 260, mass: 1 },
    /** Sheets and large surfaces. */
    gentle: { damping: 30, stiffness: 180, mass: 1 },
  },
  /** Skeleton pulse loop duration (ms) — loops are the only timing-based motion. */
  pulseDuration: 900,
} as const;

/** Shadows for floating elements only (sheets, sticky bars, map overlays). */
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
    md: s(4, 16, 0.08, 4),
    lg: s(8, 32, 0.12, 12),
  };
};
