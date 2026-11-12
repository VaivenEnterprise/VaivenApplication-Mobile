import {
  appendNewer,
  dayKey,
  findConversation,
  latestMessageId,
  mergeMessages,
  replaceFirstConversationPage,
  withDaySeparators,
} from '@/features/chat/merge';
import type { ConversationPage, Message, MessagePage, PendingMessage } from '@/features/chat/types';
import { fakeConversation, fakeMessage, ME, OTHER } from '@/test/fakeChat';

const pending = (over: Partial<PendingMessage> = {}): PendingMessage => ({
  clientId: 'cid-1',
  body: 'Hola',
  status: 'sending',
  createdAt: '2026-11-12T18:00:00.000Z',
  ...over,
});

describe('mergeMessages', () => {
  it('conserva el orden del servidor (más nuevo primero) y marca los propios', () => {
    const server = [
      fakeMessage('3', { senderId: OTHER }),
      fakeMessage('2', { senderId: ME }),
      fakeMessage('1', { senderId: OTHER }),
    ];
    const merged = mergeMessages(server, [], ME);
    expect(merged.map((m) => m.id)).toEqual(['3', '2', '1']);
    expect(merged.map((m) => m.mine)).toEqual([false, true, false]);
    expect(merged.every((m) => m.status === 'sent')).toBe(true);
  });

  it('no reordena por fecha: dos mensajes del mismo segundo mantienen el orden del servidor', () => {
    const at = '2026-11-12T18:00:00Z';
    const server = [
      fakeMessage('b', { createdAt: at }),
      fakeMessage('a', { createdAt: '2026-11-12T18:00:01Z' }),
    ];
    expect(mergeMessages(server, [], ME).map((m) => m.id)).toEqual(['b', 'a']);
  });

  it('quita duplicados por id', () => {
    const server = [fakeMessage('2'), fakeMessage('2'), fakeMessage('1')];
    expect(mergeMessages(server, [], ME).map((m) => m.id)).toEqual(['2', '1']);
  });

  it('pone los pendientes arriba, el más nuevo primero', () => {
    const merged = mergeMessages(
      [fakeMessage('1')],
      [
        pending({ clientId: 'a', body: 'uno', createdAt: '2026-11-12T18:00:00.000Z' }),
        pending({ clientId: 'b', body: 'dos', createdAt: '2026-11-12T18:00:05.000Z' }),
      ],
      ME,
    );
    expect(merged.map((m) => m.body)).toEqual(['dos', 'uno', 'Mensaje 1']);
    expect(merged[0]).toMatchObject({ id: null, mine: true, status: 'sending' });
  });

  it('a igual fecha, el pendiente enviado después queda arriba', () => {
    const at = '2026-11-12T18:00:00.000Z';
    const merged = mergeMessages(
      [],
      [
        pending({ clientId: 'a', body: 'primero', createdAt: at }),
        pending({ clientId: 'b', body: 'segundo', createdAt: at }),
      ],
      ME,
    );
    expect(merged.map((m) => m.body)).toEqual(['segundo', 'primero']);
  });

  it('con fechas inválidas igualmente ordena por posición', () => {
    const merged = mergeMessages(
      [],
      [
        pending({ clientId: 'a', body: 'primero', createdAt: 'x' }),
        pending({ clientId: 'b', body: 'segundo', createdAt: 'y' }),
      ],
      ME,
    );
    expect(merged.map((m) => m.body)).toEqual(['segundo', 'primero']);
  });

  it('el eco del servidor reemplaza al pendiente con el mismo clientId (sin duplicar)', () => {
    const echo = fakeMessage('9', { senderId: ME, clientId: 'cid-1', body: 'Hola' });
    const merged = mergeMessages([echo], [pending({ clientId: 'cid-1' })], ME);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ id: '9', status: 'sent', key: 'c:cid-1' });
  });

  it('el reintento reutiliza el clientId: ni antes ni después del eco hay dos burbujas', () => {
    const failed = pending({ status: 'failed' });
    const retried = pending({ status: 'sending' });
    expect(mergeMessages([], [failed], ME)).toHaveLength(1);
    expect(mergeMessages([], [retried], ME)[0]?.status).toBe('sending');
    const echo = fakeMessage('9', { senderId: ME, clientId: 'cid-1' });
    expect(mergeMessages([echo], [retried], ME)).toHaveLength(1);
  });

  it('un clientId repetido entre pendientes cuenta una sola vez', () => {
    const merged = mergeMessages([], [pending(), pending({ body: 'copia' })], ME);
    expect(merged).toHaveLength(1);
  });

  it('el clientId de la otra persona no esconde un pendiente propio con el mismo valor', () => {
    const theirs = fakeMessage('5', { senderId: OTHER, clientId: 'cid-1' });
    const merged = mergeMessages([theirs], [pending({ clientId: 'cid-1' })], ME);
    expect(merged.map((m) => m.mine)).toEqual([true, false]);
    expect(merged[1]?.key).toBe('m:5');
  });
});

describe('withDaySeparators', () => {
  const at = (day: number, hour: number) => new Date(2026, 10, day, hour, 0, 0).toISOString();

  it('pone un separador después del mensaje más antiguo de cada día (lista invertida)', () => {
    const messages = mergeMessages(
      [
        fakeMessage('4', { createdAt: at(12, 10) }),
        fakeMessage('3', { createdAt: at(12, 9) }),
        fakeMessage('2', { createdAt: at(11, 20) }),
        fakeMessage('1', { createdAt: at(10, 8) }),
      ],
      [],
      ME,
    );
    const entries = withDaySeparators(messages);
    expect(entries.map((e) => (e.type === 'day' ? 'D' : e.message.id))).toEqual([
      '4',
      '3',
      'D',
      '2',
      'D',
      '1',
      'D',
    ]);
  });

  it('una lista vacía no tiene separadores', () => {
    expect(withDaySeparators([])).toEqual([]);
  });

  it('dayKey es vacío con una fecha inválida', () => {
    expect(dayKey('no es fecha')).toBe('');
  });
});

describe('caché de mensajes', () => {
  const page = (items: Message[], nextCursor: string | null = null): MessagePage => ({
    items,
    nextCursor,
  });
  const data = (pages: MessagePage[]) => ({ pages, pageParams: pages.map(() => null) });

  it('latestMessageId es el primero de la primera página', () => {
    expect(latestMessageId(data([page([fakeMessage('5'), fakeMessage('4')])]))).toBe('5');
    expect(latestMessageId(undefined)).toBeNull();
    expect(latestMessageId(data([page([])]))).toBeNull();
  });

  it('appendNewer pone arriba los nuevos (llegan ascendentes) sin duplicar', () => {
    const before = data([
      page([fakeMessage('2'), fakeMessage('1')], 'c'),
      page([fakeMessage('0')]),
    ]);
    const after = appendNewer(before, [fakeMessage('2'), fakeMessage('3'), fakeMessage('4')]);
    expect(after.pages[0]?.items.map((m) => m.id)).toEqual(['4', '3', '2', '1']);
    expect(after.pages[0]?.nextCursor).toBe('c');
    expect(after.pages[1]?.items.map((m) => m.id)).toEqual(['0']);
  });

  it('appendNewer sin novedades devuelve el mismo objeto', () => {
    const before = data([page([fakeMessage('2')])]);
    expect(appendNewer(before, [fakeMessage('2')])).toBe(before);
    expect(appendNewer(before, [])).toBe(before);
  });

  it('appendNewer crea la primera página si el caché está vacío', () => {
    const created = appendNewer(undefined, [fakeMessage('1'), fakeMessage('2')]);
    expect(created.pages[0]?.items.map((m) => m.id)).toEqual(['2', '1']);
    expect(created.pageParams).toEqual([null]);
    const empty = appendNewer({ pages: [], pageParams: [] }, [fakeMessage('7')]);
    expect(empty.pages[0]?.items.map((m) => m.id)).toEqual(['7']);
  });
});

describe('caché de conversaciones', () => {
  const page = (ids: string[], nextCursor: string | null = null): ConversationPage => ({
    items: ids.map((id) => fakeConversation({ id })),
    nextCursor,
  });
  const data = (pages: ConversationPage[]) => ({ pages, pageParams: pages.map(() => null) });

  it('replaceFirstConversationPage reemplaza la primera y no repite filas de las siguientes', () => {
    const before = data([page(['a', 'b'], 'x'), page(['c', 'd'])]);
    const after = replaceFirstConversationPage(before, page(['d', 'a'], 'x'));
    expect(after.pages[0]?.items.map((c) => c.id)).toEqual(['d', 'a']);
    expect(after.pages[1]?.items.map((c) => c.id)).toEqual(['c']);
  });

  it('sin caché crea la primera página', () => {
    const created = replaceFirstConversationPage(undefined, page(['a']));
    expect(created.pages).toHaveLength(1);
    expect(
      replaceFirstConversationPage({ pages: [], pageParams: [] }, page(['a'])).pages,
    ).toHaveLength(1);
  });

  it('findConversation busca en todas las páginas cargadas', () => {
    const d = data([page(['a']), page(['b'])]);
    expect(findConversation(d, 'b')?.id).toBe('b');
    expect(findConversation(d, 'z')).toBeUndefined();
    expect(findConversation(undefined, 'a')).toBeUndefined();
  });
});
