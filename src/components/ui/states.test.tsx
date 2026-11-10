import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { es } from '@/i18n/es-MX';
import { ApiError, API_ERROR_CODES } from '@/lib/api/errors';
import { Button } from './Button';
import { Card } from './Card';
import { Chip } from './Chip';
import { Divider } from './Divider';
import { ErrorState } from './ErrorState';
import { IconBadge } from './IconBadge';
import { LoadingState } from './LoadingState';

describe('Button', () => {
  it('tiene rol button, nombre accesible y llama onPress', async () => {
    const onPress = jest.fn();
    await render(<Button label="Entrar" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each(['primary', 'secondary', 'outline', 'danger', 'link'] as const)(
    'renderiza la variante %s con alto de 56',
    async (variant) => {
      await render(<Button label="Ok" variant={variant} icon="arrowForward" onPress={jest.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
      expect(button.props.style).toBeDefined();
    },
  );

  it('no llama onPress si está deshabilitado', async () => {
    const onPress = jest.fn();
    await render(<Button label="No" disabled onPress={onPress} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('cargando: queda ocupado, ignora pulsaciones y conserva el texto', async () => {
    const onPress = jest.fn();
    await render(<Button label="Enviar" loading icon="arrowForward" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Enviar' });
    expect(button).toBeBusy();
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByText('Enviar')).toBeTruthy();
  });

  it('usa accessibilityLabel cuando se da', async () => {
    await render(<Button label="Ir" accessibilityLabel="Ir al inicio" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Ir al inicio' })).toBeTruthy();
  });
});

describe('LoadingState', () => {
  it('anuncia el texto de carga por defecto', async () => {
    await render(<LoadingState />);
    expect(screen.getByLabelText(es.common.loading)).toBeTruthy();
    expect(screen.getByText(es.common.loading)).toBeTruthy();
  });

  it('admite otro texto y la variante de tarjeta', async () => {
    await render(<LoadingState label="Buscando" variant="card" />);
    expect(screen.getByLabelText('Buscando')).toBeTruthy();
  });
});

describe('ErrorState', () => {
  it.each(API_ERROR_CODES)('muestra el mensaje de i18n para %s', async (code) => {
    await render(
      <ErrorState
        error={new ApiError(code, 'texto del servidor', null, null)}
        onRetry={jest.fn()}
      />,
    );
    expect(screen.getByText(es.errors[code])).toBeTruthy();
    expect(screen.queryByText('texto del servidor')).toBeNull();
  });

  it('muestra el requestId y llama onRetry', async () => {
    const onRetry = jest.fn();
    await render(
      <ErrorState error={new ApiError('timeout', 'x', null, 'req-123')} onRetry={onRetry} />,
    );
    expect(screen.getByText('req-123')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: es.common.retry }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('usa el mensaje genérico con un error que no es ApiError o con null', async () => {
    await render(
      <>
        <ErrorState error={new Error('boom')} onRetry={jest.fn()} />
        <ErrorState error={null} onRetry={jest.fn()} />
      </>,
    );
    expect(screen.getAllByText(es.errors.unexpected)).toHaveLength(2);
    expect(screen.queryByText('boom')).toBeNull();
  });
});

describe('Card, Chip, IconBadge y Divider', () => {
  it('Card muestra su contenido en ambas variantes', async () => {
    await render(
      <>
        <Card>
          <Text>a</Text>
        </Card>
        <Card variant="muted">
          <Text>b</Text>
        </Card>
      </>,
    );
    expect(screen.getByText('a')).toBeTruthy();
    expect(screen.getByText('b')).toBeTruthy();
  });

  it('Chip muestra su texto, con y sin ícono', async () => {
    await render(
      <>
        <Chip label={es.diagnostics.badge} variant="warning" />
        <Chip label="Seguro" variant="success" icon="info" />
        <Chip label="Zona" />
      </>,
    );
    expect(screen.getByText(es.diagnostics.badge)).toBeTruthy();
    expect(screen.getByText('Seguro')).toBeTruthy();
    expect(screen.getByText('Zona')).toBeTruthy();
  });

  it('IconBadge renderiza todos los tonos y tamaños', async () => {
    await render(
      <>
        <IconBadge icon="compass" />
        <IconBadge icon="info" tone="secondary" size="lg" />
        <IconBadge icon="warning" tone="warning" />
        <IconBadge icon="cloudOffline" tone="danger" />
      </>,
    );
  });

  it('Divider muestra el texto central si lo hay', async () => {
    await render(
      <>
        <Divider />
        <Divider label="o" />
      </>,
    );
    expect(screen.getByText('o')).toBeTruthy();
  });
});
