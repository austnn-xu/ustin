import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { Mascot, type MascotProps } from '@/components/art/Mascot';
import { Appear, Text } from '@/components/ui';
import { makeStyles, useTheme } from '@/theme';

export type MascotSaysProps = Pick<MascotProps, 'mood' | 'size' | 'hue' | 'wave' | 'pokeable'> & {
  /** What Tin says. A string, or richer content. */
  children: ReactNode;
  /** Bubble beside Tin (default) or above. */
  layout?: 'beside' | 'above';
  /**
   * Type a string out a few letters at a time while Tin's mouth moves, like a cartoon talking. For the moments Tin is
   * explaining something; tap the bubble to skip to the end.
   */
  typing?: boolean;
};

/**
 * Tin with a speech bubble — how the app talks to the user in its warmest moments. The bubble springs out of Tin
 * whenever what Tin says changes.
 */
export function MascotSays({ children, mood = 'happy', size = 'md', hue, wave, pokeable, layout = 'beside', typing = false }: MascotSaysProps) {
  const styles = useStyles();
  const text = typeof children === 'string' ? children : null;
  const [shown, skip] = useTypewriter(typing ? text : null);
  const talking = text !== null && shown < text.length;

  const bubble = (
    <Appear
      key={text ?? undefined}
      from="pop"
      spring="bouncy"
      style={[styles.bubbleWrap, layout === 'above' && styles.bubbleAbove]}
    >
      <Pressable
        onPress={talking ? skip : undefined}
        disabled={!talking}
        accessibilityLabel={text ?? undefined}
        style={styles.bubble}
      >
        <View style={[styles.tail, layout === 'above' ? styles.tailDown : styles.tailLeft]} />
        {text !== null ? (
          <Text variant="bodyStrong">
            {text.slice(0, shown)}
            {/* The rest is laid out but invisible, so the bubble is its final size from the first letter. */}
            <Text variant="bodyStrong" style={styles.unsaid}>
              {text.slice(shown)}
            </Text>
          </Text>
        ) : (
          children
        )}
      </Pressable>
    </Appear>
  );
  const tin = <Mascot mood={mood} size={size} hue={hue} wave={wave} pokeable={pokeable} talking={talking} />;

  if (layout === 'above') {
    return (
      <View style={styles.column}>
        {bubble}
        {tin}
      </View>
    );
  }
  return (
    <View style={styles.row}>
      {tin}
      {bubble}
    </View>
  );
}

/**
 * How many characters of `text` are showing. Counts up at `t.motion.typeSpeed`, restarting when the text changes; a
 * null text (typing off) or reduced motion shows everything at once. The second value jumps to the end.
 */
function useTypewriter(text: string | null) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const [count, setCount] = useState(text && !reduced ? 0 : Number.MAX_SAFE_INTEGER);

  useEffect(() => {
    if (!text || reduced) {
      setCount(Number.MAX_SAFE_INTEGER);
      return;
    }
    setCount(0);
    const id = setInterval(() => {
      setCount((n) => {
        if (n >= text.length) {
          clearInterval(id);
          return n;
        }
        // Pause a beat after punctuation, the way people talk.
        const ch = text[n - 1];
        if ((ch === '.' || ch === '!' || ch === '?' || ch === ',') && Math.random() < 0.6) return n;
        return n + 1;
      });
    }, t.motion.typeSpeed);
    return () => clearInterval(id);
  }, [text, reduced, t.motion.typeSpeed]);

  return [count, () => setCount(Number.MAX_SAFE_INTEGER)] as const;
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space[4] },
  column: { alignItems: 'center', gap: t.space[4] },
  bubbleWrap: { flexShrink: 1 },
  bubble: {
    borderWidth: t.layout.border,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    paddingVertical: t.space[3],
    paddingHorizontal: t.space[4],
  },
  bubbleAbove: { alignSelf: 'stretch' },
  unsaid: { color: 'transparent' },
  tail: {
    position: 'absolute',
    width: t.space[4],
    height: t.space[4],
    backgroundColor: t.colors.surface,
    borderColor: t.colors.border,
    transform: [{ rotate: '45deg' }],
  },
  tailLeft: {
    left: -t.space[2] - t.layout.border / 2,
    top: '50%',
    marginTop: -t.space[2],
    borderLeftWidth: t.layout.border,
    borderBottomWidth: t.layout.border,
  },
  tailDown: {
    bottom: -t.space[2] - t.layout.border / 2,
    left: '50%',
    marginLeft: -t.space[2],
    borderRightWidth: t.layout.border,
    borderBottomWidth: t.layout.border,
  },
}));
