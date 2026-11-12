/// <reference types="node" />
import {
  act,
  fireEvent,
  renderRouter,
  screen,
  testRouter,
  waitFor,
} from 'expo-router/testing-library';
import path from 'node:path';
import { REFRESH_TOKEN_KEY } from '@/features/auth/session';
import type { Conversation, Message } from '@/features/chat/types';
import { es } from '@/i18n/es-MX';
import { resetAuthInterceptor } from '@/lib/api/authInterceptor';
import {
  failure,
  fakeTokens,
  fakeUser,
  installFakeApi,
  installMemorySecureStore,
  ok,
  type FakeHandler,
} from '@/test/fakeApi';
import { BOOKING_ID, fakeBooking } from '@/test/fakeBookings';
import { CONVERSATION_ID, ME, OTHER, fakeConversation, fakeMessage } from '@/test/fakeChat';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
  configResult: { ok: true, config: { apiBaseUrl: 'http://api.test', appEnv: 'development' } },
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Con cobertura, el primer montaje del árbol completo de la app tarda más de 5 s en frío
// (mismo criterio que en bookings y search).
jest.setTimeout(30_000);

const APP_DIR = path.resolve(__dirname, '..', '..', 'app');
const t = es.chat;

/** Un servidor de chat en memoria: guarda mensajes, no leídos y deduplica por clientId. */
function createChatServer() {
  const state = {
    messages: [
      fakeMessage('0001', { body: 'Hola, ya acepté tu solicitud', senderId: OTHER }),
      fakeMessage('0002', { body: '¿Te queda bien a las 5?', senderId: OTHER }),
    ] as Message[],
    unread: 2,
    nextId: 3,
    posts: [] as { body: string; clientId: string }[],
    failNextPost: false,
    reads: 0,
  };
  const conversation = (): Conversation => {
    const last = state.messages[state.messages.length - 1];
    return fakeConversation({
      unreadCount: state.unread,
      lastMessage:
        last === undefined
          ? null
          : { preview: last.body, at: last.createdAt, senderId: last.senderId },
    });
  };
  const push = (senderId: string, body: string, clientId: string | null = null): Message => {
    const message = fakeMessage(String(state.nextId).padStart(4, '0'), {
      senderId,
      body,
      clientId,
    });
    state.nextId += 1;
    state.messages.push(message);
    return message;
  };
  const base = `/conversations/${CONVERSATION_ID}`;
  const handlers: Record<string, FakeHandler> = {
    'POST /auth/refresh': () => ok({ tokens: fakeTokens(2) }),
    'GET /me': () => ok(fakeUser),
    'GET /items': () => ok({ items: [], nextCursor: null }),
    'GET /categories': () => ok([]),
    'GET /me/bookings': () => ok({ items: [], nextCursor: null }),
    'GET /conversations': () => ok({ items: [conversation()], nextCursor: null }),
    'GET /conversations/unread-count': () => ok({ count: state.unread }),
    [`GET ${base}/messages`]: (r) => {
      const after = new URLSearchParams(r.query).get('after');
      if (after !== null) {
        return ok({ items: state.messages.filter((m) => m.id > after), nextCursor: null });
      }
      return ok({ items: [...state.messages].reverse(), nextCursor: null });
    },
    [`POST ${base}/messages`]: (r) => {
      const body = r.body as { body: string; clientId: string };
      state.posts.push(body);
      if (state.failNextPost) {
        state.failNextPost = false;
        return failure(503, 'service_unavailable');
      }
      const existing = state.messages.find((m) => m.clientId === body.clientId);
      if (existing !== undefined) return { status: 200, body: existing };
      return { status: 201, body: push(ME, body.body, body.clientId) };
    },
    [`POST ${base}/read`]: () => {
      state.reads += 1;
      state.unread = 0;
      return { status: 204 };
    },
  };
  return { state, handlers, push };
}

beforeEach(() => resetAuthInterceptor());
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

async function openApp(handlers: Record<string, FakeHandler>) {
  installMemorySecureStore({ [REFRESH_TOKEN_KEY]: 'refresh-1' });
  const api = installFakeApi(handlers);
  await renderRouter(APP_DIR);
  await waitFor(() => expect(screen.getAllByRole('tab').length).toBeGreaterThan(0));
  return api;
}

const messagesButton = (suffix = '') =>
  screen.findByRole('button', { name: new RegExp(`^${es.inicio.messages}${suffix}`) });

describe('mensajería de punta a punta (T009, CA-01…CA-06)', () => {
  it('Inicio muestra los no leídos, la lista los trae y abrir el chat los baja a cero (CA-05)', async () => {
    const { state, handlers } = createChatServer();
    await openApp(handlers);

    expect(await messagesButton(`, 2 ${es.inicio.unread}`)).toBeTruthy();
    await fireEvent.press(await messagesButton());
    await waitFor(() => expect(screen).toHavePathname('/mensajes'));
    expect(await screen.findByText('Luis Pérez')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: /Luis Pérez/ }));
    await waitFor(() => expect(screen).toHavePathname(`/chat/${CONVERSATION_ID}`));
    expect(await screen.findByText('¿Te queda bien a las 5?')).toBeTruthy();
    await waitFor(() => expect(state.reads).toBeGreaterThanOrEqual(1));

    await testRouter.navigate('/inicio');
    await waitFor(() => expect(screen).toHavePathname('/inicio'));
    expect(await messagesButton('$')).toBeTruthy();
    expect(screen.queryByRole('button', { name: new RegExp(es.inicio.unread) })).toBeNull();
  });

  it('abrir → enviar → eco → mensaje de la otra persona por consulta periódica (CA-01, CA-02)', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    const { state, handlers, push } = createChatServer();
    await openApp(handlers);
    await testRouter.navigate(`/chat/${CONVERSATION_ID}`);
    expect(await screen.findByText('¿Te queda bien a las 5?')).toBeTruthy();

    // Envío: aparece de inmediato y el eco del servidor no lo duplica.
    await fireEvent.changeText(
      screen.getByLabelText(t.composer.fieldLabel),
      'Sí, a las 5 está bien',
    );
    await fireEvent.press(screen.getByRole('button', { name: t.composer.send }));
    expect(screen.getByText('Sí, a las 5 está bien')).toBeTruthy();
    await waitFor(() => expect(screen.queryByLabelText(/Enviando$/)).toBeNull());
    expect(screen.getAllByText('Sí, a las 5 está bien')).toHaveLength(1);
    expect(state.posts).toHaveLength(1);

    // La otra persona escribe: aparece en la siguiente consulta periódica (≤ 5 s).
    push(OTHER, 'Perfecto, llego puntual');
    state.unread = 1;
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5_000);
    });
    expect(await screen.findByText('Perfecto, llego puntual')).toBeTruthy();
    // Estando en el chat se vuelve a marcar leído: el contador no sube.
    await waitFor(() => expect(state.unread).toBe(0));
  });

  it('sin red queda «No enviado» y reintentar no duplica el mensaje en el servidor (CA-01)', async () => {
    const { state, handlers } = createChatServer();
    await openApp(handlers);
    await testRouter.navigate(`/chat/${CONVERSATION_ID}`);
    await screen.findByText('¿Te queda bien a las 5?');

    state.failNextPost = true;
    await fireEvent.changeText(screen.getByLabelText(t.composer.fieldLabel), 'Ya salí de casa');
    await fireEvent.press(screen.getByRole('button', { name: t.composer.send }));
    expect(await screen.findByText(t.message.notSent)).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: t.message.retryA11y }));
    await waitFor(() => expect(screen.queryByText(t.message.notSent)).toBeNull());
    expect(screen.getAllByText('Ya salí de casa')).toHaveLength(1);
    expect(state.posts).toHaveLength(2);
    expect(state.posts[0]?.clientId).toBe(state.posts[1]?.clientId);
    expect(state.messages.filter((m) => m.body === 'Ya salí de casa')).toHaveLength(1);
  });

  it('un texto prohibido muestra el motivo y conserva el texto (CA-06)', async () => {
    const { handlers } = createChatServer();
    handlers[`POST /conversations/${CONVERSATION_ID}/messages`] = () =>
      failure(400, 'validation_failed', [{ field: 'body', issue: 'contiene datos de contacto' }]);
    await openApp(handlers);
    await testRouter.navigate(`/chat/${CONVERSATION_ID}`);
    await screen.findByText('¿Te queda bien a las 5?');
    await fireEvent.changeText(
      screen.getByLabelText(t.composer.fieldLabel),
      'Mi número es 5512345678',
    );
    await fireEvent.press(screen.getByRole('button', { name: t.composer.send }));
    expect(await screen.findByText('contiene datos de contacto')).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByLabelText(t.composer.fieldLabel).props.value).toBe(
        'Mi número es 5512345678',
      ),
    );
  });

  it('una reserva concluida deja leer pero no escribir (CA-04)', async () => {
    const { handlers } = createChatServer();
    handlers['GET /conversations'] = () =>
      ok({
        items: [fakeConversation({ canWrite: false, bookingStatus: 'completed' })],
        nextCursor: null,
      });
    await openApp(handlers);
    await testRouter.navigate(`/chat/${CONVERSATION_ID}`);
    expect(await screen.findByText('¿Te queda bien a las 5?')).toBeTruthy();
    expect(await screen.findByText(t.chat.closedBar)).toBeTruthy();
    expect(screen.queryByLabelText(t.composer.fieldLabel)).toBeNull();
  });

  it('el detalle de la reserva ofrece «Abrir chat» con los no leídos (RF-09)', async () => {
    const { handlers } = createChatServer();
    handlers[`GET /bookings/${BOOKING_ID}`] = () =>
      ok(fakeBooking({ conversationId: CONVERSATION_ID, status: 'accepted', viewerRole: 'owner' }));
    await openApp(handlers);
    await testRouter.navigate(`/reserva/${BOOKING_ID}`);
    const open = await screen.findByRole('button', {
      name: new RegExp(`^${es.chat.section.openA11y}`),
    });
    expect(open).toBeTruthy();
    await fireEvent.press(open);
    await waitFor(() => expect(screen).toHavePathname(`/chat/${CONVERSATION_ID}`));
  });

  it('una reserva sin conversación (pendiente) no muestra el botón (RF-10)', async () => {
    const { handlers } = createChatServer();
    handlers[`GET /bookings/${BOOKING_ID}`] = () =>
      ok(fakeBooking({ conversationId: null, status: 'pending', viewerRole: 'owner' }));
    await openApp(handlers);
    await testRouter.navigate(`/reserva/${BOOKING_ID}`);
    expect(await screen.findByText('Taladro percutor')).toBeTruthy();
    expect(screen.queryByText(es.chat.section.open)).toBeNull();
  });
});
