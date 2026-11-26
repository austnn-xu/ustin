import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useMemo, useState, useTransition } from 'react';
import { View } from 'react-native';
import { BIN, BinArt } from '@/components/art/Bin';
import { Mascot, type Mood } from '@/components/art/Mascot';
import { ItemCard } from '@/components/lesson/ItemCard';
import { MascotSays } from '@/components/MascotSays';
import { LocationPicker } from '@/components/places/LocationPicker';
import { Appear, Button, Card, ChoiceCard, Icon, PressableScale, ProgressBar, Screen, Text } from '@/components/ui';
import { lessons, rules, type OutcomeId } from '@/lib/engine';
import { GOALS } from '@/lib/goals';
import { haptics } from '@/lib/haptics';
import { useScreenSize } from '@/lib/useScreenSize';
import { XP } from '@/stores/progress';
import { useSettings, type DailyGoal } from '@/stores/settings';
import { makeStyles, useTheme } from '@/theme';

/**
 * First run, one idea per screen:
 *   hello  — meet Tin
 *   try    — a real question to answer (a takeaway coffee cup), so the point of the app is felt, not described
 *   goal   — how much time a day, in minutes
 *   place  — where you live, for drop-offs (optional)
 *   ready  — exactly what happens next, then straight into lesson one
 * Steps slide in the direction you are going: forward from the right, back from the left. That slide is each step's
 * only motion; the coffee-cup reveal is the one sequence, because it is the point of the whole first run.
 */
const STEPS = ['hello', 'try', 'goal', 'place', 'ready'] as const;
type Step = (typeof STEPS)[number];

/** The cup is the demo because it is the problem in one object: three materials, three destinations. */
const DEMO_ID = 'coffee-cup';
const DEMO_BINS: OutcomeId[] = ['recycle', 'compost', 'trash'];
/** A lesson is about five minutes; a goal is so many lessons a day. */
const MINUTES_PER_LESSON = 5;

export default function Onboarding() {
  const t = useTheme();
  const styles = useStyles();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [pick, setPick] = useState<OutcomeId | null>(null);
  const place = useSettings((s) => s.place);
  const finish = useSettings((s) => s.finishOnboarding);
  const step: Step = STEPS[index]!;

  // Each step builds as a transition, so the button press and the slide never stall behind the render.
  const [pending, startTransition] = useTransition();
  const go = (to: number) => {
    if (pending) return;
    startTransition(() => {
      setDir(to > index ? 1 : -1);
      setIndex(to);
    });
  };

  const start = () => {
    finish();
    router.replace('/');
    router.push({ pathname: '/lesson/[id]', params: { id: lessons.LESSONS[0]!.id } });
  };

  const header =
    index > 0 ? (
      <View style={styles.header}>
        <PressableScale onPress={() => go(index - 1)} accessibilityLabel="Back" hitSlop={t.space[2]} haptic="selection">
          <Icon icon={ChevronLeft} size="lg" color="textTertiary" />
        </PressableScale>
        <ProgressBar value={index / (STEPS.length - 1)} accessibilityLabel={`Setup, step ${index} of ${STEPS.length - 1}`} />
      </View>
    ) : undefined;

  const next = <Button label="Continue" fullWidth onPress={() => go(index + 1)} />;
  const footer =
    step === 'hello' ? (
      <View style={styles.buttons}>
        <Button label="Let's go" fullWidth onPress={() => go(1)} />
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
    ) : step === 'try' ? (
      pick ? next : <Button label="Pick a bin" fullWidth disabled />
    ) : step === 'place' ? (
      <Button label={place ? 'Continue' : 'Skip for now'} variant={place ? 'primary' : 'neutral'} fullWidth onPress={() => go(index + 1)} />
    ) : step === 'ready' ? (
      <Button label="Start lesson 1" fullWidth onPress={start} />
    ) : (
      next
    );

  return (
    <Screen header={header} scroll keyboard={step === 'place'} footer={footer}>
      <Appear key={step} from={dir > 0 ? 'right' : 'left'} style={styles.grow}>
        {step === 'hello' && <Hello />}
        {step === 'try' && <TryIt pick={pick} onPick={setPick} />}
        {step === 'goal' && <Goal />}
        {step === 'place' && <Place />}
        {step === 'ready' && <Ready />}
      </Appear>
    </Screen>
  );
}

function Hello() {
  const styles = useStyles();
  const { short } = useScreenSize();
  return (
    <View style={styles.center}>
      <Mascot mood="happy" size={short ? 'md' : 'xl'} wave pokeable />
      <Appear index={2}>
        <Text variant="display" hue="green" align="center">
          {"Hi, I'm Tin!"}
        </Text>
      </Appear>
      <Appear index={3}>
        <Text variant="heading" color="textSecondary" align="center">
          {"Let's learn what goes where."}
        </Text>
      </Appear>
    </View>
  );
}

/** A real question with a twist: the cup is three things. Whatever you pick, the reveal teaches the whole idea. */
function TryIt({ pick, onPick }: { pick: OutcomeId | null; onPick: (outcome: OutcomeId) => void }) {
  const t = useTheme();
  const styles = useStyles();
  const { short } = useScreenSize();
  const obj = rules.findObject(DEMO_ID)!;
  const verdict = useMemo(() => rules.resolve(obj), [obj]);
  const item = { objectId: obj.id, label: obj.label, part: null, material: null, scenario: [] };

  const right = pick ? verdict.components.filter((c) => c.outcome.id === pick) : [];
  const rest = pick ? verdict.components.filter((c) => c.outcome.id !== pick) : [];
  const reveal = !pick
    ? null
    : right.length === 0
      ? `Ooh, not quite. It's ${verdict.components.length} things!`
      : rest.length === 0
        ? 'Yes! You know your bins.'
        : `Close! It's ${verdict.components.length} things.`;

  return (
    <View style={styles.stack}>
      <MascotSays mood={pick ? (right.length ? 'wow' : 'worried') : 'thinking'} size="sm" typing>
        {reveal ?? 'Coffee done. Where does the cup go?'}
      </MascotSays>
      <ItemCard item={item} />

      {!pick ? (
        <View style={styles.grid}>
          {DEMO_BINS.map((o) => (
            <View key={o} style={styles.third}>
              <ChoiceCard
                accessibilityLabel={BIN[o].short}
                onPress={() => {
                  haptics.medium();
                  onPick(o);
                }}
                style={styles.grow}
              >
                <View style={styles.binChoice}>
                  <BinArt outcome={o} size={short ? t.layout.art.sm : t.layout.art.md} />
                  <Text variant="bodyStrong" align="center">
                    {BIN[o].short}
                  </Text>
                </View>
              </ChoiceCard>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.stack}>
          {verdict.components.map((c, i) => {
            const bin = BIN[c.outcome.id];
            return (
              // The payoff of the first run: the cup comes apart one part at a time.
              <Appear key={c.label} index={1 + i * 2}>
                <Card style={styles.part}>
                  <BinArt outcome={c.outcome.id} size={t.layout.art.sm} />
                  <View style={styles.flex}>
                    <View style={styles.partHead}>
                      <Text variant="bodyStrong" style={styles.flex}>
                        {c.label}
                      </Text>
                      <Text variant="callout" hue={bin.hue}>
                        {bin.short}
                      </Text>
                    </View>
                    <Text variant="caption" color="textSecondary">
                      {c.why}
                    </Text>
                  </View>
                </Card>
              </Appear>
            );
          })}
          <Appear index={1 + verdict.components.length * 2}>
            <Card variant="tinted" hue="green" style={styles.lessonNote}>
              <Text variant="bodyStrong" hue="green">
                {verdict.tip ?? 'One object, several materials.'}
              </Text>
            </Card>
          </Appear>
        </View>
      )}
    </View>
  );
}

const GOAL_MOOD: Record<DailyGoal, Mood> = { 10: 'happy', 20: 'happy', 30: 'cheer', 50: 'wow' };

function Goal() {
  const styles = useStyles();
  const goal = useSettings((s) => s.dailyGoal);
  const setGoal = useSettings((s) => s.setDailyGoal);
  return (
    <View style={styles.stack}>
      <MascotSays mood={GOAL_MOOD[goal]} size="sm">
        How much time a day?
      </MascotSays>
      {GOALS.map((g) => {
        const minutes = (g.value / XP.lesson) * MINUTES_PER_LESSON;
        return (
          <ChoiceCard
            key={g.value}
            state={goal === g.value ? 'selected' : 'idle'}
            onPress={() => setGoal(g.value)}
            accessibilityLabel={`${g.label}, about ${minutes} minutes a day, ${g.blurb}`}
            padding="lg"
          >
            <View style={styles.goalRow}>
              <View style={styles.flex}>
                <Text variant="heading">{g.label}</Text>
                <Text variant="callout" color="textSecondary">
                  {g.blurb}
                </Text>
              </View>
              <Text variant="bodyStrong" hue={goal === g.value ? 'blue' : undefined} color="textSecondary">
                {`${minutes} min`}
              </Text>
            </View>
          </ChoiceCard>
        );
      })}
    </View>
  );
}

function Place() {
  const styles = useStyles();
  const place = useSettings((s) => s.place);
  return (
    <View style={styles.stack}>
      <MascotSays mood={place ? 'cheer' : 'thinking'} size="sm">
        {place
          ? `${place.label}. Got it!`
          : "Where are you? I'll find drop-offs nearby."}
      </MascotSays>
      <LocationPicker />
      <Text variant="caption" color="textTertiary">
        Only used to find places near you.
      </Text>
    </View>
  );
}

function Ready() {
  const t = useTheme();
  const styles = useStyles();
  const { short } = useScreenSize();
  const first = lessons.LESSONS[0]!;
  const unit = lessons.findUnit(first.unit);
  const names = first.objects.map((id) => rules.findObject(id)?.label).filter(Boolean) as string[];

  return (
    <View style={styles.stack}>
      <View style={styles.readyHead}>
        <Mascot mood="cheer" size={short ? 'sm' : 'md'} pokeable />
        <Text variant="display" hue="green" style={styles.flex}>
          {"You're all set!"}
        </Text>
      </View>

      <Card style={styles.firstStop}>
        <Text variant="label" color="textTertiary">
          First stop
        </Text>
        <Text variant="heading">{unit?.title ?? first.title}</Text>
        <Text variant="callout" color="textSecondary">
          {names.join(' · ')}
        </Text>
        <Text variant="callout" hue="yellow">{`${MINUTES_PER_LESSON} min · +${XP.lesson} XP`}</Text>
      </Card>

    </View>
  );
}

const useStyles = makeStyles((t) => ({
  header: { flexDirection: 'row', alignItems: 'center', gap: t.space[4], paddingVertical: t.space[3] },
  grow: { flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.space[4] },
  stack: { gap: t.space[4], paddingTop: t.space[4] },
  buttons: { gap: t.space[2] },
  flex: { flex: 1 },
  grid: { flexDirection: 'row', gap: t.space[3] },
  third: { flex: 1 },
  binChoice: { alignItems: 'center', justifyContent: 'center', gap: t.space[2], minHeight: t.space[20] },
  part: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  partHead: { flexDirection: 'row', alignItems: 'center', gap: t.space[2] },
  lessonNote: { gap: t.space[1] },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  readyHead: { flexDirection: 'row', alignItems: 'center', gap: t.space[4] },
  firstStop: { gap: t.space[1] },
}));
