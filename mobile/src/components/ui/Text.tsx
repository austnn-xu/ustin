import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useTheme, type ColorTokens, type TypeVariant } from '@/theme';

type TextColor = Extract<
  keyof ColorTokens,
  'text' | 'textSecondary' | 'textTertiary' | 'textInverse' | 'accent' | 'onAccent' | 'danger' | 'onDanger'
>;

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  color?: TextColor;
  align?: 'left' | 'center' | 'right';
  /** Tabular numbers for prices, times, counters. */
  tabular?: boolean;
};

export function Text({ variant = 'body', color = 'text', align, tabular, style, ...rest }: TextProps) {
  const t = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={1.4}
      style={[
        t.type[variant],
        { color: t.colors[color] },
        align && { textAlign: align },
        tabular && { fontVariant: ['tabular-nums'] },
        style,
      ]}
      {...rest}
    />
  );
}
