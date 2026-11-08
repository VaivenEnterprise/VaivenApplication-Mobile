import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  Badge,
  Button,
  Card,
  Checkbox,
  Screen,
  TextField,
  TextLink,
} from '@/components/ui';
import { mockAuthRequest } from '@/features/auth/mockAuthRequest';
import { useAuth } from '@/features/auth/useAuth';
import { esMX as t } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing, touch } from '@/theme';
import { registerSchema, type RegisterFormValues } from '@/utils/schemas';

export default function RegisterScreen() {
  const router = useRouter();
  const { signInAsMariana } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      terms: false,
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(registerSchema),
  });

  async function createAccount(values: RegisterFormValues) {
    const sanitized = await mockAuthRequest(values);

    if (!sanitized.email || !sanitized.terms) {
      return;
    }

    signInAsMariana();
    router.replace('/prototipo');
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <AppText variant="display">{t.common.appName}</AppText>
        <Button label={t.common.back} variant="ghost" onPress={() => router.back()} />
      </View>

      <View style={styles.header}>
        <Badge label={t.auth.safeCommunity} tone="success" />
        <AppText variant="title">{t.auth.createAccount}</AppText>
        <AppText color="muted">{t.auth.createAccountSubtitle}</AppText>
      </View>

      <Card>
        <View style={styles.trust}>
          <View style={styles.trustIcon}>
            <Ionicons color={colors.primary} name="shield-checkmark-outline" size={sizes.icon} />
          </View>
          <View style={styles.trustText}>
            <AppText variant="bodyBold">{t.auth.trustTitle}</AppText>
            <AppText variant="caption" color="muted">
              {t.auth.trustBody}
            </AppText>
          </View>
        </View>
      </Card>

      <View style={styles.form}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
            <TextField
              autoCapitalize="words"
              error={error?.message}
              label={t.auth.fullName}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={t.auth.fullNamePlaceholder}
              value={value}
            />
          )}
        />
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
          name="phone"
          render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
            <TextField
              error={error?.message}
              keyboardType="phone-pad"
              label={t.auth.phone}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={t.auth.phonePlaceholder}
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

      <Controller
        control={control}
        name="terms"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <Checkbox
            checked={value}
            error={error?.message}
            label={t.auth.terms}
            onChange={onChange}
          />
        )}
      />

      <Button
        label={t.auth.createAccountCta}
        loading={isSubmitting}
        variant="terracotta"
        onPress={() => {
          void handleSubmit(createAccount)();
        }}
      />

      <View style={styles.footer}>
        <AppText variant="caption" color="muted">
          {t.auth.alreadyHaveAccount}
        </AppText>
        <TextLink label={t.auth.signInLink} onPress={() => router.push('/prototipo/login')} />
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
  trust: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  trustIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: sizes.iconXLarge,
    justifyContent: 'center',
    width: sizes.iconXLarge,
  },
  trustText: {
    flex: 1,
    gap: spacing.xs,
  },
});
