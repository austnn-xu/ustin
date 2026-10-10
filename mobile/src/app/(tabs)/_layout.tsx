import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { FocusedScene } from '@/components/FocusedScene';
import { TabBar } from '@/components/TabBar';
import { TabTour } from '@/components/TabTour';
import { Deferred } from '@/components/ui';
import { useSettings } from '@/stores/settings';
import { useTheme } from '@/theme';

export default function TabsLayout() {
  const t = useTheme();
  const onboarded = useSettings((s) => s.onboarded);
  if (!onboarded) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      // Each tab draws its content as a transition, so switching to a tab never blocks the tap or the tab bar; and a tab
      // you are not looking at is skipped by the browser entirely (see FocusedScene).
      // The first visit to each tab gets Tin's tour of it (see TabTour).
      screenLayout={({ children, navigation, route }) => (
        <FocusedScene navigation={navigation}>
          <TabTour id={route.name} navigation={navigation}>
            <Deferred>{children}</Deferred>
          </TabTour>
        </FocusedScene>
      )}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: t.colors.bg } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Learn' }} />
      <Tabs.Screen name="scan" options={{ title: 'What bin?' }} />
      <Tabs.Screen name="nearby" options={{ title: 'Near me' }} />
      <Tabs.Screen name="shop" options={{ title: 'Shop' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
