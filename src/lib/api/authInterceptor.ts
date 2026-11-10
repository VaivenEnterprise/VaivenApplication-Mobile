// Estado de autenticación del cliente de API (spec 003 RF-03, P-02, P-03).
//
// El token de acceso vive solo en memoria de este módulo (nunca en disco). La
// renovación es *single-flight*: aunque varias peticiones reciban 401 a la vez,
// solo se pide un par de tokens nuevo y todas esperan esa misma promesa.

export type SessionHandlers = {
  /** Pide tokens nuevos con el `refreshToken` guardado. Devuelve `false` si no se pudo. */
  refresh: () => Promise<boolean>;
  /** Se llama una vez cuando la renovación falla: la sesión terminó. */
  onSessionExpired: () => void;
};

let accessToken: string | null = null;
let handlers: SessionHandlers | null = null;
let inflight: Promise<boolean> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setSessionHandlers(next: SessionHandlers | null): void {
  handlers = next;
}

/** Las rutas `/auth/*` no llevan token ni se reintentan (evita ciclos de renovación). */
export function isAuthPath(path: string): boolean {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized === '/auth' || normalized.startsWith('/auth/');
}

/** Renueva la sesión una sola vez aunque se llame varias veces a la vez. */
export function refreshOnce(): Promise<boolean> {
  if (inflight !== null) return inflight;
  const current = handlers;
  if (current === null) return Promise.resolve(false);
  inflight = current
    .refresh()
    .catch(() => false)
    .then((ok) => {
      if (!ok) current.onSessionExpired();
      return ok;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Solo para pruebas: deja el módulo como recién cargado. */
export function resetAuthInterceptor(): void {
  accessToken = null;
  handlers = null;
  inflight = null;
}
