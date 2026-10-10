import { useSyncExternalStore, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

type Focusable = {
  isFocused: () => boolean;
  addListener: (event: 'focus' | 'blur', callback: () => void) => () => void;
};

/**
 * On the web, navigators keep every screen they have ever shown mounted and stacked behind the current one, and the
 * browser goes on styling, laying out, painting and animating all of them — the whole Learn route under the Shop, Tin
 * bobbing on five tabs at once. That is most of what made the web app feel heavy.
 *
 * This wraps a screen and, while it is not the focused one, hides it with `content-visibility: hidden`: the browser skips
 * its style, layout, paint and animations entirely, but (unlike `display: none`) keeps its scroll position, so the
 * route is exactly where you left it when you come back. Native platforms detach inactive screens themselves.
 */
export function FocusedScene({ navigation, children }: { navigation: Focusable; children: ReactNode }) {
  const focused = useSyncExternalStore(
    (onChange) => {
      const offFocus = navigation.addListener('focus', onChange);
      const offBlur = navigation.addListener('blur', onChange);
      return () => {
        offFocus();
        offBlur();
      };
    },
    () => navigation.isFocused(),
  );
  if (Platform.OS !== 'web') return <>{children}</>;
  return <View style={[styles.fill, !focused && hidden]}>{children}</View>;
}

// Web-only CSS that React Native's style types do not know about.
const hidden = { visibility: 'hidden', contentVisibility: 'hidden' } as unknown as ViewStyle;

const styles = StyleSheet.create({ fill: { flex: 1 } });
