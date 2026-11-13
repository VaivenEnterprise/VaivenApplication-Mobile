import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { bookingsKeys, type Booking } from '@/features/bookings';
import {
  confirmPayment,
  confirmStage,
  fetchStage,
  issueQr,
  putEvidence,
  reportPayment,
} from '@/features/handover/api';
import { handoverKeys } from '@/features/handover/keys';
import type { EvidenceInput, StageName } from '@/features/handover/types';

/** La app consulta salvo que esté en segundo plano o inactiva; un estado desconocido cuenta como activo. */
function isForeground(state: unknown): boolean {
  return state !== 'background' && state !== 'inactive';
}

/** `true` mientras la app está en primer plano (se vuelve a evaluar al cambiar de estado). */
function useForeground(): boolean {
  const [active, setActive] = useState(isForeground(AppState.currentState));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setActive(isForeground(state));
    });
    return () => subscription.remove();
  }, []);
  return active;
}

/** Tiempo que una mutación con token sobrevive sin pantalla que la observe (plan P-05). */
const TOKEN_GC_MS = 1000;

type StageOptions = {
  /** Con un valor, vuelve a consultar cada tantos milisegundos (solo en primer plano, RF-12). */
  pollMs?: number;
};

/**
 * Etapa de entrega o devolución con sus fotos firmadas. La evidencia no se guarda en disco. Con
 * `pollMs` consulta de nuevo cada ese tiempo mientras la pantalla esté montada y la app en primer
 * plano; nunca encima de una consulta que sigue en camino.
 */
export function useStage(bookingId: string, stage: StageName, { pollMs }: StageOptions = {}) {
  const client = useQueryClient();
  const foreground = useForeground();
  useEffect(() => {
    if (pollMs === undefined || !foreground) return undefined;
    const timer = setInterval(() => {
      void client.refetchQueries(
        { queryKey: handoverKeys.stage(bookingId, stage), exact: true },
        { cancelRefetch: false },
      );
    }, pollMs);
    return () => clearInterval(timer);
  }, [client, bookingId, stage, pollMs, foreground]);
  return useQuery({
    queryKey: handoverKeys.stage(bookingId, stage),
    queryFn: ({ signal }) => fetchStage(bookingId, stage, signal),
  });
}

/** Deja la reserva devuelta como verdad del detalle y marca para recargar lo que dependa de ella (RF-10). */
function commitBooking(client: QueryClient, booking: Booking): void {
  client.setQueryData(bookingsKeys.detail(booking.id), booking);
  void client.invalidateQueries({ queryKey: bookingsKeys.mine() });
  void client.invalidateQueries({ queryKey: handoverKeys.all });
}

/** Guarda la evidencia; el QR anterior deja de servir, así que se vuelve a leer la reserva. */
export function useSaveEvidence(bookingId: string, stage: StageName) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: EvidenceInput) => putEvidence(bookingId, stage, input),
    onSuccess: (saved) => {
      client.setQueryData(handoverKeys.stage(bookingId, stage), saved);
      void client.invalidateQueries({ queryKey: bookingsKeys.detail(bookingId) });
    },
  });
}

/**
 * Genera el QR. Un `gcTime` corto evita que el token siga en el caché de mutaciones al salir de
 * la pantalla (con `0` TanStack Query descarta la mutación antes de entregar el resultado): vive solo en la memoria del componente que lo muestra (plan P-05, RF-11).
 */
export function useIssueQr(bookingId: string, stage: StageName) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => issueQr(bookingId, stage),
    gcTime: TOKEN_GC_MS,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: handoverKeys.stage(bookingId, stage) });
    },
  });
}

/** Confirma la etapa con el token leído; la reserva cambia de estado sin recargar (CA-01, CA-04). */
export function useConfirmQr(bookingId: string, stage: StageName) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => confirmStage(bookingId, stage, token),
    gcTime: TOKEN_GC_MS,
    onSuccess: (booking) => commitBooking(client, booking),
  });
}

/** El solicitante informa que ya pagó la etapa (CA-06). */
export function useReportPayment(bookingId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (stage: StageName) => reportPayment(bookingId, stage),
    onSuccess: (booking) => commitBooking(client, booking),
  });
}

/** El propietario confirma que recibió el pago reportado (CA-06). */
export function useConfirmPayment(bookingId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (stage: StageName) => confirmPayment(bookingId, stage),
    onSuccess: (booking) => commitBooking(client, booking),
  });
}
