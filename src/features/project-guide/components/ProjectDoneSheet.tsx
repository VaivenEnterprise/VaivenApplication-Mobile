import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';
import { es } from '@/i18n/es-MX';
import { spacing } from '@/theme';

const t = es.bookings.guide;

type ProjectDoneSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Lleva a Actividad para devolver lo que se pidió. */
  onReturnTools: () => void;
};

/** Hoja de cierre (spec 007 §7.1, RF-15): invita a devolver lo pedido. */
export function ProjectDoneSheet({ visible, onClose, onReturnTools }: ProjectDoneSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <Button label={t.returnTools} onPress={onReturnTools} />
          <Button label={t.close} variant="link" onPress={onClose} />
        </View>
      }
    >
      <View style={styles.body}>
        <IconBadge icon="success" tone="secondary" size="lg" />
        <AppText variant="heading" accessibilityRole="header" style={styles.centered}>
          {t.doneTitle}
        </AppText>
        <AppText color="muted" style={styles.centered}>
          {t.doneBody}
        </AppText>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', gap: spacing.md },
  centered: { textAlign: 'center' },
  footer: { gap: spacing.sm },
});
