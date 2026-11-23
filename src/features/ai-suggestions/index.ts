// API pública de las sugerencias con IA (spec 014). El formulario de publicar (005) la conecta con
// una línea: `renderFormExtras={renderFormExtras}`; no se edita `ItemFormScreen` (P-04).

import { createElement, type ReactNode } from 'react';
import {
  ListingSuggestionExtras,
  type FormExtrasContext,
} from '@/features/ai-suggestions/components/ListingSuggestionExtras';

export { SuggestionBanner } from '@/features/ai-suggestions/components/SuggestionBanner';
export type { FormExtrasContext } from '@/features/ai-suggestions/components/ListingSuggestionExtras';
export {
  useAiSuggestionsEnabled,
  useListingSuggestion,
} from '@/features/ai-suggestions/useListingSuggestion';
export type { ListingSuggestion, SuggestionStatus } from '@/features/ai-suggestions/types';

/** *Slot* `renderFormExtras` del formulario de publicar (spec 005 T007). */
export function renderFormExtras(context: FormExtrasContext): ReactNode {
  return createElement(ListingSuggestionExtras, context);
}
