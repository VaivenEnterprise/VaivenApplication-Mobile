import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { RateBookingCard } from '@/features/ratings/components/RateBookingCard';
import { RatingCard } from '@/features/ratings/components/RatingCard';
import { RatingSummary } from '@/features/ratings/components/RatingSummary';
import { ReputationSection } from '@/features/ratings/components/ReputationSection';
import { es } from '@/i18n/es-MX';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { BOOKING_ID, fakeBooking } from '@/test/fakeBookings';
import { fakeRating, fakeRatingStatus } from '@/test/fakeTrust';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.setTimeout(30_000);

const t = es.ratings;
const POST = `POST /bookings/${BOOKING_ID}/ratings`;
const STATUS = `GET /bookings/${BOOKING_ID}/rating-status`;
const USER_ID = '6730f1c2a9b3e4d5f6a7b8c9';

function withClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => jest.restoreAllMocks());

describe('RatingSummary', () => {
  it('muestra el promedio con un decimal y la cantidad', async () => {
    await render(<RatingSummary average={4.857} count={18} />);
    expect(screen.getByText('4.9 · 18')).toBeTruthy();
    expect(
      screen.getByLabelText(`${t.summary.a11y} 4.9 ${t.summary.outOf}, 18 ${t.summary.count}`),
    ).toBeTruthy();
  });

  it('sin calificaciones dice «Sin calificaciones», no «0» (P-05)', async () => {
    await render(<RatingSummary average={null} count={0} />);
    expect(screen.getByText(t.summary.none)).toBeTruthy();
    expect(screen.queryByText(/0/)).toBeNull();
  });

  it('con una sola calificación habla en singular', async () => {
    await render(<RatingSummary average={5} count={1} />);
    expect(
      screen.getByLabelText(`${t.summary.a11y} 5.0 ${t.summary.outOf}, 1 ${t.summary.countOne}`),
    ).toBeTruthy();
  });
});

describe('RatingCard', () => {
  it('muestra quién calificó, las estrellas, la fecha y el comentario', async () => {
    await render(<RatingCard rating={fakeRating({ score: 4 })} />);
    expect(screen.getByText('Luis Pérez')).toBeTruthy();
    expect(screen.getByLabelText(`4 ${es.ui.outOfFive}`)).toBeTruthy();
    expect(screen.getByText('Todo salió muy bien, llegó puntual.')).toBeTruthy();
  });

  it('sin comentario lo indica', async () => {
    await render(<RatingCard rating={fakeRating({ comment: null })} />);
    expect(screen.getByText(t.reputation.noComment)).toBeTruthy();
  });
});

describe('ReputationSection (CA-03)', () => {
  it('con 4 calificaciones muestra promedio, cantidad y la lista', async () => {
    installFakeApi({
      [`GET /users/${USER_ID}/ratings`]: () =>
        ok({
          items: [1, 2, 3, 4].map((n) => fakeRating({ id: `r${n}`, comment: `Comentario ${n}` })),
          nextCursor: null,
        }),
    });
    await withClient(
      <ReputationSection user={{ id: USER_ID, ratingAverage: 4.5, ratingCount: 4 }} />,
    );
    expect(screen.getByText('4.5')).toBeTruthy();
    expect(screen.getByText(`4 ${t.reputation.ratings}`)).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Comentario 4')).toBeTruthy());
    expect(screen.queryByText(t.reputation.more)).toBeNull();
  });

  it('sin calificaciones dice «Aún sin calificaciones» y no pide la lista', async () => {
    const api = installFakeApi({});
    await withClient(
      <ReputationSection user={{ id: USER_ID, ratingAverage: null, ratingCount: 0 }} />,
    );
    expect(screen.getByText(t.reputation.empty)).toBeTruthy();
    expect(api.calls).toHaveLength(0);
  });

  it('pagina con «Ver más calificaciones»', async () => {
    installFakeApi({
      [`GET /users/${USER_ID}/ratings`]: (req) =>
        req.query.includes('cursor=c2')
          ? ok({ items: [fakeRating({ id: 'b', comment: 'Segunda página' })], nextCursor: null })
          : ok({ items: [fakeRating({ id: 'a', comment: 'Primera página' })], nextCursor: 'c2' }),
    });
    await withClient(
      <ReputationSection user={{ id: USER_ID, ratingAverage: 5, ratingCount: 2 }} />,
    );
    await waitFor(() => expect(screen.getByText('Primera página')).toBeTruthy());
    await fireEvent.press(screen.getByText(t.reputation.more));
    await waitFor(() => expect(screen.getByText('Segunda página')).toBeTruthy());
    expect(screen.queryByText(t.reputation.more)).toBeNull();
  });

  it('si la lista falla ofrece reintentar', async () => {
    installFakeApi({ [`GET /users/${USER_ID}/ratings`]: () => failure(500, 'internal_error') });
    await withClient(
      <ReputationSection user={{ id: USER_ID, ratingAverage: 5, ratingCount: 2 }} />,
    );
    await waitFor(() => expect(screen.getByText(t.reputation.loadFailed)).toBeTruthy());
    expect(screen.getByText(es.common.retry)).toBeTruthy();
  });
});

describe('RateBookingCard', () => {
  const completed = (over = {}) =>
    fakeBooking({ status: 'completed', viewerRole: 'requester', ...over });

  it('no aplica si la reserva no concluyó: no dibuja ni consulta nada', async () => {
    const api = installFakeApi({});
    await withClient(<RateBookingCard booking={fakeBooking({ status: 'accepted' })} />);
    expect(screen.queryByText(t.card.yourRating)).toBeNull();
    expect(api.calls).toHaveLength(0);
  });

  it('no aplica para el administrador', async () => {
    const api = installFakeApi({});
    await withClient(<RateBookingCard booking={completed({ viewerRole: 'admin' })} />);
    expect(api.calls).toHaveLength(0);
  });

  it('puede calificar: muestra a quién y estrellas tocables (CA-01)', async () => {
    installFakeApi({ [STATUS]: () => ok(fakeRatingStatus()) });
    await withClient(<RateBookingCard booking={completed()} />);
    await waitFor(() => expect(screen.getByText(`${t.card.prompt} Ana López`)).toBeTruthy());
    expect(screen.getByLabelText(`3 ${es.ui.outOfFive}`)).toBeTruthy();
  });

  it('el propietario califica a quien solicitó', async () => {
    installFakeApi({ [STATUS]: () => ok(fakeRatingStatus()) });
    await withClient(<RateBookingCard booking={completed({ viewerRole: 'owner' })} />);
    await waitFor(() => expect(screen.getByText(`${t.card.prompt} Luis Pérez`)).toBeTruthy());
  });

  it('ya calificó: muestra su calificación', async () => {
    installFakeApi({
      [STATUS]: () =>
        ok(
          fakeRatingStatus({ canRate: false, myRating: fakeRating({ score: 4, comment: 'Bien' }) }),
        ),
    });
    await withClient(<RateBookingCard booking={completed()} />);
    await waitFor(() => expect(screen.getByText(t.card.yourRating)).toBeTruthy());
    expect(screen.getByLabelText(`4 ${es.ui.outOfFive}`)).toBeTruthy();
    expect(screen.getByText('Bien')).toBeTruthy();
  });

  it('ventana vencida: «Ya no puedes calificar»', async () => {
    installFakeApi({ [STATUS]: () => ok(fakeRatingStatus({ canRate: false })) });
    await withClient(<RateBookingCard booking={completed()} />);
    await waitFor(() => expect(screen.getByText(t.card.expired)).toBeTruthy());
  });

  it('si no puede consultar el estado ofrece reintentar', async () => {
    installFakeApi({ [STATUS]: () => failure(500, 'internal_error') });
    await withClient(<RateBookingCard booking={completed()} />);
    await waitFor(() => expect(screen.getByText(t.card.loadFailed)).toBeTruthy());
    expect(screen.getByText(es.common.retry)).toBeTruthy();
  });

  it('4 estrellas abren la hoja con 4 estrellas y chips positivos (CA-07)', async () => {
    installFakeApi({ [STATUS]: () => ok(fakeRatingStatus()) });
    await withClient(<RateBookingCard booking={completed()} />);
    await waitFor(() => expect(screen.getByText(`${t.card.prompt} Ana López`)).toBeTruthy());
    await fireEvent.press(screen.getByLabelText(`4 ${es.ui.outOfFive}`));
    const sheet = within4();
    expect(sheet.getByText(`${t.sheet.question} Ana López?`)).toBeTruthy();
    expect(sheet.getByText(t.words[4])).toBeTruthy();
    for (const chip of t.chips.positive) expect(sheet.getByText(chip)).toBeTruthy();
    expect(sheet.queryByText(t.chips.negative[0])).toBeNull();
  });

  it('con 2 estrellas ofrece chips de experiencia negativa', async () => {
    installFakeApi({ [STATUS]: () => ok(fakeRatingStatus()) });
    await withClient(<RateBookingCard booking={completed()} />);
    await waitFor(() => expect(screen.getByText(`${t.card.prompt} Ana López`)).toBeTruthy());
    await fireEvent.press(screen.getByLabelText(`2 ${es.ui.outOfFive}`));
    for (const chip of t.chips.negative) expect(screen.getByText(chip)).toBeTruthy();
    expect(screen.getByText(t.words[2])).toBeTruthy();
  });

  it('chips seleccionados y sin comentario: el comentario enviado lleva sus textos (CA-08, CA-01)', async () => {
    const api = installFakeApi({
      [STATUS]: () => ok(fakeRatingStatus()),
      [POST]: () => ({ status: 201, body: fakeRating({ score: 4, comment: 'Puntual, Amable' }) }),
    });
    await withClient(<RateBookingCard booking={completed()} />);
    await waitFor(() => expect(screen.getByText(`${t.card.prompt} Ana López`)).toBeTruthy());
    await fireEvent.press(screen.getByLabelText(`4 ${es.ui.outOfFive}`));
    await fireEvent.press(screen.getByText('Puntual'));
    await fireEvent.press(screen.getByText('Amable'));
    await fireEvent.press(screen.getByText(t.sheet.send));
    await waitFor(() => expect(screen.getByText(t.sheet.thanks)).toBeTruthy());
    const post = api.calls.find((call) => call.method === 'POST');
    expect(post?.body).toEqual({ score: 4, comment: 'Puntual, Amable' });
  });

  it('tras enviar, la tarjeta muestra la puntuación (CA-01)', async () => {
    let rated = false;
    installFakeApi({
      [STATUS]: () =>
        ok(
          rated
            ? fakeRatingStatus({
                canRate: false,
                myRating: fakeRating({ score: 5, comment: null }),
              })
            : fakeRatingStatus(),
        ),
      [POST]: () => {
        rated = true;
        return { status: 201, body: fakeRating({ score: 5, comment: null }) };
      },
    });
    await withClient(<RateBookingCard booking={completed()} />);
    await waitFor(() => expect(screen.getByText(`${t.card.prompt} Ana López`)).toBeTruthy());
    await fireEvent.press(screen.getByLabelText(`5 ${es.ui.outOfFive}`));
    await fireEvent.press(screen.getByText(t.sheet.send));
    await waitFor(() => expect(screen.getByText(t.sheet.thanks)).toBeTruthy());
    await fireEvent.press(screen.getByText(t.sheet.done));
    await waitFor(() => expect(screen.getByText(t.card.yourRating)).toBeTruthy());
  });

  it('una calificación duplicada: el servidor responde 409 y la hoja lo explica (CA-02)', async () => {
    installFakeApi({
      [STATUS]: () => ok(fakeRatingStatus()),
      [POST]: () => failure(409, 'conflict'),
    });
    await withClient(<RateBookingCard booking={completed()} />);
    await waitFor(() => expect(screen.getByText(`${t.card.prompt} Ana López`)).toBeTruthy());
    await fireEvent.press(screen.getByLabelText(`3 ${es.ui.outOfFive}`));
    await fireEvent.press(screen.getByText(t.sheet.send));
    await waitFor(() => expect(screen.getByText(t.errors.conflict)).toBeTruthy());
  });

  it('el comentario escrito se envía junto con los chips', async () => {
    const api = installFakeApi({
      [STATUS]: () => ok(fakeRatingStatus()),
      [POST]: () => ({ status: 201, body: fakeRating() }),
    });
    await withClient(<RateBookingCard booking={completed()} />);
    await waitFor(() => expect(screen.getByText(`${t.card.prompt} Ana López`)).toBeTruthy());
    await fireEvent.press(screen.getByLabelText(`5 ${es.ui.outOfFive}`));
    await fireEvent.press(screen.getByText('Puntual'));
    await fireEvent.changeText(screen.getByLabelText(t.sheet.comment), 'Muy amable');
    expect(screen.getByText(`${'Puntual. Muy amable'.length}/300 ${t.sheet.counter}`)).toBeTruthy();
    await fireEvent.press(screen.getByText(t.sheet.send));
    await waitFor(() => expect(api.calls.some((call) => call.method === 'POST')).toBe(true));
    expect(api.calls.find((call) => call.method === 'POST')?.body).toEqual({
      score: 5,
      comment: 'Puntual. Muy amable',
    });
  });

  it('un comentario que pasa de 300 con los chips bloquea el envío', async () => {
    const api = installFakeApi({ [STATUS]: () => ok(fakeRatingStatus()) });
    await withClient(<RateBookingCard booking={completed()} />);
    await waitFor(() => expect(screen.getByText(`${t.card.prompt} Ana López`)).toBeTruthy());
    await fireEvent.press(screen.getByLabelText(`5 ${es.ui.outOfFive}`));
    await fireEvent.changeText(screen.getByLabelText(t.sheet.comment), 'a'.repeat(301));
    expect(screen.getByText(t.validation.commentTooLong)).toBeTruthy();
    await fireEvent.press(screen.getByText(t.sheet.send));
    expect(api.calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('«Ahora no» cierra la hoja sin enviar nada', async () => {
    const api = installFakeApi({ [STATUS]: () => ok(fakeRatingStatus()) });
    await withClient(<RateBookingCard booking={completed()} />);
    await waitFor(() => expect(screen.getByText(`${t.card.prompt} Ana López`)).toBeTruthy());
    await fireEvent.press(screen.getByLabelText(`5 ${es.ui.outOfFive}`));
    await fireEvent.press(screen.getByText(t.sheet.notNow));
    expect(screen.queryByText(t.sheet.send)).toBeNull();
    expect(api.calls.some((call) => call.method === 'POST')).toBe(false);
  });
});

/** La hoja es un `Modal`: sus consultas se hacen sobre la pantalla completa. */
function within4() {
  return screen;
}
