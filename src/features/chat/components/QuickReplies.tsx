import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

type QuickRepliesProps = {
  /** Recibe el texto elegido; la pantalla lo pone en el campo (no se envía, RF-11). */
  onPick: (text: string) => void;
};

/** Fila de respuestas rápidas sobre el campo de texto: solo rellenan, nunca envían. */
export function QuickReplies({ onPick }: QuickRepliesProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      accessibilityLabel={es.chat.quickReplies.label}
      contentContainerStyle={styles.row}
    >
      {es.chat.quickReplies.items.map((text) => (
        <Pressable
          key={text}
          accessibilityRole="button"
          accessibilityLabel={text}
          onPress={() => onPick(text)}
          style={styles.chip}
        >
          <AppText variant="label" color="primaryInk">
            {text}
          </AppText>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingHorizontal: spacing.gutter, paddingVertical: spacing.xs },
  chip: {
    minHeight: sizes.touch.minSize,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
});
