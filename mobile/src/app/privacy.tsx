import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { View } from 'react-native';
import { Card, Icon, PressableScale, Screen, Text } from '@/components/ui';
import { makeStyles, useTheme } from '@/theme';

/** Plain-language privacy and "how to read the answers" page. Keep it true to SECURITY.md. */
const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'On your phone',
    body: ['Your progress and settings live on this device. No sign-up, no ads, no tracking.'],
  },
  {
    title: 'Photos',
    body: ['Read on your device. Never uploaded.'],
  },
  {
    title: 'Location',
    body: ['Sent only to OpenStreetMap, to find places near you.'],
  },
  {
    title: 'Leaderboard',
    body: [
      'If you join, your rolled name, Tin\u2019s look and your scores are shared. No email, no real name.',
      'Arena \u2192 your name \u2192 Remove me erases it all.',
    ],
  },
  {
    title: 'The answers',
    body: ['General US guidance. Rules vary by town, so yours wins. Map places can be out of date, so call ahead.'],
  },
  {
    title: 'Questions?',
    body: ['github.com/austnn-xu/ustin'],
  },
];

export default function Privacy() {
  const t = useTheme();
  const styles = useStyles();
  return (
    <Screen
      scroll
      header={
        <View style={styles.header}>
          <PressableScale
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
            accessibilityLabel="Back"
            accessibilityRole="button"
            hitSlop={t.space[2]}
          >
            <Icon icon={ChevronLeft} size="lg" color="textSecondary" />
          </PressableScale>
          <Text variant="title" accessibilityRole="header" style={styles.flex}>
            Privacy and about
          </Text>
        </View>
      }
    >
      <View style={styles.stack}>
        {SECTIONS.map((s) => (
          <Card key={s.title} padding="lg" style={styles.gap}>
            <Text variant="heading" accessibilityRole="header">
              {s.title}
            </Text>
            {s.body.map((p) => (
              <Text key={p} variant="body" color="textSecondary">
                {p}
              </Text>
            ))}
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: { flexDirection: 'row', alignItems: 'center', gap: t.space[2], paddingVertical: t.space[3] },
  flex: { flex: 1 },
  stack: { gap: t.space[4], paddingTop: t.space[2], paddingBottom: t.space[6] },
  gap: { gap: t.space[3] },
}));
