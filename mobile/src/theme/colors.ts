/**
 * Color tokens. Neutral palette + one accent. `danger` is semantic only.
 * Components never import these directly — read them from `useTheme().colors`.
 */
export type ColorTokens = {
  /** App background behind everything. */
  bg: string;
  /** Off-white / slightly raised background for grouped sections. */
  bgSubtle: string;
  /** Cards, list rows, inputs. */
  surface: string;
  /** Sheets, popovers, sticky bars — anything floating. */
  surfaceRaised: string;
  /** Neutral fill: secondary buttons, skeletons, input backgrounds, pressed rows. */
  fill: string;
  fillStrong: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  /** Text on top of `text`-colored (inverted) surfaces. */
  textInverse: string;
  accent: string;
  accentPressed: string;
  /** Low-emphasis accent background (selected chips, accent badge). */
  accentSubtle: string;
  onAccent: string;
  danger: string;
  dangerSubtle: string;
  onDanger: string;
  /** Sheet backdrop / image scrim. */
  scrim: string;
  /** Map-overlay and sheet shadow color. */
  shadow: string;
};

export const light: ColorTokens = {
  bg: '#FFFFFF',
  bgSubtle: '#F7F7F5',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  fill: '#F2F2EF',
  fillStrong: '#E8E8E4',
  border: '#E6E6E2',
  borderStrong: '#D2D2CD',
  text: '#121212',
  textSecondary: '#5C5C58',
  textTertiary: '#8C8C87',
  textInverse: '#FFFFFF',
  accent: '#0A7B4C',
  accentPressed: '#086640',
  accentSubtle: '#E6F3EC',
  onAccent: '#FFFFFF',
  danger: '#C8312B',
  dangerSubtle: '#FBEAE9',
  onDanger: '#FFFFFF',
  scrim: 'rgba(0, 0, 0, 0.4)',
  shadow: '#000000',
};

export const dark: ColorTokens = {
  bg: '#0B0B0B',
  bgSubtle: '#121212',
  surface: '#141414',
  surfaceRaised: '#1C1C1C',
  fill: '#222222',
  fillStrong: '#2C2C2C',
  border: '#262626',
  borderStrong: '#3A3A3A',
  text: '#F4F4F1',
  textSecondary: '#A6A6A1',
  textTertiary: '#71716D',
  textInverse: '#121212',
  accent: '#38B97A',
  accentPressed: '#2FA169',
  accentSubtle: '#12271C',
  onAccent: '#04150C',
  danger: '#F0625B',
  dangerSubtle: '#2E1513',
  onDanger: '#1A0504',
  scrim: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
};
