import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { easing, keyframes, useTheme } from '@/theme';

export type AppearProps = {
  children?: ReactNode;
  /** Where it comes from: up from below (default), in from the side you are heading towards, or popping out of nothing. */
  from?: 'below' | 'above' | 'right' | 'left' | 'pop';
  /** Position among siblings arriving together; each one waits `t.motion.stagger` longer than the last. */
  index?: number;
  /** Extra wait (ms) before it starts, on top of the stagger. */
  delay?: number;
  /** `bouncy` overshoots a touch, for rewards and Tin's bubbles; `gentle` settles softly, for most content. */
  spring?: 'gentle' | 'standard' | 'bouncy';
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
};

const FROM = {
  below: keyframes.enterBelow,
  above: keyframes.enterAbove,
  right: keyframes.enterRight,
  left: keyframes.enterLeft,
  pop: keyframes.pop,
} as const;

/**
 * Brings its children on screen instead of popping them in: nothing in the app appears from nowhere. Mount it (or change
 * its `key`) to play it.
 *
 * It is a CSS animation, so it costs no JavaScript per frame: a screen can bring in a dozen things at once and still
 * hold 60fps on a modest phone. Respects the system's reduce-motion setting.
 */
export function Appear({ children, from = 'below', index = 0, delay = 0, spring = 'gentle', style, pointerEvents }: AppearProps) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const bouncy = spring === 'bouncy';
  return (
    <Animated.View
      pointerEvents={pointerEvents}
      style={[
        style,
        !reduced && {
          animationName: FROM[from],
          animationDuration: bouncy ? t.motion.enterBouncy : t.motion.enter,
          animationTimingFunction: bouncy ? easing.back : easing.out,
          animationDelay: delay + index * t.motion.stagger,
          // Hold the first frame during the stagger delay, so it never flashes in before its turn.
          animationFillMode: 'backwards',
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
