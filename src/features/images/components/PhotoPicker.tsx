import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { ListRow } from '@/components/ui/ListRow';
import { UploadProgress } from '@/features/images/components/UploadProgress';
import type { useImageUpload, UploadItem } from '@/features/images/useImageUpload';
import { usePickImages } from '@/features/images/usePickImages';
import type { UploadErrorCode } from '@/features/images/types';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.images;

/** Máximo de fotos por objeto en el contrato (`ImageInput`: máximo 5 por recurso). */
export const DEFAULT_MAX_PHOTOS = 5;

const ERROR_TEXT: Record<UploadErrorCode, string> = {
  signature: t.errors.signature,
  upload: t.errors.upload,
  rate_limited: t.errors.rateLimited,
  too_large: t.errors.tooLarge,
  invalid_format: t.errors.invalidFormat,
  resize: t.errors.resize,
  unexpected: t.errors.unexpected,
};

type PhotoPickerProps = {
  /** Resultado de `useImageUpload(purpose)`: el formulario lo conserva para leer `refs` e `isUploading`. */
  uploader: ReturnType<typeof useImageUpload>;
  /** Máximo de fotos (configurable). */
  max?: number;
};

/**
 * Selector de fotos (spec 004 §7.1): fila de casillas con «+», vista previa, quitar, portada,
 * avance y error por foto. La subida la lleva `useImageUpload`; este componente solo la muestra.
 */
export function PhotoPicker({ uploader, max = DEFAULT_MAX_PHOTOS }: PhotoPickerProps) {
  const { items, add, retry, remove, moveToFront } = uploader;
  const picker = usePickImages({ max, count: items.length });
  const [adding, setAdding] = useState(false);
  const [actionsFor, setActionsFor] = useState<string | null>(null);

  const choose = async (source: 'camera' | 'library') => {
    setAdding(false);
    const photos = await (source === 'camera' ? picker.pickFromCamera() : picker.pickFromLibrary());
    if (photos.length > 0) add(photos);
  };

  const failed = items.find((item) => item.status === 'error');
  const selected = items.find((item) => item.id === actionsFor);

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.row}
      >
        {picker.canAdd ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t.picker.add}, ${items.length} ${t.picker.of} ${max}`}
            onPress={() => setAdding(true)}
            style={[styles.slot, styles.addSlot]}
          >
            <AppIcon name="camera" color="primaryInk" />
            <AppText variant="caption" color="primaryInk">
              {`${items.length}${t.picker.counterOf}${max}`}
            </AppText>
          </Pressable>
        ) : null}

        {items.map((item, index) => (
          <PhotoSlot
            key={item.id}
            item={item}
            index={index}
            onRetry={() => retry(item.id)}
            onRemove={() => remove(item.id)}
            onOpenActions={() => setActionsFor(item.id)}
            onMakeCover={() => moveToFront(item.id)}
          />
        ))}
      </ScrollView>

      {failed === undefined || failed.errorCode === null ? null : (
        <AppText variant="caption" color="danger" accessibilityRole="alert">
          {ERROR_TEXT[failed.errorCode]}
        </AppText>
      )}
      {picker.canAdd ? null : (
        <AppText variant="caption" color="muted">
          {t.picker.limitReached}
        </AppText>
      )}

      {picker.status === 'denied' ? (
        <Card variant="muted" style={styles.denied}>
          <AppText variant="bodyStrong">
            {picker.deniedSource === 'library'
              ? t.permissions.libraryTitle
              : t.permissions.cameraTitle}
          </AppText>
          <AppText color="muted">
            {picker.deniedSource === 'library'
              ? t.permissions.libraryDenied
              : t.permissions.cameraDenied}
          </AppText>
          <Button
            label={t.permissions.openSettings}
            variant="outline"
            onPress={() => void picker.openSettings()}
          />
          <Button label={t.permissions.dismiss} variant="link" onPress={picker.dismiss} />
        </Card>
      ) : null}

      <BottomSheet visible={adding} onClose={() => setAdding(false)} title={t.picker.sheetTitle}>
        <ListRow
          title={t.picker.takePhoto}
          leading={<IconBadge icon="camera" />}
          onPress={() => void choose('camera')}
        />
        <ListRow
          title={t.picker.chooseGallery}
          leading={<IconBadge icon="image" tone="secondary" />}
          onPress={() => void choose('library')}
        />
      </BottomSheet>

      <BottomSheet
        visible={selected !== undefined}
        onClose={() => setActionsFor(null)}
        title={t.picker.actions}
      >
        {selected === undefined || items[0]?.id === selected.id ? null : (
          <ListRow
            title={t.picker.makeCover}
            leading={<IconBadge icon="star" />}
            onPress={() => {
              moveToFront(selected.id);
              setActionsFor(null);
            }}
          />
        )}
        {selected === undefined ? null : (
          <ListRow
            title={t.picker.remove}
            leading={<IconBadge icon="trash" tone="danger" />}
            onPress={() => {
              remove(selected.id);
              setActionsFor(null);
            }}
          />
        )}
      </BottomSheet>
    </View>
  );
}

type PhotoSlotProps = {
  item: UploadItem;
  index: number;
  onRetry: () => void;
  onRemove: () => void;
  onOpenActions: () => void;
  onMakeCover: () => void;
};

function PhotoSlot({ item, index, onRetry, onRemove, onOpenActions, onMakeCover }: PhotoSlotProps) {
  const isCover = index === 0;
  const failed = item.status === 'error';
  const uploading = item.status === 'uploading' || item.status === 'idle';
  const state = failed ? t.picker.failed : uploading ? t.picker.uploading : t.picker.uploaded;
  const actions = [
    ...(isCover ? [] : [{ name: 'makeCover', label: t.picker.makeCover }]),
    { name: 'remove', label: t.picker.remove },
  ];

  return (
    <View style={styles.slotWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t.picker.photoLabel} ${index + 1}${isCover ? `, ${t.picker.cover}` : ''}. ${state}`}
        accessibilityActions={actions}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'makeCover') onMakeCover();
          if (event.nativeEvent.actionName === 'remove') onRemove();
        }}
        onPress={failed && item.retryable ? onRetry : undefined}
        onLongPress={onOpenActions}
        style={styles.slot}
      >
        <Image
          source={{ uri: item.local.uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
        {uploading ? (
          <View style={[StyleSheet.absoluteFill, styles.veil, styles.scrim]}>
            <UploadProgress progress={item.progress} testID="upload-progress" />
          </View>
        ) : null}
        {failed ? (
          <View
            style={[StyleSheet.absoluteFill, styles.veil, styles.failedVeil]}
            testID="upload-failed"
          >
            <AppIcon
              name={item.retryable ? 'refresh' : 'warning'}
              color="danger"
              accessibilityLabel={item.retryable ? t.picker.retry : undefined}
            />
          </View>
        ) : null}
        {isCover ? (
          <View style={styles.cover}>
            <AppText variant="tab" color="onPrimary">
              {t.picker.cover}
            </AppText>
          </View>
        ) : null}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t.picker.remove} ${index + 1}`}
        onPress={onRemove}
        hitSlop={(sizes.touch.minSize - sizes.photoRemove) / 2}
        style={styles.remove}
      >
        <AppIcon name="close" size="sm" color="onPrimary" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  // Margen extra arriba y a la derecha para que el botón «quitar» sobresalga sin recortarse.
  row: { flexDirection: 'row', gap: spacing.smd, paddingTop: spacing.xs, paddingRight: spacing.xs },
  slot: {
    width: sizes.photoSlot,
    height: sizes.photoSlot,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  addSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
  },
  slotWrap: { width: sizes.photoSlot, height: sizes.photoSlot },
  veil: { alignItems: 'center', justifyContent: 'center' },
  scrim: { backgroundColor: colors.scrim },
  failedVeil: { backgroundColor: colors.dangerSoft },
  cover: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: spacing.xs / 2,
    backgroundColor: colors.scrim,
  },
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
  denied: { gap: spacing.sm },
});
