import { ArrowDown, ArrowUp, CloudOff, Crown, Trophy } from 'lucide-react-native';
import { LeagueBadge } from '@/components/art/LeagueBadge';
import { View } from 'react-native';
import { Button, Card, Icon, PressableScale, Skeleton, Text } from '@/components/ui';
import { numbers } from '@/lib/engine';
import { ArenaError, leaderboardConfigured, type BoardRow } from '@/lib/leaderboard';
import { makeStyles, useTheme, type HueName } from '@/theme';
import { Avatar } from './Avatar';

export type BoardEntry = {
  key: string;
  rank: number;
  name: string;
  paint: HueName;
  /** The number the board is ranked by (points, or a match score). */
  value: number;
  /** A small line under the name, e.g. "3 wins · 7 matches". */
  sub?: string;
  isMe: boolean;
  /** The player's league: a small badge before their name. */
  league?: number;
  /** In a league group: moving up, staying, or dropping at the end of the week. */
  zone?: 'up' | 'safe' | 'down';
};

/** Totals on a board are shown short (12.3K, 4.56M, 9Qa) so a row never overflows, however big the numbers get. */
const fmt = (n: number) => numbers.compact(n);
const LEAGUE_IDS = ['bronze', 'silver', 'gold', 'emerald', 'diamond', 'sapphire', 'ruby', 'pristine'] as const;

/** Board rows as list entries: the top few, plus your own row wherever you are. */
export function toEntries(rows: BoardRow[], top: number): BoardEntry[] {
  return rows
    .filter((r) => r.rank <= top || r.isMe)
    .map((r) => ({
      key: `${r.rank}-${r.name}`,
      rank: r.rank,
      name: r.name,
      paint: r.paint,
      value: r.points,
      sub: `${r.wins} ${r.wins === 1 ? 'win' : 'wins'} · ${r.matches} ${r.matches === 1 ? 'match' : 'matches'}`,
      isMe: r.isMe,
      league: r.league,
    }));
}


/**
 * A ranked list of players. The top three get a yellow rank; your own row is tinted blue and labelled You. In a league
 * group, lines mark where the promotion zone ends and the demotion zone starts (Duolingo-style).
 */
export function BoardList({ entries, unit = 'pts', nextLeague, prevLeague }: { entries: BoardEntry[]; unit?: string; nextLeague?: string; prevLeague?: string }) {
  const styles = useStyles();
  let previous = 0;
  let previousZone: BoardEntry['zone'];
  return (
    <View style={styles.list}>
      {entries.map((e) => {
        // Your row can sit far below the top: say so with a gap rather than pretending the ranks run on.
        const gap = previous > 0 && e.rank > previous + 1;
        const upEnds = previousZone === 'up' && e.zone !== 'up';
        const downStarts = e.zone === 'down' && previousZone !== 'down' && previous > 0;
        previous = e.rank;
        previousZone = e.zone;
        return (
          <View key={e.key}>
            {gap && (
              <Text variant="callout" color="textTertiary" align="center" style={styles.gap}>
                ⋯
              </Text>
            )}
            {upEnds && <ZoneLine up label={nextLeague ? `Promotion zone: up to ${nextLeague}` : 'Promotion zone'} />}
            {downStarts && <ZoneLine label={prevLeague ? `Demotion zone: down to ${prevLeague}` : 'Demotion zone'} />}
            <Row entry={e} unit={unit} />
          </View>
        );
      })}
    </View>
  );
}

function ZoneLine({ up = false, label }: { up?: boolean; label: string }) {
  const t = useTheme();
  const styles = useStyles();
  const hue = up ? 'green' : 'red';
  return (
    <View style={styles.zone} accessibilityRole="text">
      <View style={[styles.zoneRule, { backgroundColor: t.colors.hue[hue].base }]} />
      <Icon icon={up ? ArrowUp : ArrowDown} size="sm" hue={hue} shade="text" />
      <Text variant="label" hue={hue}>
        {label}
      </Text>
      <View style={[styles.zoneRule, { backgroundColor: t.colors.hue[hue].base }]} />
    </View>
  );
}

function Row({ entry: e, unit }: { entry: BoardEntry; unit: string }) {
  const t = useTheme();
  const styles = useStyles();
  const podium = e.rank <= 3;
  const zoneHue = e.zone === 'up' ? 'green' : e.zone === 'down' ? 'red' : undefined;
  return (
    <View
      style={[styles.row, e.isMe && styles.me]}
      accessible
      accessibilityLabel={`${e.isMe ? 'You, ' : ''}${e.name}, rank ${e.rank}, ${e.value.toLocaleString('en-US')} ${unit}${e.sub ? `, ${e.sub}` : ''}`}
    >
      <View style={[styles.rank, podium && styles.rankPodium]}>
        {e.rank === 1 ? (
          <Icon icon={Crown} size="sm" hue="yellow" shade="text" />
        ) : (
          <Text variant="bodyStrong" hue={zoneHue ?? (podium ? 'yellow' : undefined)} color="textTertiary" tabular>
            {e.rank}
          </Text>
        )}
      </View>
      <Avatar name={e.name} paint={e.paint} size="sm" own={e.isMe} />
      <View style={styles.flex}>
        <View style={styles.nameRow}>
          {e.league !== undefined && <LeagueBadge league={LEAGUE_IDS[e.league] ?? 'bronze'} size={t.layout.icon.md} />}
          <Text variant="bodyStrong" numberOfLines={1} style={styles.shrink}>
            {e.name}
          </Text>
          {e.isMe && (
            <View style={styles.youTag}>
              <Text variant="label" color="onColor">
                You
              </Text>
            </View>
          )}
        </View>
        {e.sub && (
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {e.sub}
          </Text>
        )}
      </View>
      <View style={styles.value}>
        <Text variant="heading" hue={e.isMe ? 'blue' : undefined} tabular>
          {fmt(e.value)}
        </Text>
        {unit === 'RR' && (
          <Text variant="label" color="textTertiary">
            RR
          </Text>
        )}
      </View>
    </View>
  );
}

/** Shown over a saved board when it could not be refreshed: say how old it is, and offer to try again. */
export function StaleNote({ at, onRetry }: { at: number; onRetry: () => void }) {
  const styles = useStyles();
  const when = at ? new Date(at).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : 'earlier';
  return (
    <PressableScale haptic="selection" onPress={onRetry} style={styles.stale} accessibilityLabel={`Offline. Board from ${when}. Tap to retry`}>
      <Icon icon={CloudOff} size="sm" color="textTertiary" />
      <Text variant="caption" color="textSecondary" style={styles.flex}>
        {`Offline. Board from ${when}.`}
      </Text>
      <Text variant="caption" hue="blue">
        Retry
      </Text>
    </PressableScale>
  );
}

/** The shape of a board while it loads. */
export function BoardSkeleton({ rows = 5 }: { rows?: number }) {
  const t = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.list} accessibilityLabel="Loading the leaderboard">
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.row}>
          <Skeleton circle width={t.layout.control.sm} height={t.layout.control.sm} />
          <View style={styles.flex}>
            <Skeleton width="55%" height={t.space[4]} />
          </View>
          <Skeleton width={t.space[16]} height={t.space[5]} />
        </View>
      ))}
    </View>
  );
}

/** What a board shows when it cannot show players: not connected, unreachable (with retry), or nobody yet. */
export function BoardMessage({
  error,
  onRetry,
  empty,
}: {
  error?: unknown;
  onRetry?: () => void;
  /** The empty state: nobody has played yet. */
  empty?: string;
}) {
  const styles = useStyles();
  if (!leaderboardConfigured) {
    return (
      <Card variant="tinted" hue="slate" style={styles.message}>
        <Icon icon={CloudOff} hue="slate" shade="text" />
        <Text variant="callout" hue="slate" style={styles.flex}>
          The leaderboard is offline. You can still play me for coins.
        </Text>
      </Card>
    );
  }
  if (error) {
    return (
      <Card variant="tinted" hue="red" style={styles.messageStack}>
        <View style={styles.messageRow}>
          <Icon icon={CloudOff} hue="red" shade="text" />
          <Text variant="callout" hue="red" style={styles.flex}>
            {error instanceof ArenaError ? error.message : 'Could not load the leaderboard.'}
          </Text>
        </View>
        {onRetry && <Button label="Try again" variant="neutral" labelHue="red" size="md" onPress={onRetry} />}
      </Card>
    );
  }
  return (
    <Card variant="tinted" hue="yellow" style={styles.message}>
      <Icon icon={Trophy} hue="yellow" shade="text" />
      <Text variant="callout" hue="yellow" style={styles.flex}>
        {empty}
      </Text>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  list: { gap: t.space[1] },
  value: { alignItems: 'flex-end' },
  zone: { flexDirection: 'row', alignItems: 'center', gap: t.space[2], paddingVertical: t.space[2] },
  zoneRule: { flex: 1, height: t.layout.border, borderRadius: t.radius.pill },
  gap: { paddingVertical: t.space[0.5] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space[3],
    paddingVertical: t.space[2],
    paddingHorizontal: t.space[2],
    borderRadius: t.radius.md,
    borderWidth: t.layout.border,
    borderColor: 'transparent',
  },
  me: { backgroundColor: t.colors.hue.blue.subtle, borderColor: t.colors.hue.blue.base },
  rank: { width: t.space[8], height: t.space[8], borderRadius: t.radius.pill, alignItems: 'center', justifyContent: 'center' },
  rankPodium: { backgroundColor: t.colors.hue.yellow.subtle },
  flex: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[2] },
  youTag: { backgroundColor: t.colors.hue.blue.base, borderRadius: t.radius.pill, paddingHorizontal: t.space[2] },
  message: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  messageStack: { gap: t.space[3] },
  stale: { flexDirection: 'row', alignItems: 'center', gap: t.space[2], minHeight: t.layout.hitTarget },
  messageRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
}));
