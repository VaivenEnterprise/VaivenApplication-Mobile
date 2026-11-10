import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { sizes, spacing } from '@/theme';
import { AppIcon } from './AppIcon';
import { AppText } from './AppText';

type ListRowProps = {
  title: string;
  subtitle?: string;
  /** Ícono o `Avatar` a la izquierda. */
  leading?: ReactNode;
  /** Elemento final (insignia, interruptor…). Con `onPress` y sin `trailing` se muestra un chevron. */
  trailing?: ReactNode;
  onPress?: () => void;
};

/** Fila de lista de al menos 56 pt de alto. */
export function ListRow({ title, subtitle, leading, trailing, onPress }: ListRowProps) {
  const end =
    trailing ?? (onPress === undefined ? null : <AppIcon name="chevronForward" color="muted" />);
  const content = (
    <>
      {leading === undefined ? null : <View>{leading}</View>}
      <View style={styles.texts}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle === undefined ? null : (
          <AppText variant="caption" color="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        )}
      </View>
      {end}
    </>
  );

  if (onPress === undefined) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={styles.row}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: sizes.control.height,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
  },
  texts: { flex: 1 },
});
