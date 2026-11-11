import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Controller, useForm, useWatch, type Path } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { FormField } from '@/components/FormField';
import { FormNotice } from '@/components/FormNotice';
import { TextField } from '@/components/TextField';
import { AppIcon, type IconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { PhotoPicker, RemoteImage, useImageUpload, type ImageRef } from '@/features/images';
import { ChoiceChip } from '@/features/items/components/ChoiceChip';
import { ConditionPicker } from '@/features/items/components/ConditionPicker';
import { LocationField } from '@/features/items/components/LocationField';
import { ModalityPicker } from '@/features/items/components/ModalityPicker';
import { MoneyInput } from '@/features/items/components/MoneyInput';
import { PriceSuggestion } from '@/features/items/components/PriceSuggestion';
import { clearDraft, getDraft, saveDraft } from '@/features/items/draft';
import { useCategories, useCreateItem, useUpdateItem } from '@/features/items/hooks';
import {
  emptyItemForm,
  formValuesFromItem,
  itemFormSchema,
  toItemInput,
  type ItemFormValues,
} from '@/features/items/schemas';
import type { Item, ItemUpdate } from '@/features/items/types';
import { es } from '@/i18n/es-MX';
import { ApiError, messageForCode } from '@/lib/api/errors';
import { POLICY } from '@/lib/policy';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.items.form;

/** Lo que el formulario entrega al espacio `renderFormExtras` (botón de IA de 014). */
export type FormExtrasContext = {
  /** Fotos ya subidas, en orden (la primera es la portada). */
  photos: readonly ImageRef[];
  /** Cambia campos del formulario (p. ej. rellenar título y descripción). */
  setValues: (patch: Partial<ItemFormValues>) => void;
};

type ItemFormScreenProps = {
  /** Con un objeto, el formulario edita; sin él, publica. */
  item?: Item;
  renderFormExtras?: (context: FormExtrasContext) => ReactNode;
};

/** Campos del servidor (`details[].field`) → campos del formulario. */
const SERVER_FIELDS: Record<string, Path<ItemFormValues>> = {
  title: 'title',
  description: 'description',
  usageRules: 'usageRules',
  category: 'category',
  condition: 'condition',
  modality: 'modality',
  declaredValueCents: 'declaredValueCents',
  pricePerDayCents: 'pricePerDayCents',
  'zone.municipality': 'municipality',
  'zone.neighborhood': 'neighborhood',
};

function Section({
  icon,
  label,
  children,
}: {
  icon: IconName;
  label: string;
  children: ReactNode;
}) {
  return (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppIcon name={icon} color="primaryInk" />
        <AppText variant="subheading" accessibilityRole="header">
          {label}
        </AppText>
      </View>
      {children}
    </Card>
  );
}

/** Solo los campos que cambiaron, con el bloque de precio completo si cambia la modalidad o el precio. */
function changes(item: Item, values: ItemFormValues): ItemUpdate | null {
  const before = toItemInput(formValuesFromItem(item), []);
  const after = toItemInput(values, []);
  const { photos: _photos, ...rest } = after;
  const body: Record<string, unknown> = {};
  for (const key of Object.keys(rest) as (keyof typeof rest)[]) {
    if (JSON.stringify(rest[key]) !== JSON.stringify(before[key])) body[key] = rest[key];
  }
  if (Object.keys(body).length === 0) return null;
  if ('modality' in body || 'pricePerDayCents' in body || 'priceSource' in body) {
    body.modality = rest.modality;
    body.declaredValueCents = rest.declaredValueCents;
    body.pricePerDayCents = rest.pricePerDayCents;
    body.priceSource = rest.priceSource;
  }
  return { version: item.version, ...body };
}

/**
 * Publicar / editar objeto (spec 005 §7.2, RF-02 a RF-05, RF-09, RNF-01). Las fotos se suben al
 * elegirlas (004) y el formulario solo guarda su `publicId`; si una subida falla, lo escrito se
 * conserva. En edición las fotos publicadas se muestran sin cambios (edición de fotos: fuera de alcance).
 */
export function ItemFormScreen({ item, renderFormExtras }: ItemFormScreenProps) {
  const router = useRouter();
  const editing = item !== undefined;
  const uploader = useImageUpload('item_photo');
  const categories = useCategories();
  const create = useCreateItem();
  const update = useUpdateItem(item?.id ?? '');
  const [notice, setNotice] = useState<string | null>(null);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const form = useForm<ItemFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(itemFormSchema),
    defaultValues: item ? formValuesFromItem(item) : (getDraft() ?? emptyItemForm),
  });
  const { control, handleSubmit, setValue, setError, getValues, formState, subscribe } = form;
  const modality = useWatch({ control, name: 'modality' });
  const declared = useWatch({ control, name: 'declaredValueCents' });
  const loan = modality === 'loan';

  // Borrador en memoria (RNF-01): volver atrás no pierde lo escrito.
  useEffect(() => {
    if (editing) return undefined;
    return subscribe({
      formState: { values: true },
      callback: ({ values }) => saveDraft(values),
    });
  }, [editing, subscribe]);

  const patch = (values: Partial<ItemFormValues>) => {
    for (const [key, value] of Object.entries(values)) {
      setValue(key as keyof ItemFormValues, value as never, { shouldDirty: true });
    }
  };

  const photoProblem = (): string | null => {
    if (editing) return null;
    if (uploader.isUploading) return t.photosUploading;
    if (uploader.hasErrors) return t.photosFailed;
    if (uploader.refs.length < POLICY.photos.min) return t.photosRequired;
    return null;
  };

  const showServerError = (error: unknown) => {
    if (!(error instanceof ApiError)) {
      setNotice(es.errors.unexpected);
      return;
    }
    let matched = false;
    for (const detail of error.details) {
      const field = SERVER_FIELDS[detail.field];
      if (field === undefined) continue;
      matched = true;
      setError(field, { message: detail.issue.trim() === '' ? t.moderationField : detail.issue });
      if (field === 'description' || field === 'usageRules') setDetailsOpen(true);
    }
    if (matched) setNotice(t.moderation);
    else if (error.code === 'conflict')
      setNotice(editing ? t.conflict : messageForCode(error.code));
    else if (error.code === 'forbidden' && editing) setNotice(t.notEditable);
    else setNotice(messageForCode(error.code));
  };

  const submit = handleSubmit(async (values) => {
    setNotice(null);
    try {
      if (editing) {
        const body = changes(item, values);
        if (body !== null) await update.mutateAsync(body);
      } else {
        await create.mutateAsync(toItemInput(values, uploader.refs));
        clearDraft();
      }
      router.back();
    } catch (error) {
      showServerError(error);
    }
  });

  const onPressSubmit = () => {
    const problem = photoProblem();
    setPhotosError(problem);
    if (problem === null) void submit();
    else void handleSubmit(() => undefined)();
  };

  const busy = formState.isSubmitting;
  const blocked = uploader.isUploading;
  const errors = formState.errors;
  const detailsVisible =
    detailsOpen || errors.description !== undefined || errors.usageRules !== undefined;
  const title = editing ? t.editTitle : t.createTitle;

  return (
    <Screen
      scroll={false}
      contentStyle={styles.screen}
      footer={
        <Button
          label={editing ? t.save : t.publish}
          loading={busy}
          disabled={blocked}
          onPress={onPressSubmit}
        />
      }
    >
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={es.common.back}
          onPress={() => router.back()}
          style={styles.back}
        >
          <AppIcon name="arrowBack" />
        </Pressable>
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
      </View>
      <ScrollView
        testID="item-form-scroll"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <Section icon="camera" label={t.photos}>
          {editing ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoRow}
            >
              {item.photos.map((photo) => (
                <RemoteImage key={photo.publicId} image={photo} style={styles.photo} />
              ))}
            </ScrollView>
          ) : (
            <>
              <PhotoPicker uploader={uploader} max={POLICY.photos.max} />
              {photosError === null ? (
                <AppText variant="caption" color="muted">
                  {t.photosHint}
                </AppText>
              ) : (
                <FormNotice message={photosError} />
              )}
              {renderFormExtras?.({ photos: uploader.refs, setValues: patch })}
            </>
          )}
        </Section>

        <Section icon="edit" label={t.title}>
          <Controller
            control={control}
            name="title"
            render={({ field, fieldState }) => (
              <TextField
                label={t.title}
                placeholder={t.titlePlaceholder}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                error={fieldState.error?.message}
                maxLength={POLICY.title.max}
                returnKeyType="next"
              />
            )}
          />
        </Section>

        <Section icon="cube" label={t.category}>
          <Controller
            control={control}
            name="category"
            render={({ field, fieldState }) => (
              <FormField label={t.category} error={fieldState.error?.message}>
                {categories.isPending ? (
                  <Skeleton shape="line" width="60%" />
                ) : categories.isError ? (
                  <ErrorState error={categories.error} onRetry={() => void categories.refetch()} />
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chips}
                    accessibilityRole="radiogroup"
                    accessibilityLabel={t.category}
                  >
                    {categories.data.map((category) => (
                      <ChoiceChip
                        key={category.key}
                        label={category.label}
                        selected={field.value === category.key}
                        onPress={() => {
                          field.onChange(category.key);
                          field.onBlur();
                        }}
                      />
                    ))}
                  </ScrollView>
                )}
              </FormField>
            )}
          />
        </Section>

        <Section icon="swap" label={t.modality}>
          <ModalityPicker
            value={modality}
            onChange={(next) => {
              if (next === 'loan')
                patch({ modality: next, pricePerDayCents: 0, priceSource: 'manual' });
              else patch({ modality: next, pricePerDayCents: null, priceSource: 'manual' });
            }}
          />
        </Section>

        <Section icon="hammer" label={t.condition}>
          <Controller
            control={control}
            name="condition"
            render={({ field, fieldState }) => (
              <FormField label={t.condition} error={fieldState.error?.message}>
                <ConditionPicker value={field.value} onChange={field.onChange} />
              </FormField>
            )}
          />
        </Section>

        <Section icon="cash" label={t.price}>
          <Controller
            control={control}
            name="declaredValueCents"
            render={({ field, fieldState }) => (
              <MoneyInput
                label={t.declaredValue}
                icon="lock"
                hint={fieldState.error ? undefined : t.declaredValueHint}
                placeholder={t.pricePlaceholder}
                value={field.value}
                onChange={(cents) => {
                  field.onChange(cents);
                  // Un precio sugerido deja de serlo si el valor en el que se basó cambia.
                  if (getValues('priceSource') === 'suggested') setValue('priceSource', 'manual');
                }}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="pricePerDayCents"
            render={({ field, fieldState }) => (
              <MoneyInput
                label={t.pricePerDay}
                hint={loan ? t.pricePerDayLoanHint : undefined}
                placeholder={t.pricePlaceholder}
                disabled={loan}
                value={loan ? 0 : field.value}
                onChange={(cents) => {
                  field.onChange(cents);
                  setValue('priceSource', 'manual');
                }}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
          {loan ? null : (
            <PriceSuggestion
              declaredValueCents={declared}
              onApply={(cents) => patch({ pricePerDayCents: cents, priceSource: 'suggested' })}
            />
          )}
        </Section>

        <Section icon="pin" label={t.zone}>
          <Controller
            control={control}
            name="municipality"
            render={({ field, fieldState }) => (
              <TextField
                label={t.municipality}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                error={fieldState.error?.message}
                autoCapitalize="words"
                maxLength={POLICY.zone.max}
              />
            )}
          />
          <Controller
            control={control}
            name="neighborhood"
            render={({ field, fieldState }) => (
              <TextField
                label={t.neighborhood}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                error={fieldState.error?.message}
                autoCapitalize="words"
                maxLength={POLICY.zone.max}
              />
            )}
          />
          <Controller
            control={control}
            name="location"
            render={({ field }) => <LocationField value={field.value} onChange={field.onChange} />}
          />
        </Section>

        <Card style={styles.section}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.details}
            accessibilityState={{ expanded: detailsVisible }}
            onPress={() => setDetailsOpen((open) => !open)}
            style={styles.sectionHeader}
          >
            <AppIcon name="info" color="primaryInk" />
            <AppText variant="subheading" style={styles.grow}>
              {t.details}
            </AppText>
            <AppIcon name={detailsVisible ? 'close' : 'chevronDown'} color="muted" />
          </Pressable>
          {detailsVisible ? (
            <>
              <Controller
                control={control}
                name="description"
                render={({ field, fieldState }) => (
                  <TextField
                    label={t.description}
                    placeholder={t.descriptionPlaceholder}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={fieldState.error?.message}
                    maxLength={POLICY.description.max}
                    multiline
                  />
                )}
              />
              <Controller
                control={control}
                name="usageRules"
                render={({ field, fieldState }) => (
                  <TextField
                    label={t.usageRules}
                    placeholder={t.usageRulesPlaceholder}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={fieldState.error?.message}
                    maxLength={POLICY.usageRules.max}
                    multiline
                  />
                )}
              />
            </>
          ) : null}
        </Card>

        {notice === null ? null : <FormNotice message={notice} />}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 0 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
    paddingHorizontal: spacing.gutter,
  },
  back: {
    width: sizes.roundButton,
    height: sizes.roundButton,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { gap: spacing.md, padding: spacing.gutter },
  section: { gap: spacing.smd },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: 1 },
  chips: { flexDirection: 'row', gap: spacing.sm },
  photoRow: { gap: spacing.sm },
  photo: {
    width: sizes.photoSlot,
    height: sizes.photoSlot,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
});
