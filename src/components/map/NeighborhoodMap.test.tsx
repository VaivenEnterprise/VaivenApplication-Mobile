import { fireEvent, render, screen } from '@testing-library/react-native';
import { NeighborhoodMap, type MapPin } from '@/components/map/NeighborhoodMap';
import { es } from '@/i18n/es-MX';

const ORIGIN = { lat: 19.4326, lng: -99.1332 };
const pins: MapPin[] = [
  {
    id: 'a',
    number: 1,
    label: 'Herramienta 1: Taladro, ~300 m',
    zone: 'Del Carmen',
    location: { lat: ORIGIN.lat + 0.0027, lng: ORIGIN.lng },
  },
  {
    id: 'b',
    number: 2,
    label: 'Herramienta 2: Nivel, ~800 m',
    location: { lat: ORIGIN.lat, lng: ORIGIN.lng + 0.0076 },
  },
  { id: 'c', number: 3, label: 'Herramienta 3: Cinta, sin zona', location: null },
];

describe('NeighborhoodMap', () => {
  it('dibuja «Tú», el radio y un pin por herramienta con ubicación', async () => {
    await render(
      <NeighborhoodMap origin={ORIGIN} pins={pins} selectedId={null} onSelect={jest.fn()} />,
    );
    expect(screen.getByText(es.bookings.guide.you)).toBeTruthy();
    expect(screen.getByText('Radio < 1000 m')).toBeTruthy();
    expect(screen.getByLabelText('Herramienta 1: Taladro, ~300 m')).toBeTruthy();
    expect(screen.getByLabelText('Herramienta 2: Nivel, ~800 m')).toBeTruthy();
    expect(screen.getByText('Del Carmen')).toBeTruthy();
  });

  it('un pin sin ubicación aproximada no se dibuja', async () => {
    await render(
      <NeighborhoodMap origin={ORIGIN} pins={pins} selectedId={null} onSelect={jest.fn()} />,
    );
    expect(screen.queryByLabelText(/Herramienta 3/)).toBeNull();
  });

  it('tocar un pin avisa cuál; el seleccionado se marca', async () => {
    const onSelect = jest.fn();
    const view = await render(
      <NeighborhoodMap origin={ORIGIN} pins={pins} selectedId={null} onSelect={onSelect} />,
    );
    await fireEvent.press(screen.getByLabelText('Herramienta 2: Nivel, ~800 m'));
    expect(onSelect).toHaveBeenCalledWith('b');
    expect(
      screen.getByLabelText('Herramienta 2: Nivel, ~800 m').props.accessibilityState.selected,
    ).toBe(false);
    await view.rerender(
      <NeighborhoodMap origin={ORIGIN} pins={pins} selectedId="b" onSelect={onSelect} />,
    );
    expect(
      screen.getByLabelText('Herramienta 2: Nivel, ~800 m').props.accessibilityState.selected,
    ).toBe(true);
  });

  it('sin ningún pin ubicado sigue mostrando el esquema con el radio mínimo', async () => {
    await render(
      <NeighborhoodMap origin={ORIGIN} pins={[pins[2]!]} selectedId={null} onSelect={jest.fn()} />,
    );
    expect(screen.getByText('Radio < 400 m')).toBeTruthy();
    expect(screen.getByTestId('neighborhood-map')).toBeTruthy();
  });
});
