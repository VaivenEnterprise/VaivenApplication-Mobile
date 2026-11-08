import { fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { esMX as t } from '@/i18n/es-MX';
import { mariana } from '@/mocks/users';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

function AuthProbe() {
  const { user, signInAsMariana, signOut } = useAuth();

  return (
    <>
      <Text>{user?.name ?? t.account.guestTitle}</Text>
      <Pressable accessibilityRole="button" onPress={signInAsMariana}>
        <Text>{t.auth.enterAsMariana}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={signOut}>
        <Text>{t.auth.signOut}</Text>
      </Pressable>
    </>
  );
}

describe('AuthProvider', () => {
  it('inicia como invitado, entra como Mariana y vuelve a invitado', async () => {
    await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByText(t.account.guestTitle)).toBeTruthy();
    expect(screen.queryByText(mariana.name)).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: t.auth.enterAsMariana }));
    expect(screen.getByText(mariana.name)).toBeTruthy();
    expect(screen.queryByText(t.account.guestTitle)).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: t.auth.signOut }));
    expect(screen.getByText(t.account.guestTitle)).toBeTruthy();
    expect(screen.queryByText(mariana.name)).toBeNull();
  });

  it('no conserva la sesión al montar un nuevo proveedor', async () => {
    await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByText(t.account.guestTitle)).toBeTruthy();
  });
});
