import * as Linking from 'expo-linking';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { BoardList, BoardMessage, BoardSkeleton, type BoardEntry } from '@/components/arena/BoardList';
import { Podium } from '@/components/arena/Podium';
import { MascotSays } from '@/components/MascotSays';
import { Button, Card, Icon, PressableScale, Screen, Skeleton, Text } from '@/components/ui';
import { arena } from '@/lib/engine';
import { haptics } from '@/lib/haptics';
import { ArenaError, formatPin, leaderboardConfigured, useRoom, useRoomBoard } from '@/lib/leaderboard';
import { useSettings } from '@/stores/settings';
import { makeStyles, useTheme } from '@/theme';

const fmt = (n: number) => n.toLocaleString('en-US');

/**
 * A game PIN's lobby and podium: the PIN to share, who has played, and Play. Kahoot's game PIN, made for friends who
 * are not in the same room at the same time: each person plays the same questions when they can, and the podium
 * fills in live as they finish.
 */
export default function PinScreen() {
  const t = useTheme();
  const styles = useStyles();
  const { code: raw } = useLocalSearchParams<{ code: string }>();
  const code = (raw ?? '').replace(/\D/g, '').slice(0, 6);
  const focused = useIsFocused();
  const room = useRoom(code.length === 6 ? code : undefined);
  const board = useRoomBoard(room.data ? code : undefined, focused);
  const [shareText, setShareText] = useState<string | null>(null);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/arena'));

  const header = (
    <View style={styles.header}>
      <PressableScale onPress={back} accessibilityLabel="Back" hitSlop={t.space[2]}>
        <Icon icon={ChevronLeft} size="lg" color="textSecondary" />
      </PressableScale>
      <Text variant="title" style={styles.flex}>
        Play with friends
      </Text>
    </View>
  );

  if (!leaderboardConfigured) {
    return (
      <Screen scroll header={header}>
        <BoardMessage />
      </Screen>
    );
  }

  if (room.isError || code.length !== 6) {
    const ended = code.length !== 6 || (room.error instanceof ArenaError && room.error.kind === 'ended');
    return (
      <Screen scroll header={header} footer={<Button label={ended ? 'Back to the Arena' : 'Try again'} fullWidth onPress={ended ? back : () => void room.refetch()} />}>
        <View style={styles.centered}>
          <MascotSays mood={ended ? 'sad' : 'worried'} layout="above" size="lg">
            {ended
              ? `Game ${formatPin(code.padEnd(6, '·'))} has ended. Check the digits, or host your own.`
              : room.error instanceof ArenaError
                ? room.error.message
                : 'Could not open this game.'}
          </MascotSays>
        </View>
      </Screen>
    );
  }

  const mine = board.data?.find((r) => r.isMe);
  const share = async () => {
    // On the web this page's own address is the invite (it keeps any base path, which createURL drops).
    const url = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.href.split(/[?#]/)[0]! : Linking.createURL(`/pin/${code}`);
    const message = `Race me in US Tin! Game PIN ${formatPin(code)} · ${arena.MATCH.questions} questions on where things go. ${url}`;
    haptics.light();
    useSettings.getState().rememberPin(code);
    try {
      await Share.share({ message, url });
    } catch {
      // No share sheet (most desktop browsers): show the invite so it can be copied by hand.
      setShareText(message);
    }
  };

  const entries: BoardEntry[] = (board.data ?? []).map((r) => ({
    key: `${r.rank}-${r.name}`,
    rank: r.rank,
    name: r.name,
    paint: r.paint,
    value: r.score,
    sub: `${r.correct}/${arena.MATCH.questions} right`,
    isMe: r.isMe,
  }));

  return (
    <Screen
      scroll
      header={header}
      footer={
        mine ? (
          <Button label="Play a quick match" variant="secondary" fullWidth onPress={() => router.push('/match')} />
        ) : (
          <Button label="Play" fullWidth disabled={!room.data} onPress={() => router.push(`/match?pin=${code}`)} />
        )
      }
    >
      <View style={styles.stack}>
        <Card padding="lg" style={styles.pinCard}>
          <Text variant="label" color="textTertiary">
            Game PIN
          </Text>
          <Text variant="hero" hue="purple" tabular selectable accessibilityLabel={`Game PIN ${code.split('').join(' ')}`}>
            {formatPin(code)}
          </Text>
          {room.data ? (
            <Text variant="callout" color="textSecondary" align="center">
              {`Hosted by ${room.data.host}. Open for a week.`}
            </Text>
          ) : (
            <Skeleton width="70%" />
          )}
          <Button label="Invite friends" icon={Share2} variant="secondary" onPress={share} />
          {shareText && (
            <Card variant="tinted" hue="purple">
              <Text variant="callout" hue="purple" selectable>
                {shareText}
              </Text>
            </Card>
          )}
        </Card>

        {mine && (
          <Card variant="tinted" hue="blue">
            <Text variant="bodyStrong" hue="blue">
              {`You scored ${fmt(mine.score)}: #${mine.rank} of ${entries.length}.`}
            </Text>
          </Card>
        )}

        <Text variant="heading">{entries.length > 0 ? 'The podium' : 'Who has played'}</Text>
        {board.isPending ? (
          <BoardSkeleton rows={3} />
        ) : board.isError ? (
          <BoardMessage error={board.error} onRetry={() => void board.refetch()} />
        ) : entries.length === 0 ? (
          <BoardMessage empty="Nobody's played yet. Share the PIN and set the bar." />
        ) : (
          <>
            <Podium entries={entries.slice(0, 3).map((e) => ({ key: e.key, name: e.name, paint: e.paint, score: e.value, isMe: e.isMe, rank: e.rank }))} />
            <BoardList entries={entries} />
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: t.space[8] },
  pinCard: { alignItems: 'center', gap: t.space[3] },
}));
