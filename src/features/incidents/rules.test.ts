import {
  REPORT_WINDOW_HOURS,
  canReport,
  counterpartName,
  stepStates,
} from '@/features/incidents/rules';
import type { BookingStatus, ViewerRole } from '@/features/bookings';
import { fakeRequester } from '@/test/fakeBookings';
import { fakeIncident } from '@/test/fakeTrust';

const NOW = new Date('2026-11-15T12:00:00Z');
const base = (
  status: BookingStatus,
  over: { viewerRole?: ViewerRole; updatedAt?: string; confirmedAt?: string | null } = {},
) => ({
  status,
  viewerRole: over.viewerRole ?? 'requester',
  updatedAt: over.updatedAt ?? '2026-11-14T12:00:00Z',
  return: over.confirmedAt === undefined ? null : { confirmedAt: over.confirmedAt },
});

describe('canReport (RF-05, CA-06)', () => {
  it.each([
    ['pending', false],
    ['accepted', true],
    ['in_progress', true],
    ['rejected', false],
    ['expired', false],
    ['cancelled', false],
  ] as const)('reserva %s → %s', (status, expected) => {
    expect(canReport(base(status), NOW)).toBe(expected);
  });

  it('una reserva rechazada no ofrece «Reportar incidencia» (CA-06)', () => {
    expect(canReport(base('rejected'), NOW)).toBe(false);
  });

  it('el administrador nunca reporta', () => {
    expect(canReport(base('accepted', { viewerRole: 'admin' }), NOW)).toBe(false);
  });

  it('una concluida se reporta dentro de las 72 h', () => {
    const closed = new Date(NOW.getTime() - (REPORT_WINDOW_HOURS - 1) * 3_600_000).toISOString();
    expect(canReport(base('completed', { confirmedAt: closed }), NOW)).toBe(true);
  });

  it('justo a las 72 h aún se ofrece y un minuto después ya no', () => {
    const edge = new Date(NOW.getTime() - REPORT_WINDOW_HOURS * 3_600_000);
    expect(canReport(base('completed', { confirmedAt: edge.toISOString() }), NOW)).toBe(true);
    const late = new Date(edge.getTime() - 60_000).toISOString();
    expect(canReport(base('completed', { confirmedAt: late }), NOW)).toBe(false);
  });

  it('sin confirmación de la devolución usa la última actualización', () => {
    expect(canReport(base('completed', { updatedAt: '2026-11-14T12:00:00Z' }), NOW)).toBe(true);
    expect(canReport(base('completed', { updatedAt: '2026-11-01T12:00:00Z' }), NOW)).toBe(false);
  });

  it('con una fecha ilegible se ofrece: decide el servidor', () => {
    expect(canReport(base('completed', { updatedAt: 'no-es-fecha' }), NOW)).toBe(true);
  });

  it('usa la hora actual cuando no se le pasa una', () => {
    expect(canReport(base('accepted'))).toBe(true);
  });
});

describe('counterpartName', () => {
  it('quien reportó ve el nombre de la persona reportada y viceversa', () => {
    const incident = fakeIncident();
    expect(counterpartName(incident, fakeRequester.id)).toBe(incident.reported.displayName);
    expect(counterpartName(incident, incident.reported.id)).toBe(incident.reporter.displayName);
    expect(counterpartName(incident, null)).toBe(incident.reporter.displayName);
  });
});

describe('stepStates', () => {
  it('abierta: enviada lista, en revisión en curso y cierre pendiente', () => {
    expect(stepStates('open')).toEqual({ sent: 'done', review: 'now', closed: 'next' });
  });

  it('cerrada: todo completado', () => {
    expect(stepStates('closed')).toEqual({ sent: 'done', review: 'done', closed: 'done' });
  });
});
