import { Crown } from 'lucide-react-native';
import { View } from 'react-native';
import { Appear, Icon, Text } from '@/components/ui';
import { makeStyles, useTheme, type HueName } from '@/theme';
import { Avatar } from './Avatar';

/** `rank` is the shared place on a tie; without it, the order given is the place. */
export type PodiumEntry = { key: string; name: string; paint: HueName; score: number; isMe: boolean; rank?: number };

const fmt = (n: number) => n.toLocaleString('en-US');

/**
 * The end of a match: up to three players on blocks, first in the middle and tallest. The blocks rise once, third place
 * first and the winner last, in one beat.
 */
export function Podium({ entries }: { entries: PodiumEntry[] }) {
  const t = useTheme();
  const styles = useStyles();
  const top = entries.slice(0, 3);
  // Lay out as 2nd · 1st · 3rd.
  const order = [top[1], top[0], top[2]];
  const heights = [t.space[16], t.space[20] + t.space[4], t.space[12]];
  const places = [2, 1, 3];
  const arrive = [1, 2, 0];

  return (
    <View style={styles.row} accessibilityLabel={top.map((e, i) => `${i + 1}: ${e.isMe ? 'You' : e.name}, ${fmt(e.score)}`).join('. ')}>
      {order.map((e, i) =>
        e ? (
          <Appear key={e.key} index={arrive[i]} style={styles.col}>
            {(e.rank ?? places[i]) === 1 && <Icon icon={Crown} hue="yellow" filled size="lg" />}
            <Avatar name={e.name} paint={e.paint} size={places[i] === 1 ? 'lg' : 'md'} />
            <Text variant="bodyStrong" numberOfLines={1} align="center" hue={e.isMe ? 'blue' : undefined}>
              {e.isMe ? 'You' : e.name}
            </Text>
            <Text variant="callout" color="textSecondary" tabular align="center">
              {fmt(e.score)}
            </Text>
            <View style={[styles.block, (e.rank ?? places[i]) === 1 ? styles.gold : styles.plain, { height: heights[i] }]}>
              <Text variant="display" color={(e.rank ?? places[i]) === 1 ? 'onColor' : 'textTertiary'}>
                {e.rank ?? places[i]}
              </Text>
            </View>
          </Appear>
        ) : (
          <View key={`empty-${i}`} style={styles.col} />
        ),
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: t.space[2], alignSelf: 'stretch' },
  col: { flex: 1, alignItems: 'center', gap: t.space[1], minWidth: 0 },
  block: {
    alignSelf: 'stretch',
    marginTop: t.space[2],
    borderTopLeftRadius: t.radius.md,
    borderTopRightRadius: t.radius.md,
    borderWidth: t.layout.border,
    borderBottomWidth: 0,
    alignItems: 'center',
    paddingTop: t.space[2],
  },
  gold: { backgroundColor: t.colors.hue.yellow.base, borderColor: t.colors.hue.yellow.depth },
  plain: { backgroundColor: t.colors.fill, borderColor: t.colors.border },
}));
