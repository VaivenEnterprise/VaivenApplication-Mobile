import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { RemoteImage, type RemoteImageData } from '@/features/images';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.handover.evidence;

type EvidenceGalleryProps = {
  photos: readonly RemoteImageData[];
  /** Sin esta función las fotos solo se ven (etapa ya confirmada). */
  onRemove?: (publicId: string) => void;
};

/**
 * Fotos de evidencia ya guardadas. Son privadas: se piden con URL firmada y `RemoteImage` no las
 * guarda en caché persistente (plan P-07).
 */
export function EvidenceGallery({ photos, onRemove }: EvidenceGalleryProps) {
  if (photos.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {photos.map((photo, index) => (
        <View key={photo.publicId} style={styles.slot}>
          <RemoteImage
            image={photo}
            evidence
            accessibilityLabel={`${t.photoLabel} ${index + 1}`}
            style={styles.photo}
          />
          {onRemove === undefined ? null : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t.removePhoto} ${index + 1}`}
              onPress={() => onRemove(photo.publicId)}
              hitSlop={(sizes.touch.minSize - sizes.photoRemove) / 2}
              style={styles.remove}
            >
              <AppIcon name="close" size="sm" color="onPrimary" />
            </Pressable>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.smd, paddingTop: spacing.xs, paddingRight: spacing.xs },
  slot: { width: sizes.photoSlot, height: sizes.photoSlot },
  photo: { width: sizes.photoSlot, height: sizes.photoSlot, borderRadius: radius.lg },
  remove: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    width: sizes.photoRemove,
    height: sizes.photoRemove,
    borderRadius: radius.pill,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
