import { CameraView } from 'expo-camera';
import { useEffect, useRef } from 'react';
import { StyleSheet, Vibration, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.handover.scan;
/** Vibración corta al leer un código (spec 009 §7.4). */
const READ_VIBRATION_MS = 40;

type QrScannerProps = {
  /** Recibe el texto del primer código leído; no vuelve a llamarse hasta que `paused` baje. */
  onScan: (text: string) => void;
  /** Mientras hay un resultado en pantalla la cámara no procesa códigos. */
  paused: boolean;
};

/**
 * Cámara con ventana de 260 pt. Procesa un solo código (*latch*, plan P-03): las lecturas
 * repetidas del mismo QR se ignoran y el escáner se reactiva cuando `paused` pasa a `false`.
 * El texto leído no se guarda ni se escribe en logs (RF-11).
 */
export function QrScanner({ onScan, paused }: QrScannerProps) {
  const latch = useRef(false);

  useEffect(() => {
    if (!paused) latch.current = false;
  }, [paused]);

  const handle = ({ data }: { data: string }) => {
    if (latch.current) return;
    latch.current = true;
    Vibration.vibrate(READ_VIBRATION_MS);
    onScan(data);
  };

  return (
    <View style={styles.root} accessibilityLabel={t.frameA11y}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={paused ? undefined : handle}
      />
      <View style={styles.veil} pointerEvents="none">
        <View style={styles.window}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <AppText variant="body" color="onPrimary" style={styles.hint}>
          {t.hint}
        </AppText>
      </View>
    </View>
  );
}

const { size, corner, stroke } = sizes.scanFrame;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  veil: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  window: { width: size, height: size },
  hint: { textAlign: 'center', paddingHorizontal: spacing.gutter },
  corner: {
    position: 'absolute',
    width: corner,
    height: corner,
    borderColor: colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: stroke,
    borderLeftWidth: stroke,
    borderTopLeftRadius: radius.md,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: stroke,
    borderRightWidth: stroke,
    borderTopRightRadius: radius.md,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: stroke,
    borderLeftWidth: stroke,
    borderBottomLeftRadius: radius.md,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: stroke,
    borderRightWidth: stroke,
    borderBottomRightRadius: radius.md,
  },
});
