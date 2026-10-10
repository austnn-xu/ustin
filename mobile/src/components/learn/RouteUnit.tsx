import { useEffect, useState } from 'react';
import { Platform, Pressable, View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SECTION_HUE } from '@/components/art/ItemArt';
import { PROPS, SceneryProp, TruckArt } from '@/components/art/RouteArt';
import { Appear } from '@/components/ui';
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
  /** Width of the whole screen; on wide screens the margins either side of the column get scenery too. */
  screenWidth: number;
  records: Record<string, LessonRecord>;
  currentId: string | null;
  selectedId: string | null;
  onSelect: (lessonId: string | null) => void;
  /** Reports the current stop's y within this block, for scrolling to it. */
  onCurrentLayout?: (y: number) => void;
};

/**
 * One unit of the course as a neighbourhood: a tinted patch of ground, an overhead road sign, a winding road with
 * wheelie-bin stops along it, scenery on the verges, and Tin's truck parked at the current stop.
 */
export function RouteUnit({ unit, width, screenWidth, records, currentId, selectedId, onSelect, onCurrentLayout }: RouteUnitProps) {
  const t = useTheme();
  const styles = useStyles();
  const hue = SECTION_HUE[unit.id] ?? 'green';
  const progress = unitProgress(unit, records);

  // Everything on the route scales with the screen: tighter on a 320px phone, roomier on a tablet. The tokens are
  // sized for a 390px phone.
  const k = Math.min(1.15, Math.max(0.8, width / 390));
  const route = {
    row: t.layout.route.row * k,
    road: t.layout.route.road * k,
    bin: t.layout.route.bin * k,
    truck: t.layout.route.truck * k,
    prop: t.layout.route.prop * k,
  };
  // The sign wraps on narrow screens, so lay the road out under its measured height.
  const [signHeight, setSignHeight] = useState<number>(t.layout.route.sign);

  const cx = width / 2;
  const amp = Math.min(width * 0.22, t.space[20] + t.space[4]);
  const height = signHeight + unit.lessons.length * route.row + t.space[8];

  const stops = unit.lessons.map((lesson, i) => ({
    lesson,
    i,
    off: PATTERN[i % PATTERN.length] ?? 0,
    x: cx + (PATTERN[i % PATTERN.length] ?? 0) * amp,
    y: signHeight + route.row * i + route.row / 2,
  }));

  // Road: down from the sign, through every stop, and out the bottom to meet the next unit.
  const points = [{ x: cx, y: 0 }, { x: cx, y: signHeight * 0.85 }, ...stops.map((s) => ({ x: s.x, y: s.y })), { x: cx, y: height }];
  let d = `M${points[0]!.x},${points[0]!.y}`;
  for (let k = 1; k < points.length; k += 1) {
    const a = points[k - 1]!;
    const b = points[k]!;
    const dy = (b.y - a.y) / 2;
    d += ` C${a.x},${a.y + dy} ${b.x},${b.y - dy} ${b.x},${b.y}`;
  }

  const current = stops.find((s) => s.lesson.id === currentId) ?? null;
  // The truck parks on the verge away from the current stop. A stop on the centre line takes the side away from the
  // stop before it, so the truck never sits on top of that stop's bin or stars.
  const prevOff = current ? (stops[current.i - 1]?.off ?? 0) : 0;
  const truckSide = !current ? 0 : current.off > 0 ? -1 : current.off < 0 ? 1 : prevOff > 0 ? -1 : 1;

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

  // Tablets and desktop: fill the margins beside the column with more of the town.
  const margin = (screenWidth - width) / 2;
  const marginProps =
    margin > route.prop * 1.5
      ? stops.flatMap((s) =>
          [-1, 1].map((side) => {
            const n = noise(`${unit.id}:${s.i}:m${side}`);
            const size = route.prop * (1 + n * 0.5);
            const x = t.space[2] + n * Math.max(0, margin - size - t.space[4]);
            return {
              key: `m${s.i}:${side}`,
              kind: PROPS[Math.floor(noise(`${unit.id}:${s.i}:m${side}:k`) * PROPS.length)]!,
              size,
              left: side < 0 ? x : screenWidth - size - x,
              top: s.y - size + (n - 0.5) * route.row * 0.5,
            };
          }),
        )
      : [];

  // The current stop's position is computed, not measured, so report it straight away: a unit that starts off screen is
  // skipped by the browser (see offscreenSkip) and would never report a layout.
  const currentY = current?.y ?? null;
  useEffect(() => {
    if (currentY !== null) onCurrentLayout?.(currentY);
  }, [currentY]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = stops.find((s) => s.lesson.id === selectedId) ?? null;
  const truckGap = route.bin * 0.6;
  const truckLeft = current
    ? Math.min(
        width - route.truck - t.space[1],
        Math.max(t.space[1], truckSide < 0 ? current.x - truckGap - route.truck : current.x + truckGap),
      )
    : 0;

  return (
    <View style={[styles.ground, { backgroundColor: t.colors.hue[hue].subtle }, offscreenSkip(height)]}>
      {marginProps.map((p) => (
        <View key={p.key} style={[styles.abs, { left: p.left, top: p.top }]} pointerEvents="none">
          <SceneryProp kind={p.kind} size={p.size} hue={hue} />
        </View>
      ))}
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

        <View style={[styles.abs, styles.signRow]} onLayout={(e) => setSignHeight(Math.max(t.layout.route.sign, e.nativeEvent.layout.height))}>
          <RouteSign unit={unit} hue={hue} done={progress.done} total={progress.total} />
        </View>

        {current && (
          <View
            style={[styles.abs, { left: truckLeft, top: current.y - route.truck * 0.25 }]}
            pointerEvents="none"
          >
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
                size={route.bin}
                onPress={() => onSelect(selectedId === s.lesson.id ? null : s.lesson.id)}
              />
            </View>
          );
        })}

        {selected && (
          <Appear
            key={selected.lesson.id}
            from="pop"
            spring="bouncy"
            style={[styles.abs, styles.card, { top: selected.y + route.bin * 0.75 }]}
          >
            <LessonCard
              unit={unit}
              lesson={selected.lesson}
              index={unit.lessons.slice(0, selected.i).filter((l) => !l.review).length}
              state={lessonState(selected.lesson.id, records)}
            />
          </Appear>
        )}
      </View>
    </View>
  );
}

/**
 * The route is long — eleven neighbourhoods of SVG scenery — and only one or two are ever on screen. On the web, let the
 * browser skip styling, laying out and painting the ones that are off screen. The unit's height is known, so the
 * scrollbar never jumps.
 */
const offscreenSkip = (height: number) =>
  Platform.OS === 'web' ? ({ contentVisibility: 'auto', containIntrinsicSize: `auto ${height}px` } as unknown as ViewStyle) : null;

const useStyles = makeStyles((t) => ({
  ground: { width: '100%', overflow: 'hidden' },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  abs: { position: 'absolute' },
  signRow: { top: 0, left: 0, right: 0 },
  stop: { alignItems: 'center' },
  card: { left: t.layout.gutter, right: t.layout.gutter, zIndex: 10 },
}));
