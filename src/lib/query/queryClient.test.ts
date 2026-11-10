import { ApiError, API_ERROR_CODES, type ApiErrorCode } from '@/lib/api/errors';
import {
  MAX_QUERY_RETRIES,
  QUERY_STALE_TIME_MS,
  createQueryClient,
  shouldRetry,
} from '@/lib/query/queryClient';

const apiError = (code: ApiErrorCode, status: number | null) =>
  new ApiError(code, 'x', status, null);

describe('createQueryClient', () => {
  it('usa staleTime de 30 s', () => {
    const options = createQueryClient().getDefaultOptions();
    expect(QUERY_STALE_TIME_MS).toBe(30_000);
    expect(options.queries?.staleTime).toBe(30_000);
  });

  it('usa shouldRetry para las consultas y no reintenta mutaciones', () => {
    const options = createQueryClient().getDefaultOptions();
    expect(options.queries?.retry).toBe(shouldRetry);
    expect(options.mutations?.retry).toBe(false);
  });

  it('cada llamada devuelve un cliente nuevo', () => {
    expect(createQueryClient()).not.toBe(createQueryClient());
  });
});

describe('shouldRetry', () => {
  it('permite un único reintento', () => {
    expect(MAX_QUERY_RETRIES).toBe(1);
    expect(shouldRetry(0, apiError('network_error', null))).toBe(true);
    expect(shouldRetry(1, apiError('network_error', null))).toBe(false);
    expect(shouldRetry(2, apiError('network_error', null))).toBe(false);
  });

  it.each<[string, ApiError]>([
    ['network_error', apiError('network_error', null)],
    ['timeout', apiError('timeout', null)],
    ['500', apiError('internal_error', 500)],
    ['502', apiError('internal_error', 502)],
    ['503', apiError('service_unavailable', 503)],
  ])('reintenta una vez ante %s', (_name, error) => {
    expect(shouldRetry(0, error)).toBe(true);
  });

  it.each<[string, ApiError]>([
    ['400', apiError('validation_failed', 400)],
    ['401', apiError('unauthorized', 401)],
    ['403', apiError('forbidden', 403)],
    ['404', apiError('not_found', 404)],
    ['409', apiError('conflict', 409)],
    ['429', apiError('rate_limited', 429)],
    ['invalid_response (200)', apiError('invalid_response', 200)],
  ])('no reintenta ante %s', (_name, error) => {
    expect(shouldRetry(0, error)).toBe(false);
  });

  it('no reintenta errores que no son ApiError', () => {
    expect(shouldRetry(0, new Error('boom'))).toBe(false);
    expect(shouldRetry(0, null)).toBe(false);
    expect(shouldRetry(0, 'texto')).toBe(false);
  });

  it('ningún código 4xx del servidor se reintenta', () => {
    const statusByCode: Partial<Record<ApiErrorCode, number>> = {
      validation_failed: 400,
      unauthorized: 401,
      forbidden: 403,
      not_found: 404,
      conflict: 409,
      rate_limited: 429,
    };
    for (const code of API_ERROR_CODES) {
      const status = statusByCode[code];
      if (status !== undefined) expect(shouldRetry(0, apiError(code, status))).toBe(false);
    }
  });
});
