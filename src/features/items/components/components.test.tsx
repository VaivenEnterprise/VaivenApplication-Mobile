import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import type { ReactElement } from 'react';
import { ChoiceChip } from '@/features/items/components/ChoiceChip';
import { ConditionPicker } from '@/features/items/components/ConditionPicker';
import { ItemCard } from '@/features/items/components/ItemCard';
import { ItemStatusBadge } from '@/features/items/components/ItemStatusBadge';
import { LocationField } from '@/features/items/components/LocationField';
import { ModalityPicker } from '@/features/items/components/ModalityPicker';
import { OwnerCard } from '@/features/items/components/OwnerCard';
import { PhotoGallery } from '@/features/items/components/PhotoGallery';
import { PriceSuggestion } from '@/features/items/components/PriceSuggestion';
import { clearDraft, getDraft, saveDraft } from '@/features/items/draft';
import { priceSpoken, priceText, toCardData } from '@/features/items/format';
import { emptyItemForm } from '@/features/items/schemas';
import { es } from '@/i18n/es-MX';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { fakeItem, fakeOwner, fakePhoto } from '@/test/fakeItems';

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

const t = es.items;
const permission = jest.mocked(Location.requestForegroundPermissionsAsync);
const position = jest.mocked(Location.getCurrentPositionAsync);

const withClient = (ui: ReactElement) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {ui}
  </QueryClientProvider>
);

afterEach(() => {
  jest.restoreAllMocks();
  permission.mockReset();
  position.mockReset();
});

describe('format', () => {
  it('muestra «$90» redondo, «$90.50» con centavos y null si es gratis', () => {
    expect(priceText({ modality: 'rent', pricePerDayCents: 9000 })).toBe('$90');
    expect(priceText({ modality: 'rent', pricePerDayCents: 9050 })).toBe('$90.50');
    expect(priceText({ modality: 'loan', pricePerDayCents: 0 })).toBeNull();
    expect(priceText({ modality: 'rent', pricePerDayCents: 0 })).toBeNull();
    expect(priceSpoken({ modality: 'rent', pricePerDayCents: 9000 })).toBe('$90 por día');
    expect(priceSpoken({ modality: 'loan', pricePerDayCents: 0 })).toBe(t.money.free);
  });

  it('toCardData usa la primera foto como portada', () => {
    expect(toCardData(fakeItem()).thumbUrl).toBe(fakePhoto(1).thumbUrl);
    expect(toCardData(fakeItem({ photos: [] })).thumbUrl).toBeNull();
  });
});

describe('ItemCard', () => {
  const data = toCardData(fakeItem());

  it('variante row: título, precio, estado y abre el detalle al tocar', async () => {
    const onPress = jest.fn();
    await render(<ItemCard item={data} variant="row" onPress={onPress} />);
    expect(screen.getByText(data.title)).toBeTruthy();
    expect(screen.getByText('$30 / día')).toBeTruthy();
    expect(screen.getByText(t.status.active)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledWith(data);
  });

  it('variante grid: sin píldora de estado y «Gratis» en préstamo', async () => {
    const free = toCardData(fakeItem({ modality: 'loan', pricePerDayCents: 0, status: 'paused' }));
    await render(<ItemCard item={{ ...free, status: undefined }} onPress={jest.fn()} />);
    expect(screen.getByText(t.money.free)).toBeTruthy();
    expect(screen.queryByText(t.status.paused)).toBeNull();
  });

  it('la etiqueta de accesibilidad resume título, precio y estado', async () => {
    await render(<ItemCard item={data} variant="row" onPress={jest.fn()} />);
    expect(screen.getByLabelText(`${data.title}, $30 por día, ${t.status.active}`)).toBeTruthy();
  });

  it('sin foto muestra un ícono de respaldo', async () => {
    await render(<ItemCard item={{ ...data, thumbUrl: null }} onPress={jest.fn()} />);
    expect(screen.getByText(data.title)).toBeTruthy();
  });
});

describe('ItemStatusBadge', () => {
  it.each(['active', 'paused', 'blocked', 'removed'] as const)(
    'dice «%s» con texto',
    async (status) => {
      await render(<ItemStatusBadge status={status} />);
      expect(screen.getByText(t.status[status])).toBeTruthy();
    },
  );
});

describe('ConditionPicker y ModalityPicker', () => {
  it('ConditionPicker elige un estado físico', async () => {
    const onChange = jest.fn();
    await render(<ConditionPicker value="good" onChange={onChange} />);
    expect(screen.getByRole('radio', { name: t.condition.good })).toBeSelected();
    await fireEvent.press(screen.getByRole('radio', { name: t.condition.worn }));
    expect(onChange).toHaveBeenCalledWith('worn');
  });

  it('ModalityPicker ofrece préstamo (gratis) y renta', async () => {
    const onChange = jest.fn();
    await render(<ModalityPicker value="loan" onChange={onChange} />);
    expect(
      screen.getByRole('radio', { name: `${t.modality.loan}, ${t.modality.loanHint}` }),
    ).toBeSelected();
    await fireEvent.press(
      screen.getByRole('radio', { name: `${t.modality.rent}, ${t.modality.rentHint}` }),
    );
    expect(onChange).toHaveBeenCalledWith('rent');
  });

  it('ChoiceChip marca la opción elegida', async () => {
    await render(<ChoiceChip label="Hogar" selected onPress={jest.fn()} />);
    expect(screen.getByRole('radio', { name: 'Hogar' })).toBeSelected();
  });
});

describe('OwnerCard', () => {
  it('muestra nombre, calificación y abre el perfil', async () => {
    const onPress = jest.fn();
    await render(<OwnerCard owner={fakeOwner} onPress={onPress} />);
    expect(screen.getByText('Ana López')).toBeTruthy();
    expect(screen.getByText('4.9 (18)')).toBeTruthy();
    expect(screen.getByLabelText('5 de 5')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('sin reseñas dice «Sin reseñas» y no dibuja estrellas', async () => {
    await render(
      <OwnerCard
        owner={{ ...fakeOwner, ratingAverage: null, ratingCount: 0 }}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText(t.detail.ratingNone)).toBeTruthy();
    expect(screen.queryByLabelText(/de 5$/)).toBeNull();
  });
});

describe('PhotoGallery', () => {
  const photos = [fakePhoto(1), fakePhoto(2), fakePhoto(3)];

  it('sin fotos muestra el fondo de respaldo', async () => {
    await render(<PhotoGallery photos={[]} />);
    expect(screen.getByLabelText(t.detail.noPhoto)).toBeTruthy();
  });

  it('con una sola foto no dibuja puntos', async () => {
    await render(<PhotoGallery photos={[fakePhoto(1)]} />);
    expect(screen.queryByTestId('photo-dot-active', { includeHiddenElements: true })).toBeNull();
  });

  it('los puntos siguen la página al deslizar', async () => {
    await render(<PhotoGallery photos={photos} />);
    const frame = screen.getByTestId('photo-gallery-scroll').parent?.parent;
    expect(frame).toBeTruthy();
    const scroll = screen.getByTestId('photo-gallery-scroll');
    await fireEvent(scroll.parent!, 'layout', {
      nativeEvent: { layout: { width: 300, height: 225 } },
    });
    await fireEvent(scroll, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: 600 } } });
    expect(screen.getAllByTestId('photo-dot', { includeHiddenElements: true })).toHaveLength(2);
    expect(screen.getAllByTestId('photo-dot-active', { includeHiddenElements: true })).toHaveLength(
      1,
    );
  });
});

describe('PriceSuggestion', () => {
  it('no aparece sin valor declarado válido', async () => {
    await render(withClient(<PriceSuggestion declaredValueCents={null} onApply={jest.fn()} />));
    expect(screen.queryByRole('button')).toBeNull();
    await render(withClient(<PriceSuggestion declaredValueCents={4_999} onApply={jest.fn()} />));
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('consulta la sugerencia y la entrega en centavos', async () => {
    const api = installFakeApi({
      'GET /items/price-suggestion': () => ok({ suggestedPricePerDayCents: 3_000 }),
    });
    const onApply = jest.fn();
    await render(withClient(<PriceSuggestion declaredValueCents={100_000} onApply={onApply} />));
    await fireEvent.press(screen.getByRole('button', { name: t.form.useSuggested }));
    await waitFor(() => expect(onApply).toHaveBeenCalledWith(3_000));
    expect(api.calls[0]?.query).toBe('declaredValueCents=100000');
    expect(await screen.findByText(t.form.suggestedApplied)).toBeTruthy();
  });

  it('si falla, avisa y deja escribir el precio', async () => {
    installFakeApi({ 'GET /items/price-suggestion': () => failure(500, 'internal_error') });
    const onApply = jest.fn();
    await render(withClient(<PriceSuggestion declaredValueCents={100_000} onApply={onApply} />));
    await fireEvent.press(screen.getByRole('button', { name: t.form.useSuggested }));
    expect(await screen.findByText(t.form.suggestionFailed)).toBeTruthy();
    expect(onApply).not.toHaveBeenCalled();
  });
});

describe('LocationField', () => {
  it('pide permiso al usarse y entrega la ubicación con precisión baja', async () => {
    permission.mockResolvedValue({ granted: true } as never);
    position.mockResolvedValue({ coords: { latitude: 19.349512, longitude: -99.162301 } } as never);
    const onChange = jest.fn();
    await render(<LocationField value={null} onChange={onChange} />);
    expect(screen.getByText(t.form.locationApprox)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.form.useLocation }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ lat: 19.349512, lng: -99.162301 }));
    expect(position).toHaveBeenCalledWith({ accuracy: Location.Accuracy.Low });
  });

  it('si se niega el permiso, explica cómo seguir y no pide la posición', async () => {
    permission.mockResolvedValue({ granted: false } as never);
    const onChange = jest.fn();
    await render(<LocationField value={null} onChange={onChange} />);
    await fireEvent.press(screen.getByRole('button', { name: t.form.useLocation }));
    expect(await screen.findByText(t.form.locationDenied)).toBeTruthy();
    expect(position).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('si falla obtener la posición, lo dice', async () => {
    permission.mockResolvedValue({ granted: true } as never);
    position.mockRejectedValue(new Error('sin GPS'));
    await render(<LocationField value={null} onChange={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: t.form.useLocation }));
    expect(await screen.findByText(t.form.locationFailed)).toBeTruthy();
  });

  it('con ubicación puesta se puede quitar', async () => {
    const onChange = jest.fn();
    await render(<LocationField value={{ lat: 1, lng: 2 }} onChange={onChange} />);
    expect(screen.getByText(`${t.form.locationSet}. ${t.form.locationApprox}`)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.form.locationRemove }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

describe('draft', () => {
  it('guarda y limpia el borrador en memoria', () => {
    expect(getDraft()).toBeNull();
    saveDraft({ ...emptyItemForm, title: 'Taladro' });
    expect(getDraft()?.title).toBe('Taladro');
    clearDraft();
    expect(getDraft()).toBeNull();
  });
});
