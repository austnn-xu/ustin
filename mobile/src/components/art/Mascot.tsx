import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { useTheme, type HueName } from '@/theme';

export type Mood = 'happy' | 'cheer' | 'worried' | 'sad' | 'thinking' | 'sleepy' | 'wow';

export type MascotProps = {
  mood?: Mood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Color of Tin's label band. */
  hue?: HueName;
  /** Gentle idle bob. On by default; turn off in dense lists. */
  idle?: boolean;
  accessibilityLabel?: string;
};

const MOOD_LABEL: Record<Mood, string> = {
  happy: 'Tin the tin can, smiling',
  cheer: 'Tin the tin can, cheering',
  worried: 'Tin the tin can, looking worried',
  sad: 'Tin the tin can, looking sad',
  thinking: 'Tin the tin can, thinking',
  sleepy: 'Tin the tin can, asleep',
  wow: 'Tin the tin can, amazed',
};

/**
 * Tin, the mascot: a little tin can with a face. Drawn in a 120×140 viewBox.
 * Every mood change gets a springy bounce; cheering also jumps.
 */
export function Mascot({ mood = 'happy', size = 'md', hue = 'green', idle = true, accessibilityLabel }: MascotProps) {
  const t = useTheme();
  const c = t.colors.mascot;
  const band = t.colors.hue[hue];
  const px = t.layout.mascot[size];

  const bob = useSharedValue(0);
  const pop = useSharedValue(1);
  const jump = useSharedValue(0);

  useEffect(() => {
    if (!idle) return;
    bob.value = withRepeat(
      withTiming(1, { duration: t.motion.idleDuration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [bob, idle, t.motion.idleDuration]);

  useEffect(() => {
    pop.value = 0.86;
    pop.value = withSpring(1, t.motion.spring.bouncy);
    if (mood === 'cheer' || mood === 'wow') {
      jump.value = withSequence(withSpring(-1, t.motion.spring.snappy), withSpring(0, t.motion.spring.bouncy));
    }
  }, [mood, pop, jump, t.motion.spring.bouncy, t.motion.spring.snappy]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: bob.value * -px * 0.03 + jump.value * px * 0.14 },
      { scale: pop.value },
    ],
  }));

  const s = { stroke: c.outline, strokeWidth: 4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  return (
    <Animated.View
      style={[{ width: px, height: px * (140 / 120) }, style]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? MOOD_LABEL[mood]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 120 140">
        {/* Feet */}
        <Ellipse cx={45} cy={131} rx={10} ry={5} fill={c.outline} />
        <Ellipse cx={75} cy={131} rx={10} ry={5} fill={c.outline} />

        <Arms mood={mood} body={c.body} outline={c.outline} />

        {/* Body */}
        <Rect x={22} y={30} width={76} height={98} rx={14} fill={c.body} />
        <Path d="M78 30 h6 a14 14 0 0 1 14 14 v70 a14 14 0 0 1 -14 14 h-6 z" fill={c.bodyShade} />
        <Path d="M24 48 H96 M24 112 H96" stroke={c.bodyShade} strokeWidth={3} />
        <Rect x={22} y={96} width={76} height={14} fill={band.base} />
        <Path d="M22 103 H98" stroke={band.depth} strokeWidth={2} strokeDasharray="3 5" />
        <Rect x={22} y={30} width={76} height={98} rx={14} fill="none" {...s} />

        {/* Lid */}
        <Ellipse cx={60} cy={30} rx={40} ry={10} fill={c.rim} {...s} />
        <Ellipse cx={60} cy={30} rx={31} ry={6} fill={c.bodyShade} />
        <Ellipse cx={70} cy={27} rx={8} ry={3.5} fill="none" stroke={c.outline} strokeWidth={3} />

        <Face mood={mood} c={c} />
      </Svg>
    </Animated.View>
  );
}

type FaceColors = ReturnType<typeof useTheme>['colors']['mascot'];

function Arms({ mood, body, outline }: { mood: Mood; body: string; outline: string }) {
  const paths =
    mood === 'cheer' || mood === 'wow'
      ? ['M26 72 Q10 62 12 42', 'M94 72 Q110 62 108 42']
      : mood === 'thinking'
        ? ['M26 80 Q14 90 18 106', 'M94 74 Q112 66 104 50']
        : mood === 'sad' || mood === 'sleepy'
          ? ['M26 84 Q18 96 22 112', 'M94 84 Q102 96 98 112']
          : mood === 'worried'
            ? ['M26 80 Q12 80 14 66', 'M94 80 Q108 80 106 66']
            : ['M26 80 Q12 88 16 104', 'M94 80 Q108 88 104 104'];
  return (
    <G>
      {paths.map((d) => (
        <G key={d}>
          <Path d={d} stroke={outline} strokeWidth={12} strokeLinecap="round" fill="none" />
          <Path d={d} stroke={body} strokeWidth={6} strokeLinecap="round" fill="none" />
        </G>
      ))}
    </G>
  );
}

function Face({ mood, c }: { mood: Mood; c: FaceColors }) {
  const line = { stroke: c.eye, strokeWidth: 4, strokeLinecap: 'round' as const, fill: 'none' };
  const look =
    mood === 'thinking' ? { x: 3, y: -3 } : mood === 'sad' ? { x: 0, y: 3 } : mood === 'happy' ? { x: 1, y: -1 } : { x: 0, y: 0 };
  const big = mood === 'wow';

  const eyes =
    mood === 'cheer' ? (
      <G>
        <Path d="M37 66 Q46 55 55 66" {...line} />
        <Path d="M65 66 Q74 55 83 66" {...line} />
      </G>
    ) : mood === 'sleepy' ? (
      <G>
        <Path d="M37 63 Q46 70 55 63" {...line} />
        <Path d="M65 63 Q74 70 83 63" {...line} />
        <Path d="M90 40 h8 l-8 8 h8 M101 28 h6 l-6 6 h6" stroke={c.outline} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
    ) : (
      <G>
        {[46, 74].map((cx) => (
          <G key={cx}>
            <Ellipse cx={cx} cy={64} rx={big ? 12 : 10} ry={big ? 13 : 11} fill={c.shine} stroke={c.eye} strokeWidth={3} />
            <Circle cx={cx + look.x} cy={65 + look.y} r={big ? 6 : 5.5} fill={c.eye} />
            <Circle cx={cx + look.x + 2} cy={62 + look.y} r={2} fill={c.shine} />
          </G>
        ))}
      </G>
    );

  const brows =
    mood === 'sad' || mood === 'worried' ? (
      <G>
        <Path d="M36 52 L53 47" {...line} />
        <Path d="M67 47 L84 52" {...line} />
      </G>
    ) : mood === 'thinking' ? (
      <Path d="M66 46 Q75 40 84 46" {...line} />
    ) : null;

  const mouth =
    mood === 'cheer' ? (
      <G>
        <Path d="M45 77 Q60 97 75 77 Z" fill={c.mouth} stroke={c.eye} strokeWidth={3} strokeLinejoin="round" />
        <Path d="M53 87 Q60 81 67 87 Q60 92 53 87 Z" fill={c.tongue} />
      </G>
    ) : mood === 'happy' ? (
      <Path d="M49 79 Q60 89 71 79" {...line} />
    ) : mood === 'sad' ? (
      <Path d="M50 88 Q60 79 70 88" {...line} />
    ) : mood === 'worried' ? (
      <Path d="M47 85 q4.3 -4 8.6 0 t8.6 0 t8.6 0" {...line} />
    ) : mood === 'thinking' ? (
      <Circle cx={65} cy={84} r={3.5} fill={c.mouth} />
    ) : mood === 'wow' ? (
      <Ellipse cx={60} cy={85} rx={5.5} ry={7} fill={c.mouth} stroke={c.eye} strokeWidth={2.5} />
    ) : (
      <Path d="M55 84 Q60 87 65 84" {...line} />
    );

  return (
    <G>
      {mood !== 'sleepy' && (
        <G opacity={0.85}>
          <Ellipse cx={34} cy={80} rx={6} ry={4} fill={c.cheek} />
          <Ellipse cx={86} cy={80} rx={6} ry={4} fill={c.cheek} />
        </G>
      )}
      {eyes}
      {brows}
      {mouth}
      {mood === 'sad' && <Path d="M38 76 q-4 7 0 9 q4 -2 0 -9 z" fill={c.tear} />}
    </G>
  );
}
