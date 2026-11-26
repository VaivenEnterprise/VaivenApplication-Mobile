/// <reference types="node" />
import { render } from '@testing-library/react-native';
import { renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import path from 'node:path';
import { Pressable, StyleSheet, Text, type ViewProps } from 'react-native';
import { REFRESH_TOKEN_KEY } from '@/features/auth/session';
import { es } from '@/i18n/es-MX';
import { resetAuthInterceptor } from '@/lib/api/authInterceptor';
import { fakeTokens, fakeUser, installFakeApi, installMemorySecureStore, ok } from '@/test/fakeApi';
import { fakeBooking } from '@/test/fakeBookings';
import { CONVERSATION_ID, fakeConversation, fakeMessage } from '@/test/fakeChat';
import { fakeCategories, fakeItem } from '@/test/fakeItems';

// Spec 016 · T007 (RF-06, CA-06, Art. VII.3): accesibilidad automatizada de las pantallas clave.
// Todo control (botón, enlace, pestaña, interruptor, casilla) debe tener nombre accesible, y su
// área táctil declarada debe ser de al menos 44 pt. Los controles sin tamaño explícito (se ajustan
// a su contenido, p. ej. un enlace de texto) no se miden aquí: se revisan en Expo Go.

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
  configResult: { ok: true, config: { apiBaseUrl: 'http://api.test', appEnv: 'development' } },
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ granted: false, canAskAgain: true }),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3, Low: 2 },
}));

jest.setTimeout(120_000);

const APP_DIR = path.resolve(__dirname, '..', 'app');
const MIN_TOUCH = 44;
const ROLES = ['button', 'link', 'tab', 'switch', 'checkbox'] as const;
const ITEM = fakeItem({ id: 'item-1', owner: { ...fakeItem().owner, id: 'otra-persona' } });

type Host = { props: ViewProps & Record<string, unknown> };

/** Nombre accesible: etiqueta explícita o texto visible (sin contar los glifos de los íconos). */
export function accessibleName(el: Host): string {
  const label = (el.props.accessibilityLabel ?? el.props['aria-label']) as string | undefined;
  if (typeof label === 'string' && label.trim() !== '') return label.trim();
  const texts = within(el as never).queryAllByText(/[^-\s]/);
  return texts.length > 0 ? 'texto' : '';
}

/** Menor lado táctil declarado (alto/ancho + hitSlop); `null` si el control se ajusta a su contenido. */
export function declaredTouchSize(el: Host): { width: number | null; height: number | null } {
  const flat = StyleSheet.flatten(el.props.style as never) as Record<string, unknown> | undefined;
  const num = (v: unknown) => (typeof v === 'number' ? v : null);
  const slop = el.props.hitSlop;
  const slopV =
    typeof slop === 'number'
      ? slop * 2
      : ((slop as { top?: number; bottom?: number } | undefined)?.top ?? 0) +
        ((slop as { bottom?: number } | undefined)?.bottom ?? 0);
  const slopH =
    typeof slop === 'number'
      ? slop * 2
      : ((slop as { left?: number; right?: number } | undefined)?.left ?? 0) +
        ((slop as { right?: number } | undefined)?.right ?? 0);
  const h = num(flat?.minHeight) ?? num(flat?.height);
  const w = num(flat?.minWidth) ?? num(flat?.width);
  return { height: h === null ? null : h + slopV, width: w === null ? null : w + slopH };
}

export function auditControls(): { sinNombre: string[]; chicos: string[]; total: number } {
  const sinNombre: string[] = [];
  const chicos: string[] = [];
  let total = 0;
  for (const role of ROLES) {
    for (const el of screen.queryAllByRole(role) as unknown as Host[]) {
      total += 1;
      const name = accessibleName(el);
      if (name === '') sinNombre.push(`${role} sin nombre`);
      const { width, height } = declaredTouchSize(el);
      if ((height !== null && height < MIN_TOUCH) || (width !== null && width < MIN_TOUCH)) {
        chicos.push(`${role} «${name}» ${width ?? '?'}×${height ?? '?'}`);
      }
    }
  }
  return { sinNombre, chicos, total };
}

const messages = [fakeMessage('0001', { body: 'Hola' })];
const handlers = () => ({
  'POST /auth/refresh': () => ok({ tokens: fakeTokens(2) }),
  'GET /me': () => ok(fakeUser),
  'GET /categories': () => ok(fakeCategories),
  'GET /items': () => ok({ items: [ITEM], nextCursor: null }),
  [`GET /items/${ITEM.id}`]: () => ok(ITEM),
  [`GET /items/${ITEM.id}/quote`]: () => ({
    status: 404,
    body: { error: { code: 'not_found', message: 'x', requestId: 'r', details: [] } },
  }),
  'GET /me/bookings': () => ok({ items: [fakeBooking()], nextCursor: null }),
  'GET /conversations': () => ok({ items: [fakeConversation()], nextCursor: null }),
  'GET /conversations/unread-count': () => ok({ count: 0 }),
  [`GET /conversations/${CONVERSATION_ID}/messages`]: () =>
    ok({ items: messages, nextCursor: null }),
  [`POST /conversations/${CONVERSATION_ID}/read`]: () => ({ status: 204 }),
  'GET /me/notifications/unread-count': () => ok({ count: 0 }),
});

beforeEach(() => resetAuthInterceptor());
afterEach(() => jest.restoreAllMocks());

const SCREENS: { name: string; url: string; signedIn: boolean; ready: () => unknown }[] = [
  {
    name: 'Inicio de sesión',
    url: '/login',
    signedIn: false,
    ready: () => screen.getByLabelText(es.auth.login.email),
  },
  {
    name: 'Explorar',
    url: '/explorar',
    signedIn: true,
    ready: () => screen.getByText(ITEM.title),
  },
  {
    name: 'Detalle del objeto',
    url: `/objeto/${ITEM.id}`,
    signedIn: true,
    ready: () => screen.getByLabelText(es.bookings.request.button),
  },
  {
    name: 'Solicitud',
    url: `/solicitar/${ITEM.id}`,
    signedIn: true,
    ready: () => screen.getByLabelText(es.bookings.request.tomorrow),
  },
  {
    name: 'Chat',
    url: `/chat/${CONVERSATION_ID}`,
    signedIn: true,
    ready: () => screen.getByText('Hola'),
  },
  {
    name: 'Perfil',
    url: '/perfil',
    signedIn: true,
    ready: () => screen.getByText(es.profile.signOut),
  },
];

describe('accesibilidad de las pantallas clave (T007, CA-06)', () => {
  it.each(SCREENS)('$name: todo control tiene nombre y área táctil ≥ 44 pt', async (s) => {
    installMemorySecureStore(s.signedIn ? { [REFRESH_TOKEN_KEY]: 'refresh-1' } : {});
    installFakeApi(handlers());
    await renderRouter(APP_DIR, { initialUrl: s.url });
    await waitFor(() => expect(s.ready()).toBeTruthy(), { timeout: 30_000 });
    const result = auditControls();
    expect(result.total).toBeGreaterThan(0);
    expect(result.sinNombre).toEqual([]);
    expect(result.chicos).toEqual([]);
  });
});

describe('el detector de accesibilidad funciona (casos negativos)', () => {
  it('declaredTouchSize suma hitSlop y respeta minHeight', () => {
    expect(declaredTouchSize({ props: { style: { height: 30 }, hitSlop: 8 } })).toEqual({
      height: 46,
      width: null,
    });
    expect(declaredTouchSize({ props: { style: [{ minHeight: 44 }, { minWidth: 20 }] } })).toEqual({
      height: 44,
      width: 20,
    });
    expect(declaredTouchSize({ props: { style: { paddingTop: 4 } } })).toEqual({
      height: null,
      width: null,
    });
  });

  it('auditControls marca un botón sin nombre y de 20 pt, y acepta uno con nombre de 44 pt', async () => {
    await render(
      <>
        <Pressable accessibilityRole="button" style={{ height: 20, width: 20 }} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Guardar"
          style={{ minHeight: 44 }}
        >
          <Text>Guardar</Text>
        </Pressable>
      </>,
    );
    const result = auditControls();
    expect(result.total).toBe(2);
    expect(result.sinNombre).toEqual(['button sin nombre']);
    expect(result.chicos).toHaveLength(1);
  });
});
