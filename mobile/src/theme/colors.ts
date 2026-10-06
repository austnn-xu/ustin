/**
 * Color tokens. Components never import these directly — read them from `useTheme().colors`.
 *
 * Two layers:
 *  - neutrals for surfaces and text, and
 *  - a small set of named hues. Every hue has four shades: `base` (fills), `depth` (the 3D edge under a
 *    chunky button or card), `subtle` (tinted backgrounds) and `text` (readable on bg/surface).
 *
 * Hues carry meaning, they are never decoration:
 *  green  — primary action, correct answer, progress
 *  blue   — selection, secondary action, links, and the recycling bin
 *  red    — wrong answer, errors, hazards
 *  orange — streaks, and the special drop-off bin
 *  yellow — XP and celebration
 *  purple — achievements, and the reuse bin
 *  brown  — the compost bin
 *  slate  — the trash bin
 */
export type Hue = { base: string; depth: string; subtle: string; text: string };
export type HueName = 'green' | 'blue' | 'red' | 'orange' | 'yellow' | 'purple' | 'brown' | 'slate';

export type ColorTokens = {
  /** App background behind everything. */
  bg: string;
  /** Slightly raised background for grouped sections. */
  bgSubtle: string;
  /** Cards, list rows, inputs. */
  surface: string;
  /** Floating panels: feedback sheet, popovers, tab bar. */
  surfaceRaised: string;
  /** Neutral fill: tracks, skeletons, locked path nodes. */
  fill: string;
  fillStrong: string;
  border: string;
  /** The 3D edge under neutral (white) buttons and cards. */
  borderStrong: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  /** Text on top of `text`-colored (inverted) surfaces. */
  textInverse: string;
  /** Text and icons on top of any hue `base`. */
  onColor: string;
  /** Overlay behind modals. */
  scrim: string;
  /** The glossy highlight on progress bars and chunky fills. */
  shine: string;
  shadow: string;
};

export type MascotColors = {
  body: string;
  bodyShade: string;
  rim: string;
  outline: string;
  eye: string;
  shine: string;
  cheek: string;
  mouth: string;
  tongue: string;
  tear: string;
};

/** The cartoon town the Learn route runs through. Artwork only — never for text or controls. */
export type SceneColors = {
  sky: string;
  cloud: string;
  asphalt: string;
  asphaltEdge: string;
  lane: string;
  kerb: string;
  leaf: string;
  leafDark: string;
  trunk: string;
  wall: string;
  window: string;
  pole: string;
  rock: string;
  flower: string;
  cone: string;
  shadow: string;
};

export type Palette = ColorTokens & { hue: Record<HueName, Hue>; mascot: MascotColors; scene: SceneColors };

const mascot: MascotColors = {
  body: '#CDD7DD',
  bodyShade: '#A3B2BB',
  rim: '#E8EEF1',
  outline: '#2F3E46',
  eye: '#24313A',
  shine: '#FFFFFF',
  cheek: '#FF9AA6',
  mouth: '#5B2430',
  tongue: '#FF6F80',
  tear: '#7FD3FF',
};

export const light: Palette = {
  bg: '#FFFFFF',
  bgSubtle: '#F7F7F7',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  fill: '#F0F0F0',
  fillStrong: '#E5E5E5',
  border: '#E5E5E5',
  borderStrong: '#D3D3D3',
  text: '#3C3C3C',
  textSecondary: '#777777',
  textTertiary: '#AFAFAF',
  textInverse: '#FFFFFF',
  onColor: '#FFFFFF',
  scrim: 'rgba(0, 0, 0, 0.5)',
  shine: 'rgba(255, 255, 255, 0.35)',
  shadow: '#000000',
  hue: {
    green: { base: '#22A447', depth: '#1A8338', subtle: '#DCF5E0', text: '#168A3C' },
    blue: { base: '#1899D6', depth: '#1279AB', subtle: '#DDF2FC', text: '#1279AB' },
    red: { base: '#FF4B4B', depth: '#D93A3A', subtle: '#FFE1E1', text: '#D63333' },
    orange: { base: '#FF9600', depth: '#D97F00', subtle: '#FFEFD6', text: '#C26A00' },
    yellow: { base: '#FFC800', depth: '#E0A800', subtle: '#FFF6D1', text: '#A67C00' },
    purple: { base: '#A560E8', depth: '#8246C2', subtle: '#F2E6FD', text: '#8246C2' },
    brown: { base: '#A0703C', depth: '#7E5629', subtle: '#F4EADF', text: '#7E5629' },
    slate: { base: '#5B6470', depth: '#434A54', subtle: '#E9ECEF', text: '#434A54' },
  },
  mascot,
  scene: {
    sky: '#E2F4FD',
    cloud: '#FFFFFF',
    asphalt: '#6E7682',
    asphaltEdge: '#585F6A',
    lane: '#FFD84D',
    kerb: '#F4F4F2',
    leaf: '#5DBB4A',
    leafDark: '#3F9A35',
    trunk: '#9A6B3F',
    wall: '#FFF6E5',
    window: '#9ED8F5',
    pole: '#7C8794',
    rock: '#BAC2CA',
    flower: '#FF8FA3',
    cone: '#FF8A3D',
    shadow: 'rgba(0, 0, 0, 0.12)',
  },
};

export const dark: Palette = {
  bg: '#131F24',
  bgSubtle: '#16252B',
  surface: '#131F24',
  surfaceRaised: '#1A2A31',
  fill: '#1F3038',
  fillStrong: '#2A3D46',
  border: '#37464F',
  borderStrong: '#46565F',
  text: '#F1F7FB',
  textSecondary: '#A3B1B8',
  textTertiary: '#5E7079',
  textInverse: '#131F24',
  onColor: '#0F1B20',
  scrim: 'rgba(0, 0, 0, 0.6)',
  shine: 'rgba(255, 255, 255, 0.3)',
  shadow: '#000000',
  hue: {
    green: { base: '#3FBF55', depth: '#2A8C3B', subtle: '#173A22', text: '#5CD672' },
    blue: { base: '#1CB0F6', depth: '#1580B3', subtle: '#0F3346', text: '#49C0F8' },
    red: { base: '#FF4B4B', depth: '#C23434', subtle: '#3D1C1F', text: '#FF7070' },
    orange: { base: '#FF9600', depth: '#C27200', subtle: '#3D2A10', text: '#FFAB3D' },
    yellow: { base: '#FFC800', depth: '#C29800', subtle: '#3A3210', text: '#FFD84D' },
    purple: { base: '#B57BEE', depth: '#8A55C2', subtle: '#2F2140', text: '#C99AF2' },
    brown: { base: '#C08A52', depth: '#8E6235', subtle: '#33281C', text: '#D4A574' },
    slate: { base: '#8A96A3', depth: '#5F6A76', subtle: '#26313A', text: '#A9B4BF' },
  },
  mascot,
  scene: {
    sky: '#10222B',
    cloud: '#2A3F4A',
    asphalt: '#3E4954',
    asphaltEdge: '#2D363F',
    lane: '#E6B800',
    kerb: '#56636D',
    leaf: '#3E9442',
    leafDark: '#2E7332',
    trunk: '#7A5531',
    wall: '#2E3D45',
    window: '#3F7590',
    pole: '#5A6672',
    rock: '#4A5660',
    flower: '#C96B7D',
    cone: '#D9752F',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};
