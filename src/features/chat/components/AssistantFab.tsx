import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { esMX as t } from '@/i18n/es-MX';
import { colors, radius, shadows, sizes, spacing } from '@/theme';

type Props = {
  onPress: () => void;
};

export function AssistantFab({ onPress }: Props) {
  return (
    <Pressable
      accessibilityLabel={t.assistant.fabLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
    >
      <Ionicons color={colors.onPrimary} name="sparkles" size={sizes.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    ...shadows.floating,
    alignItems: 'center',
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    bottom: spacing.lg,
    height: sizes.fab,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.lg,
    width: sizes.fab,
  },
  pressed: {
    backgroundColor: colors.orangePressed,
    opacity: 0.9,
  },
});
