import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AssistantEntry } from '@/features/ai-suggestions/components/AssistantEntry';
import { AssistantScreen } from '@/features/ai-suggestions/screens/AssistantScreen';
import { assistantFailure } from '@/features/ai-suggestions/useAssistant';
import { es } from '@/i18n/es-MX';
import { ApiError } from '@/lib/api/errors';
import { routes } from '@/lib/routes';
import { failure, installFakeApi, ok } from '@/test/fakeApi';

// Spec 021-T032 (RF-30): asistente de proyectos con la API simulada; la respuesta simulada se
// valida contra ../vaiven-backend/api/openapi.yaml (solo lectura) si está junto al repositorio.
const lib =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../../../scripts/contract-lib.cjs') as typeof import('../../../scripts/contract-lib.cjs');

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn() }),
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ status: 'signedIn', user: { id: 'u1', displayName: 'Ana' } }),
}));
type MockLocation = {
  availability: 'unknown' | 'available' | 'unavailable';
  coords: { lat: number; lng: number } | null;
  locate: jest.Mock;
};
let mockLocation: MockLocation;
jest.mock('@/features/search', () => ({ useLocation: () => mockLocation }));
jest.setTimeout(30_000);

const t = es.aiSuggestions.assistant;
const POST = 'POST /ai/assistant/messages';
const CONVERSATION = '6735a0c1b2d3e4f5a6b7c8d9';
const ITEM = '6730f1c2a9b3e4d5f6a7b8c9';
const HERE = { lat: 25.67, lng: -100.31 };

// Forma completa de `AssistantMessageResponse` del contrato (con los campos que la app ignora).
const reply = () => ({
  conversationId: CONVERSATION,
  reply: {
    summary: 'Para pintar necesitas una escalera y una lona.',
    needs: [
      {
        name: 'Escalera de tijera',
        category: 'hogar',
        optional: false,
        matches: [
          {
            id: ITEM,
            title: 'Escalera de aluminio 5 peldaños',
            category: 'hogar',
            modality: 'rent',
            pricePerDayCents: 5000,
            zone: { municipality: 'Monterrey', neighborhood: 'Centro' },
            approxLocation: { lat: 25.67, lng: -100.31 },
            distanceKm: 1.2,
            thumbUrl: null,
            photoCount: 2,
            owner: {
              id: '6730f0aa9b3e4d5f6a7b8c90',
              displayName: 'Beto',
              ratingAverage: 4.8,
              ratingCount: 12,
            },
            createdAt: '2026-11-10T18:00:00Z',
          },
        ],
      },
      { name: 'Lona protectora', category: 'hogar', optional: true, matches: [] },
    ],
    steps: ['Cubre el piso con la lona.', 'Aplica la primera mano.'],
    safetyNotes: ['No te pares en el último peldaño.'],
  },
});

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

async function ask(text: string) {
  await fireEvent.changeText(screen.getByLabelText(/qué quieres hacer|Sigue preguntando/i), text);
  await fireEvent.press(screen.getByRole('button', { name: t.send }));
}

beforeEach(() => {
  mockPush.mockReset();
  mockBack.mockReset();
  mockLocation = {
    availability: 'available',
    coords: null,
    locate: jest.fn(async () => HERE),
  };
});
afterEach(() => jest.restoreAllMocks());

const contrato = resolve(process.env.VAIVEN_OPENAPI ?? '../vaiven-backend/api/openapi.yaml');
(existsSync(contrato) ? it : it.skip)('la respuesta simulada cumple el contrato', () => {
  const v = lib.validarRespuesta(
    lib.cargarContrato(contrato),
    'POST',
    '/api/v1/ai/assistant/messages',
    200,
    reply(),
  );
  expect(v.error).toBeUndefined();
  expect(v.errores).toEqual([]);
});

describe('AssistantScreen (spec 021-T032)', () => {
  it('pregunta con la ubicación aproximada y muestra resumen, quién lo tiene, pasos y cuidados', async () => {
    const api = installFakeApi({ [POST]: () => ok(reply()) });
    await renderWithClient(<AssistantScreen />);
    expect(screen.getByText(t.privacy)).toBeTruthy();
    await ask('  Quiero pintar mi cuarto  ');
    expect(await screen.findByText('Para pintar necesitas una escalera y una lona.')).toBeTruthy();
    expect(api.calls[0]?.body).toEqual({ message: 'Quiero pintar mi cuarto', location: HERE });
    expect(screen.getByText('Escalera de tijera')).toBeTruthy();
    expect(screen.getByText(/Beto/)).toBeTruthy();
    expect(screen.getByText('Lona protectora')).toBeTruthy();
    expect(screen.getByText(t.optional)).toBeTruthy();
    expect(screen.getByText('Aplica la primera mano.')).toBeTruthy();
    expect(screen.getByText('• No te pares en el último peldaño.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /Conseguir Escalera de tijera/ }));
    expect(mockPush).toHaveBeenCalledWith(routes.item(ITEM));
  });

  it('sin permiso de ubicación no la pide ni la envía', async () => {
    mockLocation = { availability: 'unknown', coords: null, locate: jest.fn() };
    const api = installFakeApi({ [POST]: () => ok(reply()) });
    await renderWithClient(<AssistantScreen />);
    await ask('Pintar mi cuarto');
    await waitFor(() => expect(api.calls).toHaveLength(1));
    expect(api.calls[0]?.body).toEqual({ message: 'Pintar mi cuarto' });
    expect(mockLocation.locate).not.toHaveBeenCalled();
  });

  it('la segunda pregunta continúa la conversación y «Nueva conversación» la borra', async () => {
    const api = installFakeApi({
      [POST]: () => ok(reply()),
      [`DELETE /ai/assistant/conversations/${CONVERSATION}`]: () => ({ status: 204 }),
    });
    await renderWithClient(<AssistantScreen />);
    await ask('Pintar mi cuarto');
    await screen.findByText(t.followUpLabel);
    await ask('¿Y si es de noche?');
    await waitFor(() => expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(2));
    expect(api.calls[1]?.body).toMatchObject({ conversationId: CONVERSATION });
    await fireEvent.press(screen.getByRole('button', { name: t.newConversation }));
    await waitFor(() => expect(api.calls.some((c) => c.method === 'DELETE')).toBe(true));
    expect(screen.queryByText(t.youAsked)).toBeNull();
    expect(screen.getByText(t.intro)).toBeTruthy();
  });

  it('un rechazo de moderación se muestra en el campo y conserva lo escrito', async () => {
    installFakeApi({
      [POST]: () =>
        failure(400, 'validation_failed', [
          { field: 'message', issue: 'Contiene contenido no permitido: armas.' },
        ]),
    });
    await renderWithClient(<AssistantScreen />);
    await ask('algo prohibido');
    expect(await screen.findByText('Contiene contenido no permitido: armas.')).toBeTruthy();
    expect(screen.getByText(es.errors.moderationRejected)).toBeTruthy();
    expect(screen.getByLabelText(t.messageLabel).props.value).toBe('algo prohibido');
  });

  it('un mensaje de menos de 2 caracteres no sale a la red', async () => {
    const api = installFakeApi({});
    await renderWithClient(<AssistantScreen />);
    await ask(' a ');
    expect(await screen.findByText(t.tooShort)).toBeTruthy();
    expect(api.calls).toHaveLength(0);
  });

  it('una conversación caducada (404) lo explica y la siguiente pregunta abre una nueva', async () => {
    let calls = 0;
    const api = installFakeApi({
      [POST]: () => {
        calls += 1;
        return calls === 2 ? failure(404, 'not_found') : ok(reply());
      },
    });
    await renderWithClient(<AssistantScreen />);
    await ask('Pintar mi cuarto');
    await screen.findByText(t.followUpLabel);
    await ask('Otra cosa');
    expect(await screen.findByText(t.expired)).toBeTruthy();
    await ask('Otra cosa');
    await waitFor(() => expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(3));
    expect(api.calls[2]?.body).not.toHaveProperty('conversationId');
  });

  it('«Volver» regresa a la pantalla anterior', async () => {
    installFakeApi({});
    await renderWithClient(<AssistantScreen />);
    await fireEvent.press(screen.getByRole('button', { name: es.common.back }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});

describe('assistantFailure', () => {
  const e = (code: ConstructorParameters<typeof ApiError>[0], status: number | null) =>
    new ApiError(code, 'x', status, null);
  it.each([
    [e('rate_limited', 429), t.limit],
    [e('service_unavailable', 503), t.unavailable],
    [e('not_found', 404), t.expired],
    [e('network_error', null), es.errors.network_error],
    [e('step_up_required', 401), es.errors.step_up_required],
    [e('internal_error', 500), t.error],
    [new Error('x'), t.error],
  ])('%p → aviso', (error, notice) => {
    expect(assistantFailure(error)).toEqual({ field: null, notice });
  });

  it('un 400 sobre el mensaje va en el campo', () => {
    const error = new ApiError('validation_failed', 'x', 400, null, [
      { field: 'message', issue: 'debe tener al menos 2 caracteres' },
    ]);
    expect(assistantFailure(error)).toEqual({
      field: 'debe tener al menos 2 caracteres',
      notice: null,
    });
  });

  it('un 400 sin detalle del mensaje es un aviso general', () => {
    expect(assistantFailure(e('validation_failed', 400))).toEqual({
      field: null,
      notice: es.errors.validation_failed,
    });
  });
});

describe('AssistantEntry (acceso desde Inicio)', () => {
  it('con la IA apagada no se muestra', async () => {
    const api = installFakeApi({ 'GET /meta': () => ok({ features: { aiSuggestions: false } }) });
    await renderWithClient(<AssistantEntry />);
    await waitFor(() => expect(api.calls.some((c) => c.path === '/meta')).toBe(true));
    expect(screen.queryByText(t.entryTitle)).toBeNull();
  });

  it('con la IA activa se muestra y abre el asistente', async () => {
    installFakeApi({ 'GET /meta': () => ok({ features: { aiSuggestions: true } }) });
    await renderWithClient(<AssistantEntry />);
    await fireEvent.press(await screen.findByRole('button', { name: t.entryTitle }));
    expect(mockPush).toHaveBeenCalledWith(routes.assistant);
  });
});
