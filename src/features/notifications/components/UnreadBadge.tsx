import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

/** Tope visible: a partir de aquí se muestra «99+». */
export const UNREAD_BADGE_MAX = 99;

type UnreadBadgeProps = { count: number };

/** Insignia con el número de avisos sin leer (RF-02). Con 0 no se dibuja. */
export function UnreadBadge({ count }: UnreadBadgeProps) {
  if (count <= 0) return null;
  const text = count > UNREAD_BADGE_MAX ? `${UNREAD_BADGE_MAX}+` : String(count);
  return (
    <View
      accessible
      accessibilityLabel={`${count} ${es.notifications.badge.unread}`}
      style={styles.pill}
    >
      <AppText variant="caption" color="onPrimary">
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minWidth: sizes.notification.badge,
    height: sizes.notification.badge,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
