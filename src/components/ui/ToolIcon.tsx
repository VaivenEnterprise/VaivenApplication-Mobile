import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ToolCategory } from '@/lib/domain/models';
import { colors, radius, sizes } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const categoryIcons: Record<ToolCategory, IoniconName> = {
  tools: 'construct-outline',
  garden: 'leaf-outline',
  kitchen: 'restaurant-outline',
};

const nameIcons: Record<string, IoniconName> = {
  Atornillador: 'build-outline',
  Brocas: 'hardware-chip-outline',
  'Juego de brocas': 'hardware-chip-outline',
  Martillo: 'hammer-outline',
  Nivel: 'options-outline',
  'Nivel de burbuja': 'options-outline',
  Podadora: 'leaf-outline',
  Taladro: 'construct-outline',
  'Taladro percutor': 'construct-outline',
  Tijeras: 'cut-outline',
};

type Props = {
  name: string;
  category?: ToolCategory;
  size?: number;
};

export function ToolIcon({ name, category, size = sizes.icon }: Props) {
  const icon = nameIcons[name] ?? (category ? categoryIcons[category] : 'construct-outline');

  return (
    <View style={styles.circle}>
      <Ionicons color={colors.primary} name={icon} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: sizes.iconXLarge,
    justifyContent: 'center',
    width: sizes.iconXLarge,
  },
});
