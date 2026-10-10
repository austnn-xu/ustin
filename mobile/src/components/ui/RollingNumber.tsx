import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { makeStyles, useTheme, type ColorTokens, type HueName, type TypeVariant } from '@/theme';
import { Text } from './Text';

export type RollingNumberProps = {
  value: number;
  variant?: TypeVariant;
  hue?: HueName;
  color?: keyof ColorTokens;
  /** Text after the number, e.g. "%" or " XP". It does not roll. */
  suffix?: string;
  /** Hop when the number goes up, for counters that pay out (coins, XP). */
  bump?: boolean;
  accessibilityLabel?: string;
};

/** The whole column of digits as one text node (one line each), so a counter costs one element per digit, not ten. */
const COLUMN = '0\n1\n2\n3\n4\n5\n6\n7\n8\n9';

/**
 * A number whose digits roll to their new value like an odometer, instead of snapping. Every counter in the app
 * (streak, coins, XP, the lesson's score) uses it, so numbers always move the way they changed.
 */
export function RollingNumber({ value, variant = 'bodyStrong', hue, color, suffix, bump = false, accessibilityLabel }: RollingNumberProps) {
  const t = useTheme();
  const styles = useStyles();
  const chars = String(Math.max(0, Math.round(value))).split('');
  const lineHeight = t.type[variant].lineHeight ?? t.type.body.lineHeight!;
  const hop = useSharedValue(0);
  const last = useRef(value);

  useEffect(() => {
    if (bump && value > last.current) {
      hop.value = withSequence(withSpring(1, t.motion.spring.snappy), withSpring(0, t.motion.spring.bouncy));
    }
    last.current = value;
  }, [value, bump, hop, t.motion.spring.snappy, t.motion.spring.bouncy]);

  const hopStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -hop.value * t.space[1.5] }, { scale: 1 + hop.value * 0.18 }],
  }));

  return (
    <Animated.View
      style={[styles.row, hopStyle]}
      accessible
      accessibilityLabel={accessibilityLabel ?? `${value}${suffix ?? ''}`}
    >
      {chars.map((ch, i) => (
        // Key digits by place value from the right, so 9 → 10 keeps the ones column rolling and adds a tens column.
        <Digit key={chars.length - i} digit={Number(ch)} lineHeight={lineHeight} variant={variant} hue={hue} color={color} />
      ))}
      {suffix ? (
        <Text variant={variant} hue={hue} color={color} tabular>
          {suffix}
        </Text>
      ) : null}
    </Animated.View>
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
