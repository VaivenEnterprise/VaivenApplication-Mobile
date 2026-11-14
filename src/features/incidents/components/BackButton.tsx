import { Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes } from '@/theme';

/** Botón redondo «Volver» de las pantallas de incidencias. */
export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={es.incidents.back}
      onPress={onPress}
      style={styles.round}
    >
      <AppIcon name="arrowBack" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  round: {
    width: sizes.touch.minSize,
    height: sizes.touch.minSize,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
