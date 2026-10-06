import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { makeStyles, type HueName } from '@/theme';
import { PressableScale } from './PressableScale';

export type CardProps = {
  children: ReactNode;
  /**
   * outlined — default: 2px border on surface, the Duolingo card.
   * tinted   — a hue's subtle fill with its border, for callouts (tips, warnings).
   * floating — raised surface + shadow. ONLY for things above content (popovers).
   */
  variant?: 'outlined' | 'tinted' | 'floating';
  hue?: HueName;
  padding?: 'none' | 'md' | 'lg';
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, variant = 'outlined', hue = 'blue', padding = 'md', onPress, accessibilityLabel, style }: CardProps) {
  const styles = useStyles();
  const composed = [styles.base, styles[variant], variant === 'tinted' && styles[`tint_${hue}`], styles[`pad_${padding}`], style];
  if (onPress) {
    return (
      <PressableScale onPress={onPress} accessibilityLabel={accessibilityLabel} style={composed}>
        {children}
      </PressableScale>
    );
  }
  return <View style={composed}>{children}</View>;
}

const useStyles = makeStyles((t) => {
  const tint = (h: HueName) => ({ backgroundColor: t.colors.hue[h].subtle, borderColor: t.colors.hue[h].base });
  return {
    base: { borderRadius: t.radius.lg, borderWidth: t.layout.border, overflow: 'hidden' },
    outlined: { backgroundColor: t.colors.surface, borderColor: t.colors.border },
    tinted: {},
    floating: {
      backgroundColor: t.colors.surfaceRaised,
      borderColor: t.colors.border,
      ...t.shadow.lg,
    },
    tint_green: tint('green'),
    tint_blue: tint('blue'),
    tint_red: tint('red'),
    tint_orange: tint('orange'),
    tint_yellow: tint('yellow'),
    tint_purple: tint('purple'),
    tint_brown: tint('brown'),
    tint_slate: tint('slate'),
    pad_none: { padding: 0 },
    pad_md: { padding: t.space[4] },
    pad_lg: { padding: t.space[5] },
  };
});
