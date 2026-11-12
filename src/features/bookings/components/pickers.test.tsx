import { fireEvent, render, screen } from '@testing-library/react-native';
import { DateRangePicker, applyDate } from '@/features/bookings/components/DateRangePicker';
import { PaymentModePicker } from '@/features/bookings/components/PaymentModePicker';
import { es } from '@/i18n/es-MX';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
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

const t = es.bookings.request;
const TODAY = '2026-11-11'; // miércoles

describe('DateRangePicker', () => {
  it('los atajos eligen hoy, mañana y el fin de semana', async () => {
    const onChange = jest.fn();
    await render(<DateRangePicker start="" end="" today={TODAY} onChange={onChange} />);
    await fireEvent.press(screen.getByLabelText(t.today));
    await fireEvent.press(screen.getByLabelText(t.tomorrow));
    await fireEvent.press(screen.getByLabelText(t.weekend));
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([
      { start: '2026-11-11', end: '2026-11-11' },
      { start: '2026-11-12', end: '2026-11-12' },
      { start: '2026-11-14', end: '2026-11-15' },
    ]);
  });

  it('marca el atajo vigente como seleccionado', async () => {
    await render(
      <DateRangePicker start="2026-11-14" end="2026-11-15" today={TODAY} onChange={jest.fn()} />,
    );
    expect(screen.getByLabelText(t.weekend).props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText(t.today).props.accessibilityState.selected).toBe(false);
  });

  it('CA-02: un periodo de 8 días muestra el aviso y recuerda el máximo', async () => {
    await render(
      <DateRangePicker start="2026-11-12" end="2026-11-19" today={TODAY} onChange={jest.fn()} />,
    );
    expect(screen.getByText(es.search.filters.rangeTooLong)).toBeTruthy();
  });

  it('no deja elegir fechas pasadas: el calendario arranca en hoy', async () => {
    await render(<DateRangePicker start="" end="" today={TODAY} onChange={jest.fn()} />);
    await fireEvent.press(screen.getByLabelText(new RegExp(`^${es.search.filters.from}`)));
    const min = screen.getByTestId('date-picker').props.minimumDate as Date;
    expect(min.getFullYear()).toBe(2026);
    expect(min.getMonth()).toBe(10);
    expect(min.getDate()).toBe(11);
  });

  it('elegir una fecha en el calendario avisa con start/end', async () => {
    const onChange = jest.fn();
    await render(<DateRangePicker start="" end="" today={TODAY} onChange={onChange} />);
    await fireEvent.press(screen.getByLabelText(new RegExp(`^${es.search.filters.from}`)));
    await fireEvent(screen.getByTestId('date-picker'), 'onChange', {}, new Date(2026, 10, 13, 12));
    expect(onChange).toHaveBeenCalledWith({ start: '2026-11-13', end: '' });
  });
});

describe('PaymentModePicker', () => {
  it('muestra dos tarjetas y marca la elegida', async () => {
    await render(<PaymentModePicker value="split_50_50" onChange={jest.fn()} />);
    const full = screen.getByLabelText(
      `${es.bookings.paymentMode.full_on_delivery}. ${es.bookings.paymentModeHint.full_on_delivery}`,
    );
    const split = screen.getByLabelText(
      `${es.bookings.paymentMode.split_50_50}. ${es.bookings.paymentModeHint.split_50_50}`,
    );
    expect(full.props.accessibilityState.selected).toBe(false);
    expect(split.props.accessibilityState.selected).toBe(true);
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('elegir una tarjeta avisa el modo', async () => {
    const onChange = jest.fn();
    await render(<PaymentModePicker value="full_on_delivery" onChange={onChange} />);
    await fireEvent.press(
      screen.getByLabelText(
        `${es.bookings.paymentMode.split_50_50}. ${es.bookings.paymentModeHint.split_50_50}`,
      ),
    );
    expect(onChange).toHaveBeenCalledWith('split_50_50');
  });
});

describe('applyDate', () => {
  it('no admite fechas pasadas y quita un fin que deja de ser válido', () => {
    expect(applyDate({ start: '', end: '' }, 'start', '2026-11-01', TODAY)).toEqual({
      start: TODAY,
      end: '',
    });
    expect(
      applyDate({ start: '2026-11-12', end: '2026-11-14' }, 'start', '2026-11-13', TODAY),
    ).toEqual({
      start: '2026-11-13',
      end: '2026-11-14',
    });
    expect(
      applyDate({ start: '2026-11-12', end: '2026-11-14' }, 'start', '2026-11-20', TODAY),
    ).toEqual({
      start: '2026-11-20',
      end: '',
    });
    expect(applyDate({ start: '2026-11-12', end: '' }, 'end', '2026-11-18', TODAY).end).toBe(
      '2026-11-18',
    );
  });

  it('el calendario de fin se limita a 7 días contando ambos extremos', async () => {
    await render(<DateRangePicker start="2026-11-12" end="" today={TODAY} onChange={jest.fn()} />);
    await fireEvent.press(screen.getByLabelText(new RegExp(`^${es.search.filters.to}`)));
    const picker = screen.getByTestId('date-picker');
    expect((picker.props.maximumDate as Date).getDate()).toBe(18);
    expect((picker.props.minimumDate as Date).getDate()).toBe(12);
  });

  it('un fin anterior al inicio muestra el aviso', async () => {
    await render(
      <DateRangePicker start="2026-11-14" end="2026-11-13" today={TODAY} onChange={jest.fn()} />,
    );
    expect(screen.getByText(es.search.filters.rangeInverted)).toBeTruthy();
  });
});
