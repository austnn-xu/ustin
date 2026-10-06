import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/theme';

/**
 * Cosmetics for Tin, drawn in the mascot's own coordinates (see Mascot.tsx: the lid sits at y≈20–40, the eyes at
 * (46, 64) and (74, 64), the label band at y 96–110). Hats may rise to y = -28, the headroom the mascot's viewBox
 * keeps above the lid.
 */

type Colors = ReturnType<typeof useTheme>['colors'];

export function HatArt({ id, c }: { id: string; c: Colors }) {
  const ink = c.mascot.outline;
  const white = c.mascot.shine;
  const line = { stroke: ink, strokeWidth: 3, strokeLinejoin: 'round' as const };
  switch (id) {
    case 'hat-cap':
      return (
        <G>
          <Path d="M32 26 Q32 2 60 2 Q88 2 88 26 Z" fill={c.hue.blue.base} {...line} />
          <Path d="M64 24 Q98 18 108 27 Q92 32 64 30 Z" fill={c.hue.blue.depth} {...line} />
          <Circle cx={60} cy={3} r={3.5} fill={c.hue.blue.depth} />
          <Path d="M48 14 Q60 8 72 14" stroke={white} strokeWidth={3} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'hat-beanie':
      return (
        <G>
          <Path d="M28 24 Q28 -6 60 -6 Q92 -6 92 24 Z" fill={c.hue.orange.base} {...line} />
          <Path d="M44 -2 V18 M60 -6 V18 M76 -2 V18" stroke={c.hue.orange.depth} strokeWidth={3} />
          <Rect x={25} y={16} width={70} height={12} rx={6} fill={c.hue.orange.depth} {...line} />
          <Circle cx={60} cy={-10} r={7} fill={white} {...line} />
        </G>
      );
    case 'hat-hardhat':
      return (
        <G>
          <Path d="M30 24 Q32 -2 60 -2 Q88 -2 90 24 Z" fill={c.hue.yellow.base} {...line} />
          <Path d="M60 -2 V22" stroke={c.hue.yellow.depth} strokeWidth={5} />
          <Ellipse cx={60} cy={25} rx={40} ry={6} fill={c.hue.yellow.depth} {...line} />
          <Path d="M38 12 H50" stroke={white} strokeWidth={3} strokeLinecap="round" />
        </G>
      );
    case 'hat-party':
      return (
        <G>
          <Path d="M42 26 L60 -24 L78 26 Z" fill={c.hue.purple.base} {...line} />
          <Path d="M50 4 L70 10 M46 16 L74 22" stroke={c.hue.yellow.base} strokeWidth={4} strokeLinecap="round" />
          <Circle cx={60} cy={-24} r={6} fill={c.hue.red.base} {...line} />
        </G>
      );
    case 'hat-chef':
      return (
        <G>
          <Circle cx={42} cy={0} r={13} fill={white} {...line} />
          <Circle cx={78} cy={0} r={13} fill={white} {...line} />
          <Circle cx={60} cy={-8} r={15} fill={white} {...line} />
          <Rect x={36} y={4} width={48} height={22} rx={4} fill={white} {...line} />
          <Path d="M48 10 V22 M60 10 V22 M72 10 V22" stroke={c.mascot.bodyShade} strokeWidth={2} />
        </G>
      );
    case 'hat-cowboy':
      return (
        <G>
          <Path d="M38 22 Q38 -8 52 -4 Q60 2 68 -4 Q82 -8 82 22 Z" fill={c.hue.brown.base} {...line} />
          <Rect x={38} y={12} width={44} height={6} fill={ink} />
          <Path d="M6 20 Q30 34 60 32 Q90 34 114 20 Q104 36 60 38 Q16 36 6 20 Z" fill={c.hue.brown.depth} {...line} />
        </G>
      );
    case 'hat-flowers':
      return (
        <G>
          {[
            [26, 26, c.hue.red.base],
            [40, 32, c.hue.yellow.base],
            [60, 34, c.hue.purple.base],
            [80, 32, c.hue.yellow.base],
            [94, 26, c.hue.red.base],
          ].map(([x, y, fill]) => (
            <G key={`${x}`}>
              <Ellipse cx={(x as number) - 6} cy={(y as number) + 2} rx={5} ry={3} fill={c.scene.leaf} />
              <Circle cx={x as number} cy={y as number} r={7} fill={fill as string} {...line} />
              <Circle cx={x as number} cy={y as number} r={2.5} fill={white} />
            </G>
          ))}
        </G>
      );
    case 'hat-tophat':
      return (
        <G>
          <Rect x={40} y={-24} width={40} height={46} rx={4} fill={ink} />
          <Rect x={40} y={8} width={40} height={8} fill={c.hue.red.base} />
          <Ellipse cx={60} cy={23} rx={34} ry={7} fill={ink} />
          <Path d="M46 -18 V2" stroke={c.mascot.bodyShade} strokeWidth={3} strokeLinecap="round" />
        </G>
      );
    case 'hat-propeller':
      return (
        <G>
          <Path d="M32 26 Q32 0 60 0 Q88 0 88 26 Z" fill={c.hue.red.base} {...line} />
          <Path d="M60 0 Q48 10 46 26 M60 0 Q72 10 74 26" stroke={c.hue.yellow.base} strokeWidth={6} fill="none" />
          <Path d="M32 26 Q32 0 60 0 Q88 0 88 26 Z" fill="none" {...line} />
          <Path d="M60 0 V-12" stroke={ink} strokeWidth={3} />
          <Ellipse cx={46} cy={-14} rx={14} ry={4} fill={c.hue.blue.base} {...line} />
          <Ellipse cx={74} cy={-14} rx={14} ry={4} fill={c.hue.green.base} {...line} />
          <Circle cx={60} cy={-14} r={3.5} fill={ink} />
        </G>
      );
    case 'hat-crown':
      return (
        <G>
          <Path d="M32 26 L32 2 L46 14 L60 -6 L74 14 L88 2 L88 26 Z" fill={c.hue.yellow.base} {...line} />
          <Rect x={32} y={18} width={56} height={8} fill={c.hue.yellow.depth} />
          <Circle cx={60} cy={12} r={4} fill={c.hue.red.base} />
          <Circle cx={44} cy={20} r={3} fill={c.hue.blue.base} />
          <Circle cx={76} cy={20} r={3} fill={c.hue.green.base} />
          <Path d="M32 26 L32 2 L46 14 L60 -6 L74 14 L88 2 L88 26 Z" fill="none" {...line} />
        </G>
      );
    default:
      return null;
  }
}

export function EyewearArt({ id, c }: { id: string; c: Colors }) {
  const ink = c.mascot.outline;
  const white = c.mascot.shine;
  switch (id) {
    case 'eyes-shades':
      return (
        <G>
          <Path d="M32 58 L20 54 M88 58 L100 54" stroke={ink} strokeWidth={3} strokeLinecap="round" />
          <Rect x={31} y={54} width={29} height={20} rx={7} fill={ink} />
          <Rect x={62} y={54} width={29} height={20} rx={7} fill={ink} />
          <Path d="M58 60 Q61 57 64 60" stroke={ink} strokeWidth={3} fill="none" />
          <Path d="M37 59 L45 59 M68 59 L76 59" stroke={white} strokeWidth={2.5} strokeLinecap="round" />
        </G>
      );
    case 'eyes-nerd':
      return (
        <G>
          <Path d="M33 62 L20 58 M87 62 L100 58" stroke={ink} strokeWidth={3} strokeLinecap="round" />
          <Circle cx={46} cy={64} r={13} fill="none" stroke={ink} strokeWidth={4} />
          <Circle cx={74} cy={64} r={13} fill="none" stroke={ink} strokeWidth={4} />
          <Path d="M58 62 Q60 59 62 62" stroke={ink} strokeWidth={4} fill="none" />
        </G>
      );
    case 'eyes-hearts':
      return (
        <G>
          <Path d="M58 62 Q60 59 62 62" stroke={ink} strokeWidth={3} fill="none" />
          {[46, 74].map((x) => (
            <Path
              key={x}
              d={`M${x} 76 C${x - 18} 64 ${x - 12} 50 ${x} 58 C${x + 12} 50 ${x + 18} 64 ${x} 76 Z`}
              fill={c.hue.red.base}
              stroke={ink}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
          ))}
          <Path d="M38 60 Q40 57 43 58 M66 60 Q68 57 71 58" stroke={white} strokeWidth={2} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'eyes-stars':
      return (
        <G>
          <Path d="M58 62 Q60 59 62 62" stroke={ink} strokeWidth={3} fill="none" />
          {[46, 74].map((x) => (
            <Path
              key={x}
              d={`M${x} 50 L${x + 4.5} 59 L${x + 14} 60 L${x + 7} 66.5 L${x + 9} 76 L${x} 71 L${x - 9} 76 L${x - 7} 66.5 L${x - 14} 60 L${x - 4.5} 59 Z`}
              fill={c.hue.yellow.base}
              stroke={ink}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
          ))}
        </G>
      );
    case 'eyes-monocle':
      return (
        <G>
          <Circle cx={74} cy={64} r={14} fill="none" stroke={c.hue.yellow.depth} strokeWidth={3.5} />
          <Path d="M86 70 Q94 84 88 98" stroke={c.hue.yellow.depth} strokeWidth={2} fill="none" strokeDasharray="2 3" />
        </G>
      );
    default:
      return null;
  }
}

export function NeckArt({ id, c }: { id: string; c: Colors }) {
  const ink = c.mascot.outline;
  const white = c.mascot.shine;
  const line = { stroke: ink, strokeWidth: 2.5, strokeLinejoin: 'round' as const };
  switch (id) {
    case 'neck-bowtie':
      return (
        <G>
          <Path d="M60 92 L44 83 L44 101 Z" fill={c.hue.red.base} {...line} />
          <Path d="M60 92 L76 83 L76 101 Z" fill={c.hue.red.base} {...line} />
          <Circle cx={60} cy={92} r={4.5} fill={c.hue.red.depth} {...line} />
        </G>
      );
    case 'neck-bandana':
      return (
        <G>
          <Path d="M24 84 H96 L60 106 Z" fill={c.hue.blue.base} {...line} />
          <Circle cx={48} cy={89} r={2} fill={white} />
          <Circle cx={60} cy={95} r={2} fill={white} />
          <Circle cx={72} cy={89} r={2} fill={white} />
          <Circle cx={60} cy={87} r={2} fill={white} />
        </G>
      );
    case 'neck-scarf':
      return (
        <G>
          <Rect x={22} y={84} width={76} height={12} rx={5} fill={c.hue.red.base} {...line} />
          <Path d="M36 84 V96 M52 84 V96 M68 84 V96" stroke={white} strokeWidth={4} />
          <Path d="M78 92 L82 118 L94 116 L88 92 Z" fill={c.hue.red.base} {...line} />
          <Path d="M83 102 L91 101" stroke={white} strokeWidth={3} />
        </G>
      );
    case 'neck-medal':
      return (
        <G>
          <Path d="M46 82 L56 102" stroke={c.hue.blue.base} strokeWidth={6} strokeLinecap="round" />
          <Path d="M74 82 L64 102" stroke={c.hue.red.base} strokeWidth={6} strokeLinecap="round" />
          <Circle cx={60} cy={106} r={9} fill={c.hue.yellow.base} {...line} />
          <Path d="M60 101 L61.8 104.6 L65.8 105 L62.8 107.6 L63.6 111.5 L60 109.5 L56.4 111.5 L57.2 107.6 L54.2 105 L58.2 104.6 Z" fill={c.hue.yellow.depth} />
        </G>
      );
    default:
      return null;
  }
}
