import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { DiyArtKind } from '@/lib/engine';
import { useTheme } from '@/theme';

/** The inside of the tote, seen through a cut-away front. Layers are drawn into this window. */
const WINDOW = 'M70 66 H170 L165 128 Q164.5 131 161 131 H79 Q75.5 131 75 128 Z';

/**
 * One drawing per step of the build-your-own compost bin guide, drawn in a 240×160 viewBox. The tote is the compost
 * hue (brown), so it reads as the same bin as the compost outcome everywhere else.
 */
export function DiyArt({ kind, size }: { kind: DiyArtKind; size: number }) {
  const t = useTheme();
  const s = t.colors.scene;
  const bin = t.colors.hue.brown;
  const tool = t.colors.hue.slate;
  const ink = t.colors.textSecondary;

  /** A storage tote and its lid, front on. `inside` swaps the front for a cut-away showing the layers. */
  const tote = (opts: { holes?: boolean; inside?: ReactNode; lid?: 'on' | 'lifted' } = {}) => (
    <G>
      <Path d="M60 58 H180 L173 132 Q172 138 166 138 H74 Q68 138 67 132 Z" fill={bin.base} />
      {opts.inside ? (
        <G>
          <Path d={WINDOW} fill={bin.subtle} />
          <G clipPath="url(#window)">{opts.inside}</G>
          <Path d={WINDOW} fill="none" stroke={t.colors.shine} strokeWidth={2} strokeDasharray="5 4" />
        </G>
      ) : (
        <Path d="M78 66 L80 128 M162 66 L160 128" stroke={t.colors.shine} strokeWidth={4} strokeLinecap="round" />
      )}
      {opts.holes &&
        [72, 90, 108, 124].flatMap((y) =>
          [82, 98, 114, 130, 146, 158].map((x) => <Circle key={`${x}:${y}`} cx={x} cy={y} r={2.6} fill={bin.depth} />),
        )}
      {opts.lid !== 'lifted' && (
        <G>
          <Rect x={52} y={46} width={136} height={14} rx={5} fill={bin.depth} />
          <Rect x={55} y={48} width={130} height={4} rx={2} fill={t.colors.shine} />
          {opts.holes && [72, 92, 112, 132, 152, 168].map((x) => <Circle key={x} cx={x} cy={55} r={2} fill={bin.base} />)}
        </G>
      )}
    </G>
  );

  const shadow = <Ellipse cx={120} cy={142} rx={72} ry={6} fill={s.shadow} />;

  /** Dry browns: a band of dry-leaf tan with pale scraps of cardboard in it. */
  const dry = t.colors.hue.orange.depth;
  const browns = (top: number, bottom: number) => (
    <G>
      <Rect x={60} y={top} width={120} height={bottom - top} fill={dry} />
      {[78, 98, 120, 142, 160].map((x, i) => (
        <Rect key={x} x={x} y={top + 3 + (i % 2) * 5} width={10} height={4} rx={1} fill={t.colors.shine} />
      ))}
    </G>
  );

  /** Wet greens: leafy scraps, a peel, eggshell and coffee grounds. */
  const greens = (top: number, bottom: number) => {
    const mid = (top + bottom) / 2;
    return (
      <G>
        <Rect x={60} y={top + 3} width={120} height={bottom - top - 3} fill={s.leafDark} />
        {[80, 100, 122, 144, 162].map((x, i) => (
          <Circle key={x} cx={x} cy={mid - (i % 2) * 2} r={6} fill={s.leaf} />
        ))}
        <Path d={`M106 ${mid + 2} Q114 ${mid - 8} 124 ${mid + 1}`} stroke={t.colors.hue.yellow.base} strokeWidth={4} fill="none" strokeLinecap="round" />
        <Path d={`M138 ${mid + 3} l5 -6 l5 6 Z`} fill={s.kerb} />
        {[88, 92, 152, 156].map((x, i) => (
          <Circle key={x} cx={x} cy={mid + 3 + (i % 2)} r={1.4} fill={bin.depth} />
        ))}
      </G>
    );
  };

  const drawings: Record<DiyArtKind, ReactNode> = {
    tote: (
      <G>
        {shadow}
        {tote({ lid: 'lifted' })}
        <G transform="rotate(-8 120 30)">
          <Rect x={52} y={22} width={136} height={14} rx={5} fill={bin.depth} />
          <Rect x={55} y={24} width={130} height={4} rx={2} fill={t.colors.shine} />
        </G>
        <Path d="M120 38 V46 M114 41 L120 46 L126 41" stroke={ink} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </G>
    ),
    holes: (
      <G>
        <G transform="translate(-22 0)">
          {shadow}
          {tote({ holes: true })}
        </G>
        {/* A drill, nose in at the last hole. */}
        <Path d="M148 90 H164" stroke={tool.depth} strokeWidth={3} strokeLinecap="round" />
        <Rect x={163} y={84} width={10} height={12} rx={2} fill={tool.depth} />
        <Rect x={172} y={78} width={52} height={24} rx={8} fill={tool.base} />
        <Rect x={196} y={98} width={16} height={36} rx={5} fill={tool.base} />
        <Rect x={192} y={130} width={24} height={10} rx={3} fill={tool.depth} />
        <Rect x={178} y={82} width={36} height={4} rx={2} fill={t.colors.shine} />
      </G>
    ),
    raise: (
      <G>
        {/* A tree throwing part shade over the bin. */}
        <Ellipse cx={150} cy={146} rx={86} ry={7} fill={s.shadow} />
        <Rect x={206} y={50} width={10} height={96} rx={4} fill={s.trunk} />
        <Circle cx={200} cy={40} r={30} fill={s.leaf} />
        <Circle cx={222} cy={58} r={20} fill={s.leafDark} />
        <G transform="translate(-24 -16) scale(1 0.98)">{tote({ holes: true })}</G>
        <Rect x={44} y={138} width={116} height={6} rx={3} fill={s.rock} />
        <Rect x={56} y={122} width={30} height={16} rx={2} fill={s.cone} />
        <Rect x={118} y={122} width={30} height={16} rx={2} fill={s.cone} />
        <Path d="M56 130 H86 M71 122 V130 M118 130 H148 M133 122 V130" stroke={t.colors.shine} strokeWidth={2} />
      </G>
    ),
    browns: (
      <G>
        {shadow}
        {tote({ lid: 'lifted', inside: browns(112, 140) })}
        {/* Shredded cardboard dropping in. */}
        {[
          [96, 30, -20],
          [118, 18, 15],
          [140, 34, -8],
          [110, 44, 30],
        ].map(([x, y, r]) => (
          <Rect key={`${x}`} x={x} y={y} width={14} height={6} rx={1} fill={dry} transform={`rotate(${r} ${x! + 7} ${y! + 3})`} />
        ))}
      </G>
    ),
    greens: (
      <G>
        {shadow}
        {tote({ lid: 'lifted', inside: <G>{browns(116, 140)}{greens(98, 116)}</G> })}
        {/* A peel and an apple core on their way in. */}
        <Path d="M104 30 Q114 14 126 28" stroke={t.colors.hue.yellow.base} strokeWidth={6} fill="none" strokeLinecap="round" />
        <Circle cx={142} cy={42} r={8} fill={t.colors.hue.red.base} />
        <Path d="M142 34 V28" stroke={s.trunk} strokeWidth={2} strokeLinecap="round" />
      </G>
    ),
    layers: (
      <G>
        {shadow}
        {tote({ lid: 'lifted', inside: <G>{browns(122, 140)}{greens(108, 122)}{browns(94, 108)}{greens(80, 94)}{browns(66, 80)}</G> })}
        {/* Brackets calling out brown, green, brown. */}
        <Path d="M184 66 h6 v14 h-6 M184 80 h6 v14 h-6 M184 94 h6 v14 h-6" stroke={ink} strokeWidth={2} fill="none" strokeLinejoin="round" />
        <Circle cx={200} cy={73} r={4} fill={dry} />
        <Circle cx={200} cy={87} r={4} fill={s.leaf} />
        <Circle cx={200} cy={101} r={4} fill={dry} />
      </G>
    ),
    roll: (
      <G>
        <Ellipse cx={120} cy={146} rx={66} ry={6} fill={s.shadow} />
        <G transform="rotate(-14 120 96)">{tote({ holes: true })}</G>
        {/* Round arrows: roll it to let the air in. */}
        <Path d="M40 104 A80 60 0 0 1 72 34" stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />
        <Path d="M62 32 L74 32 L70 44" stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M200 88 A80 60 0 0 1 168 150" stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />
        <Path d="M178 152 L166 152 L170 140" stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* A water drop: damp, not wet. */}
        <Path d="M206 20 C206 20 194 36 194 44 A12 12 0 0 0 218 44 C218 36 206 20 206 20 Z" fill={t.colors.hue.blue.base} />
        <Path d="M201 44 A5 5 0 0 0 206 49" stroke={t.colors.shine} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      </G>
    ),
    harvest: (
      <G>
        <Ellipse cx={104} cy={142} rx={66} ry={6} fill={s.shadow} />
        <G transform="translate(-16 0)">
          {tote({ lid: 'lifted', inside: <G>{greens(78, 96)}{browns(96, 112)}<Rect x={60} y={112} width={120} height={30} fill={bin.depth} /></G> })}
        </G>
        {/* A heap of finished compost with a seedling in it, and the trowel that scooped it. */}
        <Path d="M164 142 Q190 104 222 142 Z" fill={bin.depth} />
        {[180, 194, 206].map((x, i) => (
          <Circle key={x} cx={x} cy={132 - (i % 2) * 6} r={1.8} fill={bin.base} />
        ))}
        <Path d="M193 118 V100" stroke={s.leafDark} strokeWidth={3} strokeLinecap="round" />
        <Path d="M193 106 Q182 94 176 102 Q184 110 193 106 Z M193 102 Q204 88 212 96 Q204 106 193 102 Z" fill={s.leaf} />
        <Path d="M222 92 L236 70" stroke={s.trunk} strokeWidth={6} strokeLinecap="round" />
        <Path d="M214 92 L226 96 L220 116 Q214 118 210 112 Z" fill={tool.base} />
      </G>
    ),
  };

  return (
    <View style={{ width: size, height: size * (160 / 240) }} aria-hidden>
      <Svg width="100%" height="100%" viewBox="0 0 240 160">
        <Defs>
          <ClipPath id="window">
            <Path d={WINDOW} />
          </ClipPath>
        </Defs>
        {drawings[kind]}
      </Svg>
    </View>
  );
}
