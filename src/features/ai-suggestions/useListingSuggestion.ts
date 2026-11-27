import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useSession } from '@/features/auth/useSession';
import { createListingSuggestion } from '@/features/ai-suggestions/api';
import type { ListingSuggestion, SuggestionStatus } from '@/features/ai-suggestions/types';
import { ApiError } from '@/lib/api/errors';
import { serverFeaturesQuery } from '@/lib/api/serverFeatures';

/**
 * `true` si `GET /meta` trae `features.aiSuggestions = true`; mientras carga o si falla, `false`.
 * Comparte la consulta de `/meta` con las recomendaciones (spec 021-T014, B-6).
 */
export function useAiSuggestionsEnabled(): boolean {
  const { status } = useSession();
  const query = useQuery({
    ...serverFeaturesQuery,
    select: (features) => features.aiSuggestions,
    enabled: status === 'signedIn',
  });
  return query.data === true;
}

export type ListingSuggestionState = {
  status: SuggestionStatus;
  suggestion: ListingSuggestion | null;
  /** Pide una sugerencia para esta foto; nunca se reintenta sola (cuesta cuota, plan P-01). */
  suggest: (imagePublicId: string) => void;
  /** Cancela la petición en curso y vuelve al inicio. */
  cancel: () => void;
  /** Descarta el resultado o el error y vuelve al inicio. */
  reset: () => void;
};

/**
 * `POST /ai/listing-suggestions` (RF-03, RF-04). Estados: `idle`, `loading`, `success`, `error` y
 * `limit` (429, tope diario). Sin reintentos automáticos y cancelable; al desmontar cancela.
 */
export function useListingSuggestion(): ListingSuggestionState {
  const controller = useRef<AbortController | null>(null);
  const mutation = useMutation({
    mutationFn: (imagePublicId: string) => {
      controller.current = new AbortController();
      return createListingSuggestion(imagePublicId, controller.current.signal);
    },
    retry: false,
  });
  const { mutate, reset: resetMutation } = mutation;

  const cancel = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    resetMutation();
  }, [resetMutation]);

  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [],
  );

  const suggest = useCallback((imagePublicId: string) => mutate(imagePublicId), [mutate]);

  let status: SuggestionStatus = 'idle';
  if (mutation.isPending) status = 'loading';
  else if (mutation.isSuccess) status = 'success';
  else if (mutation.isError) {
    status =
      mutation.error instanceof ApiError && mutation.error.code === 'rate_limited'
        ? 'limit'
        : 'error';
  }

  return {
    status,
    suggestion: mutation.data ?? null,
    suggest,
    cancel,
    reset: resetMutation,
  };
}
