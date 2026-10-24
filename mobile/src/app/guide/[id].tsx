import { router, useLocalSearchParams } from 'expo-router';
import { Lightbulb, Wrench, X } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { DiyArt } from '@/components/art/DiyArt';
import { MascotSays } from '@/components/MascotSays';
import { Appear, Button, Card, Divider, Icon, PressableScale, ProgressBar, Screen, Text } from '@/components/ui';
import { lessons } from '@/lib/engine';
import { useScreenSize } from '@/lib/useScreenSize';
import { useProgress } from '@/stores/progress';
import { makeStyles, useTheme } from '@/theme';

/**
 * An optional hands-on guide, one illustrated step per screen: what to do, the drawing of it, and a tip where one
 * helps. The last screen collects the quick fixes and offers the short check, which plays like any lesson. None of it
 * is a stop on the route, so skipping it never locks anything.
 */
export default function GuideScreen() {
  const t = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const extra = id ? lessons.findExtra(id) : null;
  const { width } = useScreenSize();
  const checked = useProgress((s) => (extra ? s.lessons[extra.lesson] : undefined));
  const [step, setStep] = useState(0);
  const [forward, setForward] = useState(true);
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!extra) {
    return (
      <Screen>
        <View style={styles.missing}>
          <MascotSays mood="thinking" layout="above" size="lg">
            That guide does not exist. It may have moved when the course was updated.
          </MascotSays>
          <Button label="Back to the path" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }

  const last = extra.steps.length;
  const current = extra.steps[step];
  const go = (to: number) => {
    setForward(to > step);
    setStep(to);
  };
  const artSize = Math.min(width, t.layout.maxWidth) - t.layout.gutter * 2 - t.space[4] * 2;

  return (
    <Screen
      scroll
      header={
        <View style={styles.header}>
          <PressableScale onPress={leave} accessibilityLabel="Close guide" hitSlop={t.space[2]}>
            <Icon icon={X} size="lg" color="textTertiary" />
          </PressableScale>
          <View style={styles.flex}>
            <ProgressBar value={(step + 1) / (last + 1)} hue="brown" accessibilityLabel="Guide progress" />
          </View>
          <Text variant="label" hue="brown">
            Bonus
          </Text>
        </View>
      }
      footer={
        current ? (
          <View style={styles.footer}>
            {step > 0 && (
              <View style={styles.flex}>
                <Button label="Back" variant="neutral" fullWidth onPress={() => go(step - 1)} />
              </View>
            )}
            <View style={styles.grow}>
              <Button label={step + 1 === last ? 'Finish' : 'Next'} fullWidth onPress={() => go(step + 1)} />
            </View>
          </View>
        ) : (
          <View style={styles.stack}>
            <Button
              label={checked ? 'Retake the quick check' : 'Take the quick check'}
              fullWidth
              onPress={() => router.replace({ pathname: '/lesson/[id]', params: { id: extra.lesson } })}
            />
            <Button label="Done for now" variant="ghost" fullWidth onPress={leave} />
          </View>
        )
      }
    >
      {/* One beat per step: the page slides in from the side you are heading towards. */}
      <Appear key={step} from={forward ? 'right' : 'left'} spring="quick">
        {current ? (
          <View style={styles.stack}>
            <View style={[styles.artPanel, { backgroundColor: t.colors.hue.brown.subtle }]}>
              <DiyArt kind={current.art} size={artSize} />
            </View>
            <View style={styles.copy}>
              <Text variant="label" hue="brown">
                {`Step ${step + 1} of ${last}`}
              </Text>
              <Text variant="title">{current.title}</Text>
              <Text variant="body" color="textSecondary">
                {current.text}
              </Text>
            </View>
            {current.tip && (
              <Card>
                <View style={styles.row}>
                  <Icon icon={Lightbulb} hue="yellow" />
                  <Text variant="callout" style={styles.flex}>
                    {current.tip}
                  </Text>
                </View>
              </Card>
            )}
          </View>
        ) : (
          <View style={styles.stack}>
            <MascotSays mood="cheer" size="md">
              {`That's your bin! ${extra.steps.length} steps and no store-bought bin needed.`}
            </MascotSays>
            <Text variant="heading">If something seems off</Text>
            <Card padding="none">
              {extra.fixes.map((f, i) => (
                <View key={f.problem}>
                  {i > 0 && <Divider />}
                  <View style={[styles.row, styles.fix]}>
                    <Icon icon={Wrench} hue="brown" />
                    <View style={styles.flex}>
                      <Text variant="bodyStrong">{f.problem}</Text>
                      <Text variant="callout" color="textSecondary">
                        {f.fix}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
            <Text variant="caption" color="textTertiary">
              {`Source: ${extra.source}`}
            </Text>
          </View>
        )}
      </Appear>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: { flexDirection: 'row', alignItems: 'center', gap: t.space[4], paddingVertical: t.space[3] },
  footer: { flexDirection: 'row', gap: t.space[3] },
  stack: { gap: t.space[4] },
  copy: { gap: t.space[2] },
  artPanel: { borderRadius: t.radius.lg, padding: t.space[4], alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: t.space[3] },
  fix: { padding: t.space[4] },
  flex: { flex: 1 },
  grow: { flex: 2 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.space[6] },
}));
