import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, Screen, TextField, TextLink } from '@/components/ui';
import { mockAuthRequest } from '@/features/auth/mockAuthRequest';
import { useAuth } from '@/features/auth/useAuth';
import { esMX as t } from '@/i18n/es-MX';
import { colors, sizes, spacing, touch } from '@/theme';
import { loginSchema, type LoginFormValues } from '@/utils/schemas';

export default function LoginScreen() {
  const router = useRouter();
  const { signInAsMariana } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(loginSchema),
  });

  async function enter(values: LoginFormValues) {
    const sanitized = await mockAuthRequest(values);

    if (!sanitized.email) {
      return;
    }

    signInAsMariana();
    router.replace('/prototipo');
  }

  function exploreApp() {
    router.replace('/prototipo');
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <AppText variant="display">{t.common.appName}</AppText>
        <Button label={t.common.share} variant="ghost" onPress={() => undefined} />
      </View>

      <View style={styles.header}>
        <AppText variant="title">{t.auth.welcomeBack}</AppText>
        <AppText color="muted">{t.auth.signInSubtitle}</AppText>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
            <TextField
              autoCapitalize="none"
              autoCorrect={false}
              error={error?.message}
              keyboardType="email-address"
              label={t.auth.email}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={t.auth.emailPlaceholder}
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
            <TextField
              error={error?.message}
              label={t.auth.password}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={t.auth.passwordPlaceholder}
              rightAccessory={
                <Pressable
                  accessibilityLabel={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                  accessibilityRole="button"
                  onPress={() => setShowPassword((current) => !current)}
                  style={styles.eye}
                >
                  <Ionicons
                    color={colors.muted}
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={sizes.icon}
                  />
                </Pressable>
              }
              secureTextEntry={!showPassword}
              value={value}
            />
          )}
        />
      </View>

      <Button
        label={t.auth.signInCta}
        loading={isSubmitting}
        variant="terracotta"
        onPress={() => {
          void handleSubmit(enter)();
        }}
      />
      <Button label={t.auth.exploreApp} variant="secondaryGreen" onPress={exploreApp} />

      <View style={styles.footer}>
        <AppText variant="caption" color="muted">
          {t.auth.noAccount}
        </AppText>
        <TextLink label={t.auth.createOne} onPress={() => router.push('/prototipo/register')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  eye: {
    alignItems: 'center',
    height: touch.minSize,
    justifyContent: 'center',
    width: touch.minSize,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
