import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { Skeleton } from '@/components/ui/Skeleton';
import type { RemoteImageData } from '@/features/images/types';
import { es } from '@/i18n/es-MX';
import { gradients } from '@/theme';

export type RemoteImageVariant = 'thumb' | 'full';

type RemoteImageProps = {
  /** Imagen de la API; `null` muestra directamente el estado de error. */
  image: RemoteImageData | null;
  /** `thumb` usa `thumbUrl` (listas); `full` usa `url` (detalle). */
  variant?: RemoteImageVariant;
  /** Evidencia (URL firmada): nunca se guarda en caché persistente (P-06). */
  evidence?: boolean;
  /** Texto alternativo para lectores de pantalla; sin él la imagen es decorativa. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Muestra una imagen de la API con `expo-image`: `Skeleton` mientras carga y, si falla, un fondo
 * cálido con ícono. Nunca deja un hueco vacío ni muestra texto de error (spec 004 §7.2).
 */
export function RemoteImage({
  image,
  variant = 'thumb',
  evidence = false,
  accessibilityLabel,
  style,
  testID,
}: RemoteImageProps) {
  const uri = image === null ? null : variant === 'thumb' ? image.thumbUrl : image.url;
  // Al cambiar de URL se vuelve a empezar: el estado de la anterior no debe pasar a la nueva.
  return (
    <View style={[styles.box, style]} testID={testID}>
      <Content
        key={uri ?? 'none'}
        uri={uri}
        evidence={evidence}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}

type ContentProps = {
  uri: string | null;
  evidence: boolean;
  accessibilityLabel: string | undefined;
};

function Content({ uri, evidence, accessibilityLabel }: ContentProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>(
    uri === null ? 'failed' : 'loading',
  );

  return (
    <>
      {uri === null ? null : (
        <Image
          testID="remote-image"
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy={evidence ? 'none' : 'memory-disk'}
          transition={120}
          accessible={accessibilityLabel !== undefined}
          accessibilityLabel={accessibilityLabel}
          accessibilityIgnoresInvertColors
          onLoad={() => setState('loaded')}
          onError={() => setState('failed')}
        />
      )}
      {state === 'loading' ? (
        <View style={StyleSheet.absoluteFill} testID="remote-image-loading">
          <Skeleton shape="card" width="100%" />
        </View>
      ) : null}
      {state === 'failed' ? (
        <View
          style={[StyleSheet.absoluteFill, styles.failed]}
          testID="remote-image-failed"
          accessible
          accessibilityLabel={es.images.remote.failed}
        >
          <LinearGradient
            colors={gradients.slotWarm.colors}
            start={gradients.slotWarm.start}
            end={gradients.slotWarm.end}
            style={StyleSheet.absoluteFill}
          />
          <AppIcon name="image" size="lg" color="primaryInk" />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden' },
  failed: { alignItems: 'center', justifyContent: 'center' },
});
