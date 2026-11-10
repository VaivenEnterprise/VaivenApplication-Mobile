import { useRouter, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';
import { Screen } from '@/components/ui/Screen';
import { es } from '@/i18n/es-MX';
import { spacing } from '@/theme';

// Sin `.expo/types` (CI, clon limpio) '/' no es un `Href` válido; con ellos sí. La conversión sirve a ambos casos.
const HOME = '/' as string as Href;

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen scroll={false} contentStyle={styles.center}>
      <IconBadge icon="compass" size="lg" />
      <AppText variant="heading" style={styles.centered} accessibilityRole="header">
        {es.notFound.title}
      </AppText>
      <AppText color="muted" style={styles.centered}>
        {es.notFound.description}
      </AppText>
      <View style={styles.action}>
        <Button
          label={es.notFound.action}
          icon="arrowForward"
          onPress={() => router.replace(HOME)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centered: { textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: spacing.md },
});
