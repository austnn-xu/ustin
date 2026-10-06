import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useTheme, type HueName } from '@/theme';

const PIECES = 36;
const HUES: HueName[] = ['green', 'blue', 'red', 'orange', 'yellow', 'purple'];

type Piece = { x: number; drift: number; delay: number; spin: number; hue: HueName; wide: boolean; fall: number };

/** A one-shot burst of confetti over the whole screen. Re-mount (change `key`) to fire again. */
export function Confetti() {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: PIECES }, (_, i) => ({
        x: Math.random() * width,
        drift: (Math.random() - 0.5) * width * 0.3,
        delay: Math.random() * 400,
        spin: (Math.random() - 0.5) * 1440,
        hue: HUES[i % HUES.length]!,
        wide: Math.random() > 0.5,
        fall: 0.75 + Math.random() * 0.5,
      })),
    [width],
  );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} piece={p} height={height} />
      ))}
    </View>
  );
}

function ConfettiPiece({ piece, height }: { piece: Piece; height: number }) {
  const t = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      piece.delay,
      withTiming(1, { duration: t.motion.confettiDuration * piece.fall, easing: Easing.out(Easing.quad) }),
    );
  }, [piece, progress, t.motion.confettiDuration]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value < 0.85 ? 1 : (1 - progress.value) / 0.15,
    transform: [
      { translateX: piece.x + piece.drift * progress.value },
      { translateY: -t.space[8] + progress.value * (height + t.space[16]) },
      { rotate: `${piece.spin * progress.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: piece.wide ? t.space[3] : t.space[2],
          height: piece.wide ? t.space[2] : t.space[3],
          borderRadius: t.radius.xs / 2,
          backgroundColor: t.colors.hue[piece.hue].base,
        },
        style,
      ]}
    />
  );
}
