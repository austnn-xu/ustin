import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Swords } from 'lucide-react-native';
import { useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { BoardList, BoardMessage, BoardSkeleton, StaleNote, toEntries, type BoardEntry } from '@/components/arena/BoardList';
import { isPristine, LeagueBanner, LeagueLadder, leagueName } from '@/components/arena/League';
import { Podium } from '@/components/arena/Podium';
import { Segmented } from '@/components/arena/Segmented';
import { Button, Card, Icon, PressableScale, Screen, Skeleton, Text } from '@/components/ui';
import { leagues } from '@/lib/engine';
import {
  BOARD_SIZE,
  leaderboardConfigured,
  useLeaderboard,
  useLeagueBoard,
  useMyLeague,
  usePristineBoard,
  type MyLeague,
  type Period,
} from '@/lib/leaderboard';
import { makeStyles, useTheme } from '@/theme';

type View_ = 'league' | 'global';

const VIEWS: { value: View_; label: string }[] = [
  { value: 'league', label: 'My league' },
  { value: 'global', label: `Global top ${BOARD_SIZE}` },
];
const PERIODS: { value: Period; label: string }[] = [
  { value: 'week', label: 'This week' },
  { value: 'all', label: 'All time' },
];

/**
 * The leaderboard. "My league" is where the competition really is: your group of up to 30 players at your level this
 * week, with the promotion and demotion lines, or in Pristine the RR ladder. "Global" is the top 25 overall.
 */
export default function Leaderboard() {
  const t = useTheme();
  const styles = useStyles();
  const params = useLocalSearchParams<{ view?: string; period?: string }>();
  const [view, setView] = useState<View_>(params.view === 'global' ? 'global' : 'league');
  const me = useMyLeague();
  const refreshing = me.isRefetching;

  return (
    <Screen
      scroll
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void me.refetch()} tintColor={t.colors.hue.blue.base} />}
      header={
        <View style={styles.header}>
          <PressableScale
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/arena'))}
            accessibilityLabel="Back"
            hitSlop={t.space[2]}
          >
            <Icon icon={ChevronLeft} size="lg" color="textSecondary" />
          </PressableScale>
          <Text variant="title" style={styles.flex}>
            Leaderboard
          </Text>
        </View>
      }
    >
      <View style={styles.stack}>
        {!leaderboardConfigured ? (
          <BoardMessage />
        ) : (
          <>
            <Segmented options={VIEWS} value={view} onChange={setView} accessibilityLabel="Leaderboard view" />
            {view === 'league' ? <LeagueView me={me.data} loading={me.isPending} error={me.isError ? me.error : null} onRetry={() => void me.refetch()} /> : <GlobalView initial={params.period === 'all' ? 'all' : 'week'} />}
          </>
        )}
      </View>
    </Screen>
  );
}

function LeagueView({ me, loading, error, onRetry }: { me: MyLeague | null | undefined; loading: boolean; error: unknown; onRetry: () => void }) {
  const styles = useStyles();
  if (loading) return <Skeleton height={styles.bannerSkeleton.height as number} radius="lg" />;
  if (error && !me) return <BoardMessage error={error} onRetry={onRetry} />;
  if (!me) {
    return (
      <Card variant="tinted" hue="blue" style={styles.gap}>
        <Text variant="bodyStrong" hue="blue">
          Leagues start with a name
        </Text>
        <Text variant="callout" hue="blue">
          Roll a leaderboard name in the Arena and play a match: you start in Bronze, in a group of players at your level.
        </Text>
        <Button label="Go to the Arena" variant="secondary" onPress={() => router.replace('/arena')} />
      </Card>
    );
  }
  return (
    <View style={styles.stack}>
      <LeagueBanner me={me} />
      <LeagueLadder current={me.league} />
      {isPristine(me.league) ? <Ladder /> : <Group me={me} />}
    </View>
  );
}

function Group({ me }: { me: MyLeague }) {
  const styles = useStyles();
  const group = useLeagueBoard(me.rank !== null);
  const info = leagues.LEAGUES[me.league]!;
  if (me.rank === null) {
    return (
      <Card style={styles.gap}>
        <Text variant="heading">{`Join this week’s ${info.name} group`}</Text>
        <Text variant="callout" color="textSecondary">
          {`Your first match this week puts you in a group of up to ${leagues.GROUP_SIZE} ${info.name} players. Every match point counts; the top ${info.promote} move up when the week ends.`}
        </Text>
        <Button label="Play a match" icon={Swords} onPress={() => router.push('/match')} />
      </Card>
    );
  }
  if (group.isPending) return <BoardSkeleton rows={8} />;
  if (group.isError && !group.data?.length) return <BoardMessage error={group.error} onRetry={() => void group.refetch()} />;
  const size = group.data!.length;
  const entries: BoardEntry[] = group.data!.map((r) => ({
    key: `${r.rank}-${r.name}`,
    rank: r.rank,
    name: r.name,
    paint: r.paint,
    value: r.points,
    sub: `${r.matches} ${r.matches === 1 ? 'match' : 'matches'} this week`,
    isMe: r.isMe,
    zone: leagues.zoneOf({ league: me.league, rank: r.rank, size }),
  }));
  return (
    <View style={styles.gap}>
      {group.isError && <StaleNote at={group.dataUpdatedAt} onRetry={() => void group.refetch()} />}
      <BoardList entries={entries} nextLeague={leagues.LEAGUES[me.league + 1]?.name} prevLeague={leagues.LEAGUES[me.league - 1]?.name} />
      {me.league === leagues.PRISTINE - 1 && size < leagues.MIN_GROUP_FOR_PRISTINE && (
        <Text variant="caption" color="textTertiary">
          {`Pristine is earned against real competition: a Ruby group needs ${leagues.MIN_GROUP_FOR_PRISTINE} players before anyone moves up.`}
        </Text>
      )}
    </View>
  );
}

function Ladder() {
  const ladder = usePristineBoard();
  if (ladder.isPending) return <BoardSkeleton rows={8} />;
  if (ladder.isError && !ladder.data?.length) return <BoardMessage error={ladder.error} onRetry={() => void ladder.refetch()} />;
  const entries: BoardEntry[] = ladder.data!.map((r) => ({ key: `${r.rank}-${r.name}`, rank: r.rank, name: r.name, paint: r.paint, value: r.rr, isMe: r.isMe, league: leagues.PRISTINE }));
  return <BoardList entries={entries} unit="RR" />;
}

function GlobalView({ initial }: { initial: Period }) {
  const styles = useStyles();
  const [period, setPeriod] = useState<Period>(initial);
  const board = useLeaderboard(period);
  const rows = board.data ?? [];
  const top = rows.filter((r) => r.rank <= 3);
  return (
    <View style={styles.stack}>
      <Segmented options={PERIODS} value={period} onChange={setPeriod} accessibilityLabel="Leaderboard period" />
      <Text variant="callout" color="textSecondary">
        {period === 'week'
          ? `The top ${BOARD_SIZE} by points since Monday, 00:00 UTC, every league together.`
          : `The top ${BOARD_SIZE} by every point ever earned. Totals are shown short (12.3K, 4.56M) and stop at 9 quadrillion.`}
      </Text>
      {board.isPending ? (
        <BoardSkeleton rows={10} />
      ) : board.isError && !rows.length ? (
        <BoardMessage error={board.error} onRetry={() => void board.refetch()} />
      ) : rows.length === 0 ? (
        <BoardMessage empty="Nobody is on the board yet. Play a match to be first." />
      ) : (
        <>
          {board.isError && <StaleNote at={board.dataUpdatedAt} onRetry={() => void board.refetch()} />}
          {top.length >= 2 && (
            <Podium entries={top.map((r) => ({ key: `${r.rank}-${r.name}`, name: r.name, paint: r.paint, score: r.points, isMe: r.isMe, rank: r.rank }))} />
          )}
          <BoardList entries={toEntries(rows, BOARD_SIZE).filter((e) => top.length < 2 || e.rank > 3 || e.isMe)} />
          {rows.some((r) => r.isMe) ? null : (
            <Text variant="caption" color="textTertiary" align="center">
              {`Not in the top ${BOARD_SIZE} yet. Every match counts, and your ${leagueName(0)}-to-Pristine league runs alongside.`}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  header: { flexDirection: 'row', alignItems: 'center', gap: t.space[2], paddingVertical: t.space[3] },
  flex: { flex: 1 },
  stack: { gap: t.space[4], paddingTop: t.space[2] },
  gap: { gap: t.space[3] },
  bannerSkeleton: { height: t.space[20] + t.space[12] },
}));
