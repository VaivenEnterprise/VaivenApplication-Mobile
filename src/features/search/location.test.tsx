import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { DistanceField } from '@/features/search/components/DistanceField';
import { useLocation, type LocationApi } from '@/features/search/useLocation';
import { es } from '@/i18n/es-MX';

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

const t = es.search.filters;
const getPermission = jest.mocked(Location.getForegroundPermissionsAsync);
const requestPermission = jest.mocked(Location.requestForegroundPermissionsAsync);
const getPosition = jest.mocked(Location.getCurrentPositionAsync);

const permission = (granted: boolean, canAskAgain = true) =>
  ({ granted, canAskAgain, status: granted ? 'granted' : 'undetermined' }) as never;
const position = (lat: number, lng: number) =>
  ({ coords: { latitude: lat, longitude: lng } }) as never;

beforeEach(() => {
  getPermission.mockResolvedValue(permission(false));
});
afterEach(() => {
  getPermission.mockReset();
  requestPermission.mockReset();
  getPosition.mockReset();
});

describe('useLocation', () => {
  it('al montar solo consulta el permiso: no abre el diálogo ni pide posición', async () => {
    const { result } = await renderHook(() => useLocation());
    await waitFor(() => expect(getPermission).toHaveBeenCalled());
    expect(result.current.availability).toBe('unknown');
    expect(result.current.coords).toBeNull();
    expect(requestPermission).not.toHaveBeenCalled();
    expect(getPosition).not.toHaveBeenCalled();
  });

  it('con permiso ya concedido queda disponible', async () => {
    getPermission.mockResolvedValue(permission(true));
    const { result } = await renderHook(() => useLocation());
    await waitFor(() => expect(result.current.availability).toBe('available'));
  });

  it('con permiso negado para siempre queda no disponible', async () => {
    getPermission.mockResolvedValue(permission(false, false));
    const { result } = await renderHook(() => useLocation());
    await waitFor(() => expect(result.current.availability).toBe('unavailable'));
  });

  it('locate pide el permiso, obtiene la posición y la guarda solo en memoria', async () => {
    requestPermission.mockResolvedValue(permission(true));
    getPosition.mockResolvedValue(position(19.4326, -99.1332));
    const { result } = await renderHook(() => useLocation());

    let found: unknown;
    await act(async () => {
      found = await result.current.locate();
    });
    expect(found).toEqual({ lat: 19.4326, lng: -99.1332 });
    expect(result.current.coords).toEqual({ lat: 19.4326, lng: -99.1332 });
    expect(result.current.availability).toBe('available');
    expect(result.current.locating).toBe(false);
    expect(getPosition).toHaveBeenCalledWith({ accuracy: 3 });
  });

  it('CA-04: si se niega el permiso, no hay posición y queda no disponible', async () => {
    requestPermission.mockResolvedValue(permission(false));
    const { result } = await renderHook(() => useLocation());
    let found: unknown = 'sin llamar';
    await act(async () => {
      found = await result.current.locate();
    });
    expect(found).toBeNull();
    expect(result.current.availability).toBe('unavailable');
    expect(getPosition).not.toHaveBeenCalled();
  });

  it('si falla obtener la posición, también queda no disponible', async () => {
    requestPermission.mockResolvedValue(permission(true));
    getPosition.mockRejectedValue(new Error('servicios de ubicación apagados'));
    const { result } = await renderHook(() => useLocation());
    await act(async () => {
      await result.current.locate();
    });
    expect(result.current.coords).toBeNull();
    expect(result.current.availability).toBe('unavailable');
  });
});

function api(over: Partial<LocationApi> = {}): LocationApi {
  return {
    availability: 'unknown',
    coords: null,
    locating: false,
    locate: jest.fn().mockResolvedValue({ lat: 19.43, lng: -99.13 }),
    ...over,
  };
}

describe('DistanceField', () => {
  it('muestra los radios 1 · 3 · 5 · 10 km y la nota de privacidad', async () => {
    await render(<DistanceField value={null} onChange={jest.fn()} location={api()} />);
    expect(screen.getAllByRole('radio').map((chip) => chip.props.accessibilityLabel)).toEqual([
      '1 km',
      '3 km',
      '5 km',
      '10 km',
    ]);
    expect(screen.getByText(t.distanceHint)).toBeTruthy();
  });

  it('pide la ubicación al elegir un radio y lo aplica si se concede', async () => {
    const onChange = jest.fn();
    const location = api();
    await render(<DistanceField value={null} onChange={onChange} location={location} />);
    await fireEvent.press(screen.getByRole('radio', { name: '5 km' }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(5));
    expect(location.locate).toHaveBeenCalledTimes(1);
  });

  it('si ya hay posición no vuelve a pedirla', async () => {
    const onChange = jest.fn();
    const location = api({ availability: 'available', coords: { lat: 19.43, lng: -99.13 } });
    await render(<DistanceField value={null} onChange={onChange} location={location} />);
    await fireEvent.press(screen.getByRole('radio', { name: '3 km' }));
    expect(onChange).toHaveBeenCalledWith(3);
    expect(location.locate).not.toHaveBeenCalled();
  });

  it('si se niega el permiso, no aplica el radio', async () => {
    const onChange = jest.fn();
    const location = api({ locate: jest.fn().mockResolvedValue(null) });
    await render(<DistanceField value={null} onChange={onChange} location={location} />);
    await fireEvent.press(screen.getByRole('radio', { name: '1 km' }));
    await waitFor(() => expect(location.locate).toHaveBeenCalled());
    expect(onChange).not.toHaveBeenCalled();
  });

  it('volver a tocar el radio elegido lo quita', async () => {
    const onChange = jest.fn();
    await render(
      <DistanceField
        value={5}
        onChange={onChange}
        location={api({ availability: 'available', coords: { lat: 1, lng: 2 } })}
      />,
    );
    expect(screen.getByRole('radio', { name: '5 km' }).props.accessibilityState).toEqual({
      selected: true,
    });
    await fireEvent.press(screen.getByRole('radio', { name: '5 km' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('mientras busca la ubicación lo avisa', async () => {
    await render(
      <DistanceField value={null} onChange={jest.fn()} location={api({ locating: true })} />,
    );
    expect(screen.getByText(t.distanceLocating)).toBeTruthy();
  });

  it('CA-04: con el permiso negado el filtro de distancia no se muestra', async () => {
    await render(
      <DistanceField
        value={null}
        onChange={jest.fn()}
        location={api({ availability: 'unavailable' })}
      />,
    );
    expect(screen.queryByText(t.distance)).toBeNull();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });
});
