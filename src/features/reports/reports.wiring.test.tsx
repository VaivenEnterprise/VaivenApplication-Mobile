import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import ChatRoute from '@/app/chat/[id]';
import ItemRoute from '@/app/objeto/[id]';
import ProfileRoute from '@/app/usuario/[id]';
import { es } from '@/i18n/es-MX';
import { failure, fakeUser, installFakeApi, ok } from '@/test/fakeApi';
import { CONVERSATION_ID, OTHER, fakeConversation, fakeMessage } from '@/test/fakeChat';
import { fakeCategories, fakeItem, fakeOwner } from '@/test/fakeItems';

// Prueba de la conexión de «Reportar» en las rutas que la 011 enchufa (T009, CA-04, CA-05, CA-06).

let mockParams: { id: string } = { id: CONVERSATION_ID };
let mockUserId = 'otra-persona';
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => mockParams,
  useIsFocused: () => true,
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({
    status: 'signedIn',
    user: { ...jest.requireActual('@/test/fakeApi').fakeUser, id: mockUserId },
  }),
}));
jest.setTimeout(30_000);

const t = es.reports;
const POST = 'POST /reports';

function wrap(node: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

beforeEach(() => {
  mockUserId = 'otra-persona';
});
afterEach(() => jest.restoreAllMocks());

describe('objeto: «Reportar este objeto»', () => {
  const ITEM_ID = '6731a2b3c4d5e6f7a8b9c0d1';
  const handlers = (over = {}) => ({
    'GET /categories': () => ok(fakeCategories),
    [`GET /items/${ITEM_ID}`]: () => ok(fakeItem()),
    ...over,
  });

  it('CA-06: la persona abre «⋯», reporta el objeto y recibe la confirmación', async () => {
    mockParams = { id: ITEM_ID };
    const api = installFakeApi(handlers({ [POST]: () => ({ status: 201, body: { id: 'r1' } }) }));
    await wrap(<ItemRoute />);
    await fireEvent.press(await screen.findByRole('button', { name: es.items.detail.more }));
    await fireEvent.press(screen.getByRole('button', { name: t.button.item }));
    await fireEvent.press(screen.getByRole('radio', { name: t.reasons.prohibited_content }));
    await fireEvent.press(screen.getByRole('button', { name: t.sheet.submit }));
    expect(await screen.findByText(t.sheet.success)).toBeTruthy();
    expect(api.calls.find((c) => c.path === '/reports')?.body).toEqual({
      targetType: 'item',
      targetId: fakeItem().id,
      reason: 'prohibited_content',
    });
  });

  it('en un objeto propio no ofrece reportar', async () => {
    mockParams = { id: ITEM_ID };
    mockUserId = fakeOwner.id;
    installFakeApi(handlers());
    await wrap(<ItemRoute />);
    await fireEvent.press(await screen.findByRole('button', { name: es.items.detail.more }));
    expect(screen.queryByRole('button', { name: t.button.item })).toBeNull();
  });
});

describe('perfil público: reportar a la persona', () => {
  const publicUser = {
    id: 'abc',
    displayName: 'Beto Ruiz',
    ratingAverage: null,
    ratingCount: 0,
    memberSince: '2026-09-15T18:00:00Z',
  };
  const handlers = () => ({
    'GET /users/abc': () => ok(publicUser),
    'GET /users/abc/ratings': () => ok({ items: [], nextCursor: null }),
  });

  it('reporta a la persona', async () => {
    mockParams = { id: 'abc' };
    const api = installFakeApi({
      ...handlers(),
      [POST]: () => ({ status: 200, body: { id: 'r1' } }),
    });
    await wrap(<ProfileRoute />);
    await fireEvent.press(await screen.findByRole('button', { name: t.button.user }));
    await fireEvent.press(screen.getByRole('radio', { name: t.reasons.inappropriate }));
    await fireEvent.press(screen.getByRole('button', { name: t.sheet.submit }));
    expect(await screen.findByText(t.sheet.duplicate)).toBeTruthy();
    expect(api.calls.find((c) => c.path === '/reports')?.body).toMatchObject({
      targetType: 'user',
      targetId: 'abc',
    });
  });

  it('en el perfil propio no aparece el botón', async () => {
    mockParams = { id: 'abc' };
    mockUserId = 'abc';
    installFakeApi(handlers());
    await wrap(<ProfileRoute />);
    await screen.findByRole('header', { name: 'Beto Ruiz' });
    expect(screen.queryByRole('button', { name: t.button.user })).toBeNull();
  });
});

describe('chat: reportar mensaje y decisiones de moderación', () => {
  const MESSAGES = `GET /conversations/${CONVERSATION_ID}/messages`;
  const SEND = `POST /conversations/${CONVERSATION_ID}/messages`;
  const handlers = (over = {}) => ({
    'GET /conversations': () => ok({ items: [fakeConversation()], nextCursor: null }),
    'GET /conversations/unread-count': () => ok({ count: 0 }),
    [MESSAGES]: () =>
      ok({
        items: [
          fakeMessage('2', { senderId: fakeUser.id, body: 'Mío', clientId: 'c2' }),
          fakeMessage('1', { senderId: OTHER, body: 'Hola, ¿sigue disponible?' }),
        ],
        nextCursor: null,
      }),
    [`POST /conversations/${CONVERSATION_ID}/read`]: () => ({ status: 204 }),
    ...over,
  });

  beforeEach(() => {
    mockParams = { id: CONVERSATION_ID };
    mockUserId = fakeUser.id;
  });

  it('pulsación larga en un mensaje ajeno abre «Reportar» y envía targetType message', async () => {
    const api = installFakeApi(handlers({ [POST]: () => ({ status: 201, body: { id: 'r1' } }) }));
    await wrap(<ChatRoute />);
    const bubble = await screen.findByLabelText(/Hola, ¿sigue disponible\?/);
    await fireEvent(bubble, 'longPress');
    await fireEvent.press(await screen.findByRole('radio', { name: t.reasons.spam }));
    await fireEvent.press(screen.getByRole('button', { name: t.sheet.submit }));
    expect(await screen.findByText(t.sheet.success)).toBeTruthy();
    expect(api.calls.find((c) => c.path === '/reports')?.body).toEqual({
      targetType: 'message',
      targetId: '1',
      reason: 'spam',
    });
  });

  it('los mensajes propios no se pueden reportar', async () => {
    installFakeApi(handlers());
    await wrap(<ChatRoute />);
    const mine = await screen.findByLabelText(/Mío/);
    await fireEvent(mine, 'longPress');
    expect(screen.queryByText(t.sheet.reasonsLabel)).toBeNull();
  });

  it('CA-04: un texto rechazado muestra categoría y motivo, y se puede reportar la decisión', async () => {
    const api = installFakeApi(
      handlers({
        [SEND]: () =>
          failure(400, 'validation_failed', [
            { field: 'body', issue: 'Contiene contenido no permitido: armas.' },
          ]),
        [POST]: () => ({ status: 201, body: { id: 'r2' } }),
      }),
    );
    await wrap(<ChatRoute />);
    await fireEvent.changeText(
      await screen.findByPlaceholderText(es.chat.composer.placeholder),
      'vendo pistola',
    );
    await fireEvent.press(screen.getByRole('button', { name: es.chat.composer.send }));
    expect(await screen.findByText(t.moderation.title)).toBeTruthy();
    expect(screen.getByText('Armas')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.moderation.reportDecision }));
    const sheet = await screen.findByTestId('bottom-sheet');
    await fireEvent.press(within(sheet).getByRole('button', { name: t.sheet.submit }));
    expect(await screen.findAllByText(t.sheet.success)).not.toHaveLength(0);
    const body = api.calls.find((c) => c.path === '/reports')?.body as {
      targetType: string;
      reason: string;
      targetId: string;
    };
    expect(body).toMatchObject({ targetType: 'moderation_decision', reason: 'other' });
    expect(body.targetId.length).toBeLessThanOrEqual(64);
  });
});
