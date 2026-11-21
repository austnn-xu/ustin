import { useQueryClient } from '@tanstack/react-query';
import { CloudOff, Target, Trophy, Zap } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Coin } from '@/components/art/Coin';
import { Confetti } from '@/components/art/Confetti';
import { Mascot, type Mood } from '@/components/art/Mascot';
import { StatTile, useCountUp } from '@/components/lesson/LessonEnd';
import { Button, Card, Icon, Screen, Skeleton, Text } from '@/components/ui';
import { paintOf } from '@/lib/cosmetics';
import { arena, leagues, numbers, type MatchRewards } from '@/lib/engine';
import { haptics } from '@/lib/haptics';
import { ArenaError, formatPin, leaderboardConfigured, submitRun, useMyLeague, useRoomBoard, type MyLeague, type SubmittedRun } from '@/lib/leaderboard';
import { LeagueBadge } from '@/components/art/LeagueBadge';
import { isPristine, leagueId, leagueName } from './League';
import type { Setup } from '@/lib/match';
import { useScreenSize } from '@/lib/useScreenSize';
import { useProgress } from '@/stores/progress';
import { makeStyles, useTheme } from '@/theme';
import { Podium, type PodiumEntry } from './Podium';

export type MatchSummary = { points: number[]; seconds: number; streak: number; streakExtended: boolean };

type Post = 'skipped' | 'posting' | 'posted' | 'failed';

const fmt = (n: number) => n.toLocaleString('en-US');

/**
 * The end of a match: the podium, what it paid (coins, XP, leaderboard points) and whether it made the global board.
 * Coins and XP are paid exactly once, on this device, even if posting fails; posting can be retried.
 */
export function MatchEnd({
  setup,
  summary,
  onSummary,
  onContinue,
  onAgain,
}: {
  setup: Setup;
  summary: MatchSummary;
  onSummary: (s: MatchSummary) => void;
  onContinue: () => void;
  onAgain: () => void;
}) {
  const t = useTheme();
  const styles = useStyles();
  const { short } = useScreenSize();
  const queryClient = useQueryClient();
  const myPaint = paintOf(useProgress((s) => s.equipped)) ?? 'green';
  const { rival } = setup;
  const kind = rival.kind;
  const localRivalScore = rival.kind === 'room' ? null : arena.total(rival.points);
  const [rewards, setRewards] = useState<MatchRewards | null>(null);
  const [post, setPost] = useState<Post>(setup.online ? 'posting' : 'skipped');
  const [postError, setPostError] = useState<string | null>(null);
  const [posted, setPosted] = useState<SubmittedRun | null>(null);
  const begun = useRef(false);
  const paid = useRef(false);

  const pay = (r: MatchRewards) => {
    if (paid.current) return;
    paid.current = true;
    const res = useProgress.getState().recordMatch({ outcome: r.outcome, score: r.score, coins: r.coins, earned: r.earned, correct: r.correct });
    setRewards(r);
    onSummary({ ...summary, streak: res.streak, streakExtended: res.streakExtended });
    if (r.outcome === 'win' || r.perfect) haptics.success();
  };

  const send = async () => {
    setPost('posting');
    setPostError(null);
    try {
      const res = await submitRun({
        seed: setup.seed,
        points: summary.points,
        rivalRun: rival.kind === 'player' ? rival.runId : null,
        room: rival.kind === 'room' ? rival.code : null,
        tinScore: rival.kind === 'tin' ? localRivalScore : null,
      });
      pay(arena.rewardsFor({ points: summary.points, rival: kind, rivalScore: rival.kind === 'room' ? res.rivalScore : localRivalScore }));
      setPosted(res);
      setPost('posted');
      void queryClient.invalidateQueries({ queryKey: ['arena'] });
    } catch (e) {
      // Still pay for the match you played; in a game PIN without the server's word, it counts as no result.
      pay(arena.rewardsFor({ points: summary.points, rival: kind, rivalScore: localRivalScore }));
      setPost('failed');
      setPostError(e instanceof ArenaError ? e.message : 'Could not post this match.');
    }
  };

  useEffect(() => {
    if (begun.current) return;
    begun.current = true;
    if (setup.online) void send();
    else pay(arena.rewardsFor({ points: summary.points, rival: kind, rivalScore: localRivalScore }));
    // Once per finished match.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetched once the match is posted (the post invalidates every arena query), so it shows the new place.
  const my = useMyLeague();
  const room = useRoomBoard(rival.kind === 'room' ? rival.code : undefined, rival.kind === 'room' && post === 'posted');

  const score = arena.total(summary.points);
  const correct = summary.points.filter((p) => p > 0).length;
  const outcome = rewards?.outcome ?? (localRivalScore === null ? 'solo' : arena.outcomeOf(score, localRivalScore));
  const me = { name: setup.me?.name ?? 'You', paint: setup.me?.paint ?? myPaint };

  let entries: PodiumEntry[];
  if (rival.kind === 'room') {
    entries = (room.data ?? []).slice(0, 3).map((r) => ({ key: `${r.rank}-${r.name}`, name: r.name, paint: r.paint, score: r.score, isMe: r.isMe, rank: r.rank }));
    if (!entries.some((e) => e.isMe) && entries.length < 3 && post !== 'posted') entries.push({ key: 'me', ...me, score, isMe: true });
  } else {
    const them: PodiumEntry =
      rival.kind === 'player'
        ? { key: 'rival', name: rival.name, paint: rival.paint, score: localRivalScore!, isMe: false }
        : { key: 'rival', name: 'Tin', paint: 'slate', score: localRivalScore!, isMe: false };
    entries = [{ key: 'me', ...me, score, isMe: true }, them].sort((a, b) => b.score - a.score || (a.isMe ? -1 : 1));
    if (entries[0]!.score === entries[1]!.score) entries = entries.map((e) => ({ ...e, rank: 1 }));
  }

  const roomPlace = room.data?.find((r) => r.isMe);
  const title =
    outcome === 'win' ? 'You win!' : outcome === 'tie' ? 'Dead heat!' : outcome === 'loss' ? 'So close!' : rival.kind === 'room' ? 'First on the board!' : 'Match complete!';
  const line =
    rival.kind === 'room'
      ? roomPlace
        ? `You placed #${roomPlace.rank} of ${room.data!.length} in game ${formatPin(rival.code)}. The podium updates as friends finish.`
        : `Game ${formatPin(rival.code)}: the podium updates as friends finish.`
      : outcome === 'win'
        ? `You beat ${rival.kind === 'player' ? rival.name : 'Tin'} by ${fmt(score - localRivalScore!)} points.`
        : outcome === 'loss'
          ? `${rival.kind === 'player' ? rival.name : 'Tin'} won by ${fmt(localRivalScore! - score)}. Every question you missed is one you know now.`
          : outcome === 'tie'
            ? 'Exactly the same score. Rematch?'
            : 'Every right answer is one more thing kept out of landfill.';
  const mood: Mood = outcome === 'win' ? 'cheer' : outcome === 'tie' ? 'wow' : outcome === 'loss' ? 'happy' : 'cheer';

  const coins = useCountUp(rewards?.coins ?? 0, 900, t.motion.stagger * 3);
  const shownScore = useCountUp(score, 900, t.motion.stagger * 3);

  return (
    <Screen
      scroll
      footer={
        <View style={styles.buttons}>
          <Button label={rival.kind === 'room' ? 'Open the game' : 'Play again'} fullWidth onPress={onAgain} />
          <Button label="Done" variant="ghost" fullWidth onPress={onContinue} />
        </View>
      }
    >
      <View style={styles.center}>
        <Mascot mood={mood} size={short ? 'sm' : 'md'} pokeable />
        <Text variant="display" hue={outcome === 'loss' ? undefined : 'yellow'} align="center">
          {title}
        </Text>
        <Text variant="body" color="textSecondary" align="center">
          {line}
        </Text>

        {entries.length > 0 ? (
          <Podium entries={entries} />
        ) : (
          <Skeleton height={t.space[20] * 2} radius="lg" />
        )}

        <View style={styles.tiles}>
          <StatTile label="Score" value={fmt(shownScore)} icon={Zap} hue="yellow" />
          <StatTile label="Coins" value={`+${coins}`} hue="orange" art={<Coin size={t.layout.icon.md} />} />
          <StatTile label="Right" value={`${correct}/${summary.points.length}`} icon={Target} hue="green" />
        </View>

        <PostCard
          post={post}
          error={postError}
          rewards={rewards}
          posted={posted}
          my={post === 'posted' ? my.data ?? null : null}
          vsPlayer={rival.kind === 'player'}
          onRetry={() => void send()}
        />
      </View>
      {(outcome === 'win' || rewards?.perfect) && <Confetti />}
    </Screen>
  );
}

function PostCard({
  post,
  error,
  rewards,
  posted,
  my,
  vsPlayer,
  onRetry,
}: {
  post: Post;
  error: string | null;
  rewards: MatchRewards | null;
  posted: SubmittedRun | null;
  my: MyLeague | null;
  vsPlayer: boolean;
  onRetry: () => void;
}) {
  const t = useTheme();
  const styles = useStyles();
  if (post === 'skipped') {
    return (
      <Card variant="tinted" hue="slate" style={styles.row}>
        <Icon icon={CloudOff} hue="slate" shade="text" />
        <Text variant="callout" hue="slate" style={styles.flex}>
          {leaderboardConfigured
            ? 'Practice match: not posted to the leaderboard. Pick a name in the Arena to compete.'
            : 'The global leaderboard is not connected in this version, so this match stays on your phone.'}
        </Text>
      </Card>
    );
  }
  if (post === 'failed') {
    return (
      <Card variant="tinted" hue="red" style={styles.stack}>
        <View style={styles.row}>
          <Icon icon={CloudOff} hue="red" shade="text" />
          <Text variant="callout" hue="red" style={styles.flex}>
            {`${error ?? 'Could not post this match.'} Your coins and XP are safe.`}
          </Text>
        </View>
        <Button label="Try posting again" variant="neutral" labelHue="red" size="md" onPress={onRetry} />
      </Card>
    );
  }
  if (post === 'posting' || !rewards || !posted) {
    return (
      <Card variant="tinted" hue="blue" style={styles.row}>
        <Icon icon={Trophy} hue="blue" shade="text" />
        <Text variant="bodyStrong" hue="blue" style={styles.flex}>
          Posting to the leaderboard…
        </Text>
      </Card>
    );
  }
  const id = leagueId(posted.league);
  const c = t.colors.league[id];
  const pristine = isPristine(posted.league);
  const fellToRuby = posted.league === leagues.PRISTINE - 1 && posted.rrChange < 0;
  const bonus = rewards.bonus > 0 ? `${fmt(rewards.score)} score + ${fmt(rewards.bonus)} for the ${rewards.outcome === 'tie' ? 'tie' : 'win'}` : 'Your score, straight into your league';

  let title: string;
  let sub: string;
  if (fellToRuby) {
    title = `${posted.rrChange} RR: back to Ruby`;
    sub = 'Top a Ruby group to earn Pristine again.';
  } else if (pristine) {
    title = posted.rrChange > 0 ? `+${posted.rrChange} RR` : posted.rrChange < 0 ? `${posted.rrChange} RR` : 'RR unchanged';
    sub = vsPlayer
      ? `${numbers.compact(posted.rr)} RR${my?.pristineRank ? ` · Pristine #${my.pristineRank}` : ''}`
      : 'Only quick matches against other players move RR.';
  } else {
    title = `+${numbers.compact(rewards.earned)} league points`;
    sub = `${bonus}${my && my.league === posted.league && my.rank ? ` · #${my.rank} of ${my.size} in ${leagueName(posted.league)}` : ''}`;
  }
  return (
    <View style={[styles.row, styles.leagueCard, { backgroundColor: c.subtle, borderColor: c.base }]}>
      <LeagueBadge league={id} size={t.layout.control.md} />
      <View style={styles.flex}>
        <Text variant="bodyStrong" style={{ color: c.text }}>
          {title}
        </Text>
        <Text variant="callout" color="textSecondary">
          {sub}
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.space[4], paddingVertical: t.space[6] },
  tiles: { flexDirection: 'row', gap: t.space[3], alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space[3], alignSelf: 'stretch' },
  stack: { gap: t.space[3], alignSelf: 'stretch' },
  flex: { flex: 1 },
  leagueCard: { padding: t.space[4], borderRadius: t.radius.lg, borderWidth: t.layout.border },
  buttons: { gap: t.space[2] },
}));
