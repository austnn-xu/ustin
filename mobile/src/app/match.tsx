import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Flame, Timer, X, Zap } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mascot } from '@/components/art/Mascot';
import { Avatar } from '@/components/arena/Avatar';
import { MatchEnd, type MatchSummary } from '@/components/arena/MatchEnd';
import { MatchTimer } from '@/components/arena/MatchTimer';
import { NameSheet } from '@/components/arena/NameSheet';
import { RevealPanel, type Standing } from '@/components/arena/RevealPanel';
import { MascotSays } from '@/components/MascotSays';
import { ExerciseView } from '@/components/lesson/ExerciseView';
import { QuitConfirm, StreakCelebration } from '@/components/lesson/LessonEnd';
import { Appear, Button, Card, Icon, PressableScale, ProgressBar, RollingNumber, Text } from '@/components/ui';
import { paintOf } from '@/lib/cosmetics';
import { timeAgo } from '@/lib/dates';
import { arena, lessons } from '@/lib/engine';
import { haptics } from '@/lib/haptics';
import {
  ArenaError,
  arenaKeys,
  fetchMe,
  findOpponent,
  formatPin,
  joinRoom,
  leaderboardConfigured,
  submitRun,
  type Player,
} from '@/lib/leaderboard';
import type { Rival, Setup } from '@/lib/match';
import { useProgress } from '@/stores/progress';
import { useSettings } from '@/stores/settings';
import { makeStyles, useTheme, type HueName } from '@/theme';

const PRAISE = ['Nice!', 'Speedy!', 'Correct!', 'You got it!', 'Spot on!'];
const NUDGE = ['Not quite', 'So close', 'Good try'];

type Phase = 'setup' | 'name' | 'intro' | 'countdown' | 'play' | 'done' | 'streak';

/**
 * A match: ten timed questions from the whole course, Kahoot-style. Faster right answers score more, runs of right
 * answers add a streak bonus, and after every question the answer, the why and the race so far.
 *
 *   /match            quick match: a real player's recent run on the same questions, or Tin
 *   /match?offline=1  quick match against Tin without posting (no leaderboard name)
 *   /match?pin=123456 the questions of a friend's game PIN
 */
export default function MatchScreen() {
  const { pin, offline } = useLocalSearchParams<{ pin?: string; offline?: string }>();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>('setup');
  const [setup, setSetup] = useState<Setup | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [summary, setSummary] = useState<MatchSummary | null>(null);

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/arena'));

  useEffect(() => {
    let cancelled = false;
    const tin = (me: Player | null, online: boolean): Setup => {
      const seed = arena.newSeed();
      return { seed, rival: { kind: 'tin', points: arena.tinRun(seed) }, me, online };
    };
    (async () => {
      setProblem(null);
      if (pin) {
        if (!leaderboardConfigured) throw new ArenaError('offline', 'Game PINs need the online leaderboard, which is not connected.');
        const room = await joinRoom(pin);
        const me = (await queryClient.fetchQuery({ queryKey: arenaKeys.me, queryFn: fetchMe })) ?? null;
        if (cancelled) return;
        useSettings.getState().rememberPin(room.code);
        setSetup({ seed: room.seed, rival: { kind: 'room', code: room.code, host: room.host, players: room.players }, me, online: true });
        setPhase(me ? 'intro' : 'name');
        return;
      }
      if (!leaderboardConfigured || offline) {
        setSetup(tin(null, false));
        setPhase('intro');
        return;
      }
      let next: Setup;
      try {
        const me = (await queryClient.fetchQuery({ queryKey: arenaKeys.me, queryFn: fetchMe })) ?? null;
        if (!me) next = tin(null, false);
        else {
          const opp = await findOpponent();
          next = opp
            ? { seed: opp.seed, rival: { kind: 'player', runId: opp.runId, name: opp.name, paint: opp.paint, points: opp.points, playedAt: opp.playedAt }, me, online: true }
            : tin(me, true);
        }
      } catch {
        // Offline or the leaderboard is down: race Tin rather than not play at all. The intro says it will not post.
        next = tin(null, false);
      }
      if (cancelled) return;
      setSetup(next);
      setPhase('intro');
    })().catch((e) => {
      if (!cancelled) setProblem(e instanceof ArenaError ? e.message : 'Could not start the match.');
    });
    return () => {
      cancelled = true;
    };
  }, [pin, offline, attempt, queryClient]);

  if (problem) {
    return (
      <Problem problem={problem} onRetry={() => setAttempt((n) => n + 1)} onLeave={leave} />
    );
  }
  if (phase === 'setup' || !setup) return <Finding pin={pin} />;

  if (phase === 'name') {
    return (
      <Centered>
        <NameSheet
          cancelLabel="Back"
          onCancel={leave}
          onDone={(me) => {
            setSetup({ ...setup, me });
            setPhase('intro');
          }}
        />
      </Centered>
    );
  }

  if (phase === 'intro') return <Intro setup={setup} onStart={() => setPhase('countdown')} onLeave={leave} />;
  if (phase === 'countdown') return <Countdown onDone={() => setPhase('play')} />;
  if (phase === 'streak' && summary) return <StreakCelebration streak={summary.streak} onContinue={leave} />;
  if (phase === 'done' && summary) {
    return (
      <MatchEnd
        setup={setup}
        summary={summary}
        onSummary={setSummary}
        onContinue={() => (summary.streakExtended ? setPhase('streak') : leave())}
        onAgain={() => router.replace(setup.rival.kind === 'room' ? `/pin/${setup.rival.code}` : setup.online ? '/match' : '/match?offline=1')}
      />
    );
  }
  return (
    <MatchPlayer
      setup={setup}
      onLeave={leave}
      onFinish={(s) => {
        setSummary(s);
        setPhase('done');
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Before the match
// ---------------------------------------------------------------------------

function Problem({ problem, onRetry, onLeave }: { problem: string; onRetry: () => void; onLeave: () => void }) {
  const styles = useStyles();
  return (
    <Centered>
      <MascotSays mood="worried" layout="above" size="lg">
        {problem}
      </MascotSays>
      <View style={styles.stretch}>
        <Button label="Try again" fullWidth onPress={onRetry} />
        <Button label="Back to the Arena" variant="ghost" fullWidth onPress={onLeave} />
      </View>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  const styles = useStyles();
  return <SafeAreaView style={[styles.root, styles.centered]}>{children}</SafeAreaView>;
}

/** Tin thinking with a progress bar while a rival is found: never a spinner. */
function Finding({ pin }: { pin?: string }) {
  const styles = useStyles();
  return (
    <Centered>
      <Mascot mood="thinking" size="lg" />
      <Text variant="title" align="center">
        {pin ? `Joining game ${formatPin(pin)}…` : 'Finding you a rival…'}
      </Text>
      <View style={styles.findingBar}>
        <ProgressBar value={0.6} hue="blue" accessibilityLabel="Finding a rival" />
      </View>
    </Centered>
  );
}

function rivalName(rival: Rival) {
  return rival.kind === 'player' ? rival.name : rival.kind === 'tin' ? 'Tin' : `Game ${formatPin(rival.code)}`;
}

function Intro({ setup, onStart, onLeave }: { setup: Setup; onStart: () => void; onLeave: () => void }) {
  const t = useTheme();
  const styles = useStyles();
  const myPaint = paintOf(useProgress((s) => s.equipped)) ?? 'green';
  const { rival } = setup;
  const { MATCH, REWARDS } = arena;

  const sub =
    rival.kind === 'player'
      ? `Played these same ${MATCH.questions} questions ${timeAgo(rival.playedAt)}. Their answers are revealed as you go.`
      : rival.kind === 'tin'
        ? 'Tin, the computer. Right about 7 times in 10, and not the fastest.'
        : `Hosted by ${rival.host} · ${rival.players === 0 ? 'nobody has played yet' : rival.players === 1 ? '1 player so far' : `${rival.players} players so far`}`;

  const note = setup.online
    ? rival.kind === 'room'
      ? `Beat everyone who played before you for +${REWARDS.pointsWin.toLocaleString('en-US')} leaderboard points.`
      : `Your score goes on the global leaderboard. A win adds +${(rival.kind === 'tin' ? REWARDS.pointsWinTin : REWARDS.pointsWin).toLocaleString('en-US')}.`
    : leaderboardConfigured
      ? 'Practice match: coins and XP count, the leaderboard does not (no name, or offline).'
      : 'Coins and XP count. The global leaderboard is not connected in this version.';

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <PressableScale onPress={onLeave} accessibilityLabel="Back to the Arena" hitSlop={t.space[2]}>
          <Icon icon={X} size="lg" color="textTertiary" />
        </PressableScale>
      </View>
      <ScrollView contentContainerStyle={styles.introBody}>
        <View style={styles.column}>
          <Appear from="pop" style={styles.versus}>
            <View style={styles.fighter}>
              <Avatar name={setup.me?.name ?? 'You'} paint={setup.me?.paint ?? myPaint} size="lg" />
              <Text variant="heading" numberOfLines={1}>
                You
              </Text>
            </View>
            <Text variant="display" hue="orange">
              VS
            </Text>
            <View style={styles.fighter}>
              {rival.kind === 'tin' ? (
                <Mascot mood="wow" size="sm" />
              ) : rival.kind === 'player' ? (
                <Avatar name={rival.name} paint={rival.paint} size="lg" />
              ) : (
                <Avatar name="#" paint="purple" size="lg" />
              )}
              <Text variant="heading" numberOfLines={1}>
                {rivalName(rival)}
              </Text>
            </View>
          </Appear>
          <Text variant="body" color="textSecondary" align="center">
            {sub}
          </Text>

          <Card style={styles.rules}>
            <Rule icon={Timer} hue="blue" text={`${MATCH.questions} questions, ${MATCH.questionMs / 1000} seconds each. Tap an answer to lock it in.`} />
            <Rule icon={Zap} hue="yellow" text={`Right answers score ${MATCH.minPoints}–${MATCH.maxPoints}: the faster, the more.`} />
            <Rule icon={Flame} hue="orange" text={`Answer streaks add up to +${MATCH.streakCap} a question.`} />
          </Card>
          <Text variant="callout" color="textSecondary" align="center">
            {note}
          </Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.column}>
          <Button label="Start" fullWidth onPress={onStart} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Rule({ icon, hue, text }: { icon: typeof Timer; hue: HueName; text: string }) {
  const styles = useStyles();
  return (
    <View style={styles.rule}>
      <Icon icon={icon} hue={hue} filled={icon !== Timer} />
      <Text variant="body" style={styles.flex}>
        {text}
      </Text>
    </View>
  );
}

/** 3, 2, 1: once per match, so it gets a pop per number. */
function Countdown({ onDone }: { onDone: () => void }) {
  const t = useTheme();
  const [n, setN] = useState(3);
  useEffect(() => {
    haptics.selection();
    const timer = setTimeout(() => (n > 1 ? setN(n - 1) : onDone()), t.motion.pulseDuration);
    return () => clearTimeout(timer);
  }, [n, onDone, t.motion.pulseDuration]);
  return (
    <Centered>
      <Text variant="label" color="textTertiary">
        Get ready
      </Text>
      <Appear key={n} from="pop" spring="bouncy">
        <Text variant="hero" hue="blue" accessibilityLiveRegion="assertive">
          {n}
        </Text>
      </Appear>
    </Centered>
  );
}

// ---------------------------------------------------------------------------
// The match
// ---------------------------------------------------------------------------

type Result = 'correct' | 'wrong' | 'timeout';

function MatchPlayer({ setup, onLeave, onFinish }: { setup: Setup; onLeave: () => void; onFinish: (s: MatchSummary) => void }) {
  const t = useTheme();
  const styles = useStyles();
  const match = useMemo(() => arena.buildMatch(setup.seed), [setup.seed]);
  const myPaint = paintOf(useProgress((s) => s.equipped)) ?? 'green';
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [points, setPoints] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [title, setTitle] = useState('');
  const [quitting, setQuitting] = useState(false);
  const shownAt = useRef(Date.now());
  const started = useRef(Date.now());
  const [pending, startTransition] = useTransition();

  const exercise = match.exercises[index]!;
  const score = arena.total(points);
  const rival = setup.rival;
  const rivalPoints = rival.kind === 'room' ? null : rival.points;

  useEffect(() => {
    shownAt.current = Date.now();
  }, [index]);

  const settle = (r: Result, choice: string[]) => {
    if (result !== null || pending) return;
    const ms = Date.now() - shownAt.current;
    startTransition(() => {
      const correct = r === 'correct';
      const run = correct ? streak + 1 : 0;
      const p = arena.pointsFor({ correct, ms, streak: run });
      setSelected(choice);
      setResult(r);
      setStreak(run);
      setPoints((prev) => [...prev, p]);
      setTitle(
        correct
          ? run >= 3
            ? `${run} in a row!`
            : PRAISE[Math.floor(Math.random() * PRAISE.length)]!
          : r === 'timeout'
            ? "Time's up"
            : NUDGE[Math.floor(Math.random() * NUDGE.length)]!,
      );
      if (correct) haptics.success();
      else haptics.error();
    });
  };

  const answer = (choiceId: string) => settle(lessons.isCorrect(exercise, [choiceId]) ? 'correct' : 'wrong', [choiceId]);

  const next = () => {
    if (pending) return;
    startTransition(() => {
      if (index + 1 >= match.exercises.length) {
        onFinish({ points, seconds: Math.round((Date.now() - started.current) / 1000), streak: 0, streakExtended: false });
        return;
      }
      setSelected([]);
      setResult(null);
      setIndex(index + 1);
    });
  };

  const answered = result !== null;
  // The rival's points show for questions you have finished, never ahead of you.
  const rivalSoFar = rivalPoints ? arena.total(rivalPoints.slice(0, answered ? index + 1 : index)) : 0;
  const lastPoints = points[points.length - 1] ?? 0;

  const standings: Standing[] = [{ name: setup.me?.name ?? 'You', paint: setup.me?.paint ?? myPaint, score, isMe: true }];
  if (rivalPoints) {
    const theirs = rivalPoints[index] ?? 0;
    standings.push({
      name: rival.kind === 'player' ? rival.name : 'Tin',
      paint: rival.kind === 'player' ? rival.paint : 'slate',
      score: rivalSoFar,
      isMe: false,
      note: theirs > 0 ? `Got it: +${theirs.toLocaleString('en-US')}` : 'Missed this one',
    });
  }

  const answerLabel = exercise.choices
    .filter((c) => exercise.answer.includes(c.id))
    .map((c) => c.label)
    .join(', ');

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <PressableScale onPress={() => setQuitting(true)} accessibilityLabel="Quit match" hitSlop={t.space[2]}>
          <Icon icon={X} size="lg" color="textTertiary" />
        </PressableScale>
        <Text variant="bodyStrong" color="textSecondary" tabular>{`${index + 1} / ${match.exercises.length}`}</Text>
        <View style={styles.flex} />
        <View style={styles.score} accessibilityLabel={`Your score: ${score}`}>
          <Icon icon={Zap} hue="yellow" filled />
          <RollingNumber value={score} hue="yellow" />
        </View>
      </View>
      <View style={styles.timerRow}>
        <MatchTimer key={index} ms={match.questionMs} running={!answered} onExpire={() => settle('timeout', [])} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.column}>
          <Text variant="label" color="textTertiary">
            {exercise.unitTitle}
          </Text>
          <Appear key={exercise.id} from="right" spring="quick">
            <ExerciseView exercise={exercise} selected={selected} checked={answered ? result === 'correct' : null} onToggle={answer} />
          </Appear>
        </View>
      </ScrollView>

      {answered && (
        <RevealPanel
          result={result}
          title={title}
          answer={answerLabel}
          explain={exercise.explain}
          points={lastPoints}
          streakBonus={result === 'correct' ? arena.streakBonus(streak) : 0}
          standings={standings}
          showTin={exercise.type !== 'truefalse'}
          continueLabel={index + 1 >= match.exercises.length ? 'See results' : 'Next question'}
          onContinue={next}
        />
      )}

      {quitting && (
        <QuitConfirm
          message="Leaving now ends the match. Nothing is posted and no coins are paid."
          stayLabel="Keep playing"
          onStay={() => setQuitting(false)}
          onQuit={onLeave}
        />
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  centered: { alignItems: 'center', justifyContent: 'center', gap: t.space[5], padding: t.layout.gutter },
  stretch: { alignSelf: 'stretch', maxWidth: t.layout.maxWidth, width: '100%', gap: t.space[2] },
  findingBar: { width: '100%', maxWidth: t.layout.maxWidth / 2, flexDirection: 'row' },
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
  timerRow: { width: '100%', maxWidth: t.layout.maxWidth, alignSelf: 'center', paddingHorizontal: t.layout.gutter },
  score: { flexDirection: 'row', alignItems: 'center', gap: t.space[1] },
  flex: { flex: 1 },
  body: { paddingTop: t.space[4], paddingBottom: t.space[8] },
  column: { width: '100%', maxWidth: t.layout.maxWidth, alignSelf: 'center', paddingHorizontal: t.layout.gutter, gap: t.space[3] },
  introBody: { flexGrow: 1, justifyContent: 'center', paddingVertical: t.space[6] },
  versus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space[3], paddingVertical: t.space[4] },
  fighter: { flex: 1, alignItems: 'center', gap: t.space[2], minWidth: 0 },
  rules: { gap: t.space[3], marginTop: t.space[2] },
  rule: { flexDirection: 'row', alignItems: 'flex-start', gap: t.space[3] },
  footer: { paddingTop: t.space[4], paddingBottom: t.space[6], borderTopWidth: t.layout.border, borderTopColor: t.colors.border },
}));
