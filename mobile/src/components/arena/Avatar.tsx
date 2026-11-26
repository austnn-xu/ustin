import { View } from 'react-native';
import { Mascot } from '@/components/art/Mascot';
import { paintOf, type Outfit } from '@/lib/cosmetics';
import { usePlayerOutfit } from '@/lib/leaderboard';
import { useProgress } from '@/stores/progress';
import { makeStyles, useTheme, type HueName } from '@/theme';

const TIN_SIZE = { sm: 'xs', md: 'sm', lg: 'sm', xl: 'md' } as const;

/**
 * A player on a board or in a match: their own Tin, wearing what they bought in the shop and painted their colour.
 *
 * Your own avatar is drawn straight from your outfit. Everyone else's is fetched by name (one batched call for a whole
 * board, see `usePlayerOutfit`); until it arrives, or when the leaderboard is not connected, they appear as a plain Tin
 * in their paint colour. These are small, still drawings (no animation, no timers), so a board of them stays cheap, and
 * they are avatars like those in a game lobby: they do not count as the screen's one Tin.
 */
export function Avatar({ name, paint, size = 'md', own = false }: { name: string; paint: HueName; size?: 'sm' | 'md' | 'lg' | 'xl'; own?: boolean }) {
  const t = useTheme();
  const styles = useStyles();
  const equipped = useProgress((s) => s.equipped);
  const theirs = usePlayerOutfit(name, !own);
  const outfit: Outfit = own ? equipped : (theirs.data ?? {});
  // Paint is each player's own colour, drawn from the `paint` they saved (or, for you, from your outfit).
  const hue = own ? (paintOf(equipped) ?? paint) : paint;
  const px = t.layout.mascot[TIN_SIZE[size]];
  return (
    <View style={[styles.box, { width: px, height: px * (168 / 120) }]} accessibilityElementsHidden importantForAccessibility="no">
      <Mascot size={TIN_SIZE[size]} idle={false} mood="happy" hue={hue} outfit={own ? equipped : { ...outfit, paint: undefined }} />
    </View>
  );
}

const useStyles = makeStyles(() => ({
  box: { alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 },
}));
