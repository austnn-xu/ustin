import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { LucideIcon } from 'lucide-react-native';
import { House, ScanSearch, Settings, Swords } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, PressableScale, Text } from '@/components/ui';
import { useScreenSize } from '@/lib/useScreenSize';
import { makeStyles, useTheme } from '@/theme';

/**
 * Four tabs. Two of them hold a pair of screens, switched at the top of the screen (see SectionSwitch): What bin? also
 * holds Near me, and Settings holds your profile and the shop. Fewer, bigger targets; every screen still has its own
 * route, so links like /nearby or /shop keep working.
 */
const TABS: { name: string; icon: LucideIcon; label: string; also?: string[] }[] = [
  { name: 'index', icon: House, label: 'Learn' },
  { name: 'arena', icon: Swords, label: 'Arena' },
  { name: 'scan', icon: ScanSearch, label: 'What bin?', also: ['nearby'] },
  { name: 'profile', icon: Settings, label: 'Settings', also: ['shop'] },
];

const tabOf = (route: string | undefined) => Math.max(0, TABS.findIndex((tab) => tab.name === route || tab.also?.includes(route ?? '')));

/**
 * The tab bar. The active tab sits in a blue outlined tile that slides across to whichever tab you pick, so you see
 * where you went rather than a highlight blinking from one place to another. That one slide is the only motion: you
 * switch tabs constantly.
 */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { narrow } = useScreenSize();
  const count = TABS.length;
  const [rowWidth, setRowWidth] = useState(0);
  const slot = (rowWidth - t.space[2] * 2) / Math.max(1, count);
  // On the narrowest phones the icons carry it; each tab keeps its accessible name.
  const labels = !narrow && (rowWidth === 0 || slot >= t.layout.tabLabelMin);
  const current = tabOf(state.routes[state.index]?.name);
  const x = useSharedValue(current);

  useEffect(() => {
    x.value = withSpring(current, t.motion.spring.standard);
  }, [current, x, t.motion.spring.standard]);

  // Build the other tabs quietly in the background once the app settles, one at a time and only when the browser is idle
  // (never during a scroll or a tap), so the first visit to each is instant.
  useEffect(() => {
    const names = TABS.flatMap((tab) => [tab.name, ...(tab.also ?? [])]).filter((n) => n !== state.routes[state.index]?.name);
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const whenIdle = (fn: () => void) =>
      typeof requestIdleCallback === 'function' ? requestIdleCallback(fn, { timeout: t.motion.preloadAfter * 4 }) : fn();
    const next = (i: number) => {
      if (cancelled || i >= names.length) return;
      whenIdle(() => {
        if (cancelled) return;
        navigation.preload(names[i]!);
        timer = setTimeout(() => next(i + 1), t.motion.preloadGap);
      });
    };
    timer = setTimeout(() => next(0), t.motion.preloadAfter);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // Once per app start: preloaded tabs stay built.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * slot }] }));

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, t.space[2]) }]}>
      <View style={styles.row} onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}>
        {rowWidth > 0 && <Animated.View style={[styles.pill, { width: slot - t.space[1] }, pill]} pointerEvents="none" />}
        {TABS.map((tab, index) => {
          const route = state.routes.find((r) => r.name === tab.name);
          if (!route) return null;
          const focused = current === index;
          return (
            <PressableScale
              key={route.key}
              haptic="selection"
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                // Already here (on either screen of the pair): stay put.
                if (focused || event.defaultPrevented) return;
                // Slide the highlight now, in the same frame as the tap, rather than after the screen has switched.
                x.value = withSpring(index, t.motion.spring.standard);
                navigation.navigate(route.name);
              }}
              style={styles.tab}
            >
              <Icon icon={tab.icon} size="lg" hue={focused ? 'blue' : undefined} color="textTertiary" />
              {labels && (
                <Text variant="label" hue={focused ? 'blue' : undefined} color="textTertiary" numberOfLines={1} style={styles.label}>
                  {tab.label}
                </Text>
              )}
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  bar: {
    backgroundColor: t.colors.bg,
    borderTopWidth: t.layout.border,
    borderTopColor: t.colors.border,
    paddingTop: t.space[2],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: t.layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: t.space[2],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: t.space[0.5],
    paddingVertical: t.space[1.5],
    marginHorizontal: t.space[0.5],
  },
  /** Six tabs share the bar, so labels drop the label variant's caps and tracking to fit. */
  label: { textTransform: 'none', letterSpacing: 0 },
  pill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: t.space[2] + t.space[0.5],
    borderRadius: t.radius.md,
    borderWidth: t.layout.border,
    borderColor: t.colors.hue.blue.base,
    backgroundColor: t.colors.hue.blue.subtle,
  },
}));
