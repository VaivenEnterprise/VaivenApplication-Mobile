import { routes } from '@/lib/routes';

describe('routes', () => {
  it('expone las rutas de pestañas y de autenticación', () => {
    expect(routes.login).toBe('/login');
    expect(routes.register).toBe('/register');
    expect(routes.home).toBe('/inicio');
    expect(routes.editProfile).toBe('/perfil/editar');
    expect(routes.newItem).toBe('/mis-objetos/nuevo');
  });

  it('arma las rutas dinámicas escapando el identificador', () => {
    expect(routes.item('abc')).toBe('/objeto/abc');
    expect(routes.user('a/b')).toBe('/usuario/a%2Fb');
    expect(routes.project('p 1')).toBe('/proyecto/p%201');
    expect(routes.request('abc')).toBe('/solicitar/abc');
    expect(routes.booking('a/b')).toBe('/reserva/a%2Fb');
    expect(routes.editItem('a/b')).toBe('/mis-objetos/a%2Fb/editar');
  });
});
