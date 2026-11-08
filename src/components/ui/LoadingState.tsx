import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing } from '@/theme';

type Props = {
  label: string;
};

export function LoadingState({ label }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} />
      <AppText color="muted">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
});
