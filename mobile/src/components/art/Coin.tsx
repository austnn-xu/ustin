import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '@/theme';

/** A US Tin coin: gold, with the recycling arrows stamped in. Drawn in a 40×40 viewBox. */
export function Coin({ size }: { size: number }) {
  const t = useTheme();
  const gold = t.colors.hue.yellow;
  return (
    <View style={{ width: size, height: size }} aria-hidden>
      <Svg width="100%" height="100%" viewBox="0 0 40 40">
        <Circle cx={20} cy={21.5} r={17} fill={gold.depth} />
        <Circle cx={20} cy={19} r={17} fill={gold.base} />
        <Circle cx={20} cy={19} r={12.5} fill="none" stroke={gold.depth} strokeWidth={2} />
        {/* Three chasing arrows */}
        <Path
          d="M17 12.5 L20 9.5 L23 12.5 M20 9.5 Q26 12 25.5 17 M27.5 24 L25.5 28 L21.5 26.5 M25.5 28 Q19 29 15 25 M11.5 19.5 L12 15 L16 15.5 M12 15 Q11 22 15 25"
          stroke={gold.depth}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path d="M9 13 Q12 7 18 6" stroke={t.colors.shine} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}
