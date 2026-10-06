import type { LucideIcon } from 'lucide-react-native';
import { useTheme, type ColorTokens, type Hue, type HueName } from '@/theme';

export type IconProps = {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: keyof ColorTokens;
  hue?: HueName;
  shade?: keyof Hue;
  /** Fill the glyph with its own color (hearts, flames, stars). */
  filled?: boolean;
};

/** The only way to render an icon. Locks stroke width and sizes to tokens. */
export function Icon({ icon: Glyph, size = 'md', color = 'text', hue, shade = 'base', filled }: IconProps) {
  const t = useTheme();
  const c = hue ? t.colors.hue[hue][shade] : t.colors[color];
  return (
    <Glyph
      size={t.layout.icon[size]}
      color={c}
      fill={filled ? c : 'none'}
      strokeWidth={t.layout.iconStroke}
      // Decorative: the labelled parent (Button, row…) carries the accessible name.
      aria-hidden
    />
  );
}
