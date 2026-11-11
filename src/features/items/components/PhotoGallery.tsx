import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { RemoteImage } from '@/features/images';
import type { RemoteImageData } from '@/features/images';
import { es } from '@/i18n/es-MX';
import { colors, gradients, radius, spacing } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';

const RATIO = 4 / 3;
const DOT = spacing.sm;

type PhotoGalleryProps = {
  photos: readonly RemoteImageData[];
};

/**
 * Galería del detalle (spec 005 §7.3): tarjeta 4:3 con fotos deslizables y puntos de página. Sin
 * fotos muestra un fondo cálido con ícono. La reutiliza 006.
 */
export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width === 0) return;
    setPage(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  if (photos.length === 0) {
    return (
      <View
        accessible
        accessibilityLabel={es.items.detail.noPhoto}
        style={[styles.frame, styles.empty]}
      >
        <LinearGradient {...gradients.slotWarm} style={StyleSheet.absoluteFill} />
        <AppIcon name="cube" size="xl" color="primaryInk" />
      </View>
    );
  }

  const current = Math.min(page, photos.length - 1);
  return (
    <View style={styles.frame} onLayout={onLayout} accessible={false}>
      <ScrollView
        testID="photo-gallery-scroll"
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
      >
        {photos.map((photo, index) => (
          <RemoteImage
            key={photo.publicId}
            image={photo}
            variant="full"
            accessibilityLabel={`${es.items.detail.photoCounter} ${index + 1} ${es.items.detail.photoOf} ${photos.length}`}
            style={{ width: width === 0 ? undefined : width, aspectRatio: RATIO }}
          />
        ))}
      </ScrollView>
      {photos.length > 1 ? (
        <View
          style={styles.dots}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {photos.map((photo, index) => (
            <View
              key={photo.publicId}
              testID={index === current ? 'photo-dot-active' : 'photo-dot'}
              style={[styles.dot, index === current && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: RATIO,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  empty: { alignItems: 'center', justifyContent: 'center' },
  dots: {
    position: 'absolute',
    bottom: spacing.smd,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    opacity: 0.6,
  },
  dotActive: { opacity: 1 },
});
