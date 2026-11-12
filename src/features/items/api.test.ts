import {
  createItem,
  deleteItem,
  getItem,
  getPriceSuggestion,
  listCategories,
  listMyItems,
  pauseItem,
  resumeItem,
  updateItem,
} from '@/features/items/api';
import { itemsKeys } from '@/features/items/keys';
import { ApiError } from '@/lib/api/errors';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { fakeCategories, fakeItem } from '@/test/fakeItems';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));

afterEach(() => jest.restoreAllMocks());

const ID = '6731a2b3c4d5e6f7a8b9c0d1';

describe('api de objetos', () => {
  it('createItem envía POST /items con el cuerpo y valida el Item', async () => {
    const api = installFakeApi({ 'POST /items': () => ({ status: 201, body: fakeItem() }) });
    const body = {
      title: 'Taladro',
      description: '',
      category: 'hogar',
      condition: 'good' as const,
      modality: 'loan' as const,
      declaredValueCents: 100_000,
      pricePerDayCents: 0,
      priceSource: 'manual' as const,
      zone: { municipality: 'Tlalpan' },
      photos: [{ publicId: 'p1' }],
    };
    const item = await createItem(body);
    expect(item.id).toBe(ID);
    expect(api.calls[0]).toMatchObject({ method: 'POST', path: '/items', body });
  });

  it('getItem pide GET /items/{id}', async () => {
    const api = installFakeApi({
      [`GET /items/${ID}`]: () => ok(fakeItem({ declaredValueCents: null })),
    });
    const item = await getItem(ID);
    expect(item.declaredValueCents).toBeNull();
    expect(api.calls[0]?.path).toBe(`/items/${ID}`);
  });

  it('updateItem envía PATCH con version', async () => {
    const api = installFakeApi({ [`PATCH /items/${ID}`]: () => ok(fakeItem({ version: 2 })) });
    const item = await updateItem(ID, {
      version: 1,
      pricePerDayCents: 3_500,
      priceSource: 'manual',
    });
    expect(item.version).toBe(2);
    expect(api.calls[0]?.body).toEqual({
      version: 1,
      pricePerDayCents: 3_500,
      priceSource: 'manual',
    });
  });

  it('deleteItem acepta 204 sin cuerpo', async () => {
    const api = installFakeApi({ [`DELETE /items/${ID}`]: () => ({ status: 204, body: null }) });
    await expect(deleteItem(ID)).resolves.toBeUndefined();
    expect(api.calls[0]?.method).toBe('DELETE');
  });

  it('pauseItem y resumeItem usan POST sin cuerpo', async () => {
    const api = installFakeApi({
      [`POST /items/${ID}/pause`]: () => ok(fakeItem({ status: 'paused' })),
      [`POST /items/${ID}/resume`]: () => ok(fakeItem({ status: 'active' })),
    });
    expect((await pauseItem(ID)).status).toBe('paused');
    expect((await resumeItem(ID)).status).toBe('active');
    expect(api.calls.map((c) => c.path)).toEqual([`/items/${ID}/pause`, `/items/${ID}/resume`]);
  });

  it('listMyItems arma estado, cursor y límite', async () => {
    const api = installFakeApi({
      'GET /me/items': () => ok({ items: [fakeItem()], nextCursor: 'c2' }),
    });
    const page = await listMyItems({ status: 'paused', cursor: 'c1', limit: 10 });
    expect(page.nextCursor).toBe('c2');
    const query = new URLSearchParams(api.calls[0]?.query);
    expect(Object.fromEntries(query)).toEqual({ status: 'paused', cursor: 'c1', limit: '10' });
  });

  it('listMyItems sin filtros pide 20 y no manda status ni cursor', async () => {
    const api = installFakeApi({ 'GET /me/items': () => ok({ items: [], nextCursor: null }) });
    await listMyItems();
    expect(api.calls[0]?.query).toBe('limit=20');
  });

  it('getPriceSuggestion devuelve los centavos sugeridos', async () => {
    const api = installFakeApi({
      'GET /items/price-suggestion': () => ok({ suggestedPricePerDayCents: 3_000 }),
    });
    await expect(getPriceSuggestion(100_000)).resolves.toBe(3_000);
    expect(api.calls[0]?.query).toBe('declaredValueCents=100000');
  });

  it('listCategories devuelve las categorías del servidor', async () => {
    installFakeApi({ 'GET /categories': () => ok(fakeCategories) });
    await expect(listCategories()).resolves.toEqual(fakeCategories);
  });

  it('rechaza respuestas que no cumplen el contrato', async () => {
    installFakeApi({ [`GET /items/${ID}`]: () => ok({ id: ID }) });
    await expect(getItem(ID)).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('propaga el error del servidor con código y detalles', async () => {
    installFakeApi({
      'POST /items': () =>
        failure(400, 'validation_failed', [{ field: 'title', issue: 'No permitido' }]),
    });
    const error = await createItem({} as never).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).details).toEqual([{ field: 'title', issue: 'No permitido' }]);
  });
});

describe('itemsKeys', () => {
  it('mine() es prefijo de mine(status)', () => {
    expect(itemsKeys.mine()).toEqual(['items', 'mine']);
    expect(itemsKeys.mine('paused')).toEqual(['items', 'mine', 'paused']);
    expect(itemsKeys.detail('a')).toEqual(['items', 'detail', 'a']);
    expect(itemsKeys.priceSuggestion(5_000)).toEqual(['items', 'price-suggestion', 5_000]);
    expect(itemsKeys.categories).toEqual(['items', 'categories']);
  });
});
