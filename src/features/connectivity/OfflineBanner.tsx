import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banner } from '@/components/ui/Banner';
import { useOnline } from '@/features/connectivity/useOnline';
import { es } from '@/i18n/es-MX';
import { colors, spacing } from '@/theme';

const t = es.connectivity;

/**
 * Aviso global de conexión (spec 012 §7.1): franja en el flujo, bajo la barra de estado y sobre el
 * contenido. «Sin conexión» con un indicador de reintento; al volver, «De vuelta en línea» 2 s. No
 * bloquea la interacción: es un elemento más del flujo, no una capa.
 */
export function OfflineBanner() {
  const status = useOnline();
  const insets = useSafeAreaInsets();
  if (status === 'online') return null;

  const offline = status === 'offline';
  return (
    <View
      testID="offline-banner"
      style={[
        styles.wrap,
        { paddingTop: insets.top, backgroundColor: offline ? colors.ink : colors.secondary },
      ]}
    >
      <Banner
        variant={offline ? 'offline' : 'success'}
        message={offline ? t.offline : t.backOnline}
      />
      {offline ? (
        <ActivityIndicator
          accessibilityLabel={t.retrying}
          size="small"
          color={colors.onPrimary}
          style={styles.spinner}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'center' },
  spinner: { position: 'absolute', right: spacing.gutter, bottom: spacing.sm },
});
