import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { css, useReducedMotion } from 'react-native-reanimated';
import { easing, useTheme, type HueName } from '@/theme';

const PIECES = 36;
const HUES: HueName[] = ['green', 'blue', 'red', 'orange', 'yellow', 'purple'];

type Piece = {
  delay: number;
  hue: HueName;
  wide: boolean;
  duration: number;
  keyframes: ReturnType<typeof css.keyframes>;
};

/**
 * A one-shot burst of confetti over the whole screen. Re-mount (change `key`) to fire again.
 * Each piece is its own CSS animation, so the burst costs no JavaScript while it falls. Skipped under reduce-motion.
 */
export function Confetti() {
  const t = useTheme();
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: PIECES }, (_, i) => {
        const x = Math.random() * width;
        const drift = (Math.random() - 0.5) * width * 0.3;
        const spin = (Math.random() - 0.5) * 1440;
        const start = [{ translateX: x }, { translateY: -t.space[8] }, { rotate: '0deg' }];
        const end = [{ translateX: x + drift }, { translateY: height + t.space[16] }, { rotate: `${spin}deg` }];
        return {
          delay: Math.random() * 400,
          hue: HUES[i % HUES.length]!,
          wide: Math.random() > 0.5,
          duration: t.motion.confettiDuration * (0.75 + Math.random() * 0.5),
          keyframes: css.keyframes({
            from: { opacity: 1, transform: start },
            '85%': { opacity: 1 },
            to: { opacity: 0, transform: end },
          }),
        };
      }),
    [width, height, t.space, t.motion.confettiDuration],
  );
  if (reduced) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: p.wide ? t.space[3] : t.space[2],
            height: p.wide ? t.space[2] : t.space[3],
            borderRadius: t.radius.xs / 2,
            backgroundColor: t.colors.hue[p.hue].base,
            opacity: 0,
            animationName: p.keyframes,
            animationDuration: p.duration,
            animationDelay: p.delay,
            animationTimingFunction: easing.fall,
            animationFillMode: 'both',
          }}
        />
      ))}
    </View>
  );
}
