import { forwardRef } from 'react';
import { Pressable, type PressableProps, type StyleProp, type View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Haptic fired on press. Primary actions use 'light'. */
  haptic?: keyof typeof haptics;
  /**
   * Set false for things that animate their own press (chunky buttons and tiles push their face down) or full-width
   * rows where scaling looks wrong. They get a plain pressable: no animation hooks, so they are cheap to mount.
   */
  scale?: boolean;
};

/** Base for everything tappable: spring press-scale + optional haptic. */
export const PressableScale = forwardRef<View, PressableScaleProps>(function PressableScale({ scale = true, ...props }, ref) {
  return scale ? <ScalingPressable ref={ref} {...props} /> : <PlainPressable ref={ref} {...props} />;
});

type Props = Omit<PressableScaleProps, 'scale'>;

const PlainPressable = forwardRef<View, Props>(function PlainPressable({ haptic, onPress, ...rest }, ref) {
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      onPress={(e) => {
        if (haptic) haptics[haptic]();
        onPress?.(e);
      }}
      {...rest}
    />
  );
});

const ScalingPressable = forwardRef<View, Props>(function ScalingPressable(
  { style, haptic, onPressIn, onPressOut, onPress, disabled, ...rest },
  ref,
) {
  const t = useTheme();
  const pressed = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressed.value }] }));

  return (
    <AnimatedPressable
      ref={ref}
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={(e) => {
        pressed.value = withSpring(t.motion.pressScale, t.motion.spring.snappy);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withSpring(1, t.motion.spring.snappy);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) haptics[haptic]();
        onPress?.(e);
      }}
      style={[style, animatedStyle]}
      {...rest}
    />
  );
});
