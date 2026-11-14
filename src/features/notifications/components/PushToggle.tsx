import { Linking, StyleSheet, Switch, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';
import { usePush, type PushStatus } from '@/features/notifications/usePushRegistration';
import { es } from '@/i18n/es-MX';
import { colors, sizes, spacing } from '@/theme';

const t = es.notifications.push;

function subtitle(status: PushStatus | null): string {
  switch (status) {
    case 'on':
      return t.on;
    case 'unavailable':
      return t.unavailable;
    case 'denied':
      return t.denied;
    default:
      return t.off;
  }
}

/**
 * Interruptor «Avisos en el teléfono» (RF-09, spec 011 §7.1): registra o elimina el token. Con el
 * permiso negado indica «Desactivados» y ofrece abrir los ajustes (CA-03); en emulador queda
 * deshabilitado.
 */
export function PushToggle() {
  const { status, enable, disable, busy, failed } = usePush();
  const on = status === 'on';
  const denied = status === 'denied';
  const disabled = status === null || status === 'unavailable' || busy;

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <IconBadge icon="bell" />
        <View style={styles.texts}>
          <AppText variant="bodyStrong">{t.toggleTitle}</AppText>
          <AppText variant="caption" color="muted">
            {subtitle(status)}
          </AppText>
        </View>
        <View style={styles.switch}>
          <Switch
            accessibilityLabel={t.toggleA11y}
            value={on}
            disabled={disabled}
            onValueChange={(next) => void (next ? enable() : disable())}
            trackColor={{ false: colors.fieldBorder, true: colors.secondary }}
            thumbColor={colors.surface}
          />
        </View>
      </View>
      {denied ? (
        <Button label={t.openSettings} variant="link" onPress={() => void Linking.openSettings()} />
      ) : null}
      {failed && !denied ? <Banner variant="warning" message={t.enableFailed} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  row: {
    minHeight: sizes.touch.minSize + spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
    paddingHorizontal: spacing.md,
  },
  texts: { flex: 1 },
  switch: {
    minWidth: sizes.touch.minSize,
    minHeight: sizes.touch.minSize,
    justifyContent: 'center',
  },
});
