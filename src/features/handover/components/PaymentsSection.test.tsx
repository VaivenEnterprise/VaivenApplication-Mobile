import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PaymentsSection, paymentAction } from '@/features/handover/components/PaymentsSection';
import { es } from '@/i18n/es-MX';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { BOOKING_ID, fakeBooking } from '@/test/fakeBookings';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.setTimeout(30_000);

const t = es.handover.payments;
const BASE = `/bookings/${BOOKING_ID}/payments`;
const delivery = { stage: 'delivery' as const, amountCents: 4500, status: 'pending' as const };
const back = { stage: 'return' as const, amountCents: 4500, status: 'pending' as const };

function show(over = {}) {
  const booking = fakeBooking({ status: 'accepted', payments: [delivery, back], ...over });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PaymentsSection booking={booking} />
    </QueryClientProvider>,
  );
}

beforeEach(() => jest.restoreAllMocks());

describe('paymentAction', () => {
  it.each([
    ['requester', 'pending', 'report'],
    ['requester', 'reported', null],
    ['requester', 'confirmed', null],
    ['owner', 'pending', null],
    ['owner', 'reported', 'confirm'],
    ['owner', 'confirmed', null],
    ['admin', 'pending', null],
    ['admin', 'reported', null],
  ] as const)('%s con pago %s → %s', (role, status, expected) => {
    expect(paymentAction(role, status)).toBe(expected);
  });
});

describe('PaymentsSection', () => {
  it('muestra el monto y el estado de cada etapa y la aclaración de que no se procesan pagos', async () => {
    await show({ viewerRole: 'owner' });
    expect(screen.getByText(`${t.delivery} $45.00`)).toBeTruthy();
    expect(screen.getByText(`${t.return} $45.00`)).toBeTruthy();
    expect(screen.getAllByText(t.pending)).toHaveLength(2);
    expect(screen.getByText(t.notice)).toBeTruthy();
  });

  it('el solicitante reporta el pago de una etapa (CA-06)', async () => {
    const api = installFakeApi({
      [`POST ${BASE}/delivery/report`]: () =>
        ok(
          fakeBooking({
            status: 'accepted',
            payments: [{ ...delivery, status: 'reported' }, back],
          }),
        ),
    });
    await show({ viewerRole: 'requester' });
    expect(screen.queryByText(t.confirm)).toBeNull();
    await fireEvent.press(screen.getAllByText(t.report)[0]!);
    await waitFor(() => expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(1));
    expect(api.calls[0]?.path).toBe(`${BASE}/delivery/report`);
  });

  it('el propietario confirma solo un pago ya reportado (CA-06)', async () => {
    const api = installFakeApi({
      [`POST ${BASE}/delivery/confirm`]: () => ok(fakeBooking({ status: 'accepted' })),
    });
    await show({ viewerRole: 'owner', payments: [{ ...delivery, status: 'reported' }, back] });
    expect(screen.getByText(t.reported)).toBeTruthy();
    expect(screen.queryByText(t.report)).toBeNull();
    await fireEvent.press(screen.getByText(t.confirm));
    await waitFor(() => expect(api.calls.at(-1)?.path).toBe(`${BASE}/delivery/confirm`));
  });

  it('un pago confirmado no ofrece acciones', async () => {
    await show({ viewerRole: 'owner', payments: [{ ...delivery, status: 'confirmed' }] });
    expect(screen.getByText(t.confirmed)).toBeTruthy();
    expect(screen.queryByText(t.confirm)).toBeNull();
    expect(screen.queryByText(t.report)).toBeNull();
  });

  it('sin estado del servidor trata el pago como pendiente', async () => {
    await show({ viewerRole: 'requester', payments: [{ stage: 'delivery', amountCents: 9000 }] });
    expect(screen.getByText(t.pending)).toBeTruthy();
    expect(screen.getByText(t.report)).toBeTruthy();
  });

  it('si falla muestra el mensaje y deja reintentar', async () => {
    installFakeApi({ [`POST ${BASE}/delivery/report`]: () => failure(409, 'conflict') });
    await show({ viewerRole: 'requester' });
    await fireEvent.press(screen.getAllByText(t.report)[0]!);
    expect(await screen.findByText(t.failed)).toBeTruthy();
    expect(screen.getAllByText(t.report).length).toBeGreaterThan(0);
  });

  it('no aparece sin pagos ni fuera de las etapas de entrega', async () => {
    const view = await show({ payments: [] });
    expect(screen.queryByText(t.title)).toBeNull();
    await view.unmount();
    await show({ status: 'pending' });
    expect(screen.queryByText(t.title)).toBeNull();
  });
});
