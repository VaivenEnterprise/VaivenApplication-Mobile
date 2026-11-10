import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { Linking } from 'react-native';
import type { LocalImage } from '@/features/images/types';

export type PickSource = 'camera' | 'library';
export type PickStatus = 'idle' | 'denied' | 'error';

type PickOptions = {
  /** Máximo de fotos que admite el selector (configurable por pantalla). */
  max: number;
  /** Cuántas fotos hay ya elegidas; el resto es lo que aún cabe. */
  count?: number;
};

/**
 * Elegir fotos con la cámara o la galería (RF-01, RF-06). La cámara pide su permiso al usarse y,
 * si se niega, el estado pasa a `denied` con acceso directo a Ajustes (CA-03). La galería usa el
 * selector del sistema, que no necesita permiso. Nunca devuelve más fotos de las que caben (CA-05).
 */
export function usePickImages({ max, count = 0 }: PickOptions) {
  const [status, setStatus] = useState<PickStatus>('idle');
  const [deniedSource, setDeniedSource] = useState<PickSource | null>(null);
  const remaining = Math.max(0, max - count);

  const toLocal = (assets: ImagePicker.ImagePickerAsset[]): LocalImage[] =>
    assets
      .slice(0, remaining)
      .map((asset) => ({ uri: asset.uri, width: asset.width, height: asset.height }));

  const pick = useCallback(
    async (source: PickSource): Promise<LocalImage[]> => {
      if (remaining <= 0) return [];
      setStatus('idle');
      setDeniedSource(null);
      try {
        if (source === 'camera') {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            setStatus('denied');
            setDeniedSource('camera');
            return [];
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 1,
          });
          return result.canceled ? [] : toLocal(result.assets);
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsMultipleSelection: remaining > 1,
          selectionLimit: remaining,
          orderedSelection: true,
          quality: 1,
        });
        return result.canceled ? [] : toLocal(result.assets);
      } catch {
        setStatus('error');
        return [];
      }
    },
    // `toLocal` solo depende de `remaining`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [remaining],
  );

  return {
    status,
    /** Origen cuyo permiso se negó (para elegir el mensaje); `null` si no hay negación. */
    deniedSource,
    remaining,
    canAdd: remaining > 0,
    pickFromCamera: useCallback(() => pick('camera'), [pick]),
    pickFromLibrary: useCallback(() => pick('library'), [pick]),
    openSettings: useCallback(() => Linking.openSettings(), []),
    dismiss: useCallback(() => {
      setStatus('idle');
      setDeniedSource(null);
    }, []),
  };
}
