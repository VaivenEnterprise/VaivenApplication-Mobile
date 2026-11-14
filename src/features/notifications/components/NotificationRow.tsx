import { Pressable, StyleSheet, View } from 'react-native';
import type { IconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { IconBadge, type IconBadgeTone } from '@/components/ui/IconBadge';
import { timeLabel } from '@/features/notifications/format';
import {
  kindOf,
  type AppNotification,
  type NotificationKind,
} from '@/features/notifications/types';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.notifications.row;

const VISUALS: Record<NotificationKind, { icon: IconName; tone: IconBadgeTone }> = {
  request: { icon: 'hand', tone: 'primary' },
  message: { icon: 'chat', tone: 'primary' },
  delivery: { icon: 'cube', tone: 'secondary' },
  incident: { icon: 'flag', tone: 'warning' },
  moderation: { icon: 'shield', tone: 'danger' },
  system: { icon: 'bell', tone: 'primary' },
};

type NotificationRowProps = {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
  /** Hora de referencia de la hora relativa; solo se cambia en pruebas. */
  now?: Date;
};

/**
 * Fila de un aviso (spec 011 §7.1): ícono por familia, título de una línea, una línea de detalle y
 * la hora. Un aviso sin leer lleva título en negrita, un punto y fondo suave; además, su etiqueta
 * accesible empieza por «No leído», así que no depende solo del color.
 */
export function NotificationRow({ notification, onPress, now }: NotificationRowProps) {
  const unread = notification.readAt === null;
  const visual = VISUALS[kindOf(notification.type)];
  const time = timeLabel(notification.createdAt, now);
  const label = [unread ? t.unread : null, notification.title, notification.body, time]
    .filter((part): part is string => part !== null && part !== '')
    .join('. ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={t.open}
      onPress={() => onPress(notification)}
      style={[styles.row, unread && styles.unread]}
    >
      <IconBadge icon={visual.icon} tone={visual.tone} />
      <View style={styles.texts}>
        <AppText variant={unread ? 'bodyStrong' : 'body'} numberOfLines={1}>
          {notification.title}
        </AppText>
        <AppText variant="caption" color="muted" numberOfLines={1}>
          {notification.body}
        </AppText>
      </View>
      <View style={styles.meta}>
        <AppText variant="caption" color="muted">
          {time}
        </AppText>
        {unread ? <View testID="unread-dot" style={styles.dot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: sizes.touch.minSize + spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
    paddingVertical: spacing.smd,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  unread: { backgroundColor: colors.primarySoft },
  texts: { flex: 1, gap: spacing.xs },
  meta: { alignItems: 'flex-end', gap: spacing.xs },
  dot: {
    width: sizes.notification.unreadDot,
    height: sizes.notification.unreadDot,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
