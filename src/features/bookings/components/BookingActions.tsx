import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { AcceptSheet } from '@/features/bookings/components/AcceptSheet';
import { CancelSheet } from '@/features/bookings/components/CancelSheet';
import { RejectSheet } from '@/features/bookings/components/RejectSheet';
import { allowedActions } from '@/features/bookings/rules';
import type { Booking } from '@/features/bookings/types';
import { es } from '@/i18n/es-MX';
import { spacing } from '@/theme';

type Sheet = 'accept' | 'reject' | 'cancel' | null;

type BookingActionsProps = { booking: Booking };

/**
 * Acciones de una reserva según el rol y el estado (CA-05, CA-07): el propietario acepta o
 * rechaza una pendiente; quien solicitó cancela; una aceptada la cancela cualquiera de las dos
 * partes. Cada acción abre su hoja de confirmación. El punto de encuentro se edita desde su tarjeta.
 */
export function BookingActions({ booking }: BookingActionsProps) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const actions = allowedActions(booking.viewerRole, booking.status);
  const close = () => setSheet(null);
  const t = es.bookings.actions;

  if (!actions.some((action) => action !== 'meetingPoint')) return null;
  return (
    <View style={styles.row}>
      {actions.includes('accept') ? (
        <Button label={t.accept} onPress={() => setSheet('accept')} />
      ) : null}
      {actions.includes('reject') ? (
        <Button label={t.reject} variant="outline" onPress={() => setSheet('reject')} />
      ) : null}
      {actions.includes('cancel') ? (
        <Button label={t.cancel} variant="outline" onPress={() => setSheet('cancel')} />
      ) : null}
      <AcceptSheet bookingId={booking.id} visible={sheet === 'accept'} onClose={close} />
      <RejectSheet bookingId={booking.id} visible={sheet === 'reject'} onClose={close} />
      <CancelSheet
        bookingId={booking.id}
        status={booking.status}
        visible={sheet === 'cancel'}
        onClose={close}
      />
    </View>
  );
}

const styles = StyleSheet.create({ row: { gap: spacing.sm } });
