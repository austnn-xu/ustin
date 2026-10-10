import { Check, Lock, Star } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BinStopArt, SortingCenterArt } from '@/components/art/RouteArt';
import { Float, PressableScale, Text } from '@/components/ui';
import type { NodeState } from '@/lib/course';
import { makeStyles, useTheme, type HueName } from '@/theme';

export type RouteStopProps = {
  state: NodeState;
  hue: HueName;
  review: boolean;
  stars: number;
  label: string;
  /** Width of a bin stop in px; the sorting centre is drawn wider. */
  size: number;
  onPress: () => void;
};

/**
 * One lesson on the route: a wheelie bin at the roadside (or the sorting centre, for a unit review). Pressing it
 * squashes it down onto its shadow. The current stop has a "Start" tag floating over it, so the next thing to do is
 * never in doubt.
 */
export function RouteStop({ state, hue, review, stars, label, size, onPress }: RouteStopProps) {
  const t = useTheme();
  const styles = useStyles();
  const pressed = useSharedValue(0);
  const squash = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * t.layout.depth.md }, { scaleY: 1 - pressed.value * 0.06 }],
  }));
  const locked = state === 'locked';
  const width = review ? size * 1.6 : size;

  return (
    <View style={styles.wrap}>
      {state === 'current' && (
        <Float style={styles.tagWrap} distance={1.5}>
          <View style={[styles.tag, { borderColor: t.colors.hue[hue].base }]}>
            <Text variant="label" hue={hue}>
              {review ? 'Review' : 'Start'}
            </Text>
          </View>
          <View style={[styles.tagTail, { borderColor: t.colors.hue[hue].base }]} />
        </Float>
      )}
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
        style={styles.press}
      >
        <View style={[styles.shadow, { width: width * 0.9 }]} />
        <Animated.View style={squash}>
          {review ? (
            <SortingCenterArt hue={hue} locked={locked} done={state === 'done'} size={width} />
          ) : (
            <BinStopArt
              hue={hue}
              locked={locked}
              open={state === 'current'}
              icon={locked ? Lock : state === 'done' ? Check : Star}
              iconFilled={state === 'current'}
              size={width}
            />
          )}
        </Animated.View>
      </PressableScale>
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
          color={i <= count ? t.colors.hue.yellow.depth : t.colors.borderStrong}
          fill={i <= count ? t.colors.hue.yellow.base : t.colors.fillStrong}
          strokeWidth={t.layout.iconStroke}
        />
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { alignItems: 'center' },
  press: { alignItems: 'center', justifyContent: 'flex-end' },
  shadow: {
    position: 'absolute',
    bottom: -t.space[1],
    height: t.space[3],
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.scene.shadow,
  },
  tagWrap: { position: 'absolute', bottom: '100%', marginBottom: t.space[2], alignItems: 'center', zIndex: 2 },
  tag: {
    paddingHorizontal: t.space[3],
    paddingVertical: t.space[1],
    borderRadius: t.radius.md,
    borderWidth: t.layout.border,
    backgroundColor: t.colors.surface,
  },
  tagTail: {
    width: t.space[3],
    height: t.space[3],
    marginTop: -t.space[1.5] - t.layout.border / 2,
    backgroundColor: t.colors.surface,
    borderRightWidth: t.layout.border,
    borderBottomWidth: t.layout.border,
    transform: [{ rotate: '45deg' }],
  },
  stars: {
    flexDirection: 'row',
    gap: t.space[0.5],
    marginTop: t.space[2],
    paddingHorizontal: t.space[1.5],
    paddingVertical: t.space[0.5],
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surface,
  },
}));
