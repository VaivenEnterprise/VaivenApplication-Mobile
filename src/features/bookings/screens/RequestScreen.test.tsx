import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { RequestScreen } from '@/features/bookings/screens/RequestScreen';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { ITEM_ID, fakeBooking, fakeQuote } from '@/test/fakeBookings';
import { fakeItem as baseItem } from '@/test/fakeItems';

const mockBack = jest.fn();
const mockDismissTo = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, dismissTo: mockDismissTo, push: jest.fn() }),
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({
    status: 'signedIn',
    user: { ...jest.requireActual('@/test/fakeApi').fakeUser },
  }),
}));
jest.mock('@/lib/format/date', () => ({
  ...jest.requireActual<typeof import('@/lib/format/date')>('@/lib/format/date'),
  todayYmd: () => '2026-11-11',
}));
jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) =>
      createElement(View as unknown as React.ComponentType<Record<string, unknown>>, {
        testID: props.testID as string | undefined,
        onChange: props.onChange,
      }),
    DateTimePickerAndroid: { open: jest.fn() },
  };
});

const t = es.bookings.request;
const from = new RegExp(`^${es.search.filters.from}`);
const to = new RegExp(`^${es.search.filters.to}`);

beforeEach(() => {
  mockBack.mockReset();
  mockDismissTo.mockReset();
});
afterEach(() => jest.restoreAllMocks());

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RequestScreen itemId={ITEM_ID} />
    </QueryClientProvider>,
  );
}

async function pickDate(label: RegExp, date: Date) {
  await fireEvent.press(await screen.findByLabelText(label));
  await fireEvent(screen.getByTestId('date-picker'), 'onChange', {}, date);
}

/** Elige del 12 al 14 de noviembre de 2026. */
async function pickThreeDays() {
  await pickDate(from, new Date(2026, 10, 12, 12));
  await pickDate(to, new Date(2026, 10, 14, 12));
}

/** Un objeto ajeno: el de `fakeItem` pertenece a la persona de la sesión. */
const fakeItem = (over: Parameters<typeof baseItem>[0] = {}) =>
  baseItem({ owner: { ...baseItem().owner, id: 'otra-persona' }, ...over });

const itemRoute = `GET /items/${ITEM_ID}`;
const quoteRoute = `GET /items/${ITEM_ID}/quote`;

describe('RequestScreen · solicitar', () => {
  it('CA-01: un periodo de 3 días muestra el resumen con el total del servidor', async () => {
    const api = installFakeApi({
      [itemRoute]: () => ok(fakeItem()),
      [quoteRoute]: () => ok(fakeQuote()),
    });
    await renderScreen();
    await pickThreeDays();
    expect(await screen.findByLabelText('Total: $90.00')).toBeTruthy();
    expect(screen.getByLabelText(/^3 días × \$30\.00/)).toBeTruthy();
    expect(screen.getByText(t.expiresIn)).toBeTruthy();
    expect(screen.getByText(/afectar tu reputación/)).toBeTruthy();
    const quoteCall = api.calls.find((c) => c.path.endsWith('/quote'));
    const params = new URLSearchParams(quoteCall?.query);
    expect(params.get('startDate')).toBe('2026-11-12');
    expect(params.get('endDate')).toBe('2026-11-14');
    expect(params.get('paymentMode')).toBe('full_on_delivery');
  });

  it('envía con «Entiendo» y el total aceptado, y ofrece ir a Actividad', async () => {
    const api = installFakeApi({
      [itemRoute]: () => ok(fakeItem()),
      [quoteRoute]: () => ok(fakeQuote()),
      'POST /bookings': () => ({ status: 201, body: fakeBooking() }),
    });
    await renderScreen();
    await pickThreeDays();
    await screen.findByLabelText('Total: $90.00');
    const send = screen.getByLabelText(t.send);
    expect(send.props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByLabelText(t.understandA11y));
    await waitFor(() =>
      expect(screen.getByLabelText(t.send).props.accessibilityState.disabled).toBeFalsy(),
    );
    await fireEvent.press(screen.getByLabelText(t.send));
    expect(await screen.findByText(t.successTitle)).toBeTruthy();
    const post = api.calls.find((c) => c.method === 'POST');
    expect(post?.body).toEqual({
      itemId: ITEM_ID,
      startDate: '2026-11-12',
      endDate: '2026-11-14',
      paymentMode: 'full_on_delivery',
      acceptedTotalCents: 9000,
    });
    await fireEvent.press(screen.getByText(t.seeActivity));
    expect(mockDismissTo).toHaveBeenCalledWith(routes.activity);
    await fireEvent.press(screen.getByText(t.keepBrowsing));
    expect(mockBack).toHaveBeenCalled();
  });

  it('un préstamo no pide forma de pago y cotiza sin pago', async () => {
    const api = installFakeApi({
      [itemRoute]: () => ok(fakeItem({ modality: 'loan', pricePerDayCents: 0 })),
      [quoteRoute]: () =>
        ok(
          fakeQuote({
            modality: 'loan',
            totalCents: 0,
            pricePerDayCents: 0,
            paymentMode: 'none',
            payments: [],
          }),
        ),
    });
    await renderScreen();
    await pickThreeDays();
    expect(await screen.findByLabelText('Total: Gratis')).toBeTruthy();
    expect(screen.queryByText(t.how)).toBeNull();
    const params = new URLSearchParams(api.calls.find((c) => c.path.endsWith('/quote'))?.query);
    expect(params.get('paymentMode')).toBe('none');
  });

  it('cambiar la forma de pago cotiza otra vez con 50 % + 50 %', async () => {
    const api = installFakeApi({
      [itemRoute]: () => ok(fakeItem()),
      [quoteRoute]: ({ query }) =>
        ok(
          query.includes('split_50_50')
            ? fakeQuote({
                paymentMode: 'split_50_50',
                payments: [
                  { stage: 'delivery', amountCents: 4500 },
                  { stage: 'return', amountCents: 4500 },
                ],
              })
            : fakeQuote(),
        ),
    });
    await renderScreen();
    await pickThreeDays();
    await screen.findByLabelText('Total: $90.00');
    await fireEvent.press(
      screen.getByLabelText(
        `${es.bookings.paymentMode.split_50_50}. ${es.bookings.paymentModeHint.split_50_50}`,
      ),
    );
    expect(await screen.findByLabelText('Al devolver: $45.00')).toBeTruthy();
    expect(api.calls.filter((c) => c.path.endsWith('/quote')).length).toBeGreaterThanOrEqual(2);
  });

  it('CA-02: con más de 7 días avisa y no cotiza ni deja enviar', async () => {
    const api = installFakeApi({
      [itemRoute]: () => ok(fakeItem()),
      [quoteRoute]: () => ok(fakeQuote()),
    });
    await renderScreen();
    await pickDate(from, new Date(2026, 10, 12, 12));
    // El calendario real limita el fin; aquí se fuerza con atajos y valores fuera de rango.
    await fireEvent.press(screen.getByLabelText(to));
    await fireEvent(screen.getByTestId('date-picker'), 'onChange', {}, new Date(2026, 10, 19, 12));
    expect(await screen.findByText(es.search.filters.rangeTooLong)).toBeTruthy();
    expect(screen.getByText(t.quoteNeedsDates)).toBeTruthy();
    expect(api.calls.some((c) => c.path.endsWith('/quote'))).toBe(false);
    expect(screen.getByLabelText(t.send).props.accessibilityState.disabled).toBe(true);
  });

  it('CA-03: si el precio cambió avisa, cotiza de nuevo y pide aceptar otra vez', async () => {
    let total = 9000;
    const api = installFakeApi({
      [itemRoute]: () => ok(fakeItem()),
      [quoteRoute]: () =>
        ok(fakeQuote({ totalCents: total, payments: [{ stage: 'delivery', amountCents: total }] })),
      'POST /bookings': () => {
        total = 10_500;
        return failure(409, 'conflict', [{ field: 'acceptedTotalCents', issue: 'quote_changed' }]);
      },
    });
    await renderScreen();
    await pickThreeDays();
    await screen.findByLabelText('Total: $90.00');
    await fireEvent.press(screen.getByLabelText(t.understandA11y));
    await waitFor(() =>
      expect(screen.getByLabelText(t.send).props.accessibilityState.disabled).toBeFalsy(),
    );
    await fireEvent.press(screen.getByLabelText(t.send));
    expect(await screen.findByText(`${t.priceChangedTitle}. ${t.priceChangedBody}`)).toBeTruthy();
    expect(await screen.findByLabelText('Total: $105.00')).toBeTruthy();
    expect(screen.getByLabelText(t.understandA11y).props.accessibilityState.checked).toBe(false);
    expect(screen.getByLabelText(t.send).props.accessibilityState.disabled).toBe(true);
    expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(1);
  });

  it('un cruce de fechas (409) pide elegir otras', async () => {
    installFakeApi({
      [itemRoute]: () => ok(fakeItem()),
      [quoteRoute]: () => ok(fakeQuote()),
      'POST /bookings': () => failure(409, 'conflict'),
    });
    await renderScreen();
    await pickThreeDays();
    await screen.findByLabelText('Total: $90.00');
    await fireEvent.press(screen.getByLabelText(t.understandA11y));
    await waitFor(() =>
      expect(screen.getByLabelText(t.send).props.accessibilityState.disabled).toBeFalsy(),
    );
    await fireEvent.press(screen.getByLabelText(t.send));
    expect(await screen.findByText(`${t.datesTakenTitle}. ${t.datesTakenBody}`)).toBeTruthy();
  });

  it('otro error del servidor se muestra con el texto del código', async () => {
    installFakeApi({
      [itemRoute]: () => ok(fakeItem()),
      [quoteRoute]: () => ok(fakeQuote()),
      'POST /bookings': () => failure(503, 'service_unavailable'),
    });
    await renderScreen();
    await pickThreeDays();
    await screen.findByLabelText('Total: $90.00');
    await fireEvent.press(screen.getByLabelText(t.understandA11y));
    await waitFor(() =>
      expect(screen.getByLabelText(t.send).props.accessibilityState.disabled).toBeFalsy(),
    );
    await fireEvent.press(screen.getByLabelText(t.send));
    expect(await screen.findByText(es.errors.service_unavailable)).toBeTruthy();
  });

  it('no deja solicitar un objeto propio ni uno pausado', async () => {
    installFakeApi({
      [itemRoute]: () =>
        ok(
          fakeItem({
            owner: { ...fakeItem().owner, id: jest.requireActual('@/test/fakeApi').fakeUser.id },
          }),
        ),
    });
    const own = await renderScreen();
    expect(await screen.findByText(t.ownItem)).toBeTruthy();
    expect(screen.queryByLabelText(t.send)).toBeNull();
    await own.unmount();

    installFakeApi({ [itemRoute]: () => ok(fakeItem({ status: 'paused' })) });
    await renderScreen();
    expect(await screen.findByText(t.notActive)).toBeTruthy();
  });

  it('si el objeto no carga ofrece reintentar', async () => {
    installFakeApi({ [itemRoute]: () => failure(500, 'internal_error') });
    await renderScreen();
    expect(await screen.findByText(es.errors.internal_error)).toBeTruthy();
  });

  it('«Cerrar» vuelve al detalle', async () => {
    installFakeApi({ [itemRoute]: () => ok(fakeItem()) });
    await renderScreen();
    await fireEvent.press((await screen.findAllByLabelText(es.ui.close))[0]!);
    expect(mockBack).toHaveBeenCalled();
  });
});
