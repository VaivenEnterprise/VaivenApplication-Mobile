import { useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  type GestureResponderEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { es } from '@/i18n/es-MX';
import { colors, motion, radius, sizes, spacing } from '@/theme';
import { AppIcon } from './AppIcon';
import { AppText } from './AppText';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Pie fijo (p. ej. el botón principal). */
  footer?: ReactNode;
};

/**
 * Hoja inferior sobre un velo. Se cierra con «X», tocando fuera, con el botón atrás de Android
 * o deslizando hacia abajo el asa o el encabezado.
 */
export function BottomSheet({ visible, onClose, title, children, footer }: BottomSheetProps) {
  const [offset] = useState(() => new Animated.Value(0));
  const startY = useRef<number | null>(null);

  const onTouchStart = (event: GestureResponderEvent) => {
    startY.current = event.nativeEvent.pageY;
  };
  const onTouchMove = (event: GestureResponderEvent) => {
    if (startY.current === null) return;
    offset.setValue(Math.max(0, event.nativeEvent.pageY - startY.current));
  };
  const onTouchEnd = (event: GestureResponderEvent) => {
    const start = startY.current;
    startY.current = null;
    offset.setValue(0);
    if (start !== null && event.nativeEvent.pageY - start > motion.sheetDismissDistance) onClose();
  };

  return (
    <Modal
      testID="bottom-sheet"
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={es.ui.close}
          onPress={onClose}
          style={styles.scrim}
        />
        <Animated.View
          accessibilityViewIsModal
          style={[styles.sheet, { transform: [{ translateY: offset }] }]}
        >
          <View
            testID="sheet-grab"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.title}>
                {title === undefined ? null : (
                  <AppText variant="heading" accessibilityRole="header">
                    {title}
                  </AppText>
                )}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={es.ui.close}
                onPress={onClose}
                style={styles.close}
              >
                <AppIcon name="close" />
              </Pressable>
            </View>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            {children}
          </ScrollView>
          {footer === undefined ? null : <View style={styles.footer}>{footer}</View>}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: colors.scrim },
  sheet: {
    maxHeight: sizes.sheetMaxHeight,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  handle: {
    alignSelf: 'center',
    marginTop: spacing.smd,
    width: sizes.sheetHandle.width,
    height: sizes.sheetHandle.height,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.gutter,
    paddingRight: spacing.sm,
  },
  title: { flex: 1 },
  close: {
    minWidth: sizes.touch.minSize,
    minHeight: sizes.touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: spacing.gutter, paddingBottom: spacing.md, gap: spacing.md },
  footer: { padding: spacing.gutter },
});
