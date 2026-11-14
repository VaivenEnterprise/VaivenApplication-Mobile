import { fireEvent, render, screen } from '@testing-library/react-native';
import { NotificationRow } from '@/features/notifications/components/NotificationRow';
import { UnreadBadge } from '@/features/notifications/components/UnreadBadge';
import { fakeNotification } from '@/test/fakeNotifications';

const NOW = new Date('2026-11-17T16:30:00Z');

describe('NotificationRow', () => {
  it('destaca un aviso sin leer con texto accesible, punto y toque', async () => {
    const onPress = jest.fn();
    const notification = fakeNotification();
    await render(<NotificationRow notification={notification} onPress={onPress} now={NOW} />);
    const row = screen.getByRole('button');
    expect(row.props.accessibilityLabel).toMatch(/^No leído\. Solicitud aceptada\./);
    expect(row.props.accessibilityLabel).toContain('hace 30 min');
    expect(screen.getByTestId('unread-dot')).toBeTruthy();
    expect(screen.getByText('hace 30 min')).toBeTruthy();
    await fireEvent.press(row);
    expect(onPress).toHaveBeenCalledWith(notification);
  });

  it('un aviso leído no lleva punto ni «No leído»', async () => {
    await render(
      <NotificationRow
        notification={fakeNotification({ readAt: '2026-11-17T16:10:00Z' })}
        onPress={jest.fn()}
        now={NOW}
      />,
    );
    expect(screen.queryByTestId('unread-dot')).toBeNull();
    expect(screen.getByRole('button').props.accessibilityLabel).not.toContain('No leído');
  });

  it.each([
    'booking_requested',
    'message_received',
    'delivery_confirmed',
    'incident_opened',
    'sanction_applied',
    'content_removed',
    'rating_received',
    'tipo_desconocido',
  ])('dibuja el tipo %s', async (type) => {
    await render(
      <NotificationRow notification={fakeNotification({ type })} onPress={jest.fn()} now={NOW} />,
    );
    expect(screen.getByText('Solicitud aceptada')).toBeTruthy();
  });
});

describe('UnreadBadge', () => {
  it('muestra el número con etiqueta accesible', async () => {
    await render(<UnreadBadge count={3} />);
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByLabelText('3 sin leer')).toBeTruthy();
  });

  it('topa en 99+', async () => {
    await render(<UnreadBadge count={250} />);
    expect(screen.getByText('99+')).toBeTruthy();
  });

  it('con 0 no dibuja nada', async () => {
    await render(<UnreadBadge count={0} />);
    expect(screen.toJSON()).toBeNull();
  });
});
