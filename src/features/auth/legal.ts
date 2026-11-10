import { getConfig } from '@/lib/config';

export type LegalPage = 'terminos' | 'privacidad';

/**
 * URL pública de una página legal (`<EXPO_PUBLIC_LEGAL_URL>/terminos/` o `/privacidad/`).
 * Es `null` si el sitio no está configurado: entonces el texto se muestra sin enlace.
 */
export function legalUrl(page: LegalPage): string | null {
  const base = getConfig().legalBaseUrl;
  return base === undefined ? null : `${base}/${page}/`;
}
