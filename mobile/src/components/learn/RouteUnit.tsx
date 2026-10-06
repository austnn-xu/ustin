import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SECTION_HUE } from '@/components/art/ItemArt';
import { PROPS, SceneryProp, TruckArt } from '@/components/art/RouteArt';
import { Text } from '@/components/ui';
import { lessonState, unitProgress } from '@/lib/course';
import type { Unit } from '@/lib/engine';
import type { LessonRecord } from '@/stores/progress';
import { makeStyles, useTheme } from '@/theme';
import { LessonCard } from './LessonCard';
import { RouteSign } from './RouteSign';
import { RouteStop } from './RouteStop';

/** The road winds: each stop sits this many amplitudes left or right of the centre line. */
const PATTERN = [0, 1, 1.35, 1, 0, -1, -1.35, -1];

/** Small deterministic noise, so the scenery is the same every time you open the app. */
function noise(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

export type RouteUnitProps = {
  unit: Unit;
  /** Width of the road's column in px. */
  width: number;
  records: Record<string, LessonRecord>;
  currentId: string | null;
  selectedId: string | null;
  onSelect: (lessonId: string | null) => void;
  /** What Tin calls out from the truck at the current stop. */
  truckSays: string;
  /** Reports the current stop's y within this block, for scrolling to it. */
  onCurrentLayout?: (y: number) => void;
};

/**
 * One unit of the course as a neighbourhood: a tinted patch of ground, an overhead road sign, a winding road with
 * wheelie-bin stops along it, scenery on the verges, and Tin's truck parked at the current stop.
 */
export function RouteUnit({ unit, width, records, currentId, selectedId, onSelect, truckSays, onCurrentLayout }: RouteUnitProps) {
  const t = useTheme();
  const styles = useStyles();
  const hue = SECTION_HUE[unit.id] ?? 'green';
  const { route } = t.layout;
  const progress = unitProgress(unit, records);
  const cx = width / 2;
  const amp = Math.min(width * 0.24, t.space[20] + t.space[4]);
  const height = route.sign + unit.lessons.length * route.row + t.space[8];

  const stops = unit.lessons.map((lesson, i) => ({
    lesson,
    i,
    x: cx + (PATTERN[i % PATTERN.length] ?? 0) * amp,
    y: route.sign + route.row * i + route.row / 2,
  }));

  // Road: down from the sign, through every stop, and out the bottom to meet the next unit.
  const points = [{ x: cx, y: 0 }, { x: cx, y: route.sign * 0.8 }, ...stops.map((s) => ({ x: s.x, y: s.y })), { x: cx, y: height }];
  let d = `M${points[0]!.x},${points[0]!.y}`;
  for (let k = 1; k < points.length; k += 1) {
    const a = points[k - 1]!;
    const b = points[k]!;
    const dy = (b.y - a.y) / 2;
    d += ` C${a.x},${a.y + dy} ${b.x},${b.y - dy} ${b.x},${b.y}`;
  }

  const current = stops.find((s) => s.lesson.id === currentId) ?? null;
  const truckSide = current ? (current.x >= cx ? -1 : 1) : 0;

  // Scenery on the verge away from each stop: a big piece out by the edge and a small one nearer the road, skipping
  // the spot where the truck is parked.
  const props = stops.flatMap((s) => {
    const off = PATTERN[s.i % PATTERN.length] ?? 0;
    const sides = off > 0.3 ? [-1] : off < -0.3 ? [1] : [-1, 1];
    return sides
      .filter((side) => !(current && s.i === current.i && side === truckSide))
      .flatMap((side) =>
        [0, 1].map((slot) => {
          const n = noise(`${unit.id}:${s.i}:${side}:${slot}`);
          const size = route.prop * (slot === 0 ? 0.95 + n * 0.4 : 0.6 + n * 0.25);
          const inset = slot === 0 ? t.space[1] + n * t.space[4] : t.space[16] + n * t.space[6];
          return {
            key: `${s.i}:${side}:${slot}`,
            kind: PROPS[Math.floor(noise(`${unit.id}:${s.i}:${side}:${slot}:k`) * PROPS.length)]!,
            size,
            left: side < 0 ? inset : width - size - inset,
            top: s.y - size * 0.8 + (slot === 0 ? -route.row * 0.2 : route.row * 0.18) + (n - 0.5) * t.space[4],
          };
        }),
      );
  });

  const selected = stops.find((s) => s.lesson.id === selectedId) ?? null;
  const truckLeft = current ? (truckSide < 0 ? current.x - route.bin * 0.6 - route.truck : current.x + route.bin * 0.6) : 0;

  return (
    <View style={[styles.ground, { backgroundColor: t.colors.hue[hue].subtle }]}>
      <View style={{ width, height, alignSelf: 'center' }}>
        {/* Tapping the open ground closes a stop's card. */}
        <Pressable accessible={false} onPress={() => onSelect(null)} style={styles.fill} />

        <Svg width={width} height={height} style={styles.abs} pointerEvents="none">
          <Path d={d} stroke={t.colors.scene.asphaltEdge} strokeWidth={route.road + t.space[2]} fill="none" strokeLinecap="round" />
          <Path d={d} stroke={t.colors.scene.asphalt} strokeWidth={route.road} fill="none" strokeLinecap="round" />
          <Path d={d} stroke={t.colors.scene.lane} strokeWidth={t.space[1]} strokeDasharray="14 14" fill="none" strokeLinecap="round" />
        </Svg>

        {props.map((p) => (
          <View key={p.key} style={[styles.abs, { left: p.left, top: p.top }]} pointerEvents="none">
            <SceneryProp kind={p.kind} size={p.size} hue={hue} />
          </View>
        ))}

        <View style={[styles.abs, styles.signRow]}>
          <RouteSign unit={unit} hue={hue} done={progress.done} total={progress.total} />
        </View>

        {current && (
          <View
            style={[styles.abs, { left: truckLeft, top: current.y - route.truck * 0.3 }]}
            pointerEvents="none"
            onLayout={() => onCurrentLayout?.(current.y)}
          >
            <View style={[styles.bubble, truckSide < 0 ? styles.bubbleLeft : styles.bubbleRight]}>
              <Text variant="callout" align="center">
                {truckSays}
              </Text>
            </View>
            <TruckArt hue="green" size={route.truck} flip={truckSide > 0} />
          </View>
        )}

        {stops.map((s) => {
          const state = lessonState(s.lesson.id, records);
          const regular = unit.lessons.slice(0, s.i + 1).filter((l) => !l.review).length;
          const w = s.lesson.review ? route.bin * 1.6 : route.bin;
          return (
            <View key={s.lesson.id} style={[styles.abs, styles.stop, { left: s.x - w / 2, top: s.y - route.bin * 0.65, width: w }]}>
              <RouteStop
                state={state}
                hue={hue}
                review={s.lesson.review}
                stars={records[s.lesson.id]?.stars ?? 0}
                label={`${s.lesson.review ? 'Sorting center, unit review' : `Stop ${regular}`}, ${unit.title}, ${state}`}
                onPress={() => onSelect(selectedId === s.lesson.id ? null : s.lesson.id)}
              />
            </View>
          );
        })}

        {selected && (
          <View style={[styles.abs, styles.card, { top: selected.y + route.bin * 0.75 }]}>
            <LessonCard
              unit={unit}
              lesson={selected.lesson}
              index={unit.lessons.slice(0, selected.i).filter((l) => !l.review).length}
              state={lessonState(selected.lesson.id, records)}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  ground: { width: '100%' },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  abs: { position: 'absolute' },
  signRow: { top: 0, left: 0, right: 0 },
  stop: { alignItems: 'center' },
  card: { left: t.layout.gutter, right: t.layout.gutter, zIndex: 10 },
  bubble: {
    position: 'absolute',
    bottom: '100%',
    width: t.layout.route.truck + t.space[8],
    marginBottom: t.space[1],
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.md,
    borderWidth: t.layout.border,
    borderColor: t.colors.border,
    paddingHorizontal: t.space[2],
    paddingVertical: t.space[1],
  },
  /** The bubble hangs off the truck's outer side, out over the grass, away from the road and the stops. */
  bubbleLeft: { right: t.layout.route.truck * 0.45 },
  bubbleRight: { left: t.layout.route.truck * 0.45 },
}));
