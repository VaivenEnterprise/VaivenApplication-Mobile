import { request } from '@/lib/api/client';
import { reportCreatedSchema, type ReportInput, type ReportResult } from '@/features/reports/types';

/**
 * `POST /reports`: crea un reporte para revisión humana (RF-06). Repetir el mismo reporte no crea
 * otro: el servidor responde 200 con el existente (CA-05), que aquí se marca como `duplicate`.
 */
export async function createReport(input: ReportInput): Promise<ReportResult> {
  let status = 201;
  const created = await request('/reports', reportCreatedSchema, {
    method: 'POST',
    body: JSON.stringify(input),
    onResponse: (code) => {
      status = code;
    },
  });
  return { id: created.id, duplicate: status === 200 };
}
