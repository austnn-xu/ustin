import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { numbers } from '@/lib/engine';
import { makeStyles, useTheme, type ColorTokens, type HueName, type TypeVariant } from '@/theme';
import { Text } from './Text';

export type RollingNumberProps = {
  value: number;
  variant?: TypeVariant;
  hue?: HueName;
  color?: keyof ColorTokens;
  /** Text after the number, e.g. "%" or " XP". It does not roll. */
  suffix?: string;
  /**
   * Show big numbers short, simulator-style: 9,999 then 12.3K, 4.56M, 7.8B, 1.2T, 9Qa (see ../lib/numbers.js). On by
   * default, so no counter in the app can grow into a wall of digits.
   */
  compact?: boolean;
  accessibilityLabel?: string;
};

/** The whole column of digits as one text node (one line each), so a counter costs one element per digit, not ten. */
const COLUMN = '0\n1\n2\n3\n4\n5\n6\n7\n8\n9';

/**
 * A number whose digits roll to their new value like an odometer, instead of snapping. Every counter in the app
 * (streak, coins, XP, the lesson's score) uses it, so numbers always move the way they changed.
 */
export function RollingNumber({ value, variant = 'bodyStrong', hue, color, suffix, accessibilityLabel, compact = true }: RollingNumberProps) {
  const t = useTheme();
  const styles = useStyles();
  const whole = numbers.clampPoints(Math.round(value));
  const chars = (compact ? numbers.compact(whole) : String(whole)).split('');
  const lineHeight = t.type[variant].lineHeight ?? t.type.body.lineHeight!;
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={accessibilityLabel ?? `${whole.toLocaleString('en-US')}${suffix ?? ''}`}
    >
      {chars.map((ch, i) =>
        // Key by place from the right, so 9 → 10 keeps the ones column rolling and adds a tens column. Separators,
        // decimal points and suffixes (",", ".", "K", "Qa") sit still; only digits roll.
        /\d/.test(ch) ? (
          <Digit key={chars.length - i} digit={Number(ch)} lineHeight={lineHeight} variant={variant} hue={hue} color={color} />
        ) : (
          <Text key={`${chars.length - i}${ch}`} variant={variant} hue={hue} color={color}>
            {ch}
          </Text>
        ),
      )}
      {suffix ? (
        <Text variant={variant} hue={hue} color={color} tabular>
          {suffix}
        </Text>
      ) : null}
    </View>
  );
}

function Digit({
  digit,
  lineHeight,
  variant,
  hue,
  color,
}: {
  digit: number;
  lineHeight: number;
  variant: TypeVariant;
  hue?: HueName;
  color?: keyof ColorTokens;
}) {
  const t = useTheme();
  const styles = useStyles();
  const y = useSharedValue(digit);

  useEffect(() => {
    y.value = withSpring(digit, t.motion.spring.standard);
  }, [digit, y, t.motion.spring.standard]);

  const column = useAnimatedStyle(() => ({ transform: [{ translateY: -y.value * lineHeight }] }));

  return (
    <View style={[styles.window, { height: lineHeight }]} importantForAccessibility="no-hide-descendants" aria-hidden>
      <Animated.View style={column}>
        <Text variant={variant} hue={hue} color={color} tabular numberOfLines={10}>
          {COLUMN}
        </Text>
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  window: { overflow: 'hidden' },
}));
