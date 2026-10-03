import { useEffect } from 'react';
import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { makeStyles, useTheme, type Theme } from '@/theme';

export type SkeletonProps = {
  width?: DimensionValue;
  /** Defaults to `t.space[4]`. */
  height?: number;
  radius?: keyof Theme['radius'];
  circle?: boolean;
  /** Size by aspect ratio instead of height (images). */
  aspectRatio?: number;
  /** Layout overrides, e.g. reuse the real image's aspect-ratio style. */
  style?: StyleProp<ViewStyle>;
};

/** Loading placeholder. Compose these into the exact shape of the content that is loading. */
export function Skeleton({ width = '100%', height: heightProp, radius = 'xs', circle, aspectRatio, style }: SkeletonProps) {
  const t = useTheme();
  const height = heightProp ?? t.space[4];
  const styles = useStyles();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(0.45, { duration: t.motion.pulseDuration, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse, t.motion.pulseDuration]);

  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      aria-hidden
      style={[
        styles.block,
        aspectRatio
          ? { width, aspectRatio, borderRadius: t.radius[radius] }
          : { width: circle ? height : width, height, borderRadius: circle ? t.radius.pill : t.radius[radius] },
        style,
        animated,
      ]}
    />
  );
}

/** Paragraph placeholder: full-width lines with a shorter last line, at body line height. */
export function SkeletonText({ lines = 2, variant = 'body' }: { lines?: number; variant?: 'body' | 'caption' | 'heading' }) {
  const t = useTheme();
  const styles = useStyles();
  const lineHeight = t.type[variant].lineHeight!;
  const barHeight = t.type[variant].fontSize!;
  return (
    <View style={styles.textBlock}>
      {Array.from({ length: lines }, (_, i) => (
        <View key={i} style={{ height: lineHeight, justifyContent: 'center' }}>
          <Skeleton height={barHeight} width={i === lines - 1 && lines > 1 ? '60%' : '100%'} />
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  block: { backgroundColor: t.colors.fillStrong },
  textBlock: { alignSelf: 'stretch' },
}));
