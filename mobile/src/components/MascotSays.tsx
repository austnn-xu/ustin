import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
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
  // Only the typed text re-renders as letters appear; this component (and Tin) re-render just twice — when talking starts
  // and when it stops — so the SVG is never redrawn per letter.
  const reduced = useReducedMotion();
  const [doneFor, setDoneFor] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(0);
  const talking = typing && !reduced && text !== null && doneFor !== text;

  const bubble = (
    <Appear
      key={text ?? undefined}
      from="pop"
      spring="bouncy"
      style={[styles.bubbleWrap, layout === 'above' && styles.bubbleAbove]}
    >
      <Pressable
        onPress={talking ? () => setSkipped((n) => n + 1) : undefined}
        disabled={!talking}
        accessibilityLabel={text ?? undefined}
        style={styles.bubble}
      >
        <View style={[styles.tail, layout === 'above' ? styles.tailDown : styles.tailLeft]} />
        {text !== null ? (
          <TypedText text={text} typing={typing} skipped={skipped} onDone={setDoneFor} />
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
 * The words of a bubble, typed out at `t.motion.typeSpeed` with a little pause after punctuation. The rest of the line is
 * laid out but invisible, so the bubble is its final size from the first letter. Reduced motion shows it all at once.
 */
const TypedText = memo(function TypedText({
  text,
  typing,
  skipped,
  onDone,
}: {
  text: string;
  typing: boolean;
  skipped: number;
  onDone: (text: string) => void;
}) {
  const t = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();
  const animate = typing && !reduced;
  const [count, setCount] = useState(animate ? 0 : text.length);
  // A tap on the bubble bumps `skipped`; compare against its value when this text started typing.
  const start = useRef({ text, skipped });
  if (start.current.text !== text) start.current = { text, skipped };

  useEffect(() => {
    if (!animate || skipped !== start.current.skipped) {
      setCount(text.length);
      onDone(text);
      return;
    }
    setCount(0);
    let n = 0;
    const id = setInterval(() => {
      // Pause a beat after punctuation, the way people talk.
      const ch = text[n - 1];
      if ((ch === '.' || ch === '!' || ch === '?' || ch === ',') && Math.random() < 0.6) return;
      n += 1;
      setCount(n);
      if (n >= text.length) {
        clearInterval(id);
        onDone(text);
      }
    }, t.motion.typeSpeed);
    return () => clearInterval(id);
  }, [text, animate, skipped, onDone, t.motion.typeSpeed]);

  const shown = Math.min(count, text.length);
  return (
    <Text variant="bodyStrong">
      {text.slice(0, shown)}
      <Text variant="bodyStrong" style={styles.unsaid}>
        {text.slice(shown)}
      </Text>
    </Text>
  );
});

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
