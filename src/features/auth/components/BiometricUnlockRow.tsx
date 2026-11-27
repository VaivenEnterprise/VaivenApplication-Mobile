import { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Banner } from '@/components/ui/Banner';
import { Divider } from '@/components/ui/Divider';
import { IconBadge } from '@/components/ui/IconBadge';
import {
  biometricsAvailable,
  confirmIdentity,
  isBiometricUnlockEnabled,
  setBiometricUnlock,
} from '@/features/auth/biometrics';
import { es } from '@/i18n/es-MX';
import { colors, sizes, spacing } from '@/theme';

const t = es.auth.biometric;

/**
 * Interruptor del Perfil «Desbloquear con huella o rostro» (spec 021-T015, RF-14), con la forma de
 * `PushToggle`. Solo aparece si el teléfono tiene biometría registrada. Activarlo exige confirmarse
 * una vez; la marca vive en el almacén seguro y se borra al cerrar sesión. Trae su propio
 * separador para que, si no aparece, el grupo del perfil no quede con una línea de sobra.
 */
export function BiometricUnlockRow() {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [hasBiometrics, on] = await Promise.all([
        biometricsAvailable(),
        isBiometricUnlockEnabled(),
      ]);
      if (!alive) return;
      setAvailable(hasBiometrics);
      setEnabled(hasBiometrics && on);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!available) return null;

  const toggle = async (next: boolean) => {
    setBusy(true);
    setFailed(false);
    if (next && !(await confirmIdentity(t.prompt, es.auth.lock.cancel))) {
      setFailed(true);
      setBusy(false);
      return;
    }
    if (await setBiometricUnlock(next)) setEnabled(next);
    else setFailed(next);
    setBusy(false);
  };

  return (
    <>
      <Divider />
      <View style={styles.root}>
        <View style={styles.row}>
          <IconBadge icon="lock" />
          <View style={styles.texts}>
            <AppText variant="bodyStrong">{t.row}</AppText>
            <AppText variant="caption" color="muted">
              {enabled ? t.on : t.off}
            </AppText>
          </View>
          <View style={styles.switch}>
            <Switch
              accessibilityLabel={t.row}
              value={enabled}
              disabled={busy}
              onValueChange={(next) => void toggle(next)}
              trackColor={{ false: colors.fieldBorder, true: colors.secondary }}
              thumbColor={colors.surface}
            />
          </View>
        </View>
        {failed ? <Banner variant="warning" message={t.failed} /> : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  row: {
    minHeight: sizes.touch.minSize + spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
  },
  texts: { flex: 1 },
  switch: {
    minWidth: sizes.touch.minSize,
    minHeight: sizes.touch.minSize,
    justifyContent: 'center',
  },
});
