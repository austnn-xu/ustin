import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';
import { makeStyles, useTheme } from '@/theme';
import { Text } from './Text';

export type AvatarProps = {
  name: string;
  uri?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
};

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

/** Photo with an initials fallback (missing URL or failed load). */
export function Avatar({ name, uri, size = 'md' }: AvatarProps) {
  const t = useTheme();
  const styles = useStyles();
  const [failed, setFailed] = useState(false);
  const px = t.layout.avatar[size];
  const dims = { width: px, height: px };
  const textVariant = size === 'xl' ? 'title' : size === 'lg' ? 'heading' : size === 'xs' ? 'label' : 'callout';

  return (
    <View style={[styles.root, dims]} accessibilityRole="image" accessibilityLabel={name}>
      <Text variant={textVariant} color="textSecondary" style={styles.initials}>
        {initialsOf(name)}
      </Text>
      {uri && !failed && (
        <Image
          source={{ uri }}
          style={[styles.image, dims]}
          contentFit="cover"
          transition={t.motion.pulseDuration / 4}
          recyclingKey={uri}
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: {
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.fillStrong,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: { textTransform: 'none', letterSpacing: 0 },
  image: { position: 'absolute', top: 0, left: 0 },
}));
