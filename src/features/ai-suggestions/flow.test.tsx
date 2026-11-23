import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { renderFormExtras } from '@/features/ai-suggestions';
import { clearDraft } from '@/features/items/draft';
import { ItemFormScreen } from '@/features/items/screens/ItemFormScreen';
import { es } from '@/i18n/es-MX';
import { failure, installFakeApi, ok, type FakeReply } from '@/test/fakeApi';
import { fakeCategories, fakeItem } from '@/test/fakeItems';

// Prueba del flujo de punta a punta (T005): el formulario real de publicar (005) con el *slot* de
// IA conectado y la API simulada. Cubre CA-01 a CA-04 y que el formulario siga funcionando sin IA.

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

// El arranque en frío del formulario completo tarda más que el límite por omisión.
jest.setTimeout(30_000);

const t = es.items.form;
const a = es.aiSuggestions;
const COVER = 'vaiven/production/item_photo/6730f1c2a9b3e4d5f6a7b8c9/cover';
const SUGGESTION = {
  title: 'Taladro inalámbrico 18 V con dos baterías',
  category: 'herramientas_electricas',
};

const photos = (...ids: string[]): MockUploader => ({
  items: [],
  refs: ids.map((publicId) => ({ publicId })),
  isUploading: false,
  hasErrors: false,
});

const metaOn = () => ok({ name: 'vaiven', features: { aiSuggestions: true } });
const POST = 'POST /ai/listing-suggestions';
const baseApi = {
  'GET /categories': () => ok(fakeCategories),
  'GET /meta': metaOn,
  [POST]: () => ok(SUGGESTION),
};

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ItemFormScreen renderFormExtras={renderFormExtras} />
    </QueryClientProvider>,
  );
}

const suggestButton = () => screen.findByRole('button', { name: a.button });
const titleInput = () => screen.getByLabelText(t.title);
const type = (label: string, text: string) =>
  fireEvent.changeText(screen.getByLabelText(label), text);

async function askForSuggestion() {
  await fireEvent.press(await suggestButton());
  await screen.findByText(SUGGESTION.title);
}

beforeEach(() => {
  mockBack.mockReset();
  mockUploader = photos(COVER, 'p2');
  clearDraft();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
});
afterEach(() => jest.restoreAllMocks());

describe('Sugerencias con IA — cuándo aparece (RF-02)', () => {
  it('con la IA activa y una foto subida muestra el botón y el aviso de privacidad', async () => {
    installFakeApi(baseApi);
    await renderForm();
    expect(await suggestButton()).toBeTruthy();
    expect(screen.getByText(a.notice)).toBeTruthy();
  });

  it('no pide nada solo: sin tocar el botón no hay POST (RF-01)', async () => {
    const api = installFakeApi(baseApi);
    await renderForm();
    await suggestButton();
    expect(api.calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('sin fotos subidas no aparece', async () => {
    mockUploader = photos();
    const api = installFakeApi(baseApi);
    await renderForm();
    await waitFor(() => expect(api.calls.some((c) => c.path === '/meta')).toBe(true));
    expect(screen.queryByRole('button', { name: a.button })).toBeNull();
  });

  it.each([
    ['la IA está apagada', () => ok({ name: 'vaiven', features: { aiSuggestions: false } })],
    ['el servidor no informa features', () => ok({ name: 'vaiven' })],
    ['/meta falla', () => failure(500, 'internal_error')],
  ])('no aparece si %s y el formulario sigue completo (CA-03)', async (_name, meta) => {
    const api = installFakeApi({ ...baseApi, 'GET /meta': meta });
    await renderForm();
    await waitFor(() => expect(api.calls.some((c) => c.path === '/meta')).toBe(true));
    expect(screen.queryByRole('button', { name: a.button })).toBeNull();
    expect(titleInput()).toBeTruthy();
    expect(screen.getByRole('button', { name: t.publish })).toBeTruthy();
  });
});

describe('Sugerencias con IA — CA-01: sugerir', () => {
  it('manda solo el publicId de la portada y muestra título y categoría', async () => {
    const api = installFakeApi(baseApi);
    await renderForm();
    await askForSuggestion();
    // La categoría también está como opción del formulario: se comprueba dentro de la tarjeta.
    expect(
      screen.getByLabelText(
        `${a.resultLabel}: ${SUGGESTION.title}. ${a.categoryLabel}: Herramientas eléctricas`,
      ),
    ).toBeTruthy();
    const post = api.calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/ai/listing-suggestions');
    expect(post?.body).toEqual({ imagePublicId: COVER });
  });

  it('mientras analiza muestra «Analizando…» y deja cancelar sin resultado tardío', async () => {
    let release: ((reply: FakeReply) => void) | undefined;
    installFakeApi({
      ...baseApi,
      [POST]: () =>
        new Promise<FakeReply>((resolve) => {
          release = resolve;
        }),
    });
    await renderForm();
    await fireEvent.press(await suggestButton());
    expect(await screen.findByText(a.loading)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: a.cancel }));
    expect(await suggestButton()).toBeTruthy();
    release?.(ok(SUGGESTION));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByText(SUGGESTION.title)).toBeNull();
  });
});

describe('Sugerencias con IA — CA-02: usar, editar y descartar', () => {
  it('«Usar» rellena título y categoría sin enviar nada y se pueden cambiar', async () => {
    const api = installFakeApi(baseApi);
    await renderForm();
    await askForSuggestion();
    await fireEvent.press(screen.getByRole('button', { name: a.use }));
    expect(titleInput().props.value).toBe(SUGGESTION.title);
    expect(screen.getByRole('radio', { name: 'Herramientas eléctricas' })).toBeSelected();
    expect(screen.getByText(a.applied)).toBeTruthy();
    // Sigue siendo editable antes de publicar.
    await type(t.title, 'Taladro de mi tío');
    await fireEvent.press(screen.getByRole('radio', { name: 'Hogar' }));
    expect(titleInput().props.value).toBe('Taladro de mi tío');
    expect(screen.getByRole('radio', { name: 'Hogar' })).toBeSelected();
    expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(1);
  });

  it('publica con lo que la persona dejó, no con lo sugerido', async () => {
    const api = installFakeApi({
      ...baseApi,
      'POST /items': () => ({ status: 201, body: fakeItem() }),
    });
    await renderForm();
    await askForSuggestion();
    await fireEvent.press(screen.getByRole('button', { name: a.use }));
    await type(t.title, 'Taladro percutor');
    await type(t.municipality, 'Coyoacán');
    await type(t.declaredValue, '1500');
    await fireEvent.press(screen.getByRole('button', { name: t.publish }));
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    expect(api.calls.find((c) => c.path === '/items' && c.method === 'POST')?.body).toMatchObject({
      title: 'Taladro percutor',
      category: 'herramientas_electricas',
    });
  });

  it('«Editar» rellena los campos y cierra la tarjeta', async () => {
    installFakeApi(baseApi);
    await renderForm();
    await askForSuggestion();
    await fireEvent.press(screen.getByRole('button', { name: a.edit }));
    expect(titleInput().props.value).toBe(SUGGESTION.title);
    expect(screen.getByRole('radio', { name: 'Herramientas eléctricas' })).toBeSelected();
    await waitFor(() => expect(screen.queryByRole('button', { name: a.use })).toBeNull());
    expect(await suggestButton()).toBeTruthy();
  });

  it('«Descartar» cierra la tarjeta y no toca el formulario', async () => {
    installFakeApi(baseApi);
    await renderForm();
    await type(t.title, 'Mi título');
    await askForSuggestion();
    await fireEvent.press(screen.getByRole('button', { name: a.dismiss }));
    await waitFor(() => expect(screen.queryByText(SUGGESTION.title)).toBeNull());
    expect(titleInput().props.value).toBe('Mi título');
    expect(await suggestButton()).toBeTruthy();
  });

  it('una categoría que no existe en el catálogo no se aplica (P-02)', async () => {
    installFakeApi({ ...baseApi, [POST]: () => ok({ title: 'Cosa rara', category: 'inventada' }) });
    await renderForm();
    await fireEvent.press(await suggestButton());
    await screen.findByText('Cosa rara');
    await fireEvent.press(screen.getByRole('button', { name: a.use }));
    expect(titleInput().props.value).toBe('Cosa rara');
    for (const category of fakeCategories) {
      expect(screen.getByRole('radio', { name: category.label })).not.toBeSelected();
    }
  });

  it('una sugerencia sin categoría solo rellena el título', async () => {
    installFakeApi({ ...baseApi, [POST]: () => ok({ title: 'Escalera de aluminio' }) });
    await renderForm();
    await fireEvent.press(await suggestButton());
    await screen.findByText('Escalera de aluminio');
    await fireEvent.press(screen.getByRole('button', { name: a.use }));
    expect(titleInput().props.value).toBe('Escalera de aluminio');
    for (const category of fakeCategories) {
      expect(screen.getByRole('radio', { name: category.label })).not.toBeSelected();
    }
  });
});

describe('Sugerencias con IA — CA-03 y CA-04: fallos', () => {
  it('con la IA caída (503) avisa, deja reintentar y se puede publicar igual', async () => {
    let down = true;
    const api = installFakeApi({
      ...baseApi,
      [POST]: () => (down ? failure(503, 'service_unavailable') : ok(SUGGESTION)),
      'POST /items': () => ({ status: 201, body: fakeItem() }),
    });
    await renderForm();
    await fireEvent.press(await suggestButton());
    expect(await screen.findByText(a.error)).toBeTruthy();
    // El formulario sigue plenamente utilizable.
    await type(t.title, 'Taladro percutor');
    await fireEvent.press(await screen.findByRole('radio', { name: 'Herramientas eléctricas' }));
    await type(t.municipality, 'Coyoacán');
    await type(t.declaredValue, '1500');
    // Reintentar a mano funciona cuando la IA vuelve.
    down = false;
    await fireEvent.press(screen.getByRole('button', { name: es.common.retry }));
    expect(await screen.findByText(SUGGESTION.title)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.publish }));
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    expect(api.calls.filter((c) => c.path === '/items' && c.method === 'POST')).toHaveLength(1);
  });

  it('si la IA sigue caída, publicar funciona sin ninguna sugerencia', async () => {
    const api = installFakeApi({
      ...baseApi,
      [POST]: () => failure(503, 'service_unavailable'),
      'POST /items': () => ({ status: 201, body: fakeItem() }),
    });
    await renderForm();
    await fireEvent.press(await suggestButton());
    await screen.findByText(a.error);
    await type(t.title, 'Taladro percutor');
    await fireEvent.press(await screen.findByRole('radio', { name: 'Herramientas eléctricas' }));
    await type(t.municipality, 'Coyoacán');
    await type(t.declaredValue, '1500');
    await fireEvent.press(screen.getByRole('button', { name: t.publish }));
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    expect(api.calls.find((c) => c.path === '/items' && c.method === 'POST')?.body).toMatchObject({
      title: 'Taladro percutor',
    });
  });

  it('CA-04: con el límite diario (429) muestra el mensaje y no reintenta solo', async () => {
    const api = installFakeApi({ ...baseApi, [POST]: () => failure(429, 'rate_limited') });
    await renderForm();
    await fireEvent.press(await suggestButton());
    expect(await screen.findByText(a.limit)).toBeTruthy();
    expect(screen.queryByRole('button', { name: es.common.retry })).toBeNull();
    expect(titleInput()).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(1);
  });
});
