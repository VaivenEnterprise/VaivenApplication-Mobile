import { ApiError } from '@/lib/api/errors';
import { createReport } from '@/features/reports/api';
import { reportErrorMessage } from '@/features/reports/errors';
import { reportFormSchema } from '@/features/reports/schemas';
import { es } from '@/i18n/es-MX';
import { failure, installFakeApi } from '@/test/fakeApi';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));

const INPUT = { targetType: 'item', targetId: 'i1', reason: 'spam' } as const;

describe('createReport', () => {
  it('201: reporte nuevo', async () => {
    const api = installFakeApi({ 'POST /reports': () => ({ status: 201, body: { id: 'r1' } }) });
    await expect(createReport({ ...INPUT, details: 'Es spam' })).resolves.toEqual({
      id: 'r1',
      duplicate: false,
    });
    expect(api.calls[0]?.body).toEqual({ ...INPUT, details: 'Es spam' });
  });

  it('200: el servidor devolvió el reporte existente (CA-05)', async () => {
    installFakeApi({ 'POST /reports': () => ({ status: 200, body: { id: 'r1' } }) });
    await expect(createReport(INPUT)).resolves.toEqual({ id: 'r1', duplicate: true });
  });

  it('propaga el error del servidor', async () => {
    installFakeApi({ 'POST /reports': () => failure(409, 'conflict') });
    await expect(createReport(INPUT)).rejects.toBeInstanceOf(ApiError);
  });
});

describe('reportErrorMessage', () => {
  const e = es.reports.errors;
  it.each([
    ['conflict', 409, e.self],
    ['not_found', 404, e.notFound],
    ['validation_failed', 400, e.detailsTooLong],
    ['internal_error', 500, e.generic],
    ['network_error', null, es.errors.network_error],
  ])('%s → texto propio', (code, status, expected) => {
    expect(reportErrorMessage(new ApiError(code as never, 'x', status, null))).toBe(expected);
  });

  it('un error desconocido usa el genérico', () => {
    expect(reportErrorMessage(new Error('x'))).toBe(e.generic);
  });
});

describe('reportFormSchema', () => {
  it('pide motivo y acepta detalles vacíos', () => {
    expect(reportFormSchema.safeParse({ reason: null, details: '' }).success).toBe(false);
    expect(reportFormSchema.safeParse({ reason: 'spam', details: '' }).success).toBe(true);
  });

  it('rechaza detalles de más de 500 caracteres', () => {
    expect(reportFormSchema.safeParse({ reason: 'spam', details: 'a'.repeat(501) }).success).toBe(
      false,
    );
    expect(reportFormSchema.safeParse({ reason: 'spam', details: 'a'.repeat(500) }).success).toBe(
      true,
    );
  });
});
