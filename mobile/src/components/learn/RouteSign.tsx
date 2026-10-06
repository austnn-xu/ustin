import { router } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import { View } from 'react-native';
import { Icon, PressableScale, Text } from '@/components/ui';
import type { Unit } from '@/lib/engine';
import { makeStyles, useTheme, type HueName } from '@/theme';

/** The overhead road sign that opens each unit: "Route 3 · Takeout & packaging", on two posts over the road. */
export function RouteSign({ unit, hue: hueName, done, total }: { unit: Unit; hue: HueName; done: number; total: number }) {
  const t = useTheme();
  const styles = useStyles();
  const hue = t.colors.hue[hueName];
  return (
    <View style={styles.wrap}>
      <View style={[styles.post, styles.postLeft]} />
      <View style={[styles.post, styles.postRight]} />
      <View style={[styles.board, { backgroundColor: hue.base, borderBottomColor: hue.depth }]}>
        <View style={styles.inner}>
          <View style={styles.text}>
            <View style={styles.routeRow}>
              <View style={styles.shield}>
                <Text variant="label" hue={hueName}>
                  {`Route ${unit.index + 1}`}
                </Text>
              </View>
              <Text variant="label" style={styles.onColor}>
                {`${done}/${total} stops`}
              </Text>
            </View>
            <Text variant="title" style={styles.onColor} numberOfLines={1}>
              {unit.title}
            </Text>
            <Text variant="callout" style={styles.onColor} numberOfLines={2}>
              {unit.blurb}
            </Text>
          </View>
          <PressableScale
            haptic="selection"
            onPress={() => router.push({ pathname: '/unit/[id]', params: { id: unit.id } })}
            accessibilityLabel={`${unit.title} guidebook`}
            style={styles.guide}
          >
            <Icon icon={BookOpen} size="lg" hue={hueName} />
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { paddingHorizontal: t.layout.gutter, paddingTop: t.space[6], height: t.layout.route.sign },
  post: {
    position: 'absolute',
    top: t.space[16],
    bottom: 0,
    width: t.space[2],
    borderRadius: t.radius.xs,
    backgroundColor: t.colors.scene.pole,
  },
  postLeft: { left: t.layout.gutter + t.space[6] },
  postRight: { right: t.layout.gutter + t.space[6] },
  board: { borderRadius: t.radius.lg, borderBottomWidth: t.layout.depth.md, padding: t.space[1.5] },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space[3],
    borderRadius: t.radius.md,
    borderWidth: t.layout.border,
    borderColor: t.colors.shine,
    paddingVertical: t.space[2],
    paddingHorizontal: t.space[3],
  },
  text: { flex: 1, gap: t.space[0.5] },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[2] },
  shield: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.xs,
    paddingHorizontal: t.space[1.5],
    paddingVertical: t.space[0.5],
  },
  onColor: { color: t.colors.onColor },
  guide: {
    width: t.layout.control.md,
    height: t.layout.control.md,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
