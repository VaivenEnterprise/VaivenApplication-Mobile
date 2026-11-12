/// <reference types="node" />
import { fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import path from 'node:path';
import { REFRESH_TOKEN_KEY } from '@/features/auth/session';
import { es } from '@/i18n/es-MX';
import { resetAuthInterceptor } from '@/lib/api/authInterceptor';
import { fakeTokens, fakeUser, installFakeApi, installMemorySecureStore, ok } from '@/test/fakeApi';
import { BOOKING_ID, fakeBooking, fakeQuote, fakeRequester } from '@/test/fakeBookings';
import { fakeCategories, fakeItem } from '@/test/fakeItems';

// Prueba de integración (spec 007 T011, qa-mobile) con el router real de la app: detalle del
// objeto → «Solicitar» → «Ver en Actividad» → (la misma reserva vista por el propietario) →
// «Aceptar» → aceptada, sin recargar. Una sola sesión no puede ser solicitante y propietario a la
// vez, así que el servidor falso cambia el rol con el que devuelve la reserva (CA-01, CA-04, CA-05,
// CA-06). Las dos mitades corren en la misma prueba para que el estado compartido sea el real.

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
  configResult: { ok: true, config: { apiBaseUrl: 'http://api.test', appEnv: 'development' } },
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ granted: false, canAskAgain: true }),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));
jest.mock('@/lib/format/date', () => ({
  ...jest.requireActual<typeof import('@/lib/format/date')>('@/lib/format/date'),
  todayYmd: () => '2026-11-11',
}));

// Con cobertura, el primer montaje del árbol completo de la app tarda más de 5 s en frío.
jest.setTimeout(30_000);

const APP_DIR = path.resolve(__dirname, '../../app');
const t = es.bookings;
const ITEM = fakeItem({
  id: 'item-1',
  title: 'Taladro percutor',
  owner: { ...fakeItem().owner, id: 'otra-persona' },
});

beforeEach(() => resetAuthInterceptor());
afterEach(() => jest.restoreAllMocks());

describe('solicitar y aceptar (integración)', () => {
  it('detalle → solicitar → Actividad → el propietario acepta → aceptada', async () => {
    installMemorySecureStore({ [REFRESH_TOKEN_KEY]: 'refresh-1' });
    // Estado del «servidor»: la reserva y desde qué punto de vista se devuelve.
    let booking = fakeBooking({ id: BOOKING_ID, item: { ...fakeBooking().item, id: ITEM.id } });
    let created = false;
    const bookingGets: string[] = [];
    const api = installFakeApi({
      'POST /auth/refresh': () => ok({ tokens: fakeTokens(2) }),
      'GET /me': () => ok(fakeUser),
      'GET /categories': () => ok(fakeCategories),
      'GET /items': () => ok({ items: [], nextCursor: null }),
      [`GET /items/${ITEM.id}`]: () => ok(ITEM),
      [`GET /items/${ITEM.id}/quote`]: () =>
        ok(
          fakeQuote({
            itemId: ITEM.id,
            startDate: '2026-11-12',
            endDate: '2026-11-12',
            days: 1,
            totalCents: 3000,
            payments: [{ stage: 'delivery', amountCents: 3000 }],
          }),
        ),
      'POST /bookings': () => {
        created = true;
        return { status: 201, body: booking };
      },
      'GET /me/bookings': () => ok({ items: created ? [booking] : [], nextCursor: null }),
      [`GET /bookings/${BOOKING_ID}`]: () => {
        bookingGets.push(booking.status);
        return ok(booking);
      },
      [`POST /bookings/${BOOKING_ID}/accept`]: () => {
        booking = { ...booking, status: 'accepted', updatedAt: '2026-11-11T19:00:00Z' };
        return ok(booking);
      },
    });

    await renderRouter(APP_DIR, { initialUrl: `/objeto/${ITEM.id}` });

    // 1. Detalle del objeto → «Solicitar» (CA-01).
    await fireEvent.press(await screen.findByLabelText(t.request.button));
    await waitFor(() => expect(screen).toHavePathname(`/solicitar/${ITEM.id}`));
    await fireEvent.press(await screen.findByLabelText(t.request.tomorrow));
    expect(await screen.findByLabelText('Total: $30.00')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(t.request.understandA11y));
    await waitFor(() =>
      expect(screen.getByLabelText(t.request.send).props.accessibilityState.disabled).toBeFalsy(),
    );
    await fireEvent.press(screen.getByLabelText(t.request.send));
    const post = api.calls.find((call) => call.method === 'POST' && call.path === '/bookings');
    expect(post?.body).toEqual({
      itemId: ITEM.id,
      startDate: '2026-11-12',
      endDate: '2026-11-12',
      paymentMode: 'full_on_delivery',
      acceptedTotalCents: 3000,
    });

    // 2. «Ver en Actividad»: aparece como solicitante y pendiente (CA-04).
    await fireEvent.press(await screen.findByText(t.request.seeActivity));
    await waitFor(() => expect(screen).toHavePathname('/actividad'));
    expect(await screen.findByText('Taladro percutor')).toBeTruthy();
    expect(screen.getByLabelText(t.activity.requester).props.accessibilityState.selected).toBe(
      true,
    );
    expect(screen.getByText('Pendiente')).toBeTruthy();

    // 3. Ahora la misma reserva la ve el propietario (otra sesión): pendiente con Aceptar/Rechazar (CA-05).
    booking = fakeBooking({
      id: BOOKING_ID,
      item: { ...fakeBooking().item, id: ITEM.id },
      viewerRole: 'owner',
      owner: { ...booking.owner, id: fakeUser.id },
      requester: fakeRequester,
    });
    // Otra sesión = otra app: se desmonta y se abre de nuevo directamente en la reserva.
    await screen.unmount();
    resetAuthInterceptor();
    installMemorySecureStore({ [REFRESH_TOKEN_KEY]: 'refresh-1' });
    await renderRouter(APP_DIR, { initialUrl: `/reserva/${BOOKING_ID}` });
    expect(await screen.findByLabelText(t.actions.accept)).toBeTruthy();
    expect(screen.getByLabelText(t.actions.reject)).toBeTruthy();
    expect(screen.queryByLabelText(t.actions.cancel)).toBeNull();

    // 4. Aceptar: el estado cambia sin recargar (CA-06).
    const getsBefore = bookingGets.length;
    await fireEvent.press(screen.getByLabelText(t.actions.accept));
    await fireEvent.press(
      within(screen.getByTestId('bottom-sheet')).getByLabelText(t.acceptSheet.confirm),
    );
    await waitFor(() => expect(screen.getAllByText('Aceptada').length).toBeGreaterThan(0));
    // La hoja se cierra un instante después de que el detalle ya cambió.
    await waitFor(() => expect(screen.queryByLabelText(t.actions.accept)).toBeNull());
    expect(bookingGets.length).toBe(getsBefore);
    expect(screen.getByLabelText(`${t.timeline.label}: ${t.timeline.accepted}`)).toBeTruthy();
  });

  it('el propietario no ve «Solicitar» en su propio objeto', async () => {
    installMemorySecureStore({ [REFRESH_TOKEN_KEY]: 'refresh-1' });
    const own = fakeItem({ id: 'item-2' });
    installFakeApi({
      'POST /auth/refresh': () => ok({ tokens: fakeTokens(2) }),
      'GET /me': () => ok(fakeUser),
      'GET /categories': () => ok(fakeCategories),
      'GET /items/item-2': () => ok(own),
    });
    await renderRouter(APP_DIR, { initialUrl: '/objeto/item-2' });
    expect(await screen.findByText(own.title)).toBeTruthy();
    expect(screen.queryByLabelText(t.request.button)).toBeNull();
  });
});
