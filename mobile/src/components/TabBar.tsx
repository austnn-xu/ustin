import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { LucideIcon } from 'lucide-react-native';
import { House, MapPin, ScanSearch, Store, UserRound } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, PressableScale, Text } from '@/components/ui';
import { useScreenSize } from '@/lib/useScreenSize';
import { makeStyles, useTheme } from '@/theme';

const TABS: Record<string, { icon: LucideIcon; label: string }> = {
  index: { icon: House, label: 'Learn' },
  scan: { icon: ScanSearch, label: 'What bin?' },
  nearby: { icon: MapPin, label: 'Near me' },
  shop: { icon: Store, label: 'Shop' },
  profile: { icon: UserRound, label: 'Profile' },
};

/**
 * The tab bar. The active tab sits in a blue outlined tile that slides across to whichever tab you pick, so you see
 * where you went rather than a highlight blinking from one place to another; the new tab's icon hops as it lands.
 */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  // Five labels do not fit under 360px; the icons carry it there (each tab keeps its accessible name).
  const { narrow } = useScreenSize();
  const count = state.routes.filter((r) => TABS[r.name]).length;
  const [rowWidth, setRowWidth] = useState(0);
  const slot = (rowWidth - t.space[2] * 2) / Math.max(1, count);
  const x = useSharedValue(state.index);

  useEffect(() => {
    x.value = withSpring(state.index, t.motion.spring.standard);
  }, [state.index, x, t.motion.spring.standard]);

  // Build the other tabs quietly in the background once the app settles, one at a time and only when the browser is idle
  // (never during a scroll or a tap), so the first visit to each is instant.
  useEffect(() => {
    const names = state.routes.map((r) => r.name).filter((n) => TABS[n] && n !== state.routes[state.index]?.name);
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
        {state.routes.map((route, index) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const focused = state.index === index;
          return (
            <PressableScale
              key={route.key}
              haptic="selection"
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (focused || event.defaultPrevented) return;
                // Slide the highlight now, in the same frame as the tap, rather than after the screen has switched.
                x.value = withSpring(index, t.motion.spring.standard);
                navigation.navigate(route.name);
              }}
              style={styles.tab}
            >
              <TabIcon focused={focused}>
                <Icon icon={tab.icon} size="lg" hue={focused ? 'blue' : undefined} color="textTertiary" />
              </TabIcon>
              {!narrow && (
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

/** Hops and tilts the icon when its tab becomes the active one. */
function TabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  const t = useTheme();
  const hop = useSharedValue(0);
  useEffect(() => {
    if (focused) hop.value = withSequence(withSpring(1, t.motion.spring.snappy), withSpring(0, t.motion.spring.bouncy));
  }, [focused, hop, t.motion.spring]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -hop.value * t.space[1.5] }, { rotate: `${hop.value * -8}deg` }, { scale: 1 + hop.value * 0.12 }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
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
  /** Five tabs share the bar, so labels drop the label variant's caps and tracking to fit. */
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
