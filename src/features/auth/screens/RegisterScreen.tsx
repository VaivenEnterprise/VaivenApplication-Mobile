import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Checkbox } from '@/components/Checkbox';
import { FormNotice } from '@/components/FormNotice';
import { PasswordField } from '@/components/PasswordField';
import { TextField } from '@/components/TextField';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { IconBadge } from '@/components/ui/IconBadge';
import { Screen } from '@/components/ui/Screen';
import { authErrorMessage } from '@/features/auth/errors';
import { legalUrl, type LegalPage } from '@/features/auth/legal';
import { registerSchema, type RegisterInput } from '@/features/auth/schemas';
import { useSession } from '@/features/auth/useSession';
import { es } from '@/i18n/es-MX';
import { ApiError } from '@/lib/api/errors';
import { routes } from '@/lib/routes';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.auth.register;

function LegalLink({ page, children }: { page: LegalPage; children: string }) {
  const url = legalUrl(page);
  if (url === null) {
    return (
      <AppText variant="bodyStrong" color="primaryPressed">
        {children}
      </AppText>
    );
  }
  return (
    <AppText
      variant="bodyStrong"
      color="primaryPressed"
      accessibilityRole="link"
      onPress={() => void Linking.openURL(url)}
    >
      {children}
    </AppText>
  );
}

/** Registro (spec 003 §7.2): datos de la cuenta, mayoría de edad y aceptación de términos. */
export function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useSession();
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, setError, formState } = useForm<RegisterInput>({
    mode: 'onTouched',
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      isAdult: false,
      acceptTerms: false,
    },
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signUp(values);
    } catch (error) {
      const message = authErrorMessage(error, 'register');
      // El correo repetido se marca en su propio campo; lo demás, en el aviso del formulario.
      if (error instanceof ApiError && error.code === 'conflict') {
        setError('email', { message });
      } else {
        setFormError(message);
      }
    }
  });

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(routes.login);
  };

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={es.common.back}
          onPress={goBack}
          style={styles.back}
        >
          <AppIcon name="arrowBack" />
        </Pressable>
        <Chip label={t.safeChip} variant="success" icon="shield" />
      </View>

      <View style={styles.header}>
        <AppText variant="eyebrow" color="primaryInk">
          {t.eyebrow}
        </AppText>
        <AppText variant="title" accessibilityRole="header">
          {t.title}
        </AppText>
        <AppText color="muted">{t.subtitle}</AppText>
      </View>

      <Card variant="muted" style={styles.trust}>
        <IconBadge icon="people" tone="secondary" />
        <View style={styles.trustText}>
          <AppText variant="bodyStrong">{t.trustTitle}</AppText>
          <AppText variant="caption" color="muted">
            {t.trustText}
          </AppText>
        </View>
      </Card>

      <View style={styles.form}>
        <Controller
          control={control}
          name="displayName"
          render={({ field, fieldState }) => (
            <TextField
              label={t.name}
              icon="person"
              placeholder={t.namePlaceholder}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              error={fieldState.error?.message}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
            />
          )}
        />
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
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <PasswordField
              label={t.confirm}
              placeholder={t.confirmPlaceholder}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              error={fieldState.error?.message}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
            />
          )}
        />
        <Controller
          control={control}
          name="isAdult"
          render={({ field, fieldState }) => (
            <Checkbox
              checked={field.value}
              onChange={field.onChange}
              accessibilityLabel={t.adult}
              error={fieldState.error?.message}
            >
              {t.adult}
            </Checkbox>
          )}
        />
        <Controller
          control={control}
          name="acceptTerms"
          render={({ field, fieldState }) => (
            <Checkbox
              checked={field.value}
              onChange={field.onChange}
              accessibilityLabel={`${t.termsLead}${t.termsLink}${t.termsMiddle}${t.privacyLink}${t.termsTail}`}
              error={fieldState.error?.message}
            >
              {t.termsLead}
              <LegalLink page="terminos">{t.termsLink}</LegalLink>
              {t.termsMiddle}
              <LegalLink page="privacidad">{t.privacyLink}</LegalLink>
              {t.termsTail}
            </Checkbox>
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

      <View style={styles.footer}>
        <AppText color="muted">{t.haveAccount}</AppText>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t.signIn}
          onPress={() => router.replace(routes.login)}
          style={styles.link}
        >
          <AppText variant="bodyStrong" color="primaryPressed">
            {t.signIn}
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: {
    width: sizes.roundButton,
    height: sizes.roundButton,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { gap: spacing.xs },
  trust: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd, padding: spacing.md },
  trustText: { flex: 1, gap: 2 },
  form: { gap: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.xs },
  link: { minHeight: sizes.touch.minSize, justifyContent: 'center' },
});
