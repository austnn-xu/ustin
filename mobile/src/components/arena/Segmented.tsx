import { View } from 'react-native';
import { PressableScale, Text } from '@/components/ui';
import { makeStyles } from '@/theme';

export type SegmentedProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

/** Two or three side-by-side choices, like This week / All time. The chosen one is the blue outlined tile. */
export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedProps<T>) {
  const styles = useStyles();
  return (
    <View style={styles.row} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <PressableScale
            key={o.value}
            haptic="selection"
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[styles.option, on && styles.on]}
          >
            <Text variant="bodyStrong" hue={on ? 'blue' : undefined} color="textSecondary" align="center">
              {o.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    gap: t.space[1],
    padding: t.space[1],
    borderRadius: t.radius.md,
    backgroundColor: t.colors.fill,
  },
  option: {
    flex: 1,
    minHeight: t.layout.control.sm,
    justifyContent: 'center',
    borderRadius: t.radius.sm,
    borderWidth: t.layout.border,
    borderColor: 'transparent',
  },
  on: { backgroundColor: t.colors.surface, borderColor: t.colors.hue.blue.base },
}));
