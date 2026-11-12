import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import type { Coords } from '@/features/search/types';

/** `unavailable`: el permiso se negó (o no hay posición) y el filtro de distancia se oculta (CA-04). */
export type LocationAvailability = 'unknown' | 'available' | 'unavailable';

export type LocationApi = {
  availability: LocationAvailability;
  /** Posición del dispositivo; solo en memoria, nunca se guarda (plan P-06, Art. VI). */
  coords: Coords | null;
  locating: boolean;
  /** Pide el permiso si hace falta (RF-04: «al usarse») y obtiene la posición. `null` si no se pudo. */
  locate: () => Promise<Coords | null>;
};

/**
 * Ubicación para el filtro de distancia. Al montar solo *consulta* el permiso (sin diálogo); el
 * diálogo aparece cuando la persona elige un radio. Si se niega, `availability` pasa a
 * `unavailable` y el resto de la búsqueda sigue funcionando.
 */
export function useLocation(): LocationApi {
  const [availability, setAvailability] = useState<LocationAvailability>('unknown');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let active = true;
    void Location.getForegroundPermissionsAsync()
      .then((permission) => {
        if (!active) return;
        if (permission.granted) setAvailability('available');
        else if (!permission.canAskAgain) setAvailability('unavailable');
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const locate = useCallback(async (): Promise<Coords | null> => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setAvailability('unavailable');
        return null;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const found = { lat: position.coords.latitude, lng: position.coords.longitude };
      setCoords(found);
      setAvailability('available');
      return found;
    } catch {
      setAvailability('unavailable');
      return null;
    } finally {
      setLocating(false);
    }
  }, []);

  return { availability, coords, locating, locate };
}
