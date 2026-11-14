import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FormNotice } from '@/components/FormNotice';
import { TextField } from '@/components/TextField';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Banner } from '@/components/ui/Banner';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { reportErrorMessage } from '@/features/reports/errors';
import { useCreateReport } from '@/features/reports/hooks';
import { reportFormSchema } from '@/features/reports/schemas';
import {
  REPORT_DETAILS_MAX,
  REPORT_REASONS,
  REPORT_TARGET_ID_MAX,
  type ReportReason,
  type ReportResult,
  type ReportTargetType,
} from '@/features/reports/types';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.reports.sheet;

type ReportSheetProps = {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  /** Título distinto de «Reportar» (p. ej. al reportar una decisión de moderación). */
  title?: string;
  /** Texto de apoyo del campo de detalles. */
  detailsHint?: string;
  /** Motivo fijo: oculta la lista de motivos (la decisión de moderación va como «Otro»). */
  fixedReason?: ReportReason;
  /** Se llama cuando el servidor acepta el reporte (nuevo o repetido). */
  onSent?: (result: ReportResult) => void;
};

/**
 * Hoja para reportar contenido (spec 011 §7.4, RF-06): cuatro motivos de selección única, detalles
 * opcionales de hasta 500 y «Enviar». Éxito: check y «Gracias, lo revisaremos»; si ya se había
 * reportado, aviso «Ya lo reportaste» (CA-05).
 */
export function ReportSheet({
  visible,
  onClose,
  targetType,
  targetId,
  title = t.title,
  detailsHint = t.detailsHint,
  fixedReason,
  onSent,
}: ReportSheetProps) {
  const mutation = useCreateReport();
  const [reason, setReason] = useState<ReportReason | null>(fixedReason ?? null);
  const [details, setDetails] = useState('');
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const effectiveReason = fixedReason ?? reason;
  const parsed = reportFormSchema.safeParse({ reason: effectiveReason, details });
  const detailsProblem =
    details.trim().length > REPORT_DETAILS_MAX ? es.reports.errors.detailsTooLong : undefined;

  const close = () => {
    onClose();
    // Se limpia al cerrar para que la siguiente apertura empiece de cero.
    setReason(fixedReason ?? null);
    setDetails('');
    setResult(null);
    setError(null);
  };

  const submit = async () => {
    if (!parsed.success) return;
    setError(null);
    const trimmed = parsed.data.details;
    try {
      const sent = await mutation.mutateAsync({
        targetType,
        targetId: targetId.slice(0, REPORT_TARGET_ID_MAX),
        reason: parsed.data.reason,
        ...(trimmed === undefined || trimmed === '' ? {} : { details: trimmed }),
      });
      setResult(sent);
      onSent?.(sent);
    } catch (failure) {
      setError(reportErrorMessage(failure));
    }
  };

  const footer =
    result === null ? (
      <Button
        label={mutation.isPending ? t.submitting : t.submit}
        disabled={!parsed.success}
        loading={mutation.isPending}
        onPress={() => void submit()}
      />
    ) : (
      <Button label={t.done} onPress={close} />
    );

  return (
    <BottomSheet visible={visible} onClose={close} title={title} footer={footer}>
      {result === null ? (
        <View style={styles.form}>
          {fixedReason === undefined ? (
            <View accessibilityRole="radiogroup" style={styles.reasons}>
              <AppText variant="label" color="muted">
                {t.reasonsLabel}
              </AppText>
              {REPORT_REASONS.map((option) => {
                const selected = reason === option;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="radio"
                    accessibilityLabel={es.reports.reasons[option]}
                    accessibilityState={{ selected }}
                    onPress={() => setReason(option)}
                    style={[styles.row, selected ? styles.rowOn : styles.rowOff]}
                  >
                    <AppText variant="body" style={styles.rowText}>
                      {es.reports.reasons[option]}
                    </AppText>
                    {selected ? <AppIcon name="check" size="sm" color="primaryInk" /> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <View>
            <TextField
              label={t.detailsLabel}
              value={details}
              onChangeText={setDetails}
              multiline
              hint={detailsHint}
              error={detailsProblem}
            />
            <AppText variant="caption" color="muted" style={styles.counter}>
              {`${details.trim().length}/${REPORT_DETAILS_MAX} ${t.counter}`}
            </AppText>
          </View>
          {error === null ? null : <FormNotice message={error} />}
        </View>
      ) : result.duplicate ? (
        <Banner variant="info" message={t.duplicate} />
      ) : (
        <View accessible accessibilityLiveRegion="polite" style={styles.success}>
          <AppIcon name="success" size="lg" color="primaryInk" />
          <AppText variant="bodyStrong">{t.success}</AppText>
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  reasons: { gap: spacing.sm },
  row: {
    minHeight: sizes.touch.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: sizes.field.border,
  },
  rowOff: { backgroundColor: colors.surface, borderColor: colors.fieldBorder },
  rowOn: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  rowText: { flex: 1 },
  counter: { textAlign: 'right' },
  success: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
});
