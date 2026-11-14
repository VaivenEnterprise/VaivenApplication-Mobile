/// <reference types="node" />
import { fireEvent, renderRouter, screen, testRouter, waitFor } from 'expo-router/testing-library';
import path from 'node:path';
import { REFRESH_TOKEN_KEY } from '@/features/auth/session';
import type { Incident } from '@/features/incidents/types';
import type { Rating } from '@/features/ratings/types';
import { es } from '@/i18n/es-MX';
import { resetAuthInterceptor } from '@/lib/api/authInterceptor';
import {
  fakeTokens,
  fakeUser,
  installFakeApi,
  installMemorySecureStore,
  ok,
  type FakeHandler,
} from '@/test/fakeApi';
import { BOOKING_ID, fakeBooking } from '@/test/fakeBookings';
import { fakeOwner } from '@/test/fakeItems';
import { INCIDENT_ID, fakeIncident, fakeRating, fakeRatingStatus } from '@/test/fakeTrust';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
  configResult: { ok: true, config: { apiBaseUrl: 'http://api.test', appEnv: 'development' } },
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
// La subida de fotos tiene sus propias pruebas (spec 004).
jest.mock('@/features/images', () => ({
  useImageUpload: () => ({ items: [], refs: [], isUploading: false, hasErrors: false }),
  PhotoPicker: () => null,
  RemoteImage: () => null,
}));

// Con cobertura, el primer montaje del árbol completo de la app tarda más de 5 s en frío
// (mismo criterio que en bookings, search y chat).
jest.setTimeout(30_000);

const APP_DIR = path.resolve(__dirname, '..', '..', 'app');
const tr = es.ratings;
const ti = es.incidents;

/** Un servidor mínimo de confianza: guarda la calificación y las incidencias que se crean. */
function createTrustServer(booking: ReturnType<typeof fakeBooking>) {
  const state = {
    rating: null as Rating | null,
    incidents: [] as Incident[],
    posts: [] as unknown[],
  };
  const handlers: Record<string, FakeHandler> = {
    'POST /auth/refresh': () => ok({ tokens: fakeTokens(2) }),
    'GET /me': () => ok(fakeUser),
    'GET /items': () => ok({ items: [], nextCursor: null }),
    'GET /categories': () => ok([]),
    'GET /me/bookings': () => ok({ items: [], nextCursor: null }),
    'GET /conversations': () => ok({ items: [], nextCursor: null }),
    'GET /conversations/unread-count': () => ok({ count: 0 }),
    [`GET /bookings/${booking.id}`]: () => ok(booking),
    [`GET /bookings/${booking.id}/rating-status`]: () =>
      ok(
        state.rating === null
          ? fakeRatingStatus()
          : fakeRatingStatus({ canRate: false, myRating: state.rating }),
      ),
    [`POST /bookings/${booking.id}/ratings`]: (r) => {
      state.posts.push(r.body);
      const body = r.body as { score: number; comment?: string };
      state.rating = fakeRating({ score: body.score, comment: body.comment ?? null });
      return { status: 201, body: state.rating };
    },
    [`GET /users/${fakeOwner.id}`]: () =>
      ok({
        ...fakeOwner,
        ratingAverage: state.rating === null ? null : state.rating.score,
        ratingCount: state.rating === null ? 0 : 1,
      }),
    [`GET /users/${fakeOwner.id}/ratings`]: () =>
      ok({ items: state.rating === null ? [] : [state.rating], nextCursor: null }),
    [`POST /bookings/${booking.id}/incidents`]: (r) => {
      state.posts.push(r.body);
      const body = r.body as { reason: Incident['reason']; description: string };
      const incident = fakeIncident({ reason: body.reason, description: body.description });
      state.incidents.push(incident);
      return { status: 201, body: incident };
    },
    [`GET /incidents/${INCIDENT_ID}`]: () => ok(state.incidents[0] ?? fakeIncident()),
    'GET /me/incidents': () => ok({ items: state.incidents, nextCursor: null }),
  };
  return { state, handlers };
}

beforeEach(() => resetAuthInterceptor());
afterEach(() => jest.restoreAllMocks());

async function openApp(handlers: Record<string, FakeHandler>) {
  installMemorySecureStore({ [REFRESH_TOKEN_KEY]: 'refresh-1' });
  const api = installFakeApi(handlers);
  await renderRouter(APP_DIR);
  await waitFor(() => expect(screen.getAllByRole('tab').length).toBeGreaterThan(0));
  return api;
}

describe('confianza de punta a punta (T012, CA-01…CA-06)', () => {
  it('reserva concluida → calificar → ver la reputación (CA-01, CA-03)', async () => {
    const booking = fakeBooking({ status: 'completed', viewerRole: 'requester' });
    const { state, handlers } = createTrustServer(booking);
    await openApp(handlers);

    await testRouter.navigate(`/reserva/${BOOKING_ID}`);
    expect(await screen.findByText(`${tr.card.prompt} Ana López`)).toBeTruthy();

    // 4 estrellas abren la hoja con chips positivos (CA-07); al enviar, el comentario lleva los chips (CA-08).
    await fireEvent.press(screen.getByLabelText(`4 ${es.ui.outOfFive}`));
    await fireEvent.press(await screen.findByText('Puntual'));
    await fireEvent.press(screen.getByText(tr.sheet.send));
    expect(await screen.findByText(tr.sheet.thanks)).toBeTruthy();
    expect(state.posts[0]).toEqual({ score: 4, comment: 'Puntual' });

    await fireEvent.press(screen.getByText(tr.sheet.done));
    expect(await screen.findByText(tr.card.yourRating)).toBeTruthy();

    // La reputación de la otra persona ya muestra la calificación (CA-03).
    await testRouter.navigate(`/usuario/${fakeOwner.id}`);
    await waitFor(() => expect(screen).toHavePathname(`/usuario/${fakeOwner.id}`));
    expect(await screen.findByText('4.0')).toBeTruthy();
    expect(await screen.findByText(`1 ${tr.reputation.ratingOne}`)).toBeTruthy();
    expect(await screen.findByText('Puntual')).toBeTruthy();
  });

  it('el perfil de alguien sin calificaciones dice «Aún sin calificaciones»', async () => {
    const booking = fakeBooking({ status: 'completed', viewerRole: 'requester' });
    const { handlers } = createTrustServer(booking);
    await openApp(handlers);
    await testRouter.navigate(`/usuario/${fakeOwner.id}`);
    expect(await screen.findByText(tr.reputation.empty)).toBeTruthy();
  });

  it('reportar una incidencia → aparece abierta en «Mis incidencias» (CA-04)', async () => {
    const booking = fakeBooking({ status: 'accepted', viewerRole: 'requester' });
    const { state, handlers } = createTrustServer(booking);
    await openApp(handlers);

    await testRouter.navigate(`/reserva/${BOOKING_ID}`);
    await fireEvent.press(await screen.findByText(ti.section.action));
    await waitFor(() => expect(screen).toHavePathname(`/incidencia/nueva/${BOOKING_ID}`));

    await fireEvent.press(await screen.findByLabelText(ti.reasons.damaged.name));
    await fireEvent.changeText(
      screen.getByLabelText(ti.report.description),
      'El objeto regresó con la tapa rota.',
    );
    await fireEvent.press(screen.getByText(ti.report.send));

    await waitFor(() => expect(screen).toHavePathname(`/incidencia/${INCIDENT_ID}`));
    expect(await screen.findByText(ti.reasons.damaged.name)).toBeTruthy();
    expect(screen.getAllByText(ti.status.open).length).toBeGreaterThan(0);
    expect(state.posts[0]).toEqual({
      reason: 'damaged',
      description: 'El objeto regresó con la tapa rota.',
    });

    await testRouter.navigate('/incidencias');
    expect(await screen.findByText(ti.reasons.damaged.name)).toBeTruthy();
    expect(screen.getByText(ti.status.open)).toBeTruthy();
  });

  it('«Mis incidencias» se abre desde el perfil propio', async () => {
    const booking = fakeBooking({ status: 'accepted', viewerRole: 'requester' });
    const { handlers } = createTrustServer(booking);
    await openApp(handlers);
    await testRouter.navigate('/perfil');
    await fireEvent.press(await screen.findByText(ti.profileRow));
    await waitFor(() => expect(screen).toHavePathname('/incidencias'));
    expect(await screen.findByText(ti.list.emptyTitle)).toBeTruthy();
  });

  it('una reserva rechazada no ofrece «Reportar incidencia» ni «Calificar» (CA-06)', async () => {
    const booking = fakeBooking({ status: 'rejected', viewerRole: 'requester' });
    const { handlers } = createTrustServer(booking);
    await openApp(handlers);
    await testRouter.navigate(`/reserva/${BOOKING_ID}`);
    expect(await screen.findByText('Taladro percutor')).toBeTruthy();
    expect(screen.queryByText(ti.section.action)).toBeNull();
    expect(screen.queryByText(`${tr.card.prompt} Ana López`)).toBeNull();
  });
});
