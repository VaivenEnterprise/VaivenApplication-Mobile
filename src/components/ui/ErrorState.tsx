import { StyleSheet, View } from 'react-native';
import { es } from '@/i18n/es-MX';
import { ApiError } from '@/lib/api/errors';
import { spacing } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';
import { IconBadge } from './IconBadge';

type ErrorStateProps = {
  error: Error | null;
  onRetry: () => void;
};

/** Mensaje por `ApiError.code` (nunca texto del servidor), `requestId` discreto y reintento. */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const apiError = error instanceof ApiError ? error : null;
  const message = apiError === null ? es.errors.unexpected : es.errors[apiError.code];
  return (
    <Card style={styles.card}>
      <IconBadge icon="cloudOffline" tone="danger" size="lg" />
      <AppText variant="bodyStrong" style={styles.centered} accessibilityRole="alert">
        {message}
      </AppText>
      <View style={styles.action}>
        <Button label={es.common.retry} variant="outline" onPress={onRetry} />
      </View>
      {apiError?.requestId ? (
        <AppText variant="caption" color="muted" selectable>
          {apiError.requestId}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: spacing.smd },
  centered: { textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: spacing.sm },
});
