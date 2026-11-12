import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ConversationsScreen } from '@/features/chat/screens/ConversationsScreen';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { failure, fakeUser, installFakeApi, ok } from '@/test/fakeApi';
import { ME, OTHER, fakeConversation } from '@/test/fakeChat';

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

beforeEach(() => {
  mockPush.mockReset();
  mockBack.mockReset();
});
afterEach(() => jest.restoreAllMocks());

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ConversationsScreen />
    </QueryClientProvider>,
  );
}

const sample = [
  fakeConversation({
    id: 'c1',
    unreadCount: 2,
    lastMessage: { preview: 'Ya llegué', at: new Date().toISOString(), senderId: OTHER },
  }),
  fakeConversation({
    id: 'c2',
    canWrite: false,
    bookingStatus: 'completed',
    counterpart: { ...fakeConversation().counterpart, id: 'u2', displayName: 'Marta Ruiz' },
    item: { id: 'i2', title: 'Escalera', thumbUrl: null },
    lastMessage: { preview: 'Gracias por todo', at: new Date().toISOString(), senderId: ME },
  }),
];

describe('ConversationsScreen', () => {
  it('lista las conversaciones con contraparte, objeto, último mensaje y no leídos (RF-01)', async () => {
    installFakeApi({ 'GET /conversations': () => ok({ items: sample, nextCursor: null }) });
    await renderScreen();
    expect(await screen.findByText('Luis Pérez')).toBeTruthy();
    expect(screen.getByText('Taladro percutor')).toBeTruthy();
    expect(screen.getByText('Ya llegué')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('Marta Ruiz')).toBeTruthy();
    expect(screen.getByText('Tú: Gracias por todo')).toBeTruthy();
    expect(screen.getByRole('button', { name: new RegExp(t.list.closed) })).toBeTruthy();
    expect(screen.getByRole('header', { name: t.title })).toBeTruthy();
  });

  it('tocar una fila abre su chat', async () => {
    installFakeApi({ 'GET /conversations': () => ok({ items: sample, nextCursor: null }) });
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: /Luis Pérez/ }));
    expect(mockPush).toHaveBeenCalledWith(routes.chat('c1'));
  });

  it('«Volver» regresa a la pantalla anterior', async () => {
    installFakeApi({ 'GET /conversations': () => ok({ items: sample, nextCursor: null }) });
    await renderScreen();
    await screen.findByText('Luis Pérez');
    await fireEvent.press(screen.getByRole('button', { name: es.common.back }));
    expect(mockBack).toHaveBeenCalled();
  });

  it('sin conversaciones explica cuándo aparecen', async () => {
    installFakeApi({ 'GET /conversations': () => ok({ items: [], nextCursor: null }) });
    await renderScreen();
    expect(await screen.findByText(t.list.emptyTitle)).toBeTruthy();
    expect(screen.getByText(t.list.emptyDescription)).toBeTruthy();
  });

  it('mientras carga muestra marcadores de posición', async () => {
    installFakeApi({ 'GET /conversations': () => new Promise(() => undefined) as never });
    await renderScreen();
    expect(screen.getByTestId('conversations-skeleton')).toBeTruthy();
  });

  it('si falla ofrece reintentar', async () => {
    let failing = true;
    installFakeApi({
      'GET /conversations': () =>
        failing ? failure(500, 'internal_error') : ok({ items: sample, nextCursor: null }),
    });
    await renderScreen();
    const retry = await screen.findByRole('button', { name: es.common.retry });
    failing = false;
    await fireEvent.press(retry);
    expect(await screen.findByText('Luis Pérez')).toBeTruthy();
  });

  it('al llegar al final pide la página siguiente', async () => {
    const api = installFakeApi({
      'GET /conversations': (r) =>
        new URLSearchParams(r.query).get('cursor') === 'p2'
          ? ok({
              items: [
                fakeConversation({
                  id: 'c3',
                  counterpart: {
                    ...fakeConversation().counterpart,
                    id: 'u3',
                    displayName: 'Pedro Gil',
                  },
                }),
              ],
              nextCursor: null,
            })
          : ok({ items: [sample[0]], nextCursor: 'p2' }),
    });
    await renderScreen();
    await screen.findByText('Luis Pérez');
    await fireEvent(screen.getByTestId('conversations-list'), 'endReached');
    expect(await screen.findByText('Pedro Gil')).toBeTruthy();
    expect(api.calls.some((c) => new URLSearchParams(c.query).get('cursor') === 'p2')).toBe(true);
  });
});

describe('ConversationsScreen: consulta periódica (RF-04)', () => {
  beforeEach(() => jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] }));
  afterEach(() => jest.useRealTimers());

  it('cada 20 s vuelve a pedir la primera página y aparece la conversación nueva', async () => {
    let updated = false;
    const api = installFakeApi({
      'GET /conversations': () =>
        ok({
          items: updated
            ? [
                fakeConversation({
                  id: 'nueva',
                  counterpart: {
                    ...fakeConversation().counterpart,
                    id: 'u9',
                    displayName: 'Rosa Díaz',
                  },
                }),
                ...sample,
              ]
            : sample,
          nextCursor: null,
        }),
    });
    await renderScreen();
    await screen.findByText('Luis Pérez');
    expect(screen.queryByText('Rosa Díaz')).toBeNull();
    updated = true;
    const before = api.calls.length;
    await act(async () => {
      await jest.advanceTimersByTimeAsync(20_000);
    });
    expect(await screen.findByText('Rosa Díaz')).toBeTruthy();
    expect(api.calls.length).toBeGreaterThan(before);
    await waitFor(() => expect(screen.getAllByText('Luis Pérez')).toHaveLength(1));
  });
});
