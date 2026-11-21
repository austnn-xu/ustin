import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { BoardList, BoardMessage, BoardSkeleton, StaleNote, toEntries } from '@/components/arena/BoardList';
import { Segmented } from '@/components/arena/Segmented';
import { Icon, PressableScale, Screen, Text } from '@/components/ui';
import { leaderboardConfigured, useLeaderboard, type Period } from '@/lib/leaderboard';
import { makeStyles, useTheme } from '@/theme';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'week', label: 'This week' },
  { value: 'all', label: 'All time' },
];

/** The global leaderboard: the top 50 players, this week or all time, and your own row wherever you are. */
export default function Leaderboard() {
  const t = useTheme();
  const styles = useStyles();
  const params = useLocalSearchParams<{ period?: string }>();
  const [period, setPeriod] = useState<Period>(params.period === 'all' ? 'all' : 'week');
  const board = useLeaderboard(period, 50);

  return (
    <Screen
      scroll
      refreshControl={<RefreshControl refreshing={board.isRefetching} onRefresh={() => void board.refetch()} tintColor={t.colors.hue.blue.base} />}
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
            Global leaderboard
          </Text>
        </View>
      }
    >
      <View style={styles.stack}>
        {leaderboardConfigured && <Segmented options={PERIODS} value={period} onChange={setPeriod} accessibilityLabel="Leaderboard period" />}
        <Text variant="callout" color="textSecondary">
          {period === 'week'
            ? 'Points from matches since Monday, 00:00 UTC. Everyone starts fresh each week.'
            : 'Every point from every match, since the Arena opened.'}
        </Text>
        {!leaderboardConfigured ? (
          <BoardMessage />
        ) : board.isPending ? (
          <BoardSkeleton rows={10} />
        ) : board.isError && !board.data?.length ? (
          <BoardMessage error={board.error} onRetry={() => void board.refetch()} />
        ) : board.data.length === 0 ? (
          <BoardMessage empty="Nobody is on the board yet. Play a match to be first." />
        ) : (
          <>
            {board.isError && <StaleNote at={board.dataUpdatedAt} onRetry={() => void board.refetch()} />}
            <BoardList entries={toEntries(board.data, 50)} />
          </>
        )}
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: { flexDirection: 'row', alignItems: 'center', gap: t.space[2], paddingVertical: t.space[3] },
  flex: { flex: 1 },
  stack: { gap: t.space[4], paddingTop: t.space[2] },
}));
