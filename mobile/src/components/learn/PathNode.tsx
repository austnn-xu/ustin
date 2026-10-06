import { Check, Lock, Star, Trophy } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PressableScale, Text } from '@/components/ui';
import type { NodeState } from '@/lib/course';
import { makeStyles, useTheme, type HueName } from '@/theme';

export type PathNodeProps = {
  state: NodeState;
  hue: HueName;
  review: boolean;
  stars: number;
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** One lesson on the path: a chunky round button that presses into its edge. */
export function PathNode({ state, hue: hueName, review, stars, label, selected, onPress }: PathNodeProps) {
  const t = useTheme();
  const styles = useStyles();
  const hue = t.colors.hue[review && state === 'done' ? 'yellow' : hueName];
  const depth = t.layout.depth.lg;
  const size = t.layout.node.size;
  const pressed = useSharedValue(0);
  const face = useAnimatedStyle(() => ({ transform: [{ translateY: pressed.value * depth }] }));

  const locked = state === 'locked';
  const faceColor = locked ? t.colors.fillStrong : hue.base;
  const edgeColor = locked ? t.colors.borderStrong : hue.depth;
  const Glyph = locked ? Lock : review ? Trophy : state === 'done' ? Check : Star;

  return (
    <View style={styles.wrap}>
      {state === 'current' && <StartBubble hue={hueName} />}
      <View style={[styles.ring, state === 'current' && { borderColor: t.colors.fillStrong }, selected && { borderColor: hue.base }]}>
        <PressableScale
          scale={false}
          haptic="light"
          onPress={onPress}
          onPressIn={() => {
            pressed.value = withSpring(1, t.motion.spring.snappy);
          }}
          onPressOut={() => {
            pressed.value = withSpring(0, t.motion.spring.snappy);
          }}
          accessibilityLabel={label}
          accessibilityState={{ disabled: false, selected }}
          style={{ width: size, height: size + depth }}
        >
          <View style={[styles.edge, { top: depth, width: size, height: size, backgroundColor: edgeColor }]} />
          <Animated.View style={[styles.face, { width: size, height: size, backgroundColor: faceColor }, face]}>
            <Glyph
              size={t.layout.icon.xl * 0.8}
              color={locked ? t.colors.textTertiary : t.colors.onColor}
              fill={!locked && (Glyph === Star || Glyph === Trophy) ? t.colors.onColor : 'none'}
              strokeWidth={t.layout.iconStroke + 0.75}
            />
          </Animated.View>
        </PressableScale>
      </View>
      {state === 'done' && !review && <Stars count={stars} />}
    </View>
  );
}

function Stars({ count }: { count: number }) {
  const t = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.stars} aria-hidden>
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          size={t.layout.icon.sm}
          color={i <= count ? t.colors.hue.yellow.base : t.colors.fillStrong}
          fill={i <= count ? t.colors.hue.yellow.base : t.colors.fillStrong}
          strokeWidth={t.layout.iconStroke}
        />
      ))}
    </View>
  );
}

/** The bouncing "START" tooltip over the current lesson. */
function StartBubble({ hue }: { hue: HueName }) {
  const t = useTheme();
  const styles = useStyles();
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withRepeat(withTiming(1, { duration: t.motion.idleDuration / 2, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [bob, t.motion.idleDuration]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value * -t.space[1.5] }] }));
  return (
    <Animated.View style={[styles.bubble, style]} pointerEvents="none">
      <View style={styles.bubbleBox}>
        <Text variant="label" hue={hue}>
          Start
        </Text>
      </View>
      <View style={styles.bubbleTail} />
    </Animated.View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { alignItems: 'center' },
  ring: {
    padding: t.space[1.5],
    borderRadius: t.radius.pill,
    borderWidth: t.layout.depth.md,
    borderColor: 'transparent',
  },
  edge: { position: 'absolute', left: 0, borderRadius: t.radius.pill },
  face: { borderRadius: t.radius.pill, alignItems: 'center', justifyContent: 'center' },
  stars: { flexDirection: 'row', gap: t.space[0.5], marginTop: -t.space[1] },
  bubble: { position: 'absolute', top: -t.space[10], zIndex: 2, alignItems: 'center' },
  bubbleBox: {
    backgroundColor: t.colors.surface,
    borderWidth: t.layout.border,
    borderColor: t.colors.border,
    borderRadius: t.radius.md,
    paddingHorizontal: t.space[3],
    paddingVertical: t.space[1.5],
  },
  bubbleTail: {
    width: t.space[3],
    height: t.space[3],
    marginTop: -t.space[1.5] - t.layout.border / 2,
    backgroundColor: t.colors.surface,
    borderRightWidth: t.layout.border,
    borderBottomWidth: t.layout.border,
    borderColor: t.colors.border,
    transform: [{ rotate: '45deg' }],
  },
}));
