import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, type ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '@/lib/haptics';
import { makeStyles, useTheme } from '@/theme';
import { Text } from './Text';

export type SheetRef = BottomSheetModal;

export type SheetProps = {
  children: ReactNode;
  title?: string;
  /** e.g. ['40%', '90%']. Omit to size to content. */
  snapPoints?: (string | number)[];
  onDismiss?: () => void;
  /** Rendered in the sheet body instead of a BottomSheetView — pass a BottomSheetFlashList/ScrollView. */
  scrollable?: boolean;
};

/**
 * Modal bottom sheet with snap points, drag-to-dismiss, scrim backdrop and spring motion.
 * Open with `ref.current?.present()`, close with `ref.current?.dismiss()`.
 */
export const Sheet = forwardRef<SheetRef, SheetProps>(function Sheet(
  { children, title, snapPoints, onDismiss, scrollable },
  ref,
) {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={1} style={[props.style, styles.backdrop]} />
    ),
    [styles.backdrop],
  );

  const header = title ? (
    <View style={styles.header}>
      <Text variant="heading">{title}</Text>
    </View>
  ) : null;

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={!snapPoints}
      enablePanDownToClose
      onDismiss={onDismiss}
      onChange={(index) => index >= 0 && haptics.selection()}
      animationConfigs={t.motion.spring.gentle}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      {scrollable ? (
        <>
          {header}
          {children}
        </>
      ) : (
        <BottomSheetView style={[styles.body, { paddingBottom: Math.max(insets.bottom, t.space[4]) + t.space[2] }]}>
          {header}
          {children}
        </BottomSheetView>
      )}
    </BottomSheetModal>
  );
});

const useStyles = makeStyles((t) => ({
  backdrop: { backgroundColor: t.colors.scrim },
  background: {
    backgroundColor: t.colors.surfaceRaised,
    borderTopLeftRadius: t.radius.xl,
    borderTopRightRadius: t.radius.xl,
  },
  handle: { backgroundColor: t.colors.borderStrong, width: t.space[10], height: t.space[1] },
  header: { paddingHorizontal: t.layout.gutter, paddingTop: t.space[2], paddingBottom: t.space[3] },
  body: { gap: t.space[4] },
}));
