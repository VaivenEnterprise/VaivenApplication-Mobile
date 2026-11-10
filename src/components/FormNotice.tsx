import { StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { colors, radius, spacing } from '@/theme';

type FormNoticeProps = {
  message: string;
};

/** Aviso de error del formulario: fondo `dangerSoft`, ícono y texto que puede ocupar varias líneas. */
export function FormNotice({ message }: FormNoticeProps) {
  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={styles.root}
    >
      <AppIcon name="danger" size="sm" color="danger" />
      <AppText variant="caption" color="danger" style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.smd,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  text: { flex: 1 },
});
