import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ChatScreen } from '@/features/chat/screens/ChatScreen';
import { es } from '@/i18n/es-MX';
import { failure, fakeUser, installFakeApi, ok, type FakeHandler } from '@/test/fakeApi';
import { CONVERSATION_ID, ME, OTHER, fakeConversation, fakeMessage } from '@/test/fakeChat';

// Spec 021-T009: suite de seguridad propia del chat (S-01, S-05, S-09): privacidad de la conversación,
// contenido de mensajes como texto plano y cuerpo de envío acotado.
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useIsFocused: () => true,
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ user: mockUser, status: 'authenticated' }),
}));

const mockUser = fakeUser;
// El primer render de la suite carga en frío el árbol de pantallas y puede pasar de 5 s.
jest.setTimeout(30_000);
const t = es.chat;
const MESSAGES = `GET /conversations/${CONVERSATION_ID}/messages`;
const SEND = `POST /conversations/${CONVERSATION_ID}/messages`;
const READ = `POST /conversations/${CONVERSATION_ID}/read`;

afterEach(() => jest.restoreAllMocks());

function handlers(over: Record<string, FakeHandler> = {}, items = [fakeMessage('1')]) {
  return {
    'GET /conversations': () => ok({ items: [fakeConversation()], nextCursor: null }),
    'GET /conversations/unread-count': () => ok({ count: 0 }),
    [MESSAGES]: () => ok({ items, nextCursor: null }),
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

describe('ChatScreen (seguridad)', () => {
  it('una conversación ajena (404) no muestra ningún mensaje', async () => {
    installFakeApi(handlers({ [MESSAGES]: () => failure(404, 'not_found') }));
    await renderChat();
    expect(await screen.findByText(t.chat.notFound)).toBeTruthy();
    expect(screen.queryByTestId('chat-list')).toBeNull();
  });

  it('el contenido de un mensaje se muestra como texto plano, nunca interpretado', async () => {
    const hostil = '<script>alert(1)</script> [clic](javascript:alert(1))';
    installFakeApi(handlers({}, [fakeMessage('9', { senderId: OTHER, body: hostil })]));
    await renderChat();
    expect(await screen.findByText(hostil)).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('el envío lleva solo el texto recortado y un clientId, hacia la conversación abierta', async () => {
    const api = installFakeApi(
      handlers({
        [SEND]: (r) => ({
          status: 201,
          body: fakeMessage('4', {
            senderId: ME,
            ...(r.body as { body: string; clientId: string }),
          }),
        }),
      }),
    );
    await renderChat();
    await screen.findByLabelText(t.composer.fieldLabel);
    await fireEvent.changeText(screen.getByLabelText(t.composer.fieldLabel), '  Hola  ');
    await fireEvent.press(screen.getByRole('button', { name: t.composer.send }));
    await waitFor(() => expect(api.calls.some((c) => `${c.method} ${c.path}` === SEND)).toBe(true));
    const envio = api.calls.find((c) => `${c.method} ${c.path}` === SEND);
    expect(Object.keys(envio?.body as object).sort()).toEqual(['body', 'clientId']);
    expect((envio?.body as { body: string }).body).toBe('Hola');
  });

  it('un texto con datos de contacto rechazado por el servidor no entra al historial', async () => {
    installFakeApi(
      handlers({
        [SEND]: () =>
          failure(400, 'validation_failed', [
            { field: 'body', issue: 'contiene datos de contacto' },
          ]),
      }),
    );
    await renderChat();
    await screen.findByLabelText(t.composer.fieldLabel);
    await fireEvent.changeText(
      screen.getByLabelText(t.composer.fieldLabel),
      'Escríbeme al 55 1234 5678',
    );
    await fireEvent.press(screen.getByRole('button', { name: t.composer.send }));
    expect(await screen.findByText(t.notice.moderationTitle)).toBeTruthy();
    expect(screen.queryByText('Escríbeme al 55 1234 5678')).toBeNull();
  });
});
