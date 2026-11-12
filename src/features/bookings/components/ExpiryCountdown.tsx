import { useEffect, useState } from 'react';
import { AppText } from '@/components/ui/AppText';
import { es } from '@/i18n/es-MX';

const TICK_MS = 30_000;
const MINUTE_MS = 60_000;

/** «5 h 12 min», «12 min» o `null` si ya venció. Se calcula siempre a partir del `expiresAt` del servidor (P-07). */
export function remainingText(expiresAt: string, now: number): string | null {
  const left = Date.parse(expiresAt) - now;
  if (Number.isNaN(left) || left <= 0) return null;
  const total = Math.ceil(left / MINUTE_MS);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const t = es.bookings.detail;
  if (hours === 0) return `${minutes} ${t.minutes}`;
  return minutes === 0 ? `${hours} ${t.hours}` : `${hours} ${t.hours} ${minutes} ${t.minutes}`;
}

type ExpiryCountdownProps = {
  expiresAt: string;
  /** Texto anterior al tiempo restante; por defecto «Vence en». */
  prefix?: string;
};

/** Cuenta regresiva hasta el vencimiento de una solicitud pendiente; se actualiza cada 30 s. */
export function ExpiryCountdown({
  expiresAt,
  prefix = es.bookings.detail.expiresIn,
}: ExpiryCountdownProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);
  const remaining = remainingText(expiresAt, now);
  const text = remaining === null ? es.bookings.detail.expired : `${prefix} ${remaining}`;
  return (
    <AppText variant="caption" color={remaining === null ? 'danger' : 'warning'}>
      {text}
    </AppText>
  );
}
