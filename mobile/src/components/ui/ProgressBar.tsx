import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { makeStyles, useTheme, type HueName } from '@/theme';

export type ProgressBarProps = {
  /** 0..1 */
  value: number;
  hue?: HueName;
  size?: 'sm' | 'md';
  accessibilityLabel?: string;
};

/** Rounded progress bar with the glossy highlight stripe. Springs to new values. */
export function ProgressBar({ value, hue = 'green', size = 'md', accessibilityLabel }: ProgressBarProps) {
  const t = useTheme();
  const styles = useStyles();
  const progress = useSharedValue(0);
  const clamped = Math.max(0, Math.min(1, value));

  useEffect(() => {
    progress.value = withSpring(clamped, t.motion.spring.standard);
  }, [clamped, progress, t.motion.spring.standard]);

  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const height = t.layout.bar[size];

  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2 }]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Animated.View
        style={[styles.fill, { backgroundColor: t.colors.hue[hue].base, borderRadius: height / 2 }, clamped > 0 && styles.nub, fill]}
      >
        {size === 'md' && <View style={styles.shine} />}
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  track: { flex: 1, backgroundColor: t.colors.fillStrong, overflow: 'hidden' },
  fill: { height: '100%', justifyContent: 'flex-start', paddingTop: t.space[1], paddingHorizontal: t.space[2] },
  /** Any progress at all shows as a rounded nub, never a sliver. */
  nub: { minWidth: t.layout.bar.md },
  shine: { height: t.space[1], borderRadius: t.radius.pill, backgroundColor: t.colors.shine },
}));
