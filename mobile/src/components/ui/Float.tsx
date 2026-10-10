import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { drift, easing, useTheme } from '@/theme';

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
 * the "next stop" tag on the route, Tin's truck idling. A CSS loop, so it runs off the JS thread.
 */
export function Float({ children, distance = 1, duration, style }: FloatProps) {
  const t = useTheme();
  const reduced = useReducedMotion();
  return (
    <Animated.View
      style={[
        style,
        !reduced && {
          animationName: drift(t.space[distance]),
          animationDuration: duration ?? t.motion.pulseDuration,
          animationTimingFunction: easing.sine,
          animationIterationCount: 'infinite',
          animationDirection: 'alternate',
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
