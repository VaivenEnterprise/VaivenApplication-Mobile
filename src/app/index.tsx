import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { BrandMark } from '@/components/ui/BrandMark';
import { Screen } from '@/components/ui/Screen';
import { Squiggle } from '@/components/ui/Squiggle';
import { es } from '@/i18n/es-MX';
import { spacing } from '@/theme';

export default function HomeScreen() {
  return (
    <Screen background="auth" scroll={false}>
      <BrandMark size="sm" />
      <View style={styles.hero}>
        <AppText variant="display" accessibilityRole="header">
          {es.home.title}
        </AppText>
        <Squiggle />
        <AppText color="muted">{es.home.subtitle}</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, justifyContent: 'center', gap: spacing.md },
});
