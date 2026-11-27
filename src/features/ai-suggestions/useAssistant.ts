import { useMutation } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { deleteAssistantConversation, sendAssistantMessage } from '@/features/ai-suggestions/api';
import type { AssistantReply } from '@/features/ai-suggestions/types';
import { es } from '@/i18n/es-MX';
import { ApiError, messageForCode } from '@/lib/api/errors';
import { moderationFromError } from '@/lib/api/moderation';

const t = es.aiSuggestions.assistant;

/** Un turno ya respondido: lo que se preguntó y lo que contestó el asistente. */
export type AssistantTurn = { readonly question: string; readonly reply: AssistantReply };

/** Por qué no se pudo responder: `field` va junto al campo; `notice`, como aviso general. */
export type AssistantFailure = { field: string | null; notice: string | null };

/**
 * Traduce un fallo de `POST /ai/assistant/messages` (contrato: 400, 404, 429, 503). El rechazo de
 * moderación y los errores de validación del mensaje van en el campo; el resto, como aviso.
 */
export function assistantFailure(error: unknown): AssistantFailure {
  const moderation = moderationFromError(error, ['message']);
  if (moderation !== null) {
    return {
      field: moderation.reason ?? es.errors.moderationField,
      notice: es.errors.moderationRejected,
    };
  }
  if (!(error instanceof ApiError)) return { field: null, notice: t.error };
  switch (error.code) {
    case 'validation_failed': {
      const detail = error.details.find((d) => d.field === 'message');
      return detail === undefined
        ? { field: null, notice: messageForCode(error.code) }
        : { field: detail.issue, notice: null };
    }
    case 'not_found':
      return { field: null, notice: t.expired };
    case 'rate_limited':
      return { field: null, notice: t.limit };
    case 'service_unavailable':
      return { field: null, notice: t.unavailable };
    case 'network_error':
    case 'timeout':
    case 'step_up_required':
      return { field: null, notice: messageForCode(error.code) };
    default:
      return { field: null, notice: t.error };
  }
}

type SendInput = { message: string; location: { lat: number; lng: number } | null };

/**
 * Conversación con el asistente (spec 021-T032, RF-30). Guarda solo en memoria el id de la
 * conversación (dura 24 h en el servidor) y los turnos de esta visita. «Nueva conversación» la
 * borra en el servidor (`DELETE`) sin esperar: si falla, caduca sola.
 */
export function useAssistant() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [turns, setTurns] = useState<readonly AssistantTurn[]>([]);

  const mutation = useMutation({
    mutationFn: ({ message, location }: SendInput) =>
      sendAssistantMessage({
        message,
        ...(conversationId === null ? {} : { conversationId }),
        ...(location === null ? {} : { location }),
      }),
    onSuccess: (response, { message }) => {
      setConversationId(response.conversationId);
      setTurns((current) => [...current, { question: message, reply: response.reply }]);
    },
    onError: (error) => {
      // La conversación caducó o no es propia: la siguiente pregunta abre una nueva.
      if (error instanceof ApiError && error.code === 'not_found') setConversationId(null);
    },
  });

  const { reset: resetMutation } = mutation;
  const restart = useCallback(() => {
    if (conversationId !== null) void deleteAssistantConversation(conversationId).catch(() => {});
    setConversationId(null);
    setTurns([]);
    resetMutation();
  }, [conversationId, resetMutation]);

  return {
    turns,
    conversationId,
    send: mutation.mutateAsync,
    sending: mutation.isPending,
    restart,
  };
}
