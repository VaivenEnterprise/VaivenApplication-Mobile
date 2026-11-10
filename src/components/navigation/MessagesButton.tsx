import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { colors, radius, shadows, sizes, spacing } from '@/theme';

const MAX_BADGE = 99;

type MessagesButtonProps = {
  /** Mensajes sin leer; la spec 008 lo llena con `useUnreadBadge`. Sin valor o 0, no hay insignia. */
  badgeCount?: number;
  /** Por defecto abre la pestaña Mensajes. */
  onPress?: () => void;
};

/** Botón de mensajes del encabezado de Inicio: burbuja con insignia opcional (spec 003 P-09). */
export function MessagesButton({ badgeCount = 0, onPress }: MessagesButtonProps) {
  const router = useRouter();
  const unread = Math.max(0, Math.floor(badgeCount));
  const label =
    unread > 0 ? `${es.inicio.messages}, ${unread} ${es.inicio.unread}` : es.inicio.messages;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress ?? (() => router.push(routes.messages))}
      style={styles.button}
    >
      <AppIcon name="chat" color="primaryInk" />
      {unread > 0 ? (
        <View style={styles.badge}>
          <AppText variant="tab" color="onPrimary">
            {unread > MAX_BADGE ? `${MAX_BADGE}+` : String(unread)}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: sizes.roundButton,
    height: sizes.roundButton,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  badge: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    minWidth: spacing.md + spacing.xs,
    height: spacing.md + spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
