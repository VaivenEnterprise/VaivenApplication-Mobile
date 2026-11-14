// Tareas que deben terminar ANTES de cerrar la sesión local, mientras el token de acceso aún sirve
// (p. ej. quitar el token de push del servidor, spec 011 CA-06). Otras features las registran; la
// sesión las ejecuta sin conocerlas (Art. VI.2: auth no importa de ellas).

type BeforeSignOut = () => Promise<void>;

/** Tiempo máximo que se espera a estas tareas: cerrar sesión no debe quedar colgado (RF-07 de 003). */
export const BEFORE_SIGN_OUT_TIMEOUT_MS = 3_000;

const hooks = new Set<BeforeSignOut>();

/** Registra una tarea previa al cierre de sesión. Devuelve la función que la quita. */
export function registerBeforeSignOut(hook: BeforeSignOut): () => void {
  hooks.add(hook);
  return () => {
    hooks.delete(hook);
  };
}

/** Ejecuta las tareas registradas en paralelo, ignorando sus fallos y con tiempo máximo. */
export async function runBeforeSignOut(
  timeoutMs: number = BEFORE_SIGN_OUT_TIMEOUT_MS,
): Promise<void> {
  if (hooks.size === 0) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeoutMs);
  });
  const all = Promise.allSettled([...hooks].map((hook) => hook())).then(() => undefined);
  try {
    await Promise.race([all, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
