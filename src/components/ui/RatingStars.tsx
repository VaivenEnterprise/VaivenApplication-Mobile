import { Pressable, StyleSheet, View } from 'react-native';
import { es } from '@/i18n/es-MX';
import { sizes } from '@/theme';
import { AppIcon } from './AppIcon';

const STARS = [1, 2, 3, 4, 5] as const;

type RatingStarsProps = {
  /** Calificación de 0 a 5. */
  value: number;
  /** Si se omite, las estrellas son de solo lectura. */
  onChange?: (value: number) => void;
};

const label = (n: number) => `${n} ${es.ui.outOfFive}`;

/** Cinco estrellas: de solo lectura (lee «N de 5») o táctiles, con área de al menos 44 pt. */
export function RatingStars({ value, onChange }: RatingStarsProps) {
  const rounded = Math.round(Math.min(5, Math.max(0, Number.isFinite(value) ? value : 0)));

  if (onChange === undefined) {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={label(rounded)}
        style={styles.row}
      >
        {STARS.map((n) => (
          <AppIcon key={n} name={n <= rounded ? 'star' : 'starOutline'} color="warning" />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {STARS.map((n) => (
        <Pressable
          key={n}
          accessibilityRole="button"
          accessibilityLabel={label(n)}
          accessibilityState={{ selected: n === rounded }}
          onPress={() => onChange(n)}
          style={styles.target}
        >
          <AppIcon name={n <= rounded ? 'star' : 'starOutline'} size="lg" color="warning" />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  target: {
    minWidth: sizes.touch.minSize,
    minHeight: sizes.touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
