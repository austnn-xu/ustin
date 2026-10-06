import type { LucideIcon } from 'lucide-react-native';
import { Recycle } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { useTheme, type Hue, type HueName } from '@/theme';

/**
 * The cartoon town the Learn route runs through: wheelie-bin stops, the sorting centre at the end of each unit,
 * Tin's recycling truck, and the scenery along the road. Each piece is drawn in its own viewBox.
 */

// ---------------------------------------------------------------------------
// Wheelie bin — one lesson stop
// ---------------------------------------------------------------------------

export type BinStopArtProps = {
  hue: HueName;
  locked: boolean;
  /** The lid pops open and closed — this is where you are. */
  open: boolean;
  icon: LucideIcon;
  /** Fill the icon solid (stars). */
  iconFilled?: boolean;
  /** Width in px; height follows the 64×76 viewBox. */
  size: number;
};

export function BinStopArt({ hue: hueName, locked, open, icon: Glyph, iconFilled, size }: BinStopArtProps) {
  const t = useTheme();
  const hue: Hue = locked
    ? { base: t.colors.borderStrong, depth: t.colors.textTertiary, subtle: t.colors.fill, text: t.colors.textTertiary }
    : t.colors.hue[hueName];
  const height = size * (76 / 64);
  const lid = useSharedValue(0);

  useEffect(() => {
    if (!open) {
      lid.value = 0;
      return;
    }
    lid.value = withRepeat(
      withSequence(
        withTiming(1, { duration: t.motion.idleDuration / 4, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: t.motion.idleDuration / 2 }),
        withTiming(0, { duration: t.motion.idleDuration / 4, easing: Easing.in(Easing.quad) }),
        withTiming(0, { duration: t.motion.idleDuration / 2 }),
      ),
      -1,
    );
  }, [open, lid, t.motion.idleDuration]);

  const lidStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-lid.value * 28}deg` }],
  }));

  return (
    <View style={{ width: size, height }} aria-hidden>
      <Svg width="100%" height="100%" viewBox="0 0 64 76" style={{ position: 'absolute' }}>
        <Path d="M10 25 H54 L50.5 64 Q50 69 45 69 H19 Q14 69 13.5 64 Z" fill={hue.base} />
        <Path d="M22 31 L23.5 61 M42 31 L40.5 61" stroke={t.colors.shine} strokeWidth={3} strokeLinecap="round" />
        <Path d="M12 25 H52" stroke={hue.depth} strokeWidth={3} />
        <Circle cx={19} cy={69} r={5.5} fill={hue.depth} />
        <Circle cx={45} cy={69} r={5.5} fill={hue.depth} />
        <Circle cx={19} cy={69} r={2} fill={t.colors.shine} />
        <Circle cx={45} cy={69} r={2} fill={t.colors.shine} />
      </Svg>
      <View style={{ position: 'absolute', top: height * 0.42, width: size, alignItems: 'center' }}>
        <Glyph
          size={size * 0.36}
          color={locked ? t.colors.textTertiary : t.colors.onColor}
          fill={!locked && iconFilled ? t.colors.onColor : 'none'}
          strokeWidth={t.layout.iconStroke + 0.5}
        />
      </View>
      {/* The lid hinges at its back-left corner. */}
      <Animated.View
        style={[{ position: 'absolute', left: 0, top: 0, width: size, height, transformOrigin: `${size * 0.1}px ${height * 0.3}px` }, lidStyle]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 64 76">
          <Rect x={24} y={8} width={16} height={8} rx={3} fill={hue.depth} />
          <Rect x={5} y={14} width={54} height={12} rx={5} fill={hue.depth} />
          <Rect x={8} y={15.5} width={48} height={4} rx={2} fill={t.colors.shine} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sorting centre — the unit review at the end of each stretch of road
// ---------------------------------------------------------------------------

export function SortingCenterArt({ hue: hueName, locked, done, size }: { hue: HueName; locked: boolean; done: boolean; size: number }) {
  const t = useTheme();
  const s = t.colors.scene;
  const roof = done ? t.colors.hue.yellow : t.colors.hue[hueName];
  const roofBase = locked ? t.colors.fillStrong : roof.base;
  const roofDepth = locked ? t.colors.borderStrong : roof.depth;
  return (
    <View style={{ width: size, height: size * (84 / 100) }} aria-hidden>
      <Svg width="100%" height="100%" viewBox="0 0 100 84">
        {/* Chimney with a little puff of steam */}
        <Rect x={70} y={6} width={10} height={24} rx={2} fill={s.pole} />
        {!locked && <Circle cx={78} cy={3} r={3} fill={s.cloud} />}
        {/* Sawtooth factory roof */}
        <Path d="M8 34 L26 18 L26 34 L46 18 L46 34 L66 18 L66 34 L92 34 L92 40 L8 40 Z" fill={roofBase} />
        <Path d="M8 38 H92" stroke={roofDepth} strokeWidth={4} />
        {/* Walls, door, windows */}
        <Rect x={12} y={40} width={76} height={38} fill={s.wall} />
        <Rect x={12} y={40} width={76} height={38} fill="none" stroke={roofDepth} strokeWidth={2} />
        <Rect x={40} y={54} width={20} height={24} rx={2} fill={roofDepth} />
        <Path d="M40 60 H60 M40 66 H60 M40 72 H60" stroke={t.colors.shine} strokeWidth={1.5} />
        <Rect x={18} y={48} width={14} height={10} rx={2} fill={s.window} />
        <Rect x={68} y={48} width={14} height={10} rx={2} fill={s.window} />
        {/* Ground line */}
        <Rect x={4} y={78} width={92} height={4} rx={2} fill={s.shadow} />
        {done && (
          <G>
            <Path d="M86 18 V2" stroke={s.pole} strokeWidth={2.5} strokeLinecap="round" />
            <Path d="M86 3 L98 7 L86 11 Z" fill={t.colors.hue.red.base} />
          </G>
        )}
      </Svg>
    </View>
  );
}

// ---------------------------------------------------------------------------
// The recycling truck, with Tin at the wheel
// ---------------------------------------------------------------------------

export function TruckArt({ hue: hueName, size, flip }: { hue: HueName; size: number; flip?: boolean }) {
  const t = useTheme();
  const s = t.colors.scene;
  const hue = t.colors.hue[hueName];
  const m = t.colors.mascot;
  const bounce = useSharedValue(0);

  useEffect(() => {
    bounce.value = withRepeat(withTiming(1, { duration: t.motion.idleDuration / 3, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [bounce, t.motion.idleDuration]);

  // The body idles on its suspension; the wheels stay planted.
  const body = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.value * size * 0.015 }] }));
  const height = size * (76 / 120);

  return (
    <View
      style={{ width: size, height, transform: [{ scaleX: flip ? -1 : 1 }] }}
      accessibilityRole="image"
      accessibilityLabel="Tin driving the recycling truck"
    >
      <Animated.View style={[{ position: 'absolute', width: size, height }, body]}>
        <Svg width="100%" height="100%" viewBox="0 0 120 76">
          {/* Box */}
          <Rect x={4} y={14} width={74} height={42} rx={8} fill={hue.base} />
          <Rect x={4} y={46} width={74} height={10} rx={4} fill={hue.depth} />
          <Rect x={10} y={19} width={62} height={4} rx={2} fill={t.colors.shine} />
          {/* Cab */}
          <Path d="M80 26 H100 Q106 26 109 32 L115 44 V56 H80 Z" fill={s.wall} />
          <Path d="M80 26 H100 Q106 26 109 32 L115 44 V56 H80 Z" fill="none" stroke={hue.depth} strokeWidth={2.5} strokeLinejoin="round" />
          <Path d="M86 30 H99 Q103 30 105 34 L109 43 H86 Z" fill={s.window} />
          {/* Tin at the wheel */}
          <Rect x={89} y={33} width={13} height={14} rx={3} fill={m.body} />
          <Ellipse cx={95.5} cy={33} rx={7} ry={2.5} fill={m.rim} />
          <Circle cx={93} cy={38.5} r={1.6} fill={m.eye} />
          <Circle cx={98.5} cy={38.5} r={1.6} fill={m.eye} />
          <Path d="M93 42 Q95.7 44.5 98.5 42" stroke={m.eye} strokeWidth={1.2} fill="none" strokeLinecap="round" />
          <Circle cx={113} cy={48} r={2} fill={s.lane} />
          <Rect x={78} y={54} width={39} height={4} rx={2} fill={hue.depth} />
        </Svg>
        <View style={{ position: 'absolute', left: size * 0.2, top: height * 0.24 }}>
          <Recycle size={size * 0.2} color={t.colors.onColor} strokeWidth={t.layout.iconStroke + 0.5} />
        </View>
      </Animated.View>
      <Svg width="100%" height="100%" viewBox="0 0 120 76" style={{ position: 'absolute' }}>
        {[24, 60, 98].map((cx) => (
          <G key={cx}>
            <Circle cx={cx} cy={62} r={10} fill={m.outline} />
            <Circle cx={cx} cy={62} r={4} fill={s.rock} />
          </G>
        ))}
      </Svg>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Scenery along the road
// ---------------------------------------------------------------------------

export type PropKind = 'tree' | 'pine' | 'bush' | 'house' | 'lamp' | 'crate' | 'cone' | 'flowers' | 'rock' | 'cloud';

export const PROPS: PropKind[] = ['tree', 'pine', 'bush', 'house', 'lamp', 'crate', 'cone', 'flowers', 'rock', 'tree', 'bush', 'house'];

/** One piece of roadside scenery, `size` px wide. Every prop is drawn on a 60×60 canvas, sitting on its baseline. */
export function SceneryProp({ kind, size, hue: hueName }: { kind: PropKind; size: number; hue: HueName }) {
  const t = useTheme();
  const s = t.colors.scene;
  const hue = t.colors.hue[hueName];
  const shadow = <Ellipse cx={30} cy={56} rx={18} ry={3.5} fill={s.shadow} />;
  let art: React.ReactNode;
  switch (kind) {
    case 'tree':
      art = (
        <G>
          {shadow}
          <Rect x={27} y={34} width={6} height={22} rx={2} fill={s.trunk} />
          <Circle cx={30} cy={26} r={16} fill={s.leaf} />
          <Circle cx={22} cy={30} r={9} fill={s.leafDark} />
          <Circle cx={36} cy={19} r={5} fill={t.colors.shine} />
        </G>
      );
      break;
    case 'pine':
      art = (
        <G>
          {shadow}
          <Rect x={27} y={44} width={6} height={12} rx={2} fill={s.trunk} />
          <Path d="M30 4 L46 30 H14 Z" fill={s.leafDark} />
          <Path d="M30 16 L50 46 H10 Z" fill={s.leaf} />
        </G>
      );
      break;
    case 'bush':
      art = (
        <G>
          {shadow}
          <Circle cx={20} cy={46} r={10} fill={s.leafDark} />
          <Circle cx={40} cy={46} r={10} fill={s.leafDark} />
          <Circle cx={30} cy={40} r={13} fill={s.leaf} />
          <Circle cx={26} cy={38} r={2} fill={s.flower} />
          <Circle cx={36} cy={44} r={2} fill={s.flower} />
        </G>
      );
      break;
    case 'house':
      art = (
        <G>
          {shadow}
          <Rect x={12} y={28} width={36} height={28} fill={s.wall} />
          <Path d="M8 30 L30 10 L52 30 Z" fill={hue.base} />
          <Path d="M8 30 H52" stroke={hue.depth} strokeWidth={3} strokeLinecap="round" />
          <Rect x={26} y={40} width={9} height={16} rx={1.5} fill={hue.depth} />
          <Rect x={16} y={34} width={8} height={7} rx={1.5} fill={s.window} />
          <Rect x={38} y={34} width={7} height={7} rx={1.5} fill={s.window} />
        </G>
      );
      break;
    case 'lamp':
      art = (
        <G>
          <Ellipse cx={30} cy={56} rx={8} ry={2.5} fill={s.shadow} />
          <Rect x={28} y={14} width={4} height={42} rx={2} fill={s.pole} />
          <Path d="M30 14 Q30 8 38 8 H42" stroke={s.pole} strokeWidth={4} fill="none" strokeLinecap="round" />
          <Rect x={38} y={8} width={10} height={6} rx={3} fill={s.pole} />
          <Circle cx={43} cy={16} r={3} fill={s.lane} />
        </G>
      );
      break;
    case 'crate':
      art = (
        <G>
          {shadow}
          {/* A curbside recycling crate with bottles poking out */}
          <Rect x={23} y={22} width={6} height={18} rx={2} fill={t.colors.hue.green.base} />
          <Rect x={33} y={18} width={6} height={22} rx={2} fill={s.window} />
          <Path d="M14 34 H46 L43 55 H17 Z" fill={t.colors.hue.blue.base} />
          <Path d="M14 34 H46" stroke={t.colors.hue.blue.depth} strokeWidth={3} strokeLinecap="round" />
          <Path d="M22 42 H38 M23 48 H37" stroke={t.colors.shine} strokeWidth={2} strokeLinecap="round" />
        </G>
      );
      break;
    case 'cone':
      art = (
        <G>
          {shadow}
          <Path d="M24 54 L30 22 L36 54 Z" fill={s.cone} />
          <Path d="M26.5 42 H33.5" stroke={s.kerb} strokeWidth={3} />
          <Rect x={18} y={52} width={24} height={4} rx={2} fill={s.cone} />
        </G>
      );
      break;
    case 'flowers':
      art = (
        <G>
          {shadow}
          {[18, 30, 42].map((x, i) => (
            <G key={x}>
              <Path d={`M${x} 56 V${42 - i * 3}`} stroke={s.leafDark} strokeWidth={2} />
              <Circle cx={x} cy={40 - i * 3} r={5} fill={i === 1 ? t.colors.hue.yellow.base : s.flower} />
              <Circle cx={x} cy={40 - i * 3} r={1.8} fill={s.wall} />
            </G>
          ))}
        </G>
      );
      break;
    case 'rock':
      art = (
        <G>
          {shadow}
          <Path d="M12 56 Q14 40 26 38 Q34 30 44 40 Q50 46 48 56 Z" fill={s.rock} />
          <Path d="M24 44 Q28 40 32 42" stroke={t.colors.shine} strokeWidth={2} fill="none" strokeLinecap="round" />
        </G>
      );
      break;
    case 'cloud':
      art = (
        <G>
          <Circle cx={20} cy={36} r={10} fill={s.cloud} />
          <Circle cx={32} cy={30} r={14} fill={s.cloud} />
          <Circle cx={44} cy={37} r={9} fill={s.cloud} />
          <Rect x={18} y={36} width={28} height={10} rx={5} fill={s.cloud} />
        </G>
      );
      break;
  }
  return (
    <View style={{ width: size, height: size }} aria-hidden pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 60 60">
        {art}
      </Svg>
    </View>
  );
}
