import type { ReactElement, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type RefreshControlProps,
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
  /** Jalar para recargar (solo con `scroll`). */
  refreshControl?: ReactElement<RefreshControlProps>;
};

/** Contenedor de toda pantalla: área segura, fondo, margen `gutter` y manejo del teclado. */
export function Screen({
  children,
  title,
  background = 'plain',
  scroll = true,
  contentStyle,
  refreshControl,
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
        <KeyboardAvoidingView style={styles.fill} behavior="padding">
          {scroll ? (
            <ScrollView
              testID="screen-scroll"
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              refreshControl={refreshControl}
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
