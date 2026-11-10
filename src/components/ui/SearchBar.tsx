import type { ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { es } from '@/i18n/es-MX';
import { colors, radius, shadows, sizes, spacing, typography } from '@/theme';
import { AppIcon } from './AppIcon';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  /** Botón final (p. ej. filtros). */
  trailing?: ReactNode;
};

/** Campo de búsqueda en píldora con lupa y botón para borrar. */
export function SearchBar({ value, onChangeText, placeholder, trailing }: SearchBarProps) {
  return (
    <View style={styles.bar}>
      <AppIcon name="search" color="muted" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        accessibilityLabel={placeholder}
        accessibilityRole="search"
        returnKeyType="search"
        autoCorrect={false}
        style={styles.input}
      />
      {value.length === 0 ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={es.ui.clearSearch}
          onPress={() => onChangeText('')}
          style={styles.clear}
        >
          <AppIcon name="clearCircle" color="muted" />
        </Pressable>
      )}
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: sizes.control.height,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  input: { flex: 1, color: colors.ink, ...typography.body },
  clear: {
    minWidth: sizes.touch.minSize,
    minHeight: sizes.touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
