import { z } from 'zod';
import { ApiError } from '@/lib/api/errors';
import { REQUEST_TIMEOUT_MS, request } from '@/lib/api/client';
import { ConfigError, getConfig } from '@/lib/config';
import { es } from '@/i18n/es-MX';

jest.mock('@/lib/config', () => {
  const actual = jest.requireActual<typeof import('@/lib/config')>('@/lib/config');
  return {
    ...actual,
    getConfig: jest.fn(() => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' })),
  };
});

const schema = z.object({ name: z.string(), count: z.number() });
const okBody = { name: 'vaiven', count: 2 };

const response = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

const mockFetch = () => jest.spyOn(globalThis, 'fetch');

/** Un `fetch` que nunca responde y falla con AbortError cuando se aborta la señal. */
const hangingFetch = (_url: unknown, init?: RequestInit) =>
  new Promise<Response>((_resolve, reject) => {
    const abort = () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    if (init?.signal?.aborted) abort();
    init?.signal?.addEventListener('abort', abort);
  });

async function captureError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    return error as ApiError;
  }
  throw new Error('Se esperaba un ApiError');
}

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('request: éxito', () => {
  it('llama a la URL base + /api/v1 y devuelve el cuerpo validado', async () => {
    const fetchMock = mockFetch().mockResolvedValue(response(200, okBody));
    await expect(request('/meta', schema)).resolves.toEqual(okBody);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://api.test/api/v1/meta');
  });

  it('envía Accept y un X-Request-Id de 32 hexadecimales; sin Content-Type en GET', async () => {
    const fetchMock = mockFetch().mockResolvedValue(response(200, okBody));
    await request('/meta', schema);
    const init = fetchMock.mock.calls[0]?.[1];
    const headers = init?.headers as Record<string, string>;
    expect(headers.Accept).toBe('application/json');
    expect(headers['X-Request-Id']).toMatch(/^[0-9a-f]{32}$/);
    expect(headers['Content-Type']).toBeUndefined();
    expect(init?.signal).toBeDefined();
  });

  it('usa un requestId distinto en cada llamada', async () => {
    const fetchMock = mockFetch().mockResolvedValue(response(200, okBody));
    await request('/meta', schema);
    await request('/meta', schema);
    const ids = fetchMock.mock.calls.map(
      (call) => (call[1]?.headers as Record<string, string>)['X-Request-Id'],
    );
    expect(new Set(ids).size).toBe(2);
  });

  it('agrega Content-Type con cuerpo, respeta cabeceras propias y no deja pisar X-Request-Id', async () => {
    const fetchMock = mockFetch().mockResolvedValue(response(200, okBody));
    await request('/things', schema, {
      method: 'POST',
      body: JSON.stringify({ a: 1 }),
      headers: { Authorization: 'Bearer abc', 'X-Request-Id': 'intruso' },
    });
    const init = fetchMock.mock.calls[0]?.[1];
    const headers = init?.headers as Record<string, string>;
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{"a":1}');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers.Authorization).toBe('Bearer abc');
    expect(headers['X-Request-Id']).toMatch(/^[0-9a-f]{32}$/);
  });

  it('permite otro prefijo (vacío) para /healthz y /readyz, sin pasarlo a fetch', async () => {
    const fetchMock = mockFetch().mockResolvedValue(response(200, okBody));

    await request('/healthz', schema, { prefix: '', method: 'GET' });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('http://api.test/healthz');
    expect(init).not.toHaveProperty('prefix');
    expect(init).toMatchObject({ method: 'GET' });
  });

  it('acepta rutas sin barra inicial', async () => {
    const fetchMock = mockFetch().mockResolvedValue(response(200, okBody));
    await request('meta', schema);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://api.test/api/v1/meta');
  });

  it('limpia el temporizador al terminar', async () => {
    jest.useFakeTimers();
    mockFetch().mockResolvedValue(response(200, okBody));
    await request('/meta', schema);
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('request: errores del servidor', () => {
  it('400 con detalles produce validation_failed con sus detalles', async () => {
    const details = [{ field: 'email', issue: 'formato inválido' }];
    mockFetch().mockResolvedValue(
      response(400, {
        error: {
          code: 'validation_failed',
          message: 'Datos inválidos',
          details,
          requestId: 'srv-9',
        },
      }),
    );
    const error = await captureError(request('/things', schema));
    expect(error).toMatchObject({ code: 'validation_failed', status: 400, requestId: 'srv-9' });
    expect(error.message).toBe('Datos inválidos');
    expect(error.details).toEqual(details);
  });

  it('CA-05: 404 con envoltorio produce not_found con el requestId recibido', async () => {
    mockFetch().mockResolvedValue(
      response(404, { error: { code: 'not_found', message: 'No existe', requestId: '01JXYZ' } }),
    );
    const error = await captureError(request('/things/1', schema));
    expect(error).toMatchObject({ code: 'not_found', status: 404, requestId: '01JXYZ' });
  });

  it('500 con envoltorio produce internal_error', async () => {
    mockFetch().mockResolvedValue(
      response(500, { error: { code: 'internal_error', message: 'Falló', requestId: 'r1' } }),
    );
    const error = await captureError(request('/things', schema));
    expect(error).toMatchObject({ code: 'internal_error', status: 500 });
  });

  it('un error sin envoltorio deriva el código del estado y usa el requestId enviado', async () => {
    const fetchMock = mockFetch().mockResolvedValue(response(503, null));
    const error = await captureError(request('/things', schema));
    const sent = (fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>)['X-Request-Id'];
    expect(error).toMatchObject({ code: 'service_unavailable', status: 503, requestId: sent });
    expect(error.message).toBe(es.errors.service_unavailable);
  });

  it('un cuerpo de error que no es JSON se trata como sin envoltorio', async () => {
    mockFetch().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    } as unknown as Response);
    const error = await captureError(request('/things', schema));
    expect(error).toMatchObject({ code: 'internal_error', status: 502 });
  });
});

describe('request: respuesta inválida', () => {
  it('CA-06: un cuerpo que no cumple el esquema produce invalid_response', async () => {
    const fetchMock = mockFetch().mockResolvedValue(response(200, { name: 'vaiven' }));
    const error = await captureError(request('/meta', schema));
    const sent = (fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>)['X-Request-Id'];
    expect(error).toMatchObject({ code: 'invalid_response', status: 200, requestId: sent });
    expect(error.message).toBe(es.errors.invalid_response);
  });

  it('un 200 con cuerpo que no es JSON produce invalid_response', async () => {
    mockFetch().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected end of JSON input');
      },
    } as unknown as Response);
    const error = await captureError(request('/meta', schema));
    expect(error.code).toBe('invalid_response');
  });
});

describe('request: red y tiempo máximo', () => {
  it('un fallo de red produce network_error', async () => {
    mockFetch().mockRejectedValue(new TypeError('Network request failed'));
    const error = await captureError(request('/meta', schema));
    expect(error).toMatchObject({ code: 'network_error', status: null });
    expect(error.message).toBe(es.errors.network_error);
    expect(error.requestId).toMatch(/^[0-9a-f]{32}$/);
  });

  it('CA-07: una petición que excede 10 s produce timeout', async () => {
    jest.useFakeTimers();
    mockFetch().mockImplementation(hangingFetch);
    const pending = captureError(request('/meta', schema));
    await jest.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
    const error = await pending;
    expect(error).toMatchObject({ code: 'timeout', status: null });
    expect(error.message).toBe(es.errors.timeout);
    expect(error.requestId).toMatch(/^[0-9a-f]{32}$/);
  });

  it('una señal externa cancela la petición sin esperar al tiempo máximo (RF-08 de 006)', async () => {
    mockFetch().mockImplementation(hangingFetch);
    const controller = new AbortController();
    const pending = captureError(request('/meta', schema, { signal: controller.signal }));
    controller.abort();
    const error = await pending;
    expect(error).toMatchObject({ code: 'network_error', status: null });
  });

  it('una señal externa ya cancelada aborta de inmediato', async () => {
    mockFetch().mockImplementation(hangingFetch);
    const controller = new AbortController();
    controller.abort();
    const error = await captureError(request('/meta', schema, { signal: controller.signal }));
    expect(error.code).toBe('network_error');
  });

  it('con señal externa, el tiempo máximo sigue aplicando y el escucha se retira al terminar', async () => {
    jest.useFakeTimers();
    mockFetch().mockImplementation(hangingFetch);
    const controller = new AbortController();
    const remove = jest.spyOn(controller.signal, 'removeEventListener');
    const pending = captureError(request('/meta', schema, { signal: controller.signal }));
    await jest.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
    expect((await pending).code).toBe('timeout');
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  it('no vence antes de 10 s', async () => {
    jest.useFakeTimers();
    mockFetch().mockImplementation(hangingFetch);
    let settled = false;
    const pending = captureError(request('/meta', schema)).finally(() => {
      settled = true;
    });
    await jest.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS - 1);
    expect(settled).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    await pending;
    expect(settled).toBe(true);
  });

  it('si el tiempo vence mientras se lee el cuerpo, también es timeout', async () => {
    jest.useFakeTimers();
    // Como en un `fetch` real: abortar la señal hace fallar la lectura del cuerpo.
    mockFetch().mockImplementation(async (_url, init) => {
      return {
        ok: true,
        status: 200,
        json: () =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
          }),
      } as unknown as Response;
    });
    const pending = captureError(request('/meta', schema));
    await jest.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
    const error = await pending;
    expect(error).toMatchObject({ code: 'timeout', status: null });
  });
});

describe('request: configuración', () => {
  it('propaga ConfigError sin convertirlo en un error de red', async () => {
    const fetchMock = mockFetch();
    jest.mocked(getConfig).mockImplementationOnce(() => {
      throw new ConfigError(['Falta EXPO_PUBLIC_API_URL.']);
    });
    await expect(request('/meta', schema)).rejects.toBeInstanceOf(ConfigError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
