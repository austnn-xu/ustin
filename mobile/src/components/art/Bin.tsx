import type { LucideIcon } from 'lucide-react-native';
import { MapPin, Recycle, Repeat2, Sprout, Trash2 } from 'lucide-react-native';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import type { OutcomeId } from '@/lib/engine';
import { useTheme, type HueName } from '@/theme';

/** Every outcome's hue, icon and short name. The same everywhere so people learn them. */
export const BIN: Record<OutcomeId, { hue: HueName; icon: LucideIcon; short: string; phrase: string }> = {
  recycle: { hue: 'blue', icon: Recycle, short: 'Recycling', phrase: 'the recycling' },
  compost: { hue: 'brown', icon: Sprout, short: 'Compost', phrase: 'the compost' },
  trash: { hue: 'slate', icon: Trash2, short: 'Trash', phrase: 'the trash' },
  dropoff: { hue: 'orange', icon: MapPin, short: 'Drop-off', phrase: 'a special drop-off' },
  reuse: { hue: 'purple', icon: Repeat2, short: 'Reuse', phrase: 'reuse or donation' },
};

/** A little wheelie bin in the outcome's color, its icon on the front. Drawn in a 64×72 viewBox. */
export function BinArt({ outcome, size }: { outcome: OutcomeId; size: number }) {
  const t = useTheme();
  const bin = BIN[outcome];
  const hue = t.colors.hue[bin.hue];
  const Glyph = bin.icon;
  const iconSize = size * 0.42;
  return (
    <View style={{ width: size, height: size * (72 / 64), alignItems: 'center' }} aria-hidden>
      <Svg width="100%" height="100%" viewBox="0 0 64 72" style={{ position: 'absolute' }}>
        <Rect x={24} y={1} width={16} height={9} rx={3} fill={hue.depth} />
        <Path d="M10 22 H54 L50.5 65 Q50 70 45 70 H19 Q14 70 13.5 65 Z" fill={hue.base} />
        <Path d="M22 28 L23.5 62 M42 28 L40.5 62" stroke={t.colors.shine} strokeWidth={3} strokeLinecap="round" />
        <Rect x={4} y={9} width={56} height={13} rx={5} fill={hue.depth} />
        <Rect x={6} y={10} width={52} height={5} rx={2.5} fill={t.colors.shine} />
      </Svg>
      <View style={{ position: 'absolute', top: size * 0.5, width: size, alignItems: 'center' }}>
        <Glyph size={iconSize} color={t.colors.onColor} strokeWidth={t.layout.iconStroke + 0.5} />
      </View>
    </View>
  );
}
