import { useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { IconBadge } from '@/components/ui/IconBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { useBooking } from '@/features/bookings';
import { ManualCodeEntry } from '@/features/handover/components/ManualCodeEntry';
import { QrScanner } from '@/features/handover/components/QrScanner';
import { scanFailureOf, type ScanFailure } from '@/features/handover/errors';
import { useConfirmQr } from '@/features/handover/hooks';
import { parseManualCode, parseQr, type QrFailure } from '@/features/handover/qr';
import { stageRoles } from '@/features/handover/roles';
import { isConfirmed } from '@/features/handover/stageState';
import type { StageName } from '@/features/handover/types';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.handover.scan;

type Result = { kind: 'success' } | { kind: 'error'; reason: QrFailure | ScanFailure };

type ScanScreenProps = { bookingId: string; stage: StageName | null };

type ScannerProps = { bookingId: string; stage: StageName };

function Scanner({ bookingId, stage }: ScannerProps) {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const confirm = useConfirmQr(bookingId, stage);
  const [result, setResult] = useState<Result | null>(null);
  const [manual, setManual] = useState(false);
  const asked = useRef(false);

  // El permiso se pide al usar la cámara, no antes (Art. VI): una sola vez al abrir la pantalla.
  useEffect(() => {
    if (permission === null || permission.granted || !permission.canAskAgain) return;
    if (asked.current) return;
    asked.current = true;
    void requestPermission();
  }, [permission, requestPermission]);

  /**
   * Valida el texto, confirma con el servidor y deja el resultado en pantalla. Devuelve `false`
   * solo si el código escrito a mano no tiene forma de código (la hoja lo marca como inválido).
   */
  const submit = async (text: string, typed: boolean): Promise<boolean> => {
    const expected = { bookingId, stage };
    const parsed = typed ? parseManualCode(text, expected) : parseQr(text, expected);
    if (!parsed.ok) {
      // Un texto escrito que no parece código se corrige en la misma hoja; el resto se informa.
      const unreadable = parsed.error === 'malformed' || parsed.error === 'not_vaiven';
      if (typed && unreadable) return false;
      setManual(false);
      setResult({ kind: 'error', reason: parsed.error });
      return true;
    }
    try {
      await confirm.mutateAsync(parsed.token);
      setManual(false);
      setResult({ kind: 'success' });
    } catch (failure) {
      setManual(false);
      setResult({ kind: 'error', reason: scanFailureOf(failure) });
    }
    return true;
  };

  const goBooking = () => router.replace(routes.booking(bookingId));
  const manualSheet = (
    <ManualCodeEntry
      visible={manual}
      busy={confirm.isPending}
      onClose={() => setManual(false)}
      onSubmit={(code) => submit(code, true)}
    />
  );

  if (permission === null) {
    return (
      <Screen scroll={false}>
        <LoadingState label={es.common.loading} />
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen scroll={false}>
        <EmptyState
          icon="camera"
          title={t.cameraTitle}
          description={t.cameraDescription}
          actionLabel={permission.canAskAgain ? t.allow : t.openSettings}
          onAction={() =>
            permission.canAskAgain ? void requestPermission() : void Linking.openSettings()
          }
        />
        <Button label={t.typeCode} variant="link" onPress={() => setManual(true)} />
        <Button label={t.close} variant="link" onPress={() => router.back()} />
        {manualSheet}
        <ResultSheet
          result={result}
          stage={stage}
          onRetry={() => setResult(null)}
          onDone={goBooking}
        />
      </Screen>
    );
  }

  return (
    <View style={styles.camera}>
      <QrScanner
        paused={result !== null || confirm.isPending}
        onScan={(text) => void submit(text, false)}
      />
      <SafeAreaView style={styles.controls} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.close}
          onPress={() => router.back()}
          style={styles.close}
        >
          <AppIcon name="close" color="onPrimary" />
        </Pressable>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t.typeCode}
          onPress={() => setManual(true)}
          style={styles.typeCode}
        >
          <AppText variant="bodyStrong" color="onPrimary" style={styles.underline}>
            {t.typeCode}
          </AppText>
        </Pressable>
      </SafeAreaView>
      {manualSheet}
      <ResultSheet
        result={result}
        stage={stage}
        onRetry={() => setResult(null)}
        onDone={goBooking}
      />
    </View>
  );
}

type ResultSheetProps = {
  result: Result | null;
  stage: StageName;
  onRetry: () => void;
  onDone: () => void;
};

/** Resultado del escaneo en una hoja: éxito con «Listo» o error de una línea con reintento. */
function ResultSheet({ result, stage, onRetry, onDone }: ResultSheetProps) {
  return (
    <BottomSheet visible={result !== null} onClose={onRetry}>
      {result?.kind === 'success' ? (
        <View style={styles.result} accessibilityLiveRegion="polite">
          <IconBadge icon="success" tone="secondary" size="lg" />
          <AppText variant="heading" accessibilityRole="header">
            {stage === 'delivery' ? t.doneTitleDelivery : t.doneTitleReturn}
          </AppText>
          <Button label={t.done} onPress={onDone} />
        </View>
      ) : result?.kind === 'error' ? (
        <View style={styles.result} accessibilityLiveRegion="assertive">
          <IconBadge icon="danger" tone="danger" size="lg" />
          <AppText variant="bodyStrong" style={styles.centered}>
            {t.errors[result.reason]}
          </AppText>
          <Button label={t.retry} onPress={onRetry} />
        </View>
      ) : null}
    </BottomSheet>
  );
}

/**
 * Escanear el QR (spec 009 §7.4, RF-05, RF-06). Solo ve el escáner quien debe escanear en esta
 * etapa; si no hay permiso de cámara puede escribir el código (CA-07).
 */
export function ScanScreen({ bookingId, stage }: ScanScreenProps) {
  const router = useRouter();
  const query = useBooking(bookingId);
  const booking = query.data;
  const toBooking = () => router.replace(routes.booking(bookingId));

  if (stage === null) {
    return (
      <Screen scroll={false}>
        <EmptyState
          icon="warning"
          title={es.handover.evidence.invalidStageTitle}
          description={es.handover.evidence.invalidStageDescription}
          actionLabel={es.handover.evidence.notAllowedAction}
          onAction={toBooking}
        />
      </Screen>
    );
  }
  if (booking === undefined) {
    return (
      <Screen scroll={false}>
        {query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : (
          <LoadingState label={es.common.loading} />
        )}
      </Screen>
    );
  }
  if (!stageRoles(stage, booking.viewerRole).canScan) {
    return (
      <Screen scroll={false}>
        <EmptyState
          icon="lock"
          title={es.handover.evidence.notAllowedTitle}
          description={t.notYours}
          actionLabel={es.handover.evidence.notAllowedAction}
          onAction={toBooking}
        />
      </Screen>
    );
  }
  if (isConfirmed(booking.status, stage, booking[stage])) {
    return (
      <Screen scroll={false}>
        <EmptyState
          icon="success"
          title={stage === 'delivery' ? t.doneTitleDelivery : t.doneTitleReturn}
          actionLabel={t.done}
          onAction={toBooking}
        />
      </Screen>
    );
  }
  return <Scanner bookingId={bookingId} stage={stage} />;
}

const styles = StyleSheet.create({
  camera: { flex: 1, backgroundColor: colors.ink },
  controls: { ...StyleSheet.absoluteFill },
  close: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.gutter,
    width: sizes.touch.minSize,
    height: sizes.touch.minSize,
    borderRadius: radius.pill,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeCode: {
    position: 'absolute',
    bottom: spacing.lg,
    alignSelf: 'center',
    minHeight: sizes.touch.minSize,
    justifyContent: 'center',
  },
  underline: { textDecorationLine: 'underline' },
  result: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  centered: { textAlign: 'center' },
});
