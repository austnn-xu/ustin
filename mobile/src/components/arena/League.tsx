import { ArrowDown, ArrowUp, Clock } from 'lucide-react-native';
import { View } from 'react-native';
import { LeagueBadge } from '@/components/art/LeagueBadge';
import { Icon, Text } from '@/components/ui';
import { leagues, numbers } from '@/lib/engine';
import type { MyLeague } from '@/lib/leaderboard';
import { makeStyles, useTheme, type LeagueId } from '@/theme';

export const leagueId = (index: number): LeagueId => (leagues.LEAGUES[index]?.id ?? 'bronze') as LeagueId;
export const leagueName = (index: number) => leagues.LEAGUES[index]?.name ?? 'Bronze';
export const isPristine = (index: number) => index === leagues.PRISTINE;

/** "2d 5h left", "5h 12m left", "12m left": how long this week's groups have. */
export function timeLeft(now = new Date()) {
  const ms = leagues.msUntilWeekEnd(now);
  const m = Math.max(1, Math.floor(ms / 60_000));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  return d > 0 ? `${d}d ${h}h left` : h > 0 ? `${h}h ${m % 60}m left` : `${m}m left`;
}

/**
 * The header of a league: its badge, its name, where you stand and what the week holds. In Pristine it shows RR and
 * your place on the ladder instead of a group.
 */
export function LeagueBanner({ me, size = 'lg' }: { me: MyLeague; size?: 'md' | 'lg' }) {
  const t = useTheme();
  const styles = useStyles();
  const id = leagueId(me.league);
  const c = t.colors.league[id];
  const info = leagues.LEAGUES[me.league]!;
  const next = leagues.LEAGUES[me.league + 1];
  const prev = leagues.LEAGUES[me.league - 1];
  const badge = size === 'lg' ? t.layout.mascot.md : t.layout.mascot.sm;

  let line: string;
  if (isPristine(me.league)) {
    line = me.pristineRank ? `#${me.pristineRank} of ${me.pristineSize} on the Pristine ladder` : 'On the Pristine ladder';
  } else if (me.rank && me.size) {
    line = `#${me.rank} of ${me.size} in your group · ${numbers.compact(me.points)} pts`;
  } else {
    line = 'Play a match to join this week’s group';
  }

  return (
    <View style={[styles.banner, { backgroundColor: c.subtle, borderColor: c.base }]}>
      <LeagueBadge league={id} size={badge} />
      <View style={styles.flex}>
        <Text variant="label" style={{ color: c.text }}>
          {isPristine(me.league) ? 'Top league' : `League ${me.league + 1} of ${leagues.LEAGUES.length}`}
        </Text>
        <Text variant={size === 'lg' ? 'display' : 'title'} style={{ color: c.text }}>
          {isPristine(me.league) ? 'Pristine' : `${info.name} League`}
        </Text>
        {isPristine(me.league) && (
          <Text variant="title" style={{ color: c.text }} tabular>
            {`${numbers.compact(me.rr)} RR`}
          </Text>
        )}
        <Text variant="callout" color="textSecondary">
          {line}
        </Text>
        {!isPristine(me.league) && (
          <View style={styles.meta}>
            <Icon icon={Clock} size="sm" color="textTertiary" />
            <Text variant="caption" color="textSecondary">
              {timeLeft()}
            </Text>
            {next && info.promote > 0 && (
              <>
                <Icon icon={ArrowUp} size="sm" hue="green" shade="text" />
                <Text variant="caption" hue="green">{`Top ${info.promote} → ${next.name}`}</Text>
              </>
            )}
            {prev && info.demote > 0 && (
              <>
                <Icon icon={ArrowDown} size="sm" hue="red" shade="text" />
                <Text variant="caption" hue="red">{`Bottom ${info.demote} → ${prev.name}`}</Text>
              </>
            )}
          </View>
        )}
        {isPristine(me.league) && (
          <Text variant="caption" color="textSecondary">
            Win quick matches for RR; drop below 0 and you return to Ruby.
          </Text>
        )}
      </View>
    </View>
  );
}

/** All eight leagues in a row, yours raised and ringed, the ones above it dimmed: the climb at a glance. */
export function LeagueLadder({ current }: { current: number }) {
  const t = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.ladder} accessibilityLabel={`League ${current + 1} of ${leagues.LEAGUES.length}: ${leagueName(current)}`}>
      {leagues.LEAGUES.map((l, i) => {
        const id = l.id as LeagueId;
        const here = i === current;
        return (
          <View key={l.id} style={[styles.rung, here && styles.rungHere, i > current && styles.locked]}>
            <View style={[styles.ring, here && { borderColor: t.colors.league[id].base, backgroundColor: t.colors.league[id].subtle }]}>
              <LeagueBadge league={id} size={here ? t.layout.icon.xl : t.layout.icon.lg} />
            </View>
            {/* Only your league is named: eight names do not fit a phone, and the badges tell them apart. */}
            {here && (
              <Text variant="label" color="text" numberOfLines={1} style={styles.rungLabel}>
                {l.name}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space[4],
    padding: t.space[4],
    borderRadius: t.radius.lg,
    borderWidth: t.layout.border,
  },
  flex: { flex: 1, minWidth: 0, gap: t.space[0.5] },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: t.space[1], marginTop: t.space[1] },
  ladder: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  rung: { alignItems: 'center', gap: t.space[1], flex: 1, minWidth: 0 },
  /** Your league gets room for its whole name. */
  rungHere: { flex: 2 },
  locked: { opacity: t.opacity.muted },
  ring: { borderRadius: t.radius.pill, borderWidth: t.layout.border, borderColor: 'transparent', padding: t.space[0.5] },
  rungLabel: { letterSpacing: 0, textTransform: 'none' },
}));
