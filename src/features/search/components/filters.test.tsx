import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { DateRangeField, applyDate } from '@/features/search/components/DateRangeField';
import { FilterSheet } from '@/features/search/components/FilterSheet';
import { EMPTY_FILTERS, type SearchFilters } from '@/features/search/types';
import type { LocationApi } from '@/features/search/useLocation';
import { es } from '@/i18n/es-MX';
import { installFakeApi, ok } from '@/test/fakeApi';
import { fakeCategories } from '@/test/fakeItems';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({
    status: 'signedIn',
    user: { ...jest.requireActual('@/test/fakeApi').fakeUser },
  }),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/lib/format/date', () => ({
  ...jest.requireActual<typeof import('@/lib/format/date')>('@/lib/format/date'),
  todayYmd: () => '2026-11-12',
}));
jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) =>
      createElement(View as unknown as React.ComponentType<Record<string, unknown>>, {
        testID: props.testID as string | undefined,
        onChange: props.onChange,
        minimumDate: props.minimumDate,
        maximumDate: props.maximumDate,
      }),
    DateTimePickerAndroid: { open: jest.fn() },
  };
});

const t = es.search.filters;
const AVAILABLE: LocationApi = {
  availability: 'available',
  coords: { lat: 19.43, lng: -99.13 },
  locating: false,
  locate: jest.fn(),
};
const ymd = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const day = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);

afterEach(() => {
  jest.restoreAllMocks();
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  jest.mocked(DateTimePickerAndroid.open).mockReset();
});

describe('applyDate', () => {
  const today = '2026-11-12';
  it('no permite fechas pasadas: se ajustan a hoy', () => {
    expect(applyDate({ from: '', to: '' }, 'from', '2026-11-01', today)).toEqual({
      from: today,
      to: '',
    });
    expect(applyDate({ from: '', to: '' }, 'to', '2026-11-01', today).to).toBe(today);
  });

  it('conserva «Hasta» si sigue dentro de 0 a 7 días de «Desde»', () => {
    expect(applyDate({ from: '', to: '2026-11-15' }, 'from', '2026-11-13', today)).toEqual({
      from: '2026-11-13',
      to: '2026-11-15',
    });
    expect(applyDate({ from: '', to: '2026-11-20' }, 'from', '2026-11-13', today).to).toBe(
      '2026-11-20',
    );
  });

  it('quita «Hasta» si queda antes de «Desde» o a más de 7 días', () => {
    expect(applyDate({ from: '', to: '2026-11-13' }, 'from', '2026-11-15', today).to).toBe('');
    expect(applyDate({ from: '', to: '2026-11-30' }, 'from', '2026-11-13', today).to).toBe('');
  });
});

describe('DateRangeField', () => {
  it('muestra «Elegir fecha» en ambos campos y abre el calendario de «Desde» sin fechas pasadas', async () => {
    const onChange = jest.fn();
    await render(<DateRangeField from="" to="" today="2026-11-12" onChange={onChange} />);
    expect(screen.getAllByText(t.pickDate)).toHaveLength(2);

    await fireEvent.press(screen.getByRole('button', { name: `${t.from}: ${t.pickDate}` }));
    const picker = screen.getByTestId('date-picker');
    expect(ymd(picker.props.minimumDate)).toBe('2026-11-12');
    expect(picker.props.maximumDate).toBeUndefined();

    await fireEvent(picker, 'change', { type: 'set' }, day(2026, 11, 14));
    expect(onChange).toHaveBeenCalledWith({ from: '2026-11-14', to: '' });
    expect(screen.queryByTestId('date-picker')).toBeNull();
  });

  it('«Hasta» arranca en «Desde» y no pasa de 7 días', async () => {
    const onChange = jest.fn();
    await render(<DateRangeField from="2026-11-14" to="" today="2026-11-12" onChange={onChange} />);
    expect(screen.getByText('14 de noviembre de 2026')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: `${t.to}: ${t.pickDate}` }));
    const picker = screen.getByTestId('date-picker');
    expect(ymd(picker.props.minimumDate)).toBe('2026-11-14');
    expect(ymd(picker.props.maximumDate)).toBe('2026-11-21');
    await fireEvent(picker, 'change', { type: 'set' }, day(2026, 11, 16));
    expect(onChange).toHaveBeenCalledWith({ from: '2026-11-14', to: '2026-11-16' });
  });

  it('tocar el mismo campo otra vez cierra el calendario', async () => {
    await render(<DateRangeField from="" to="" today="2026-11-12" onChange={jest.fn()} />);
    const button = screen.getByRole('button', { name: `${t.from}: ${t.pickDate}` });
    await fireEvent.press(button);
    expect(screen.getByTestId('date-picker')).toBeTruthy();
    await fireEvent.press(button);
    expect(screen.queryByTestId('date-picker')).toBeNull();
  });

  it('quitar una fecha deja la otra', async () => {
    const onChange = jest.fn();
    await render(
      <DateRangeField from="2026-11-14" to="2026-11-16" today="2026-11-12" onChange={onChange} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: `${t.clearDate} ${t.from}` }));
    expect(onChange).toHaveBeenLastCalledWith({ from: '', to: '2026-11-16' });
    await fireEvent.press(screen.getByRole('button', { name: `${t.clearDate} ${t.to}` }));
    expect(onChange).toHaveBeenLastCalledWith({ from: '2026-11-14', to: '' });
  });

  it('avisa si el periodo llega invertido o demasiado largo', async () => {
    const { rerender } = await render(
      <DateRangeField from="2026-11-16" to="2026-11-14" today="2026-11-12" onChange={jest.fn()} />,
    );
    expect(screen.getByText(t.rangeInverted)).toBeTruthy();
    await rerender(
      <DateRangeField from="2026-11-14" to="2026-11-30" today="2026-11-12" onChange={jest.fn()} />,
    );
    expect(screen.getByText(t.rangeTooLong)).toBeTruthy();
  });

  it('en Android abre el diálogo del sistema con los límites y confirma la fecha', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    const onChange = jest.fn();
    await render(<DateRangeField from="2026-11-14" to="" today="2026-11-12" onChange={onChange} />);
    await fireEvent.press(screen.getByRole('button', { name: `${t.to}: ${t.pickDate}` }));

    const open = jest.mocked(DateTimePickerAndroid.open);
    expect(open).toHaveBeenCalledTimes(1);
    const options = open.mock.calls[0]?.[0];
    expect(options?.mode).toBe('date');
    expect(ymd(options?.minimumDate as Date)).toBe('2026-11-14');
    expect(ymd(options?.maximumDate as Date)).toBe('2026-11-21');

    options?.onChange?.({ type: 'dismissed' } as never, undefined);
    expect(onChange).not.toHaveBeenCalled();
    options?.onChange?.({ type: 'set' } as never, day(2026, 11, 15));
    expect(onChange).toHaveBeenCalledWith({ from: '2026-11-14', to: '2026-11-15' });
  });
});

describe('FilterSheet', () => {
  const FILTERS: SearchFilters = {
    ...EMPTY_FILTERS,
    q: 'taladro',
    category: 'hogar',
    modality: 'rent',
    municipality: 'Coyoacán',
  };

  const renderSheet = async (
    filters: SearchFilters,
    props: Partial<Parameters<typeof FilterSheet>[0]> = {},
  ) => {
    installFakeApi({ 'GET /categories': () => ok(fakeCategories) });
    const onApply = jest.fn();
    const onClose = jest.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const ui = (visible: boolean, current: SearchFilters) => (
      <QueryClientProvider client={client}>
        <FilterSheet
          visible={visible}
          onClose={onClose}
          filters={current}
          onApply={onApply}
          location={AVAILABLE}
          {...props}
        />
      </QueryClientProvider>
    );
    const result = await render(ui(true, filters));
    return { onApply, onClose, ui, ...result };
  };

  it('abre con los filtros vigentes (categoría, modalidad, municipio)', async () => {
    await renderSheet(FILTERS);
    expect(screen.getByRole('header', { name: t.title })).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByRole('radio', { name: 'Hogar' }).props.accessibilityState).toEqual({
        selected: true,
      }),
    );
    expect(
      screen.getByRole('tab', { name: es.items.modality.rent }).props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(screen.getByDisplayValue('Coyoacán')).toBeTruthy();
  });

  it('CA-03: aplica categoría, modalidad, fechas y municipio al tocar «Ver resultados»', async () => {
    const { onApply, onClose } = await renderSheet(EMPTY_FILTERS);
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Hogar' })).toBeTruthy());

    await fireEvent.press(screen.getByRole('radio', { name: 'Hogar' }));
    await fireEvent.press(screen.getByRole('tab', { name: es.items.modality.loan }));
    await fireEvent.changeText(
      screen.getByPlaceholderText(t.municipalityPlaceholder),
      '  Benito Juárez ',
    );
    await fireEvent.press(screen.getByRole('button', { name: `${t.from}: ${t.pickDate}` }));
    await fireEvent(
      screen.getByTestId('date-picker'),
      'change',
      { type: 'set' },
      day(2026, 11, 14),
    );
    await fireEvent.press(screen.getByRole('button', { name: `${t.to}: ${t.pickDate}` }));
    await fireEvent(
      screen.getByTestId('date-picker'),
      'change',
      { type: 'set' },
      day(2026, 11, 16),
    );

    await fireEvent.press(screen.getByRole('button', { name: t.apply }));
    expect(onApply).toHaveBeenCalledWith({
      ...EMPTY_FILTERS,
      category: 'hogar',
      modality: 'loan',
      municipality: 'Benito Juárez',
      from: '2026-11-14',
      to: '2026-11-16',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('«Todo» en modalidad quita el filtro', async () => {
    const { onApply } = await renderSheet(FILTERS);
    await fireEvent.press(screen.getByRole('tab', { name: t.modalityAll }));
    await fireEvent.press(screen.getByRole('button', { name: t.apply }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ modality: null }));
  });

  it('«Limpiar» deja la hoja sin filtros pero conserva el texto, y se aplica con «Ver resultados»', async () => {
    const { onApply } = await renderSheet(FILTERS);
    await fireEvent.press(screen.getByRole('button', { name: t.clear }));
    expect(screen.queryByDisplayValue('Coyoacán')).toBeNull();
    expect(onApply).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: t.apply }));
    expect(onApply).toHaveBeenCalledWith({ ...EMPTY_FILTERS, q: 'taladro' });
  });

  it('cerrar sin aplicar descarta los cambios: al reabrir parte de los filtros vigentes', async () => {
    const { ui, rerender, onApply } = await renderSheet(FILTERS);
    await fireEvent.changeText(screen.getByDisplayValue('Coyoacán'), 'Tlalpan');
    await rerender(ui(false, FILTERS));
    await rerender(ui(true, FILTERS));
    expect(screen.getByDisplayValue('Coyoacán')).toBeTruthy();
    expect(onApply).not.toHaveBeenCalled();
  });

  it('con un periodo inválido, «Ver resultados» queda deshabilitado', async () => {
    const { onApply } = await renderSheet({
      ...EMPTY_FILTERS,
      from: '2026-11-16',
      to: '2026-11-14',
    });
    expect(screen.getByText(t.rangeInverted)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.apply }));
    expect(onApply).not.toHaveBeenCalled();
    await act(async () => undefined);
  });
});
