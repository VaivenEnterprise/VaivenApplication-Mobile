import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { usePolling } from '@/features/chat/usePolling';

let mockFocused = true;
jest.mock('expo-router', () => ({ useIsFocused: () => mockFocused }));

let appStateHandler: ((state: AppStateStatus) => void) | null = null;
const remove = jest.fn();

function setAppState(state: AppStateStatus) {
  Object.defineProperty(AppState, 'currentState', { value: state, configurable: true });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockFocused = true;
  setAppState('active');
  remove.mockReset();
  appStateHandler = null;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
    appStateHandler = handler;
    return { remove } as unknown as ReturnType<typeof AppState.addEventListener>;
  });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const advance = (ms: number) =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
const goTo = (state: AppStateStatus) =>
  act(async () => {
    setAppState(state);
    appStateHandler?.(state);
    await Promise.resolve();
  });

describe('usePolling', () => {
  it('consulta al montar y luego cada intervalo con la app activa y la pantalla enfocada (CA-02)', async () => {
    const tick = jest.fn();
    await renderHook(() => usePolling(tick, 5_000));
    await advance(0);
    expect(tick).toHaveBeenCalledTimes(1);
    await advance(5_000);
    expect(tick).toHaveBeenCalledTimes(2);
    await advance(10_000);
    expect(tick).toHaveBeenCalledTimes(4);
  });

  it('con runOnMount en false espera al primer intervalo', async () => {
    const tick = jest.fn();
    await renderHook(() => usePolling(tick, 5_000, { runOnMount: false }));
    await advance(4_999);
    expect(tick).not.toHaveBeenCalled();
    await advance(1);
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it('en segundo plano no consulta y al volver consulta de inmediato (CA-03)', async () => {
    const tick = jest.fn();
    await renderHook(() => usePolling(tick, 5_000));
    await advance(0);
    expect(tick).toHaveBeenCalledTimes(1);
    await goTo('background');
    await advance(60_000);
    expect(tick).toHaveBeenCalledTimes(1);
    await goTo('active');
    expect(tick).toHaveBeenCalledTimes(2);
    await advance(5_000);
    expect(tick).toHaveBeenCalledTimes(3);
  });

  it('si la app arranca en segundo plano no consulta hasta activarse', async () => {
    setAppState('background');
    const tick = jest.fn();
    await renderHook(() => usePolling(tick, 5_000));
    await advance(30_000);
    expect(tick).not.toHaveBeenCalled();
    await goTo('active');
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it('inactiva (p. ej. cambiando de app en iOS) cuenta como segundo plano; un estado desconocido, como activo', async () => {
    const tick = jest.fn();
    await renderHook(() => usePolling(tick, 5_000, { runOnMount: false }));
    await goTo('inactive');
    await advance(30_000);
    expect(tick).not.toHaveBeenCalled();
    await goTo('unknown');
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it('con la pantalla desenfocada no consulta y al enfocar consulta de inmediato', async () => {
    const tick = jest.fn();
    const { rerender } = await renderHook(() => usePolling(tick, 5_000, { runOnMount: false }));
    mockFocused = false;
    await rerender({});
    await advance(30_000);
    expect(tick).not.toHaveBeenCalled();
    mockFocused = true;
    await rerender({});
    await advance(0);
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it('con enabled en false no consulta', async () => {
    const tick = jest.fn();
    await renderHook(() => usePolling(tick, 5_000, { enabled: false }));
    await advance(30_000);
    expect(tick).not.toHaveBeenCalled();
  });

  it('no encima consultas: si la anterior no terminó se salta el ciclo', async () => {
    let finish: () => void = () => undefined;
    const tick = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    await renderHook(() => usePolling(tick, 5_000));
    await advance(20_000);
    expect(tick).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish();
      await Promise.resolve();
    });
    await advance(5_000);
    expect(tick).toHaveBeenCalledTimes(2);
  });

  it('un fallo no detiene el ciclo', async () => {
    const tick = jest.fn().mockRejectedValueOnce(new Error('sin red')).mockResolvedValue(undefined);
    await renderHook(() => usePolling(tick, 5_000));
    await advance(0);
    await advance(5_000);
    expect(tick).toHaveBeenCalledTimes(2);
  });

  it('usa siempre la última función de consulta', async () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = await renderHook(
      ({ fn }: { fn: () => void }) => usePolling(fn, 5_000, { runOnMount: false }),
      {
        initialProps: { fn: first },
      },
    );
    await rerender({ fn: second });
    await advance(5_000);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('al desmontar detiene el ciclo y suelta la suscripción', async () => {
    const tick = jest.fn();
    const { unmount } = await renderHook(() => usePolling(tick, 5_000));
    await advance(0);
    await unmount();
    await advance(30_000);
    expect(tick).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalled();
  });
});
