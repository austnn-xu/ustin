import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { makeStyles, useTheme, type HueName } from '@/theme';

export type ProgressBarProps = {
  /** 0..1 */
  value: number;
  hue?: HueName;
  size?: 'sm' | 'md';
  accessibilityLabel?: string;
};

/** Rounded progress bar with the glossy highlight stripe. Springs to new values, and swells a little when it fills. */
export function ProgressBar({ value, hue = 'green', size = 'md', accessibilityLabel }: ProgressBarProps) {
  const t = useTheme();
  const styles = useStyles();
  const progress = useSharedValue(0);
  const clamped = Math.max(0, Math.min(1, value));

  const swell = useSharedValue(0);
  const last = useRef(clamped);

  useEffect(() => {
    progress.value = withSpring(clamped, t.motion.spring.standard);
    if (clamped > last.current) swell.value = withSequence(withSpring(1, t.motion.spring.snappy), withSpring(0, t.motion.spring.bouncy));
    last.current = clamped;
  }, [clamped, progress, swell, t.motion.spring]);

  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const track = useAnimatedStyle(() => ({ transform: [{ scaleY: 1 + swell.value * 0.25 }] }));
  const height = t.layout.bar[size];

  return (
    <Animated.View
      style={[styles.track, { height, borderRadius: height / 2 }, track]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Animated.View
        style={[styles.fill, { backgroundColor: t.colors.hue[hue].base, borderRadius: height / 2 }, clamped > 0 && styles.nub, fill]}
      >
        {size === 'md' && <View style={styles.shine} />}
      </Animated.View>
    </Animated.View>
  );
}

const useStyles = makeStyles((t) => ({
  track: { flex: 1, backgroundColor: t.colors.fillStrong, overflow: 'hidden' },
  fill: { height: '100%', justifyContent: 'flex-start', paddingTop: t.space[1], paddingHorizontal: t.space[2] },
  /** Any progress at all shows as a rounded nub, never a sliver. */
  nub: { minWidth: t.layout.bar.md },
  shine: { height: t.space[1], borderRadius: t.radius.pill, backgroundColor: t.colors.shine },
}));
