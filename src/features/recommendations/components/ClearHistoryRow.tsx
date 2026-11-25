import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Banner } from '@/components/ui/Banner';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';
import { ListRow } from '@/components/ui/ListRow';
import { useClearHistory } from '@/features/recommendations/hooks';
import { es } from '@/i18n/es-MX';
import { spacing } from '@/theme';

const t = es.recommendations.clear;

/**
 * Fila del Perfil «Borrar historial de recomendaciones» (`renderExtraRows` de 003, spec 015 §7.2,
 * RF-04): pide confirmación en una hoja inferior y, al terminar, avisa «Historial borrado».
 */
export function ClearHistoryRow() {
  const clear = useClearHistory();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  const confirm = async () => {
    setFailed(false);
    try {
      await clear.mutateAsync();
      setDone(true);
    } catch {
      setFailed(true);
    }
    setOpen(false);
  };

  return (
    <>
      <ListRow
        title={t.row}
        leading={<IconBadge icon="trash" />}
        onPress={() => {
          setDone(false);
          setFailed(false);
          setOpen(true);
        }}
      />
      {done ? <Banner variant="success" message={t.success} /> : null}
      {failed ? <Banner variant="danger" message={t.error} /> : null}
      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <View style={styles.sheet}>
          <IconBadge icon="trash" tone="danger" size="lg" />
          <AppText variant="heading" style={styles.centered} accessibilityRole="header">
            {t.title}
          </AppText>
          <AppText color="muted" style={styles.centered}>
            {t.body}
          </AppText>
          <View style={styles.actions}>
            <Button
              label={t.confirm}
              variant="danger"
              icon="trash"
              loading={clear.isPending}
              onPress={() => void confirm()}
            />
            <Button label={t.cancel} variant="link" onPress={() => setOpen(false)} />
          </View>
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  sheet: { alignItems: 'center', gap: spacing.smd },
  centered: { textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.sm },
});
