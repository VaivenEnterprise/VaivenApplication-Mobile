import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { es } from '@/i18n/es-MX';
import { AppErrorBoundary } from './AppErrorBoundary';

let shouldThrow = true;

function Bomb() {
  if (shouldThrow) throw new Error('dato-personal@correo.com');
  return <Text>todo bien</Text>;
}

describe('AppErrorBoundary', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    shouldThrow = true;
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('muestra a sus hijos cuando no hay error', async () => {
    shouldThrow = false;
    await render(
      <AppErrorBoundary>
        <Bomb />
      </AppErrorBoundary>,
    );
    expect(screen.getByText('todo bien')).toBeTruthy();
  });

  it('captura un error de render y muestra el mensaje en español (CA-08)', async () => {
    await render(
      <AppErrorBoundary>
        <Bomb />
      </AppErrorBoundary>,
    );
    expect(screen.getByText(es.errors.unexpected)).toBeTruthy();
    expect(screen.queryByText('todo bien')).toBeNull();
  });

  it('registra solo el tipo de error, sin su mensaje', async () => {
    await render(
      <AppErrorBoundary>
        <Bomb />
      </AppErrorBoundary>,
    );
    expect(screen.queryByText(/dato-personal/)).toBeNull();
    expect(consoleError).toHaveBeenCalledWith('[AppErrorBoundary] Error');
  });

  it('permite reintentar y recupera la pantalla', async () => {
    await render(
      <AppErrorBoundary>
        <Bomb />
      </AppErrorBoundary>,
    );
    shouldThrow = false;
    await fireEvent.press(screen.getByRole('button', { name: es.common.retry }));
    expect(screen.getByText('todo bien')).toBeTruthy();
  });
});
