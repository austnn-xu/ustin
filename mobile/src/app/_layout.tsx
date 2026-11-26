import { BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold, useFonts } from '@expo-google-fonts/bricolage-grotesque';
import { PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FocusedScene } from '@/components/FocusedScene';
import { MascotSays } from '@/components/MascotSays';
import { Button, Screen } from '@/components/ui';
import { persistOptions, queryClient } from '@/lib/queryCache';
import { useProgress } from '@/stores/progress';
import { useSettings } from '@/stores/settings';
import { makeStyles, ThemeProvider, useTheme } from '@/theme';
import { View } from 'react-native';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** If anything throws while drawing, show Tin and a way to try again instead of a blank page. */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <CrashScreen retry={retry} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function CrashScreen({ retry }: { retry: () => Promise<void> }) {
  const styles = useCrashStyles();
  return (
    <Screen>
      <View style={styles.wrap}>
        <MascotSays mood="worried" size="lg" layout="above">
          Oops, something tipped over. Your progress is safe. Let's try that again.
        </MascotSays>
        <Button label="Try again" fullWidth onPress={() => void retry()} />
      </View>
    </Screen>
  );
}

const useCrashStyles = makeStyles((t) => ({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: t.space[6] },
}));


/** Progress and settings live in AsyncStorage; wait for both so the first frame is never a reset-looking app. */
function useHydrated() {
  const [ready, setReady] = useState(() => useSettings.persist.hasHydrated() && useProgress.persist.hasHydrated());
  useEffect(() => {
    const check = () => setReady(useSettings.persist.hasHydrated() && useProgress.persist.hasHydrated());
    const a = useSettings.persist.onFinishHydration(check);
    const b = useProgress.persist.onFinishHydration(check);
    check();
    return () => {
      a();
      b();
    };
  }, []);
  return ready;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const hydrated = useHydrated();
  const ready = (fontsLoaded || !!fontError) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* Fetched data is kept between launches (an allowlist of public data; see queryCache.ts). */}
        <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
          <ThemeProvider>
            <ThemedStack />
          </ThemeProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedStack() {
  const t = useTheme();
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(t.colors.bg).catch(() => {});
  }, [t.colors.bg]);
  return (
    <>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.colors.bg } }}
        // The screen under a lesson or an item stays mounted; let the browser skip it while it is covered.
        screenLayout={({ children, navigation }) => <FocusedScene navigation={navigation}>{children}</FocusedScene>}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lesson/[id]" options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="match" options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="leaderboard" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="pin/[code]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="item/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="unit/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="guide/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="privacy" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
      </Stack>
    </>
  );
}
