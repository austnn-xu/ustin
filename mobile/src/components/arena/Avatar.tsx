import { View } from 'react-native';
import { Text } from '@/components/ui';
import { makeStyles, useTheme, type HueName } from '@/theme';

/**
 * A player on a board: their initial on the paint colour they gave Tin in the shop. One Tin per screen is the rule,
 * so players are never drawn as Tins; the paint is how a board still feels like everyone's own.
 */
export function Avatar({ name, paint, size = 'md' }: { name: string; paint: HueName; size?: 'sm' | 'md' | 'lg' }) {
  const t = useTheme();
  const styles = useStyles();
  const px = size === 'sm' ? t.layout.control.sm : size === 'md' ? t.layout.control.md : t.layout.mascot.sm;
  const hue = t.colors.hue[paint] ?? t.colors.hue.green;
  return (
    <View
      style={[styles.circle, { width: px, height: px, backgroundColor: hue.base, borderColor: hue.depth }]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Text variant={size === 'lg' ? 'title' : size === 'md' ? 'heading' : 'bodyStrong'} color="onColor">
        {name.trim().charAt(0).toUpperCase() || '?'}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  circle: {
    borderRadius: t.radius.pill,
    borderBottomWidth: t.layout.depth.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
}));
