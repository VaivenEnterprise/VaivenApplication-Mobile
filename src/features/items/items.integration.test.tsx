import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useEffect, useState } from 'react';
import { clearDraft } from '@/features/items/draft';
import { ItemDetailScreen } from '@/features/items/screens/ItemDetailScreen';
import { ItemFormScreen } from '@/features/items/screens/ItemFormScreen';
import { MyItemsScreen } from '@/features/items/screens/MyItemsScreen';
import type { Item } from '@/features/items/types';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { installFakeApi, ok } from '@/test/fakeApi';
import { fakeCategories, fakeItem, fakeOwner, fakePhoto } from '@/test/fakeItems';

// Prueba de integración (spec 005 T011, qa-mobile): llenar el formulario → publicar → aparece en
// «Mis objetos» como activo → abrir el detalle. La navegación es una simulación mínima de
// Expo Router; la API es una API falsa con memoria.

const mockNav = { current: (_href: string) => undefined as void };
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: (href: string) => mockNav.current(String(href)),
    back: () => mockNav.current('/mis-objetos'),
    replace: jest.fn(),
  }),
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({
    status: 'signedIn',
    user: { ...jest.requireActual('@/test/fakeApi').fakeUser, id: '6730f1c2a9b3e4d5f6a7b8c9' },
  }),
}));
jest.mock('@/features/images', () => ({
  useImageUpload: () => ({
    items: [],
    refs: [{ publicId: 'p1' }, { publicId: 'p2' }],
    isUploading: false,
    hasErrors: false,
  }),
  PhotoPicker: () => null,
  RemoteImage: () => null,
}));

function Host() {
  const [route, setRoute] = useState<string>(String(routes.myItems));
  useEffect(() => {
    mockNav.current = setRoute;
  }, []);
  if (route === String(routes.newItem)) return <ItemFormScreen />;
  if (route.startsWith('/objeto/')) return <ItemDetailScreen id={route.split('/')[2] ?? ''} />;
  return <MyItemsScreen />;
}

const t = es.items;

describe('Objetos: publicar y ver (integración)', () => {
  beforeEach(() => clearDraft());
  afterEach(() => jest.restoreAllMocks());

  it('CA-01: formulario válido con 2 fotos → aparece en Mis objetos como activo → abre el detalle', async () => {
    const store: Item[] = [];
    const api = installFakeApi({
      'GET /categories': () => ok(fakeCategories),
      'GET /me/items': () => ok({ items: store, nextCursor: null }),
      'GET /items/price-suggestion': () => ok({ suggestedPricePerDayCents: 3_000 }),
      'POST /items': ({ body }) => {
        const input = body as { title: string; photos: unknown[]; pricePerDayCents: number };
        const item = fakeItem({
          id: 'a1b2c3d4e5f6a7b8c9d0e1f2',
          title: input.title,
          pricePerDayCents: input.pricePerDayCents,
          photos: input.photos.map((_p, i) => fakePhoto(i + 1)),
        });
        store.unshift(item);
        return { status: 201, body: item };
      },
      'GET /items/a1b2c3d4e5f6a7b8c9d0e1f2': () => ok(store[0]),
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await render(
      <QueryClientProvider client={client}>
        <Host />
      </QueryClientProvider>,
    );

    // 1. Lista vacía → invita a publicar.
    await fireEvent.press(await screen.findByRole('button', { name: t.list.emptyAction }));

    // 2. Formulario: título, categoría, renta con precio sugerido y zona.
    const field = (label: string) => screen.getByLabelText(label);
    await fireEvent.changeText(field(t.form.title), 'Taladro percutor 600 W');
    await fireEvent.press(await screen.findByRole('radio', { name: 'Herramientas eléctricas' }));
    await fireEvent.press(
      screen.getByRole('radio', { name: `${t.modality.rent}, ${t.modality.rentHint}` }),
    );
    await fireEvent.changeText(field(t.form.declaredValue), '1000');
    await fireEvent.press(await screen.findByRole('button', { name: t.form.useSuggested }));
    await waitFor(() => expect(field(t.form.pricePerDay).props.value).toBe('30'));
    await fireEvent.changeText(field(t.form.municipality), 'Coyoacán');

    // 3. Publicar → vuelve a la lista con el objeto activo.
    await fireEvent.press(screen.getByRole('button', { name: t.form.publish }));
    expect(await screen.findByText('Taladro percutor 600 W')).toBeTruthy();
    expect(screen.getByText(t.status.active)).toBeTruthy();
    expect(screen.getByText('$30 / día')).toBeTruthy();
    expect(api.calls.find((c) => c.method === 'POST')?.body).toMatchObject({
      priceSource: 'suggested',
      photos: [{ publicId: 'p1' }, { publicId: 'p2' }],
    });

    // 4. Abrir el detalle: el dueño ve su objeto y el valor declarado.
    await fireEvent.press(screen.getByLabelText(/^Taladro percutor 600 W/));
    expect(await screen.findByText(t.detail.declaredValue)).toBeTruthy();
    expect(screen.getByText('$1,000.00')).toBeTruthy();
    expect(screen.getByText(fakeOwner.displayName)).toBeTruthy();
  });
});
