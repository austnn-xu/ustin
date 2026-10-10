import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { easing, keyframes, makeStyles, useTheme } from '@/theme';
import { PressableScale } from './PressableScale';

export type ChoiceState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed';

export type ChoiceCardProps = {
  children: ReactNode;
  state?: ChoiceState;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  /** Inner padding preset. */
  padding?: 'md' | 'lg';
};

/**
 * A chunky, selectable answer tile: 2px border with a thicker bottom edge it presses into. Selected turns blue,
 * then correct/wrong turn green/red once the answer is checked. Each change is felt as well as seen: choosing hops,
 * a right answer bounces, a wrong one shakes its head.
 */
export function ChoiceCard({ children, state = 'idle', onPress, disabled, accessibilityLabel, style, padding = 'md' }: ChoiceCardProps) {
  const t = useTheme();
  const styles = useStyles();
  const depth = t.layout.depth.md;
  const pressed = useSharedValue(0);
  const face = useAnimatedStyle(() => ({ transform: [{ translateY: pressed.value * (depth - t.layout.border) }] }));
  // Each change of state plays its reaction once, as a CSS animation (no JavaScript per frame).
  const reduced = useReducedMotion();
  const reaction =
    reduced || state === 'idle' || state === 'dimmed'
      ? null
      : {
          animationName: state === 'wrong' ? keyframes.nope : state === 'correct' ? keyframes.cheer : keyframes.hop,
          animationDuration: t.motion.react,
          animationTimingFunction: easing.out,
        };

  const tone =
    state === 'selected'
      ? t.colors.hue.blue
      : state === 'correct'
        ? t.colors.hue.green
        : state === 'wrong'
          ? t.colors.hue.red
          : null;

  return (
    <Animated.View style={[style, reaction]}>
      <PressableScale
        scale={false}
        haptic="selection"
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => {
          pressed.value = withSpring(1, t.motion.spring.snappy);
        }}
        onPressOut={() => {
          pressed.value = withSpring(0, t.motion.spring.snappy);
        }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected: state === 'selected' || state === 'correct', disabled }}
        style={[styles.root, styles.grow, state === 'dimmed' && styles.dimmed]}
      >
        <View style={[styles.edge, { backgroundColor: tone ? tone.depth : t.colors.border }]} />
        <Animated.View
          style={[
            styles.face,
            padding === 'lg' && styles.padLg,
            tone ? { borderColor: tone.base, backgroundColor: tone.subtle } : styles.idle,
            face,
          ]}
        >
          {children}
        </Animated.View>
      </PressableScale>
    </Animated.View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { paddingBottom: t.layout.depth.md - t.layout.border },
  grow: { flexGrow: 1 },
  edge: { position: 'absolute', left: 0, right: 0, bottom: 0, top: t.layout.depth.md, borderRadius: t.radius.lg },
  face: {
    flex: 1,
    borderRadius: t.radius.lg,
    borderWidth: t.layout.border,
    padding: t.space[3],
  },
  padLg: { padding: t.space[4] },
  idle: { borderColor: t.colors.border, backgroundColor: t.colors.surface },
  dimmed: { opacity: t.opacity.muted },
}));
