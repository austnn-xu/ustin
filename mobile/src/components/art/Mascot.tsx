import { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { paintOf, type Outfit } from '@/lib/cosmetics';
import { haptics } from '@/lib/haptics';
import { useProgress } from '@/stores/progress';
import { drift, easing, useTheme, type HueName } from '@/theme';
import { EyewearArt, HatArt, NeckArt } from './OutfitArt';

export type Mood = 'happy' | 'cheer' | 'worried' | 'sad' | 'thinking' | 'sleepy' | 'wow';

export type MascotProps = {
  mood?: Mood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Color of Tin's label band, unless the outfit paints it. */
  hue?: HueName;
  /** What Tin wears. Omit to wear the outfit the user has equipped; pass null for bare Tin. */
  outfit?: Outfit | null;
  /**
   * Gentle idle bob, blinking and reactions to mood changes. On by default. Turn it off for thumbnails (the shop grid):
   * an idle-less Tin that is not talking, waving or pokeable is drawn once, with no hooks or animation at all.
   */
  idle?: boolean;
  /** Flap Tin's mouth, while its speech bubble is typing out. */
  talking?: boolean;
  /** Wave hello when Tin arrives (and again whenever this flips back on). */
  wave?: boolean;
  /** Let people tap Tin: it hops, grins and waves. A small delight for anyone who tries. */
  pokeable?: boolean;
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

/** The moods Tin physically reacts to (a jump with a squash on landing). Every other mood just changes Tin's face. */
const BIG: Mood[] = ['cheer', 'wow'];

/** How many swings make one wave. */
const WAVE_SWINGS = 6;

/**
 * Tin, the mascot: a little tin can with a face. The can is drawn in a 120×140 box; the viewBox keeps 28 units of
 * headroom above it for hats.
 *
 * Tin is a cartoon, so it moves like one, but only as much as the moment deserves: it breathes and blinks, its mouth
 * flaps while it talks, it jumps (and squashes as it lands) when it cheers, and it waves hello. Worry and sadness show
 * in its face, not in motion.
 *
 * Built to stay cheap: the idle bob is a CSS loop (no JS per frame), reactions are a brief spring on one view, and the
 * drawing is split so a blink or a mouth flap redraws only the face, never the whole can.
 */
export const Mascot = memo(function Mascot(props: MascotProps) {
  const { idle = true, talking = false, wave = false, pokeable = false } = props;
  if (!idle && !talking && !wave && !pokeable) return <StillTin {...props} />;
  return <LiveTin {...props} />;
});

/** A Tin that never moves: one render, no timers, no animated styles. For grids of thumbnails. */
function StillTin({ mood = 'happy', size = 'md', hue = 'green', outfit: outfitProp, accessibilityLabel }: MascotProps) {
  const t = useTheme();
  const equipped = useProgress((s) => s.equipped);
  const outfit = outfitProp === undefined ? equipped : outfitProp;
  const px = t.layout.mascot[size];
  return (
    <View style={{ width: px, height: px * (168 / 120) }} accessibilityRole="image" accessibilityLabel={accessibilityLabel ?? MOOD_LABEL[mood]}>
      <TinArt mood={mood} band={paintOf(outfit) ?? hue} outfit={outfit} wave={0} blinking={false} mouthOpen={false} />
    </View>
  );
}

function LiveTin({
  mood: moodProp = 'happy',
  size = 'md',
  hue = 'green',
  outfit: outfitProp,
  idle = true,
  talking = false,
  wave = false,
  pokeable = false,
  accessibilityLabel,
}: MascotProps) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const equipped = useProgress((s) => s.equipped);
  const outfit = outfitProp === undefined ? equipped : outfitProp;
  const px = t.layout.mascot[size];
  const height = px * (168 / 120);

  // A poke borrows a grin for a moment, then hands the mood back.
  const [poked, setPoked] = useState(0);
  const mood: Mood = poked ? (poked % 2 ? 'cheer' : 'wow') : moodProp;
  const blinking = useBlink(idle && !reduced && mood !== 'cheer' && mood !== 'sleepy');
  const mouthOpen = useBeat(talking && !reduced, t.motion.talkBeat);
  const [waving, setWaving] = useState(false);
  const swing = useBeat(waving, t.motion.waveBeat);

  const squash = useSharedValue(0);
  const jump = useSharedValue(0);

  useEffect(() => {
    if (reduced || !BIG.includes(mood)) return;
    jump.value = withSequence(withSpring(-1, t.motion.spring.snappy), withSpring(0, t.motion.spring.bouncy));
    squash.value = 1;
    squash.value = withSpring(0, t.motion.spring.bouncy);
    // Only a change of mood replays the reaction; the shared values and springs are stable.
  }, [mood]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!wave || reduced) return;
    setWaving(true);
    const id = setTimeout(() => setWaving(false), t.motion.waveBeat * WAVE_SWINGS);
    return () => clearTimeout(id);
  }, [wave, reduced, t.motion.waveBeat]);

  useEffect(() => {
    if (!poked) return;
    const id = setTimeout(() => {
      setPoked(0);
      setWaving(false);
    }, t.motion.waveBeat * WAVE_SWINGS);
    return () => clearTimeout(id);
  }, [poked, t.motion.waveBeat]);

  const react = useAnimatedStyle(() => {
    const sy = 1 - squash.value * 0.08;
    return {
      transform: [
        // Squash about the feet, not the middle, so Tin stays planted on the ground.
        { translateY: jump.value * px * 0.14 + ((1 - sy) * height) / 2 },
        { scaleX: 1 + squash.value * 0.06 },
        { scaleY: sy },
      ],
    };
  });

  const art = (
    <Animated.View
      style={[
        { width: px, height },
        idle &&
          !reduced && {
            animationName: drift(px * 0.03),
            animationDuration: t.motion.idleDuration,
            animationTimingFunction: easing.sine,
            animationIterationCount: 'infinite',
            animationDirection: 'alternate',
          },
      ]}
      accessibilityRole={pokeable ? undefined : 'image'}
      accessibilityLabel={pokeable ? undefined : (accessibilityLabel ?? MOOD_LABEL[mood])}
    >
      <Animated.View style={[styles.fill, react]}>
        <TinArt
          mood={mood}
          band={paintOf(outfit) ?? hue}
          outfit={outfit}
          wave={waving ? (swing ? 1 : 2) : 0}
          blinking={blinking}
          mouthOpen={talking && mouthOpen}
        />
      </Animated.View>
    </Animated.View>
  );

  if (!pokeable) return art;
  return (
    <Pressable
      onPress={() => {
        haptics.light();
        setPoked((n) => n + 1);
        setWaving(true);
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? MOOD_LABEL[moodProp]}
      accessibilityHint="Say hi to Tin"
    >
      {art}
    </Pressable>
  );
}

const styles = { fill: { flex: 1 } } as const;

type TinArtProps = {
  mood: Mood;
  band: HueName;
  outfit: Outfit | null;
  wave: 0 | 1 | 2;
  blinking: boolean;
  mouthOpen: boolean;
};

/**
 * The drawing. The can and each outfit piece are memoised elements, so when only the face changes (a blink, a mouth
 * flap, a new mood) React leaves the rest of the SVG alone.
 */
const TinArt = memo(function TinArt({ mood, band: bandName, outfit, wave, blinking, mouthOpen }: TinArtProps) {
  const t = useTheme();
  const c = t.colors.mascot;
  const band = t.colors.hue[bandName];
  const can = useMemo(
    () => (
      <G>
        {/* Body */}
        <Rect x={22} y={30} width={76} height={98} rx={14} fill={c.body} />
        <Path d="M78 30 h6 a14 14 0 0 1 14 14 v70 a14 14 0 0 1 -14 14 h-6 z" fill={c.bodyShade} />
        <Path d="M24 48 H96 M24 112 H96" stroke={c.bodyShade} strokeWidth={3} />
        <Rect x={22} y={96} width={76} height={14} fill={band.base} />
        <Path d="M22 103 H98" stroke={band.depth} strokeWidth={2} strokeDasharray="3 5" />
        <Rect x={22} y={30} width={76} height={98} rx={14} fill="none" stroke={c.outline} strokeWidth={4} strokeLinejoin="round" />

        {/* Lid */}
        <Ellipse cx={60} cy={30} rx={40} ry={10} fill={c.rim} stroke={c.outline} strokeWidth={4} />
        <Ellipse cx={60} cy={30} rx={31} ry={6} fill={c.bodyShade} />
        <Ellipse cx={70} cy={27} rx={8} ry={3.5} fill="none" stroke={c.outline} strokeWidth={3} />
      </G>
    ),
    [c, band],
  );
  const neck = useMemo(() => (outfit?.neck ? <NeckArt id={outfit.neck} c={t.colors} /> : null), [outfit?.neck, t.colors]);
  const eyes = useMemo(() => (outfit?.eyes ? <EyewearArt id={outfit.eyes} c={t.colors} /> : null), [outfit?.eyes, t.colors]);
  const hat = useMemo(() => (outfit?.hat ? <HatArt id={outfit.hat} c={t.colors} /> : null), [outfit?.hat, t.colors]);

  return (
    <Svg width="100%" height="100%" viewBox="0 -28 120 168">
      {/* Feet */}
      <Ellipse cx={45} cy={131} rx={10} ry={5} fill={c.outline} />
      <Ellipse cx={75} cy={131} rx={10} ry={5} fill={c.outline} />
      <Arms mood={mood} body={c.body} outline={c.outline} wave={wave} />
      {can}
      {neck}
      <Face mood={mood} c={c} blinking={blinking} mouthOpen={mouthOpen} />
      {eyes}
      {hat}
    </Svg>
  );
});

/** Blinks now and then, at a slightly random rhythm (sometimes twice), so Tin never looks like a still image. */
function useBlink(enabled: boolean) {
  const t = useTheme();
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (!enabled) {
      setClosed(false);
      return;
    }
    const [min, max] = t.motion.blinkEvery;
    let timer: ReturnType<typeof setTimeout>;
    const blink = (times: number) => {
      setClosed(true);
      timer = setTimeout(() => {
        setClosed(false);
        timer = times > 1 ? setTimeout(() => blink(times - 1), t.motion.blinkHold) : schedule();
      }, t.motion.blinkHold);
    };
    const schedule = () => setTimeout(() => blink(Math.random() < 0.2 ? 2 : 1), min + Math.random() * (max - min));
    timer = schedule();
    return () => clearTimeout(timer);
  }, [enabled, t.motion.blinkEvery, t.motion.blinkHold]);
  return closed;
}

/** Flips true/false every `ms` while `on` — for flapping mouths and waving arms. */
function useBeat(on: boolean, ms: number) {
  const [beat, setBeat] = useState(false);
  useEffect(() => {
    if (!on) {
      setBeat(false);
      return;
    }
    const id = setInterval(() => setBeat((b) => !b), ms);
    return () => clearInterval(id);
  }, [on, ms]);
  return beat;
}

type FaceColors = ReturnType<typeof useTheme>['colors']['mascot'];

const Arms = memo(function Arms({ mood, body, outline, wave }: { mood: Mood; body: string; outline: string; wave: 0 | 1 | 2 }) {
  const pose =
    mood === 'cheer' || mood === 'wow'
      ? ['M26 72 Q10 62 12 42', 'M94 72 Q110 62 108 42']
      : mood === 'thinking'
        ? ['M26 80 Q14 90 18 106', 'M94 74 Q112 66 104 50']
        : mood === 'sad' || mood === 'sleepy'
          ? ['M26 84 Q18 96 22 112', 'M94 84 Q102 96 98 112']
          : mood === 'worried'
            ? ['M26 80 Q12 80 14 66', 'M94 80 Q108 80 106 66']
            : ['M26 80 Q12 88 16 104', 'M94 80 Q108 88 104 104'];
  // Waving swings the right arm between two raised positions; the left keeps the mood's pose.
  const paths = wave ? [pose[0]!, wave === 1 ? 'M94 74 Q112 62 106 38' : 'M94 74 Q118 70 120 46'] : pose;
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
});

const Face = memo(function Face({ mood, c, blinking, mouthOpen }: { mood: Mood; c: FaceColors; blinking: boolean; mouthOpen: boolean }) {
  const line = { stroke: c.eye, strokeWidth: 4, strokeLinecap: 'round' as const, fill: 'none' };
  const look =
    mood === 'thinking' ? { x: 3, y: -3 } : mood === 'sad' ? { x: 0, y: 3 } : mood === 'happy' ? { x: 1, y: -1 } : { x: 0, y: 0 };
  const big = mood === 'wow';

  const eyes = blinking ? (
    <G>
      <Path d="M37 65 Q46 70 55 65" {...line} />
      <Path d="M65 65 Q74 70 83 65" {...line} />
    </G>
  ) : mood === 'cheer' ? (
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

  const mouth = mouthOpen ? (
    <G>
      <Ellipse cx={60} cy={84} rx={8} ry={6} fill={c.mouth} stroke={c.eye} strokeWidth={3} />
      <Ellipse cx={60} cy={87} rx={4} ry={2} fill={c.tongue} />
    </G>
  ) : mood === 'cheer' ? (
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
});
