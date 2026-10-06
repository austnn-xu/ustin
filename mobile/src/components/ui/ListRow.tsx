import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { makeStyles } from '@/theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  /** Leading icon in a neutral tile, or any node (Avatar, thumbnail). */
  icon?: LucideIcon;
  leading?: ReactNode;
  /** Trailing secondary text, e.g. "English" or "$24.10". */
  value?: string;
  /** Any trailing node (Badge, Switch). Rendered after `value`. */
  trailing?: ReactNode;
  /** Defaults to true when the row is pressable. */
  chevron?: boolean;
  onPress?: () => void;
  destructive?: boolean;
};

/**
 * Full-bleed row with gutter padding. Pressable rows highlight instead of scaling —
 * scaling an edge-to-edge row reads as a glitch.
 */
export function ListRow({
  title,
  subtitle,
  icon,
  leading,
  value,
  trailing,
  chevron,
  onPress,
  destructive,
}: ListRowProps) {
  const styles = useStyles();
  const [pressed, setPressed] = useState(false);
  const showChevron = chevron ?? !!onPress;

  const body = (
    <>
      {icon ? (
        <View style={styles.iconTile}>
          <Icon icon={icon} color="text" hue={destructive ? 'red' : undefined} />
        </View>
      ) : (
        leading
      )}
      <View style={styles.text}>
        <Text variant="bodyStrong" hue={destructive ? 'red' : undefined} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" color="textSecondary" numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {value && (
        <Text variant="body" color="textSecondary" numberOfLines={1} tabular>
          {value}
        </Text>
      )}
      {trailing && <View style={styles.trailing}>{trailing}</View>}
      {showChevron && <Icon icon={ChevronRight} size="sm" color="textTertiary" />}
    </>
  );

  if (!onPress) return <View style={styles.row}>{body}</View>;

  return (
    <PressableScale
      scale={false}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityLabel={[title, subtitle, value].filter(Boolean).join(', ')}
      style={[styles.row, pressed && styles.pressed]}
    >
      {body}
    </PressableScale>
  );
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space[3],
    minHeight: t.layout.control.lg + t.space[4],
    paddingVertical: t.space[3],
    paddingHorizontal: t.layout.gutter,
  },
  pressed: { backgroundColor: t.colors.fill },
  iconTile: {
    width: t.layout.art.sm,
    height: t.layout.art.sm,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: t.space[0.5] },
  trailing: { justifyContent: 'center' },
}));
