import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ItemDetailScreen } from '@/features/items/screens/ItemDetailScreen';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { fakeCategories, fakeItem, fakeOwner } from '@/test/fakeItems';

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn() }),
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
let mockUserId = 'otra-persona';
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({
    status: 'signedIn',
    user: { ...jest.requireActual('@/test/fakeApi').fakeUser, id: mockUserId },
  }),
}));

const t = es.items.detail;
const o = es.items.owner;
const ID = '6731a2b3c4d5e6f7a8b9c0d1';
const OWNER_ID = fakeOwner.id;

function renderDetail(props: Partial<React.ComponentProps<typeof ItemDetailScreen>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ItemDetailScreen id={ID} {...props} />
    </QueryClientProvider>,
  );
}

const base = {
  'GET /categories': () => ok(fakeCategories),
};

beforeEach(() => {
  mockPush.mockReset();
  mockBack.mockReset();
  mockUserId = 'otra-persona';
});
afterEach(() => jest.restoreAllMocks());

describe('ItemDetailScreen — tercero', () => {
  const stranger = () =>
    installFakeApi({
      ...base,
      [`GET /items/${ID}`]: () => ok(fakeItem({ declaredValueCents: null })),
    });

  it('muestra título, chips, precio, dueño, zona, descripción y reglas', async () => {
    stranger();
    await renderDetail();
    expect(await screen.findByText('Taladro percutor 600 W')).toBeTruthy();
    expect(await screen.findByText('Herramientas eléctricas')).toBeTruthy();
    expect(screen.getByText(es.items.condition.good)).toBeTruthy();
    expect(screen.getByText(es.items.modality.rent)).toBeTruthy();
    expect(screen.getByText('$30')).toBeTruthy();
    expect(screen.getByText(es.items.money.perDay)).toBeTruthy();
    expect(screen.getByText('Ana López')).toBeTruthy();
    expect(screen.getByText(`Del Carmen · ${t.zoneApprox}`)).toBeTruthy();
    expect(screen.getByText('Incluye estuche y 5 brocas para concreto.')).toBeTruthy();
    expect(screen.getByText('Devolver limpio. No usar en metal.')).toBeTruthy();
  });

  it('CA-05: no muestra el valor declarado ni acciones de administración', async () => {
    stranger();
    await renderDetail();
    await screen.findByText('Taladro percutor 600 W');
    expect(screen.queryByText(t.declaredValue)).toBeNull();
    expect(screen.queryByText(/\$1,000/)).toBeNull();
    expect(screen.queryByRole('button', { name: o.edit })).toBeNull();
    expect(screen.queryByRole('button', { name: o.pause })).toBeNull();
    expect(screen.queryByRole('button', { name: t.more })).toBeNull();
  });

  it('aunque el servidor mandara el valor, un tercero no lo ve', async () => {
    installFakeApi({ ...base, [`GET /items/${ID}`]: () => ok(fakeItem()) });
    await renderDetail();
    await screen.findByText('Taladro percutor 600 W');
    expect(screen.queryByText(t.declaredValue)).toBeNull();
  });

  it('no muestra «Identidad verificada» ni coordenadas', async () => {
    stranger();
    await renderDetail();
    await screen.findByText('Taladro percutor 600 W');
    expect(screen.queryByText(/verificad/i)).toBeNull();
    expect(screen.queryByText(/19\.35/)).toBeNull();
  });

  it('préstamo: «Gratis» en vez de precio', async () => {
    installFakeApi({
      ...base,
      [`GET /items/${ID}`]: () =>
        ok(fakeItem({ modality: 'loan', pricePerDayCents: 0, declaredValueCents: null })),
    });
    await renderDetail();
    await screen.findByText('Taladro percutor 600 W');
    expect(screen.getByText(es.items.money.free)).toBeTruthy();
    expect(screen.queryByText(es.items.money.perDay)).toBeNull();
  });

  it('abre el perfil del propietario', async () => {
    stranger();
    await renderDetail();
    await screen.findByText('Ana López');
    await fireEvent.press(screen.getByLabelText(new RegExp(`^${t.owner} Ana López`)));
    expect(mockPush).toHaveBeenCalledWith(routes.user(OWNER_ID));
  });

  it('sin slots no dibuja «Solicitar»; con slots los monta', async () => {
    stranger();
    const { unmount } = await renderDetail();
    await screen.findByText('Taladro percutor 600 W');
    expect(screen.queryByText(t.request)).toBeNull();
    await unmount();

    stranger();
    await renderDetail({
      renderActions: (item) => <Text>{`${t.request} ${item.id}`}</Text>,
      renderOwnerExtras: () => <Text>Reportar</Text>,
      renderEffects: (item) => <Text>{`efecto ${item.title}`}</Text>,
    });
    expect(await screen.findByText(`${t.request} ${ID}`)).toBeTruthy();
    expect(screen.getByText('efecto Taladro percutor 600 W')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.more }));
    expect(await screen.findByText('Reportar')).toBeTruthy();
    expect(screen.queryByText(o.delete)).toBeNull();
  });

  it('plega las reglas largas con «Ver más»', async () => {
    installFakeApi({
      ...base,
      [`GET /items/${ID}`]: () =>
        ok(fakeItem({ declaredValueCents: null, usageRules: 'Regla larga. '.repeat(20) })),
    });
    await renderDetail();
    await screen.findByText('Taladro percutor 600 W');
    await fireEvent.press(screen.getByRole('button', { name: t.seeMore }));
    expect(screen.getByRole('button', { name: t.seeLess })).toBeTruthy();
  });

  it('sin descripción ni reglas omite esos bloques', async () => {
    installFakeApi({
      ...base,
      [`GET /items/${ID}`]: () =>
        ok(fakeItem({ declaredValueCents: null, description: '', usageRules: null, photos: [] })),
    });
    await renderDetail();
    await screen.findByText('Taladro percutor 600 W');
    expect(screen.queryByText(t.description)).toBeNull();
    expect(screen.queryByText(t.rules)).toBeNull();
    expect(screen.getByLabelText(t.noPhoto)).toBeTruthy();
  });

  it('un objeto pausado no muestra el aviso a terceros; uno bloqueado sí', async () => {
    installFakeApi({
      ...base,
      [`GET /items/${ID}`]: () => ok(fakeItem({ declaredValueCents: null, status: 'blocked' })),
    });
    await renderDetail();
    expect(await screen.findByText(t.blockedBanner)).toBeTruthy();
    expect(screen.queryByText(t.pausedBanner)).toBeNull();
  });
});

describe('ItemDetailScreen — estados', () => {
  it('muestra la carga con esqueleto', async () => {
    installFakeApi({ ...base, [`GET /items/${ID}`]: () => new Promise(() => undefined) as never });
    await renderDetail();
    expect(screen.getByTestId('item-detail-skeleton')).toBeTruthy();
  });

  it('error con reintento', async () => {
    let fail = true;
    installFakeApi({
      ...base,
      [`GET /items/${ID}`]: () => (fail ? failure(500, 'internal_error') : ok(fakeItem())),
    });
    await renderDetail();
    expect(await screen.findByText(es.errors.internal_error)).toBeTruthy();
    fail = false;
    await fireEvent.press(screen.getByRole('button', { name: es.common.retry }));
    expect(await screen.findByText('Taladro percutor 600 W')).toBeTruthy();
  });

  it('404: dice que no se encontró y permite volver', async () => {
    installFakeApi({ ...base, [`GET /items/${ID}`]: () => failure(404, 'not_found') });
    await renderDetail();
    expect(await screen.findByText(t.notFoundTitle)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.notFoundAction }));
    expect(mockBack).toHaveBeenCalled();
  });

  it('«Volver» regresa', async () => {
    installFakeApi({
      ...base,
      [`GET /items/${ID}`]: () => ok(fakeItem({ declaredValueCents: null })),
    });
    await renderDetail();
    await screen.findByText('Taladro percutor 600 W');
    await fireEvent.press(screen.getByRole('button', { name: t.back }));
    expect(mockBack).toHaveBeenCalled();
  });
});

describe('ItemDetailScreen — dueño', () => {
  beforeEach(() => {
    mockUserId = OWNER_ID;
  });

  it('CA-05: ve el valor declarado (privado) y las acciones', async () => {
    installFakeApi({ ...base, [`GET /items/${ID}`]: () => ok(fakeItem()) });
    await renderDetail();
    expect(await screen.findByText(t.declaredValue)).toBeTruthy();
    expect(screen.getByText('$1,000.00')).toBeTruthy();
    expect(screen.getByText(es.items.form.private)).toBeTruthy();
    expect(screen.getByRole('button', { name: o.edit })).toBeTruthy();
    expect(screen.getByRole('button', { name: o.pause })).toBeTruthy();
  });

  it('«Editar» abre el formulario de edición', async () => {
    installFakeApi({ ...base, [`GET /items/${ID}`]: () => ok(fakeItem()) });
    await renderDetail();
    await screen.findByText(t.declaredValue);
    await fireEvent.press(screen.getByRole('button', { name: o.edit }));
    expect(mockPush).toHaveBeenCalledWith(routes.editItem(ID));
  });

  it('CA-06: pausar y reanudar cambian el estado y el aviso', async () => {
    installFakeApi({
      ...base,
      [`GET /items/${ID}`]: () => ok(fakeItem()),
      [`POST /items/${ID}/pause`]: () => ok(fakeItem({ status: 'paused', version: 2 })),
      [`POST /items/${ID}/resume`]: () => ok(fakeItem({ status: 'active', version: 3 })),
    });
    await renderDetail();
    await screen.findByText(t.declaredValue);
    expect(screen.queryByText(t.pausedBanner)).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: o.pause }));
    expect(await screen.findByText(t.pausedBanner)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: o.resume }));
    await waitFor(() => expect(screen.queryByText(t.pausedBanner)).toBeNull());
    expect(screen.getByRole('button', { name: o.pause })).toBeTruthy();
  });

  it('pausar con 409 (bloqueado) o 403 muestra un mensaje claro', async () => {
    let status = 409;
    installFakeApi({
      ...base,
      [`GET /items/${ID}`]: () => ok(fakeItem()),
      [`POST /items/${ID}/pause`]: () =>
        status === 409 ? failure(409, 'conflict') : failure(403, 'forbidden'),
    });
    await renderDetail();
    await screen.findByText(t.declaredValue);
    await fireEvent.press(screen.getByRole('button', { name: o.pause }));
    expect(await screen.findByText(o.conflictBlocked)).toBeTruthy();
    status = 403;
    await fireEvent.press(screen.getByRole('button', { name: o.pause }));
    expect(await screen.findByText(o.forbidden)).toBeTruthy();
  });

  it('un objeto bloqueado no se puede editar ni pausar', async () => {
    installFakeApi({ ...base, [`GET /items/${ID}`]: () => ok(fakeItem({ status: 'blocked' })) });
    await renderDetail();
    await screen.findByText(t.blockedBanner);
    expect(screen.getByRole('button', { name: o.edit })).toBeDisabled();
    expect(screen.getByRole('button', { name: o.pause })).toBeDisabled();
  });

  it('eliminar: «⋯» → «Eliminar» → confirmación → DELETE y regresa', async () => {
    const api = installFakeApi({
      ...base,
      [`GET /items/${ID}`]: () => ok(fakeItem()),
      [`DELETE /items/${ID}`]: () => ({ status: 204, body: null }),
    });
    await renderDetail();
    await screen.findByText(t.declaredValue);
    await fireEvent.press(screen.getByRole('button', { name: t.more }));
    await fireEvent.press(await screen.findByText(o.delete));
    expect(await screen.findByText(o.deleteTitle)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: o.deleteConfirm }));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(api.calls.some((c) => c.method === 'DELETE')).toBe(true);
  });

  it('«Cancelar» cierra la confirmación sin borrar', async () => {
    const api = installFakeApi({ ...base, [`GET /items/${ID}`]: () => ok(fakeItem()) });
    await renderDetail();
    await screen.findByText(t.declaredValue);
    await fireEvent.press(screen.getByRole('button', { name: t.more }));
    await fireEvent.press(await screen.findByText(o.delete));
    await fireEvent.press(await screen.findByRole('button', { name: o.deleteCancel }));
    await waitFor(() => expect(screen.queryByText(o.deleteTitle)).toBeNull());
    expect(api.calls.some((c) => c.method === 'DELETE')).toBe(false);
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('eliminar con reservas activas (409) explica el motivo', async () => {
    installFakeApi({
      ...base,
      [`GET /items/${ID}`]: () => ok(fakeItem()),
      [`DELETE /items/${ID}`]: () => failure(409, 'conflict'),
    });
    await renderDetail();
    await screen.findByText(t.declaredValue);
    await fireEvent.press(screen.getByRole('button', { name: t.more }));
    await fireEvent.press(await screen.findByText(o.delete));
    await fireEvent.press(await screen.findByRole('button', { name: o.deleteConfirm }));
    expect(await screen.findByText(o.conflictDelete)).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('eliminar con un error de red usa el mensaje del código', async () => {
    installFakeApi({
      ...base,
      [`GET /items/${ID}`]: () => ok(fakeItem()),
      [`DELETE /items/${ID}`]: () => failure(500, 'internal_error'),
    });
    await renderDetail();
    await screen.findByText(t.declaredValue);
    await fireEvent.press(screen.getByRole('button', { name: t.more }));
    await fireEvent.press(await screen.findByText(o.delete));
    await fireEvent.press(await screen.findByRole('button', { name: o.deleteConfirm }));
    expect(await screen.findByText(es.errors.internal_error)).toBeTruthy();
  });
});
