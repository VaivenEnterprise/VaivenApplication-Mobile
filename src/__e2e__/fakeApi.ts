import { z } from 'zod';
import type { Booking, HandoverStage, ViewerRole } from '@/features/bookings';
import type { Rating, RatingStatus } from '@/features/ratings/types';
import { failure, installFakeApi, ok, type FakeReply, type FakeRequest } from '@/test/fakeApi';
import { BOOKING_ID, ITEM_ID, fakeBooking, fakeQuote, fakeRequester } from '@/test/fakeBookings';
import { FAKE_TOKEN, fakeRecordedStage, fakeStage } from '@/test/fakeHandover';
import { fakeItem, fakeOwner } from '@/test/fakeItems';
import { fakeRating, fakeRatingStatus } from '@/test/fakeTrust';

// «Servidor» de la prueba de punta a punta (spec 012 T002): un solo estado compartido por las dos
// personas (propietaria y solicitante), con las rutas del contrato 007, 009 y 010. Cada cuerpo que
// llega se valida contra el esquema ESTRICTO del contrato: si la app cambia lo que envía (un campo de
// más, de menos o de otro tipo), el servidor responde 400 y la violación queda en `violations`,
// que la prueba exige vacío. Las respuestas salen con la forma del contrato y la app las valida con
// sus propios esquemas de zod, así que un cambio en cualquiera de los dos lados rompe la prueba.

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const contract = {
  createBooking: z.strictObject({
    itemId: z.string().min(1),
    startDate: ymd,
    endDate: ymd,
    paymentMode: z.enum(['full_on_delivery', 'split']),
    acceptedTotalCents: z.number().int().positive(),
  }),
  accept: z.strictObject({ meetingPoint: z.strictObject({ description: z.string() }).optional() }),
  evidence: z.strictObject({
    conditionNotes: z.string().min(1).max(1000),
    photos: z.array(z.strictObject({ publicId: z.string().min(1) })).max(8),
  }),
  confirm: z.strictObject({ token: z.string().min(16) }),
  rating: z.strictObject({
    score: z.number().int().min(1).max(5),
    comment: z.string().max(500).optional(),
  }),
};

export type Phone = 'owner' | 'requester';
type StageKey = 'delivery' | 'return';

export const E2E_ITEM = fakeItem({ id: ITEM_ID, owner: fakeOwner });

export function createJourneyBackend() {
  const state = {
    booking: null as Booking | null,
    qrPayload: null as string | null,
    qrStage: null as StageKey | null,
    rating: null as Rating | null,
  };
  const violations: string[] = [];
  let phone: Phone = 'requester';

  const viewer = (): ViewerRole => phone;
  const view = (): Booking & { viewerRole: ViewerRole } => {
    if (state.booking === null) throw new Error('no hay reserva');
    return { ...state.booking, viewerRole: viewer() };
  };
  const patch = (changes: Partial<Booking>) => {
    state.booking = {
      ...(state.booking as Booking),
      ...changes,
      version: (state.booking?.version ?? 0) + 1,
    };
  };

  /** Valida un cuerpo contra el contrato; si no cumple, registra la violación y responde 400. */
  function guard<T>(
    name: keyof typeof contract,
    body: unknown,
  ): { value: T } | { reply: FakeReply } {
    const parsed = contract[name].safeParse(body ?? {});
    if (parsed.success) return { value: parsed.data as T };
    const issue = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    violations.push(`${name}: ${issue}`);
    return {
      reply: failure(400, 'validation_failed', [{ field: String(name), issue }]),
    };
  }

  const stageOf = (key: StageKey): HandoverStage =>
    (state.booking?.[key] as HandoverStage | undefined) ?? fakeStage();

  const stageRoutes = (key: StageKey) => ({
    [`PUT /bookings/${BOOKING_ID}/${key}/evidence`]: (r: FakeRequest): FakeReply => {
      const checked = guard<z.infer<typeof contract.evidence>>('evidence', r.body);
      if ('reply' in checked) return checked.reply;
      const recorded = fakeRecordedStage({ conditionNotes: checked.value.conditionNotes });
      patch({ [key]: recorded });
      return ok(recorded);
    },
    [`GET /bookings/${BOOKING_ID}/${key}`]: (): FakeReply => ok(stageOf(key)),
    [`POST /bookings/${BOOKING_ID}/${key}/qr`]: (): FakeReply => {
      if (stageOf(key).recordedAt === null) return failure(409, 'conflict');
      state.qrStage = key;
      state.qrPayload = `vaiven://qr?b=${BOOKING_ID}&s=${key}&t=${FAKE_TOKEN}`;
      return {
        status: 201,
        body: {
          token: FAKE_TOKEN,
          qrPayload: state.qrPayload,
          expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
        },
      };
    },
    [`POST /bookings/${BOOKING_ID}/${key}/confirm`]: (r: FakeRequest): FakeReply => {
      const checked = guard<z.infer<typeof contract.confirm>>('confirm', r.body);
      if ('reply' in checked) return checked.reply;
      if (state.qrStage !== key || checked.value.token !== FAKE_TOKEN)
        return failure(409, 'conflict');
      state.qrPayload = null;
      patch({
        status: key === 'delivery' ? 'in_progress' : 'completed',
        [key]: { ...stageOf(key), confirmedAt: new Date().toISOString() },
      });
      return ok(view());
    },
  });

  const api = installFakeApi({
    [`GET /items/${ITEM_ID}`]: () => ok(E2E_ITEM),
    [`GET /items/${ITEM_ID}/quote`]: (r) => {
      const q = new URLSearchParams(r.query);
      if (!ymd.safeParse(q.get('startDate')).success || !ymd.safeParse(q.get('endDate')).success) {
        violations.push(`quote: fechas inválidas (${r.query})`);
        return failure(400, 'validation_failed');
      }
      return ok(
        fakeQuote({
          itemId: ITEM_ID,
          startDate: q.get('startDate') ?? '',
          endDate: q.get('endDate') ?? '',
          days: 1,
          totalCents: 3000,
          payments: [{ stage: 'delivery', amountCents: 3000 }],
        }),
      );
    },
    'POST /bookings': (r) => {
      const checked = guard<z.infer<typeof contract.createBooking>>('createBooking', r.body);
      if ('reply' in checked) return checked.reply;
      if (checked.value.acceptedTotalCents !== 3000) return failure(409, 'conflict');
      state.booking = fakeBooking({
        id: BOOKING_ID,
        item: { ...fakeBooking().item, id: ITEM_ID },
        owner: fakeOwner,
        requester: fakeRequester,
        startDate: checked.value.startDate,
        endDate: checked.value.endDate,
        status: 'pending',
        delivery: fakeStage(),
        return: fakeStage(),
      });
      return { status: 201, body: view() };
    },
    [`GET /bookings/${BOOKING_ID}`]: () =>
      state.booking === null ? failure(404, 'not_found') : ok(view()),
    [`POST /bookings/${BOOKING_ID}/accept`]: (r) => {
      const checked = guard('accept', r.body);
      if ('reply' in checked) return checked.reply;
      if (phone !== 'owner' || state.booking?.status !== 'pending') return failure(409, 'conflict');
      patch({ status: 'accepted' });
      return ok(view());
    },
    ...stageRoutes('delivery'),
    ...stageRoutes('return'),
    [`GET /bookings/${BOOKING_ID}/rating-status`]: () => {
      const completed = state.booking?.status === 'completed';
      const status: RatingStatus =
        state.rating !== null
          ? fakeRatingStatus({ canRate: false, myRating: state.rating })
          : fakeRatingStatus({ canRate: completed });
      return ok(status);
    },
    [`POST /bookings/${BOOKING_ID}/ratings`]: (r) => {
      const checked = guard<z.infer<typeof contract.rating>>('rating', r.body);
      if ('reply' in checked) return checked.reply;
      if (state.booking?.status !== 'completed' || state.rating !== null)
        return failure(409, 'conflict');
      state.rating = fakeRating({
        score: checked.value.score,
        comment: checked.value.comment ?? null,
      });
      return { status: 201, body: state.rating };
    },
  });

  return {
    api,
    state,
    violations,
    /** Cambia de teléfono: la misma reserva se ve según quién la pide. */
    as(next: Phone) {
      phone = next;
    },
  };
}
