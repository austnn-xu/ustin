import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Mascot, type MascotProps } from '@/components/art/Mascot';
import { Text } from '@/components/ui';
import { makeStyles } from '@/theme';

export type MascotSaysProps = Pick<MascotProps, 'mood' | 'size' | 'hue'> & {
  /** What Tin says. A string, or richer content. */
  children: ReactNode;
  /** Bubble beside Tin (default) or above. */
  layout?: 'beside' | 'above';
};

/** Tin with a speech bubble — how the app talks to the user in its warmest moments. */
export function MascotSays({ children, mood = 'happy', size = 'md', hue, layout = 'beside' }: MascotSaysProps) {
  const styles = useStyles();
  const bubble = (
    <View style={[styles.bubble, layout === 'above' && styles.bubbleAbove]}>
      <View style={[styles.tail, layout === 'above' ? styles.tailDown : styles.tailLeft]} />
      {typeof children === 'string' ? <Text variant="bodyStrong">{children}</Text> : children}
    </View>
  );
  if (layout === 'above') {
    return (
      <View style={styles.column}>
        {bubble}
        <Mascot mood={mood} size={size} hue={hue} />
      </View>
    );
  }
  return (
    <View style={styles.row}>
      <Mascot mood={mood} size={size} hue={hue} />
      {bubble}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space[4] },
  column: { alignItems: 'center', gap: t.space[4] },
  bubble: {
    flexShrink: 1,
    borderWidth: t.layout.border,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    paddingVertical: t.space[3],
    paddingHorizontal: t.space[4],
  },
  bubbleAbove: { alignSelf: 'stretch' },
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
