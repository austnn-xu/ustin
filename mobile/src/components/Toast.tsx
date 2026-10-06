import type { LucideIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, Text } from '@/components/ui';
import { makeStyles, useTheme, type HueName } from '@/theme';

export type ToastProps = { icon: LucideIcon; hue: HueName; title: string; subtitle?: string; onHidden?: () => void };

/** A reward toast that drops in from the top, holds, and leaves on its own. */
export function Toast({ icon, hue, title, subtitle, onHidden }: ToastProps) {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const y = useSharedValue(-1);

  useEffect(() => {
    y.value = withSequence(
      withSpring(0, t.motion.spring.bouncy),
      withDelay(
        t.motion.toastHold,
        withSpring(-1, t.motion.spring.standard, (finished) => {
          if (finished && onHidden) runOnJS(onHidden)();
        }),
      ),
    );
  }, [y, onHidden, t.motion.spring.bouncy, t.motion.spring.standard, t.motion.toastHold]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value * (t.space[20] + insets.top) }] }));

  return (
    <Animated.View style={[styles.wrap, { top: insets.top + t.space[2] }, style]} pointerEvents="none" accessibilityLiveRegion="polite">
      <View style={[styles.toast, { borderColor: t.colors.hue[hue].base }]}>
        <Icon icon={icon} hue={hue} filled size="lg" />
        <View>
          <Text variant="bodyStrong" hue={hue}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="caption" color="textSecondary">
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space[3],
    paddingVertical: t.space[3],
    paddingHorizontal: t.space[4],
    borderRadius: t.radius.lg,
    borderWidth: t.layout.border,
    backgroundColor: t.colors.surfaceRaised,
    ...t.shadow.md,
  },
}));
