import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Button } from './Button';
import { spacing } from '@/theme';

type Props = {
  message: string;
  retryLabel: string;
  onRetry?: () => void;
};

export function ErrorState({ message, retryLabel, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <AppText color="danger" align="center">
        {message}
      </AppText>
      {onRetry ? <Button label={retryLabel} variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
});
