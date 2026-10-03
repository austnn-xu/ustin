import type { LucideIcon } from 'lucide-react-native';
import { useTheme, type ColorTokens } from '@/theme';

export type IconProps = {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  color?: keyof ColorTokens;
};

/** The only way to render an icon. Locks stroke width and sizes to tokens. */
export function Icon({ icon: Glyph, size = 'md', color = 'text' }: IconProps) {
  const t = useTheme();
  return (
    <Glyph
      size={t.layout.icon[size]}
      color={t.colors[color]}
      strokeWidth={t.layout.iconStroke}
      // Decorative: the labelled parent (Button, ListRow…) carries the accessible name.
      aria-hidden
    />
  );
}
