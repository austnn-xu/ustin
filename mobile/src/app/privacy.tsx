import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { View } from 'react-native';
import { Card, Icon, PressableScale, Screen, Text } from '@/components/ui';
import { makeStyles, useTheme } from '@/theme';

/** Plain-language privacy and "how to read the answers" page. Keep it true to SECURITY.md. */
const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'What stays on your phone',
    body: [
      'Your progress (XP, streak, lessons, coins, Tin’s outfit) and settings (theme, daily goal, saved ZIP code or approximate location) are stored on this device only. Reset progress in Settings clears them.',
      'US Tin has no email sign-up, no password, no ads and no analytics or tracking.',
    ],
  },
  {
    title: 'Photos',
    body: ['When you look up an item with a photo (web version), the photo is read on your device. It is never uploaded.'],
  },
  {
    title: 'Your location',
    body: [
      'A ZIP code or your location is used only to find nearby drop-off places. It is sent to OpenStreetMap services (Zippopotam, Nominatim and Overpass) to look up coordinates and places, and nowhere else. Those services have their own privacy policies.',
    ],
  },
  {
    title: 'The leaderboard',
    body: [
      'When the online Arena is available and you pick a name, that name, your Tin’s paint colour, your match scores and any game PINs you host are stored with an anonymous account so others can see the board. No email or real name is needed, so please do not use one.',
      'To delete all of it, go to Arena, tap your name, then Remove me from the leaderboard. Your matches, PINs and the anonymous account are erased.',
    ],
  },
  {
    title: 'Reading the answers',
    body: [
      'US Tin gives general guidance based on common US recycling practice. Rules differ between towns and haulers, so when your local program says something different, follow your local program.',
      'Map results come from OpenStreetMap, which anyone can edit. Call ahead before you drive somewhere.',
    ],
  },
  {
    title: 'Questions or problems',
    body: ['Open an issue, or report a security problem privately, at github.com/austnn-xu/ustin.'],
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
