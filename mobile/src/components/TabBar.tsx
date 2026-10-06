import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { LucideIcon } from 'lucide-react-native';
import { House, MapPin, ScanSearch, Store, UserRound } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, PressableScale, Text } from '@/components/ui';
import { makeStyles, useTheme } from '@/theme';

const TABS: Record<string, { icon: LucideIcon; label: string }> = {
  index: { icon: House, label: 'Learn' },
  scan: { icon: ScanSearch, label: 'What bin?' },
  nearby: { icon: MapPin, label: 'Near me' },
  shop: { icon: Store, label: 'Shop' },
  profile: { icon: UserRound, label: 'Profile' },
};

/** Duolingo-style tab bar: the active tab gets a blue outlined tile. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, t.space[2]) }]}>
      <View style={styles.row}>
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
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={[styles.tab, focused && styles.active]}
            >
              <Icon icon={tab.icon} size="lg" hue={focused ? 'blue' : undefined} color="textTertiary" />
              <Text variant="label" hue={focused ? 'blue' : undefined} color="textTertiary" numberOfLines={1} style={styles.label}>
                {tab.label}
              </Text>
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
    borderRadius: t.radius.md,
    borderWidth: t.layout.border,
    borderColor: 'transparent',
  },
  /** Five tabs share the bar, so labels drop the label variant's caps and tracking to fit. */
  label: { textTransform: 'none', letterSpacing: 0 },
  active: { borderColor: t.colors.hue.blue.base, backgroundColor: t.colors.hue.blue.subtle },
}));
