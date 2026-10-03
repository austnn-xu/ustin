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
  /** Set false for full-width rows where scaling looks wrong; they get a fill instead. */
  scale?: boolean;
};

/** Base for everything tappable: spring press-scale + optional haptic. */
export const PressableScale = forwardRef<View, PressableScaleProps>(function PressableScale(
  { style, haptic, scale = true, onPressIn, onPressOut, onPress, disabled, ...rest },
  ref,
) {
  const t = useTheme();
  const pressed = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale ? pressed.value : 1 }],
  }));

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
