import type { LucideIcon } from 'lucide-react-native';
import { Fragment } from 'react';
import { View } from 'react-native';
import { Card, Icon, Text } from '@/components/ui';
import { numbers } from '@/lib/engine';
import { makeStyles, type HueName } from '@/theme';

export type Stat = { icon: LucideIcon; hue: HueName; value: number; label: string; filled?: boolean };

/**
 * A few numbers side by side in one card, split by hairlines. One calm object instead of a grid of boxes, each with its
 * own loud icon (the dashboard look generated apps fall into).
 */
export function StatRow({ stats }: { stats: Stat[] }) {
  const styles = useStyles();
  return (
    <Card style={styles.row} accessibilityLabel={stats.map((s) => `${s.label}: ${numbers.compact(s.value)}`).join(', ')}>
      {stats.map((s, i) => (
        <Fragment key={s.label}>
          {i > 0 && <View style={styles.rule} />}
          <View style={styles.cell}>
            <Icon icon={s.icon} size="sm" hue={s.hue} filled={s.filled} />
            <Text variant="title" tabular numberOfLines={1}>
              {numbers.compact(s.value)}
            </Text>
            <Text variant="caption" color="textSecondary" numberOfLines={1} align="center">
              {s.label}
            </Text>
          </View>
        </Fragment>
      ))}
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'stretch', paddingHorizontal: t.space[2] },
  cell: { flex: 1, alignItems: 'center', gap: t.space[1], paddingVertical: t.space[1] },
  rule: { width: t.layout.hairline, backgroundColor: t.colors.border },
}));
