import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '@/theme';
import { AppText } from './AppText';
import { GradientBackground, type BackgroundVariant } from './GradientBackground';

type ScreenProps = {
  children: ReactNode;
  title?: string;
  background?: BackgroundVariant;
  /** Con `false` el contenido ocupa la pantalla sin desplazarse (pantallas centradas). */
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Contenedor de toda pantalla: área segura, fondo, margen `gutter` y manejo del teclado. */
export function Screen({
  children,
  title,
  background = 'plain',
  scroll = true,
  contentStyle,
}: ScreenProps) {
  const content = (
    <>
      {title === undefined ? null : (
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
      )}
      {children}
    </>
  );
  return (
    <GradientBackground variant={background}>
      <SafeAreaView style={styles.fill}>
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {scroll ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[styles.content, contentStyle]}
            >
              {content}
            </ScrollView>
          ) : (
            <View style={[styles.fill, styles.content, contentStyle]}>{content}</View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
});
