import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { useSettings } from '@/stores/settings';
import { dark, light, type HueName } from './colors';
import { layout, makeShadow, motion, opacity, radius, space, type } from './tokens';

const buildTheme = (scheme: 'light' | 'dark') => {
  const colors = scheme === 'dark' ? dark : light;
  return {
    scheme,
    isDark: scheme === 'dark',
    colors,
    space,
    layout,
    radius,
    type,
    opacity,
    motion,
    shadow: makeShadow(colors, scheme === 'dark'),
  };
};

export type Theme = ReturnType<typeof buildTheme>;

const themes = { light: buildTheme('light'), dark: buildTheme('dark') };
const ThemeContext = createContext<Theme>(themes.light);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const preference = useSettings((s) => s.colorScheme);
  const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  return <ThemeContext.Provider value={themes[scheme]}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

/** Shorthand for one hue's four shades. */
export const useHue = (name: HueName) => useTheme().colors.hue[name];

/**
 * Define styles as a function of the theme. Styles are computed once per scheme.
 *   const useStyles = makeStyles((t) => ({ row: { padding: t.space[4] } }));
 */
export function makeStyles<S extends StyleSheet.NamedStyles<S>>(factory: (t: Theme) => S) {
  const cache = new Map<string, S>();
  return () => {
    const t = useTheme();
    return useMemo(() => {
      let styles = cache.get(t.scheme);
      if (!styles) {
        styles = StyleSheet.create(factory(t));
        cache.set(t.scheme, styles);
      }
      return styles;
    }, [t]);
  };
}
