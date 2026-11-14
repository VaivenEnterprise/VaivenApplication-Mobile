import {
  BEFORE_SIGN_OUT_TIMEOUT_MS,
  registerBeforeSignOut,
  runBeforeSignOut,
} from '@/features/auth/signOutHooks';

afterEach(() => jest.useRealTimers());

describe('signOutHooks', () => {
  it('ejecuta las tareas registradas y espera a que terminen', async () => {
    const order: string[] = [];
    const off = registerBeforeSignOut(async () => {
      await Promise.resolve();
      order.push('tarea');
    });
    await runBeforeSignOut();
    order.push('fin');
    expect(order).toEqual(['tarea', 'fin']);
    off();
  });

  it('un fallo de una tarea no impide las demás ni lanza', async () => {
    const ok = jest.fn(async () => undefined);
    const offFail = registerBeforeSignOut(async () => {
      throw new Error('falló');
    });
    const offOk = registerBeforeSignOut(ok);
    await expect(runBeforeSignOut()).resolves.toBeUndefined();
    expect(ok).toHaveBeenCalledTimes(1);
    offFail();
    offOk();
  });

  it('no espera más del tiempo máximo a una tarea colgada', async () => {
    jest.useFakeTimers();
    const off = registerBeforeSignOut(() => new Promise<void>(() => undefined));
    let done = false;
    const run = runBeforeSignOut().then(() => {
      done = true;
    });
    await jest.advanceTimersByTimeAsync(BEFORE_SIGN_OUT_TIMEOUT_MS - 1);
    expect(done).toBe(false);
    await jest.advanceTimersByTimeAsync(2);
    await run;
    expect(done).toBe(true);
    off();
  });

  it('una tarea quitada ya no se ejecuta', async () => {
    const hook = jest.fn(async () => undefined);
    registerBeforeSignOut(hook)();
    await runBeforeSignOut();
    expect(hook).not.toHaveBeenCalled();
  });
});
