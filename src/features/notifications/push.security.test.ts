import { runBeforeSignOut, registerBeforeSignOut } from '@/features/auth/signOutHooks';
import { hrefForData, hrefOrCenter } from '@/features/notifications/routing';
import { routes } from '@/lib/routes';

// Spec 016 · S-13 (OWASP M3 autorización, M4 validación de entradas): el contenido de una push
// no es de confianza; solo abre rutas conocidas y su baja corre antes de cerrar la sesión.

describe('S-13 · M4 · una push solo abre destinos conocidos', () => {
  it.each([
    ['null', null],
    ['texto', 'vaiven://admin'],
    ['número', 42],
    ['lista', ['incidentId', 'x']],
    ['objeto vacío', {}],
    ['ids vacíos', { incidentId: '  ', bookingId: '' }],
    ['ids no textuales', { bookingId: { $ne: null }, itemId: 7 }],
    ['claves desconocidas', { url: 'https://evil.example', screen: '/admin' }],
  ])('S-13a %s no produce ruta y cae en el centro de avisos', (_caso, data) => {
    expect(hrefForData(data)).toBeNull();
    expect(hrefOrCenter(data)).toBe(routes.notifications);
  });

  it('S-13b un id con caracteres de ruta se codifica y no sale de su segmento', () => {
    expect(hrefForData({ bookingId: '../admin?x=1' })).toBe(routes.booking('../admin?x=1'));
    expect(String(routes.booking('../admin?x=1'))).toBe('/reserva/..%2Fadmin%3Fx%3D1');
  });
});

describe('S-13 · M3 · baja del token de push al cerrar sesión', () => {
  it('S-13c la tarea registrada corre antes del cierre y se puede quitar', async () => {
    const tarea = jest.fn(async () => undefined);
    const quitar = registerBeforeSignOut(tarea);
    await runBeforeSignOut();
    expect(tarea).toHaveBeenCalledTimes(1);
    quitar();
    await runBeforeSignOut();
    expect(tarea).toHaveBeenCalledTimes(1);
  });

  it('S-13d una tarea colgada no deja el cierre de sesión esperando más del tiempo máximo', async () => {
    const quitar = registerBeforeSignOut(() => new Promise<void>(() => undefined));
    const inicio = Date.now();
    await runBeforeSignOut(50);
    quitar();
    expect(Date.now() - inicio).toBeLessThan(1000);
  });
});
