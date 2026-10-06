import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { makeStyles, type HueName } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

export type ChipProps = {
  label: string;
  hue?: HueName;
  icon?: LucideIcon;
  /** Small, for inline facts like "#5 PP". */
  size?: 'sm' | 'md';
  /** Sit on a tinted panel: white (surface) fill so the chip does not vanish into the tint. */
  onTint?: boolean;
};

/** A tinted pill for facts: streams, acceptance, scenario details. Not tappable — use Button or ChoiceCard for that. */
export function Chip({ label, hue, icon, size = 'md', onTint = false }: ChipProps) {
  const styles = useStyles();
  return (
    <View style={[styles.root, size === 'sm' && styles.sm, onTint ? styles.onTint : hue ? styles[hue] : styles.neutral]}>
      {icon && <Icon icon={icon} size="sm" hue={hue} shade="text" color="textSecondary" />}
      <Text variant="callout" hue={hue} color="textSecondary" numberOfLines={1}>
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
    minHeight: t.space[8],
    paddingHorizontal: t.space[3],
    borderRadius: t.radius.pill,
  },
  sm: { minHeight: t.space[6], paddingHorizontal: t.space[2] },
  neutral: { backgroundColor: t.colors.fill },
  onTint: { backgroundColor: t.colors.surface },
  green: { backgroundColor: t.colors.hue.green.subtle },
  blue: { backgroundColor: t.colors.hue.blue.subtle },
  red: { backgroundColor: t.colors.hue.red.subtle },
  orange: { backgroundColor: t.colors.hue.orange.subtle },
  yellow: { backgroundColor: t.colors.hue.yellow.subtle },
  purple: { backgroundColor: t.colors.hue.purple.subtle },
  brown: { backgroundColor: t.colors.hue.brown.subtle },
  slate: { backgroundColor: t.colors.hue.slate.subtle },
}));
