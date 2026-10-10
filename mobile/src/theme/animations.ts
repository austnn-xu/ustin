import { css, cubicBezier } from 'react-native-reanimated';
import { motion } from './tokens';

/**
 * Shared CSS keyframes and curves (Reanimated 4 CSS animations). Built once at module load, so a component only
 * points at one — no per-frame JavaScript. See `motion` in tokens.ts for when to use these instead of a spring.
 */
const curve = (c: readonly [number, number, number, number]) => cubicBezier(c[0], c[1], c[2], c[3]);

export const easing = {
  out: curve(motion.curve.out),
  back: curve(motion.curve.back),
  sine: curve(motion.curve.sine),
  fall: curve(motion.curve.fall),
};

export const keyframes = {
  enterBelow: css.keyframes({
    from: { opacity: 0, transform: [{ translateY: motion.enterDistance }] },
    to: { opacity: 1, transform: [{ translateY: 0 }] },
  }),
  enterAbove: css.keyframes({
    from: { opacity: 0, transform: [{ translateY: -motion.enterDistance }] },
    to: { opacity: 1, transform: [{ translateY: 0 }] },
  }),
  enterRight: css.keyframes({
    from: { opacity: 0, transform: [{ translateX: motion.slideDistance }] },
    to: { opacity: 1, transform: [{ translateX: 0 }] },
  }),
  enterLeft: css.keyframes({
    from: { opacity: 0, transform: [{ translateX: -motion.slideDistance }] },
    to: { opacity: 1, transform: [{ translateX: 0 }] },
  }),
  fadeIn: css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } }),
  pop: css.keyframes({
    from: { opacity: 0, transform: [{ scale: 0.85 }] },
    to: { opacity: 1, transform: [{ scale: 1 }] },
  }),
  /** A wrong answer shaking its head. */
  nope: css.keyframes({
    '0%': { transform: [{ translateX: 0 }] },
    '15%': { transform: [{ translateX: motion.shakeDistance }] },
    '35%': { transform: [{ translateX: -motion.shakeDistance * 0.8 }] },
    '55%': { transform: [{ translateX: motion.shakeDistance * 0.5 }] },
    '75%': { transform: [{ translateX: -motion.shakeDistance * 0.25 }] },
    '100%': { transform: [{ translateX: 0 }] },
  }),
  /** Loading placeholders breathing. */
  pulse: css.keyframes({ from: { opacity: 1 }, to: { opacity: 0.45 } }),
  /** A flame breathing and leaning. */
  flicker: css.keyframes({
    from: { transform: [{ scaleY: 1 }, { scaleX: 1 }, { rotate: '-2deg' }] },
    to: { transform: [{ scaleY: 1.06 }, { scaleX: 0.97 }, { rotate: '2deg' }] },
  }),
};

const drifts = new Map<number, ReturnType<typeof css.keyframes>>();
/** An up-and-down drift of `distance` pt, for loops (alternate, infinite). Cached per distance. */
export function drift(distance: number) {
  const d = Math.round(distance * 2) / 2;
  let k = drifts.get(d);
  if (!k) {
    k = css.keyframes({ from: { transform: [{ translateY: 0 }] }, to: { transform: [{ translateY: -d }] } });
    drifts.set(d, k);
  }
  return k;
}
