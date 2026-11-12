import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Checkbox } from '@/components/Checkbox';
import { FormNotice } from '@/components/FormNotice';
import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useSession } from '@/features/auth/useSession';
import { isQuoteChanged } from '@/features/bookings/api';
import { DateRangePicker, type BookingDates } from '@/features/bookings/components/DateRangePicker';
import { PaymentModePicker } from '@/features/bookings/components/PaymentModePicker';
import { QuoteSummary } from '@/features/bookings/components/QuoteSummary';
import { useCreateBooking, useQuote } from '@/features/bookings/hooks';
import { rangeProblem } from '@/features/bookings/rules';
import type { PaymentMode } from '@/features/bookings/types';
import { useItem } from '@/features/items';
import { useDebouncedValue } from '@/features/search';
import { es } from '@/i18n/es-MX';
import { ApiError, messageForCode } from '@/lib/api/errors';
import { todayYmd } from '@/lib/format/date';
import { routes } from '@/lib/routes';
import { spacing } from '@/theme';

const t = es.bookings.request;
const QUOTE_DEBOUNCE_MS = 300;

type RentMode = Exclude<PaymentMode, 'none'>;
type Notice = 'priceChanged' | 'datesTaken' | null;

type RequestScreenProps = { itemId: string };

/**
 * Solicitar un objeto (spec 007 §7.3, CA-01 a CA-03): fechas, forma de pago, resumen con el total
 * del servidor y «Entiendo». Se envía con `acceptedTotalCents`; si el precio cambió, se avisa, se
 * cotiza de nuevo y se pide aceptar otra vez.
 */
export function RequestScreen({ itemId }: RequestScreenProps) {
  const router = useRouter();
  const { user } = useSession();
  const item = useItem(itemId);
  const create = useCreateBooking();
  const today = todayYmd();

  const [dates, setDates] = useState<BookingDates>({ start: '', end: '' });
  const [mode, setMode] = useState<RentMode>('full_on_delivery');
  const [understood, setUnderstood] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const settled = useDebouncedValue(dates, QUOTE_DEBOUNCE_MS);
  const isStale = settled.start !== dates.start || settled.end !== dates.end;
  const validRange = rangeProblem(dates.start, dates.end, today) === null;

  const data = item.data;
  const isOwn = data !== undefined && user !== null && data.owner.id === user.id;
  const available = data !== undefined && data.status === 'active' && !isOwn;
  const paymentMode: PaymentMode = data?.modality === 'loan' ? 'none' : mode;

  const quote = useQuote(
    { itemId, startDate: settled.start, endDate: settled.end, paymentMode },
    available && validRange && !isStale,
  );

  const reset = () => {
    setUnderstood(false);
    setNotice(null);
    create.reset();
  };
  const changeDates = (next: BookingDates) => {
    reset();
    setDates(next);
  };
  const changeMode = (next: RentMode) => {
    reset();
    setMode(next);
  };

  const quoted = quote.data;
  const canSend = quoted !== undefined && !quote.isFetching && !isStale && validRange && understood;

  const send = () => {
    if (quoted === undefined) return;
    create.mutate(
      {
        itemId,
        startDate: dates.start,
        endDate: dates.end,
        paymentMode,
        acceptedTotalCents: quoted.totalCents,
      },
      {
        onError: (error) => {
          if (isQuoteChanged(error)) {
            setNotice('priceChanged');
            setUnderstood(false);
            void quote.refetch();
          } else if (error instanceof ApiError && error.status === 409) {
            setNotice('datesTaken');
          }
        },
      },
    );
  };

  const close = () => router.back();
  const failure = create.error;
  const genericFailure =
    failure !== null && notice === null && failure instanceof ApiError
      ? messageForCode(failure.code)
      : failure !== null && notice === null
        ? es.errors.unexpected
        : null;

  const renderBody = () => {
    if (item.isPending) return <LoadingState label={t.quoteLoading} />;
    if (data === undefined)
      return <ErrorState error={item.error} onRetry={() => void item.refetch()} />;
    if (isOwn) return <FormNotice message={t.ownItem} />;
    if (data.status !== 'active') return <FormNotice message={t.notActive} />;
    if (create.isSuccess) {
      return (
        <View style={styles.block}>
          <AppText variant="heading" accessibilityRole="header">
            {t.successTitle}
          </AppText>
          <AppText color="muted">{t.successBody}</AppText>
          <Button label={t.seeActivity} onPress={() => router.dismissTo(routes.activity)} />
          <Button label={t.keepBrowsing} variant="outline" onPress={close} />
        </View>
      );
    }
    return (
      <View style={styles.block}>
        <AppText variant="bodyStrong" numberOfLines={2}>
          {data.title}
        </AppText>
        <AppText variant="label">{t.when}</AppText>
        <DateRangePicker start={dates.start} end={dates.end} today={today} onChange={changeDates} />
        {data.modality === 'rent' ? (
          <>
            <AppText variant="label">{t.how}</AppText>
            <PaymentModePicker value={mode} onChange={changeMode} />
          </>
        ) : null}
        {notice === 'priceChanged' ? (
          <FormNotice message={`${t.priceChangedTitle}. ${t.priceChangedBody}`} />
        ) : null}
        {notice === 'datesTaken' ? (
          <FormNotice message={`${t.datesTakenTitle}. ${t.datesTakenBody}`} />
        ) : null}
        {genericFailure === null ? null : <FormNotice message={genericFailure} />}
        <AppText variant="label">{t.summary}</AppText>
        {!validRange ? (
          <AppText color="muted">{t.quoteNeedsDates}</AppText>
        ) : quote.isError ? (
          <ErrorState error={quote.error} onRetry={() => void quote.refetch()} />
        ) : quoted === undefined || isStale ? (
          <LoadingState label={t.quoteLoading} />
        ) : (
          <>
            <QuoteSummary
              days={quoted.days}
              pricePerDayCents={quoted.pricePerDayCents}
              totalCents={quoted.totalCents}
              paymentMode={quoted.paymentMode}
              payments={quoted.payments}
            />
            <AppText variant="label">{t.conditions}</AppText>
            <AppText variant="caption" color="muted">
              {quoted.policy.lateCancellationNotice}
            </AppText>
            <AppText variant="caption" color="muted">
              {quoted.policy.noShowNotice}
            </AppText>
            <AppText variant="caption" color="muted">
              {t.expiresIn}
            </AppText>
            <Checkbox
              checked={understood}
              onChange={setUnderstood}
              accessibilityLabel={t.understandA11y}
            >
              <AppText>{t.understand}</AppText>
            </Checkbox>
          </>
        )}
      </View>
    );
  };

  const showSend = available && !create.isSuccess;
  return (
    <BottomSheet
      visible
      onClose={close}
      title={t.title}
      footer={
        showSend ? (
          <Button label={t.send} onPress={send} disabled={!canSend} loading={create.isPending} />
        ) : undefined
      }
    >
      {renderBody()}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({ block: { gap: spacing.smd } });
