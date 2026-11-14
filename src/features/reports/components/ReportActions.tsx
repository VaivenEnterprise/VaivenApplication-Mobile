import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { useSession } from '@/features/auth/useSession';
import { ReportButton } from '@/features/reports/components/ReportButton';
import { ReportSheet } from '@/features/reports/components/ReportSheet';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes } from '@/theme';

type ReportItemActionProps = { itemId: string; ownerId: string };

/** «Reportar este objeto» para el menú «⋯» del detalle; no aparece en objetos propios (409). */
export function ReportItemAction({ itemId, ownerId }: ReportItemActionProps) {
  const { user } = useSession();
  if (user?.id === ownerId) return null;
  return <ReportButton targetType="item" targetId={itemId} />;
}

type ReportUserActionProps = { userId: string };

/** Botón «⋯» de reporte para el encabezado del perfil público; no aparece en el propio. */
export function ReportUserAction({ userId }: ReportUserActionProps) {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  if (user?.id === userId) return null;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={es.reports.button.user}
        onPress={() => setOpen(true)}
        style={styles.round}
      >
        <AppIcon name="flag" />
      </Pressable>
      <ReportSheet
        visible={open}
        onClose={() => setOpen(false)}
        targetType="user"
        targetId={userId}
      />
    </>
  );
}

const styles = StyleSheet.create({
  round: {
    width: sizes.roundButton,
    height: sizes.roundButton,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
