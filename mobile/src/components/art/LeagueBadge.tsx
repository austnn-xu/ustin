import { memo } from 'react';
import Svg, { Circle, G, Path, Polygon } from 'react-native-svg';
import { useTheme, type LeagueId } from '@/theme';

/**
 * A league's badge, drawn in a 64×64 box. The three metal leagues are shields with one, two or three stars; the four
 * stone leagues are cut gems, each its own shape (emerald step-cut, diamond brilliant, round sapphire, cushion ruby);
 * Pristine is a star-cut gem whose facets catch every other league's colour, with rays. Flat colours only (no
 * gradients): a darker copy sits underneath for the chunky 3D edge, like every button in the app.
 */
export const LeagueBadge = memo(function LeagueBadge({ league, size }: { league: LeagueId; size: number }) {
  const t = useTheme();
  const c = t.colors.league[league];
  const L = t.colors.league;
  const shine = t.colors.mascot.shine;

  const depth = (d: string) => <Path d={d} fill={c.depth} transform="translate(0 3)" />;

  let art: React.ReactNode;
  switch (league) {
    case 'bronze':
    case 'silver':
    case 'gold': {
      const shield = 'M32 5 L55 13 V30 C55 45 45 55 32 59 C19 55 9 45 9 30 V13 Z';
      const stars = league === 'bronze' ? [32] : league === 'silver' ? [25, 39] : [21, 32, 43];
      art = (
        <G>
          {depth(shield)}
          <Path d={shield} fill={c.base} />
          <Path d="M32 5 L55 13 V30 C55 33 54.6 35.9 53.8 38.6 L32 30 Z" fill={c.facet} opacity={0.55} />
          <Path d="M32 11 L49 17 V30 C49 41 41.5 49 32 52.5 C22.5 49 15 41 15 30 V17 Z" fill="none" stroke={c.depth} strokeWidth={2.5} />
          {stars.map((x) => (
            <Path
              key={x}
              d={`M${x} ${25.5} l2.35 4.76 5.25.76-3.8 3.7.9 5.23-4.7-2.47-4.7 2.47.9-5.23-3.8-3.7 5.25-.76z`}
              fill={shine}
              stroke={c.depth}
              strokeWidth={1.2}
              strokeLinejoin="round"
            />
          ))}
        </G>
      );
      break;
    }
    case 'emerald': {
      const cut = 'M20 6 H44 L56 18 V46 L44 58 H20 L8 46 V18 Z';
      art = (
        <G>
          {depth(cut)}
          <Path d={cut} fill={c.base} />
          <Path d="M24 16 H40 L46 22 V42 L40 48 H24 L18 42 V22 Z" fill={c.facet} opacity={0.7} />
          <Path d="M20 6 L24 16 M44 6 L40 16 M56 18 L46 22 M56 46 L46 42 M44 58 L40 48 M20 58 L24 48 M8 46 L18 42 M8 18 L18 22" stroke={c.depth} strokeWidth={1.5} />
          <Path d="M24 18 H33 L28 24 H21 Z" fill={shine} opacity={0.8} />
        </G>
      );
      break;
    }
    case 'diamond': {
      const gem = 'M18 8 H46 L58 24 L32 58 L6 24 Z';
      art = (
        <G>
          {depth(gem)}
          <Path d={gem} fill={c.base} />
          <Path d="M18 8 H46 L58 24 H6 Z" fill={c.facet} />
          <Path d="M6 24 H58 M18 8 L24 24 L32 8 L40 24 L46 8 M24 24 L32 58 L40 24" stroke={c.depth} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
          <Path d="M20 11 H29 L23 21 H13 Z" fill={shine} opacity={0.85} />
        </G>
      );
      break;
    }
    case 'sapphire': {
      art = (
        <G>
          <Circle cx={32} cy={35} r={26} fill={c.depth} />
          <Circle cx={32} cy={32} r={26} fill={c.base} />
          <Polygon points="32,14 45,19 50,32 45,45 32,50 19,45 14,32 19,19" fill={c.facet} opacity={0.6} />
          <Path d="M32 6 L32 14 M50.4 13.6 L45 19 M58 32 L50 32 M50.4 50.4 L45 45 M32 58 L32 50 M13.6 50.4 L19 45 M6 32 L14 32 M13.6 13.6 L19 19" stroke={c.depth} strokeWidth={1.5} />
          <Polygon points="32,22 41,32 32,42 23,32" fill={c.base} />
          <Path d="M21 17 L30 14 L25 23 Z" fill={shine} opacity={0.85} />
        </G>
      );
      break;
    }
    case 'ruby': {
      const cushion = 'M32 6 C44 6 58 10 58 24 C58 40 46 52 32 59 C18 52 6 40 6 24 C6 10 20 6 32 6 Z';
      art = (
        <G>
          {depth(cushion)}
          <Path d={cushion} fill={c.base} />
          <Path d="M32 14 L48 22 L32 48 L16 22 Z" fill={c.facet} opacity={0.65} />
          <Path d="M16 22 H48 M32 14 L26 22 L32 48 L38 22 Z" stroke={c.depth} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
          <Path d="M14 13 C18 10 23 9 27 9 L20 19 Z" fill={shine} opacity={0.85} />
        </G>
      );
      break;
    }
    case 'pristine': {
      // Eight points, each facet a different league's light: the gem holds every league it climbed through.
      const tips = Array.from({ length: 8 }, (_, i) => {
        const a = (Math.PI / 4) * i - Math.PI / 2;
        return [32 + Math.cos(a) * 27, 33 + Math.sin(a) * 27];
      });
      const inner = Array.from({ length: 8 }, (_, i) => {
        const a = (Math.PI / 4) * i - Math.PI / 2 + Math.PI / 8;
        return [32 + Math.cos(a) * 13, 33 + Math.sin(a) * 13];
      });
      const star = tips.flatMap((p, i) => [p, inner[i]!]).map(([x, y]) => `${x!.toFixed(1)},${y!.toFixed(1)}`).join(' ');
      const facets = [L.diamond.facet, L.ruby.facet, L.emerald.facet, L.sapphire.facet, L.gold.facet, L.diamond.base, L.ruby.base, L.emerald.base];
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityElementsHidden importantForAccessibility="no">
          {[0, 2, 4, 6].map((i) => {
            const [x, y] = tips[i]!;
            return <Circle key={i} cx={32 + (x - 32) * 1.12} cy={33 + (y - 33) * 1.12} r={1.8} fill={c.depth} />;
          })}
          <Polygon points={star} fill={c.depth} transform="translate(0 3)" />
          <Polygon points={star} fill={c.base} />
          {tips.map(([x, y], i) => {
            const [ax, ay] = inner[(i + 7) % 8]!;
            const [bx, by] = inner[i]!;
            return <Polygon key={i} points={`32,33 ${ax},${ay} ${x},${y} ${bx},${by}`} fill={facets[i]} opacity={0.55} />;
          })}
          <Polygon points={star} fill="none" stroke={c.depth} strokeWidth={1.5} strokeLinejoin="round" />
          <Circle cx={32} cy={33} r={6} fill={shine} stroke={c.depth} strokeWidth={1.5} />
        </Svg>
      );
    }
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityElementsHidden importantForAccessibility="no">
      {art}
    </Svg>
  );
});
