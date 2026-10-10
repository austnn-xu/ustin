import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Lightbulb, TriangleAlert, Zap } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { BIN, BinArt } from '@/components/art/Bin';
import { ItemArt } from '@/components/art/ItemArt';
import { MascotSays } from '@/components/MascotSays';
import { Toast, type ToastProps } from '@/components/Toast';
import { Button, Card, ChoiceCard, Divider, Icon, PressableScale, ProgressBar, Screen, Text } from '@/components/ui';
import { ComponentRow } from '@/components/verdict/ComponentRow';
import { rules, type Answers, type CatalogObject } from '@/lib/engine';
import { haptics } from '@/lib/haptics';
import { KINDS, kindsForVerdict } from '@/lib/places';
import { useProgress } from '@/stores/progress';
import { makeStyles, useTheme } from '@/theme';

export default function ItemScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const object = id ? rules.findObject(id) : null;
  if (!object) return <MissingItem />;
  // Reading a guidebook is studying, not sorting a real item, so it earns no XP.
  return <ItemFlow key={object.id} object={object} record={from !== 'guide'} />;
}

const back = () => (router.canGoBack() ? router.back() : router.replace('/scan'));

function ItemFlow({ object, record }: { object: CatalogObject; record: boolean }) {
  const t = useTheme();
  const styles = useStyles();
  const questions = useMemo(() => rules.questionsFor(object), [object]);
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const asking = step < questions.length;

  const header = (
    <View style={styles.header}>
      <PressableScale onPress={back} accessibilityLabel="Back" hitSlop={t.space[2]}>
        <Icon icon={ChevronLeft} size="lg" color="textSecondary" />
      </PressableScale>
      {asking ? (
        <ProgressBar value={step / questions.length} hue="blue" accessibilityLabel="Questions answered" />
      ) : (
        <Text variant="heading" numberOfLines={1} style={styles.flex}>
          {object.label}
        </Text>
      )}
    </View>
  );

  if (asking) {
    const q = questions[step]!;
    return (
      <Screen header={header} scroll>
        <View style={styles.stack}>
          <View style={styles.itemHead}>
            <ItemArt objectId={object.id} size="md" />
            <Text variant="title" style={styles.flex}>
              {object.label}
            </Text>
          </View>
          <MascotSays mood="thinking" size="sm">
            {q.text}
          </MascotSays>
          <Text variant="body" color="textSecondary">
            {q.help}
          </Text>
          <View style={styles.options}>
            {q.options.map((o) => (
              <ChoiceCard
                key={o.value}
                state={answers[q.id] === o.value ? 'selected' : 'idle'}
                accessibilityLabel={o.label}
                padding="lg"
                onPress={() => {
                  setAnswers((a) => ({ ...a, [q.id]: o.value }));
                  setStep((s) => s + 1);
                }}
              >
                <Text variant="bodyStrong">{o.label}</Text>
              </ChoiceCard>
            ))}
          </View>
          <Button label="Not sure, skip" variant="ghost" fullWidth onPress={() => setStep((s) => s + 1)} />
        </View>
      </Screen>
    );
  }

  return (
    <Verdict
      object={object}
      answers={answers}
      record={record}
      header={header}
      onRedo={
        questions.length
          ? () => {
              setAnswers({});
              setStep(0);
            }
          : undefined
      }
    />
  );
}

type VerdictProps = { object: CatalogObject; answers: Answers; record: boolean; header: React.ReactNode; onRedo?: () => void };

function Verdict({ object, answers, record, header, onRedo }: VerdictProps) {
  const t = useTheme();
  const styles = useStyles();
  const verdict = useMemo(() => rules.resolve(object, answers), [object, answers]);
  const kinds = kindsForVerdict(verdict);
  const recordSort = useProgress((s) => s.recordSort);
  const [toast, setToast] = useState<ToastProps | null>(null);
  const recorded = useRef(false);

  // Looking up a real item counts towards XP and the streak.
  useEffect(() => {
    if (recorded.current || !record) return;
    recorded.current = true;
    const r = recordSort(object.id);
    haptics.success();
    if (r.xpEarned === 0) return;
    setToast({ icon: Zap, hue: 'yellow', title: `+${r.xpEarned} XP`, subtitle: r.isNew ? 'New item learned' : 'Sorted again' });
  }, [object.id, record, recordSort]);

  const headline = verdict.headline;
  const outcomes = [...new Set(verdict.components.map((c) => c.outcome.id))];
  const mixed = outcomes.length > 1;
  const curbside = outcomes.some((o) => o === 'recycle' || o === 'trash' || o === 'compost');
  const say = verdict.hazard
    ? 'Careful with this one! It must never go in a household bin.'
    : mixed
      ? `This one splits up: ${verdict.components.length} parts, ${outcomes.length} different bins.`
      : verdict.components.length > 1
        ? `All ${verdict.components.length} parts go in ${BIN[headline.id].phrase}.`
        : `Easy! This goes in ${BIN[headline.id].phrase}.`;

  return (
    <Screen
      header={header}
      scroll
      footer={
        <Button
          label={`Find nearest ${KINDS[kinds[0]!].label.toLowerCase()}`}
          icon={KINDS[kinds[0]!].icon}
          fullWidth
          onPress={() => router.push({ pathname: '/nearby', params: { kind: kinds[0], item: object.id } })}
        />
      }
    >
      <View style={styles.stack}>
        <View style={styles.hero}>
          <ItemArt objectId={object.id} size="lg" />
          <View style={styles.flex}>
            <Text variant="title">{object.label}</Text>
            <View style={styles.headline}>
              <BinArt outcome={headline.id} size={t.layout.icon.lg} />
              <Text variant="heading" hue={BIN[headline.id].hue}>
                {mixed ? 'Mixed: sort the parts' : headline.label}
              </Text>
            </View>
          </View>
        </View>

        <MascotSays mood={verdict.hazard ? 'worried' : 'cheer'} size="sm" pokeable>
          {say}
        </MascotSays>

        {verdict.hazard && (
          <Card variant="tinted" hue="red" style={styles.note}>
            <Icon icon={TriangleAlert} hue="red" shade="text" />
            <Text variant="bodyStrong" hue="red" style={styles.flex}>
              Do not put this in any household bin. It can start fires or poison water.
            </Text>
          </Card>
        )}

        <Card style={styles.parts}>
          {verdict.components.map((c, i) => (
            <View key={`${c.label}-${i}`} style={styles.stack}>
              {i > 0 && <Divider />}
              <ComponentRow component={c} showPart={verdict.components.length > 1} />
            </View>
          ))}
        </Card>

        {verdict.tip && (
          <Card variant="tinted" hue="yellow" style={styles.note}>
            <Icon icon={Lightbulb} hue="yellow" shade="text" />
            <Text variant="body" style={styles.flex}>
              {verdict.tip}
            </Text>
          </Card>
        )}

        {kinds.length > 1 && (
          <Text variant="label" color="textSecondary">
            The other parts
          </Text>
        )}
        <View style={styles.kinds}>
          {kinds.slice(1).map((k) => (
            <Button
              key={k}
              label={`Nearest ${KINDS[k].label.toLowerCase()}`}
              icon={KINDS[k].icon}
              variant="secondary"
              size="md"
              fullWidth
              onPress={() => router.push({ pathname: '/nearby', params: { kind: k, item: object.id } })}
            />
          ))}
        </View>

        {curbside && (
          <Text variant="caption" color="textTertiary">
            Curbside pickup is the easy route for recycling and trash. The map is for when you do not have it, or the
            bin is full.
          </Text>
        )}

        {onRedo && <Button label="Change my answers" variant="ghost" fullWidth onPress={onRedo} />}
        <Button label="Sort another item" variant="ghost" fullWidth onPress={() => router.replace('/scan')} />
      </View>
      {toast && <Toast {...toast} onHidden={() => setToast(null)} />}
    </Screen>
  );
}

function MissingItem() {
  const styles = useStyles();
  return (
    <Screen>
      <View style={styles.missing}>
        <MascotSays mood="thinking" size="lg" layout="above">
          I do not know that item. Try searching for it in What bin?
        </MascotSays>
        <Button label="Search items" variant="secondary" onPress={() => router.replace('/scan')} />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: { flexDirection: 'row', alignItems: 'center', gap: t.space[4], paddingVertical: t.space[3] },
  flex: { flex: 1 },
  stack: { gap: t.space[4] },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  options: { gap: t.space[3] },
  hero: { flexDirection: 'row', alignItems: 'center', gap: t.space[4], paddingTop: t.space[2] },
  headline: { flexDirection: 'row', alignItems: 'center', gap: t.space[2], marginTop: t.space[1] },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: t.space[3] },
  parts: { gap: t.space[4] },
  kinds: { gap: t.space[2] },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.space[6] },
}));
