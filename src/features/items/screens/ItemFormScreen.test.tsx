import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { clearDraft } from '@/features/items/draft';
import { EditItemScreen } from '@/features/items/screens/EditItemScreen';
import { ItemFormScreen } from '@/features/items/screens/ItemFormScreen';
import { es } from '@/i18n/es-MX';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { fakeCategories, fakeItem } from '@/test/fakeItems';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: mockBack, replace: jest.fn() }),
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({
    status: 'signedIn',
    user: { ...jest.requireActual('@/test/fakeApi').fakeUser },
  }),
}));
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Low: 2 },
}));

// La subida de fotos tiene sus propias pruebas (spec 004): aquí se simula su estado.
type MockUploader = {
  items: unknown[];
  refs: { publicId: string }[];
  isUploading: boolean;
  hasErrors: boolean;
};
let mockUploader: MockUploader;
jest.mock('@/features/images', () => ({
  useImageUpload: () => mockUploader,
  PhotoPicker: () => null,
  RemoteImage: () => null,
}));

const t = es.items.form;
const v = es.items.validation;
const ID = '6731a2b3c4d5e6f7a8b9c0d1';

const withPhotos = (): MockUploader => ({
  items: [],
  refs: [{ publicId: 'p1' }, { publicId: 'p2' }],
  isUploading: false,
  hasErrors: false,
});

function renderForm(ui = <ItemFormScreen />) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const baseApi = { 'GET /categories': () => ok(fakeCategories) };
const created = (body: unknown) => ({ status: 201, body: body ?? fakeItem() });

const type = (label: string, text: string) =>
  fireEvent.changeText(screen.getByLabelText(label), text);
const publish = () => screen.getByRole('button', { name: t.publish });
const chip = (name: string) => screen.findByRole('radio', { name });

async function fillBasics() {
  await type(t.title, 'Taladro percutor');
  await fireEvent.press(await chip('Herramientas eléctricas'));
  await type(t.municipality, 'Coyoacán');
}

beforeEach(() => {
  mockBack.mockReset();
  mockUploader = withPhotos();
  clearDraft();
});
afterEach(() => jest.restoreAllMocks());

describe('ItemFormScreen — publicar', () => {
  it('CA-01 / CA-03: renta con precio sugerido se publica en centavos con priceSource suggested', async () => {
    const api = installFakeApi({
      ...baseApi,
      'GET /items/price-suggestion': () => ok({ suggestedPricePerDayCents: 3_000 }),
      'POST /items': ({ body }) => created(fakeItem({ title: (body as { title: string }).title })),
    });
    await renderForm();
    await fillBasics();
    await fireEvent.press(
      screen.getByRole('radio', {
        name: `${es.items.modality.rent}, ${es.items.modality.rentHint}`,
      }),
    );
    await type(t.declaredValue, '1000');
    await fireEvent.press(await screen.findByRole('button', { name: t.useSuggested }));
    await waitFor(() => expect(screen.getByLabelText(t.pricePerDay).props.value).toBe('30'));
    await fireEvent.press(publish());
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    const post = api.calls.find((c) => c.method === 'POST');
    expect(post?.body).toMatchObject({
      title: 'Taladro percutor',
      category: 'herramientas_electricas',
      condition: 'good',
      modality: 'rent',
      declaredValueCents: 100_000,
      pricePerDayCents: 3_000,
      priceSource: 'suggested',
      zone: { municipality: 'Coyoacán', neighborhood: null },
      photos: [{ publicId: 'p1' }, { publicId: 'p2' }],
    });
  });

  it('editar el precio sugerido lo pasa a manual', async () => {
    const api = installFakeApi({
      ...baseApi,
      'GET /items/price-suggestion': () => ok({ suggestedPricePerDayCents: 3_000 }),
      'POST /items': () => created(null),
    });
    await renderForm();
    await fillBasics();
    await fireEvent.press(
      screen.getByRole('radio', {
        name: `${es.items.modality.rent}, ${es.items.modality.rentHint}`,
      }),
    );
    await type(t.declaredValue, '1000');
    await fireEvent.press(await screen.findByRole('button', { name: t.useSuggested }));
    await waitFor(() => expect(screen.getByLabelText(t.pricePerDay).props.value).toBe('30'));
    await type(t.pricePerDay, '35');
    await fireEvent.press(publish());
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(api.calls.find((c) => c.method === 'POST')?.body).toMatchObject({
      pricePerDayCents: 3_500,
      priceSource: 'manual',
    });
  });

  it('cambiar el valor declarado después de sugerir vuelve el precio a manual', async () => {
    const api = installFakeApi({
      ...baseApi,
      'GET /items/price-suggestion': () => ok({ suggestedPricePerDayCents: 3_000 }),
      'POST /items': () => created(null),
    });
    await renderForm();
    await fillBasics();
    await fireEvent.press(
      screen.getByRole('radio', {
        name: `${es.items.modality.rent}, ${es.items.modality.rentHint}`,
      }),
    );
    await type(t.declaredValue, '1000');
    await fireEvent.press(await screen.findByRole('button', { name: t.useSuggested }));
    await waitFor(() => expect(screen.getByLabelText(t.pricePerDay).props.value).toBe('30'));
    await type(t.declaredValue, '2000');
    await fireEvent.press(publish());
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(api.calls.find((c) => c.method === 'POST')?.body).toMatchObject({
      declaredValueCents: 200_000,
      pricePerDayCents: 3_000,
      priceSource: 'manual',
    });
  });

  it('CA-02: en préstamo el precio es $0 y no se puede editar', async () => {
    const api = installFakeApi({ ...baseApi, 'POST /items': () => created(null) });
    await renderForm();
    await fillBasics();
    const price = screen.getByLabelText(t.pricePerDay);
    expect(price.props.value).toBe('0');
    expect(price.props.editable).toBe(false);
    expect(screen.queryByRole('button', { name: t.useSuggested })).toBeNull();
    await type(t.declaredValue, '1500');
    await fireEvent.press(publish());
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(api.calls.find((c) => c.method === 'POST')?.body).toMatchObject({
      modality: 'loan',
      pricePerDayCents: 0,
      priceSource: 'manual',
      declaredValueCents: 150_000,
    });
  });

  it('al cambiar a renta el precio se vacía y al volver a préstamo regresa a $0', async () => {
    installFakeApi(baseApi);
    await renderForm();
    await fireEvent.press(
      screen.getByRole('radio', {
        name: `${es.items.modality.rent}, ${es.items.modality.rentHint}`,
      }),
    );
    expect(screen.getByLabelText(t.pricePerDay).props.value).toBe('');
    expect(screen.getByLabelText(t.pricePerDay).props.editable).toBe(true);
    await fireEvent.press(
      screen.getByRole('radio', {
        name: `${es.items.modality.loan}, ${es.items.modality.loanHint}`,
      }),
    );
    expect(screen.getByLabelText(t.pricePerDay).props.value).toBe('0');
  });

  it('muestra errores del esquema y no llama a la API', async () => {
    const api = installFakeApi({ ...baseApi, 'POST /items': () => created(null) });
    await renderForm();
    await fireEvent.press(publish());
    expect(await screen.findByText(v.titleRequired)).toBeTruthy();
    expect(screen.getByText(v.categoryRequired)).toBeTruthy();
    expect(screen.getByText(v.municipalityRequired)).toBeTruthy();
    expect(screen.getByText(v.declaredValueRequired)).toBeTruthy();
    expect(api.calls.some((c) => c.method === 'POST')).toBe(false);
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('valida el precio de renta contra el valor declarado', async () => {
    installFakeApi(baseApi);
    await renderForm();
    await fillBasics();
    await fireEvent.press(
      screen.getByRole('radio', {
        name: `${es.items.modality.rent}, ${es.items.modality.rentHint}`,
      }),
    );
    await type(t.declaredValue, '100');
    await type(t.pricePerDay, '500');
    await fireEvent.press(publish());
    expect(await screen.findByText(v.priceTooHigh)).toBeTruthy();
  });

  it('CA-04: un título rechazado por moderación muestra el motivo y se puede corregir', async () => {
    let attempts = 0;
    const api = installFakeApi({
      ...baseApi,
      'POST /items': () => {
        attempts += 1;
        return attempts === 1
          ? failure(400, 'validation_failed', [
              { field: 'title', issue: 'Contenido no permitido: venta de armas' },
            ])
          : created(null);
      },
    });
    await renderForm();
    await fillBasics();
    await type(t.declaredValue, '1500');
    await fireEvent.press(publish());
    expect(await screen.findByText('Contenido no permitido: venta de armas')).toBeTruthy();
    expect(screen.getByText(t.moderation)).toBeTruthy();
    expect(screen.getByLabelText(t.title).props.value).toBe('Taladro percutor');
    expect(mockBack).not.toHaveBeenCalled();
    await type(t.title, 'Taladro de mano');
    await fireEvent.press(publish());
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(2);
  });

  it('un rechazo en descripción abre «Más detalles» y marca el campo', async () => {
    installFakeApi({
      ...baseApi,
      'POST /items': () =>
        failure(400, 'validation_failed', [{ field: 'description', issue: 'Texto no permitido' }]),
    });
    await renderForm();
    await fillBasics();
    await type(t.declaredValue, '1500');
    await fireEvent.press(publish());
    expect(await screen.findByText('Texto no permitido')).toBeTruthy();
    expect(screen.getByLabelText(t.description)).toBeTruthy();
  });

  it('RNF-01: un error del servidor conserva todo lo escrito', async () => {
    installFakeApi({ ...baseApi, 'POST /items': () => failure(500, 'internal_error') });
    await renderForm();
    await fillBasics();
    await type(t.declaredValue, '1500');
    await fireEvent.press(publish());
    expect(await screen.findByText(es.errors.internal_error)).toBeTruthy();
    expect(screen.getByLabelText(t.title).props.value).toBe('Taladro percutor');
    expect(screen.getByLabelText(t.municipality).props.value).toBe('Coyoacán');
    expect(screen.getByLabelText(t.declaredValue).props.value).toBe('1500');
  });

  it('RNF-01: volver atrás y regresar conserva el borrador en memoria', async () => {
    installFakeApi(baseApi);
    const first = await renderForm();
    await type(t.title, 'Escalera de tijera');
    await type(t.municipality, 'Tlalpan');
    await first.unmount();
    await renderForm();
    expect(screen.getByLabelText(t.title).props.value).toBe('Escalera de tijera');
    expect(screen.getByLabelText(t.municipality).props.value).toBe('Tlalpan');
  });

  it('tras publicar el borrador se limpia', async () => {
    installFakeApi({ ...baseApi, 'POST /items': () => created(null) });
    const first = await renderForm();
    await fillBasics();
    await type(t.declaredValue, '1500');
    await fireEvent.press(publish());
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    await first.unmount();
    await renderForm();
    expect(screen.getByLabelText(t.title).props.value).toBe('');
  });

  describe('fotos', () => {
    it('sin fotos pide agregar al menos una y no publica', async () => {
      mockUploader = { ...withPhotos(), refs: [] };
      const api = installFakeApi({ ...baseApi, 'POST /items': () => created(null) });
      await renderForm();
      await fillBasics();
      await type(t.declaredValue, '1500');
      await fireEvent.press(publish());
      expect(await screen.findByText(t.photosRequired)).toBeTruthy();
      expect(api.calls.some((c) => c.method === 'POST')).toBe(false);
    });

    it('mientras suben, «Publicar» está deshabilitado', async () => {
      mockUploader = { ...withPhotos(), isUploading: true };
      installFakeApi(baseApi);
      await renderForm();
      expect(publish()).toBeDisabled();
    });

    it('con fotos fallidas pide reintentar o quitarlas, y conserva lo escrito', async () => {
      mockUploader = { ...withPhotos(), hasErrors: true };
      installFakeApi({ ...baseApi, 'POST /items': () => created(null) });
      await renderForm();
      await fillBasics();
      await type(t.declaredValue, '1500');
      await fireEvent.press(publish());
      expect(await screen.findByText(t.photosFailed)).toBeTruthy();
      expect(screen.getByLabelText(t.title).props.value).toBe('Taladro percutor');
    });
  });

  describe('categorías', () => {
    it('muestra las categorías del servidor y marca la elegida', async () => {
      installFakeApi(baseApi);
      await renderForm();
      await fireEvent.press(await chip('Hogar'));
      expect(screen.getByRole('radio', { name: 'Hogar' })).toBeSelected();
    });

    it('si no cargan, ofrece reintentar', async () => {
      let fail = true;
      installFakeApi({
        'GET /categories': () => (fail ? failure(500, 'internal_error') : ok(fakeCategories)),
      });
      await renderForm();
      expect(await screen.findByText(es.errors.internal_error)).toBeTruthy();
      fail = false;
      await fireEvent.press(screen.getByRole('button', { name: es.common.retry }));
      expect(await chip('Hogar')).toBeTruthy();
    });
  });

  it('el espacio renderFormExtras recibe las fotos y puede rellenar campos', async () => {
    installFakeApi(baseApi);
    await renderForm(
      <ItemFormScreen
        renderFormExtras={({ photos, setValues }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="extra"
            onPress={() => setValues({ title: `Con ${photos.length} fotos` })}
          >
            <Text>extra</Text>
          </Pressable>
        )}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'extra' }));
    expect(screen.getByLabelText(t.title).props.value).toBe('Con 2 fotos');
  });

  it('«Volver» regresa sin publicar', async () => {
    installFakeApi(baseApi);
    await renderForm();
    await fireEvent.press(screen.getByRole('button', { name: es.common.back }));
    expect(mockBack).toHaveBeenCalled();
  });
});

describe('ItemFormScreen — editar', () => {
  const editApi = (extra: Record<string, never> = {}) =>
    installFakeApi({
      ...baseApi,
      [`GET /items/${ID}`]: () => ok(fakeItem()),
      ...extra,
    });

  it('carga el objeto en el formulario y usa «Guardar»', async () => {
    editApi();
    await renderForm(<EditItemScreen id={ID} />);
    expect(await screen.findByLabelText(t.title)).toBeTruthy();
    expect(screen.getByLabelText(t.title).props.value).toBe('Taladro percutor 600 W');
    expect(screen.getByLabelText(t.declaredValue).props.value).toBe('1000');
    expect(screen.getByLabelText(t.pricePerDay).props.value).toBe('30');
    expect(screen.getByRole('button', { name: t.save })).toBeTruthy();
    expect(screen.getByRole('header', { name: t.editTitle })).toBeTruthy();
  });

  it('envía solo lo que cambió, con la versión leída', async () => {
    const api = installFakeApi({
      ...baseApi,
      [`GET /items/${ID}`]: () => ok(fakeItem()),
      [`PATCH /items/${ID}`]: () => ok(fakeItem({ version: 2 })),
    });
    await renderForm(<EditItemScreen id={ID} />);
    await screen.findByLabelText(t.title);
    await type(t.title, 'Taladro nuevo');
    await fireEvent.press(screen.getByRole('button', { name: t.save }));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(api.calls.find((c) => c.method === 'PATCH')?.body).toEqual({
      version: 1,
      title: 'Taladro nuevo',
    });
  });

  it('al cambiar el precio manda el bloque completo de precio', async () => {
    const api = installFakeApi({
      ...baseApi,
      [`GET /items/${ID}`]: () => ok(fakeItem()),
      [`PATCH /items/${ID}`]: () => ok(fakeItem({ version: 2 })),
    });
    await renderForm(<EditItemScreen id={ID} />);
    await screen.findByLabelText(t.title);
    await type(t.pricePerDay, '35');
    await fireEvent.press(screen.getByRole('button', { name: t.save }));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(api.calls.find((c) => c.method === 'PATCH')?.body).toEqual({
      version: 1,
      modality: 'rent',
      declaredValueCents: 100_000,
      pricePerDayCents: 3_500,
      priceSource: 'manual',
    });
  });

  it('sin cambios no llama a la API', async () => {
    const api = editApi();
    await renderForm(<EditItemScreen id={ID} />);
    await screen.findByLabelText(t.title);
    await fireEvent.press(screen.getByRole('button', { name: t.save }));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(api.calls.some((c) => c.method === 'PATCH')).toBe(false);
  });

  it('409 explica que el objeto cambió y conserva lo editado', async () => {
    installFakeApi({
      ...baseApi,
      [`GET /items/${ID}`]: () => ok(fakeItem()),
      [`PATCH /items/${ID}`]: () => failure(409, 'conflict'),
    });
    await renderForm(<EditItemScreen id={ID} />);
    await screen.findByLabelText(t.title);
    await type(t.title, 'Otro título');
    await fireEvent.press(screen.getByRole('button', { name: t.save }));
    expect(await screen.findByText(t.conflict)).toBeTruthy();
    expect(screen.getByLabelText(t.title).props.value).toBe('Otro título');
  });

  it('403 dice que no se puede editar', async () => {
    installFakeApi({
      ...baseApi,
      [`GET /items/${ID}`]: () => ok(fakeItem()),
      [`PATCH /items/${ID}`]: () => failure(403, 'forbidden'),
    });
    await renderForm(<EditItemScreen id={ID} />);
    await screen.findByLabelText(t.title);
    await type(t.title, 'Otro título');
    await fireEvent.press(screen.getByRole('button', { name: t.save }));
    expect(await screen.findByText(t.notEditable)).toBeTruthy();
  });

  it('mientras carga muestra el esqueleto; si no existe, lo dice; si falla, reintenta', async () => {
    installFakeApi({
      ...baseApi,
      [`GET /items/${ID}`]: () => new Promise(() => undefined) as never,
    });
    const first = await renderForm(<EditItemScreen id={ID} />);
    expect(screen.getByTestId('edit-item-skeleton')).toBeTruthy();
    await first.unmount();

    installFakeApi({ ...baseApi, [`GET /items/${ID}`]: () => failure(404, 'not_found') });
    const second = await renderForm(<EditItemScreen id={ID} />);
    expect(await screen.findByText(es.items.detail.notFoundTitle)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: es.items.detail.notFoundAction }));
    expect(mockBack).toHaveBeenCalled();
    await second.unmount();

    let fail = true;
    installFakeApi({
      ...baseApi,
      [`GET /items/${ID}`]: () => (fail ? failure(500, 'internal_error') : ok(fakeItem())),
    });
    await renderForm(<EditItemScreen id={ID} />);
    expect(await screen.findByText(es.errors.internal_error)).toBeTruthy();
    fail = false;
    await fireEvent.press(screen.getByRole('button', { name: es.common.retry }));
    expect(await screen.findByLabelText(t.title)).toBeTruthy();
  });
});
