import { fireEvent, render, screen } from '@testing-library/react-native';
import { esMX as t } from '@/i18n/es-MX';
import {
  AppText,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
} from './index';

describe('UI base', () => {
  it('muestra un botón accesible y responde al pulsarlo', async () => {
    const onPress = jest.fn();

    await render(<Button label={t.auth.signIn} onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: t.auth.signIn }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('muestra una insignia y las iniciales del avatar', async () => {
    await render(
      <>
        <Badge label={t.tools.status.available} tone="success" />
        <Avatar name="Mariana López" />
      </>,
    );

    expect(screen.getByText(t.tools.status.available)).toBeTruthy();
    expect(screen.getByText('ML')).toBeTruthy();
  });

  it('muestra el estado vacío y su acción', async () => {
    const onAction = jest.fn();

    await render(
      <EmptyState
        title={t.account.requestsTitle}
        message={t.account.requestsEmpty}
        actionLabel={t.common.retry}
        onAction={onAction}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: t.common.retry }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('muestra carga y error con reintento', async () => {
    const onRetry = jest.fn();

    await render(
      <>
        <LoadingState label={t.common.loading} />
        <ErrorState message={t.errors.unexpected} retryLabel={t.common.retry} onRetry={onRetry} />
      </>,
    );
    await fireEvent.press(screen.getByRole('button', { name: t.common.retry }));

    expect(screen.getByText(t.common.loading)).toBeTruthy();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('muestra una tarjeta pulsable', async () => {
    const onPress = jest.fn();

    await render(
      <Card onPress={onPress}>
        <AppText>{t.common.appName}</AppText>
      </Card>,
    );
    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
