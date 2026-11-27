import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';
import { Screen } from '@/components/ui/Screen';
import { useSensitiveScreen } from '@/features/auth/screenCapture';
import { es } from '@/i18n/es-MX';
import { spacing } from '@/theme';

const t = es.auth.lock;

type LockScreenProps = {
  /** Pide la biometría; `true` si la persona se confirmó (la sesión sigue restaurándose). */
  onUnlock: () => Promise<boolean>;
  onSignOut: () => void;
};

/**
 * Sesión bloqueada por inactividad con el desbloqueo con biometría activado (spec 021-T015, RF-14).
 * Misma composición que `SuspendedScreen`. Al aparecer pide la biometría una vez; si la persona
 * cancela o falla, puede reintentar o cerrar sesión. La app de debajo está desmontada.
 */
export function LockScreen({ onUnlock, onSignOut }: LockScreenProps) {
  useSensitiveScreen();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);

  const unlock = async () => {
    setBusy(true);
    setFailed(false);
    const ok = await onUnlock();
    if (!mounted.current) return;
    setBusy(false);
    setFailed(!ok);
  };

  const unlockRef = useRef(unlock);
  useEffect(() => {
    mounted.current = true;
    void unlockRef.current();
    return () => {
      mounted.current = false;
    };
  }, []);

  return (
    <Screen background="auth" scroll={false} contentStyle={styles.center}>
      <IconBadge icon="lock" tone="primary" size="lg" />
      <AppText variant="title" accessibilityRole="header" style={styles.centered}>
        {t.title}
      </AppText>
      <AppText color="muted" style={styles.centered}>
        {t.description}
      </AppText>
      {failed ? <Banner variant="warning" message={t.failed} /> : null}
      <Button label={t.unlock} loading={busy} onPress={() => void unlock()} />
      <Button label={t.signOut} variant="link" disabled={busy} onPress={onSignOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'stretch', justifyContent: 'center', gap: spacing.md },
  centered: { textAlign: 'center' },
});
