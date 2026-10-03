import type { LucideIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { makeStyles, useTheme, type ColorTokens } from '@/theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'leading' | 'trailing';
  /** Pending server action: keeps the button's size, swaps label for a quiet pulse, blocks presses. */
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
};

const fg: Record<ButtonVariant, keyof ColorTokens> = {
  primary: 'onAccent',
  secondary: 'text',
  outline: 'text',
  ghost: 'text',
  destructive: 'onDanger',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'leading',
  loading = false,
  disabled = false,
  fullWidth = false,
  accessibilityLabel,
}: ButtonProps) {
  const styles = useStyles();
  const inactive = disabled || loading;
  const textColor = fg[variant] as 'text' | 'onAccent' | 'onDanger';
  const iconNode = icon ? <Icon icon={icon} size={size === 'sm' ? 'sm' : 'md'} color={textColor} /> : null;

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      haptic={variant === 'primary' || variant === 'destructive' ? 'light' : undefined}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.base,
        styles[size],
        styles[variant],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.content, loading && styles.hidden]}>
        {iconPosition === 'leading' && iconNode}
        <Text variant={size === 'sm' ? 'callout' : 'bodyStrong'} color={textColor} numberOfLines={1}>
          {label}
        </Text>
        {iconPosition === 'trailing' && iconNode}
      </View>
      {loading && <PendingDots color={textColor} />}
    </PressableScale>
  );
}

function PendingDots({ color }: { color: keyof ColorTokens }) {
  const styles = useStyles();
  return (
    <View style={styles.dots} pointerEvents="none">
      {[0, 1, 2].map((i) => (
        <Dot key={i} index={i} color={color} />
      ))}
    </View>
  );
}

function Dot({ index, color }: { index: number; color: keyof ColorTokens }) {
  const t = useTheme();
  const styles = useStyles();
  const o = useSharedValue(0.3);
  useEffect(() => {
    const half = t.motion.pulseDuration / 2;
    o.value = withDelay(
      index * (half / 3),
      withRepeat(withSequence(withTiming(1, { duration: half }), withTiming(0.3, { duration: half })), -1),
    );
  }, [index, o, t.motion.pulseDuration]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.dot, { backgroundColor: t.colors[color] }, style]} />;
}

const useStyles = makeStyles((t) => ({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderRadius: t.radius.md,
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: t.space[2] },
  hidden: { opacity: 0 },
  sm: { height: t.layout.control.sm, paddingHorizontal: t.space[3], borderRadius: t.radius.sm },
  md: { height: t.layout.control.md, paddingHorizontal: t.space[4] },
  lg: { height: t.layout.control.lg, paddingHorizontal: t.space[6] },
  primary: { backgroundColor: t.colors.accent },
  secondary: { backgroundColor: t.colors.fill },
  outline: { borderWidth: 1, borderColor: t.colors.borderStrong },
  ghost: { backgroundColor: 'transparent' },
  destructive: { backgroundColor: t.colors.danger },
  disabled: { opacity: t.opacity.disabled },
  dots: { position: 'absolute', flexDirection: 'row', gap: t.space[1] },
  dot: { width: t.layout.dot, height: t.layout.dot, borderRadius: t.radius.pill },
}));
