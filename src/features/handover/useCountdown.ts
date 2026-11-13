import { useEffect, useState } from 'react';

const TICK_MS = 1000;
const SECONDS_PER_MINUTE = 60;
const WARNING_SECONDS = 120;

export type Countdown = {
  secondsLeft: number;
  expired: boolean;
  /** Quedan menos de 2 minutos: el temporizador pasa a aviso. */
  urgent: boolean;
  /** «14:32» */
  clock: string;
};

/** Segundos que faltan para `expiresAt`, medidos contra el reloj del dispositivo (RF-04). */
function secondsUntil(expiresAt: string, now: number): number {
  const target = Date.parse(expiresAt);
  if (Number.isNaN(target)) return 0;
  return Math.max(0, Math.ceil((target - now) / TICK_MS));
}

export function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const rest = seconds % SECONDS_PER_MINUTE;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

/**
 * Cuenta regresiva de un QR. Se recalcula cada segundo a partir de la hora de vencimiento que
 * dio el servidor, así que no se desfasa si la app pasa a segundo plano. Sin `expiresAt` queda
 * en cero y marca vencido.
 */
export function useCountdown(expiresAt: string | null): Countdown {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (expiresAt === null) return undefined;
    // Al cambiar el vencimiento (un código nuevo) se refresca el reloj de inmediato, sin esperar un segundo.
    const refresh = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => {
      clearTimeout(refresh);
      clearInterval(timer);
    };
  }, [expiresAt]);
  const secondsLeft = expiresAt === null ? 0 : secondsUntil(expiresAt, now);
  return {
    secondsLeft,
    expired: secondsLeft <= 0,
    urgent: secondsLeft > 0 && secondsLeft < WARNING_SECONDS,
    clock: formatClock(secondsLeft),
  };
}
