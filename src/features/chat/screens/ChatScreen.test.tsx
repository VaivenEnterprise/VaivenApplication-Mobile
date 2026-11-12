import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { ChatScreen } from '@/features/chat/screens/ChatScreen';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { failure, fakeUser, installFakeApi, ok, type FakeHandler } from '@/test/fakeApi';
import {
  BOOKING_ID_CHAT,
  CONVERSATION_ID,
  ME,
  OTHER,
  fakeConversation,
  fakeMessage,
} from '@/test/fakeChat';

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useIsFocused: () => true,
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ user: mockUser, status: 'authenticated' }),
}));

const mockUser = fakeUser;
const t = es.chat;
const MESSAGES = `GET /conversations/${CONVERSATION_ID}/messages`;
const SEND = `POST /conversations/${CONVERSATION_ID}/messages`;
const READ = `POST /conversations/${CONVERSATION_ID}/read`;

beforeEach(() => {
  mockPush.mockReset();
  mockBack.mockReset();
});
afterEach(() => jest.restoreAllMocks());

type Query = URLSearchParams;
const history = [
  fakeMessage('3', { senderId: ME, body: 'Perfecto, ahí nos vemos', clientId: 'c3' }),
  fakeMessage('2', { senderId: OTHER, body: '¿Te queda bien a las 5?' }),
  fakeMessage('1', { senderId: OTHER, body: 'Hola, ya acepté tu solicitud' }),
];

function handlers(over: Record<string, FakeHandler> = {}, conversation = fakeConversation()) {
  return {
    'GET /conversations': () => ok({ items: [conversation], nextCursor: null }),
    'GET /conversations/unread-count': () => ok({ count: 0 }),
    [MESSAGES]: (r: { query: string }) => {
      const q: Query = new URLSearchParams(r.query);
      return q.has('after')
        ? ok({ items: [], nextCursor: null })
        : ok({ items: history, nextCursor: null });
    },
    [READ]: () => ({ status: 204 }),
    ...over,
  };
}

function renderChat() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <ChatScreen id={CONVERSATION_ID} />
    </QueryClientProvider>,
  );
}

const field = () => screen.getByLabelText(t.composer.fieldLabel);
const sendButton = () => screen.getByRole('button', { name: t.composer.send });

async function typeAndSend(text: string) {
  await fireEvent.changeText(field(), text);
  await fireEvent.press(sendButton());
}

describe('ChatScreen: lectura', () => {
  it('muestra el encabezado, los mensajes y marca la conversación como leída (RF-02, RF-05)', async () => {
    const api = installFakeApi(handlers());
    await renderChat();
    expect(await screen.findByText('Perfecto, ahí nos vemos')).toBeTruthy();
    expect(screen.getByText('¿Te queda bien a las 5?')).toBeTruthy();
    expect(screen.getByText('Luis Pérez')).toBeTruthy();
    expect(screen.getByText('Taladro percutor')).toBeTruthy();
    expect(screen.getByText('Aceptada')).toBeTruthy();
    expect(screen.getByTestId('chat-list').props.inverted).toBe(true);
    await waitFor(() => expect(api.calls.some((c) => `${c.method} ${c.path}` === READ)).toBe(true));
  });

  it('un separador de día acompaña a los mensajes', async () => {
    installFakeApi(handlers());
    await renderChat();
    await screen.findByText('Hola, ya acepté tu solicitud');
    expect(screen.getByRole('header', { name: /Hoy|Ayer|\d/ })).toBeTruthy();
  });

  it('tocar el encabezado abre la reserva y «Volver» regresa', async () => {
    installFakeApi(handlers());
    await renderChat();
    await fireEvent.press(await screen.findByRole('button', { name: /Ver reserva$/ }));
    expect(mockPush).toHaveBeenCalledWith(routes.booking(BOOKING_ID_CHAT));
    await fireEvent.press(screen.getByRole('button', { name: es.common.back }));
    expect(mockBack).toHaveBeenCalled();
  });

  it('carga los anteriores con before al llegar arriba', async () => {
    const api = installFakeApi(
      handlers({
        [MESSAGES]: (r) => {
          const q = new URLSearchParams(r.query);
          if (q.has('after')) return ok({ items: [], nextCursor: null });
          if (q.get('before') === '2')
            return ok({ items: [fakeMessage('1', { body: 'El más viejo' })], nextCursor: null });
          return ok({ items: [history[0], history[1]], nextCursor: '2' });
        },
      }),
    );
    await renderChat();
    await screen.findByText('Perfecto, ahí nos vemos');
    await fireEvent(screen.getByTestId('chat-list'), 'endReached');
    expect(await screen.findByText('El más viejo')).toBeTruthy();
    expect(api.calls.some((c) => new URLSearchParams(c.query).get('before') === '2')).toBe(true);
  });

  it('una conversación sin mensajes muestra la invitación y deja escribir', async () => {
    installFakeApi(handlers({ [MESSAGES]: () => ok({ items: [], nextCursor: null }) }));
    await renderChat();
    expect(await screen.findByText(t.chat.emptyTitle)).toBeTruthy();
    expect(field()).toBeTruthy();
  });

  it('si el historial falla ofrece reintentar', async () => {
    let failing = true;
    installFakeApi(
      handlers({
        [MESSAGES]: () =>
          failing ? failure(500, 'internal_error') : ok({ items: history, nextCursor: null }),
      }),
    );
    await renderChat();
    const retry = await screen.findByRole('button', { name: es.common.retry });
    failing = false;
    await fireEvent.press(retry);
    expect(await screen.findByText('Perfecto, ahí nos vemos')).toBeTruthy();
  });

  it('una conversación ajena (404) dice que no se encontró', async () => {
    installFakeApi(handlers({ [MESSAGES]: () => failure(404, 'not_found') }));
    await renderChat();
    expect(await screen.findByText(t.chat.notFound)).toBeTruthy();
    const backs = screen.getAllByRole('button', { name: es.common.back });
    await fireEvent.press(backs[backs.length - 1]!);
    expect(mockBack).toHaveBeenCalled();
  });

  it('mientras la conversación no aparece en la lista pide la página siguiente', async () => {
    const api = installFakeApi(
      handlers({
        'GET /conversations': (r) =>
          new URLSearchParams(r.query).get('cursor') === 'p2'
            ? ok({ items: [fakeConversation()], nextCursor: null })
            : ok({ items: [fakeConversation({ id: 'otra' })], nextCursor: 'p2' }),
      }),
    );
    await renderChat();
    expect(await screen.findByText('Luis Pérez')).toBeTruthy();
    expect(api.calls.some((c) => new URLSearchParams(c.query).get('cursor') === 'p2')).toBe(true);
  });
});

describe('ChatScreen: envío (RF-03, RF-07, RF-08)', () => {
  it('el mensaje aparece al instante como «enviando» y se confirma una sola vez', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    installFakeApi(
      handlers({
        [SEND]: async (r) => {
          await gate;
          const body = r.body as { body: string; clientId: string };
          return { status: 201, body: fakeMessage('4', { senderId: ME, ...body }) };
        },
      }),
    );
    await renderChat();
    await screen.findByText('Perfecto, ahí nos vemos');
    await typeAndSend('Ya voy en camino');
    expect(screen.getByText('Ya voy en camino')).toBeTruthy();
    expect(screen.getByLabelText(/Ya voy en camino.*Enviando$/)).toBeTruthy();
    expect(field().props.value).toBe('');
    expect(sendButton()).toBeDisabled();
    await act(async () => {
      release();
      await gate;
    });
    await waitFor(() => expect(screen.queryByLabelText(/Enviando$/)).toBeNull());
    expect(screen.getAllByText('Ya voy en camino')).toHaveLength(1);
  });

  it('sin red queda «No enviado» y al reintentar no se duplica (CA-01)', async () => {
    const clientIds: string[] = [];
    let online = false;
    installFakeApi(
      handlers({
        [SEND]: (r) => {
          const body = r.body as { body: string; clientId: string };
          clientIds.push(body.clientId);
          return online
            ? { status: 200, body: fakeMessage('4', { senderId: ME, ...body }) }
            : failure(503, 'service_unavailable');
        },
      }),
    );
    await renderChat();
    await screen.findByText('Perfecto, ahí nos vemos');
    await typeAndSend('Llego en 5 minutos');
    expect(await screen.findByText(t.message.notSent)).toBeTruthy();
    online = true;
    await fireEvent.press(screen.getByRole('button', { name: t.message.retryA11y }));
    await waitFor(() => expect(screen.queryByText(t.message.notSent)).toBeNull());
    expect(screen.getAllByText('Llego en 5 minutos')).toHaveLength(1);
    expect(clientIds).toHaveLength(2);
    expect(clientIds[0]).toBe(clientIds[1]);
  });

  it('un texto prohibido muestra el motivo y conserva el texto en el campo (CA-06)', async () => {
    installFakeApi(
      handlers({
        [SEND]: () =>
          failure(400, 'validation_failed', [
            { field: 'body', issue: 'contiene datos de contacto' },
          ]),
      }),
    );
    await renderChat();
    await screen.findByText('Perfecto, ahí nos vemos');
    await typeAndSend('Escríbeme al 55 1234 5678');
    expect(await screen.findByText('contiene datos de contacto')).toBeTruthy();
    expect(screen.getByText(t.notice.moderationTitle)).toBeTruthy();
    await waitFor(() => expect(field().props.value).toBe('Escríbeme al 55 1234 5678'));
    expect(screen.queryByText('Escríbeme al 55 1234 5678')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: t.notice.dismiss }));
    expect(screen.queryByText(t.notice.moderationTitle)).toBeNull();
  });

  it('el límite de ritmo avisa «Más despacio» y conserva el texto', async () => {
    installFakeApi(handlers({ [SEND]: () => failure(429, 'rate_limited') }));
    await renderChat();
    await screen.findByText('Perfecto, ahí nos vemos');
    await typeAndSend('Hola otra vez');
    expect(await screen.findByText(t.notice.slowDown)).toBeTruthy();
    await waitFor(() => expect(field().props.value).toBe('Hola otra vez'));
  });

  it('si la conversación se cerró (409) reemplaza el campo por el aviso', async () => {
    installFakeApi(handlers({ [SEND]: () => failure(409, 'conflict') }));
    await renderChat();
    await screen.findByText('Perfecto, ahí nos vemos');
    await typeAndSend('Hola');
    expect(await screen.findByText(t.chat.closedBar)).toBeTruthy();
    expect(screen.queryByLabelText(t.composer.fieldLabel)).toBeNull();
  });

  it('una respuesta rápida solo rellena el campo, no envía', async () => {
    const api = installFakeApi(handlers());
    await renderChat();
    await screen.findByText('Perfecto, ahí nos vemos');
    await fireEvent.press(screen.getByRole('button', { name: '¿Dónde nos vemos?' }));
    expect(field().props.value).toBe('¿Dónde nos vemos?');
    expect(api.calls.some((c) => c.method === 'POST' && c.path.endsWith('/messages'))).toBe(false);
  });

  it('no deja enviar un texto vacío', async () => {
    const api = installFakeApi(handlers());
    await renderChat();
    await screen.findByText('Perfecto, ahí nos vemos');
    await fireEvent.changeText(field(), '    ');
    expect(sendButton()).toBeDisabled();
    expect(api.calls.some((c) => c.method === 'POST' && c.path.endsWith('/messages'))).toBe(false);
  });
});

describe('ChatScreen: conversación cerrada (RF-06, CA-04)', () => {
  it('con canWrite falso no hay campo de texto, solo el aviso, y el historial se lee', async () => {
    installFakeApi(handlers({}, fakeConversation({ canWrite: false, bookingStatus: 'completed' })));
    await renderChat();
    expect(await screen.findByText('Perfecto, ahí nos vemos')).toBeTruthy();
    expect(screen.getByText(t.chat.closedBar)).toBeTruthy();
    expect(screen.queryByLabelText(t.composer.fieldLabel)).toBeNull();
    expect(screen.queryByRole('button', { name: t.composer.send })).toBeNull();
    expect(screen.getByText('Completada')).toBeTruthy();
  });
});

describe('ChatScreen: consulta periódica (RF-04, CA-02, CA-03)', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  function pollingApi() {
    let arrived = false;
    const api = installFakeApi(
      handlers({
        [MESSAGES]: (r) => {
          const q = new URLSearchParams(r.query);
          if (!q.has('after')) return ok({ items: history, nextCursor: null });
          return ok({
            items:
              arrived && q.get('after') === '3'
                ? [fakeMessage('4', { body: 'Ya estoy aquí' })]
                : [],
            nextCursor: null,
          });
        },
      }),
    );
    return { api, arrive: () => (arrived = true) };
  }

  it('el mensaje de la otra persona aparece en menos de 5 s y se vuelve a marcar leído (CA-02)', async () => {
    const { api, arrive } = pollingApi();
    await renderChat();
    await screen.findByText('Perfecto, ahí nos vemos');
    arrive();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5_000);
    });
    expect(await screen.findByText('Ya estoy aquí')).toBeTruthy();
    const reads = api.calls.filter((c) => `${c.method} ${c.path}` === READ);
    expect(reads.length).toBeGreaterThanOrEqual(2);
  });

  it('con la app en segundo plano no hay consultas periódicas (CA-03)', async () => {
    const { api } = pollingApi();
    const listeners: ((state: AppStateStatus) => void)[] = [];
    const emit = (state: AppStateStatus) => listeners.forEach((listener) => listener(state));
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      listeners.push(listener);
      return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
    });
    await renderChat();
    await screen.findByText('Perfecto, ahí nos vemos');
    await act(async () => {
      emit('background');
    });
    const before = api.calls.length;
    await act(async () => {
      await jest.advanceTimersByTimeAsync(60_000);
    });
    expect(api.calls.length).toBe(before);
    await act(async () => {
      emit('active');
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(api.calls.length).toBeGreaterThan(before);
  });
});
