import { router } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import { View } from 'react-native';
import { SECTION_HUE } from '@/components/art/ItemArt';
import { Icon, PressableScale, Text } from '@/components/ui';
import type { Unit } from '@/lib/engine';
import { makeStyles, useTheme } from '@/theme';

/** The colored unit banner at the top of each stretch of path, with a guidebook button. */
export function UnitHeader({ unit, done, total }: { unit: Unit; done: number; total: number }) {
  const t = useTheme();
  const styles = useStyles();
  const hue = t.colors.hue[SECTION_HUE[unit.id] ?? 'green'];
  return (
    <View style={[styles.root, { backgroundColor: hue.base, borderBottomColor: hue.depth }]}>
      <View style={styles.text}>
        <Text variant="label" style={[styles.onColor, styles.faded]}>
          {`Unit ${unit.index + 1} · ${done}/${total} done`}
        </Text>
        <Text variant="title" style={styles.onColor}>
          {unit.title}
        </Text>
        <Text variant="callout" style={styles.onColor}>
          {unit.blurb}
        </Text>
      </View>
      <PressableScale
        haptic="selection"
        onPress={() => router.push({ pathname: '/unit/[id]', params: { id: unit.id } })}
        accessibilityLabel={`${unit.title} guidebook`}
        style={[styles.guide, { borderColor: hue.depth }]}
      >
        <Icon icon={BookOpen} size="lg" color="onColor" />
      </PressableScale>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space[3],
    borderRadius: t.radius.lg,
    borderBottomWidth: t.layout.depth.md,
    padding: t.space[4],
  },
  text: { flex: 1, gap: t.space[0.5] },
  onColor: { color: t.colors.onColor },
  faded: { opacity: t.opacity.pressed },
  guide: {
    width: t.layout.control.md + t.space[2],
    height: t.layout.control.md + t.space[2],
    borderRadius: t.radius.md,
    borderWidth: t.layout.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
