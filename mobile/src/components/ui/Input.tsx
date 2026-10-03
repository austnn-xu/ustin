import type { LucideIcon } from 'lucide-react-native';
import { Eye, EyeOff, X } from 'lucide-react-native';
import { forwardRef, useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { makeStyles, useTheme } from '@/theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export type InputProps = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  label?: string;
  hint?: string;
  /** Inline error. Replaces the hint and turns the field red. */
  error?: string;
  icon?: LucideIcon;
  /** Shows a clear button while the field has text. */
  clearable?: boolean;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, hint, error, icon, clearable, secureTextEntry, onFocus, onBlur, value, onChangeText, editable = true, ...rest },
  ref,
) {
  const t = useTheme();
  const styles = useStyles();
  const [revealed, setRevealed] = useState(false);
  const focus = useSharedValue(0);

  const frame = useAnimatedStyle(() => ({
    borderColor: error
      ? t.colors.danger
      : interpolateColor(focus.value, [0, 1], [t.colors.border, t.colors.text]),
  }));

  const showClear = clearable && !!value && editable;

  return (
    <View style={styles.root}>
      {label && (
        <Text variant="callout" color="textSecondary">
          {label}
        </Text>
      )}
      <Animated.View style={[styles.field, !editable && styles.readOnly, frame]}>
        {icon && <Icon icon={icon} color="textTertiary" />}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          secureTextEntry={secureTextEntry && !revealed}
          placeholderTextColor={t.colors.textTertiary}
          selectionColor={t.colors.accent}
          cursorColor={t.colors.accent}
          keyboardAppearance={t.isDark ? 'dark' : 'light'}
          onFocus={(e) => {
            focus.value = withSpring(1, t.motion.spring.standard);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            focus.value = withSpring(0, t.motion.spring.standard);
            onBlur?.(e);
          }}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          style={styles.input}
          {...rest}
        />
        {showClear && (
          <PressableScale
            onPress={() => onChangeText?.('')}
            accessibilityLabel="Clear"
            hitSlop={t.space[2]}
          >
            <Icon icon={X} size="sm" color="textTertiary" />
          </PressableScale>
        )}
        {secureTextEntry && (
          <PressableScale
            onPress={() => setRevealed((r) => !r)}
            haptic="selection"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            hitSlop={t.space[2]}
          >
            <Icon icon={revealed ? EyeOff : Eye} color="textTertiary" />
          </PressableScale>
        )}
      </Animated.View>
      {(error || hint) && (
        <Text variant="caption" color={error ? 'danger' : 'textTertiary'}>
          {error ?? hint}
        </Text>
      )}
    </View>
  );
});

const useStyles = makeStyles((t) => ({
  root: { gap: t.space[2] },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space[3],
    height: t.layout.control.lg,
    paddingHorizontal: t.space[4],
    borderRadius: t.radius.md,
    borderWidth: 1,
    backgroundColor: t.colors.surface,
  },
  readOnly: { backgroundColor: t.colors.fill },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    ...t.type.body,
    color: t.colors.text,
    // Web renders a focus outline on top of our own focus border.
    outlineStyle: 'none' as never,
  },
}));
