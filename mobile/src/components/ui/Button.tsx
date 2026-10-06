import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { makeStyles, useTheme, type HueName } from '@/theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'neutral' | 'ghost';
export type ButtonSize = 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  /**
   * Override the variant's hue, e.g. a red Continue on the wrong-answer panel. On a ghost button this colors the label
   * (there is no face to color).
   */
  hue?: HueName;
  /** Neutral (white) buttons only: color the label, e.g. to match the colored card the button sits on. */
  labelHue?: HueName;
  size?: ButtonSize;
  icon?: LucideIcon;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
};

const variantHue: Partial<Record<ButtonVariant, HueName>> = { primary: 'green', secondary: 'blue', danger: 'red' };

/**
 * The chunky 3D button: a face sitting on a darker edge. Pressing pushes the face down into the edge, which is what
 * makes every tap feel physical.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  hue: hueOverride,
  labelHue,
  size = 'lg',
  icon,
  disabled = false,
  fullWidth = false,
  accessibilityLabel,
}: ButtonProps) {
  const t = useTheme();
  const styles = useStyles();
  const depth = t.layout.depth.md;
  const pressed = useSharedValue(0);
  const face = useAnimatedStyle(() => ({ transform: [{ translateY: pressed.value * depth }] }));

  const ghost = variant === 'ghost';
  const hueName = hueOverride ?? variantHue[variant];
  // A ghost button has no face: its hue is the label's, never a fill.
  const hue = hueName && !ghost ? t.colors.hue[hueName] : null;
  const textHue = ghost ? (hueName ?? 'blue') : !hue ? labelHue : undefined;

  const faceColor = disabled ? t.colors.fillStrong : hue ? hue.base : t.colors.surface;
  const edgeColor = disabled ? t.colors.border : hue ? hue.depth : t.colors.borderStrong;
  const labelColor = disabled
    ? t.colors.textTertiary
    : hue
      ? t.colors.onColor
      : textHue
        ? t.colors.hue[textHue].text
        : t.colors.textSecondary;

  return (
    <PressableScale
      scale={false}
      onPress={onPress}
      disabled={disabled}
      haptic={variant === 'primary' || variant === 'danger' || variant === 'secondary' ? 'light' : 'selection'}
      onPressIn={() => {
        pressed.value = withSpring(1, t.motion.spring.snappy);
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, t.motion.spring.snappy);
      }}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={[styles.root, { height: t.layout.control[size] + (ghost ? 0 : depth) }, fullWidth && styles.fullWidth]}
    >
      {!ghost && <View style={[styles.edge, { top: depth, backgroundColor: edgeColor }]} />}
      <Animated.View
        style={[
          styles.face,
          { height: t.layout.control[size] },
          !ghost && { backgroundColor: faceColor },
          !ghost && !hue && !disabled && styles.neutralFace,
          !ghost && face,
        ]}
      >
        {icon && (
          <Icon
            icon={icon}
            size="md"
            color={disabled ? 'textTertiary' : hue ? 'onColor' : 'textSecondary'}
            hue={!disabled && textHue ? textHue : undefined}
            shade="text"
          />
        )}
        <Text variant="button" numberOfLines={1} style={{ color: labelColor }}>
          {label}
        </Text>
      </Animated.View>
    </PressableScale>
  );
}

const useStyles = makeStyles((t) => ({
  root: { alignSelf: 'flex-start', minWidth: t.space[20] },
  fullWidth: { alignSelf: 'stretch' },
  edge: { position: 'absolute', left: 0, right: 0, bottom: 0, borderRadius: t.radius.lg },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.space[2],
    paddingHorizontal: t.space[5],
    borderRadius: t.radius.lg,
  },
  neutralFace: { borderWidth: t.layout.border, borderColor: t.colors.border },
}));
