import type { Href } from 'expo-router';
import { routes } from '@/lib/routes';

// Traductor puro de `data` → ruta (plan P-01, RF-05). Lo usan el centro de avisos y el toque de
// una push, así que acepta `unknown`: `data` de una push es un objeto sin forma garantizada.

function text(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/**
 * Destino de un aviso. Si `data` trae varios ids gana el más específico: incidencia, chat, reserva
 * y, al final, objeto. Sin ningún id válido devuelve `null` (quien llama abre el centro de avisos).
 */
export function hrefForData(data: unknown): Href | null {
  if (typeof data !== 'object' || data === null) return null;
  const fields = data as Record<string, unknown>;
  const incidentId = text(fields, 'incidentId');
  if (incidentId !== null) return routes.incident(incidentId);
  const conversationId = text(fields, 'conversationId');
  if (conversationId !== null) return routes.chat(conversationId);
  const bookingId = text(fields, 'bookingId');
  if (bookingId !== null) return routes.booking(bookingId);
  const itemId = text(fields, 'itemId');
  if (itemId !== null) return routes.item(itemId);
  return null;
}

/** Destino al tocar un aviso o una push: el de `data` o, si no hay, el centro de avisos. */
export function hrefOrCenter(data: unknown): Href {
  return hrefForData(data) ?? routes.notifications;
}
