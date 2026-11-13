// API pública de la feature de entrega, devolución y pagos (spec 009).
import { slots } from '@/features/bookings';
import { HandoverSection } from '@/features/handover/components/HandoverSection';

// Sección «deliveryAndPayments» del detalle de la reserva (007, Art. XIII): una línea, sin tocar
// archivos de 007. Se importa una vez desde el layout raíz para registrarla al abrir la app.
slots.register('deliveryAndPayments', HandoverSection);

export { HandoverSection } from '@/features/handover/components/HandoverSection';
export { StageSection } from '@/features/handover/components/StageSection';
