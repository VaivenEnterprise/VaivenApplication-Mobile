import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { FormNotice } from '@/components/FormNotice';
import { TextField } from '@/components/TextField';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { useSession } from '@/features/auth/useSession';
import { useUpdateProfile } from '@/features/profile/hooks';
import {
  editProfileSchema,
  type EditProfileInput,
  type UpdateMeRequest,
} from '@/features/profile/schemas';
import { es } from '@/i18n/es-MX';
import { ApiError, messageForCode } from '@/lib/api/errors';
import { colors, motion, radius, sizes, spacing } from '@/theme';

const t = es.profile.edit;

/** Editar perfil (spec 003 §7.9, RF-06): nombre y teléfono opcional con `PATCH /me`. */
export function EditProfileScreen() {
  const router = useRouter();
  const { user } = useSession();
  const update = useUpdateProfile();
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const initial: EditProfileInput = {
    displayName: user?.displayName ?? '',
    phone: user?.phone ?? '',
  };
  const { control, handleSubmit, formState, reset } = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: initial,
  });

  // Tras guardar se muestra «Guardado» un momento y se regresa a Perfil.
  useEffect(() => {
    if (!saved) return undefined;
    const timer = setTimeout(() => router.back(), motion.duration.saved);
    return () => clearTimeout(timer);
  }, [saved, router]);

  if (user === null) return null;

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    const body: UpdateMeRequest = {};
    if (values.displayName !== user.displayName) body.displayName = values.displayName;
    const phone = values.phone === '' ? null : values.phone;
    if (phone !== user.phone) body.phone = phone;
    if (Object.keys(body).length === 0) return;
    try {
      const next = await update.mutateAsync(body);
      reset({ displayName: next.displayName, phone: next.phone ?? '' });
      setSaved(true);
    } catch (error) {
      setFormError(error instanceof ApiError ? messageForCode(error.code) : es.errors.unexpected);
    }
  });

  return (
    <>
      {saved ? <Banner variant="success" message={t.saved} /> : null}
      <Screen>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={es.common.back}
            onPress={() => router.back()}
            style={styles.back}
          >
            <AppIcon name="arrowBack" />
          </Pressable>
          <AppText variant="heading" accessibilityRole="header">
            {t.title}
          </AppText>
        </View>

        <View style={styles.avatar}>
          <Avatar name={user.displayName} size="lg" />
        </View>

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
              returnKeyType="next"
            />
          )}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field, fieldState }) => (
            <TextField
              label={t.phone}
              placeholder={t.phonePlaceholder}
              hint={t.phoneHint}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              error={fieldState.error?.message}
              keyboardType="phone-pad"
              autoComplete="tel"
              returnKeyType="done"
            />
          )}
        />
        {formError === null ? null : <FormNotice message={formError} />}
        <Button
          label={t.save}
          disabled={!formState.isDirty || saved}
          loading={formState.isSubmitting}
          onPress={() => void submit()}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd },
  back: {
    width: sizes.roundButton,
    height: sizes.roundButton,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { alignItems: 'center' },
});
