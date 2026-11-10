import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { AppIcon, type IconName } from '@/components/ui/AppIcon';
import { colors, gradients, radius, spacing } from '@/theme';

export type SlotTone = 'warm' | 'green';

type SlotPlaceholderProps = {
  title: string;
  hint?: string;
  icon?: IconName;
  tone?: SlotTone;
  style?: StyleProp<ViewStyle>;
};

/**
 * Marcador de un bloque que aún no tiene API. La spec dueña lo sustituye mediante una *prop*
 * `render…` de la pantalla, sin editar el archivo que lo contiene.
 */
export function SlotPlaceholder({
  title,
  hint,
  icon = 'add',
  tone = 'warm',
  style,
}: SlotPlaceholderProps) {
  const gradient = tone === 'warm' ? gradients.slotWarm : gradients.slotGreen;
  const ink = tone === 'warm' ? colors.primaryInk : colors.secondaryPressed;
  return (
    <View
      accessible
      accessibilityLabel={hint === undefined ? title : `${title}. ${hint}`}
      style={[styles.root, { borderColor: ink }, style]}
    >
      <LinearGradient
        colors={gradient.colors}
        start={gradient.start}
        end={gradient.end}
        style={StyleSheet.absoluteFill}
      />
      <AppIcon name={icon} color={tone === 'warm' ? 'primaryInk' : 'secondaryPressed'} />
      <AppText variant="label" color={tone === 'warm' ? 'primaryInk' : 'secondaryPressed'}>
        {title}
      </AppText>
      {hint === undefined ? null : (
        <AppText variant="caption" color="muted" style={styles.hint}>
          {hint}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  hint: { textAlign: 'center' },
});
