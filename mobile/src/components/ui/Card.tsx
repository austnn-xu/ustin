import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { makeStyles } from '@/theme';
import { PressableScale } from './PressableScale';

export type CardProps = {
  children: ReactNode;
  /**
   * outlined — default, hairline border on surface.
   * filled   — subtle neutral fill, no border (grouped info, summaries).
   * floating — raised surface + shadow. ONLY for things above content (map overlays, sticky bars).
   */
  variant?: 'outlined' | 'filled' | 'floating';
  padding?: 'none' | 'md' | 'lg';
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, variant = 'outlined', padding = 'md', onPress, accessibilityLabel, style }: CardProps) {
  const styles = useStyles();
  const composed = [styles.base, styles[variant], styles[`pad_${padding}`], style];
  if (onPress) {
    return (
      <PressableScale onPress={onPress} accessibilityLabel={accessibilityLabel} style={composed}>
        {children}
      </PressableScale>
    );
  }
  return <View style={composed}>{children}</View>;
}

const useStyles = makeStyles((t) => ({
  base: { borderRadius: t.radius.lg, overflow: 'hidden' },
  outlined: { backgroundColor: t.colors.surface, borderWidth: t.layout.hairline, borderColor: t.colors.borderStrong },
  filled: { backgroundColor: t.colors.bgSubtle },
  floating: {
    backgroundColor: t.colors.surfaceRaised,
    ...(t.isDark ? { borderWidth: t.layout.hairline, borderColor: t.colors.border } : null),
    ...t.shadow.md,
  },
  pad_none: { padding: 0 },
  pad_md: { padding: t.space[4] },
  pad_lg: { padding: t.space[5] },
}));
