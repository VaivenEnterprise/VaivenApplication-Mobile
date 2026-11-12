import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import {
  AFTER_PAGE_SIZE,
  classifySendError,
  fetchConversations,
  fetchMessages,
  fetchMessagesAfter,
  fetchUnreadCount,
  markConversationRead,
  sendMessage,
} from '@/features/chat/api';
import {
  pullNewerMessages,
  useConversations,
  useMarkRead,
  useMessages,
  useOutbox,
  useUnreadCount,
} from '@/features/chat/hooks';
import { chatKeys } from '@/features/chat/keys';
import { mergeMessages } from '@/features/chat/merge';
import type { ConversationPage, MessagePage } from '@/features/chat/types';
import { ApiError } from '@/lib/api/errors';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { CONVERSATION_ID, ME, OTHER, fakeConversation, fakeMessage } from '@/test/fakeChat';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));

afterEach(() => jest.restoreAllMocks());

const MESSAGES = `/conversations/${CONVERSATION_ID}/messages`;
const READ = `/conversations/${CONVERSATION_ID}/read`;

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });
}
function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('api del chat', () => {
  it('fetchConversations pide GET /conversations con o sin cursor', async () => {
    const api = installFakeApi({
      'GET /conversations': () => ok({ items: [fakeConversation()], nextCursor: 'c1' }),
    });
    const page = await fetchConversations(null);
    expect(page.items[0]?.item.title).toBe('Taladro percutor');
    expect(page.nextCursor).toBe('c1');
    await fetchConversations('c1');
    expect(api.calls[0]?.query).toBe('');
    expect(new URLSearchParams(api.calls[1]?.query).get('cursor')).toBe('c1');
  });

  it('fetchUnreadCount devuelve el total', async () => {
    installFakeApi({ 'GET /conversations/unread-count': () => ok({ count: 3 }) });
    await expect(fetchUnreadCount()).resolves.toBe(3);
  });

  it('fetchMessages pide el historial y, con cursor, envía before', async () => {
    const api = installFakeApi({
      [`GET ${MESSAGES}`]: () => ok({ items: [fakeMessage('2')], nextCursor: '2' }),
    });
    const page = await fetchMessages(CONVERSATION_ID, null);
    expect(page.nextCursor).toBe('2');
    await fetchMessages(CONVERSATION_ID, '2');
    expect(api.calls[0]?.query).toBe('');
    expect(new URLSearchParams(api.calls[1]?.query).get('before')).toBe('2');
  });

  it('fetchMessagesAfter envía after y devuelve solo los mensajes', async () => {
    const api = installFakeApi({
      [`GET ${MESSAGES}`]: () => ok({ items: [fakeMessage('3')], nextCursor: null }),
    });
    const items = await fetchMessagesAfter(CONVERSATION_ID, '2');
    expect(items.map((m) => m.id)).toEqual(['3']);
    expect(new URLSearchParams(api.calls[0]?.query).get('after')).toBe('2');
  });

  it('sendMessage envía POST con el texto y el clientId', async () => {
    const api = installFakeApi({
      [`POST ${MESSAGES}`]: () => ({ status: 201, body: fakeMessage('9', { clientId: 'cid' }) }),
    });
    const message = await sendMessage(CONVERSATION_ID, 'Hola', 'cid');
    expect(message.id).toBe('9');
    expect(api.calls[0]?.body).toEqual({ body: 'Hola', clientId: 'cid' });
  });

  it('markConversationRead acepta la respuesta 204 sin cuerpo', async () => {
    const api = installFakeApi({ [`POST ${READ}`]: () => ({ status: 204 }) });
    await expect(markConversationRead(CONVERSATION_ID)).resolves.toBeUndefined();
    expect(api.calls[0]?.method).toBe('POST');
  });

  it('una respuesta que no cumple el esquema es invalid_response', async () => {
    installFakeApi({ 'GET /conversations/unread-count': () => ok({ count: 'tres' }) });
    await expect(fetchUnreadCount()).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('AFTER_PAGE_SIZE es el máximo del contrato (100)', () => {
    expect(AFTER_PAGE_SIZE).toBe(100);
  });
});

describe('classifySendError', () => {
  const api = (status: number, code: ApiError['code'], details: ApiError['details'] = []) =>
    new ApiError(code, 'x', status, 'r', details);

  it('400 validation_failed con detalle del cuerpo es moderación con su motivo', () => {
    const error = api(400, 'validation_failed', [{ field: 'body', issue: 'contiene groserías' }]);
    expect(classifySendError(error)).toEqual({ kind: 'moderation', reason: 'contiene groserías' });
  });

  it('400 sin detalle del cuerpo es moderación sin motivo', () => {
    expect(classifySendError(api(400, 'validation_failed'))).toEqual({
      kind: 'moderation',
      reason: null,
    });
  });

  it('429 es límite de ritmo y 409 conversación cerrada', () => {
    expect(classifySendError(api(429, 'rate_limited'))).toEqual({ kind: 'rate_limited' });
    expect(classifySendError(api(409, 'conflict'))).toEqual({ kind: 'closed' });
  });

  it('red, tiempo agotado, 5xx y errores desconocidos se pueden reintentar (null)', () => {
    expect(classifySendError(new ApiError('network_error', 'x', null, null))).toBeNull();
    expect(classifySendError(new ApiError('timeout', 'x', null, null))).toBeNull();
    expect(classifySendError(api(500, 'internal_error'))).toBeNull();
    expect(classifySendError(api(404, 'not_found'))).toBeNull();
    expect(classifySendError(new Error('otro'))).toBeNull();
  });
});

describe('listas con paginación', () => {
  it('useConversations sigue el cursor', async () => {
    const pages: Record<string, ConversationPage> = {
      '': { items: [fakeConversation({ id: 'a' })], nextCursor: 'c1' },
      c1: { items: [fakeConversation({ id: 'b' })], nextCursor: null },
    };
    installFakeApi({
      'GET /conversations': (r) => ok(pages[new URLSearchParams(r.query).get('cursor') ?? '']),
    });
    const client = makeClient();
    const { result } = await renderHook(() => useConversations(), { wrapper: wrapperFor(client) });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(1));
    expect(result.current.hasNextPage).toBe(true);
    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() =>
      expect(result.current.data?.pages.flatMap((p) => p.items.map((c) => c.id))).toEqual([
        'a',
        'b',
      ]),
    );
    expect(result.current.hasNextPage).toBe(false);
  });

  it('useMessages pide los anteriores con before', async () => {
    const pages: Record<string, MessagePage> = {
      '': { items: [fakeMessage('3'), fakeMessage('2')], nextCursor: '2' },
      '2': { items: [fakeMessage('1')], nextCursor: null },
    };
    installFakeApi({
      [`GET ${MESSAGES}`]: (r) => ok(pages[new URLSearchParams(r.query).get('before') ?? '']),
    });
    const { result } = await renderHook(() => useMessages(CONVERSATION_ID), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(result.current.data).toBeDefined());
    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() =>
      expect(result.current.data?.pages.flatMap((p) => p.items.map((m) => m.id))).toEqual([
        '3',
        '2',
        '1',
      ]),
    );
  });

  it('useUnreadCount lee el total', async () => {
    installFakeApi({ 'GET /conversations/unread-count': () => ok({ count: 4 }) });
    const { result } = await renderHook(() => useUnreadCount(), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(result.current.data).toBe(4));
  });
});

describe('pullNewerMessages (consulta periódica con after)', () => {
  const seed = (client: QueryClient, items = [fakeMessage('2'), fakeMessage('1')]) =>
    client.setQueryData(chatKeys.messages(CONVERSATION_ID), {
      pages: [{ items, nextCursor: null }],
      pageParams: [null],
    });
  const idsIn = (client: QueryClient) =>
    (
      client.getQueryData<{ pages: MessagePage[] }>(chatKeys.messages(CONVERSATION_ID))?.pages ?? []
    ).flatMap((p) => p.items.map((m) => m.id));

  it('pide after=<último id> y anexa los nuevos arriba', async () => {
    const api = installFakeApi({
      [`GET ${MESSAGES}`]: () =>
        ok({ items: [fakeMessage('3'), fakeMessage('4')], nextCursor: null }),
    });
    const client = makeClient();
    seed(client);
    const arrived = await pullNewerMessages(client, CONVERSATION_ID);
    expect(arrived.map((m) => m.id)).toEqual(['3', '4']);
    expect(new URLSearchParams(api.calls[0]?.query).get('after')).toBe('2');
    expect(idsIn(client)).toEqual(['4', '3', '2', '1']);
  });

  it('sin novedades no cambia nada', async () => {
    installFakeApi({ [`GET ${MESSAGES}`]: () => ok({ items: [], nextCursor: null }) });
    const client = makeClient();
    seed(client);
    await expect(pullNewerMessages(client, CONVERSATION_ID)).resolves.toEqual([]);
    expect(idsIn(client)).toEqual(['2', '1']);
  });

  it('si llegaron 100 vuelve a pedir hasta agotar', async () => {
    let calls = 0;
    const batch = (from: number, size: number) =>
      Array.from({ length: size }, (_, i) => fakeMessage(String(from + i).padStart(3, '0')));
    const api = installFakeApi({
      [`GET ${MESSAGES}`]: () => {
        calls += 1;
        return ok({ items: calls === 1 ? batch(100, 100) : batch(200, 3), nextCursor: null });
      },
    });
    const client = makeClient();
    seed(client, [fakeMessage('099')]);
    const arrived = await pullNewerMessages(client, CONVERSATION_ID);
    expect(arrived).toHaveLength(103);
    expect(new URLSearchParams(api.calls[1]?.query).get('after')).toBe('199');
  });

  it('con una conversación vacía pide el historial por si ya llegaron mensajes', async () => {
    const api = installFakeApi({
      [`GET ${MESSAGES}`]: () =>
        ok({ items: [fakeMessage('2'), fakeMessage('1')], nextCursor: null }),
    });
    const client = makeClient();
    seed(client, []);
    const arrived = await pullNewerMessages(client, CONVERSATION_ID);
    expect(arrived.map((m) => m.id)).toEqual(['1', '2']);
    expect(api.calls[0]?.query).toBe('');
    expect(idsIn(client)).toEqual(['2', '1']);
  });

  it('mientras la consulta principal no cargó no hace nada', async () => {
    const api = installFakeApi({});
    const client = makeClient();
    await expect(pullNewerMessages(client, CONVERSATION_ID)).resolves.toEqual([]);
    expect(api.calls).toHaveLength(0);
  });
});

describe('useMarkRead', () => {
  it('pone en cero los no leídos de la conversación y baja el total (CA-05)', async () => {
    installFakeApi({
      [`POST ${READ}`]: () => ({ status: 204 }),
      'GET /conversations/unread-count': () => ok({ count: 1 }),
    });
    const client = makeClient();
    client.setQueryData(chatKeys.conversations, {
      pages: [
        {
          items: [
            fakeConversation({ unreadCount: 2 }),
            fakeConversation({ id: 'otra', unreadCount: 1 }),
          ],
          nextCursor: null,
        },
      ],
      pageParams: [null],
    });
    client.setQueryData(chatKeys.unread, 3);
    const { result } = await renderHook(() => useMarkRead(CONVERSATION_ID), {
      wrapper: wrapperFor(client),
    });
    await act(async () => {
      await result.current.mutateAsync();
    });
    const data = client.getQueryData<{ pages: ConversationPage[] }>(chatKeys.conversations);
    expect(data?.pages[0]?.items.map((c) => c.unreadCount)).toEqual([0, 1]);
    expect(client.getQueryData(chatKeys.unread)).toBe(1);
  });

  it('sin caché de lista ni de total no falla', async () => {
    installFakeApi({ [`POST ${READ}`]: () => ({ status: 204 }) });
    const client = makeClient();
    const { result } = await renderHook(() => useMarkRead(CONVERSATION_ID), {
      wrapper: wrapperFor(client),
    });
    await act(async () => {
      await result.current.mutateAsync();
    });
    expect(client.getQueryData(chatKeys.unread)).toBeUndefined();
  });
});

describe('useOutbox (envío optimista)', () => {
  const setup = (handlers: Parameters<typeof installFakeApi>[0]) => {
    const api = installFakeApi(handlers);
    const client = makeClient();
    client.setQueryData(chatKeys.messages(CONVERSATION_ID), {
      pages: [{ items: [fakeMessage('1')], nextCursor: null }],
      pageParams: [null],
    });
    const restore = jest.fn();
    const hook = renderHook(() => useOutbox(CONVERSATION_ID, restore), {
      wrapper: wrapperFor(client),
    });
    return { api, client, restore, hook };
  };
  const serverIds = (client: QueryClient) =>
    (
      client.getQueryData<{ pages: MessagePage[] }>(chatKeys.messages(CONVERSATION_ID))?.pages ?? []
    ).flatMap((p) => p.items.map((m) => m.id));

  it('el mensaje aparece de inmediato como «enviando» y al confirmarse queda una sola burbuja', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const { hook, client, api } = setup({
      'GET /conversations': () => ok({ items: [], nextCursor: null }),
      [`POST ${MESSAGES}`]: async (r) => {
        await gate;
        const body = r.body as { body: string; clientId: string };
        return { status: 201, body: fakeMessage('2', { senderId: ME, ...body }) };
      },
    });
    const { result } = await hook;
    let accepted = false;
    await act(async () => {
      accepted = result.current.send('  Hola  ');
    });
    expect(accepted).toBe(true);
    expect(result.current.sending).toBe(true);
    expect(result.current.pending).toHaveLength(1);
    expect(result.current.pending[0]).toMatchObject({ body: 'Hola', status: 'sending' });
    await act(async () => {
      release();
      await gate;
    });
    await waitFor(() => expect(result.current.pending).toHaveLength(0));
    expect(result.current.sending).toBe(false);
    expect(serverIds(client)).toEqual(['2', '1']);
    expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(1);
  });

  it('sin red queda «no enviado» y reintentar usa el MISMO clientId sin duplicar (CA-01)', async () => {
    const clientIds: string[] = [];
    let online = false;
    const { hook, client, restore } = setup({
      'GET /conversations': () => ok({ items: [], nextCursor: null }),
      [`POST ${MESSAGES}`]: (r) => {
        const body = r.body as { body: string; clientId: string };
        clientIds.push(body.clientId);
        return online
          ? { status: 200, body: fakeMessage('2', { senderId: ME, ...body }) }
          : failure(503, 'service_unavailable');
      },
    });
    const { result } = await hook;
    await act(async () => {
      result.current.send('Hola');
    });
    await waitFor(() => expect(result.current.pending[0]?.status).toBe('failed'));
    expect(restore).not.toHaveBeenCalled();
    const failedId = result.current.pending[0]!.clientId;
    // El mensaje se ve una sola vez aunque el servidor aún no lo tenga.
    expect(mergeMessages([fakeMessage('1')], result.current.pending, ME)).toHaveLength(2);

    online = true;
    await act(async () => {
      result.current.retry(failedId);
    });
    await waitFor(() => expect(result.current.pending).toHaveLength(0));
    expect(clientIds).toEqual([failedId, failedId]);
    expect(serverIds(client)).toEqual(['2', '1']);
    // Reintentar algo que ya no está pendiente no hace nada.
    await act(async () => {
      result.current.retry(failedId);
      result.current.retry('desconocido');
    });
    expect(clientIds).toHaveLength(2);
  });

  it('un 5xx también queda «no enviado»', async () => {
    const { hook } = setup({ [`POST ${MESSAGES}`]: () => failure(500, 'internal_error') });
    const { result } = await hook;
    await act(async () => {
      result.current.send('Hola');
    });
    await waitFor(() => expect(result.current.pending[0]?.status).toBe('failed'));
    expect(result.current.rejection).toBeNull();
  });

  it('moderación: sale de la lista, devuelve el texto al campo y muestra el motivo (CA-06)', async () => {
    const { hook, restore } = setup({
      [`POST ${MESSAGES}`]: () =>
        failure(400, 'validation_failed', [{ field: 'body', issue: 'contiene datos de contacto' }]),
    });
    const { result } = await hook;
    await act(async () => {
      result.current.send('Mi número es 555');
    });
    await waitFor(() => expect(result.current.rejection).not.toBeNull());
    expect(result.current.rejection).toEqual({
      kind: 'moderation',
      reason: 'contiene datos de contacto',
    });
    expect(result.current.pending).toHaveLength(0);
    expect(restore).toHaveBeenCalledWith('Mi número es 555');
    await act(async () => result.current.dismissRejection());
    expect(result.current.rejection).toBeNull();
  });

  it('límite de ritmo (429): devuelve el texto y avisa', async () => {
    const { hook, restore } = setup({ [`POST ${MESSAGES}`]: () => failure(429, 'rate_limited') });
    const { result } = await hook;
    await act(async () => {
      result.current.send('Hola');
    });
    await waitFor(() => expect(result.current.rejection).toEqual({ kind: 'rate_limited' }));
    expect(restore).toHaveBeenCalledWith('Hola');
  });

  it('conversación cerrada (409): avisa y vuelve a pedir la lista, sin devolver el texto', async () => {
    const { hook, restore, api } = setup({
      [`POST ${MESSAGES}`]: () => failure(409, 'conflict'),
      'GET /conversations': () => ok({ items: [], nextCursor: null }),
    });
    const { result } = await hook;
    await act(async () => {
      result.current.send('Hola');
    });
    await waitFor(() => expect(result.current.rejection).toEqual({ kind: 'closed' }));
    expect(restore).not.toHaveBeenCalled();
    expect(result.current.pending).toHaveLength(0);
    expect(api.calls.some((c) => c.method === 'GET' && c.path === '/conversations')).toBe(false);
  });

  it('no envía textos vacíos ni de más de 1,000 caracteres', async () => {
    const { hook, api } = setup({});
    const { result } = await hook;
    let results: boolean[] = [];
    await act(async () => {
      results = [result.current.send('   '), result.current.send('a'.repeat(1001))];
    });
    expect(results).toEqual([false, false]);
    expect(api.calls).toHaveLength(0);
    expect(result.current.pending).toHaveLength(0);
  });

  it('un mensaje nuevo limpia el aviso anterior', async () => {
    let calls = 0;
    const { hook } = setup({
      [`POST ${MESSAGES}`]: (r) => {
        calls += 1;
        const body = r.body as { body: string; clientId: string };
        return calls === 1
          ? failure(429, 'rate_limited')
          : { status: 201, body: fakeMessage('2', { senderId: ME, ...body }) };
      },
      'GET /conversations': () => ok({ items: [], nextCursor: null }),
    });
    const { result } = await hook;
    await act(async () => {
      result.current.send('Hola');
    });
    await waitFor(() => expect(result.current.rejection).not.toBeNull());
    await act(async () => {
      result.current.send('Hola');
    });
    await waitFor(() => expect(result.current.rejection).toBeNull());
    await waitFor(() => expect(result.current.pending).toHaveLength(0));
    expect(OTHER).not.toBe(ME);
  });
});
