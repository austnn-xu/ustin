import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme';

export type FloatProps = {
  children: ReactNode;
  /** How far it drifts, as a `t.space` step. */
  distance?: 0.5 | 1 | 1.5 | 2;
  /** One drift, in ms. Defaults to the pulse loop. */
  duration?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * A gentle, endless up-and-down drift for things that should look alive while they wait: a tip pointing at a button,
 * the "next stop" tag on the route, Tin's truck idling. A loop, so it is the one place timing (not a spring) is right.
 */
export function Float({ children, distance = 1, duration, style }: FloatProps) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  const ms = duration ?? t.motion.pulseDuration;

  useEffect(() => {
    if (reduced) return;
    p.value = withRepeat(withTiming(1, { duration: ms, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [p, reduced, ms]);

  const offset = t.space[distance];
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: -p.value * offset }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
