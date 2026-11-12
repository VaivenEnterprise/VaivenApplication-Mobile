import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { OpenChatButton } from '@/features/chat/components/OpenChatButton';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { installFakeApi, ok } from '@/test/fakeApi';
import { fakeBooking } from '@/test/fakeBookings';
import { CONVERSATION_ID, fakeConversation } from '@/test/fakeChat';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));

const t = es.chat.section;

beforeEach(() => mockPush.mockReset());
afterEach(() => jest.restoreAllMocks());

function renderButton(conversationId: string | null | undefined) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={client}>
      <OpenChatButton booking={fakeBooking({ conversationId })} />
    </QueryClientProvider>,
  );
}

describe('OpenChatButton', () => {
  it('sin conversación (reserva pendiente sin chat) no pinta nada (RF-10)', async () => {
    const api = installFakeApi({ 'GET /conversations': () => ok({ items: [], nextCursor: null }) });
    await renderButton(null);
    await waitFor(() => expect(api.calls.length).toBeGreaterThan(0));
    expect(screen.queryByText(t.open)).toBeNull();
    await renderButton(undefined);
    expect(screen.queryByText(t.open)).toBeNull();
  });

  it('con conversación muestra «Abrir chat», el último mensaje y los no leídos, y navega', async () => {
    installFakeApi({
      'GET /conversations': () =>
        ok({
          items: [
            fakeConversation({
              unreadCount: 2,
              lastMessage: { preview: 'Ya llegué', at: '2026-11-12T18:00:00Z', senderId: 'x' },
            }),
          ],
          nextCursor: null,
        }),
    });
    await renderButton(CONVERSATION_ID);
    expect(await screen.findByText('Ya llegué')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: new RegExp(`2 ${t.unread}`) }));
    expect(mockPush).toHaveBeenCalledWith(routes.chat(CONVERSATION_ID));
  });

  it('sin mensajes todavía sugiere coordinar el encuentro y no muestra contador', async () => {
    installFakeApi({
      'GET /conversations': () =>
        ok({ items: [fakeConversation({ lastMessage: null })], nextCursor: null }),
    });
    await renderButton(CONVERSATION_ID);
    expect(await screen.findByText(t.noMessages)).toBeTruthy();
    expect(screen.getByText(t.open)).toBeTruthy();
  });

  it('mientras la lista no llega igualmente permite abrir el chat', async () => {
    installFakeApi({
      'GET /conversations': () => ({
        status: 500,
        body: { error: { code: 'internal_error', message: 'x', details: [] } },
      }),
    });
    await renderButton(CONVERSATION_ID);
    await fireEvent.press(await screen.findByRole('button', { name: t.openA11y }));
    expect(mockPush).toHaveBeenCalledWith(routes.chat(CONVERSATION_ID));
  });
});
