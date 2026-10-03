import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type RefreshControlProps } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { makeStyles, useTheme } from '@/theme';

export type ScreenProps = {
  children: ReactNode;
  /** Scrollable body. Most screens. */
  scroll?: boolean;
  /** Apply the standard horizontal gutter. Turn off for full-bleed lists (ListRow pads itself). */
  gutter?: boolean;
  /** Avoid the keyboard. Required on every screen with an input. */
  keyboard?: boolean;
  edges?: Edge[];
  /** Sticky bottom area (CTA bar). Sits above the home indicator. */
  footer?: ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
};

/** Every screen's root: safe areas, background, gutter, keyboard avoidance. */
export function Screen({
  children,
  scroll = false,
  gutter = true,
  keyboard = false,
  edges = ['top', 'left', 'right'],
  footer,
  refreshControl,
}: ScreenProps) {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, gutter && styles.gutter]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, gutter && styles.gutter]}>{children}</View>
  );

  const body = (
    <>
      {content}
      {footer && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, t.space[3]) }]}>{footer}</View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {keyboard ? (
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  fill: { flex: 1 },
  gutter: { paddingHorizontal: t.layout.gutter },
  scrollContent: { paddingBottom: t.space[16] },
  footer: {
    paddingHorizontal: t.layout.gutter,
    paddingTop: t.space[3],
    backgroundColor: t.colors.surfaceRaised,
    borderTopWidth: t.layout.hairline,
    borderTopColor: t.colors.border,
  },
}));
