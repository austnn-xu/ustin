import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Mascot } from '@/components/art/Mascot';
import { MascotSays } from '@/components/MascotSays';
import { LocationPicker } from '@/components/places/LocationPicker';
import { Button, ChoiceCard, Icon, PressableScale, ProgressBar, Screen, Text } from '@/components/ui';
import { lessons } from '@/lib/engine';
import { GOALS } from '@/lib/goals';
import { useSettings } from '@/stores/settings';
import { makeStyles, useTheme } from '@/theme';

const STEPS = 3;

/** First run: meet Tin, pick a daily goal, optionally set a location, then straight into lesson one. */
export default function Onboarding() {
  const t = useTheme();
  const styles = useStyles();
  const [step, setStep] = useState(0);
  const goal = useSettings((s) => s.dailyGoal);
  const setGoal = useSettings((s) => s.setDailyGoal);
  const place = useSettings((s) => s.place);
  const finish = useSettings((s) => s.finishOnboarding);

  const start = () => {
    finish();
    router.replace('/');
    router.push({ pathname: '/lesson/[id]', params: { id: lessons.LESSONS[0]!.id } });
  };

  const header =
    step > 0 ? (
      <View style={styles.header}>
        <PressableScale onPress={() => setStep((s) => s - 1)} accessibilityLabel="Back" hitSlop={t.space[2]}>
          <Icon icon={ChevronLeft} size="lg" color="textTertiary" />
        </PressableScale>
        <ProgressBar value={step / STEPS} accessibilityLabel="Setup progress" />
      </View>
    ) : undefined;

  if (step === 0) {
    return (
      <Screen
        footer={
          <View style={styles.buttons}>
            <Button label="Get started" fullWidth onPress={() => setStep(1)} />
            <Button
              label="Just look something up"
              variant="ghost"
              fullWidth
              onPress={() => {
                finish();
                router.replace('/scan');
              }}
            />
          </View>
        }
      >
        <View style={styles.center}>
          <Mascot mood="wow" size="xl" />
          <Text variant="display" hue="green" align="center">
            US Tin
          </Text>
          <Text variant="heading" align="center">
            {"Hi, I'm Tin! I'll teach you where everything goes, one bin at a time."}
          </Text>
          <Text variant="body" color="textSecondary" align="center">
            Five-minute lessons, real answers for 177 everyday things, and the nearest drop-off for anything that does not
            belong in a bin.
          </Text>
        </View>
      </Screen>
    );
  }

  if (step === 1) {
    return (
      <Screen header={header} scroll footer={<Button label="Continue" fullWidth onPress={() => setStep(2)} />}>
        <View style={styles.stack}>
          <MascotSays mood="happy">How much do you want to learn each day?</MascotSays>
          {GOALS.map((g) => (
            <ChoiceCard
              key={g.value}
              state={goal === g.value ? 'selected' : 'idle'}
              onPress={() => setGoal(g.value)}
              accessibilityLabel={`${g.label}, ${g.value} XP a day`}
              padding="lg"
            >
              <View style={styles.goalRow}>
                <Text variant="heading" style={styles.flex}>
                  {g.label}
                </Text>
                <Text variant="callout" color="textSecondary">{`${g.value} XP · ${g.blurb}`}</Text>
              </View>
            </ChoiceCard>
          ))}
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      header={header}
      scroll
      keyboard
      footer={
        <View style={styles.buttons}>
          <Button label={place ? 'Start my first lesson' : 'Skip for now'} variant={place ? 'primary' : 'neutral'} fullWidth onPress={start} />
        </View>
      }
    >
      <View style={styles.stack}>
        <MascotSays mood="thinking">
          {place
            ? `Got it: ${place.label}. I will look for drop-offs near there.`
            : 'Where do you live? I will find the nearest drop-off for anything you cannot put in a bin.'}
        </MascotSays>
        <LocationPicker />
        <Text variant="caption" color="textTertiary">
          Your location stays on this device. It is only sent to OpenStreetMap to find places near you.
        </Text>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: { flexDirection: 'row', alignItems: 'center', gap: t.space[4], paddingVertical: t.space[3] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.space[4] },
  stack: { gap: t.space[4], paddingTop: t.space[4] },
  buttons: { gap: t.space[2] },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  flex: { flex: 1 },
}));
