import { hrefForData, hrefOrCenter } from '@/features/notifications/routing';
import { routes } from '@/lib/routes';

describe('hrefForData', () => {
  it.each([
    ['reserva (booking_accepted)', { bookingId: 'b1' }, routes.booking('b1')],
    [
      'reserva con objeto (booking_requested)',
      { bookingId: 'b1', itemId: 'i1' },
      routes.booking('b1'),
    ],
    ['chat (message_received)', { conversationId: 'c1', bookingId: 'b1' }, routes.chat('c1')],
    ['incidencia (incident_closed)', { incidentId: 'x1', bookingId: 'b1' }, routes.incident('x1')],
    ['objeto (content_removed)', { itemId: 'i1' }, routes.item('i1')],
    [
      'incidencia gana sobre el objeto (sanction_applied)',
      { incidentId: 'x1', itemId: 'i1' },
      routes.incident('x1'),
    ],
  ])('%s', (_name, data, expected) => {
    expect(hrefForData(data)).toBe(expected);
  });

  it.each([
    ['sin datos', {}],
    ['ids vacíos', { bookingId: '', itemId: '   ' }],
    ['ids que no son texto', { bookingId: 12, conversationId: null }],
    ['datos que no son un objeto', 'reserva/1'],
    ['nulo', null],
    ['indefinido', undefined],
  ])('devuelve null: %s', (_name, data) => {
    expect(hrefForData(data)).toBeNull();
  });

  it('codifica ids con caracteres especiales', () => {
    expect(hrefForData({ bookingId: 'a/b' })).toBe(routes.booking('a/b'));
  });
});

describe('hrefOrCenter', () => {
  it('usa el destino de data', () => {
    expect(hrefOrCenter({ bookingId: 'b1' })).toBe(routes.booking('b1'));
  });

  it('abre el centro de avisos si no hay destino', () => {
    expect(hrefOrCenter({})).toBe(routes.notifications);
    expect(hrefOrCenter(undefined)).toBe(routes.notifications);
  });
});
