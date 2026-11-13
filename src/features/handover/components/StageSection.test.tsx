import { fireEvent, render, screen } from '@testing-library/react-native';
import { slots } from '@/features/bookings';
import '@/features/handover';
import { StageSection } from '@/features/handover/components/StageSection';
import { es } from '@/i18n/es-MX';
import { BOOKING_ID, fakeBooking } from '@/test/fakeBookings';
import { fakeRecordedStage, fakeStage } from '@/test/fakeHandover';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
}));

const t = es.handover;
const CONFIRMED_AT = '2026-11-12T18:00:00Z';

const recorded = (over = {}) => fakeRecordedStage(over);
const confirmed = () => recorded({ confirmedAt: CONFIRMED_AT });

const show = (over = {}) => render(<StageSection booking={fakeBooking(over)} />);

beforeEach(() => mockPush.mockReset());

describe('StageSection', () => {
  it('no aparece antes de aceptar ni con la reserva cancelada', async () => {
    for (const status of ['pending', 'rejected', 'expired', 'cancelled'] as const) {
      const view = await show({ status });
      expect(screen.queryByText(t.section.title)).toBeNull();
      await view.unmount();
    }
  });

  it('propietario en la entrega sin evidencia: «Registrar estado» lleva a la evidencia (CA-01)', async () => {
    await show({ status: 'accepted', viewerRole: 'owner' });
    expect(screen.getByText(t.chip.needsEvidence)).toBeTruthy();
    await fireEvent.press(screen.getByText(t.action.record));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining(`/entrega/${BOOKING_ID}/evidencia?stage=delivery`),
    );
    expect(screen.queryByText(t.action.showQr)).toBeNull();
    expect(screen.queryByText(t.action.scan)).toBeNull();
  });

  it('propietario con evidencia: «Mostrar QR» y «Editar estado»', async () => {
    await show({ status: 'accepted', viewerRole: 'owner', delivery: recorded() });
    expect(screen.getByText(t.chip.readyToShow)).toBeTruthy();
    await fireEvent.press(screen.getByText(t.action.showQr));
    expect(mockPush).toHaveBeenLastCalledWith(
      expect.stringContaining(`/entrega/${BOOKING_ID}/qr?stage=delivery`),
    );
    await fireEvent.press(screen.getByText(t.action.edit));
    expect(mockPush).toHaveBeenLastCalledWith(expect.stringContaining('/evidencia?stage=delivery'));
  });

  it('solicitante en la entrega no ve «Registrar» ni «Mostrar QR» (CA-05)', async () => {
    await show({ status: 'accepted', viewerRole: 'requester' });
    expect(screen.queryByText(t.action.record)).toBeNull();
    expect(screen.queryByText(t.action.showQr)).toBeNull();
    expect(screen.queryByText(t.action.scan)).toBeNull();
    expect(screen.getByText(`${t.section.waitingFor} Ana López`)).toBeTruthy();
  });

  it('solicitante con evidencia registrada puede escanear', async () => {
    await show({ status: 'accepted', viewerRole: 'requester', delivery: recorded() });
    expect(screen.getByText(t.chip.readyToScan)).toBeTruthy();
    await fireEvent.press(screen.getByText(t.action.scan));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/escanear?stage=delivery'));
  });

  it('en curso la devolución es al revés: el solicitante registra y el propietario escanea (CA-04)', async () => {
    const base = { status: 'in_progress' as const, delivery: confirmed() };
    const view = await show({ ...base, viewerRole: 'requester' });
    expect(screen.getByText(t.action.record)).toBeTruthy();
    await view.unmount();

    await show({ ...base, viewerRole: 'owner', return: recorded() });
    expect(screen.getByText(t.action.scan)).toBeTruthy();
    expect(screen.queryByText(t.action.record)).toBeNull();
  });

  it('en curso, sin datos de la entrega, la da por confirmada por el estado', async () => {
    await show({ status: 'in_progress', viewerRole: 'requester' });
    expect(
      screen.getByLabelText(new RegExp(`^${t.section.delivery}, ${t.section.stepDone}`)),
    ).toBeTruthy();
    expect(screen.getByLabelText(`${t.section.return}, ${t.section.stepNow}`)).toBeTruthy();
  });

  it('la etapa confirmada muestra la fecha en texto', async () => {
    await show({ status: 'in_progress', viewerRole: 'owner', delivery: confirmed() });
    expect(screen.getByLabelText(new RegExp(`${t.section.confirmedOn} .*2026`))).toBeTruthy();
  });

  it('concluida: ambas etapas confirmadas y ninguna acción', async () => {
    await show({
      status: 'completed',
      viewerRole: 'owner',
      delivery: confirmed(),
      return: confirmed(),
    });
    expect(screen.getByText(t.chip.confirmed)).toBeTruthy();
    expect(screen.queryByText(t.action.record)).toBeNull();
    expect(screen.queryByText(t.action.scan)).toBeNull();
  });

  it('el administrador no tiene acciones', async () => {
    await show({ status: 'accepted', viewerRole: 'admin', delivery: fakeStage() });
    expect(screen.queryByText(t.action.record)).toBeNull();
    expect(screen.queryByText(t.action.scan)).toBeNull();
  });

  it('se registra en el slot deliveryAndPayments al importar la feature', () => {
    expect(slots.registered().map((entry) => entry.name)).toContain('deliveryAndPayments');
  });
});
