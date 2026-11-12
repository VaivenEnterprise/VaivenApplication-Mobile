import {
  MAX_DAYS,
  allowedActions,
  cancelNeedsReason,
  maxEnd,
  rangeProblem,
  statusGroup,
  timelineStep,
  type BookingAction,
} from '@/features/bookings/rules';
import {
  BOOKING_STATUSES,
  VIEWER_ROLES,
  type BookingStatus,
  type ViewerRole,
} from '@/features/bookings/types';

// Matriz completa viewerRole × status (plan P-02, RNF-01).
const MATRIX: Record<ViewerRole, Partial<Record<BookingStatus, BookingAction[]>>> = {
  owner: {
    pending: ['accept', 'reject'],
    accepted: ['cancel', 'meetingPoint'],
    in_progress: ['meetingPoint'],
  },
  requester: { pending: ['cancel'], accepted: ['cancel'] },
  admin: {},
};

describe('allowedActions (matriz rol × estado)', () => {
  for (const role of VIEWER_ROLES) {
    for (const status of BOOKING_STATUSES) {
      const expected = MATRIX[role][status] ?? [];
      it(`${role} · ${status} → [${expected.join(', ')}]`, () => {
        expect(allowedActions(role, status)).toEqual(expected);
      });
    }
  }

  it('CA-05: solo el propietario ve Aceptar y Rechazar en una pendiente', () => {
    expect(allowedActions('owner', 'pending')).toEqual(
      expect.arrayContaining(['accept', 'reject']),
    );
    expect(allowedActions('requester', 'pending')).not.toContain('accept');
    expect(allowedActions('requester', 'pending')).not.toContain('reject');
  });

  it('nadie puede actuar sobre reservas terminadas', () => {
    for (const status of ['rejected', 'expired', 'cancelled', 'completed'] as const) {
      for (const role of VIEWER_ROLES) expect(allowedActions(role, status)).toEqual([]);
    }
  });
});

describe('cancelación y periodo', () => {
  it('el motivo es obligatorio solo al cancelar una aceptada', () => {
    expect(cancelNeedsReason('accepted')).toBe(true);
    expect(cancelNeedsReason('pending')).toBe(false);
  });

  it('el máximo son 7 días contando ambos extremos', () => {
    expect(MAX_DAYS).toBe(7);
    expect(maxEnd('2026-11-12')).toBe('2026-11-18');
  });

  it.each<[string, string, string, ReturnType<typeof rangeProblem>]>([
    ['2026-11-12', '2026-11-14', '2026-11-12', null],
    ['2026-11-12', '2026-11-18', '2026-11-12', null],
    ['2026-11-12', '2026-11-19', '2026-11-12', 'tooLong'],
    ['2026-11-12', '2026-11-11', '2026-11-12', 'inverted'],
    ['2026-11-11', '2026-11-12', '2026-11-12', 'past'],
    ['', '2026-11-12', '2026-11-12', 'invalid'],
    ['2026-02-30', '2026-03-01', '2026-01-01', 'invalid'],
  ])('CA-02: rangeProblem(%s, %s) con hoy %s → %s', (start, end, today, expected) => {
    expect(rangeProblem(start, end, today)).toBe(expected);
  });
});

describe('grupos de estado y línea de avance', () => {
  it('agrupa los siete estados', () => {
    expect(BOOKING_STATUSES.map(statusGroup)).toEqual([
      'pending',
      'inProgress',
      'done',
      'done',
      'done',
      'inProgress',
      'done',
    ]);
  });

  it('la línea de avance solo existe para estados que avanzan', () => {
    expect(BOOKING_STATUSES.map(timelineStep)).toEqual([0, 1, null, null, null, 2, 3]);
  });
});
