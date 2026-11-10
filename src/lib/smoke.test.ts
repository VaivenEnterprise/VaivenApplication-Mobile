import { createElement } from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

describe('entorno de pruebas', () => {
  it('resuelve el alias @/ hacia src/', () => {
    // jest.mock falla si el alias no se puede resolver hacia un archivo real
    jest.mock('@/lib/smoke.test', () => ({ ok: true }));
    expect(jest.requireMock<{ ok: boolean }>('@/lib/smoke.test').ok).toBe(true);
  });

  it('renderiza componentes de React Native con RNTL', async () => {
    await render(createElement(Text, null, 'hola'));
    expect(screen.getByText('hola')).toBeTruthy();
  });
});
