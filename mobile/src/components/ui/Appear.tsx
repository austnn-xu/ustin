import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';

export type AppearProps = {
  children?: ReactNode;
  /** Where it comes from: up from below (default), in from the side you are heading towards, or popping out of nothing. */
  from?: 'below' | 'above' | 'right' | 'left' | 'pop';
  /** Position among siblings arriving together; each one waits `t.motion.stagger` longer than the last. */
  index?: number;
  /** Extra wait (ms) before it starts, on top of the stagger. */
  delay?: number;
  /** `bouncy` for rewards and Tin's bubbles; `gentle` for most content. */
  spring?: 'gentle' | 'standard' | 'bouncy';
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
};

/**
 * Brings its children on screen with a spring instead of popping them in: nothing in the app appears from nowhere.
 * Mount it (or change its `key`) to play it. Respects the system's reduce-motion setting.
 */
export function Appear({ children, from = 'below', index = 0, delay = 0, spring = 'gentle', style, pointerEvents }: AppearProps) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    p.value = withDelay(delay + index * t.motion.stagger, withSpring(1, t.motion.spring[spring]));
  }, [p, reduced, delay, index, spring, t.motion.stagger, t.motion.spring]);

  const near = t.motion.enterDistance;
  const far = t.motion.slideDistance;
  const animated = useAnimatedStyle(() => {
    const rest = 1 - p.value;
    const opacity = interpolate(p.value, [0, 0.6], [0, 1], Extrapolation.CLAMP);
    switch (from) {
      case 'pop':
        return { opacity, transform: [{ scale: interpolate(p.value, [0, 1], [0.6, 1]) }] };
      case 'right':
        return { opacity, transform: [{ translateX: rest * far }] };
      case 'left':
        return { opacity, transform: [{ translateX: -rest * far }] };
      case 'above':
        return { opacity, transform: [{ translateY: -rest * near }] };
      default:
        return { opacity, transform: [{ translateY: rest * near }] };
    }
  });

  return (
    <Animated.View style={[style, animated]} pointerEvents={pointerEvents}>
      {children}
    </Animated.View>
  );
}
