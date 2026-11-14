import { useMutation } from '@tanstack/react-query';
import { createReport } from '@/features/reports/api';
import type { ReportInput } from '@/features/reports/types';

/** Reporta un objeto, mensaje, persona o decisión de moderación (RF-06, RF-07). */
export function useCreateReport() {
  return useMutation({ mutationFn: (input: ReportInput) => createReport(input) });
}
