import { router } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronLeft, House, MapPin, ScanSearch, Store } from 'lucide-react-native';
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
import { visionSupported } from '@/lib/vision';
import { useScreenSize } from '@/lib/useScreenSize';
import { XP } from '@/stores/progress';
import { useSettings, type DailyGoal } from '@/stores/settings';
import { makeStyles, useTheme, type HueName } from '@/theme';

/**
 * First run, one idea per screen:
 *   hello  — meet Tin
 *   try    — a real question to answer (a takeaway coffee cup), so the point of the app is felt, not described
 *   how    — the three things the app does, in plain words
 *   goal   — how much time a day, in minutes
 *   place  — where you live, for drop-offs (optional)
 *   ready  — exactly what happens next, then straight into lesson one
 * Steps slide in the direction you are going: forward from the right, back from the left. That slide is each step's
 * only motion; the coffee-cup reveal is the one sequence, because it is the point of the whole first run.
 */
const STEPS = ['hello', 'try', 'how', 'goal', 'place', 'ready'] as const;
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
          label="I just need to look something up"
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
      <Button label="Start my first lesson" fullWidth onPress={start} />
    ) : (
      next
    );

  return (
    <Screen header={header} scroll keyboard={step === 'place'} footer={footer}>
      <Appear key={step} from={dir > 0 ? 'right' : 'left'} style={styles.grow}>
        {step === 'hello' && <Hello />}
        {step === 'try' && <TryIt pick={pick} onPick={setPick} />}
        {step === 'how' && <HowItWorks />}
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
        <Text variant="heading" align="center">
          {"I'll teach you where everything goes, one bin at a time."}
        </Text>
      </Appear>
      <Appear index={4}>
        <Text variant="body" color="textSecondary" align="center">
          A minute of setup, a quick quiz, then your first five-minute lesson.
        </Text>
      </Appear>
      <Appear index={5}>
        <Text variant="caption" color="textTertiary" align="center">
          (Psst: you can tap me.)
        </Text>
      </Appear>
    </View>
  );
}

/** "the lid", "the lid and the sleeve", "the lid, the sleeve and the cup body". */
const theParts = (labels: string[]) => {
  const parts = labels.map((l) => `the ${l.toLowerCase()}`);
  return parts.length <= 1 ? (parts[0] ?? '') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
};

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
      ? `Not this one! No part of it goes in ${BIN[pick].phrase}. Here's the trick: it's ${verdict.components.length} things.`
      : `Partly right! ${capitalise(theParts(right.map((c) => c.label)))} ${right.length === 1 ? 'goes' : 'go'} in ${BIN[pick].phrase}, but ${theParts(rest.map((c) => c.label))} ${rest.length === 1 ? "doesn't" : "don't"}.`;

  return (
    <View style={styles.stack}>
      <MascotSays mood={pick ? (right.length ? 'wow' : 'worried') : 'thinking'} size="sm" typing>
        {reveal ?? 'Quick one. You just finished a coffee. Where does the cup go?'}
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
              <Text variant="caption" hue="green">
                {"That's what I teach: where each part goes, and why. Most people get this one wrong, so you're already ahead."}
              </Text>
            </Card>
          </Appear>
        </View>
      )}
    </View>
  );
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const WAYS: { icon: LucideIcon; hue: HueName; title: string; body: string }[] = [
  {
    icon: House,
    hue: 'green',
    title: 'Learn on the route',
    body: 'Five-minute lessons. Each bin on the road is one stop; finish it and the truck drives on to the next.',
  },
  {
    icon: ScanSearch,
    hue: 'blue',
    title: 'What bin?',
    body: visionSupported
      ? 'Holding something right now? Type it or snap a photo, and I will tell you where each part goes.'
      : 'Holding something right now? Look it up and I will tell you where each part goes.',
  },
  {
    icon: MapPin,
    hue: 'orange',
    title: 'Near me',
    body: 'Batteries, paint, old phones: I will find the nearest place that takes them, on a map.',
  },
  {
    icon: Store,
    hue: 'purple',
    title: 'Shop',
    body: 'Right answers earn coins. Spend them on hats, glasses and paint jobs for me.',
  },
];

function HowItWorks() {
  const t = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.stack}>
      <MascotSays mood="happy" size="sm">
        Here is what is inside. I will show you around each one the first time you open it.
      </MascotSays>
      {WAYS.map((w) => (
        <Card key={w.title} style={styles.way}>
          <View style={[styles.wayIcon, { backgroundColor: t.colors.hue[w.hue].subtle }]}>
            <Icon icon={w.icon} hue={w.hue} size="lg" />
          </View>
          <View style={styles.flex}>
            <Text variant="heading">{w.title}</Text>
            <Text variant="callout" color="textSecondary">
              {w.body}
            </Text>
          </View>
        </Card>
      ))}
      <Card variant="tinted" hue="green">
        <Text variant="bodyStrong" hue="green">
          Mistakes are free.
        </Text>
        <Text variant="caption" hue="green">
          No hearts, no lives. Get one wrong and I show you why, then it comes back once at the end so you can nail it.
        </Text>
      </Card>
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
        How much time can you give me each day?
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
      <Text variant="caption" color="textTertiary" align="center">
        You can change this any time in Profile.
      </Text>
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
          ? `Got it: ${place.label}. I will look for drop-offs near there.`
          : 'Where do you live? Some things, like batteries, cannot go in any bin, so I will find the nearest drop-off.'}
      </MascotSays>
      <LocationPicker />
      <Text variant="caption" color="textTertiary">
        Your location stays on this device. It is only sent to OpenStreetMap to find places near you.
      </Text>
    </View>
  );
}

const LESSON_STEPS = [
  { n: '1', text: 'Tap the answer you think is right' },
  { n: '2', text: 'Tap Check' },
  { n: '3', text: 'Read why. That part is the lesson' },
];

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
          Your first stop
        </Text>
        <Text variant="heading">{unit?.title ?? first.title}</Text>
        <Text variant="callout" color="textSecondary">
          {names.join(' · ')}
        </Text>
        <Text variant="callout" hue="yellow">{`About ${MINUTES_PER_LESSON} minutes · +${XP.lesson} XP`}</Text>
      </Card>

      <Text variant="label" color="textTertiary">
        How a lesson works
      </Text>
      {LESSON_STEPS.map((s) => (
        <View key={s.n} style={styles.lessonStep}>
          <View style={[styles.stepDot, { backgroundColor: t.colors.hue.blue.base }]}>
            <Text variant="bodyStrong" style={styles.onColor}>
              {s.n}
            </Text>
          </View>
          <Text variant="bodyStrong" style={styles.flex}>
            {s.text}
          </Text>
        </View>
      ))}
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
  way: { flexDirection: 'row', alignItems: 'center', gap: t.space[4] },
  wayIcon: {
    width: t.layout.control.lg,
    height: t.layout.control.lg,
    borderRadius: t.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  readyHead: { flexDirection: 'row', alignItems: 'center', gap: t.space[4] },
  firstStop: { gap: t.space[1] },
  lessonStep: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  stepDot: {
    width: t.space[8],
    height: t.space[8],
    borderRadius: t.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onColor: { color: t.colors.onColor },
}));
