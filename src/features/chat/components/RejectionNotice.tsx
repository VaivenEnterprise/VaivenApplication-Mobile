import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Banner } from '@/components/ui/Banner';
import type { SendRejection } from '@/features/chat/api';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.chat.notice;

type RejectionNoticeProps = {
  rejection: SendRejection;
  onDismiss: () => void;
};

/**
 * Aviso sobre el campo cuando el servidor no aceptó el mensaje (RF-08, CA-06): moderación (con el
 * motivo que manda el servidor; el texto sigue en el campo), límite de ritmo («Más despacio») o
 * conversación cerrada.
 */
export function RejectionNotice({ rejection, onDismiss }: RejectionNoticeProps) {
  if (rejection.kind === 'rate_limited') return <Banner variant="warning" message={t.slowDown} />;
  if (rejection.kind === 'closed') return <Banner variant="warning" message={t.closed} />;
  return (
    <View accessible accessibilityRole="alert" style={styles.box}>
      <AppIcon name="danger" size="sm" color="danger" />
      <View style={styles.texts}>
        <AppText variant="label" color="danger">
          {t.moderationTitle}
        </AppText>
        <AppText variant="caption" color="danger">
          {rejection.reason ?? t.moderationFallback}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.dismiss}
        onPress={onDismiss}
        style={styles.close}
      >
        <AppIcon name="close" size="sm" color="danger" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    marginHorizontal: spacing.gutter,
    paddingLeft: spacing.smd,
  },
  texts: { flex: 1, paddingVertical: spacing.smd, gap: spacing.xs },
  close: {
    width: sizes.touch.minSize,
    height: sizes.touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
