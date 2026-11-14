import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { IconBadge } from '@/components/ui/IconBadge';
import { es } from '@/i18n/es-MX';
import { colors, radius, shadows, sizes, spacing } from '@/theme';

const t = es.notifications.banner;

export type BannerContent = { title: string; body: string };

type InAppBannerProps = {
  content: BannerContent;
  onPress: () => void;
  onDismiss: () => void;
};

/**
 * Aviso flotante con la app abierta (spec 011 §7.3, RF-04): ícono, título y una línea. Tocarlo abre
 * el destino; la «X» lo cierra. Lo oculta quien lo monta a los 4 s.
 */
export function InAppBanner({ content, onPress, onDismiss }: InAppBannerProps) {
  return (
    <SafeAreaView edges={['top']} pointerEvents="box-none" style={styles.anchor}>
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="alert"
          accessibilityLabel={`${content.title}. ${content.body}`}
          accessibilityHint={t.open}
          accessibilityLiveRegion="polite"
          onPress={onPress}
          style={styles.card}
        >
          <IconBadge icon="bell" />
          <View style={styles.texts}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {content.title}
            </AppText>
            <AppText variant="caption" color="muted" numberOfLines={1}>
              {content.body}
            </AppText>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.dismiss}
          onPress={onDismiss}
          style={styles.close}
        >
          <AppIcon name="close" color="muted" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  anchor: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.gutter },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    ...shadows.card,
  },
  card: {
    flex: 1,
    minHeight: sizes.banner + spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.smd,
  },
  texts: { flex: 1 },
  close: {
    width: sizes.touch.minSize,
    height: sizes.touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
