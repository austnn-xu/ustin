import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { TabBar } from '@/components/TabBar';
import { useSettings } from '@/stores/settings';
import { useTheme } from '@/theme';

export default function TabsLayout() {
  const t = useTheme();
  const onboarded = useSettings((s) => s.onboarded);
  if (!onboarded) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
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
