import { router, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coin } from '@/components/art/Coin';
import { MascotSays } from '@/components/MascotSays';
import { CoachTip } from '@/components/lesson/CoachTip';
import { ExerciseView } from '@/components/lesson/ExerciseView';
import { FeedbackPanel } from '@/components/lesson/FeedbackPanel';
import { LessonComplete, QuitConfirm, StreakCelebration, type LessonSummary } from '@/components/lesson/LessonEnd';
import { Appear, Button, Icon, PressableScale, ProgressBar, RollingNumber, Text } from '@/components/ui';
import { newlyUnlocked } from '@/lib/achievements';
import { coinsForCorrect } from '@/lib/cosmetics';
import { dayKey } from '@/lib/dates';
import { lessons, type Exercise } from '@/lib/engine';
import { haptics } from '@/lib/haptics';
import { useProgress } from '@/stores/progress';
import { useSettings } from '@/stores/settings';
import { makeStyles, useTheme } from '@/theme';

const PRAISE = ['Nice!', 'Great job!', 'Correct!', 'You got it!', 'Amazing!', 'Spot on!'];
const NUDGE = ['Not quite', 'Almost!', 'Good try'];

type Phase = 'play' | 'complete' | 'streak';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = id ? lessons.findLesson(id) : null;
  if (!lesson) return <MissingLesson />;
  return <LessonPlayer lessonId={lesson.id} />;
}

function LessonPlayer({ lessonId }: { lessonId: string }) {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const built = useMemo(() => lessons.buildLesson(lessonId, Date.now()), [lessonId]);
  const recordMistakes = useProgress((s) => s.recordMistakes);
  const completeLesson = useProgress((s) => s.completeLesson);
  const markCelebrated = useProgress((s) => s.markCelebrated);
  const earnCoins = useProgress((s) => s.earnCoins);
  const goal = useSettings((s) => s.dailyGoal);
  // Someone's very first lesson coaches them through the loop once: pick, Check, read why, Continue.
  const [coaching] = useState(
    () => !useSettings.getState().lessonCoached && Object.keys(useProgress.getState().lessons).length === 0,
  );
  const finishCoaching = useSettings((s) => s.finishLessonCoaching);

  // Mistakes cost nothing: a wrong answer just comes back once at the end of the lesson, so it gets a second go.
  const [queue, setQueue] = useState<Exercise[]>(built.exercises);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>('play');
  const [quitting, setQuitting] = useState(false);
  const [combo, setCombo] = useState(0);
  const [title, setTitle] = useState('');
  /** Coins this lesson, and what the last right answer paid. */
  const [coins, setCoins] = useState(0);
  const [payout, setPayout] = useState<{ total: number; bonus: number } | null>(null);
  const missed = useRef(new Set<string>());
  const retried = useRef(new Set<string>());
  const started = useRef(Date.now());
  const summary = useRef<LessonSummary | null>(null);
  const streakAfter = useRef(0);

  const exercise = queue[index]!;
  const done = index + (checked !== null ? 1 : 0);
  const progress = done / queue.length;

  const toggle = (choiceId: string) => {
    if (checked !== null) return;
    if (exercise.multi) {
      setSelected((s) => (s.includes(choiceId) ? s.filter((c) => c !== choiceId) : [...s, choiceId]));
    } else {
      setSelected([choiceId]);
    }
  };

  const check = () => {
    const ok = lessons.isCorrect(exercise, selected);
    setChecked(ok);
    if (ok) {
      haptics.success();
      const next = combo + 1;
      setCombo(next);
      setTitle(next >= 3 ? `${next} in a row!` : PRAISE[Math.floor(Math.random() * PRAISE.length)]!);
      // A coin for every right answer, and a bonus for landing 5 or 10 in a row.
      const paid = coinsForCorrect(next);
      earnCoins(paid.total);
      setCoins((c) => c + paid.total);
      setPayout(paid);
    } else {
      haptics.error();
      setCombo(0);
      setPayout(null);
      setTitle(NUDGE[Math.floor(Math.random() * NUDGE.length)]!);
      missed.current.add(exercise.id);
      recordMistakes(exercise.objects);
      if (!retried.current.has(exercise.id)) {
        retried.current.add(exercise.id);
        setQueue((q) => [...q, exercise]);
      }
    }
  };

  const finish = () => {
    const total = built.exercises.length;
    const correct = built.exercises.filter((e) => !missed.current.has(e.id)).length;
    const before = useProgress.getState().xpByDay[dayKey()] ?? 0;
    const result = completeLesson({ lessonId, review: built.lesson.review, correct, total });
    const badges = newlyUnlocked(useProgress.getState());
    markCelebrated(badges.map((b) => b.id));
    streakAfter.current = result.streakExtended ? result.streak : 0;
    summary.current = {
      xp: result.xpEarned,
      coins,
      accuracy: result.accuracy,
      seconds: Math.round((Date.now() - started.current) / 1000),
      perfect: result.perfect,
      goalReached: before < goal && before + result.xpEarned >= goal,
      badges,
    };
    haptics.success();
    setPhase('complete');
  };

  const next = () => {
    if (coaching) finishCoaching();
    setSelected([]);
    setChecked(null);
    if (index + 1 >= queue.length) finish();
    else setIndex(index + 1);
  };

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (phase === 'complete' && summary.current) {
    return (
      <LessonComplete
        summary={summary.current}
        onContinue={() => (streakAfter.current > 0 ? setPhase('streak') : leave())}
      />
    );
  }
  if (phase === 'streak') {
    return <StreakCelebration streak={streakAfter.current} onContinue={leave} />;
  }

  const answerLabel = exercise.choices
    .filter((c) => exercise.answer.includes(c.id))
    .map((c) => c.label)
    .join(', ');

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <PressableScale onPress={() => setQuitting(true)} accessibilityLabel="Quit lesson" hitSlop={t.space[2]}>
          <Icon icon={X} size="lg" color="textTertiary" />
        </PressableScale>
        <ProgressBar value={progress} accessibilityLabel="Lesson progress" />
        <View style={styles.coins} accessibilityLabel={`${coins} coins earned this lesson`}>
          <Coin size={t.layout.icon.md} />
          <RollingNumber value={coins} hue="yellow" bump />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.column}>
          {retried.current.has(exercise.id) && index >= built.exercises.length && (
            <Text variant="label" hue="orange">
              Previous mistake
            </Text>
          )}
          {/* Each exercise slides in from the right, the way you are moving through the lesson. */}
          <Appear key={`${exercise.id}:${index}`} from="right">
            <ExerciseView exercise={exercise} selected={selected} checked={checked} onToggle={toggle} />
          </Appear>
        </View>
      </ScrollView>

      {checked === null ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, t.space[6]) }]}>
          <View style={styles.column}>
            {coaching && index === 0 && (
              <CoachTip>
                {selected.length === 0
                  ? exercise.multi
                    ? 'Tap every answer that fits'
                    : 'Tap the answer you think is right'
                  : 'Now tap Check to see if you got it'}
              </CoachTip>
            )}
            <Button label="Check" fullWidth disabled={selected.length === 0} onPress={check} />
          </View>
        </View>
      ) : (
        <FeedbackPanel
          correct={checked}
          title={title}
          answer={answerLabel}
          explain={exercise.explain}
          payout={checked ? payout : null}
          showTin={exercise.type !== 'truefalse'}
          coach={coaching && index === 0}
          onContinue={next}
        />
      )}

      {quitting && <QuitConfirm onStay={() => setQuitting(false)} onQuit={leave} />}
    </SafeAreaView>
  );
}

function MissingLesson() {
  const styles = useStyles();
  return (
    <SafeAreaView style={[styles.root, styles.missing]}>
      <MascotSays mood="thinking" layout="above" size="lg">
        Hmm, that lesson does not exist. It may have moved when the course was updated.
      </MascotSays>
      <Button label="Back to the path" onPress={() => router.replace('/')} />
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space[4],
    paddingHorizontal: t.layout.gutter,
    paddingVertical: t.space[3],
    width: '100%',
    maxWidth: t.layout.maxWidth,
    alignSelf: 'center',
  },
  coins: { flexDirection: 'row', alignItems: 'center', gap: t.space[1] },
  body: { paddingTop: t.space[2], paddingBottom: t.space[8] },
  column: { width: '100%', maxWidth: t.layout.maxWidth, alignSelf: 'center', paddingHorizontal: t.layout.gutter, gap: t.space[2] },
  footer: { paddingTop: t.space[4], borderTopWidth: t.layout.border, borderTopColor: t.colors.border },
  missing: { alignItems: 'center', justifyContent: 'center', gap: t.space[6], padding: t.layout.gutter },
}));
