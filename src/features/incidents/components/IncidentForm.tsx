import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { FormNotice } from '@/components/FormNotice';
import { TextField } from '@/components/TextField';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { BackButton } from '@/features/incidents/components/BackButton';
import { ReasonPicker } from '@/features/incidents/components/ReasonPicker';
import { incidentErrorMessage } from '@/features/incidents/errors';
import { useCreateIncident } from '@/features/incidents/hooks';
import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  EVIDENCE_MAX,
  incidentFormSchema,
} from '@/features/incidents/schemas';
import type { Incident, IncidentReason } from '@/features/incidents/types';
import { PhotoPicker, useImageUpload } from '@/features/images';
import { es } from '@/i18n/es-MX';
import { moderationFromError } from '@/lib/api/moderation';
import { colors, radius, spacing } from '@/theme';

const t = es.incidents.report;

type IncidentFormProps = {
  bookingId: string;
  onBack: () => void;
  /** Se llama con la incidencia creada (el éxito lleva al detalle). */
  onCreated: (incident: Incident) => void;
};

/**
 * Formulario para reportar una incidencia (spec 010 §7.3, RF-05, RF-06): motivo en mosaicos y, al
 * elegirlo, descripción (10–1000) y hasta 5 fotos de evidencia privada, con el aviso de qué hará
 * la plataforma. El botón fijo se habilita con motivo y descripción válida.
 */
export function IncidentForm({ bookingId, onBack, onCreated }: IncidentFormProps) {
  const mutation = useCreateIncident(bookingId);
  const uploader = useImageUpload('evidence');
  const [reason, setReason] = useState<IncidentReason | null>(null);
  const [description, setDescription] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Motivo del filtro de contenido sobre la descripción (spec 021-T018); se borra al editarla.
  const [rejected, setRejected] = useState<string | null>(null);

  const parsed = incidentFormSchema.safeParse({ reason, description });
  const descriptionLength = description.trim().length;
  const descriptionProblem =
    reason === null || descriptionLength === 0 || descriptionLength >= DESCRIPTION_MIN
      ? descriptionLength > DESCRIPTION_MAX
        ? es.incidents.validation.descriptionTooLong
        : undefined
      : es.incidents.validation.descriptionTooShort;
  const photoProblem = uploader.isUploading
    ? t.uploading
    : uploader.hasErrors
      ? t.photosFailed
      : null;

  const submit = async () => {
    setAttempted(true);
    if (!parsed.success || photoProblem !== null) return;
    setError(null);
    try {
      const incident = await mutation.mutateAsync({
        reason: parsed.data.reason,
        description: parsed.data.description,
        ...(uploader.refs.length > 0 ? { evidence: uploader.refs.slice(0, EVIDENCE_MAX) } : {}),
      });
      onCreated(incident);
    } catch (failure) {
      const moderation = moderationFromError(failure, ['description']);
      setRejected(moderation === null ? null : (moderation.reason ?? es.errors.moderationField));
      setError(moderation === null ? incidentErrorMessage(failure) : es.errors.moderationRejected);
    }
  };

  return (
    <Screen
      scroll={false}
      footer={
        <Button
          label={uploader.isUploading ? t.uploading : t.send}
          disabled={!parsed.success || uploader.isUploading}
          loading={mutation.isPending}
          onPress={() => void submit()}
        />
      }
    >
      <View style={styles.topBar}>
        <BackButton onPress={onBack} />
        <AppText variant="heading" accessibilityRole="header">
          {t.title}
        </AppText>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <AppText variant="label" color="muted">
            {t.reason}
          </AppText>
          <ReasonPicker value={reason} onChange={setReason} />
        </View>

        {reason === null ? null : (
          <>
            <View>
              <TextField
                label={t.description}
                value={description}
                onChangeText={(next) => {
                  setDescription(next);
                  setRejected(null);
                }}
                multiline
                hint={t.descriptionHint}
                error={descriptionProblem ?? rejected ?? undefined}
              />
              <AppText variant="caption" color="muted" style={styles.counter}>
                {`${descriptionLength}/${DESCRIPTION_MAX} ${t.counter}`}
              </AppText>
            </View>

            <View style={styles.section}>
              <AppText variant="label" color="muted">
                {t.evidence}
              </AppText>
              <PhotoPicker uploader={uploader} max={EVIDENCE_MAX} />
              <AppText variant="caption" color="muted">
                {t.evidenceHint}
              </AppText>
              {attempted && photoProblem !== null ? <FormNotice message={photoProblem} /> : null}
            </View>
          </>
        )}

        <Card variant="muted" style={styles.notice}>
          <AppIcon name="info" size="sm" color="primaryInk" />
          <AppText variant="caption" style={styles.noticeText}>
            {t.notice}
          </AppText>
        </Card>

        {error === null ? null : <FormNotice message={error} />}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd },
  content: { gap: spacing.md, paddingBottom: spacing.md },
  section: { gap: spacing.sm },
  counter: { textAlign: 'right' },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.smd,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  noticeText: { flex: 1 },
});
