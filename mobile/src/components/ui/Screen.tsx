import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type RefreshControlProps } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { makeStyles, useTheme } from '@/theme';

export type ScreenProps = {
  children: ReactNode;
  /** Scrollable body. Most screens. */
  scroll?: boolean;
  /** Apply the standard horizontal gutter. Turn off for full-bleed content (rows pad themselves). */
  gutter?: boolean;
  /** Avoid the keyboard. Required on every screen with an input. */
  keyboard?: boolean;
  edges?: Edge[];
  /** Fixed header above the scroll area (stats bar, lesson progress). */
  header?: ReactNode;
  /** Sticky bottom area (CTA bar). Sits above the home indicator. */
  footer?: ReactNode;
  /** Draw the footer without its divider and fill, for panels that color themselves. */
  bareFooter?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** Paint the whole screen, safe areas included, with this color instead of `bg` (scene screens). Pass a token. */
  background?: string;
  /** Let the body run edge to edge on wide screens instead of the readable column (scene screens lay out their own). */
  wide?: boolean;
};

/** Every screen's root: safe areas, background, gutter, readable max width, keyboard avoidance. */
export function Screen({
  children,
  scroll = false,
  gutter = true,
  keyboard = false,
  edges = ['top', 'left', 'right'],
  header,
  footer,
  bareFooter = false,
  refreshControl,
  background,
  wide = false,
}: ScreenProps) {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const column = [wide ? styles.full : styles.column, gutter && styles.gutter];
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
    >
      <View style={[column, styles.grow]}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.fill, ...column]}>{children}</View>
  );

  const body = (
    <>
      {header && <View style={[styles.column, styles.gutter]}>{header}</View>}
      {content}
      {footer && (
        <View
          style={[
            bareFooter ? null : styles.footer,
            { paddingBottom: bareFooter ? 0 : Math.max(insets.bottom, t.space[4]) },
          ]}
        >
          <View style={[styles.column, !bareFooter && styles.gutter]}>{footer}</View>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={[styles.root, background ? { backgroundColor: background } : null]} edges={edges}>
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
  column: { width: '100%', maxWidth: t.layout.maxWidth, alignSelf: 'center' },
  full: { width: '100%' },
  grow: { flexGrow: 1 },
  gutter: { paddingHorizontal: t.layout.gutter },
  // flexGrow lets a short scrolling screen still centre its content (onboarding, celebrations) when it fits.
  scrollContent: { flexGrow: 1, paddingBottom: t.space[16] },
  footer: {
    paddingTop: t.space[4],
    backgroundColor: t.colors.bg,
    borderTopWidth: t.layout.border,
    borderTopColor: t.colors.border,
  },
}));
