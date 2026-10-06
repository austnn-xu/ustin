import { useWindowDimensions } from 'react-native';

/**
 * Size classes for the few places where layout changes with the screen rather than just flowing:
 *  narrow — under 360px wide (iPhone SE 1st gen, small Androids): icon-only tab bar.
 *  short  — under 720px tall (iPhone SE, landscape-ish browser windows): smaller mascots and artwork, so the actual
 *           content (answers, shop items) stays above the fold.
 */
export function useScreenSize() {
  const { width, height } = useWindowDimensions();
  return { width, height, narrow: width < 360, short: height < 720 };
}
