import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { BIOMETRIC_UNLOCK_KEY } from '@/features/auth/biometrics';
import { BiometricUnlockRow } from '@/features/auth/components/BiometricUnlockRow';
import { es } from '@/i18n/es-MX';
import { installMemorySecureStore } from '@/test/fakeApi';

// Spec 021-T015 (RF-14): interruptor del Perfil «Desbloquear con huella o rostro».

jest.setTimeout(30_000);
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const biometrics = jest.mocked(LocalAuthentication);
const t = es.auth.biometric;

function phone({ enrolled, confirms = [] }: { enrolled: boolean; confirms?: boolean[] }) {
  biometrics.hasHardwareAsync.mockReset().mockResolvedValue(enrolled);
  biometrics.isEnrolledAsync.mockReset().mockResolvedValue(enrolled);
  biometrics.authenticateAsync.mockReset();
  for (const success of confirms) {
    biometrics.authenticateAsync.mockResolvedValueOnce(
      success ? { success: true } : { success: false, error: 'user_cancel' },
    );
  }
}

const toggle = () => screen.getByRole('switch', { name: t.row });

describe('BiometricUnlockRow', () => {
  it('no aparece si el teléfono no tiene biometría registrada', async () => {
    phone({ enrolled: false });
    installMemorySecureStore();
    await render(<BiometricUnlockRow />);
    await waitFor(() => expect(biometrics.hasHardwareAsync).toHaveBeenCalled());
    expect(screen.queryByText(t.row)).toBeNull();
  });

  it('aparece desactivado por defecto', async () => {
    phone({ enrolled: true });
    installMemorySecureStore();
    await render(<BiometricUnlockRow />);
    expect(await screen.findByText(t.row)).toBeTruthy();
    expect(toggle().props.value).toBe(false);
    expect(screen.getByText(t.off)).toBeTruthy();
  });

  it('activarlo exige confirmarse y guarda la marca solo en el almacén seguro', async () => {
    phone({ enrolled: true, confirms: [true] });
    const saved = installMemorySecureStore();
    await render(<BiometricUnlockRow />);
    await screen.findByText(t.row);
    await fireEvent(toggle(), 'valueChange', true);
    await waitFor(() => expect(toggle().props.value).toBe(true));
    expect(biometrics.authenticateAsync).toHaveBeenCalledTimes(1);
    expect(saved.get(BIOMETRIC_UNLOCK_KEY)).toBe('1');
    expect(screen.getByText(t.on)).toBeTruthy();
  });

  it('si la persona no se confirma, no se activa y lo avisa', async () => {
    phone({ enrolled: true, confirms: [false] });
    const saved = installMemorySecureStore();
    await render(<BiometricUnlockRow />);
    await screen.findByText(t.row);
    await fireEvent(toggle(), 'valueChange', true);
    expect(await screen.findByText(t.failed)).toBeTruthy();
    expect(toggle().props.value).toBe(false);
    expect(saved.has(BIOMETRIC_UNLOCK_KEY)).toBe(false);
  });

  it('desactivarlo borra la marca sin pedir biometría', async () => {
    phone({ enrolled: true });
    const saved = installMemorySecureStore({ [BIOMETRIC_UNLOCK_KEY]: '1' });
    await render(<BiometricUnlockRow />);
    await waitFor(() => expect(toggle().props.value).toBe(true));
    await fireEvent(toggle(), 'valueChange', false);
    await waitFor(() => expect(toggle().props.value).toBe(false));
    expect(saved.has(BIOMETRIC_UNLOCK_KEY)).toBe(false);
    expect(biometrics.authenticateAsync).not.toHaveBeenCalled();
  });
});
