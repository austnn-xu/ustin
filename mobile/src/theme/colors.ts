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

/**
 * The eight Arena leagues. Like the town's `scene` colours these are a closed set with one job: league badges, league
 * banners and the league chip next to a name. They are never used for actions, feedback or bins. `facet` is the light
 * face of a badge's gem.
 */
export type LeagueId = 'bronze' | 'silver' | 'gold' | 'emerald' | 'diamond' | 'sapphire' | 'ruby' | 'pristine';
export type LeagueColor = Hue & { facet: string };

export type Palette = ColorTokens & {
  hue: Record<HueName, Hue>;
  mascot: MascotColors;
  scene: SceneColors;
  league: Record<LeagueId, LeagueColor>;
};

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

/*
 * The look: a storybook recycling town, not a default app. Warm paper behind everything, white cards sitting on it,
 * and ink (the same blue-black as Tin's outline) for text, so type and mascot look drawn by the same hand. The hues are
 * our own family, tuned to sit together on paper: jade, denim, tomato, marigold, mustard, plum, clay and slate. Every
 * text/fill pair is checked for contrast by scripts/check-contrast.mjs.
 */
export const light: Palette = {
  bg: '#FAF7F0',
  bgSubtle: '#F3EFE6',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  fill: '#EFEAE0',
  fillStrong: '#E2DCCF',
  border: '#E8E2D6',
  borderStrong: '#D5CDBE',
  text: '#26323B',
  textSecondary: '#5C6770',
  textTertiary: '#7E878E',
  textInverse: '#FFFFFF',
  onColor: '#FFFFFF',
  scrim: 'rgba(30, 38, 45, 0.5)',
  shine: 'rgba(255, 255, 255, 0.35)',
  shadow: '#26323B',
  hue: {
    green: { base: '#1F965C', depth: '#166E43', subtle: '#E1F1E7', text: '#167044' },
    blue: { base: '#2D7BC0', depth: '#215C92', subtle: '#E2EDF7', text: '#215C92' },
    red: { base: '#D9533F', depth: '#A93D2D', subtle: '#FAE4DF', text: '#A63C2C' },
    orange: { base: '#D9731A', depth: '#A9570F', subtle: '#FBEAD7', text: '#975010' },
    yellow: { base: '#EFB22C', depth: '#C08A10', subtle: '#FBF0D2', text: '#7E5D05' },
    purple: { base: '#8463CF', depth: '#6547AB', subtle: '#EDE7F8', text: '#6346A8' },
    brown: { base: '#A0714A', depth: '#7A5534', subtle: '#F2E8DD', text: '#76512F' },
    slate: { base: '#64707B', depth: '#4B5560', subtle: '#EAECEE', text: '#4B5560' },
  },
  mascot,
  league: {
    bronze: { base: '#C7793A', depth: '#96562A', subtle: '#F7E6D8', text: '#8E5023', facet: '#E3A877' },
    silver: { base: '#A7B4C2', depth: '#7B8896', subtle: '#EDF1F5', text: '#5E6B79', facet: '#D6DEE6' },
    gold: { base: '#F2B705', depth: '#C08F00', subtle: '#FFF4CC', text: '#9A7300', facet: '#FFDA5C' },
    emerald: { base: '#1FB37A', depth: '#138A5B', subtle: '#D6F5E8', text: '#0F7A50', facet: '#6EDDB0' },
    diamond: { base: '#5CC8EA', depth: '#2E9CC0', subtle: '#E0F6FD', text: '#1D7FA0', facet: '#B4ECFB' },
    sapphire: { base: '#2E5BEA', depth: '#1F40B0', subtle: '#DDE5FD', text: '#2645B8', facet: '#7F9DF5' },
    ruby: { base: '#E0245E', depth: '#A9163F', subtle: '#FCDDE7', text: '#B31749', facet: '#F17A9C' },
    pristine: { base: '#E9E3FF', depth: '#A493F0', subtle: '#F3F0FF', text: '#6C55D9', facet: '#FFFFFF' },
  },
  scene: {
    sky: '#DDEEF1',
    cloud: '#FFFFFF',
    asphalt: '#6E7682',
    asphaltEdge: '#585F6A',
    lane: '#FFD84D',
    kerb: '#F3EFE6',
    leaf: '#5DBB4A',
    leafDark: '#3F9A35',
    trunk: '#9A6B3F',
    wall: '#FFF2DC',
    window: '#9ED8F5',
    pole: '#7C8794',
    rock: '#BAC2CA',
    flower: '#FF8FA3',
    cone: '#FF8A3D',
    shadow: 'rgba(0, 0, 0, 0.12)',
  },
};

export const dark: Palette = {
  bg: '#14191F',
  bgSubtle: '#181E25',
  surface: '#1B222A',
  surfaceRaised: '#212932',
  fill: '#252E38',
  fillStrong: '#2F3944',
  border: '#2D3741',
  borderStrong: '#3A4550',
  text: '#F2EEE6',
  textSecondary: '#ADB4BB',
  textTertiary: '#848D95',
  textInverse: '#14191F',
  onColor: '#11171D',
  scrim: 'rgba(0, 0, 0, 0.6)',
  shine: 'rgba(255, 255, 255, 0.3)',
  shadow: '#000000',
  hue: {
    green: { base: '#3DBB7A', depth: '#2A8A57', subtle: '#173428', text: '#5ACF92' },
    blue: { base: '#5A9FE0', depth: '#3B72A8', subtle: '#16283A', text: '#80B7EC' },
    red: { base: '#EE7461', depth: '#B54C3B', subtle: '#391F1B', text: '#F4927F' },
    orange: { base: '#F29A45', depth: '#BC7026', subtle: '#382817', text: '#F7B26E' },
    yellow: { base: '#F2C04E', depth: '#BF911F', subtle: '#352E15', text: '#F6CE70' },
    purple: { base: '#A388E5', depth: '#755CB6', subtle: '#29233D', text: '#BCA7EE' },
    brown: { base: '#C2925F', depth: '#8F6741', subtle: '#2F261D', text: '#D6AE84' },
    slate: { base: '#8C98A3', depth: '#646F7A', subtle: '#242C34', text: '#ADB7C0' },
  },
  mascot,
  league: {
    bronze: { base: '#D08446', depth: '#9A5C2C', subtle: '#3A2A1E', text: '#E3A06A', facet: '#E9AE7D' },
    silver: { base: '#B4C0CC', depth: '#808C99', subtle: '#2A333C', text: '#C8D2DC', facet: '#DCE3EA' },
    gold: { base: '#FFC21A', depth: '#C99500', subtle: '#3A3210', text: '#FFD24D', facet: '#FFE07A' },
    emerald: { base: '#2CC98B', depth: '#1B935F', subtle: '#133628', text: '#4BDDA2', facet: '#7CE6BC' },
    diamond: { base: '#7EDCF5', depth: '#45A9C9', subtle: '#12303A', text: '#8FE3F8', facet: '#C4F1FC' },
    sapphire: { base: '#4C74F5', depth: '#2F4EC2', subtle: '#1A2446', text: '#7E9BFA', facet: '#93ABFA' },
    ruby: { base: '#F0386F', depth: '#B21F4C', subtle: '#3D1824', text: '#FF6F97', facet: '#FF8DB0' },
    pristine: { base: '#EEE9FF', depth: '#A493F0', subtle: '#2A2440', text: '#C9BCFF', facet: '#FFFFFF' },
  },
  scene: {
    sky: '#12222A',
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
