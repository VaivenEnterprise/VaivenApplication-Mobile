import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { RestoringScreen } from '@/features/auth/screens/RestoringScreen';
import { SessionContext, type SessionValue } from '@/features/auth/session';
import { es } from '@/i18n/es-MX';

jest.setTimeout(30_000);

describe('RestoringScreen (spec 003 §7.12)', () => {
  it('muestra un indicador accesible de progreso con la etiqueta de restauración', async () => {
    await render(<RestoringScreen />);
    expect(screen.getByRole('progressbar', { name: es.auth.restoring })).toBeTruthy();
  });

  it('no muestra texto visible ni botones mientras restaura la sesión', async () => {
    await render(<RestoringScreen />);
    expect(screen.queryByText(es.auth.restoring)).toBeNull();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});

// Spec 021-T014 (RF-13, B-5): sin red al arrancar, la sesión guardada espera; no hay login.
describe('RestoringScreen sin conexión (021-T014)', () => {
  function renderWith(restoreOffline: boolean) {
    const retryRestore = jest.fn();
    const value = { status: 'loading', restoreOffline, retryRestore } as unknown as SessionValue;
    return {
      retryRestore,
      view: render(
        <SessionContext.Provider value={value}>
          <RestoringScreen />
        </SessionContext.Provider>,
      ),
    };
  }

  it('explica que no hay conexión y que la sesión sigue guardada, sin pedir credenciales', async () => {
    const { view } = renderWith(true);
    await view;
    expect(screen.getByRole('header', { name: es.auth.restoreOffline.title })).toBeTruthy();
    expect(screen.getByText(es.auth.restoreOffline.description)).toBeTruthy();
    expect(screen.queryByText(es.auth.login.email)).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('«Reintentar» vuelve a intentar restaurar la sesión', async () => {
    const { view, retryRestore } = renderWith(true);
    await view;
    await fireEvent.press(screen.getByRole('button', { name: es.common.retry }));
    expect(retryRestore).toHaveBeenCalledTimes(1);
  });

  it('reintenta solo al volver la app a primer plano y deja de escuchar al desmontar', async () => {
    const listeners: ((state: AppStateStatus) => void)[] = [];
    const remove = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      listeners.push(listener);
      return { remove };
    });
    const { view, retryRestore } = renderWith(true);
    const { unmount } = await view;
    listeners.forEach((listener) => listener('background'));
    expect(retryRestore).not.toHaveBeenCalled();
    listeners.forEach((listener) => listener('active'));
    expect(retryRestore).toHaveBeenCalledTimes(1);
    await unmount();
    expect(remove).toHaveBeenCalled();
  });

  it('mientras aún restaura (con red) solo muestra el indicador', async () => {
    const { view } = renderWith(false);
    await view;
    expect(screen.getByRole('progressbar', { name: es.auth.restoring })).toBeTruthy();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
