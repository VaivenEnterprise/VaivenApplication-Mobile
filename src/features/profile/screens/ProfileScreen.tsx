import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FormNotice } from '@/components/FormNotice';
import { PasswordField } from '@/components/PasswordField';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Banner } from '@/components/ui/Banner';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Divider';
import { IconBadge } from '@/components/ui/IconBadge';
import { ListRow } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import type { User } from '@/features/auth/schemas';
import { useSession } from '@/features/auth/useSession';
import { useDeleteAccount, useMe } from '@/features/profile/hooks';
import { es } from '@/i18n/es-MX';
import { ApiError, messageForCode } from '@/lib/api/errors';
import { formatMonthYear } from '@/lib/format/date';
import { routes } from '@/lib/routes';
import { sizes, spacing } from '@/theme';

const t = es.profile;

type ProfileScreenProps = {
  /** Reputación de la persona (spec 010): estrellas y promedio. Sin calificaciones, nada. */
  renderReputation?: (user: User) => ReactNode;
  /** Filas extra del grupo (011 «Notificaciones», 010 «Mis incidencias», 015). */
  renderExtraRows?: () => ReactNode;
};

/** Perfil propio (spec 003 §7.8): datos, filas de acción, cerrar sesión y eliminar cuenta. */
export function ProfileScreen({ renderReputation, renderExtraRows }: ProfileScreenProps) {
  const router = useRouter();
  const { signOut } = useSession();
  const { user } = useMe();
  const [deleting, setDeleting] = useState(false);

  if (user === null) return null;
  const since = formatMonthYear(user.createdAt);

  return (
    <Screen>
      <View style={styles.header}>
        <Avatar name={user.displayName} size="lg" />
        <AppText variant="title" accessibilityRole="header" style={styles.centered}>
          {user.displayName}
        </AppText>
        {since === '' ? null : (
          <AppText variant="caption" color="muted">
            {`${t.memberSince} ${since}`}
          </AppText>
        )}
        {renderReputation?.(user)}
      </View>

      <Card>
        <ListRow
          title={t.editProfile}
          leading={<IconBadge icon="edit" />}
          onPress={() => router.push(routes.editProfile)}
        />
        {renderExtraRows === undefined ? null : (
          <>
            <Divider />
            {renderExtraRows()}
          </>
        )}
      </Card>

      <Card>
        <ListRow
          title={t.signOut}
          leading={<IconBadge icon="logout" tone="secondary" />}
          onPress={() => void signOut()}
        />
      </Card>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.deleteAccount}
        onPress={() => setDeleting(true)}
        style={styles.delete}
      >
        <AppText variant="caption" color="danger">
          {t.deleteAccount}
        </AppText>
      </Pressable>

      <DeleteAccountSheet visible={deleting} onClose={() => setDeleting(false)} />
    </Screen>
  );
}

type DeleteAccountSheetProps = { visible: boolean; onClose: () => void };

/** Hoja «Eliminar cuenta» (spec 003 §7.10, RF-08): pide la contraseña antes de borrar. */
function DeleteAccountSheet({ visible, onClose }: DeleteAccountSheetProps) {
  const [password, setPassword] = useState('');
  const mutation = useDeleteAccount();
  const error = mutation.error;

  const close = () => {
    setPassword('');
    mutation.reset();
    onClose();
  };

  const wrongPassword = error instanceof ApiError && error.status === 403;
  const pending = error instanceof ApiError && error.status === 409;
  const other = error !== null && !wrongPassword && !pending;

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title={t.delete.title}
      footer={
        <View style={styles.footer}>
          <Button
            label={t.delete.confirm}
            variant="danger"
            disabled={password === ''}
            loading={mutation.isPending}
            onPress={() => mutation.mutate(password)}
          />
          <Button label={t.delete.cancel} variant="link" onPress={close} />
        </View>
      }
    >
      <View style={styles.sheet}>
        <IconBadge icon="warning" tone="danger" size="lg" />
        <AppText color="muted" style={styles.centered}>
          {t.delete.description}
        </AppText>
        {pending ? <Banner variant="danger" message={t.delete.pending} /> : null}
        {other ? (
          <FormNotice
            message={error instanceof ApiError ? messageForCode(error.code) : es.errors.unexpected}
          />
        ) : null}
        <View style={styles.field}>
          <PasswordField
            label={t.delete.password}
            placeholder={t.delete.passwordPlaceholder}
            value={password}
            onChangeText={setPassword}
            error={wrongPassword ? t.delete.wrongPassword : undefined}
            autoComplete="current-password"
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.xs },
  centered: { textAlign: 'center' },
  delete: {
    minHeight: sizes.touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: { alignItems: 'center', gap: spacing.md },
  field: { alignSelf: 'stretch' },
  footer: { gap: spacing.sm },
});
