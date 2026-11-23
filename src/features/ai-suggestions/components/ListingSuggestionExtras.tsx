import type { ImageRef } from '@/features/images';
import { SuggestionBanner } from '@/features/ai-suggestions/components/SuggestionBanner';
import {
  useAiSuggestionsEnabled,
  useListingSuggestion,
} from '@/features/ai-suggestions/useListingSuggestion';
import { useCategories } from '@/features/items';
import { useState } from 'react';

/** Lo que el formulario de publicar entrega al *slot* `renderFormExtras` (spec 005 T007). */
export type FormExtrasContext = {
  /** Fotos ya subidas, en orden (la primera es la portada). */
  photos: readonly ImageRef[];
  /** Rellena campos del formulario sin enviar nada. */
  setValues: (patch: { title?: string; category?: string }) => void;
};

type SuggestionForPhotoProps = {
  coverPublicId: string;
  setValues: FormExtrasContext['setValues'];
};

/** Sugerencia para una foto de portada concreta; al cambiar la portada se vuelve a montar. */
function SuggestionForPhoto({ coverPublicId, setValues }: SuggestionForPhotoProps) {
  const categories = useCategories();
  const { status, suggestion, suggest, cancel, reset } = useListingSuggestion();
  const [applied, setApplied] = useState(false);

  // P-02: la categoría solo se aplica si existe en `GET /categories`.
  const category =
    suggestion?.category === undefined
      ? undefined
      : categories.data?.find((candidate) => candidate.key === suggestion.category);

  const fill = () => {
    if (suggestion === null) return;
    setValues(
      category === undefined
        ? { title: suggestion.title.trim() }
        : { title: suggestion.title.trim(), category: category.key },
    );
  };

  return (
    <SuggestionBanner
      status={status}
      suggestion={suggestion}
      categoryLabel={category?.label ?? null}
      applied={applied}
      onSuggest={() => {
        setApplied(false);
        suggest(coverPublicId);
      }}
      onCancel={cancel}
      onUse={() => {
        fill();
        setApplied(true);
      }}
      onEdit={() => {
        fill();
        setApplied(false);
        reset();
      }}
      onDismiss={() => {
        setApplied(false);
        reset();
      }}
    />
  );
}

/**
 * Sugerencia con IA dentro del formulario de publicar (RF-02, RF-05): solo aparece con la IA activa
 * (`GET /meta`) y al menos una foto `item_photo` ya subida; la sugerencia usa la portada.
 */
export function ListingSuggestionExtras({ photos, setValues }: FormExtrasContext) {
  const enabled = useAiSuggestionsEnabled();
  const cover = photos[0];
  if (!enabled || cover === undefined) return null;
  return (
    <SuggestionForPhoto key={cover.publicId} coverPublicId={cover.publicId} setValues={setValues} />
  );
}
