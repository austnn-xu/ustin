import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { View } from 'react-native';
import { BIN, BinArt } from '@/components/art/Bin';
import { ItemArt, SECTION_HUE } from '@/components/art/ItemArt';
import { MascotSays } from '@/components/MascotSays';
import { Button, Card, Divider, Icon, PressableScale, Screen, Text } from '@/components/ui';
import { lessonState, unitProgress } from '@/lib/course';
import { lessons, rules } from '@/lib/engine';
import { useProgress } from '@/stores/progress';
import { makeStyles, useTheme } from '@/theme';

/** A unit's guidebook: every item on the shelf and where it goes, for reading before (or instead of) a lesson. */
export default function Guidebook() {
  const t = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const unit = id ? lessons.findUnit(id) : null;
  const records = useProgress((s) => s.lessons);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!unit) {
    return (
      <Screen>
        <View style={styles.missing}>
          <MascotSays mood="thinking" layout="above" size="lg">
            That guidebook does not exist.
          </MascotSays>
          <Button label="Back to the path" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }

  const hueName = SECTION_HUE[unit.id] ?? 'green';
  const hue = t.colors.hue[hueName];
  const progress = unitProgress(unit, records);
  const next = unit.lessons.find((l) => lessonState(l.id, records) === 'current');
  const objects = unit.lessons
    .filter((l) => !l.review)
    .flatMap((l) => l.objects)
    .map((oid) => rules.findObject(oid)!)
    .filter(Boolean);

  return (
    <Screen
      scroll
      header={
        <View style={styles.header}>
          <PressableScale onPress={back} accessibilityLabel="Back" hitSlop={t.space[2]}>
            <Icon icon={ChevronLeft} size="lg" color="textSecondary" />
          </PressableScale>
          <Text variant="heading">Guidebook</Text>
        </View>
      }
      footer={
        next ? (
          <Button
            label={next.review ? 'Start unit review' : 'Start next lesson'}
            fullWidth
            onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: next.id } })}
          />
        ) : undefined
      }
    >
      <View style={styles.stack}>
        <View style={[styles.banner, { backgroundColor: hue.base, borderBottomColor: hue.depth }]}>
          <Text variant="label" style={styles.onColor}>
            {`Unit ${unit.index + 1} · ${progress.done}/${progress.total} done`}
          </Text>
          <Text variant="display" style={styles.onColor}>
            {unit.title}
          </Text>
          <Text variant="bodyStrong" style={styles.onColor}>
            {unit.blurb}
          </Text>
        </View>

        <MascotSays mood="happy" size="sm">
          {`Here is everything on the ${unit.shelf.toLowerCase()} shelf. Tap any item to see every part and why.`}
        </MascotSays>

        <Card padding="none">
          {objects.map((o, i) => {
            const v = rules.resolve(o, {});
            const asks = rules.questionsFor(o).length > 0;
            // "Split" in the engine also means several materials in one bin; here only several bins matters.
            const bins = [...new Set(v.components.map((c) => c.outcome.id))];
            return (
              <View key={o.id}>
                {i > 0 && <Divider />}
                <PressableScale
                  scale={false}
                  onPress={() => router.push({ pathname: '/item/[id]', params: { id: o.id, from: 'guide' } })}
                  accessibilityLabel={`${o.label}: ${bins.length > 1 ? 'several bins' : v.headline.label}`}
                  style={styles.row}
                >
                  <ItemArt objectId={o.id} size="sm" />
                  <View style={styles.flex}>
                    <Text variant="bodyStrong">{o.label}</Text>
                    <Text variant="caption" color="textSecondary">
                      {bins.length > 1 ? 'Several bins: sort the parts' : asks ? `${BIN[v.headline.id].short}, usually` : BIN[v.headline.id].short}
                    </Text>
                  </View>
                  <View style={styles.bins}>
                    {bins.map((oid) => (
                      <BinArt key={oid} outcome={oid} size={t.layout.icon.lg} />
                    ))}
                  </View>
                </PressableScale>
              </View>
            );
          })}
        </Card>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: { flexDirection: 'row', alignItems: 'center', gap: t.space[4], paddingVertical: t.space[3] },
  stack: { gap: t.space[4] },
  banner: { gap: t.space[1], padding: t.space[5], borderRadius: t.radius.lg, borderBottomWidth: t.layout.depth.md },
  onColor: { color: t.colors.onColor },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space[3], padding: t.space[3] },
  flex: { flex: 1 },
  bins: { flexDirection: 'row', gap: t.space[1] },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.space[6] },
}));
