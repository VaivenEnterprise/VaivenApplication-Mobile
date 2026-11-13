import { useState } from 'react';
import { useImageUpload, type RemoteImageData } from '@/features/images';
import {
  EVIDENCE_NOTES_MAX,
  EVIDENCE_NOTES_MIN,
  EVIDENCE_PHOTOS_MAX,
  type EvidenceInput,
  type Stage,
} from '@/features/handover/types';

export type EvidenceProblem = 'uploading' | 'photosFailed' | 'photos' | 'notes';

/**
 * Estado del formulario de evidencia (RF-02). Parte de lo ya guardado —fotos y notas— para poder
 * editarlo hasta que la etapa se confirme; las fotos nuevas suben al elegirlas (spec 004) y el
 * cuerpo enviado lleva solo `publicId`. Las validaciones reflejan el contrato: de 1 a 5 fotos y
 * notas de 3 a 500 caracteres.
 */
export function useEvidenceForm(initial: Stage | null | undefined) {
  const uploader = useImageUpload('evidence');
  const [kept, setKept] = useState<RemoteImageData[]>(() => initial?.photos ?? []);
  const [notes, setNotes] = useState(initial?.conditionNotes ?? '');

  const total = kept.length + uploader.refs.length;
  const trimmed = notes.trim();

  const problem: EvidenceProblem | null = uploader.isUploading
    ? 'uploading'
    : uploader.hasErrors
      ? 'photosFailed'
      : total < 1
        ? 'photos'
        : trimmed.length < EVIDENCE_NOTES_MIN || trimmed.length > EVIDENCE_NOTES_MAX
          ? 'notes'
          : null;

  const input = (): EvidenceInput => ({
    conditionNotes: trimmed,
    photos: [...kept.map((photo) => ({ publicId: photo.publicId })), ...uploader.refs],
  });

  return {
    uploader,
    kept,
    removeKept: (publicId: string) =>
      setKept((current) => current.filter((photo) => photo.publicId !== publicId)),
    notes,
    setNotes,
    /** Cuántas fotos más caben (las guardadas y las nuevas comparten el tope). */
    room: Math.max(0, EVIDENCE_PHOTOS_MAX - kept.length),
    total,
    problem,
    input,
  };
}

export type EvidenceFormState = ReturnType<typeof useEvidenceForm>;
