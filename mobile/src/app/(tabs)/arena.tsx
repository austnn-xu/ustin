import { router } from 'expo-router';
import { Flame, Hash, Medal, Swords, Target, Trophy, Users, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Coin } from '@/components/art/Coin';
import { Mascot } from '@/components/art/Mascot';
import { Avatar } from '@/components/arena/Avatar';
import { BoardList, BoardMessage, BoardSkeleton } from '@/components/arena/BoardList';
import { isPristine, LeagueBanner, LeagueLadder } from '@/components/arena/League';
import { NameSheet } from '@/components/arena/NameSheet';
import { StatsBar } from '@/components/StatsBar';
import { Button, Card, Icon, Input, ListRow, PressableScale, Screen, Text } from '@/components/ui';
import { arena, leagues, numbers } from '@/lib/engine';
import { haptics } from '@/lib/haptics';
import {
  ArenaError,
  createRoom,
  formatPin,
  leaderboardConfigured,
  useOutfitSync,
  useLeagueBoard,
  useMe,
  useMyLeague,
  usePristineBoard,
} from '@/lib/leaderboard';
import { useProgress } from '@/stores/progress';
import { useSettings } from '@/stores/settings';
import { makeStyles, useTheme, type HueName } from '@/theme';


type Pending = { then: 'quick' | 'host' } | null;

/**
 * The Arena: friendly competition. Quick timed matches against a real player's run (or Tin), game PINs to play with
 * friends, and your league. Coins and XP pay out like lessons; winning pays more.
 */
export default function Arena() {
  const t = useTheme();
  const styles = useStyles();
  const me = useMe();
  const stats = useProgress((s) => s.arena);
  const recentPins = useSettings((s) => s.recentPins);
  const [naming, setNaming] = useState<Pending | 'rename'>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [hosting, setHosting] = useState(false);
  const [hostError, setHostError] = useState<string | null>(null);
  const { MATCH, REWARDS } = arena;

  const named = !!me.data;
  // Keep what Tin is wearing on the leaderboard in step with the shop, so everyone sees the same Tin.
  useOutfitSync(named);
  // Ask for a name only once we know there is none; while it loads, the match screen sorts it out.
  const needsName = leaderboardConfigured && me.isSuccess && !me.data;

  const quick = () => {
    if (needsName) setNaming({ then: 'quick' });
    else router.push('/match');
  };

  const host = async () => {
    if (!named) {
      setNaming({ then: 'host' });
      return;
    }
    setHosting(true);
    setHostError(null);
    try {
      const room = await createRoom();
      useSettings.getState().rememberPin(room.code);
      router.push(`/pin/${room.code}`);
    } catch (e) {
      setHostError(e instanceof ArenaError ? e.message : 'Could not start a game.');
    } finally {
      setHosting(false);
    }
  };

  const join = () => {
    const code = pin.replace(/\D/g, '');
    if (code.length !== 6) {
      setPinError('A game PIN is 6 digits');
      haptics.error();
      return;
    }
    setPinError(null);
    setPin('');
    router.push(`/pin/${code}`);
  };

  return (
    <Screen
      scroll
      keyboard
      header={<StatsBar title="Arena" />}
      // Over the whole screen, not inside the scrolling page, so it is always where you are looking.
      overlay={
        naming && (
        <NameSheet
          current={naming === 'rename' ? me.data?.name : null}
          cancelLabel={naming !== 'rename' && naming.then === 'quick' ? 'Practice without a name' : 'Not now'}
          onCancel={() => {
            const next = naming;
            setNaming(null);
            if (next !== 'rename' && next.then === 'quick') router.push('/match?offline=1');
          }}
          onDone={() => {
            const next = naming;
            setNaming(null);
            if (next === 'rename') return;
            if (next.then === 'quick') router.push('/match');
            else void host();
          }}
        />
        )
      }
    >
      <View style={styles.stack}>
        <Card padding="lg" style={styles.hero}>
          <View style={styles.heroHead}>
            <Mascot mood="wow" size="sm" />
            <View style={styles.flex}>
              <Text variant="title">Quick match</Text>
              <Text variant="callout" color="textSecondary">
                {`${MATCH.questions} questions from the whole course, ${MATCH.questionMs / 1000} seconds each. Race a real player's run on the same questions, or Tin.`}
              </Text>
            </View>
          </View>
          <Button label="Play a match" icon={Swords} fullWidth onPress={quick} />
          {leaderboardConfigured && (
            <PressableScale
              haptic="selection"
              onPress={() => setNaming(named ? 'rename' : { then: 'quick' })}
              style={styles.who}
              accessibilityLabel={named ? `Playing as ${me.data!.name}. Change name` : 'Roll a leaderboard name'}
            >
              {named ? (
                <>
                  <Avatar name={me.data!.name} paint={me.data!.paint} size="sm" own />
                  <Text variant="callout" color="textSecondary" style={styles.flex} numberOfLines={1}>
                    {`Playing as ${me.data!.name}`}
                  </Text>
                  <Text variant="callout" hue="blue">
                    Change
                  </Text>
                </>
              ) : (
                <>
                  <Icon icon={Trophy} hue="blue" />
                  <Text variant="callout" hue="blue" style={styles.flex}>
                    Roll a name to get on the global leaderboard
                  </Text>
                </>
              )}
            </PressableScale>
          )}
        </Card>

        {/* Without the online leaderboard, leagues and PINs cannot work: say so once instead of on every card. */}
        {!leaderboardConfigured && (
          <Card padding="lg" style={styles.gap}>
            <View style={styles.titleRow}>
              <Icon icon={Trophy} hue="yellow" filled />
              <Text variant="heading">Leagues and game PINs</Text>
            </View>
            <BoardMessage />
          </Card>
        )}

        {leaderboardConfigured && <LeagueCard />}

        {leaderboardConfigured && (
        <Card padding="lg" style={styles.gap}>
          <View style={styles.titleRow}>
            <Icon icon={Users} hue="purple" />
            <Text variant="heading">Play with friends</Text>
          </View>
          <Text variant="callout" color="textSecondary">
            Host a game and share its 6-digit PIN. Everyone who joins answers the same questions, and the podium fills in as
            each friend finishes.
          </Text>
          <>
              <Button label={hosting ? 'Starting…' : 'Host a game'} variant="secondary" fullWidth disabled={hosting} onPress={host} />
              {hostError && (
                <Text variant="callout" hue="red">
                  {hostError}
                </Text>
              )}
              <View style={styles.joinRow}>
                <View style={styles.flex}>
                  <Input
                    value={pin}
                    onChangeText={(v) => {
                      setPin(v.replace(/[^\d ]/g, ''));
                      setPinError(null);
                    }}
                    placeholder="Game PIN"
                    icon={Hash}
                    keyboardType="number-pad"
                    maxLength={7}
                    returnKeyType="go"
                    onSubmitEditing={join}
                    accessibilityLabel="Game PIN"
                    error={pinError ?? undefined}
                  />
                </View>
                <Button label="Join" variant="neutral" labelHue="purple" onPress={join} />
              </View>
            </>
          {recentPins.length > 0 && (
            <View>
              <Text variant="label" color="textTertiary" style={styles.recentLabel}>
                Your recent games
              </Text>
              {recentPins.map((p) => (
                <ListRow key={p.code} title={`Game ${formatPin(p.code)}`} icon={Hash} onPress={() => router.push(`/pin/${p.code}`)} />
              ))}
            </View>
          )}
        </Card>
        )}

        <View style={styles.grid}>
          <Stat icon={Swords} hue="blue" value={stats.played} label="Matches" />
          <Stat icon={Medal} hue="yellow" value={stats.wins} label="Wins" />
          <Stat icon={Zap} hue="yellow" value={stats.best} label="Best score" />
          <Stat icon={Trophy} hue="purple" value={stats.points} label="Points earned" />
        </View>

        <Card variant="tinted" hue="yellow" style={styles.gap}>
          <Text variant="label" hue="yellow">
            What you earn
          </Text>
          <Earn art={<Coin size={t.layout.icon.md} />} text={`${REWARDS.coinPerCorrect} coin per right answer, +${REWARDS.coinsWin} for a win, +${REWARDS.coinsPerfect} for a perfect match`} />
          <Earn art={<Icon icon={Trophy} hue="yellow" shade="text" />} text={`League points: your score, +${REWARDS.pointsWin.toLocaleString('en-US')} for beating a player (+${REWARDS.pointsWinTin} for beating Tin). The top of your group moves up a league each week`} />
          <Earn art={<Icon icon={Flame} hue="orange" filled />} text="Every match counts for your streak and pays XP, like a lesson" />
        </Card>
      </View>
    </Screen>
  );
}

/**
 * Your league, at a glance: the banner, then the top of your group (or the Pristine ladder) and your own row. The full
 * table, and the global top 25, are one tap away.
 */
function LeagueCard() {
  const styles = useStyles();
  const my = useMyLeague();
  const pristine = !!my.data && isPristine(my.data.league);
  const group = useLeagueBoard(!!my.data && !pristine && my.data.rank !== null);
  const ladder = usePristineBoard(pristine);

  let preview: React.ReactNode = null;
  if (my.data && !pristine && group.data?.length) {
    const size = group.data.length;
    preview = (
      <BoardList
        entries={group.data
          .filter((r) => r.rank <= 3 || r.isMe)
          .map((r) => ({
            key: `${r.rank}-${r.name}`,
            rank: r.rank,
            name: r.name,
            paint: r.paint,
            value: r.points,
            isMe: r.isMe,
            zone: leagues.zoneOf({ league: my.data!.league, rank: r.rank, size }),
          }))}
      />
    );
  } else if (pristine && ladder.data?.length) {
    preview = (
      <BoardList
        unit="RR"
        entries={ladder.data
          .filter((r) => r.rank <= 3 || r.isMe)
          .map((r) => ({ key: `${r.rank}-${r.name}`, rank: r.rank, name: r.name, paint: r.paint, value: r.rr, isMe: r.isMe, league: leagues.PRISTINE }))}
      />
    );
  }

  return (
    <Card padding="lg" style={styles.gap}>
      <View style={styles.titleRow}>
        <Icon icon={Trophy} hue="yellow" filled />
        <Text variant="heading" style={styles.flex}>
          Your league
        </Text>
      </View>
      {!leaderboardConfigured ? (
        <BoardMessage />
      ) : my.isPending ? (
        <BoardSkeleton rows={2} />
      ) : my.isError && !my.data ? (
        <BoardMessage error={my.error} onRetry={() => void my.refetch()} />
      ) : !my.data ? (
        <>
          <LeagueLadder current={0} />
          <Text variant="callout" color="textSecondary">
            Roll a name and play a match to start in Bronze. Each week you race a group of up to 30 players at your level;
            the top move up, all the way to Pristine.
          </Text>
        </>
      ) : (
        <>
          <LeagueBanner me={my.data} size="md" />
          {preview}
        </>
      )}
      {leaderboardConfigured && <Button label="Open the leaderboard" variant="ghost" fullWidth onPress={() => router.push('/leaderboard')} />}
    </Card>
  );
}

function Stat({ icon, hue, value, label }: { icon: typeof Target; hue: HueName; value: number; label: string }) {
  const styles = useStyles();
  return (
    <Card style={styles.stat}>
      <Icon icon={icon} hue={hue} filled={icon === Zap} />
      <View style={styles.flex}>
        <Text variant="heading" tabular numberOfLines={1}>
          {numbers.compact(value)}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Card>
  );
}

function Earn({ art, text }: { art: React.ReactNode; text: string }) {
  const styles = useStyles();
  return (
    <View style={styles.earn}>
      {art}
      <Text variant="callout" hue="yellow" style={styles.flex}>
        {text}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  stack: { gap: t.space[4], paddingTop: t.space[2] },
  hero: { gap: t.space[4] },
  heroHead: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  who: { flexDirection: 'row', alignItems: 'center', gap: t.space[2], minHeight: t.layout.hitTarget },
  flex: { flex: 1, minWidth: 0 },
  gap: { gap: t.space[3] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[2] },
  joinRow: { flexDirection: 'row', alignItems: 'flex-start', gap: t.space[2] },
  recentLabel: { marginTop: t.space[2], marginBottom: t.space[1] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] },
  stat: { flexBasis: '46%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  earn: { flexDirection: 'row', alignItems: 'flex-start', gap: t.space[3] },
}));
