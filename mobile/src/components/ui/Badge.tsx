import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { makeStyles, type ColorTokens } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

export type BadgeTone = 'neutral' | 'accent' | 'danger' | 'inverse';

export type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  icon?: LucideIcon;
  /** Small leading status dot instead of an icon (e.g. "Open now"). */
  dot?: boolean;
};

const fg: Record<BadgeTone, keyof ColorTokens> = {
  neutral: 'textSecondary',
  accent: 'accent',
  danger: 'danger',
  inverse: 'textInverse',
};

export function Badge({ label, tone = 'neutral', icon, dot }: BadgeProps) {
  const styles = useStyles();
  const color = fg[tone] as 'textSecondary' | 'accent' | 'danger' | 'textInverse';
  return (
    <View style={[styles.root, styles[tone]]}>
      {dot && <View style={[styles.dot, styles[`dot_${tone}`]]} />}
      {icon && <Icon icon={icon} size="sm" color={color} />}
      <Text variant="callout" color={color} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: t.space[1],
    height: t.space[6],
    paddingHorizontal: t.space[2],
    borderRadius: t.radius.xs,
  },
  neutral: { backgroundColor: t.colors.fill },
  accent: { backgroundColor: t.colors.accentSubtle },
  danger: { backgroundColor: t.colors.dangerSubtle },
  inverse: { backgroundColor: t.colors.text },
  dot: { width: t.layout.dot, height: t.layout.dot, borderRadius: t.radius.pill },
  dot_neutral: { backgroundColor: t.colors.textTertiary },
  dot_accent: { backgroundColor: t.colors.accent },
  dot_danger: { backgroundColor: t.colors.danger },
  dot_inverse: { backgroundColor: t.colors.textInverse },
}));
