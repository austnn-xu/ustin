import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useTheme, type ColorTokens, type Hue, type HueName, type TypeVariant } from '@/theme';

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  /** Neutral text color. Ignored when `hue` is set. */
  color?: keyof ColorTokens;
  /** Colored text from a hue — its readable `text` shade unless `shade` says otherwise. */
  hue?: HueName;
  shade?: keyof Hue;
  align?: 'left' | 'center' | 'right';
  /** Tabular numbers for counters and timers. */
  tabular?: boolean;
};

export function Text({ variant = 'body', color = 'text', hue, shade = 'text', align, tabular, style, ...rest }: TextProps) {
  const t = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={1.4}
      style={[
        t.type[variant],
        { color: hue ? t.colors.hue[hue][shade] : t.colors[color] },
        align && { textAlign: align },
        tabular && { fontVariant: ['tabular-nums'] },
        style,
      ]}
      {...rest}
    />
  );
}
