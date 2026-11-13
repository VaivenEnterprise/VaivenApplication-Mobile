import { StyleSheet, View } from 'react-native';
import { FormNotice } from '@/components/FormNotice';
import { TextField } from '@/components/TextField';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { EvidenceGallery } from '@/features/handover/components/EvidenceGallery';
import { EVIDENCE_NOTES_MAX, EVIDENCE_PHOTOS_MAX } from '@/features/handover/types';
import type { EvidenceFormState, EvidenceProblem } from '@/features/handover/useEvidenceForm';
import { PhotoPicker } from '@/features/images';
import { es } from '@/i18n/es-MX';
import { spacing } from '@/theme';

const t = es.handover.evidence;

const PROBLEM_TEXT: Record<EvidenceProblem, string> = {
  uploading: t.uploading,
  photosFailed: t.photosFailed,
  photos: t.photoHint,
  notes: t.notesHint,
};

type EvidenceFormProps = {
  form: EvidenceFormState;
  /** Muestra el problema de validación (tras intentar continuar). */
  showProblem: boolean;
  /** Error del servidor al guardar. */
  error: string | null;
};

/** Fotos (hasta 5) y notas del estado del objeto (spec 009 §7.2, RF-02). */
export function EvidenceForm({ form, showProblem, error }: EvidenceFormProps) {
  const { uploader, kept, removeKept, notes, setNotes, room, total, problem } = form;
  const photoProblem = showProblem && (problem === 'photos' || problem === 'photosFailed');
  const notesProblem = showProblem && problem === 'notes';

  return (
    <View style={styles.root}>
      <Card style={styles.section}>
        <View style={styles.header}>
          <AppText variant="subheading" accessibilityRole="header">
            {t.photos}
          </AppText>
          <AppText variant="caption" color="muted">
            {`${total}/${EVIDENCE_PHOTOS_MAX} ${t.photosCount}`}
          </AppText>
        </View>
        <EvidenceGallery photos={kept} onRemove={removeKept} />
        {room > 0 ? <PhotoPicker uploader={uploader} max={room} /> : null}
        {photoProblem && problem !== null ? (
          <FormNotice message={PROBLEM_TEXT[problem]} />
        ) : (
          <AppText variant="caption" color="muted">
            {t.photoHint}
          </AppText>
        )}
      </Card>

      <Card style={styles.section}>
        <TextField
          label={t.notes}
          value={notes}
          onChangeText={setNotes}
          multiline
          maxLength={EVIDENCE_NOTES_MAX}
          error={notesProblem ? t.notesHint : undefined}
          hint={notesProblem ? undefined : t.notesHint}
        />
        <AppText variant="caption" color="muted" style={styles.counter}>
          {`${notes.trim().length}/${EVIDENCE_NOTES_MAX} ${t.notesCounter}`}
        </AppText>
      </Card>

      {error === null ? null : <FormNotice message={error} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  section: { gap: spacing.smd },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counter: { textAlign: 'right' },
});
