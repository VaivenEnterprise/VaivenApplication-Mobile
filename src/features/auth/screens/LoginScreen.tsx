import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { FormNotice } from '@/components/FormNotice';
import { NeighborhoodIllustration } from '@/components/illustrations/NeighborhoodIllustration';
import { PasswordField } from '@/components/PasswordField';
import { TextField } from '@/components/TextField';
import { AppText } from '@/components/ui/AppText';
import { BrandMark } from '@/components/ui/BrandMark';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Squiggle } from '@/components/ui/Squiggle';
import { authErrorMessage } from '@/features/auth/errors';
import { loginSchema, type LoginInput } from '@/features/auth/schemas';
import { useSession } from '@/features/auth/useSession';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { sizes, spacing } from '@/theme';

const t = es.auth.login;

/** Inicio de sesión (spec 003 §7.1): correo, contraseña con ojo, botón y enlace a registro. */
export function LoginScreen() {
  const router = useRouter();
  const { signIn } = useSession();
  const { height } = useWindowDimensions();
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signIn(values);
    } catch (error) {
      setFormError(authErrorMessage(error, 'login'));
    }
  });

  return (
    <Screen background="auth">
      <BrandMark size="md" />
      <View style={styles.title}>
        <AppText variant="display" accessibilityRole="header">
          {t.titleLead}
          {'\n'}
          <AppText variant="display" color="primary">
            {t.titleAccent}
          </AppText>
        </AppText>
        <Squiggle />
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              label={t.email}
              icon="mail"
              placeholder={t.emailPlaceholder}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              error={fieldState.error?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              textContentType="emailAddress"
              returnKeyType="next"
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <PasswordField
              label={t.password}
              placeholder={t.passwordPlaceholder}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              error={fieldState.error?.message}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={() => void submit()}
            />
          )}
        />
        {formError === null ? null : <FormNotice message={formError} />}
        <Button
          label={t.submit}
          icon="arrowForward"
          loading={formState.isSubmitting}
          onPress={() => void submit()}
        />
      </View>

      {height >= sizes.illustrationMinHeight ? <NeighborhoodIllustration /> : null}

      <View style={styles.footer}>
        <AppText color="muted">{t.noAccount}</AppText>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t.createOne}
          onPress={() => router.push(routes.register)}
          style={styles.link}
        >
          <AppText variant="bodyStrong" color="primaryPressed">
            {t.createOne}
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { gap: spacing.xs, marginTop: spacing.sm },
  form: { gap: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.xs },
  link: { minHeight: sizes.touch.minSize, justifyContent: 'center' },
});
