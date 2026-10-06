import { View } from 'react-native';
import { ItemArt } from '@/components/art/ItemArt';
import { Card, Chip, Text } from '@/components/ui';
import type { ExerciseItem } from '@/lib/engine';
import { makeStyles } from '@/theme';

/** The thing being asked about: its picture, name, which part, what it is made of, and the situation it is in. */
export function ItemCard({ item }: { item: ExerciseItem }) {
  const styles = useStyles();
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <ItemArt objectId={item.objectId} size="lg" />
        <View style={styles.text}>
          <Text variant="title">{item.part ?? item.label}</Text>
          {item.part && (
            <Text variant="callout" color="textSecondary">
              {`Part of a ${item.label.toLowerCase()}`}
            </Text>
          )}
          {item.material && (
            <Text variant="caption" color="textTertiary">
              {item.material}
            </Text>
          )}
        </View>
      </View>
      {item.scenario.length > 0 && (
        <View style={styles.chips}>
          {item.scenario.map((s) => (
            <Chip key={s} label={s} hue="blue" />
          ))}
        </View>
      )}
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { gap: t.space[3] },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space[4] },
  text: { flex: 1, gap: t.space[0.5] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] },
}));
