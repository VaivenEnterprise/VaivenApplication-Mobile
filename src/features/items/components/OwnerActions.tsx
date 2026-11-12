import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';
import { useDeleteItem, usePauseItem, useResumeItem } from '@/features/items/hooks';
import type { Item } from '@/features/items/types';
import { es } from '@/i18n/es-MX';
import { ApiError, messageForCode } from '@/lib/api/errors';
import { routes } from '@/lib/routes';
import { spacing } from '@/theme';

const t = es.items.owner;

type OwnerAction = 'pause' | 'resume' | 'delete';

/** Mensaje claro para 403 y 409 (RF-07); el resto usa el texto genérico del código. */
export function ownerErrorMessage(error: unknown, action: OwnerAction): string {
  if (!(error instanceof ApiError)) return es.errors.unexpected;
  if (error.code === 'forbidden') return t.forbidden;
  if (error.code === 'conflict') {
    return action === 'delete' ? t.conflictDelete : t.conflictBlocked;
  }
  return messageForCode(error.code);
}

type OwnerActionBarProps = {
  item: Item;
  /** Recibe el mensaje de error de una acción, o `null` al reintentar. */
  onProblem: (message: string | null) => void;
};

/** Barra del dueño (spec 005 §7.3): «Editar» y «Pausar» o «Reanudar». Un objeto bloqueado no se toca. */
export function OwnerActionBar({ item, onProblem }: OwnerActionBarProps) {
  const router = useRouter();
  const pause = usePauseItem(item.id);
  const resume = useResumeItem(item.id);
  const blocked = item.status === 'blocked';
  const paused = item.status === 'paused';
  const toggling = pause.isPending || resume.isPending;

  const toggle = async () => {
    onProblem(null);
    const action: OwnerAction = paused ? 'resume' : 'pause';
    try {
      await (paused ? resume : pause).mutateAsync();
    } catch (error) {
      onProblem(ownerErrorMessage(error, action));
    }
  };

  return (
    <View style={styles.bar}>
      <View style={styles.grow}>
        <Button
          label={t.edit}
          variant="outline"
          icon="edit"
          disabled={blocked}
          onPress={() => router.push(routes.editItem(item.id))}
        />
      </View>
      <View style={styles.grow}>
        <Button
          label={paused ? t.resume : t.pause}
          icon={paused ? 'play' : 'pause'}
          loading={toggling}
          disabled={blocked}
          onPress={() => void toggle()}
        />
      </View>
    </View>
  );
}

type DeleteItemSheetProps = {
  item: Item;
  visible: boolean;
  onClose: () => void;
  onProblem: (message: string | null) => void;
};

/** Confirmación de eliminar en una hoja inferior: nombra el objeto y usa el verbo «Eliminar». */
export function DeleteItemSheet({ item, visible, onClose, onProblem }: DeleteItemSheetProps) {
  const router = useRouter();
  const remove = useDeleteItem(item.id);

  const confirm = async () => {
    onProblem(null);
    try {
      await remove.mutateAsync();
      onClose();
      router.back();
    } catch (error) {
      onClose();
      onProblem(ownerErrorMessage(error, 'delete'));
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.sheet}>
        <IconBadge icon="trash" tone="danger" size="lg" />
        <AppText variant="heading" style={styles.centered} accessibilityRole="header">
          {t.deleteTitle}
        </AppText>
        <AppText color="muted" style={styles.centered}>
          {`${item.title}. ${t.deleteBody}`}
        </AppText>
        <View style={styles.actions}>
          <Button
            label={t.deleteConfirm}
            variant="danger"
            icon="trash"
            loading={remove.isPending}
            onPress={() => void confirm()}
          />
          <Button label={t.deleteCancel} variant="link" onPress={onClose} />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: spacing.smd },
  grow: { flex: 1 },
  sheet: { alignItems: 'center', gap: spacing.smd },
  centered: { textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.sm },
});
