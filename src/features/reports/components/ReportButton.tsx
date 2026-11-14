import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ReportSheet } from '@/features/reports/components/ReportSheet';
import type { ReportTargetType } from '@/features/reports/types';
import { es } from '@/i18n/es-MX';

type ReportButtonProps = {
  targetType: Exclude<ReportTargetType, 'moderation_decision'>;
  targetId: string;
  /** Texto del botón; por defecto el de cada tipo («Reportar este objeto», …). */
  label?: string;
};

const LABELS = {
  item: es.reports.button.item,
  message: es.reports.button.message,
  user: es.reports.button.user,
} as const;

/** Botón «Reportar» que abre la hoja del reporte para un objeto, mensaje o persona (RF-06). */
export function ReportButton({ targetType, targetId, label }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="link"
        icon="flag"
        label={label ?? LABELS[targetType]}
        onPress={() => setOpen(true)}
      />
      <ReportSheet
        visible={open}
        onClose={() => setOpen(false)}
        targetType={targetType}
        targetId={targetId}
      />
    </>
  );
}
