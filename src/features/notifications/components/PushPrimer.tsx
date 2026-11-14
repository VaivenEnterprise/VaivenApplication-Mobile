import { StyleSheet, View } from 'react-native';
import { AppIcon, type IconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';
import { es } from '@/i18n/es-MX';
import { spacing } from '@/theme';

const t = es.notifications.primer;

const BENEFITS: readonly { icon: IconName; label: string }[] = [
  { icon: 'hand', label: t.requests },
  { icon: 'chat', label: t.messages },
  { icon: 'cube', label: t.deliveries },
];

type PushPrimerProps = {
  visible: boolean;
  loading?: boolean;
  onEnable: () => void;
  onLater: () => void;
};

/** Pantalla previa al permiso de notificaciones (spec 011 §7.2): el beneficio en tres palabras. */
export function PushPrimer({ visible, loading = false, onEnable, onLater }: PushPrimerProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onLater}
      footer={
        <View style={styles.footer}>
          <Button label={t.enable} loading={loading} onPress={onEnable} />
          <Button label={t.later} variant="link" onPress={onLater} />
        </View>
      }
    >
      <View style={styles.body}>
        <IconBadge icon="bell" size="lg" />
        <AppText variant="heading" accessibilityRole="header" style={styles.centered}>
          {t.title}
        </AppText>
        <View style={styles.list}>
          {BENEFITS.map((benefit) => (
            <View key={benefit.label} style={styles.item}>
              <AppIcon name={benefit.icon} color="primaryInk" />
              <AppText variant="bodyStrong">{benefit.label}</AppText>
            </View>
          ))}
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', gap: spacing.md, paddingBottom: spacing.md },
  centered: { textAlign: 'center' },
  list: { alignSelf: 'stretch', gap: spacing.smd },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd },
  footer: { gap: spacing.sm },
});
